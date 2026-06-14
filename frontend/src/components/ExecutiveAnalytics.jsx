import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  AlertOctagon,
  Activity,
  ShieldAlert,
  Download,
  Terminal,
  Grid,
  Calendar,
  Users,
  Search,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import {
  getExecutiveSummary,
  getComplianceBreakdown,
  getStationHeatmap,
  getTrendsForecast,
  getTopRiskEmployees,
  getLiveConsole
} from "../services/analyticsService";

const COLORS = ["#16a34a", "#eab308", "#ef4444"]; // Low, Medium, High
const PIE_COLORS = ["#2563eb", "#8b5cf6", "#f43f5e", "#10b981"];

export default function ExecutiveAnalytics({ user, role }) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState("console"); // console | heatmap | staff | compliance | forecast

  // Filtering states
  const [filters, setFilters] = useState({
    station_id: "All",
    role_id: "All",
    risk_level: "All"
  });

  // Data states
  const [summary, setSummary] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [trends, setTrends] = useState([]);
  const [topStaff, setTopStaff] = useState([]);
  const [logs, setLogs] = useState([]);

  // Pagination for Top Risk Employees
  const [staffPage, setStaffPage] = useState(1);
  const [staffLimit] = useState(10);
  const [staffTotal, setStaffTotal] = useState(0);

  // Loading & Error states
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingBreakdown, setLoadingBreakdown] = useState(true);
  const [loadingHeatmap, setLoadingHeatmap] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  
  const [errorMsg, setErrorMsg] = useState("");

  // Auto-refresh states
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // 1. Fetch Executive Summary & Dashboard Metrics
  const fetchSummary = useCallback(async () => {
    try {
      setLoadingSummary(true);
      const data = await getExecutiveSummary(filters);
      setSummary(data);
    } catch (err) {
      console.error("Failed to load summary:", err);
      setErrorMsg("Failed to load division safety summary metrics.");
    } finally {
      setLoadingSummary(false);
    }
  }, [filters]);

  // 2. Fetch Compliance Breakdown
  const fetchBreakdown = useCallback(async () => {
    try {
      setLoadingBreakdown(true);
      const data = await getComplianceBreakdown(filters);
      setBreakdown(data);
    } catch (err) {
      console.error("Failed to load breakdown:", err);
    } finally {
      setLoadingBreakdown(false);
    }
  }, [filters]);

  // 3. Fetch Heatmap (No filters required, aggregates division stations)
  const fetchHeatmap = useCallback(async () => {
    try {
      setLoadingHeatmap(true);
      const data = await getStationHeatmap();
      setHeatmap(data);
    } catch (err) {
      console.error("Failed to load heatmap:", err);
    } finally {
      setLoadingHeatmap(false);
    }
  }, []);

  // 4. Fetch Forecasting & Trends
  const fetchForecast = useCallback(async () => {
    try {
      setLoadingForecast(true);
      const data = await getTrendsForecast(filters);
      setForecast(data.forecast);
      setTrends(data.historicalTrends);
    } catch (err) {
      console.error("Failed to load forecasts:", err);
    } finally {
      setLoadingForecast(false);
    }
  }, [filters]);

  // 5. Fetch Top Risk Employees (Support pagination and sorting)
  const fetchTopStaff = useCallback(async () => {
    try {
      setLoadingStaff(true);
      const res = await getTopRiskEmployees({
        ...filters,
        page: staffPage,
        limit: staffLimit
      });
      setTopStaff(res.data);
      setStaffTotal(res.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to load top staff:", err);
    } finally {
      setLoadingStaff(false);
    }
  }, [filters, staffPage, staffLimit]);

  // 6. Fetch Live Command Console logs
  const fetchLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      const data = await getLiveConsole();
      setLogs(data);
    } catch (err) {
      console.error("Failed to load console logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  // Master refresh trigger
  const handleRefresh = useCallback((silent = false) => {
    setLastRefreshed(new Date());
    setErrorMsg("");
    fetchSummary();
    fetchBreakdown();
    fetchForecast();
    fetchTopStaff();
    if (!silent) {
      fetchHeatmap();
      fetchLogs();
    }
  }, [fetchSummary, fetchBreakdown, fetchForecast, fetchTopStaff, fetchHeatmap, fetchLogs]);

  // 60-Second Auto Refresh Poller
  useEffect(() => {
    handleRefresh(false);
    
    const interval = setInterval(() => {
      handleRefresh(true);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Reset pagination when filter criteria changes
  useEffect(() => {
    setStaffPage(1);
  }, [filters]);

  // Trigger page-specific fetches when paginating
  useEffect(() => {
    fetchTopStaff();
  }, [staffPage, fetchTopStaff]);

  // Handler for filter updates
  const handleFilterChange = (key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  // ─── CSV EXPORT CONTROLLER ──────────────────────────────────────────────────
  const handleExportCSV = (type) => {
    try {
      let headers = [];
      let rows = [];
      let filename = `export_${type}_${new Date().toISOString().slice(0, 10)}.csv`;

      if (type === "summary" && summary) {
        headers = ["Indicator", "Value"];
        rows = [
          ["Total Evaluated Staff", summary.totalStaff],
          ["Overall Division Safety Index (%)", summary.overallSafetyIndex],
          ["Average Risk Score", summary.averageRiskScore],
          ["Low Risk Count", summary.riskDistribution.Low],
          ["Medium Risk Count", summary.riskDistribution.Medium],
          ["High Risk Count", summary.riskDistribution.High],
          ["Active Escalations", summary.escalationStats.activeCount],
          ["Critical Escalations", summary.escalationStats.criticalCount],
          ["Active Recommendations", summary.activeRecommendations],
          ["Immediate Attention Required", summary.immediateAttentionRequired]
        ];
      } else if (type === "heatmap") {
        headers = ["Station Name", "Station Code", "Active Staff", "Average Risk Score", "Safety Index (%)", "High Risk Count", "Unresolved Escalations", "Alert Level"];
        rows = heatmap.map(s => [
          s.stationName,
          s.stationCode,
          s.activeStaffCount,
          s.averageRiskScore,
          s.safetyIndex,
          s.highRiskCount,
          s.unresolvedEscalations,
          s.alertLevel
        ]);
      } else if (type === "forecast" && forecast) {
        headers = ["HRMS ID", "Employee Name", "Designation", "Station", "Category", "Days Remaining", "Next Due Date"];
        const allForecast = [
          ...forecast.critical.map(x => ({ ...x, cat: "Critical (0-30 Days)" })),
          ...forecast.warning.map(x => ({ ...x, cat: "Warning (31-60 Days)" })),
          ...forecast.upcoming.map(x => ({ ...x, cat: "Upcoming (61-90 Days)" }))
        ];
        rows = allForecast.map(f => [
          f.hrmsId,
          f.name,
          f.role,
          f.station,
          f.cat,
          Math.min(f.pmeDaysRemaining || 9999, f.refDaysRemaining || 9999),
          f.pmeDaysRemaining < f.refDaysRemaining ? f.pmeDueDate : f.refDueDate
        ]);
      } else if (type === "top_risk") {
        headers = ["HRMS ID", "Employee Name", "Role", "Station", "PME Due Date", "REF Due Date", "CBT Score", "Practical Score", "Open Counselling", "Risk Score", "Risk Level"];
        rows = topStaff.map(x => [
          x.hrmsId,
          x.name,
          x.role,
          x.station,
          x.pmeDueDate || "N/A",
          x.refDueDate || "N/A",
          x.cbtScore,
          x.practicalScore,
          x.openCounsellingCount,
          x.riskScore,
          x.riskLevel
        ]);
      }

      if (headers.length === 0) return;

      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += headers.join(",") + "\r\n";
      rows.forEach(row => {
        csvContent += row.map(v => typeof v === "string" ? `"${v.replace(/"/g, '""')}"` : v).join(",") + "\r\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Failed to export CSV: " + err.message);
    }
  };

  // Derived KPI alert badges
  const totalHighRisk = summary?.riskDistribution?.High || 0;
  const criticalEsc = summary?.escalationStats?.criticalCount || 0;
  const attentionRequired = summary?.immediateAttentionRequired || 0;

  return (
    <div className="workflow-dashboard-container animate-fade-in" style={{ padding: "24px", minHeight: "100vh", backgroundColor: "#0b1329", color: "#f8fafc", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
      {/* ─── HEADER ─── */}
      <div className="workflow-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 className="workflow-title" style={{ fontSize: "28px", fontWeight: "800", color: "#f8fafc", margin: 0 }}>
            Executive Command Center
          </h1>
          <p className="workflow-subtitle" style={{ fontSize: "14px", color: "#94a3b8", marginTop: "4px" }}>
            Nagpur Division Safety & Operational Compliance Intelligence Dashboard
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="refresh-status-badge" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b", background: "rgba(30, 41, 59, 0.5)", padding: "6px 12px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <RefreshCw size={13} className={loadingSummary || loadingHeatmap || loadingStaff ? "anim-spin" : ""} />
            <span>Updated: {lastRefreshed.toLocaleTimeString()} (60s Refresh)</span>
          </div>
          <button className="csv-export-btn" onClick={() => handleRefresh()} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", background: "#2563eb", color: "#fff", padding: "8px 16px", border: "none", borderRadius: "6px", fontWeight: "600", fontSize: "13px" }}>
            <RefreshCw size={14} /> Sync Server
          </button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: "12px 16px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", color: "#f87171", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
          <AlertOctagon size={16} /> {errorMsg}
        </div>
      )}

      {/* ─── FILTERS PANEL ─── */}
      <div className="workflow-card" style={{ padding: "16px 20px", background: "rgba(15, 23, 42, 0.4)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "700", color: "#94a3b8" }}>
          <SlidersHorizontal size={14} /> Filter Console:
        </div>

        {/* Station filter */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "10px", color: "#cbd5e1", textTransform: "uppercase", fontWeight: "700" }}>Station</label>
          <select
            value={filters.station_id}
            onChange={(e) => handleFilterChange("station_id", e.target.value)}
            style={{ padding: "6px 12px", borderRadius: "6px", background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: "13px", outline: "none", minWidth: "150px" }}
          >
            <option value="All">All Stations</option>
            {heatmap.map(st => (
              <option key={st.stationId} value={st.stationId}>{st.stationName} ({st.stationCode})</option>
            ))}
          </select>
        </div>

        {/* Role filter */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "10px", color: "#cbd5e1", textTransform: "uppercase", fontWeight: "700" }}>Roster Designation</label>
          <select
            value={filters.role_id}
            onChange={(e) => handleFilterChange("role_id", e.target.value)}
            style={{ padding: "6px 12px", borderRadius: "6px", background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: "13px", outline: "none", minWidth: "150px" }}
          >
            <option value="All">All Designations</option>
            <option value="1">Pointsman</option>
            <option value="2">Station Master</option>
            <option value="3">Train Manager</option>
            <option value="4">Station Superintendent</option>
            <option value="5">Station Supervisor</option>
          </select>
        </div>

        {/* Risk level filter */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "10px", color: "#cbd5e1", textTransform: "uppercase", fontWeight: "700" }}>Calculated Risk</label>
          <select
            value={filters.risk_level}
            onChange={(e) => handleFilterChange("risk_level", e.target.value)}
            style={{ padding: "6px 12px", borderRadius: "6px", background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: "13px", outline: "none", minWidth: "120px" }}
          >
            <option value="All">All Risk Levels</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
          </select>
        </div>
      </div>

      {/* ─── METRICS SUMMARIES CARDS ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        
        {/* KPI: Safety index */}
        <div className="workflow-card card-glass" style={{ padding: "20px", display: "flex", gap: "16px", alignItems: "center", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(15, 23, 42, 0.4)", borderRadius: "12px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", color: "#10b981" }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Safety Compliance Index</p>
            <h3 style={{ margin: "4px 0 0", fontSize: "24px", color: "#fff", fontWeight: "800" }}>
              {loadingSummary ? "..." : `${summary?.overallSafetyIndex || 0}%`}
            </h3>
          </div>
        </div>

        {/* KPI: Risk score */}
        <div className="workflow-card card-glass" style={{ padding: "20px", display: "flex", gap: "16px", alignItems: "center", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(15, 23, 42, 0.4)", borderRadius: "12px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "rgba(139, 92, 246, 0.1)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", color: "#8b5cf6" }}>
            <Activity size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Average Risk Score</p>
            <h3 style={{ margin: "4px 0 0", fontSize: "24px", color: "#fff", fontWeight: "800" }}>
              {loadingSummary ? "..." : summary?.averageRiskScore || 0}
            </h3>
          </div>
        </div>

        {/* KPI: Attention Required */}
        <div className="workflow-card card-glass" style={{ padding: "20px", display: "flex", gap: "16px", alignItems: "center", border: "1px solid rgba(239, 68, 68, 0.2)", background: "rgba(239, 68, 68, 0.05)", borderRadius: "12px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.15)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", color: "#ef4444" }}>
            <AlertOctagon size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "11px", color: "#f87171", fontWeight: "700", textTransform: "uppercase" }}>Immediate Attention</p>
            <h3 style={{ margin: "4px 0 0", fontSize: "24px", color: "#fecdd3", fontWeight: "800" }}>
              {loadingSummary ? "..." : attentionRequired}
            </h3>
          </div>
        </div>

        {/* KPI: Staff count */}
        <div className="workflow-card card-glass" style={{ padding: "20px", display: "flex", gap: "16px", alignItems: "center", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(15, 23, 42, 0.4)", borderRadius: "12px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "rgba(37, 99, 235, 0.1)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", color: "#2563eb" }}>
            <Users size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Active Evaluated Staff</p>
            <h3 style={{ margin: "4px 0 0", fontSize: "24px", color: "#fff", fontWeight: "800" }}>
              {loadingSummary ? "..." : summary?.totalStaff || 0}
            </h3>
          </div>
        </div>

      </div>

      {/* ─── TABS HEADER ─── */}
      <div className="workflow-tabs" style={{ display: "flex", gap: "8px", background: "rgba(15,23,42,0.6)", padding: "4px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", marginBottom: "20px" }}>
        <button
          className={`workflow-tab ${activeTab === "console" ? "active" : ""}`}
          onClick={() => setActiveTab("console")}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "6px", color: activeTab === "console" ? "#fff" : "#94a3b8", background: activeTab === "console" ? "#1e293b" : "none", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
        >
          <Terminal size={14} /> Command Console
        </button>
        <button
          className={`workflow-tab ${activeTab === "heatmap" ? "active" : ""}`}
          onClick={() => setActiveTab("heatmap")}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "6px", color: activeTab === "heatmap" ? "#fff" : "#94a3b8", background: activeTab === "heatmap" ? "#1e293b" : "none", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
        >
          <Grid size={14} /> Station Heatmap
        </button>
        <button
          className={`workflow-tab ${activeTab === "staff" ? "active" : ""}`}
          onClick={() => setActiveTab("staff")}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "6px", color: activeTab === "staff" ? "#fff" : "#94a3b8", background: activeTab === "staff" ? "#1e293b" : "none", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
        >
          <ShieldAlert size={14} /> Top Risk Employees
        </button>
        <button
          className={`workflow-tab ${activeTab === "compliance" ? "active" : ""}`}
          onClick={() => setActiveTab("compliance")}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "6px", color: activeTab === "compliance" ? "#fff" : "#94a3b8", background: activeTab === "compliance" ? "#1e293b" : "none", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
        >
          <BarChart3 size={14} /> Compliance Analysis
        </button>
        <button
          className={`workflow-tab ${activeTab === "forecast" ? "active" : ""}`}
          onClick={() => setActiveTab("forecast")}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "6px", color: activeTab === "forecast" ? "#fff" : "#94a3b8", background: activeTab === "forecast" ? "#1e293b" : "none", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
        >
          <Calendar size={14} /> Expiry Forecasts
        </button>
      </div>

      {/* ─── TAB CONTENT: COMMAND CONSOLE ─── */}
      {activeTab === "console" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px" }}>
          {/* Live System Log stream */}
          <div className="workflow-card" style={{ padding: "20px", background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h4 style={{ margin: 0, fontSize: "15px", color: "#f8fafc", fontWeight: "700" }}>Live Command Safety Stream</h4>
              <span style={{ fontSize: "11px", color: "#2563eb", background: "rgba(37,99,235,0.1)", padding: "2px 8px", borderRadius: "10px", fontWeight: "600" }}>Ticker Logs</span>
            </div>
            
            <div style={{ background: "#090d16", borderRadius: "8px", padding: "16px", fontFamily: "monospace", fontSize: "12px", color: "#a7f3d0", minHeight: "350px", maxHeight: "450px", overflowY: "auto", border: "1px solid #1e293b" }}>
              {loadingLogs && logs.length === 0 ? (
                <div style={{ display: "flex", height: "100%", justifyContent: "center", alignItems: "center", color: "#64748b" }}>
                  <RefreshCw className="anim-spin" size={20} />
                </div>
              ) : logs.length === 0 ? (
                <div style={{ color: "#64748b" }}>No safety events registered.</div>
              ) : (
                logs.map(log => {
                  let color = "#38bdf8"; // Info
                  if (log.severity === "CRITICAL") color = "#ef4444";
                  else if (log.severity === "WARNING") color = "#eab308";
                  return (
                    <div key={log.id} style={{ marginBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.02)", paddingBottom: "6px" }}>
                      <span style={{ color: "#64748b" }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>{" "}
                      <span style={{ color, fontWeight: "bold" }}>{log.action}</span>{" "}
                      <span style={{ color: "#64748b" }}>({log.moduleName}):</span>{" "}
                      <span style={{ color: "#e2e8f0" }}>{log.remarks}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Metrics Breakdowns */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Risk Levels breakdown Pie Chart */}
            <div className="workflow-card" style={{ padding: "20px", background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px" }}>
              <h4 style={{ margin: 0, fontSize: "14px", color: "#f8fafc", fontWeight: "700", marginBottom: "12px" }}>Risk Distribution Breakdown</h4>
              <div style={{ height: "180px" }}>
                {loadingSummary ? (
                  <div style={{ display: "flex", height: "100%", justifyContent: "center", alignItems: "center" }}><RefreshCw className="anim-spin" /></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Low", value: summary?.riskDistribution.Low },
                          { name: "Medium", value: summary?.riskDistribution.Medium },
                          { name: "High", value: summary?.riskDistribution.High }
                        ].filter(x => x.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {COLORS.map((color, idx) => <Cell key={idx} fill={color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "space-around", fontSize: "12px", fontWeight: "600", marginTop: "10px" }}>
                <span style={{ color: "#16a34a" }}>● Low: {summary?.riskDistribution.Low}</span>
                <span style={{ color: "#eab308" }}>● Medium: {summary?.riskDistribution.Medium}</span>
                <span style={{ color: "#ef4444" }}>● High: {summary?.riskDistribution.High}</span>
              </div>
            </div>

            {/* Division Reports brief download options */}
            <div className="workflow-card" style={{ padding: "20px", background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px" }}>
              <h4 style={{ margin: 0, fontSize: "14px", color: "#f8fafc", fontWeight: "700", marginBottom: "12px" }}>Division Executive Action Center</h4>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 16px" }}>Download spreadsheet registries for division inspections audit trails:</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button className="csv-export-btn" onClick={() => handleExportCSV("summary")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer", width: "100%", background: "#1e293b", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.1)", padding: "10px", borderRadius: "6px", fontSize: "13px", fontWeight: "600" }}>
                  <Download size={14} /> Export Division Brief (CSV)
                </button>
                <button className="csv-export-btn" onClick={() => handleExportCSV("heatmap")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer", width: "100%", background: "#1e293b", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.1)", padding: "10px", borderRadius: "6px", fontSize: "13px", fontWeight: "600" }}>
                  <Download size={14} /> Export Station Heatmap Registry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB CONTENT: STATION RISK HEATMAP ─── */}
      {activeTab === "heatmap" && (
        <div className="workflow-card animate-fade-in" style={{ padding: "20px", background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h4 style={{ margin: 0, fontSize: "16px", color: "#f8fafc", fontWeight: "800" }}>Nagpur Section Risk Heat Matrix</h4>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>Division station safety metrics, sorted by average safety risk index descending</p>
            </div>
            <button className="csv-export-btn" onClick={() => handleExportCSV("heatmap")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>
              <Download size={14} /> Export Matrix CSV
            </button>
          </div>

          {loadingHeatmap ? (
            <div style={{ display: "flex", height: "300px", justifyContent: "center", alignItems: "center" }}>
              <RefreshCw className="anim-spin spinner-blue" size={24} />
            </div>
          ) : heatmap.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>No station data found in database.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
              {heatmap.map(st => {
                let glowColor = "rgba(16, 185, 129, 0.2)";
                let glowBorder = "rgba(16, 185, 129, 0.4)";
                if (st.alertLevel === "Red") {
                  glowColor = "rgba(239, 68, 68, 0.1)";
                  glowBorder = "rgba(239, 68, 68, 0.5)";
                } else if (st.alertLevel === "Yellow") {
                  glowColor = "rgba(230, 150, 0, 0.1)";
                  glowBorder = "rgba(230, 150, 0, 0.4)";
                }

                return (
                  <div
                    key={st.stationId}
                    style={{
                      padding: "20px",
                      background: "rgba(15,23,42,0.6)",
                      border: `1px solid ${glowBorder}`,
                      borderRadius: "10px",
                      boxShadow: `0 4px 20px ${glowColor}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      position: "relative"
                    }}
                  >
                    {/* Header: Station Name & Alert Indicator */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h5 style={{ margin: 0, fontSize: "16px", color: "#fff", fontWeight: "800" }}>{st.stationName}</h5>
                        <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>CODE: {st.stationCode}</span>
                      </div>
                      <span style={{
                        fontSize: "9px",
                        fontWeight: "800",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        background: st.alertLevel === "Red" ? "rgba(239,68,68,0.2)" : st.alertLevel === "Yellow" ? "rgba(230,150,0,0.2)" : "rgba(16,185,129,0.2)",
                        color: st.alertLevel === "Red" ? "#f87171" : st.alertLevel === "Yellow" ? "#fbbf24" : "#34d399",
                        textTransform: "uppercase"
                      }}>
                        {st.alertLevel} Alert
                      </span>
                    </div>

                    {/* Stats List */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px", color: "#94a3b8" }}>
                      <div>
                        <div style={{ color: "#64748b", fontSize: "10px", fontWeight: "700" }}>RISK INDEX</div>
                        <strong style={{ fontSize: "16px", color: st.alertLevel === "Red" ? "#f87171" : "#fff" }}>{st.averageRiskScore}</strong>
                      </div>
                      <div>
                        <div style={{ color: "#64748b", fontSize: "10px", fontWeight: "700" }}>COMPLIANCE</div>
                        <strong style={{ fontSize: "16px", color: "#fff" }}>{st.safetyIndex}%</strong>
                      </div>
                      <div>
                        <div style={{ color: "#64748b", fontSize: "10px", fontWeight: "700" }}>ACTIVE STAFF</div>
                        <strong style={{ fontSize: "14px", color: "#fff" }}>{st.activeStaffCount}</strong>
                      </div>
                      <div>
                        <div style={{ color: "#64748b", fontSize: "10px", fontWeight: "700" }}>ESCALATIONS</div>
                        <strong style={{ fontSize: "14px", color: st.unresolvedEscalations > 0 ? "#f87171" : "#34d399" }}>
                          {st.unresolvedEscalations} Open
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB CONTENT: TOP RISK EMPLOYEES ─── */}
      {activeTab === "staff" && (
        <div className="workflow-card animate-fade-in" style={{ padding: "20px", background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h4 style={{ margin: 0, fontSize: "16px", color: "#f8fafc", fontWeight: "800" }}>Top Risk Safety-Evaluated Employees</h4>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>Roster list sorted by dynamic predictive risk score descending</p>
            </div>
            <button className="csv-export-btn" onClick={() => handleExportCSV("top_risk")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
              <Download size={14} /> Export Roster (CSV)
            </button>
          </div>

          {loadingStaff ? (
            <div style={{ display: "flex", height: "250px", justifyContent: "center", alignItems: "center" }}>
              <RefreshCw className="anim-spin spinner-blue" size={24} />
            </div>
          ) : topStaff.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>No safety staff found matching the filter criteria.</div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table className="workflow-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      <th style={{ padding: "12px 8px", color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>HRMS ID / Name</th>
                      <th style={{ padding: "12px 8px", color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Designation</th>
                      <th style={{ padding: "12px 8px", color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Station</th>
                      <th style={{ padding: "12px 8px", color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", textAlign: "center" }}>CBT Score</th>
                      <th style={{ padding: "12px 8px", color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", textAlign: "center" }}>Practical Score</th>
                      <th style={{ padding: "12px 8px", color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", textAlign: "center" }}>Counselling</th>
                      <th style={{ padding: "12px 8px", color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", textAlign: "center" }}>Risk Score</th>
                      <th style={{ padding: "12px 8px", color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", textAlign: "center" }}>Risk Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topStaff.map(pm => {
                      let tagColor = "#10b981"; // Low
                      let tagBg = "rgba(16,185,129,0.1)";
                      if (pm.riskLevel === "High") {
                        tagColor = "#ef4444";
                        tagBg = "rgba(239,68,68,0.1)";
                      } else if (pm.riskLevel === "Medium") {
                        tagColor = "#f59e0b";
                        tagBg = "rgba(245,158,11,0.1)";
                      }

                      return (
                        <tr key={pm.employeeId} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding: "12px 8px" }}>
                            <div style={{ fontWeight: "700", color: "#fff", fontSize: "13px" }}>{pm.name}</div>
                            <div style={{ fontSize: "10px", color: "#64748b", fontFamily: "monospace", marginTop: "2px" }}>{pm.hrmsId}</div>
                          </td>
                          <td style={{ padding: "12px 8px", fontSize: "13px", color: "#cbd5e1" }}>{pm.role}</td>
                          <td style={{ padding: "12px 8px", fontSize: "13px", color: "#cbd5e1" }}>{pm.station}</td>
                          <td style={{ padding: "12px 8px", textAlign: "center", fontSize: "13px", color: "#cbd5e1" }}>
                            {pm.cbtScore > 0 ? `${pm.cbtScore}%` : "—"}
                          </td>
                          <td style={{ padding: "12px 8px", textAlign: "center", fontSize: "13px", color: "#cbd5e1" }}>
                            {pm.practicalScore > 0 ? `${pm.practicalScore}%` : "—"}
                          </td>
                          <td style={{ padding: "12px 8px", textAlign: "center", fontSize: "13px", color: pm.openCounsellingCount > 0 ? "#f87171" : "#cbd5e1", fontWeight: pm.openCounsellingCount > 0 ? "bold" : "normal" }}>
                            {pm.openCounsellingCount > 0 ? `${pm.openCounsellingCount} Open` : "None"}
                          </td>
                          <td style={{ padding: "12px 8px", textAlign: "center", fontWeight: "800", fontSize: "14px", color: tagColor }}>
                            {pm.riskScore}
                          </td>
                          <td style={{ padding: "12px 8px", textAlign: "center" }}>
                            <span style={{ fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "12px", color: tagColor, background: tagBg, textTransform: "uppercase" }}>
                              {pm.riskLevel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "12px", color: "#64748b" }}>
                <div>
                  Showing {((staffPage - 1) * staffLimit) + 1} - {Math.min(staffPage * staffLimit, staffTotal)} of {staffTotal} records
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    disabled={staffPage <= 1}
                    onClick={() => setStaffPage(prev => prev - 1)}
                    style={{ display: "flex", alignItems: "center", cursor: staffPage <= 1 ? "not-allowed" : "pointer", background: "none", color: staffPage <= 1 ? "#334155" : "#e2e8f0", border: "1px solid rgba(255,255,255,0.1)", padding: "4px 8px", borderRadius: "4px" }}
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>
                  <button
                    disabled={staffPage * staffLimit >= staffTotal}
                    onClick={() => setStaffPage(prev => prev + 1)}
                    style={{ display: "flex", alignItems: "center", cursor: staffPage * staffLimit >= staffTotal ? "not-allowed" : "pointer", background: "none", color: staffPage * staffLimit >= staffTotal ? "#334155" : "#e2e8f0", border: "1px solid rgba(255,255,255,0.1)", padding: "4px 8px", borderRadius: "4px" }}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── TAB CONTENT: COMPLIANCE ANALYSIS CHARTS ─── */}
      {activeTab === "compliance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Recharts Bar Graphs */}
          <div className="workflow-card" style={{ padding: "20px", background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px" }}>
            <h4 style={{ margin: "0 0 16px", fontSize: "15px", color: "#f8fafc", fontWeight: "700" }}>Role-wise PME & Refresher Training Compliance Rate</h4>
            <div style={{ height: "280px" }}>
              {loadingBreakdown ? (
                <div style={{ display: "flex", height: "100%", justifyContent: "center", alignItems: "center" }}><RefreshCw className="anim-spin" /></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={breakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="role" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", color: "#fff" }} />
                    <Legend />
                    <Bar dataKey="pmeComplianceRate" name="PME Compliance (%)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="refComplianceRate" name="Refresher Course (%)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {/* Practical & CBT Scores breakdown */}
            <div className="workflow-card" style={{ padding: "20px", background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px" }}>
              <h4 style={{ margin: "0 0 16px", fontSize: "14px", color: "#f8fafc", fontWeight: "700" }}>Safety Exam CBT Average Scores</h4>
              <div style={{ height: "200px" }}>
                {loadingBreakdown ? (
                  <div style={{ display: "flex", height: "100%", justifyContent: "center", alignItems: "center" }}><RefreshCw className="anim-spin" /></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={breakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="role" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
                      <Bar dataKey="cbtAverageScore" name="CBT Score Avg" fill="#eab308" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Historical monthly compliance trends */}
            <div className="workflow-card" style={{ padding: "20px", background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px" }}>
              <h4 style={{ margin: "0 0 16px", fontSize: "14px", color: "#f8fafc", fontWeight: "700" }}>Monthly Evaluative Trend Analytics</h4>
              <div style={{ height: "200px" }}>
                {loadingForecast ? (
                  <div style={{ display: "flex", height: "100%", justifyContent: "center", alignItems: "center" }}><RefreshCw className="anim-spin" /></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
                      <Legend />
                      <Line type="monotone" dataKey="cbtAttempts" name="CBT Clearances" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="practicalAssessments" name="Practical Clearances" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB CONTENT: EXPIRY FORECASTS ─── */}
      {activeTab === "forecast" && (
        <div className="workflow-card animate-fade-in" style={{ padding: "20px", background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h4 style={{ margin: 0, fontSize: "16px", color: "#f8fafc", fontWeight: "800" }}>90-Day Roster Expiration Forecast Timeline</h4>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>Safety evaluated staff approaching PME or REF refresher course expiration date boundaries</p>
            </div>
            <button className="csv-export-btn" onClick={() => handleExportCSV("forecast")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
              <Download size={14} /> Export Forecast CSV
            </button>
          </div>

          {loadingForecast ? (
            <div style={{ display: "flex", height: "250px", justifyContent: "center", alignItems: "center" }}>
              <RefreshCw className="anim-spin spinner-blue" size={24} />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", flexWrap: "wrap" }}>
              
              {/* Category 1: Critical (0-30 Days) */}
              <div style={{ background: "rgba(15,23,42,0.6)", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.2)", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "10px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "800", color: "#ef4444" }}>CRITICAL (0-30 Days)</span>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#ef4444", background: "rgba(239,68,68,0.1)", padding: "2px 8px", borderRadius: "10px" }}>
                    {forecast?.critical.length} Staff
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "400px", overflowY: "auto" }}>
                  {forecast?.critical.length === 0 ? (
                    <div style={{ color: "#64748b", fontSize: "12px", padding: "10px 0" }}>No staff in critical boundary.</div>
                  ) : (
                    forecast?.critical.map(f => (
                      <div key={f.employeeId} style={{ background: "rgba(239,68,68,0.02)", padding: "10px", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.1)", fontSize: "12px" }}>
                        <strong style={{ color: "#fff", fontSize: "13px" }}>{f.name}</strong> <span style={{ color: "#64748b" }}>({f.hrmsId})</span>
                        <div style={{ color: "#94a3b8", marginTop: "4px" }}>Role: {f.role} | Station: {f.station}</div>
                        <div style={{ color: "#f87171", fontWeight: "700", marginTop: "6px" }}>
                          Expires in: {Math.min(f.pmeDaysRemaining || 9999, f.refDaysRemaining || 9999)} Days
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Category 2: Warning (31-60 Days) */}
              <div style={{ background: "rgba(15,23,42,0.6)", borderRadius: "8px", border: "1px solid rgba(245,158,11,0.2)", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "10px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "800", color: "#f59e0b" }}>WARNING (31-60 Days)</span>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#f59e0b", background: "rgba(245,158,11,0.1)", padding: "2px 8px", borderRadius: "10px" }}>
                    {forecast?.warning.length} Staff
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "400px", overflowY: "auto" }}>
                  {forecast?.warning.length === 0 ? (
                    <div style={{ color: "#64748b", fontSize: "12px", padding: "10px 0" }}>No staff in warning boundary.</div>
                  ) : (
                    forecast?.warning.map(f => (
                      <div key={f.employeeId} style={{ background: "rgba(245,158,11,0.02)", padding: "10px", borderRadius: "6px", border: "1px solid rgba(245,158,11,0.1)", fontSize: "12px" }}>
                        <strong style={{ color: "#fff", fontSize: "13px" }}>{f.name}</strong> <span style={{ color: "#64748b" }}>({f.hrmsId})</span>
                        <div style={{ color: "#94a3b8", marginTop: "4px" }}>Role: {f.role} | Station: {f.station}</div>
                        <div style={{ color: "#fbbf24", fontWeight: "700", marginTop: "6px" }}>
                          Expires in: {Math.min(f.pmeDaysRemaining || 9999, f.refDaysRemaining || 9999)} Days
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Category 3: Upcoming (61-90 Days) */}
              <div style={{ background: "rgba(15,23,42,0.6)", borderRadius: "8px", border: "1px solid rgba(37,99,235,0.2)", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "10px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "800", color: "#3b82f6" }}>UPCOMING (61-90 Days)</span>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#3b82f6", background: "rgba(37,99,235,0.1)", padding: "2px 8px", borderRadius: "10px" }}>
                    {forecast?.upcoming.length} Staff
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "400px", overflowY: "auto" }}>
                  {forecast?.upcoming.length === 0 ? (
                    <div style={{ color: "#64748b", fontSize: "12px", padding: "10px 0" }}>No staff in upcoming boundary.</div>
                  ) : (
                    forecast?.upcoming.map(f => (
                      <div key={f.employeeId} style={{ background: "rgba(37,99,235,0.02)", padding: "10px", borderRadius: "6px", border: "1px solid rgba(37,99,235,0.1)", fontSize: "12px" }}>
                        <strong style={{ color: "#fff", fontSize: "13px" }}>{f.name}</strong> <span style={{ color: "#64748b" }}>({f.hrmsId})</span>
                        <div style={{ color: "#94a3b8", marginTop: "4px" }}>Role: {f.role} | Station: {f.station}</div>
                        <div style={{ color: "#60a5fa", fontWeight: "700", marginTop: "6px" }}>
                          Expires in: {Math.min(f.pmeDaysRemaining || 9999, f.refDaysRemaining || 9999)} Days
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
