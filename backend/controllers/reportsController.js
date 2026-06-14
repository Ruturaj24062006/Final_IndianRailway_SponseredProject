const pool = require("../config/db");
const { getActivePointsmenRisk } = require("../utils/riskScoring");
const { getRoleScope } = require("../utils/roleFilter");

/**
 * GET /api/reports/dashboard
 * Safety KPI Metrics and overall compliance percentage.
 */
exports.getDashboard = async (req, res) => {
  try {
    const { scope, stationIds } = await getRoleScope(req.user);

    let countsQuery;
    let countsParams = [];
    
    if (scope === "division") {
      countsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM employees WHERE status = 'Active') AS total_employees,
          (SELECT COUNT(DISTINCT station_code) FROM stations) AS total_stations,
          (SELECT COUNT(*) FROM assessments) AS total_assessments,
          (SELECT COUNT(*) FROM exam_attempts) AS total_cbt_attempts
      `;
    } else {
      countsParams = [stationIds];
      countsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM employees WHERE status = 'Active' AND station_id = ANY($1::bigint[])) AS total_employees,
          (SELECT COALESCE(ARRAY_LENGTH($1::bigint[], 1), 0)) AS total_stations,
          (SELECT COUNT(*) FROM assessments a JOIN employees e ON a.employee_id = e.id WHERE e.station_id = ANY($1::bigint[])) AS total_assessments,
          (SELECT COUNT(*) FROM exam_attempts ea JOIN employees e ON ea.employee_id = e.id WHERE e.station_id = ANY($1::bigint[])) AS total_cbt_attempts
      `;
    }
    
    const countsRes = await pool.query(countsQuery, countsParams);
    const { total_employees, total_stations, total_assessments, total_cbt_attempts } = countsRes.rows[0];

    // 2. Overall safety compliance percentage for all active Pointsmen
    let complianceQuery = `
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
        SELECT DISTINCT ON (employee_id) employee_id, status
        FROM assessments
        ORDER BY employee_id, created_at DESC, id DESC
      )
      SELECT
        COALESCE(
          AVG(
            (
              CASE WHEN lp.next_due_date >= CURRENT_DATE THEN 1.0 ELSE 0.0 END +
              CASE WHEN lr.next_due_date >= CURRENT_DATE THEN 1.0 ELSE 0.0 END +
              CASE WHEN lc.result = 'PASSED' THEN 1.0 ELSE 0.0 END +
              CASE WHEN la.status = 'Approved' THEN 1.0 ELSE 0.0 END
            ) * 25.0
          ),
          0.0
        ) AS overall_compliance
      FROM employees e
      LEFT JOIN latest_pme lp ON e.id = lp.employee_id
      LEFT JOIN latest_ref lr ON e.id = lr.employee_id
      LEFT JOIN latest_cbt lc ON e.id = lc.employee_id
      LEFT JOIN latest_asmt la ON e.id = la.employee_id
      WHERE (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN') AND e.status = 'Active'
    `;
    
    let complianceRes;
    if (scope === "division") {
      complianceRes = await pool.query(complianceQuery);
    } else {
      complianceQuery += ` AND e.station_id = ANY($1::bigint[])`;
      complianceRes = await pool.query(complianceQuery, [stationIds]);
    }
    const overallCompliance = parseFloat(parseFloat(complianceRes.rows[0].overall_compliance).toFixed(2));

    return res.status(200).json({
      success: true,
      data: {
        total_employees: parseInt(total_employees, 10),
        total_stations: parseInt(total_stations, 10),
        total_assessments: parseInt(total_assessments, 10),
        total_cbt_attempts: parseInt(total_cbt_attempts, 10),
        overall_compliance_percentage: overallCompliance
      }
    });

  } catch (error) {
    console.error("Error in getDashboard report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching dashboard report",
      error: error.message
    });
  }
};

/**
 * GET /api/reports/cbt
 * Aggregated CBT statistics, top/bottom performers, and station-wise breakdowns.
 */
