const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");


router.get("/ping", (req, res) => {
    res.json({ message: "Auth Route Working" });
});
// POST /api/auth/login - Public route
router.post("/login", authController.login);

// GET /api/auth/me - Protected route
router.get("/me", protect, authController.getMe);

// POST /api/auth/logout - Protected route
router.post("/logout", protect, authController.logout);


module.exports = router;
