const pool = require("../config/db");
const bcrypt = require("bcrypt");

/**
 * Helper to look up employee details by HRMS ID
 */
async function getEmployeeByHrmsId(hrmsId) {
  const result = await pool.query(
    "SELECT * FROM employees WHERE UPPER(hrms_id) = $1",
    [hrmsId.toUpperCase()]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * GET /api/sm/dashboard
 * Fetch Station Master dashboard summary metrics.
 * Uses the station_id of the authenticated SM.
 */
exports.getSmDashboard = async (req, res) => {
  try {
    const smHrmsId = req.user.hrms_id;

    // 1. Resolve Station Master profile
    const smUser = await getEmployeeByHrmsId(smHrmsId);
    if (!smUser) {
      return res.status(404).json({
        success: false,
        message: "Station Master profile not found"
      });
    }

    const stationId = smUser.station_id;
    const assessorId = smUser.id;

    if (!stationId) {
      return res.status(400).json({
        success: false,
        message: "Logged-in Station Master is not assigned to any station"
      });
    }

    // 2. Fetch Station Name & Code for UI layout reference
    const stationRes = await pool.query(
      "SELECT station_name, station_code FROM stations WHERE id = $1",
      [stationId]
    );
    const stationDetails = stationRes.rows.length > 0 ? stationRes.rows[0] : { station_name: "Unknown", station_code: "UNK" };

    // 3. Total Pointsmen at SM's station
    const pmQuery = `
      SELECT COUNT(*) FROM employees 
      WHERE (role_id = 1 OR UPPER(designation) = 'POINTSMAN')
        AND station_id = $1
    `;
    const pmRes = await pool.query(pmQuery, [stationId]);
    const totalPointsmen = parseInt(pmRes.rows[0].count, 10);

    // 4. CBT Pending under SM's station
    const cbtQuery = `
      SELECT COUNT(*) FROM employees e
      LEFT JOIN (
        SELECT DISTINCT ON (employee_id) employee_id, result
        FROM exam_attempts
        WHERE status = 'Completed'
        ORDER BY employee_id, created_at DESC
      ) c ON e.id = c.employee_id
      WHERE (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
        AND e.station_id = $1
        AND (c.result IS NULL OR c.result != 'PASSED')
    `;
    const cbtRes = await pool.query(cbtQuery, [stationId]);
    const cbtPending = parseInt(cbtRes.rows[0].count, 10);

    // 5. PME Due under SM's station
    const pmeQuery = `
      SELECT COUNT(*) FROM employees e
      LEFT JOIN (
        SELECT DISTINCT ON (employee_id) employee_id, next_due_date
        FROM pme_records
        ORDER BY employee_id, pme_date DESC, id DESC
      ) p ON e.id = p.employee_id
      WHERE (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
        AND e.station_id = $1
        AND (p.next_due_date IS NULL OR p.next_due_date < CURRENT_DATE)
    `;
    const pmeRes = await pool.query(pmeQuery, [stationId]);
    const pmeDue = parseInt(pmeRes.rows[0].count, 10);

    // 6. REF Due under SM's station
    const refQuery = `
      SELECT COUNT(*) FROM employees e
      LEFT JOIN (
        SELECT DISTINCT ON (employee_id) employee_id, next_due_date
        FROM ref_records
        ORDER BY employee_id, ref_date DESC, id DESC
      ) r ON e.id = r.employee_id
      WHERE (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
        AND e.station_id = $1
        AND (r.next_due_date IS NULL OR r.next_due_date < CURRENT_DATE)
    `;
    const refRes = await pool.query(refQuery, [stationId]);
    const refDue = parseInt(refRes.rows[0].count, 10);

    // 7. Assessments by status, created by this Station Master
    const assessQuery = `
      SELECT 
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) AS pending_count,
        COUNT(CASE WHEN status = 'Submitted' THEN 1 END) AS submitted_count,
        COUNT(CASE WHEN status = 'Approved' THEN 1 END) AS approved_count,
        COUNT(CASE WHEN status = 'Rejected' THEN 1 END) AS rejected_count
      FROM assessments
      WHERE assessor_id = $1
    `;
    const assessRes = await pool.query(assessQuery, [assessorId]);
    const assessRow = assessRes.rows[0];
    const assessmentsPending = parseInt(assessRow.pending_count, 10);
    const assessmentsSubmitted = parseInt(assessRow.submitted_count, 10);
    const assessmentsApproved = parseInt(assessRow.approved_count, 10);
    const assessmentsRejected = parseInt(assessRow.rejected_count, 10);

    // 8. Overall Station Compliance Percentage
    const complianceQuery = `
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
      WHERE (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
        AND e.station_id = $1
    `;
    const complianceRes = await pool.query(complianceQuery, [stationId]);
    const compliancePercentage = parseFloat(parseFloat(complianceRes.rows[0].overall_compliance).toFixed(2));

    return res.status(200).json({
      success: true,
      data: {
        station_name: stationDetails.station_name,
        station_code: stationDetails.station_code,
        total_pointsmen: totalPointsmen,
        cbt_pending: cbtPending,
        pme_due: pmeDue,
        ref_due: refDue,
        assessments_pending: assessmentsPending,
        assessments_submitted: assessmentsSubmitted,
        assessments_approved: assessmentsApproved,
        assessments_rejected: assessmentsRejected,
        compliance_percentage: compliancePercentage
      }
    });

  } catch (error) {
    console.error("Error in getSmDashboard:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching Station Master dashboard metrics",
      error: error.message
    });
  }
};

/**
 * GET /api/sm/pointsmen
 * Fetch Pointsmen list under SM's station with compliance statuses.
 */
exports.getSmPointsmen = async (req, res) => {
  try {
    const smHrmsId = req.user.hrms_id;

    // 1. Resolve Station Master profile
    const smUser = await getEmployeeByHrmsId(smHrmsId);
    if (!smUser) {
      return res.status(404).json({
        success: false,
        message: "Station Master profile not found"
      });
    }

    const stationId = smUser.station_id;

    if (!stationId) {
      return res.status(400).json({
        success: false,
        message: "Logged-in Station Master is not assigned to any station"
      });
    }

    const targetRole = req.query?.role || "Pointsman";
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
          assessment_date,
          mcq_status,
          percentage,
          result,
          report_url
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
        las.mcq_status AS mcq_status,
        las.percentage AS assessment_percentage,
        las.result AS assessment_result,
        las.report_url AS report_url,
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
      WHERE (e.designation ILIKE $2 OR (UPPER($2) = 'POINTSMAN' AND e.role_id = 1))
        AND e.station_id = $1
      ORDER BY e.full_name ASC
    `;

    const result = await pool.query(query, [stationId, targetRole]);

    return res.status(200).json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error("Error in getSmPointsmen:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching Pointsmen list",
      error: error.message
    });
  }
};

/**
 * GET /api/sm/pending-assessments
 * Fetch assessments in 'Pending' status assigned to/created by the logged-in SM.
 */
exports.getSmPendingAssessments = async (req, res) => {
  try {
    const smHrmsId = req.user.hrms_id;

    // 1. Resolve Station Master profile
    const smUser = await getEmployeeByHrmsId(smHrmsId);
    if (!smUser) {
      return res.status(404).json({
        success: false,
        message: "Station Master profile not found"
      });
    }

    const assessorId = smUser.id;

    const query = `
      SELECT 
        a.id AS assessment_id,
        TO_CHAR(a.assessment_date, 'YYYY-MM-DD') AS assessment_date,
        a.status AS assessment_status,
        a.mcq_status AS mcq_status,
        a.percentage AS percentage,
        a.report_url AS report_url,
        a.result AS result,
        e.id AS employee_id,
        e.full_name AS employee_name,
        e.hrms_id AS employee_hrms_id,
        e.designation AS employee_designation,
        s.id AS station_id,
        s.station_name,
        s.station_code,
        ea.correct_answers AS mcq_correct_count,
        ea.score_percentage AS mcq_percentage,
        TO_CHAR(ea.submitted_at, 'YYYY-MM-DD') AS mcq_submitted_date
      FROM assessments a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN stations s ON e.station_id = s.id
      LEFT JOIN LATERAL (
        SELECT correct_answers, score_percentage, submitted_at
        FROM exam_attempts
        WHERE employee_id = a.employee_id AND status = 'Completed'
        ORDER BY submitted_at DESC
        LIMIT 1
      ) ea ON TRUE
      WHERE a.status = 'Pending'
        AND a.assessor_id = $1
      ORDER BY a.created_at DESC
    `;

    const result = await pool.query(query, [assessorId]);

    return res.status(200).json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error("Error in getSmPendingAssessments:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching pending assessments",
      error: error.message
    });
  }
};

/**
 * GET /api/sm/assessment-history
 * Fetch list of assessments created by this Station Master.
 * Returns Pending, Submitted, Approved, Rejected assessments.
 */
exports.getSmAssessmentHistory = async (req, res) => {
  try {
    const smHrmsId = req.user.hrms_id;

    // 1. Resolve Station Master profile
    const smUser = await getEmployeeByHrmsId(smHrmsId);
    if (!smUser) {
      return res.status(404).json({
        success: false,
        message: "Station Master profile not found"
      });
    }

    const assessorId = smUser.id;

    const query = `
      SELECT 
        a.id AS assessment_id,
        TO_CHAR(a.assessment_date, 'YYYY-MM-DD') AS assessment_date,
        a.status AS status,
        a.total_marks AS practical_score,
        a.remarks,
        a.mcq_status AS mcq_status,
        a.percentage AS percentage,
        a.report_url AS report_url,
        a.result AS result,
        e.id AS employee_id,
        e.full_name AS employee_name,
        e.hrms_id AS employee_hrms_id,
        s.station_name,
        s.station_code,
        ar.cbt_score,
        ar.final_score,
        ar.fitness_status,
        g.grade_name,
        TO_CHAR(a.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
      FROM assessments a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN stations s ON e.station_id = s.id
      LEFT JOIN assessment_results ar ON a.id = ar.assessment_id
      LEFT JOIN grades g ON ar.grade_id = g.id
      WHERE a.assessor_id = $1
      ORDER BY a.created_at DESC
    `;

    const result = await pool.query(query, [assessorId]);

    return res.status(200).json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error("Error in getSmAssessmentHistory:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching assessment history",
      error: error.message
    });
  }
};

/**
 * GET /api/sm/compliance-summary
 * Fetch compliance overview metrics (PME, REF, CBT, Practical check aggregations).
 */
exports.getSmComplianceSummary = async (req, res) => {
  try {
    const smHrmsId = req.user.hrms_id;

    // 1. Resolve Station Master profile
    const smUser = await getEmployeeByHrmsId(smHrmsId);
    if (!smUser) {
      return res.status(404).json({
        success: false,
        message: "Station Master profile not found"
      });
    }

    const stationId = smUser.station_id;

    if (!stationId) {
      return res.status(400).json({
        success: false,
        message: "Logged-in Station Master is not assigned to any station"
      });
    }

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
        SELECT DISTINCT ON (employee_id) employee_id, status
        FROM assessments
        ORDER BY employee_id, created_at DESC, id DESC
      )
      SELECT
        COUNT(e.id) AS total_pointsmen,
        -- PME Compliant
        COUNT(CASE WHEN lp.next_due_date >= CURRENT_DATE THEN 1 END) AS pme_compliant,
        -- REF Compliant
        COUNT(CASE WHEN lr.next_due_date >= CURRENT_DATE THEN 1 END) AS ref_compliant,
        -- CBT Compliant
        COUNT(CASE WHEN lc.result = 'PASSED' THEN 1 END) AS cbt_compliant,
        -- Assessment Compliant
        COUNT(CASE WHEN la.status = 'Approved' THEN 1 END) AS assessment_compliant,
        -- Fully Compliant (All 4 are true)
        COUNT(CASE WHEN lp.next_due_date >= CURRENT_DATE 
                       AND lr.next_due_date >= CURRENT_DATE 
                       AND lc.result = 'PASSED' 
                       AND la.status = 'Approved' THEN 1 END) AS fully_compliant,
        -- Overall Compliance
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
      WHERE (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
        AND e.station_id = $1
    `;

    const result = await pool.query(query, [stationId]);
    const summary = result.rows[0];

    const total = parseInt(summary.total_pointsmen, 10);
    const pmeCompliant = parseInt(summary.pme_compliant, 10);
    const refCompliant = parseInt(summary.ref_compliant, 10);
    const cbtCompliant = parseInt(summary.cbt_compliant, 10);
    const assessmentCompliant = parseInt(summary.assessment_compliant, 10);
    const fullyCompliant = parseInt(summary.fully_compliant, 10);
    const overallCompliance = parseFloat(parseFloat(summary.overall_compliance).toFixed(2));

    return res.status(200).json({
      success: true,
      data: {
        total_pointsmen: total,
        pme_compliant_count: pmeCompliant,
        ref_compliant_count: refCompliant,
        cbt_compliant_count: cbtCompliant,
        assessment_compliant_count: assessmentCompliant,
        fully_compliant_count: fullyCompliant,
        overall_compliance_percentage: overallCompliance
      }
    });

  } catch (error) {
    console.error("Error in getSmComplianceSummary:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching compliance summary",
      error: error.message
    });
  }
};

/**
 * GET /api/sm/shift-masters
 * Fetch other Station Masters / Superintendents / Supervisors at the same station.
 */
exports.getSmShiftMasters = async (req, res) => {
  try {
    const smHrmsId = req.user.hrms_id;
    const smUser = await getEmployeeByHrmsId(smHrmsId);
    if (!smUser) {
      return res.status(404).json({
        success: false,
        message: "Station Master profile not found"
      });
    }

    const stationId = smUser.station_id;
    const currentSmId = smUser.id;

    if (!stationId) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const query = `
      SELECT 
        id,
        full_name,
        hrms_id,
        designation,
        mobile,
        status,
        category_grade,
        risk_level,
        TO_CHAR(date_of_joining, 'YYYY-MM-DD') AS joining_date
      FROM employees
      WHERE station_id = $1
        AND id != $2
        AND (role_id IN (2, 4, 5) OR designation ILIKE '%station master%' OR designation ILIKE '%station superintendent%' OR designation ILIKE '%station supervisor%')
      ORDER BY full_name ASC
    `;
    const result = await pool.query(query, [stationId, currentSmId]);

    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("Error in getSmShiftMasters:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching shift Station Masters",
      error: error.message
    });
  }
};

