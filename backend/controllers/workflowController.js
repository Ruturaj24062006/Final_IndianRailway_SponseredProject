'use strict';

const pool = require('../config/db');

// ─── Validation Helpers ───────────────────────────────────────────────────────

const VALID_ESC_STATUSES = ['Open', 'Acknowledged', 'Resolved', 'Dismissed'];
const VALID_REC_STATUSES  = ['Pending', 'In Progress', 'Completed', 'Cancelled', 'Deferred'];
const VALID_PRIORITIES    = ['Low', 'Medium', 'High', 'Critical'];

// Resolve Pointsman's employee UUID from their HRMS ID
async function resolvePointsmanId(hrmsId) {
  const res = await pool.query(
    'SELECT id FROM employees WHERE UPPER(hrms_id) = $1',
    [hrmsId.toUpperCase()]
  );
  return res.rows[0]?.id || null;
}

// ─── ESCALATIONS ──────────────────────────────────────────────────────────────

/**
 * GET /api/workflow/escalations
 * Filters: employee_id, status, priority, escalation_type, from_date, to_date, page, limit
 * Pointsman role: blocked (403 enforced at route level via hasRole)
 */
exports.getEscalations = async (req, res) => {
  try {
    const {
      employee_id = '', status = '', priority = '', escalation_type = '',
      from_date = '', to_date = '',
      page = 1, limit = 20
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const where = ['1=1'];
    const vals = [];
    let p = 1;

    if (employee_id) { where.push(`we.employee_id = $${p++}::uuid`); vals.push(employee_id); }
    if (status && VALID_ESC_STATUSES.includes(status)) { where.push(`we.status = $${p++}`); vals.push(status); }
    if (priority && VALID_PRIORITIES.includes(priority)) { where.push(`we.priority = $${p++}`); vals.push(priority); }
    if (escalation_type) { where.push(`we.escalation_type = $${p++}`); vals.push(escalation_type); }
    if (from_date) { where.push(`we.created_at >= $${p++}::timestamp`); vals.push(from_date + ' 00:00:00'); }
    if (to_date)   { where.push(`we.created_at <= $${p++}::timestamp`); vals.push(to_date + ' 23:59:59'); }

    const whereStr = where.join(' AND ');

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM workflow_escalations we WHERE ${whereStr}`,
      vals
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const dataRes = await pool.query(`
      SELECT
        we.id, we.escalation_type, we.source_table, we.source_record_id,
        we.priority, we.status, we.escalation_reason, we.due_date, we.days_overdue,
        we.resolved_at, we.resolution_notes, we.created_at, we.updated_at,
        e.full_name AS employee_name, e.hrms_id AS employee_hrms, e.designation,
        sup.full_name AS escalated_to_name, sup.designation AS escalated_to_role,
        res.full_name AS resolved_by_name
      FROM workflow_escalations we
      JOIN employees e ON we.employee_id = e.id
      LEFT JOIN employees sup ON we.escalated_to = sup.id
      LEFT JOIN employees res ON we.resolved_by = res.id
      WHERE ${whereStr}
      ORDER BY
        CASE we.priority WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END,
        we.created_at DESC
      LIMIT $${p} OFFSET $${p + 1}
    `, [...vals, limitNum, offset]);

    return res.status(200).json({
      success: true,
      data: dataRes.rows,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) || 1 }
    });

  } catch (err) {
    console.error('getEscalations error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching escalations', error: err.message });
  }
};

/**
 * GET /api/workflow/escalations/:id
 */
exports.getEscalation = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT
        we.*,
        e.full_name AS employee_name, e.hrms_id, e.designation, e.risk_level,
        s.station_name, s.station_code,
        sup.full_name AS escalated_to_name, sup.designation AS escalated_to_role,
        eby.full_name AS escalated_by_name,
        res.full_name AS resolved_by_name
      FROM workflow_escalations we
      JOIN employees e ON we.employee_id = e.id
      LEFT JOIN stations s ON e.station_id = s.id
      LEFT JOIN employees sup ON we.escalated_to = sup.id
      LEFT JOIN employees eby ON we.escalated_by = eby.id
      LEFT JOIN employees res ON we.resolved_by = res.id
      WHERE we.id = $1
    `, [id]);

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Escalation not found' });
    }
    return res.status(200).json({ success: true, data: result.rows[0] });

  } catch (err) {
    console.error('getEscalation error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching escalation', error: err.message });
  }
};

