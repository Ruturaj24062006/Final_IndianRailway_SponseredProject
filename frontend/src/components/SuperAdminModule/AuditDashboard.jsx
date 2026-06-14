import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck, TrendingUp, AlertTriangle, Search, Calendar,
  Download, ChevronLeft, ChevronRight, RefreshCw, SlidersHorizontal,
  Activity, Info, AlertOctagon, FileSpreadsheet, FileText, CheckCircle
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, BarChart, Bar, Cell
} from "recharts";
import {
  getSystemHealth,
  getSystemActivity,
  getAuditLogs,
  getSecurityEvents
} from "../../services/systemService";

export default function AuditDashboard() {
  // Stats and data states
  const [health, setHealth] = useState(null);
  const [activity, setActivity] = useState(null);
  const [logs, setLogs] = useState([]);
  const [securityEvents, setSecurityEvents] = useState([]);
  
  // Pagination and query state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  // Filters state
  const [search, setSearch] = useState("");
  const [moduleF, setModuleF] = useState("All");
  const [actionF, setActionF] = useState("All");
  const [severityF, setSeverityF] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Toggle view (Audit Logs vs Security Alert Dashboard)
  const [activeSubTab, setActiveSubTab] = useState("logs"); // "logs" or "security"

  // Fetch lists
  const loadStats = async () => {
    try {
      const [healthData, activityData] = await Promise.all([
        getSystemHealth(),
        getSystemActivity()
      ]);
      setHealth(healthData);
      setActivity(activityData);
    } catch (err) {
      console.warn("Failed to load dashboard statistics:", err.message);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        page,
        limit: 15,
        search,
        module_name: moduleF,
        action: actionF,
        severity: severityF,
        startDate,
        endDate
      };

      if (activeSubTab === "logs") {
        const res = await getAuditLogs(filters);
        setLogs(res.data);
        setTotalLogs(res.pagination.total);
        setTotalPages(res.pagination.pages);
      } else {
        const res = await getSecurityEvents({
          page,
          limit: 15,
          search,
          startDate,
          endDate
        });
        setSecurityEvents(res.data);
        setTotalLogs(res.pagination.total);
        setTotalPages(res.pagination.pages);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      setError(err.message || "Failed to load audit trail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    setPage(1); // reset page when filters or tabs change
  }, [search, moduleF, actionF, severityF, startDate, endDate, activeSubTab]);

  useEffect(() => {
    loadLogs();
  }, [page, search, moduleF, actionF, severityF, startDate, endDate, activeSubTab]);

  // Export helpers
  const getExportData = async () => {
    try {
      // Fetch matching data without pagination limit for export (get up to 1000 rows)
      const filters = {
        page: 1,
        limit: 1000,
        search,
        module_name: moduleF,
        action: actionF,
        severity: severityF,
        startDate,
        endDate
      };
      
      const res = activeSubTab === "logs" 
        ? await getAuditLogs(filters) 
        : await getSecurityEvents(filters);
        
      return res.data;
    } catch (err) {
      console.error("Failed to fetch data for export, exporting current page instead:", err);
      return activeSubTab === "logs" ? logs : securityEvents;
    }
  };

  const handleExportCSV = async () => {
    const dataToExport = await getExportData();
    const headers = ["ID", "Timestamp", "Action", "Module", "Severity", "Actor Name", "Actor HRMS", "Target Employee", "Target HRMS", "Remarks"];
    const rows = dataToExport.map(log => [
      log.id,
      new Date(log.created_at).toLocaleString(),
      log.action,
      log.module_name || "N/A",
      log.severity || "INFO",
      log.performed_by_name || "System",
      log.performed_by_hrms || "N/A",
      log.employee_name || "N/A",
      log.employee_hrms || "N/A",
      `"${(log.remarks || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const suffix = activeSubTab === "logs" ? "Audit_Trail" : "Security_Events";
    
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `IR_Railway_${suffix}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = async () => {
    const dataToExport = await getExportData();
    // Excel XML / Spreadsheet table generation
    let excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>${activeSubTab === "logs" ? "Audit Logs" : "Security Alerts"}</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #0f172a; color: white; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          td { border: 1px solid #cbd5e1; padding: 6px; font-size: 11pt; }
          .CRITICAL { background-color: #fee2e2; color: #991b1b; }
          .WARNING { background-color: #fef3c7; color: #92400e; }
          .INFO { background-color: #f1f5f9; color: #1e293b; }
        </style>
      </head>
      <body>
        <h2>${activeSubTab === "logs" ? "Divisional Audit Trail Logs" : "Security Threat Alerts Ledger"}</h2>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Module</th>
              <th>Severity</th>
              <th>Performed By</th>
              <th>Target Profile</th>
              <th>Activity Summary</th>
            </tr>
          </thead>
          <tbody>
    `;

    dataToExport.forEach(log => {
      excelContent += `
        <tr>
          <td>${log.id}</td>
          <td>${new Date(log.created_at).toLocaleString()}</td>
          <td><b>${log.action}</b></td>
          <td>${log.module_name || "System"}</td>
          <td class="${log.severity || 'INFO'}">${log.severity || "INFO"}</td>
          <td>${log.performed_by_name || "System"} (${log.performed_by_hrms || "N/A"})</td>
          <td>${log.employee_name ? `${log.employee_name} (${log.employee_hrms})` : "—"}</td>
          <td>${log.remarks || ""}</td>
        </tr>
      `;
    });

    excelContent += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelContent], { type: "application/vnd.ms-excel" });
    const link = document.createElement("a");
    const suffix = activeSubTab === "logs" ? "Audit_Trail" : "Security_Events";
    
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `IR_Railway_${suffix}_${new Date().toISOString().split("T")[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    const dataToExport = await getExportData();
    
    // Create print window containing clean style layout
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocker prevented exporting PDF. Please allow popups for this site.");
      return;
    }

    let rowsHTML = "";
    dataToExport.forEach(log => {
      let badgeStyle = "background-color: #f1f5f9; color: #475569;";
      if (log.severity === "CRITICAL") badgeStyle = "background-color: #fee2e2; color: #b91c1c; font-weight: bold;";
      else if (log.severity === "WARNING") badgeStyle = "background-color: #fef3c7; color: #d97706; font-weight: bold;";

      rowsHTML += `
        <tr>
          <td style="font-size: 8.5pt;">${new Date(log.created_at).toLocaleString()}</td>
          <td style="font-size: 9pt; font-weight: bold;">${log.action}</td>
          <td style="font-size: 9pt;">${log.module_name || "System"}</td>
          <td><span style="padding: 2px 6px; border-radius: 4px; font-size: 8pt; ${badgeStyle}">${log.severity || "INFO"}</span></td>
          <td style="font-size: 8.5pt;">${log.performed_by_name || "System"} (${log.performed_by_hrms || "N/A"})</td>
          <td style="font-size: 8.5pt;">${log.employee_name ? `${log.employee_name} (${log.employee_hrms})` : "—"}</td>
          <td style="font-size: 8.5pt; max-width: 280px; word-break: break-all;">${log.remarks || ""}</td>
        </tr>
      `;
    });

    const htmlContent = `
      <html>
      <head>
        <title>Indian Railways Safety Evaluation System - Audit Dossier</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          .title { margin: 0; font-size: 16pt; color: #0b1f3a; font-weight: 800; }
          .subtitle { margin: 4px 0 0 0; font-size: 10pt; color: #64748b; }
          .meta-info { font-size: 9pt; text-align: right; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #0f172a; color: white; font-weight: 700; font-size: 9pt; border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          td { border: 1px solid #e2e8f0; padding: 6px; font-size: 9pt; vertical-align: top; }
          tr:nth-child(even) { background-color: #f8fafc; }
          @media print {
            button { display: none; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <button onclick="window.print();" style="padding: 8px 16px; background-color: #1e3a5f; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Print / Save as PDF</button>
          <button onclick="window.close();" style="padding: 8px 16px; background-color: #64748b; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Close Tab</button>
        </div>
        <div class="header">
          <div>
            <h1 class="title">Indian Railways Evaluation System</h1>
            <p class="subtitle">Nagpur Division — Operations Safety Audit Ledger</p>
          </div>
          <div class="meta-info">
            <p style="margin: 0;"><b>Document:</b> System ${activeSubTab === "logs" ? "Audit Trails" : "Security Alerts"}</p>
            <p style="margin: 4px 0 0 0;"><b>Date:</b> ${new Date().toLocaleString()}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 15%;">Timestamp</th>
              <th style="width: 15%;">Action</th>
              <th style="width: 10%;">Module</th>
              <th style="width: 8%;">Severity</th>
              <th style="width: 15%;">Performed By</th>
              <th style="width: 15%;">Target Profile</th>
              <th style="width: 22%;">Activity Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHTML}
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Lists for dropdown options
  const MODULES = ["All", "Auth", "Employees", "Stations", "Questions", "Assessments", "CBT", "PME", "REF"];
  const ACTIONS = [
    "All", "LOGIN_SUCCESS", "LOGIN_FAILURE", "LOGOUT", "SECURITY_ALERT", 
    "RESET_PASSWORD", "CREATE_EMPLOYEE", "UPDATE_EMPLOYEE", 
    "CREATE_STATION", "UPDATE_STATION", "CREATE_QUESTION", 
    "UPDATE_QUESTION", "DEACTIVATE_QUESTION", "CREATE_ASSESSMENT", 
    "SUBMIT_ASSESSMENT", "APPROVE_ASSESSMENT", "REJECT_ASSESSMENT",
    "START_CBT_EXAM", "SUBMIT_CBT_EXAM", "UPDATE_PME", "UPDATE_REF"
  ];
  const SEVERITIES = ["All", "INFO", "WARNING", "CRITICAL"];

  return (
    <div className="sdom-fade" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* Upper Status Panel */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
        
        {/* Database Latency */}
        <div className="sdom-chart-card" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "#dcfce7", color: "#16a34a", padding: "12px", borderRadius: "10px" }}>
            <Activity size={24} />
          </div>
          <div>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Database Connection</span>
            <h4 style={{ margin: "4px 0 0 0", fontSize: "1.2rem", fontWeight: "800", color: "#0f172a" }}>
              {health?.database?.status === "Connected" ? "Online ✅" : "Offline ❌"}
            </h4>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#64748b" }}>
              Latency: <b>{health?.database?.latency_ms || 0} ms</b>
            </p>
          </div>
        </div>

        {/* Total Events */}
        <div className="sdom-chart-card" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "#dbeafe", color: "#2563eb", padding: "12px", borderRadius: "10px" }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Audit Roster Events</span>
            <h4 style={{ margin: "4px 0 0 0", fontSize: "1.2rem", fontWeight: "800", color: "#0f172a" }}>
              {activity?.summary?.total_events || 0} Logs
            </h4>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#64748b" }}>
              Last 24 hours: <b>{activity?.summary?.last_24h || 0} events</b>
            </p>
          </div>
        </div>

        {/* Security Violations */}
        <div className="sdom-chart-card" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "#fee2e2", color: "#dc2626", padding: "12px", borderRadius: "10px" }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Critical Incidents</span>
            <h4 style={{ margin: "4px 0 0 0", fontSize: "1.2rem", fontWeight: "800", color: "#991b1b" }}>
              {activity?.module_breakdown?.find(m => m.module_name === "SECURITY_ALERT" || m.module_name === "Auth" && m.severity === "CRITICAL")?.count || 
               logs.filter(l => l.severity === "CRITICAL").length} Threat Alerts
            </h4>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#dc2626" }}>
              Pre-filtered security ledger active
            </p>
          </div>
        </div>
      </div>

      {/* Timeline Trend Graph */}
      {activity?.timeline && activity.timeline.length > 0 && (
        <div className="sdom-chart-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>System Administration Activity Frequency</h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#64748b" }}>Daily operations count grouped over the last 7 days</p>
            </div>
            <button className="sdom-btn-ghost" style={{ padding: "6px" }} onClick={loadStats}>
              <RefreshCw size={14} /> Refresh Chart
            </button>
          </div>
          <div style={{ width: "100%", height: 180 }}>
            <ResponsiveContainer>
              <LineChart data={activity.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: "0.75rem" }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: "0.75rem" }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#1e293b", color: "#fff", border: "none", borderRadius: "8px" }} />
                <Line type="monotone" dataKey="count" name="Operations Executed" stroke="#2563eb" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabs Navigator & Search Filters */}
      <div className="sdom-chart-card" style={{ padding: "20px" }}>
        
        {/* Toggle Switch Tabs */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", gap: "8px", background: "#f8fafc", padding: "4px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
            <button
              onClick={() => setActiveSubTab("logs")}
              style={{
                padding: "8px 16px",
                border: "none",
                borderRadius: "6px",
                fontWeight: "700",
                fontSize: "0.85rem",
                cursor: "pointer",
                background: activeSubTab === "logs" ? "#1e3a5f" : "transparent",
                color: activeSubTab === "logs" ? "#ffffff" : "#475569",
                transition: "all 0.2s"
              }}
            >
              System Operations Logs
            </button>
            <button
              onClick={() => setActiveSubTab("security")}
              style={{
                padding: "8px 16px",
                border: "none",
                borderRadius: "6px",
                fontWeight: "700",
                fontSize: "0.85rem",
                cursor: "pointer",
                background: activeSubTab === "security" ? "#991b1b" : "transparent",
                color: activeSubTab === "security" ? "#ffffff" : "#475569",
                transition: "all 0.2s"
              }}
            >
              Security Incidents Alert
            </button>
          </div>

          {/* Export and filter toggle */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button 
              className="sdom-btn-ghost" 
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem" }}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={14} /> 
              {showFilters ? "Hide Filters" : "Filters"}
            </button>

            {/* Export Buttons */}
            <button 
              className="sdom-btn-primary" 
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", background: "#15803d" }}
              onClick={handleExportCSV}
            >
              <Download size={14} /> CSV
            </button>
            <button 
              className="sdom-btn-primary" 
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", background: "#b45309" }}
              onClick={handleExportExcel}
            >
              <FileSpreadsheet size={14} /> Excel
            </button>
            <button 
              className="sdom-btn-primary" 
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", background: "#0f172a" }}
              onClick={handleExportPDF}
            >
              <FileText size={14} /> PDF
            </button>
          </div>
        </div>

        {/* Expandable filters block */}
        {(showFilters || search) && (
          <div style={{
            background: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: "10px",
            padding: "16px",
            marginBottom: "16px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
            animation: "slideDown 0.2s ease-out"
          }}>
            <div className="sdom-filter-field">
              <label>Text Match Query</label>
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search action, remark, user..." 
              />
            </div>
            
            {activeSubTab === "logs" && (
              <>
                <div className="sdom-filter-field">
                  <label>System Module</label>
                  <select value={moduleF} onChange={e => setModuleF(e.target.value)}>
                    {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="sdom-filter-field">
                  <label>Action Category</label>
                  <select value={actionF} onChange={e => setActionF(e.target.value)}>
                    {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="sdom-filter-field">
                  <label>Severity Level</label>
                  <select value={severityF} onChange={e => setSeverityF(e.target.value)}>
                    {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </>
            )}

            <div className="sdom-filter-field">
              <label>Start Date</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
              />
            </div>
            <div className="sdom-filter-field">
              <label>End Date</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
              />
            </div>
          </div>
        )}

        {/* Live Logs Table */}
        <div className="sdom-table-wrap">
          <table className="sdom-table">
            <thead>
              <tr>
                <th style={{ width: "16%" }}>Timestamp</th>
                <th style={{ width: "14%" }}>Action</th>
                <th style={{ width: "10%" }}>Module</th>
                <th style={{ width: "9%" }}>Severity</th>
                <th style={{ width: "16%" }}>Actor</th>
                <th style={{ width: "15%" }}>Target Profile</th>
                <th style={{ width: "20%" }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 48 }}>
                    <div className="loading-spinner" style={{ margin: "0 auto 12px auto" }}></div>
                    <span style={{ fontWeight: 700, color: "#475569" }}>Querying PostgreSQL Live Tables...</span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#b91c1c" }}>
                    <AlertOctagon style={{ margin: "0 auto 8px auto" }} />
                    <p style={{ margin: 0, fontWeight: 700 }}>Connection Error: {error}</p>
                  </td>
                </tr>
              ) : (activeSubTab === "logs" ? logs : securityEvents).length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#64748b" }}>
                    No audit records match the current filters.
                  </td>
                </tr>
              ) : (
                (activeSubTab === "logs" ? logs : securityEvents).map(log => {
                  let sevClass = "sdom-badge-neutral";
                  let sevIcon = <Info size={12} />;
                  if (log.severity === "CRITICAL") {
                    sevClass = "sdom-badge-danger";
                    sevIcon = <AlertOctagon size={12} />;
                  } else if (log.severity === "WARNING") {
                    sevClass = "sdom-badge-warning";
                    sevIcon = <AlertTriangle size={12} />;
                  }

                  return (
                    <tr key={log.id} style={{
                      backgroundColor: log.severity === "CRITICAL" ? "#fff5f5" : "inherit",
                      transition: "background 0.2s"
                    }}>
                      <td style={{ whiteSpace: "nowrap", fontSize: "0.8rem", fontWeight: 600 }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, fontSize: "0.8rem", color: "#1e3a5f" }}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.8rem", color: "#475569" }}>{log.module_name || "—"}</span>
                      </td>
                      <td>
                        <span className={`sdom-badge ${sevClass}`} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          {sevIcon}
                          {log.severity || "INFO"}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.8rem" }}>
                        {log.performed_by_name ? (
                          <span>
                            <b>{log.performed_by_name}</b>
                            <br /><span style={{ color: "#64748b" }}>({log.performed_by_hrms})</span>
                          </span>
                        ) : (
                          <span style={{ color: "#64748b", fontStyle: "italic" }}>System Job</span>
                        )}
                      </td>
                      <td style={{ fontSize: "0.8rem" }}>
                        {log.employee_name ? (
                          <span>
                            <b>{log.employee_name}</b>
                            <br /><span style={{ color: "#64748b" }}>({log.employee_hrms})</span>
                          </span>
                        ) : "—"}
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "#334155", maxHeight: "60px", overflow: "hidden" }}>
                        {log.remarks}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {!loading && !error && totalLogs > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", flexWrap: "wrap", gap: "10px" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "600" }}>
              Showing Page <b>{page}</b> of <b>{totalPages}</b> (Total matching logs: <b>{totalLogs}</b>)
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                className="sdom-btn-ghost" 
                style={{ padding: "6px 12px", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem" }}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button 
                className="sdom-btn-ghost" 
                style={{ padding: "6px 12px", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem" }}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
