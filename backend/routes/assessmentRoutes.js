const express = require("express");
const router = express.Router();
const { protect, hasRole } = require("../middleware/authMiddleware");
const {
  createAssessment,
  getPointsmanChecklist,
  submitAssessment,
  getPendingApprovals,
  approveAssessment,
  rejectAssessment,
  updateMcqStatus
} = require("../controllers/assessmentController");

// Create Assessment Request - Station Master only
router.post("/request", protect, hasRole("Station Master"), createAssessment);

// Fetch Pointsman checklist templates - Station Master only
router.get("/checklist/pointsman", protect, hasRole("Station Master"), getPointsmanChecklist);

// Submit filled checklist evaluation - Station Master only
router.post("/:id/submit", protect, hasRole("Station Master"), submitAssessment);

// Update Pointsman MCQ exam access state - Station Master only
router.put("/:id/mcq-status", protect, hasRole("Station Master"), updateMcqStatus);

// Fetch assessments pending review - Traffic Inspector only
router.get("/pending", protect, hasRole("Traffic Inspector"), getPendingApprovals);

// Approve assessment - Traffic Inspector only
router.post("/:id/approve", protect, hasRole("Traffic Inspector"), approveAssessment);

// Reject assessment - Traffic Inspector only
router.post("/:id/reject", protect, hasRole("Traffic Inspector"), rejectAssessment);

module.exports = router;
