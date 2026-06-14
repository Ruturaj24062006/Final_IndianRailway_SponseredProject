'use strict';

const express = require('express');
const router = express.Router();
const { protect, hasRole } = require('../middleware/authMiddleware');
const ac = require('../controllers/analyticsController');

// All analytics routes require authentication
router.use(protect);

// Allowed roles for executive division analytics
const executiveRoles = ['AOM', 'Super Admin', 'SR.DOM', 'Traffic Inspector'];

// Enforce hasRole check across all executive endpoints
router.use(hasRole(...executiveRoles));

// Endpoint registrations
router.get('/executive-summary',  ac.getExecutiveSummary);
router.get('/compliance-breakdown',ac.getComplianceBreakdown);
router.get('/station-heatmap',    ac.getStationHeatmap);
router.get('/trends-forecast',     ac.getTrendsForecast);
router.get('/top-risk-employees',  ac.getTopRiskEmployees);
router.get('/live-console',        ac.getLiveConsole);

module.exports = router;
