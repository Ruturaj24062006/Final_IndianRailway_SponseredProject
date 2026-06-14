const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { protect, hasRole } = require("../middleware/authMiddleware");

// ── All Admin routes require valid JWT ──────────────────
router.use(protect);

const superAdminOnly = hasRole("Super Admin");
const viewRoles = hasRole("Super Admin", "Traffic Inspector", "AOM", "AOM/General", "Station Master", "Station Superintendent", "Station Supervisor");

// ── Dashboard & System ───────────────────────────────────────────────────────
router.get("/dashboard",        superAdminOnly, adminController.getDashboard);
router.get("/system-health",    superAdminOnly, adminController.getSystemHealth);
router.get("/audit-logs",       superAdminOnly, adminController.getAuditLogs);

// ── Employee Management ──────────────────────────────────────────────────────
router.get("/employees",        viewRoles, adminController.getEmployees);
router.post("/employees",       superAdminOnly, adminController.createEmployee);
router.put("/employees/:id",    superAdminOnly, adminController.updateEmployee);
// Note: No physical DELETE for employees — use PUT with status='Inactive'

// ── User Account Management ──────────────────────────────────────────────────
router.get("/users",            superAdminOnly, adminController.getUsers);
router.post("/reset-password",  superAdminOnly, adminController.resetPassword);

// ── Station Management ───────────────────────────────────────────────────────
router.get("/stations",         viewRoles, adminController.getStations);
router.post("/stations",        superAdminOnly, adminController.createStation);
router.put("/stations/:id",     superAdminOnly, adminController.updateStation);

// ── Question Bank Management ─────────────────────────────────────────────────
router.get("/questions",        superAdminOnly, adminController.getQuestions);
router.post("/questions",       superAdminOnly, adminController.createQuestion);
router.put("/questions/:id",    superAdminOnly, adminController.updateQuestion);
// Note: DELETE sets is_active = false — no physical deletion
router.delete("/questions/:id", superAdminOnly, adminController.deleteQuestion);

// ── Reports & Analytics ──────────────────────────────────────────────────────
router.get("/reports",          superAdminOnly, adminController.getReports);

module.exports = router;
