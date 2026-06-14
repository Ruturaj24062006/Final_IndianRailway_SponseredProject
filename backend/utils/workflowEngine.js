'use strict';

const pool = require('../config/db');

// ─── In-Memory State ──────────────────────────────────────────────────────────
let isRunning = false;
const MAX_HISTORY = 10;
const runHistory = [];

const engineState = {
  lastRunAt: null,
  lastRunStatus: 'never',
  lastEscalationsCreated: 0,
  lastRecommendationsCreated: 0,
  lastAutoResolved: 0,
  lastAutoCompleted: 0,
  lastErrorMessage: null,
  totalRunCount: 0,
  isRunning: false
};

// ─── State Helpers ────────────────────────────────────────────────────────────

function recordRunResult(result) {
  runHistory.unshift(result);
  if (runHistory.length > MAX_HISTORY) runHistory.pop();
  engineState.lastRunAt = result.runAt;
  engineState.lastRunStatus = result.status;
  engineState.lastEscalationsCreated = result.escalationsCreated || 0;
  engineState.lastRecommendationsCreated = result.recommendationsCreated || 0;
  engineState.lastAutoResolved = result.autoResolved || 0;
  engineState.lastAutoCompleted = result.autoCompleted || 0;
  engineState.lastErrorMessage = result.error || null;
  engineState.totalRunCount++;
}

// ─── Audit Helper (within transaction) ───────────────────────────────────────

async function logEngineAudit(client, { action, remarks, severity = 'INFO', employeeId = null }) {
  try {
    await client.query(
      `INSERT INTO audit_logs (employee_id, action, module_name, performed_by, remarks, severity, created_at)
       VALUES ($1, $2, 'WorkflowEngine', NULL, $3, $4, NOW())`,
      [employeeId, action, remarks, severity]
    );
  } catch (err) {
    console.error('[WorkflowEngine] Audit write failed:', err.message);
  }
}

// ─── Fallback AOM Helper ──────────────────────────────────────────────────────

async function getFallbackAomId(client) {
  const res = await client.query(
    `SELECT id FROM employees WHERE role_id = 7 AND status = 'Active' ORDER BY created_at ASC LIMIT 1`
  );
  return res.rows[0]?.id || null;
}

// ─── AUTO-RESOLVE ENGINE ──────────────────────────────────────────────────────
// Resolves Open/Acknowledged escalations whose triggering condition has cleared.

async function runAutoResolve(client) {
  let total = 0;

  // E-1: PME_OVERDUE → resolve if PME renewed
  const r1 = await client.query(`
    UPDATE workflow_escalations we
    SET status = 'Resolved', resolved_at = NOW(),
        resolution_notes = 'Auto-resolved: PME renewed and no longer overdue.', updated_at = NOW()
    FROM (
      SELECT DISTINCT ON (employee_id) employee_id, next_due_date
      FROM pme_records ORDER BY employee_id, pme_date DESC, id DESC
    ) lp
    WHERE we.employee_id = lp.employee_id
      AND we.escalation_type = 'PME_OVERDUE'
      AND we.status IN ('Open', 'Acknowledged')
      AND lp.next_due_date >= CURRENT_DATE - INTERVAL '7 days'
  `);
  total += r1.rowCount;

  // E-2: REF_OVERDUE → resolve if REF renewed
  const r2 = await client.query(`
    UPDATE workflow_escalations we
    SET status = 'Resolved', resolved_at = NOW(),
        resolution_notes = 'Auto-resolved: Refresher training renewed and no longer overdue.', updated_at = NOW()
    FROM (
      SELECT DISTINCT ON (employee_id) employee_id, next_due_date
      FROM ref_records ORDER BY employee_id, ref_date DESC, id DESC
    ) lr
    WHERE we.employee_id = lr.employee_id
      AND we.escalation_type = 'REF_OVERDUE'
      AND we.status IN ('Open', 'Acknowledged')
      AND lr.next_due_date >= CURRENT_DATE - INTERVAL '7 days'
  `);
  total += r2.rowCount;

  // E-3: CBT_FAILED → resolve if latest CBT now PASSED
  const r3 = await client.query(`
    UPDATE workflow_escalations we
    SET status = 'Resolved', resolved_at = NOW(),
        resolution_notes = 'Auto-resolved: CBT examination passed.', updated_at = NOW()
    FROM (
      SELECT DISTINCT ON (employee_id) employee_id, result
      FROM exam_attempts WHERE status = 'Completed'
      ORDER BY employee_id, created_at DESC
    ) lc
    WHERE we.employee_id = lc.employee_id
      AND we.escalation_type = 'CBT_FAILED'
      AND we.status IN ('Open', 'Acknowledged')
      AND lc.result = 'PASSED'
  `);
  total += r3.rowCount;

  // E-4: CBT_NOT_ATTEMPTED → resolve if any attempt now exists
  const r4 = await client.query(`
    UPDATE workflow_escalations we
    SET status = 'Resolved', resolved_at = NOW(),
        resolution_notes = 'Auto-resolved: CBT examination attempt now on record.', updated_at = NOW()
    WHERE we.escalation_type = 'CBT_NOT_ATTEMPTED'
      AND we.status IN ('Open', 'Acknowledged')
      AND EXISTS (SELECT 1 FROM exam_attempts ea WHERE ea.employee_id = we.employee_id)
  `);
  total += r4.rowCount;

  // E-5: ASSESSMENT_OVERDUE → resolve if assessment now Approved or Rejected
  const r5 = await client.query(`
    UPDATE workflow_escalations we
    SET status = 'Resolved', resolved_at = NOW(),
        resolution_notes = 'Auto-resolved: Assessment has been actioned.', updated_at = NOW()
    FROM (
      SELECT DISTINCT ON (employee_id) employee_id, status
      FROM assessments ORDER BY employee_id, created_at DESC, id DESC
    ) la
    WHERE we.employee_id = la.employee_id
      AND we.escalation_type = 'ASSESSMENT_OVERDUE'
      AND we.status IN ('Open', 'Acknowledged')
      AND la.status IN ('Approved', 'Rejected')
  `);
  total += r5.rowCount;

  // E-6: ASSESSMENT_REJECTED_UNACTIONED → resolve if a new Pending/Submitted assessment exists
  const r6 = await client.query(`
    UPDATE workflow_escalations we
    SET status = 'Resolved', resolved_at = NOW(),
        resolution_notes = 'Auto-resolved: New assessment request has been created.', updated_at = NOW()
    WHERE we.escalation_type = 'ASSESSMENT_REJECTED_UNACTIONED'
      AND we.status IN ('Open', 'Acknowledged')
      AND EXISTS (
        SELECT 1 FROM assessments a
        WHERE a.employee_id = we.employee_id AND a.status IN ('Pending', 'Submitted')
      )
  `);
  total += r6.rowCount;

  // E-7: HIGH_RISK_UNADDRESSED → resolve if risk_level no longer High OR counselling opened
  const r7 = await client.query(`
    UPDATE workflow_escalations we
    SET status = 'Resolved', resolved_at = NOW(),
        resolution_notes = 'Auto-resolved: Risk condition addressed.', updated_at = NOW()
    FROM employees e
    WHERE we.employee_id = e.id
      AND we.escalation_type = 'HIGH_RISK_UNADDRESSED'
      AND we.status IN ('Open', 'Acknowledged')
      AND (
        e.risk_level != 'High'
        OR EXISTS (SELECT 1 FROM counselling_records cr WHERE cr.employee_id = e.id AND cr.status = 'Open')
      )
  `);
  total += r7.rowCount;

  // E-8: COUNSELLING_OVERDUE → resolve if the specific counselling record is now Closed
  const r8 = await client.query(`
    UPDATE workflow_escalations we
    SET status = 'Resolved', resolved_at = NOW(),
        resolution_notes = 'Auto-resolved: Counselling record has been closed.', updated_at = NOW()
    FROM counselling_records cr
    WHERE we.source_table = 'counselling_records'
      AND we.source_record_id = cr.id
      AND we.escalation_type = 'COUNSELLING_OVERDUE'
      AND we.status IN ('Open', 'Acknowledged')
      AND cr.status = 'Closed'
  `);
  total += r8.rowCount;

  return total;
}

