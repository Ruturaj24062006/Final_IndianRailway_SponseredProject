import { useState, useEffect } from "react";
import { Search, Plus, Trash2, Edit, RefreshCw, ChevronLeft, ChevronRight, Star, HeartHandshake, Eye, Award, Clock, FileCheck, CheckCircle2, Lock, Paperclip, ArrowLeft, UserPlus } from "lucide-react";
import { getEmployeeHistory } from "../services/employeeService";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from "recharts";
import CommonUserModal from "./CommonUserModal";

const DEFAULT_STATION_TI_MAP = {
  "Parbhani Junction": "TI PAR",
  "Amla Junction": "TI AMLA",
  "Badnera Junction": "TI NGP",
  "Akola Junction": "TI PAR",
  "Nagpur Junction": "TI NGP",
  "Wardha Junction": "TI NGP",
  "Betul Station": "TI AMLA",
  "Itarsi Junction": "TI AMLA",
  "Chandrapur Station": "TI NGP",
  "Gondia Junction": "TI NGP",
  "Dhamangaon Station": "TI NGP",
  "Pulgaon Junction": "TI NGP"
};

const ROLE_MAP = {
  pointsmen: "Pointsman",
  Pointsman: "Pointsman",
  sm: "Station Master",
  "Station Master": "Station Master",
  ss: "Station Superintendent",
  "Station Superintendent": "Station Superintendent",
  tm: "Train Manager",
  "Train Manager": "Train Manager",
  ti: "Traffic Inspector",
  "Traffic Inspector": "Traffic Inspector"
};

const DEFAULT_MONTHLY_TREND = [
  { month: "Dec'25", score: 81, safety: 80 },
  { month: "Jan'26", score: 83, safety: 82 },
  { month: "Feb'26", score: 85, safety: 85 },
  { month: "Mar'26", score: 87, safety: 88 },
  { month: "Apr'26", score: 89, safety: 91 },
  { month: "May'26", score: 91, safety: 94 }
];

