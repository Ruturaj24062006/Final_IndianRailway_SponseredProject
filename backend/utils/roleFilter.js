const pool = require("../config/db");

/**
 * Resolves the query filter scope based on the user's role.
 * @param {Object} user - Authenticated user object (req.user)
 * @returns {Promise<Object>} Scope filter definitions:
 *   - scope: "division" | "station" | "ti" | "own" | "none"
 *   - stationIds: Array of allowed station IDs (integers)
 *   - employeeIds: Array of allowed employee IDs (integers)
 *   - userId: Resolved employee database ID
 */
async function getRoleScope(user) {
  if (!user) {
    return {
      scope: "none",
      stationIds: [],
      employeeIds: [],
      userId: null
    };
  }

  const role = (user.designation || "").trim().toLowerCase();
  const cleanRole = role.replace(/\./g, "").replace(/\s+/g, "");
  const userId = user.id;

  // 1. Division Wide Roles
  if (
    cleanRole === "superadmin" || 
    cleanRole === "aom" || 
    cleanRole === "aomgeneral" || 
    cleanRole === "srdom"
  ) {
    return {
      scope: "division",
      stationIds: [], // division scope does not filter stations
      employeeIds: [],
      userId
    };
  }

  // 2. Station Level Roles (Station Master / Station Superintendent / Station Supervisor)
  if (
    role === "station master" || 
    role === "station superintendent" || 
    role === "station supervisor"
  ) {
    const stationId = user.station_id;
    return {
      scope: "station",
      stationIds: stationId ? [parseInt(stationId, 10)] : [],
      employeeIds: [],
      userId
    };
  }

  // 3. Traffic Inspector (Jurisdiction of subordinate stations + own station)
  if (role === "traffic inspector") {
    const stationIds = new Set();
    if (user.station_id) {
      stationIds.add(parseInt(user.station_id, 10));
    }

    try {
      const subRes = await pool.query(
        `SELECT DISTINCT e.station_id 
         FROM employees e
         JOIN employee_hierarchy h ON e.id = h.employee_id
         WHERE h.reporting_to = $1`,
        [userId]
      );
      for (const row of subRes.rows) {
        if (row.station_id) {
          stationIds.add(parseInt(row.station_id, 10));
        }
      }
    } catch (err) {
      console.error("Error fetching TI subordinate stations in getRoleScope:", err);
    }

    return {
      scope: "ti",
      stationIds: Array.from(stationIds),
      employeeIds: [],
      userId
    };
  }

  // 4. Individual Staff Level Roles (Pointsman, Train Manager, etc.)
  return {
    scope: "own",
    stationIds: user.station_id ? [parseInt(user.station_id, 10)] : [],
    employeeIds: userId ? [userId] : [],
    userId
  };
}

module.exports = { getRoleScope };
