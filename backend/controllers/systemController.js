const pool = require("../config/db");
const os = require("os");

// Cache for system counts
let cachedCounts = null;
let cachedCountsAt = null;
const COUNTS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// GET /api/system/health
exports.getSystemHealth = async (req, res) => {
  try {
    let stats = null;
    let dbLatency = 0;
    let dbTime = null;
    const now = Date.now();

    if (cachedCounts && cachedCountsAt && (now - cachedCountsAt < COUNTS_CACHE_DURATION)) {
      stats = cachedCounts;
      const startPing = Date.now();
      const pingCheck = await pool.query("SELECT NOW() as db_time");
      dbLatency = Date.now() - startPing;
      dbTime = pingCheck.rows[0].db_time;
    } else {
      const startQuery = Date.now();
      const dbCheck = await pool.query(`
        SELECT 
          NOW() as db_time,
          (SELECT COUNT(*) FROM employees) as employees_count,
          (SELECT COUNT(*) FROM stations) as stations_count,
          (SELECT COUNT(*) FROM questions) as questions_count,
          (SELECT COUNT(*) FROM assessments) as assessments_count,
          (SELECT COUNT(*) FROM assessment_results) as results_count,
          (SELECT COUNT(*) FROM exam_attempts) as attempts_count,
          (SELECT COUNT(*) FROM audit_logs) as logs_count
      `);
      dbLatency = Date.now() - startQuery;
      const row = dbCheck.rows[0];
      dbTime = row.db_time;

      stats = {
        employees_count: parseInt(row.employees_count, 10),
        stations_count: parseInt(row.stations_count, 10),
        questions_count: parseInt(row.questions_count, 10),
        assessments_count: parseInt(row.assessments_count, 10),
        results_count: parseInt(row.results_count, 10),
        attempts_count: parseInt(row.attempts_count, 10),
        logs_count: parseInt(row.logs_count, 10)
      };

      cachedCounts = stats;
      cachedCountsAt = now;
    }

    // Memory status check
    const memory = process.memoryUsage();
    const heapUsedPct = (memory.heapUsed / memory.heapTotal) * 100;
    let memoryStatus = "Normal";
    if (heapUsedPct > 85.0) {
      memoryStatus = "Critical";
      console.warn(`[SYSTEM MONITOR] Alert: High Heap Memory Usage detected: ${heapUsedPct.toFixed(2)}%`);
    }

    // CPU load average check
    const loadAvg = os.loadavg();
    const cpuCores = os.cpus().length || 1;
    const cpuLoadPerCore = loadAvg[0] / cpuCores;
    let cpuStatus = "Normal";
    if (cpuLoadPerCore > 0.85) {
      cpuStatus = "Critical";
      console.warn(`[SYSTEM MONITOR] Alert: High CPU Load average per core detected: ${(cpuLoadPerCore * 100).toFixed(2)}%`);
    }

    const healthData = {
      success: true,
      status: (memoryStatus === "Critical" || cpuStatus === "Critical") ? "Warning" : "Healthy",
      database: {
        status: "Connected",
        latency_ms: dbLatency,
        time: dbTime
      },
      counts: {
        employees: stats.employees_count,
        stations: stats.stations_count,
        questions: stats.questions_count,
        assessments: stats.assessments_count,
        assessment_results: stats.results_count,
        exam_attempts: stats.attempts_count,
        audit_logs: stats.logs_count
      },
      system: {
        uptime_seconds: Math.floor(process.uptime()),
        platform: process.platform,
        arch: process.arch,
        memory: {
          ...memory,
          heapUsedPercentage: heapUsedPct.toFixed(2),
          status: memoryStatus
        },
        cpu: {
          load_avg: loadAvg,
          cores: cpuCores,
          load_per_core_percentage: (cpuLoadPerCore * 100).toFixed(2),
          status: cpuStatus
        }
      }
    };

    return res.status(200).json(healthData);
  } catch (error) {
    console.error("System health API error:", error);
    return res.status(500).json({
      success: false,
      status: "Unhealthy",
      database: {
        status: "Disconnected",
        error: error.message
      }
    });
  }
};

// GET /api/system/activity
exports.getSystemActivity = async (req, res) => {
  try {
    // 1. Total event stats
    const statsRes = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM audit_logs) as total_events,
        (SELECT COUNT(*) FROM audit_logs WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h,
        (SELECT COUNT(*) FROM audit_logs WHERE created_at > NOW() - INTERVAL '7 days') as last_7d
    `);
    
    const stats = statsRes.rows[0];

    // 2. Timeline data - count of audit logs by day (last 7 days)
    const timelineRes = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as date,
        COUNT(*) as count
      FROM audit_logs
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date ASC
    `);

    // 3. Module breakdown
    const breakdownRes = await pool.query(`
      SELECT 
        COALESCE(module_name, 'Other') as module_name, 
        COUNT(*) as count
      FROM audit_logs
      GROUP BY module_name
      ORDER BY count DESC
    `);

    return res.status(200).json({
      success: true,
      summary: {
        total_events: parseInt(stats.total_events, 10),
        last_24h: parseInt(stats.last_24h, 10),
        last_7d: parseInt(stats.last_7d, 10)
      },
      timeline: timelineRes.rows.map(r => ({
        date: r.date,
        count: parseInt(r.count, 10)
      })),
      module_breakdown: breakdownRes.rows.map(r => ({
        module_name: r.module_name,
        count: parseInt(r.count, 10)
      }))
    });
  } catch (error) {
    console.error("System activity API error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching system activity summary",
      error: error.message
    });
  }
};