export default function CommonRoleView({
  roleKey,
  title,
  users = [],
  setUsers = () => {},
  stations = [],
  view,
  setView,
  editingUser,
  setEditingUser,
  transferringUser,
  setTransferringUser,
  showAddUserModal,
  setShowAddUserModal,
  handleEditUser = () => {},
  handleTransferClick = () => {},
  handleDeleteUser = () => {},
  newUserData,
  setNewUserData,
  handleAddUserSubmit = () => {},
  myStations = [],
  roleF,
  setRoleF,
  MONTHLY_TREND = DEFAULT_MONTHLY_TREND,
  getCat = s => s >= 80 ? "A" : s >= 50 ? "B" : s >= 26 ? "C" : "D",
  getUserRisk = u => u.pmeStatus === "Overdue" || u.refStatus === "Expired" || u.score < 50 ? "High" : u.score >= 80 ? "Low" : "Medium",
  riskBadge = r => {
    const map = { Low: "sdom-badge-success", Medium: "sdom-badge-warning", High: "sdom-badge-danger" };
    return <span className={`sdom-badge ${map[r] || "sdom-badge-neutral"}`}>{r}</span>;
  },
  catBadge = c => {
    const map = { A: "sdom-badge-success", B: "sdom-badge-info", C: "sdom-badge-warning", D: "sdom-badge-danger" };
    return <span className={`sdom-badge ${map[c] || "sdom-badge-neutral"}`}>{c}</span>;
  },
  statusBadge = s => {
    const map = { 
      Approved: "sdom-badge-success", 
      Completed: "sdom-badge-success", 
      Active: "sdom-badge-success", 
      Pending: "sdom-badge-warning", 
      Submitted: "sdom-badge-warning", 
      Rejected: "sdom-badge-danger", 
      Expired: "sdom-badge-danger", 
      Overdue: "sdom-badge-danger" 
    };
    return <span className={`sdom-badge ${map[s] || "sdom-badge-neutral"}`}>{s}</span>;
  },
  stationTiMap = DEFAULT_STATION_TI_MAP,
  saveEditedUser = () => {},
  confirmTransfer = () => {},
}) {

  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (view?.type === "staffDetail" && view.data) {
      const empId = view.data.dbId || view.data.id;
      if (empId) {
        setHistoryLoading(true);
        getEmployeeHistory(empId)
          .then(data => {
            setAssessmentHistory(data || []);
            setHistoryLoading(false);
          })
          .catch(err => {
            console.error("Failed to load employee history:", err);
            setAssessmentHistory([]);
            setHistoryLoading(false);
          });
      } else {
        setAssessmentHistory([]);
      }
    } else {
      setAssessmentHistory([]);
    }
  }, [view]);

  const renderStaffDetail = (s) => {
    const computedRisk = getUserRisk(s);
    const scoreData = [...assessmentHistory]
      .reverse()
      .map(item => ({
        month: item.assessmentPeriod || item.date || "Exam",
        score: parseFloat(item.totalScore) || 0
      }));
    
    return (
      <div className="sdom-fade animate-fade-in">
        <div style={{ marginBottom: 24 }}>
          <button className="sdom-back-btn" onClick={() => {
            if (view?.returnTo === "stationDetail") {
              setView({ type: "stationDetail", data: view.stationData });
            } else {
              setView(null);
            }
          }} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: 700 }}>
            <ArrowLeft size={16} /> Back to List
          </button>
        </div>

        <div className="sdom-station-header" style={{ marginBottom: 24 }}>
          <div className="sdom-station-header-meta">
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Staff Profile</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 4 }}>{s.name}</div>
            <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>{ROLE_MAP[s.role] || s.role} &bull; {s.station} &bull; {s.zone || "Central Railway"}</div>
            <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
              {catBadge(s.cat || getCat(s.score))}
              {riskBadge(computedRisk)}
              {statusBadge(s.status || "Active")}
            </div>
          </div>
          <div className="sdom-station-header-stats">
            <div className="sdom-station-header-stat">
              <span className="val">{s.score}%</span>
              <span className="lbl">Latest Score</span>
            </div>
            <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
            <div className="sdom-station-header-stat">
              <span className="val">{s.contact || "—"}</span>
              <span className="lbl">Contact</span>
            </div>
            <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
            <div className="sdom-station-header-stat">
              <span className="val">{s.lastAssessDate || s.lastDate || "—"}</span>
              <span className="lbl">Last Assessment</span>
            </div>
          </div>
        </div>

        <div className="sdom-row-2">
          <div className="sdom-chart-card">
            <div className="sdom-chart-title" style={{ marginBottom: "16px" }}>Personal &amp; Professional Details</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', paddingBottom: '20px' }}>
              {[
                ["Employee ID / HRMS ID", s.id || s.hrmsId],
                ["Designation", ROLE_MAP[s.role] || s.role],
                ["Mobile Number", s.contact || "N/A"],
                ["Email ID", s.email || `${(s.id || s.hrmsId)?.toLowerCase()}@rail.in`],
                ["Account Status", s.status || "Active"],
                ["Current Zone", s.zone || "Central Railway"],
                ["Current Division", s.division || "Nagpur Division"],
                ["Current Station Placement", s.station],
                ["Reporting Officer", s.reportingAom || "TI R. Khan (Safety)"]
              ].map(([lbl, val]) => (
                <div key={lbl} style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{lbl}</div>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{val}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' }}>
                Operational Profile Specifications
              </h4>
              
              {(s.role === "Pointsman" || s.role === "pointsmen") && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', fontSize: '13px' }}>
                  <div><strong>Reporting SM:</strong><div style={{fontWeight: 700, color: "#1e3a5f", marginTop: 4}}>{s.reportingSm || "S. Deshmukh (SM)"}</div></div>
                  <div><strong>Assigned Shift:</strong><div style={{fontWeight: 700, color: "#1e3a5f", marginTop: 4}}>{s.shift || "Morning Shift (06:00 - 14:00)"}</div></div>
                  <div><strong>Work Location:</strong><div style={{fontWeight: 700, color: "#1e3a5f", marginTop: 4}}>{s.workLocation || "Yard Area"}</div></div>
                </div>
              )}

              {(s.role === "Station Master" || s.role === "sm" || s.role === "Station Superintendent" || s.role === "ss") && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', fontSize: '13px' }}>
                  <div><strong>Operational Station:</strong><div style={{fontWeight: 700, color: "#065f46", marginTop: 4}}>{s.station || "N/A"}</div></div>
                  <div><strong>Operational Division:</strong><div style={{fontWeight: 700, color: "#065f46", marginTop: 4}}>{s.division || "Nagpur Division"}</div></div>
                  <div><strong>Operational Zone:</strong><div style={{fontWeight: 700, color: "#065f46", marginTop: 4}}>{s.zone || "Central Railway"}</div></div>
                </div>
              )}

              {(s.role === "Train Manager" || s.role === "tm") && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', fontSize: '13px' }}>
                  <div><strong>Crew Depot:</strong><div style={{fontWeight: 700, color: "#6b21a8", marginTop: 4}}>{s.workLocation || "Nagpur Depot"}</div></div>
                  <div><strong>Assigned Shift:</strong><div style={{fontWeight: 700, color: "#6b21a8", marginTop: 4}}>{s.shift || "Goods Train Beat"}</div></div>
                  <div><strong>Assigned Section Beats:</strong><div style={{fontWeight: 700, color: "#6b21a8", marginTop: 4}}>{s.reportingSm || "NGP-BSL Section"}</div></div>
                </div>
              )}

              {(s.role === "Traffic Inspector" || s.role === "ti") && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', fontSize: '13px' }}>
                  <div><strong>Jurisdiction:</strong><div style={{fontWeight: 700, color: "#1e3a5f", marginTop: 4}}>{s.jurisdiction || "Parbhani-Amla Section"}</div></div>
                  <div><strong>Division:</strong><div style={{fontWeight: 700, color: "#1e3a5f", marginTop: 4}}>{s.division || "Nagpur Division"}</div></div>
                  <div><strong>Reporting Officer:</strong><div style={{fontWeight: 700, color: "#1e3a5f", marginTop: 4}}>{s.reportingAom || "P. K. Verma (Sr. DOM)"}</div></div>
                </div>
              )}
            </div>
          </div>

          <div className="sdom-chart-card">
            <div className="sdom-chart-title">Score Trend</div>
            <div className="sdom-chart-subtitle">Performance history tracking for this employee</div>
            <div style={{ height: 300 }}>
              {historyLoading ? (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                  Loading history...
                </div>
              ) : scoreData.length === 0 ? (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", borderRadius: 8, border: "1px dashed #cbd5e1", color: "#64748b", fontWeight: 600 }}>
                  Data not available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={11} />
                    <YAxis domain={[40, 100]} fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEditUserModal = () => {
    if (!editingUser) return null;
    return (
      <div className="sdom-modal-overlay" onClick={e => e.target === e.currentTarget && setEditingUser(null)}>
        <div className="sdom-modal" style={{ width: "900px", maxWidth: "95vw" }}>
          <form onSubmit={saveEditedUser} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
              <div style={{
                background: "linear-gradient(135deg, #0d2c4d 0%, #1e40af 100%)",
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(13, 44, 77, 0.2)",
                color: "#ffffff"
              }}>
                <UserPlus size={28} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0d2c4d", letterSpacing: "-0.5px" }}>
                  EDIT SYSTEM USER
                </h2>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                  Role-Based Operational Staff Provisioning &amp; Management Console
                </p>
              </div>
            </div>

            <div>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
                1. General &amp; Contact Information
              </h4>
              <div style={{ height: '1px', background: '#d5dfeb', marginBottom: '16px' }}></div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="sdom-modal-field">
                  <label>Full Name *</label>
                  <input 
                    value={editingUser.name || ""} 
                    onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} 
                    placeholder="Enter full name" 
                    required
                  />
                </div>
                <div className="sdom-modal-field">
                  <label>Mobile Number *</label>
                  <input 
                    value={editingUser.contact || ""} 
                    onChange={e => setEditingUser({ ...editingUser, contact: e.target.value })} 
                    placeholder="Enter 10-digit mobile number" 
                    required
                  />
                </div>
                <div className="sdom-modal-field">
                  <label>HRMS ID / Employee ID *</label>
                  <input 
                    value={editingUser.id || editingUser.hrmsId || ""} 
                    disabled
                  />
                </div>
                <div className="sdom-modal-field">
                  <label>Email ID *</label>
                  <input 
                    value={editingUser.email || ""} 
                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} 
                    placeholder="Enter email address" 
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
                2. Designation &amp; Station Placement Setup
              </h4>
              <div style={{ height: '1px', background: '#d5dfeb', marginBottom: '16px' }}></div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="sdom-modal-field">
                  <label>Role / Designation *</label>
                  <select 
                    value={editingUser.role} 
                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value, designation: e.target.value })}
                    required
                  >
                    <option value="Pointsman">Pointsman</option>
                    <option value="Station Master">Station Master</option>
                    <option value="Station Superintendent">Station Superintendent</option>
                    <option value="Train Manager">Train Manager</option>
                    <option value="Traffic Inspector">Traffic Inspector</option>
                  </select>
                </div>
                <div className="sdom-modal-field">
                  <label>Division *</label>
                  <select 
                    value={editingUser.division || "Nagpur"} 
                    onChange={e => setEditingUser({ ...editingUser, division: e.target.value })}
                  >
                    {["Nagpur", "Pune", "Mumbai", "Solapur", "Bhusawal"].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="sdom-modal-field">
                  <label>Railway Zone *</label>
                  <select 
                    value={editingUser.zone || "Central Railway"} 
                    onChange={e => setEditingUser({ ...editingUser, zone: e.target.value })}
                  >
                    {["Central Railway", "Western Railway", "Northern Railway", "Southern Railway", "Eastern Railway"].map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <div className="sdom-modal-field">
                  <label>Station Name *</label>
                  <select 
                    value={editingUser.station} 
                    onChange={e => setEditingUser({ ...editingUser, station: e.target.value })}
                    required
                  >
                    {(stations.length ? stations : myStations).map(s => <option key={s.id} value={s.name || s.stationName}>{s.name || s.stationName} ({s.code || s.stationCode})</option>)}
                  </select>
                </div>
                <div className="sdom-modal-field">
                  <label>Category *</label>
                  <select 
                    value={editingUser.cat || "A"} 
                    onChange={e => setEditingUser({ ...editingUser, cat: e.target.value })}
                  >
                    <option>A</option><option>B</option><option>C</option><option>D</option>
                  </select>
                </div>
                <div className="sdom-modal-field" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>PME Status</label>
                    <select style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={editingUser.pmeStatus} onChange={e => setEditingUser({ ...editingUser, pmeStatus: e.target.value })} required>
                      <option>Fit</option>
                      <option>Unfit</option>
                      <option>Overdue</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>REF Status</label>
                    <select style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={editingUser.refStatus} onChange={e => setEditingUser({ ...editingUser, refStatus: e.target.value })} required>
                      <option>Cleared</option>
                      <option>Pending</option>
                      <option>Expired</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {(editingUser.role === "Station Master" || editingUser.role === "Station Superintendent") && (
              <div style={{ padding: 18, background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10, marginBottom: 16 }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                  {editingUser.role} Operational Setup
                </h4>
                <div style={{ height: '1px', backgroundColor: '#a7f3d0', marginBottom: '16px' }}></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Operational Station *</label>
                    <select 
                      value={editingUser.smStation || editingUser.station || ""} 
                      onChange={e => setEditingUser({ ...editingUser, smStation: e.target.value, station: e.target.value })}
                    >
                      {(stations.length ? stations : myStations).map(s => <option key={s.id} value={s.name || s.stationName}>{s.name || s.stationName}</option>)}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Operational Zone *</label>
                    <select 
                      value={editingUser.smZone || editingUser.zone || "Central Railway"} 
                      onChange={e => setEditingUser({ ...editingUser, smZone: e.target.value, zone: e.target.value })}
                    >
                      {["Central Railway", "Western Railway", "Northern Railway", "Southern Railway", "Eastern Railway"].map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Operational Division *</label>
                    <select 
                      value={editingUser.smDivision || editingUser.division || "Nagpur"} 
                      onChange={e => setEditingUser({ ...editingUser, smDivision: e.target.value, division: e.target.value })}
                    >
                      {["Nagpur", "Pune", "Mumbai", "Solapur", "Bhusawal"].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {editingUser.role === "Pointsman" && (
              <div style={{ padding: 18, background: "#f0f7ff", border: "1px solid #c2e0ff", borderRadius: 10 }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                  Pointsman Operational Setup
                </h4>
                <div style={{ height: '1px', backgroundColor: '#c2e0ff', marginBottom: '16px' }}></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Reporting Station Master *</label>
                    <input 
                      value={editingUser.reportingSm || ""} 
                      onChange={e => setEditingUser({ ...editingUser, reportingSm: e.target.value })} 
                      placeholder="Station Master Name"
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>Work Location Setup *</label>
                    <select 
                      value={editingUser.workLocation || ""} 
                      onChange={e => setEditingUser({ ...editingUser, workLocation: e.target.value })}
                    >
                      <option value="">Select Location</option>
                      <option value="Yard">Yard Area</option>
                      <option value="Cabin A">Cabin A</option>
                      <option value="Cabin B">Cabin B</option>
                      <option value="Platform Area">Platform Area</option>
                      <option value="Level Crossing Gate">Level Crossing Gate</option>
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Assigned Shift *</label>
                    <select 
                      value={editingUser.shift || ""} 
                      onChange={e => setEditingUser({ ...editingUser, shift: e.target.value })}
                    >
                      <option value="">Select Shift</option>
                      <option value="Morning Shift (06:00 - 14:00)">Morning Shift (06:00 - 14:00)</option>
                      <option value="Evening Shift (14:00 - 22:00)">Evening Shift (14:00 - 22:00)</option>
                      <option value="Night Shift (22:00 - 06:00)">Night Shift (22:00 - 06:00)</option>
                      <option value="General Shift (09:00 - 18:00)">General Shift (09:00 - 18:00)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {editingUser.role === "Train Manager" && (
              <div style={{ padding: 18, background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 10 }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b21a8', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                  Train Manager Operational Setup
                </h4>
                <div style={{ height: '1px', backgroundColor: '#e9d5ff', marginBottom: '16px' }}></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Crew Depot *</label>
                    <select 
                      value={editingUser.workLocation || "Nagpur Depot"} 
                      onChange={e => setEditingUser({ ...editingUser, workLocation: e.target.value })}
                    >
                      <option value="Nagpur Depot">Nagpur Depot</option>
                      <option value="Pune Depot">Pune Depot</option>
                      <option value="Mumbai Depot">Mumbai Depot</option>
                      <option value="Solapur Depot">Solapur Depot</option>
                      <option value="Bhusawal Depot">Bhusawal Depot</option>
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Assigned Section Beats *</label>
                    <input 
                      value={editingUser.reportingSm || "NGP-BSL Section"} 
                      onChange={e => setEditingUser({ ...editingUser, reportingSm: e.target.value })} 
                      placeholder="E.g. NGP-BSL, NGP-DURG"
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>Assigned Shift *</label>
                    <select 
                      value={editingUser.shift || "Goods Train Beat"} 
                      onChange={e => setEditingUser({ ...editingUser, shift: e.target.value })}
                    >
                      <option value="Mail/Express Beat">Mail/Express Beat</option>
                      <option value="Passenger Beat">Passenger Beat</option>
                      <option value="Goods Train Beat">Goods Train Beat</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="sdom-modal-actions" style={{ marginTop: 24 }}>
              <button className="sdom-btn-primary" type="submit" style={{ flex: 1 }}>
                🔒 UPDATE USER ACCOUNT
              </button>
              <button className="sdom-btn-ghost" type="button" style={{ flex: 1 }} onClick={() => setEditingUser(null)}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderTransferUserModal = () => {
    if (!transferringUser) return null;
    return (
      <div className="sdom-modal-overlay" onClick={e => e.target === e.currentTarget && setTransferringUser(null)}>
        <div className="sdom-modal" style={{ width: "450px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#0d2c4d" }}>Transfer Personnel Deployment</h3>
            <button type="button" onClick={() => setTransferringUser(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}>&times;</button>
          </div>

          <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px 0", lineHeight: "1.4" }}>
            Transfer <strong>{transferringUser.name}</strong> from <strong>{transferringUser.station}</strong> to another station section.
          </p>

          <div className="sdom-modal-field">
            <label>Select Deployment Station</label>
            <select value={transferringUser.targetStation} onChange={e=>setTransferringUser({...transferringUser, targetStation: e.target.value})}>
              {(stations.length ? stations : myStations).map(st => <option key={st.id} value={st.name || st.stationName}>{st.name || st.stationName}</option>)}
            </select>
          </div>

          <div className="sdom-modal-actions" style={{ marginTop: "24px" }}>
            <button type="button" className="sdom-btn-primary" style={{ flex: 1 }} onClick={confirmTransfer}>Confirm Transfer</button>
            <button type="button" className="sdom-btn-ghost" style={{ flex: 1 }} onClick={() => setTransferringUser(null)}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  const renderAddUserModal = () => {
    if (!showAddUserModal || !newUserData) return null;
    return (
      <div className="sdom-modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddUserModal(false)}>
        <div className="sdom-modal" style={{ width: "900px", maxWidth: "95vw" }}>
          <form onSubmit={handleAddUserSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
              <div style={{
                background: "linear-gradient(135deg, #0d2c4d 0%, #1e40af 100%)",
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(13, 44, 77, 0.2)",
                color: "#ffffff"
              }}>
                <UserPlus size={28} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0d2c4d", letterSpacing: "-0.5px" }}>
                  ADD NEW SYSTEM USER
                </h2>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                  Role-Based Operational Staff Provisioning &amp; Management Console
                </p>
              </div>
            </div>

            <div>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
                1. General &amp; Contact Information
              </h4>
              <div style={{ height: '1px', background: '#d5dfeb', marginBottom: '16px' }}></div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="sdom-modal-field">
                  <label>Full Name *</label>
                  <input 
                    value={newUserData.name || ""} 
                    onChange={e => setNewUserData({ ...newUserData, name: e.target.value })} 
                    placeholder="Enter full name" 
                    required
                  />
                </div>
                <div className="sdom-modal-field">
                  <label>Mobile Number *</label>
                  <input 
                    value={newUserData.contact || ""} 
                    onChange={e => setNewUserData({ ...newUserData, contact: e.target.value })} 
                    placeholder="Enter 10-digit mobile number" 
                    required
                  />
                </div>
                <div className="sdom-modal-field">
                  <label>HRMS ID / Employee ID *</label>
                  <input 
                    value={newUserData.id || ""} 
                    onChange={e => setNewUserData({ ...newUserData, id: e.target.value })} 
                    placeholder="Enter unique ID" 
                    required
                  />
                </div>
                <div className="sdom-modal-field">
                  <label>Email ID *</label>
                  <input 
                    value={newUserData.email || ""} 
                    onChange={e => setNewUserData({ ...newUserData, email: e.target.value })} 
                    placeholder="Enter email address" 
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
                2. Designation &amp; Station Placement Setup
              </h4>
              <div style={{ height: '1px', background: '#d5dfeb', marginBottom: '16px' }}></div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="sdom-modal-field">
                  <label>Role / Designation *</label>
                  <select 
                    value={newUserData.role} 
                    onChange={e => {
                      const selectedRole = e.target.value;
                      const defaultDesig = selectedRole === "Pointsman" ? "Pointsman Grade I" : selectedRole;
                      setNewUserData({ ...newUserData, role: selectedRole, designation: defaultDesig });
                    }}
                    required
                  >
                    <option value="Pointsman">Pointsman</option>
                    <option value="Station Master">Station Master</option>
                    <option value="Station Superintendent">Station Superintendent</option>
                    <option value="Train Manager">Train Manager</option>
                    <option value="Traffic Inspector">Traffic Inspector</option>
                  </select>
                </div>
                <div className="sdom-modal-field">
                  <label>Division *</label>
                  <select 
                    value={newUserData.division || "Nagpur"} 
                    onChange={e => setNewUserData({ ...newUserData, division: e.target.value })}
                  >
                    {["Nagpur", "Pune", "Mumbai", "Solapur", "Bhusawal"].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="sdom-modal-field">
                  <label>Railway Zone *</label>
                  <select 
                    value={newUserData.zone || "Central Railway"} 
                    onChange={e => setNewUserData({ ...newUserData, zone: e.target.value })}
                  >
                    {["Central Railway", "Western Railway", "Northern Railway", "Southern Railway", "Eastern Railway"].map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <div className="sdom-modal-field">
                  <label>Station Name *</label>
                  <select 
                    value={newUserData.station} 
                    onChange={e => setNewUserData({ ...newUserData, station: e.target.value })}
                    required
                  >
                    <option value="">Select Station</option>
                    {(stations.length ? stations : myStations).map(s => <option key={s.id} value={s.name || s.stationName}>{s.name || s.stationName} ({s.code || s.stationCode})</option>)}
                  </select>
                </div>
                <div className="sdom-modal-field">
                  <label>Category *</label>
                  <select 
                    value={newUserData.cat || "A"} 
                    onChange={e => setNewUserData({ ...newUserData, cat: e.target.value })}
                  >
                    <option>A</option><option>B</option><option>C</option><option>D</option>
                  </select>
                </div>
                <div className="sdom-modal-field" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>PME Status</label>
                    <select style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={newUserData.pmeStatus} onChange={e => setNewUserData({ ...newUserData, pmeStatus: e.target.value })} required>
                      <option>Fit</option>
                      <option>Unfit</option>
                      <option>Overdue</option>
                      <option>Pending</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>REF Status</label>
                    <select style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={newUserData.refStatus} onChange={e => setNewUserData({ ...newUserData, refStatus: e.target.value })} required>
                      <option>Cleared</option>
                      <option>Pending</option>
                      <option>Expired</option>
                    </select>
                  </div>
                </div>
                <div className="sdom-modal-field">
                  <label>Joining Date *</label>
                  <input 
                    type="date" 
                    value={newUserData.joiningDate || ""} 
                    onChange={e => setNewUserData({ ...newUserData, joiningDate: e.target.value })} 
                    required
                  />
                </div>
              </div>
            </div>

            {(newUserData.role === "Station Master" || newUserData.role === "Station Superintendent") && (
              <div style={{ padding: 18, background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10, marginBottom: 16 }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                  {newUserData.role} Operational Setup
                </h4>
                <div style={{ height: '1px', backgroundColor: '#a7f3d0', marginBottom: '16px' }}></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Operational Station *</label>
                    <select 
                      value={newUserData.smStation || newUserData.station || ""} 
                      onChange={e => setNewUserData({ ...newUserData, smStation: e.target.value, station: e.target.value })}
                    >
                      <option value="">Select Operational Station</option>
                      {(stations.length ? stations : myStations).map(s => <option key={s.id} value={s.name || s.stationName}>{s.name || s.stationName}</option>)}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Operational Zone *</label>
                    <select 
                      value={newUserData.smZone || newUserData.zone || "Central Railway"} 
                      onChange={e => setNewUserData({ ...newUserData, smZone: e.target.value, zone: e.target.value })}
                    >
                      <option value="">Select Zone</option>
                      {["Central Railway", "Western Railway", "Northern Railway", "Southern Railway", "Eastern Railway"].map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Operational Division *</label>
                    <select 
                      value={newUserData.smDivision || newUserData.division || "Nagpur"} 
                      onChange={e => setNewUserData({ ...newUserData, smDivision: e.target.value, division: e.target.value })}
                    >
                      <option value="">Select Division</option>
                      {["Nagpur", "Pune", "Mumbai", "Solapur", "Bhusawal"].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {newUserData.role === "Pointsman" && (
              <div style={{ padding: 18, background: "#f0f7ff", border: "1px solid #c2e0ff", borderRadius: 10 }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                  Pointsman Operational Setup
                </h4>
                <div style={{ height: '1px', backgroundColor: '#c2e0ff', marginBottom: '16px' }}></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Reporting Station Master *</label>
                    <input 
                      value={newUserData.reportingSm || ""} 
                      onChange={e => setNewUserData({ ...newUserData, reportingSm: e.target.value })} 
                      placeholder="Station Master Name"
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>Work Location Setup *</label>
                    <select 
                      value={newUserData.workLocation || ""} 
                      onChange={e => setNewUserData({ ...newUserData, workLocation: e.target.value })}
                    >
                      <option value="">Select Location</option>
                      <option value="Yard">Yard Area</option>
                      <option value="Cabin A">Cabin A</option>
                      <option value="Cabin B">Cabin B</option>
                      <option value="Platform Area">Platform Area</option>
                      <option value="Level Crossing Gate">Level Crossing Gate</option>
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Assigned Shift *</label>
                    <select 
                      value={newUserData.shift || ""} 
                      onChange={e => setNewUserData({ ...newUserData, shift: e.target.value })}
                    >
                      <option value="">Select Shift</option>
                      <option value="Morning Shift (06:00 - 14:00)">Morning Shift (06:00 - 14:00)</option>
                      <option value="Evening Shift (14:00 - 22:00)">Evening Shift (14:00 - 22:00)</option>
                      <option value="Night Shift (22:00 - 06:00)">Night Shift (22:00 - 06:00)</option>
                      <option value="General Shift (09:00 - 18:00)">General Shift (09:00 - 18:00)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {newUserData.role === "Train Manager" && (
              <div style={{ padding: 18, background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 10 }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b21a8', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                  Train Manager Operational Setup
                </h4>
                <div style={{ height: '1px', backgroundColor: '#e9d5ff', marginBottom: '16px' }}></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Crew Depot *</label>
                    <select 
                      value={newUserData.workLocation || "Nagpur Depot"} 
                      onChange={e => setNewUserData({ ...newUserData, workLocation: e.target.value })}
                    >
                      <option value="Nagpur Depot">Nagpur Depot</option>
                      <option value="Pune Depot">Pune Depot</option>
                      <option value="Mumbai Depot">Mumbai Depot</option>
                      <option value="Solapur Depot">Solapur Depot</option>
                      <option value="Bhusawal Depot">Bhusawal Depot</option>
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Assigned Section Beats *</label>
                    <input 
                      value={newUserData.reportingSm || "NGP-BSL Section"} 
                      onChange={e => setNewUserData({ ...newUserData, reportingSm: e.target.value })} 
                      placeholder="E.g. NGP-BSL, NGP-DURG"
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>Assigned Shift *</label>
                    <select 
                      value={newUserData.shift || "Goods Train Beat"} 
                      onChange={e => setNewUserData({ ...newUserData, shift: e.target.value })}
                    >
                      <option value="Mail/Express Beat">Mail/Express Beat</option>
                      <option value="Passenger Beat">Passenger Beat</option>
                      <option value="Goods Train Beat">Goods Train Beat</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="sdom-modal-actions" style={{ marginTop: 24 }}>
              <button className="sdom-btn-primary" type="submit" style={{ flex: 1 }}>
                🔒 REGISTER NEW USER
              </button>
              <button className="sdom-btn-ghost" type="button" style={{ flex: 1 }} onClick={() => setShowAddUserModal(false)}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // If a profile detail is being viewed
  if (view?.type === "staffDetail") return renderStaffDetail(view.data);

  // Filter logic mirroring SuperAdmin's generic filtering
  const filtered = users.filter(s => {
    // case-insensitive role match
    const isRoleMatch = s.role?.toLowerCase() === roleKey?.toLowerCase() || s.designation?.toLowerCase() === roleKey?.toLowerCase();
    if (!isRoleMatch) return false;

    const userTi = stationTiMap[s.station] || "TI NGP";
    const userCat = s.cat || getCat(s.score);
    const isHighRisk = s.pmeStatus === "Overdue" || s.refStatus === "Expired" || s.score < 50;
    const userRisk = isHighRisk ? "High" : s.score >= 80 ? "Low" : "Medium";

    return (
      (roleF.station === "All" || s.station === roleF.station) &&
      (roleF.ti === "All" || userTi === roleF.ti) &&
      (roleF.cat === "All" || userCat === roleF.cat) &&
      (roleF.risk === "All" || userRisk === roleF.risk) &&
      (!roleF.name || s.name.toLowerCase().includes(roleF.name.toLowerCase()) ||
        s.id.toLowerCase().includes(roleF.name.toLowerCase()))
    );
  });

  const STATION_OPTS = ["All", ...Array.from(new Set((stations.length ? stations : myStations).map(st => st.name || st.stationName))).filter(Boolean)];
  const TI_OPTS = ["All", "TI PAR", "TI AMLA", "TI NGP"];

  return (
    <div className="ti2-page-body animate-fade-in">
      <div className="sdom-fade">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 className="sdom-page-title">{title} Management</h1>
            <p className="sdom-page-subtitle">Search, filter and manage all {title.toLowerCase()}s in the division.</p>
          </div>
          <button className="sdom-btn-primary" onClick={() => {
            let defaultDesig = roleKey;
            if (roleKey === "Pointsman") defaultDesig = "Pointsman Grade I";
            setNewUserData({
              id: "",
              name: "",
              role: roleKey,
              designation: defaultDesig,
              station: (stations.length ? stations : myStations)[0]?.name || (stations.length ? stations : myStations)[0]?.stationName || "",
              contact: "",
              joiningDate: new Date().toISOString().slice(0, 10),
              pmeStatus: "Fit",
              refStatus: "Cleared",
              reportingSm: roleKey === "Pointsman" ? "S. Deshmukh" : roleKey === "Train Manager" ? "NGP-BSL Section" : "",
              shift: roleKey === "Pointsman" ? "Morning Shift (06:00 - 14:00)" : roleKey === "Train Manager" ? "Goods Train Beat" : "",
              workLocation: roleKey === "Pointsman" ? "Yard Area" : roleKey === "Train Manager" ? "Nagpur Depot" : ""
            });
            setShowAddUserModal(true);
          }}>
            <Plus size={16} /> Add New {title}
          </button>
        </div>

        {/* Filters - EXACT match of SuperAdmin style */}
        <div className="sdom-filter-bar">
          <div className="sdom-filter-field" style={{ minWidth: 200 }}>
            <label>Name / ID</label>
            <input value={roleF.name} onChange={e => setRoleF(p => ({ ...p, name: e.target.value }))} placeholder="Search..." />
          </div>
          <div className="sdom-filter-field">
            <label>Station</label>
            <select value={roleF.station} onChange={e => setRoleF(p => ({ ...p, station: e.target.value }))}>
              {STATION_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="sdom-filter-field">
            <label>TI Area</label>
            <select value={roleF.ti} onChange={e => setRoleF(p => ({ ...p, ti: e.target.value }))}>
              {TI_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="sdom-filter-field">
            <label>Category</label>
            <select value={roleF.cat} onChange={e => setRoleF(p => ({ ...p, cat: e.target.value }))}>
              <option value="All">All</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>
          <div className="sdom-filter-field">
            <label>Risk Level</label>
            <select value={roleF.risk} onChange={e => setRoleF(p => ({ ...p, risk: e.target.value }))}>
              <option value="All">All</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <div className="sdom-chart-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontWeight: 700, color: "#1e293b" }}>{filtered.length} staff found</span>
          </div>
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Emp ID</th>
                  <th>Station</th>
                  <th>TI Area</th>
                  <th>Category</th>
                  <th>Risk</th>
                  <th>Last Score</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>
                      No records found
                    </td>
                  </tr>
                )}
                {filtered.map(s => {
                  const grade = s.cat || getCat(s.score);
                  const computedRisk = getUserRisk(s);
                  const computedStatus = s.pmeStatus === "Unfit" ? "Rejected" : s.refStatus === "Expired" ? "Pending" : "Approved";
                  return (
                    <tr key={s.id || s.hrmsId}>
                      <td style={{ fontWeight: 700 }}>{s.name}</td>
                      <td style={{ color: "#64748b", fontSize: "0.85rem" }}>{s.id || s.hrmsId}</td>
                      <td>{s.station}</td>
                      <td>{stationTiMap[s.station] || "TI NGP"}</td>
                      <td>{catBadge(grade)}</td>
                      <td>{riskBadge(computedRisk)}</td>
                      <td style={{ fontWeight: 700 }}>{s.score}%</td>
                      <td>{statusBadge(computedStatus)}</td>
                      <td>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
                          <button className="sdom-btn-outline" style={{ padding: "5px 10px", fontSize: "0.8rem" }} onClick={() => setView({ type: "staffDetail", data: s, returnTo: activePage })}>View</button>
                          <button className="sdom-icon-btn" title="Edit" onClick={() => handleEditUser(s)} style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Edit size={15} color="#2563eb" /></button>
                          <button className="sdom-icon-btn" title="Transfer Station" onClick={() => handleTransferClick(s)} style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><RefreshCw size={15} color="#d97706" /></button>
                          <button className="sdom-icon-btn" title="Remove" onClick={() => handleDeleteUser(s.id || s.hrmsId, s.name)} style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={15} color="#dc2626" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals rendered inside the page for visual safety */}
      {editingUser && (
        <CommonUserModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          mode="edit"
          userData={editingUser}
          setUserData={setEditingUser}
          onSubmit={saveEditedUser}
          stations={stations}
          myStations={myStations}
        />
      )}
      {transferringUser && (
        <CommonUserModal
          isOpen={!!transferringUser}
          onClose={() => setTransferringUser(null)}
          mode="shift"
          userData={transferringUser}
          setUserData={setTransferringUser}
          onSubmit={confirmTransfer}
          stations={stations}
          myStations={myStations}
        />
      )}
      {showAddUserModal && (
        <CommonUserModal
          isOpen={showAddUserModal}
          onClose={() => setShowAddUserModal(false)}
          mode="add"
          userData={newUserData}
          setUserData={setNewUserData}
          onSubmit={handleAddUserSubmit}
          stations={stations}
          myStations={myStations}
        />
      )}
    </div>
  );
}
