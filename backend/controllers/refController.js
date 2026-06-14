const pool = require("../config/db");
const { logAuditEvent } = require("../utils/auditLogger");
const { recalculateAndSaveEmployeeRisk } = require("../utils/riskScoring");
const { runFullEngine } = require("../utils/workflowEngine");

/**
 * GET /api/ref/status
 * Retrieve the latest REF record for the authenticated employee
 */
exports.getRefStatus = async (req, res) => {
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

    // Fetch the latest REF record (ordered by ref_date desc, then id desc)
    const query = `
      SELECT 
        e.full_name AS employee_name,
        e.hrms_id,
        TO_CHAR(r.ref_date, 'YYYY-MM-DD') AS ref_date,
        TO_CHAR(r.next_due_date, 'YYYY-MM-DD') AS next_due_date,
        r.status AS training_status,
        r.remarks,
        (r.next_due_date - CURRENT_DATE) AS days_remaining
      FROM ref_records r
      JOIN employees e ON r.employee_id = e.id
      WHERE r.employee_id = $1
      ORDER BY r.ref_date DESC, r.id DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [employeeId]);

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        has_ref: false,
        message: "REF record not available"
      });
    }

    const row = result.rows[0];
    const daysRemaining = parseInt(row.days_remaining, 10);
    const status = daysRemaining >= 0 ? "Valid" : "Expired";

    return res.status(200).json({
      success: true,
      has_ref: true,
      employee_name: row.employee_name,
      hrms_id: row.hrms_id,
      ref_date: row.ref_date,
      next_due_date: row.next_due_date,
      training_status: row.training_status,
      remarks: row.remarks,
      days_remaining: daysRemaining,
      status: status
    });

  } catch (error) {
    console.error("Error in getRefStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching REF status",
      error: error.message
    });
  }
};

/**
 * GET /api/ref/history
 * Retrieve all historical REF records for the authenticated employee
 */
exports.getRefHistory = async (req, res) => {
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

    // Fetch all REF records (ordered by ref_date desc, then id desc)
    const query = `
      SELECT 
        e.full_name AS employee_name,
        e.hrms_id,
        TO_CHAR(r.ref_date, 'YYYY-MM-DD') AS ref_date,
        TO_CHAR(r.next_due_date, 'YYYY-MM-DD') AS next_due_date,
        r.status AS training_status,
        r.remarks,
        (r.next_due_date - CURRENT_DATE) AS days_remaining
      FROM ref_records r
      JOIN employees e ON r.employee_id = e.id
      WHERE r.employee_id = $1
      ORDER BY r.ref_date DESC, r.id DESC
    `;

    const result = await pool.query(query, [employeeId]);

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        has_ref: false,
        message: "REF record not available"
      });
    }

    const history = result.rows.map(row => {
      const daysRemaining = parseInt(row.days_remaining, 10);
      const status = daysRemaining >= 0 ? "Valid" : "Expired";
      return {
        employee_name: row.employee_name,
        hrms_id: row.hrms_id,
        ref_date: row.ref_date,
        next_due_date: row.next_due_date,
        training_status: row.training_status,
        remarks: row.remarks,
        days_remaining: daysRemaining,
        status: status
      };
    });

    return res.status(200).json({
      success: true,
      has_ref: true,
      history: history
    });

  } catch (error) {
    console.error("Error in getRefHistory:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching REF history",
      error: error.message
    });
  }
};



exports.updateRefStatus = async (req, res) => {
  try {
    const { employee_id, ref_date, next_due_date, status, remarks } = req.body;
    const actorHrmsId = req.user.hrms_id;

    if (!employee_id || !ref_date || !next_due_date || !status) {
      return res.status(400).json({
        success: false,
        message: "Required fields (employee_id, ref_date, next_due_date, status) are missing."
      });
    }

    // Resolve actor UUID
    const actorRes = await pool.query("SELECT id FROM employees WHERE UPPER(hrms_id) = $1", [actorHrmsId.toUpperCase()]);
    const actorId = actorRes.rows.length > 0 ? actorRes.rows[0].id : null;

    // Insert new REF record
    const insertQuery = `
      INSERT INTO ref_records (employee_id, ref_date, next_due_date, status, remarks, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *;
    `;
    const insertRes = await pool.query(insertQuery, [employee_id, ref_date, next_due_date, status, remarks || '']);
    const newRecord = insertRes.rows[0];

    // Log event
    await logAuditEvent({
      employee_id: employee_id,
      action: "UPDATE_REF",
      module_name: "REF",
      performed_by: actorId,
      remarks: `Updated Refresher course training record: Training Status is "${status}", REF Date is ${ref_date}, Next Due Date is ${next_due_date}.`
    });

    // Instantly trigger risk recalculation and workflow engine in background
    recalculateAndSaveEmployeeRisk(employee_id)
      .then(() => runFullEngine())
      .catch(err => console.error("[BackgroundEngine] Error running risk/workflow engine after REF update:", err.message));

    return res.status(201).json({
      success: true,
      message: "REF record updated successfully",
      data: newRecord
    });
  } catch (error) {
    console.error("Error in updateRefStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error updating REF record",
      error: error.message
    });
  }
};
