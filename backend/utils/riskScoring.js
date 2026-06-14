const pool = require("../config/db");

/**
 * Computes risk score and risk level for a single employee data row.
 * @param {object} row - Database row containing PME, Ref, CBT, Practical, and Counselling metrics.
 * @returns {object} Calculated riskScore, riskLevel, and metrics breakdown.
 */
function computeRiskScore(row) {
  const currentDate = new Date();

  // 1. PME component (25% weight): 100 if valid, 0 if expired/missing
  const hasValidPme = row.pme_next_due_date && new Date(row.pme_next_due_date) >= currentDate;
  const pmeScore = hasValidPme ? 100 : 0;

  // 2. Refresher component (25% weight): 100 if valid, 0 if expired/missing
  const hasValidRef = row.ref_next_due_date && new Date(row.ref_next_due_date) >= currentDate;
  const refScore = hasValidRef ? 100 : 0;

  // 3. CBT component (25% weight): latest score percentage or 0 if none
  const cbtScore = row.cbt_score ? parseFloat(row.cbt_score) : 0;

  // 4. Practical Assessment component (25% weight): latest approved score or 0 if none
  const practicalScore = row.practical_score ? parseFloat(row.practical_score) : 0;

  // Base Compliance Score (0 to 100)
  const baseCompliance = (pmeScore * 0.25) + (refScore * 0.25) + (cbtScore * 0.25) + (practicalScore * 0.25);

  // 5. Counselling Penalty: +15 for each Open, +5 for each Closed within last 180 days. Max penalty = 40.
  const openPenalty = parseInt(row.open_counselling_count || 0, 10) * 15;
  const closedPenalty = parseInt(row.recent_closed_counselling_count || 0, 10) * 5;
  const counsellingPenalty = Math.min(40, openPenalty + closedPenalty);

  // Risk Score = 100 - Base Compliance + Counselling Penalty
  let riskScore = 100 - baseCompliance + counsellingPenalty;
  riskScore = Math.max(0, Math.min(100, riskScore)); // Cap between 0 and 100
  riskScore = parseFloat(riskScore.toFixed(2));

  // Risk classification levels
  let riskLevel = "Low";
  if (riskScore >= 65) {
    riskLevel = "High";
  } else if (riskScore >= 30) {
    riskLevel = "Medium";
  }

  return {
    riskScore,
    riskLevel,
    metrics: {
      pmeScore,
      refScore,
      cbtScore,
      practicalScore,
      baseCompliance,
      counsellingPenalty
    }
  };
}

/**
 * Fetches compliance and assessment data for employees from the database and computes their risk scores.
 * @param {object} filters - Filtering criteria (station_id, risk_level).
 * @param {object} client - Optional DB client for transaction safety.
 */
async function getActivePointsmenRisk(filters = {}, client = pool) {
  const query = `
    WITH latest_pme AS (
      SELECT DISTINCT ON (employee_id) employee_id, next_due_date, pme_date, medical_status
      FROM pme_records
      ORDER BY employee_id, pme_date DESC, id DESC
    ),
    latest_ref AS (
      SELECT DISTINCT ON (employee_id) employee_id, next_due_date, ref_date, status
      FROM ref_records
      ORDER BY employee_id, ref_date DESC, id DESC
    ),
    latest_cbt AS (
      SELECT DISTINCT ON (employee_id) employee_id, score_percentage, result, status
      FROM exam_attempts
      WHERE status = 'Completed'
      ORDER BY employee_id, created_at DESC
    ),
    latest_asmt AS (
      SELECT DISTINCT ON (employee_id) employee_id, total_marks, status, assessment_date
      FROM assessments
      WHERE status = 'Approved'
      ORDER BY employee_id, created_at DESC, id DESC
    ),
    counselling_stats AS (
      SELECT 
        employee_id,
        COUNT(CASE WHEN status = 'Open' THEN 1 END) AS open_count,
        COUNT(CASE WHEN status = 'Closed' AND counselling_date >= CURRENT_DATE - INTERVAL '180 days' THEN 1 END) AS recent_closed_count
      FROM counselling_records
      GROUP BY employee_id
    )
    SELECT 
      e.id AS employee_id,
      e.hrms_id,
      e.full_name,
      e.designation,
      e.status,
      e.station_id,
      e.role_id,
      e.mobile,
      e.email,
      e.category_grade,
      s.station_name,
      s.station_code,
      lp.next_due_date AS pme_next_due_date,
      lp.pme_date AS pme_date,
      lp.medical_status AS pme_medical_status,
      lr.next_due_date AS ref_next_due_date,
      lr.ref_date AS ref_date,
      lr.status AS ref_status,
      lc.score_percentage AS cbt_score,
      lc.result AS cbt_result,
      la.total_marks AS practical_score,
      la.assessment_date AS practical_date,
      COALESCE(cs.open_count, 0) AS open_counselling_count,
      COALESCE(cs.recent_closed_count, 0) AS recent_closed_counselling_count
    FROM employees e
    LEFT JOIN stations s ON e.station_id = s.id
    LEFT JOIN latest_pme lp ON e.id = lp.employee_id
    LEFT JOIN latest_ref lr ON e.id = lr.employee_id
    LEFT JOIN latest_cbt lc ON e.id = lc.employee_id
    LEFT JOIN latest_asmt la ON e.id = la.employee_id
    LEFT JOIN counselling_stats cs ON e.id = cs.employee_id
    WHERE e.status = 'Active' AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
  `;

  const res = await client.query(query);
  
  let list = res.rows.map(row => {
    const risk = computeRiskScore(row);
    return {
      ...row,
      risk_score: risk.riskScore,
      calculated_risk_level: risk.riskLevel,
      risk_metrics: risk.metrics
    };
  });

  // Apply filters in code to ensure dynamic correctness
  if (filters.station_ids && Array.isArray(filters.station_ids)) {
    const sIds = filters.station_ids.map(id => parseInt(id, 10));
    list = list.filter(item => item.station_id && sIds.includes(parseInt(item.station_id, 10)));
  } else if (filters.station_id && filters.station_id !== "All") {
    const sId = parseInt(filters.station_id, 10);
    list = list.filter(item => item.station_id && parseInt(item.station_id, 10) === sId);
  }

  if (filters.employee_ids && Array.isArray(filters.employee_ids)) {
    const eIds = filters.employee_ids.map(id => String(id).toLowerCase());
    list = list.filter(item => item.employee_id && eIds.includes(String(item.employee_id).toLowerCase()));
  }

  if (filters.risk_level && filters.risk_level !== "All") {
    list = list.filter(item => item.calculated_risk_level.toLowerCase() === filters.risk_level.toLowerCase());
  }

  return list;
}

