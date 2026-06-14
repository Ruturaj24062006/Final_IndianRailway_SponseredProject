import React, { useMemo, useState, useEffect } from "react";
import {
  BarChart3, Building2, ClipboardList, FileBarChart2, LogOut,
  Search, ShieldCheck, UserRound, Users, UserCheck, TrainFront,
  Plus, Edit, Trash2, ArrowRightLeft, ArrowLeft, TrendingUp,
  AlertTriangle, CheckCircle, Clock, XCircle, Activity,
  MapPin, Phone, Calendar, Award, UserPlus, FileText, HelpCircle, History, RefreshCw, Key,
  Bell, ShieldAlert, Cpu, Sparkles
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
  LineChart, Line, LabelList
} from "recharts";
import "./sdom.css";
import SADashboard from "./components/SuperAdminModule/SADashboard";
import UserProfile from "./components/UserProfile";
import CommonRoleView from "./components/CommonRoleView";
import CommonLayout from "./components/CommonLayout";
import SAStations from "./components/SuperAdminModule/SAStations";
import SARecords from "./components/SuperAdminModule/SARecords";
import CommonReports from "./components/CommonReports";
import AuditDashboard from "./components/SuperAdminModule/AuditDashboard";
import ImportWizard from "./components/SuperAdminModule/ImportWizard";
import HierarchyTree from "./components/SuperAdminModule/HierarchyTree";
import RiskIntelligenceDashboard from "./components/AOmModule/RiskIntelligenceDashboard";
import ExecutiveAnalytics from "./components/ExecutiveAnalytics";
import AiCommandCenter from "./components/AiCommandCenter";


import {
  getDashboard,
  getSystemHealth,
  getAuditLogs,
  getEmployees,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  getUsers,
  resetPassword,
  getStations,
  createStation,
  updateStation,
  getQuestions,
  createQuestion,
  updateQuestion,
  deactivateQuestion
} from "./services/adminService";

/* ═══════════════════════════════════════════
   NAVIGATION CONFIGURATION
   ═══════════════════════════════════════════ */

const NAV = [
  { key: "dashboard",  label: "Dashboard",                icon: BarChart3 },
  { key: "executive",  label: "Division Command Center",  icon: BarChart3 },
  { key: "hierarchy",  label: "Staff Hierarchy",          icon: Users },
  { key: "stations",   label: "Stations",                 icon: Building2 },
  { key: "users",      label: "User Logins",              icon: UserCheck },
  { key: "questions",  label: "Question Bank",            icon: FileText },
  { key: "records",    label: "Assessment Records",       icon: ClipboardList },
  { key: "reports",    label: "Reports & Analytics",      icon: FileBarChart2 },
  { key: "audit",      label: "Audit Logs",               icon: ShieldCheck },
  { key: "import",     label: "Bulk Roster Import",       icon: UserPlus },
  { key: "risk",       label: "Predictive Risk",          icon: ShieldAlert },
  { key: "profile",    label: "My Profile",               icon: Award },
];

/* ═══════════════════════════════════════════
   THEMING & COLOR CONSTANTS
   ═══════════════════════════════════════════ */
const CAT_COLORS  = { A: "#1E3A5F", B: "#2B6CB0", C: "#D69E2E", D: "#C53030" };
const RISK_COLORS = { Low: "#2F855A", Medium: "#D69E2E", High: "#C53030" };
const STATUS_COLORS = { Approved: "#2F855A", Pending: "#D69E2E", Rejected: "#C53030", Overdue: "#9B2C2C" };

/* ═══════════════════════════════════════════
   HELPERS & MAPPERS
   ═══════════════════════════════════════════ */
function mapEmployeeToFrontend(emp) {
  if (!emp) return null;
  let role = "pointsmen";
  const desigLower = (emp.designation || "").toLowerCase();
  if (emp.role_id === 2 || desigLower.includes("station master")) role = "sm";
  else if (emp.role_id === 4 || desigLower.includes("superintendent")) role = "ss";
  else if (emp.role_id === 3 || desigLower.includes("manager")) role = "tm";
  else if (emp.role_id === 6 || desigLower.includes("inspector")) role = "ti";
  else if (emp.role_id === 1 || desigLower.includes("pointsman")) role = "pointsmen";
  
  return {
    id: emp.hrms_id || emp.employee_id || emp.id,
    dbUuid: emp.id,
    hrmsId: emp.hrms_id,
    employeeId: emp.employee_id,
    name: emp.full_name,
    role: role,
    designation: emp.designation,
    station: emp.station_name || "Unassigned",
    station_id: emp.station_id,
    role_id: emp.role_id,
    ti: emp.ti || "TI NGP",
    cat: emp.category_grade || "A",
    risk: emp.risk_level || "Normal",
    score: parseFloat(emp.score) || 80,
    contact: emp.mobile || emp.contact || "",
    email: emp.email || "",
    status: emp.status || "Active",
    joiningDate: emp.date_of_joining ? new Date(emp.date_of_joining).toISOString().split('T')[0] : "",
    lastDate: emp.last_assessment_date || emp.lastDate || "",
    division: emp.division || "Nagpur",
    zone: emp.zone || "Central Railway",
    reportingSm: emp.reporting_sm || "",
    workLocation: emp.work_location || "",
    shift: emp.assigned_shift || "",
    jurisdiction: emp.jurisdiction || "",
    reportingAom: emp.reporting_aom || "P. K. Verma (Sr. DOM)",
    pmeStatus: emp.pme_status || "Fit",
    refStatus: "Cleared"
  };
}

