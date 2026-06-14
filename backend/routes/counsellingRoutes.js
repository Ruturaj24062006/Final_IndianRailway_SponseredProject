const express = require("express");
const router = express.Router();
const counsellingController = require("../controllers/counsellingController");
const { protect, hasRole } = require("../middleware/authMiddleware");

// All counselling routes require login authentication
router.use(protect);

// Get records is open to all authenticated roles (Pointsman can view own, SM/TI can view filtered)
router.get("/", counsellingController.getCounsellingRecords);
router.get("/employee/:employee_id", counsellingController.getEmployeeCounsellingRecords);

// Log & update actions are restricted to management roles: SM, TI, SS, Super Admin
const allowedCounsellorRoles = [
  "Station Master",
  "Station Supervisor",
  "Station Superintendent",
  "Traffic Inspector",
  "Super Admin",
  "AOM",
  "SR.DOM"
];

router.post("/", hasRole(...allowedCounsellorRoles), counsellingController.createCounselling);
router.put("/:id", hasRole(...allowedCounsellorRoles), counsellingController.updateCounselling);
router.put("/:id/status", hasRole(...allowedCounsellorRoles), counsellingController.updateCounselling);

module.exports = router;
