const express = require("express");
const router = express.Router();
const { protect, hasRole } = require("../middleware/authMiddleware");
const {
  getTiDashboard,
  getTiPendingApprovals,
  getTiAssessmentHistory,
  getTiPerformanceSummary
} = require("../controllers/tiController");

// Get overall dashboard stats
router.get("/dashboard", protect, hasRole("Traffic Inspector"), getTiDashboard);

// Get pending approvals (Pending or Submitted status)
router.get("/pending-approvals", protect, hasRole("Traffic Inspector"), getTiPendingApprovals);

// Get assessment history (Approved or Rejected status)
router.get("/assessment-history", protect, hasRole("Traffic Inspector"), getTiAssessmentHistory);

// Get performance summary for Pointsmen
router.get("/performance-summary", protect, hasRole("Traffic Inspector"), getTiPerformanceSummary);

module.exports = router;