exports.getCbt = async (req, res) => {
  try {
    const { scope, stationIds } = await getRoleScope(req.user);

    // 1. Basic CBT aggregation metrics
    let statsQuery = `
      SELECT 
        COUNT(ea.id) AS total_attempts,
        COUNT(CASE WHEN ea.result = 'PASSED' THEN 1 END) AS passed_count,
        COUNT(CASE WHEN ea.result = 'FAILED' THEN 1 END) AS failed_count,
        COALESCE(AVG(ea.score_percentage), 0) AS average_score
      FROM exam_attempts ea
      JOIN employees e ON ea.employee_id = e.id
      WHERE ea.status = 'Completed'
    `;
    
    let statsRes;
    if (scope === "division") {
      statsRes = await pool.query(statsQuery);
    } else {
      statsQuery += ` AND e.station_id = ANY($1::bigint[])`;
      statsRes = await pool.query(statsQuery, [stationIds]);
    }
    const stats = statsRes.rows[0];

    const totalAttempts = parseInt(stats.total_attempts, 10);
    const passedCount = parseInt(stats.passed_count, 10);
    const failedCount = parseInt(stats.failed_count, 10);
    const passPercentage = totalAttempts > 0 ? parseFloat(((passedCount / totalAttempts) * 100).toFixed(2)) : 0;
    const failPercentage = totalAttempts > 0 ? parseFloat(((failedCount / totalAttempts) * 100).toFixed(2)) : 0;
    const averageScore = parseFloat(parseFloat(stats.average_score).toFixed(2));

    // 2. Top 10 Employees (best score of completed attempts)
    let topEmployeesQuery = `
      SELECT 
        e.id AS employee_id, 
        e.full_name AS employee_name, 
        e.hrms_id, 
        s.station_name,
        MAX(ea.score_percentage) AS score
      FROM exam_attempts ea
      JOIN employees e ON ea.employee_id = e.id
      LEFT JOIN stations s ON e.station_id = s.id
      WHERE ea.status = 'Completed' AND ea.score_percentage IS NOT NULL
    `;
    
    let topRes;
    if (scope === "division") {
      topEmployeesQuery += `
        GROUP BY e.id, e.full_name, e.hrms_id, s.station_name
        ORDER BY score DESC, e.full_name ASC
        LIMIT 10
      `;
      topRes = await pool.query(topEmployeesQuery);
    } else {
      topEmployeesQuery += `
        AND e.station_id = ANY($1::bigint[])
        GROUP BY e.id, e.full_name, e.hrms_id, s.station_name
        ORDER BY score DESC, e.full_name ASC
        LIMIT 10
      `;
      topRes = await pool.query(topEmployeesQuery, [stationIds]);
    }

    // 3. Bottom 10 Employees (min score of completed attempts)
    let bottomEmployeesQuery = `
      SELECT 
        e.id AS employee_id, 
        e.full_name AS employee_name, 
        e.hrms_id, 
        s.station_name,
        MIN(ea.score_percentage) AS score
      FROM exam_attempts ea
      JOIN employees e ON ea.employee_id = e.id
      LEFT JOIN stations s ON e.station_id = s.id
      WHERE ea.status = 'Completed' AND ea.score_percentage IS NOT NULL
    `;
    
    let bottomRes;
    if (scope === "division") {
      bottomEmployeesQuery += `
        GROUP BY e.id, e.full_name, e.hrms_id, s.station_name
        ORDER BY score ASC, e.full_name ASC
        LIMIT 10
      `;
      bottomRes = await pool.query(bottomEmployeesQuery);
    } else {
      bottomEmployeesQuery += `
        AND e.station_id = ANY($1::bigint[])
        GROUP BY e.id, e.full_name, e.hrms_id, s.station_name
        ORDER BY score ASC, e.full_name ASC
        LIMIT 10
      `;
      bottomRes = await pool.query(bottomEmployeesQuery, [stationIds]);
    }

    // 4. Station Wise Breakdown
    let stationBreakdownQuery = `
      SELECT 
        s.id AS station_id,
        s.station_name,
        s.station_code,
        COUNT(ea.id) AS total_attempts,
        COUNT(CASE WHEN ea.result = 'PASSED' THEN 1 END) AS passed_count,
        COUNT(CASE WHEN ea.result = 'FAILED' THEN 1 END) AS failed_count,
        ROUND(COALESCE(AVG(ea.score_percentage), 0), 2) AS average_score
      FROM stations s
      LEFT JOIN employees e ON e.station_id = s.id
      LEFT JOIN exam_attempts ea ON ea.employee_id = e.id AND ea.status = 'Completed'
    `;
    
    let stationBreakdownRes;
    if (scope === "division") {
      stationBreakdownQuery += `
        GROUP BY s.id, s.station_name, s.station_code
        ORDER BY s.station_name
      `;
      stationBreakdownRes = await pool.query(stationBreakdownQuery);
    } else {
      stationBreakdownQuery += `
        WHERE s.id = ANY($1::bigint[])
        GROUP BY s.id, s.station_name, s.station_code
        ORDER BY s.station_name
      `;
      stationBreakdownRes = await pool.query(stationBreakdownQuery, [stationIds]);
    }

    const stationWise = stationBreakdownRes.rows.map(row => {
      const tot = parseInt(row.total_attempts, 10);
      const passed = parseInt(row.passed_count, 10);
      const failed = parseInt(row.failed_count, 10);
      const passPct = tot > 0 ? parseFloat(((passed / tot) * 100).toFixed(2)) : 0;
      return {
        station_id: row.station_id,
        station_name: row.station_name,
        station_code: row.station_code,
        total_attempts: tot,
        passed_count: passed,
        failed_count: failed,
        pass_percentage: passPct,
        average_score: parseFloat(row.average_score)
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        total_attempts: totalAttempts,
        passed_count: passedCount,
        failed_count: failedCount,
        pass_percentage: passPercentage,
        fail_percentage: failPercentage,
        average_score: averageScore,
        top_10_employees: topRes.rows.map(r => ({ ...r, score: parseFloat(r.score) })),
        bottom_10_employees: bottomRes.rows.map(r => ({ ...r, score: parseFloat(r.score) })),
        station_wise_breakdown: stationWise
      }
    });

  } catch (error) {
    console.error("Error in getCbt report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching CBT report",
      error: error.message
    });
  }
};

/**
 * GET /api/reports/pme
 * Periodic Medical Examination compliance analytics.
 */