// ─── AUTO-COMPLETE RECOMMENDATIONS ───────────────────────────────────────────
// Completes Pending/In Progress recommendations when their condition no longer applies.

async function runAutoComplete(client) {
  let total = 0;

  // R-2: PME_RENEWAL → complete if PME now valid
  const c1 = await client.query(`
    UPDATE workflow_recommendations wr
    SET status = 'Completed', completed_at = NOW(),
        completion_notes = 'Auto-completed: PME is now valid.', updated_at = NOW()
    FROM (
      SELECT DISTINCT ON (employee_id) employee_id, next_due_date
      FROM pme_records ORDER BY employee_id, pme_date DESC, id DESC
    ) lp
    WHERE wr.employee_id = lp.employee_id
      AND wr.recommendation_type = 'PME_RENEWAL'
      AND wr.status IN ('Pending', 'In Progress')
      AND lp.next_due_date >= CURRENT_DATE
  `);
  total += c1.rowCount;

  // R-3: REFRESHER_TRAINING → complete if REF now valid
  const c2 = await client.query(`
    UPDATE workflow_recommendations wr
    SET status = 'Completed', completed_at = NOW(),
        completion_notes = 'Auto-completed: Refresher training is now valid.', updated_at = NOW()
    FROM (
      SELECT DISTINCT ON (employee_id) employee_id, next_due_date
      FROM ref_records ORDER BY employee_id, ref_date DESC, id DESC
    ) lr
    WHERE wr.employee_id = lr.employee_id
      AND wr.recommendation_type = 'REFRESHER_TRAINING'
      AND wr.status IN ('Pending', 'In Progress')
      AND lr.next_due_date >= CURRENT_DATE
  `);
  total += c2.rowCount;

  // R-4: CBT_RETEST → complete if CBT now PASSED
  const c3 = await client.query(`
    UPDATE workflow_recommendations wr
    SET status = 'Completed', completed_at = NOW(),
        completion_notes = 'Auto-completed: CBT examination has been passed.', updated_at = NOW()
    FROM (
      SELECT DISTINCT ON (employee_id) employee_id, result
      FROM exam_attempts WHERE status = 'Completed'
      ORDER BY employee_id, created_at DESC
    ) lc
    WHERE wr.employee_id = lc.employee_id
      AND wr.recommendation_type = 'CBT_RETEST'
      AND wr.status IN ('Pending', 'In Progress')
      AND lc.result = 'PASSED'
  `);
  total += c3.rowCount;

  // R-1: COUNSELLING_REQUIRED → complete if risk not High AND no open counselling
  const c4 = await client.query(`
    UPDATE workflow_recommendations wr
    SET status = 'Completed', completed_at = NOW(),
        completion_notes = 'Auto-completed: Risk reduced and counselling addressed.', updated_at = NOW()
    FROM employees e
    WHERE wr.employee_id = e.id
      AND wr.recommendation_type = 'COUNSELLING_REQUIRED'
      AND wr.status IN ('Pending', 'In Progress')
      AND e.risk_level != 'High'
      AND NOT EXISTS (
        SELECT 1 FROM counselling_records cr WHERE cr.employee_id = e.id AND cr.status = 'Open'
      )
  `);
  total += c4.rowCount;

  // R-5: RISK_REVIEW → complete if not Category D AND no unactioned rejection
  const c5 = await client.query(`
    UPDATE workflow_recommendations wr
    SET status = 'Completed', completed_at = NOW(),
        completion_notes = 'Auto-completed: Risk review condition resolved.', updated_at = NOW()
    FROM employees e
    WHERE wr.employee_id = e.id
      AND wr.recommendation_type = 'RISK_REVIEW'
      AND wr.status IN ('Pending', 'In Progress')
      AND COALESCE(e.category_grade, '') != 'D'
      AND NOT EXISTS (
        SELECT 1 FROM assessments a
        WHERE a.employee_id = e.id AND a.status = 'Rejected'
          AND NOT EXISTS (
            SELECT 1 FROM assessments a2
            WHERE a2.employee_id = e.id AND a2.status IN ('Pending', 'Submitted')
              AND a2.created_at > a.created_at
          )
      )
  `);
  total += c5.rowCount;

  // R-6: WATCHLIST → complete if risk_level is no longer High/Medium
  const c6 = await client.query(`
    UPDATE workflow_recommendations wr
    SET status = 'Completed', completed_at = NOW(),
        completion_notes = 'Auto-completed: Multi-factor risk condition resolved.', updated_at = NOW()
    FROM employees e
    WHERE wr.employee_id = e.id
      AND wr.recommendation_type = 'WATCHLIST'
      AND wr.status IN ('Pending', 'In Progress')
      AND e.risk_level IN ('Low', 'Normal')
  `);
  total += c6.rowCount;

  return total;
}

// ─── ESCALATION ENGINE ────────────────────────────────────────────────────────

