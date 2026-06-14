const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getExamStatus,
  startExam,
  submitAnswer,
  submitExam
} = require("../controllers/examController");

// JWT Protected CBT Exam Routes
router.get("/status", protect, getExamStatus);
router.post("/start", protect, startExam);
router.post("/submit-answer", protect, submitAnswer);
router.post("/submit", protect, submitExam);

module.exports = router;
