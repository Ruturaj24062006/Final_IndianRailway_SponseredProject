import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Cpu,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Download,
  RefreshCw,
  Play,
  History,
  User,
  Calendar,
  ArrowUpDown,
  FileText,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";
import { useLanguage } from "../utils/LanguageContext";
import {
  getWorkflowDashboard,
  getWorkflowStats,
  getEscalations,
  getEscalation,
  updateEscalation,
  getRecommendations,
  getMyRecommendations,
  getRecommendation,
  updateRecommendation,
  createRecommendation,
  triggerEngine,
  getEngineStatus
} from "../services/workflowService";
import { getEmployeeRiskLedger } from "../services/aomService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

// Priority Color Configuration
const PRIORITY_STYLES = {
  Low: { text: "#16a34a", bg: "#dcfce7", border: "#bbf7d0" },
  Medium: { text: "#d97706", bg: "#fef3c7", border: "#fde68a" },
  High: { text: "#ea580c", bg: "#ffedd5", border: "#fed7aa" },
  Critical: { text: "#dc2626", bg: "#fee2e2", border: "#fecaca" }
};

const STATUS_STYLES = {
  // Escalation statuses
  Open: { text: "#dc2626", bg: "#fee2e2" },
  Acknowledged: { text: "#2563eb", bg: "#dbeafe" },
  Resolved: { text: "#16a34a", bg: "#dcfce7" },
  Dismissed: { text: "#475569", bg: "#f1f5f9" },
  // Recommendation statuses
  Pending: { text: "#ea580c", bg: "#ffedd5" },
  "In Progress": { text: "#2563eb", bg: "#dbeafe" },
  Completed: { text: "#16a34a", bg: "#dcfce7" },
  Cancelled: { text: "#dc2626", bg: "#fee2e2" },
  Deferred: { text: "#7c3aed", bg: "#f3e8ff" }
};

