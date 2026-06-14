import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, FileText, ShieldCheck, Clock, Award, FileBarChart2, 
  AlertTriangle, CheckCircle, XCircle, Activity, Download, RefreshCw, 
  BarChart3, TrendingUp, Users, ShieldAlert 
} from "lucide-react";
import { 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, 
  XAxis, YAxis, Tooltip, Legend, CartesianGrid 
} from "recharts";
import { useLanguage } from "../utils/LanguageContext";
import {
  getReportsDashboard,
  getReportsCbt,
  getReportsPme,
  getReportsRef,
  getReportsAssessments,
  getReportsRisk,
  getReportsCompliance,
  updateEmployee,
  deactivateEmployee
} from "../services/adminService";
import { getEmployeeHistory } from "../services/employeeService";
import DossierTab from "./SuperAdminModule/DossierTab";

/* ─── STYLE BADGES ─── */
const riskBadge = r => {
  const map = { Low: "sdom-badge-success", Medium: "sdom-badge-warning", High: "sdom-badge-danger" };
  return <span className={`sdom-badge ${map[r] || "sdom-badge-neutral"}`}>{r}</span>;
};

const catBadge = c => {
  const map = { A: "sdom-badge-success", B: "sdom-badge-info", C: "sdom-badge-warning", D: "sdom-badge-danger", Unassigned: "sdom-badge-neutral" };
  return <span className={`sdom-badge ${map[c] || "sdom-badge-neutral"}`}>{c}</span>;
};

const statusBadge = s => {
  const map = { 
    Approved: "sdom-badge-success", 
    Pending: "sdom-badge-warning", 
    Submitted: "sdom-badge-warning", 
    Rejected: "sdom-badge-danger", 
    Overdue: "sdom-badge-danger", 
    Expired: "sdom-badge-danger", 
    Active: "sdom-badge-success", 
    Completed: "sdom-badge-success", 
    Valid: "sdom-badge-success", 
    FIT: "sdom-badge-success" 
  };
  return <span className={`sdom-badge ${map[s] || "sdom-badge-neutral"}`}>{s}</span>;
};

// Theming & Colors
const COLORS = ["#16a34a", "#dc2626", "#d97706", "#2563eb", "#8b5cf6", "#ec4899"];
const RISK_COLORS = { Low: "#16a34a", Medium: "#d97706", High: "#dc2626" };
const STATUS_COLORS = { Valid: "#16a34a", Expired: "#dc2626", Upcoming: "#d97706" };

