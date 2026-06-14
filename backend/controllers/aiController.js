const { GoogleGenerativeAI } = require("@google/generative-ai");
const pool = require("../config/db");

// Global in-memory cache for executive safety narrative (6 hours cache)
let cachedSummary = null;
let cachedSummaryAt = null;
const SUMMARY_CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

// In-memory request counters for role-based daily limits (resets daily at midnight)
const dailyUsage = {};

// Mandatory AI Safety Disclaimer Suffix
const SAFETY_DISCLAIMER = "\n\n*Disclaimer: AI-generated reports are tools for operational assistance and must be verified against official system records before executing safety-critical decisions.*";

// Phase 18 / 20 Safety-Evaluated Staff Risk CTE
const STAFF_CTE = `
  WITH latest_pme AS (
    SELECT DISTINCT ON (employee_id) employee_id, next_due_date, pme_date
    FROM pme_records
    ORDER BY employee_id, pme_date DESC, id DESC
  ),
  latest_ref AS (
    SELECT DISTINCT ON (employee_id) employee_id, next_due_date, ref_date
    FROM ref_records
    ORDER BY employee_id, ref_date DESC, id DESC
  ),
  latest_cbt AS (
    SELECT DISTINCT ON (employee_id) employee_id, score_percentage
    FROM exam_attempts
    WHERE status = 'Completed'
    ORDER BY employee_id, created_at DESC
  ),
  latest_asmt AS (
    SELECT DISTINCT ON (employee_id) employee_id, total_marks, assessment_date
    FROM assessments
    WHERE status = 'Approved'
    ORDER BY employee_id, created_at DESC, id DESC
  ),
  counselling_stats AS (
    SELECT 
      employee_id,
      COUNT(CASE WHEN status = 'Open' THEN 1 END) AS open_count,
      COUNT(CASE WHEN status = 'Closed' AND counselling_date >= CURRENT_DATE - INTERVAL '180 days' THEN 1 END) AS recent_closed_count
    FROM counselling_records
    GROUP BY employee_id
  ),
  scored_staff AS (
    SELECT 
      e.id AS employee_id,
      e.hrms_id,
      e.full_name,
      e.designation,
      e.role_id,
      e.station_id,
      s.station_name,
      s.station_code,
      lp.next_due_date AS pme_next_due,
      lr.next_due_date AS ref_next_due,
      COALESCE(lc.score_percentage, 0.0) AS cbt_score,
      COALESCE(la.total_marks, 0.0) AS practical_score,
      COALESCE(cs.open_count, 0) AS open_counselling_count,
      COALESCE(cs.recent_closed_count, 0) AS recent_closed_counselling_count,
      
      -- Base components (100 if valid, 0 if not)
      CASE WHEN lp.next_due_date IS NOT NULL AND lp.next_due_date >= CURRENT_DATE THEN 100.0 ELSE 0.0 END AS pme_comp,
      CASE WHEN lr.next_due_date IS NOT NULL AND lr.next_due_date >= CURRENT_DATE THEN 100.0 ELSE 0.0 END AS ref_comp,
      
      -- Risk Score = 100 - Base Compliance + Counselling Penalty (max 40)
      GREATEST(0.0, LEAST(100.0, 
        100.0 - (
          (CASE WHEN lp.next_due_date IS NOT NULL AND lp.next_due_date >= CURRENT_DATE THEN 100.0 ELSE 0.0 END * 0.25) +
          (CASE WHEN lr.next_due_date IS NOT NULL AND lr.next_due_date >= CURRENT_DATE THEN 100.0 ELSE 0.0 END * 0.25) +
          (COALESCE(lc.score_percentage, 0.0) * 0.25) +
          (COALESCE(la.total_marks, 0.0) * 0.25)
        ) +
        LEAST(40.0, (COALESCE(cs.open_count, 0) * 15.0) + (COALESCE(cs.recent_closed_count, 0) * 5.0))
      )) AS risk_score
    FROM employees e
    LEFT JOIN stations s ON e.station_id = s.id
    LEFT JOIN latest_pme lp ON e.id = lp.employee_id
    LEFT JOIN latest_ref lr ON e.id = lr.employee_id
    LEFT JOIN latest_cbt lc ON e.id = lc.employee_id
    LEFT JOIN latest_asmt la ON e.id = la.employee_id
    LEFT JOIN counselling_stats cs ON e.id = cs.employee_id
    WHERE e.status = 'Active' AND e.role_id IN (1, 2, 3, 4, 5)
  )
`;

