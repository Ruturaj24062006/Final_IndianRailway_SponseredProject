const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reportsController");
const { protect, hasRole } = require("../middleware/authMiddleware");

// All reports routes require JWT protection and administrative roles
router.use(protect);
router.use(hasRole("Super Admin", "AOM", "SR.DOM", "Traffic Inspector", "Station Master"));

// Define reports endpoints
router.get("/dashboard", reportsController.getDashboard);
router.get("/cbt", reportsController.getCbt);
router.get("/pme", reportsController.getPme);
router.get("/ref", reportsController.getRef);
router.get("/compliance", reportsController.getCompliance);
router.get("/assessments", reportsController.getAssessments);
router.get("/risk", reportsController.getRisk);
router.get("/predictive-dashboard", reportsController.getPredictiveDashboard);
router.get("/employee-risk-ledger", reportsController.getEmployeeRiskLedger);
router.get("/station-risk-ranking", reportsController.getStationRiskRanking);
router.get("/alert-recommendations", reportsController.getAlertRecommendations);
router.post("/sync-risk-levels", reportsController.syncRiskLevels);

module.exports = router;
