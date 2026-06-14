const pool = require("../config/db");
const { getRoleScope } = require("../utils/roleFilter");

/**
 * Helper to resolve allowed stations query filter based on user scope and station_id query parameter
 */
async function resolveTiStations(user, stationIdParam) {
  const { scope, stationIds } = await getRoleScope(user);
  
  if (scope === "division") {
    if (stationIdParam) {
      return [parseInt(stationIdParam, 10)];
    }
    return null;
  }
  
  if (stationIdParam) {
    const sId = parseInt(stationIdParam, 10);
    if (!stationIds.includes(sId)) {
      throw new Error("ACCESS_DENIED");
    }
    return [sId];
  }
  
  return stationIds.length > 0 ? stationIds : [-1]; // Fallback to -1 if empty to match nothing
}

/**
 * GET /api/ti/dashboard
 * Fetch Traffic Inspector dashboard summary metrics.
 * Accepts optional query parameter: station_id.
 */
exports.getTiDashboard = async (req, res) => {
  try {
    let queryStations;
    try {
      queryStations = await resolveTiStations(req.user, req.query.station_id);
    } catch (err) {
      if (err.message === "ACCESS_DENIED") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Station is not under your jurisdiction."
        });
      }
      throw err;
    }

    // 1. Total Pointsmen
    const pmQuery = `
      SELECT COUNT(*) FROM employees 
      WHERE (role_id = 1 OR UPPER(designation) = 'POINTSMAN')
        AND ($1::bigint[] IS NULL OR station_id = ANY($1::bigint[]))
    `;
    const pmRes = await pool.query(pmQuery, [queryStations]);
    const totalPointsmen = parseInt(pmRes.rows[0].count, 10);

    // 2. Total Station Masters
    const smQuery = `
      SELECT COUNT(*) FROM employees 
      WHERE (role_id = 2 OR UPPER(designation) = 'STATION MASTER')
        AND ($1::bigint[] IS NULL OR station_id = ANY($1::bigint[]))
    `;
    const smRes = await pool.query(smQuery, [queryStations]);
    const totalStationMasters = parseInt(smRes.rows[0].count, 10);

    // 3. Total Assessments
    const assessQuery = `
      SELECT COUNT(*) FROM assessments a
      JOIN employees e ON a.employee_id = e.id
      WHERE ($1::bigint[] IS NULL OR e.station_id = ANY($1::bigint[]))
    `;
    const assessRes = await pool.query(assessQuery, [queryStations]);
    const totalAssessments = parseInt(assessRes.rows[0].count, 10);

    // 4. Pending, Approved, Rejected counts and Avg score
    const pipelineQuery = `
      SELECT 
        COUNT(CASE WHEN a.status IN ('Pending', 'Submitted') THEN 1 END) AS pending_count,
        COUNT(CASE WHEN a.status = 'Approved' THEN 1 END) AS approved_count,
        COUNT(CASE WHEN a.status = 'Rejected' THEN 1 END) AS rejected_count,
        COALESCE(AVG(CASE WHEN a.status = 'Approved' THEN a.total_marks END), 0) AS avg_score
      FROM assessments a
      JOIN employees e ON a.employee_id = e.id
      WHERE ($1::bigint[] IS NULL OR e.station_id = ANY($1::bigint[]))
    `;
    const pipelineRes = await pool.query(pipelineQuery, [queryStations]);
    const pipeline = pipelineRes.rows[0];
    const pendingApprovalsCount = parseInt(pipeline.pending_count, 10);
    const approvedAssessmentsCount = parseInt(pipeline.approved_count, 10);
    const rejectedAssessmentsCount = parseInt(pipeline.rejected_count, 10);
    const overallAvgScore = parseFloat(parseFloat(pipeline.avg_score).toFixed(2));

    // 5. CBT Stats (Latest attempt for each pointsman)
    const cbtQuery = `
      SELECT 
        COUNT(CASE WHEN c.result = 'PASSED' THEN 1 END) AS passed_count,
        COUNT(CASE WHEN c.result = 'FAILED' THEN 1 END) AS failed_count
      FROM employees e
      JOIN (
        SELECT DISTINCT ON (employee_id) employee_id, result
        FROM exam_attempts
        WHERE status = 'Completed'
        ORDER BY employee_id, created_at DESC
      ) c ON e.id = c.employee_id
      WHERE (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
        AND ($1::bigint[] IS NULL OR e.station_id = ANY($1::bigint[]))
    `;
    const cbtRes = await pool.query(cbtQuery, [queryStations]);
    const cbtStats = {
      passed: parseInt(cbtRes.rows[0].passed_count, 10),
      failed: parseInt(cbtRes.rows[0].failed_count, 10)
    };

    // 6. PME Due Count
    const pmeQuery = `
      SELECT 
        COUNT(CASE WHEN p.next_due_date IS NULL OR p.next_due_date < CURRENT_DATE THEN 1 END) AS due_count,
        COUNT(CASE WHEN p.next_due_date >= CURRENT_DATE THEN 1 END) AS valid_count
      FROM employees e
      LEFT JOIN (
        SELECT DISTINCT ON (employee_id) employee_id, next_due_date
        FROM pme_records
        ORDER BY employee_id, pme_date DESC, id DESC
      ) p ON e.id = p.employee_id
      WHERE (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
        AND ($1::bigint[] IS NULL OR e.station_id = ANY($1::bigint[]))
    `;
    const pmeRes = await pool.query(pmeQuery, [queryStations]);
    const pmeStats = {
      due: parseInt(pmeRes.rows[0].due_count, 10),
      valid: parseInt(pmeRes.rows[0].valid_count, 10)
    };

    // 7. REF Due Count
    const refQuery = `
      SELECT 
        COUNT(CASE WHEN r.next_due_date IS NULL OR r.next_due_date < CURRENT_DATE THEN 1 END) AS due_count,
        COUNT(CASE WHEN r.next_due_date >= CURRENT_DATE THEN 1 END) AS valid_count
      FROM employees e
      LEFT JOIN (
        SELECT DISTINCT ON (employee_id) employee_id, next_due_date
        FROM ref_records
        ORDER BY employee_id, ref_date DESC, id DESC
      ) r ON e.id = r.employee_id
      WHERE (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
        AND ($1::bigint[] IS NULL OR e.station_id = ANY($1::bigint[]))
    `;
    const refRes = await pool.query(refQuery, [queryStations]);
    const refStats = {
      due: parseInt(refRes.rows[0].due_count, 10),
      valid: parseInt(refRes.rows[0].valid_count, 10)
    };

    // 8. Risk Level Distribution
    const riskQuery = `
      SELECT 
        COUNT(CASE WHEN (pme.next_due_date IS NULL OR pme.next_due_date < CURRENT_DATE) 
                     OR (ref.next_due_date IS NULL OR ref.next_due_date < CURRENT_DATE) 
                     OR (res.final_score < 50) THEN 1 END) AS high_risk,
        COUNT(CASE WHEN NOT ((pme.next_due_date IS NULL OR pme.next_due_date < CURRENT_DATE) 
                          OR (ref.next_due_date IS NULL OR ref.next_due_date < CURRENT_DATE) 
                          OR (res.final_score < 50)) 
                     AND (res.final_score >= 80) THEN 1 END) AS low_risk,
        COUNT(CASE WHEN NOT ((pme.next_due_date IS NULL OR pme.next_due_date < CURRENT_DATE) 
                          OR (ref.next_due_date IS NULL OR ref.next_due_date < CURRENT_DATE) 
                          OR (res.final_score < 50)) 
                     AND (res.final_score IS NULL OR res.final_score < 80) THEN 1 END) AS medium_risk
      FROM employees e
      LEFT JOIN (
        SELECT DISTINCT ON (employee_id) employee_id, next_due_date
        FROM pme_records
        ORDER BY employee_id, pme_date DESC, id DESC
      ) pme ON e.id = pme.employee_id
      LEFT JOIN (
        SELECT DISTINCT ON (employee_id) employee_id, next_due_date
        FROM ref_records
        ORDER BY employee_id, ref_date DESC, id DESC
      ) ref ON e.id = ref.employee_id
      LEFT JOIN (
        SELECT DISTINCT ON (employee_id) employee_id, final_score
        FROM assessment_results
        ORDER BY employee_id, created_at DESC
      ) res ON e.id = res.employee_id
      WHERE (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
        AND ($1::bigint[] IS NULL OR e.station_id = ANY($1::bigint[]))
    `;
    const riskRes = await pool.query(riskQuery, [queryStations]);
    const riskStats = {
      high: parseInt(riskRes.rows[0].high_risk, 10),
      medium: parseInt(riskRes.rows[0].medium_risk, 10),
      low: parseInt(riskRes.rows[0].low_risk, 10)
    };

    return res.status(200).json({
      success: true,
      data: {
        total_pointsmen: totalPointsmen,
        total_station_masters: totalStationMasters,
        total_assessments: totalAssessments,
        pending_approvals_count: pendingApprovalsCount,
        approved_assessments_count: approvedAssessmentsCount,
        rejected_assessments_count: rejectedAssessmentsCount,
        overall_avg_score: overallAvgScore,
        cbt_stats: cbtStats,
        pme_stats: pmeStats,
        ref_stats: refStats,
        risk_stats: riskStats
      }
    });

  } catch (error) {
    console.error("Error in getTiDashboard:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching Traffic Inspector dashboard metrics",
      error: error.message
    });
  }
};