export default function WorkflowDashboard({ user, role }) {
  const { t } = useLanguage();
  const isPointsman = role === "Pointsman";
  
  // Tab control: Pointsman gets recommendations directly, others get dynamic tabs
  const [activeTab, setActiveTab] = useState(isPointsman ? "recommendations" : "overview");
  
  // Summary/Stats states
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [errorOverview, setErrorOverview] = useState(null);
  
  // Escalations tab states
  const [escalations, setEscalations] = useState([]);
  const [escTotal, setEscTotal] = useState(0);
  const [escPage, setEscPage] = useState(1);
  const [escLimit] = useState(10);
  const [escFilters, setEscFilters] = useState({
    status: "Open",
    priority: "",
    escalation_type: "",
    employee_id: "",
    search: ""
  });
  const [loadingEsc, setLoadingEsc] = useState(false);
  
  // Recommendations tab states
  const [recommendations, setRecommendations] = useState([]);
  const [recTotal, setRecTotal] = useState(0);
  const [recPage, setRecPage] = useState(1);
  const [recLimit] = useState(10);
  const [recFilters, setRecFilters] = useState({
    status: "Pending",
    priority: "",
    recommendation_type: "",
    assigned_to: "",
    search: ""
  });
  const [loadingRec, setLoadingRec] = useState(false);
  
  // Engine panel states
  const [engineState, setEngineState] = useState({
    isRunning: false,
    lastRunAt: null,
    totalRunCount: 0,
    runHistory: []
  });
  const [triggering, setTriggering] = useState(false);
  const [engineError, setEngineError] = useState(null);
  const [loadingEngine, setLoadingEngine] = useState(false);

  // Modals & Action Forms
  const [selectedEsc, setSelectedEsc] = useState(null);
  const [selectedRec, setSelectedRec] = useState(null);
  const [actionNotes, setActionNotes] = useState("");
  const [updatingAction, setUpdatingAction] = useState(false);
  const [showCreateRecModal, setShowCreateRecModal] = useState(false);
  
  // Create Recommendation form state
  const [newRecForm, setNewRecForm] = useState({
    employee_id: "",
    recommendation_type: "COUNSELLING_REQUIRED",
    priority: "Medium",
    title: "",
    description: "",
    assigned_to: "",
    due_date: ""
  });
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [foundEmployees, setFoundEmployees] = useState([]);
  const [searchingEmp, setSearchingEmp] = useState(false);
  const [submittingRec, setSubmittingRec] = useState(false);
  const [recFormError, setRecFormError] = useState("");

  // Auto-refresh tick counter to show a small countdown
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Debounced search helper refs
  const searchTimeoutRef = useRef(null);

  // Permissions helper
  const canWriteEsc = ["Super Admin", "AOM", "Traffic Inspector", "Station Superintendent", "Station Supervisor"].includes(role);
  const canWriteRec = ["Super Admin", "AOM", "Traffic Inspector", "Station Master", "Station Superintendent", "Station Supervisor"].includes(role);
  const canCreateRec = ["Super Admin", "AOM", "Traffic Inspector"].includes(role);
  const canControlEngine = ["Super Admin", "AOM"].includes(role);

  // ─── DATA FETCHERS ─────────────────────────────────────────────────────────
  
  const fetchDashboardData = useCallback(async (silent = false) => {
    if (isPointsman) return;
    if (!silent) setLoadingOverview(true);
    try {
      const data = await getWorkflowDashboard();
      setDashboardData(data);
      if (data.engine) {
        setEngineState(data.engine);
      }
      setErrorOverview(null);
    } catch (err) {
      console.error("fetchDashboardData error:", err);
      setErrorOverview("Failed to load dashboard aggregates.");
    } finally {
      if (!silent) setLoadingOverview(false);
    }
  }, [isPointsman]);

  const fetchEscalationsData = useCallback(async (silent = false) => {
    if (isPointsman) return;
    if (!silent) setLoadingEsc(true);
    try {
      const params = {
        page: escPage,
        limit: escLimit,
        status: escFilters.status,
        priority: escFilters.priority,
        escalation_type: escFilters.escalation_type
      };
      
      // Server-side search filter
      if (escFilters.search) {
        params.search = escFilters.search;
      }

      const res = await getEscalations(params);
      setEscalations(res.data || []);
      setEscTotal(res.pagination?.total || 0);
    } catch (err) {
      console.error("fetchEscalationsData error:", err);
    } finally {
      if (!silent) setLoadingEsc(false);
    }
  }, [escPage, escLimit, escFilters, isPointsman]);

  const fetchRecommendationsData = useCallback(async (silent = false) => {
    if (!silent) setLoadingRec(true);
    try {
      const params = {
        page: recPage,
        limit: recLimit,
        status: recFilters.status,
        priority: recFilters.priority,
        recommendation_type: recFilters.recommendation_type
      };
      
      // Server-side search filter
      if (recFilters.search) {
        params.search = recFilters.search;
      }

      let res;
      if (isPointsman) {
        res = await getMyRecommendations(params);
      } else {
        res = await getRecommendations(params);
      }

      setRecommendations(res.data || []);
      setRecTotal(res.pagination?.total || 0);
    } catch (err) {
      console.error("fetchRecommendationsData error:", err);
    } finally {
      if (!silent) setLoadingRec(false);
    }
  }, [recPage, recLimit, recFilters, isPointsman]);

  const fetchEngineData = useCallback(async (silent = false) => {
    if (!canControlEngine) return;
    if (!silent) setLoadingEngine(true);
    try {
      const data = await getEngineStatus();
      setEngineState(data);
      setEngineError(null);
    } catch (err) {
      console.error("fetchEngineData error:", err);
      setEngineError("Failed to fetch engine history.");
    } finally {
      if (!silent) setLoadingEngine(false);
    }
  }, [canControlEngine]);

  const handleRefreshAll = useCallback((silent = false) => {
    setLastRefreshed(new Date());
    if (activeTab === "overview") fetchDashboardData(silent);
    if (activeTab === "escalations") fetchEscalationsData(silent);
    if (activeTab === "recommendations") fetchRecommendationsData(silent);
    if (activeTab === "engine") fetchEngineData(silent);
  }, [activeTab, fetchDashboardData, fetchEscalationsData, fetchRecommendationsData, fetchEngineData]);

  // Trigger loading when activeTab, page, or filters change
  useEffect(() => {
    handleRefreshAll(false);
  }, [activeTab, escPage, recPage, handleRefreshAll]);

  // 60-Second Auto Refresh Timer
  useEffect(() => {
    const timer = setInterval(() => {
      handleRefreshAll(true);
    }, 60000);
    return () => clearInterval(timer);
  }, [handleRefreshAll]);

  // Handle server-side search input change with debounce (300ms)
  const handleSearchChange = (type, val) => {
    if (type === "escalations") {
      setEscFilters(prev => ({ ...prev, search: val }));
      setEscPage(1);
    } else {
      setRecFilters(prev => ({ ...prev, search: val }));
      setRecPage(1);
    }
  };

  // ─── ACTIONS ───────────────────────────────────────────────────────────────

  const handleTriggerEngine = async () => {
    setTriggering(true);
    try {
      const res = await triggerEngine();
      if (res.success) {
        alert("Workflow Automation Engine manual run triggered successfully!");
        fetchEngineData();
      } else {
        alert(res.message || "Failed to trigger engine.");
      }
    } catch (err) {
      alert(err.message || "Conflict: Engine might be already running.");
    } finally {
      setTriggering(false);
    }
  };

  const handleUpdateEscalationStatus = async (status) => {
    if (!selectedEsc) return;
    setUpdatingAction(true);
    try {
      // Find actor UUID if user profile is stored
      const rawUser = localStorage.getItem("user");
      let actorId = null;
      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser);
          actorId = parsed.id;
        } catch (_) {}
      }

      await updateEscalation(selectedEsc.id, {
        status,
        resolution_notes: actionNotes,
        resolved_by: actorId
      });
      alert(`Escalation status updated to ${status}.`);
      setSelectedEsc(null);
      setActionNotes("");
      fetchEscalationsData();
      fetchDashboardData(true);
    } catch (err) {
      alert("Error updating escalation: " + err.message);
    } finally {
      setUpdatingAction(false);
    }
  };

  const handleUpdateRecommendationStatus = async (status) => {
    if (!selectedRec) return;
    setUpdatingAction(true);
    try {
      const rawUser = localStorage.getItem("user");
      let actorId = null;
      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser);
          actorId = parsed.id;
        } catch (_) {}
      }

      await updateRecommendation(selectedRec.id, {
        status,
        completion_notes: actionNotes,
        completed_by: actorId
      });
      alert(`Recommendation status updated to ${status}.`);
      setSelectedRec(null);
      setActionNotes("");
      fetchRecommendationsData();
      fetchDashboardData(true);
    } catch (err) {
      alert("Error updating recommendation: " + err.message);
    } finally {
      setUpdatingAction(false);
    }
  };

  // Search active employees for the creation form
  useEffect(() => {
    if (employeeSearch.trim().length < 2) {
      setFoundEmployees([]);
      return;
    }

    setSearchingEmp(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const list = await getEmployeeRiskLedger(employeeSearch.trim());
        setFoundEmployees(list || []);
      } catch (err) {
        console.error("Search employee error:", err);
      } finally {
        setSearchingEmp(false);
      }
    }, 4000);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [employeeSearch]);

  const handleCreateRecommendation = async (e) => {
    e.preventDefault();
    if (!newRecForm.employee_id || !newRecForm.title) {
      setRecFormError("Employee and Title are required.");
      return;
    }
    setSubmittingRec(true);
    try {
      await createRecommendation(newRecForm);
      alert("Manual compliance recommendation created successfully!");
      setShowCreateRecModal(false);
      setNewRecForm({
        employee_id: "",
        recommendation_type: "COUNSELLING_REQUIRED",
        priority: "Medium",
        title: "",
        description: "",
        assigned_to: "",
        due_date: ""
      });
      setEmployeeSearch("");
      setRecFormError("");
      fetchRecommendationsData();
      fetchDashboardData(true);
    } catch (err) {
      setRecFormError(err.message || "Failed to create recommendation.");
    } finally {
      setSubmittingRec(false);
    }
  };

  // ─── CSV EXPORTER ──────────────────────────────────────────────────────────

  const handleExportCSV = async (type) => {
    try {
      let headers = [];
      let csvContent = "data:text/csv;charset=utf-8,";
      
      if (type === "escalations") {
        headers = ["ID", "Employee Name", "HRMS ID", "Escalation Type", "Priority", "Status", "Reason", "Due Date", "Days Overdue", "Created At"];
        csvContent += headers.join(",") + "\r\n";
        
        // Fetch all matching escalations for export (no pagination limit)
        const res = await getEscalations({
          status: escFilters.status,
          priority: escFilters.priority,
          escalation_type: escFilters.escalation_type,
          limit: 1000
        });
        
        const data = res.data || [];
        data.forEach(row => {
          const line = [
            row.id,
            `"${row.employee_name || ""}"`,
            row.employee_hrms || "",
            row.escalation_type || "",
            row.priority || "",
            row.status || "",
            `"${(row.escalation_reason || "").replace(/"/g, '""')}"`,
            row.due_date || "",
            row.days_overdue || 0,
            row.created_at || ""
          ];
          csvContent += line.join(",") + "\r\n";
        });
      } else {
        headers = ["ID", "Employee Name", "HRMS ID", "Recommendation Type", "Priority", "Status", "Title", "Description", "Assigned To Role", "Due Date", "Created At"];
        csvContent += headers.join(",") + "\r\n";

        const params = {
          status: recFilters.status,
          priority: recFilters.priority,
          recommendation_type: recFilters.recommendation_type,
          limit: 1000
        };
        
        const res = isPointsman ? await getMyRecommendations(params) : await getRecommendations(params);
        const data = res.data || [];
        data.forEach(row => {
          const line = [
            row.id,
            `"${row.employee_name || ""}"`,
            row.employee_hrms || "",
            row.recommendation_type || "",
            row.priority || "",
            row.status || "",
            `"${(row.title || "").replace(/"/g, '""')}"`,
            `"${(row.description || "").replace(/"/g, '""')}"`,
            row.assigned_to_role || "",
            row.due_date || "",
            row.created_at || ""
          ];
          csvContent += line.join(",") + "\r\n";
        });
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${type}_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Failed to export CSV: " + err.message);
    }
  };

  // ─── RENDER HELPERS ────────────────────────────────────────────────────────

  // Prepare chart data for Recharts
  const getEscStatusChartData = () => {
    if (!dashboardData?.escalation_by_status) return [];
    return dashboardData.escalation_by_status.map(item => ({
      name: item.status,
      count: parseInt(item.count, 10)
    }));
  };

  const getRecTypeChartData = () => {
    if (!dashboardData?.recommendation_by_type) return [];
    return dashboardData.recommendation_by_type.map(item => ({
      name: (item.recommendation_type || "").replace("_", " ").slice(0, 18),
      count: parseInt(item.count, 10)
    }));
  };

  return (
    <div className="workflow-dashboard-container animate-fade-in">
      
      {/* Overview Top header with Auto Refresh status */}
      <div className="workflow-header-row">
        <div>
          <h1 className="workflow-title">
            <Cpu size={24} style={{ marginRight: 10, color: "#2563eb" }} />
            {t("workflow.title") || "Compliance Workflow Automation"}
          </h1>
          <p className="workflow-subtitle">
            {t("workflow.subtitle") || "System-generated safety escalations, corrective actions, and scheduled audits."}
          </p>
        </div>
        
        <div className="refresh-status-badge">
          <RefreshCw size={13} className={`refresh-icon ${loadingOverview || loadingEsc || loadingRec ? "anim-spin" : ""}`} />
          <span>{t("workflow.lastUpdated") || "Last updated"}: {lastRefreshed.toLocaleTimeString()} (60s {t("workflow.autoRefresh") || "Auto Refresh"})</span>
        </div>
      </div>

      {/* Tabs list (Pointsman view has no tabs, starts on Recommendations list) */}
      {!isPointsman && (
        <div className="workflow-tabs">
          <button
            className={`workflow-tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <History size={16} /> {t("workflow.tabOverview") || "Overview"}
          </button>
          
          <button
            className={`workflow-tab ${activeTab === "escalations" ? "active" : ""}`}
            onClick={() => setActiveTab("escalations")}
          >
            <AlertTriangle size={16} /> {t("workflow.tabEscalations") || "Compliance Escalations"}
            {dashboardData?.escalation_by_status?.some(s => s.status === "Open" && parseInt(s.count) > 0) && (
              <span className="tab-badge badge-red">
                {dashboardData.escalation_by_status.find(s => s.status === "Open")?.count}
              </span>
            )}
          </button>

          <button
            className={`workflow-tab ${activeTab === "recommendations" ? "active" : ""}`}
            onClick={() => setActiveTab("recommendations")}
          >
            <CheckCircle2 size={16} /> {t("workflow.tabRecommendations") || "Corrective Recommendations"}
            {dashboardData?.recommendation_by_status?.some(s => s.status === "Pending" && parseInt(s.count) > 0) && (
              <span className="tab-badge badge-orange">
                {dashboardData.recommendation_by_status.find(s => s.status === "Pending")?.count}
              </span>
            )}
          </button>

          {canControlEngine && (
            <button
              className={`workflow-tab ${activeTab === "engine" ? "active" : ""}`}
              onClick={() => setActiveTab("engine")}
            >
              <Cpu size={16} /> {t("workflow.tabEngine") || "Engine Controls"}
              {engineState.isRunning && <span className="tab-pulse-dot" />}
            </button>
          )}
        </div>
      )}

      {/* ─── TAB 1: OVERVIEW PANEL ───────────────────────────────────────────── */}
      {activeTab === "overview" && !isPointsman && (
        <div className="tab-content-grid">
          
          {/* Dashboard aggregate cards */}
          <div className="kpi-grid">
            <div className="kpi-card border-red">
              <div className="kpi-icon text-red bg-red-light">
                <AlertTriangle size={20} />
              </div>
              <div className="kpi-info">
                <h3>{t("workflow.openEscalations") || "Open Escalations"}</h3>
                <h2>
                  {dashboardData?.escalation_by_status?.find(s => s.status === "Open")?.count || 0}
                </h2>
                <p>{t("workflow.awaitingActions") || "Awaiting supervisor actions"}</p>
              </div>
            </div>

            <div className="kpi-card border-orange">
              <div className="kpi-icon text-orange bg-orange-light">
                <AlertCircle size={20} />
              </div>
              <div className="kpi-info">
                <h3>{t("workflow.activeRecommendations") || "Active Recommendations"}</h3>
                <h2>
                  {parseInt(dashboardData?.recommendation_by_status?.find(s => s.status === "Pending")?.count || 0) +
                   parseInt(dashboardData?.recommendation_by_status?.find(s => s.status === "In Progress")?.count || 0)}
                </h2>
                <p>{t("workflow.pendingSteps") || "Pending safety steps"}</p>
              </div>
            </div>

            <div className="kpi-card border-blue">
              <div className="kpi-icon text-blue bg-blue-light">
                <Cpu size={20} />
              </div>
              <div className="kpi-info">
                <h3>{t("workflow.automationEngine") || "Automation Engine"}</h3>
                <h2 className="engine-status-text">
                  {engineState.isRunning ? "RUNNING" : "STANDBY"}
                </h2>
                <p>{t("workflow.lastRun") || "Last run"}: {engineState.lastRunAt ? new Date(engineState.lastRunAt).toLocaleTimeString() : (t("workflow.never") || "Never")}</p>
              </div>
            </div>
          </div>

          {/* Graphics breakdown */}
          <div className="overview-graphics-grid">
            <div className="graphic-card">
              <h3>{t("workflow.statusBreakdown") || "Escalation Status Breakdown"}</h3>
              <div className="chart-container-wrapper">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={getEscStatusChartData()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                    <ChartTooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                      {getEscStatusChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === "Open" ? "#ef4444" : entry.name === "Acknowledged" ? "#3b82f6" : "#22c55e"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="graphic-card">
              <h3>{t("workflow.recByType") || "Active Recommendations by Type"}</h3>
              <div className="chart-container-wrapper">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={getRecTypeChartData()} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={110} />
                    <ChartTooltip />
                    <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Alerts Feed */}
          <div className="activity-feed-card">
            <h3>{t("workflow.recentAlerts") || "Recent Compliance Alerts"}</h3>
            <div className="alert-list-feed">
              {dashboardData?.recent_escalations?.length === 0 && (
                <p className="no-activity-text">{t("workflow.noEscalations") || "No active escalations recorded."}</p>
              )}
              {dashboardData?.recent_escalations?.map(esc => (
                <div key={esc.id} className="feed-item">
                  <div className="feed-icon badge-red">🚨</div>
                  <div className="feed-details">
                    <strong>{esc.escalation_type.replace("_", " ")} — {esc.employee_name} ({esc.hrms_id})</strong>
                    <p>{t("workflow.status") || "Status"}: <span className="status-badge" style={{ color: "#ef4444" }}>{esc.status}</span> | {t("workflow.overdue") || "Overdue"}: <strong>{esc.days_overdue} {t("workflow.days") || "days"}</strong></p>
                    <span className="feed-time">{new Date(esc.created_at).toLocaleString()}</span>
                  </div>
                  <div className="feed-priority">
                    <span className="priority-pill" style={{
                      color: PRIORITY_STYLES[esc.priority]?.text,
                      background: PRIORITY_STYLES[esc.priority]?.bg,
                      borderColor: PRIORITY_STYLES[esc.priority]?.border
                    }}>
                      {esc.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ─── TAB 2: ESCALATIONS MANAGEMENT ───────────────────────────────────── */}
      {activeTab === "escalations" && !isPointsman && (
        <div className="workflow-card animate-fade-in">
          
          {/* Action Bar (Filters + CSV Export) */}
          <div className="table-action-bar">
            <div className="filters-group">
              <div className="search-input-wrap">
                <Search size={14} className="search-icon-inside" />
                <input
                  type="text"
                  placeholder={t("workflow.searchEmployeePlaceholder") || "Search Employee / HRMS ID..."}
                  className="table-search"
                  defaultValue={escFilters.search}
                  onChange={(e) => handleSearchChange("escalations", e.target.value)}
                />
              </div>

              <select
                className="filter-select"
                value={escFilters.status}
                onChange={(e) => { setEscFilters(prev => ({ ...prev, status: e.target.value })); setEscPage(1); }}
              >
                <option value="">{t("workflow.allStatuses") || "All Statuses"}</option>
                <option value="Open">{t("status.open") || "Open"}</option>
                <option value="Acknowledged">{t("status.acknowledged") || "Acknowledged"}</option>
                <option value="Resolved">{t("status.resolved") || "Resolved"}</option>
                <option value="Dismissed">{t("status.dismissed") || "Dismissed"}</option>
              </select>

              <select
                className="filter-select"
                value={escFilters.priority}
                onChange={(e) => { setEscFilters(prev => ({ ...prev, priority: e.target.value })); setEscPage(1); }}
              >
                <option value="">{t("workflow.allPriorities") || "All Priorities"}</option>
                <option value="Critical">{t("priority.critical") || "Critical"}</option>
                <option value="High">{t("priority.high") || "High"}</option>
                <option value="Medium">{t("priority.medium") || "Medium"}</option>
                <option value="Low">{t("priority.low") || "Low"}</option>
              </select>

              <select
                className="filter-select"
                value={escFilters.escalation_type}
                onChange={(e) => { setEscFilters(prev => ({ ...prev, escalation_type: e.target.value })); setEscPage(1); }}
              >
                <option value="">{t("workflow.allTypes") || "All Types"}</option>
                <option value="PME_OVERDUE">{t("workflow.pmeRenewal") || "PME Renewal"}</option>
                <option value="REF_OVERDUE">{t("workflow.refresherTraining") || "Refresher Training"}</option>
                <option value="CBT_FAILED">{t("workflow.cbtRetest") || "CBT Retest"}</option>
                <option value="CBT_NOT_ATTEMPTED">{t("workflow.cbtNotAttempted") || "CBT Not Attempted"}</option>
                <option value="ASSESSMENT_OVERDUE">{t("workflow.assessmentOverdue") || "Assessment Overdue"}</option>
                <option value="ASSESSMENT_REJECTED_UNACTIONED">{t("workflow.rejectedAssessment") || "Rejected Assessment Unactioned"}</option>
                <option value="HIGH_RISK_UNADDRESSED">{t("workflow.highRiskUnaddressed") || "High Risk Unaddressed"}</option>
                <option value="COUNSELLING_OVERDUE">{t("workflow.counsellingOverdue") || "Counselling Overdue"}</option>
              </select>
            </div>

            <button className="csv-export-btn" onClick={() => handleExportCSV("escalations")}>
              <Download size={14} /> {t("workflow.exportCsv") || "Export CSV"}
            </button>
          </div>

          {/* Escalations Table */}
          <div className="table-outer-wrapper">
            {loadingEsc ? (
              <div className="table-loader-wrap">
                <RefreshCw className="anim-spin spinner-blue" size={24} />
                <p>{t("workflow.loading") || "Loading data..."}</p>
              </div>
            ) : (
              <table className="workflow-table">
                <thead>
                  <tr>
                    <th>{t("workflow.employeeDetails") || "Employee Details"}</th>
                    <th>{t("workflow.type") || "Type"}</th>
                    <th>{t("workflow.reason") || "Reason"}</th>
                    <th>{t("workflow.dueDate") || "Due Date"}</th>
                    <th>{t("workflow.overdue") || "Overdue"}</th>
                    <th>{t("workflow.priority") || "Priority"}</th>
                    <th>{t("workflow.status") || "Status"}</th>
                    <th>{t("workflow.actions") || "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {escalations.length === 0 && (
                    <tr>
                      <td colSpan={8} className="empty-table-row">{t("workflow.noEscalationsFiltered") || "No escalations matching filter settings."}</td>
                    </tr>
                  )}
                  {escalations.map(esc => (
                    <tr key={esc.id}>
                      <td>
                        <div className="emp-info-wrap">
                          <strong>{esc.employee_name}</strong>
                          <span>{esc.employee_hrms} | {esc.designation}</span>
                        </div>
                      </td>
                      <td>
                        <span className="type-tag">{esc.escalation_type.replace("_", " ")}</span>
                      </td>
                      <td>
                        <p className="truncated-reason-text" title={esc.escalation_reason}>
                          {esc.escalation_reason}
                        </p>
                      </td>
                      <td>{esc.due_date ? new Date(esc.due_date).toLocaleDateString() : "N/A"}</td>
                      <td>
                        <span className={`overdue-days-span ${esc.days_overdue > 14 ? "text-bold-red" : ""}`}>
                          {esc.days_overdue} {t("workflow.days") || "days"}
                        </span>
                      </td>
                      <td>
                        <span className="priority-pill" style={{
                          color: PRIORITY_STYLES[esc.priority]?.text,
                          background: PRIORITY_STYLES[esc.priority]?.bg,
                          borderColor: PRIORITY_STYLES[esc.priority]?.border
                        }}>
                          {esc.priority}
                        </span>
                      </td>
                      <td>
                        <span className="status-pill-styled" style={{
                          color: STATUS_STYLES[esc.status]?.text,
                          background: STATUS_STYLES[esc.status]?.bg
                        }}>
                          {esc.status}
                        </span>
                      </td>
                      <td>
                        {canWriteEsc && (esc.status === "Open" || esc.status === "Acknowledged") ? (
                          <button className="action-row-btn btn-blue" onClick={() => setSelectedEsc(esc)}>
                            {t("workflow.actionBtn") || "Action"}
                          </button>
                        ) : (
                          <button className="action-row-btn btn-gray" onClick={() => {
                            alert(`Historical log info:\nResolved: ${esc.resolved_at ? new Date(esc.resolved_at).toLocaleDateString() : "No"}\nNotes: ${esc.resolution_notes || "None"}`);
                          }}>
                            {t("workflow.viewInfoBtn") || "View Info"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination bar */}
          <div className="table-pagination-row">
            <span>{t("workflow.showing") || "Showing"} {escalations.length} {t("workflow.of") || "of"} {escTotal} {t("workflow.records") || "records"}</span>
            <div className="pagination-buttons">
              <button
                disabled={escPage === 1}
                onClick={() => setEscPage(p => Math.max(1, p - 1))}
                className="pagination-btn"
              >
                <ChevronLeft size={16} /> {t("workflow.prev") || "Prev"}
              </button>
              <span className="pagination-current-page">{escPage}</span>
              <button
                disabled={escPage * escLimit >= escTotal}
                onClick={() => setEscPage(p => p + 1)}
                className="pagination-btn"
              >
                {t("workflow.next") || "Next"} <ChevronRight size={16} />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ─── TAB 3: CORRECTIVE RECOMMENDATIONS ───────────────────────────────── */}
      {activeTab === "recommendations" && (
        <div className="workflow-card animate-fade-in">
          
          {/* Action Bar (Filters + Create manual form trigger + CSV Export) */}
          <div className="table-action-bar">
            <div className="filters-group">
              <div className="search-input-wrap">
                <Search size={14} className="search-icon-inside" />
                <input
                  type="text"
                  placeholder={t("workflow.searchEmployeeAndTitlePlaceholder") || "Search Employee / Title..."}
                  className="table-search"
                  defaultValue={recFilters.search}
                  onChange={(e) => handleSearchChange("recommendations", e.target.value)}
                />
              </div>

              <select
                className="filter-select"
                value={recFilters.status}
                onChange={(e) => { setRecFilters(prev => ({ ...prev, status: e.target.value })); setRecPage(1); }}
              >
                <option value="">{t("workflow.allStatuses") || "All Statuses"}</option>
                <option value="Pending">{t("status.pending") || "Pending"}</option>
                <option value="In Progress">{t("status.inProgress") || "In Progress"}</option>
                <option value="Completed">{t("status.completed") || "Completed"}</option>
                <option value="Cancelled">{t("status.cancelled") || "Cancelled"}</option>
                <option value="Deferred">{t("status.deferred") || "Deferred"}</option>
              </select>

              <select
                className="filter-select"
                value={recFilters.priority}
                onChange={(e) => { setRecFilters(prev => ({ ...prev, priority: e.target.value })); setRecPage(1); }}
              >
                <option value="">{t("workflow.allPriorities") || "All Priorities"}</option>
                <option value="Critical">{t("priority.critical") || "Critical"}</option>
                <option value="High">{t("priority.high") || "High"}</option>
                <option value="Medium">{t("priority.medium") || "Medium"}</option>
                <option value="Low">{t("priority.low") || "Low"}</option>
              </select>

              <select
                className="filter-select"
                value={recFilters.recommendation_type}
                onChange={(e) => { setNewRecForm(prev => ({ ...prev, recommendation_type: e.target.value })); setRecPage(1); }}
              >
                <option value="">{t("workflow.allTypes") || "All Types"}</option>
                <option value="COUNSELLING_REQUIRED">{t("workflow.counsellingRequired") || "Counselling Required"}</option>
                <option value="PME_RENEWAL">{t("workflow.pmeRenewal") || "PME Renewal"}</option>
                <option value="REFRESHER_TRAINING">{t("workflow.refresherTraining") || "Refresher Training"}</option>
                <option value="CBT_RETEST">{t("workflow.cbtRetest") || "CBT Retest"}</option>
                <option value="RISK_REVIEW">{t("workflow.riskReview") || "Risk Review"}</option>
                <option value="WATCHLIST">{t("workflow.watchlist") || "Watchlist"}</option>
              </select>
            </div>

            <div className="action-buttons-group">
              {canCreateRec && !isPointsman && (
                <button className="create-recommendation-btn" onClick={() => setShowCreateRecModal(true)}>
                  <Plus size={14} /> {t("workflow.createRec") || "Create Recommendation"}
                </button>
              )}
              <button className="csv-export-btn" onClick={() => handleExportCSV("recommendations")}>
                <Download size={14} /> {t("workflow.exportCsv") || "Export CSV"}
              </button>
            </div>
          </div>

          {/* Recommendations Table */}
          <div className="table-outer-wrapper">
            {loadingRec ? (
              <div className="table-loader-wrap">
                <RefreshCw className="anim-spin spinner-blue" size={24} />
                <p>{t("workflow.loading") || "Loading data..."}</p>
              </div>
            ) : (
              <table className="workflow-table">
                <thead>
                  <tr>
                    <th>{t("workflow.employeeDetails") || "Employee Details"}</th>
                    <th>{t("workflow.titleCol") || "Title"}</th>
                    <th>{t("workflow.type") || "Recommendation Type"}</th>
                    <th>{t("workflow.source") || "Source"}</th>
                    <th>{t("workflow.dueDate") || "Due Date"}</th>
                    <th>{t("workflow.riskScore") || "Risk Score"}</th>
                    <th>{t("workflow.priority") || "Priority"}</th>
                    <th>{t("workflow.status") || "Status"}</th>
                    <th>{t("workflow.actions") || "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendations.length === 0 && (
                    <tr>
                      <td colSpan={9} className="empty-table-row">{t("workflow.noRecommendationsFiltered") || "No compliance recommendations matching filter settings."}</td>
                    </tr>
                  )}
                  {recommendations.map(rec => (
                    <tr key={rec.id}>
                      <td>
                        <div className="emp-info-wrap">
                          <strong>{rec.employee_name}</strong>
                          <span>{rec.employee_hrms} | {rec.designation}</span>
                        </div>
                      </td>
                      <td>
                        <div className="rec-title-wrap">
                          <strong>{rec.title}</strong>
                          <span>{rec.description}</span>
                        </div>
                      </td>
                      <td>
                        <span className="type-tag">{rec.recommendation_type.replace("_", " ")}</span>
                      </td>
                      <td>
                        <span className={`source-badge ${rec.source === "MANUAL" ? "bg-amber" : "bg-slate"}`}>
                          {rec.source}
                        </span>
                      </td>
                      <td>{rec.due_date ? new Date(rec.due_date).toLocaleDateString() : (t("workflow.immediate") || "Immediate")}</td>
                      <td><strong>{rec.risk_score_at_creation || "N/A"}</strong></td>
                      <td>
                        <span className="priority-pill" style={{
                          color: PRIORITY_STYLES[rec.priority]?.text,
                          background: PRIORITY_STYLES[rec.priority]?.bg,
                          borderColor: PRIORITY_STYLES[rec.priority]?.border
                        }}>
                          {rec.priority}
                        </span>
                      </td>
                      <td>
                        <span className="status-pill-styled" style={{
                          color: STATUS_STYLES[rec.status]?.text,
                          background: STATUS_STYLES[rec.status]?.bg
                        }}>
                          {rec.status}
                        </span>
                      </td>
                      <td>
                        {canWriteRec && (rec.status === "Pending" || rec.status === "In Progress") ? (
                          <button className="action-row-btn btn-blue" onClick={() => setSelectedRec(rec)}>
                            {t("workflow.actionBtn") || "Action"}
                          </button>
                        ) : (
                          <button className="action-row-btn btn-gray" onClick={() => {
                            alert(`Recommendation details:\nCompleted: ${rec.completed_at ? new Date(rec.completed_at).toLocaleDateString() : "No"}\nNotes: ${rec.completion_notes || "None"}\nAssigned To: ${rec.assigned_to_name || "Unassigned"}`);
                          }}>
                            {t("workflow.viewInfoBtn") || "View Info"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination bar */}
          <div className="table-pagination-row">
            <span>{t("workflow.showing") || "Showing"} {recommendations.length} {t("workflow.of") || "of"} {recTotal} {t("workflow.records") || "records"}</span>
            <div className="pagination-buttons">
              <button
                disabled={recPage === 1}
                onClick={() => setRecPage(p => Math.max(1, p - 1))}
                className="pagination-btn"
              >
                <ChevronLeft size={16} /> {t("workflow.prev") || "Prev"}
              </button>
              <span className="pagination-current-page">{recPage}</span>
              <button
                disabled={recPage * recLimit >= recTotal}
                onClick={() => setRecPage(p => p + 1)}
                className="pagination-btn"
              >
                {t("workflow.next") || "Next"} <ChevronRight size={16} />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ─── TAB 4: ENGINE CONFIGURATION PANEL ───────────────────────────────── */}
      {activeTab === "engine" && canControlEngine && (
        <div className="engine-control-panel-grid animate-fade-in">
          
          {/* Status card */}
          <div className="engine-card config-card-main">
            <h3>{t("workflow.engineScanner") || "Workflow Automation Scanner"}</h3>
            <p>{t("workflow.engineDesc") || "Manually trigger or configure background evaluation schedules. The engine scans safety records, CBT attempts, and medical profiles every 6 hours."}</p>

            <div className="engine-state-details">
              <div className="state-row">
                <span className="label">{t("workflow.currentStatus") || "Current Status"}:</span>
                <span className={`status-text ${engineState.isRunning ? "text-blue animating-pulse" : "text-green"}`}>
                  ● {engineState.isRunning ? (t("workflow.engineRunning") || "RUNNING SCAN...") : "STANDBY (IDLE)"}
                </span>
              </div>
              
              <div className="state-row">
                <span className="label">{t("workflow.lastExecuted") || "Last Executed"}:</span>
                <span>{engineState.lastRunAt ? new Date(engineState.lastRunAt).toLocaleString() : (t("workflow.never") || "Never")}</span>
              </div>

              <div className="state-row">
                <span className="label">{t("workflow.totalRuns") || "Total System Runs"}:</span>
                <strong>{engineState.totalRunCount} {t("workflow.runs") || "runs"}</strong>
              </div>
            </div>

            <button
              className="trigger-engine-btn"
              disabled={engineState.isRunning || triggering}
              onClick={handleTriggerEngine}
            >
              <Play size={14} style={{ marginRight: 6 }} />
              {engineState.isRunning ? (t("workflow.engineRunning") || "Engine Running...") : (t("workflow.triggerScan") || "Trigger Full System Scan")}
            </button>
          </div>

          {/* Logs / history */}
          <div className="engine-card history-card-main">
            <h3>{t("workflow.recentExecutions") || "Recent Engine Executions"}</h3>
            {loadingEngine ? (
              <div className="table-loader-wrap">
                <RefreshCw className="anim-spin spinner-blue" size={20} />
                <p>{t("workflow.loading") || "Loading data..."}</p>
              </div>
            ) : (
              <div className="log-table-wrap">
                <table className="engine-log-table">
                  <thead>
                    <tr>
                      <th>{t("workflow.timeStarted") || "Time Started"}</th>
                      <th>{t("workflow.status") || "Status"}</th>
                      <th>{t("workflow.tabEscalations") || "Escalations"}</th>
                      <th>{t("workflow.recommendations") || "Recommendations"}</th>
                      <th>{t("workflow.autoResolved") || "Auto Resolved"}</th>
                      <th>{t("workflow.autoCompleted") || "Auto Completed"}</th>
                      <th>{t("workflow.duration") || "Duration"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {engineState.runHistory?.length === 0 && (
                      <tr>
                        <td colSpan={7} className="empty-table-row">{t("workflow.noRuns") || "No runs recorded in history log."}</td>
                      </tr>
                    )}
                    {engineState.runHistory?.map((run, idx) => (
                      <tr key={idx}>
                        <td>{new Date(run.runAt).toLocaleString()}</td>
                        <td>
                          <span className={`status-pill ${run.status === "success" ? "bg-green-pill" : "bg-red-pill"}`}>
                            {run.status}
                          </span>
                        </td>
                        <td>+{run.escalationsCreated || 0}</td>
                        <td>+{run.recommendationsCreated || 0}</td>
                        <td>{run.autoResolved || 0} resolved</td>
                        <td>{run.autoCompleted || 0} completed</td>
                        <td>{run.durationMs}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ─── ACTION MODAL: UPDATE ESCALATION ──────────────────────────────────── */}
      {selectedEsc && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{t("workflow.resolveEscalation") || "Resolve Escalation Alert"}</h3>
              <button className="modal-close-btn" onClick={() => setSelectedEsc(null)}>
                <XCircle size={18} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-info-panel">
                <p><strong>{t("workflow.employeeDetails") || "Employee"}:</strong> {selectedEsc.employee_name} ({selectedEsc.employee_hrms})</p>
                <p><strong>{t("workflow.type") || "Type"}:</strong> {selectedEsc.escalation_type.replace("_", " ")}</p>
                <p><strong>{t("workflow.reason") || "Reason"}:</strong> {selectedEsc.escalation_reason}</p>
                <p><strong>{t("workflow.overdue") || "Days Overdue"}:</strong> {selectedEsc.days_overdue} {t("workflow.days") || "days"}</p>
              </div>

              <div className="form-group">
                <label>{t("workflow.actionNotesLabel") || "Resolution/Action Notes (mandatory)"}</label>
                <textarea
                  rows={4}
                  className="modal-textarea"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={t("workflow.actionNotesPlaceholder") || "Enter actions taken to resolve this compliance issue..."}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn-ghost"
                onClick={() => handleUpdateEscalationStatus("Dismissed")}
                disabled={updatingAction || !actionNotes.trim()}
              >
                {t("workflow.dismissEscalation") || "Dismiss Escalation"}
              </button>
              
              <button
                className="modal-btn-blue"
                onClick={() => handleUpdateEscalationStatus("Resolved")}
                disabled={updatingAction || !actionNotes.trim()}
              >
                {t("workflow.markResolved") || "Mark as Resolved"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ACTION MODAL: UPDATE RECOMMENDATION ──────────────────────────────── */}
      {selectedRec && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{t("workflow.correctiveActions") || "Corrective Recommendation Actions"}</h3>
              <button className="modal-close-btn" onClick={() => setSelectedRec(null)}>
                <XCircle size={18} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-info-panel">
                <p><strong>{t("workflow.employeeDetails") || "Employee"}:</strong> {selectedRec.employee_name} ({selectedRec.employee_hrms})</p>
                <p><strong>{t("workflow.titleCol") || "Title"}:</strong> {selectedRec.title}</p>
                <p><strong>{t("workflow.type") || "Type"}:</strong> {selectedRec.recommendation_type.replace("_", " ")}</p>
                <p><strong>{t("workflow.descLabel") || "Description"}:</strong> {selectedRec.description}</p>
              </div>

              <div className="form-group">
                <label>{t("workflow.completionNotesLabel") || "Action & Completion Notes (mandatory)"}</label>
                <textarea
                  rows={4}
                  className="modal-textarea"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={t("workflow.completionNotesPlaceholder") || "Enter compliance action notes..."}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn-ghost"
                onClick={() => handleUpdateRecommendationStatus("In Progress")}
                disabled={updatingAction || !actionNotes.trim()}
              >
                {t("workflow.markInProgress") || "Mark In Progress"}
              </button>
              
              <button
                className="modal-btn-blue"
                onClick={() => handleUpdateRecommendationStatus("Completed")}
                disabled={updatingAction || !actionNotes.trim()}
              >
                {t("workflow.markCompleted") || "Mark as Completed"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ACTION MODAL: CREATE MANUAL RECOMMENDATION ───────────────────────── */}
      {showCreateRecModal && (
        <div className="modal-backdrop">
          <div className="modal-card select-modal-wide">
            <div className="modal-header">
              <h3>{t("workflow.createComplianceRec") || "Create Compliance Recommendation"}</h3>
              <button className="modal-close-btn" onClick={() => setShowCreateRecModal(false)}>
                <XCircle size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateRecommendation}>
              <div className="modal-body scrollable-modal-body">
                
                {recFormError && <div className="error-alert">{recFormError}</div>}

                {/* Search Employee input */}
                <div className="form-group">
                  <label>{t("workflow.searchEmployeeLabel") || "Search Employee (Name / HRMS ID)"}</label>
                  <div className="search-input-wrap">
                    <Search size={14} className="search-icon-inside" />
                    <input
                      type="text"
                      className="table-search"
                      placeholder={t("workflow.searchEmployeeInputPlaceholder") || "Type name/HRMS ID to search..."}
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                    />
                  </div>
                  {searchingEmp && <span className="input-info-text text-blue animating-pulse">Searching profiles...</span>}
                  
                  {foundEmployees.length > 0 && (
                    <div className="searched-employees-box">
                      {foundEmployees.slice(0, 5).map(emp => (
                        <div
                          key={emp.id}
                          className={`searched-emp-row ${newRecForm.employee_id === emp.id ? "selected" : ""}`}
                          onClick={() => {
                            setNewRecForm(prev => ({
                              ...prev,
                              employee_id: emp.id,
                              risk_score_at_creation: emp.risk_score || null
                            }));
                            setEmployeeSearch(`${emp.full_name} (${emp.hrms_id})`);
                            setFoundEmployees([]);
                          }}
                        >
                          <strong>{emp.full_name}</strong>
                          <span>{emp.hrms_id} | {emp.designation} | Risk: {emp.risk_level || "Normal"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>{t("workflow.type") || "Recommendation Type"}</label>
                    <select
                      className="modal-select"
                      value={newRecForm.recommendation_type}
                      onChange={(e) => setNewRecForm(prev => ({ ...prev, recommendation_type: e.target.value }))}
                    >
                      <option value="COUNSELLING_REQUIRED">{t("workflow.counsellingRequired") || "Counselling Required"}</option>
                      <option value="PME_RENEWAL">{t("workflow.pmeRenewal") || "PME Renewal Scheduling"}</option>
                      <option value="REFRESHER_TRAINING">{t("workflow.refresherTraining") || "Refresher Training Scheduling"}</option>
                      <option value="CBT_RETEST">{t("workflow.cbtRetest") || "CBT Exam Retest"}</option>
                      <option value="RISK_REVIEW">{t("workflow.riskReview") || "Supervisor Risk Review"}</option>
                      <option value="WATCHLIST">{t("workflow.watchlist") || "Watchlist Action Plan"}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{t("workflow.priorityLabel") || "Priority"}</label>
                    <select
                      className="modal-select"
                      value={newRecForm.priority}
                      onChange={(e) => setNewRecForm(prev => ({ ...prev, priority: e.target.value }))}
                    >
                      <option value="Low">{t("priority.low") || "Low"}</option>
                      <option value="Medium">{t("priority.medium") || "Medium"}</option>
                      <option value="High">{t("priority.high") || "High"}</option>
                      <option value="Critical">{t("priority.critical") || "Critical"}</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>{t("workflow.titleLabel") || "Recommendation Title"}</label>
                  <input
                    type="text"
                    required
                    className="modal-input"
                    value={newRecForm.title}
                    onChange={(e) => setNewRecForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Conduct shunting safety training review..."
                  />
                </div>

                <div className="form-group">
                  <label>{t("workflow.descLabel") || "Details / Description"}</label>
                  <textarea
                    rows={3}
                    className="modal-textarea"
                    value={newRecForm.description}
                    onChange={(e) => setNewRecForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t("workflow.descPlaceholder") || "Enter compliance actions required..."}
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>{t("workflow.assignedRoleLabel") || "Assigned To Officer ID (Optional UUID)"}</label>
                    <input
                      type="text"
                      className="modal-input"
                      value={newRecForm.assigned_to}
                      onChange={(e) => setNewRecForm(prev => ({ ...prev, assigned_to: e.target.value }))}
                      placeholder="Supervisor UUID..."
                    />
                  </div>

                  <div className="form-group">
                    <label>{t("workflow.dueDateLabel") || "Due Date"}</label>
                    <input
                      type="date"
                      className="modal-input"
                      value={newRecForm.due_date}
                      onChange={(e) => setNewRecForm(prev => ({ ...prev, due_date: e.target.value }))}
                    />
                  </div>
                </div>

              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="modal-btn-ghost"
                  onClick={() => setShowCreateRecModal(false)}
                >
                  {t("workflow.cancel") || "Cancel"}
                </button>
                
                <button
                  type="submit"
                  className="modal-btn-blue"
                  disabled={submittingRec || !newRecForm.employee_id}
                >
                  {t("workflow.createRec") || "Create Recommendation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Embedded CSS variables and layouts styled precisely in HSL glassmorphism design */}
      <style>{`
        .workflow-dashboard-container {
          padding: 24px;
          color: #1f2937;
          font-family: 'Outfit', 'Inter', sans-serif;
          min-height: calc(100vh - 100px);
        }

        .workflow-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .workflow-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e3a8a;
          margin: 0;
          display: flex;
          align-items: center;
        }

        .workflow-subtitle {
          font-size: 13px;
          color: #64748b;
          margin: 4px 0 0;
        }

        .refresh-status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #64748b;
          background: #f1f5f9;
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
        }

        .anim-spin {
          animation: spin 1.2s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .workflow-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          border-bottom: 1.5px solid #e2e8f0;
          padding-bottom: 8px;
        }

        .workflow-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          background: none;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          border-radius: 8px;
          position: relative;
          transition: all 0.25s ease;
        }

        .workflow-tab:hover {
          color: #2563eb;
          background: rgba(37, 99, 235, 0.05);
        }

        .workflow-tab.active {
          color: #2563eb;
          background: rgba(37, 99, 235, 0.08);
        }

        .tab-badge {
          font-size: 10px;
          padding: 1.5px 6px;
          border-radius: 10px;
          font-weight: 700;
          margin-left: 6px;
        }

        .badge-red {
          background: #fee2e2;
          color: #dc2626;
        }

        .badge-orange {
          background: #ffedd5;
          color: #ea580c;
        }

        .tab-pulse-dot {
          width: 6px;
          height: 6px;
          background: #3b82f6;
          border-radius: 50%;
          position: absolute;
          top: 6px;
          right: 6px;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4);
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.5; }
          100% { transform: scale(0.9); opacity: 1; }
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .kpi-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
          border-left: 5px solid #e2e8f0;
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .border-red { border-left-color: #ef4444; }
        .border-orange { border-left-color: #f97316; }
        .border-blue { border-left-color: #3b82f6; }

        .kpi-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .text-red { color: #dc2626; }
        .bg-red-light { background: #fee2e2; }
        .text-orange { color: #ea580c; }
        .bg-orange-light { background: #ffedd5; }
        .text-blue { color: #2563eb; }
        .bg-blue-light { background: #dbeafe; }

        .kpi-info h3 {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          margin: 0 0 4px;
        }

        .kpi-info h2 {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 2px;
          color: #0f172a;
        }

        .engine-status-text {
          font-family: monospace;
          letter-spacing: 0.05em;
        }

        .kpi-info p {
          font-size: 11px;
          color: #94a3b8;
          margin: 0;
        }

        .overview-graphics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }

        @media(max-width: 1024px) {
          .overview-graphics-grid {
            grid-template-columns: 1fr;
          }
        }

        .graphic-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
          border: 1px solid #e2e8f0;
        }

        .graphic-card h3 {
          font-size: 14px;
          font-weight: 700;
          margin: 0 0 16px;
          color: #1e3a8a;
        }

        .chart-container-wrapper {
          width: 100%;
        }

        .activity-feed-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
          border: 1px solid #e2e8f0;
        }

        .activity-feed-card h3 {
          font-size: 14px;
          font-weight: 700;
          margin: 0 0 16px;
          color: #1e3a8a;
        }

        .alert-list-feed {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .feed-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px;
          border-radius: 8px;
          background: #f8fafc;
          border: 1px solid #f1f5f9;
        }

        .feed-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          background: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .feed-details {
          flex: 1;
        }

        .feed-details strong {
          display: block;
          font-size: 13px;
          color: #1e293b;
        }

        .feed-details p {
          font-size: 11px;
          color: #64748b;
          margin: 2px 0 0;
        }

        .status-badge {
          font-weight: 700;
        }

        .feed-time {
          font-size: 10px;
          color: #94a3b8;
          display: block;
          margin-top: 4px;
        }

        .priority-pill {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          border: 1px solid transparent;
        }

        .workflow-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }

        .table-action-bar {
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          background: #f8fafc;
        }

        .filters-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .search-input-wrap {
          position: relative;
        }

        .search-icon-inside {
          position: absolute;
          left: 10px;
          top: 10.5px;
          color: #94a3b8;
        }

        .table-search {
          padding: 8px 12px 8px 30px;
          font-size: 12.5px;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          min-width: 200px;
          outline: none;
          color: #334155;
        }

        .table-search:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
        }

        .filter-select {
          padding: 8px 12px;
          font-size: 12.5px;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          background: white;
          outline: none;
          color: #334155;
          min-width: 120px;
        }

        .filter-select:focus {
          border-color: #2563eb;
        }

        .action-buttons-group {
          display: flex;
          gap: 8px;
        }

        .create-recommendation-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #2563eb;
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
        }

        .create-recommendation-btn:hover {
          background: #1d4ed8;
        }

        .csv-export-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: white;
          color: #334155;
          padding: 8px 14px;
          border-radius: 8px;
          border: 1.5px solid #cbd5e1;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .csv-export-btn:hover {
          background: #f1f5f9;
          border-color: #94a3b8;
        }

        .table-outer-wrapper {
          overflow-x: auto;
          min-height: 250px;
        }

        .table-loader-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 250px;
          color: #64748b;
          gap: 12px;
        }

        .spinner-blue {
          color: #2563eb;
        }

        .workflow-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .workflow-table th {
          background: white;
          padding: 14px 20px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          border-bottom: 1.5px solid #e2e8f0;
          font-weight: 700;
        }

        .workflow-table td {
          padding: 16px 20px;
          font-size: 13px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
          vertical-align: middle;
        }

        .workflow-table tr:hover {
          background: #fafafa;
        }

        .empty-table-row {
          text-align: center;
          color: #94a3b8;
          padding: 40px !important;
          font-size: 14px;
        }

        .emp-info-wrap {
          display: flex;
          flex-direction: column;
        }

        .emp-info-wrap strong {
          color: #1e293b;
          font-size: 13px;
        }

        .emp-info-wrap span {
          font-size: 11px;
          color: #64748b;
          margin-top: 2px;
        }

        .rec-title-wrap {
          display: flex;
          flex-direction: column;
          max-width: 250px;
        }

        .rec-title-wrap strong {
          color: #1e293b;
          font-size: 13.5px;
        }

        .rec-title-wrap span {
          font-size: 11px;
          color: #64748b;
          margin-top: 3px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .type-tag {
          font-family: monospace;
          background: #f1f5f9;
          color: #475569;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .source-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .bg-amber { background: #fef3c7; color: #d97706; }
        .bg-slate { background: #e2e8f0; color: #475569; }

        .status-pill-styled {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
        }

        .overdue-days-span {
          font-weight: 600;
        }

        .text-bold-red {
          color: #dc2626;
          font-weight: 700;
        }

        .action-row-btn {
          padding: 6px 12px;
          border-radius: 6px;
          border: none;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-blue {
          background: #2563eb;
          color: white;
        }

        .btn-blue:hover {
          background: #1d4ed8;
        }

        .btn-gray {
          background: #e2e8f0;
          color: #475569;
        }

        .btn-gray:hover {
          background: #cbd5e1;
        }

        .table-pagination-row {
          padding: 14px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #e2e8f0;
          font-size: 12.5px;
          color: #64748b;
          background: #f8fafc;
        }

        .pagination-buttons {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pagination-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1.5px solid #cbd5e1;
          background: white;
          font-size: 12px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-current-page {
          font-weight: 700;
          color: #0f172a;
        }

        .engine-control-panel-grid {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 20px;
        }

        @media(max-width: 1024px) {
          .engine-control-panel-grid {
            grid-template-columns: 1fr;
          }
        }

        .engine-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
          border: 1px solid #e2e8f0;
        }

        .engine-card h3 {
          font-size: 15px;
          font-weight: 700;
          color: #1e3a8a;
          margin: 0 0 8px;
        }

        .engine-card p {
          font-size: 12.5px;
          color: #64748b;
          line-height: 1.6;
          margin: 0 0 20px;
        }

        .engine-state-details {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .state-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 13px;
        }

        .state-row:last-child {
          border-bottom: none;
        }

        .state-row .label {
          color: #64748b;
        }

        .status-text {
          font-weight: 700;
        }

        .text-green { color: #16a34a; }
        .text-blue { color: #2563eb; }

        .animating-pulse {
          animation: textPulse 1.5s infinite;
        }

        @keyframes textPulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }

        .trigger-engine-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .trigger-engine-btn:disabled {
          background: #93c5fd;
          cursor: not-allowed;
        }

        .trigger-engine-btn:not(:disabled):hover {
          background: #1d4ed8;
        }

        .log-table-wrap {
          overflow-x: auto;
          max-height: 300px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }

        .engine-log-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          text-align: left;
        }

        .engine-log-table th {
          background: #f8fafc;
          padding: 10px 14px;
          color: #64748b;
          border-bottom: 1.5px solid #e2e8f0;
          font-weight: 700;
        }

        .engine-log-table td {
          padding: 12px 14px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
        }

        .status-pill {
          font-size: 9.5px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .bg-green-pill { background: #dcfce7; color: #16a34a; }
        .bg-red-pill { background: #fee2e2; color: #dc2626; }

        /* MODALS */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          padding: 16px;
        }

        .modal-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
          width: 100%;
          max-width: 480px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }

        .select-modal-wide {
          max-width: 560px;
        }

        .modal-header {
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: #1e3a8a;
        }

        .modal-close-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
        }

        .modal-close-btn:hover {
          color: #64748b;
        }

        .modal-body {
          padding: 20px;
        }

        .scrollable-modal-body {
          max-height: 60vh;
          overflow-y: auto;
        }

        .modal-info-panel {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 14px;
          margin-bottom: 16px;
          font-size: 12.5px;
        }

        .modal-info-panel p {
          margin: 0 0 6px;
          color: #334155;
        }

        .modal-info-panel p:last-child {
          margin-bottom: 0;
        }

        .form-group {
          margin-bottom: 14px;
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 6px;
        }

        .modal-textarea {
          width: 100%;
          padding: 8px 12px;
          font-size: 13px;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          outline: none;
          font-family: inherit;
          resize: vertical;
        }

        .modal-textarea:focus {
          border-color: #2563eb;
        }

        .modal-input {
          padding: 8px 12px;
          font-size: 13px;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          outline: none;
        }

        .modal-input:focus {
          border-color: #2563eb;
        }

        .modal-select {
          padding: 8px 12px;
          font-size: 13px;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          background: white;
          outline: none;
        }

        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .modal-footer {
          padding: 14px 20px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .modal-btn-ghost {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1.5px solid #cbd5e1;
          background: white;
          color: #334155;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
        }

        .modal-btn-ghost:hover {
          background: #f1f5f9;
        }

        .modal-btn-blue {
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          background: #2563eb;
          color: white;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
        }

        .modal-btn-blue:hover {
          background: #1d4ed8;
        }

        .modal-btn-blue:disabled {
          background: #93c5fd;
          cursor: not-allowed;
        }

        .error-alert {
          background: #fee2e2;
          color: #dc2626;
          border: 1px solid #fecaca;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 14px;
        }

        .searched-employees-box {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          max-height: 150px;
          overflow-y: auto;
          background: white;
          margin-top: 4px;
        }

        .searched-emp-row {
          padding: 8px 12px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          border-bottom: 1px solid #f1f5f9;
        }

        .searched-emp-row:hover {
          background: #f8fafc;
        }

        .searched-emp-row.selected {
          background: #dbeafe;
        }

        .searched-emp-row strong {
          font-size: 12px;
          color: #1e293b;
        }

        .searched-emp-row span {
          font-size: 10px;
          color: #64748b;
          margin-top: 2px;
        }

        .input-info-text {
          font-size: 10.5px;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}
