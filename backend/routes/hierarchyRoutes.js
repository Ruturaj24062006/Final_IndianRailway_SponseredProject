const express = require("express");
const router = express.Router();
const hierarchyController = require("../controllers/hierarchyController");
const { protect, hasRole } = require("../middleware/authMiddleware");

// All hierarchy routes require token authentication
router.use(protect);

// Query direct subordinates (SM, TI, AOM, Pointsman check own reports)
router.get("/subordinates", hierarchyController.getSubordinates);

// Admin-level endpoints to edit hierarchy links and view Nagpur Division tree
const allowedHierarchyAdmins = ["Super Admin", "AOM", "SR.DOM"];

router.get("/tree", hasRole(...allowedHierarchyAdmins), hierarchyController.getHierarchyTree);
router.post("/assign", hasRole(...allowedHierarchyAdmins), hierarchyController.assignSupervisor);

module.exports = router;
