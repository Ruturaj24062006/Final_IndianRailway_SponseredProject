'use strict';

const { runFullEngine, getEngineStatus } = require('../utils/workflowEngine');
const pool = require('../config/db');

/**
 * POST /api/workflow/engine/trigger
 * Fire-and-forget engine trigger. Does NOT await engine completion.
 * Roles: Super Admin, AOM
 */
exports.triggerEngine = async (req, res) => {
  const status = getEngineStatus();
  if (status.isRunning) {
    return res.status(409).json({
      success: false,
      message: 'Engine is already running. Please wait for the current run to complete.',
      lastRunAt: status.lastRunAt
    });
  }

  // Fire-and-forget
  const triggeredAt = new Date().toISOString();
  setImmediate(() => {
    runFullEngine().catch(err =>
      console.error('[WorkflowEngine] Manual trigger run failed:', err.message)
    );
  });

  // Audit log the manual trigger
  try {
    const actorRes = await pool.query('SELECT id FROM employees WHERE UPPER(hrms_id) = $1', [req.user.hrms_id.toUpperCase()]);
    const actorId = actorRes.rows[0]?.id || null;
    await pool.query(
      `INSERT INTO audit_logs (action, module_name, performed_by, remarks, severity, created_at)
       VALUES ('WORKFLOW_MANUAL_TRIGGER', 'WorkflowEngine', $1, $2, 'INFO', NOW())`,
      [actorId, `Workflow engine manually triggered by ${req.user.hrms_id} at ${triggeredAt}.`]
    );
  } catch (_) {}

  return res.status(200).json({
    success: true,
    message: 'Workflow engine triggered successfully. Running in background.',
    triggered_at: triggeredAt
  });
};

/**
 * GET /api/workflow/engine/status
 * Returns in-memory engine state and last 10 run history.
 * Roles: Super Admin, AOM
 */
exports.getEngineStatus = (req, res) => {
  return res.status(200).json({
    success: true,
    data: getEngineStatus()
  });
};

/**
 * GET /api/workflow/stats
 * Aggregated open/pending counts from DB.
 * Roles: TI, AOM, Super Admin, SR.DOM
 */
exports.getWorkflowStats = async (req, res) => {
  try {
    const [escRes, recRes] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'Open') AS open_count,
          COUNT(*) FILTER (WHERE status = 'Acknowledged') AS acknowledged_count,
          COUNT(*) FILTER (WHERE status = 'Resolved') AS resolved_count,
          COUNT(*) FILTER (WHERE priority = 'Critical' AND status IN ('Open','Acknowledged')) AS critical_open,
          COUNT(*) FILTER (WHERE priority = 'High' AND status IN ('Open','Acknowledged')) AS high_open,
          COUNT(*) FILTER (WHERE priority = 'Medium' AND status IN ('Open','Acknowledged')) AS medium_open,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') AS created_last_24h,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS created_last_7d
        FROM workflow_escalations
      `),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'Pending') AS pending_count,
          COUNT(*) FILTER (WHERE status = 'In Progress') AS in_progress_count,
          COUNT(*) FILTER (WHERE status = 'Completed') AS completed_count,
          COUNT(*) FILTER (WHERE priority = 'Critical' AND status IN ('Pending','In Progress')) AS critical_open,
          COUNT(*) FILTER (WHERE priority = 'High' AND status IN ('Pending','In Progress')) AS high_open,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') AS created_last_24h,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS created_last_7d
        FROM workflow_recommendations
      `)
    ]);

    return res.status(200).json({
      success: true,
      data: {
        escalations: escRes.rows[0],
        recommendations: recRes.rows[0],
        engine: getEngineStatus()
      }
    });

  } catch (err) {
    console.error('getWorkflowStats error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching workflow stats', error: err.message });
  }
};

/**
 * GET /api/workflow/dashboard
 * Aggregated data for Phase 19 Step 3 dashboard integration.
 * Returns escalation breakdown, recommendation breakdown, recent activity, and engine state.
 * Roles: TI, AOM, Super Admin, SR.DOM, Station Master
 */
exports.getWorkflowDashboard = async (req, res) => {
  try {
    const [
      escBreakdownRes,
      recBreakdownRes,
      recentEscRes,
      recentRecRes,
      escTypeRes,
      recTypeRes
    ] = await Promise.all([

      // Escalation counts by status
      pool.query(`
        SELECT status, COUNT(*) AS count
        FROM workflow_escalations
        GROUP BY status ORDER BY status
      `),

      // Recommendation counts by status
      pool.query(`
        SELECT status, COUNT(*) AS count
        FROM workflow_recommendations
        GROUP BY status ORDER BY status
      `),

      // 5 most recent escalations (Open/Acknowledged)
      pool.query(`
        SELECT we.id, we.escalation_type, we.priority, we.status,
          we.days_overdue, we.created_at,
          e.full_name AS employee_name, e.hrms_id
        FROM workflow_escalations we
        JOIN employees e ON we.employee_id = e.id
        WHERE we.status IN ('Open', 'Acknowledged')
        ORDER BY CASE we.priority WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END,
          we.created_at DESC
        LIMIT 5
      `),

      // 5 most recent recommendations (Pending/In Progress)
      pool.query(`
        SELECT wr.id, wr.recommendation_type, wr.priority, wr.status,
          wr.title, wr.due_date, wr.created_at,
          e.full_name AS employee_name, e.hrms_id
        FROM workflow_recommendations wr
        JOIN employees e ON wr.employee_id = e.id
        WHERE wr.status IN ('Pending', 'In Progress')
        ORDER BY CASE wr.priority WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END,
          wr.created_at DESC
        LIMIT 5
      `),

      // Escalation count by type (open only)
      pool.query(`
        SELECT escalation_type, COUNT(*) AS count
        FROM workflow_escalations
        WHERE status IN ('Open', 'Acknowledged')
        GROUP BY escalation_type ORDER BY count DESC
      `),

      // Recommendation count by type (active only)
      pool.query(`
        SELECT recommendation_type, COUNT(*) AS count
        FROM workflow_recommendations
        WHERE status IN ('Pending', 'In Progress')
        GROUP BY recommendation_type ORDER BY count DESC
      `)
    ]);

    return res.status(200).json({
      success: true,
      data: {
        escalation_by_status: escBreakdownRes.rows,
        recommendation_by_status: recBreakdownRes.rows,
        escalation_by_type: escTypeRes.rows,
        recommendation_by_type: recTypeRes.rows,
        recent_escalations: recentEscRes.rows,
        recent_recommendations: recentRecRes.rows,
        engine: getEngineStatus()
      }
    });

  } catch (err) {
    console.error('getWorkflowDashboard error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching dashboard data', error: err.message });
  }
};