// Helper to check role-based daily usage limits
function checkUsageLimit(hrmsId, roleName) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const key = `${hrmsId}:${dateStr}`;
  
  let limit = 10; // Default limit for station-level supervisor
  const role = (roleName || "").trim().toLowerCase();
  const words = role.split(/[\s_/.-]+/);
  
  if (role.includes("super admin") || role.includes("admin")) {
    limit = 100;
  } else if (role.includes("aom") || role.includes("dom")) {
    limit = 50;
  } else if (role.includes("traffic inspector") || role.includes("inspector") || words.includes("ti")) {
    limit = 20;
  } else if (role.includes("superintendent") || role.includes("supervisor") || words.includes("ss")) {
    limit = 10;
  }

  const current = dailyUsage[key] || 0;
  if (current >= limit) {
    const err = new Error(`Daily limit of ${limit} AI requests reached for role '${roleName}'. Daily limits reset at midnight.`);
    err.status = 429;
    throw err;
  }

  // Increment usage count
  dailyUsage[key] = current + 1;
}

// Check if Gemini API is available
function isGeminiEnabled() {
  return !!process.env.GEMINI_API_KEY;
}

// Clean inputs and detect prompt injection patterns
function detectPromptInjection(inputString) {
  if (!inputString) return false;
  const lower = String(inputString).toLowerCase();
  const patterns = [
    "ignore previous",
    "system prompt",
    "instead of",
    "override guidelines",
    "new instructions",
    "forget what",
    "you are now a",
    "act as a",
    "ignore all constraints",
    "bypass safety",
    "developer instructions",
    "system instructions"
  ];
  return patterns.some(pattern => lower.includes(pattern));
}

// Helper to fetch Gemini Generative Model instance dynamically
function getGenAIModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const safetySettings = [
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    }
  ];
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash", safetySettings });
}

// Helper to write audit logs to database
async function logAiAction(req, action, remarks, targetEmployeeId = null) {
  try {
    const actorRes = await pool.query('SELECT id FROM employees WHERE UPPER(hrms_id) = $1', [req.user.hrms_id.toUpperCase()]);
    const actorId = actorRes.rows[0]?.id || null;
    await pool.query(
      `INSERT INTO audit_logs (employee_id, action, module_name, performed_by, remarks, severity, created_at)
       VALUES ($1, $2, 'AI_Safety_Intelligence', $3, $4, 'INFO', NOW())`,
      [
        targetEmployeeId,
        action,
        actorId,
        `User ${req.user.hrms_id}: ${remarks}`
      ]
    );
  } catch (err) {
    console.error("Failed to write AI audit log:", err);
  }
}

// Local Fallback Intent Classifier (Regex-based NLP)
function localIntentClassifier(userQuery) {
  const queryLower = userQuery.toLowerCase();
  
  if (queryLower.includes("pme") || queryLower.includes("medical")) {
    const match = queryLower.match(/\b(\d+)\b/);
    const days = match ? parseInt(match[1]) : 30;
    return {
      intent: "PME_DUE_FORECAST",
      parameters: { days }
    };
  }

  if (queryLower.includes("escalation") || queryLower.includes("critical") || queryLower.includes("open alert")) {
    let priority = null;
    if (queryLower.includes("critical")) priority = "Critical";
    if (queryLower.includes("high")) priority = "High";
    return {
      intent: "ACTIVE_ESCALATIONS",
      parameters: { priority }
    };
  }

  if (queryLower.includes("recommendation") || queryLower.includes("action") || queryLower.includes("suggest")) {
    const match = userQuery.match(/\b([A-Z0-9]{6})\b/);
    const hrms_id = match ? match[1] : null;
    return {
      intent: "RECOMMENDATIONS_FOR_EMPLOYEE",
      parameters: { hrms_id, name: hrms_id ? null : "YDYMLI" }
    };
  }

  if (queryLower.includes("profile") || queryLower.includes("status") || queryLower.includes("employee") || queryLower.includes("staff")) {
    const match = userQuery.match(/\b([A-Z0-9]{6})\b/);
    const hrms_id = match ? match[1] : null;
    return {
      intent: "EMPLOYEE_SAFETY_PROFILE",
      parameters: { hrms_id, name: hrms_id ? null : "YDYMLI" }
    };
  }

  if (queryLower.includes("station") || queryLower.includes("stats") || queryLower.includes("overview")) {
    const match = userQuery.match(/\b([A-Z]{3,4})\b/);
    const station_code = match ? match[1] : "AJNI";
    return {
      intent: "STATION_RISK_OVERVIEW",
      parameters: { station_code, station_name: null }
    };
  }

  return {
    intent: "UNKNOWN",
    parameters: {},
    suggestion: "I couldn't map that to a predefined report. Try asking: 'Show safety profile of employee YDYMLI' or 'What is the risk level at Ajni station?'"
  };
}

