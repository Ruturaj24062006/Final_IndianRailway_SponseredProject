import { useState, useMemo } from "react";
import { Search, Plus, Trash2, Edit, CheckCircle, RefreshCw, Paperclip, ChevronLeft, ChevronRight, PlayCircle, Star, Target, ShieldCheck, Gauge, Award, ArrowRightLeft, UserPlus, FileText, Users, ArrowLeft } from "lucide-react";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip as RTooltip, Line } from "recharts";

export default function SARoleView({
  roleKey,
  title,
  staff,
  setStaff,
  stations,
  view,
  setView,
  modal,
  setModal,
  roleF,
  setRoleF,
  openAdd,
  openEdit,
  openShift,
  removeStaff,
  getCategoryBg,
  getCategoryColor,
  riskBadge,
  catBadge,
  statusBadge,
  ROLE_MAP,
  ROLE_OPTS,
  STATION_OPTS,
  TI_OPTS,
  filterByRole,
  saveModal,
  MONTHLY_TREND,
  openView,
  closeView
}) {
  const renderStaffDetail = (s) => {
    const scoreData = MONTHLY_TREND.map((m,i) => ({ month: m.month, score: Math.max(50, s.score - 10 + i*2) }));
    return (
      <div className="sdom-fade">
        <div style={{marginBottom:24}}>
          <button className="sdom-back-btn" onClick={() => {
            if (view?.returnTo === "stationDetail") {
              setView({ type: "stationDetail", data: view.stationData });
            } else {
              closeView();
            }
          }}><ArrowLeft size={16}/> Back to List</button>
        </div>

        {/* Hero header */}
        <div className="sdom-station-header" style={{marginBottom:24}}>
          <div className="sdom-station-header-meta">
            <div style={{fontSize:"0.8rem",color:"rgba(255,255,255,0.6)",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Staff Profile</div>
            <div style={{fontSize:"1.8rem",fontWeight:800,marginBottom:4}}>{s.name}</div>
            <div style={{fontSize:"0.9rem",color:"rgba(255,255,255,0.7)"}}>{ROLE_MAP[s.role] || s.role} &bull; {s.station} &bull; {s.zone || "Central Railway"}</div>
            <div style={{marginTop:12,display:"flex",gap:10}}>
              {catBadge(s.cat)}
              {riskBadge(s.risk)}
              {statusBadge(s.status)}
            </div>
          </div>
          <div className="sdom-station-header-stats">
            <div className="sdom-station-header-stat">
              <span className="val">{s.score}</span>
              <span className="lbl">Latest Score</span>
            </div>
            <div style={{width:1,height:60,background:"rgba(255,255,255,0.15)"}}/>
            <div className="sdom-station-header-stat">
              <span className="val">{s.contact || "—"}</span>
              <span className="lbl">Contact</span>
            </div>
            <div style={{width:1,height:60,background:"rgba(255,255,255,0.15)"}}/>
            <div className="sdom-station-header-stat">
              <span className="val">{s.lastDate || "—"}</span>
              <span className="lbl">Last Assessment</span>
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="sdom-row-2">
          <div className="sdom-chart-card">
            <div className="sdom-chart-title" style={{ marginBottom: "16px" }}>Personal & Professional Details</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', paddingBottom: '20px' }}>
              {[
                ["Employee ID / HRMS ID", s.id],
                ["Designation", ROLE_MAP[s.role] || s.role],
                ["Mobile Number", s.contact || "N/A"],
                ["Email ID", s.email || `${s.id?.toLowerCase()}@rail.in`],
                ["Account Status", s.status || "Active"],
                ["Current Zone", s.zone || "Central Railway"],
                ["Current Division", s.division || "Nagpur"],
                ["Current Station Placement", s.station],
                ["Reporting Officer", s.reportingAom || "P. K. Verma (Sr. DOM)"]
              ].map(([lbl, val]) => (
                <div key={lbl} style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{lbl}</div>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Operational Specifications (styled exactly like AOmModule) */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' }}>
                Operational Profile Specifications
              </h4>
              
              {s.role === "pointsmen" && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                  <div><strong>Reporting Station Master:</strong><div style={{fontWeight: 700, color: "#1e3a5f", marginTop: 4}}>{s.reportingSm || "S. Deshmukh (SM)"}</div></div>
                  <div><strong>Assigned Shift:</strong><div style={{fontWeight: 700, color: "#1e3a5f", marginTop: 4}}>{s.shift || "Morning Shift (06:00 - 14:00)"}</div></div>
                  <div><strong>Work Location Setup:</strong><div style={{fontWeight: 700, color: "#1e3a5f", marginTop: 4}}>{s.workLocation || "Yard Area"}</div></div>
                </div>
              )}

              {(s.role === "sm" || s.role === "ss") && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                  <div><strong>Operational Station:</strong><div style={{fontWeight: 700, color: "#065f46", marginTop: 4}}>{s.smStation || s.station || "N/A"}</div></div>
                  <div><strong>Operational Division:</strong><div style={{fontWeight: 700, color: "#065f46", marginTop: 4}}>{s.smDivision || s.division || "Nagpur"}</div></div>
                  <div><strong>Operational Zone:</strong><div style={{fontWeight: 700, color: "#065f46", marginTop: 4}}>{s.smZone || s.zone || "Central Railway"}</div></div>
                </div>
              )}

              {s.role === "ti" && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                  <div><strong>Jurisdiction Division:</strong><div style={{fontWeight: 700, color: "#92400e", marginTop: 4}}>{s.jurisdiction || "Nagpur Division"}</div></div>
                  <div><strong>Reporting AOM Officer:</strong><div style={{fontWeight: 700, color: "#92400e", marginTop: 4}}>{s.reportingAom || "P. K. Verma (Sr. DOM)"}</div></div>
                  <div style={{ gridColumn: 'span 3', marginTop: '6px' }}><strong>Linked Stations under supervision:</strong><div style={{fontWeight: 700, color: "#92400e", marginTop: 4}}>{s.linkedStations || "Nagpur Main, Wardha Jn, Sewagram"}</div></div>
                </div>
              )}

              {s.role === "tm" && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                  <div><strong>Crew Depot:</strong><div style={{fontWeight: 700, color: "#6b21a8", marginTop: 4}}>{s.workLocation || "Nagpur Depot"}</div></div>
                  <div><strong>Assigned Section Beats:</strong><div style={{fontWeight: 700, color: "#6b21a8", marginTop: 4}}>{s.reportingSm || "NGP-BSL Section"}</div></div>
                  <div><strong>Assigned Shift Beat Type:</strong><div style={{fontWeight: 700, color: "#6b21a8", marginTop: 4}}>{s.shift || "Goods Train Beat"}</div></div>
                </div>
              )}

              {!["pointsmen", "sm", "ss", "ti", "tm"].includes(s.role) && (
                <span style={{ fontSize: '13px', color: '#64748b' }}>No dynamic operational specifications required for this designation.</span>
              )}
            </div>
          </div>

          <div className="sdom-chart-card">
            <div className="sdom-chart-title">Score Trend</div>
            <div className="sdom-chart-subtitle">Assessment score progression</div>
            <div style={{height:300}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="month" fontSize={11}/>
                  <YAxis domain={[40,100]} fontSize={11}/>
                  <RTooltip/>
                  <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{r:5}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderModal = () => {
    if (!modal) return null;
    const isShift = modal.mode === "shift";
    return (
      <div className="sdom-modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
        <div className="sdom-modal" style={!isShift ? { width: "900px", maxWidth: "95vw" } : undefined}>
          
          {!isShift ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Header inside modal */}
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
                    {modal.mode === "edit" ? "EDIT SYSTEM USER" : "ADD NEW SYSTEM USER"}
                  </h2>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                    Role-Based Operational Staff Provisioning & Management Console
                  </p>
                </div>
              </div>

              {/* Section 1: General & Contact Information */}
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
                  1. General & Contact Information
                </h4>
                <div style={{ height: '1px', background: '#d5dfeb', marginBottom: '16px' }}></div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Full Name *</label>
                    <input 
                      value={modal.data.name || ""} 
                      onChange={e => setModal(p => ({ ...p, data: { ...p.data, name: e.target.value } }))} 
                      placeholder="Enter full name (e.g. A. K. Sharma)" 
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>Mobile Number *</label>
                    <input 
                      value={modal.data.contact || ""} 
                      onChange={e => setModal(p => ({ ...p, data: { ...p.data, contact: e.target.value } }))} 
                      placeholder="Enter 10-digit mobile number" 
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>HRMS ID / Employee ID *</label>
                    <input 
                      value={modal.data.id || ""} 
                      disabled={modal.mode === "edit"}
                      onChange={e => setModal(p => ({ ...p, data: { ...p.data, id: e.target.value } }))} 
                      placeholder="Enter unique ID (e.g. PM_8820)" 
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>Email ID *</label>
                    <input 
                      value={modal.data.email || ""} 
                      onChange={e => setModal(p => ({ ...p, data: { ...p.data, email: e.target.value } }))} 
                      placeholder="Enter email address (e.g. user@rail.in)" 
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Designation & Station Placement Setup */}
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
                  2. Designation & Station Placement Setup
                </h4>
                <div style={{ height: '1px', background: '#d5dfeb', marginBottom: '16px' }}></div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Role / Designation *</label>
                    <select 
                      value={modal.role} 
                      onChange={e => setModal(p => ({ ...p, role: e.target.value }))}
                    >
                      {Object.entries(ROLE_MAP).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Division *</label>
                    <select 
                      value={modal.data.division || "Nagpur"} 
                      onChange={e => {
                        const div = e.target.value;
                        setModal(p => ({ ...p, data: { ...p.data, division: div, smDivision: div } }));
                      }}
                    >
                      {["Nagpur", "Pune", "Mumbai", "Solapur", "Bhusawal"].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Railway Zone *</label>
                    <select 
                      value={modal.data.zone || "Central Railway"} 
                      onChange={e => {
                        const zone = e.target.value;
                        setModal(p => ({ ...p, data: { ...p.data, zone: zone, smZone: zone } }));
                      }}
                    >
                      {["Central Railway", "Western Railway", "Northern Railway", "Southern Railway", "Eastern Railway"].map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Station Name *</label>
                    <select 
                      value={modal.data.station || ""} 
                      onChange={e => {
                        const stName = e.target.value;
                        setModal(p => ({ ...p, data: { ...p.data, station: stName, smStation: stName } }));
                      }}
                    >
                      {stations.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Category *</label>
                    <select 
                      value={modal.data.cat || "A"} 
                      onChange={e => setModal(p => ({ ...p, data: { ...p.data, cat: e.target.value } }))}
                    >
                      <option>A</option><option>B</option><option>C</option><option>D</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Dynamic Role-Based Custom Operational Profile */}
              {modal.role === "pointsmen" && (
                <div style={{ padding: 18, background: "#f0f7ff", border: "1px solid #c2e0ff", borderRadius: 10 }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                    Pointsman Operational Setup
                  </h4>
                  <div style={{ height: '1px', backgroundColor: '#c2e0ff', marginBottom: '16px' }}></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div className="sdom-modal-field">
                      <label>Reporting Station Master *</label>
                      <input 
                        value={modal.data.reportingSm || ""} 
                        onChange={e => setModal(p => ({ ...p, data: { ...p.data, reportingSm: e.target.value } }))} 
                        placeholder="Station Master Name"
                      />
                    </div>
                    <div className="sdom-modal-field">
                      <label>Work Location Setup *</label>
                      <select 
                        value={modal.data.workLocation || ""} 
                        onChange={e => setModal(p => ({ ...p, data: { ...p.data, workLocation: e.target.value } }))}
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
                        value={modal.data.shift || ""} 
                        onChange={e => setModal(p => ({ ...p, data: { ...p.data, shift: e.target.value } }))}
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

              {(modal.role === "sm" || modal.role === "ss") && (
                <div style={{ padding: 18, background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10 }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                    {ROLE_MAP[modal.role]} Operational Setup
                  </h4>
                  <div style={{ height: '1px', backgroundColor: '#a7f3d0', marginBottom: '16px' }}></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div className="sdom-modal-field">
                      <label>Operational Station *</label>
                      <select 
                        value={modal.data.smStation || ""} 
                        onChange={e => setModal(p => ({ ...p, data: { ...p.data, smStation: e.target.value, station: e.target.value } }))}
                      >
                        <option value="">Select Operational Station</option>
                        {stations.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="sdom-modal-field">
                      <label>Operational Zone *</label>
                      <select 
                        value={modal.data.smZone || ""} 
                        onChange={e => setModal(p => ({ ...p, data: { ...p.data, smZone: e.target.value, zone: e.target.value } }))}
                      >
                        <option value="">Select Zone</option>
                        {["Central Railway", "Western Railway", "Northern Railway", "Southern Railway", "Eastern Railway"].map(z => <option key={z} value={z}>{z}</option>)}
                      </select>
                    </div>
                    <div className="sdom-modal-field">
                      <label>Operational Division *</label>
                      <select 
                        value={modal.data.smDivision || ""} 
                        onChange={e => setModal(p => ({ ...p, data: { ...p.data, smDivision: e.target.value, division: e.target.value } }))}
                      >
                        <option value="">Select Division</option>
                        {["Nagpur", "Pune", "Mumbai", "Solapur", "Bhusawal"].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {modal.role === "ti" && (
                <div style={{ padding: 18, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10 }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                    Traffic Inspector Operational Setup
                  </h4>
                  <div style={{ height: '1px', backgroundColor: '#fde68a', marginBottom: '16px' }}></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div className="sdom-modal-field">
                      <label>Jurisdiction Division *</label>
                      <input 
                        value={modal.data.jurisdiction || ""} 
                        onChange={e => setModal(p => ({ ...p, data: { ...p.data, jurisdiction: e.target.value } }))} 
                        placeholder="Enter Jurisdiction (e.g. Nagpur Division)"
                      />
                    </div>
                    <div className="sdom-modal-field">
                      <label>Reporting AOM *</label>
                      <select 
                        value={modal.data.reportingAom || ""} 
                        onChange={e => setModal(p => ({ ...p, data: { ...p.data, reportingAom: e.target.value } }))}
                      >
                        <option value="">Select AOM</option>
                        <option value="A. K. Sinha (AOM/G)">A. K. Sinha (AOM/G)</option>
                        <option value="M. K. Nair (AOM/Safety)">M. K. Nair (AOM/Safety)</option>
                        <option value="R. S. Prasad (AOM/Chg)">R. S. Prasad (AOM/Chg)</option>
                        <option value="P. K. Verma (Sr. DOM)">P. K. Verma (Sr. DOM)</option>
                      </select>
                    </div>
                    <div className="sdom-modal-field">
                      <label>Linked Stations under supervision *</label>
                      <input 
                        value={modal.data.linkedStations || ""} 
                        onChange={e => setModal(p => ({ ...p, data: { ...p.data, linkedStations: e.target.value } }))} 
                        placeholder="E.g. Nagpur Main, Wardha Jn, Sewagram"
                      />
                    </div>
                  </div>
                </div>
              )}

              {modal.role === "tm" && (
                <div style={{ padding: 18, background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 10 }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b21a8', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                    Train Manager Operational Setup
                  </h4>
                  <div style={{ height: '1px', backgroundColor: '#e9d5ff', marginBottom: '16px' }}></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div className="sdom-modal-field">
                      <label>Crew Depot *</label>
                      <select 
                        value={modal.data.workLocation || "Nagpur Depot"} 
                        onChange={e => setModal(p => ({ ...p, data: { ...p.data, workLocation: e.target.value } }))}
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
                        value={modal.data.reportingSm || "NGP-BSL Section"} 
                        onChange={e => setModal(p => ({ ...p, data: { ...p.data, reportingSm: e.target.value } }))} 
                        placeholder="E.g. NGP-BSL, NGP-DURG"
                      />
                    </div>
                    <div className="sdom-modal-field">
                      <label>Assigned Shift *</label>
                      <select 
                        value={modal.data.shift || "Goods Train Beat"} 
                        onChange={e => setModal(p => ({ ...p, data: { ...p.data, shift: e.target.value } }))}
                      >
                        <option value="Mail/Express Beat">Mail/Express Beat</option>
                        <option value="Passenger Beat">Passenger Beat</option>
                        <option value="Goods Train Beat">Goods Train Beat</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="sdom-modal-title" style={{ marginBottom: 20 }}>Shift Staff Role</div>
              <div className="sdom-modal-field">
                <label>Role (Shift to)</label>
                <select value={modal.role} onChange={e=>setModal(p=>({...p,role:e.target.value}))}>
                  {Object.entries(ROLE_MAP).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="sdom-modal-actions" style={{ marginTop: 24 }}>
            <button className="sdom-btn-primary" style={{ flex: 1 }} onClick={saveModal}>
              {modal.mode === "edit" ? "🔒 UPDATE USER ACCOUNT" : "👤 ADD USER ACCOUNT"}
            </button>
            <button className="sdom-btn-ghost" style={{ flex: 1 }} onClick={()=>setModal(null)}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  if (view?.type === "staffDetail") return renderStaffDetail(view.data);
    const filtered = filterByRole(roleKey);

    return (
      <div className="sdom-fade">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
          <div>
            <h1 className="sdom-page-title">{title} Management</h1>
            <p className="sdom-page-subtitle">Search, filter and manage all {title.toLowerCase()}s in the division.</p>
          </div>
          <button className="sdom-btn-primary" onClick={() => openAdd(roleKey)}>
            <Plus size={16}/> Add New {title}
          </button>
        </div>

        {/* Filters */}
        <div className="sdom-filter-bar">
          <div className="sdom-filter-field" style={{minWidth:200}}>
            <label>Name / ID</label>
            <input value={roleF.name} onChange={e=>setRoleF(p=>({...p,name:e.target.value}))} placeholder="Search..." />
          </div>
          <div className="sdom-filter-field">
            <label>Station</label>
            <select value={roleF.station} onChange={e=>setRoleF(p=>({...p,station:e.target.value}))}>
              {STATION_OPTS.map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="sdom-filter-field">
            <label>TI Area</label>
            <select value={roleF.ti} onChange={e=>setRoleF(p=>({...p,ti:e.target.value}))}>
              {TI_OPTS.map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="sdom-filter-field">
            <label>Category</label>
            <select value={roleF.cat} onChange={e=>setRoleF(p=>({...p,cat:e.target.value}))}>
              <option>All</option><option>A</option><option>B</option><option>C</option><option>D</option>
            </select>
          </div>
          <div className="sdom-filter-field">
            <label>Risk Level</label>
            <select value={roleF.risk} onChange={e=>setRoleF(p=>({...p,risk:e.target.value}))}>
              <option>All</option><option>Low</option><option>Medium</option><option>High</option>
            </select>
          </div>
        </div>

        <div className="sdom-chart-card">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <span style={{fontWeight:700,color:"#1e293b"}}>{filtered.length} staff found</span>
          </div>
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr><th>Name</th><th>Emp ID</th><th>Station</th><th>TI Area</th><th>Category</th><th>Risk</th><th>Last Score</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={{textAlign:"center",padding:32,color:"#94a3b8"}}>No records found</td></tr>
                )}
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td style={{fontWeight:700}}>{s.name}</td>
                    <td style={{color:"#64748b",fontSize:"0.85rem"}}>{s.id}</td>
                    <td>{s.station}</td>
                    <td>{s.ti}</td>
                    <td>{catBadge(s.cat)}</td>
                    <td>{riskBadge(s.risk)}</td>
                    <td style={{fontWeight:700}}>{s.score}</td>
                    <td>{statusBadge(s.status)}</td>
                    <td>
                      <div style={{display:"flex",gap:8}}>
                        <button className="sdom-btn-outline" style={{padding:"5px 10px",fontSize:"0.8rem"}} onClick={()=>openView("staffDetail",s)}>View</button>
                        <button className="sdom-icon-btn" title="Edit" onClick={()=>openEdit(s)}><Edit size={15} color="#2563eb"/></button>
                        <button className="sdom-icon-btn" title="Shift Role" onClick={()=>openShift(s)}><ArrowRightLeft size={15} color="#d97706"/></button>
                        <button className="sdom-icon-btn" title="Remove" onClick={()=>removeStaff(s.id)}><Trash2 size={15} color="#dc2626"/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {renderModal()}
      </div>
    );
}