/**
 * PUT /api/workflow/escalations/:id
 * Accepted: status, resolution_notes, resolved_by
 */
exports.updateEscalation = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution_notes, resolved_by } = req.body;

    // Validate escalation exists
    const existing = await pool.query('SELECT * FROM workflow_escalations WHERE id = $1', [id]);
    if (!existing.rows.length) {
      return res.status(404).json({ success: false, message: 'Escalation not found' });
    }

    if (status && !VALID_ESC_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${VALID_ESC_STATUSES.join(', ')}`
      });
    }

    const sets = ['updated_at = NOW()'];
    const vals = [];
    let p = 1;

    if (status) {
      sets.push(`status = $${p++}`);
      vals.push(status);
      if (status === 'Resolved') {
        sets.push(`resolved_at = NOW()`);
        if (resolved_by) { sets.push(`resolved_by = $${p++}::uuid`); vals.push(resolved_by); }
      }
    }
    if (resolution_notes !== undefined) { sets.push(`resolution_notes = $${p++}`); vals.push(resolution_notes); }

    vals.push(id);
    const updated = await pool.query(
      `UPDATE workflow_escalations SET ${sets.join(', ')} WHERE id = $${p} RETURNING *`,
      vals
    );

    // Write audit log
    try {
      const actorRes = await pool.query('SELECT id FROM employees WHERE UPPER(hrms_id) = $1', [req.user.hrms_id.toUpperCase()]);
      const actorId = actorRes.rows[0]?.id || null;
      await pool.query(
        `INSERT INTO audit_logs (employee_id, action, module_name, performed_by, remarks, severity, created_at)
         VALUES ($1, $2, 'WorkflowEscalations', $3, $4, 'INFO', NOW())`,
        [
          existing.rows[0].employee_id,
          status === 'Resolved' ? 'ESCALATION_RESOLVED' : 'ESCALATION_UPDATED',
          actorId,
          `Escalation #${id} updated to status '${status || existing.rows[0].status}'.`
        ]
      );
    } catch (_) {}

    return res.status(200).json({ success: true, data: updated.rows[0] });

  } catch (err) {
    console.error('updateEscalation error:', err);
    return res.status(500).json({ success: false, message: 'Error updating escalation', error: err.message });
  }
};

// ─── RECOMMENDATIONS ──────────────────────────────────────────────────────────

/**
 * GET /api/workflow/recommendations
 * Pointsman: sees only own recommendations.
 * Filters: employee_id, status, priority, recommendation_type, assigned_to, from_date, to_date, page, limit
 */
