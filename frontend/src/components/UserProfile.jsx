import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from "recharts";

export default function UserProfile({
  fullName,
  employeeId,
  latestCategory,
  latestScore,
  history = [],
  profileData = {}
}) {
  const personalScoreData = [...history].reverse().map(h => ({
    month: h.assessmentPeriod?.replace(" 2026", "").replace(" 2025", "") || h.date || "—",
    score: h.totalScore || 0
  }));

  const designation = profileData?.designation || profileData?.role || "Staff";
  const stationName = profileData?.stationName || profileData?.station || profileData?.jurisdiction || "Nagpur Junction";
  const mobileNumber = profileData?.mobileNumber || profileData?.contact || "N/A";
  const reportingOfficer = profileData?.reportingOfficer || profileData?.reportingSm || "N/A";
  const joiningDate = profileData?.joiningDate || profileData?.doa || profileData?.doa || "N/A";
  const pmeStatus = profileData?.pmeStatus || (profileData?.pmeDoneDate ? `DONE: ${profileData.pmeDoneDate} (Due: ${profileData.pmeDueDate || "—"})` : "FIT (Periodic Medical Exam)");
  const refStatus = profileData?.refStatus || (profileData?.counsellingDate ? `COUNSELLED: ${profileData.counsellingDate}` : "COMPLETED (Refresher Course)");
  const trainingStatus = profileData?.trainingStatus || (profileData?.autoTrainingDate ? `AUTO: ${profileData.autoTrainingDate}` : "ACTIVE");

  return (
    <div className="sdom-fade">
      {/* Hero header */}
      <div className="sdom-station-header sdom-profile-hero" style={{ marginBottom: 24 }}>
        <div className="sdom-station-header-meta">
          <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Staff Profile</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 4 }}>{fullName}</div>
          <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>{designation} &bull; {stationName} &bull; Central Railway</div>
          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            <span className="sdom-badge sdom-badge-success">Category {latestCategory || "A"}</span>
            <span className="sdom-badge sdom-badge-success">Low Risk</span>
            <span className="sdom-badge sdom-badge-success">Active</span>
          </div>
        </div>
        <div className="sdom-station-header-stats">
          <div className="sdom-station-header-stat">
            <span className="val">{latestScore !== null && latestScore !== undefined ? latestScore : "—"}</span>
            <span className="lbl">Latest Score</span>
          </div>
          <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }}/>
          <div className="sdom-station-header-stat">
            <span className="val">{mobileNumber}</span>
            <span className="lbl">Contact</span>
          </div>
          <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }}/>
          <div className="sdom-station-header-stat">
            <span className="val">{history.length ? history[0].date : joiningDate}</span>
            <span className="lbl">Last Assessment</span>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="sdom-row-2" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card">
          <div className="sdom-chart-title" style={{ marginBottom: "16px" }}>Personal & Professional Details</div>
          
          <div className="sdom-profile-detail-grid">
            {[
              ["Employee ID / HRMS ID", employeeId],
              ["Designation", designation],
              ["Mobile Number", mobileNumber],
              ["Email ID", profileData?.email || `${employeeId?.toLowerCase() || "user"}@rail.in`],
              ["Account Status", "Active"],
              ["Current Zone", profileData?.zone || "Central Railway"],
              ["Current Division", profileData?.division || "Nagpur"],
              ["Current Station Placement", stationName],
              ["Reporting Officer", reportingOfficer]
            ].map(([lbl, val]) => (
              <div key={lbl} style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{lbl}</div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Operational Specifications */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' }}>
              Operational & Safety Dates
            </h4>
            <div className="sdom-profile-safety-grid">
              <div><strong>PME Status:</strong><div style={{fontWeight: 700, color: "#065f46", marginTop: 4}}>{pmeStatus}</div></div>
              <div><strong>Refresher Course Status:</strong><div style={{fontWeight: 700, color: "#0d2c4d", marginTop: 4}}>{refStatus}</div></div>
              <div style={{ gridColumn: "span 2" }}><strong>Training Clearance:</strong><div style={{fontWeight: 700, color: "#d97706", marginTop: 4}}>{trainingStatus}</div></div>
            </div>
          </div>
        </div>

        <div className="sdom-chart-card">
          <div className="sdom-chart-title">Score Trend</div>
          <div className="sdom-chart-subtitle">Your assessment score progression</div>
          <div style={{ height: 300 }}>
            {personalScoreData.length === 0 ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#64748b" }}>
                No score history available to display trend.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={personalScoreData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="month" fontSize={11}/>
                  <YAxis domain={[40, 100]} fontSize={11}/>
                  <Tooltip/>
                  <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }}/>
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
