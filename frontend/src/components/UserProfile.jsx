import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from "recharts";
import { useLanguage } from "../utils/LanguageContext";

export default function UserProfile({
  fullName,
  employeeId,
  latestCategory,
  latestScore,
  history = [],
  profileData = {}
}) {
  const { t } = useLanguage();

  const personalScoreData = [...history].reverse().map(h => ({
    month: h.assessmentPeriod?.replace(" 2026", "").replace(" 2025", "") || h.date || "—",
    score: h.totalScore || 0
  }));

  const designation = profileData?.designation || profileData?.role || "—";
  const stationName = profileData?.station_name 
    ? `${profileData.station_name} (${profileData.station_code || "N/A"})` 
    : "—";
  const mobileNumber = profileData?.mobile || "—";
  const emailId = profileData?.email || (employeeId && employeeId !== "N/A" ? `${employeeId.toLowerCase()}@rail.in` : "—");
  const reportingOfficer = profileData?.reporting_officer_name 
    ? `${profileData.reporting_officer_name} (${profileData.reporting_officer_designation || "Supervisor"})`
    : "—";
  const joiningDate = profileData?.joiningDate || profileData?.doa || "—";

  const pmeStatus = profileData?.pme_status 
    ? `${profileData.pme_status}${profileData.pme_next_due_date ? ` (Due: ${profileData.pme_next_due_date})` : ""}` 
    : "—";
  const refStatus = profileData?.ref_status 
    ? `${profileData.ref_status}${profileData.ref_next_due_date ? ` (Due: ${profileData.ref_next_due_date})` : ""}` 
    : "—";
  const trainingStatus = profileData?.trainingStatus || "—";
  const examStatus = profileData?.exam_status || "—";
  const assessmentStatus = profileData?.assessment_status || "—";
  const riskLevel = profileData?.risk_level || "—";

  return (
    <div className="sdom-fade">
      {/* Hero header */}
      <div className="sdom-station-header sdom-profile-hero" style={{ marginBottom: 24 }}>
        <div className="sdom-station-header-meta">
          <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {t("profile.title")}
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 4 }}>{fullName}</div>
          <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>
            {designation} &bull; {stationName} &bull; {profileData?.zone || t("profile.zone")}
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            {latestCategory && latestCategory !== "—" && (
              <span className="sdom-badge sdom-badge-success">{t("assessment.categoryCol")} {latestCategory}</span>
            )}
            {riskLevel && riskLevel !== "—" && (
              <span className="sdom-badge sdom-badge-success">{riskLevel}</span>
            )}
            {assessmentStatus && assessmentStatus !== "—" && (
              <span className="sdom-badge sdom-badge-success">{assessmentStatus}</span>
            )}
          </div>
        </div>
        <div className="sdom-station-header-stats">
          <div className="sdom-station-header-stat">
            <span className="val">{latestScore !== null && latestScore !== undefined ? latestScore : "—"}</span>
            <span className="lbl">{t("dashboard.latestScore")}</span>
          </div>
          <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }}/>
          <div className="sdom-station-header-stat">
            <span className="val">{mobileNumber}</span>
            <span className="lbl">{t("profile.mobile")}</span>
          </div>
          <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }}/>
          <div className="sdom-station-header-stat">
            <span className="val">{history.length ? history[0].date : joiningDate}</span>
            <span className="lbl">{t("assessment.completed")}</span>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="sdom-row-2" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card">
          <div className="sdom-chart-title" style={{ marginBottom: "16px" }}>{t("profile.personalDetails")}</div>
          
          <div className="sdom-profile-detail-grid">
            {[
              [t("profile.hrmsId"), employeeId],
              [t("profile.designation"), designation],
              [t("profile.mobile"), mobileNumber],
              [t("profile.email"), emailId],
              [t("profile.status"), assessmentStatus],
              [t("profile.zone"), profileData?.zone || "Central Railway"],
              [t("profile.division"), profileData?.division || "Nagpur"],
              [t("profile.placement"), stationName],
              [t("profile.reportingOfficer"), reportingOfficer]
            ].map(([lbl, val]) => (
              <div key={lbl} style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{lbl}</div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Operational Specifications */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '24px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' }}>
              {t("profile.safetyDates")}
            </h4>
            <div className="sdom-profile-safety-grid">
              <div><strong>{t("profile.examStatus")}:</strong><div style={{fontWeight: 700, color: "#2563eb", marginTop: 4}}>{examStatus}</div></div>
              <div><strong>{t("profile.status")}:</strong><div style={{fontWeight: 700, color: "#ea580c", marginTop: 4}}>{assessmentStatus}</div></div>
              <div style={{ gridColumn: "span 2" }}><strong>{t("profile.trainingClearance")}:</strong><div style={{fontWeight: 700, color: "#d97706", marginTop: 4}}>{trainingStatus}</div></div>
            </div>
          </div>
        </div>

        <div className="sdom-chart-card">
          <div className="sdom-chart-title">{t("profile.scoreTrend")}</div>
          <div className="sdom-chart-subtitle">{t("profile.scoreProgression")}</div>
          <div style={{ height: 300 }}>
            {personalScoreData.length === 0 ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#64748b" }}>
                {t("profile.noHistory")}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={personalScoreData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="month" fontSize={11}/>
                  <YAxis domain={[0, 100]} fontSize={11}/>
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
