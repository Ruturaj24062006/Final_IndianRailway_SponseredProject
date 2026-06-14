const express = require("express");
const router = express.Router();
const aomController = require("../controllers/aomController");
const { protect, hasRole } = require("../middleware/authMiddleware");

// All AOM routes require token protection and AOM/General authorization
router.use(protect);
router.use(hasRole("AOM", "AOM/General"));

router.get("/dashboard", aomController.getAomDashboard);
router.get("/station-summary", aomController.getAomStationSummary);
router.get("/compliance-summary", aomController.getAomComplianceSummary);
router.get("/performance-summary", aomController.getAomPerformanceSummary);

module.exports = router;