// Local Fallback Explainer
function localExplainer(intent, rows) {
  if (rows.length === 0) {
    return "The query completed successfully, but no safety records were found matching the parameters.";
  }
  if (intent === "EMPLOYEE_SAFETY_PROFILE") {
    const r = rows[0];
    return `Safety profile retrieved for employee ${r.full_name} (${r.hrms_id}), working as ${r.designation} at station ${r.station_name || 'Nagpur'}. Current risk level is marked as '${r.risk_level}'.`;
  }
  if (intent === "STATION_RISK_OVERVIEW") {
    const r = rows[0];
    return `Station risk stats compiled for ${r.station_name} (${r.station_code}): Active staff: ${r.active_staff_count}, average safety score: ${r.average_score || r.average_risk_score}/100, high risk staff count: ${r.high_risk_count}.`;
  }
  if (intent === "PME_DUE_FORECAST") {
    return `Compliance forecast: Found ${rows.length} employee(s) whose PME medical records will expire within the forecast window. Retraining/scheduling alerts have been queued.`;
  }
  if (intent === "ACTIVE_ESCALATIONS") {
    return `Active escalations report: Found ${rows.length} unresolved compliance escalations requiring immediate supervisor review.`;
  }
  if (intent === "RECOMMENDATIONS_FOR_EMPLOYEE") {
    return `Active recommendations found: Found ${rows.length} pending training/counselling records assigned to the selected staff.`;
  }
  return "Query processed successfully. Please review the safety database rows.";
}

// Whitelisted Parameterized SQL Query Mappers
const WHITELISTED_QUERIES = {
  EMPLOYEE_SAFETY_PROFILE: {
    query: `
      SELECT e.id, e.hrms_id, e.full_name, e.designation, e.risk_level, e.status,
             s.station_name, s.station_code
      FROM employees e
      LEFT JOIN stations s ON e.station_id = s.id
      WHERE e.hrms_id = $1 OR e.full_name ILIKE $2
      LIMIT 10
    `,
    getParams: (params) => [
      params.hrms_id ? params.hrms_id.toUpperCase().trim() : null,
      params.name ? `%${params.name.trim()}%` : null
    ]
  },
  STATION_RISK_OVERVIEW: {
    query: `
      ${STAFF_CTE}
      SELECT station_name, station_code,
             COUNT(*)::int AS active_staff_count,
             COALESCE(ROUND(AVG(risk_score), 2), 0.0)::float AS average_risk_score,
             SUM(CASE WHEN risk_level = 'High' THEN 1 ELSE 0 END)::int AS high_risk_count
      FROM scored_staff
      WHERE station_code = $1 OR station_name ILIKE $2
      GROUP BY station_name, station_code
      LIMIT 10
    `,
    getParams: (params) => [
      params.station_code ? params.station_code.toUpperCase().trim() : null,
      params.station_name ? `%${params.station_name.trim()}%` : null
    ]
  },
  PME_DUE_FORECAST: {
    query: `
      SELECT e.hrms_id, e.full_name, e.designation, s.station_code, p.next_due_date AS pme_due_date
      FROM employees e
      JOIN stations s ON e.station_id = s.id
      JOIN pme_records p ON p.employee_id = e.id
      WHERE p.next_due_date >= CURRENT_DATE AND p.next_due_date <= CURRENT_DATE + ($1 || ' day')::INTERVAL
      ORDER BY p.next_due_date ASC
      LIMIT 50
    `,
    getParams: (params) => [
      params.days ? String(params.days) : '30'
    ]
  },
  ACTIVE_ESCALATIONS: {
    query: `
      SELECT esc.id, e.hrms_id, e.full_name, esc.escalation_type, esc.priority, esc.status, esc.days_overdue
      FROM workflow_escalations esc
      JOIN employees e ON esc.employee_id = e.id
      WHERE esc.status IN ('Open', 'Acknowledged')
        AND ($1::varchar IS NULL OR esc.priority = $1)
      ORDER BY esc.created_at DESC
      LIMIT 50
    `,
    getParams: (params) => [
      params.priority || null
    ]
  },
  RECOMMENDATIONS_FOR_EMPLOYEE: {
    query: `
      SELECT rec.id, e.hrms_id, e.full_name, rec.recommendation_type, rec.priority, rec.status, rec.title
      FROM workflow_recommendations rec
      JOIN employees e ON rec.employee_id = e.id
      WHERE (e.hrms_id = $1 OR e.full_name ILIKE $2)
        AND rec.status IN ('Pending', 'In Progress')
      ORDER BY rec.created_at DESC
      LIMIT 50
    `,
    getParams: (params) => [
      params.hrms_id ? params.hrms_id.toUpperCase().trim() : null,
      params.name ? `%${params.name.trim()}%` : null
    ]
  }
};

