const pool = require("../config/db");
const { logAuditEvent } = require("../utils/auditLogger");
const fs = require("fs");
const path = require("path");
const { runFullEngine } = require("../utils/workflowEngine");
const { recalculateAndSaveEmployeeRisk } = require("../utils/riskScoring");

/**
 * Helper to generate HTML assessment report
 */
function generateHtmlReport(employee, assessor, assessment, evaluatedScores, totalObtained, totalMax, percentage, result) {
  try {
    const uploadsDir = path.join(__dirname, "..", "uploads");
    const reportsDir = path.join(uploadsDir, "reports");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Safety Competency Assessment Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 40px 20px;
      background-color: #f1f5f9;
      color: #0f172a;
      line-height: 1.5;
    }
    .container {
      max-width: 850px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 24px;
      margin-bottom: 30px;
    }
    .header h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      color: #0b1f3a;
      letter-spacing: 0.5px;
    }
    .header p {
      margin: 6px 0 0 0;
      color: #64748b;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 30px;
    }
    .card {
      background: #f8fafc;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    .card h3 {
      margin: 0 0 16px 0;
      border-bottom: 2px solid #cbd5e1;
      padding-bottom: 8px;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #0b1f3a;
      font-weight: 800;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      margin-bottom: 8px;
      border-bottom: 1px dashed #e2e8f0;
      padding-bottom: 6px;
    }
    .info-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
      margin-bottom: 0;
    }
    .info-label {
      color: #64748b;
      font-weight: 500;
    }
    .info-value {
      font-weight: 700;
      color: #1e293b;
    }
    .score-summary {
      display: flex;
      justify-content: space-around;
      align-items: center;
      background: linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 100%);
      border: 1px solid #bae6fd;
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    .score-box {
      text-align: center;
    }
    .score-num {
      font-size: 28px;
      font-weight: 900;
      color: #0369a1;
    }
    .score-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #0284c7;
      margin-top: 4px;
      font-weight: 700;
    }
    .result-badge {
      padding: 8px 20px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 14px;
      display: inline-block;
      letter-spacing: 0.5px;
      text-align: center;
    }
    .pass {
      background: #dcfce7;
      color: #16a34a;
      border: 1px solid #bbf7d0;
    }
    .fail {
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 30px;
    }
    th {
      background: #f1f5f9;
      padding: 12px 16px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #cbd5e1;
      color: #475569;
      font-weight: 700;
    }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
      color: #334155;
    }
    tr:nth-child(even) {
      background-color: #fafbfd;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-yes {
      background-color: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }
    .badge-no {
      background-color: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }
    .remarks-card {
      background: #f8fafc;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      margin-bottom: 30px;
    }
    .remarks-card h3 {
      margin: 0 0 10px 0;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #0b1f3a;
      font-weight: 800;
    }
    .remarks-card p {
      margin: 0;
      font-size: 13px;
      font-style: italic;
      color: #475569;
      line-height: 1.6;
    }
    @media print {
      body {
        background-color: #ffffff;
        padding: 0;
      }
      .container {
        box-shadow: none;
        border: none;
        padding: 0;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>SAFETY COMPETENCY ASSESSMENT REPORT</h2>
      <p>Indian Railways Safety Division</p>
    </div>
    <div class="grid">
      <div class="card">
        <h3>Candidate Details</h3>
        <div class="info-row"><span class="info-label">Name:</span><span class="info-value">${employee.full_name || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">HRMS ID:</span><span class="info-value">${employee.hrms_id || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Designation:</span><span class="info-value">${employee.designation || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Station:</span><span class="info-value">${employee.station_name || 'N/A'}</span></div>
      </div>
      <div class="card">
        <h3>Assessment Details</h3>
        <div class="info-row"><span class="info-label">Assessment ID:</span><span class="info-value">#${assessment.id}</span></div>
        <div class="info-row"><span class="info-label">Assessor:</span><span class="info-value">${assessor.full_name || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Date:</span><span class="info-value">${new Date(assessment.assessment_date).toLocaleDateString()}</span></div>
        <div class="info-row"><span class="info-label">Result Status:</span><span class="info-value">${result}</span></div>
      </div>
    </div>
    <div class="score-summary">
      <div class="score-box">
        <div class="score-num">${totalObtained.toFixed(1)} / ${totalMax}</div>
        <div class="score-label">Obtained Marks</div>
      </div>
      <div class="score-box">
        <div class="score-num">${percentage.toFixed(1)}%</div>
        <div class="score-label">Percentage</div>
      </div>
      <div class="score-box">
        <div class="score-num">${percentage >= 80 ? 'A' : percentage >= 50 ? 'B' : percentage >= 26 ? 'C' : 'D'}</div>
        <div class="score-label">Grade Category</div>
      </div>
      <div style="display: flex; align-items: center;">
        <span class="result-badge ${result === 'Pass' ? 'pass' : 'fail'}">${result.toUpperCase()}</span>
      </div>
    </div>
    <h3 style="margin-top: 24px; font-size: 14px; color: #0b1f3a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Checklist Evaluation Scores</h3>
    <table>
      <thead>
        <tr>
          <th>Category & Checklist Question Item</th>
          <th>Response</th>
          <th>Marks</th>
        </tr>
      </thead>
      <tbody>
        ${evaluatedScores.map((s, idx) => `
          <tr>
            <td>
              <span style="font-size: 10px; color: #64748b; display: block; margin-bottom: 2px;">${s.category_name}</span>
              <strong>${idx + 1}. ${s.item_text}</strong>
            </td>
            <td>
              <span class="badge ${s.response === 'Yes' ? 'badge-yes' : 'badge-no'}">${s.response}</span>
            </td>
            <td style="font-weight: 700; color: #1e293b;">${s.marks_awarded.toFixed(1)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="remarks-card">
      <h3>Assessor Remarks</h3>
      <p>"${assessment.remarks || 'No remarks provided.'}"</p>
    </div>
    <div style="margin-top: 30px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px;">
      System Generated Report Reference ID: IR-SEC-EVAL-${assessment.id} • Date: ${new Date().toLocaleString()}
    </div>
  </div>
</body>
</html>
    `;

    const fileName = `assessment_report_${assessment.id}.html`;
    const relativePath = `/uploads/reports/${fileName}`;
    fs.writeFileSync(path.join(reportsDir, fileName), html);
    return relativePath;
  } catch (err) {
    console.error("Failed to generate HTML report:", err);
    return null;
  }
}

/**
 * Helper to look up employee details by HRMS ID
 */
async function getEmployeeByHrmsId(hrmsId) {
  const result = await pool.query(
    "SELECT * FROM employees WHERE UPPER(hrms_id) = $1",
    [hrmsId.toUpperCase()]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * POST /api/assessments/request
 * Create a new assessment request for a Pointsman.
 * Restricted to Station Master.
 */
exports.createAssessment = async (req, res) => {
  try {
    const { employee_id, assessment_date } = req.body;
    const assessorHrmsId = req.user.hrms_id;

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        message: "Employee ID (Pointsman UUID) is required"
      });
    }

    // 1. Resolve Station Master (Assessor) details
    const assessor = await getEmployeeByHrmsId(assessorHrmsId);
    if (!assessor) {
      return res.status(404).json({
        success: false,
        message: "Assessor profile not found"
      });
    }

    // 2. Verify target employee exists and is a Pointsman
    const empRes = await pool.query(
      "SELECT id, designation, role_id FROM employees WHERE id = $1",
      [employee_id]
    );
    if (empRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Target employee not found"
      });
    }
    const targetEmployee = empRes.rows[0];

    // Enforce role check (role_id = 1 or designation containing Pointsman)
    const designationLower = (targetEmployee.designation || "").toLowerCase();
    if (targetEmployee.role_id != 1 && !designationLower.includes("pointsman")) {
      return res.status(400).json({
        success: false,
        message: "Assessments in this module can only be created for Pointsman"
      });
    }

    // 3. Check for existing active/pending assessment
    const activeCheck = await pool.query(
      "SELECT id, status FROM assessments WHERE employee_id = $1 AND status IN ('Pending', 'Submitted')",
      [employee_id]
    );
    if (activeCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `An assessment request is already in progress for this employee (Status: ${activeCheck.rows[0].status})`
      });
    }

    // 4. Resolve Pointsman Template (ID 1)
    const templateRes = await pool.query(
      "SELECT id FROM assessment_templates WHERE id = 1 AND is_active = true"
    );
    if (templateRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pointsman assessment template not found or inactive in system"
      });
    }
    const templateId = templateRes.rows[0].id;

    // 5. Create Assessment (Set mcq_status as 'Locked' by default)
    const dateToUse = assessment_date ? new Date(assessment_date) : new Date();
    const insertRes = await pool.query(
      `INSERT INTO assessments (employee_id, assessor_id, template_id, assessment_date, status, mcq_status, created_at)
       VALUES ($1, $2, $3, $4, 'Pending', 'Locked', NOW())
       RETURNING *`,
      [employee_id, assessor.id, templateId, dateToUse]
    );

    const newAssessment = insertRes.rows[0];
    await logAuditEvent({
      employee_id: employee_id,
      action: "CREATE_ASSESSMENT",
      module_name: "Assessments",
      performed_by: assessor.id,
      remarks: `Created practical safety assessment request (ID: ${newAssessment.id}) for employee on date ${dateToUse.toISOString().split('T')[0]}.`
    });

    return res.status(201).json({
      success: true,
      message: "Assessment request created successfully",
      data: newAssessment
    });
  } catch (error) {
    console.error("Error in createAssessment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error creating assessment request",
      error: error.message
    });
  }
};

