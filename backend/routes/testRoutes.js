const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/employees", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM employees LIMIT 5"
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

module.exports = router;