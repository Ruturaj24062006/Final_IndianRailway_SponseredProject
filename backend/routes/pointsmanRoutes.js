const express = require("express");
const router = express.Router();
const { protect, hasRole } = require("../middleware/authMiddleware");
const { getPointsmanDashboard } = require("../controllers/pointsmanController");

// GET /api/pointsman/dashboard - JWT protected and Pointsman role restricted
router.get("/dashboard", protect, hasRole("Pointsman"), getPointsmanDashboard);

module.exports = router;
