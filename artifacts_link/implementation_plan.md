# Phase 5 – CBT Examination Module Implementation Plan

This plan outlines the results of the database audit and the proposed architecture to implement the Computer-Based Test (CBT) Examination Module.

## Database Audit Results

The PostgreSQL database was audited. Below is the current schema and state of each audited table:

### 1. `questions`
* **Row count**: `0`
* **Columns**:
  - `id` (`bigint`, NOT NULL)
  - `role_id` (`bigint`, NOT NULL)
  - `question_text` (`text`, NOT NULL)
  - `option_a` (`text`, NOT NULL)
  - `option_b` (`text`, NOT NULL)
  - `option_c` (`text`, NOT NULL)
  - `option_d` (`text`, NOT NULL)
  - `correct_answer` (`character(1)`, NOT NULL)
  - `marks` (`integer`, NULL)
  - `is_active` (`boolean`, NULL)
  - `created_at` (`timestamp without time zone`, NULL)
* **Primary Key**: `id`
* **Foreign Key**: `role_id` -> `roles(id)`

### 2. `question_options`
* **Status**: **Does Not Exist** (The options `option_a` through `option_d` are already stored directly in the `questions` table. This inline layout is standard for this codebase, so no new table or migration script is required).

### 3. `exam_attempts`
* **Row count**: `0`
* **Columns**:
  - `id` (`bigint`, NOT NULL)
  - `employee_id` (`uuid`, NOT NULL)
  - `role_id` (`bigint`, NOT NULL)
  - `started_at` (`timestamp without time zone`, NULL)
  - `submitted_at` (`timestamp without time zone`, NULL)
  - `total_questions` (`integer`, NULL)
  - `correct_answers` (`integer`, NULL)
  - `score_percentage` (`numeric`, NULL)
  - `result` (`character varying`, NULL)
  - `status` (`character varying`, NULL)
  - `created_at` (`timestamp without time zone`, NULL)
* **Primary Key**: `id`
* **Foreign Keys**: 
  - `employee_id` -> `employees(id)`
  - `role_id` -> `roles(id)`

### 4. `exam_answers`
* **Row count**: `0`
* **Columns**:
  - `id` (`bigint`, NOT NULL)
  - `attempt_id` (`bigint`, NOT NULL)
  - `question_id` (`bigint`, NOT NULL)
  - `selected_answer` (`character(1)`, NULL)
  - `is_correct` (`boolean`, NULL)
  - `created_at` (`timestamp without time zone`, NULL)
* **Primary Key**: `id`
* **Foreign Keys**:
  - `attempt_id` -> `exam_attempts(id)`
  - `question_id` -> `questions(id)`

### 5. `assessment_results`
* **Row count**: `0`
* **Columns**:
  - `id` (`bigint`, NOT NULL)
  - `employee_id` (`uuid`, NULL)
  - `assessment_id` (`bigint`, NULL)
  - `exam_attempt_id` (`bigint`, NULL)
  - `cbt_score` (`numeric`, NULL)
  - `practical_score` (`numeric`, NULL)
  - `final_score` (`numeric`, NULL)
  - `grade_id` (`bigint`, NULL)
  - `fitness_status` (`character varying`, NULL)
  - `created_at` (`timestamp without time zone`, NULL)
* **Primary Key**: `id`
* **Foreign Keys**:
  - `assessment_id` -> `assessments(id)`
  - `employee_id` -> `employees(id)`
  - `exam_attempt_id` -> `exam_attempts(id)`
  - `grade_id` -> `grades(id)`

---

## User Review Required

> [!WARNING]
> In accordance with the **CBT Module Development Rule**, NO sample or mock questions will be inserted into the database. The system is designed to work with **zero questions** initially.
>
> If the question bank is empty for the user's role:
> - The **Start Exam** button in the frontend will be disabled.
> - An warning alert will display: **"Question bank not uploaded yet."**

> [!IMPORTANT]
> The database schema is fully setup and matches our architectural requirements. No migrations are needed. We will implement the complete API layer and frontend routing to connect these tables.

---

## Proposed Changes

### Backend APIs

#### [MODIFY] [server.js](file:///D:/Ruturaj/RailwayWeb/RailwayWeb/backend/server.js)
- Import and mount `examRoutes` under `/api/exam`.

#### [MODIFY] [examRoutes.js](file:///D:/Ruturaj/RailwayWeb/RailwayWeb/backend/routes/examRoutes.js)
Implement endpoints (all protected by JWT auth):
- `GET /api/exam/status`: Checks active question bank size for the user's role.
- `POST /api/exam/start`: Starts a CBT exam. Checks if there is an active exam to prevent duplicate attempts. If not, it randomly selects 25 active questions for the role, initializes the attempt, saves answer placeholders, and returns the questions (without correct keys).
- `POST /api/exam/submit-answer`: Saves an employee's selected option in real-time.
- `POST /api/exam/submit`: Compares options with correct keys, computes correct counts, percentage, result (pass/fail), updates the attempt, logs `assessment_results`, and returns the scorecard.

#### [MODIFY] [examController.js](file:///D:/Ruturaj/RailwayWeb/RailwayWeb/backend/controllers/examController.js)
- Implement query handlers, score computations, and integrity validations matching the database specifications.

---

### Frontend Components

#### [NEW] [examService.js](file:///D:/Ruturaj/RailwayWeb/RailwayWeb/frontend/src/services/examService.js)
Create reusable frontend functions:
- `getExamStatus()`
- `startExam()`
- `submitAnswer(attemptId, questionId, selectedAnswer)`
- `submitExam(attemptId)`

#### [MODIFY] [PointsmanModule.jsx](file:///D:/Ruturaj/RailwayWeb/RailwayWeb/frontend/src/PointsmanModule.jsx)
- On component mount, check the active exam status.
- Disable start button or show warning when the question bank is empty.
- Integrate backend routes for starting and finalizing CBT assessments.

#### [MODIFY] [MyAssessment.jsx](file:///D:/Ruturaj/RailwayWeb/RailwayWeb/frontend/src/components/MyAssessment.jsx)
- Render warning/disabled states if question bank status shows `0` questions available.
- Call real backend API on start, answer selection, and submission.

---

## Verification Plan

### Manual Verification
1. Log in as Pointsman (`SHIRYS`).
2. Go to **My Assessment**. Confirm that the "Start 25 MCQ Online Assessment" button is disabled and displays the notice **"Question bank not uploaded yet."** (since the database is currently empty).
3. Insert a single test question for the role into the `questions` table using a script/console.
4. Verify that the "Start" button becomes active.
5. Take the exam, select answers, submit, and confirm that attempts and results are correctly populated in `exam_attempts` and `exam_answers` tables.