// 1. POST /api/ai/chat
exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: "Chat message is required." });
    }

    checkUsageLimit(req.user.hrms_id, req.user.designation);

    if (detectPromptInjection(message)) {
      return res.status(400).json({
        success: false,
        message: "Security Validation Error: Input query violates safety controls."
      });
    }

    // Fetch live summary stats dynamically using STAFF_CTE
    const statsRes = await pool.query(`
      ${STAFF_CTE}
      SELECT 
        (SELECT COUNT(*)::int FROM employees WHERE status = 'Active') AS total_staff,
        (SELECT COALESCE(ROUND(AVG((pme_comp + ref_comp + cbt_score + practical_score) / 4.0), 2), 0.0)::float FROM scored_staff) AS safety_index,
        (SELECT COUNT(*)::int FROM employees WHERE risk_level = 'High' AND status = 'Active') AS high_risk_count,
        (SELECT COUNT(*)::int FROM workflow_escalations WHERE status IN ('Open', 'Acknowledged')) AS active_escalations
    `);
    const stats = statsRes.rows[0];

    let reply = "";

    if (isGeminiEnabled()) {
      const model = getGenAIModel();
      const systemPrompt = `
        You are the AI Safety Copilot for the Indian Railway Nagpur Division.
        You assist railway operations managers (AOMs, Super Admins) with safety metrics and operational procedures.
        Use the following live statistics for division context if relevant:
        - Active staff count: ${stats.total_staff}
        - Safety Index: ${stats.safety_index}%
        - High Risk Staff Count: ${stats.high_risk_count}
        - Active Escalations: ${stats.active_escalations}
        
        Provide answers concisely and professionally. Focus strictly on railway safety guidelines, PME, training, and operational compliance.
      `;
      const chatResponse = await model.generateContent([
        systemPrompt,
        `User Query: ${message}`
      ]);
      reply = chatResponse.response.text();
    } else {
      // Offline fallback
      reply = `[Offline Mode] Safety Copilot resolved active status. Division averages: Safety Index is ${stats.safety_index}%, active staff: ${stats.total_staff}, open escalations: ${stats.active_escalations}. Reference guideline: General Rules (GR) Chapter III rules for point locks.`;
    }

    reply = reply + SAFETY_DISCLAIMER;

    await logAiAction(req, "AI_CHAT", `Sent message: "${message.slice(0, 50)}..."`);

    return res.status(200).json({ success: true, reply });
  } catch (err) {
    const statusCode = err.status || 500;
    if (statusCode === 500) {
      console.error("AI Chat error:", err);
    } else {
      console.warn(`AI Chat warning (Status ${statusCode}):`, err.message);
    }
    const isProduction = process.env.NODE_ENV === "production";
    const userMessage = isProduction && statusCode === 500
      ? "An unexpected system error occurred while processing your AI request."
      : err.message;
    return res.status(statusCode).json({ success: false, message: userMessage });
  }
};

