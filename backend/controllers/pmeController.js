const pool = require("../config/db");
const { logAuditEvent } = require("../utils/auditLogger");
const { recalculateAndSaveEmployeeRisk } = require("../utils/riskScoring");
const { runFullEngine } = require("../utils/workflowEngine");

/**
 * GET /api/pme/status
 * Retrieve the latest PME record for the authenticated employee
 */
exports.getPmeStatus = async (req, res) => {
  try {
    const hrmsId = req.user.hrms_id;

    if (!hrmsId) {
      return res.status(400).json({
        success: false,
        message: "HRMS ID not found in token payload"
      });
    }

    // Resolve employee database ID
    const empRes = await pool.query(
      "SELECT id FROM employees WHERE UPPER(hrms_id) = $1",
      [hrmsId.toUpperCase()]
    );

    if (empRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found in database"
      });
    }

    const employeeId = empRes.rows[0].id;

    // Fetch the latest PME record (ordered by pme_date desc, then id desc)
    const query = `
      SELECT 
        e.full_name AS employee_name,
        e.hrms_id,
        TO_CHAR(p.pme_date, 'YYYY-MM-DD') AS last_pme_date,
        TO_CHAR(p.next_due_date, 'YYYY-MM-DD') AS next_due_date,
        p.medical_status,
        p.remarks,
        (p.next_due_date - CURRENT_DATE) AS days_remaining
      FROM pme_records p
      JOIN employees e ON p.employee_id = e.id
      WHERE p.employee_id = $1
      ORDER BY p.pme_date DESC, p.id DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [employeeId]);

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        has_pme: false,
        message: "PME record not available"
      });
    }

    const row = result.rows[0];
    const daysRemaining = parseInt(row.days_remaining, 10);
    const status = daysRemaining >= 0 ? "Valid" : "Expired";

    return res.status(200).json({
      success: true,
      has_pme: true,
      employee_name: row.employee_name,
      hrms_id: row.hrms_id,
      last_pme_date: row.last_pme_date,
      next_due_date: row.next_due_date,
      medical_status: row.medical_status,
      remarks: row.remarks,
      days_remaining: daysRemaining,
      status: status
    });

  } catch (error) {
    console.error("Error in getPmeStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching PME status",
      error: error.message
    });
  }
};

/**
 * GET /api/pme/history
 * Retrieve all historical PME records for the authenticated employee
 */
exports.getPmeHistory = async (req, res) => {
  try {
    const hrmsId = req.user.hrms_id;

    if (!hrmsId) {
      return res.status(400).json({
        success: false,
        message: "HRMS ID not found in token payload"
      });
    }

    // Resolve employee database ID
    const empRes = await pool.query(
      "SELECT id FROM employees WHERE UPPER(hrms_id) = $1",
      [hrmsId.toUpperCase()]
    );

    if (empRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found in database"
      });
    }

    const employeeId = empRes.rows[0].id;

    // Fetch all PME records (ordered by pme_date desc, then id desc)
    const query = `
      SELECT 
        e.full_name AS employee_name,
        e.hrms_id,
        TO_CHAR(p.pme_date, 'YYYY-MM-DD') AS last_pme_date,
        TO_CHAR(p.next_due_date, 'YYYY-MM-DD') AS next_due_date,
        p.medical_status,
        p.remarks,
        (p.next_due_date - CURRENT_DATE) AS days_remaining
      FROM pme_records p
      JOIN employees e ON p.employee_id = e.id
      WHERE p.employee_id = $1
      ORDER BY p.pme_date DESC, p.id DESC
    `;

    const result = await pool.query(query, [employeeId]);

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        has_pme: false,
        message: "PME record not available"
      });
    }

    const history = result.rows.map(row => {
      const daysRemaining = parseInt(row.days_remaining, 10);
      const status = daysRemaining >= 0 ? "Valid" : "Expired";
      return {
        employee_name: row.employee_name,
        hrms_id: row.hrms_id,
        last_pme_date: row.last_pme_date,
        next_due_date: row.next_due_date,
        medical_status: row.medical_status,
        remarks: row.remarks,
        days_remaining: daysRemaining,
        status: status
      };
    });

    return res.status(200).json({
      success: true,
      has_pme: true,
      history: history
    });

  } catch (error) {
    console.error("Error in getPmeHistory:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching PME history",
      error: error.message
    });
  }
};



exports.updatePmeStatus = async (req, res) => {
  try {
    const { employee_id, pme_date, next_due_date, medical_status, remarks } = req.body;
    const actorHrmsId = req.user.hrms_id;

    if (!employee_id || !pme_date || !next_due_date || !medical_status) {
      return res.status(400).json({
        success: false,
        message: "Required fields (employee_id, pme_date, next_due_date, medical_status) are missing."
      });
    }

    // Resolve actor UUID
    const actorRes = await pool.query("SELECT id FROM employees WHERE UPPER(hrms_id) = $1", [actorHrmsId.toUpperCase()]);
    const actorId = actorRes.rows.length > 0 ? actorRes.rows[0].id : null;

    // Insert new PME record
    const insertQuery = `
      INSERT INTO pme_records (employee_id, pme_date, next_due_date, medical_status, remarks, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *;
    `;
    const insertRes = await pool.query(insertQuery, [employee_id, pme_date, next_due_date, medical_status, remarks || '']);
    const newRecord = insertRes.rows[0];

    // Log event
    await logAuditEvent({
      employee_id: employee_id,
      action: "UPDATE_PME",
      module_name: "PME",
      performed_by: actorId,
      remarks: `Updated PME medical record: Medical Status is "${medical_status}", PME Date is ${pme_date}, Next Due Date is ${next_due_date}.`
    });

    // Instantly trigger risk recalculation and workflow engine in background
    recalculateAndSaveEmployeeRisk(employee_id)
      .then(() => runFullEngine())
      .catch(err => console.error("[BackgroundEngine] Error running risk/workflow engine after PME update:", err.message));

    return res.status(201).json({
      success: true,
      message: "PME record updated successfully",
      data: newRecord
    });
  } catch (error) {
    console.error("Error in updatePmeStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error updating PME record",
      error: error.message
    });
  }
};
