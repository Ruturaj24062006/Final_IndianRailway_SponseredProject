const pool = require("../config/db");
const { logAuditEvent } = require("../utils/auditLogger");
const { getRoleScope } = require("../utils/roleFilter");
const { recalculateAndSaveEmployeeRisk } = require("../utils/riskScoring");
const { runFullEngine } = require("../utils/workflowEngine");

// Helper to resolve employee UUID from HRMS ID
async function getActorUuid(hrms_id) {
  if (!hrms_id) return null;
  const res = await pool.query("SELECT id FROM employees WHERE UPPER(hrms_id) = $1", [hrms_id.toUpperCase()]);
  return res.rows.length > 0 ? res.rows[0].id : null;
}

/**
 * Log a new counselling session
 * POST /api/counselling
 */
exports.createCounselling = async (req, res) => {
  try {
    const { employee_id, counselling_date, reason, remarks, next_review_date } = req.body;

    if (!employee_id || !counselling_date || !reason) {
      return res.status(400).json({
        success: false,
        message: "employee_id, counselling_date, and reason are required fields."
      });
    }

    const counsellorUuid = await getActorUuid(req.user.hrms_id);
    if (!counsellorUuid) {
      return res.status(403).json({
        success: false,
        message: "Counsellor profile not found."
      });
    }

    // Insert counselling record
    const insertQuery = `
      INSERT INTO counselling_records (
        employee_id, counsellor_id, counselling_date, reason, remarks, next_review_date, status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'Open', NOW())
      RETURNING *;
    `;
    const values = [employee_id, counsellorUuid, counselling_date, reason, remarks || null, next_review_date || null];
    const result = await pool.query(insertQuery, values);
    const newRecord = result.rows[0];

    // Log to system audit trail
    await logAuditEvent({
      employee_id: employee_id,
      action: "LOG_COUNSELLING",
      module_name: "Counselling",
      performed_by: counsellorUuid,
      remarks: `Safety counselling logged. Reason: ${reason}. Status: Open.`,
      severity: "INFO"
    });

    // Instantly trigger risk recalculation and workflow engine in background
    recalculateAndSaveEmployeeRisk(employee_id)
      .then(() => runFullEngine())
      .catch(err => console.error("[BackgroundEngine] Error running risk/workflow engine after createCounselling:", err.message));

    return res.status(201).json({
      success: true,
      message: "Counselling session logged successfully",
      data: newRecord
    });
  } catch (error) {
    console.error("Error creating counselling record:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating counselling record"
    });
  }
};

/**
 * Get counselling records based on user role and filters
 * GET /api/counselling
 */
exports.getCounsellingRecords = async (req, res) => {
  try {
    const { employee_id, status } = req.query;

    const { scope, stationIds, employeeIds, userId } = await getRoleScope(req.user);

    let queryText = `
      SELECT 
        cr.*,
        emp.full_name as employee_name,
        emp.hrms_id as employee_hrms_id,
        emp.designation as employee_designation,
        cns.full_name as counsellor_name,
        cns.designation as counsellor_designation,
        st.station_name,
        st.station_code
      FROM counselling_records cr
      JOIN employees emp ON cr.employee_id = emp.id
      JOIN employees cns ON cr.counsellor_id = cns.id
      LEFT JOIN stations st ON emp.station_id = st.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by allowed stationIds if scope is restricted
    if (scope === "station" || scope === "ti") {
      if (stationIds && stationIds.length > 0) {
        params.push(stationIds);
        queryText += ` AND emp.station_id = ANY($${params.length})`;
      } else {
        queryText += ` AND 1=0`; // Block access if they have no stations
      }
    } else if (scope === "own") {
      if (userId) {
        params.push(userId);
        queryText += ` AND cr.employee_id = $${params.length}`;
      } else {
        queryText += ` AND 1=0`;
      }
    }

    // Apply additional filters from query
    if (employee_id) {
      if (scope === "own" && employee_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Access denied to other employees' counselling records."
        });
      }
      params.push(employee_id);
      queryText += ` AND cr.employee_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      queryText += ` AND cr.status = $${params.length}`;
    }

    // Sort by counselling date descending
    queryText += ` ORDER BY cr.counselling_date DESC, cr.created_at DESC`;

    const result = await pool.query(queryText, params);
    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("Error retrieving counselling records:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching counselling records"
    });
  }
};

