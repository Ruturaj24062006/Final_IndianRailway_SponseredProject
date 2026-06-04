import React from "react";
import { UserPlus, X, RefreshCw } from "lucide-react";

export default function CommonUserModal({
  isOpen,
  onClose,
  mode, // "add" | "edit" | "shift"
  userData,
  setUserData,
  onSubmit,
  stations = [],
  myStations = []
}) {
  if (!isOpen || !userData) return null;

  const isShift = mode === "shift";
  const activeStations = stations.length ? stations : myStations;

  const handleFieldChange = (field, val) => {
    setUserData(prev => {
      const updated = { ...prev, [field]: val };
      if (field === "role") {
        // Set default designation when role changes
        if (val === "Pointsman") {
          updated.designation = "Pointsman Grade I";
        } else {
          updated.designation = val;
        }
      }
      return updated;
    });
  };

  const modalStyle = {
    width: isShift ? "450px" : "900px",
    maxWidth: "95vw",
    maxHeight: "85vh",
    overflowY: "auto",
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.18)",
    padding: "28px",
    boxSizing: "border-box"
  };

  return (
    <div className="sdom-modal-overlay" style={{ zIndex: 99999 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sdom-modal" style={modalStyle}>
        {isShift ? (
          <form onSubmit={(e) => { e.preventDefault(); onSubmit(e); }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#0B1F3A", display: "flex", alignItems: "center", gap: "8px" }}>
                <RefreshCw size={20} /> Transfer Station
              </h3>
              <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}>&times;</button>
            </div>
            
            <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "20px", lineHeight: "1.5" }}>
              Transfer <strong>{userData.name}</strong> from <strong>{userData.station || userData.stationName || "current station"}</strong> to another station section.
            </p>

            <div className="sdom-modal-field" style={{ marginBottom: "20px" }}>
              <label style={{ fontWeight: 600, fontSize: "0.85rem", color: "#334155", display: "block", marginBottom: "6px" }}>Select Station *</label>
              <select 
                value={userData.targetStation || userData.station || ""} 
                onChange={e => handleFieldChange("targetStation", e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                required
              >
                <option value="">Select Target Station</option>
                {activeStations.map(st => (
                  <option key={st.id || st.code} value={st.name || st.stationName}>
                    {st.name || st.stationName} ({st.code || st.stationCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="sdom-modal-actions" style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button type="submit" className="sdom-btn-primary" style={{ flex: 1 }}>Confirm Transfer</button>
              <button type="button" className="sdom-btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            </div>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); onSubmit(e); }} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
                    {mode === "edit" ? "EDIT SYSTEM USER" : "ADD NEW SYSTEM USER"}
                  </h2>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                    Role-Based Operational Staff Provisioning & Management Console
                  </p>
                </div>
              </div>
              <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#64748b" }}>&times;</button>
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
                    type="text"
                    value={userData.name || ""} 
                    onChange={e => handleFieldChange("name", e.target.value)} 
                    placeholder="Enter full name" 
                    required
                  />
                </div>
                <div className="sdom-modal-field">
                  <label>Mobile Number *</label>
                  <input 
                    type="text"
                    value={userData.contact || userData.contactNumber || ""} 
                    onChange={e => handleFieldChange("contact", e.target.value)} 
                    placeholder="Enter 10-digit mobile number" 
                    required
                  />
                </div>
                <div className="sdom-modal-field">
                  <label>HRMS ID / Employee ID *</label>
                  <input 
                    type="text"
                    value={userData.id || userData.hrmsId || userData.employeeId || ""} 
                    disabled={mode === "edit"}
                    onChange={e => {
                      handleFieldChange("id", e.target.value);
                      handleFieldChange("hrmsId", e.target.value);
                      handleFieldChange("employeeId", e.target.value);
                    }} 
                    placeholder="Enter unique ID" 
                    required
                  />
                </div>
                <div className="sdom-modal-field">
                  <label>Email ID *</label>
                  <input 
                    type="email"
                    value={userData.email || userData.emailId || ""} 
                    onChange={e => {
                      handleFieldChange("email", e.target.value);
                      handleFieldChange("emailId", e.target.value);
                    }} 
                    placeholder="Enter email address" 
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
                    value={userData.role || ""} 
                    disabled={mode === "edit"}
                    onChange={e => handleFieldChange("role", e.target.value)}
                    required
                  >
                    <option value="">Select Role</option>
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
                    value={userData.division || "Nagpur"} 
                    onChange={e => handleFieldChange("division", e.target.value)}
                  >
                    {["Nagpur", "Pune", "Mumbai", "Solapur", "Bhusawal"].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="sdom-modal-field">
                  <label>Railway Zone *</label>
                  <select 
                    value={userData.zone || "Central Railway"} 
                    onChange={e => handleFieldChange("zone", e.target.value)}
                  >
                    {["Central Railway", "Western Railway", "Northern Railway", "Southern Railway", "Eastern Railway"].map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <div className="sdom-modal-field">
                  <label>Station Name *</label>
                  <select 
                    value={userData.station || userData.stationName || ""} 
                    onChange={e => {
                      const stObj = activeStations.find(s => (s.name || s.stationName) === e.target.value);
                      handleFieldChange("station", e.target.value);
                      handleFieldChange("stationName", e.target.value);
                      if (stObj) {
                        handleFieldChange("stationCode", stObj.code || stObj.stationCode || "");
                      }
                    }}
                    required
                  >
                    <option value="">Select Station</option>
                    {activeStations.map(s => (
                      <option key={s.id || s.code} value={s.name || s.stationName}>
                        {s.name || s.stationName} ({s.code || s.stationCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sdom-modal-field">
                  <label>Category *</label>
                  <select 
                    value={userData.cat || userData.category || "A"} 
                    onChange={e => {
                      handleFieldChange("cat", e.target.value);
                      handleFieldChange("category", e.target.value);
                    }}
                  >
                    <option>A</option><option>B</option><option>C</option><option>D</option>
                  </select>
                </div>
                <div className="sdom-modal-field" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>PME Status</label>
                    <select 
                      style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }} 
                      value={userData.pmeStatus || "Fit"} 
                      onChange={e => handleFieldChange("pmeStatus", e.target.value)} 
                      required
                    >
                      <option>Fit</option>
                      <option>Unfit</option>
                      <option>Overdue</option>
                      <option>Pending</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>REF Status</label>
                    <select 
                      style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }} 
                      value={userData.refStatus || "Cleared"} 
                      onChange={e => handleFieldChange("refStatus", e.target.value)} 
                      required
                    >
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
                    value={userData.joiningDate || userData.doj || ""} 
                    onChange={e => {
                      handleFieldChange("joiningDate", e.target.value);
                      handleFieldChange("doj", e.target.value);
                    }} 
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Conditional Setup based on Role */}
            {(userData.role === "Station Master" || userData.role === "Station Superintendent") && (
              <div style={{ padding: 18, background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10 }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                  {userData.role} Operational Setup
                </h4>
                <div style={{ height: '1px', backgroundColor: '#a7f3d0', marginBottom: '16px' }}></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Operational Station *</label>
                    <select 
                      value={userData.smStation || userData.station || ""} 
                      onChange={e => handleFieldChange("smStation", e.target.value)}
                      required
                    >
                      <option value="">Select Operational Station</option>
                      {activeStations.map(s => (
                        <option key={s.id || s.code} value={s.name || s.stationName}>{s.name || s.stationName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Operational Zone *</label>
                    <select 
                      value={userData.smZone || userData.zone || "Central Railway"} 
                      onChange={e => handleFieldChange("smZone", e.target.value)}
                    >
                      {["Central Railway", "Western Railway", "Northern Railway", "Southern Railway", "Eastern Railway"].map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Operational Division *</label>
                    <select 
                      value={userData.smDivision || userData.division || "Nagpur"} 
                      onChange={e => handleFieldChange("smDivision", e.target.value)}
                    >
                      {["Nagpur", "Pune", "Mumbai", "Solapur", "Bhusawal"].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {userData.role === "Pointsman" && (
              <div style={{ padding: 18, background: "#f0f7ff", border: "1px solid #c2e0ff", borderRadius: 10 }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                  Pointsman Operational Setup
                </h4>
                <div style={{ height: '1px', backgroundColor: '#c2e0ff', marginBottom: '16px' }}></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Reporting Station Master *</label>
                    <input 
                      type="text"
                      value={userData.reportingSm || ""} 
                      onChange={e => handleFieldChange("reportingSm", e.target.value)} 
                      placeholder="Station Master Name"
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>Work Location Setup *</label>
                    <select 
                      value={userData.workLocation || ""} 
                      onChange={e => handleFieldChange("workLocation", e.target.value)}
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
                      value={userData.shift || ""} 
                      onChange={e => handleFieldChange("shift", e.target.value)}
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

            {userData.role === "Train Manager" && (
              <div style={{ padding: 18, background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 10 }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b21a8', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                  Train Manager Operational Setup
                </h4>
                <div style={{ height: '1px', backgroundColor: '#e9d5ff', marginBottom: '16px' }}></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Crew Depot *</label>
                    <select 
                      value={userData.workLocation || "Nagpur Depot"} 
                      onChange={e => handleFieldChange("workLocation", e.target.value)}
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
                      type="text"
                      value={userData.reportingSm || "NGP-BSL Section"} 
                      onChange={e => handleFieldChange("reportingSm", e.target.value)} 
                      placeholder="E.g. NGP-BSL, NGP-DURG"
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>Assigned Shift *</label>
                    <select 
                      value={userData.shift || "Goods Train Beat"} 
                      onChange={e => handleFieldChange("shift", e.target.value)}
                    >
                      <option value="Mail/Express Beat">Mail/Express Beat</option>
                      <option value="Passenger Beat">Passenger Beat</option>
                      <option value="Goods Train Beat">Goods Train Beat</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {userData.role === "Traffic Inspector" && (
              <div style={{ padding: 18, background: "#fdf8f6", border: "1px solid #ffedd5", borderRadius: 10 }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c2410c', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                  Traffic Inspector Operational Setup
                </h4>
                <div style={{ height: '1px', backgroundColor: '#ffedd5', marginBottom: '16px' }}></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Jurisdiction Area *</label>
                    <input 
                      type="text"
                      value={userData.jurisdiction || ""} 
                      onChange={e => handleFieldChange("jurisdiction", e.target.value)} 
                      placeholder="E.g. Parbhani-Amla Section"
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>Assigned Division *</label>
                    <select 
                      value={userData.division || "Nagpur"} 
                      onChange={e => handleFieldChange("division", e.target.value)}
                    >
                      {["Nagpur", "Pune", "Mumbai", "Solapur", "Bhusawal"].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Reporting AOM Officer *</label>
                    <input 
                      type="text"
                      value={userData.reportingAom || "P. K. Verma (Sr. DOM)"} 
                      onChange={e => handleFieldChange("reportingAom", e.target.value)} 
                      placeholder="E.g. P. K. Verma (Sr. DOM)"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="sdom-modal-actions" style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button className="sdom-btn-primary" type="submit" style={{ flex: 1 }}>
                {mode === "edit" ? "🔒 UPDATE USER DETAILS" : "👤 REGISTER NEW USER"}
              </button>
              <button className="sdom-btn-ghost" type="button" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
