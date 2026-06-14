const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getPmeStatus, getPmeHistory, updatePmeStatus } = require("../controllers/pmeController");

// GET /api/pme/status - JWT protected
router.get("/status", protect, getPmeStatus);

// GET /api/pme/history - JWT protected
router.get("/history", protect, getPmeHistory);

// POST /api/pme/update - JWT protected PME update
router.post("/update", protect, updatePmeStatus);

module.exports = router;
