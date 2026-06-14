'use strict';

const pool = require('../config/db');

// Helper query prefix containing the CTE for safety-evaluated operational staff (Roles 1, 2, 3, 4, 5)
const STAFF_CTE = `
  WITH latest_pme AS (
    SELECT DISTINCT ON (employee_id) employee_id, next_due_date, pme_date
    FROM pme_records
    ORDER BY employee_id, pme_date DESC, id DESC
  ),
  latest_ref AS (
    SELECT DISTINCT ON (employee_id) employee_id, next_due_date, ref_date
    FROM ref_records
    ORDER BY employee_id, ref_date DESC, id DESC
  ),
  latest_cbt AS (
    SELECT DISTINCT ON (employee_id) employee_id, score_percentage
    FROM exam_attempts
    WHERE status = 'Completed'
    ORDER BY employee_id, created_at DESC
  ),
  latest_asmt AS (
    SELECT DISTINCT ON (employee_id) employee_id, total_marks, assessment_date
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
  ),
  scored_staff AS (
    SELECT 
      e.id AS employee_id,
      e.hrms_id,
      e.full_name,
      e.designation,
      e.role_id,
      e.station_id,
      s.station_name,
      s.station_code,
      lp.next_due_date AS pme_next_due,
      lr.next_due_date AS ref_next_due,
      COALESCE(lc.score_percentage, 0.0) AS cbt_score,
      COALESCE(la.total_marks, 0.0) AS practical_score,
      COALESCE(cs.open_count, 0) AS open_counselling_count,
      COALESCE(cs.recent_closed_count, 0) AS recent_closed_counselling_count,
      
      -- Base components (100 if valid, 0 if not)
      CASE WHEN lp.next_due_date IS NOT NULL AND lp.next_due_date >= CURRENT_DATE THEN 100.0 ELSE 0.0 END AS pme_comp,
      CASE WHEN lr.next_due_date IS NOT NULL AND lr.next_due_date >= CURRENT_DATE THEN 100.0 ELSE 0.0 END AS ref_comp,
      
      -- Risk Score = 100 - Base Compliance + Counselling Penalty (max 40)
      GREATEST(0.0, LEAST(100.0, 
        100.0 - (
          (CASE WHEN lp.next_due_date IS NOT NULL AND lp.next_due_date >= CURRENT_DATE THEN 100.0 ELSE 0.0 END * 0.25) +
          (CASE WHEN lr.next_due_date IS NOT NULL AND lr.next_due_date >= CURRENT_DATE THEN 100.0 ELSE 0.0 END * 0.25) +
          (COALESCE(lc.score_percentage, 0.0) * 0.25) +
          (COALESCE(la.total_marks, 0.0) * 0.25)
        ) +
        LEAST(40.0, (COALESCE(cs.open_count, 0) * 15.0) + (COALESCE(cs.recent_closed_count, 0) * 5.0))
      )) AS risk_score
    FROM employees e
    LEFT JOIN stations s ON e.station_id = s.id
    LEFT JOIN latest_pme lp ON e.id = lp.employee_id
    LEFT JOIN latest_ref lr ON e.id = lr.employee_id
    LEFT JOIN latest_cbt lc ON e.id = lc.employee_id
    LEFT JOIN latest_asmt la ON e.id = la.employee_id
    LEFT JOIN counselling_stats cs ON e.id = cs.employee_id
    WHERE e.status = 'Active' AND e.role_id IN (1, 2, 3, 4, 5)
  )
`;

/**
 * Builds standard WHERE filtering clauses for Station, Role, and Risk Level
 */
function buildFilterClauses(query, paramsList) {
  const clauses = [];
  let p = paramsList.length + 1;

  if (query.station_id && query.station_id !== 'All') {
    clauses.push(`station_id = $${p++}`);
    paramsList.push(parseInt(query.station_id, 10));
  }

  if (query.role_id && query.role_id !== 'All') {
    clauses.push(`role_id = $${p++}`);
    paramsList.push(parseInt(query.role_id, 10));
  }

  if (query.risk_level && query.risk_level !== 'All') {
    const rLevel = query.risk_level.trim().toLowerCase();
    if (rLevel === 'high') {
      clauses.push(`risk_score >= 65.0`);
    } else if (rLevel === 'medium') {
      clauses.push(`risk_score >= 30.0 AND risk_score < 65.0`);
    } else if (rLevel === 'low') {
      clauses.push(`risk_score < 30.0`);
    }
  }

  return clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
}