export default function CommonReports({
  selectedReportUserId,
  setSelectedReportUserId,
  userRole = "Super Admin"
}) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for report datasets
  const [dashboardData, setDashboardData] = useState(null);
  const [cbtData, setCbtData] = useState(null);
  const [pmeData, setPmeData] = useState(null);
  const [refData, setRefData] = useState(null);
  const [assessmentsData, setAssessmentsData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [complianceData, setComplianceData] = useState(null);

  // Filter state for Compliance Ledger
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStation, setSelectedStation] = useState("All");
  const [selectedRole, setSelectedRole] = useState("All");

  // New States
  const [employeeHistory, setEmployeeHistory] = useState([]);
  const [historyStartDate, setHistoryStartDate] = useState("");
  const [historyEndDate, setHistoryEndDate] = useState("");
  const [statusTogglingId, setStatusTogglingId] = useState(null);
  const [selectedPastScorecard, setSelectedPastScorecard] = useState(null);

  const loadAllReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, cbt, pme, ref, asmt, rsk, comp] = await Promise.all([
        getReportsDashboard(),
        getReportsCbt(),
        getReportsPme(),
        getReportsRef(),
        getReportsAssessments(),
        getReportsRisk(),
        getReportsCompliance()
      ]);

      setDashboardData(dash);
      setCbtData(cbt);
      setPmeData(pme);
      setRefData(ref);
      setAssessmentsData(asmt);
      setRiskData(rsk);
      setComplianceData(comp);
      setLoading(false);
    } catch (err) {
      console.error("Error loading reports data:", err);
      setError(err.message || "Failed to load reports. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllReports();
  }, []);

  // Fetch updated compliance ledger when filters change
  const handleFilterChange = async (station, role) => {
    setLoading(true);
    try {
      const filters = {};
      if (station !== "All") filters.station_id = station;
      if (role !== "All") filters.role_id = role;
      
      const comp = await getReportsCompliance(filters);
      setComplianceData(comp);
      setLoading(false);
    } catch (err) {
      console.error("Error reloading compliance filters:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedReportUserId) {
      getEmployeeHistory(selectedReportUserId)
        .then(data => setEmployeeHistory(data || []))
        .catch(err => console.warn("Failed to fetch employee history:", err));
    } else {
      setEmployeeHistory([]);
      setHistoryStartDate("");
      setHistoryEndDate("");
    }
  }, [selectedReportUserId]);

  const handleToggleStatus = async (employeeId, currentStatus) => {
    setStatusTogglingId(employeeId);
    try {
      if (currentStatus === "Active") {
        await deactivateEmployee(employeeId);
      } else {
        await updateEmployee(employeeId, { status: "Active" });
      }
      await handleFilterChange(selectedStation, selectedRole);
    } catch (err) {
      console.error("Failed to toggle employee status:", err);
      alert(`Error toggling status: ${err.message}`);
    } finally {
      setStatusTogglingId(null);
    }
  };

  // Compile lists of Stations and Roles dynamically from compliance ledger for drop-downs
  const stationOptions = useMemo(() => {
    if (!complianceData?.employees) return [];
    const stationsMap = {};
    complianceData.employees.forEach(e => {
      if (e.station_name) {
        stationsMap[e.station_name] = e.station_id || e.station_name;
      }
    });
    return Object.entries(stationsMap).map(([name, id]) => ({ id, name }));
  }, [complianceData]);

  const roleOptions = useMemo(() => {
    if (!complianceData?.employees) return [];
    const rolesMap = {};
    complianceData.employees.forEach(e => {
      if (e.designation) {
        rolesMap[e.designation] = e.role_id || e.designation;
      }
    });
    return Object.entries(rolesMap).map(([name, id]) => ({ id, name }));
  }, [complianceData]);

  // Client-side text search over the compliance list
  const filteredEmployees = useMemo(() => {
    if (!complianceData?.employees) return [];
    return complianceData.employees.filter(e => {
      const nameMatch = (e.employee_name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const hrmsMatch = (e.hrms_id || "").toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatch || hrmsMatch;
    });
  }, [complianceData, searchQuery]);

  // Export to CSV ledger helper
  const handleExportCSV = () => {
    if (!complianceData?.employees || complianceData.employees.length === 0) return;
    const headers = ["Employee Name", "HRMS ID", "Designation", "Station", "PME Status", "PME Due Date", "Refresher Status", "Refresher Due Date", "CBT Status", "CBT Score", "Practical Assessment", "Compliance %"];
    const csvRows = complianceData.employees.map(e => [
      `"${e.employee_name}"`,
      `"${e.hrms_id}"`,
      `"${e.designation}"`,
      `"${e.station_name || "Unassigned"}"`,
      `"${e.pme_status}"`,
      `"${e.pme_next_due_date || "—"}"`,
      `"${e.ref_status}"`,
      `"${e.ref_next_due_date || "—"}"`,
      `"${e.cbt_status}"`,
      `"${e.cbt_score !== null ? e.cbt_score + "%" : "—"}"`,
      `"${e.assessment_status || "—"}"`,
      `"${e.compliance_percentage}%"`
    ]);
    const csvContent = [headers.join(","), ...csvRows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `IR_Safety_Compliance_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Rendering Loading and Error states
  if (loading && !dashboardData) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
        <RefreshCw className="sdom-spin" size={48} style={{ color: "#2563eb", marginBottom: "16px" }} />
        <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#334155" }}>Assembling Reports &amp; Analytics...</h3>
        <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>Fetching live compliance ledger from PostgreSQL</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", padding: "24px", borderRadius: "12px", textAlign: "center", margin: "24px 0" }}>
        <AlertTriangle size={48} style={{ color: "#dc2626", margin: "0 auto 16px" }} />
        <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#991b1b" }}>Database Connection Error</h3>
        <p style={{ color: "#b91c1c", fontSize: "14px", marginTop: "4px", marginBottom: "16px" }}>{error}</p>
        <button className="ti2-primary-btn" onClick={loadAllReports} style={{ display: "inline-flex", alignItems: "center", gap: "6px", margin: "0 auto" }}>
          <RefreshCw size={14} /> Retry Querying PostgreSQL
        </button>
      </div>
    );
  }

  // Handle single employee dossier view
  if (selectedReportUserId) {
    const fullLedger = complianceData?.employees || [];
    const emp = fullLedger.find(x => x.employee_id === selectedReportUserId);
    if (!emp) return null;

    const CAT_C = { A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#dc2626", Unassigned: "#64748b" };
    const CAT_B = { A: "#dcfce7", B: "#dbeafe", C: "#fef3c7", D: "#fee2e2", Unassigned: "#f1f5f9" };

    return (
      <div className="ti2-card animate-fade-in sdom-report-detail" style={{ background: "white", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" }}>
        <div className="sdom-report-detail-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: 48, height: 48, fontSize: 18, background: "#2563eb", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontWeight: "700" }}>{emp.employee_name.charAt(0)}</div>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#0f172a", margin: 0 }}>{emp.employee_name}</h2>
              <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#64748b", fontWeight: "700" }}>{emp.designation} · {emp.station_name || "Unassigned"}</p>
            </div>
          </div>
          <button className="ti2-link-btn" onClick={() => setSelectedReportUserId(null)} style={{ fontSize: "13px", fontWeight: "800", color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>
            ← Back to Reports
          </button>
        </div>

        <div className="sdom-report-metrics" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", padding: "20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ background: "white", padding: "14px", borderRadius: "12px", border: "1px solid #e2edf8", textAlign: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Compliance Rating</span>
            <strong style={{ display: "block", fontSize: "24px", color: emp.compliance_percentage >= 80 ? "#16a34a" : emp.compliance_percentage >= 50 ? "#2563eb" : "#dc2626", marginTop: "4px", fontWeight: "900" }}>{emp.compliance_percentage}%</strong>
          </div>
          <div style={{ background: "white", padding: "14px", borderRadius: "12px", border: "1px solid #e2edf8", textAlign: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Safety Category</span>
            <div>
              <span className="ti2-badge" style={{ display: "inline-block", background: CAT_B[emp.category_grade] || "#f1f5f9", color: CAT_C[emp.category_grade] || "#64748b", fontSize: "13px", fontWeight: "800", padding: "4px 14px", borderRadius: "8px", marginTop: "8px" }}>
                Grade {emp.category_grade || "Unassigned"}
              </span>
            </div>
          </div>
          <div style={{ background: "white", padding: "14px", borderRadius: "12px", border: "1px solid #e2edf8", textAlign: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>PME Medical Status</span>
            <div>
              <span className={`sdom-badge ${emp.pme_status === "Valid" ? "sdom-badge-success" : "sdom-badge-danger"}`} style={{ display: "inline-block", fontSize: "13px", fontWeight: "800", padding: "4px 14px", marginTop: "8px" }}>
                {emp.pme_status}
              </span>
            </div>
          </div>
          <div style={{ background: "white", padding: "14px", borderRadius: "12px", border: "1px solid #e2edf8", textAlign: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>CBT Exam Result</span>
            <div>
              <span className={`sdom-badge ${emp.cbt_status === "PASSED" ? "sdom-badge-success" : emp.cbt_status === "Active" ? "sdom-badge-warning" : "sdom-badge-neutral"}`} style={{ display: "inline-block", fontSize: "13px", fontWeight: "800", padding: "4px 14px", marginTop: "8px" }}>
                {emp.cbt_status}
              </span>
            </div>
          </div>
        </div>

        <div className="sdom-report-detail-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", padding: "20px" }}>
          {/* Dossier info */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px" }}>
            <h3 style={{ margin: "0 0 14px 0", fontSize: "13px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", borderBottom: "1.5px solid #cbd5e1", paddingBottom: "8px" }}>Personnel Dossier</h3>
            <dl style={{ display: "flex", flexDirection: "column", gap: "12px", margin: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "#64748b", fontSize: "12px", fontWeight: "700" }}>HRMS ID</dt><dd style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>{emp.hrms_id}</dd></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "#64748b", fontSize: "12px", fontWeight: "700" }}>Role</dt><dd style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>{emp.designation}</dd></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "#64748b", fontSize: "12px", fontWeight: "700" }}>Station Placement</dt><dd style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>{emp.station_name || "Unassigned"} ({emp.station_code || "—"})</dd></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "#64748b", fontSize: "12px", fontWeight: "700" }}>PME Date</dt><dd style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>{emp.pme_date || "Not Seeded"}</dd></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "#64748b", fontSize: "12px", fontWeight: "700" }}>PME Next Due</dt><dd style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>{emp.pme_next_due_date || "Not Seeded"}</dd></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "#64748b", fontSize: "12px", fontWeight: "700" }}>Refresher Date</dt><dd style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>{emp.ref_date || "Not Seeded"}</dd></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "#64748b", fontSize: "12px", fontWeight: "700" }}>Refresher Next Due</dt><dd style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>{emp.ref_next_due_date || "Not Seeded"}</dd></div>
            </dl>
          </div>

          {/* Rules and evaluations */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px" }}>
            <h3 style={{ margin: "0 0 14px 0", fontSize: "13px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", borderBottom: "1.5px solid #cbd5e1", paddingBottom: "8px" }}>Safety Compliance Scorecard</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "12px" }}>
              {[
                { title: "PME (Periodic Medical Exam)", status: emp.pme_status === "Valid" ? 100 : 0, info: emp.pme_next_due_date ? `Due: ${emp.pme_next_due_date}` : "No PME Record" },
                { title: "Refresher Safety Course", status: emp.ref_status === "Valid" ? 100 : 0, info: emp.ref_next_due_date ? `Due: ${emp.ref_next_due_date}` : "No Refresher Record" },
                { title: "Computer Based Test (CBT)", status: emp.cbt_status === "PASSED" ? 100 : 0, info: emp.cbt_score !== null ? `Score: ${emp.cbt_score}%` : "No CBT Score" },
                { title: "Practical Competency Assessment", status: emp.assessment_status === "Approved" ? 100 : 0, info: emp.practical_score !== null ? `Practical Marks: ${emp.practical_score}/100` : "No Assessment" }
              ].map(item => (
                <div key={item.title}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                    <span>{item.title}</span>
                    <strong style={{ color: item.status === 100 ? "#16a34a" : "#dc2626" }}>{item.info}</strong>
                  </div>
                  <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${item.status}%`, background: item.status === 100 ? "#16a34a" : "#dc2626", borderRadius: "999px" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* History log block */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px", gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1.5px solid #cbd5e1", paddingBottom: "10px", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
                <FileText size={16} color="#2563eb" />
                Safety Evaluation History Log (Click row for full scorecard)
              </h3>
            </div>

            {/* Date filter inputs */}
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Start Date</label>
                <input 
                  type="date" 
                  value={historyStartDate}
                  onChange={e => setHistoryStartDate(e.target.value)}
                  style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>End Date</label>
                <input 
                  type="date" 
                  value={historyEndDate}
                  onChange={e => setHistoryEndDate(e.target.value)}
                  style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>
              <button 
                type="button"
                className="sdom-btn-outline"
                style={{ padding: "7px 14px", fontSize: "12px", cursor: "pointer", fontWeight: "700" }}
                onClick={() => { setHistoryStartDate(""); setHistoryEndDate(""); }}
              >
                Clear Filters
              </button>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", marginLeft: "auto", alignSelf: "center" }}>
                Found {
                  employeeHistory.filter(h => {
                    if (!h.date) return true;
                    if (historyStartDate && h.date < historyStartDate) return false;
                    if (historyEndDate && h.date > historyEndDate) return false;
                    return true;
                  }).length
                } past reports
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #cbd5e1", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px", fontSize: "11.5px", fontWeight: "700", color: "#475569" }}>Assessment Date</th>
                    <th style={{ padding: "10px 12px", fontSize: "11.5px", fontWeight: "700", color: "#475569" }}>CBT Score</th>
                    <th style={{ padding: "10px 12px", fontSize: "11.5px", fontWeight: "700", color: "#475569" }}>Practical Score</th>
                    <th style={{ padding: "10px 12px", fontSize: "11.5px", fontWeight: "700", color: "#475569" }}>Composite Final</th>
                    <th style={{ padding: "10px 12px", fontSize: "11.5px", fontWeight: "700", color: "#475569" }}>Grade Category</th>
                    <th style={{ padding: "10px 12px", fontSize: "11.5px", fontWeight: "700", color: "#475569" }}>Assessed By</th>
                    <th style={{ padding: "10px 12px", fontSize: "11.5px", fontWeight: "700", color: "#475569" }}>Evaluator Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeHistory.filter(h => {
                    if (!h.date) return true;
                    if (historyStartDate && h.date < historyStartDate) return false;
                    if (historyEndDate && h.date > historyEndDate) return false;
                    return true;
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#64748b", fontStyle: "italic", fontSize: "13px" }}>
                        No safety evaluation history records found for the specified period.
                      </td>
                    </tr>
                  ) : (
                    employeeHistory.filter(h => {
                      if (!h.date) return true;
                      if (historyStartDate && h.date < historyStartDate) return false;
                      if (historyEndDate && h.date > historyEndDate) return false;
                      return true;
                    }).map((h) => (
                      <tr 
                        key={h.result_id || h.assessment_id} 
                        onClick={() => setSelectedPastScorecard(h)}
                        style={{ cursor: "pointer", borderBottom: "1px solid #e2e8f0" }}
                        onMouseOver={el => el.currentTarget.style.background = "#f8fafc"}
                        onMouseOut={el => el.currentTarget.style.background = "none"}
                      >
                        <td style={{ padding: "10px 12px", fontWeight: "700", color: "#2563eb", fontSize: "13px" }}>{h.date}</td>
                        <td style={{ padding: "10px 12px", fontSize: "13px" }}>{h.cbt_score !== null ? `${h.cbt_score}%` : "—"}</td>
                        <td style={{ padding: "10px 12px", fontSize: "13px" }}>{h.practical_score !== null ? `${h.practical_score}/100` : "—"}</td>
                        <td style={{ padding: "10px 12px", fontSize: "13px", fontWeight: "900" }}>{h.totalScore}/100</td>
                        <td style={{ padding: "10px 12px" }}>{catBadge(h.category || "Unassigned")}</td>
                        <td style={{ padding: "10px 12px", fontSize: "13px" }}>{h.assessedBy || "System"}</td>
                        <td style={{ padding: "10px 12px", fontSize: "12.5px", color: "#475569", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {h.remarks || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px", gridColumn: "1 / -1" }}>
            <DossierTab employeeId={emp.employee_id} employeeName={emp.employee_name} />
          </div>
        </div>

        {/* Historical Scorecard Detail Modal */}
        {selectedPastScorecard && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15,23,42,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px"
          }}>
            <div style={{
              background: "white",
              borderRadius: "16px",
              maxWidth: "600px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              border: "1px solid #e2e8f0",
              overflow: "hidden"
            }}>
              <div style={{
                background: "#1e3a8a",
                color: "white",
                padding: "16px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Historical Safety Scorecard
                  </h3>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>Evaluation Date: {selectedPastScorecard.date}</span>
                </div>
                <button 
                  onClick={() => setSelectedPastScorecard(null)}
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "none",
                    color: "white",
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div>
                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Safety Category Grade</div>
                    <div style={{ marginTop: "4px" }}>{catBadge(selectedPastScorecard.category || "Unassigned")}</div>
                  </div>
                  <div style={{ textTransform: "none", textAlign: "right" }}>
                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Evaluated By</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", marginTop: "4px" }}>{selectedPastScorecard.assessedBy || "System"}</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700" }}>CBT SCORE</span>
                    <strong style={{ display: "block", fontSize: "18px", color: "#0f172a", marginTop: "4px" }}>
                      {selectedPastScorecard.cbt_score !== null ? `${selectedPastScorecard.cbt_score}%` : "—"}
                    </strong>
                  </div>
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700" }}>PRACTICAL</span>
                    <strong style={{ display: "block", fontSize: "18px", color: "#0f172a", marginTop: "4px" }}>
                      {selectedPastScorecard.practical_score !== null ? `${selectedPastScorecard.practical_score}/100` : "—"}
                    </strong>
                  </div>
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700" }}>COMPOSITE</span>
                    <strong style={{ display: "block", fontSize: "18px", color: "#2563eb", marginTop: "4px" }}>
                      {selectedPastScorecard.totalScore}/100
                    </strong>
                  </div>
                </div>

                <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "14px", marginBottom: "16px" }}>
                  <h4 style={{ margin: "0 0 6px 0", fontSize: "12.5px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase" }}>
                    Evaluation Comments &amp; Remarks
                  </h4>
                  <p style={{ margin: 0, fontSize: "13.5px", color: "#475569", lineHeight: "1.5" }}>
                    {selectedPastScorecard.remarks || "No evaluation comments logged for this assessment period."}
                  </p>
                </div>

                {selectedPastScorecard.fitness_status && (
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "12px", borderRadius: "8px", fontSize: "13px", color: "#1e3a8a" }}>
                    <strong>Medical Fitness:</strong> {selectedPastScorecard.fitness_status}
                  </div>
                )}
              </div>

              <div style={{ padding: "16px 24px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
                <button 
                  type="button"
                  className="sdom-btn-outline" 
                  onClick={() => setSelectedPastScorecard(null)}
                  style={{ padding: "8px 18px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
                >
                  Close Scorecard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Pre-compiled charts configurations
  const dashboardStats = dashboardData || {};
  const cbtStats = cbtData || { passed_count: 0, failed_count: 0, station_wise_breakdown: [] };
  const pmeStats = pmeData || { valid_pme: 0, expired_pme: 0, upcoming_pme: 0, station_wise_pme_breakdown: [] };
  const refStats = refData || { valid_ref: 0, expired_ref: 0, upcoming_ref: 0, station_wise_ref_breakdown: [] };
  const asmtStats = assessmentsData || { status_counts: { total: 0, approved: 0, pending: 0, rejected: 0 }, grade_distribution: [] };
  const rskStats = riskData || { database_risk_distribution: [], computed_safety_risk_distribution: { high: 0, medium: 0, low: 0 }, category_distribution: [] };

  return (
    <div style={{ background: "#f8fafc", padding: "24px", borderRadius: "16px", minHeight: "100%", width: "100%", boxSizing: "border-box" }}>
      {/* Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px" }}>{t("reports.title") || "Safety Reports & Analytics Hub"}</h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>{t("reports.subtitle") || "Live database auditing and metrics aggregate directly from PostgreSQL tables."}</p>
        </div>
        <button 
          onClick={loadAllReports} 
          className="sdom-btn-outline" 
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", height: "40px" }}
        >
          <RefreshCw size={14} /> {t("reports.syncDbData") || "Sync DB Data"}
        </button>
      </div>

      {/* Primary Sub-Tabs Navigation */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #e2e8f0", paddingBottom: "2px", marginBottom: "24px", overflowX: "auto", flexWrap: "wrap" }}>
        {[
          { id: "overview", label: t("reports.tabOverview") || "Overview", icon: BarChart3 },
          { id: "cbt", label: t("reports.tabCbt") || "CBT Exams", icon: FileText },
          { id: "pme", label: t("reports.tabPme") || "PME (Medical)", icon: Activity },
          { id: "ref", label: t("reports.tabRef") || "Refresher", icon: Clock },
          { id: "assessments", label: t("reports.tabAssessments") || "Assessments", icon: Award },
          { id: "risk", label: t("reports.tabRisk") || "Risk & Grade Profile", icon: ShieldAlert },
          { id: "ledger", label: t("reports.tabLedger") || "Compliance Ledger", icon: FileBarChart2 }
        ].map(tItem => {
          const Icon = tItem.icon;
          const active = activeTab === tItem.id;
          return (
            <button
              key={tItem.id}
              onClick={() => {
                setActiveTab(tItem.id);
                // Trigger query sync on tab change if needed
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                border: "none",
                background: "none",
                fontWeight: "700",
                fontSize: "14px",
                color: active ? "#2563eb" : "#64748b",
                borderBottom: active ? "3px solid #2563eb" : "3px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <Icon size={16} />
              {tItem.label}
            </button>
          );
        })}
      </div>

      {/* Main Tab Views */}
      <div className="animate-fade-in">

        {/* 1. OVERVIEW (DASHBOARD) TAB */}
        {activeTab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "24px" }}>
              <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Active Employees</span>
                  <Users size={20} style={{ color: "#2563eb" }} />
                </div>
                <strong style={{ display: "block", fontSize: "28px", color: "#0f172a", marginTop: "8px" }}>{dashboardStats.total_employees}</strong>
              </div>
              <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Tracked Stations</span>
                  <Activity size={20} style={{ color: "#16a34a" }} />
                </div>
                <strong style={{ display: "block", fontSize: "28px", color: "#0f172a", marginTop: "8px" }}>{dashboardStats.total_stations}</strong>
              </div>
              <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Total Assessments</span>
                  <Award size={20} style={{ color: "#8b5cf6" }} />
                </div>
                <strong style={{ display: "block", fontSize: "28px", color: "#0f172a", marginTop: "8px" }}>{dashboardStats.total_assessments}</strong>
              </div>
              <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>CBT Attempts</span>
                  <FileText size={20} style={{ color: "#d97706" }} />
                </div>
                <strong style={{ display: "block", fontSize: "28px", color: "#0f172a", marginTop: "8px" }}>{dashboardStats.total_cbt_attempts}</strong>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
              <div style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #cbd5e1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", marginBottom: "16px", alignSelf: "flex-start" }}>Safety Compliance Gauge</h3>
                
                {/* Visual Gauge */}
                <div style={{ position: "relative", width: 180, height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="180" height="180" viewBox="0 0 180 180">
                    <circle cx="90" cy="90" r="75" stroke="#e2e8f0" strokeWidth="15" fill="transparent" />
                    <circle 
                      cx="90" 
                      cy="90" 
                      r="75" 
                      stroke={dashboardStats.overall_compliance_percentage >= 80 ? "#16a34a" : dashboardStats.overall_compliance_percentage >= 50 ? "#2563eb" : "#dc2626"} 
                      strokeWidth="15" 
                      fill="transparent" 
                      strokeDasharray={2 * Math.PI * 75}
                      strokeDashoffset={2 * Math.PI * 75 * (1 - (dashboardStats.overall_compliance_percentage || 0) / 100)}
                      strokeLinecap="round"
                      transform="rotate(-90 90 90)"
                    />
                  </svg>
                  <div style={{ position: "absolute", textAlign: "center" }}>
                    <span style={{ display: "block", fontSize: "32px", fontWeight: "900", color: "#0f172a" }}>{dashboardStats.overall_compliance_percentage}%</span>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Compliance</span>
                  </div>
                </div>
              </div>

              <div style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>Compliance Methodology</h3>
                <p style={{ color: "#475569", fontSize: "14px", lineHeight: "1.6" }}>
                  Every active Pointsman in the safety critical roster is evaluated against four distinct compliance pillars:
                </p>
                <ul style={{ color: "#475569", fontSize: "13px", lineHeight: "2.0", paddingLeft: "20px", marginTop: "8px" }}>
                  <li><strong>PME Clearance (25%)</strong>: Periodic Medical Exam is current.</li>
                  <li><strong>Refresher Training (25%)</strong>: Refresher course is current.</li>
                  <li><strong>CBT Exam (25%)</strong>: Latest CBT status is completed and PASSED.</li>
                  <li><strong>Practical Assessment (25%)</strong>: Formally approved by a Station Master/Inspector.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 2. CBT EXAMS TAB */}
        {activeTab === "cbt" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "24px" }}>
              <div style={{ background: "white", padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>CBT Total Attempts</span>
                <strong style={{ display: "block", fontSize: "22px", color: "#0f172a", marginTop: "4px" }}>{cbtStats.total_attempts}</strong>
              </div>
              <div style={{ background: "white", padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1", borderLeft: "4px solid #16a34a" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Passed (Pass %)</span>
                <strong style={{ display: "block", fontSize: "22px", color: "#16a34a", marginTop: "4px" }}>{cbtStats.passed_count} ({cbtStats.pass_percentage}%)</strong>
              </div>
              <div style={{ background: "white", padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1", borderLeft: "4px solid #dc2626" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Failed (Fail %)</span>
                <strong style={{ display: "block", fontSize: "22px", color: "#dc2626", marginTop: "4px" }}>{cbtStats.failed_count} ({cbtStats.fail_percentage}%)</strong>
              </div>
              <div style={{ background: "white", padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Average Exam Score</span>
                <strong style={{ display: "block", fontSize: "22px", color: "#2563eb", marginTop: "4px" }}>{cbtStats.average_score}%</strong>
              </div>
            </div>

            {/* CBT empty states and data states */}
            {cbtStats.total_attempts === 0 ? (
              <div style={{ background: "white", padding: "40px", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                <FileText size={40} style={{ color: "#94a3b8", marginBottom: "12px" }} />
                <h4 style={{ color: "#475569", fontWeight: "700" }}>No Exam Attempts Logged</h4>
                <p style={{ color: "#94a3b8", fontSize: "13px" }}>There are no completed exam attempts logged in the database.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "20px" }}>
                <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginBottom: "16px" }}>CBT Outcome Distribution</h3>
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "PASSED", value: cbtStats.passed_count },
                            { name: "FAILED", value: cbtStats.failed_count }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#16a34a" />
                          <Cell fill="#dc2626" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginBottom: "16px" }}>Station-wise CBT Performance</h3>
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cbtStats.station_wise_breakdown}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="station_code" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="average_score" fill="#2563eb" radius={[4, 4, 0, 0]} name="Average Score %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Performance tables */}
            {cbtStats.total_attempts > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
                <div style={{ background: "white", padding: "16px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "#16a34a", fontSize: "13px", fontWeight: "800" }}>TOP PERFORMERS (CBT)</h4>
                  <div style={{ overflowX: "auto" }}>
                    <table className="sdom-table" style={{ width: "100%" }}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Station</th>
                          <th>Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cbtStats.top_10_employees.map((row, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: "700" }}>{row.employee_name}</td>
                            <td>{row.station_name || "—"}</td>
                            <td style={{ color: "#16a34a", fontWeight: "800" }}>{row.score}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ background: "white", padding: "16px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "#dc2626", fontSize: "13px", fontWeight: "800" }}>NEEDS IMPROVEMENT (CBT)</h4>
                  <div style={{ overflowX: "auto" }}>
                    <table className="sdom-table" style={{ width: "100%" }}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Station</th>
                          <th>Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cbtStats.bottom_10_employees.map((row, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: "700" }}>{row.employee_name}</td>
                            <td>{row.station_name || "—"}</td>
                            <td style={{ color: "#dc2626", fontWeight: "800" }}>{row.score}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. PME MEDICAL POSITION */}
        {activeTab === "pme" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
              <div style={{ background: "white", padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1", borderLeft: "4px solid #16a34a" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>PME Valid (FIT)</span>
                <strong style={{ display: "block", fontSize: "22px", color: "#16a34a", marginTop: "4px" }}>{pmeStats.valid_pme} Pointsmen</strong>
              </div>
              <div style={{ background: "white", padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1", borderLeft: "4px solid #dc2626" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>PME Expired (Overdue)</span>
                <strong style={{ display: "block", fontSize: "22px", color: "#dc2626", marginTop: "4px" }}>{pmeStats.expired_pme} Pointsmen</strong>
              </div>
              <div style={{ background: "white", padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1", borderLeft: "4px solid #d97706" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Upcoming (Within 30 Days)</span>
                <strong style={{ display: "block", fontSize: "22px", color: "#d97706", marginTop: "4px" }}>{pmeStats.upcoming_pme} Pointsmen</strong>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "20px" }}>
              <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #cbd5e1", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginBottom: "16px", alignSelf: "flex-start" }}>PME Distribution</h3>
                <div style={{ height: 220, width: "100%" }}>
                  {pmeStats.valid_pme === 0 && pmeStats.expired_pme === 0 ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b" }}>No PME records generated.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Valid PME", value: pmeStats.valid_pme },
                            { name: "Expired PME", value: pmeStats.expired_pme },
                            { name: "Upcoming (30d)", value: pmeStats.upcoming_pme }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#16a34a" />
                          <Cell fill="#dc2626" />
                          <Cell fill="#d97706" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Station wise PME summary */}
              <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>Station-wise Medical Statuses</h3>
                <div style={{ overflowY: "auto", maxHeight: "240px" }}>
                  <table className="sdom-table" style={{ width: "100%" }}>
                    <thead>
                      <tr>
                        <th>Station</th>
                        <th>Total</th>
                        <th>Valid</th>
                        <th>Expired</th>
                        <th>Upcoming</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pmeStats.station_wise_pme_breakdown.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: "700" }}>{row.station_name}</td>
                          <td>{row.total_employees}</td>
                          <td style={{ color: "#16a34a", fontWeight: "700" }}>{row.valid_count}</td>
                          <td style={{ color: "#dc2626", fontWeight: "700" }}>{row.expired_count}</td>
                          <td style={{ color: "#d97706", fontWeight: "700" }}>{row.upcoming_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. REFRESHER TRAINING POSITION */}
        {activeTab === "ref" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
              <div style={{ background: "white", padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1", borderLeft: "4px solid #16a34a" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>REF Valid (Cleared)</span>
                <strong style={{ display: "block", fontSize: "22px", color: "#16a34a", marginTop: "4px" }}>{refStats.valid_ref} Pointsmen</strong>
              </div>
              <div style={{ background: "white", padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1", borderLeft: "4px solid #dc2626" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>REF Expired (Overdue)</span>
                <strong style={{ display: "block", fontSize: "22px", color: "#dc2626", marginTop: "4px" }}>{refStats.expired_ref} Pointsmen</strong>
              </div>
              <div style={{ background: "white", padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1", borderLeft: "4px solid #d97706" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Upcoming (Within 30 Days)</span>
                <strong style={{ display: "block", fontSize: "22px", color: "#d97706", marginTop: "4px" }}>{refStats.upcoming_ref} Pointsmen</strong>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "20px" }}>
              <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #cbd5e1", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginBottom: "16px", alignSelf: "flex-start" }}>Refresher Distribution</h3>
                <div style={{ height: 220, width: "100%" }}>
                  {refStats.valid_ref === 0 && refStats.expired_ref === 0 ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b" }}>No refresher records generated.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Valid REF", value: refStats.valid_ref },
                            { name: "Expired REF", value: refStats.expired_ref },
                            { name: "Upcoming (30d)", value: refStats.upcoming_ref }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#16a34a" />
                          <Cell fill="#dc2626" />
                          <Cell fill="#d97706" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Station wise REF summary */}
              <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>Station-wise Refresher Summary</h3>
                <div style={{ overflowY: "auto", maxHeight: "240px" }}>
                  <table className="sdom-table" style={{ width: "100%" }}>
                    <thead>
                      <tr>
                        <th>Station</th>
                        <th>Total</th>
                        <th>Valid</th>
                        <th>Expired</th>
                        <th>Upcoming</th>
                      </tr>
                    </thead>
                    <tbody>
                      {refStats.station_wise_ref_breakdown.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: "700" }}>{row.station_name}</td>
                          <td>{row.total_employees}</td>
                          <td style={{ color: "#16a34a", fontWeight: "700" }}>{row.valid_count}</td>
                          <td style={{ color: "#dc2626", fontWeight: "700" }}>{row.expired_count}</td>
                          <td style={{ color: "#d97706", fontWeight: "700" }}>{row.upcoming_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. ASSESSMENTS TAB */}
        {activeTab === "assessments" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
              <div style={{ background: "white", padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Total Assessments</span>
                <strong style={{ display: "block", fontSize: "22px", color: "#0f172a", marginTop: "4px" }}>{asmtStats.status_counts.total}</strong>
              </div>
              <div style={{ background: "white", padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1", borderLeft: "4px solid #16a34a" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Approved Checks</span>
                <strong style={{ display: "block", fontSize: "22px", color: "#16a34a", marginTop: "4px" }}>{asmtStats.status_counts.approved}</strong>
              </div>
              <div style={{ background: "white", padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1", borderLeft: "4px solid #d97706" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Pending Review</span>
                <strong style={{ display: "block", fontSize: "22px", color: "#d97706", marginTop: "4px" }}>{asmtStats.status_counts.pending}</strong>
              </div>
              <div style={{ background: "white", padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1", borderLeft: "4px solid #dc2626" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Rejected Audits</span>
                <strong style={{ display: "block", fontSize: "22px", color: "#dc2626", marginTop: "4px" }}>{asmtStats.status_counts.rejected}</strong>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "20px" }}>
              <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginBottom: "16px" }}>Assessment Status Analytics</h3>
                <div style={{ height: 220 }}>
                  {asmtStats.status_counts.total === 0 ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b" }}>No assessments logged.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Approved", value: asmtStats.status_counts.approved },
                            { name: "Pending / Submitted", value: asmtStats.status_counts.pending },
                            { name: "Rejected", value: asmtStats.status_counts.rejected }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#16a34a" />
                          <Cell fill="#d97706" />
                          <Cell fill="#dc2626" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginBottom: "16px" }}>Assessment Scores Analysis</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "12px" }}>
                  <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", borderLeft: "4px solid #2563eb" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>Average Practical Marks</span>
                    <strong style={{ display: "block", fontSize: "24px", color: "#2563eb", marginTop: "4px" }}>
                      {asmtStats.average_practical_score} / 100
                    </strong>
                  </div>
                  <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", borderLeft: "4px solid #8b5cf6" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>Average Final Composite Score</span>
                    <strong style={{ display: "block", fontSize: "24px", color: "#8b5cf6", marginTop: "4px" }}>
                      {asmtStats.average_final_score} / 100
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. RISK & GRADE PROFILE TAB */}
        {activeTab === "risk" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "20px" }}>
              <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginBottom: "16px" }}>Safety Risk Profiling (Computed)</h3>
                <div style={{ height: 200 }}>
                  {rskStats.computed_safety_risk_distribution.high === 0 && rskStats.computed_safety_risk_distribution.low === 0 ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b" }}>No computed safety risks.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Low Risk", value: rskStats.computed_safety_risk_distribution.low },
                            { name: "Medium Risk", value: rskStats.computed_safety_risk_distribution.medium },
                            { name: "High Risk", value: rskStats.computed_safety_risk_distribution.high }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          dataKey="value"
                        >
                          <Cell fill="#16a34a" />
                          <Cell fill="#d97706" />
                          <Cell fill="#dc2626" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginBottom: "16px" }}>Safety Grade Classification</h3>
                <div style={{ height: 200 }}>
                  {rskStats.category_distribution.length === 0 ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b" }}>No grade data available.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={rskStats.category_distribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category_grade" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Staff Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
              <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>Dynamic Safety Score Classification (Grades)</h3>
                <div style={{ overflowX: "auto" }}>
                  <table className="sdom-table" style={{ width: "100%" }}>
                    <thead>
                      <tr>
                        <th>Grade</th>
                        <th>Pointsman Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rskStats.grade_distribution.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: "700" }}>Grade {row.grade_name}</td>
                          <td>{row.count} staff</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>Risk Classification Definitions</h3>
                <ul style={{ color: "#475569", fontSize: "13px", lineHeight: "1.8", paddingLeft: "16px" }}>
                  <li><strong style={{ color: "#dc2626" }}>High Risk</strong>: PME medical status expired, Refresher safety course expired, or practical assessment score is poor (&lt; 50/100).</li>
                  <li><strong style={{ color: "#d97706" }}>Medium Risk</strong>: PME and Refresher valid, but final evaluation composite score needs improvement (&lt; 80/100).</li>
                  <li><strong style={{ color: "#16a34a" }}>Low Risk</strong>: PME and Refresher completely valid, with an outstanding practical final score (&ge; 80/100).</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 7. DETAILED COMPLIANCE LEDGER TAB */}
        {activeTab === "ledger" && (
          <div>
            {/* Filters */}
            <div style={{ display: "flex", gap: "16px", background: "white", padding: "16px", borderRadius: "12px", border: "1px solid #cbd5e1", marginBottom: "20px", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 2, minWidth: "200px" }}>
                <label style={{ fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>Search by Name or HRMS ID</label>
                <div style={{ position: "relative" }}>
                  <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                  <input
                    type="text"
                    placeholder="Type name or HRMS ID..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ width: "100%", height: "38px", padding: "0 12px 0 36px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "140px" }}>
                <label style={{ fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>Station Filter</label>
                <select 
                  value={selectedStation} 
                  onChange={e => {
                    setSelectedStation(e.target.value);
                    handleFilterChange(e.target.value, selectedRole);
                  }} 
                  style={{ height: "38px", padding: "0 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600" }}
                >
                  <option value="All">All Stations</option>
                  {stationOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "140px" }}>
                <label style={{ fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>Role Filter</label>
                <select 
                  value={selectedRole} 
                  onChange={e => {
                    setSelectedRole(e.target.value);
                    handleFilterChange(selectedStation, e.target.value);
                  }} 
                  style={{ height: "38px", padding: "0 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600" }}
                >
                  <option value="All">All Roles</option>
                  {roleOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>

              <button
                onClick={handleExportCSV}
                style={{
                  height: "38px",
                  padding: "0 16px",
                  background: "#16a34a",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "700",
                  cursor: "pointer",
                  fontSize: "13px"
                }}
              >
                Export Ledger (CSV)
              </button>
            </div>

            {/* Ledger table */}
            <div style={{ background: "white", border: "1px solid #cbd5e1", padding: "20px", borderRadius: "12px" }}>
              <div style={{ marginBottom: 12, fontWeight: 700, color: "#475569" }}>
                Showing {filteredEmployees.length} active roster staff
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="sdom-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1.5px solid #cbd5e1" }}>
                      <th style={{ padding: "12px 14px", fontSize: "12px" }}>Staff Name</th>
                      <th style={{ padding: "12px 14px", fontSize: "12px" }}>HRMS ID</th>
                      <th style={{ padding: "12px 14px", fontSize: "12px" }}>Designation</th>
                      <th style={{ padding: "12px 14px", fontSize: "12px" }}>Station</th>
                      <th style={{ padding: "12px 14px", fontSize: "12px" }}>PME Medical</th>
                      <th style={{ padding: "12px 14px", fontSize: "12px" }}>Refresher</th>
                      <th style={{ padding: "12px 14px", fontSize: "12px" }}>CBT Exam</th>
                      <th style={{ padding: "12px 14px", fontSize: "12px" }}>Practical Audit</th>
                      <th style={{ padding: "12px 14px", fontSize: "12px" }}>Status &amp; Action</th>
                      <th style={{ padding: "12px 14px", fontSize: "12px" }}>Overall Compliance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: "center", color: "#64748b", padding: "32px" }}>
                          No Pointsmen roster records matched search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map(e => (
                        <tr 
                          key={e.employee_id} 
                          style={{ borderBottom: "1px solid #f1f5f9" }}
                          onMouseOver={el => el.currentTarget.style.background = "#f8fafc"}
                          onMouseOut={el => el.currentTarget.style.background = "none"}
                        >
                          <td 
                            onClick={() => setSelectedReportUserId(e.employee_id)}
                            style={{ padding: "12px 14px", fontWeight: 700, color: "#2563eb", cursor: "pointer" }}
                          >
                            {e.employee_name}
                          </td>
                          <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: "13px" }}>{e.hrms_id}</td>
                          <td style={{ padding: "12px 14px" }}>{e.designation}</td>
                          <td style={{ padding: "12px 14px", fontWeight: "700" }}>{e.station_name || "Unassigned"}</td>
                          <td style={{ padding: "12px 14px" }}>{statusBadge(e.pme_status)}</td>
                          <td style={{ padding: "12px 14px" }}>{statusBadge(e.ref_status)}</td>
                          <td style={{ padding: "12px 14px" }}>{statusBadge(e.cbt_status)}</td>
                          <td style={{ padding: "12px 14px" }}>{statusBadge(e.assessment_status || "Pending")}</td>
                          <td style={{ padding: "12px 14px" }} onClick={ev => ev.stopPropagation()}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {statusBadge(e.employee_status || "Active")}
                              {userRole === "Super Admin" ? (
                                <button
                                  type="button"
                                  onClick={async (ev) => {
                                    ev.stopPropagation();
                                    await handleToggleStatus(e.employee_id, e.employee_status || "Active");
                                  }}
                                  disabled={statusTogglingId === e.employee_id}
                                  style={{
                                    padding: "4px 8px",
                                    fontSize: "11px",
                                    fontWeight: "800",
                                    color: "white",
                                    background: (e.employee_status || "Active") === "Active" ? "#ef4444" : "#10b981",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    opacity: statusTogglingId === e.employee_id ? 0.6 : 1
                                  }}
                                >
                                  {statusTogglingId === e.employee_id ? "..." : (e.employee_status || "Active") === "Active" ? "Deactivate" : "Activate"}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  title="Restricted to Super Admin"
                                  style={{
                                    padding: "4px 8px",
                                    fontSize: "11px",
                                    fontWeight: "800",
                                    color: "#94a3b8",
                                    background: "#e2e8f0",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "not-allowed"
                                  }}
                                >
                                  {(e.employee_status || "Active") === "Active" ? "Deactivate" : "Activate"}
                                </button>
                              )}
                            </div>
                          </td>
                          <td 
                            onClick={() => setSelectedReportUserId(e.employee_id)}
                            style={{ padding: "12px 14px", fontWeight: "900", color: e.compliance_percentage >= 80 ? "#16a34a" : e.compliance_percentage >= 50 ? "#2563eb" : "#dc2626", cursor: "pointer" }}
                          >
                            {e.compliance_percentage}%
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
