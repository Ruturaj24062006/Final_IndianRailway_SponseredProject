const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { logAuditEvent } = require("../utils/auditLogger");

/**
 * Checks for repeated login failures within the last 10 minutes.
 * If 3 or more failures are found, triggers a CRITICAL security alert and notification.
 */
const checkRepeatedFailures = async (hrmsId, employeeId = null) => {
  try {
    const res = await pool.query(
      `SELECT COUNT(*) FROM audit_logs 
       WHERE action = 'LOGIN_FAILURE' 
         AND remarks ILIKE $1 
         AND created_at > NOW() - INTERVAL '10 minutes'`,
      [`%${hrmsId}%`]
    );
    const count = parseInt(res.rows[0].count, 10);

    if (count >= 3) {
      // 1. Log a CRITICAL audit log entry
      await logAuditEvent({
        employee_id: employeeId,
        action: "SECURITY_ALERT",
        module_name: "Auth",
        remarks: `Security Threat: Repeated login failures (count: ${count}) detected for HRMS ID ${hrmsId} in the last 10 minutes. Possible brute force.`,
        severity: "CRITICAL"
      });

      // 2. Insert notification for Super Admin
      try {
        await pool.query(
          `INSERT INTO notifications (employee_id, title, message, category, target_role, is_read, created_at)
           VALUES ($1, $2, $3, $4, $5, false, NOW())`,
          [
            employeeId,
            "Security Alert: Repeated Login Failures",
            `Repeated login failures detected for HRMS ID ${hrmsId}. Multiple failed attempts recorded in the last 10 minutes.`,
            "Security Alert",
            "Super Admin"
          ]
        );
      } catch (notifErr) {
        console.error("Failed to generate notification for security alert:", notifErr.message);
      }
    }
  } catch (err) {
    console.error("Error checking repeated failures:", err.message);
  }
};

// GET /api/auth/ping
exports.loginPing = async (req, res) => {
  console.log("LOGIN PING HIT");
  return res.status(200).json({ success: true, message: "Auth service online" });
};

// POST /api/auth/login
exports.login = async (req, res) => {
  console.log("LOGIN API HIT");

  try {
    const { hrms_id, password } = req.body;

    if (!hrms_id || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both HRMS ID and password",
      });
    }

    const hrmsIdUpper = hrms_id.trim().toUpperCase();

    // 1. Search user_accounts table
    let userAccount = null;
    try {
      const userRes = await pool.query(
        "SELECT * FROM user_accounts WHERE UPPER(hrms_id) = $1",
        [hrmsIdUpper]
      );
      if (userRes.rows.length > 0) {
        userAccount = userRes.rows[0];
      }
    } catch (dbErr) {
      console.warn("Warning querying user_accounts:", dbErr.message);
    }

    // 2. Fetch employee details
    let employee = null;
    try {
      const empRes = await pool.query(
        "SELECT * FROM employees WHERE UPPER(hrms_id) = $1",
        [hrmsIdUpper]
      );
      if (empRes.rows.length > 0) {
        employee = empRes.rows[0];
      } else {
        const userFallbackRes = await pool.query(
          "SELECT * FROM users WHERE UPPER(hrms_id) = $1",
          [hrmsIdUpper]
        );
        if (userFallbackRes.rows.length > 0) {
          employee = userFallbackRes.rows[0];
        }
      }
    } catch (dbErr) {
      console.warn("Warning querying employees/users:", dbErr.message);
    }

    if (!employee && !userAccount) {
      // Audit log failed login
      await logAuditEvent({
        action: "LOGIN_FAILURE",
        module_name: "Auth",
        remarks: `Failed login attempt: HRMS ID ${hrmsIdUpper} not found.`,
        severity: "WARNING"
      });

      // Check for repeated login failures
      await checkRepeatedFailures(hrmsIdUpper, null);

      return res.status(404).json({
        success: false,
        message: "Employee profile or user account not found",
      });
    }

    // 3. Verify password
    let isMatch = false;

    if (userAccount) {
      const dbPassword = userAccount.password || userAccount.password_hash || userAccount.password_encrypted;
      if (dbPassword) {
        try {
          isMatch = await bcrypt.compare(password, dbPassword);
        } catch (e) {
          isMatch = false;
        }
      }
    }

    if (!isMatch) {
      const empId = employee ? employee.id : (userAccount ? userAccount.employee_id : null);
      await logAuditEvent({
        employee_id: empId,
        action: "LOGIN_FAILURE",
        module_name: "Auth",
        remarks: `Failed login attempt: Invalid password for HRMS ID ${hrmsIdUpper}.`,
        severity: "WARNING"
      });

      // Check for repeated login failures
      await checkRepeatedFailures(hrmsIdUpper, empId);

      return res.status(401).json({
        success: false,
        message: "Invalid HRMS ID or Password",
      });
    }

    // Use employee data if available, otherwise construct from userAccount
    const profile = employee || {
      hrms_id: userAccount.hrms_id,
      name: userAccount.name || userAccount.username || "Employee",
      designation: userAccount.designation || userAccount.role || "Pointsman",
      role_tab: userAccount.role_tab || userAccount.role || "Pointsman",
      id: userAccount.employee_id
    };

    const targetEmpId = profile.id || profile.employee_id || null;

    // 4. Generate JWT
    // Use designation or role_tab as the role
    const employeeRole = profile.designation || profile.role_tab || profile.role || "Pointsman";
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret && process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET environment variable is missing in production!");
    }
    const token = jwt.sign(
      {
        hrms_id: profile.hrms_id,
        role: employeeRole,
      },
      jwtSecret || "railway_secret_key_2026_safe_9923",
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "12h",
      }
    );

    // Audit log successful login
    await logAuditEvent({
      employee_id: targetEmpId,
      action: "LOGIN_SUCCESS",
      module_name: "Auth",
      performed_by: targetEmpId,
      remarks: `User ${profile.full_name || profile.name || 'Employee'} (${profile.hrms_id}) successfully logged in.`
    });

    // 5. Return success
    return res.status(200).json({
      success: true,
      token,
      employee: {
        hrms_id: profile.hrms_id,
        name: profile.name || profile.full_name,
        designation: employeeRole,
        email: profile.email,
        phone: profile.phone || profile.mobile,
        station_code: profile.station_code,
        gender: profile.gender,
        age: profile.age,
        reporting_officer_id: profile.reporting_officer_id
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication",
      error: err.message,
    });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    // req.user is populated by the protect middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    return res.status(200).json({
      success: true,
      employee: req.user,
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching profile",
      error: err.message,
    });
  }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    if (req.user) {
      const hrmsIdUpper = req.user.hrms_id.toUpperCase();
      const empRes = await pool.query(
        "SELECT id FROM employees WHERE UPPER(hrms_id) = $1",
        [hrmsIdUpper]
      );
      const empId = empRes.rows.length > 0 ? empRes.rows[0].id : null;

      await logAuditEvent({
        employee_id: empId,
        action: "LOGOUT",
        module_name: "Auth",
        performed_by: empId,
        remarks: `User ${req.user.name || 'Employee'} (${req.user.hrms_id}) logged out.`
      });
    }

    return res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error during logout",
      error: err.message
    });
  }
};