exports.getPme = async (req, res) => {
  try {
    const { scope, stationIds } = await getRoleScope(req.user);

    // 1. Overall PME counts
    let summaryQuery = `
      WITH latest_pme AS (
        SELECT DISTINCT ON (employee_id) employee_id, next_due_date
        FROM pme_records
        ORDER BY employee_id, pme_date DESC, id DESC
      )
      SELECT
        COUNT(CASE WHEN lp.next_due_date >= CURRENT_DATE THEN 1 END) AS valid_pme,
        COUNT(CASE WHEN lp.next_due_date IS NULL OR lp.next_due_date < CURRENT_DATE THEN 1 END) AS expired_pme,
        COUNT(CASE WHEN lp.next_due_date >= CURRENT_DATE AND lp.next_due_date <= CURRENT_DATE + INTERVAL '30 days' THEN 1 END) AS upcoming_pme
      FROM employees e
      LEFT JOIN latest_pme lp ON e.id = lp.employee_id
      WHERE (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN') AND e.status = 'Active'
    `;
    
    let summaryRes;
    if (scope === "division") {
      summaryRes = await pool.query(summaryQuery);
    } else {
      summaryQuery += ` AND e.station_id = ANY($1::bigint[])`;
      summaryRes = await pool.query(summaryQuery, [stationIds]);
    }
    const summary = summaryRes.rows[0];

    // 2. Station-wise PME compliance breakdowns
    let stationQuery = `
      WITH latest_pme AS (
        SELECT DISTINCT ON (employee_id) employee_id, next_due_date
        FROM pme_records
        ORDER BY employee_id, pme_date DESC, id DESC
      )
      SELECT 
        s.id AS station_id,
        s.station_code,
        s.station_name,
        COUNT(e.id) AS total_employees,
        COUNT(CASE WHEN lp.next_due_date >= CURRENT_DATE THEN 1 END) AS valid_count,
        COUNT(CASE WHEN lp.next_due_date IS NULL OR lp.next_due_date < CURRENT_DATE THEN 1 END) AS expired_count,
        COUNT(CASE WHEN lp.next_due_date >= CURRENT_DATE AND lp.next_due_date <= CURRENT_DATE + INTERVAL '30 days' THEN 1 END) AS upcoming_count
      FROM stations s
      LEFT JOIN employees e ON e.station_id = s.id AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN') AND e.status = 'Active'
      LEFT JOIN latest_pme lp ON e.id = lp.employee_id
    `;
    
    let stationRes;
    if (scope === "division") {
      stationQuery += `
        GROUP BY s.id, s.station_code, s.station_name
        ORDER BY s.station_name
      `;
      stationRes = await pool.query(stationQuery);
    } else {
      stationQuery += `
        WHERE s.id = ANY($1::bigint[])
        GROUP BY s.id, s.station_code, s.station_name
        ORDER BY s.station_name
      `;
      stationRes = await pool.query(stationQuery, [stationIds]);
    }

    return res.status(200).json({
      success: true,
      data: {
        valid_pme: parseInt(summary.valid_pme, 10),
        expired_pme: parseInt(summary.expired_pme, 10),
        upcoming_pme: parseInt(summary.upcoming_pme, 10),
        station_wise_pme_breakdown: stationRes.rows.map(r => ({
          station_id: r.station_id,
          station_code: r.station_code,
          station_name: r.station_name,
          total_employees: parseInt(r.total_employees, 10),
          valid_count: parseInt(r.valid_count, 10),
          expired_count: parseInt(r.expired_count, 10),
          upcoming_count: parseInt(r.upcoming_count, 10)
        }))
      }
    });

  } catch (error) {
    console.error("Error in getPme report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching PME report",
      error: error.message
    });
  }
};

/**
 * GET /api/reports/ref
 * Refresher course compliance analytics.
 */
exports.getRef = async (req, res) => {
  try {
    const { scope, stationIds } = await getRoleScope(req.user);

    // 1. Overall Refresher counts
    let summaryQuery = `
      WITH latest_ref AS (
        SELECT DISTINCT ON (employee_id) employee_id, next_due_date
        FROM ref_records
        ORDER BY employee_id, ref_date DESC, id DESC
      )
      SELECT
        COUNT(CASE WHEN lr.next_due_date >= CURRENT_DATE THEN 1 END) AS valid_ref,
        COUNT(CASE WHEN lr.next_due_date IS NULL OR lr.next_due_date < CURRENT_DATE THEN 1 END) AS expired_ref,
        COUNT(CASE WHEN lr.next_due_date >= CURRENT_DATE AND lr.next_due_date <= CURRENT_DATE + INTERVAL '30 days' THEN 1 END) AS upcoming_ref
      FROM employees e
      LEFT JOIN latest_ref lr ON e.id = lr.employee_id
      WHERE (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN') AND e.status = 'Active'
    `;
    
    let summaryRes;
    if (scope === "division") {
      summaryRes = await pool.query(summaryQuery);
    } else {
      summaryQuery += ` AND e.station_id = ANY($1::bigint[])`;
      summaryRes = await pool.query(summaryQuery, [stationIds]);
    }
    const summary = summaryRes.rows[0];

    // 2. Station-wise Refresher compliance breakdowns
    let stationQuery = `
      WITH latest_ref AS (
        SELECT DISTINCT ON (employee_id) employee_id, next_due_date
        FROM ref_records
        ORDER BY employee_id, ref_date DESC, id DESC
      )
      SELECT 
        s.id AS station_id,
        s.station_code,
        s.station_name,
        COUNT(e.id) AS total_employees,
        COUNT(CASE WHEN lr.next_due_date >= CURRENT_DATE THEN 1 END) AS valid_count,
        COUNT(CASE WHEN lr.next_due_date IS NULL OR lr.next_due_date < CURRENT_DATE THEN 1 END) AS expired_count,
        COUNT(CASE WHEN lr.next_due_date >= CURRENT_DATE AND lr.next_due_date <= CURRENT_DATE + INTERVAL '30 days' THEN 1 END) AS upcoming_count
      FROM stations s
      LEFT JOIN employees e ON e.station_id = s.id AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN') AND e.status = 'Active'
      LEFT JOIN latest_ref lr ON e.id = lr.employee_id
    `;
    
    let stationRes;
    if (scope === "division") {
      stationQuery += `
        GROUP BY s.id, s.station_code, s.station_name
        ORDER BY s.station_name
      `;
      stationRes = await pool.query(stationQuery);
    } else {
      stationQuery += `
        WHERE s.id = ANY($1::bigint[])
        GROUP BY s.id, s.station_code, s.station_name
        ORDER BY s.station_name
      `;
      stationRes = await pool.query(stationQuery, [stationIds]);
    }

    return res.status(200).json({
      success: true,
      data: {
        valid_ref: parseInt(summary.valid_ref, 10),
        expired_ref: parseInt(summary.expired_ref, 10),
        upcoming_ref: parseInt(summary.upcoming_ref, 10),
        station_wise_ref_breakdown: stationRes.rows.map(r => ({
          station_id: r.station_id,
          station_code: r.station_code,
          station_name: r.station_name,
          total_employees: parseInt(r.total_employees, 10),
          valid_count: parseInt(r.valid_count, 10),
          expired_count: parseInt(r.expired_count, 10),
          upcoming_count: parseInt(r.upcoming_count, 10)
        }))
      }
    });

  } catch (error) {
    console.error("Error in getRef report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching Refresher report",
      error: error.message
    });
  }
};

/**
 * GET /api/reports/compliance
 * Detailed safety compliance ledger of employees with station & role filter.
 */