exports.getRecommendations = async (req, res) => {
  try {
    const {
      employee_id = '', status = '', priority = '', recommendation_type = '',
      assigned_to = '', from_date = '', to_date = '',
      page = 1, limit = 20
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const where = ['1=1'];
    const vals = [];
    let p = 1;

    // Pointsman restriction: scope to own employee_id only
    const userRole = (req.user.designation || '').trim().toLowerCase();
    if (userRole === 'pointsman') {
      const myId = await resolvePointsmanId(req.user.hrms_id);
      if (!myId) return res.status(404).json({ success: false, message: 'Employee profile not found.' });
      where.push(`wr.employee_id = $${p++}::uuid`);
      vals.push(myId);
    } else {
      if (employee_id) { where.push(`wr.employee_id = $${p++}::uuid`); vals.push(employee_id); }
    }

    if (status && VALID_REC_STATUSES.includes(status)) { where.push(`wr.status = $${p++}`); vals.push(status); }
    if (priority && VALID_PRIORITIES.includes(priority)) { where.push(`wr.priority = $${p++}`); vals.push(priority); }
    if (recommendation_type) { where.push(`wr.recommendation_type = $${p++}`); vals.push(recommendation_type); }
    if (assigned_to) { where.push(`wr.assigned_to = $${p++}::uuid`); vals.push(assigned_to); }
    if (from_date) { where.push(`wr.created_at >= $${p++}::timestamp`); vals.push(from_date + ' 00:00:00'); }
    if (to_date)   { where.push(`wr.created_at <= $${p++}::timestamp`); vals.push(to_date + ' 23:59:59'); }

    const whereStr = where.join(' AND ');

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM workflow_recommendations wr WHERE ${whereStr}`,
      vals
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const dataRes = await pool.query(`
      SELECT
        wr.id, wr.recommendation_type, wr.priority, wr.status, wr.title,
        wr.description, wr.source, wr.due_date, wr.risk_score_at_creation,
        wr.completed_at, wr.completion_notes, wr.created_at, wr.updated_at,
        e.full_name AS employee_name, e.hrms_id AS employee_hrms, e.designation,
        asgn.full_name AS assigned_to_name, asgn.designation AS assigned_to_role,
        comp.full_name AS completed_by_name
      FROM workflow_recommendations wr
      JOIN employees e ON wr.employee_id = e.id
      LEFT JOIN employees asgn ON wr.assigned_to = asgn.id
      LEFT JOIN employees comp ON wr.completed_by = comp.id
      WHERE ${whereStr}
      ORDER BY
        CASE wr.priority WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END,
        wr.created_at DESC
      LIMIT $${p} OFFSET $${p + 1}
    `, [...vals, limitNum, offset]);

    return res.status(200).json({
      success: true,
      data: dataRes.rows,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) || 1 }
    });

  } catch (err) {
    console.error('getRecommendations error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching recommendations', error: err.message });
  }
};

/**
 * GET /api/workflow/recommendations/:id
 * Pointsman: can only see own.
 */
exports.getRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT
        wr.*,
        e.full_name AS employee_name, e.hrms_id, e.designation, e.risk_level,
        s.station_name, s.station_code,
        asgn.full_name AS assigned_to_name, asgn.designation AS assigned_to_role,
        gen.full_name AS generated_by_name,
        comp.full_name AS completed_by_name
      FROM workflow_recommendations wr
      JOIN employees e ON wr.employee_id = e.id
      LEFT JOIN stations s ON e.station_id = s.id
      LEFT JOIN employees asgn ON wr.assigned_to = asgn.id
      LEFT JOIN employees gen ON wr.generated_by = gen.id
      LEFT JOIN employees comp ON wr.completed_by = comp.id
      WHERE wr.id = $1
    `, [id]);

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Recommendation not found' });
    }

    // Pointsman restriction
    const userRole = (req.user.designation || '').trim().toLowerCase();
    if (userRole === 'pointsman') {
      const myId = await resolvePointsmanId(req.user.hrms_id);
      if (result.rows[0].employee_id !== myId) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    return res.status(200).json({ success: true, data: result.rows[0] });

  } catch (err) {
    console.error('getRecommendation error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching recommendation', error: err.message });
  }
};

/**
 * PUT /api/workflow/recommendations/:id
 * Accepted: status, completion_notes, completed_by
 */
exports.updateRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, completion_notes, completed_by } = req.body;

    const existing = await pool.query('SELECT * FROM workflow_recommendations WHERE id = $1', [id]);
    if (!existing.rows.length) {
      return res.status(404).json({ success: false, message: 'Recommendation not found' });
    }

    if (status && !VALID_REC_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${VALID_REC_STATUSES.join(', ')}`
      });
    }

    const sets = ['updated_at = NOW()'];
    const vals = [];
    let p = 1;

    if (status) {
      sets.push(`status = $${p++}`);
      vals.push(status);
      if (status === 'Completed') {
        sets.push(`completed_at = NOW()`);
        if (completed_by) { sets.push(`completed_by = $${p++}::uuid`); vals.push(completed_by); }
      }
    }
    if (completion_notes !== undefined) { sets.push(`completion_notes = $${p++}`); vals.push(completion_notes); }

    vals.push(id);
    const updated = await pool.query(
      `UPDATE workflow_recommendations SET ${sets.join(', ')} WHERE id = $${p} RETURNING *`,
      vals
    );

    // Audit log
    try {
      const actorRes = await pool.query('SELECT id FROM employees WHERE UPPER(hrms_id) = $1', [req.user.hrms_id.toUpperCase()]);
      const actorId = actorRes.rows[0]?.id || null;
      await pool.query(
        `INSERT INTO audit_logs (employee_id, action, module_name, performed_by, remarks, severity, created_at)
         VALUES ($1, $2, 'WorkflowRecommendations', $3, $4, 'INFO', NOW())`,
        [
          existing.rows[0].employee_id,
          status === 'Completed' ? 'RECOMMENDATION_COMPLETED' : 'RECOMMENDATION_UPDATED',
          actorId,
          `Recommendation #${id} updated to status '${status || existing.rows[0].status}'.`
        ]
      );
    } catch (_) {}

    return res.status(200).json({ success: true, data: updated.rows[0] });

  } catch (err) {
    console.error('updateRecommendation error:', err);
    return res.status(500).json({ success: false, message: 'Error updating recommendation', error: err.message });
  }
};