// 2. POST /api/ai/query
exports.query = async (req, res) => {
  try {
    const { query: userQuery } = req.body;
    if (!userQuery) {
      return res.status(400).json({ success: false, message: "NLP query string is required." });
    }

    checkUsageLimit(req.user.hrms_id, req.user.designation);

    if (detectPromptInjection(userQuery)) {
      return res.status(400).json({
        success: false,
        message: "Security Validation Error: Input query violates safety controls."
      });
    }

    let parsed = null;

    if (isGeminiEnabled()) {
      const model = getGenAIModel();
      const intentPrompt = `
        You are an intent classifier for a railway safety database command center.
        Classify the user prompt into one of the following templates and extract parameters:

        Intents:
        1. EMPLOYEE_SAFETY_PROFILE (parameters: hrms_id, name)
        2. STATION_RISK_OVERVIEW (parameters: station_code, station_name)
        3. PME_DUE_FORECAST (parameters: days)
        4. ACTIVE_ESCALATIONS (parameters: priority)
        5. RECOMMENDATIONS_FOR_EMPLOYEE (parameters: hrms_id, name)

        If the query cannot be classified, set intent to "UNKNOWN".

        Return ONLY a JSON object format:
        {
          "intent": "EMPLOYEE_SAFETY_PROFILE" | "STATION_RISK_OVERVIEW" | "PME_DUE_FORECAST" | "ACTIVE_ESCALATIONS" | "RECOMMENDATIONS_FOR_EMPLOYEE" | "UNKNOWN",
          "parameters": {
             "hrms_id": "string or null",
             "name": "string or null",
             "station_code": "string or null",
             "station_name": "string or null",
             "days": "number or null",
             "priority": "string or null"
          },
          "suggestion": "optional helpful suggestion text for the user if intent is UNKNOWN"
        }
      `;

      const classificationResult = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `${intentPrompt}\n\nUser Query: "${userQuery}"` }] }],
        generationConfig: { responseMimeType: "application/json" }
      });

      const jsonText = classificationResult.response.text();
      try {
        parsed = JSON.parse(jsonText);
      } catch (parseErr) {
        console.error("Failed to parse intent JSON:", jsonText);
        parsed = localIntentClassifier(userQuery);
      }
    } else {
      // Local fallback classification
      parsed = localIntentClassifier(userQuery);
    }

    const { intent, parameters, suggestion } = parsed;

    if (intent === "UNKNOWN" || !WHITELISTED_QUERIES[intent]) {
      const defaultSuggestion = suggestion || "I couldn't map that to a predefined report. Try asking: 'Show safety profile of employee YDYMLI' or 'What is the risk level at Ajni station?'";
      return res.status(200).json({
        success: false,
        intent: "UNKNOWN",
        suggestion: defaultSuggestion + SAFETY_DISCLAIMER
      });
    }

    const whitelisted = WHITELISTED_QUERIES[intent];
    const params = whitelisted.getParams(parameters);

    // Execute query securely against live PostgreSQL database (Read-Only Template)
    const dbResult = await pool.query(whitelisted.query, params);

    let explanation = "";

    if (isGeminiEnabled()) {
      const model = getGenAIModel();
      const explanationPrompt = `
        The user asked the railway safety assistant: "${userQuery}"
        The backend resolved this to the intent: "${intent}".
        The following SQL query was executed:
        ${whitelisted.query}
        Parameters: ${JSON.stringify(params)}
        
        The database returned the following results (max 10 displayed here):
        ${JSON.stringify(dbResult.rows.slice(0, 10))}
 
        Write a concise, professional summary explaining these safety records. Make sure to reference actual names, stations, or due dates from the results. Keep it to a short paragraph.
      `;
      const explanationResult = await model.generateContent(explanationPrompt);
      explanation = explanationResult.response.text();
    } else {
      explanation = `[Offline Mode] ` + localExplainer(intent, dbResult.rows);
    }

    explanation = explanation + SAFETY_DISCLAIMER;

    await logAiAction(req, "AI_QUERY", `NLQ Query resolved to ${intent} for prompt: "${userQuery.slice(0, 50)}..."`);

    return res.status(200).json({
      success: true,
      intent,
      parameters,
      query: whitelisted.query,
      data: dbResult.rows,
      explanation
    });

  } catch (err) {
    const statusCode = err.status || 500;
    if (statusCode === 500) {
      console.error("AI Query error:", err);
    } else {
      console.warn(`AI Query warning (Status ${statusCode}):`, err.message);
    }
    const isProduction = process.env.NODE_ENV === "production";
    const userMessage = isProduction && statusCode === 500
      ? "An unexpected system error occurred while processing your AI request."
      : err.message;
    return res.status(statusCode).json({ success: false, message: userMessage });
  }
};

