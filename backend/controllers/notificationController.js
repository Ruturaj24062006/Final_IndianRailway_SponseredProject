const pool = require("../config/db");

/**
 * Helper to check role-specific base WHERE clause & parameters
 */
async function getRoleVisibilityQuery(user, filterIsRead = null, filterCategory = null) {
  const role = (user.designation || "").trim().toLowerCase();
  
  // Resolve employee database UUID and station_id
  const empRes = await pool.query(
    "SELECT id, station_id FROM employees WHERE UPPER(hrms_id) = $1", 
    [user.hrms_id.toUpperCase()]
  );
  if (empRes.rows.length === 0) {
    return null;
  }
  const dbUser = empRes.rows[0];

  let queryText = "";
  let params = [];
  let paramIdx = 1;

  if (role === "pointsman") {
    // Pointsman sees their own notifications
    queryText = `
      SELECT n.*, e.full_name AS employee_name, s.station_name, s.station_code
      FROM notifications n
      LEFT JOIN employees e ON n.employee_id = e.id
      LEFT JOIN stations s ON e.station_id = s.id
      WHERE n.employee_id = $${paramIdx}
    `;
    params.push(dbUser.id);
    paramIdx++;
  } else if (role === "station master") {
    // Station Master sees notifications for active Pointsmen at their station, or alerts targeting SM role at their station
    queryText = `
      SELECT n.*, e.full_name AS employee_name, s.station_name, s.station_code
      FROM notifications n
      JOIN employees e ON n.employee_id = e.id
      LEFT JOIN stations s ON e.station_id = s.id
      WHERE e.station_id = $${paramIdx} AND e.status = 'Active'
    `;
    params.push(dbUser.station_id);
    paramIdx++;
  } else if (role === "traffic inspector") {
    // Traffic Inspector sees notifications for Pointsmen at their station, or alerts targeting TI role
    queryText = `
      SELECT n.*, e.full_name AS employee_name, s.station_name, s.station_code
      FROM notifications n
      LEFT JOIN employees e ON n.employee_id = e.id
      LEFT JOIN stations s ON e.station_id = s.id
      WHERE e.station_id IN (SELECT station_id FROM employees WHERE id = $${paramIdx})
         OR n.target_role = 'Traffic Inspector'
         OR n.category IN ('Assessment Pending', 'Approval Pending')
    `;
    params.push(dbUser.id);
    paramIdx++;
  } else {
    // AOM & Super Admin see all notifications
    queryText = `
      SELECT n.*, e.full_name AS employee_name, s.station_name, s.station_code
      FROM notifications n
      LEFT JOIN employees e ON n.employee_id = e.id
      LEFT JOIN stations s ON e.station_id = s.id
      WHERE 1=1
    `;
  }

  // Filter by is_read
  if (filterIsRead !== null) {
    queryText += ` AND n.is_read = $${paramIdx}`;
    params.push(filterIsRead === "true" || filterIsRead === true);
    paramIdx++;
  }

  // Filter by category
  if (filterCategory && filterCategory !== "All") {
    queryText += ` AND n.category = $${paramIdx}`;
    params.push(filterCategory);
    paramIdx++;
  }

  return { queryText, params };
}

/**
 * GET /api/notifications
 * Fetch notifications matching the user's role and filters (without running heavy scans).
 */
exports.getNotifications = async (req, res) => {
  try {
    const { is_read, category } = req.query;
    const visibility = await getRoleVisibilityQuery(req.user, is_read, category);
    
    if (!visibility) {
      return res.status(404).json({ success: false, message: "User profile not found" });
    }

    const finalQuery = visibility.queryText + " ORDER BY n.created_at DESC";
    const result = await pool.query(finalQuery, visibility.params);

    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching notifications",
      error: error.message
    });
  }
};

