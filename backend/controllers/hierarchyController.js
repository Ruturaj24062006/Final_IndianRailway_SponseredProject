const pool = require("../config/db");
const { logAuditEvent } = require("../utils/auditLogger");

// Helper to resolve employee UUID from HRMS ID
async function getActorUuid(hrms_id) {
  if (!hrms_id) return null;
  const res = await pool.query("SELECT id FROM employees WHERE UPPER(hrms_id) = $1", [hrms_id.toUpperCase()]);
  return res.rows.length > 0 ? res.rows[0].id : null;
}

/**
 * Helper to recursively verify if assigning supervisorId as the supervisor of employeeId would create a cyclic loop.
 * Returns true if a cycle is detected, false otherwise.
 */
async function checkCycle(employeeId, supervisorId) {
  if (employeeId === supervisorId) return true;

  let currentId = supervisorId;
  const visited = new Set();

  while (currentId) {
    if (currentId === employeeId) return true;
    if (visited.has(currentId)) return true; // prevent infinite loops
    visited.add(currentId);

    const res = await pool.query(
      "SELECT reporting_to FROM employee_hierarchy WHERE employee_id = $1",
      [currentId]
    );

    if (res.rows.length === 0) break;
    currentId = res.rows[0].reporting_to;
  }

  return false;
}

/**
 * Assign supervisor to an employee
 * POST /api/hierarchy/assign
 */
exports.assignSupervisor = async (req, res) => {
  try {
    const { employee_id, reporting_to } = req.body;

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        message: "employee_id (subordinate UUID) is required."
      });
    }

    const actorUuid = await getActorUuid(req.user.hrms_id);
    if (!actorUuid) {
      return res.status(403).json({
        success: false,
        message: "Logged-in user profile not found."
      });
    }

    // 1. If removing supervisor (reporting_to is null)
    if (!reporting_to) {
      const deleteRes = await pool.query(
        "DELETE FROM employee_hierarchy WHERE employee_id = $1 RETURNING *;",
        [employee_id]
      );

      if (deleteRes.rows.length > 0) {
        // Log to audit log
        await logAuditEvent({
          employee_id: employee_id,
          action: "ASSIGN_SUPERVISOR",
          module_name: "Hierarchy",
          performed_by: actorUuid,
          remarks: `Removed supervisor hierarchy reporting link for employee UUID ${employee_id}.`,
          severity: "WARNING"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Supervisor link removed successfully."
      });
    }

    // 2. Self-reporting check
    if (employee_id === reporting_to) {
      return res.status(400).json({
        success: false,
        message: "Self-reporting hierarchy links are prohibited."
      });
    }

    // 3. Cycle check
    const isCyclic = await checkCycle(employee_id, reporting_to);
    if (isCyclic) {
      return res.status(400).json({
        success: false,
        message: "Invalid hierarchy assignment: Cyclic loop reporting detected."
      });
    }

    // 4. Verify employee and supervisor exist
    const empCheck = await pool.query("SELECT full_name FROM employees WHERE id = $1", [employee_id]);
    const supCheck = await pool.query("SELECT full_name FROM employees WHERE id = $1", [reporting_to]);

    if (empCheck.rows.length === 0 || supCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Target employee or supervisor profile not found."
      });
    }

    const employeeName = empCheck.rows[0].full_name;
    const supervisorName = supCheck.rows[0].full_name;

    // 5. Upsert hierarchy mapping
    const upsertQuery = `
      INSERT INTO employee_hierarchy (employee_id, reporting_to, created_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (employee_id) DO UPDATE
      SET reporting_to = EXCLUDED.reporting_to
      RETURNING *;
    `;
    const result = await pool.query(upsertQuery, [employee_id, reporting_to]);
    const record = result.rows[0];

    // 6. Log to system audit trail
    await logAuditEvent({
      employee_id: employee_id,
      action: "ASSIGN_SUPERVISOR",
      module_name: "Hierarchy",
      performed_by: actorUuid,
      remarks: `Assigned supervisor chain: ${employeeName} now reports to ${supervisorName}.`,
      severity: "INFO"
    });

    return res.status(200).json({
      success: true,
      message: "Supervisor assigned successfully",
      data: record
    });

  } catch (error) {
    console.error("Error assigning supervisor:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while assigning supervisor."
    });
  }
};

/**
 * Get direct reports of the authenticated supervisor
 * GET /api/hierarchy/subordinates
 */
exports.getSubordinates = async (req, res) => {
  try {
    const actorUuid = await getActorUuid(req.user.hrms_id);
    if (!actorUuid) {
      return res.status(403).json({
        success: false,
        message: "User profile not found."
      });
    }

    // Query reporting links
    const queryText = `
      SELECT 
        h.id as link_id,
        emp.id,
        emp.full_name,
        emp.hrms_id,
        emp.designation,
        emp.category_grade,
        emp.status,
        st.station_name,
        st.station_code
      FROM employee_hierarchy h
      JOIN employees emp ON h.employee_id = emp.id
      LEFT JOIN stations st ON emp.station_id = st.id
      WHERE h.reporting_to = $1
      ORDER BY emp.full_name;
    `;
    const result = await pool.query(queryText, [actorUuid]);

    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("Error fetching subordinates:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while loading subordinates list."
    });
  }
};

/**
 * Build and return the command hierarchy tree representing the operational structure
 * GET /api/hierarchy/tree
 */
exports.getHierarchyTree = async (req, res) => {
  try {
    // 1. Fetch all active employees
    const empRes = await pool.query(`
      SELECT 
        e.id, 
        e.hrms_id, 
        e.full_name as name, 
        e.designation, 
        e.category_grade as category,
        st.station_name,
        st.station_code
      FROM employees e
      LEFT JOIN stations st ON e.station_id = st.id
      WHERE e.status = 'Active';
    `);

    // 2. Fetch all hierarchy links
    const linksRes = await pool.query(`
      SELECT employee_id, reporting_to 
      FROM employee_hierarchy;
    `);

    const employees = empRes.rows;
    const links = linksRes.rows;

    // Build indexing maps
    const nodeMap = {};
    employees.forEach(emp => {
      nodeMap[emp.id] = {
        id: emp.id,
        hrmsId: emp.hrms_id,
        name: emp.name,
        designation: emp.designation,
        category: emp.category || "A",
        station: emp.station_name || emp.station_code || "Unassigned",
        children: []
      };
    });

    const hasSupervisor = new Set();
    
    // Map subordinates to supervisors
    links.forEach(link => {
      const child = nodeMap[link.employee_id];
      const parent = nodeMap[link.reporting_to];
      
      if (child && parent) {
        parent.children.push(child);
        hasSupervisor.add(link.employee_id);
      }
    });

    // Roots are nodes that are NOT reports of anyone but have direct reporting lines,
    // or senior management roles like Sr. DOM, AOM, Traffic Inspectors.
    const roots = [];
    employees.forEach(emp => {
      const node = nodeMap[emp.id];
      const designation = (emp.designation || "").toUpperCase();

      // SR.DOM, Super Admin, AOM, or any node that doesn't have a supervisor
      if (!hasSupervisor.has(emp.id)) {
        // Only include nodes as roots if they have children OR are high-level roles (Sr. DOM, AOM, TI, Super Admin)
        if (
          node.children.length > 0 || 
          designation.includes("DOM") || 
          designation.includes("AOM") || 
          designation.includes("INSPECTOR") || 
          designation.includes("ADMIN")
        ) {
          roots.push(node);
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: roots
    });

  } catch (error) {
    console.error("Error fetching hierarchy tree:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while assembling command tree hierarchy."
    });
  }
};