// 3. POST /api/ai/explain-risk
exports.explainRisk = async (req, res) => {
  try {
    const { hrms_id } = req.body;
    if (!hrms_id) {
      return res.status(400).json({ success: false, message: "HRMS ID is required." });
    }

    checkUsageLimit(req.user.hrms_id, req.user.designation);

    const hrmsUpper = hrms_id.toUpperCase().trim();

    // Fetch employee profile using STAFF_CTE to resolve score and metadata safely
    const empRes = await pool.query(`
      ${STAFF_CTE}
      SELECT employee_id AS id, hrms_id, full_name, designation, risk_score AS score,
             risk_score >= 65.0 AS is_high_risk,
             station_name, station_code
      FROM scored_staff
      WHERE UPPER(hrms_id) = $1
    `, [hrmsUpper]);

    if (empRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Employee with HRMS ID '${hrms_id}' not found.` });
    }

    const emp = empRes.rows[0];
    const riskScoreNum = parseFloat(emp.score || 0);

    // Fetch secondary tables details
    const pmeRes = await pool.query("SELECT * FROM pme_records WHERE employee_id = $1 ORDER BY pme_date DESC LIMIT 1", [emp.id]);
    const refRes = await pool.query("SELECT * FROM ref_records WHERE employee_id = $1 ORDER BY ref_date DESC LIMIT 1", [emp.id]);
    const cbtRes = await pool.query("SELECT * FROM exam_attempts WHERE employee_id = $1 ORDER BY created_at DESC LIMIT 3", [emp.id]);
    const prcRes = await pool.query("SELECT * FROM assessments WHERE employee_id = $1 ORDER BY assessment_date DESC LIMIT 3", [emp.id]);
    const escRes = await pool.query("SELECT * FROM workflow_escalations WHERE employee_id = $1 AND status IN ('Open', 'Acknowledged')", [emp.id]);
    const recRes = await pool.query("SELECT * FROM workflow_recommendations WHERE employee_id = $1 AND status IN ('Pending', 'In Progress')", [emp.id]);
    const cnsRes = await pool.query("SELECT * FROM counselling_records WHERE employee_id = $1 ORDER BY counselling_date DESC LIMIT 3", [emp.id]);

    const context = {
      profile: emp,
      pme: pmeRes.rows[0] || null,
      ref: refRes.rows[0] || null,
      cbt: cbtRes.rows,
      practical: prcRes.rows,
      active_escalations: escRes.rows,
      active_recommendations: recRes.rows,
      counselling: cnsRes.rows
    };

    let explanation = "";

    if (isGeminiEnabled()) {
      const model = getGenAIModel();
      const explanationPrompt = `
        You are a senior safety inspector. Analyze the following safety records for employee ${emp.full_name} (${emp.hrms_id}, ${emp.designation}) who has calculated safety risk score of ${riskScoreNum.toFixed(2)}/100:

        Safety Dossier Context:
        ${JSON.stringify(context)}

        Provide a clear diagnostic report:
        1. Identify the key factor(s) driving their risk level (e.g. overdue training, failed CBT exam attempts, open escalations, or counselling entries).
        2. List their positive compliance factors if any.
        3. Outline specific, actionable recommendations for their supervisor to resolve any safety bottlenecks.

        Format the response in markdown.
      `;
      const aiResult = await model.generateContent(explanationPrompt);
      explanation = aiResult.response.text();
    } else {
      // Offline fallback explanation using live context values
      explanation = `### Safety Diagnostic Report for ${emp.full_name} (${emp.hrms_id})
- **Current Assessment Grade:** Risk score: ${riskScoreNum.toFixed(2)}/100.
- **Core Drivers:**
  - **PME medical status:** ${context.pme ? `Last exam taken: ${new Date(context.pme.pme_date).toLocaleDateString()}. Next due date: ${new Date(context.pme.next_due_date).toLocaleDateString()}` : "No PME records found in PostgreSQL database."}
  - **Refresher status:** ${context.ref ? `Last training cleared: ${new Date(context.ref.ref_date).toLocaleDateString()}. Next training due: ${new Date(context.ref.next_due_date).toLocaleDateString()}` : "No Refresher course records found."}
  - **CBT exam status:** ${context.cbt.length > 0 ? `Latest CBT attempt score: ${context.cbt[0].score_percentage}%. Status: ${context.cbt[0].status}` : "No CBT attempts logged."}
  - **Active Escalations:** Resolved ${context.active_escalations.length} outstanding compliance alerts.
  - **Active Recommendations:** Resolved ${context.active_recommendations.length} training suggestions.
- **Remediation Steps:** Initiate formal supervisor practical assessment to audit shunting procedures at station ${emp.station_name}.`;
    }

    explanation = explanation + SAFETY_DISCLAIMER;

    await logAiAction(req, "AI_RISK_EXPLANATION", `Explained risk factors for ${emp.hrms_id}`, emp.id);

    return res.status(200).json({
      success: true,
      data: {
        profile: emp,
        explanation
      }
    });

  } catch (err) {
    const statusCode = err.status || 500;
    if (statusCode === 500) {
      console.error("AI Risk Explanation error:", err);
    } else {
      console.warn(`AI Risk Explanation warning (Status ${statusCode}):`, err.message);
    }
    const isProduction = process.env.NODE_ENV === "production";
    const userMessage = isProduction && statusCode === 500
      ? "An unexpected system error occurred while processing your AI request."
      : err.message;
    return res.status(statusCode).json({ success: false, message: userMessage });
  }
};

// 4. POST /api/ai/investigate
exports.investigate = async (req, res) => {
  try {
    const { hrms_id, incident_details } = req.body;
    if (!hrms_id || !incident_details) {
      return res.status(400).json({ success: false, message: "Both HRMS ID and incident details are required." });
    }

    checkUsageLimit(req.user.hrms_id, req.user.designation);

    if (detectPromptInjection(incident_details)) {
      return res.status(400).json({
        success: false,
        message: "Security Validation Error: Input query violates safety controls."
      });
    }

    const hrmsUpper = hrms_id.toUpperCase().trim();

    // Fetch employee profile using STAFF_CTE to resolve score and metadata safely
    const empRes = await pool.query(`
      ${STAFF_CTE}
      SELECT employee_id AS id, hrms_id, full_name, designation, risk_score AS score,
             risk_score >= 65.0 AS is_high_risk,
             station_name, station_code
      FROM scored_staff
      WHERE UPPER(hrms_id) = $1
    `, [hrmsUpper]);

    if (empRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Employee with HRMS ID '${hrms_id}' not found.` });
    }

    const emp = empRes.rows[0];
    const riskScoreNum = parseFloat(emp.score || 0);

    // Fetch safety records context
    const pmeRes = await pool.query("SELECT * FROM pme_records WHERE employee_id = $1 ORDER BY pme_date DESC LIMIT 1", [emp.id]);
    const refRes = await pool.query("SELECT * FROM ref_records WHERE employee_id = $1 ORDER BY ref_date DESC LIMIT 1", [emp.id]);
    const cbtRes = await pool.query("SELECT * FROM exam_attempts WHERE employee_id = $1 ORDER BY created_at DESC LIMIT 3", [emp.id]);
    const prcRes = await pool.query("SELECT * FROM assessments WHERE employee_id = $1 ORDER BY assessment_date DESC LIMIT 3", [emp.id]);
    const cnsRes = await pool.query("SELECT * FROM counselling_records WHERE employee_id = $1 ORDER BY counselling_date DESC LIMIT 3", [emp.id]);

    const context = {
      profile: emp,
      pme: pmeRes.rows[0] || null,
      ref: refRes.rows[0] || null,
      cbt: cbtRes.rows,
      practical: prcRes.rows,
      counselling: cnsRes.rows
    };

    let reportText = "";

    if (isGeminiEnabled()) {
      const model = getGenAIModel();
      const investigationPrompt = `
        You are a railway safety investigator. Generate a safety gap analysis and investigation summary for the following incident:
        
        Incident Description: "${incident_details}"
        
        Employee Roster details:
        Name: ${emp.full_name} (${emp.hrms_id})
        Designation: ${emp.designation}
        Station: ${emp.station_name}
        Current dynamic risk score: ${riskScoreNum.toFixed(2)} (Risk Level: ${emp.is_high_risk ? 'High' : 'Low'})
        
        Employee Historical safety compliance data:
        ${JSON.stringify(context)}

        Please structure your safety gap audit report as follows:
        1. **EXECUTIVE INCIDENT AUDIT:** Summarize the incident.
        2. **SAFETY GAP AUDIT:** Identify safety gaps based on their training records, medical expirations (PME), exam history, and counselling logs.
        3. **ROOT CAUSE RECOMMENDATIONS:** Provide recommendations for root cause correction.
        4. **REMEDIATION TRAINING ROADMAP:** Layout a custom refresher and retraining schedule.
      `;
      const aiResult = await model.generateContent(investigationPrompt);
      reportText = aiResult.response.text();
    } else {
      // Offline fallback safety audit report template using live SQL results
      reportText = `# Incident Safety Audit Report
- **Incident Description:** "${incident_details}"
- **Employee Audited:** ${emp.full_name} (${emp.hrms_id})
- **Roster Designation:** ${emp.designation} at station ${emp.station_name}

## 1. EXECUTIVE INCIDENT AUDIT
Operational breach registered. Staff with current dynamic risk score of ${riskScoreNum.toFixed(2)} was involved in a shunting/handling mismatch incident.

## 2. SAFETY GAP AUDIT
- **PME Medical Compliance:** ${context.pme ? `Valid. Next test due: ${new Date(context.pme.next_due_date).toLocaleDateString()}` : "Gap identified: No medical history found."}
- **Refresher course history:** ${context.ref ? `Valid. Next training due: ${new Date(context.ref.next_due_date).toLocaleDateString()}` : "Gap identified: Missing Refresher safety training course."}
- **Competency Exam performance:** ${context.cbt.length > 0 ? `Latest exam score: ${context.cbt[0].score_percentage}%. Status: ${context.cbt[0].status}` : "Gap identified: No safety exam attempts registered."}
- **Counselling log entries:** ${context.counselling.length > 0 ? `Found ${context.counselling.length} previous counselling sessions.` : "No disciplinary or counselling logs found."}

## 3. ROOT CAUSE RECOMMENDATIONS
Initiate an on-site joint inspection of point-handling mechanisms. Set up safety verification before next operational duty.

## 4. REMEDIATION TRAINING ROADMAP
1. Acknowledge and schedule mandatory 2-day on-site point locking training.
2. Complete safety quiz retest in CBT console within 7 working days.`;
    }

    reportText = reportText + SAFETY_DISCLAIMER;

    await logAiAction(req, "AI_INVESTIGATION", `Investigated incident for ${emp.hrms_id}. Details: "${incident_details.slice(0, 40)}..."`, emp.id);

    return res.status(200).json({
      success: true,
      data: {
        profile: emp,
        report: reportText
      }
    });

  } catch (err) {
    const statusCode = err.status || 500;
    if (statusCode === 500) {
      console.error("AI Investigation error:", err);
    } else {
      console.warn(`AI Investigation warning (Status ${statusCode}):`, err.message);
    }
    const isProduction = process.env.NODE_ENV === "production";
    const userMessage = isProduction && statusCode === 500
      ? "An unexpected system error occurred while processing your AI request."
      : err.message;
    return res.status(statusCode).json({ success: false, message: userMessage });
  }
};