/**
 * GET /api/notifications/unread-count
 * Returns count of unread notifications matching the user's visibility scope.
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const visibility = await getRoleVisibilityQuery(req.user, true); // filters for is_read = false
    
    if (!visibility) {
      return res.status(404).json({ success: false, message: "User profile not found" });
    }

    // Replace SELECT n.* with SELECT COUNT(n.id)
    const countQuery = visibility.queryText.replace(
      "SELECT n.*, e.full_name AS employee_name, s.station_name, s.station_code",
      "SELECT COUNT(n.id) AS unread_count"
    );

    // Filter out the is_read parameter we forced
    // Since we forced is_read = true in getRoleVisibilityQuery, it filtered for read.
    // Let's rewrite visibility query cleanly for unread (is_read = false)
    const visibilityUnread = await getRoleVisibilityQuery(req.user, false);
    const unreadCountQuery = visibilityUnread.queryText.replace(
      "SELECT n.*, e.full_name AS employee_name, s.station_name, s.station_code",
      "SELECT COUNT(n.id) AS unread_count"
    );

    const result = await pool.query(unreadCountQuery, visibilityUnread.params);
    const count = parseInt(result.rows[0].unread_count, 10);

    return res.status(200).json({
      success: true,
      data: { unread_count: count }
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching unread count",
      error: error.message
    });
  }
};

/**
 * PUT /api/notifications/:id/read
 * Mark a specific notification as read.
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE notifications
      SET is_read = true, read_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error marking notification read:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error marking notification read",
      error: error.message
    });
  }
};

/**
 * POST /api/notifications/read-all
 * Mark all unread notifications visible to the user as read.
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const visibility = await getRoleVisibilityQuery(req.user, false);
    
    if (!visibility) {
      return res.status(404).json({ success: false, message: "User profile not found" });
    }

    // Get IDs of unread notifications visible to this user
    const idsQuery = visibility.queryText.replace(
      "SELECT n.*, e.full_name AS employee_name, s.station_name, s.station_code",
      "SELECT n.id"
    );

    const idsRes = await pool.query(idsQuery, visibility.params);
    const unreadIds = idsRes.rows.map(r => r.id);

    if (unreadIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No unread notifications to update"
      });
    }

    const updateQuery = `
      UPDATE notifications
      SET is_read = true, read_at = NOW()
      WHERE id = ANY($1::bigint[])
    `;
    await pool.query(updateQuery, [unreadIds]);

    return res.status(200).json({
      success: true,
      message: `Marked ${unreadIds.length} notifications as read`
    });
  } catch (error) {
    console.error("Error marking all read:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error marking all read",
      error: error.message
    });
  }
};

/**
 * DELETE /api/notifications/:id
 * Delete/archive a specific notification.
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM notifications WHERE id = $1 RETURNING *", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error deleting notification",
      error: error.message
    });
  }
};

/**
 * POST /api/notifications/sync
 * Run the compliance rules scan and write new notifications (with 30-day cooldown).
 */
