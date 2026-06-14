const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const { protect } = require("../middleware/authMiddleware");

// All routes require token authentication
router.use(protect);

router.get("/profile", employeeController.getEmployeeProfile);
router.get("/history", employeeController.getEmployeeHistory);
router.get("/audit-logs", employeeController.getEmployeeAuditLogs);
router.get("/safety-reports", employeeController.getSafetyReports);
router.post("/safety-reports", employeeController.createSafetyReport);

module.exports = router;