exports.getCompliance = async (req, res) => {
  try {
    const { station_id, role_id, designation } = req.query;
    const { scope, stationIds, employeeIds, userId } = await getRoleScope(req.user);

    let queryText = `
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
        SELECT DISTINCT ON (employee_id) employee_id, result, score_percentage, status
        FROM exam_attempts
        ORDER BY employee_id, created_at DESC
      ),
      latest_asmt AS (
        SELECT DISTINCT ON (employee_id) employee_id, status, total_marks
        FROM assessments
        ORDER BY employee_id, created_at DESC, id DESC
      )
      SELECT 
        e.id AS employee_id,
        e.full_name AS employee_name,
        e.hrms_id,
        e.designation,
        e.status AS employee_status,
        e.risk_level,
        e.category_grade,
        s.station_name,
        s.station_code,
        TO_CHAR(lp.pme_date, 'YYYY-MM-DD') AS pme_date,
        TO_CHAR(lp.next_due_date, 'YYYY-MM-DD') AS pme_next_due_date,
        CASE 
          WHEN lp.next_due_date IS NULL THEN 'Not Available'
          WHEN lp.next_due_date >= CURRENT_DATE THEN 'Valid' 
          ELSE 'Expired' 
        END AS pme_status,
        TO_CHAR(lr.ref_date, 'YYYY-MM-DD') AS ref_date,
        TO_CHAR(lr.next_due_date, 'YYYY-MM-DD') AS ref_next_due_date,
        CASE 
          WHEN lr.next_due_date IS NULL THEN 'Not Available'
          WHEN lr.next_due_date >= CURRENT_DATE THEN 'Valid' 
          ELSE 'Expired' 
        END AS ref_status,
        lc.result AS cbt_result,
        lc.score_percentage AS cbt_score,
        CASE 
          WHEN lc.status = 'Completed' THEN lc.result 
          WHEN lc.status = 'Active' THEN 'Active'
          ELSE 'Not Started' 
        END AS cbt_status,
        la.status AS assessment_status,
        la.total_marks AS practical_score,
        ROUND(
          (
            (CASE WHEN lp.next_due_date >= CURRENT_DATE THEN 1.0 ELSE 0.0 END) +
            (CASE WHEN lr.next_due_date >= CURRENT_DATE THEN 1.0 ELSE 0.0 END) +
            (CASE WHEN lc.result = 'PASSED' THEN 1.0 ELSE 0.0 END) +
            (CASE WHEN la.status = 'Approved' THEN 1.0 ELSE 0.0 END)
          ) * 25.0,
          2
        ) AS compliance_percentage
      FROM employees e
      LEFT JOIN stations s ON e.station_id = s.id
      LEFT JOIN latest_pme lp ON e.id = lp.employee_id
      LEFT JOIN latest_ref lr ON e.id = lr.employee_id
      LEFT JOIN latest_cbt lc ON e.id = lc.employee_id
      LEFT JOIN latest_asmt la ON e.id = la.employee_id
      WHERE 1=1
    `;

    const values = [];
    let placeholderIdx = 1;

    // Apply role scope filters first
    if (scope === "station" || scope === "ti") {
      if (station_id && station_id !== "All" && station_id !== "") {
        const parsedStationId = parseInt(station_id, 10);
        if (!stationIds.includes(parsedStationId)) {
          return res.status(403).json({ success: false, message: "Access denied." });
        }
        queryText += ` AND e.station_id = $${placeholderIdx}`;
        values.push(parsedStationId);
        placeholderIdx++;
      } else {
        queryText += ` AND e.station_id = ANY($${placeholderIdx})`;
        values.push(stationIds);
        placeholderIdx++;
      }
    } else if (scope === "own") {
      queryText += ` AND e.id = $${placeholderIdx}`;
      values.push(userId);
      placeholderIdx++;
    } else {
      if (station_id && station_id !== "All" && station_id !== "") {
        queryText += ` AND e.station_id = $${placeholderIdx}`;
        values.push(parseInt(station_id, 10));
        placeholderIdx++;
      }
    }

    if (role_id && role_id !== "All" && role_id !== "") {
      queryText += ` AND e.role_id = $${placeholderIdx}`;
      values.push(parseInt(role_id, 10));
      placeholderIdx++;
    }

    if (designation && designation !== "All" && designation.trim() !== "") {
      queryText += ` AND e.designation ILIKE $${placeholderIdx}`;
      values.push(`%${designation.trim()}%`);
      placeholderIdx++;
    }

    queryText += ` ORDER BY e.full_name ASC`;

    const result = await pool.query(queryText, values);

    // Compute average compliance over the queried list
    let sumCompliance = 0;
    result.rows.forEach(row => {
      sumCompliance += parseFloat(row.compliance_percentage || 0);
    });
    const overallCompliance = result.rows.length > 0 ? parseFloat((sumCompliance / result.rows.length).toFixed(2)) : 0.0;

    return res.status(200).json({
      success: true,
      data: {
        overall_compliance_percentage: overallCompliance,
        employees: result.rows.map(r => ({
          ...r,
          cbt_score: r.cbt_score ? parseFloat(r.cbt_score) : null,
          practical_score: r.practical_score ? parseFloat(r.practical_score) : null,
          compliance_percentage: parseFloat(r.compliance_percentage)
        }))
      }
    });

  } catch (error) {
    console.error("Error in getCompliance report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching compliance ledger report",
      error: error.message
    });
  }
};

/**
 * GET /api/reports/assessments
 * Aggregated analytics for practical and final evaluation scores, statuses, and grades.
 */