exports.syncNotifications = async (req, res) => {
  try {
    // 1. CBT Pending
    const cbtPendingQuery = `
      SELECT e.id AS employee_id, e.full_name, e.hrms_id, e.designation
      FROM employees e
      LEFT JOIN (
        SELECT DISTINCT ON (employee_id) employee_id, result
        FROM exam_attempts
        WHERE status = 'Completed'
        ORDER BY employee_id, created_at DESC
      ) cbt ON e.id = cbt.employee_id
      WHERE (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN') 
        AND e.status = 'Active'
        AND (cbt.result IS NULL OR cbt.result != 'PASSED')
    `;
    const cbtPendingRes = await pool.query(cbtPendingQuery);

    // 2. PME Statuses
    const pmeQuery = `
      WITH latest_pme AS (
        SELECT DISTINCT ON (employee_id) employee_id, next_due_date
        FROM pme_records
        ORDER BY employee_id, pme_date DESC, id DESC
      )
      SELECT 
        e.id AS employee_id, e.full_name, e.hrms_id, e.designation, lp.next_due_date,
        CASE 
          WHEN lp.next_due_date IS NULL THEN 'Expired'
          WHEN lp.next_due_date < CURRENT_DATE THEN 'Expired'
          WHEN lp.next_due_date >= CURRENT_DATE AND lp.next_due_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'Due'
          ELSE 'Valid'
        END AS pme_status
      FROM employees e
      LEFT JOIN latest_pme lp ON e.id = lp.employee_id
      WHERE (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN') AND e.status = 'Active'
    `;
    const pmeRes = await pool.query(pmeQuery);

    // 3. Refresher Statuses
    const refQuery = `
      WITH latest_ref AS (
        SELECT DISTINCT ON (employee_id) employee_id, next_due_date
        FROM ref_records
        ORDER BY employee_id, ref_date DESC, id DESC
      )
      SELECT 
        e.id AS employee_id, e.full_name, e.hrms_id, e.designation, lr.next_due_date,
        CASE 
          WHEN lr.next_due_date IS NULL THEN 'Expired'
          WHEN lr.next_due_date < CURRENT_DATE THEN 'Expired'
          WHEN lr.next_due_date >= CURRENT_DATE AND lr.next_due_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'Due'
          ELSE 'Valid'
        END AS ref_status
      FROM employees e
      LEFT JOIN latest_ref lr ON e.id = lr.employee_id
      WHERE (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN') AND e.status = 'Active'
    `;
    const refRes = await pool.query(refQuery);

    // 4. High Risk Employees
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
      SELECT e.id AS employee_id, e.full_name, e.hrms_id, e.designation
      FROM employees e
      LEFT JOIN latest_pme pme ON e.id = pme.employee_id
      LEFT JOIN latest_ref ref ON e.id = ref.employee_id
      LEFT JOIN latest_result res ON e.id = res.employee_id
      WHERE (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN') AND e.status = 'Active'
        AND (
          (pme.next_due_date IS NULL OR pme.next_due_date < CURRENT_DATE) 
          OR (ref.next_due_date IS NULL OR ref.next_due_date < CURRENT_DATE) 
          OR (res.final_score < 50)
        )
    `;
    const riskRes = await pool.query(riskQuery);

    // 5. Category D Employees
    const catQuery = `
      SELECT id AS employee_id, full_name, hrms_id, designation
      FROM employees
      WHERE (role_id = 1 OR UPPER(designation) = 'POINTSMAN') AND status = 'Active' AND category_grade = 'D'
    `;
    const catRes = await pool.query(catQuery);

    // 1. Fetch recent notifications (last 30 days) to prevent duplicate checks in a loop
    const recentRes = await pool.query(
      "SELECT employee_id, category FROM notifications WHERE created_at > NOW() - INTERVAL '30 days'"
    );
    const recentSet = new Set();
    for (const r of recentRes.rows) {
      if (r.employee_id) {
        recentSet.add(`${r.employee_id}_${r.category}`);
      }
    }

    let createdCount = 0;

    // Helper to insert unique notification with 30-day cooldown using in-memory set
    const writeNotification = async (empId, title, message, category, targetRole = null) => {
      const key = `${empId}_${category}`;
      if (!recentSet.has(key)) {
        await pool.query(
          `INSERT INTO notifications (employee_id, title, message, category, target_role, is_read, created_at)
           VALUES ($1, $2, $3, $4, $5, false, NOW())`,
          [empId, title, message, category, targetRole]
        );
        recentSet.add(key); // Prevent duplicate insertion in same sync run
        createdCount++;
      }
    };

    // CBT Pending writes
    for (const row of cbtPendingRes.rows) {
      await writeNotification(
        row.employee_id,
        "Safety Alert: CBT Exam Pending",
        `Employee ${row.full_name} (${row.hrms_id}) has no completed CBT Safety exam.`,
        "CBT Pending",
        "Pointsman"
      );
    }

    // PME Due / Expired writes
    for (const row of pmeRes.rows) {
      if (row.pme_status === "Expired") {
        await writeNotification(
          row.employee_id,
          "Safety Alert: PME Clearance Expired",
          `Employee ${row.full_name} (${row.hrms_id}) has an expired or missing Periodic Medical Exam (PME).`,
          "PME Expired"
        );
      } else if (row.pme_status === "Due") {
        await writeNotification(
          row.employee_id,
          "Safety Warning: PME Due Soon",
          `Employee ${row.full_name} (${row.hrms_id}) has a PME due soon on ${row.next_due_date}.`,
          "PME Due",
          "Pointsman"
        );
      }
    }

    // REF Due / Expired writes
    for (const row of refRes.rows) {
      if (row.ref_status === "Expired") {
        await writeNotification(
          row.employee_id,
          "Safety Alert: Refresher Safety Training Expired",
          `Employee ${row.full_name} (${row.hrms_id}) is overdue for Refresher Safety Training.`,
          "REF Expired"
        );
      } else if (row.ref_status === "Due") {
        await writeNotification(
          row.employee_id,
          "Safety Warning: Refresher Safety Training Due Soon",
          `Employee ${row.full_name} (${row.hrms_id}) has refresher safety training due soon on ${row.next_due_date}.`,
          "REF Due",
          "Pointsman"
        );
      }
    }

    // High Risk writes
    for (const row of riskRes.rows) {
      await writeNotification(
        row.employee_id,
        "Critical Warning: High Risk Staff Alert",
        `Employee ${row.full_name} (${row.hrms_id}) is flagged as High Risk due to compliance gaps.`,
        "High Risk Employee",
        "Station Master"
      );
    }

    // Category D writes
    for (const row of catRes.rows) {
      await writeNotification(
        row.employee_id,
        "Safety Warning: Category D Employee",
        `Employee ${row.full_name} (${row.hrms_id}) is classified as Category D (Requires counselling).`,
        "Category D Employee",
        "Station Master"
      );
    }

    return res.status(200).json({
      success: true,
      message: `Compliance notifications sync complete. Added ${createdCount} new alerts.`,
      synced_count: createdCount
    });

  } catch (error) {
    console.error("Error in compliance sync:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during compliance sync",
      error: error.message
    });
  }
};