async function runEscalationEngine(client, fallbackAomId, runStartedAt) {
  let totalCreated = 0;
  const criticalItems = [];
  const aomId = fallbackAomId;

  async function execRule(sql, params) {
    const res = await client.query(sql, params || []);
    totalCreated += res.rowCount;
    for (const row of res.rows) {
      if (row.priority === 'Critical') criticalItems.push({ ...row, source: 'escalation' });
    }
    return res.rowCount;
  }

  // E-1: PME_OVERDUE
  await execRule(`
    WITH latest_pme AS (
      SELECT DISTINCT ON (employee_id) employee_id, id AS pme_id, next_due_date
      FROM pme_records ORDER BY employee_id, pme_date DESC, id DESC
    ),
    resolved_sup AS (
      SELECT e.id AS emp_id, COALESCE(eh.reporting_to, $1::uuid) AS sup_id
      FROM employees e
      LEFT JOIN employee_hierarchy eh ON e.id = eh.employee_id
      WHERE e.status = 'Active' AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
    )
    INSERT INTO workflow_escalations
      (employee_id, source_table, source_record_id, escalation_type, priority, status,
       escalated_to, escalation_reason, due_date, days_overdue, created_at, updated_at)
    SELECT
      e.id, 'pme_records', COALESCE(lp.pme_id, -1), 'PME_OVERDUE',
      CASE
        WHEN COALESCE((CURRENT_DATE - lp.next_due_date)::int, 999) >= 30 THEN 'Critical'
        WHEN COALESCE((CURRENT_DATE - lp.next_due_date)::int, 999) >= 14 THEN 'High'
        ELSE 'Medium'
      END,
      'Open', rs.sup_id,
      CASE
        WHEN lp.next_due_date IS NULL THEN 'No PME record on file. Immediate medical examination required.'
        ELSE 'PME expired ' || (CURRENT_DATE - lp.next_due_date) || ' days ago (due: ' || lp.next_due_date || ').'
      END,
      lp.next_due_date,
      COALESCE((CURRENT_DATE - lp.next_due_date)::int, 999),
      NOW(), NOW()
    FROM employees e
    LEFT JOIN latest_pme lp ON e.id = lp.employee_id
    JOIN resolved_sup rs ON e.id = rs.emp_id
    WHERE e.status = 'Active'
      AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
      AND (lp.next_due_date IS NULL OR lp.next_due_date < CURRENT_DATE - INTERVAL '7 days')
      AND NOT EXISTS (
        SELECT 1 FROM workflow_escalations we
        WHERE we.employee_id = e.id AND we.source_table = 'pme_records'
          AND we.escalation_type = 'PME_OVERDUE' AND we.status IN ('Open', 'Acknowledged')
      )
    ON CONFLICT DO NOTHING
    RETURNING id, priority, employee_id
  `, [aomId]);

  // E-2: REF_OVERDUE
  await execRule(`
    WITH latest_ref AS (
      SELECT DISTINCT ON (employee_id) employee_id, id AS ref_id, next_due_date
      FROM ref_records ORDER BY employee_id, ref_date DESC, id DESC
    ),
    resolved_sup AS (
      SELECT e.id AS emp_id, COALESCE(eh.reporting_to, $1::uuid) AS sup_id
      FROM employees e
      LEFT JOIN employee_hierarchy eh ON e.id = eh.employee_id
      WHERE e.status = 'Active' AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
    )
    INSERT INTO workflow_escalations
      (employee_id, source_table, source_record_id, escalation_type, priority, status,
       escalated_to, escalation_reason, due_date, days_overdue, created_at, updated_at)
    SELECT
      e.id, 'ref_records', COALESCE(lr.ref_id, -1), 'REF_OVERDUE',
      CASE
        WHEN COALESCE((CURRENT_DATE - lr.next_due_date)::int, 999) >= 30 THEN 'Critical'
        WHEN COALESCE((CURRENT_DATE - lr.next_due_date)::int, 999) >= 14 THEN 'High'
        ELSE 'Medium'
      END,
      'Open', rs.sup_id,
      CASE
        WHEN lr.next_due_date IS NULL THEN 'No REF record on file. Refresher training required immediately.'
        ELSE 'Refresher training expired ' || (CURRENT_DATE - lr.next_due_date) || ' days ago (due: ' || lr.next_due_date || ').'
      END,
      lr.next_due_date,
      COALESCE((CURRENT_DATE - lr.next_due_date)::int, 999),
      NOW(), NOW()
    FROM employees e
    LEFT JOIN latest_ref lr ON e.id = lr.employee_id
    JOIN resolved_sup rs ON e.id = rs.emp_id
    WHERE e.status = 'Active'
      AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
      AND (lr.next_due_date IS NULL OR lr.next_due_date < CURRENT_DATE - INTERVAL '7 days')
      AND NOT EXISTS (
        SELECT 1 FROM workflow_escalations we
        WHERE we.employee_id = e.id AND we.source_table = 'ref_records'
          AND we.escalation_type = 'REF_OVERDUE' AND we.status IN ('Open', 'Acknowledged')
      )
    ON CONFLICT DO NOTHING
    RETURNING id, priority, employee_id
  `, [aomId]);

  // E-3: CBT_FAILED
  await execRule(`
    WITH latest_cbt AS (
      SELECT DISTINCT ON (employee_id) employee_id, id AS cbt_id, result, created_at
      FROM exam_attempts WHERE status = 'Completed'
      ORDER BY employee_id, created_at DESC
    ),
    resolved_sup AS (
      SELECT e.id AS emp_id, COALESCE(eh.reporting_to, $1::uuid) AS sup_id
      FROM employees e
      LEFT JOIN employee_hierarchy eh ON e.id = eh.employee_id
      WHERE e.status = 'Active' AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
    )
    INSERT INTO workflow_escalations
      (employee_id, source_table, source_record_id, escalation_type, priority, status,
       escalated_to, escalation_reason, due_date, days_overdue, created_at, updated_at)
    SELECT
      e.id, 'exam_attempts', lc.cbt_id, 'CBT_FAILED',
      'High', 'Open', rs.sup_id,
      'CBT Safety Exam failed ' || (CURRENT_DATE - lc.created_at::date) || ' days ago. Re-examination required immediately.',
      NULL, (CURRENT_DATE - lc.created_at::date)::int,
      NOW(), NOW()
    FROM employees e
    JOIN latest_cbt lc ON e.id = lc.employee_id
    JOIN resolved_sup rs ON e.id = rs.emp_id
    WHERE e.status = 'Active'
      AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
      AND lc.result = 'FAILED'
      AND lc.created_at < NOW() - INTERVAL '3 days'
      AND NOT EXISTS (
        SELECT 1 FROM workflow_escalations we
        WHERE we.employee_id = e.id AND we.source_table = 'exam_attempts'
          AND we.escalation_type = 'CBT_FAILED' AND we.status IN ('Open', 'Acknowledged')
      )
    ON CONFLICT DO NOTHING
    RETURNING id, priority, employee_id
  `, [aomId]);

  // E-4: CBT_NOT_ATTEMPTED — source_record_id = -4 (distinct from other employee-based rules)
  await execRule(`
    WITH resolved_sup AS (
      SELECT e.id AS emp_id, COALESCE(eh.reporting_to, $1::uuid) AS sup_id
      FROM employees e
      LEFT JOIN employee_hierarchy eh ON e.id = eh.employee_id
      WHERE e.status = 'Active' AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
    )
    INSERT INTO workflow_escalations
      (employee_id, source_table, source_record_id, escalation_type, priority, status,
       escalated_to, escalation_reason, due_date, days_overdue, created_at, updated_at)
    SELECT
      e.id, 'employees', -4, 'CBT_NOT_ATTEMPTED',
      CASE
        WHEN COALESCE((CURRENT_DATE - e.date_of_joining)::int, 999) >= 90 THEN 'Critical'
        WHEN COALESCE((CURRENT_DATE - e.date_of_joining)::int, 999) >= 60 THEN 'High'
        ELSE 'Medium'
      END,
      'Open', rs.sup_id,
      'No CBT Safety Exam attempt on record. Employee active for ' || COALESCE((CURRENT_DATE - e.date_of_joining)::int, 0) || ' days.',
      NULL, COALESCE((CURRENT_DATE - e.date_of_joining)::int, 0),
      NOW(), NOW()
    FROM employees e
    JOIN resolved_sup rs ON e.id = rs.emp_id
    WHERE e.status = 'Active'
      AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
      AND (e.date_of_joining IS NULL OR e.date_of_joining < CURRENT_DATE - INTERVAL '30 days')
      AND NOT EXISTS (SELECT 1 FROM exam_attempts ea WHERE ea.employee_id = e.id)
      AND NOT EXISTS (
        SELECT 1 FROM workflow_escalations we
        WHERE we.employee_id = e.id AND we.source_table = 'employees'
          AND we.escalation_type = 'CBT_NOT_ATTEMPTED' AND we.status IN ('Open', 'Acknowledged')
      )
    ON CONFLICT DO NOTHING
    RETURNING id, priority, employee_id
  `, [aomId]);

  // E-5: ASSESSMENT_OVERDUE
  await execRule(`
    WITH latest_asmt AS (
      SELECT DISTINCT ON (employee_id) employee_id, id AS asmt_id, status, created_at, assessment_date
      FROM assessments ORDER BY employee_id, created_at DESC, id DESC
    ),
    resolved_sup AS (
      SELECT e.id AS emp_id, COALESCE(eh.reporting_to, $1::uuid) AS sup_id
      FROM employees e
      LEFT JOIN employee_hierarchy eh ON e.id = eh.employee_id
      WHERE e.status = 'Active' AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
    )
    INSERT INTO workflow_escalations
      (employee_id, source_table, source_record_id, escalation_type, priority, status,
       escalated_to, escalation_reason, due_date, days_overdue, created_at, updated_at)
    SELECT
      e.id, 'assessments', la.asmt_id, 'ASSESSMENT_OVERDUE',
      CASE
        WHEN la.status = 'Submitted' AND (CURRENT_DATE - la.created_at::date)::int >= 3 THEN 'High'
        WHEN la.status = 'Pending' AND (CURRENT_DATE - la.created_at::date)::int >= 14 THEN 'High'
        ELSE 'Medium'
      END,
      'Open', rs.sup_id,
      'Assessment in ' || la.status || ' status for ' || (CURRENT_DATE - la.created_at::date) || ' days with no action.',
      la.assessment_date, (CURRENT_DATE - la.created_at::date)::int,
      NOW(), NOW()
    FROM employees e
    JOIN latest_asmt la ON e.id = la.employee_id
    JOIN resolved_sup rs ON e.id = rs.emp_id
    WHERE e.status = 'Active'
      AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
      AND (
        (la.status = 'Pending' AND la.created_at < NOW() - INTERVAL '7 days')
        OR (la.status = 'Submitted' AND la.created_at < NOW() - INTERVAL '3 days')
      )
      AND NOT EXISTS (
        SELECT 1 FROM workflow_escalations we
        WHERE we.employee_id = e.id AND we.source_table = 'assessments'
          AND we.escalation_type = 'ASSESSMENT_OVERDUE' AND we.status IN ('Open', 'Acknowledged')
      )
    ON CONFLICT DO NOTHING
    RETURNING id, priority, employee_id
  `, [aomId]);

  // E-6: ASSESSMENT_REJECTED_UNACTIONED
  await execRule(`
    WITH latest_rejected AS (
      SELECT DISTINCT ON (employee_id) employee_id, id AS asmt_id, created_at
      FROM assessments WHERE status = 'Rejected'
      ORDER BY employee_id, created_at DESC, id DESC
    ),
    resolved_sup AS (
      SELECT e.id AS emp_id, COALESCE(eh.reporting_to, $1::uuid) AS sup_id
      FROM employees e
      LEFT JOIN employee_hierarchy eh ON e.id = eh.employee_id
      WHERE e.status = 'Active' AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
    )
    INSERT INTO workflow_escalations
      (employee_id, source_table, source_record_id, escalation_type, priority, status,
       escalated_to, escalation_reason, due_date, days_overdue, created_at, updated_at)
    SELECT
      e.id, 'assessments', ra.asmt_id, 'ASSESSMENT_REJECTED_UNACTIONED',
      'High', 'Open', rs.sup_id,
      'Assessment rejected ' || (CURRENT_DATE - ra.created_at::date) || ' days ago. No new assessment has been submitted.',
      NULL, (CURRENT_DATE - ra.created_at::date)::int,
      NOW(), NOW()
    FROM employees e
    JOIN latest_rejected ra ON e.id = ra.employee_id
    JOIN resolved_sup rs ON e.id = rs.emp_id
    WHERE e.status = 'Active'
      AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
      AND ra.created_at < NOW() - INTERVAL '5 days'
      AND NOT EXISTS (
        SELECT 1 FROM assessments a WHERE a.employee_id = e.id AND a.status IN ('Pending', 'Submitted')
      )
      AND NOT EXISTS (
        SELECT 1 FROM workflow_escalations we
        WHERE we.employee_id = e.id AND we.source_table = 'assessments'
          AND we.escalation_type = 'ASSESSMENT_REJECTED_UNACTIONED' AND we.status IN ('Open', 'Acknowledged')
      )
    ON CONFLICT DO NOTHING
    RETURNING id, priority, employee_id
  `, [aomId]);

  // E-7: HIGH_RISK_UNADDRESSED — always escalated to AOM (source_record_id = -7)
  await execRule(`
    INSERT INTO workflow_escalations
      (employee_id, source_table, source_record_id, escalation_type, priority, status,
       escalated_to, escalation_reason, due_date, days_overdue, created_at, updated_at)
    SELECT
      e.id, 'employees', -7, 'HIGH_RISK_UNADDRESSED',
      'High', 'Open', $1::uuid,
      'Employee flagged as High Risk (Phase 18) with no active counselling or open recommendation.',
      NULL, 0, NOW(), NOW()
    FROM employees e
    WHERE e.status = 'Active'
      AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
      AND e.risk_level = 'High'
      AND NOT EXISTS (
        SELECT 1 FROM counselling_records cr WHERE cr.employee_id = e.id AND cr.status = 'Open'
      )
      AND NOT EXISTS (
        SELECT 1 FROM workflow_escalations we
        WHERE we.employee_id = e.id AND we.escalation_type = 'HIGH_RISK_UNADDRESSED'
          AND we.status IN ('Open', 'Acknowledged')
      )
    ON CONFLICT DO NOTHING
    RETURNING id, priority, employee_id
  `, [aomId]);

  // E-8: COUNSELLING_OVERDUE
  await execRule(`
    WITH overdue_counselling AS (
      SELECT cr.id AS cr_id, cr.employee_id, cr.next_review_date, cr.created_at,
        CASE
          WHEN cr.next_review_date IS NOT NULL THEN (CURRENT_DATE - cr.next_review_date)::int
          ELSE (CURRENT_DATE - cr.created_at::date)::int
        END AS days_od,
        COALESCE(eh.reporting_to, $1::uuid) AS sup_id
      FROM counselling_records cr
      LEFT JOIN employee_hierarchy eh ON cr.counsellor_id = eh.employee_id
      WHERE cr.status = 'Open'
        AND (
          (cr.next_review_date IS NOT NULL AND cr.next_review_date < CURRENT_DATE)
          OR (cr.next_review_date IS NULL AND cr.created_at < NOW() - INTERVAL '30 days')
        )
    )
    INSERT INTO workflow_escalations
      (employee_id, source_table, source_record_id, escalation_type, priority, status,
       escalated_to, escalation_reason, due_date, days_overdue, created_at, updated_at)
    SELECT
      oc.employee_id, 'counselling_records', oc.cr_id, 'COUNSELLING_OVERDUE',
      CASE WHEN oc.days_od >= 60 THEN 'High' ELSE 'Medium' END,
      'Open', oc.sup_id,
      CASE
        WHEN oc.next_review_date IS NOT NULL
          THEN 'Counselling review overdue by ' || oc.days_od || ' days (review date: ' || oc.next_review_date || ').'
        ELSE 'Counselling record open for over 30 days without review.'
      END,
      oc.next_review_date, oc.days_od, NOW(), NOW()
    FROM overdue_counselling oc
    WHERE NOT EXISTS (
      SELECT 1 FROM workflow_escalations we
      WHERE we.source_table = 'counselling_records'
        AND we.source_record_id = oc.cr_id
        AND we.escalation_type = 'COUNSELLING_OVERDUE'
        AND we.status IN ('Open', 'Acknowledged')
    )
    ON CONFLICT DO NOTHING
    RETURNING id, priority, employee_id
  `, [aomId]);

  // Per-item audit for Critical escalations
  for (const item of criticalItems) {
    await logEngineAudit(client, {
      action: 'ESCALATION_CREATED',
      employeeId: item.employee_id,
      remarks: `Critical escalation created (ID: ${item.id}).`,
      severity: 'WARNING'
    });
  }

  // Bulk notification insert — one notification per escalated_to per engine run
  if (aomId) {
    await client.query(`
      INSERT INTO notifications (employee_id, title, message, category, target_role, is_read, created_at)
      SELECT es.escalated_to,
        'Workflow Alert: ' || es.cnt || ' new compliance escalation(s)',
        'New compliance escalation(s) require your attention in the Workflow module.',
        'Workflow Escalation',
        COALESCE(sup.designation, 'AOM'),
        false, NOW()
      FROM (
        SELECT escalated_to, COUNT(*) AS cnt
        FROM workflow_escalations
        WHERE created_at >= $1 AND status = 'Open' AND escalated_to IS NOT NULL
        GROUP BY escalated_to
      ) es
      LEFT JOIN employees sup ON es.escalated_to = sup.id
      WHERE NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.employee_id = es.escalated_to
          AND n.category = 'Workflow Escalation'
          AND n.created_at > NOW() - INTERVAL '24 hours'
      )
      ON CONFLICT DO NOTHING
    `, [runStartedAt]);
  }

  return totalCreated;
}

