const pool = require("../config/db");

/**
 * GET /api/aom/dashboard
 * Fetch top-level counts, compliance rates, and breakdown charts.
 * Accepts optional query parameters: station_id, risk_level.
 */
exports.getAomDashboard = async (req, res) => {
  try {
    const stationIdParam = req.query.station_id;
    const stationId = stationIdParam ? parseInt(stationIdParam, 10) : null;
    const riskLevelParam = req.query.risk_level || null;

    // 1. Fetch Counts (Total, Pointsmen, SM, TI)
    const countsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM employees WHERE ($1::bigint IS NULL OR station_id = $1) AND ($2::varchar IS NULL OR risk_level = $2)) AS total_employees,
        (SELECT COUNT(*) FROM employees WHERE (role_id = 1 OR UPPER(designation) = 'POINTSMAN') AND ($1::bigint IS NULL OR station_id = $1) AND ($2::varchar IS NULL OR risk_level = $2)) AS total_pointsmen,
        (SELECT COUNT(*) FROM employees WHERE (role_id = 2 OR UPPER(designation) = 'STATION MASTER') AND ($1::bigint IS NULL OR station_id = $1) AND ($2::varchar IS NULL OR risk_level = $2)) AS total_station_masters,
        (SELECT COUNT(*) FROM employees WHERE (role_id = 6 OR UPPER(designation) = 'TRAFFIC INSPECTOR') AND ($1::bigint IS NULL OR station_id = $1) AND ($2::varchar IS NULL OR risk_level = $2)) AS total_traffic_inspectors
    `;
    const countsRes = await pool.query(countsQuery, [stationId, riskLevelParam]);
    const counts = countsRes.rows[0];

    // 2. Fetch CBT Compliance (Passed attempts vs attempted)
    const cbtQuery = `
      WITH latest_cbt AS (
        SELECT DISTINCT ON (employee_id) employee_id, result
        FROM exam_attempts
        WHERE status = 'Completed'
        ORDER BY employee_id, created_at DESC
      )
      SELECT 
        COUNT(lc.employee_id) AS attempted,
        COUNT(CASE WHEN lc.result = 'PASSED' THEN 1 END) AS passed
      FROM employees e
      JOIN latest_cbt lc ON e.id = lc.employee_id
      WHERE ($1::bigint IS NULL OR e.station_id = $1)
        AND ($2::varchar IS NULL OR e.risk_level = $2)
    `;
    const cbtRes = await pool.query(cbtQuery, [stationId, riskLevelParam]);
    const attempted = parseInt(cbtRes.rows[0].attempted, 10);
    const passed = parseInt(cbtRes.rows[0].passed, 10);
    const cbtPassPct = attempted > 0 ? parseFloat(((passed / attempted) * 100).toFixed(2)) : 0;

    // 3. Fetch PME Compliance (next_due_date >= CURRENT_DATE)
    const pmeQuery = `
      WITH latest_pme AS (
        SELECT DISTINCT ON (employee_id) employee_id, next_due_date
        FROM pme_records
        ORDER BY employee_id, pme_date DESC, id DESC
      )
      SELECT 
        COUNT(e.id) AS total,
        COUNT(CASE WHEN lp.next_due_date >= CURRENT_DATE THEN 1 END) AS compliant
      FROM employees e
      LEFT JOIN latest_pme lp ON e.id = lp.employee_id
      WHERE ($1::bigint IS NULL OR e.station_id = $1)
        AND ($2::varchar IS NULL OR e.risk_level = $2)
    `;
    const pmeRes = await pool.query(pmeQuery, [stationId, riskLevelParam]);
    const pmeTotal = parseInt(pmeRes.rows[0].total, 10);
    const pmeCompliant = parseInt(pmeRes.rows[0].compliant, 10);
    const pmeCompliancePct = pmeTotal > 0 ? parseFloat(((pmeCompliant / pmeTotal) * 100).toFixed(2)) : 0;

    // 4. Fetch REF Compliance (next_due_date >= CURRENT_DATE)
    const refQuery = `
      WITH latest_ref AS (
        SELECT DISTINCT ON (employee_id) employee_id, next_due_date
        FROM ref_records
        ORDER BY employee_id, ref_date DESC, id DESC
      )
      SELECT 
        COUNT(e.id) AS total,
        COUNT(CASE WHEN lr.next_due_date >= CURRENT_DATE THEN 1 END) AS compliant
      FROM employees e
      LEFT JOIN latest_ref lr ON e.id = lr.employee_id
      WHERE ($1::bigint IS NULL OR e.station_id = $1)
        AND ($2::varchar IS NULL OR e.risk_level = $2)
    `;
    const refRes = await pool.query(refQuery, [stationId, riskLevelParam]);
    const refTotal = parseInt(refRes.rows[0].total, 10);
    const refCompliant = parseInt(refRes.rows[0].compliant, 10);
    const refCompliancePct = refTotal > 0 ? parseFloat(((refCompliant / refTotal) * 100).toFixed(2)) : 0;

    // 5. Fetch Assessment Completion % (status = 'Approved')
    const asmtQuery = `
      WITH latest_asmt AS (
        SELECT DISTINCT ON (employee_id) employee_id, status
        FROM assessments
        ORDER BY employee_id, created_at DESC, id DESC
      )
      SELECT 
        COUNT(e.id) AS total,
        COUNT(CASE WHEN la.status = 'Approved' THEN 1 END) AS completed
      FROM employees e
      LEFT JOIN latest_asmt la ON e.id = la.employee_id
      WHERE ($1::bigint IS NULL OR e.station_id = $1)
        AND ($2::varchar IS NULL OR e.risk_level = $2)
    `;
    const asmtRes = await pool.query(asmtQuery, [stationId, riskLevelParam]);
    const asmtTotal = parseInt(asmtRes.rows[0].total, 10);
    const asmtCompleted = parseInt(asmtRes.rows[0].completed, 10);
    const assessmentCompletionPct = asmtTotal > 0 ? parseFloat(((asmtCompleted / asmtTotal) * 100).toFixed(2)) : 0;

    // 6. Fetch Risk Distribution (High, Medium, Low)
    const riskQuery = `
      WITH latest_pme AS (
        SELECT DISTINCT ON (employee_id) employee_id, next_due_date
        FROM pme_records
        ORDER BY employee_id, pme_date DESC, id DESC
      ),
      latest_ref AS (
        SELECT DISTINCT ON (employee_id) employee_id, next_due_date
        FROM ref_records
        ORDER BY employee_id, ref_date DESC, id DESC
      ),
      latest_result AS (
        SELECT DISTINCT ON (employee_id) employee_id, final_score
        FROM assessment_results
        ORDER BY employee_id, created_at DESC
      )
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
      LEFT JOIN latest_pme pme ON e.id = pme.employee_id
      LEFT JOIN latest_ref ref ON e.id = ref.employee_id
      LEFT JOIN latest_result res ON e.id = res.employee_id
      WHERE ($1::bigint IS NULL OR e.station_id = $1)
        AND ($2::varchar IS NULL OR e.risk_level = $2)
    `;
    const riskRes = await pool.query(riskQuery, [stationId, riskLevelParam]);
    const riskStats = {
      high: parseInt(riskRes.rows[0].high_risk, 10),
      medium: parseInt(riskRes.rows[0].medium_risk, 10),
      low: parseInt(riskRes.rows[0].low_risk, 10)
    };

    // 7. Fetch Assessment pipeline (Approved, Pending/Submitted, Rejected)
    const pipelineQuery = `
      SELECT 
        COUNT(CASE WHEN a.status = 'Approved' THEN 1 END) AS approved,
        COUNT(CASE WHEN a.status IN ('Pending', 'Submitted') THEN 1 END) AS pending,
        COUNT(CASE WHEN a.status = 'Rejected' THEN 1 END) AS rejected
      FROM assessments a
      JOIN employees e ON a.employee_id = e.id
      WHERE ($1::bigint IS NULL OR e.station_id = $1)
        AND ($2::varchar IS NULL OR e.risk_level = $2)
    `;
    const pipelineRes = await pool.query(pipelineQuery, [stationId, riskLevelParam]);
    const pipeline = {
      approved: parseInt(pipelineRes.rows[0].approved, 10),
      pending: parseInt(pipelineRes.rows[0].pending, 10),
      rejected: parseInt(pipelineRes.rows[0].rejected, 10)
    };

    // 8. Fetch Role distribution
    const roleQuery = `
      SELECT 
        COUNT(CASE WHEN role_id = 1 OR UPPER(designation) = 'POINTSMAN' THEN 1 END) AS pointsmen,
        COUNT(CASE WHEN role_id = 2 OR UPPER(designation) = 'STATION MASTER' THEN 1 END) AS station_masters,
        COUNT(CASE WHEN role_id = 6 OR UPPER(designation) = 'TRAFFIC INSPECTOR' THEN 1 END) AS traffic_inspectors
      FROM employees e
      WHERE ($1::bigint IS NULL OR e.station_id = $1)
        AND ($2::varchar IS NULL OR e.risk_level = $2)
    `;
    const roleRes = await pool.query(roleQuery, [stationId, riskLevelParam]);
    const roleStats = {
      pointsmen: parseInt(roleRes.rows[0].pointsmen, 10),
      station_masters: parseInt(roleRes.rows[0].station_masters, 10),
      traffic_inspectors: parseInt(roleRes.rows[0].traffic_inspectors, 10)
    };

    return res.status(200).json({
      success: true,
      data: {
        total_employees: parseInt(counts.total_employees, 10),
        total_pointsmen: parseInt(counts.total_pointsmen, 10),
        total_station_masters: parseInt(counts.total_station_masters, 10),
        total_traffic_inspectors: parseInt(counts.total_traffic_inspectors, 10),
        cbt_pass_pct: cbtPassPct,
        pme_compliance_pct: pmeCompliancePct,
        ref_compliance_pct: refCompliancePct,
        assessment_completion_pct: assessmentCompletionPct,
        risk_stats: riskStats,
        pipeline_stats: pipeline,
        role_stats: roleStats
      }
    });

  } catch (error) {
    console.error("Error in getAomDashboard:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching AOM Dashboard",
      error: error.message
    });
  }
};

/**
 * GET /api/aom/station-summary
 * Fetch station-wise details: count of employees, assessments, compliance rates.
 */
exports.getAomStationSummary = async (req, res) => {
  try {
    const query = `
      WITH latest_pme AS (
        SELECT DISTINCT ON (employee_id) employee_id, next_due_date
        FROM pme_records
        ORDER BY employee_id, pme_date DESC, id DESC
      ),
      latest_ref AS (
        SELECT DISTINCT ON (employee_id) employee_id, next_due_date
        FROM ref_records
        ORDER BY employee_id, ref_date DESC, id DESC
      ),
      latest_cbt AS (
        SELECT DISTINCT ON (employee_id) employee_id, result
        FROM exam_attempts
        WHERE status = 'Completed'
        ORDER BY employee_id, created_at DESC
      ),
      latest_asmt AS (
        SELECT DISTINCT ON (employee_id) employee_id, status, total_marks
        FROM assessments
        ORDER BY employee_id, created_at DESC, id DESC
      )
      SELECT 
        s.id AS station_id,
        s.station_code,
        s.station_name,
        s.division,
        s.zone,
        COUNT(e.id) AS total_employees,
        COUNT(CASE WHEN la.status = 'Approved' THEN 1 END) AS completed,
        COUNT(CASE WHEN la.status IN ('Pending', 'Submitted') THEN 1 END) AS pending,
        COALESCE(ROUND(AVG(CASE WHEN la.status = 'Approved' THEN la.total_marks END), 2), 0) AS avg_score,
        COALESCE(ROUND(COUNT(CASE WHEN lp.next_due_date >= CURRENT_DATE THEN 1 END) * 100.0 / NULLIF(COUNT(e.id), 0), 2), 0) AS pme_compliant_pct,
        COALESCE(ROUND(COUNT(CASE WHEN lr.next_due_date >= CURRENT_DATE THEN 1 END) * 100.0 / NULLIF(COUNT(e.id), 0), 2), 0) AS ref_compliant_pct,
        COALESCE(ROUND(COUNT(CASE WHEN lc.result = 'PASSED' THEN 1 END) * 100.0 / NULLIF(COUNT(lc.employee_id), 0), 2), 0) AS cbt_pass_pct,
        COALESCE(
          ROUND(
            AVG(
              (
                CASE WHEN lp.next_due_date >= CURRENT_DATE THEN 1.0 ELSE 0.0 END +
                CASE WHEN lr.next_due_date >= CURRENT_DATE THEN 1.0 ELSE 0.0 END +
                CASE WHEN lc.result = 'PASSED' THEN 1.0 ELSE 0.0 END +
                CASE WHEN la.status = 'Approved' THEN 1.0 ELSE 0.0 END
              ) * 25.0
            ),
            2
          ),
          0.0
        ) AS overall_compliance_pct
      FROM stations s
      LEFT JOIN employees e ON s.id = e.station_id
      LEFT JOIN latest_pme lp ON e.id = lp.employee_id
      LEFT JOIN latest_ref lr ON e.id = lr.employee_id
      LEFT JOIN latest_cbt lc ON e.id = lc.employee_id
      LEFT JOIN latest_asmt la ON e.id = la.employee_id
      GROUP BY s.id, s.station_code, s.station_name, s.division, s.zone
      ORDER BY s.station_name ASC
    `;
    const result = await pool.query(query);

    return res.status(200).json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error("Error in getAomStationSummary:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching Station Summary",
      error: error.message
    });
  }
};

/**
 * GET /api/aom/compliance-summary
 * Fetch compliance details per employee and aggregated totals.
 * Accepts optional query parameters: station_id, risk_level.
 */
exports.getAomComplianceSummary = async (req, res) => {
  try {
    const stationIdParam = req.query.station_id;
    const stationId = stationIdParam ? parseInt(stationIdParam, 10) : null;
    const riskLevelParam = req.query.risk_level || null;

    const rosterQuery = `
      WITH latest_pme AS (
        SELECT DISTINCT ON (employee_id) employee_id, pme_date, next_due_date, medical_status
        FROM pme_records
        ORDER BY employee_id, pme_date DESC, id DESC
      ),
      latest_ref AS (
        SELECT DISTINCT ON (employee_id) employee_id, ref_date, next_due_date, status
        FROM ref_records
        ORDER BY employee_id, ref_date DESC, id DESC
      )
      SELECT 
        e.id AS employee_id,
        e.full_name,
        e.hrms_id,
        e.designation,
        s.station_name,
        s.station_code,
        -- PME
        TO_CHAR(lp.pme_date, 'YYYY-MM-DD') AS pme_date,
        TO_CHAR(lp.next_due_date, 'YYYY-MM-DD') AS pme_next_due_date,
        CASE 
          WHEN lp.next_due_date IS NULL THEN 'Not Available'
          WHEN lp.next_due_date >= CURRENT_DATE THEN 'Valid'
          ELSE 'Expired'
        END AS pme_status,
        -- REF
        TO_CHAR(lr.ref_date, 'YYYY-MM-DD') AS ref_date,
        TO_CHAR(lr.next_due_date, 'YYYY-MM-DD') AS ref_next_due_date,
        CASE 
          WHEN lr.next_due_date IS NULL THEN 'Not Available'
          WHEN lr.next_due_date >= CURRENT_DATE THEN 'Valid'
          ELSE 'Expired'
        END AS ref_status
      FROM employees e
      LEFT JOIN stations s ON e.station_id = s.id
      LEFT JOIN latest_pme lp ON e.id = lp.employee_id
      LEFT JOIN latest_ref lr ON e.id = lr.employee_id
      WHERE ($1::bigint IS NULL OR e.station_id = $1)
        AND ($2::varchar IS NULL OR e.risk_level = $2)
      ORDER BY e.full_name ASC
    `;
    const rosterRes = await pool.query(rosterQuery, [stationId, riskLevelParam]);

    // Compute aggregated compliance stats over these filtered employees
    const employees = rosterRes.rows;
    const total = employees.length;

    const pmeCompliant = employees.filter(e => e.pme_status === 'Valid').length;
    const refCompliant = employees.filter(e => e.ref_status === 'Valid').length;

    return res.status(200).json({
      success: true,
      data: {
        total_roster_count: total,
        pme_compliant_count: pmeCompliant,
        pme_non_compliant_count: total - pmeCompliant,
        pme_compliance_pct: total > 0 ? parseFloat(((pmeCompliant / total) * 100).toFixed(2)) : 0,
        ref_compliant_count: refCompliant,
        ref_non_compliant_count: total - refCompliant,
        ref_compliance_pct: total > 0 ? parseFloat(((refCompliant / total) * 100).toFixed(2)) : 0,
        detailed_roster: employees
      }
    });

  } catch (error) {
    console.error("Error in getAomComplianceSummary:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching Compliance Summary",
      error: error.message
    });
  }
};

/**
 * GET /api/aom/performance-summary
 * Fetch detailed evaluation results, dynamic risk categories, and monthly aggregated scores.
 * Accepts optional query parameters: station_id, risk_level.
 */
exports.getAomPerformanceSummary = async (req, res) => {
  try {
    const stationIdParam = req.query.station_id;
    const stationId = stationIdParam ? parseInt(stationIdParam, 10) : null;
    const riskLevelParam = req.query.risk_level || null;

    // 1. Fetch live 6-month historical trend
    const trendQuery = `
      WITH RECURSIVE last_6_months AS (
        SELECT DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 month' AS month_start
        UNION ALL
        SELECT month_start + INTERVAL '1 month'
        FROM last_6_months
        WHERE month_start < DATE_TRUNC('month', CURRENT_DATE)
      )
      SELECT 
        TO_CHAR(m.month_start, 'Mon''YY') AS month,
        COALESCE(ROUND(AVG(CASE WHEN a.status = 'Approved' THEN a.total_marks END), 2), 0) AS score,
        COALESCE(ROUND(COUNT(CASE WHEN a.status = 'Approved' AND a.total_marks >= 80 THEN 1 END) * 100.0 / NULLIF(COUNT(CASE WHEN a.status = 'Approved' THEN 1 END), 0), 2), 0) AS safety,
        COUNT(CASE WHEN a.status = 'Approved' THEN 1 END) AS approved,
        COUNT(CASE WHEN a.status IN ('Pending', 'Submitted') THEN 1 END) AS pending,
        COUNT(CASE WHEN a.status = 'Rejected' THEN 1 END) AS rejected
      FROM last_6_months m
      LEFT JOIN assessments a ON DATE_TRUNC('month', a.assessment_date) = m.month_start
      GROUP BY m.month_start
      ORDER BY m.month_start ASC
    `;
    const trendRes = await pool.query(trendQuery);

    // 2. Fetch detailed employee performance roster
    const rosterQuery = `
      WITH latest_pme AS (
        SELECT DISTINCT ON (employee_id) 
          employee_id, next_due_date, pme_date, medical_status
        FROM pme_records
        ORDER BY employee_id, pme_date DESC, id DESC
      ),
      latest_ref AS (
        SELECT DISTINCT ON (employee_id) 
          employee_id, next_due_date, ref_date, status
        FROM ref_records
        ORDER BY employee_id, ref_date DESC, id DESC
      ),
      latest_cbt AS (
        SELECT DISTINCT ON (employee_id) 
          employee_id, result, score_percentage, status
        FROM exam_attempts
        ORDER BY employee_id, created_at DESC
      ),
      latest_asmt AS (
        SELECT DISTINCT ON (employee_id) 
          employee_id, id AS assessment_id, status, total_marks, assessment_date
        FROM assessments
        ORDER BY employee_id, created_at DESC, id DESC
      ),
      latest_result AS (
        SELECT DISTINCT ON (employee_id) 
          employee_id, final_score, fitness_status, grade_id
        FROM assessment_results
        ORDER BY employee_id, created_at DESC
      )
      SELECT 
        e.id AS employee_id,
        e.full_name,
        e.hrms_id,
        e.mobile,
        e.category_grade,
        s.station_name,
        s.station_code,
        e.designation,
        -- PME
        TO_CHAR(lp.pme_date, 'YYYY-MM-DD') AS pme_date,
        TO_CHAR(lp.next_due_date, 'YYYY-MM-DD') AS pme_next_due_date,
        CASE 
          WHEN lp.next_due_date IS NULL THEN 'Not Available'
          WHEN lp.next_due_date >= CURRENT_DATE THEN 'Valid'
          ELSE 'Expired'
        END AS pme_status,
        -- REF
        TO_CHAR(lr.ref_date, 'YYYY-MM-DD') AS ref_date,
        TO_CHAR(lr.next_due_date, 'YYYY-MM-DD') AS ref_next_due_date,
        CASE 
          WHEN lr.next_due_date IS NULL THEN 'Not Available'
          WHEN lr.next_due_date >= CURRENT_DATE THEN 'Valid'
          ELSE 'Expired'
        END AS ref_status,
        -- CBT
        lc.score_percentage AS cbt_score,
        lc.result AS cbt_result,
        CASE 
          WHEN lc.status = 'Completed' THEN lc.result
          WHEN lc.status = 'Active' THEN 'Active'
          ELSE 'Not Started'
        END AS cbt_status,
        -- Practical
        las.status AS assessment_status,
        las.total_marks AS practical_score,
        lres.final_score,
        lres.fitness_status,
        g.grade_name,
        -- Risk level defined dynamically matching tiController
        CASE 
          WHEN (lp.next_due_date IS NULL OR lp.next_due_date < CURRENT_DATE) 
               OR (lr.next_due_date IS NULL OR lr.next_due_date < CURRENT_DATE) 
               OR (lres.final_score < 50) THEN 'High'
          WHEN NOT ((lp.next_due_date IS NULL OR lp.next_due_date < CURRENT_DATE) 
                OR (lr.next_due_date IS NULL OR lr.next_due_date < CURRENT_DATE) 
                OR (lres.final_score < 50)) 
               AND (lres.final_score >= 80) THEN 'Low'
          ELSE 'Medium'
        END AS risk_level,
        -- Combined compliance percentage
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
      LEFT JOIN latest_asmt las ON e.id = las.employee_id
      LEFT JOIN latest_result lres ON e.id = lres.employee_id
      LEFT JOIN grades g ON lres.grade_id = g.id
      WHERE ($1::bigint IS NULL OR e.station_id = $1)
        AND ($2::varchar IS NULL OR 
            (CASE 
              WHEN (lp.next_due_date IS NULL OR lp.next_due_date < CURRENT_DATE) 
                   OR (lr.next_due_date IS NULL OR lr.next_due_date < CURRENT_DATE) 
                   OR (lres.final_score < 50) THEN 'High'
              WHEN NOT ((lp.next_due_date IS NULL OR lp.next_due_date < CURRENT_DATE) 
                    OR (lr.next_due_date IS NULL OR lr.next_due_date < CURRENT_DATE) 
                    OR (lres.final_score < 50)) 
                   AND (lres.final_score >= 80) THEN 'Low'
              ELSE 'Medium'
            END) = $2)
      ORDER BY e.full_name ASC
    `;
    const rosterRes = await pool.query(rosterQuery, [stationId, riskLevelParam]);

    // 3. Compute Grade Distribution counts dynamically
    const grades = rosterRes.rows;
    const gradeStats = {
      A: grades.filter(e => e.grade_name === 'A').length,
      B: grades.filter(e => e.grade_name === 'B').length,
      C: grades.filter(e => e.grade_name === 'C').length,
      D: grades.filter(e => e.grade_name === 'D').length
    };

    return res.status(200).json({
      success: true,
      data: {
        monthly_trend: trendRes.rows,
        grade_stats: gradeStats,
        detailed_performance: rosterRes.rows
      }
    });

  } catch (error) {
    console.error("Error in getAomPerformanceSummary:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching Performance Summary",
      error: error.message
    });
  }
};
