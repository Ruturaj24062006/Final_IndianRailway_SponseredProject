const pool = require("../config/db");
const { logAuditEvent } = require("../utils/auditLogger");
const { recalculateAndSaveEmployeeRisk } = require("../utils/riskScoring");
const { runFullEngine } = require("../utils/workflowEngine");

/**
 * Helper to resolve the database role_id for a given employee.
 */
async function getRoleId(employee) {
  if (employee.role_id) return employee.role_id;
  
  try {
    const roleRes = await pool.query(
      "SELECT id FROM roles WHERE UPPER(role_name) = $1",
      [(employee.designation || "Pointsman").toUpperCase()]
    );
    if (roleRes.rows.length > 0) {
      return roleRes.rows[0].id;
    }
  } catch (err) {
    console.error("Error resolving role ID:", err);
  }
  return 1; // Default fallback to role ID 1
}

/**
 * GET /api/exam/status
 * Check the question bank size and active attempts for the authenticated employee
 */
exports.getExamStatus = async (req, res) => {
  try {
    const hrmsId = req.user.hrms_id;

    const empRes = await pool.query(
      "SELECT id, role_id, designation FROM employees WHERE UPPER(hrms_id) = $1",
      [hrmsId.toUpperCase()]
    );

    if (empRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found"
      });
    }

    const employee = empRes.rows[0];
    const roleId = await getRoleId(employee);

    // Count active questions for this role
    const questionRes = await pool.query(
      "SELECT COUNT(*) FROM questions WHERE role_id = $1 AND is_active = true",
      [roleId]
    );
    const questionCount = parseInt(questionRes.rows[0].count, 10);

    // Check if there is an active exam attempt
    const attemptRes = await pool.query(
      `SELECT id, started_at, total_questions 
       FROM exam_attempts 
       WHERE employee_id = $1 AND role_id = $2 AND status = 'Active'`,
      [employee.id, roleId]
    );

    const activeAttempt = attemptRes.rows.length > 0 ? attemptRes.rows[0] : null;

    // Fetch latest assessment status and details
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
        [employee.id]
      );

      if (latestAsmtRes.rows.length > 0) {
        const asmt = latestAsmtRes.rows[0];
        
        if (asmt.status === 'Pending') {
          assessmentStatus = "Active";
          
          const wrRes = await pool.query(
            "SELECT due_date FROM workflow_recommendations WHERE employee_id = $1 AND status = 'Active' AND source = 'assessments' LIMIT 1",
            [employee.id]
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
            [employee.id]
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
      console.warn("Failed to query Assessment details in getExamStatus:", e.message);
    }

    return res.status(200).json({
      success: true,
      data: {
        question_count: questionCount,
        has_active_attempt: !!activeAttempt,
        active_attempt: activeAttempt,
        assessment_status: assessmentStatus,
        assessment_details: assessmentDetails
      }
    });
  } catch (error) {
    console.error("Error in getExamStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error checking exam status",
      error: error.message
    });
  }
};

/**
 * POST /api/exam/start
 * Initialize a new exam attempt and return 25 random questions
 */