/**
 * GET /api/ti/pending-approvals
 * Fetch list of assessments pending review. Includes both 'Pending' and 'Submitted' statuses.
 * Accepts optional query parameter: station_id.
 */
exports.getTiPendingApprovals = async (req, res) => {
  try {
    let queryStations;
    try {
      queryStations = await resolveTiStations(req.user, req.query.station_id);
    } catch (err) {
      if (err.message === "ACCESS_DENIED") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Station is not under your jurisdiction."
        });
      }
      throw err;
    }

    const query = `
      SELECT 
        a.id AS approval_id,
        asmt.id AS assessment_id,
        TO_CHAR(asmt.assessment_date, 'YYYY-MM-DD') AS assessment_date,
        asmt.total_marks AS practical_score,
        asmt.status AS assessment_status,
        e.id AS employee_id,
        e.full_name AS employee_name,
        e.hrms_id AS employee_hrms_id,
        e.designation AS employee_designation,
        s.id AS station_id,
        s.station_name,
        s.station_code,
        asmt.remarks AS assessor_remarks,
        sa.full_name AS assessor_name,
        sa.hrms_id AS assessor_hrms_id
      FROM assessments asmt
      JOIN employees e ON asmt.employee_id = e.id
      LEFT JOIN stations s ON e.station_id = s.id
      JOIN employees sa ON asmt.assessor_id = sa.id
      LEFT JOIN approvals a ON asmt.id = a.assessment_id AND a.status = 'Pending'
      WHERE asmt.status IN ('Pending', 'Submitted')
        AND ($1::bigint[] IS NULL OR e.station_id = ANY($1::bigint[]))
      ORDER BY asmt.created_at DESC
    `;

    const result = await pool.query(query, [queryStations]);

    return res.status(200).json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error("Error in getTiPendingApprovals:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching pending approvals",
      error: error.message
    });
  }
};

