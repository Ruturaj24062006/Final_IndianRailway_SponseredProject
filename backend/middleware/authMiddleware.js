const jwt = require("jsonwebtoken");
const pool = require("../config/db");

// Protect routes - Verify JWT and populate req.user
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret && process.env.NODE_ENV === "production") {
        return res.status(500).json({
          success: false,
          message: "Internal configuration error: JWT_SECRET is missing."
        });
      }
      const decoded = jwt.verify(
        token,
        jwtSecret || "railway_secret_key_2026_safe_9923"
      );

      const hrmsIdUpper = decoded.hrms_id.toUpperCase();

      // Fetch employee profile from DB (try employees table first, then users table)
      let employee = null;
      try {
        const empRes = await pool.query(
          `SELECT e.*, s.station_code, s.station_name 
           FROM employees e 
           LEFT JOIN stations s ON e.station_id = s.id 
           WHERE UPPER(e.hrms_id) = $1`,
          [hrmsIdUpper]
        );
        if (empRes.rows.length > 0) {
          employee = empRes.rows[0];
        } else {
          const userRes = await pool.query(
            "SELECT * FROM users WHERE UPPER(hrms_id) = $1",
            [hrmsIdUpper]
          );
          if (userRes.rows.length > 0) {
            employee = userRes.rows[0];
          }
        }
      } catch (dbErr) {
        console.warn("Database lookup error in middleware:", dbErr.message);
      }

      // If employee not found in database, reject access
      if (!employee) {
        return res.status(401).json({
          success: false,
          message: "Not authorized, employee profile not found in database."
        });
      }



      // Format designation/role uniformly
      employee.role = employee.designation || employee.role_tab || employee.role || "Pointsman";

      // Attach user profile to request object
      req.user = {
        id: employee.id,
        hrms_id: employee.hrms_id,
        name: employee.full_name || employee.name,
        designation: employee.role,
        email: employee.email,
        phone: employee.phone,
        station_id: employee.station_id,
        station_code: employee.station_code,
        station_name: employee.station_name,
        gender: employee.gender,
        age: employee.age,
        reporting_officer_id: employee.reporting_officer_id
      };



      return next();
    } catch (error) {
      console.error("JWT verification failed:", error);
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided",
    });
  }
};

// Role-based access control helper
// Standardized list of roles: Pointsman, Station Master, Train Manager, Station Supervisor, Traffic Inspector, AOM, SR.DOM, Super Admin
exports.hasRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, user profile missing",
      });
    }

    const userRole = (req.user.designation || req.user.role || "").trim().toLowerCase();

    // Map common spelling variations in database or frontend
    // e.g. "Station Superintendent" -> "Station Supervisor"
    let normalizedUserRole = userRole
      .replace("station superintendent", "station supervisor")
      .replace("aom/general", "aom");

    // Normalize SR.DOM / Sr. DOM / SRDOM variations to super admin
    const cleanUserRole = userRole.replace(/\./g, "").replace(/\s+/g, "");
    if (cleanUserRole === "srdom") {
      normalizedUserRole = "super admin";
    }

    const isAuthorized = allowedRoles.some((role) => {
      let normalizedRole = role.trim().toLowerCase()
        .replace("station superintendent", "station supervisor")
        .replace("aom/general", "aom");
      const cleanAllowed = role.trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, "");
      if (cleanAllowed === "srdom") {
        normalizedRole = "super admin";
      }
      return normalizedUserRole === normalizedRole;
    });

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access denied for role '${req.user.designation}'. Required: [${allowedRoles.join(", ")}]`,
      });
    }

    return next();
  };
};