exports.startExam = async (req, res) => {
  try {
    const hrmsId = req.user.hrms_id;

    const empRes = await pool.query(
      "SELECT id, role_id, designation FROM employees WHERE UPPER(hrms_id) = $1",
      [hrmsId.toUpperCase()]
    );

    if (empRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found"
      });
    }

    const employee = empRes.rows[0];
    const roleId = await getRoleId(employee);

    // Check for existing active attempt
    const activeRes = await pool.query(
      `SELECT id, started_at, total_questions 
       FROM exam_attempts 
       WHERE employee_id = $1 AND role_id = $2 AND status = 'Active'`,
      [employee.id, roleId]
    );

    if (activeRes.rows.length > 0) {
      const activeAttempt = activeRes.rows[0];
      
      // Fetch already selected questions for this attempt to prevent cheating/shuffling on refresh
      const questionsRes = await pool.query(
        `SELECT q.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.marks, ea.selected_answer
         FROM exam_answers ea
         JOIN questions q ON ea.question_id = q.id
         WHERE ea.attempt_id = $1
         ORDER BY q.id`,
        [activeAttempt.id]
      );

      return res.status(200).json({
        success: true,
        message: "Resuming active exam attempt",
        data: {
          attempt_id: activeAttempt.id,
          total_questions: activeAttempt.total_questions,
          questions: questionsRes.rows
        }
      });
    }

    // Verify there is an active (Pending) assessment request for this employee
    const activeAsmtCheck = await pool.query(
      "SELECT id, mcq_status FROM assessments WHERE employee_id = $1 AND status = 'Pending'",
      [employee.id]
    );
    if (activeAsmtCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "No active assessment is currently assigned by your supervisor. Please wait until an assessment is activated."
      });
    }
    const asmt = activeAsmtCheck.rows[0];
    if (asmt.mcq_status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: "The CBT examination has not been activated by your station master yet. Please contact them to activate your exam."
      });
    }

    // Verify question bank has at least 25 questions
    const questionRes = await pool.query(
      "SELECT COUNT(*) FROM questions WHERE role_id = $1 AND is_active = true",
      [roleId]
    );
    const questionCount = parseInt(questionRes.rows[0].count, 10);

    if (questionCount < 25) {
      return res.status(400).json({
        success: false,
        message: "Question bank not uploaded yet. The examination requires at least 25 active questions."
      });
    }

    // Randomly select 25 questions
    const selectRes = await pool.query(
      `SELECT id, question_text, option_a, option_b, option_c, option_d, marks 
       FROM questions 
       WHERE role_id = $1 AND is_active = true 
       ORDER BY RANDOM() 
       LIMIT 25`,
      [roleId]
    );

    const questions = selectRes.rows;

    // Create the exam attempt
    const attemptRes = await pool.query(
      `INSERT INTO exam_attempts (employee_id, role_id, started_at, total_questions, status, created_at)
       VALUES ($1, $2, NOW(), $3, 'Active', NOW())
       RETURNING id, started_at, total_questions`,
      [employee.id, roleId, questions.length]
    );

    const attempt = attemptRes.rows[0];

    await logAuditEvent({
      employee_id: employee.id,
      action: "START_CBT_EXAM",
      module_name: "CBT",
      performed_by: employee.id,
      remarks: `Started CBT exam attempt ID ${attempt.id} for role ID ${roleId}.`
    });

    // Bulk insert blank answers into exam_answers
    for (const question of questions) {
      await pool.query(
        `INSERT INTO exam_answers (attempt_id, question_id, created_at)
         VALUES ($1, $2, NOW())`,
        [attempt.id, question.id]
      );
    }

    return res.status(201).json({
      success: true,
      message: "CBT exam session successfully initialized",
      data: {
        attempt_id: attempt.id,
        total_questions: attempt.total_questions,
        questions: questions.map(q => ({ ...q, selected_answer: null }))
      }
    });
  } catch (error) {
    console.error("Error in startExam:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error starting exam",
      error: error.message
    });
  }
};

/**
 * POST /api/exam/submit-answer
 * Persist an answer in real-time
 */
exports.submitAnswer = async (req, res) => {
  try {
    const { attempt_id, question_id, selected_answer } = req.body;
    const hrmsId = req.user.hrms_id;

    if (!attempt_id || !question_id) {
      return res.status(400).json({
        success: false,
        message: "Attempt ID and Question ID are required"
      });
    }

    // Verify employee owns the attempt and it is active
    const empRes = await pool.query(
      "SELECT id FROM employees WHERE UPPER(hrms_id) = $1",
      [hrmsId.toUpperCase()]
    );

    if (empRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found"
      });
    }

    const employee = empRes.rows[0];

    const activeRes = await pool.query(
      "SELECT id FROM exam_attempts WHERE id = $1 AND employee_id = $2 AND status = 'Active'",
      [attempt_id, employee.id]
    );

    if (activeRes.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Exam session is not active or belongs to another employee"
      });
    }

    // Save answer
    await pool.query(
      `UPDATE exam_answers 
       SET selected_answer = $1 
       WHERE attempt_id = $2 AND question_id = $3`,
      [selected_answer, attempt_id, question_id]
    );

    return res.status(200).json({
      success: true,
      message: "Answer saved successfully"
    });
  } catch (error) {
    console.error("Error in submitAnswer:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error saving answer",
      error: error.message
    });
  }
};

/**
 * POST /api/exam/submit
 * Evaluate CBT attempt and log final score card
 */