exports.getAssessments = async (req, res) => {
  try {
    const { scope, stationIds } = await getRoleScope(req.user);

    let statusQuery;
    let avgQuery;
    let gradeQuery;
    let params = [];

    if (scope === "division") {
      statusQuery = `
        SELECT 
          COUNT(*) AS total,
          COUNT(CASE WHEN status = 'Approved' THEN 1 END) AS approved,
          COUNT(CASE WHEN status IN ('Pending', 'Submitted') THEN 1 END) AS pending,
          COUNT(CASE WHEN status = 'Rejected' THEN 1 END) AS rejected
        FROM assessments
      `;
      avgQuery = `
        SELECT 
          COALESCE(AVG(total_marks), 0) AS average_practical_score,
          (SELECT COALESCE(AVG(final_score), 0) FROM assessment_results) AS average_final_score
        FROM assessments
        WHERE status = 'Approved'
      `;
      gradeQuery = `
        SELECT 
          g.grade_name,
          COUNT(ar.id) AS count
        FROM grades g
        LEFT JOIN assessment_results ar ON ar.grade_id = g.id
        GROUP BY g.id, g.grade_name
        ORDER BY g.min_score DESC
      `;
    } else {
      params = [stationIds];
      statusQuery = `
        SELECT 
          COUNT(a.id) AS total,
          COUNT(CASE WHEN a.status = 'Approved' THEN 1 END) AS approved,
          COUNT(CASE WHEN a.status IN ('Pending', 'Submitted') THEN 1 END) AS pending,
          COUNT(CASE WHEN a.status = 'Rejected' THEN 1 END) AS rejected
        FROM assessments a
        JOIN employees e ON a.employee_id = e.id
        WHERE e.station_id = ANY($1::bigint[])
      `;
      avgQuery = `
        SELECT 
          COALESCE(AVG(a.total_marks), 0) AS average_practical_score,
          (SELECT COALESCE(AVG(ar.final_score), 0) FROM assessment_results ar JOIN employees emp ON ar.employee_id = emp.id WHERE emp.station_id = ANY($1::bigint[])) AS average_final_score
        FROM assessments a
        JOIN employees e ON a.employee_id = e.id
        WHERE a.status = 'Approved' AND e.station_id = ANY($1::bigint[])
      `;
      gradeQuery = `
        SELECT 
          g.grade_name,
          COUNT(ar.id) AS count
        FROM grades g
        LEFT JOIN assessment_results ar ON ar.grade_id = g.id
        LEFT JOIN employees e ON ar.employee_id = e.id AND e.station_id = ANY($1::bigint[])
        GROUP BY g.id, g.grade_name
        ORDER BY g.min_score DESC
      `;
    }

    const statusRes = await pool.query(statusQuery, params);
    const statusCounts = statusRes.rows[0];

    const avgRes = await pool.query(avgQuery, params);
    const avgs = avgRes.rows[0];

    const gradeRes = await pool.query(gradeQuery, params);

    return res.status(200).json({
      success: true,
      data: {
        status_counts: {
          total: parseInt(statusCounts.total, 10),
          approved: parseInt(statusCounts.approved, 10),
          pending: parseInt(statusCounts.pending, 10),
          rejected: parseInt(statusCounts.rejected, 10)
        },
        average_practical_score: parseFloat(parseFloat(avgs.average_practical_score).toFixed(2)),
        average_final_score: parseFloat(parseFloat(avgs.average_final_score).toFixed(2)),
        grade_distribution: gradeRes.rows.map(r => ({
          grade_name: r.grade_name,
          count: parseInt(r.count, 10)
        }))
      }
    });

  } catch (error) {
    console.error("Error in getAssessments report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching assessments report",
      error: error.message
    });
  }
};

/**
 * GET /api/reports/risk
 * Risk level, safety categories, and grade distributions.
 */