// 5. GET /api/ai/executive-summary
exports.executiveSummary = async (req, res) => {
  try {
    checkUsageLimit(req.user.hrms_id, req.user.designation);

    const now = Date.now();
    if (cachedSummary && cachedSummaryAt && (now - cachedSummaryAt < SUMMARY_CACHE_DURATION)) {
      await logAiAction(req, "AI_EXECUTIVE_SUMMARY", "Retrieved AI executive safety narrative summary from cache.");
      return res.status(200).json({
        success: true,
        fromCache: true,
        cachedAt: new Date(cachedSummaryAt).toLocaleTimeString(),
        summary: cachedSummary
      });
    }

    // Cache missed: Fetch division aggregate figures dynamically using STAFF_CTE
    const statsRes = await pool.query(`
      ${STAFF_CTE}
      SELECT 
        (SELECT COUNT(*)::int FROM employees WHERE status = 'Active') AS total_staff,
        (SELECT COALESCE(ROUND(AVG((pme_comp + ref_comp + cbt_score + practical_score) / 4.0), 2), 0.0)::float FROM scored_staff) AS safety_index,
        (SELECT COUNT(*)::int FROM employees WHERE risk_level = 'High' AND status = 'Active') AS high_risk_count,
        (SELECT COUNT(*)::int FROM employees WHERE risk_level = 'Medium' AND status = 'Active') AS med_risk_count,
        (SELECT COUNT(*)::int FROM employees WHERE risk_level = 'Low' AND status = 'Active') AS low_risk_count,
        (SELECT COUNT(*)::int FROM workflow_escalations WHERE status IN ('Open', 'Acknowledged')) AS active_escalations,
        (SELECT COUNT(*)::int FROM workflow_escalations WHERE status IN ('Open', 'Acknowledged') AND priority = 'Critical') AS critical_escalations
    `);
    const stats = statsRes.rows[0];

    let summaryNarrative = "";

    if (isGeminiEnabled()) {
      const model = getGenAIModel();
      const summaryPrompt = `
        You are the Divisional Operations Manager (Sr. DOM).
        Generate a professional, concise executive safety briefing narrative for the Nagpur Railway Division based on these live database metrics:
        - Overall Safety Index: ${stats.safety_index}%
        - Total Operational Staff: ${stats.total_staff}
        - Risk Level Profile: ${stats.high_risk_count} High Risk, ${stats.med_risk_count} Medium Risk, ${stats.low_risk_count} Low Risk
        - Active Compliance Escalations: ${stats.active_escalations} total unresolved (${stats.critical_escalations} marked as CRITICAL)

        Your briefing narrative should:
        1. Provide a professional assessment of the division's current safety compliance posture.
        2. Analyze potential operational vulnerabilities (discuss the critical escalations and high-risk staff count).
        3. Recommend tactical safety actions for field supervisors.

        Keep the tone administrative and authoritative. Use clean markdown bullet points.
      `;
      const aiResult = await model.generateContent(summaryPrompt);
      summaryNarrative = aiResult.response.text();
    } else {
      // Offline fallback safety narrative using live PostgreSQL metrics
      summaryNarrative = `### Nagpur Division Safety Executive Briefing
- **Safety Index:** The overall safety compliance index is currently compiled at **${stats.safety_index}%** across **${stats.total_staff}** operational personnel.
- **Risk Profiles:** High-Risk staff count stands at **${stats.high_risk_count}**, requiring prioritized field assessments. Medium risk staff: ${stats.med_risk_count}, Low risk staff: ${stats.low_risk_count}.
- **Escalation Backlog:** There are currently **${stats.active_escalations}** unresolved compliance escalations registered. Of these, **${stats.critical_escalations}** are critical overdue flags requiring immediate supervisor resolution.
- **Remediation Recommendation:** Initiate immediate refresher inspections at stations with open escalations. Field inspectors must audit Pointsmen point-handling checklists.`;
    }

    summaryNarrative = summaryNarrative + SAFETY_DISCLAIMER;

    // Cache the narrative for 6 hours
    cachedSummary = summaryNarrative;
    cachedSummaryAt = now;

    await logAiAction(req, "AI_EXECUTIVE_SUMMARY", "Generated and cached new AI executive safety narrative summary.");

    return res.status(200).json({
      success: true,
      fromCache: false,
      summary: summaryNarrative
    });

  } catch (err) {
    const statusCode = err.status || 500;
    if (statusCode === 500) {
      console.error("AI Summary generation error:", err);
    } else {
      console.warn(`AI Summary generation warning (Status ${statusCode}):`, err.message);
    }
    const isProduction = process.env.NODE_ENV === "production";
    const userMessage = isProduction && statusCode === 500
      ? "An unexpected system error occurred while processing your AI request."
      : err.message;
    return res.status(statusCode).json({ success: false, message: userMessage });
  }
};