exports.submitExam = async (req, res) => {
  try {
    const { attempt_id } = req.body;
    const hrmsId = req.user.hrms_id;

    if (!attempt_id) {
      return res.status(400).json({
        success: false,
        message: "Attempt ID is required"
      });
    }

    // Verify employee profile and attempt status
    const empRes = await pool.query(
      "SELECT id FROM employees WHERE UPPER(hrms_id) = $1",
      [hrmsId.toUpperCase()]
    );

    if (empRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found"
      });
    }

    const employee = empRes.rows[0];

    const activeRes = await pool.query(
      "SELECT id, total_questions FROM exam_attempts WHERE id = $1 AND employee_id = $2 AND status = 'Active'",
      [attempt_id, employee.id]
    );

    if (activeRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Exam session is not active or has already been submitted"
      });
    }

    const attempt = activeRes.rows[0];

    // Fetch and score all answers
    const answersRes = await pool.query(
      `SELECT ea.id, ea.question_id, ea.selected_answer, q.correct_answer
       FROM exam_answers ea
       JOIN questions q ON ea.question_id = q.id
       WHERE ea.attempt_id = $1`,
      [attempt_id]
    );

    let correctCount = 0;
    for (const row of answersRes.rows) {
      const isCorrect = row.selected_answer === row.correct_answer;
      if (isCorrect) {
        correctCount++;
      }
      await pool.query(
        "UPDATE exam_answers SET is_correct = $1 WHERE id = $2",
        [isCorrect, row.id]
      );
    }

    const scorePercentage = parseFloat(((correctCount / attempt.total_questions) * 100).toFixed(2));
    const result = scorePercentage >= 60.0 ? "PASSED" : "FAILED";

    // Finalize exam attempt
    await pool.query(
      `UPDATE exam_attempts 
       SET submitted_at = NOW(), 
           correct_answers = $1, 
           score_percentage = $2, 
           result = $3, 
           status = 'Completed' 
       WHERE id = $4`,
      [correctCount, scorePercentage, result, attempt_id]
    );

    await logAuditEvent({
      employee_id: employee.id,
      action: "SUBMIT_CBT_EXAM",
      module_name: "CBT",
      performed_by: employee.id,
      remarks: `Submitted CBT exam attempt ID ${attempt_id}. Score: ${scorePercentage}% (${correctCount}/${attempt.total_questions} correct). Result: ${result}.`,
      severity: result === "FAILED" ? "WARNING" : "INFO"
    });

    // If CBT failed, insert a notification alert
    if (result === "FAILED") {
      try {
        await pool.query(
          `INSERT INTO notifications (employee_id, title, message, category, target_role, is_read, created_at)
           VALUES ($1, $2, $3, $4, $5, false, NOW())`,
          [
            employee.id,
            "Safety Alert: CBT Exam Failed",
            `You have failed the CBT exam attempt with a score of ${scorePercentage}%.`,
            "CBT Failed",
            "Pointsman"
          ]
        );
      } catch (notifErr) {
        console.error("Failed to write CBT Failed notification:", notifErr.message);
      }
    }

    // Link/Upsert to assessment_results
    await pool.query(
      `INSERT INTO assessment_results (employee_id, exam_attempt_id, cbt_score, final_score, fitness_status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [employee.id, attempt_id, scorePercentage, scorePercentage, scorePercentage >= 60.0 ? "FIT" : "UNFIT"]
    );

    // Find and update the active assessment's mcq_status to 'Completed'
    await pool.query(
      "UPDATE assessments SET mcq_status = 'Completed' WHERE employee_id = $1 AND status = 'Pending'",
      [employee.id]
    );

    // Instantly trigger risk recalculation and workflow engine in background
    recalculateAndSaveEmployeeRisk(employee.id)
      .then(() => runFullEngine())
      .catch(err => console.error("[BackgroundEngine] Error running risk/workflow engine after CBT submit:", err.message));

    return res.status(200).json({
      success: true,
      message: "CBT exam submitted and graded successfully",
      data: {
        attempt_id,
        total_questions: attempt.total_questions,
        correct_answers: correctCount,
        score_percentage: scorePercentage,
        result
      }
    });
  } catch (error) {
    console.error("Error in submitExam:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error finalizing exam",
      error: error.message
    });
  }
};
