'use strict';

const express = require('express');
const router = express.Router();
const { protect, hasRole } = require('../middleware/authMiddleware');
const wc = require('../controllers/workflowController');
const wec = require('../controllers/workflowEngineController');

// All workflow routes require authentication
router.use(protect);

// ─── Escalation Routes ────────────────────────────────────────────────────────
// Pointsman is intentionally excluded from all escalation routes.

const escalationViewRoles = ['Traffic Inspector', 'AOM', 'Super Admin', 'SR.DOM', 'Station Master', 'Station Supervisor', 'Station Superintendent'];
const escalationWriteRoles = ['Traffic Inspector', 'AOM', 'Super Admin', 'SR.DOM'];

router.get('/escalations',      hasRole(...escalationViewRoles),  wc.getEscalations);
router.get('/escalations/:id',  hasRole(...escalationViewRoles),  wc.getEscalation);
router.put('/escalations/:id',  hasRole(...escalationWriteRoles), wc.updateEscalation);

// ─── Recommendation Routes ────────────────────────────────────────────────────
// Pointsman may access their own (enforced at controller level via hrms_id scoping).

const recViewRoles = ['Pointsman', 'Station Master', 'Station Supervisor', 'Station Superintendent', 'Traffic Inspector', 'AOM', 'Super Admin', 'SR.DOM'];
const recWriteRoles = ['Station Master', 'Station Supervisor', 'Station Superintendent', 'Traffic Inspector', 'AOM', 'Super Admin', 'SR.DOM'];
const recCreateRoles = ['Traffic Inspector', 'AOM', 'Super Admin', 'SR.DOM'];

router.get('/recommendations',      hasRole(...recViewRoles),   wc.getRecommendations);
router.get('/my-recommendations',   hasRole('Pointsman'),       wc.getMyRecommendations);
router.get('/recommendations/:id',  hasRole(...recViewRoles),   wc.getRecommendation);
router.put('/recommendations/:id',  hasRole(...recWriteRoles),  wc.updateRecommendation);
router.post('/recommendations',     hasRole(...recCreateRoles), wc.createRecommendation);

// ─── Engine Control Routes ────────────────────────────────────────────────────

const engineRoles = ['Super Admin', 'AOM'];

router.post('/engine/trigger', hasRole(...engineRoles),    wec.triggerEngine);
router.get('/engine/status',   hasRole(...engineRoles),    wec.getEngineStatus);

// ─── Aggregated Stats & Dashboard ────────────────────────────────────────────

const statsRoles = ['Traffic Inspector', 'AOM', 'Super Admin', 'SR.DOM', 'Station Master'];

router.get('/stats',     hasRole(...statsRoles), wec.getWorkflowStats);
router.get('/dashboard', hasRole(...statsRoles), wec.getWorkflowDashboard);

module.exports = router;