/**
 * GET /api/ti/assessment-history
 * Fetch historical assessments approved or rejected.
 * Accepts optional query parameter: station_id.
 */
exports.getTiAssessmentHistory = async (req, res) => {
  try {
    let queryStations;
    try {
      queryStations = await resolveTiStations(req.user, req.query.station_id);
    } catch (err) {
      if (err.message === "ACCESS_DENIED") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Station is not under your jurisdiction."
        });
      }
      throw err;
    }

    const query = `
      SELECT 
        a.id AS approval_id,
        asmt.id AS assessment_id,
        TO_CHAR(asmt.assessment_date, 'YYYY-MM-DD') AS assessment_date,
        asmt.status AS status,
        e.id AS employee_id,
        e.full_name AS employee_name,
        e.hrms_id AS employee_hrms_id,
        s.station_name,
        s.station_code,
        sa.full_name AS assessor_name,
        sa.hrms_id AS assessor_hrms_id,
        ar.cbt_score,
        ar.practical_score,
        ar.final_score,
        g.grade_name,
        ar.fitness_status,
        a.remarks AS approver_remarks,
        TO_CHAR(a.approved_at, 'YYYY-MM-DD HH24:MI:SS') AS processed_at
      FROM approvals a
      JOIN assessments asmt ON a.assessment_id = asmt.id
      JOIN employees e ON asmt.employee_id = e.id
      LEFT JOIN stations s ON e.station_id = s.id
      JOIN employees sa ON asmt.assessor_id = sa.id
      LEFT JOIN assessment_results ar ON asmt.id = ar.assessment_id
      LEFT JOIN grades g ON ar.grade_id = g.id
      WHERE a.status IN ('Approved', 'Rejected')
        AND ($1::bigint[] IS NULL OR e.station_id = ANY($1::bigint[]))
      ORDER BY a.approved_at DESC
    `;

    const result = await pool.query(query, [queryStations]);

    return res.status(200).json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error("Error in getTiAssessmentHistory:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching assessment history",
      error: error.message
    });
  }
};

/**
 * GET /api/ti/performance-summary
 * Fetch performance and compliance overview for all Pointsmen.
 * Accepts optional query parameters: station_id, risk_level.
 */
