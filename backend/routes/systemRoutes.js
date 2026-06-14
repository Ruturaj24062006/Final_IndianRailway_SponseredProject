const express = require("express");
const router = express.Router();
const systemController = require("../controllers/systemController");
const { protect, hasRole } = require("../middleware/authMiddleware");

// Secure all system monitoring routes to Super Admins only
router.use(protect);
router.use(hasRole("Super Admin"));

// Define monitoring and audit routes
router.get("/health", systemController.getSystemHealth);
router.get("/activity", systemController.getSystemActivity);
router.get("/audit-logs", systemController.getAuditLogs);
router.get("/security-events", systemController.getSecurityEvents);

module.exports = router;