exports.getRisk = async (req, res) => {
  try {
    const { scope, stationIds } = await getRoleScope(req.user);

    let dbRiskQuery;
    let safetyRiskQuery;
    let catQuery;
    let gradeQuery;
    let params = [];

    if (scope === "division") {
      dbRiskQuery = `
        SELECT 
          risk_level, 
          COUNT(*) AS count 
        FROM employees 
        WHERE (role_id = 1 OR UPPER(designation) = 'POINTSMAN') AND status = 'Active'
        GROUP BY risk_level
      `;
      safetyRiskQuery = `
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
                       OR (res.final_score < 50) THEN 1 END) AS high,
          COUNT(CASE WHEN NOT ((pme.next_due_date IS NULL OR pme.next_due_date < CURRENT_DATE) 
                            OR (ref.next_due_date IS NULL OR ref.next_due_date < CURRENT_DATE) 
                            OR (res.final_score < 50)) 
                       AND (res.final_score >= 80) THEN 1 END) AS low,
          COUNT(CASE WHEN NOT ((pme.next_due_date IS NULL OR pme.next_due_date < CURRENT_DATE) 
                            OR (ref.next_due_date IS NULL OR ref.next_due_date < CURRENT_DATE) 
                            OR (res.final_score < 50)) 
                       AND (res.final_score IS NULL OR res.final_score < 80) THEN 1 END) AS medium
        FROM employees e
        LEFT JOIN latest_pme pme ON e.id = pme.employee_id
        LEFT JOIN latest_ref ref ON e.id = ref.employee_id
        LEFT JOIN latest_result res ON e.id = res.employee_id
        WHERE (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN') AND e.status = 'Active'
      `;
      catQuery = `
        SELECT 
          COALESCE(category_grade, 'Unassigned') AS category_grade, 
          COUNT(*) AS count
        FROM employees
        WHERE (role_id = 1 OR UPPER(designation) = 'POINTSMAN') AND status = 'Active'
        GROUP BY category_grade
        ORDER BY category_grade
      `;
      gradeQuery = `
        SELECT 
          g.grade_name,
          COUNT(ar.id) AS count
        FROM grades g
        LEFT JOIN assessment_results ar ON ar.grade_id = g.id
        GROUP BY g.id, g.grade_name
        ORDER BY g.min_score DESC
      `;
    } else {
      params = [stationIds];
      dbRiskQuery = `
        SELECT 
          risk_level, 
          COUNT(*) AS count 
        FROM employees 
        WHERE (role_id = 1 OR UPPER(designation) = 'POINTSMAN') AND status = 'Active' AND station_id = ANY($1::bigint[])
        GROUP BY risk_level
      `;
      safetyRiskQuery = `
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
                       OR (res.final_score < 50) THEN 1 END) AS high,
          COUNT(CASE WHEN NOT ((pme.next_due_date IS NULL OR pme.next_due_date < CURRENT_DATE) 
                            OR (ref.next_due_date IS NULL OR ref.next_due_date < CURRENT_DATE) 
                            OR (res.final_score < 50)) 
                       AND (res.final_score >= 80) THEN 1 END) AS low,
          COUNT(CASE WHEN NOT ((pme.next_due_date IS NULL OR pme.next_due_date < CURRENT_DATE) 
                            OR (ref.next_due_date IS NULL OR ref.next_due_date < CURRENT_DATE) 
                            OR (res.final_score < 50)) 
                       AND (res.final_score IS NULL OR res.final_score < 80) THEN 1 END) AS medium
        FROM employees e
        LEFT JOIN latest_pme pme ON e.id = pme.employee_id
        LEFT JOIN latest_ref ref ON e.id = ref.employee_id
        LEFT JOIN latest_result res ON e.id = res.employee_id
        WHERE (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN') AND e.status = 'Active' AND e.station_id = ANY($1::bigint[])
      `;
      catQuery = `
        SELECT 
          COALESCE(category_grade, 'Unassigned') AS category_grade, 
          COUNT(*) AS count
        FROM employees
        WHERE (role_id = 1 OR UPPER(designation) = 'POINTSMAN') AND status = 'Active' AND station_id = ANY($1::bigint[])
        GROUP BY category_grade
        ORDER BY category_grade
      `;
      gradeQuery = `
        SELECT 
          g.grade_name,
          COUNT(ar.id) AS count
        FROM grades g
        LEFT JOIN assessment_results ar ON ar.grade_id = g.id
        LEFT JOIN employees e ON ar.employee_id = e.id AND e.station_id = ANY($1::bigint[])
        GROUP BY g.id, g.grade_name
        ORDER BY g.min_score DESC
      `;
    }

    const dbRiskRes = await pool.query(dbRiskQuery, params);
    const safetyRiskRes = await pool.query(safetyRiskQuery, params);
    const sRisk = safetyRiskRes.rows[0];
    const catRes = await pool.query(catQuery, params);
    const gradeRes = await pool.query(gradeQuery, params);

    return res.status(200).json({
      success: true,
      data: {
        database_risk_distribution: dbRiskRes.rows.map(r => ({
          risk_level: r.risk_level || "Normal",
          count: parseInt(r.count, 10)
        })),
        computed_safety_risk_distribution: {
          high: parseInt(sRisk.high, 10),
          medium: parseInt(sRisk.medium, 10),
          low: parseInt(sRisk.low, 10)
        },
        category_distribution: catRes.rows.map(r => ({
          category_grade: r.category_grade,
          count: parseInt(r.count, 10)
        })),
        grade_distribution: gradeRes.rows.map(r => ({
          grade_name: r.grade_name,
          count: parseInt(r.count, 10)
        }))
      }
    });

  } catch (error) {
    console.error("Error in getRisk report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching risk report",
      error: error.message
    });
  }
};

/**
 * Helper to generate actionable recommendations for a pointsman based on metrics.
 */
function generateRecommendations(emp) {
  const recs = [];
  const currentDate = new Date();

  // PME Expiry/Missing
  if (!emp.pme_next_due_date) {
    recs.push({
      priority: "High",
      category: "PME Missing",
      action: "Schedule PME Examination",
      recommendation: `No PME record found for ${emp.full_name}. Schedule immediate medical fitness test at nearest Division Hospital.`
    });
  } else if (new Date(emp.pme_next_due_date) < currentDate) {
    recs.push({
      priority: "High",
      category: "PME Expired",
      action: "Immediate PME Renewal",
      recommendation: `PME expired on ${emp.pme_next_due_date}. Remove from active train-passing duties and schedule medical examination today.`
    });
  } else {
    const daysLeft = Math.ceil((new Date(emp.pme_next_due_date) - currentDate) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 30) {
      recs.push({
        priority: "Low",
        category: "PME Upcoming Expiry",
        action: "Pre-register PME Slot",
        recommendation: `PME due in ${daysLeft} days (${emp.pme_next_due_date}). Book clinic slot and arrange shift reliever.`
      });
    }
  }

  // Refresher Expiry/Missing
  if (!emp.ref_next_due_date) {
    recs.push({
      priority: "High",
      category: "Refresher Missing",
      action: "Depute to Training",
      recommendation: `No safety refresher training recorded. Immediately enroll in the next batch at Zonal Training School.`
    });
  } else if (new Date(emp.ref_next_due_date) < currentDate) {
    recs.push({
      priority: "High",
      category: "Refresher Expired",
      action: "Depute to Refresher Course",
      recommendation: `Safety Refresher course expired on ${emp.ref_next_due_date}. Depute to training center and issue temporary safety restriction.`
    });
  } else {
    const daysLeft = Math.ceil((new Date(emp.ref_next_due_date) - currentDate) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 30) {
      recs.push({
        priority: "Low",
        category: "Refresher Upcoming Expiry",
        action: "Reserve Refresher Seat",
        recommendation: `Refresher training due in ${daysLeft} days (${emp.ref_next_due_date}). Request training seat allocation.`
      });
    }
  }

  // CBT Exam Score
  if (!emp.cbt_score) {
    recs.push({
      priority: "Medium",
      category: "CBT Pending",
      action: "Schedule Safety CBT",
      recommendation: `No completed CBT safety attempt. Register and schedule exam attempt on safety rules.`
    });
  } else if (parseFloat(emp.cbt_score) < 70) {
    recs.push({
      priority: "Medium",
      category: "Low CBT Score",
      action: "Safety Rules Coaching",
      recommendation: `Recent CBT score is low (${emp.cbt_score}%). Assign local SM mentoring and schedule rules re-test within 14 days.`
    });
  }

  // Practical Assessment Score
  if (!emp.practical_score) {
    recs.push({
      priority: "Medium",
      category: "Assessment Pending",
      action: "Schedule Practical Audit",
      recommendation: `Awaiting approved practical safety assessment. Schedule on-site operations audit under TI supervision.`
    });
  } else if (parseFloat(emp.practical_score) < 70) {
    recs.push({
      priority: "High",
      category: "Low Practical Score",
      action: "Hands-on Safety Drills",
      recommendation: `Practical score is low (${emp.practical_score}/100). SS/SM to conduct hands-on points handling and clamping drill.`
    });
  }

  // Counselling Records
  if (parseInt(emp.open_counselling_count, 10) > 0) {
    recs.push({
      priority: "Medium",
      category: "Active Counselling",
      action: "Counselling Review",
      recommendation: `Has ${emp.open_counselling_count} active counselling cases. Conduct supervisor review to monitor field performance.`
    });
  }

  return recs;
}

