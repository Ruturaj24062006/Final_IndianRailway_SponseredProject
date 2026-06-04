import { useState } from "react";
import { Search, Plus, Building2, ExternalLink, HelpCircle, Activity, ShieldCheck, Award, TrendingUp, Users, ArrowLeft } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, PieChart, Pie, Cell, Legend, LabelList } from "recharts";

export default function AOmStations({
  stationsDirectory,
  setStationsDirectory,
  showAddStationModal,
  setShowAddStationModal,
  newStation,
  setNewStation,
  handleAddStation,
  stSearch,
  setStSearch,
  stCatFilter,
  setStCatFilter,
  selectedStation,
  setSelectedStation,
  stationMastersDirectory,
  aomPointsmen,
  getCat,
  getPmRisk,
  riskBadge,
  catBadge,
  statusBadge,
  view,
  setView,
  MONTHLY_TREND,
  CAT_COLORS,
  RISK_COLORS
}) {
  if (view?.type === "staffDetail") return renderStaffDetail(view.data);
    if (view?.type === "stationDetail") return renderStationDetail(view.data);
    const filtered = unifiedStations.filter(st =>
      !stF.name || st.name.toLowerCase().includes(stF.name.toLowerCase()) || st.code.toLowerCase().includes(stF.name.toLowerCase())
    );

    return (
      <div className="sdom-fade">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h1 className="sdom-page-title">Stations</h1>
            <p className="sdom-page-subtitle">Full list of stations in Nagpur Division. Click a station to open its complete analytics dashboard.</p>
          </div>
          <button className="sdom-btn-primary" onClick={() => {
            setNewStName("");
            setNewStCode("");
            setNewStTi("TI NGP");
            setNewStDivision("Nagpur");
            setNewStZone("CR");
            setNewStCategory("A");
            setNewStClass("Class B");
            setNewStType("Junction");
            setNewStSignaling("Electronic Interlocking (EI)");
            setNewStPlatforms(3);
            setNewStTracks(5);
            setNewStDailyFootfall(15000);
            setNewStLatitude("21.1500° N");
            setNewStLongitude("79.0900° E");
            setNewStContactNumber("+91-712-2560158");
            setNewStEmailId("");
            setNewStLineConfig("Double Line");
            setNewStElectrified("Electrified AC 25kV");
            setShowAddStation(true);
          }}>
            <Plus size={16} /> Add New Station
          </button>
        </div>

        <div className="sdom-filter-bar" style={{ flexWrap: "nowrap" }}>
          <div className="sdom-filter-field" style={{ flex: 1 }}>
            <label>Search Station</label>
            <input value={stF.name} onChange={e => setStF({ name: e.target.value })} placeholder="Station name or code..." />
          </div>
        </div>

        <div className="sdom-chart-card">
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr><th>Station Name</th><th>Code</th><th>Assigned TI</th><th>SMs</th><th>Pointsmen</th><th>Avg Score</th><th>Safety %</th><th>High Risk</th><th>Pending</th><th>Dashboard</th></tr>
              </thead>
              <tbody>
                {filtered.map(st => (
                  <tr key={st.id}>
                    <td style={{ fontWeight: 700 }}>{st.name}</td>
                    <td><span className="sdom-badge sdom-badge-blue">{st.code}</span></td>
                    <td>{st.ti}</td>
                    <td>{st.smCount}</td>
                    <td>{st.pmCount}</td>
                    <td style={{ fontWeight: 700, color: st.score >= 85 ? "#16a34a" : st.score >= 75 ? "#d97706" : "#dc2626" }}>{st.score}</td>
                    <td>{st.safety}%</td>
                    <td>{st.highRisk > 3 ? <span style={{ color: "#dc2626", fontWeight: 700 }}>{st.highRisk}</span> : st.highRisk}</td>
                    <td>{st.pending}</td>
                    <td>
                      <button className="sdom-btn-primary" style={{ padding: "7px 14px", fontSize: "0.82rem" }} onClick={() => setView({ type: "stationDetail", data: st })}>
                        Open Station Dashboard
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
}