/**
 * Recalculates risk score, risk level, and category grade for a single employee
 * and updates their row in the employees table instantly.
 */
async function recalculateAndSaveEmployeeRisk(employeeId, client = pool) {
  try {
    const query = `
      WITH latest_pme AS (
        SELECT next_due_date, pme_date, medical_status
        FROM pme_records
        WHERE employee_id = $1
        ORDER BY pme_date DESC, id DESC
        LIMIT 1
      ),
      latest_ref AS (
        SELECT next_due_date, ref_date, status
        FROM ref_records
        WHERE employee_id = $1
        ORDER BY ref_date DESC, id DESC
        LIMIT 1
      ),
      latest_cbt AS (
        SELECT score_percentage, result, status
        FROM exam_attempts
        WHERE employee_id = $1 AND status = 'Completed'
        ORDER BY created_at DESC
        LIMIT 1
      ),
      latest_asmt AS (
        SELECT total_marks, status, assessment_date
        FROM assessments
        WHERE employee_id = $1 AND status = 'Approved'
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      ),
      counselling_stats AS (
        SELECT 
          COUNT(CASE WHEN status = 'Open' THEN 1 END) AS open_count,
          COUNT(CASE WHEN status = 'Closed' AND counselling_date >= CURRENT_DATE - INTERVAL '180 days' THEN 1 END) AS recent_closed_count
        FROM counselling_records
        WHERE employee_id = $1
      )
      SELECT 
        e.id AS employee_id,
        e.hrms_id,
        e.full_name,
        e.designation,
        e.status,
        e.station_id,
        e.role_id,
        e.category_grade,
        lp.next_due_date AS pme_next_due_date,
        lr.next_due_date AS ref_next_due_date,
        lc.score_percentage AS cbt_score,
        la.total_marks AS practical_score,
        COALESCE(cs.open_count, 0) AS open_counselling_count,
        COALESCE(cs.recent_closed_count, 0) AS recent_closed_counselling_count
      FROM employees e
      LEFT JOIN latest_pme lp ON lp.employee_id = e.id
      LEFT JOIN latest_ref lr ON lr.employee_id = e.id
      LEFT JOIN latest_cbt lc ON lc.employee_id = e.id
      LEFT JOIN latest_asmt la ON la.employee_id = e.id
      LEFT JOIN counselling_stats cs ON cs.employee_id = e.id
      WHERE e.id = $1
    `;

    const res = await client.query(query, [employeeId]);
    if (res.rows.length === 0) {
      console.warn(`[RiskEngine] Employee with ID ${employeeId} not found.`);
      return null;
    }

    const row = res.rows[0];
    const risk = computeRiskScore(row);

    // Resolve Category Grade from latest assessment result
    const gradeRes = await client.query(
      `SELECT g.grade_name
       FROM assessment_results ar
       JOIN grades g ON ar.grade_id = g.id
       WHERE ar.employee_id = $1
       ORDER BY ar.created_at DESC
       LIMIT 1`,
      [employeeId]
    );

    let categoryGrade = gradeRes.rows.length > 0 ? gradeRes.rows[0].grade_name : (row.category_grade || 'D');

    // Update employees table with computed Risk Level and Category Grade
    await client.query(
      `UPDATE employees 
       SET risk_level = $1, category_grade = $2, updated_at = NOW()
       WHERE id = $3`,
      [risk.riskLevel, categoryGrade, employeeId]
    );

    console.log(`[RiskEngine] Recalculated risk for ${row.full_name} (${row.hrms_id}): Level=${risk.riskLevel}, Grade=${categoryGrade}`);
    return {
      riskScore: risk.riskScore,
      riskLevel: risk.riskLevel,
      categoryGrade
    };
  } catch (err) {
    console.error(`[RiskEngine] Failed to recalculate employee risk for ${employeeId}:`, err.message);
    throw err;
  }
}

module.exports = {
  computeRiskScore,
  getActivePointsmenRisk,
  recalculateAndSaveEmployeeRisk
};
