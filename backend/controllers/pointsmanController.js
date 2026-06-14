const pool = require("../config/db");

/**
 * GET /api/pointsman/dashboard
 * Fetch Pointsman dashboard data based on authenticated user's HRMS ID
 */
exports.getPointsmanDashboard = async (req, res) => {
  try {
    const hrmsId = req.user.hrms_id;

    if (!hrmsId) {
      return res.status(400).json({
        success: false,
        message: "HRMS ID not found in token payload"
      });
    }

    const query = `
      SELECT 
        e.id,
        e.full_name,
        e.hrms_id,
        e.designation,
        e.mobile,
        e.category_grade,
        e.risk_level,
        s.station_name,
        s.station_code
      FROM employees e
      LEFT JOIN stations s ON e.station_id = s.id
      WHERE UPPER(e.hrms_id) = $1
    `;

    const result = await pool.query(query, [hrmsId.toUpperCase()]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Employee with HRMS ID ${hrmsId} not found`
      });
    }

    const employee = result.rows[0];
    const employeeId = employee.id;

    // 1. Fetch PME Status
    let pmeStatus = "Not Available";
    try {
      const pmeRes = await pool.query(
        "SELECT next_due_date FROM pme_records WHERE employee_id = $1 ORDER BY pme_date DESC, id DESC LIMIT 1",
        [employeeId]
      );
      if (pmeRes.rows.length > 0) {
        const nextDue = new Date(pmeRes.rows[0].next_due_date);
        pmeStatus = nextDue >= new Date() ? "Valid" : "Expired";
      }
    } catch (e) {
      console.warn("Failed to query PME status for dashboard:", e.message);
    }

    // 2. Fetch REF Status
    let refStatus = "Not Available";
    try {
      const refRes = await pool.query(
        "SELECT next_due_date FROM ref_records WHERE employee_id = $1 ORDER BY ref_date DESC, id DESC LIMIT 1",
        [employeeId]
      );
      if (refRes.rows.length > 0) {
        const nextDue = new Date(refRes.rows[0].next_due_date);
        refStatus = nextDue >= new Date() ? "Valid" : "Expired";
      }
    } catch (e) {
      console.warn("Failed to query REF status for dashboard:", e.message);
    }

    // 3. Fetch Exam (CBT) Status
    let examStatus = "Not Started";
    try {
      const examRes = await pool.query(
        "SELECT status, result FROM exam_attempts WHERE employee_id = $1 ORDER BY created_at DESC LIMIT 1",
        [employeeId]
      );
      if (examRes.rows.length > 0) {
        const exam = examRes.rows[0];
        if (exam.status === "Active") {
          examStatus = "Active";
        } else if (exam.status === "Completed") {
          examStatus = exam.result || "Completed";
        }
      }
    } catch (e) {
      console.warn("Failed to query Exam status for dashboard:", e.message);
    }

    // 4. Fetch Assessment Status & Details (dynamic and database-driven)
    let assessmentStatus = "Not Assigned";
    let assessmentDetails = {
      assigned_by: null,
      assigned_date: null,
      due_date: null,
      score: null,
      completion_date: null,
      result: null
    };

    try {
      const latestAsmtRes = await pool.query(
        `SELECT a.id, a.status, a.created_at, e.full_name AS assessor_name, a.total_marks
         FROM assessments a
         LEFT JOIN employees e ON a.assessor_id = e.id
         WHERE a.employee_id = $1
         ORDER BY a.created_at DESC, a.id DESC
         LIMIT 1`,
        [employeeId]
      );

      if (latestAsmtRes.rows.length > 0) {
        const asmt = latestAsmtRes.rows[0];
        
        if (asmt.status === 'Pending') {
          assessmentStatus = "Active";
          
          const wrRes = await pool.query(
            "SELECT due_date FROM workflow_recommendations WHERE employee_id = $1 AND status = 'Active' AND source = 'assessments' LIMIT 1",
            [employeeId]
          );
          const dueDate = wrRes.rows.length > 0 ? wrRes.rows[0].due_date : new Date(new Date(asmt.created_at).getTime() + 30 * 24 * 60 * 60 * 1000);
          
          assessmentDetails = {
            assigned_by: asmt.assessor_name || "Supervisor",
            assigned_date: asmt.created_at,
            due_date: dueDate
          };
        } else if (asmt.status === 'Submitted' || asmt.status === 'Approved') {
          assessmentStatus = "Completed";
          
          const resultRes = await pool.query(
            `SELECT ar.final_score, ar.created_at, ar.fitness_status, ea.score_percentage, ea.result
             FROM assessment_results ar
             LEFT JOIN exam_attempts ea ON ar.exam_attempt_id = ea.id
             WHERE ar.employee_id = $1
             ORDER BY ar.created_at DESC LIMIT 1`,
            [employeeId]
          );
          
          let score = asmt.total_marks || 0;
          let completionDate = asmt.created_at;
          let result = "Completed";
          
          if (resultRes.rows.length > 0) {
            const resRow = resultRes.rows[0];
            score = resRow.final_score || resRow.score_percentage || score;
            completionDate = resRow.created_at || completionDate;
            result = resRow.fitness_status || resRow.result || result;
          }
          
          assessmentDetails = {
            score: score,
            completion_date: completionDate,
            result: result
          };
        } else if (asmt.status === 'Rejected') {
          assessmentStatus = "Not Assigned";
        }
      }
    } catch (e) {
      console.warn("Failed to query Assessment details for dashboard:", e.message);
    }

    const dashboardData = {
      full_name: employee.full_name,
      hrms_id: employee.hrms_id,
      designation: employee.designation,
      station_name: employee.station_name || "Not Assigned",
      station_code: employee.station_code || "N/A",
      mobile: employee.mobile || "N/A",
      category_grade: employee.category_grade || "N/A",
      risk_level: employee.risk_level || "N/A",
      pme_status: pmeStatus,
      ref_status: refStatus,
      exam_status: examStatus,
      assessment_status: assessmentStatus,
      assessment_details: assessmentDetails
    };

    return res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error("Error in getPointsmanDashboard:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching dashboard data",
      error: error.message
    });
  }
};
