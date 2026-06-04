import { useState, useMemo } from "react";
import { Search, Plus, Trash2, Edit, CheckCircle, RefreshCw, Paperclip, ChevronLeft, ChevronRight, PlayCircle, Star, Target, ShieldCheck, Gauge, Award, Building2, ArrowLeft } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RTooltip, Bar, Cell, PieChart, Pie, Legend, LabelList, LineChart, Line } from "recharts";

const CAT_COLORS = { A: "#1E3A5F", B: "#2B6CB0", C: "#D69E2E", D: "#C53030" };
const RISK_COLORS = { Low: "#2F855A", Medium: "#D69E2E", High: "#C53030" };
const MONTHLY_TREND = [
  { month: "Dec'25", score: 81, safety: 80 },
  { month: "Jan'26", score: 83, safety: 82 },
  { month: "Feb'26", score: 85, safety: 85 },
  { month: "Mar'26", score: 87, safety: 88 },
  { month: "Apr'26", score: 89, safety: 91 },
  { month: "May'26", score: 91, safety: 94 }
];

export default function SAStations({
  stations,
  setStations,
  showAddStation,
  setShowAddStation,
  newStName,
  setNewStName,
  newStCode,
  setNewStCode,
  newStTi,
  setNewStTi,
  handleAddStation,
  stF,
  setStF,
  view,
  setView,
  getCategoryColor,
  getCategoryBg,
  catBadge,
  statusBadge,
  riskBadge,
  staff,
  STATION_OPTS,
  TI_OPTS,
  openView,
  closeView
}) {
  const renderStationDetail = (st) => {
    const stStaff    = staff.filter(s => s.station === st.name);
    const pmList     = stStaff.filter(s=>s.role==="pointsmen");
    const smList     = stStaff.filter(s=>s.role==="sm");
    const tiPerson   = stStaff.find(s=>s.role==="ti") || { name:st.ti, id:"—", contact:"—", cat:"—" };

    const catCount = ["A","B","C","D"].map(c => ({ cat:`Cat ${c}`, count: stStaff.filter(s=>s.cat===c).length, fill:CAT_COLORS[c] }));
    const riskCount = [
      { name:"Low",    value: stStaff.filter(s=>s.risk==="Low").length,    fill:"#16a34a" },
      { name:"Medium", value: stStaff.filter(s=>s.risk==="Medium").length, fill:"#f59e0b" },
      { name:"High",   value: stStaff.filter(s=>s.risk==="High").length,   fill:"#ef4444" },
    ].filter(r=>r.value>0);

    const trend = MONTHLY_TREND.map(m=>({...m, score: Math.max(60, st.score - 8 + MONTHLY_TREND.indexOf(m)*2)}));

    return (
      <div className="sdom-fade">
        <div style={{marginBottom:20}}>
          <button className="sdom-back-btn" onClick={closeView}><ArrowLeft size={16}/> Back to Stations</button>
        </div>

        {/* Station Hero */}
        <div className="sdom-station-header">
          <div className="sdom-station-header-meta">
            <div style={{fontSize:"0.78rem",color:"rgba(255,255,255,0.6)",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Station Analytics Dashboard</div>
            <div style={{fontSize:"1.9rem",fontWeight:800,marginBottom:4}}>{st.name}</div>
            <div style={{fontSize:"0.9rem",color:"rgba(255,255,255,0.7)"}}>Code: <b>{st.code}</b> &bull; Assigned TI: <b>{st.ti}</b></div>
            <div style={{marginTop:12,display:"flex",gap:10}}>
              <span className="sdom-badge" style={{background:"rgba(255,255,255,0.15)",color:"#fff"}}>{st.smCount} Station Masters</span>
              <span className="sdom-badge" style={{background:"rgba(255,255,255,0.15)",color:"#fff"}}>{st.pmCount} Pointsmen</span>
              <span className={`sdom-badge ${st.highRisk > 4 ? "sdom-badge-red" : "sdom-badge-green"}`}>{st.highRisk} High-Risk</span>
            </div>
          </div>
          <div className="sdom-station-header-stats">
            <div className="sdom-station-header-stat">
              <span className="val">{st.score}</span>
              <span className="lbl">Avg Score</span>
            </div>
            <div style={{width:1,height:60,background:"rgba(255,255,255,0.15)"}}/>
            <div className="sdom-station-header-stat">
              <span className="val">{st.safety}%</span>
              <span className="lbl">Safety</span>
            </div>
            <div style={{width:1,height:60,background:"rgba(255,255,255,0.15)"}}/>
            <div className="sdom-station-header-stat">
              <span className="val">{st.pending}</span>
              <span className="lbl">Pending</span>
            </div>
            <div style={{width:1,height:60,background:"rgba(255,255,255,0.15)"}}/>
            <div className="sdom-station-header-stat">
              <span className="val">{stStaff.length}</span>
              <span className="lbl">Total Staff</span>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:16,marginBottom:24}}>
          {[
            { label:"Total Staff",         val: stStaff.length },
            { label:"Pending Assessments", val: st.pending },
            { label:"Completed",           val: stStaff.filter(s=>s.status==="Approved").length },
            { label:"High-Risk Pointsmen", val: pmList.filter(s=>s.risk==="High").length },
            { label:"Safety Compliance",   val:`${st.safety}%` },
          ].map(c => (
            <div key={c.label} className="sdom-stat-card">
              <div className="sdom-stat-value">{c.val}</div>
              <div className="sdom-stat-label">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="sdom-row-2">
          <div className="sdom-chart-card">
            <div className="sdom-chart-title">Category Distribution</div>
            <div className="sdom-chart-subtitle">A/B/C/D breakdown of staff at this station</div>
            <div style={{height:260}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={catCount} barSize={46} margin={{top:16,right:24,left:0,bottom:8}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC"/>
                  <XAxis dataKey="cat" fontSize={12} tick={{fill:"#102A43",fontWeight:600}} axisLine={false} tickLine={false}/>
                  <YAxis fontSize={11} tick={{fill:"#627D98"}} axisLine={false} tickLine={false}/>
                  <RTooltip contentStyle={{fontSize:"0.85rem",borderRadius:6,border:"1px solid #D9E2EC"}} cursor={{fill:"rgba(0,0,0,0.03)"}}/>
                  <Bar dataKey="count" radius={[5,5,0,0]}>
                    {catCount.map((d,i)=><Cell key={i} fill={CAT_COLORS[Object.keys(CAT_COLORS)[i]]}/>)}
                    <LabelList dataKey="count" position="top" style={{fontSize:12,fontWeight:700,fill:"#102A43"}}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="sdom-chart-card">
            <div className="sdom-chart-title">Risk Distribution</div>
            <div className="sdom-chart-subtitle">Staff risk level breakdown at this station</div>
            <div style={{height:260}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskCount} cx="50%" cy="50%" innerRadius={70} outerRadius={105}
                       dataKey="value" paddingAngle={4}
                       label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}
                       labelLine={false}>
                    {riskCount.map((d,i)=><Cell key={i} fill={RISK_COLORS[d.name]}/>)}
                  </Pie>
                  <Legend wrapperStyle={{fontSize:"0.82rem"}}/>
                  <RTooltip contentStyle={{fontSize:"0.85rem",borderRadius:6,border:"1px solid #D9E2EC"}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="sdom-row-1">
          <div className="sdom-chart-card">
            <div className="sdom-chart-title">Score & Safety Trend (Last 6 Months)</div>
            <div className="sdom-chart-subtitle">Monthly performance tracking for this station</div>
            <div style={{height:260}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{top:10,right:30,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC"/>
                  <XAxis dataKey="month" fontSize={12} tick={{fill:"#627D98"}} axisLine={false} tickLine={false}/>
                  <YAxis domain={[50,100]} fontSize={11} tick={{fill:"#627D98"}} axisLine={false} tickLine={false}/>
                  <RTooltip contentStyle={{fontSize:"0.85rem",borderRadius:6,border:"1px solid #D9E2EC"}}/>
                  <Legend wrapperStyle={{fontSize:"0.82rem"}}/>
                  <Line type="monotone" dataKey="score" name="Avg Score" stroke="#1E3A5F" strokeWidth={2.5} dot={{r:4,fill:"#1E3A5F"}}/>
                  <Line type="monotone" dataKey="safety" name="Safety %" stroke="#2F855A" strokeWidth={2.5} strokeDasharray="5 3" dot={{r:4,fill:"#2F855A"}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Station Masters */}
        <div className="sdom-row-1">
          <div className="sdom-chart-card">
            <div className="sdom-chart-title" style={{marginBottom:16}}>Station Masters</div>
            <div className="sdom-table-wrap">
              <table className="sdom-table">
                <thead><tr><th>Name</th><th>HRMS ID</th><th>Category</th><th>Last Score</th><th>Last Assessment</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {smList.length === 0 && <tr><td colSpan={7} style={{textAlign:"center",color:"#94a3b8",padding:24}}>No Station Masters assigned</td></tr>}
                  {smList.map(s=>(
                    <tr key={s.id}>
                      <td style={{fontWeight:700}}>{s.name}</td>
                      <td style={{color:"#64748b",fontSize:"0.85rem"}}>{s.id}</td>
                      <td>{catBadge(s.cat)}</td>
                      <td style={{fontWeight:700}}>{s.score}</td>
                      <td>{s.lastDate}</td>
                      <td>{statusBadge(s.status)}</td>
                      <td><button className="sdom-btn-ghost" onClick={()=>setView({ type: "staffDetail", data: s, returnTo: "stationDetail", stationData: st })}>View Details</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pointsmen */}
        <div className="sdom-row-1">
          <div className="sdom-chart-card">
            <div className="sdom-chart-title" style={{marginBottom:16}}>Pointsmen</div>
            <div className="sdom-table-wrap">
              <table className="sdom-table">
                <thead><tr><th>Name</th><th>HRMS ID</th><th>Category</th><th>Risk Level</th><th>Latest Score</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {pmList.length === 0 && <tr><td colSpan={7} style={{textAlign:"center",color:"#94a3b8",padding:24}}>No Pointsmen assigned</td></tr>}
                  {pmList.map(s=>(
                    <tr key={s.id}>
                      <td style={{fontWeight:700}}>{s.name}</td>
                      <td style={{color:"#64748b",fontSize:"0.85rem"}}>{s.id}</td>
                      <td>{catBadge(s.cat)}</td>
                      <td>{riskBadge(s.risk)}</td>
                      <td style={{fontWeight:700}}>{s.score}</td>
                      <td>{statusBadge(s.status)}</td>
                      <td><button className="sdom-btn-ghost" onClick={()=>setView({ type: "staffDetail", data: s, returnTo: "stationDetail", stationData: st })}>View Details</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* TI Card */}
        <div className="sdom-row-1">
          <div className="sdom-chart-card">
            <div className="sdom-chart-title" style={{marginBottom:16}}>Assigned Traffic Inspector</div>
            <div className="sdom-ti-card">
              <div>
                <div style={{fontSize:"1.2rem",fontWeight:800,color:"#1e3a5f",marginBottom:4}}>{tiPerson.name}</div>
                <div style={{color:"#4b6a9b",fontSize:"0.9rem",marginBottom:8}}>Traffic Inspector &bull; {st.ti}</div>
                <div style={{display:"flex",gap:16}}>
                  <span style={{fontSize:"0.85rem",color:"#64748b"}}><b>ID:</b> {tiPerson.id}</span>
                  <span style={{fontSize:"0.85rem",color:"#64748b"}}><b>Contact:</b> {tiPerson.contact}</span>
                </div>
              </div>
              <button className="sdom-btn-outline" onClick={()=>tiPerson.role && setView({ type: "staffDetail", data: tiPerson, returnTo: "stationDetail", stationData: st })}>View Profile</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (view?.type === "staffDetail") return renderStaffDetail(view.data);
    if (view?.type === "stationDetail") return renderStationDetail(view.data);
    const filtered = stations.filter(st =>
      !stF.name || st.name.toLowerCase().includes(stF.name.toLowerCase()) || st.code.toLowerCase().includes(stF.name.toLowerCase())
    );

    return (
      <div className="sdom-fade">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div>
            <h1 className="sdom-page-title">Stations</h1>
            <p className="sdom-page-subtitle">Full list of stations in Nagpur Division. Click a station to open its complete analytics dashboard.</p>
          </div>
          <button className="sdom-btn-primary" onClick={() => {
            setNewStName("");
            setNewStCode("");
            setNewStTi("TI NGP");
            setShowAddStation(true);
          }}>
            <Plus size={16}/> Add New Station
          </button>
        </div>

        <div className="sdom-filter-bar" style={{flexWrap:"nowrap"}}>
          <div className="sdom-filter-field" style={{flex:1}}>
            <label>Search Station</label>
            <input value={stF.name} onChange={e=>setStF({name:e.target.value})} placeholder="Station name or code..." />
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
                    <td style={{fontWeight:700}}>{st.name}</td>
                    <td><span className="sdom-badge sdom-badge-blue">{st.code}</span></td>
                    <td>{st.ti}</td>
                    <td>{st.smCount}</td>
                    <td>{st.pmCount}</td>
                    <td style={{fontWeight:700,color: st.score>=85?"#16a34a":st.score>=75?"#d97706":"#dc2626"}}>{st.score}</td>
                    <td>{st.safety}%</td>
                    <td>{st.highRisk>3?<span style={{color:"#dc2626",fontWeight:700}}>{st.highRisk}</span>:st.highRisk}</td>
                    <td>{st.pending}</td>
                    <td>
                      <button className="sdom-btn-primary" style={{padding:"7px 14px",fontSize:"0.82rem"}} onClick={()=>openView("stationDetail",st)}>
                        Open Station Dashboard
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Station Modal */}
        {showAddStation && (
          <div className="sdom-modal-overlay" style={{ zIndex: 9999 }}>
            <div className="sdom-modal" style={{ width: "450px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#0B1F3A" }}>Add New Station</h3>
                <button type="button" onClick={() => setShowAddStation(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}>&times;</button>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.8rem", color: "#334155" }}>Station Name</label>
                  <input type="text" value={newStName} onChange={e => setNewStName(e.target.value)} placeholder="e.g. Wardha Junction" />
                </div>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.8rem", color: "#334155" }}>Station Code</label>
                  <input type="text" value={newStCode} onChange={e => setNewStCode(e.target.value)} placeholder="e.g. WR" />
                </div>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.8rem", color: "#334155" }}>Assigned TI Area</label>
                  <select value={newStTi} onChange={e => setNewStTi(e.target.value)}>
                    <option>TI NGP</option>
                    <option>TI PAR</option>
                    <option>TI AMLA</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button className="sdom-btn-outline" onClick={() => setShowAddStation(false)}>Cancel</button>
                <button className="sdom-btn-primary" onClick={handleAddStation}>Create Station</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
}