/**
 * Get counselling records for a specific employee
 * GET /api/counselling/employee/:employee_id
 */
exports.getEmployeeCounsellingRecords = async (req, res) => {
  try {
    const { employee_id } = req.params;
    
    // Validate scope
    const { scope, stationIds, employeeIds, userId } = await getRoleScope(req.user);

    if (scope === "own") {
      if (employee_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Access denied."
        });
      }
    } else if (scope === "station" || scope === "ti") {
      // Verify employee belongs to one of allowed stations
      const empCheck = await pool.query("SELECT station_id FROM employees WHERE id = $1", [employee_id]);
      if (empCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Employee not found." });
      }
      const empStationId = empCheck.rows[0].station_id;
      if (!stationIds.includes(parseInt(empStationId, 10))) {
        return res.status(403).json({
          success: false,
          message: "Access denied to employees outside your station jurisdiction."
        });
      }
    }

    let queryText = `
      SELECT 
        cr.*,
        emp.full_name as employee_name,
        emp.hrms_id as employee_hrms_id,
        cns.full_name as counsellor_name,
        st.station_name,
        st.station_code
      FROM counselling_records cr
      JOIN employees emp ON cr.employee_id = emp.id
      JOIN employees cns ON cr.counsellor_id = cns.id
      LEFT JOIN stations st ON emp.station_id = st.id
      WHERE cr.employee_id = $1
      ORDER BY cr.counselling_date DESC
    `;
    const result = await pool.query(queryText, [employee_id]);
    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("Error fetching employee counselling records:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching employee counselling records"
    });
  }
};

/**
 * Update a counselling session status / remarks
 * PUT /api/counselling/:id
 */
exports.updateCounselling = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks, next_review_date } = req.body;

    const counsellorUuid = await getActorUuid(req.user.hrms_id);
    if (!counsellorUuid) {
      return res.status(403).json({
        success: false,
        message: "User profile not found."
      });
    }

    // Check if record exists
    const checkRes = await pool.query("SELECT * FROM counselling_records WHERE id = $1", [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Counselling record not found"
      });
    }
    const oldRecord = checkRes.rows[0];

    // Build update dynamic fields
    const updates = [];
    const values = [];
    
    if (status !== undefined) {
      values.push(status);
      updates.push(`status = $${values.length}`);
    }
    if (remarks !== undefined) {
      values.push(remarks);
      updates.push(`remarks = $${values.length}`);
    }
    if (next_review_date !== undefined) {
      values.push(next_review_date);
      updates.push(`next_review_date = $${values.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update."
      });
    }

    values.push(id);
    const updateQuery = `
      UPDATE counselling_records
      SET ${updates.join(", ")}
      WHERE id = $${values.length}
      RETURNING *;
    `;
    const result = await pool.query(updateQuery, values);
    const updatedRecord = result.rows[0];

    // Log to system audit trail
    await logAuditEvent({
      employee_id: updatedRecord.employee_id,
      action: "UPDATE_COUNSELLING",
      module_name: "Counselling",
      performed_by: counsellorUuid,
      remarks: `Safety counselling record ID ${id} updated. New Status: ${updatedRecord.status}.`,
      severity: "INFO"
    });

    // Instantly trigger risk recalculation and workflow engine in background
    recalculateAndSaveEmployeeRisk(updatedRecord.employee_id)
      .then(() => runFullEngine())
      .catch(err => console.error("[BackgroundEngine] Error running risk/workflow engine after updateCounselling:", err.message));

    return res.status(200).json({
      success: true,
      message: "Counselling record updated successfully",
      data: updatedRecord
    });
  } catch (error) {
    console.error("Error updating counselling record:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating counselling record"
    });
  }
};
