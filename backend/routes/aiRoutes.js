const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");
const { protect, hasRole } = require("../middleware/authMiddleware");

// All AI features are restricted to executive managers
const ALLOWED_ROLES = ["AOM", "Super Admin", "Traffic Inspector", "Station Superintendent"];

router.use(protect);
router.use(hasRole(...ALLOWED_ROLES));

router.post("/chat", aiController.chat);
router.post("/query", aiController.query);
router.post("/explain-risk", aiController.explainRisk);
router.post("/investigate", aiController.investigate);
router.get("/executive-summary", aiController.executiveSummary);

module.exports = router;
