const pool = require("../config/db");

/**
 * GET /api/employees/profile
 * Fetch detailed profile of the logged-in employee, including PME, REF, and Supervisor details.
 */
exports.getEmployeeProfile = async (req, res) => {
  try {
    const hrmsId = req.user.hrms_id;
    if (!hrmsId) {
      return res.status(400).json({
        success: false,
        message: "HRMS ID not found in token payload"
      });
    }

    // 1. Fetch main employee details & station
    const query = `
      SELECT 
        e.id,
        e.full_name,
        e.hrms_id,
        e.designation,
        e.mobile,
        e.category_grade,
        e.risk_level,
        e.status,
        s.id AS station_id,
        s.station_name,
        s.station_code,
        s.division,
        s.zone
      FROM employees e
      LEFT JOIN stations s ON e.station_id = s.id
      WHERE UPPER(e.hrms_id) = $1
    `;
    const result = await pool.query(query, [hrmsId.toUpperCase()]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Employee with HRMS ID ${hrmsId} not found`
      });
    }

    const employee = result.rows[0];
    const employeeId = employee.id;

    // 2. Fetch PME Status
    let pmeRecord = null;
    try {
      const pmeRes = await pool.query(
        "SELECT pme_date, next_due_date, medical_status, remarks FROM pme_records WHERE employee_id = $1 ORDER BY pme_date DESC, id DESC LIMIT 1",
        [employeeId]
      );
      if (pmeRes.rows.length > 0) {
        pmeRecord = pmeRes.rows[0];
      }
    } catch (e) {
      console.warn("Failed to query PME status for employee profile:", e.message);
    }

    // 3. Fetch REF Status
    let refRecord = null;
    try {
      const refRes = await pool.query(
        "SELECT ref_date, next_due_date, status, remarks FROM ref_records WHERE employee_id = $1 ORDER BY ref_date DESC, id DESC LIMIT 1",
        [employeeId]
      );
      if (refRes.rows.length > 0) {
        refRecord = refRes.rows[0];
      }
    } catch (e) {
      console.warn("Failed to query REF status for employee profile:", e.message);
    }

    // 4. Resolve Supervisor Name and Designation
    let supervisor = null;
    try {
      const supQuery = `
        SELECT sup.full_name, sup.designation, sup.hrms_id
        FROM employee_hierarchy h
        JOIN employees sup ON h.reporting_to = sup.id
        WHERE h.employee_id = $1
        LIMIT 1
      `;
      const supRes = await pool.query(supQuery, [employeeId]);
      if (supRes.rows.length > 0) {
        supervisor = supRes.rows[0];
      }
    } catch (e) {
      console.warn("Failed to query supervisor details for employee profile:", e.message);
    }

    // 5. Construct response payload
    const profileData = {
      id: employee.id,
      full_name: employee.full_name,
      hrms_id: employee.hrms_id,
      designation: employee.designation,
      mobile: employee.mobile || "N/A",
      category_grade: employee.category_grade || "N/A",
      risk_level: employee.risk_level || "Normal",
      status: employee.status,
      station_id: employee.station_id,
      station_name: employee.station_name || "Not Assigned",
      station_code: employee.station_code || "N/A",
      division: employee.division || "Nagpur",
      zone: employee.zone || "Central Railway",
      
      // PME
      pme_date: pmeRecord ? pmeRecord.pme_date : null,
      pme_next_due_date: pmeRecord ? pmeRecord.next_due_date : null,
      pme_status: pmeRecord ? pmeRecord.medical_status : "Not Available",
      pme_remarks: pmeRecord ? pmeRecord.remarks : "",

      // REF
      ref_date: refRecord ? refRecord.ref_date : null,
      ref_next_due_date: refRecord ? refRecord.next_due_date : null,
      ref_status: refRecord ? refRecord.status : "Not Available",
      ref_remarks: refRecord ? refRecord.remarks : "",

      // Supervisor
      reporting_officer_id: supervisor ? supervisor.hrms_id : "N/A",
      reporting_officer_name: supervisor ? supervisor.full_name : "N/A",
      reporting_officer_designation: supervisor ? supervisor.designation : "N/A"
    };

    return res.status(200).json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error("Error in getEmployeeProfile:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching employee profile details",
      error: error.message
    });
  }
};

/**
 * GET /api/employees/history
 * Fetch historical practical evaluations and exam scores of the logged-in employee.
 */
exports.getEmployeeHistory = async (req, res) => {
  try {
    let employeeId;
    if (req.query.employee_id) {
      employeeId = req.query.employee_id;
    } else {
      const hrmsId = req.user.hrms_id;
      if (!hrmsId) {
        return res.status(400).json({
          success: false,
          message: "HRMS ID not found in token payload"
        });
      }

      // Resolve employee id from hrms_id
      const empRes = await pool.query("SELECT id FROM employees WHERE UPPER(hrms_id) = $1", [hrmsId.toUpperCase()]);
      if (empRes.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Employee profile not found"
        });
      }
      employeeId = empRes.rows[0].id;
    }

    // Fetch assessment history
    const query = `
      SELECT 
        ar.id AS result_id,
        asmt.id AS assessment_id,
        TO_CHAR(COALESCE(asmt.assessment_date, ar.created_at), 'YYYY-MM-DD') AS date,
        asmt.remarks,
        COALESCE(asmt.status, 'Completed') AS approval_status,
        ar.cbt_score,
        ar.practical_score,
        ar.final_score AS "totalScore",
        g.grade_name AS category,
        ar.fitness_status,
        TO_CHAR(COALESCE(asmt.assessment_date, ar.created_at), 'MMMM YYYY') AS "assessmentPeriod",
        COALESCE(sup.full_name, 'System') AS "assessedBy"
      FROM assessment_results ar
      LEFT JOIN assessments asmt ON ar.assessment_id = asmt.id
      LEFT JOIN employees sup ON asmt.assessor_id = sup.id
      LEFT JOIN grades g ON ar.grade_id = g.id
      WHERE ar.employee_id = $1
      ORDER BY COALESCE(asmt.assessment_date, ar.created_at) DESC, ar.created_at DESC
    `;
    const result = await pool.query(query, [employeeId]);

    return res.status(200).json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error("Error in getEmployeeHistory:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching assessment history",
      error: error.message
    });
  }
};

/**
 * GET /api/employees/audit-logs
 * Fetch audit logs of the logged-in employee.
 */
exports.getEmployeeAuditLogs = async (req, res) => {
  try {
    const hrmsId = req.user.hrms_id;
    if (!hrmsId) {
      return res.status(400).json({
        success: false,
        message: "HRMS ID not found in token payload"
      });
    }

    const empRes = await pool.query("SELECT id FROM employees WHERE UPPER(hrms_id) = $1", [hrmsId.toUpperCase()]);
    if (empRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found"
      });
    }
    const employeeId = empRes.rows[0].id;

    // Fetch audit logs performed by or relating to the employee
    const query = `
      SELECT 
        id,
        action,
        module_name,
        remarks,
        severity,
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS timestamp
      FROM audit_logs
      WHERE employee_id = $1 OR performed_by = $1
      ORDER BY created_at DESC
      LIMIT 100
    `;
    const result = await pool.query(query, [employeeId]);

    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("Error in getEmployeeAuditLogs:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching audit logs",
      error: error.message
    });
  }
};

/**
 * GET /api/employees/safety-reports
 * Fetch safety reports submitted by the logged-in employee.
 */
exports.getSafetyReports = async (req, res) => {
  try {
    const hrmsId = req.user.hrms_id;
    if (!hrmsId) {
      return res.status(400).json({
        success: false,
        message: "HRMS ID not found in token payload"
      });
    }

    const empRes = await pool.query("SELECT id FROM employees WHERE UPPER(hrms_id) = $1", [hrmsId.toUpperCase()]);
    if (empRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found"
      });
    }
    const employeeId = empRes.rows[0].id;

    const query = `
      SELECT 
        id,
        type,
        defect,
        location,
        severity,
        status,
        TO_CHAR(date, 'YYYY-MM-DD') AS date,
        description AS desc
      FROM safety_reports
      WHERE employee_id = $1
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [employeeId]);

    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("Error in getSafetyReports:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching safety reports",
      error: error.message
    });
  }
};

