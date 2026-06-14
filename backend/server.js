const express = require("express");
const cors = require("cors");
const path = require("path");
const testRoutes = require("./routes/testRoutes");
const authRoutes = require("./routes/authRoutes");
const pointsmanRoutes = require("./routes/pointsmanRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const examRoutes = require("./routes/examRoutes");
const pmeRoutes = require("./routes/pmeRoutes");
const refRoutes = require("./routes/refRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const tiRoutes = require("./routes/tiRoutes");
const smRoutes = require("./routes/smRoutes");
const aomRoutes = require("./routes/aomRoutes");
const adminRoutes = require("./routes/adminRoutes");
const reportsRoutes = require("./routes/reportsRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const systemRoutes = require("./routes/systemRoutes");
const counsellingRoutes = require("./routes/counsellingRoutes");
const documentRoutes = require("./routes/documentRoutes");
const bulkImportRoutes = require("./routes/bulkImportRoutes");
const hierarchyRoutes = require("./routes/hierarchyRoutes");
const workflowRoutes = require("./routes/workflowRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const aiRoutes = require("./routes/aiRoutes");
const { runFullEngine } = require("./utils/workflowEngine");

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

console.log("Auth Routes Loaded");
require("dotenv").config();
require("./config/db"); // database connection

const app = express();

// Secure headers via Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Restrict CORS origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(",") 
  : [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
      "http://127.0.0.1:3000"
    ];
app.use(cors({
  origin: function(origin, callback) {
    const isLocalhost = origin && (
      origin.startsWith("http://localhost:") || 
      origin.startsWith("http://127.0.0.1:") || 
      origin === "http://localhost" || 
      origin === "http://127.0.0.1"
    );
    if (!origin || process.env.NODE_ENV !== "production" || isLocalhost || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error(`CORS Blocked: Origin "${origin}" is not in allowedOrigins:`, allowedOrigins);
      callback(new Error("Not allowed by CORS policy"));
    }
  },
  credentials: true
}));

app.use(express.json());

const isProduction = process.env.NODE_ENV === "production";

// Express Rate Limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 5000,
  message: { success: false, message: "Too many requests from this IP. Please try again in 15 minutes." }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 15 : 500,
  message: { success: false, message: "Too many login attempts. Please try again in 15 minutes." }
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 10 : 500,
  message: { success: false, message: "Too many AI requests. Please try again in 15 minutes." }
});

// Register specific limiters before general catch-all limiter
app.use("/api/auth", authLimiter);
app.use("/api/ai", aiLimiter);
app.use("/api", generalLimiter);

app.use("/uploads/reports", (req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox;");
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
}, express.static(path.join(__dirname, "uploads", "reports")));

app.use("/uploads", (req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox;");
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
}, express.static(path.join(__dirname, "uploads")));

app.use("/api/test", testRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/pointsman", pointsmanRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/exam", examRoutes);
app.use("/api/pme", pmeRoutes);
app.use("/api/ref", refRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/ti", tiRoutes);
app.use("/api/sm", smRoutes);
app.use("/api/aom", aomRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/counselling", counsellingRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/admin/import", bulkImportRoutes);
app.use("/api/hierarchy", hierarchyRoutes);
app.use("/api/workflow", workflowRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ai", aiRoutes);







app.get("/", (req, res) => {
    res.send("Indian Railway Evaluation System API Running");
});

const PORT = process.env.PORT || 5000;

// ── Workflow Automation Engine Scheduler ────────────────────────────────────
// Runs every 6 hours. First run after 30s to allow DB connection to settle.
const WORKFLOW_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

function scheduleWorkflowEngine() {
  console.log('[WorkflowEngine] Scheduler initialized — interval: 6 hours');
  setTimeout(async () => {
    console.log('[WorkflowEngine] Running initial startup scan...');
    await runFullEngine().catch(err =>
      console.error('[WorkflowEngine] Initial run failed:', err.message)
    );
  }, 30 * 1000);
  setInterval(async () => {
    console.log('[WorkflowEngine] Scheduled 6-hour run triggered...');
    await runFullEngine().catch(err =>
      console.error('[WorkflowEngine] Scheduled run failed:', err.message)
    );
  }, WORKFLOW_INTERVAL_MS);
}

process.on("unhandledRejection", (reason, promise) => {
    console.error("[Process] Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
    console.error("[Process] Uncaught Exception thrown:", err);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    scheduleWorkflowEngine();
});