/**
 * 1. GET /api/analytics/executive-summary
 * Aggregates safety index, risk categories, escalations, recommendations, and actions.
 */
exports.getExecutiveSummary = async (req, res) => {
  try {
    const params = [];
    const filterWhere = buildFilterClauses(req.query, params);

    // Dynamic aggregated summary of staff safety parameters
    const summaryQuery = `
      ${STAFF_CTE}
      SELECT
        COUNT(*)::int AS total_staff,
        COALESCE(AVG(risk_score), 0.0) AS average_risk_score,
        COALESCE(AVG((pme_comp + ref_comp + cbt_score + practical_score) / 4.0), 0.0) AS overall_safety_index,
        COUNT(CASE WHEN risk_score >= 65.0 THEN 1 END)::int AS high_risk_count,
        COUNT(CASE WHEN risk_score >= 30.0 AND risk_score < 65.0 THEN 1 END)::int AS medium_risk_count,
        COUNT(CASE WHEN risk_score < 30.0 THEN 1 END)::int AS low_risk_count,
        COUNT(CASE WHEN pme_next_due IS NOT NULL AND pme_next_due BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END)::int AS pme_expiring_30_days,
        COUNT(CASE WHEN ref_next_due IS NOT NULL AND ref_next_due BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END)::int AS ref_expiring_30_days
      FROM scored_staff
      ${filterWhere};
    `;

    const summaryRes = await pool.query(summaryQuery, params);
    const summary = summaryRes.rows[0];

    // Queries to calculate cross-module integration with escalations and recommendations
    let escWhere = "WHERE status IN ('Open', 'Acknowledged')";
    let recWhere = "WHERE status IN ('Pending', 'In Progress')";
    const escParams = [];
    const recParams = [];

    if (req.query.station_id && req.query.station_id !== 'All') {
      const sId = parseInt(req.query.station_id, 10);
      escWhere += ` AND employee_id IN (SELECT id FROM employees WHERE station_id = $1)`;
      recWhere += ` AND employee_id IN (SELECT id FROM employees WHERE station_id = $1)`;
      escParams.push(sId);
      recParams.push(sId);
    }

    const [escRes, recRes] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS open_esc, COUNT(CASE WHEN priority = 'Critical' THEN 1 END)::int AS crit_esc FROM workflow_escalations ${escWhere}`, escParams),
      pool.query(`SELECT COUNT(*)::int AS active_rec FROM workflow_recommendations ${recWhere}`, recParams)
    ]);

    const activeEsc = escRes.rows[0]?.open_esc || 0;
    const criticalEsc = escRes.rows[0]?.crit_esc || 0;
    const activeRec = recRes.rows[0]?.active_rec || 0;

    // Parse float numbers returned as strings by PostgreSQL pg client
    const avgSafetyIdx = parseFloat(parseFloat(summary.overall_safety_index || 0).toFixed(2));
    const avgRiskScr = parseFloat(parseFloat(summary.average_risk_score || 0).toFixed(2));

    // Executive Action Center KPI:
    // Immediate Attention Required = High Risk Employees + Critical Escalations + PME Expiring in 30 Days + REF Expiring in 30 Days
    const immediateAttention = 
      summary.high_risk_count + 
      criticalEsc + 
      summary.pme_expiring_30_days + 
      summary.ref_expiring_30_days;

    return res.status(200).json({
      success: true,
      data: {
        totalStaff: summary.total_staff,
        overallSafetyIndex: avgSafetyIdx,
        averageRiskScore: avgRiskScr,
        riskDistribution: {
          Low: summary.low_risk_count,
          Medium: summary.medium_risk_count,
          High: summary.high_risk_count
        },
        escalationStats: {
          activeCount: activeEsc,
          criticalCount: criticalEsc
        },
        activeRecommendations: activeRec,
        immediateAttentionRequired: immediateAttention
      }
    });
  } catch (err) {
    console.error('getExecutiveSummary error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

/**
 * 2. GET /api/analytics/compliance-breakdown
 * Returns rates of PME/REF/CBT/Assessments grouped by role and station.
 */
exports.getComplianceBreakdown = async (req, res) => {
  try {
    const params = [];
    const filterWhere = buildFilterClauses(req.query, params);

    const groupQuery = `
      ${STAFF_CTE}
      SELECT 
        designation,
        COUNT(*)::int AS total,
        COALESCE(AVG(pme_comp), 0.0) AS pme_compliance_pct,
        COALESCE(AVG(ref_comp), 0.0) AS ref_compliance_pct,
        COALESCE(AVG(cbt_score), 0.0) AS cbt_avg_score,
        COALESCE(AVG(practical_score), 0.0) AS practical_avg_score
      FROM scored_staff
      ${filterWhere}
      GROUP BY designation
      ORDER BY designation;
    `;

    const result = await pool.query(groupQuery, params);
    
    return res.status(200).json({
      success: true,
      data: result.rows.map(row => ({
        role: row.designation,
        total: row.total,
        pmeComplianceRate: parseFloat(parseFloat(row.pme_compliance_pct || 0).toFixed(2)),
        refComplianceRate: parseFloat(parseFloat(row.ref_compliance_pct || 0).toFixed(2)),
        cbtAverageScore: parseFloat(parseFloat(row.cbt_avg_score || 0).toFixed(2)),
        practicalAverageScore: parseFloat(parseFloat(row.practical_avg_score || 0).toFixed(2))
      }))
    });
  } catch (err) {
    console.error('getComplianceBreakdown error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

/**
 * 3. GET /api/analytics/station-heatmap
 * Aggregates safety index, high risk density, and unresolved escalations by station.
 */
exports.getStationHeatmap = async (req, res) => {
  try {
    // Dynamic query aggregating employee risk CTE at station level
    const heatmapQuery = `
      ${STAFF_CTE}
      SELECT 
        station_id,
        station_name,
        station_code,
        COUNT(*)::int AS active_staff_count,
        COALESCE(AVG(risk_score), 0.0) AS average_risk_score,
        COALESCE(AVG((pme_comp + ref_comp + cbt_score + practical_score) / 4.0), 0.0) AS safety_index,
        COUNT(CASE WHEN risk_score >= 65.0 THEN 1 END)::int AS high_risk_count,
        -- Get active escalations count per station
        (
          SELECT COUNT(*)::int 
          FROM workflow_escalations we 
          JOIN employees emp ON we.employee_id = emp.id 
          WHERE emp.station_id = scored_staff.station_id AND we.status IN ('Open', 'Acknowledged')
        ) AS unresolved_escalations,
        -- Get active recommendations count per station
        (
          SELECT COUNT(*)::int 
          FROM workflow_recommendations wr 
          JOIN employees emp ON wr.employee_id = emp.id 
          WHERE emp.station_id = scored_staff.station_id AND wr.status IN ('Pending', 'In Progress')
        ) AS active_recommendations
      FROM scored_staff
      WHERE station_id IS NOT NULL
      GROUP BY station_id, station_name, station_code
      ORDER BY average_risk_score DESC;
    `;

    const result = await pool.query(heatmapQuery);

    // Format heat details and dynamic alert level classifications
    const formattedHeat = result.rows.map(row => {
      const avgRisk = parseFloat(parseFloat(row.average_risk_score || 0).toFixed(2));
      const sIndex = parseFloat(parseFloat(row.safety_index || 0).toFixed(2));

      let alertLevel = 'Green';
      if (avgRisk >= 50.0 || row.unresolved_escalations >= 2) {
        alertLevel = 'Red';
      } else if (avgRisk >= 30.0 || row.unresolved_escalations > 0) {
        alertLevel = 'Yellow';
      }

      return {
        stationId: row.station_id,
        stationName: row.station_name,
        stationCode: row.station_code,
        activeStaffCount: row.active_staff_count,
        averageRiskScore: avgRisk,
        safetyIndex: sIndex,
        highRiskCount: row.high_risk_count,
        unresolvedEscalations: row.unresolved_escalations,
        activeRecommendations: row.active_recommendations,
        alertLevel
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedHeat
    });
  } catch (err) {
    console.error('getStationHeatmap error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

/**
 * 4. GET /api/analytics/trends-forecast
 * Computes expiring PME/REF credentials forecasting for safety-evaluated ground-level staff.
 */
exports.getTrendsForecast = async (req, res) => {
  try {
    const params = [];
    const filterWhere = buildFilterClauses(req.query, params);

    // Expiry Forecast: Queries staff whose next due dates expire within 90 days.
    const forecastQuery = `
      ${STAFF_CTE}
      SELECT 
        employee_id,
        hrms_id,
        full_name,
        designation,
        station_name,
        station_code,
        pme_next_due,
        ref_next_due,
        -- PME days remaining
        CASE WHEN pme_next_due IS NOT NULL THEN (pme_next_due - CURRENT_DATE) ELSE NULL END AS pme_days_left,
        -- REF days remaining
        CASE WHEN ref_next_due IS NOT NULL THEN (ref_next_due - CURRENT_DATE) ELSE NULL END AS ref_days_left
      FROM scored_staff
      ${filterWhere}
      ORDER BY LEAST(
        COALESCE(pme_next_due - CURRENT_DATE, 9999), 
        COALESCE(ref_next_due - CURRENT_DATE, 9999)
      ) ASC;
    `;

    const result = await pool.query(forecastQuery, params);

    const critical = [];  // 0-30 days
    const warning = [];   // 31-60 days
    const upcoming = [];  // 61-90 days

    result.rows.forEach(row => {
      const pmeDays = row.pme_days_left !== null ? parseInt(row.pme_days_left, 10) : null;
      const refDays = row.ref_days_left !== null ? parseInt(row.ref_days_left, 10) : null;

      const pmeExpiring = pmeDays !== null && pmeDays >= 0 && pmeDays <= 90;
      const refExpiring = refDays !== null && refDays >= 0 && refDays <= 90;

      if (pmeExpiring || refExpiring) {
        const item = {
          employeeId: row.employee_id,
          hrmsId: row.hrms_id,
          name: row.full_name,
          role: row.designation,
          station: row.station_name,
          stationCode: row.station_code,
          pmeDueDate: row.pme_next_due,
          pmeDaysRemaining: pmeDays,
          refDueDate: row.ref_next_due,
          refDaysRemaining: refDays,
          status: pmeDays < 0 || refDays < 0 ? 'Expired' : 'Active'
        };

        const minDays = Math.min(
          pmeExpiring ? pmeDays : 9999,
          refExpiring ? refDays : 9999
        );

        if (minDays <= 30) {
          critical.push(item);
        } else if (minDays <= 60) {
          warning.push(item);
        } else {
          upcoming.push(item);
        }
      }
    });

    // Compute historical trend snapshots by querying CBT attempts and assessments separately, then merging them
    const cbtHistory = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'Mon YYYY') AS month,
        TO_CHAR(created_at, 'YYYYMM') AS sort_month,
        COUNT(*)::int AS cbt_attempts
      FROM exam_attempts
      WHERE status = 'Completed' AND created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'Mon YYYY'), TO_CHAR(created_at, 'YYYYMM')
      ORDER BY sort_month DESC;
    `);

    const asmtHistory = await pool.query(`
      SELECT 
        TO_CHAR(assessment_date, 'Mon YYYY') AS month,
        TO_CHAR(assessment_date, 'YYYYMM') AS sort_month,
        COUNT(*)::int AS practical_assessments
      FROM assessments
      WHERE status = 'Approved' AND assessment_date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(assessment_date, 'Mon YYYY'), TO_CHAR(assessment_date, 'YYYYMM')
      ORDER BY sort_month DESC;
    `);

    const trendsMap = {};
    cbtHistory.rows.forEach(r => {
      trendsMap[r.month] = { month: r.month, sortMonth: r.sort_month, cbtAttempts: r.cbt_attempts, practicalAssessments: 0 };
    });
    asmtHistory.rows.forEach(r => {
      if (trendsMap[r.month]) {
        trendsMap[r.month].practicalAssessments = r.practical_assessments;
      } else {
        trendsMap[r.month] = { month: r.month, sortMonth: r.sort_month, cbtAttempts: 0, practicalAssessments: r.practical_assessments };
      }
    });

    const historicalTrends = Object.values(trendsMap)
      .sort((a, b) => b.sortMonth.localeCompare(a.sortMonth))
      .map(x => ({
        month: x.month,
        cbtAttempts: x.cbtAttempts,
        practicalAssessments: x.practicalAssessments
      }));

    return res.status(200).json({
      success: true,
      data: {
        forecast: {
          critical,
          warning,
          upcoming
        },
        historicalTrends
      }
    });
  } catch (err) {
    console.error('getTrendsForecast error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

/**
 * 5. GET /api/analytics/top-risk-employees
 * Paginated list of safety-critical staff sorted by calculated risk score descending.
 */
exports.getTopRiskEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const params = [];
    const filterWhere = buildFilterClauses(req.query, params);

    // Total Count Query
    const countQuery = `
      ${STAFF_CTE}
      SELECT COUNT(*)::int AS total FROM scored_staff ${filterWhere};
    `;
    const countRes = await pool.query(countQuery, params);
    const total = countRes.rows[0]?.total || 0;

    // Paginated list ordered by risk score descending
    const listParams = [...params, limitNum, offset];
    const pLimit = listParams.length - 1;
    const pOffset = listParams.length;

    const listQuery = `
      ${STAFF_CTE}
      SELECT 
        employee_id,
        hrms_id,
        full_name,
        designation,
        station_name,
        station_code,
        pme_next_due,
        ref_next_due,
        cbt_score,
        practical_score,
        open_counselling_count,
        risk_score
      FROM scored_staff
      ${filterWhere}
      ORDER BY risk_score DESC, full_name ASC
      LIMIT $${pLimit} OFFSET $${pOffset};
    `;

    const listRes = await pool.query(listQuery, listParams);

    return res.status(200).json({
      success: true,
      data: listRes.rows.map(row => {
        const score = parseFloat(parseFloat(row.risk_score || 0).toFixed(2));
        return {
          employeeId: row.employee_id,
          hrmsId: row.hrms_id,
          name: row.full_name,
          role: row.designation,
          station: row.station_name,
          stationCode: row.station_code,
          pmeDueDate: row.pme_next_due,
          refDueDate: row.ref_next_due,
          cbtScore: parseFloat(row.cbt_score || 0),
          practicalScore: parseFloat(row.practical_score || 0),
          openCounsellingCount: row.open_counselling_count,
          riskScore: score,
          riskLevel: score >= 65.0 ? 'High' : score >= 30.0 ? 'Medium' : 'Low'
        };
      }),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (err) {
    console.error('getTopRiskEmployees error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

/**
 * 6. GET /api/analytics/live-console
 * Streams critical log lines from audit_logs and notifications.
 */
exports.getLiveConsole = async (req, res) => {
  try {
    // Queries audit logs filtered strictly to requested safety events
    const consoleQuery = `
      SELECT 
        id,
        action,
        module_name,
        severity,
        remarks,
        created_at
      FROM audit_logs
      WHERE severity IN ('WARNING', 'CRITICAL') 
         OR action IN (
           'LOGIN_FAILURE',
           'SECURITY_ALERT',
           'WORKFLOW_ENGINE_COMPLETE',
           'WORKFLOW_ENGINE_RUN',
           'ESCALATION_CREATED',
           'ESCALATION_RESOLVED'
         )
      ORDER BY created_at DESC
      LIMIT 20;
    `;

    const result = await pool.query(consoleQuery);

    return res.status(200).json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        action: row.action,
        moduleName: row.module_name,
        severity: row.severity,
        remarks: row.remarks,
        timestamp: row.created_at
      }))
    });
  } catch (err) {
    console.error('getLiveConsole error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};
