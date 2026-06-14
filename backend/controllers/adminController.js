const bcrypt = require("bcrypt");
const pool = require("../config/db");
const { logAuditEvent } = require("../utils/auditLogger");
const { getRoleScope } = require("../utils/roleFilter");

// Helper to resolve employee UUID from req.user
async function getActorUuid(hrms_id) {
  if (!hrms_id) return null;
  const res = await pool.query("SELECT id FROM employees WHERE UPPER(hrms_id) = $1", [hrms_id.toUpperCase()]);
  return res.rows.length > 0 ? res.rows[0].id : null;
}

// GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
  try {
    // 1. Counts Summary
    const countsRes = await pool.query(`
      SELECT 
        (SELECT COUNT(DISTINCT station_code) FROM stations) as stations_count,
        (SELECT COUNT(*) FROM employees WHERE designation ILIKE '%pointsman%' OR role_id = 1) as pointsmen_count,
        (SELECT COUNT(*) FROM employees WHERE designation ILIKE '%station master%' OR role_id = 2) as sm_count,
        (SELECT COUNT(*) FROM employees WHERE designation ILIKE '%superintendent%' OR role_id = 4) as ss_count,
        (SELECT COUNT(*) FROM employees WHERE designation ILIKE '%manager%' OR role_id = 3) as tm_count,
        (SELECT COUNT(*) FROM employees WHERE designation ILIKE '%inspector%' OR role_id = 6) as ti_count
    `);
    const counts = countsRes.rows[0];

    // 2. Category Grade Distribution (for Recharts Pie)
    const gradeRes = await pool.query(`
      SELECT 
        COALESCE(category_grade, 'Unassigned') as name, 
        COUNT(*) as count
      FROM employees 
      GROUP BY category_grade
    `);
    
    const totalEmployeesRes = await pool.query("SELECT COUNT(*) FROM employees");
    const totalEmployees = parseInt(totalEmployeesRes.rows[0].count) || 1;

    const pieData = gradeRes.rows.map(row => ({
      name: row.name,
      count: parseInt(row.count),
      value: Math.round((parseInt(row.count) / totalEmployees) * 100)
    }));

    // 3. Station Statistics (Station Name, Code, Completed, Pending, Avg Score, High Risk)
    const stationsStatsRes = await pool.query(`
      SELECT 
        MIN(s.id) as id,
        s.station_code,
        s.station_name as name,
        COALESCE(COUNT(DISTINCT CASE WHEN a.status IN ('Approved', 'Completed') THEN a.id END), 0) as completed,
        COALESCE(COUNT(DISTINCT CASE WHEN a.status = 'Pending' THEN a.id END), 0) as pending,
        ROUND(COALESCE(AVG(ar.final_score), 0), 1) as "avgScore",
        COALESCE(COUNT(DISTINCT CASE WHEN e.risk_level = 'High' THEN e.id END), 0) as "highRisk"
      FROM stations s
      LEFT JOIN (
        SELECT e2.*, s2.station_code as e_station_code
        FROM employees e2
        JOIN stations s2 ON e2.station_id = s2.id
      ) e ON e.e_station_code = s.station_code
      LEFT JOIN assessments a ON a.employee_id = e.id
      LEFT JOIN assessment_results ar ON ar.assessment_id = a.id
      GROUP BY s.station_code, s.station_name
      ORDER BY "avgScore" DESC
    `);

    // 4. Assessment Status Pipeline
    const pipelineRes = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM assessments 
      GROUP BY status
    `);
    const pipelineData = {
      Approved: 0,
      Pending: 0,
      Rejected: 0,
      Overdue: 0
    };
    pipelineRes.rows.forEach(row => {
      if (row.status === 'Approved' || row.status === 'Completed') pipelineData.Approved += parseInt(row.count);
      else if (row.status === 'Pending') pipelineData.Pending += parseInt(row.count);
      else if (row.status === 'Rejected') pipelineData.Rejected += parseInt(row.count);
      else if (row.status === 'Overdue') pipelineData.Overdue += parseInt(row.count);
    });

    // 5. Compliance Analytics
    const complianceRes = await pool.query(`
      SELECT 
        -- Overall safety compliance: non-high risk employees vs total
        ROUND((COUNT(CASE WHEN risk_level != 'High' THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 1) as overall_safety,
        -- PME compliance: employees without expired PME (we check count of active PMEs)
        ROUND((COUNT(CASE WHEN risk_level = 'Normal' OR risk_level = 'Low' THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 1) as pme_rate,
        -- Refresher clearance rate
        ROUND((COUNT(CASE WHEN category_grade IN ('A', 'B') THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 1) as ref_rate
      FROM employees
    `);
    const compRaw = complianceRes.rows[0] || {};
    const complianceList = [
      { label: "Overall Safety Compliance", pct: parseFloat(compRaw.overall_safety) || 100 },
      { label: "PME Completion Rate", pct: parseFloat(compRaw.pme_rate) || 100 },
      { label: "REF Completion Rate", pct: parseFloat(compRaw.ref_rate) || 100 }
    ];

    // 6. Monthly Trend (last 6 months)
    const monthlyTrendRes = await pool.query(`
      SELECT 
        TO_CHAR(a.created_at, 'Mon''YY') as month,
        ROUND(AVG(ar.final_score), 1) as score,
        ROUND((COUNT(CASE WHEN e.risk_level != 'High' THEN 1 END)::numeric / COUNT(e.id)::numeric) * 100, 1) as safety,
        DATE_TRUNC('month', a.created_at) as m_date
      FROM assessments a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN assessment_results ar ON ar.assessment_id = a.id
      GROUP BY TO_CHAR(a.created_at, 'Mon''YY'), DATE_TRUNC('month', a.created_at)
      ORDER BY m_date DESC
      LIMIT 6
    `);
    const monthlyTrend = monthlyTrendRes.rows.reverse();

    return res.status(200).json({
      success: true,
      data: {
        counts: {
          stations: parseInt(counts.stations_count),
          pointsmen: parseInt(counts.pointsmen_count),
          sm: parseInt(counts.sm_count),
          ss: parseInt(counts.ss_count),
          tm: parseInt(counts.tm_count),
          ti: parseInt(counts.ti_count)
        },
        pieData,
        stations: stationsStatsRes.rows,
        pipeline: pipelineData,
        compliance: complianceList,
        monthlyTrend
      }
    });
  } catch (err) {
    console.error("Dashboard API error:", err);
    return res.status(500).json({ success: false, message: "Error loading dashboard", error: err.message });
  }
};

// GET /api/admin/system-health
exports.getSystemHealth = async (req, res) => {
  try {
    const countsRes = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM employees) as employees_count,
        (SELECT COUNT(DISTINCT station_code) FROM stations) as stations_count,
        (SELECT COUNT(*) FROM questions) as questions_count,
        (SELECT COUNT(*) FROM assessments) as assessments_count
    `);
    const counts = countsRes.rows[0];

    const lastLoginRes = await pool.query("SELECT MAX(last_login) as last_login_time FROM user_accounts");
    const lastLoginTime = lastLoginRes.rows[0]?.last_login_time || null;

    return res.status(200).json({
      success: true,
      data: {
        employees_count: parseInt(counts.employees_count),
        stations_count: parseInt(counts.stations_count),
        questions_count: parseInt(counts.questions_count),
        assessments_count: parseInt(counts.assessments_count),
        database_status: "Healthy",
        last_login_time: lastLoginTime
      }
    });
  } catch (err) {
    console.error("System health API error:", err);
    return res.status(500).json({
      success: false,
      data: {
        database_status: "Unhealthy",
        error: err.message
      }
    });
  }
};

// GET /api/admin/employees
exports.getEmployees = async (req, res) => {
  try {
    const { role_id, station_id, category_grade, risk_level, status, search } = req.query;
    
    let queryText = `
      SELECT 
        e.*,
        s.station_code,
        s.station_name,
        s.division,
        s.zone,
        r.role_name,
        COALESCE(ar.final_score, 0) as score,
        COALESCE(ar.fitness_status, 'Fit') as pme_status,
        COALESCE(TO_CHAR(ar.created_at, 'YYYY-MM-DD'), '') as last_assessment_date
      FROM employees e
      LEFT JOIN stations s ON e.station_id = s.id
      LEFT JOIN roles r ON e.role_id = r.id
      LEFT JOIN (
        SELECT DISTINCT ON (employee_id) employee_id, final_score, fitness_status, created_at
        FROM assessment_results
        ORDER BY employee_id, created_at DESC
      ) ar ON ar.employee_id = e.id
      WHERE 1=1
    `;
    const { scope, stationIds, employeeIds, userId } = await getRoleScope(req.user);
    const values = [];
    let placeholderIdx = 1;

    // Apply role scope filters first
    if (scope === "station" || scope === "ti") {
      if (station_id && station_id !== 'All') {
        const parsedStationId = parseInt(station_id, 10);
        if (!stationIds.includes(parsedStationId)) {
          return res.status(403).json({ success: false, message: "Access denied." });
        }
        queryText += ` AND e.station_id = $${placeholderIdx}`;
        values.push(parsedStationId);
        placeholderIdx++;
      } else {
        queryText += ` AND e.station_id = ANY($${placeholderIdx})`;
        values.push(stationIds);
        placeholderIdx++;
      }
    } else if (scope === "own") {
      queryText += ` AND e.id = $${placeholderIdx}`;
      values.push(userId);
      placeholderIdx++;
    } else {
      if (station_id && station_id !== 'All') {
        queryText += ` AND e.station_id = $${placeholderIdx}`;
        values.push(parseInt(station_id, 10));
        placeholderIdx++;
      }
    }

    if (role_id && role_id !== 'All') {
      queryText += ` AND e.role_id = $${placeholderIdx}`;
      values.push(role_id);
      placeholderIdx++;
    }

    if (category_grade && category_grade !== 'All') {
      queryText += ` AND e.category_grade = $${placeholderIdx}`;
      values.push(category_grade);
      placeholderIdx++;
    }

    if (risk_level && risk_level !== 'All') {
      queryText += ` AND e.risk_level = $${placeholderIdx}`;
      values.push(risk_level);
      placeholderIdx++;
    }

    if (status && status !== 'All') {
      queryText += ` AND e.status = $${placeholderIdx}`;
      values.push(status);
      placeholderIdx++;
    }

    if (search && search.trim() !== '') {
      const q = `%${search.trim()}%`;
      queryText += ` AND (e.full_name ILIKE $${placeholderIdx} OR e.hrms_id ILIKE $${placeholderIdx} OR e.employee_id ILIKE $${placeholderIdx})`;
      values.push(q);
      placeholderIdx++;
    }

    queryText += " ORDER BY e.full_name ASC";
    const resEmployees = await pool.query(queryText, values);

    return res.status(200).json({
      success: true,
      data: resEmployees.rows
    });
  } catch (err) {
    console.error("Get employees API error:", err);
    return res.status(500).json({ success: false, message: "Error retrieving employees", error: err.message });
  }
};

// POST /api/admin/employees
exports.createEmployee = async (req, res) => {
  try {
    const { 
      employee_id, full_name, hrms_id, pf_number, role_id, station_id, 
      designation, category_grade, risk_level, status, create_login, password 
    } = req.body;

    const actorId = await getActorUuid(req.user?.hrms_id);

    // Insert employee
    const insertEmpQuery = `
      INSERT INTO employees (
        employee_id, full_name, hrms_id, pf_number, role_id, station_id, 
        designation, category_grade, risk_level, status, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `;
    const empValues = [
      employee_id, full_name, hrms_id ? hrms_id.toUpperCase() : null, pf_number, 
      role_id || null, station_id || null, designation, category_grade, 
      risk_level || 'Normal', status || 'Active'
    ];

    const empRes = await pool.query(insertEmpQuery, empValues);
    const newEmployee = empRes.rows[0];

    // Create user login account automatically if HRMS ID exists
    if (newEmployee.hrms_id) {
      const plainPassword = password || "Railway@123";
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      
      const insertUserQuery = `
        INSERT INTO user_accounts (employee_id, hrms_id, password_hash, is_active, created_at)
        VALUES ($1, $2, $3, true, NOW())
      `;
      await pool.query(insertUserQuery, [newEmployee.id, newEmployee.hrms_id.toUpperCase(), hashedPassword]);
    }

    // Log to audit trail
    await logAuditEvent({
      employee_id: newEmployee.id,
      action: "CREATE_EMPLOYEE",
      module_name: "Employees",
      performed_by: actorId,
      remarks: `Created employee profile for ${full_name} (${hrms_id}). login account created: ${!!create_login}`
    });

    return res.status(201).json({
      success: true,
      message: "Employee profile created successfully",
      data: newEmployee
    });
  } catch (err) {
    console.error("Create employee API error:", err);
    return res.status(500).json({ success: false, message: "Error creating employee profile", error: err.message });
  }
};

// PUT /api/admin/employees/:id
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      employee_id, full_name, hrms_id, pf_number, role_id, station_id, 
      designation, category_grade, risk_level, status 
    } = req.body;

    const actorId = await getActorUuid(req.user?.hrms_id);

    // Fetch existing employee state
    const currentEmpRes = await pool.query("SELECT * FROM employees WHERE id = $1", [id]);
    if (currentEmpRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Employee profile not found" });
    }
    const currentEmp = currentEmpRes.rows[0];

    // Update query
    const updateEmpQuery = `
      UPDATE employees
      SET 
        employee_id = $1, 
        full_name = $2, 
        hrms_id = $3, 
        pf_number = $4, 
        role_id = $5, 
        station_id = $6, 
        designation = $7, 
        category_grade = $8, 
        risk_level = $9, 
        status = $10,
        updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `;
    const empValues = [
      employee_id !== undefined ? employee_id : currentEmp.employee_id,
      full_name !== undefined ? full_name : currentEmp.full_name,
      hrms_id !== undefined ? (hrms_id ? hrms_id.toUpperCase() : null) : currentEmp.hrms_id,
      pf_number !== undefined ? pf_number : currentEmp.pf_number,
      role_id !== undefined ? role_id : currentEmp.role_id,
      station_id !== undefined ? station_id : currentEmp.station_id,
      designation !== undefined ? designation : currentEmp.designation,
      category_grade !== undefined ? category_grade : currentEmp.category_grade,
      risk_level !== undefined ? risk_level : currentEmp.risk_level,
      status !== undefined ? status : currentEmp.status,
      id
    ];

    const empRes = await pool.query(updateEmpQuery, empValues);
    const updatedEmployee = empRes.rows[0];

    // Rule: logical deactivation. If status is set to 'Inactive', set user_account is_active to false
    if (status === 'Inactive') {
      await pool.query("UPDATE user_accounts SET is_active = false WHERE employee_id = $1", [id]);
    } else if (status === 'Active') {
      await pool.query("UPDATE user_accounts SET is_active = true WHERE employee_id = $1", [id]);
    }

    // Log to audit trail
    await logAuditEvent({
      employee_id: id,
      action: "UPDATE_EMPLOYEE",
      module_name: "Employees",
      performed_by: actorId,
      remarks: `Updated employee profile for ${updatedEmployee.full_name}. Active status: ${updatedEmployee.status}`
    });

    return res.status(200).json({
      success: true,
      message: "Employee profile updated successfully",
      data: updatedEmployee
    });
  } catch (err) {
    console.error("Update employee API error:", err);
    return res.status(500).json({ success: false, message: "Error updating employee profile", error: err.message });
  }
};

// GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const usersRes = await pool.query(`
      SELECT 
        ua.id,
        ua.employee_id,
        ua.hrms_id,
        ua.is_active,
        ua.last_login,
        ua.created_at,
        e.full_name as name,
        e.designation,
        e.status as employee_status
      FROM user_accounts ua
      LEFT JOIN employees e ON ua.employee_id = e.id
      ORDER BY ua.created_at DESC
    `);

    return res.status(200).json({
      success: true,
      data: usersRes.rows
    });
  } catch (err) {
    console.error("Get users API error:", err);
    return res.status(500).json({ success: false, message: "Error loading user logins", error: err.message });
  }
};

// POST /api/admin/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { hrms_id, password } = req.body;

    if (!hrms_id || !password) {
      return res.status(400).json({ success: false, message: "Please specify HRMS ID and new password" });
    }

    const actorId = await getActorUuid(req.user?.hrms_id);
    const targetHrms = hrms_id.trim().toUpperCase();

    // Check account exists
    const accountCheck = await pool.query("SELECT employee_id FROM user_accounts WHERE UPPER(hrms_id) = $1", [targetHrms]);
    if (accountCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User account not found" });
    }
    const empId = accountCheck.rows[0].employee_id;

    // Hash & update
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query("UPDATE user_accounts SET password_hash = $1 WHERE UPPER(hrms_id) = $2", [hashedPassword, targetHrms]);

    // Log to audit trail
    await logAuditEvent({
      employee_id: empId,
      action: "RESET_PASSWORD",
      module_name: "UserAccounts",
      performed_by: actorId,
      remarks: `Reset password for login account: ${targetHrms}`
    });

    return res.status(200).json({
      success: true,
      message: `Password reset successfully for ${targetHrms}`
    });
  } catch (err) {
    console.error("Reset password API error:", err);
    return res.status(500).json({ success: false, message: "Error resetting password", error: err.message });
  }
};

// GET /api/admin/stations
exports.getStations = async (req, res) => {
  try {
    const { scope, stationIds } = await getRoleScope(req.user);

    let queryText = `
      SELECT 
        MIN(s.id) as id,
        s.station_code,
        s.station_name,
        MIN(s.division) as division,
        MIN(s.zone) as zone,
        MIN(s.created_at) as created_at,
        COALESCE(COUNT(DISTINCT CASE WHEN e.role_id = 2 THEN e.id END), 0) as sm_count,
        COALESCE(COUNT(DISTINCT CASE WHEN e.role_id = 1 THEN e.id END), 0) as pm_count,
        ROUND(COALESCE(AVG(ar.final_score), 0), 1) as avg_score,
        COALESCE(COUNT(DISTINCT CASE WHEN e.risk_level = 'High' THEN e.id END), 0) as high_risk_count,
        COALESCE(COUNT(DISTINCT CASE WHEN a.status = 'Pending' THEN a.id END), 0) as pending_count
      FROM stations s
      LEFT JOIN (
        SELECT e2.*, s2.station_code as e_station_code
        FROM employees e2
        JOIN stations s2 ON e2.station_id = s2.id
      ) e ON e.e_station_code = s.station_code
      LEFT JOIN assessments a ON a.employee_id = e.id
      LEFT JOIN assessment_results ar ON ar.assessment_id = a.id
    `;

    const values = [];
    if (scope === "station" || scope === "ti") {
      queryText += ` WHERE s.id = ANY($1) `;
      values.push(stationIds);
    }

    queryText += `
      GROUP BY s.station_code, s.station_name
      ORDER BY s.station_name ASC
    `;

    const stationsRes = await pool.query(queryText, values);

    return res.status(200).json({
      success: true,
      data: stationsRes.rows
    });
  } catch (err) {
    console.error("Get stations API error:", err);
    return res.status(500).json({ success: false, message: "Error retrieving stations", error: err.message });
  }
};

// POST /api/admin/stations
exports.createStation = async (req, res) => {
  try {
    const { station_code, station_name, division, zone } = req.body;
    const actorId = await getActorUuid(req.user?.hrms_id);

    if (!station_code || !station_name) {
      return res.status(400).json({ success: false, message: "Station code and station name are required" });
    }

    // Check if station code already exists
    const existingStation = await pool.query("SELECT id FROM stations WHERE UPPER(station_code) = $1", [station_code.toUpperCase()]);
    if (existingStation.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Station with code '${station_code.toUpperCase()}' already exists.`
      });
    }

    const insertQuery = `
      INSERT INTO stations (station_code, station_name, division, zone, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    const values = [station_code.toUpperCase(), station_name, division || 'Nagpur (NGP)', zone || 'Central Railway'];
    const dbRes = await pool.query(insertQuery, values);
    const newStation = dbRes.rows[0];

    // Log to audit
    await logAuditEvent({
      action: "CREATE_STATION",
      module_name: "Stations",
      performed_by: actorId,
      remarks: `Created station ${newStation.station_name} (${newStation.station_code})`
    });

    return res.status(201).json({
      success: true,
      message: "Station created successfully",
      data: newStation
    });
  } catch (err) {
    console.error("Create station API error:", err);
    return res.status(500).json({ success: false, message: "Error creating station", error: err.message });
  }
};

// PUT /api/admin/stations/:id
exports.updateStation = async (req, res) => {
  try {
    const { id } = req.params;
    const { station_code, station_name, division, zone } = req.body;
    const actorId = await getActorUuid(req.user?.hrms_id);

    const checkRes = await pool.query("SELECT * FROM stations WHERE id = $1", [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Station not found" });
    }
    const currentSt = checkRes.rows[0];

    const updateQuery = `
      UPDATE stations
      SET 
        station_code = $1,
        station_name = $2,
        division = $3,
        zone = $4
      WHERE id = $5
      RETURNING *
    `;
    const values = [
      station_code !== undefined ? station_code.toUpperCase() : currentSt.station_code,
      station_name !== undefined ? station_name : currentSt.station_name,
      division !== undefined ? division : currentSt.division,
      zone !== undefined ? zone : currentSt.zone,
      id
    ];
    const dbRes = await pool.query(updateQuery, values);
    const updatedStation = dbRes.rows[0];

    // Log to audit
    await logAuditEvent({
      action: "UPDATE_STATION",
      module_name: "Stations",
      performed_by: actorId,
      remarks: `Updated station ${updatedStation.station_name} (${updatedStation.station_code})`
    });

    return res.status(200).json({
      success: true,
      message: "Station updated successfully",
      data: updatedStation
    });
  } catch (err) {
    console.error("Update station API error:", err);
    return res.status(500).json({ success: false, message: "Error updating station", error: err.message });
  }
};

// GET /api/admin/questions
exports.getQuestions = async (req, res) => {
  try {
    const questionsRes = await pool.query(`
      SELECT q.*, r.role_name
      FROM questions q
      LEFT JOIN roles r ON q.role_id = r.id
      ORDER BY q.id DESC
    `);

    return res.status(200).json({
      success: true,
      data: questionsRes.rows
    });
  } catch (err) {
    console.error("Get questions API error:", err);
    return res.status(500).json({ success: false, message: "Error loading question bank", error: err.message });
  }
};

// POST /api/admin/questions
exports.createQuestion = async (req, res) => {
  try {
    const { role_id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks, is_active } = req.body;
    const actorId = await getActorUuid(req.user?.hrms_id);

    if (!role_id || !question_text || !option_a || !option_b || !correct_answer) {
      return res.status(400).json({ success: false, message: "Required fields missing for safety question" });
    }

    const insertQuery = `
      INSERT INTO questions (
        role_id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks, is_active, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *
    `;
    const values = [
      role_id, question_text, option_a, option_b, option_c || null, option_d || null,
      correct_answer, marks || 1, is_active !== undefined ? is_active : true
    ];
    const dbRes = await pool.query(insertQuery, values);
    const newQuestion = dbRes.rows[0];

    // Log to audit
    await logAuditEvent({
      action: "CREATE_QUESTION",
      module_name: "Questions",
      performed_by: actorId,
      remarks: `Created safety question for role ID ${role_id}: "${question_text.substring(0, 30)}..."`
    });

    return res.status(201).json({
      success: true,
      message: "Safety question created successfully",
      data: newQuestion
    });
  } catch (err) {
    console.error("Create question API error:", err);
    return res.status(500).json({ success: false, message: "Error creating safety question", error: err.message });
  }
};

// PUT /api/admin/questions/:id
exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { role_id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks, is_active } = req.body;
    const actorId = await getActorUuid(req.user?.hrms_id);

    const checkRes = await pool.query("SELECT * FROM questions WHERE id = $1", [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }
    const currentQ = checkRes.rows[0];

    const updateQuery = `
      UPDATE questions
      SET 
        role_id = $1,
        question_text = $2,
        option_a = $3,
        option_b = $4,
        option_c = $5,
        option_d = $6,
        correct_answer = $7,
        marks = $8,
        is_active = $9
      WHERE id = $10
      RETURNING *
    `;
    const values = [
      role_id !== undefined ? role_id : currentQ.role_id,
      question_text !== undefined ? question_text : currentQ.question_text,
      option_a !== undefined ? option_a : currentQ.option_a,
      option_b !== undefined ? option_b : currentQ.option_b,
      option_c !== undefined ? option_c : currentQ.option_c,
      option_d !== undefined ? option_d : currentQ.option_d,
      correct_answer !== undefined ? correct_answer : currentQ.correct_answer,
      marks !== undefined ? marks : currentQ.marks,
      is_active !== undefined ? is_active : currentQ.is_active,
      id
    ];
    const dbRes = await pool.query(updateQuery, values);
    const updatedQ = dbRes.rows[0];

    // Log to audit
    await logAuditEvent({
      action: "UPDATE_QUESTION",
      module_name: "Questions",
      performed_by: actorId,
      remarks: `Updated safety question ID ${id}: "${updatedQ.question_text.substring(0, 30)}...". is_active: ${updatedQ.is_active}`
    });

    return res.status(200).json({
      success: true,
      message: "Safety question updated successfully",
      data: updatedQ
    });
  } catch (err) {
    console.error("Update question API error:", err);
    return res.status(500).json({ success: false, message: "Error updating question", error: err.message });
  }
};

// DELETE /api/admin/questions/:id
exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const actorId = await getActorUuid(req.user?.hrms_id);

    // Rule: Do not physically delete questions. Use is_active = false for deactivation.
    const checkRes = await pool.query("SELECT * FROM questions WHERE id = $1", [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    const deactivateQuery = `
      UPDATE questions
      SET is_active = false
      WHERE id = $1
      RETURNING *
    `;
    const dbRes = await pool.query(deactivateQuery, [id]);
    const deactivatedQ = dbRes.rows[0];

    // Log to audit
    await logAuditEvent({
      action: "DEACTIVATE_QUESTION",
      module_name: "Questions",
      performed_by: actorId,
      remarks: `Deactivated (logical delete) safety question ID ${id}`
    });

    return res.status(200).json({
      success: true,
      message: "Safety question deactivated successfully",
      data: deactivatedQ
    });
  } catch (err) {
    console.error("Deactivate question API error:", err);
    return res.status(500).json({ success: false, message: "Error deactivating question", error: err.message });
  }
};

// GET /api/admin/reports
exports.getReports = async (req, res) => {
  try {
    const { role, ti, station, cat, risk, search } = req.query;

    let queryText = `
      SELECT 
        e.id,
        e.full_name as name,
        e.designation as role,
        s.station_name as station,
        COALESCE(e.category_grade, 'Unassigned') as cat,
        e.risk_level as risk,
        e.status,
        COALESCE(e.mobile, '—') as contact,
        COALESCE(TO_CHAR(e.date_of_joining, 'YYYY-MM-DD'), '—') as "joiningDate",
        COALESCE(ar.final_score, 0) as score,
        COALESCE(ar.fitness_status, 'Fit') as "pmeStatus",
        'Cleared' as "refStatus"
      FROM employees e
      LEFT JOIN stations s ON e.station_id = s.id
      LEFT JOIN roles r ON e.role_id = r.id
      LEFT JOIN (
        SELECT DISTINCT ON (employee_id) employee_id, final_score, fitness_status
        FROM assessment_results
        ORDER BY employee_id, created_at DESC
      ) ar ON ar.employee_id = e.id
      WHERE 1=1
    `;
    const values = [];
    let placeholderIdx = 1;

    if (role && role !== 'All') {
      // Map frontend tab names to designation keywords if needed
      queryText += ` AND (e.designation ILIKE $${placeholderIdx} OR r.role_name ILIKE $${placeholderIdx})`;
      values.push(`%${role}%`);
      placeholderIdx++;
    }

    if (station && station !== 'All') {
      queryText += ` AND s.station_name = $${placeholderIdx}`;
      values.push(station);
      placeholderIdx++;
    }

    if (cat && cat !== 'All') {
      queryText += ` AND e.category_grade = $${placeholderIdx}`;
      values.push(cat);
      placeholderIdx++;
    }

    if (risk && risk !== 'All') {
      queryText += ` AND e.risk_level = $${placeholderIdx}`;
      values.push(risk);
      placeholderIdx++;
    }

    if (search && search.trim() !== '') {
      const q = `%${search.trim()}%`;
      queryText += ` AND (e.full_name ILIKE $${placeholderIdx} OR e.hrms_id ILIKE $${placeholderIdx})`;
      values.push(q);
      placeholderIdx++;
    }

    queryText += " ORDER BY e.full_name ASC";
    const reportRes = await pool.query(queryText, values);

    return res.status(200).json({
      success: true,
      data: reportRes.rows
    });
  } catch (err) {
    console.error("Get reports API error:", err);
    return res.status(500).json({ success: false, message: "Error generating reports data", error: err.message });
  }
};

// GET /api/admin/audit-logs
exports.getAuditLogs = async (req, res) => {
  try {
    const logsRes = await pool.query(`
      SELECT 
        al.*, 
        e.full_name as performed_by_name,
        e2.full_name as employee_name
      FROM audit_logs al
      LEFT JOIN employees e ON al.performed_by = e.id
      LEFT JOIN employees e2 ON al.employee_id = e2.id
      ORDER BY al.created_at DESC
      LIMIT 100
    `);

    return res.status(200).json({
      success: true,
      data: logsRes.rows
    });
  } catch (err) {
    console.error("Get audit logs API error:", err);
    return res.status(500).json({ success: false, message: "Error loading system audit trails", error: err.message });
  }
};