/**
 * POST /api/employees/safety-reports
 * Submit a new safety report.
 */
exports.createSafetyReport = async (req, res) => {
  try {
    const hrmsId = req.user.hrms_id;
    if (!hrmsId) {
      return res.status(400).json({
        success: false,
        message: "HRMS ID not found in token payload"
      });
    }

    const empRes = await pool.query("SELECT id FROM employees WHERE UPPER(hrms_id) = $1", [hrmsId.toUpperCase()]);
    if (empRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found"
      });
    }
    const employeeId = empRes.rows[0].id;

    const { type, defect, location, severity, description } = req.body;
    if (!type || !defect || !location || !severity) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (type, defect, location, severity)"
      });
    }

    const query = `
      INSERT INTO safety_reports (employee_id, type, defect, location, severity, description, status, date, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', CURRENT_DATE, NOW())
      RETURNING 
        id,
        type,
        defect,
        location,
        severity,
        status,
        TO_CHAR(date, 'YYYY-MM-DD') AS date,
        description AS desc
    `;
    const values = [employeeId, type, defect, location, severity, description || ""];
    const result = await pool.query(query, values);

    // Write to audit logs too
    try {
      const { logAuditEvent } = require("../utils/auditLogger");
      await logAuditEvent({
        employee_id: employeeId,
        action: "CREATE_SAFETY_REPORT",
        module_name: "Safety",
        performed_by: employeeId,
        remarks: `Logged safety report of type ${type} regarding ${defect} at ${location}`,
        severity: "WARNING"
      });
    } catch (auditErr) {
      console.warn("Failed to log safety report action to audit trail:", auditErr.message);
    }

    return res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error in createSafetyReport:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error creating safety report",
      error: error.message
    });
  }
};
