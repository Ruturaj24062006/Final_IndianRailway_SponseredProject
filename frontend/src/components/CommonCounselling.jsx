import React, { useState, useEffect } from "react";
import { Search, HeartHandshake, Calendar, Plus, Clock, UserCheck, UserX, AlertTriangle } from "lucide-react";
import { getCounsellingRecords, logCounselling, updateCounselling } from "../services/phase16Service";

export default function CommonCounselling({
  users = [],
  stationFilter = null, // stationName of active SM, or null for AOM (division-wide)
  isAom = false,
  addAuditLog = () => {}
}) {
  const [schedules, setSchedules] = useState([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [targetPm, setTargetPm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    dateTime: "",
    duration: "45 mins",
    topics: "Shunting safety guidelines, safety rules review, alertness briefing."
  });

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const data = await getCounsellingRecords();
      
      // Map API records to local schedule structure
      const mapped = data.map(r => ({
        id: r.id,
        employee_id: r.employee_id,
        hrmsId: r.employee_hrms_id,
        name: r.employee_name,
        designation: r.employee_designation || "Pointsman",
        station: r.station_name || r.station_code || "Unknown",
        dateTime: r.counselling_date ? new Date(r.counselling_date).toLocaleDateString() : "",
        duration: r.remarks && r.remarks.includes("Duration:") ? r.remarks.split("Updated:")[0].trim() : "45 mins",
        topics: r.reason,
        remarks: r.remarks,
        status: r.status, // 'Open', 'Closed', etc.
        attendance: r.status === "Closed" ? "Present" : (r.status === "Absent" ? "Absent" : "Pending")
      }));
      
      setSchedules(mapped);
    } catch (err) {
      console.error("Error fetching counselling records:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load schedules on mount
  useEffect(() => {
    fetchRecords();
  }, []);

  // 1. Find Pointsmen in Category D
  const categoryDPointsmen = users.filter(u => {
    const isPm = u.role === "Pointsman" || u.role === "pointsmen" || (u.designation && u.designation.toLowerCase().includes("pointsman"));
    const matchesStation = !stationFilter || u.station === stationFilter || u.stationName === stationFilter || u.station_code === stationFilter;
    const isCatD = u.category_grade === "D" || u.cat === "D" || u.category === "D";
    return isPm && matchesStation && isCatD;
  });

  // 2. Filter schedules
  const filteredSchedules = schedules.filter(s => {
    return !stationFilter || s.station === stationFilter || s.station_code === stationFilter;
  });

  // Schedule handler
  const handleScheduleClick = (pm) => {
    setTargetPm(pm);
    setFormData({
      dateTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16), // tomorrow
      duration: "45 mins",
      topics: "Review of Category D performance. Shunting safety and alertness briefing."
    });
    setShowScheduleForm(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!targetPm) return;

    try {
      const payload = {
        employee_id: targetPm.id || targetPm.employee_id,
        counselling_date: formData.dateTime.split("T")[0],
        reason: formData.topics,
        remarks: `Duration: ${formData.duration}`
      };
      
      await logCounselling(payload);
      addAuditLog("Counselling Scheduled", `Scheduled safety counselling for ${targetPm.name} on ${formData.dateTime}`);
      
      setShowScheduleForm(false);
      setTargetPm(null);
      alert(`Successfully scheduled counselling session for ${targetPm.name}.`);
      fetchRecords();
    } catch (err) {
      console.error(err);
      alert(`Failed to schedule session: ${err.message}`);
    }
  };

  // Attendance logger
  const handleRecordAttendance = async (scheduleId, attendanceStatus) => {
    try {
      const updatedStatus = attendanceStatus === "Present" ? "Closed" : "Open";
      const remarksText = `Duration: 45 mins. Status: ${attendanceStatus}. Updated: ${new Date().toLocaleDateString()}`;
      
      await updateCounselling(scheduleId, {
        status: updatedStatus,
        remarks: remarksText
      });
      
      const session = schedules.find(s => s.id === scheduleId);
      if (session) {
        addAuditLog("Counselling Attendance Logged", `Staff: ${session.name} marked ${attendanceStatus}`);
      }
      
      alert(`Attendance logged as: ${attendanceStatus}`);
      fetchRecords();
    } catch (err) {
      console.error(err);
      alert(`Failed to update attendance: ${err.message}`);
    }
  };

  return (
    <div className="ti2-page-body animate-fade-in" style={{ padding: "24px", background: "#f8fafc", minHeight: "100%", width: "100%", boxSizing: "border-box" }}>
      {/* Category D Pointsmen Roster */}
      <div className="ti2-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", marginBottom: "24px" }}>
        <div className="sdom-stack-on-mobile" style={{ marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#991b1b", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={20} color="#991b1b" />
              Category D Pointsmen Roster
            </h2>
            <p className="ti2-subtitle" style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748b" }}>
              Pointsmen graded as Category D (Score &lt; 50) must undergo regular counselling sessions.
            </p>
          </div>
        </div>

        <div className="ti2-table-wrap" style={{ overflowX: "auto", border: "1px solid #fee2e2", borderRadius: "8px" }}>
          <table className="sdom-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fef2f2", color: "#991b1b", borderBottom: "1.5px solid #fee2e2" }}>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Name</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>HRMS ID</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Station</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Score</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Current Category</th>
                {!isAom && <th style={{ padding: "12px 14px", textAlign: "right", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Counselling Action</th>}
              </tr>
            </thead>
            <tbody>
              {categoryDPointsmen.length === 0 ? (
                <tr>
                  <td colSpan={isAom ? 5 : 6} style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                    No Category D Pointsmen found.
                  </td>
                </tr>
              ) : (
                categoryDPointsmen.map(pm => {
                  const pmScore = pm.score || pm.lastScore || 45;
                  const pmCat = pm.cat || pm.category || "D";
                  return (
                    <tr key={pm.id || pm.hrmsId} style={{ borderBottom: "1px solid #cbd5e1" }}>
                      <td style={{ padding: "12px 14px", fontWeight: "700", color: "#0f172a" }}>{pm.name}</td>
                      <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: "13px" }}>{pm.hrmsId || pm.id}</td>
                      <td style={{ padding: "12px 14px" }}>{pm.station || pm.stationName}</td>
                      <td style={{ padding: "12px 14px", fontWeight: "700", color: "#dc2626" }}>{pmScore}%</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span className="sdom-badge sdom-badge-danger">{pmCat}</span>
                      </td>
                      {!isAom && (
                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                          <button
                            type="button"
                            className="sdom-btn-primary"
                            style={{ padding: "6px 12px", fontSize: "11.5px", borderRadius: "6px", cursor: "pointer", border: "none", background: "#7c3aed", color: "#fff", fontWeight: "700" }}
                            onClick={() => handleScheduleClick(pm)}
                          >
                            Schedule Session
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Form Modal */}
      {showScheduleForm && targetPm && (
        <div className="sdom-modal-overlay" style={{ zIndex: 99999 }} onClick={e => e.target === e.currentTarget && setShowScheduleForm(false)}>
          <div className="sdom-modal sdom-modal--compact" style={{ background: "#fff", borderRadius: "12px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#0d2c4d", fontWeight: "800" }}>Schedule Counselling Session</h3>
              <button type="button" onClick={() => setShowScheduleForm(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>&times;</button>
            </div>
            
            <form onSubmit={handleScheduleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="sdom-modal-field">
                  <label>Staff Name</label>
                  <input type="text" value={targetPm.name} disabled style={{ background: "#f1f5f9" }} />
                </div>
                <div className="sdom-modal-field">
                  <label>Schedule Date &amp; Time *</label>
                  <input 
                    type="datetime-local" 
                    value={formData.dateTime} 
                    onChange={e => setFormData({ ...formData, dateTime: e.target.value })} 
                    required 
                  />
                </div>
                <div className="sdom-modal-field">
                  <label>Session Duration *</label>
                  <input 
                    type="text" 
                    value={formData.duration} 
                    onChange={e => setFormData({ ...formData, duration: e.target.value })} 
                    placeholder="e.g. 45 mins" 
                    required 
                  />
                </div>
                <div className="sdom-modal-field">
                  <label>Briefing Topics &amp; Counselling Notes *</label>
                  <textarea 
                    rows={3} 
                    value={formData.topics} 
                    onChange={e => setFormData({ ...formData, topics: e.target.value })} 
                    placeholder="Brief details..." 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button type="submit" className="sdom-btn-primary" style={{ flex: 1 }}>Log Schedule</button>
                <button type="button" className="sdom-btn-ghost" style={{ flex: 1 }} onClick={() => setShowScheduleForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Counselling Ledger & Attendance */}
      <div className="ti2-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#0d2c4d", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <HeartHandshake size={20} color="#0d2c4d" />
            Counselling &amp; Attendance Logs
          </h2>
          <p className="ti2-subtitle" style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748b" }}>
            Review briefing schedules and log attendance (Present/Absent) on evaluation sessions.
          </p>
        </div>

        <div className="ti2-table-wrap" style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
          <table className="sdom-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", color: "#334155", borderBottom: "1.5px solid #e2e8f0" }}>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Scheduled Date/Time</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Staff Name</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Station</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Counselling Focus Topics</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Duration</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "12px 14px", textAlign: "right", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Attendance Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>No counselling sessions registered.</td>
                </tr>
              ) : (
                filteredSchedules.map(c => {
                  const isScheduled = c.status === "Scheduled";
                  return (
                    <tr key={c.id} style={{ borderBottom: "1px solid #cbd5e1" }}>
                      <td style={{ padding: "12px 14px" }}>
                        <strong style={{ display: "block" }}>{c.dateTime?.replace("T", " ")}</strong>
                      </td>
                      <td style={{ padding: "12px 14px", fontWeight: "700" }}>{c.name}</td>
                      <td style={{ padding: "12px 14px" }}>{c.station}</td>
                      <td style={{ padding: "12px 14px" }}>{c.topics}</td>
                      <td style={{ padding: "12px 14px" }}>{c.duration}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span className={`sdom-badge ${
                          c.status === "Completed" ? "sdom-badge-success" : 
                          c.status === "Absent" ? "sdom-badge-danger" : "sdom-badge-warning"
                        }`}>
                          {c.status} {c.attendance !== "Pending" && `(${c.attendance})`}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right" }}>
                        {isScheduled && !isAom ? (
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              className="sdom-btn-success"
                              style={{ padding: "5px 10px", fontSize: "11px", borderRadius: "4px", border: "none", cursor: "pointer", background: "#16a34a", color: "#fff", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "700" }}
                              onClick={() => handleRecordAttendance(c.id, "Present")}
                            >
                              <UserCheck size={12} /> Present
                            </button>
                            <button
                              type="button"
                              className="sdom-btn-danger"
                              style={{ padding: "5px 10px", fontSize: "11px", borderRadius: "4px", border: "none", cursor: "pointer", background: "#dc2626", color: "#fff", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "700" }}
                              onClick={() => handleRecordAttendance(c.id, "Absent")}
                            >
                              <UserX size={12} /> Absent
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: "#64748b", fontSize: "12px", fontStyle: "italic" }}>
                            {isAom ? "Logged by Station Master" : "Attendance Logged"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