/**
 * GET /api/assessments/checklist/pointsman
 * Fetch all categories and checklist items for Pointsman template.
 * Restricted to Station Master.
 */
exports.getPointsmanChecklist = async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id AS category_id,
        c.category_name,
        c.max_marks,
        ch.id AS checklist_id,
        ch.checklist_item
      FROM assessment_categories c
      JOIN assessment_checklists ch ON ch.category_id = c.id
      WHERE c.template_id = 1
      ORDER BY c.id, ch.id
    `;
    const result = await pool.query(query);

    // Group items by category
    const categoriesMap = {};
    result.rows.forEach(row => {
      if (!categoriesMap[row.category_id]) {
        categoriesMap[row.category_id] = {
          category_id: row.category_id,
          category_name: row.category_name,
          max_marks: row.max_marks,
          checklist: []
        };
      }
      categoriesMap[row.category_id].checklist.push({
        checklist_id: row.checklist_id,
        checklist_item: row.checklist_item
      });
    });

    const categoriesList = Object.values(categoriesMap);

    return res.status(200).json({
      success: true,
      data: {
        template_id: 1,
        template_name: "Pointsman Practical Evaluation Template",
        total_marks: 100,
        categories: categoriesList
      }
    });
  } catch (error) {
    console.error("Error in getPointsmanChecklist:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching checklist",
      error: error.message
    });
  }
};

/**
 * POST /api/assessments/:id/submit
 * Submit evaluation checklist marks. Automatically calculates scores, percentage, and generates report.
 * Restricted to Station Master.
 */
exports.submitAssessment = async (req, res) => {
  const client = await pool.connect();
  try {
    const assessmentId = req.params.id;
    const { scores, remarks } = req.body; // scores: [{ checklist_id, response }]
    const assessorHrmsId = req.user.hrms_id;

    if (!scores || !Array.isArray(scores)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payload: scores must be an array"
      });
    }

    // 1. Resolve Station Master
    const assessor = await getEmployeeByHrmsId(assessorHrmsId);
    if (!assessor) {
      return res.status(404).json({
        success: false,
        message: "Assessor profile not found"
      });
    }

    // 2. Fetch assessment details
    const assessmentRes = await client.query(
      "SELECT * FROM assessments WHERE id = $1",
      [assessmentId]
    );
    if (assessmentRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Assessment record not found"
      });
    }
    const assessment = assessmentRes.rows[0];

    // Enforce permissions: Must be the designated assessor
    if (assessment.assessor_id !== assessor.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to submit scores for this assessment"
      });
    }

    if (assessment.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Assessment cannot be submitted (Current status: ${assessment.status})`
      });
    }

    // Verify exactly 25 checklist items are evaluated
    const expectedCountRes = await client.query(
      `SELECT COUNT(*) FROM assessment_checklists ch
       JOIN assessment_categories c ON ch.category_id = c.id
       WHERE c.template_id = $1`,
      [assessment.template_id]
    );
    const expectedCount = parseInt(expectedCountRes.rows[0].count, 10);

    if (scores.length !== expectedCount) {
      return res.status(400).json({
        success: false,
        message: `Evaluation must contain scores for all checklist items (Expected: ${expectedCount}, Received: ${scores.length})`
      });
    }

    // Fetch categories and checklists configuration from DB
    const configRes = await client.query(
      `SELECT c.id AS category_id, c.max_marks, c.category_name, ch.id AS checklist_id, ch.checklist_item
       FROM assessment_categories c
       JOIN assessment_checklists ch ON ch.category_id = c.id
       WHERE c.template_id = $1
       ORDER BY c.id, ch.id`,
      [assessment.template_id]
    );

    const categoryMap = {};
    configRes.rows.forEach(item => {
      if (!categoryMap[item.category_id]) {
        categoryMap[item.category_id] = {
          max_marks: parseFloat(item.max_marks),
          name: item.category_name,
          items: []
        };
      }
      categoryMap[item.category_id].items.push(item);
    });

    const checklistLookup = {};
    scores.forEach(s => {
      checklistLookup[s.checklist_id] = s;
    });

    let totalChecklistObtained = 0;
    let totalChecklistMax = 0;
    const evaluatedScores = [];

    for (const catId of Object.keys(categoryMap)) {
      const cat = categoryMap[catId];
      const itemCount = cat.items.length;
      const itemWeight = cat.max_marks / itemCount;
      totalChecklistMax += cat.max_marks;

      for (const item of cat.items) {
        const submitted = checklistLookup[item.checklist_id];
        if (!submitted) {
          return res.status(400).json({
            success: false,
            message: `Evaluation response missing for checklist item: "${item.checklist_item}" (ID: ${item.checklist_id})`
          });
        }
        
        const response = submitted.response || 'No';
        const marksAwarded = response.trim().toLowerCase() === 'yes' ? itemWeight : 0;
        totalChecklistObtained += marksAwarded;

        evaluatedScores.push({
          checklist_id: item.checklist_id,
          response,
          marks_awarded: parseFloat(marksAwarded.toFixed(2)),
          item_text: item.checklist_item,
          category_name: cat.name
        });
      }
    }

    // Calculate overall percentage and result (scaled to 100%)
    const percentage = parseFloat(((totalChecklistObtained / totalChecklistMax) * 100).toFixed(2));
    const result = percentage >= 60.0 ? "Pass" : "Fail";
    const computedTotalMarks = percentage; // Save scaled 100% score as total_marks

    // Fetch Candidate Profile details for the report
    const empRes = await client.query(
      `SELECT e.*, s.station_name, s.station_code 
       FROM employees e 
       LEFT JOIN stations s ON e.station_id = s.id 
       WHERE e.id = $1`,
      [assessment.employee_id]
    );
    const employee = empRes.rows[0];

    // Generate HTML report on disk
    const reportRelativePath = generateHtmlReport(
      employee,
      assessor,
      { ...assessment, remarks: remarks || "" },
      evaluatedScores,
      totalChecklistObtained,
      totalChecklistMax,
      percentage,
      result
    );

    // Resolve Approver: Traffic Inspector (role_id = 6 or designation contains Traffic Inspector)
    const approverRes = await client.query(
      `SELECT id FROM employees 
       WHERE role_id = 6 OR UPPER(designation) = 'TRAFFIC INSPECTOR' 
       ORDER BY created_at ASC 
       LIMIT 1`
    );
    if (approverRes.rows.length === 0) {
      return res.status(500).json({
        success: false,
        message: "No Traffic Inspector (Approver) found in the database. Please contact administrator."
      });
    }
    const approverId = approverRes.rows[0].id;

    // 3. Perform transactional database updates
    await client.query("BEGIN");

    // Insert scores
    for (const score of evaluatedScores) {
      await client.query(
        `INSERT INTO assessment_scores (assessment_id, checklist_id, response, marks_awarded, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [assessmentId, score.checklist_id, score.response, score.marks_awarded]
      );
    }

    // Update Assessment record status, marks, percentage, result, completed_at, and report_url
    await client.query(
      `UPDATE assessments 
       SET status = 'Submitted', total_marks = $1, remarks = $2, 
           percentage = $3, result = $4, completed_at = NOW(), report_url = $5
       WHERE id = $6`,
      [computedTotalMarks, remarks || "", percentage, result, reportRelativePath, assessmentId]
    );

    // Insert into employee_documents table
    await client.query(
      `INSERT INTO employee_documents (employee_id, document_type, file_url, uploaded_at)
       VALUES ($1, 'Assessment Report', $2, NOW())`,
      [assessment.employee_id, reportRelativePath]
    );

    // Create entry in approvals table
    await client.query(
      `INSERT INTO approvals (assessment_id, approver_id, approval_level, status, remarks, created_at)
       VALUES ($1, $2, 1, 'Pending', '', NOW())`,
      [assessmentId, approverId]
    );

    // Create notification for Traffic Inspector
    try {
      await client.query(
        `INSERT INTO notifications (employee_id, title, message, category, target_role, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, false, NOW())`,
        [
          assessment.employee_id,
          "Approval Needed: Practical Assessment Pending",
          `A practical evaluation for pointsman is awaiting your review.`,
          "Approval Pending",
          "Traffic Inspector"
        ]
      );
    } catch (notifErr) {
      console.error("Failed to write Approval Pending notification:", notifErr.message);
    }

    await logAuditEvent({
      employee_id: assessment.employee_id,
      action: "SUBMIT_ASSESSMENT",
      module_name: "Assessments",
      performed_by: assessor.id,
      remarks: `Submitted practical evaluation marks for assessment ID ${assessmentId} (Score: ${computedTotalMarks}/100, Result: ${result}). HTML Report generated at: ${reportRelativePath}`
    });

    await client.query("COMMIT");

    // Instantly trigger risk recalculation and workflow engine in background
    recalculateAndSaveEmployeeRisk(assessment.employee_id)
      .then(() => runFullEngine())
      .catch(err => console.error("[BackgroundEngine] Error running risk/workflow engine:", err.message));

    return res.status(200).json({
      success: true,
      message: "Assessment evaluation submitted successfully to Traffic Inspector",
      total_marks: computedTotalMarks,
      percentage: percentage,
      result: result,
      report_url: reportRelativePath
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in submitAssessment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error submitting assessment",
      error: error.message
    });
  } finally {
    client.release();
  }
};

/**
 * GET /api/assessments/pending
 * Retrieve list of pending approvals for the authenticated Traffic Inspector.
 * Restricted to Traffic Inspector.
 */
exports.getPendingApprovals = async (req, res) => {
  try {
    const approverHrmsId = req.user.hrms_id;

    // Resolve Traffic Inspector
    const approver = await getEmployeeByHrmsId(approverHrmsId);
    if (!approver) {
      return res.status(404).json({
        success: false,
        message: "Approver profile not found"
      });
    }

    const query = `
      SELECT 
        a.id AS approval_id,
        asmt.id AS assessment_id,
        asmt.assessment_date,
        asmt.total_marks,
        asmt.status AS assessment_status,
        e.id AS employee_id,
        e.full_name AS employee_name,
        e.hrms_id AS employee_hrms_id,
        e.designation AS employee_designation,
        s.station_name,
        s.station_code,
        asmt.remarks AS assessor_remarks,
        sa.full_name AS assessor_name
      FROM approvals a
      JOIN assessments asmt ON a.assessment_id = asmt.id
      JOIN employees e ON asmt.employee_id = e.id
      LEFT JOIN stations s ON e.station_id = s.id
      JOIN employees sa ON asmt.assessor_id = sa.id
      WHERE a.approver_id = $1 AND a.status = 'Pending'
      ORDER BY a.created_at DESC
    `;
    const result = await pool.query(query, [approver.id]);

    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("Error in getPendingApprovals:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error retrieving pending approvals",
      error: error.message
    });
  }
};

/**
 * POST /api/assessments/:id/approve
 * Traffic Inspector approves assessment. Performs CBT completion check,
 * computes final score (25% CBT + 75% Practical), resolves grade,
 * writes to assessment_results, and updates statuses.
 * Restricted to Traffic Inspector.
 */
exports.approveAssessment = async (req, res) => {
  const client = await pool.connect();
  try {
    const assessmentId = req.params.id;
    const { remarks, practical_score } = req.body;
    const approverHrmsId = req.user.hrms_id;

    // 1. Resolve Traffic Inspector
    const approver = await getEmployeeByHrmsId(approverHrmsId);
    if (!approver) {
      return res.status(404).json({
        success: false,
        message: "Approver profile not found"
      });
    }

    // 2. Fetch assessment details
    const assessmentRes = await client.query(
      "SELECT * FROM assessments WHERE id = $1",
      [assessmentId]
    );
    if (assessmentRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Assessment record not found"
      });
    }
    const assessment = assessmentRes.rows[0];

    if (assessment.status !== "Submitted") {
      return res.status(400).json({
        success: false,
        message: `Assessment is not pending approval (Current status: ${assessment.status})`
      });
    }

    // 3. Verify pending approval entry exists for this approver
    const approvalRes = await client.query(
      "SELECT id FROM approvals WHERE assessment_id = $1 AND approver_id = $2 AND status = 'Pending'",
      [assessmentId, approver.id]
    );
    if (approvalRes.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not designated to approve this assessment or it is already processed"
      });
    }
    const approvalId = approvalRes.rows[0].id;

    // 4. CBT Requirement Check
    const cbtRes = await client.query(
      `SELECT id, score_percentage 
       FROM exam_attempts 
       WHERE employee_id = $1 AND status = 'Completed' 
       ORDER BY submitted_at DESC 
       LIMIT 1`,
      [assessment.employee_id]
    );

    if (cbtRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "CBT examination not completed."
      });
    }

    const completedCbt = cbtRes.rows[0];
    const cbtScore = parseFloat(completedCbt.score_percentage);
    let practicalScore = parseFloat(assessment.total_marks); // out of 100 since 25 items * 4 = 100 total
    if (practical_score !== undefined && practical_score !== null) {
      practicalScore = parseFloat(practical_score);
    }

    // 5. Calculate Final Score (25% CBT + 75% Practical)
    const finalScore = parseFloat(((cbtScore * 0.25) + (practicalScore * 0.75)).toFixed(2));

    // 6. Map to Grades: A (80-100), B (50-79), C (26-49), D (0-25)
    const gradeRes = await client.query(
      `SELECT id, grade_name FROM grades 
       WHERE $1 >= min_score AND $2 <= max_score 
       LIMIT 1`,
      [Math.floor(finalScore), Math.floor(finalScore)]
    );

    if (gradeRes.rows.length === 0) {
      return res.status(500).json({
        success: false,
        message: `Failed to resolve grade mapping for score ${finalScore}`
      });
    }
    const grade = gradeRes.rows[0];

    // Determine fitness (FIT if final_score >= 60%, otherwise UNFIT)
    const fitnessStatus = finalScore >= 60.0 ? "FIT" : "UNFIT";

    // 7. Transactional updates
    await client.query("BEGIN");

    if (practical_score !== undefined && practical_score !== null) {
      await client.query(
        `UPDATE assessments 
         SET total_marks = $1 
         WHERE id = $2`,
        [practicalScore, assessmentId]
      );
    }

    // Update approval status
    await client.query(
      `UPDATE approvals 
       SET status = 'Approved', remarks = $1, approved_at = NOW()
       WHERE id = $2`,
      [remarks || "", approvalId]
    );

    // Update assessment status
    await client.query(
      `UPDATE assessments 
       SET status = 'Approved' 
       WHERE id = $1`,
      [assessmentId]
    );

    // Insert/Upsert into assessment_results
    const resultInsertRes = await client.query(
      `INSERT INTO assessment_results (
        employee_id, assessment_id, exam_attempt_id, 
        cbt_score, practical_score, final_score, 
        grade_id, fitness_status, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (id) DO UPDATE SET
         exam_attempt_id = EXCLUDED.exam_attempt_id,
         cbt_score = EXCLUDED.cbt_score,
         practical_score = EXCLUDED.practical_score,
         final_score = EXCLUDED.final_score,
         grade_id = EXCLUDED.grade_id,
         fitness_status = EXCLUDED.fitness_status,
         created_at = NOW()
       RETURNING *`,
      [
        assessment.employee_id,
        assessmentId,
        completedCbt.id,
        cbtScore,
        practicalScore,
        finalScore,
        grade.id,
        fitnessStatus
      ]
    );

    await logAuditEvent({
      employee_id: assessment.employee_id,
      action: "APPROVE_ASSESSMENT",
      module_name: "Assessments",
      performed_by: approver.id,
      remarks: `Approved safety assessment ID ${assessmentId} for employee ID ${assessment.employee_id}. Final score: ${finalScore}% (Grade: ${grade.grade_name}, Status: ${fitnessStatus}).`
    });

    await client.query("COMMIT");

    // Instantly trigger risk recalculation and workflow engine in background
    recalculateAndSaveEmployeeRisk(assessment.employee_id)
      .then(() => runFullEngine())
      .catch(err => console.error("[BackgroundEngine] Error running risk/workflow engine after approval:", err.message));

    return res.status(200).json({
      success: true,
      message: "Assessment approved and finalized successfully",
      data: {
        final_score: finalScore,
        grade_name: grade.grade_name,
        fitness_status: fitnessStatus,
        result: resultInsertRes.rows[0]
      }
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in approveAssessment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error approving assessment",
      error: error.message
    });
  } finally {
    client.release();
  }
};

/**
 * POST /api/assessments/:id/reject
 * Traffic Inspector rejects assessment.
 * Restricted to Traffic Inspector.
 */
exports.rejectAssessment = async (req, res) => {
  const client = await pool.connect();
  try {
    const assessmentId = req.params.id;
    const { remarks } = req.body;
    const approverHrmsId = req.user.hrms_id;

    // 1. Resolve Traffic Inspector
    const approver = await getEmployeeByHrmsId(approverHrmsId);
    if (!approver) {
      return res.status(404).json({
        success: false,
        message: "Approver profile not found"
      });
    }

    // 2. Fetch assessment details
    const assessmentRes = await client.query(
      "SELECT * FROM assessments WHERE id = $1",
      [assessmentId]
    );
    if (assessmentRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Assessment record not found"
      });
    }
    const assessment = assessmentRes.rows[0];

    if (assessment.status !== "Submitted") {
      return res.status(400).json({
        success: false,
        message: `Assessment is not pending approval (Current status: ${assessment.status})`
      });
    }

    // 3. Verify pending approval entry exists for this approver
    const approvalRes = await client.query(
      "SELECT id FROM approvals WHERE assessment_id = $1 AND approver_id = $2 AND status = 'Pending'",
      [assessmentId, approver.id]
    );
    if (approvalRes.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not designated to approve/reject this assessment"
      });
    }
    const approvalId = approvalRes.rows[0].id;

    // 4. Perform transaction
    await client.query("BEGIN");

    // Update approval status
    await client.query(
      `UPDATE approvals 
       SET status = 'Rejected', remarks = $1, approved_at = NOW()
       WHERE id = $2`,
      [remarks || "", approvalId]
    );

    // Update assessment status
    await client.query(
      `UPDATE assessments 
       SET status = 'Rejected' 
       WHERE id = $1`,
      [assessmentId]
    );

    // Create notifications for SM (Assessor) and Pointsman (Employee)
    try {
      // Notification for SM
      await client.query(
        `INSERT INTO notifications (employee_id, title, message, category, target_role, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, false, NOW())`,
        [
          assessment.assessor_id,
          "Safety Alert: Practical Assessment Rejected",
          `Practical assessment for Pointsman has been rejected by the Traffic Inspector.`,
          "Assessment Rejected",
          "Station Master"
        ]
      );
      // Notification for Pointsman
      await client.query(
        `INSERT INTO notifications (employee_id, title, message, category, target_role, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, false, NOW())`,
        [
          assessment.employee_id,
          "Safety Warning: Practical Assessment Rejected",
          `Your practical safety assessment has been rejected by the Traffic Inspector.`,
          "Assessment Rejected",
          "Pointsman"
        ]
      );
    } catch (notifErr) {
      console.error("Failed to write Assessment Rejected notifications:", notifErr.message);
    }

    await logAuditEvent({
      employee_id: assessment.employee_id,
      action: "REJECT_ASSESSMENT",
      module_name: "Assessments",
      performed_by: approver.id,
      remarks: `Rejected safety assessment ID ${assessmentId}. Sent back to SM with comments: "${remarks || 'None'}"`,
      severity: "WARNING"
    });

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Assessment rejected and sent back to Station Master",
      data: {
        assessment_id: assessmentId,
        status: "Rejected"
      }
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in rejectAssessment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error rejecting assessment",
      error: error.message
    });
  } finally {
    client.release();
  }
};

/**
 * PUT /api/assessments/:id/mcq-status
 * Update pointsman MCQ exam access state ('Active' or 'Locked').
 * Restricted to Station Master.
 */
exports.updateMcqStatus = async (req, res) => {
  try {
    const assessmentId = req.params.id;
    const { mcq_status } = req.body;
    const assessorHrmsId = req.user.hrms_id;

    if (!mcq_status || !['Locked', 'Active', 'Completed'].includes(mcq_status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mcq_status. Must be 'Locked', 'Active', or 'Completed'."
      });
    }

    // Resolve Station Master (Assessor) details
    const assessor = await getEmployeeByHrmsId(assessorHrmsId);
    if (!assessor) {
      return res.status(404).json({
        success: false,
        message: "Assessor profile not found"
      });
    }

    // Verify assessment exists and matches this assessor
    const checkAsmt = await pool.query(
      "SELECT * FROM assessments WHERE id = $1",
      [assessmentId]
    );
    if (checkAsmt.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found"
      });
    }

    const assessment = checkAsmt.rows[0];
    if (assessment.assessor_id !== assessor.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to update MCQ status for this assessment"
      });
    }

    // Perform the update
    const updateRes = await pool.query(
      `UPDATE assessments 
       SET mcq_status = $1 
       WHERE id = $2 
       RETURNING *`,
      [mcq_status, assessmentId]
    );

    const updatedAsmt = updateRes.rows[0];

    await logAuditEvent({
      employee_id: updatedAsmt.employee_id,
      action: "UPDATE_MCQ_STATUS",
      module_name: "Assessments",
      performed_by: assessor.id,
      remarks: `Updated MCQ status for assessment ID ${assessmentId} to '${mcq_status}'`
    });

    return res.status(200).json({
      success: true,
      message: `MCQ status updated to '${mcq_status}' successfully`,
      data: updatedAsmt
    });
  } catch (error) {
    console.error("Error in updateMcqStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error updating MCQ status",
      error: error.message
    });
  }
};