/**
 * POST /api/sm/register-pointsman
 * Provision a new Pointsman employee (role_id 1) and user account.
 */
exports.registerPointsman = async (req, res) => {
  const client = await pool.connect();
  try {
    const smHrmsId = req.user.hrms_id;
    const smUser = await getEmployeeByHrmsId(smHrmsId);
    if (!smUser) {
      return res.status(404).json({
        success: false,
        message: "Station Master profile not found"
      });
    }

    const stationId = smUser.station_id;
    if (!stationId) {
      return res.status(400).json({
        success: false,
        message: "Station Master is not assigned to a station and cannot register staff"
      });
    }

    const { name, contact, hrmsId, email, cat, joiningDate } = req.body;
    if (!name || !hrmsId) {
      return res.status(400).json({
        success: false,
        message: "Full Name and HRMS ID are required"
      });
    }

    const upperHrmsId = hrmsId.toUpperCase();

    // Check if HRMS ID already exists in employees table
    const checkDup = await pool.query(
      "SELECT id FROM employees WHERE UPPER(hrms_id) = $1",
      [upperHrmsId]
    );
    if (checkDup.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Employee with HRMS ID ${upperHrmsId} already exists`
      });
    }

    // Start Transaction
    await client.query("BEGIN");

    // Generate random PF Number and employee_id
    const randomPf = "PF" + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const randomEmpId = "EMP-PM-" + Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash default password
    const defaultPassword = "Railway@123";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Insert employee
    const insertEmpQuery = `
      INSERT INTO employees (
        employee_id, full_name, designation, role_id, station_id, status, pf_number, 
        category_grade, risk_level, mobile, date_of_joining, created_at, updated_at, hrms_id
      ) VALUES ($1, $2, 'Pointsman Grade I', 1, $3, 'Active', $4, $5, 'Normal', $6, $7, NOW(), NOW(), $8)
      RETURNING id;
    `;
    const insertEmpValues = [
      randomEmpId,
      name,
      stationId,
      randomPf,
      cat || "A",
      contact || "N/A",
      joiningDate || new Date().toISOString().split('T')[0],
      upperHrmsId
    ];
    const empInsertRes = await client.query(insertEmpQuery, insertEmpValues);
    const newEmployeeId = empInsertRes.rows[0].id;

    // Insert user account
    const insertAccQuery = `
      INSERT INTO user_accounts (
        employee_id, hrms_id, password_hash, is_active, created_at
      ) VALUES ($1, $2, $3, true, NOW())
    `;
    await client.query(insertAccQuery, [newEmployeeId, upperHrmsId, passwordHash]);

    // Insert employee hierarchy
    const insertHierarchyQuery = `
      INSERT INTO employee_hierarchy (
        employee_id, reporting_to, created_at
      ) VALUES ($1, $2, NOW())
      ON CONFLICT (employee_id) DO UPDATE SET reporting_to = $2
    `;
    await client.query(insertHierarchyQuery, [newEmployeeId, smUser.id]);

    // Commit Transaction
    await client.query("COMMIT");

    // Log this action to audit log
    try {
      const { logAuditEvent } = require("../utils/auditLogger");
      await logAuditEvent({
        employee_id: newEmployeeId,
        action: "REGISTER_POINTSMAN",
        module_name: "Station Master",
        performed_by: smUser.id,
        remarks: `Provisioned Pointsman ${name} (HRMS ID: ${hrmsId}) reporting to SM ${smUser.full_name}`,
        severity: "INFO"
      });
    } catch (auditErr) {
      console.warn("Failed to audit register pointsman event:", auditErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Pointsman registered successfully",
      data: {
        employee_id: newEmployeeId,
        hrms_id: hrmsId,
        full_name: name,
        designation: "Pointsman Grade I"
      }
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in registerPointsman:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error registering Pointsman",
      error: error.message
    });
  } finally {
    client.release();
  }
};