/**
 * POST /api/workflow/recommendations
 * Manual creation by TI/AOM/Admin.
 */
exports.createRecommendation = async (req, res) => {
  try {
    const {
      employee_id, recommendation_type, priority = 'Medium', title,
      description, assigned_to, due_date, risk_score_at_creation
    } = req.body;

    if (!employee_id || !recommendation_type || !title) {
      return res.status(400).json({
        success: false,
        message: 'employee_id, recommendation_type, and title are required.'
      });
    }

    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ success: false, message: `Invalid priority. Allowed: ${VALID_PRIORITIES.join(', ')}` });
    }

    // Resolve actor UUID
    const actorRes = await pool.query('SELECT id FROM employees WHERE UPPER(hrms_id) = $1', [req.user.hrms_id.toUpperCase()]);
    const actorId = actorRes.rows[0]?.id || null;

    const result = await pool.query(`
      INSERT INTO workflow_recommendations
        (employee_id, recommendation_type, priority, status, title, description,
         source, generated_by, assigned_to, risk_score_at_creation, due_date, created_at, updated_at)
      VALUES ($1, $2, $3, 'Pending', $4, $5, 'MANUAL', $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `, [
      employee_id, recommendation_type, priority, title,
      description || null, actorId, assigned_to || null,
      risk_score_at_creation || null, due_date || null
    ]);

    // Audit log
    try {
      await pool.query(
        `INSERT INTO audit_logs (employee_id, action, module_name, performed_by, remarks, severity, created_at)
         VALUES ($1, 'RECOMMENDATION_CREATED', 'WorkflowRecommendations', $2, $3, 'INFO', NOW())`,
        [employee_id, actorId, `Manual recommendation created by ${req.user.hrms_id}: '${title}'.`]
      );
    } catch (_) {}

    return res.status(201).json({ success: true, data: result.rows[0] });

  } catch (err) {
    console.error('createRecommendation error:', err);
    return res.status(500).json({ success: false, message: 'Error creating recommendation', error: err.message });
  }
};

/**
 * GET /api/workflow/my-recommendations
 * Optimized for Pointsman role. Returns only active/assigned recommendations for logged in user.
 */
exports.getMyRecommendations = async (req, res) => {
  try {
    const myId = await resolvePointsmanId(req.user.hrms_id);
    if (!myId) {
      return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    }

    const { status = '', priority = '', page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const where = ['wr.employee_id = $1'];
    const vals = [myId];
    let p = 2;

    if (status && VALID_REC_STATUSES.includes(status)) {
      where.push(`wr.status = $${p++}`);
      vals.push(status);
    }
    if (priority && VALID_PRIORITIES.includes(priority)) {
      where.push(`wr.priority = $${p++}`);
      vals.push(priority);
    }

    const whereStr = where.join(' AND ');

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM workflow_recommendations wr WHERE ${whereStr}`,
      vals
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const dataRes = await pool.query(`
      SELECT
        wr.id, wr.recommendation_type, wr.priority, wr.status, wr.title,
        wr.description, wr.source, wr.due_date, wr.risk_score_at_creation,
        wr.completed_at, wr.completion_notes, wr.created_at, wr.updated_at,
        e.full_name AS employee_name, e.hrms_id AS employee_hrms, e.designation,
        asgn.full_name AS assigned_to_name, asgn.designation AS assigned_to_role
      FROM workflow_recommendations wr
      JOIN employees e ON wr.employee_id = e.id
      LEFT JOIN employees asgn ON wr.assigned_to = asgn.id
      WHERE ${whereStr}
      ORDER BY
        CASE wr.priority WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END,
        wr.created_at DESC
      LIMIT $${p} OFFSET $${p + 1}
    `, [...vals, limitNum, offset]);

    return res.status(200).json({
      success: true,
      data: dataRes.rows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (err) {
    console.error('getMyRecommendations error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching my recommendations', error: err.message });
  }
};

