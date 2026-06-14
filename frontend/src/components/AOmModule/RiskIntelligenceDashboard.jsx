import React, { useState, useEffect } from "react";
import {
  ShieldAlert, ShieldCheck, Activity, AlertTriangle, AlertCircle,
  RefreshCw, Search, CheckCircle, Clock, BookOpen, UserCheck, Calendar
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis,
  Tooltip as RTooltip, Legend, Bar, Cell, PieChart, Pie
} from "recharts";
import {
  getPredictiveDashboard,
  getStationRiskRanking,
  getEmployeeRiskLedger,
  getAlertRecommendations,
  syncRiskLevels
} from "../../services/aomService";

export default function RiskIntelligenceDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);

  // States
  const [dashboardData, setDashboardData] = useState(null);
  const [stationRanking, setStationRanking] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [stationFilter, setStationFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, stations, empLedger, recs] = await Promise.all([
        getPredictiveDashboard(),
        getStationRiskRanking(),
        getEmployeeRiskLedger(searchTerm, stationFilter, riskFilter),
        getAlertRecommendations()
      ]);
      setDashboardData(dash);
      setStationRanking(stations);
      setLedger(empLedger);
      setRecommendations(recs);
      setLoading(false);
    } catch (err) {
      console.error("Error loading predictive risk data:", err);
      setError(err.message || "Failed to load risk intelligence analytics.");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [stationFilter, riskFilter]);

  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const empLedger = await getEmployeeRiskLedger(searchTerm, stationFilter, riskFilter);
      setLedger(empLedger);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to search risk ledger.");
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await syncRiskLevels();
      alert(res.message || "Risk levels synced successfully.");
      loadData();
    } catch (err) {
      alert("Sync failed: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
        <RefreshCw size={48} className="spin-icon" style={{ color: "#1E3A5F" }} />
        <p style={{ color: "#627D98", fontSize: 16, fontWeight: 600 }}>Loading Risk Intelligence & Decision Support…</p>
        <style>{`
          .spin-icon { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16, padding: 24 }}>
        <AlertCircle size={48} style={{ color: "#C53030" }} />
        <p style={{ color: "#C53030", fontSize: 16, fontWeight: 600 }}>Analytics Load Failure</p>
        <p style={{ color: "#627D98", fontSize: 14, maxWidth: 480, textAlign: "center" }}>{error}</p>
        <button onClick={loadData} className="sdom-btn-primary" style={{ marginTop: 12 }}>Retry</button>
      </div>
    );
  }

  const dash = dashboardData || {
    divisional_risk_index: 0,
    risk_distribution: { high: 0, medium: 0, low: 0 },
    critical_stations: [],
    upcoming_expiries: { pme_30: 0, pme_60: 0, pme_90: 0, ref_30: 0, ref_60: 0, ref_90: 0 },
    risk_drivers: { expired_pme: 0, expired_ref: 0, low_cbt: 0, low_practical: 0, open_counselling: 0 },
    total_pointsmen: 0
  };

  const indexColor = dash.divisional_risk_index >= 65 ? "#C53030" : dash.divisional_risk_index >= 30 ? "#D69E2E" : "#2F855A";

  const riskPieData = [
    { name: "High Risk", value: dash.risk_distribution.high, fill: "#C53030" },
    { name: "Medium Risk", value: dash.risk_distribution.medium, fill: "#D69E2E" },
    { name: "Low Risk", value: dash.risk_distribution.low, fill: "#2F855A" }
  ].filter(d => d.value > 0);

  const expiryChartData = [
    { name: "PME (0-30d)", count: dash.upcoming_expiries.pme_30, fill: "#E53E3E" },
    { name: "PME (31-60d)", count: dash.upcoming_expiries.pme_60, fill: "#DD6B20" },
    { name: "PME (61-90d)", count: dash.upcoming_expiries.pme_90, fill: "#ECC94B" },
    { name: "REF (0-30d)", count: dash.upcoming_expiries.ref_30, fill: "#805AD5" },
    { name: "REF (31-60d)", count: dash.upcoming_expiries.ref_60, fill: "#9F7AEA" },
    { name: "REF (61-90d)", count: dash.upcoming_expiries.ref_90, fill: "#B794F4" }
  ];

  const driverData = [
    { name: "Expired PME", count: dash.risk_drivers.expired_pme, fill: "#E53E3E" },
    { name: "Expired REF", count: dash.risk_drivers.expired_ref, fill: "#805AD5" },
    { name: "Low CBT (<70%)", count: dash.risk_drivers.low_cbt, fill: "#3182CE" },
    { name: "Low Practical (<70%)", count: dash.risk_drivers.low_practical, fill: "#38A169" },
    { name: "Active Counselling", count: dash.risk_drivers.open_counselling, fill: "#DD6B20" }
  ];

  return (
    <div className="sdom-fade">
      {/* Header with Sync Action */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="sdom-page-title">Predictive Risk Intelligence</h1>
          <p className="sdom-page-subtitle">Real-time safety risk profiling, compliance forecasts, and decision-support recommendations.</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="sdom-btn-primary"
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px" }}
        >
          <RefreshCw size={16} className={syncing ? "spin-icon" : ""} />
          {syncing ? "Syncing..." : "Sync Risk Snapshot"}
        </button>
      </div>

      {/* ── KPI Grid ── */}
      <div className="sdom-summary-cards" style={{ marginBottom: 24 }}>
        <div className="sdom-stat-card" style={{ borderLeft: `6px solid ${indexColor}` }}>
          <div className="sdom-stat-icon"><Activity size={20} style={{ color: indexColor }} /></div>
          <div className="sdom-stat-label">Divisional Risk Index</div>
          <div className="sdom-stat-value" style={{ color: indexColor }}>{dash.divisional_risk_index} / 100</div>
          <div className="sdom-stat-sub">Average Nagpur division pointsman risk</div>
        </div>

        <div className="sdom-stat-card" style={{ borderLeft: "6px solid #C53030" }}>
          <div className="sdom-stat-icon"><ShieldAlert size={20} style={{ color: "#C53030" }} /></div>
          <div className="sdom-stat-label">High Risk Staff</div>
          <div className="sdom-stat-value" style={{ color: "#C53030" }}>{dash.risk_distribution.high}</div>
          <div className="sdom-stat-sub">Active Pointsmen requiring mitigation</div>
        </div>

        <div className="sdom-stat-card" style={{ borderLeft: "6px solid #D69E2E" }}>
          <div className="sdom-stat-icon"><AlertTriangle size={20} style={{ color: "#D69E2E" }} /></div>
          <div className="sdom-stat-label">Critical Stations</div>
          <div className="sdom-stat-value" style={{ color: "#D69E2E" }}>{dash.critical_stations.length}</div>
          <div className="sdom-stat-sub">Highest average risk locations</div>
        </div>

        <div className="sdom-stat-card" style={{ borderLeft: "6px solid #3182CE" }}>
          <div className="sdom-stat-icon"><Clock size={20} style={{ color: "#3182CE" }} /></div>
          <div className="sdom-stat-label">Pending Interventions</div>
          <div className="sdom-stat-value" style={{ color: "#3182CE" }}>{recommendations.length}</div>
          <div className="sdom-stat-sub">Prescribed action-alerts generated</div>
        </div>
      </div>

      {/* ── Row 1: Expiry Forecast & Risk Distribution ── */}
      <div className="sdom-row-2" style={{ marginBottom: 24 }}>
        <div className="sdom-chart-card">
          <div className="sdom-chart-title">Predictive Expiry Forecast (30/60/90 Days)</div>
          <div className="sdom-chart-subtitle">Upcoming compliance expirations by window</div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expiryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#627D98" }} />
                <YAxis tick={{ fontSize: 10, fill: "#627D98" }} allowDecimals={false} />
                <RTooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {expiryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sdom-chart-card">
          <div className="sdom-chart-title">Key Risk Drivers</div>
          <div className="sdom-chart-subtitle">Root-cause breakdown of safety penalties</div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={driverData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#D9E2EC" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#102A43", fontWeight: 600 }} />
                <RTooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {driverData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Row 2: Station Risk Rankings & Critical Stations ── */}
      <div className="sdom-row-2" style={{ marginBottom: 24 }}>
        <div className="sdom-chart-card">
          <div className="sdom-chart-title">Station Risk Rankings</div>
          <div className="sdom-chart-subtitle">Nagpur Division stations ordered by average staff risk score</div>
          <div className="sdom-table-wrap" style={{ maxHeight: 300, overflowY: "auto" }}>
            <table className="sdom-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Station</th>
                  <th>Pointsmen</th>
                  <th>High/Med/Low</th>
                  <th>Avg Risk Score</th>
                  <th>PME %</th>
                  <th>REF %</th>
                </tr>
              </thead>
              <tbody>
                {stationRanking.map((st, index) => (
                  <tr key={st.station_id}>
                    <td style={{ fontWeight: 700, color: "#9FB3C8" }}>#{index + 1}</td>
                    <td style={{ fontWeight: 600 }}>{st.station_name} ({st.station_code})</td>
                    <td>{st.total_pointsmen}</td>
                    <td>
                      <span style={{ color: "#C53030", fontWeight: 700 }}>{st.high_risk_count}</span>/
                      <span style={{ color: "#D69E2E", fontWeight: 700 }}>{st.medium_risk_count}</span>/
                      <span style={{ color: "#2F855A", fontWeight: 700 }}>{st.low_risk_count}</span>
                    </td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: st.station_risk_score >= 65 ? "#C53030" : st.station_risk_score >= 30 ? "#D69E2E" : "#2F855A"
                      }}>
                        {st.station_risk_score}
                      </span>
                    </td>
                    <td>{st.pme_compliance_rate}%</td>
                    <td>{st.refresher_compliance_rate}%</td>
                  </tr>
                ))}
                {stationRanking.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>No station data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="sdom-chart-card">
          <div className="sdom-chart-title" style={{ color: "#C53030" }}>Critical Stations Alert</div>
          <div className="sdom-chart-subtitle">Top 3 stations with highest safety risk indices</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
            {dash.critical_stations.map((st, idx) => (
              <div key={st.station_id} style={{
                background: "#FFF5F5",
                border: "1px solid #FEB2B2",
                borderRadius: 8,
                padding: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <h4 style={{ margin: 0, color: "#9B2C2C", fontSize: 15, fontWeight: 700 }}>
                    {idx + 1}. {st.station_name} ({st.station_code})
                  </h4>
                  <p style={{ margin: "4px 0 0 0", color: "#C53030", fontSize: 13 }}>
                    Rostered pointsmen: <b>{st.pointsmen_count}</b>
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#9B2C2C" }}>{st.avg_risk_score}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#E53E3E", textTransform: "uppercase" }}>Safety Index</div>
                </div>
              </div>
            ))}
            {dash.critical_stations.length === 0 && (
              <div style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>No critical stations identified</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Prescriptive Decision Recommendations ── */}
      <div className="sdom-chart-card" style={{ marginBottom: 24, borderLeft: "6px solid #1E3A5F" }}>
        <div className="sdom-chart-title">Decision-Support Safety Prescriptions</div>
        <div className="sdom-chart-subtitle">Actionable mitigation recommendations sorted by severity</div>
        <div className="sdom-table-wrap" style={{ maxHeight: 320, overflowY: "auto", marginTop: 12 }}>
          <table className="sdom-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Employee</th>
                <th>Station</th>
                <th>Driver Category</th>
                <th>Action Required</th>
                <th>Recommended Instruction</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.slice(0, 50).map((rec, index) => (
                <tr key={index}>
                  <td>
                    <span style={{
                      padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700,
                      background: rec.priority === "High" ? "#FED7D7" : rec.priority === "Medium" ? "#FEEBC8" : "#EDF2F7",
                      color: rec.priority === "High" ? "#9B2C2C" : rec.priority === "Medium" ? "#C05621" : "#4A5568"
                    }}>
                      {rec.priority}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{rec.employee_name} <span style={{ fontSize: 11, color: "#627D98" }}>({rec.hrms_id})</span></td>
                  <td>{rec.station_name}</td>
                  <td><span style={{ fontWeight: 600 }}>{rec.category}</span></td>
                  <td style={{ color: "#2B6CB0", fontWeight: 700 }}>{rec.action}</td>
                  <td style={{ fontSize: 12, color: "#4A5568" }}>{rec.recommendation}</td>
                </tr>
              ))}
              {recommendations.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>No active recommendations</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Employee Risk Ledger ── */}
      <div className="sdom-chart-card" style={{ marginBottom: 24 }}>
        <div className="sdom-chart-title">Staff Safety Ledger</div>
        <div className="sdom-chart-subtitle">Real-time risk factors, compliance states, and raw metrics</div>

        {/* Filters bar */}
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 12, margin: "16px 0", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#627D98" }}>Search Staff</label>
            <div style={{ position: "relative" }}>
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search HRMS ID or Name..."
                style={{ padding: "8px 12px 8px 32px", width: "100%", borderRadius: 6, border: "1px solid #D9E2EC" }}
              />
              <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: "#9FB3C8" }} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 160 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#627D98" }}>Risk Level</label>
            <select
              value={riskFilter}
              onChange={e => setRiskFilter(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #D9E2EC" }}
            >
              <option value="All">All Risks</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <button type="submit" className="sdom-btn-primary" style={{ padding: "10px 20px" }}>Search</button>
        </form>

        {/* Ledger Table */}
        <div className="sdom-table-wrap" style={{ maxHeight: 400, overflowY: "auto" }}>
          <table className="sdom-table">
            <thead>
              <tr>
                <th>HRMS ID</th>
                <th>Full Name</th>
                <th>Station</th>
                <th>Risk Score</th>
                <th>Risk Level</th>
                <th>PME Status</th>
                <th>REF Status</th>
                <th>CBT %</th>
                <th>Practical %</th>
                <th>Counselling (Open/Closed)</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((emp) => {
                const lvlColor = emp.calculated_risk_level === "High" ? "#FED7D7" : emp.calculated_risk_level === "Medium" ? "#FEEBC8" : "#C6F6D5";
                const lvlText = emp.calculated_risk_level === "High" ? "#9B2C2C" : emp.calculated_risk_level === "Medium" ? "#C05621" : "#2F855A";

                return (
                  <tr key={emp.employee_id}>
                    <td style={{ fontWeight: 700 }}>{emp.hrms_id}</td>
                    <td style={{ fontWeight: 600 }}>{emp.full_name}</td>
                    <td>{emp.station_name}</td>
                    <td style={{ fontWeight: 800 }}>{emp.risk_score}</td>
                    <td>
                      <span style={{
                        padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700,
                        background: lvlColor, color: lvlText
                      }}>
                        {emp.calculated_risk_level}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        padding: "2px 6px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                        background: emp.pme_next_due_date && new Date(emp.pme_next_due_date) >= new Date() ? "#E6FFFA" : "#FFF5F5",
                        color: emp.pme_next_due_date && new Date(emp.pme_next_due_date) >= new Date() ? "#319795" : "#E53E3E"
                      }}>
                        {emp.pme_next_due_date ? new Date(emp.pme_next_due_date).toLocaleDateString() : "Missing"}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        padding: "2px 6px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                        background: emp.ref_next_due_date && new Date(emp.ref_next_due_date) >= new Date() ? "#EBF8FF" : "#FFF5F5",
                        color: emp.ref_next_due_date && new Date(emp.ref_next_due_date) >= new Date() ? "#3182CE" : "#E53E3E"
                      }}>
                        {emp.ref_next_due_date ? new Date(emp.ref_next_due_date).toLocaleDateString() : "Missing"}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{emp.cbt_score ? `${emp.cbt_score}%` : "—"}</td>
                    <td style={{ fontWeight: 600 }}>{emp.practical_score ? `${emp.practical_score}%` : "—"}</td>
                    <td style={{ fontSize: 12 }}>
                      Open: <b>{emp.open_counselling_count}</b> | Recent Closed: <b>{emp.recent_closed_counselling_count}</b>
                    </td>
                  </tr>
                );
              })}
              {ledger.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>No staff matching filter criteria</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
