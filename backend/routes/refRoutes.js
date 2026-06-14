const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getRefStatus, getRefHistory, updateRefStatus } = require("../controllers/refController");

// GET /api/ref/status - JWT protected
router.get("/status", protect, getRefStatus);

// GET /api/ref/history - JWT protected
router.get("/history", protect, getRefHistory);

// POST /api/ref/update - JWT protected REF update
router.post("/update", protect, updateRefStatus);

module.exports = router;
