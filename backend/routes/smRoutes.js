const express = require("express");
const router = express.Router();
const { protect, hasRole } = require("../middleware/authMiddleware");
const {
  getSmDashboard,
  getSmPointsmen,
  getSmPendingAssessments,
  getSmAssessmentHistory,
  getSmComplianceSummary,
  getSmShiftMasters,
  registerPointsman
} = require("../controllers/smController");

const allowedRoles = ["Station Master", "Station Superintendent", "Station Supervisor"];

// Get Station Master dashboard summary metrics
router.get("/dashboard", protect, hasRole(...allowedRoles), getSmDashboard);

// Get Pointsmen under this station master's assigned station
router.get("/pointsmen", protect, hasRole(...allowedRoles), getSmPointsmen);

// Get pending assessments created by the station master
router.get("/pending-assessments", protect, hasRole(...allowedRoles), getSmPendingAssessments);

// Get assessment history created by the station master (all statuses)
router.get("/assessment-history", protect, hasRole(...allowedRoles), getSmAssessmentHistory);

// Get overall compliance summary for the station master's station
router.get("/compliance-summary", protect, hasRole(...allowedRoles), getSmComplianceSummary);

// Get shift station masters working at the same station
router.get("/shift-masters", protect, hasRole(...allowedRoles), getSmShiftMasters);

// Register a new Pointsman and auto-provision their account
router.post("/register-pointsman", protect, hasRole(...allowedRoles), registerPointsman);

module.exports = router;