/**
 * GET /api/reports/predictive-dashboard
 * Division-wide predictive metrics, key risk drivers, critical stations, and expiry timeline.
 */
exports.getPredictiveDashboard = async (req, res) => {
  try {
    const { scope, stationIds, employeeIds } = await getRoleScope(req.user);
    const filters = { ...req.query };
    if (scope !== "division") {
      filters.station_ids = stationIds;
      filters.employee_ids = employeeIds;
    }
    const list = await getActivePointsmenRisk(filters);

    if (list.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          divisional_risk_index: 0,
          risk_distribution: { high: 0, medium: 0, low: 0 },
          critical_stations: [],
          upcoming_expiries: { pme_30: 0, pme_60: 0, pme_90: 0, ref_30: 0, ref_60: 0, ref_90: 0 },
          risk_drivers: { expired_pme: 0, expired_ref: 0, low_cbt: 0, low_practical: 0, open_counselling: 0 },
          total_pointsmen: 0
        }
      });
    }

    // 1. Divisional Risk Index
    const sumRisk = list.reduce((sum, item) => sum + item.risk_score, 0);
    const divisionalRiskIndex = parseFloat((sumRisk / list.length).toFixed(2));

    // 2. Risk Distribution
    const riskDistribution = { high: 0, medium: 0, low: 0 };
    list.forEach(item => {
      const lvl = item.calculated_risk_level.toLowerCase();
      if (riskDistribution[lvl] !== undefined) {
        riskDistribution[lvl]++;
      }
    });

    // 3. Critical Stations (Top 3 highest avg risk score)
    const stationMap = {};
    list.forEach(item => {
      if (!item.station_id) return;
      if (!stationMap[item.station_id]) {
        stationMap[item.station_id] = {
          station_id: item.station_id,
          station_name: item.station_name,
          station_code: item.station_code,
          pointsmen_count: 0,
          total_risk_score: 0
        };
      }
      stationMap[item.station_id].pointsmen_count++;
      stationMap[item.station_id].total_risk_score += item.risk_score;
    });

    const criticalStations = Object.values(stationMap)
      .map(st => ({
        ...st,
        avg_risk_score: parseFloat((st.total_risk_score / st.pointsmen_count).toFixed(2))
      }))
      .sort((a, b) => b.avg_risk_score - a.avg_risk_score)
      .slice(0, 3);

    // 4. Upcoming Expiries (30/60/90 days)
    const upcomingExpiries = { pme_30: 0, pme_60: 0, pme_90: 0, ref_30: 0, ref_60: 0, ref_90: 0 };
    const currentDate = new Date();

    list.forEach(item => {
      if (item.pme_next_due_date) {
        const days = Math.ceil((new Date(item.pme_next_due_date) - currentDate) / (1000 * 60 * 60 * 24));
        if (days > 0) {
          if (days <= 30) upcomingExpiries.pme_30++;
          else if (days <= 60) upcomingExpiries.pme_60++;
          else if (days <= 90) upcomingExpiries.pme_90++;
        }
      }
      if (item.ref_next_due_date) {
        const days = Math.ceil((new Date(item.ref_next_due_date) - currentDate) / (1000 * 60 * 60 * 24));
        if (days > 0) {
          if (days <= 30) upcomingExpiries.ref_30++;
          else if (days <= 60) upcomingExpiries.ref_60++;
          else if (days <= 90) upcomingExpiries.ref_90++;
        }
      }
    });

    // 5. Key Risk Drivers
    const riskDrivers = { expired_pme: 0, expired_ref: 0, low_cbt: 0, low_practical: 0, open_counselling: 0 };
    list.forEach(item => {
      if (!item.pme_next_due_date || new Date(item.pme_next_due_date) < currentDate) {
        riskDrivers.expired_pme++;
      }
      if (!item.ref_next_due_date || new Date(item.ref_next_due_date) < currentDate) {
        riskDrivers.expired_ref++;
      }
      if (!item.cbt_score || parseFloat(item.cbt_score) < 70) {
        riskDrivers.low_cbt++;
      }
      if (!item.practical_score || parseFloat(item.practical_score) < 70) {
        riskDrivers.low_practical++;
      }
      if (parseInt(item.open_counselling_count, 10) > 0) {
        riskDrivers.open_counselling++;
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        divisional_risk_index: divisionalRiskIndex,
        risk_distribution: riskDistribution,
        critical_stations: criticalStations,
        upcoming_expiries: upcomingExpiries,
        risk_drivers: riskDrivers,
        total_pointsmen: list.length
      }
    });

  } catch (error) {
    console.error("Error in getPredictiveDashboard:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching predictive dashboard analytics",
      error: error.message
    });
  }
};

/**
 * GET /api/reports/employee-risk-ledger
 * Detailed risk status and compliance metrics for active pointsmen.
 */
