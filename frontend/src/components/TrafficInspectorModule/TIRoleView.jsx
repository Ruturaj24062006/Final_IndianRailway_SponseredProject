import { useState } from "react";
import { Search, Plus, Trash2, Edit, RefreshCw, ChevronLeft, ChevronRight, Star, HeartHandshake, Eye, Award, Clock, FileCheck, CheckCircle2, Lock, Paperclip, ArrowLeft } from "lucide-react";

export default function TIRoleView({
  roleKey,
  title,
  users,
  setUsers,
  stations,
  view,
  setView,
  activePage,
  getCat,
  getUserRisk,
  riskBadge,
  catBadge,
  statusBadge,
  stationTiMap,
  editingUser,
  setEditingUser,
  transferringUser,
  setTransferringUser,
  showAddUserModal,
  setShowAddUserModal,
  handleEditUser,
  handleTransferClick,
  handleDeleteUser,
  newUserData,
  setNewUserData,
  handleAddUserSubmit,
  myStations,
  roleF,
  setRoleF,
  MONTHLY_TREND
}) {
  // If a profile detail is being viewed
    if (view?.type === "staffDetail") return renderStaffDetail(view.data);

    // Filter logic mirroring SuperAdmin's generic filtering
    const filtered = users.filter(s => {
      const isRoleMatch = s.role === roleKey;
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

    const STATION_OPTS = ["All", ...stations.map(s => s.name)];
    const TI_OPTS = ["All", "TI PAR", "TI AMLA", "TI NGP"];

    return (
      <div className="ti2-page-body animate-fade-in">
        <div className="sdom-fade">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <h1 className="sdom-page-title">{title} Management</h1>
              <p className="sdom-page-subtitle">Search, filter and manage all {title.toLowerCase()}s in the division.</p>
            </div>
            <button className="sdom-btn-primary" onClick={() => openAddUserModal(roleKey)}>
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
                {STATION_OPTS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="sdom-filter-field">
              <label>TI Area</label>
              <select value={roleF.ti} onChange={e => setRoleF(p => ({ ...p, ti: e.target.value }))}>
                {TI_OPTS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="sdom-filter-field">
              <label>Category</label>
              <select value={roleF.cat} onChange={e => setRoleF(p => ({ ...p, cat: e.target.value }))}>
                <option>All</option><option>A</option><option>B</option><option>C</option><option>D</option>
              </select>
            </div>
            <div className="sdom-filter-field">
              <label>Risk Level</label>
              <select value={roleF.risk} onChange={e => setRoleF(p => ({ ...p, risk: e.target.value }))}>
                <option>All</option><option>Low</option><option>Medium</option><option>High</option>
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
                      <tr key={s.id}>
                        <td style={{ fontWeight: 700 }}>{s.name}</td>
                        <td style={{ color: "#64748b", fontSize: "0.85rem" }}>{s.id}</td>
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
                            <button className="sdom-icon-btn" title="Remove" onClick={() => handleDeleteUser(s.id, s.name)} style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={15} color="#dc2626" /></button>
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
        {editingUser && renderEditUserModal()}
        {transferringUser && renderTransferUserModal()}
        {showAddUserModal && renderAddUserModal()}
      </div>
    );
}