// ─── RECOMMENDATION ENGINE ────────────────────────────────────────────────────

async function runRecommendationEngine(client, fallbackAomId, runStartedAt) {
  let totalCreated = 0;
  const criticalItems = [];
  const aomId = fallbackAomId;

  async function execRule(sql, params) {
    const res = await client.query(sql, params || []);
    totalCreated += res.rowCount;
    for (const row of res.rows) {
      if (row.priority === 'Critical') criticalItems.push({ ...row, source: 'recommendation' });
    }
    return res.rowCount;
  }

  // R-1: COUNSELLING_REQUIRED
  await execRule(`
    WITH sm_assigned AS (
      SELECT e.id AS emp_id,
        COALESCE(
          (SELECT sm.id FROM employees sm
           WHERE (sm.role_id = 2 OR UPPER(sm.designation) = 'STATION MASTER')
             AND sm.station_id = e.station_id AND sm.status = 'Active' LIMIT 1),
          $1::uuid
        ) AS sm_id
      FROM employees e
      WHERE e.status = 'Active' AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
    )
    INSERT INTO workflow_recommendations
      (employee_id, recommendation_type, priority, status, title, description, source,
       assigned_to, due_date, created_at, updated_at)
    SELECT
      e.id, 'COUNSELLING_REQUIRED',
      CASE WHEN e.risk_level = 'High' THEN 'High' ELSE 'Medium' END,
      'Pending',
      'Safety Counselling Required — ' || e.full_name,
      'Employee ' || e.full_name || ' (' || e.hrms_id || ') is flagged as ' || e.risk_level ||
      ' risk. Immediate safety counselling is recommended to address compliance gaps.',
      'SYSTEM', sm.sm_id,
      CURRENT_DATE + INTERVAL '7 days',
      NOW(), NOW()
    FROM employees e
    JOIN sm_assigned sm ON e.id = sm.emp_id
    WHERE e.status = 'Active'
      AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
      AND (
        e.risk_level = 'High'
        OR EXISTS (SELECT 1 FROM counselling_records cr WHERE cr.employee_id = e.id AND cr.status = 'Open')
      )
      AND NOT EXISTS (
        SELECT 1 FROM workflow_recommendations wr
        WHERE wr.employee_id = e.id AND wr.recommendation_type = 'COUNSELLING_REQUIRED'
          AND wr.status IN ('Pending', 'In Progress')
      )
    ON CONFLICT DO NOTHING
    RETURNING id, priority, employee_id
  `, [aomId]);

  // R-2: PME_RENEWAL
  await execRule(`
    WITH latest_pme AS (
      SELECT DISTINCT ON (employee_id) employee_id, next_due_date
      FROM pme_records ORDER BY employee_id, pme_date DESC, id DESC
    ),
    sm_assigned AS (
      SELECT e.id AS emp_id,
        COALESCE(
          (SELECT sm.id FROM employees sm
           WHERE (sm.role_id = 2 OR UPPER(sm.designation) = 'STATION MASTER')
             AND sm.station_id = e.station_id AND sm.status = 'Active' LIMIT 1),
          $1::uuid
        ) AS sm_id
      FROM employees e
      WHERE e.status = 'Active' AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
    )
    INSERT INTO workflow_recommendations
      (employee_id, recommendation_type, priority, status, title, description, source,
       assigned_to, due_date, created_at, updated_at)
    SELECT
      e.id, 'PME_RENEWAL',
      CASE
        WHEN lp.next_due_date IS NULL OR lp.next_due_date < CURRENT_DATE THEN 'High'
        WHEN lp.next_due_date <= CURRENT_DATE + INTERVAL '15 days' THEN 'High'
        ELSE 'Medium'
      END,
      'Pending',
      'PME Renewal Due — Schedule Medical Examination for ' || e.full_name,
      'Periodic Medical Examination (PME) for ' || e.full_name || ' (' || e.hrms_id || ') is ' ||
      CASE
        WHEN lp.next_due_date IS NULL THEN 'not on record. Immediate scheduling required.'
        WHEN lp.next_due_date < CURRENT_DATE THEN 'overdue since ' || lp.next_due_date || '. Schedule immediately.'
        ELSE 'due on ' || lp.next_due_date || '. Schedule within 30 days.'
      END,
      'SYSTEM', sm.sm_id,
      COALESCE(lp.next_due_date, CURRENT_DATE),
      NOW(), NOW()
    FROM employees e
    LEFT JOIN latest_pme lp ON e.id = lp.employee_id
    JOIN sm_assigned sm ON e.id = sm.emp_id
    WHERE e.status = 'Active'
      AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
      AND (lp.next_due_date IS NULL OR lp.next_due_date <= CURRENT_DATE + INTERVAL '30 days')
      AND NOT EXISTS (
        SELECT 1 FROM workflow_recommendations wr
        WHERE wr.employee_id = e.id AND wr.recommendation_type = 'PME_RENEWAL'
          AND wr.status IN ('Pending', 'In Progress')
      )
    ON CONFLICT DO NOTHING
    RETURNING id, priority, employee_id
  `, [aomId]);

  // R-3: REFRESHER_TRAINING
  await execRule(`
    WITH latest_ref AS (
      SELECT DISTINCT ON (employee_id) employee_id, next_due_date
      FROM ref_records ORDER BY employee_id, ref_date DESC, id DESC
    ),
    sm_assigned AS (
      SELECT e.id AS emp_id,
        COALESCE(
          (SELECT sm.id FROM employees sm
           WHERE (sm.role_id = 2 OR UPPER(sm.designation) = 'STATION MASTER')
             AND sm.station_id = e.station_id AND sm.status = 'Active' LIMIT 1),
          $1::uuid
        ) AS sm_id
      FROM employees e
      WHERE e.status = 'Active' AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
    )
    INSERT INTO workflow_recommendations
      (employee_id, recommendation_type, priority, status, title, description, source,
       assigned_to, due_date, created_at, updated_at)
    SELECT
      e.id, 'REFRESHER_TRAINING',
      CASE
        WHEN lr.next_due_date IS NULL OR lr.next_due_date < CURRENT_DATE THEN 'High'
        WHEN lr.next_due_date <= CURRENT_DATE + INTERVAL '15 days' THEN 'High'
        ELSE 'Medium'
      END,
      'Pending',
      'Refresher Safety Training Due — Schedule REF Course for ' || e.full_name,
      'Refresher Safety Training (REF) for ' || e.full_name || ' (' || e.hrms_id || ') is ' ||
      CASE
        WHEN lr.next_due_date IS NULL THEN 'not on record. Immediate scheduling required.'
        WHEN lr.next_due_date < CURRENT_DATE THEN 'overdue since ' || lr.next_due_date || '. Schedule immediately.'
        ELSE 'due on ' || lr.next_due_date || '. Schedule within 30 days.'
      END,
      'SYSTEM', sm.sm_id,
      COALESCE(lr.next_due_date, CURRENT_DATE),
      NOW(), NOW()
    FROM employees e
    LEFT JOIN latest_ref lr ON e.id = lr.employee_id
    JOIN sm_assigned sm ON e.id = sm.emp_id
    WHERE e.status = 'Active'
      AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
      AND (lr.next_due_date IS NULL OR lr.next_due_date <= CURRENT_DATE + INTERVAL '30 days')
      AND NOT EXISTS (
        SELECT 1 FROM workflow_recommendations wr
        WHERE wr.employee_id = e.id AND wr.recommendation_type = 'REFRESHER_TRAINING'
          AND wr.status IN ('Pending', 'In Progress')
      )
    ON CONFLICT DO NOTHING
    RETURNING id, priority, employee_id
  `, [aomId]);

  // R-4: CBT_RETEST
  await execRule(`
    WITH latest_cbt AS (
      SELECT DISTINCT ON (employee_id) employee_id, result
      FROM exam_attempts WHERE status = 'Completed'
      ORDER BY employee_id, created_at DESC
    ),
    sm_assigned AS (
      SELECT e.id AS emp_id,
        COALESCE(
          (SELECT sm.id FROM employees sm
           WHERE (sm.role_id = 2 OR UPPER(sm.designation) = 'STATION MASTER')
             AND sm.station_id = e.station_id AND sm.status = 'Active' LIMIT 1),
          $1::uuid
        ) AS sm_id
      FROM employees e
      WHERE e.status = 'Active' AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
    )
    INSERT INTO workflow_recommendations
      (employee_id, recommendation_type, priority, status, title, description, source,
       assigned_to, due_date, created_at, updated_at)
    SELECT
      e.id, 'CBT_RETEST',
      CASE WHEN lc.result = 'FAILED' THEN 'High' ELSE 'Medium' END,
      'Pending',
      CASE
        WHEN lc.employee_id IS NULL THEN 'CBT Safety Exam — First Attempt Required for ' || e.full_name
        ELSE 'CBT Safety Exam Retest Required — ' || e.full_name
      END,
      CASE
        WHEN lc.employee_id IS NULL THEN 'No CBT exam on record for ' || e.full_name || ' (' || e.hrms_id || '). Schedule initial CBT assessment.'
        ELSE 'Latest CBT exam result was FAILED. A retest is required to maintain safety compliance.'
      END,
      'SYSTEM', sm.sm_id,
      CURRENT_DATE + INTERVAL '14 days',
      NOW(), NOW()
    FROM employees e
    LEFT JOIN latest_cbt lc ON e.id = lc.employee_id
    JOIN sm_assigned sm ON e.id = sm.emp_id
    WHERE e.status = 'Active'
      AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
      AND (lc.employee_id IS NULL OR lc.result = 'FAILED')
      AND NOT EXISTS (
        SELECT 1 FROM workflow_recommendations wr
        WHERE wr.employee_id = e.id AND wr.recommendation_type = 'CBT_RETEST'
          AND wr.status IN ('Pending', 'In Progress')
      )
    ON CONFLICT DO NOTHING
    RETURNING id, priority, employee_id
  `, [aomId]);

  // R-5: RISK_REVIEW
  await execRule(`
    WITH rejected_unactioned AS (
      SELECT DISTINCT ra.employee_id
      FROM assessments ra
      WHERE ra.status = 'Rejected' AND ra.created_at < NOW() - INTERVAL '5 days'
        AND NOT EXISTS (
          SELECT 1 FROM assessments a2
          WHERE a2.employee_id = ra.employee_id AND a2.status IN ('Pending', 'Submitted')
            AND a2.created_at > ra.created_at
        )
    ),
    ti_assigned AS (
      SELECT e.id AS emp_id,
        COALESCE(
          (SELECT ti.id FROM employees ti
           WHERE (ti.role_id = 6 OR UPPER(ti.designation) = 'TRAFFIC INSPECTOR')
             AND ti.station_id = e.station_id AND ti.status = 'Active' LIMIT 1),
          $1::uuid
        ) AS ti_id
      FROM employees e
      WHERE e.status = 'Active' AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
    )
    INSERT INTO workflow_recommendations
      (employee_id, recommendation_type, priority, status, title, description, source,
       assigned_to, due_date, created_at, updated_at)
    SELECT
      e.id, 'RISK_REVIEW', 'High', 'Pending',
      'Supervisor Review Required — ' || e.full_name,
      'Employee ' || e.full_name || ' (' || e.hrms_id || ') requires supervisor review: ' ||
      CASE
        WHEN e.category_grade = 'D' AND ru.employee_id IS NOT NULL THEN 'Category D classification AND unactioned rejected assessment.'
        WHEN e.category_grade = 'D' THEN 'Category D classification requires review.'
        ELSE 'Assessment rejected with no re-submission for over 5 days.'
      END,
      'SYSTEM', ti.ti_id,
      CURRENT_DATE + INTERVAL '3 days',
      NOW(), NOW()
    FROM employees e
    JOIN ti_assigned ti ON e.id = ti.emp_id
    LEFT JOIN rejected_unactioned ru ON e.id = ru.employee_id
    WHERE e.status = 'Active'
      AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
      AND (COALESCE(e.category_grade, '') = 'D' OR ru.employee_id IS NOT NULL)
      AND NOT EXISTS (
        SELECT 1 FROM workflow_recommendations wr
        WHERE wr.employee_id = e.id AND wr.recommendation_type = 'RISK_REVIEW'
          AND wr.status IN ('Pending', 'In Progress')
      )
    ON CONFLICT DO NOTHING
    RETURNING id, priority, employee_id
  `, [aomId]);

  // R-6: WATCHLIST (multi-factor risk)
  await execRule(`
    WITH latest_pme AS (
      SELECT DISTINCT ON (employee_id) employee_id, next_due_date
      FROM pme_records ORDER BY employee_id, pme_date DESC, id DESC
    ),
    latest_ref AS (
      SELECT DISTINCT ON (employee_id) employee_id, next_due_date
      FROM ref_records ORDER BY employee_id, ref_date DESC, id DESC
    ),
    latest_cbt AS (
      SELECT DISTINCT ON (employee_id) employee_id, result
      FROM exam_attempts WHERE status = 'Completed'
      ORDER BY employee_id, created_at DESC
    ),
    latest_asmt AS (
      SELECT DISTINCT ON (employee_id) employee_id, status
      FROM assessments ORDER BY employee_id, created_at DESC, id DESC
    ),
    gap_summary AS (
      SELECT e.id AS emp_id,
        (CASE WHEN lp.next_due_date IS NULL OR lp.next_due_date < CURRENT_DATE THEN 1 ELSE 0 END +
         CASE WHEN lr.next_due_date IS NULL OR lr.next_due_date < CURRENT_DATE THEN 1 ELSE 0 END +
         CASE WHEN lc.employee_id IS NULL OR lc.result = 'FAILED' THEN 1 ELSE 0 END +
         CASE WHEN la.employee_id IS NULL OR la.status NOT IN ('Approved') THEN 1 ELSE 0 END
        ) AS gap_count,
        ARRAY_REMOVE(ARRAY[
          CASE WHEN lp.next_due_date IS NULL OR lp.next_due_date < CURRENT_DATE THEN 'PME expired' END,
          CASE WHEN lr.next_due_date IS NULL OR lr.next_due_date < CURRENT_DATE THEN 'REF expired' END,
          CASE WHEN lc.employee_id IS NULL THEN 'CBT not attempted' WHEN lc.result = 'FAILED' THEN 'CBT failed' END,
          CASE WHEN la.employee_id IS NULL THEN 'No assessment' WHEN la.status NOT IN ('Approved') THEN 'Assessment pending/rejected' END
        ], NULL) AS gaps
      FROM employees e
      LEFT JOIN latest_pme lp ON e.id = lp.employee_id
      LEFT JOIN latest_ref lr ON e.id = lr.employee_id
      LEFT JOIN latest_cbt lc ON e.id = lc.employee_id
      LEFT JOIN latest_asmt la ON e.id = la.employee_id
      WHERE e.status = 'Active' AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
    )
    INSERT INTO workflow_recommendations
      (employee_id, recommendation_type, priority, status, title, description, source,
       assigned_to, due_date, created_at, updated_at)
    SELECT
      e.id, 'WATCHLIST',
      CASE
        WHEN e.risk_level = 'High' AND gs.gap_count >= 3 THEN 'Critical'
        WHEN e.risk_level = 'High' THEN 'High'
        ELSE 'Medium'
      END,
      'Pending',
      'Multi-Factor Risk Detected — Risk Mitigation Plan for ' || e.full_name,
      'Employee ' || e.full_name || ' (' || e.hrms_id || ') has ' || gs.gap_count ||
      ' simultaneous compliance gaps: ' || array_to_string(gs.gaps, ', ') ||
      '. A structured risk mitigation plan must be initiated.',
      'SYSTEM', $1::uuid,
      CURRENT_DATE + INTERVAL '5 days',
      NOW(), NOW()
    FROM employees e
    JOIN gap_summary gs ON e.id = gs.emp_id
    WHERE e.status = 'Active'
      AND (e.role_id = 1 OR UPPER(e.designation) = 'POINTSMAN')
      AND gs.gap_count >= 2
      AND e.risk_level IN ('High', 'Medium')
      AND NOT EXISTS (
        SELECT 1 FROM workflow_recommendations wr
        WHERE wr.employee_id = e.id AND wr.recommendation_type = 'WATCHLIST'
          AND wr.status IN ('Pending', 'In Progress')
      )
    ON CONFLICT DO NOTHING
    RETURNING id, priority, employee_id
  `, [aomId]);

  // Per-item audit for Critical recommendations
  for (const item of criticalItems) {
    await logEngineAudit(client, {
      action: 'RECOMMENDATION_CREATED',
      employeeId: item.employee_id,
      remarks: `Critical recommendation created (ID: ${item.id}).`,
      severity: 'WARNING'
    });
  }

  // Bulk notification insert for newly created recommendations
  await client.query(`
    INSERT INTO notifications (employee_id, title, message, category, target_role, is_read, created_at)
    SELECT rs.assigned_to,
      'Workflow: ' || rs.cnt || ' new recommendation(s) assigned',
      'New compliance recommendations have been assigned to you in the Workflow module.',
      'Workflow Recommendation',
      COALESCE(sup.designation, 'Station Master'),
      false, NOW()
    FROM (
      SELECT assigned_to, COUNT(*) AS cnt
      FROM workflow_recommendations
      WHERE created_at >= $1 AND status = 'Pending' AND assigned_to IS NOT NULL
      GROUP BY assigned_to
    ) rs
    LEFT JOIN employees sup ON rs.assigned_to = sup.id
    WHERE NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.employee_id = rs.assigned_to
        AND n.category = 'Workflow Recommendation'
        AND n.created_at > NOW() - INTERVAL '24 hours'
    )
    ON CONFLICT DO NOTHING
  `, [runStartedAt]);

  return totalCreated;
}

