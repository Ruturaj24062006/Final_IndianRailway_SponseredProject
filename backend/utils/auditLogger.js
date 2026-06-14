const pool = require("../config/db");
const fs = require("fs");
const path = require("path");

/**
 * Log an action to the audit_logs table
 * @param {object} params
 * @param {string} [params.employee_id] - Affected employee's UUID
 * @param {string} params.action - Action name (e.g. LOGIN_SUCCESS, CREATE_EMPLOYEE)
 * @param {string} [params.module_name] - Section of system (e.g. Auth, Employees, Questions)
 * @param {string} [params.performed_by] - Performer's UUID
 * @param {string} [params.remarks] - Detailed description of the action
 * @param {string} [params.severity] - Severity level (INFO, WARNING, CRITICAL)
 */
async function logAuditEvent({ employee_id = null, action, module_name = null, performed_by = null, remarks = null, severity = 'INFO' }) {
  try {
    const queryText = `
      INSERT INTO audit_logs (employee_id, action, module_name, performed_by, remarks, severity, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *;
    `;
    const values = [employee_id, action, module_name, performed_by, remarks, severity];
    const res = await pool.query(queryText, values);
    return res.rows[0];
  } catch (err) {
    console.error("Failed to write audit log entry to database:", err.message);
    
    const fallbackLogEntry = {
      timestamp: new Date().toISOString(),
      employee_id,
      action,
      module_name,
      performed_by,
      remarks,
      severity,
      error: err.message
    };
    
    console.error("[AUDIT LOG DATABASE FALLBACK]", JSON.stringify(fallbackLogEntry));
    
    try {
      const logsDir = path.join(__dirname, "..", "logs");
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      const logFilePath = path.join(logsDir, "audit_fallback.log");
      fs.appendFileSync(logFilePath, JSON.stringify(fallbackLogEntry) + "\n", "utf8");
      console.log(`Fallback audit log written to local file: ${logFilePath}`);
    } catch (fsErr) {
      console.error("Failed to write fallback audit log to local filesystem:", fsErr.message);
    }
    
    return null;
  }
}

module.exports = { logAuditEvent };
