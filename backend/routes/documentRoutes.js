const express = require("express");
const router = express.Router();
const documentController = require("../controllers/documentController");
const { protect, hasRole } = require("../middleware/authMiddleware");

// All routes require login authentication
router.use(protect);

// Allow listing documents for any authenticated role
router.get("/:employee_id", documentController.getEmployeeDocuments);

// Restrict document uploads and deletions to administrative roles
const allowedDocAdminRoles = [
  "Station Master",
  "Station Supervisor",
  "Station Superintendent",
  "Traffic Inspector",
  "Super Admin",
  "AOM",
  "SR.DOM"
];

router.post("/upload", hasRole(...allowedDocAdminRoles), documentController.uploadDocument);
router.delete("/:id", hasRole(...allowedDocAdminRoles), documentController.deleteDocument);

module.exports = router;
