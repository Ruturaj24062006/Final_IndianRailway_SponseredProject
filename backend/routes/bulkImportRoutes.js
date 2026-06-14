const express = require("express");
const router = express.Router();
const bulkImportController = require("../controllers/bulkImportController");
const { protect, hasRole } = require("../middleware/authMiddleware");

// All routes require login authentication AND Super Admin role
router.use(protect);
router.use(hasRole("Super Admin"));

router.get("/preview", bulkImportController.getImportPreview);
router.post("/execute", bulkImportController.executeImport);

module.exports = router;