// ─── MAIN ENGINE ENTRY POINT ──────────────────────────────────────────────────

async function runFullEngine() {
  if (isRunning) {
    console.log('[WorkflowEngine] Skipped — engine already running.');
    return { skipped: true, reason: 'Engine already running' };
  }

  isRunning = true;
  engineState.isRunning = true;

  const runStartedAt = new Date();
  let client = null;
  let escalationsCreated = 0;
  let recommendationsCreated = 0;
  let autoResolved = 0;
  let autoCompleted = 0;

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const fallbackAomId = await getFallbackAomId(client);

    // 1. Auto-resolve cleared escalations
    autoResolved = await runAutoResolve(client);

    // 2. Auto-complete cleared recommendations
    autoCompleted = await runAutoComplete(client);

    // 3. Detect and write new escalations
    escalationsCreated = await runEscalationEngine(client, fallbackAomId, runStartedAt);

    // 4. Detect and write new recommendations
    recommendationsCreated = await runRecommendationEngine(client, fallbackAomId, runStartedAt);

    // 5. Summary audit log
    const durationMs = Date.now() - runStartedAt.getTime();
    await logEngineAudit(client, {
      action: 'WORKFLOW_ENGINE_COMPLETE',
      remarks: `Engine run complete. New escalations: ${escalationsCreated}. New recommendations: ${recommendationsCreated}. Auto-resolved: ${autoResolved}. Auto-completed: ${autoCompleted}. Duration: ${durationMs}ms.`,
      severity: 'INFO'
    });

    await client.query('COMMIT');

    const result = {
      runAt: runStartedAt.toISOString(),
      status: 'success',
      escalationsCreated,
      recommendationsCreated,
      autoResolved,
      autoCompleted,
      durationMs
    };

    recordRunResult(result);
    console.log(`[WorkflowEngine] ✅ Run complete. ESC+${escalationsCreated} REC+${recommendationsCreated} AUTO_RES=${autoResolved} AUTO_COMP=${autoCompleted} (${durationMs}ms)`);
    return result;

  } catch (err) {
    if (client) { try { await client.query('ROLLBACK'); } catch (_) {} }
    console.error('[WorkflowEngine] ❌ Run failed:', err.message);

    const result = {
      runAt: runStartedAt.toISOString(),
      status: 'error',
      error: err.message,
      escalationsCreated: 0,
      recommendationsCreated: 0,
      autoResolved: 0,
      autoCompleted: 0,
      durationMs: Date.now() - runStartedAt.getTime()
    };

    recordRunResult(result);
    throw err;

  } finally {
    isRunning = false;
    engineState.isRunning = false;
    if (client) client.release();
  }
}

// ─── EXPORTED API ─────────────────────────────────────────────────────────────

function getEngineStatus() {
  return {
    ...engineState,
    runHistory: runHistory.slice(0, MAX_HISTORY)
  };
}

module.exports = {
  runFullEngine,
  getEngineStatus
};