function mapStationToFrontend(st) {
  if (!st) return null;
  let ti = "TI NGP";
  if (st.station_code === "PBN" || st.station_code === "PUU" || st.station_code === "JNR") ti = "TI PAR";
  else if (st.station_code === "AMLA" || st.station_code === "BZU" || st.station_code === "MAI") ti = "TI AMLA";
  
  const totalStaff = (parseInt(st.sm_count) || 0) + (parseInt(st.pm_count) || 0);
  const safety = totalStaff > 0 
    ? 100 - Math.round(((parseInt(st.high_risk_count) || 0) / totalStaff) * 100)
    : 100;

  return {
    id: st.id,
    name: st.station_name,
    code: st.station_code,
    ti: ti,
    smCount: parseInt(st.sm_count) || 0,
    pmCount: parseInt(st.pm_count) || 0,
    score: parseFloat(st.avg_score) || 0,
    safety: safety,
    highRisk: parseInt(st.high_risk_count) || 0,
    pending: parseInt(st.pending_count) || 0
  };
}

function mapRoleNameToId(name) {
  if (!name) return 1;
  const normalized = name.toLowerCase().replace(/[^a-z]/g, "");
  if (normalized.includes("pointsman")) return 1;
  if (normalized.includes("stationmaster") || normalized === "sm") return 2;
  if (normalized.includes("trainmanager") || normalized === "tm") return 3;
  if (normalized.includes("superintendent") || normalized === "ss") return 4;
  if (normalized.includes("supervisor")) return 5;
  if (normalized.includes("trafficinspector") || normalized === "ti") return 6;
  return 1;
}

function riskBadge(r) {
  const map = { Low:"sdom-badge-success", Medium:"sdom-badge-warning", High:"sdom-badge-danger" };
  return <span className={`sdom-badge ${map[r] || "sdom-badge-neutral"}`}>{r}</span>;
}
function catBadge(c) {
  const map = { A:"sdom-badge-success", B:"sdom-badge-info", C:"sdom-badge-warning", D:"sdom-badge-danger" };
  return <span className={`sdom-badge ${map[c] || "sdom-badge-neutral"}`}>{c}</span>;
}
function statusBadge(s) {
  const map = { Approved:"sdom-badge-success", Pending:"sdom-badge-warning", Rejected:"sdom-badge-danger", Overdue:"sdom-badge-danger", Active: "sdom-badge-success" };
  return <span className={`sdom-badge ${map[s] || "sdom-badge-neutral"}`}>{s}</span>;
}