exports.getTiPerformanceSummary = async (req, res) => {
  try {
    let queryStations;
    try {
      queryStations = await resolveTiStations(req.user, req.query.station_id);
    } catch (err) {
      if (err.message === "ACCESS_DENIED") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Station is not under your jurisdiction."
        });
      }
      throw err;
    }
    
    const riskLevelParam = req.query.risk_level || null;

    const designationParam = req.query.role || null;

    const query = `
      WITH latest_pme AS (
        SELECT DISTINCT ON (employee_id) 
          employee_id, 
          next_due_date, 
          pme_date, 
          medical_status,
          (next_due_date - CURRENT_DATE) AS days_remaining
        FROM pme_records
        ORDER BY employee_id, pme_date DESC, id DESC
      ),
      latest_ref AS (
        SELECT DISTINCT ON (employee_id) 
          employee_id, 
          next_due_date, 
          ref_date, 
          status,
          (next_due_date - CURRENT_DATE) AS days_remaining
        FROM ref_records
        ORDER BY employee_id, ref_date DESC, id DESC
      ),
      latest_cbt AS (
        SELECT DISTINCT ON (employee_id) 
          employee_id, 
          result, 
          score_percentage, 
          status
        FROM exam_attempts
        ORDER BY employee_id, created_at DESC
      ),
      latest_assessment AS (
        SELECT DISTINCT ON (employee_id) 
          employee_id, 
          id AS assessment_id, 
          status, 
          total_marks, 
          assessment_date
        FROM assessments
        ORDER BY employee_id, created_at DESC, id DESC
      ),
      latest_result AS (
        SELECT DISTINCT ON (employee_id) 
          employee_id, 
          final_score, 
          fitness_status, 
          grade_id
        FROM assessment_results
        ORDER BY employee_id, created_at DESC
      )
      SELECT 
        e.id AS employee_id,
        e.full_name,
        e.hrms_id,
        e.mobile,
        e.designation,
        e.category_grade,
        e.risk_level AS db_risk_level,
        s.id AS station_id,
        s.station_name,
        s.station_code,
        -- PME Details
        TO_CHAR(lp.pme_date, 'YYYY-MM-DD') AS pme_date,
        TO_CHAR(lp.next_due_date, 'YYYY-MM-DD') AS pme_next_due_date,
        lp.days_remaining AS pme_days_remaining,
        CASE 
          WHEN lp.next_due_date IS NULL THEN 'Not Available'
          WHEN lp.next_due_date >= CURRENT_DATE THEN 'Valid'
          ELSE 'Expired'
        END AS pme_status,
        -- REF Details
        TO_CHAR(lr.ref_date, 'YYYY-MM-DD') AS ref_date,
        TO_CHAR(lr.next_due_date, 'YYYY-MM-DD') AS ref_next_due_date,
        lr.days_remaining AS ref_days_remaining,
        CASE 
          WHEN lr.next_due_date IS NULL THEN 'Not Available'
          WHEN lr.next_due_date >= CURRENT_DATE THEN 'Valid'
          ELSE 'Expired'
        END AS ref_status,
        -- CBT Details
        lc.result AS cbt_result,
        lc.score_percentage AS cbt_score,
        CASE 
          WHEN lc.status = 'Completed' THEN lc.result
          WHEN lc.status = 'Active' THEN 'Active'
          ELSE 'Not Started'
        END AS cbt_status,
        -- Assessment Details
        las.status AS assessment_status,
        las.total_marks AS practical_score,
        lres.final_score,
        lres.fitness_status,
        g.grade_name,
        -- Overall Compliance Percentage Calculation
        ROUND(
          (
            (CASE WHEN lp.next_due_date >= CURRENT_DATE THEN 1 ELSE 0 END) +
            (CASE WHEN lr.next_due_date >= CURRENT_DATE THEN 1 ELSE 0 END) +
            (CASE WHEN lc.result = 'PASSED' THEN 1 ELSE 0 END) +
            (CASE WHEN las.status = 'Approved' THEN 1 ELSE 0 END)
          ) * 25.0,
          2
        ) AS overall_compliance_percentage
      FROM employees e
      LEFT JOIN stations s ON e.station_id = s.id
      LEFT JOIN latest_pme lp ON e.id = lp.employee_id
      LEFT JOIN latest_ref lr ON e.id = lr.employee_id
      LEFT JOIN latest_cbt lc ON e.id = lc.employee_id
      LEFT JOIN latest_assessment las ON e.id = las.employee_id
      LEFT JOIN latest_result lres ON e.id = lres.employee_id
      LEFT JOIN grades g ON lres.grade_id = g.id
      WHERE ($3::varchar IS NULL OR e.designation ILIKE $3 OR (UPPER($3) = 'POINTSMAN' AND e.role_id = 1))
        AND ($1::bigint[] IS NULL OR e.station_id = ANY($1::bigint[]))
        AND ($2::varchar IS NULL OR e.risk_level = $2)
      ORDER BY e.full_name ASC
    `;

    const result = await pool.query(query, [queryStations, riskLevelParam, designationParam]);

    return res.status(200).json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error("Error in getTiPerformanceSummary:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching performance summary",
      error: error.message
    });
  }
};