// GET /api/system/audit-logs
exports.getAuditLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = "", 
      module_name = "", 
      action = "", 
      startDate = "", 
      endDate = "", 
      severity = "" 
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let whereClauses = ["1=1"];
    let values = [];
    let placeholderIdx = 1;

    if (search.trim() !== "") {
      const q = `%${search.trim()}%`;
      whereClauses.push(`(al.remarks ILIKE $${placeholderIdx} OR al.action ILIKE $${placeholderIdx} OR e.full_name ILIKE $${placeholderIdx} OR e2.full_name ILIKE $${placeholderIdx})`);
      values.push(q);
      placeholderIdx++;
    }

    if (module_name && module_name !== "All") {
      whereClauses.push(`al.module_name = $${placeholderIdx}`);
      values.push(module_name);
      placeholderIdx++;
    }

    if (action && action !== "All") {
      whereClauses.push(`al.action = $${placeholderIdx}`);
      values.push(action);
      placeholderIdx++;
    }

    if (severity && severity !== "All") {
      whereClauses.push(`al.severity = $${placeholderIdx}`);
      values.push(severity);
      placeholderIdx++;
    }

    if (startDate) {
      whereClauses.push(`al.created_at >= $${placeholderIdx}::timestamp`);
      values.push(startDate + " 00:00:00");
      placeholderIdx++;
    }

    if (endDate) {
      whereClauses.push(`al.created_at <= $${placeholderIdx}::timestamp`);
      values.push(endDate + " 23:59:59");
      placeholderIdx++;
    }

    const whereString = whereClauses.join(" AND ");

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM audit_logs al
      LEFT JOIN employees e ON al.performed_by = e.id
      LEFT JOIN employees e2 ON al.employee_id = e2.id
      WHERE ${whereString}
    `;
    const countRes = await pool.query(countQuery, values);
    const totalCount = parseInt(countRes.rows[0].count, 10);

    // Get paginated data
    const dataQuery = `
      SELECT 
        al.id,
        al.action,
        al.module_name,
        al.remarks,
        al.severity,
        al.created_at,
        e.full_name as performed_by_name,
        e.hrms_id as performed_by_hrms,
        e2.full_name as employee_name,
        e2.hrms_id as employee_hrms
      FROM audit_logs al
      LEFT JOIN employees e ON al.performed_by = e.id
      LEFT JOIN employees e2 ON al.employee_id = e2.id
      WHERE ${whereString}
      ORDER BY al.created_at DESC
      LIMIT $${placeholderIdx} OFFSET $${placeholderIdx + 1}
    `;
    
    const pageValues = [...values, limitNum, offset];
    const dataRes = await pool.query(dataQuery, pageValues);

    return res.status(200).json({
      success: true,
      data: dataRes.rows,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalCount / limitNum) || 1
      }
    });
  } catch (error) {
    console.error("Get audit logs error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching system audit logs",
      error: error.message
    });
  }
};

// GET /api/system/security-events
exports.getSecurityEvents = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = "", 
      startDate = "", 
      endDate = ""
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Security pre-filtering condition
    let whereClauses = ["(al.severity = 'CRITICAL' OR al.action IN ('LOGIN_FAILURE', 'SECURITY_ALERT', 'RESET_PASSWORD'))"];
    let values = [];
    let placeholderIdx = 1;

    if (search.trim() !== "") {
      const q = `%${search.trim()}%`;
      whereClauses.push(`(al.remarks ILIKE $${placeholderIdx} OR al.action ILIKE $${placeholderIdx} OR e.full_name ILIKE $${placeholderIdx} OR e2.full_name ILIKE $${placeholderIdx})`);
      values.push(q);
      placeholderIdx++;
    }

    if (startDate) {
      whereClauses.push(`al.created_at >= $${placeholderIdx}::timestamp`);
      values.push(startDate + " 00:00:00");
      placeholderIdx++;
    }

    if (endDate) {
      whereClauses.push(`al.created_at <= $${placeholderIdx}::timestamp`);
      values.push(endDate + " 23:59:59");
      placeholderIdx++;
    }

    const whereString = whereClauses.join(" AND ");

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM audit_logs al
      LEFT JOIN employees e ON al.performed_by = e.id
      LEFT JOIN employees e2 ON al.employee_id = e2.id
      WHERE ${whereString}
    `;
    const countRes = await pool.query(countQuery, values);
    const totalCount = parseInt(countRes.rows[0].count, 10);

    // Get paginated data
    const dataQuery = `
      SELECT 
        al.id,
        al.action,
        al.module_name,
        al.remarks,
        al.severity,
        al.created_at,
        e.full_name as performed_by_name,
        e.hrms_id as performed_by_hrms,
        e2.full_name as employee_name,
        e2.hrms_id as employee_hrms
      FROM audit_logs al
      LEFT JOIN employees e ON al.performed_by = e.id
      LEFT JOIN employees e2 ON al.employee_id = e2.id
      WHERE ${whereString}
      ORDER BY al.created_at DESC
      LIMIT $${placeholderIdx} OFFSET $${placeholderIdx + 1}
    `;
    
    const pageValues = [...values, limitNum, offset];
    const dataRes = await pool.query(dataQuery, pageValues);

    return res.status(200).json({
      success: true,
      data: dataRes.rows,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalCount / limitNum) || 1
      }
    });
  } catch (error) {
    console.error("Get security events error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching security audit logs",
      error: error.message
    });
  }
};