function getCategoryColor(cat) {
  const map = { A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#dc2626" };
  return map[cat] || "#64748b";
}
function getCategoryBg(cat) {
  const map = { A: "#dcfce7", B: "#dbeafe", C: "#fef3c7", D: "#fee2e2" };
  return map[cat] || "#f1f5f9";
}
function isRoleAssessmentOverdue(s) { return s.status === "Overdue"; }
function isRolePmeOverdue(s) { return false; }
function isRoleRefOverdue(s) { return false; }
function getOverdueCount(arr) { return arr ? arr.filter(s => s.status === "Overdue").length : 0; }
function getAverageScore(arr) {
  if (!arr || !arr.length) return 0;
  return Math.round(arr.reduce((s, x) => s + (x.score || 0), 0) / arr.length);
}
function openScorecard(rec) {}

/* ═══════════════════════════════════════════
   MAIN MODULE COMPONENT
   ═══════════════════════════════════════════ */
export default function SuperAdminModule({ user, onLogout }) {
  const fullName = user?.name || "Super Admin User";
  const employeeId = user?.hrmsId || "SA_1001";
  
  // Page routing and tab state
  const [page, setPage] = useState("dashboard");

  const [activeHierarchyTab, setActiveHierarchyTab] = useState("tree");
  const [view, setView] = useState(null); // { type, data } for drill-downs

  // Data States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [staff, setStaff] = useState([]);
  const [stations, setStations] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [userAccounts, setUserAccounts] = useState([]);

  // UI state overlays
  const [showAddStation, setShowAddStation] = useState(false);
  const [newStName, setNewStName] = useState("");
  const [newStCode, setNewStCode] = useState("");
  const [newStTi, setNewStTi] = useState("TI NGP");
  const [modal, setModal] = useState(null);

  // Filters State
  const [roleF, setRoleF] = useState({ name:"", station:"All", ti:"All", cat:"All", risk:"All" });
  const [stF,   setStF]   = useState({ name:"" });
  const [recF,  setRecF]  = useState({ role:"All", station:"All", status:"All", name:"" });
  const [repF,  setRepF]  = useState({ search: "", cat: "All", risk: "All", station: "All", ti: "All", role: "All" });

  const [questionSearch, setQuestionSearch] = useState("");
  const [questionRoleFilter, setQuestionRoleFilter] = useState("All");
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  const [userSearch, setUserSearch] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const [auditSearch, setAuditSearch] = useState("");

  // Reusable load logic
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, health, empList, stList, qList, logList, userList] = await Promise.all([
        getDashboard(),
        getSystemHealth(),
        getEmployees(),
        getStations(),
        getQuestions(),
        getAuditLogs(),
        getUsers()
      ]);
      setDashboardData(dash);
      setSystemHealth(health);
      setStaff((empList || []).map(mapEmployeeToFrontend));
      setStations((stList || []).map(mapStationToFrontend));
      setQuestions(qList || []);
      setAuditLogs(logList || []);
      setUserAccounts(userList || []);
      setLoading(false);
    } catch (err) {
      console.error("Error loading admin data:", err);
      setError(err.message || "Failed to load dashboard data");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Station lists and other options
  const STATION_OPTS = useMemo(() => ["All", ...stations.map(s => s.name)], [stations]);
  const TI_OPTS      = ["All","TI PAR","TI AMLA","TI NGP"];
  const ROLE_OPTS    = ["All","Pointsman","Station Master","Station Superintendent","Train Manager","Traffic Inspector"];
  const ROLE_MAP     = { pointsmen:"Pointsman", sm:"Station Master", ss:"Station Superintendent", tm:"Train Manager", ti:"Traffic Inspector" };

  // Navigation handlers
  function navigate(p) {
    setPage(p);
    setView(null);
    setRoleF({ name:"", station:"All", ti:"All", cat:"All", risk:"All" });
  }
  function openView(type, data) { setView({ type, data }); }
  function closeView()           { setView(null); }

  // ── Station CRUD ───────────────────────────────────────────────────────────
  const handleAddStation = async () => {
    if (!newStName.trim() || !newStCode.trim()) {
      alert("Please enter both Station Name and Station Code.");
      return;
    }
    try {
      await createStation({
        station_name: newStName.trim(),
        station_code: newStCode.trim().toUpperCase(),
        division: "Nagpur (NGP)",
        zone: "Central Railway"
      });
      alert("Station created successfully.");
      setShowAddStation(false);
      loadData();
    } catch (err) {
      alert("Error adding station: " + err.message);
    }
  };

  // ── Employee CRUD (using saveModal wrapper) ───────────────────────────────
  function openAdd(role) {
    setModal({
      mode: "add",
      role,
      data: {
        id: "",
        name: "",
        station: stations[0]?.name || "",
        ti: "TI NGP",
        cat: "A",
        risk: "Low",
        score: 0,
        contact: "",
        lastDate: "",
        status: "Active",
        email: "",
        division: "Nagpur",
        zone: "Central Railway",
        reportingSm: "",
        workLocation: "",
        shift: "",
        smStation: stations[0]?.name || "",
        smZone: "Central Railway",
        smDivision: "Nagpur",
        jurisdiction: "Nagpur Division",
        reportingAom: "P. K. Verma (Sr. DOM)",
        linkedStations: ""
      }
    });
  }
  function openEdit(s) {
    setModal({ mode:"edit", role:s.role, data:{ ...s } });
  }
  function openShift(s) {
    setModal({ mode:"shift", role:s.role, data:{ ...s } });
  }

  const saveModal = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!modal?.data?.name || !modal?.data?.id) {
      alert("Name and HRMS ID are required.");
      return;
    }
    try {
      const targetStationName = modal.data.station || modal.data.stationName || modal.data.targetStation;
      const targetStationObj = stations.find(s => s.name === targetStationName || s.station_name === targetStationName);
      const station_id = targetStationObj ? targetStationObj.id : null;

      if (modal.mode === "add") {
        const payload = {
          employee_id: modal.data.id || modal.data.hrmsId,
          full_name: modal.data.name,
          hrms_id: (modal.data.id || modal.data.hrmsId)?.toUpperCase(),
          pf_number: modal.data.pf_number || ("PF" + Math.floor(100000 + Math.random() * 900000)),
          role_id: mapRoleNameToId(modal.data.role),
          station_id: station_id,
          designation: modal.data.designation || modal.data.role,
          category_grade: modal.data.cat || "A",
          risk_level: modal.data.risk || "Normal",
          status: "Active",
          create_login: true,
          password: "Railway@123"
        };
        await createEmployee(payload);
        alert("Employee added successfully with active login (Default password: Railway@123).");
      } else if (modal.mode === "edit") {
        const payload = {
          employee_id: modal.data.employeeId || modal.data.id,
          full_name: modal.data.name,
          hrms_id: (modal.data.hrmsId || modal.data.id)?.toUpperCase(),
          role_id: mapRoleNameToId(modal.data.role),
          station_id: station_id,
          designation: modal.data.designation || modal.data.role,
          category_grade: modal.data.cat || "A",
          risk_level: modal.data.risk || "Normal",
          status: modal.data.status || "Active"
        };
        await updateEmployee(modal.data.dbUuid, payload);
        alert("Employee profile updated successfully.");
      } else if (modal.mode === "shift") {
        const payload = {
          station_id: station_id
        };
        await updateEmployee(modal.data.dbUuid, payload);
        alert("Employee transferred successfully.");
      }
      setModal(null);
      loadData();
    } catch (err) {
      alert("Error saving employee details: " + err.message);
    }
  };

  const removeStaff = async (id, name) => {
    const target = staff.find(s => s.id === id);
    if (!target) return;
    if (window.confirm(`Deactivate employee ${name || target.name} (${id})? Their login account will also be disabled.`)) {
      try {
        await deactivateEmployee(target.dbUuid);
        alert("Employee deactivated successfully.");
        loadData();
      } catch (err) {
        alert("Error deactivating employee: " + err.message);
      }
    }
  };

  // ── Password Reset ─────────────────────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) return;
    try {
      await resetPassword(resetTargetUser, newPassword);
      alert(`Password successfully reset for ${resetTargetUser}.`);
      setShowResetModal(false);
      setNewPassword("");
      loadData();
    } catch (err) {
      alert("Error resetting password: " + err.message);
    }
  };

  // ── Question Bank CRUD ─────────────────────────────────────────────────────
  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingQuestion.id) {
        await updateQuestion(editingQuestion.id, editingQuestion);
        alert("Question updated successfully.");
      } else {
        await createQuestion(editingQuestion);
        alert("Question created successfully.");
      }
      setShowQuestionModal(false);
      setEditingQuestion(null);
      loadData();
    } catch (err) {
      alert("Error saving question: " + err.message);
    }
  };

  const handleDeactivateQuestion = async (qId) => {
    if (window.confirm("Are you sure you want to deactivate this question? It will no longer be shown in safety competency exams.")) {
      try {
        await deactivateQuestion(qId);
        alert("Question deactivated successfully.");
        loadData();
      } catch (err) {
        alert("Error deactivating question: " + err.message);
      }
    }
  };

  // ── Filtered data hooks for tables ─────────────────────────────────────────
  const recFiltered = useMemo(() => {
    const hasFilter = recF.role !== "All" || recF.station !== "All" || recF.status !== "All" || recF.name;
    if (!hasFilter) return null;
    return staff.filter(s => {
      const roleLabel = ROLE_MAP[s.role] || s.role;
      return (recF.role    === "All" || roleLabel === recF.role)      &&
             (recF.station === "All" || s.station === recF.station)   &&
             (recF.status  === "All" || s.status  === recF.status)    &&
             (!recF.name   || s.name.toLowerCase().includes(recF.name.toLowerCase()));
    });
  }, [recF, staff]);

  const filteredLogs = useMemo(() => {
    if (!auditLogs) return [];
    return auditLogs.filter(log => {
      const actorName = log.performed_by_name || "";
      const employeeName = log.employee_name || "";
      const action = log.action || "";
      const remarks = log.remarks || "";
      const searchLower = auditSearch.toLowerCase();
      return (
        actorName.toLowerCase().includes(searchLower) ||
        employeeName.toLowerCase().includes(searchLower) ||
        action.toLowerCase().includes(searchLower) ||
        remarks.toLowerCase().includes(searchLower)
      );
    });
  }, [auditLogs, auditSearch]);

  // ── Recharts computed variables ───────────────────────────────────────────
  const averageScore = useMemo(() => {
    if (!stations || !stations.length) return 0;
    const sum = stations.reduce((acc, st) => acc + (parseFloat(st.score) || 0), 0);
    return Math.round(sum / stations.length);
  }, [stations]);

  const complianceRate = useMemo(() => {
    if (!dashboardData?.compliance || !dashboardData.compliance.length) return 91;
    return parseFloat(dashboardData.compliance[0].pct) || 91;
  }, [dashboardData]);

  const catData = useMemo(() => {
    if (!dashboardData?.pieData) return [];
    return dashboardData.pieData.map(d => ({
      name: d.name,
      value: parseInt(d.count) || 0,
      fill: CAT_COLORS[d.name] || "#cbd5e1"
    }));
  }, [dashboardData]);

  const stationProgressData = useMemo(() => {
    if (!dashboardData?.stations) return [];
    return dashboardData.stations.slice(0, 15).map(st => ({
      station: st.name || st.station_name,
      completed: parseInt(st.completed) || 0,
      pending: parseInt(st.pending) || 0
    }));
  }, [dashboardData]);

  const stationAverageScoreData = useMemo(() => {
    if (!dashboardData?.stations) return [];
    return dashboardData.stations.slice(0, 15).map(st => ({
      station: st.name || st.station_name,
      avgScore: parseFloat(st.avgScore) || 0
    }));
  }, [dashboardData]);

  const monthlyTrend = useMemo(() => {
    if (!dashboardData?.monthlyTrend) return [];
    return dashboardData.monthlyTrend.map(t => ({
      month: t.month,
      score: parseFloat(t.score) || 0,
      safety: parseFloat(t.safety) || 0
    }));
  }, [dashboardData]);

  const complianceList = useMemo(() => {
    if (!dashboardData?.compliance) {
      return [
        { label: "Overall Safety Compliance", pct: 100, color: "#16a34a" },
        { label: "PME Completion Rate", pct: 100, color: "#2563eb" },
        { label: "REF Completion Rate", pct: 100, color: "#7c3aed" }
      ];
    }
    const colors = ["#16a34a", "#2563eb", "#7c3aed"];
    return dashboardData.compliance.map((c, i) => ({
      label: c.label,
      pct: parseFloat(c.pct) || 100,
      color: colors[i] || "#0891b2"
    }));
  }, [dashboardData]);

  const assessmentMonthly = useMemo(() => {
    if (!dashboardData?.pipeline) return [];
    const p = dashboardData.pipeline;
    return [
      { month: "Current", approved: p.Approved || 0, pending: p.Pending || 0, rejected: p.Rejected || 0, overdue: p.Overdue || 0 }
    ];
  }, [dashboardData]);

  // Profile data
  const superAdminProfile = {
    designation: user?.designation || "Senior Divisional Operations Manager (Sr. DOM)",
    hrmsId: user?.hrmsId || "SA_1001",
    contact: user?.mobile || "+91 98220 99001",
    email: user?.email || "srdom.ngp@rail.in",
    zone: user?.zone || "Central Railway",
    division: user?.division || "Nagpur",
    stationName: user?.stationName || "Nagpur Division HQ",
    reportingOfficer: "Zonal Chief Operations Manager (COM)",
    pmeStatus: "AUDITED (Due: 2026-06-20)",
    refStatus: "COMPLETED: Executive Safety Training",
    trainingStatus: "ACTIVE: Zonal Operations Review Completed"
  };

  // Full screen zoom modal handlers (standard stubs mapping to Recharts click events)
  const [isChartZoomModalOpen, setIsChartZoomModalOpen] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState("progress");
  const handleChartClick = (state, chartType) => {
    setSelectedChartType(chartType);
    setIsChartZoomModalOpen(true);
  };
  const handlePieClick = () => {
    setSelectedChartType("category");
    setIsChartZoomModalOpen(true);
  };

  /* ─── Render Sub-Pages ─── */
  const renderSystemHealthHeader = () => {
    if (!systemHealth) return null;
    return (
      <div style={{
        background: "#0f172a",
        color: "#ffffff",
        padding: "12px 24px",
        borderRadius: "12px",
        marginBottom: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        border: "1px solid #1e293b",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        flexWrap: "wrap",
        gap: "10px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: "#10b981",
            display: "inline-block",
            boxShadow: "0 0 8px #10b981"
          }}></span>
          <span style={{ fontSize: "0.85rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8" }}>
            Live System Health:
          </span>
          <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "#10b981" }}>
            {systemHealth.database_status === "Healthy" ? "DATABASE ONLINE" : "OFFLINE"}
          </span>
        </div>
        <div style={{ display: "flex", gap: "20px", fontSize: "0.8rem", color: "#94a3b8", fontWeight: "600", flexWrap: "wrap" }}>
          <span>Stations: <b style={{ color: "#fff" }}>{systemHealth.stations_count}</b></span>
          <span>Staff Profiles: <b style={{ color: "#fff" }}>{systemHealth.employees_count}</b></span>
          <span>Question Bank: <b style={{ color: "#fff" }}>{systemHealth.questions_count}</b></span>
          <span>Total Assessments: <b style={{ color: "#fff" }}>{systemHealth.assessments_count}</b></span>
          {systemHealth.last_login_time && (
            <span>Last Activity: <b style={{ color: "#fff" }}>{new Date(systemHealth.last_login_time).toLocaleTimeString()}</b></span>
          )}
        </div>
      </div>
    );
  };

  const renderUserAccountsPage = () => {
    const filteredAcc = userAccounts.filter(acc => {
      const hrms = (acc.hrms_id || "").toLowerCase();
      const name = (acc.name || "").toLowerCase();
      const desig = (acc.designation || "").toLowerCase();
      const search = userSearch.toLowerCase();
      return hrms.includes(search) || name.includes(search) || desig.includes(search);
    });

    return (
      <div className="sdom-fade">
        <h1 className="sdom-page-title">User Accounts</h1>
        <p className="sdom-page-subtitle">Manage system user logins and perform password resets for active personnel.</p>
        
        <div className="sdom-filter-bar">
          <div className="sdom-filter-field" style={{ flex: 1 }}>
            <label>Search User Account</label>
            <input 
              value={userSearch} 
              onChange={e => setUserSearch(e.target.value)} 
              placeholder="Search by HRMS ID, Name, or Designation..." 
            />
          </div>
        </div>

        <div className="sdom-chart-card">
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr>
                  <th>HRMS ID</th>
                  <th>Employee Name</th>
                  <th>Designation</th>
                  <th>Account Status</th>
                  <th>Last Login Time</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAcc.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>
                      No user accounts found
                    </td>
                  </tr>
                )}
                {filteredAcc.map(acc => (
                  <tr key={acc.id}>
                    <td style={{ fontWeight: 700 }}>{acc.hrms_id}</td>
                    <td>{acc.name || "—"}</td>
                    <td>{acc.designation || "—"}</td>
                    <td>
                      <span className={`sdom-badge ${acc.is_active ? "sdom-badge-success" : "sdom-badge-danger"}`}>
                        {acc.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>{acc.last_login ? new Date(acc.last_login).toLocaleString() : "Never Logged In"}</td>
                    <td style={{ textAlign: "right" }}>
                      <button 
                        className="sdom-btn-primary" 
                        style={{ padding: "5px 12px", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        onClick={() => {
                          setResetTargetUser(acc.hrms_id);
                          setShowResetModal(true);
                        }}
                      >
                        <Key size={14} /> Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reset Password Modal */}
        {showResetModal && (
          <div className="sdom-modal-overlay" style={{ zIndex: 999999 }}>
            <div className="sdom-modal" style={{ width: "400px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#0B1F3A" }}>Reset User Password</h3>
                <button type="button" onClick={() => setShowResetModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}>&times;</button>
              </div>
              <form onSubmit={handleResetPassword}>
                <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>
                  Set a new password for account: <b>{resetTargetUser}</b>
                </p>
                <div className="sdom-modal-field">
                  <label>New Password *</label>
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    placeholder="Enter new password" 
                    required 
                  />
                </div>
                <div className="sdom-modal-actions" style={{ marginTop: "24px" }}>
                  <button type="submit" className="sdom-btn-primary" style={{ flex: 1 }}>Reset Password</button>
                  <button type="button" className="sdom-btn-ghost" style={{ flex: 1 }} onClick={() => setShowResetModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderQuestionsPage = () => {
    const filteredQs = questions.filter(q => {
      const text = (q.question_text || "").toLowerCase();
      const role = (q.role_name || "").toLowerCase();
      const search = questionSearch.toLowerCase();
      const matchesSearch = text.includes(search) || role.includes(search);
      const matchesRole = questionRoleFilter === "All" || q.role_id === parseInt(questionRoleFilter);
      return matchesSearch && matchesRole;
    });

    const roleOptions = [
      { id: 1, name: "Pointsman" },
      { id: 2, name: "Station Master" },
      { id: 3, name: "Train Manager" },
      { id: 4, name: "Station Superintendent" },
      { id: 6, name: "Traffic Inspector" }
    ];

    return (
      <div className="sdom-fade">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <h1 className="sdom-page-title">Question Bank</h1>
            <p className="sdom-page-subtitle">Manage safety competency questions for pointsmen, station masters, and traffic inspectors.</p>
          </div>
          <button 
            className="sdom-btn-primary" 
            onClick={() => {
              setEditingQuestion({
                role_id: 1,
                question_text: "",
                option_a: "",
                option_b: "",
                option_c: "",
                option_d: "",
                correct_answer: "A",
                marks: 1,
                is_active: true
              });
              setShowQuestionModal(true);
            }}
          >
            <Plus size={16} /> Add New Question
          </button>
        </div>

        <div className="sdom-filter-bar">
          <div className="sdom-filter-field" style={{ flex: 2 }}>
            <label>Search Question Text</label>
            <input 
              value={questionSearch} 
              onChange={e => setQuestionSearch(e.target.value)} 
              placeholder="Search by keywords..." 
            />
          </div>
          <div className="sdom-filter-field" style={{ flex: 1 }}>
            <label>Filter by Role</label>
            <select value={questionRoleFilter} onChange={e => setQuestionRoleFilter(e.target.value)}>
              <option value="All">All Roles</option>
              {roleOptions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        </div>

        <div className="sdom-chart-card">
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Role</th>
                  <th>Question Text</th>
                  <th>Correct Ans</th>
                  <th>Marks</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQs.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>
                      No safety questions found
                    </td>
                  </tr>
                )}
                {filteredQs.map(q => (
                  <tr key={q.id}>
                    <td>{q.id}</td>
                    <td style={{ fontWeight: 700 }}>{q.role_name || `Role ID: ${q.role_id}`}</td>
                    <td style={{ maxWidth: "400px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {q.question_text}
                    </td>
                    <td style={{ fontWeight: 700, textAlign: "center" }}>{q.correct_answer}</td>
                    <td style={{ textAlign: "center" }}>{q.marks}</td>
                    <td>
                      <span className={`sdom-badge ${q.is_active ? "sdom-badge-success" : "sdom-badge-danger"}`}>
                        {q.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button 
                          type="button"
                          className="sdom-icon-btn" 
                          onClick={() => {
                            setEditingQuestion(q);
                            setShowQuestionModal(true);
                          }}
                          style={{ background: "none", border: "none", cursor: "pointer" }}
                        >
                          <Edit size={14} color="#2563eb" />
                        </button>
                        {q.is_active && (
                          <button 
                            type="button"
                            className="sdom-icon-btn" 
                            onClick={() => handleDeactivateQuestion(q.id)}
                            style={{ background: "none", border: "none", cursor: "pointer" }}
                          >
                            <Trash2 size={14} color="#dc2626" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Question Modal */}
        {showQuestionModal && editingQuestion && (
          <div className="sdom-modal-overlay" style={{ zIndex: 999999 }}>
            <div className="sdom-modal" style={{ width: "600px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#0B1F3A" }}>
                  {editingQuestion.id ? "Edit Safety Question" : "Add Safety Question"}
                </h3>
                <button type="button" onClick={() => setShowQuestionModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}>&times;</button>
              </div>
              <form onSubmit={handleQuestionSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Target Role *</label>
                    <select 
                      value={editingQuestion.role_id} 
                      onChange={e => setEditingQuestion({ ...editingQuestion, role_id: parseInt(e.target.value) })}
                    >
                      {roleOptions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Marks *</label>
                    <input 
                      type="number" 
                      value={editingQuestion.marks || 1} 
                      onChange={e => setEditingQuestion({ ...editingQuestion, marks: parseInt(e.target.value) })} 
                      required 
                    />
                  </div>
                </div>

                <div className="sdom-modal-field">
                  <label>Question Text *</label>
                  <textarea 
                    value={editingQuestion.question_text || ""} 
                    onChange={e => setEditingQuestion({ ...editingQuestion, question_text: e.target.value })} 
                    placeholder="Enter the safety competency question..."
                    style={{ width: "100%", height: "80px", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    required 
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Option A *</label>
                    <input 
                      value={editingQuestion.option_a || ""} 
                      onChange={e => setEditingQuestion({ ...editingQuestion, option_a: e.target.value })} 
                      placeholder="Option A" 
                      required 
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>Option B *</label>
                    <input 
                      value={editingQuestion.option_b || ""} 
                      onChange={e => setEditingQuestion({ ...editingQuestion, option_b: e.target.value })} 
                      placeholder="Option B" 
                      required 
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>Option C</label>
                    <input 
                      value={editingQuestion.option_c || ""} 
                      onChange={e => setEditingQuestion({ ...editingQuestion, option_c: e.target.value })} 
                      placeholder="Option C (Optional)" 
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>Option D</label>
                    <input 
                      value={editingQuestion.option_d || ""} 
                      onChange={e => setEditingQuestion({ ...editingQuestion, option_d: e.target.value })} 
                      placeholder="Option D (Optional)" 
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Correct Answer Option *</label>
                    <select 
                      value={editingQuestion.correct_answer} 
                      onChange={e => setEditingQuestion({ ...editingQuestion, correct_answer: e.target.value })}
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Is Active Status</label>
                    <select 
                      value={editingQuestion.is_active ? "true" : "false"} 
                      onChange={e => setEditingQuestion({ ...editingQuestion, is_active: e.target.value === "true" })}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="sdom-modal-actions" style={{ marginTop: "16px" }}>
                  <button type="submit" className="sdom-btn-primary" style={{ flex: 1 }}>Save Question</button>
                  <button type="button" className="sdom-btn-ghost" style={{ flex: 1 }} onClick={() => setShowQuestionModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAuditLogsPage = () => {
    return (
      <div className="sdom-fade">
        <h1 className="sdom-page-title">System Audit Logs</h1>
        <p className="sdom-page-subtitle">Roster tracking of administrative CRUD operations, login events, and password resets.</p>
        
        <div className="sdom-filter-bar">
          <div className="sdom-filter-field" style={{ flex: 1 }}>
            <label>Search Audit Logs</label>
            <input 
              value={auditSearch} 
              onChange={e => setAuditSearch(e.target.value)} 
              placeholder="Search by action, actor, employee name or remarks..." 
            />
          </div>
        </div>

        <div className="sdom-chart-card">
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Performed By</th>
                  <th>Target Employee</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>
                      No audit log entries match the search filter
                    </td>
                  </tr>
                )}
                {filteredLogs.map(log => {
                  let badgeClass = "sdom-badge-blue";
                  if (log.action.includes("CREATE")) badgeClass = "sdom-badge-success";
                  else if (log.action.includes("UPDATE") || log.action.includes("RESET")) badgeClass = "sdom-badge-warning";
                  else if (log.action.includes("DEACTIVATE") || log.action.includes("FAILURE")) badgeClass = "sdom-badge-danger";
                  else if (log.action.includes("LOGIN_SUCCESS")) badgeClass = "sdom-badge-success";

                  return (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: "nowrap", fontSize: "0.8rem" }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td>
                        <span className={`sdom-badge ${badgeClass}`}>
                          {log.action}
                        </span>
                      </td>
                      <td>{log.module_name || "—"}</td>
                      <td style={{ fontWeight: 600 }}>{log.performed_by_name || "System"}</td>
                      <td>{log.employee_name || "—"}</td>
                      <td style={{ fontSize: "0.85rem", color: "#475569" }}>{log.remarks}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ─── Content dispatcher ─── */
  function renderBody() {
    if (loading) {
      return (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "400px", gap: "16px" }}>
          <div className="loading-spinner"></div>
          <span style={{ fontWeight: "700", color: "#475569" }}>Loading command center data from PostgreSQL...</span>
        </div>
      );
    }
    if (error) {
      return (
        <div className="sdom-chart-card" style={{ padding: "24px", border: "1px solid #fee2e2", background: "#fee2e2", color: "#991b1b", borderRadius: "12px", margin: "20px" }}>
          <h3 style={{ margin: "0 0 8px 0", fontWeight: "800" }}>Error Loading Data</h3>
          <p style={{ margin: "0 0 16px 0", fontSize: "0.9rem" }}>{error}</p>
          <button className="sdom-btn-primary" onClick={loadData}>Retry Connection</button>
        </div>
      );
    }

    const showHealthBanner = page === "dashboard";

    return (
      <div style={{ padding: "24px" }}>
        {showHealthBanner && renderSystemHealthHeader()}
        {(() => {
          switch (page) {
            case "dashboard":
              return (
                <SADashboard
                  averageScore={averageScore}
                  complianceRate={complianceRate}
                  stationCount={stations.length}
                  pointsmen={staff.filter(s=>s.role==="pointsmen")}
                  stationMasters={staff.filter(s=>s.role==="sm")}
                  stationSuperintendents={staff.filter(s=>s.role==="ss")}
                  trainManagers={staff.filter(s=>s.role==="tm")}
                  trafficInspectors={staff.filter(s=>s.role==="ti")}
                  history={monthlyTrend}
                  trendData={monthlyTrend}
                  pieData={catData}
                  openScorecard={openScorecard}
                  getCategoryBg={getCategoryBg}
                  getCategoryColor={getCategoryColor}
                  isRoleAssessmentOverdue={isRoleAssessmentOverdue}
                  isRolePmeOverdue={isRolePmeOverdue}
                  isRoleRefOverdue={isRoleRefOverdue}
                  getOverdueCount={getOverdueCount}
                  getAverageScore={getAverageScore}
                  staff={staff}
                  stations={stations}
                  stationProgressData={stationProgressData}
                  stationAverageScoreData={stationAverageScoreData}
                  MONTHLY_TREND={monthlyTrend}
                  catData={catData}
                  COMPLIANCE={complianceList}
                  ASSESSMENT_MONTHLY={assessmentMonthly}
                  handleChartClick={handleChartClick}
                  handlePieClick={handlePieClick}
                  profileData={superAdminProfile}
                />
              );
            case "executive":
              return <ExecutiveAnalytics user={user} role="Super Admin" />;
            case "ai":
              return <AiCommandCenter user={user} role="Super Admin" />;
            case "profile":
              return (
                <UserProfile
                  fullName={fullName}
                  employeeId={employeeId}
                  latestCategory={"A"}
                  latestScore={84}
                  history={[]}
                  profileData={superAdminProfile}
                />
              );
            case "hierarchy": {
              const roleInfo = {
                pointsmen: { key: "pointsmen", title: "Pointsman" },
                sm: { key: "sm", title: "Station Master" },
                ss: { key: "ss", title: "Station Superintendent" },
                tm: { key: "tm", title: "Train Manager" },
                ti: { key: "ti", title: "Traffic Inspector" }
              }[activeHierarchyTab] || { key: "", title: "" };

              return (
                <div className="sdom-fade">
                  <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h1 className="sdom-page-title">Staff Hierarchy</h1>
                      <p className="sdom-page-subtitle">Manage operations and profiles across Nagpur division's staff roles.</p>
                    </div>
                  </div>

                  <div style={{
                    display: "flex",
                    gap: "8px",
                    background: "#f1f5f9",
                    padding: "6px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    marginBottom: "24px",
                    width: "fit-content"
                  }}>
                    {[
                      { key: "tree", label: "Division Command Tree", count: "Live" },
                      { key: "pointsmen", label: "Pointsman", count: staff.filter(s=>s.role==="pointsmen").length },
                      { key: "sm", label: "Station Master", count: staff.filter(s=>s.role==="sm").length },
                      { key: "ss", label: "Station Superintendent", count: staff.filter(s=>s.role==="ss").length },
                      { key: "tm", label: "Train Manager", count: staff.filter(s=>s.role==="tm").length },
                      { key: "ti", label: "Traffic Inspector", count: staff.filter(s=>s.role==="ti").length }
                    ].map(tab => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveHierarchyTab(tab.key)}
                        style={{
                          padding: "10px 20px",
                          borderRadius: "8px",
                          border: "none",
                          fontWeight: "700",
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          background: activeHierarchyTab === tab.key ? "#1E3A5F" : "transparent",
                          color: activeHierarchyTab === tab.key ? "#ffffff" : "#475569",
                          transition: "all 0.2s ease",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                        }}
                      >
                        <span>{tab.label}</span>
                        <span style={{
                          fontSize: "0.75rem",
                          background: activeHierarchyTab === tab.key ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.06)",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          color: activeHierarchyTab === tab.key ? "#ffffff" : "#475569"
                        }}>{tab.count}</span>
                      </button>
                    ))}
                  </div>

                  {activeHierarchyTab === "tree" ? (
                    <HierarchyTree staff={staff} onHierarchyUpdated={loadData} />
                  ) : (
                    roleInfo.key && (
                      <CommonRoleView
                        roleKey={roleInfo.key}
                        title={roleInfo.title}
                        activePage={activeHierarchyTab}
                        users={staff}
                        setUsers={setStaff}
                        stations={stations}
                        view={view}
                        setView={setView}
                        roleF={roleF}
                        setRoleF={setRoleF}
                        editingUser={modal?.mode === "edit" ? modal.data : null}
                        setEditingUser={(user) => setModal(user ? { mode: "edit", role: user.role, data: user } : null)}
                        transferringUser={modal?.mode === "shift" ? modal.data : null}
                        setTransferringUser={(user) => setModal(user ? { mode: "shift", role: user.role, data: user } : null)}
                        showAddUserModal={modal?.mode === "add"}
                        setShowAddUserModal={(show) => {
                          if (show) openAdd(roleInfo.key);
                          else setModal(null);
                        }}
                        newUserData={modal?.mode === "add" ? modal.data : null}
                        setNewUserData={(data) => setModal(p => p ? { ...p, data } : null)}
                        handleAddUserSubmit={saveModal}
                        handleEditUser={(user) => openEdit(user)}
                        handleTransferClick={(user) => openShift(user)}
                        handleDeleteUser={(id, name) => removeStaff(id, name)}
                        saveEditedUser={saveModal}
                        confirmTransfer={saveModal}
                      />
                    )
                  )}
                </div>
              );
            }
            case "stations":
              return (
                <SAStations
                  stations={stations}
                  setStations={setStations}
                  showAddStation={showAddStation}
                  setShowAddStation={setShowAddStation}
                  newStName={newStName}
                  setNewStName={setNewStName}
                  newStCode={newStCode}
                  setNewStCode={setNewStCode}
                  newStTi={newStTi}
                  setNewStTi={setNewStTi}
                  handleAddStation={handleAddStation}
                  stF={stF}
                  setStF={setStF}
                  view={view}
                  setView={setView}
                  getCategoryColor={getCategoryColor}
                  getCategoryBg={getCategoryBg}
                  catBadge={catBadge}
                  statusBadge={statusBadge}
                  riskBadge={riskBadge}
                  staff={staff}
                  STATION_OPTS={STATION_OPTS}
                  TI_OPTS={TI_OPTS}
                  openView={openView}
                  closeView={closeView}
                />
              );
            case "users":
              return renderUserAccountsPage();
            case "questions":
              return renderQuestionsPage();
            case "records":
              return (
                <SARecords
                  staff={staff}
                  recF={recF}
                  setRecF={setRecF}
                  recFiltered={recFiltered}
                  ROLE_MAP={ROLE_MAP}
                  ROLE_OPTS={ROLE_OPTS}
                  STATION_OPTS={STATION_OPTS}
                  catBadge={catBadge}
                  statusBadge={statusBadge}
                />
              );
            case "reports":
              return (
                <CommonReports
                  users={staff}
                  selectedReportUserId={view?.type === "staffDetail" ? view.data.id : null}
                  setSelectedReportUserId={(id) => {
                    if (id) {
                      const selected = staff.find(x => x.id === id);
                      setView({ type: "staffDetail", data: selected, returnTo: "reports" });
                    } else {
                      setView(null);
                    }
                  }}
                  repF={repF}
                  setRepF={setRepF}
                  userRole="Super Admin"
                />
              );
            case "audit":
              return <AuditDashboard />;
            case "import":
              return <ImportWizard staff={staff} onImportSuccess={loadData} />;

            case "risk":
              return <RiskIntelligenceDashboard />;
            default:
              return null;
          }
        })()}
      </div>
    );
  }

  const userObj = { name: fullName, hrmsId: employeeId, role: "Super Admin" };

  return (
    <div className="sdom-app-layout">
      <CommonLayout
        user={userObj}
        navItems={NAV}
        activeTab={page}
        setActiveTab={navigate}
        onLogout={onLogout}

        brandTitle="Indian Railway Evaluation System"
        brandSubtitle="Nagpur Division — Sr. DOM Command Center"
      >
        <div className="sdom-content-scrollable" style={{ padding: 0 }}>
          {renderBody()}
        </div>
      </CommonLayout>
    </div>
  );
}