exports.getEmployeeRiskLedger = async (req, res) => {
  try {
    const { scope, stationIds, employeeIds } = await getRoleScope(req.user);
    const filters = { ...req.query };
    if (scope !== "division") {
      filters.station_ids = stationIds;
      filters.employee_ids = employeeIds;
    }
    const list = await getActivePointsmenRisk(filters);

    // Apply search filter if present
    let ledger = list;
    if (req.query.search) {
      const term = req.query.search.toLowerCase().trim();
      ledger = ledger.filter(item => 
        (item.full_name && item.full_name.toLowerCase().includes(term)) ||
        (item.hrms_id && item.hrms_id.toLowerCase().includes(term))
      );
    }

    // Attach dynamic recommendations
    const data = ledger.map(emp => ({
      ...emp,
      recommendations: generateRecommendations(emp)
    }));

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error("Error in getEmployeeRiskLedger:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching employee risk ledger",
      error: error.message
    });
  }
};

/**
 * GET /api/reports/station-risk-ranking
 * Ranked station breakdown by average pointsman risk score.
 */
exports.getStationRiskRanking = async (req, res) => {
  try {
    const { scope, stationIds, employeeIds } = await getRoleScope(req.user);
    const filters = {};
    if (scope !== "division") {
      filters.station_ids = stationIds;
      filters.employee_ids = employeeIds;
    }
    const list = await getActivePointsmenRisk(filters);

    const stationMap = {};
    list.forEach(item => {
      if (!item.station_id) return;
      if (!stationMap[item.station_id]) {
        stationMap[item.station_id] = {
          station_id: item.station_id,
          station_name: item.station_name,
          station_code: item.station_code,
          total_pointsmen: 0,
          high_risk_count: 0,
          medium_risk_count: 0,
          low_risk_count: 0,
          total_risk_score: 0,
          cbt_scores_sum: 0,
          cbt_attempts_count: 0,
          pme_compliant_count: 0,
          ref_compliant_count: 0
        };
      }

      const st = stationMap[item.station_id];
      st.total_pointsmen++;
      st.total_risk_score += item.risk_score;

      const lvl = item.calculated_risk_level.toLowerCase();
      if (lvl === "high") st.high_risk_count++;
      else if (lvl === "medium") st.medium_risk_count++;
      else if (lvl === "low") st.low_risk_count++;

      if (item.cbt_score) {
        st.cbt_scores_sum += parseFloat(item.cbt_score);
        st.cbt_attempts_count++;
      }

      const currentDate = new Date();
      if (item.pme_next_due_date && new Date(item.pme_next_due_date) >= currentDate) {
        st.pme_compliant_count++;
      }
      if (item.ref_next_due_date && new Date(item.ref_next_due_date) >= currentDate) {
        st.ref_compliant_count++;
      }
    });

    const ranking = Object.values(stationMap).map(st => {
      const avg_risk = parseFloat((st.total_risk_score / st.total_pointsmen).toFixed(2));
      const avg_cbt = st.cbt_attempts_count > 0 ? parseFloat((st.cbt_scores_sum / st.cbt_attempts_count).toFixed(2)) : 0;
      const pme_rate = parseFloat(((st.pme_compliant_count / st.total_pointsmen) * 100).toFixed(2));
      const ref_rate = parseFloat(((st.ref_compliant_count / st.total_pointsmen) * 100).toFixed(2));

      return {
        station_id: st.station_id,
        station_name: st.station_name,
        station_code: st.station_code,
        total_pointsmen: st.total_pointsmen,
        high_risk_count: st.high_risk_count,
        medium_risk_count: st.medium_risk_count,
        low_risk_count: st.low_risk_count,
        station_risk_score: avg_risk,
        average_cbt_score: avg_cbt,
        pme_compliance_rate: pme_rate,
        refresher_compliance_rate: ref_rate
      };
    });

    // Sort descending (highest risk first)
    ranking.sort((a, b) => b.station_risk_score - a.station_risk_score);

    return res.status(200).json({
      success: true,
      data: ranking
    });

  } catch (error) {
    console.error("Error in getStationRiskRanking:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching station risk rankings",
      error: error.message
    });
  }
};

/**
 * GET /api/reports/alert-recommendations
 * Prescriptive safety suggestions generated dynamically.
 */
exports.getAlertRecommendations = async (req, res) => {
  try {
    const { scope, stationIds, employeeIds } = await getRoleScope(req.user);
    const filters = {};
    if (scope !== "division") {
      filters.station_ids = stationIds;
      filters.employee_ids = employeeIds;
    }
    const list = await getActivePointsmenRisk(filters);
    
    let allRecs = [];
    list.forEach(emp => {
      const recs = generateRecommendations(emp);
      recs.forEach(r => {
        allRecs.push({
          ...r,
          employee_id: emp.employee_id,
          hrms_id: emp.hrms_id,
          employee_name: emp.full_name,
          station_name: emp.station_name,
          station_code: emp.station_code,
          risk_score: emp.risk_score,
          risk_level: emp.calculated_risk_level
        });
      });
    });

    // Priority ordering: High -> Medium -> Low
    const priorityWeight = { High: 3, Medium: 2, Low: 1 };
    allRecs.sort((a, b) => {
      if (priorityWeight[b.priority] !== priorityWeight[a.priority]) {
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      return b.risk_score - a.risk_score; // Higher risk first
    });

    return res.status(200).json({
      success: true,
      data: allRecs
    });

  } catch (error) {
    console.error("Error in getAlertRecommendations:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching alert recommendations",
      error: error.message
    });
  }
};

/**
 * POST /api/reports/sync-risk-levels
 * Synchronizes computed risk levels back to the database as a snapshot/cache.
 */
exports.syncRiskLevels = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const { scope, stationIds, employeeIds } = await getRoleScope(req.user);
    const filters = {};
    if (scope !== "division") {
      filters.station_ids = stationIds;
      filters.employee_ids = employeeIds;
    }
    const list = await getActivePointsmenRisk(filters, client);
    
    let syncCount = 0;
    for (const emp of list) {
      await client.query(
        `UPDATE employees SET risk_level = $1, updated_at = NOW() WHERE id = $2`,
        [emp.calculated_risk_level, emp.employee_id]
      );
      syncCount++;
    }

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: `Successfully synchronized ${syncCount} employees' risk levels.`,
      synchronized_count: syncCount
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in syncRiskLevels:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error synchronizing risk levels",
      error: error.message
    });
  } finally {
    client.release();
  }
};
