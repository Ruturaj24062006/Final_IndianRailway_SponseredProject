import { useState } from "react";
import { Plus, Search, RefreshCw, Trash2, Edit, UserPlus, ArrowRightLeft, ShieldAlert } from "lucide-react";

export default function AOmEmployeeManagement({
  stationsDirectory,
  aomPointsmen,
  setAomPointsmen,
  stationMastersDirectory,
  setStationMastersDirectory,
  aomTIs,
  setAomTIs,
  aomSSs,
  setAomSSs,
  aomTMs,
  setAomTMs,
  showAddUserModal,
  setShowAddUserModal,
  newUserData,
  setNewUserData,
  handleAddUserSubmit,
  editingUser,
  setEditingUser,
  saveEditedUser,
  transferringUser,
  setTransferringUser,
  confirmTransfer,
  handleDeleteUser,
  activeUserTab,
  setActiveUserTab,
  userSearch,
  setUserSearch,
  userStationFilter,
  setUserStationFilter,
  userDesignationFilter,
  setUserDesignationFilter,
  userCategoryFilter,
  setUserCategoryFilter,
  userRiskFilter,
  setUserRiskFilter,
  getCat,
  getPmRisk,
  riskBadge,
  catBadge,
  statusBadge,
  ROLE_MAP
}) {
  // 1. Dynamic Master Employee List Compilation
    const allEmployees = [
      ...aomPointsmen.map(p => ({
        hrmsId: p.hrmsId,
        name: p.name,
        gender: p.gender,
        age: p.age,
        doj: p.doj,
        basePay: p.basePay,
        designation: "Pointsman",
        stationName: p.stationName,
        stationCode: p.stationCode,
        division: p.stationCode === "NGP" ? "Nagpur" : p.stationCode === "PUNE" ? "Pune" : "Mumbai",
        zone: "CR",
        category: getPmCat(p.lastScore),
        riskLevel: getPmRisk(p),
        assessmentStatus: p.approvalStatus,
        lastScore: p.lastScore,
        safetyScore: p.safetyScore,
        totalAssessments: p.totalAssessments,
        lastAssessedDate: p.hrmsId === "PM_1001" ? "2026-03-28" : 
                          p.hrmsId === "PM_1102" ? "2026-03-10" : 
                          p.hrmsId === "PM_1103" ? "2026-02-15" : 
                          p.hrmsId === "PM_1104" ? "2026-03-18" : 
                          p.hrmsId === "PM_1105" ? "2026-01-20" : 
                          p.hrmsId === "PM_1106" ? "2026-03-05" : 
                          p.hrmsId === "PM_1107" ? "2026-03-20" : 
                          p.hrmsId === "PM_1108" ? "2026-02-01" : "—",
        monitoringStatus: deactivatedUserIds.has(p.hrmsId) ? "Deactivated" : (p.monitoringStatus || "Active")
      })),
      ...stationMastersDirectory.map((sm, idx) => {
        const smHrmsId = `SM_${1001 + idx}`;
        return {
          hrmsId: smHrmsId,
          name: sm.name,
          gender: "Male",
          age: 42,
          doj: "2010-05-15",
          basePay: "₹56,000",
          designation: "Station Master",
          stationName: sm.stationName,
          stationCode: sm.stationCode,
          division: sm.division,
          zone: sm.zone || "CR",
          category: sm.category || "A",
          riskLevel: idx % 3 === 0 ? "Medium" : "Low",
          assessmentStatus: idx % 2 === 0 ? "Approved" : "Pending",
          lastScore: 85 - (idx * 4),
          safetyScore: 92 - (idx * 2),
          totalAssessments: 10,
          lastAssessedDate: "2026-04-12",
          monitoringStatus: deactivatedUserIds.has(smHrmsId) ? "Deactivated" : (idx % 3 === 0 ? "On Duty" : "Active")
        };
      }),
      ...trafficInspectors.map((ti, idx) => ({
        hrmsId: ti.employeeId,
        name: ti.name,
        gender: "Male",
        age: 48,
        doj: "2006-11-20",
        basePay: "₹68,000",
        designation: "Traffic Inspector",
        stationName: "Division HQ",
        stationCode: "HQ",
        division: ti.division || "Nagpur",
        zone: "CR",
        category: ti.category || "Senior TI",
        riskLevel: "Low",
        assessmentStatus: ti.assessmentStatus === "Completed" ? "Approved" : "Pending",
        lastScore: 88,
        safetyScore: 95,
        totalAssessments: 8,
        lastAssessedDate: "2026-03-15",
        monitoringStatus: deactivatedUserIds.has(ti.employeeId) ? "Deactivated" : "Active"
      }))
    ];

    // Unique filter options computed dynamically
    const uniqueDesignations = ["All", "Pointsman", "Station Master", "Traffic Inspector"];
    const uniqueStations = ["All", ...Array.from(new Set(allEmployees.map(e => e.stationName)))];
    const uniqueDivisions = ["All", "Nagpur", "Pune", "Mumbai"];
    const uniqueZones = ["All", "CR"];
    const uniqueCategories = ["All", "A", "B", "C", "D", "Senior TI", "TI", "Assistant TI"];
    const uniqueRisks = ["All", "Low", "Medium", "High"];
    const uniqueStatuses = ["All", "Approved", "Pending", "Rejected"];
    const uniqueMonitorings = ["All", "Active", "On Duty", "Off Duty", "Absent", "Deactivated"];

    // Filter math logic
    const filteredEmployees = allEmployees.filter(emp => {
      const q = empSearchText.trim().toLowerCase();
      const matchesSearch = !q || emp.name.toLowerCase().includes(q) || emp.hrmsId.toLowerCase().includes(q);
      
      const matchesDesignation = empDesignationFilter === "All" || emp.designation === empDesignationFilter;
      const matchesStation = empStationFilter === "All" || emp.stationName === empStationFilter;
      const matchesDivision = empDivisionFilter === "All" || emp.division === empDivisionFilter;
      const matchesZone = empZoneFilter === "All" || emp.zone === empZoneFilter;
      const matchesCategory = empCategoryFilter === "All" || emp.category === empCategoryFilter;
      const matchesRisk = empRiskFilter === "All" || emp.riskLevel === empRiskFilter;
      const matchesStatus = empStatusFilter === "All" || emp.assessmentStatus === empStatusFilter;
      const matchesMonitoring = empMonitoringFilter === "All" || emp.monitoringStatus === empMonitoringFilter;

      return matchesSearch && matchesDesignation && matchesStation && matchesDivision && matchesZone && matchesCategory && matchesRisk && matchesStatus && matchesMonitoring;
    });

    // Summary calculations
    const totalCount = filteredEmployees.length;
    const activeCount = filteredEmployees.filter(e => e.monitoringStatus === "Active" || e.monitoringStatus === "On Duty").length;
    const approvedCount = filteredEmployees.filter(e => e.assessmentStatus === "Approved").length;
    const pendingCount = filteredEmployees.filter(e => e.assessmentStatus === "Pending").length;
    const highRiskCount = filteredEmployees.filter(e => e.riskLevel === "High").length;

    // Sorting
    const sortedEmployees = [...filteredEmployees].sort((a, b) => {
      if (a[empSortConfig.key] < b[empSortConfig.key]) {
        return empSortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[empSortConfig.key] > b[empSortConfig.key]) {
        return empSortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    const requestSort = (key) => {
      let direction = 'ascending';
      if (empSortConfig.key === key && empSortConfig.direction === 'ascending') {
        direction = 'descending';
      }
      setEmpSortConfig({ key, direction });
    };

    // Pagination
    const itemsPerPage = 8;
    const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);
    const paginatedEmployees = sortedEmployees.slice(
      (empCurrentPage - 1) * itemsPerPage,
      empCurrentPage * itemsPerPage
    );

    const handleActionClick = (emp) => {
      if (emp.designation === "Pointsman") {
        const pmObj = aomPointsmen.find(p => p.hrmsId === emp.hrmsId);
        setSelectedPointsmanForMonitoring(pmObj);
      } else {
        const mockPmObj = {
          id: emp.hrmsId,
          hrmsId: emp.hrmsId,
          name: emp.name,
          gender: emp.gender || "Male",
          age: emp.age || 40,
          doj: emp.doj || "2015-01-01",
          basePay: emp.basePay || "₹45,000",
          lastScore: emp.lastScore,
          safetyScore: emp.safetyScore || 90,
          totalAssessments: emp.totalAssessments || 10,
          incidents: 0,
          approvalStatus: emp.assessmentStatus,
          monitoringStatus: emp.monitoringStatus,
          stationCode: emp.stationCode,
          stationName: emp.stationName
        };
        setSelectedPointsmanForMonitoring(mockPmObj);
      }
    };

    const handleToggleDeactivate = (hrmsId) => {
      setDeactivatedUserIds(prev => {
        const next = new Set(prev);
        if (next.has(hrmsId)) {
          next.delete(hrmsId);
        } else {
          next.add(hrmsId);
        }
        return next;
      });
    };

    const handleShiftEmployeeClick = (row) => {
      const target = empShiftDrafts[row.hrmsId];
      if (!target) return;

      if (row.designation === "Pointsman") {
        const targetStationObj = stations.find(s => s.stationCode === target);
        const targetStationName = targetStationObj ? targetStationObj.stationName : target;
        if (window.confirm(`Are you sure you want to shift Pointsman ${row.name} from ${row.stationName} to ${targetStationName}?`)) {
          setAomPointsmen(prev => prev.map(p => {
            if (p.hrmsId === row.hrmsId) {
              return {
                ...p,
                stationCode: target,
                stationName: targetStationName
              };
            }
            return p;
          }));
          setEmpShiftDrafts(prev => {
            const next = { ...prev };
            delete next[row.hrmsId];
            return next;
          });
          alert(`Successfully shifted Pointsman ${row.name} to ${targetStationName}`);
        }
      } else if (row.designation === "Station Master") {
        handleShiftStationMaster(row.name, target);
        setEmpShiftDrafts(prev => {
          const next = { ...prev };
          delete next[row.hrmsId];
          return next;
        });
      } else if (row.designation === "Traffic Inspector") {
        const ti = trafficInspectors.find(t => t.employeeId === row.hrmsId);
        if (ti) {
          setTrafficInspectors((prev) =>
            prev.map((r) =>
              r.employeeId === row.hrmsId
                ? {
                    ...r,
                    jurisdiction: target,
                    division: target
                  }
                : r
            )
          );
          setTiNotice("TI jurisdiction updated successfully.");
          setEmpShiftDrafts(prev => {
            const next = { ...prev };
            delete next[row.hrmsId];
            return next;
          });
          alert(`Successfully shifted Traffic Inspector ${row.name} to ${target} Division`);
        }
      }
    };

    const handleResetFilters = () => {
      setEmpSearchText("");
      setEmpDesignationFilter("All");
      setEmpStationFilter("All");
      setEmpDivisionFilter("All");
      setEmpZoneFilter("All");
      setEmpCategoryFilter("All");
      setEmpRiskFilter("All");
      setEmpStatusFilter("All");
      setEmpMonitoringFilter("All");
      setEmpCurrentPage(1);
    };

    return (
      <div className="user-management-page">
        {selectedPointsmanForMonitoring ? (
          renderPointsmanMonitoringDetail(selectedPointsmanForMonitoring)
        ) : (
          <>
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Employee Management</h2>
                <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748b" }}>
                  Unified railway workforce intelligence & real-time monitoring console
                </p>
              </div>
              <button
                type="button"
                className="sm2-monitor-btn"
                onClick={handleResetFilters}
                style={{
                  backgroundColor: "#ffffff",
                  color: "#2563eb",
                  border: "1px solid #bfdbfe",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                Reset Filters
              </button>
            </div>

            {/* KPI Cards */}
            <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", marginBottom: "20px", marginTop: "20px" }}>
              <div className="metric-card" onClick={() => { setEmpDesignationFilter("All"); setEmpRiskFilter("All"); setEmpStatusFilter("All"); setEmpSearchText(""); setEmpCurrentPage(1); }} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }} onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(37,99,235,0.15)"; e.currentTarget.style.borderColor = "#93c5fd"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Users size={20} />
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "10px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Total Employees</span>
                  <h3 style={{ margin: "2px 0 0 0", fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>{totalCount}</h3>
                </div>
              </div>
              <div className="metric-card" onClick={() => { setEmpStatusFilter("Active"); setEmpRiskFilter("All"); setEmpDesignationFilter("All"); setEmpSearchText(""); setEmpCurrentPage(1); }} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }} onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(59,130,246,0.15)"; e.currentTarget.style.borderColor = "#93c5fd"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Activity size={20} />
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "10px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Active / On Duty</span>
                  <h3 style={{ margin: "2px 0 0 0", fontSize: "20px", fontWeight: "800", color: "#3b82f6" }}>{activeCount}</h3>
                </div>
              </div>
              <div className="metric-card" onClick={() => { setEmpStatusFilter("Approved"); setEmpRiskFilter("All"); setEmpDesignationFilter("All"); setEmpSearchText(""); setEmpCurrentPage(1); }} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }} onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(22,163,74,0.15)"; e.currentTarget.style.borderColor = "#86efac"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "10px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Approved Staff</span>
                  <h3 style={{ margin: "2px 0 0 0", fontSize: "20px", fontWeight: "800", color: "#16a34a" }}>{approvedCount}</h3>
                </div>
              </div>
              <div className="metric-card" onClick={() => { setEmpStatusFilter("Pending"); setEmpRiskFilter("All"); setEmpDesignationFilter("All"); setEmpSearchText(""); setEmpCurrentPage(1); }} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }} onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(161,98,7,0.15)"; e.currentTarget.style.borderColor = "#fde047"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#fef08a", color: "#a16207", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Activity size={20} />
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "10px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Pending Approvals</span>
                  <h3 style={{ margin: "2px 0 0 0", fontSize: "20px", fontWeight: "800", color: "#a16207" }}>{pendingCount}</h3>
                </div>
              </div>
              <div className="metric-card" onClick={() => { setEmpRiskFilter("High"); setEmpStatusFilter("All"); setEmpDesignationFilter("All"); setEmpSearchText(""); setEmpCurrentPage(1); }} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }} onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(220,38,38,0.15)"; e.currentTarget.style.borderColor = "#fca5a5"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "10px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>High Risk Staff</span>
                  <h3 style={{ margin: "2px 0 0 0", fontSize: "20px", fontWeight: "800", color: "#dc2626" }}>{highRiskCount}</h3>
                </div>
              </div>
            </div>

            {/* ADVANCED FILTERS CARD */}
            <div className="chart-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: "700", color: "#334155", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                🔍 Advanced Intelligence Filters
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
                {/* Search */}
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Search Name / HRMS ID</label>
                  <div style={{ position: "relative" }}>
                    <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "#94a3b8" }} />
                    <input
                      type="text"
                      value={empSearchText}
                      onChange={(e) => { setEmpSearchText(e.target.value); setEmpCurrentPage(1); }}
                      placeholder="Type query..."
                      style={{ width: "100%", padding: "6px 10px 6px 30px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                    />
                  </div>
                </div>

                {/* Designation */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Designation</label>
                  <select
                    value={empDesignationFilter}
                    onChange={(e) => { setEmpDesignationFilter(e.target.value); setEmpCurrentPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  >
                    {uniqueDesignations.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* Station */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Station</label>
                  <select
                    value={empStationFilter}
                    onChange={(e) => { setEmpStationFilter(e.target.value); setEmpCurrentPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  >
                    {uniqueStations.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* Division */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Division</label>
                  <select
                    value={empDivisionFilter}
                    onChange={(e) => { setEmpDivisionFilter(e.target.value); setEmpCurrentPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  >
                    {uniqueDivisions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* Zone */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Zone</label>
                  <select
                    value={empZoneFilter}
                    onChange={(e) => { setEmpZoneFilter(e.target.value); setEmpCurrentPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  >
                    {uniqueZones.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Category</label>
                  <select
                    value={empCategoryFilter}
                    onChange={(e) => { setEmpCategoryFilter(e.target.value); setEmpCurrentPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  >
                    {uniqueCategories.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* Risk Level */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Risk Level</label>
                  <select
                    value={empRiskFilter}
                    onChange={(e) => { setEmpRiskFilter(e.target.value); setEmpCurrentPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  >
                    {uniqueRisks.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* Assessment Status */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Assessment Status</label>
                  <select
                    value={empStatusFilter}
                    onChange={(e) => { setEmpStatusFilter(e.target.value); setEmpCurrentPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  >
                    {uniqueStatuses.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* Monitoring Status */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Monitoring Status</label>
                  <select
                    value={empMonitoringFilter}
                    onChange={(e) => { setEmpMonitoringFilter(e.target.value); setEmpCurrentPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  >
                    {uniqueMonitorings.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* DATA TABLE */}
            <div className="users-list-container" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <div className="users-table-wrapper" style={{ overflowX: "auto", maxHeight: "550px", overflowY: "auto", position: "relative" }}>
                <table className="users-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "1400px" }}>
                  <thead>
                    <tr style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      background: "linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)",
                      borderBottom: "2px solid #cbd5e1",
                      textAlign: "left",
                      color: "#475569",
                      fontWeight: "700",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("name")}>
                        Employee Name {empSortConfig.key === "name" && (empSortConfig.direction === "ascending" ? "▲" : "▼")}
                      </th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("hrmsId")}>
                        HRMS ID {empSortConfig.key === "hrmsId" && (empSortConfig.direction === "ascending" ? "▲" : "▼")}
                      </th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("designation")}>
                        Designation {empSortConfig.key === "designation" && (empSortConfig.direction === "ascending" ? "▲" : "▼")}
                      </th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("stationName")}>
                        Station {empSortConfig.key === "stationName" && (empSortConfig.direction === "ascending" ? "▲" : "▼")}
                      </th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("division")}>
                        Division {empSortConfig.key === "division" && (empSortConfig.direction === "ascending" ? "▲" : "▼")}
                      </th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("zone")}>
                        Zone {empSortConfig.key === "zone" && (empSortConfig.direction === "ascending" ? "▲" : "▼")}
                      </th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("category")}>
                        Category {empSortConfig.key === "category" && (empSortConfig.direction === "ascending" ? "▲" : "▼")}
                      </th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("riskLevel")}>
                        Risk Level {empSortConfig.key === "riskLevel" && (empSortConfig.direction === "ascending" ? "▲" : "▼")}
                      </th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("assessmentStatus")}>
                        Assessment {empSortConfig.key === "assessmentStatus" && (empSortConfig.direction === "ascending" ? "▲" : "▼")}
                      </th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("lastScore")}>
                        Score {empSortConfig.key === "lastScore" && (empSortConfig.direction === "ascending" ? "▲" : "▼")}
                      </th>
                      <th style={{ padding: "14px 10px" }}>Assessed Date</th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("monitoringStatus")}>
                        Monitoring {empSortConfig.key === "monitoringStatus" && (empSortConfig.direction === "ascending" ? "▲" : "▼")}
                      </th>
                      <th style={{ padding: "14px 10px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="13" style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                          No employees matched the query filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedEmployees.map((row, idx) => {
                        const riskColor = row.riskLevel === "High" ? "#ef4444" : row.riskLevel === "Medium" ? "#ea580c" : "#16a34a";
                        const riskBg = row.riskLevel === "High" ? "#fef2f2" : row.riskLevel === "Medium" ? "#fff7ed" : "#dcfce7";
                        
                        const statusColor = row.assessmentStatus === "Approved" ? "#16a34a" : row.assessmentStatus === "Pending" ? "#d97706" : "#ef4444";
                        const statusBg = row.assessmentStatus === "Approved" ? "#dcfce7" : row.assessmentStatus === "Pending" ? "#fef3c7" : "#fee2e2";
                        
                        const isDeactivated = deactivatedUserIds.has(row.hrmsId);
                        const displayMonStatus = isDeactivated ? "Deactivated" : row.monitoringStatus;

                        const monColor = displayMonStatus === "Active" ? "#16a34a" : 
                                         displayMonStatus === "On Duty" ? "#d97706" : 
                                         displayMonStatus === "Off Duty" ? "#475569" : 
                                         displayMonStatus === "Deactivated" ? "#64748b" : "#dc2626";
                        const monBg = displayMonStatus === "Active" ? "#dcfce7" : 
                                      displayMonStatus === "On Duty" ? "#fef3c7" : 
                                      displayMonStatus === "Off Duty" ? "#f1f5f9" : 
                                      displayMonStatus === "Deactivated" ? "#f1f5f9" : "#fee2e2";

                        const draftShift = empShiftDrafts[row.hrmsId] || "";

                        return (
                          <tr key={row.hrmsId} style={{ borderBottom: "1px solid #e2e8f0", fontSize: "13px" }}>
                            <td style={{ padding: "12px 10px", fontWeight: "700", color: "#0f172a" }}>{row.name}</td>
                            <td style={{ padding: "12px 10px", color: "#64748b", fontWeight: "600" }}>{row.hrmsId}</td>
                            <td style={{ padding: "12px 10px" }}>
                              <span style={{
                                background: "#f8fafc",
                                border: "1px solid #cbd5e1",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: "650",
                                color: "#334155"
                              }}>{row.designation}</span>
                            </td>
                            <td style={{ padding: "12px 10px", fontWeight: "600", color: "#334155" }}>{row.stationName}</td>
                            <td style={{ padding: "12px 10px", color: "#475569" }}>{row.division}</td>
                            <td style={{ padding: "12px 10px", color: "#475569" }}>{row.zone}</td>
                            <td style={{ padding: "12px 10px" }}>
                              <span style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontWeight: "700", fontSize: "11px" }}>
                                {row.category}
                              </span>
                            </td>
                            <td style={{ padding: "12px 10px" }}>
                              <span style={{ background: riskBg, color: riskColor, padding: "3px 8px", borderRadius: "6px", fontWeight: "700", fontSize: "11px" }}>
                                {row.riskLevel}
                              </span>
                            </td>
                            <td style={{ padding: "12px 10px" }}>
                              <span style={{ background: statusBg, color: statusColor, padding: "3px 8px", borderRadius: "6px", fontWeight: "700", fontSize: "11px" }}>
                                {row.assessmentStatus}
                              </span>
                            </td>
                            <td style={{ padding: "12px 10px", fontWeight: "700", color: "#0f172a" }}>{row.lastScore}/100</td>
                            <td style={{ padding: "12px 10px", color: "#64748b" }}>{row.lastAssessedDate}</td>
                            <td style={{ padding: "12px 10px" }}>
                              <span style={{ background: monBg, color: monColor, padding: "3px 8px", borderRadius: "6px", fontWeight: "700", fontSize: "11px" }}>
                                {displayMonStatus}
                              </span>
                            </td>
                            <td style={{ padding: "12px 10px", textAlign: "right" }}>
                              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => handleActionClick(row)}
                                  style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                                >
                                  Profile
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleDeactivate(row.hrmsId)}
                                  style={{
                                    background: isDeactivated ? "#f0fdf4" : "#fee2e2",
                                    color: isDeactivated ? "#16a34a" : "#dc2626",
                                    border: isDeactivated ? "1px solid #bbf7d0" : "1px solid #fecaca",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    cursor: "pointer"
                                  }}
                                >
                                  {isDeactivated ? "Activate" : "Deactivate"}
                                </button>
                                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                                  <select
                                    value={draftShift}
                                    onChange={(e) => setEmpShiftDrafts(prev => ({ ...prev, [row.hrmsId]: e.target.value }))}
                                    style={{
                                      padding: "3px 6px",
                                      border: "1px solid #cbd5e1",
                                      borderRadius: "4px",
                                      fontSize: "11px",
                                      background: "#ffffff",
                                      maxWidth: "110px",
                                      color: "#334155"
                                    }}
                                  >
                                    <option value="">Shift to...</option>
                                    {row.designation === "Pointsman" || row.designation === "Station Master" ? (
                                      stations
                                        .filter(s => s.stationCode !== row.stationCode)
                                        .map(s => (
                                          <option key={s.stationCode} value={s.stationCode}>
                                            {s.stationCode} ({s.stationName})
                                          </option>
                                        ))
                                    ) : (
                                      ["Nagpur", "Pune", "Mumbai", "Solapur"]
                                        .filter(div => div !== row.division)
                                        .map(div => (
                                          <option key={div} value={div}>
                                            {div} Div
                                          </option>
                                        ))
                                    )}
                                  </select>
                                  <button
                                    type="button"
                                    disabled={!draftShift}
                                    onClick={() => handleShiftEmployeeClick(row)}
                                    style={{
                                      background: draftShift ? "#2563eb" : "#f1f5f9",
                                      color: draftShift ? "#ffffff" : "#94a3b8",
                                      border: draftShift ? "1px solid #2563eb" : "1px solid #cbd5e1",
                                      padding: "4px 8px",
                                      borderRadius: "4px",
                                      fontSize: "11px",
                                      fontWeight: "700",
                                      cursor: draftShift ? "pointer" : "default"
                                    }}
                                  >
                                    Shift
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", padding: "0 8px" }}>
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                    Showing {(empCurrentPage - 1) * itemsPerPage + 1} to {Math.min(empCurrentPage * itemsPerPage, sortedEmployees.length)} of {sortedEmployees.length} employees
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      disabled={empCurrentPage === 1}
                      onClick={() => setEmpCurrentPage(prev => Math.max(prev - 1, 1))}
                      style={{ padding: "4px 10px", border: "1px solid #cbd5e1", borderRadius: "4px", background: "#ffffff", fontSize: "12px", cursor: empCurrentPage === 1 ? "default" : "pointer", opacity: empCurrentPage === 1 ? 0.5 : 1 }}
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setEmpCurrentPage(i + 1)}
                        style={{
                          padding: "4px 10px",
                          border: empCurrentPage === i + 1 ? "1px solid #2563eb" : "1px solid #cbd5e1",
                          borderRadius: "4px",
                          background: empCurrentPage === i + 1 ? "#2563eb" : "#ffffff",
                          color: empCurrentPage === i + 1 ? "#ffffff" : "#0f172a",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={empCurrentPage === totalPages}
                      onClick={() => setEmpCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      style={{ padding: "4px 10px", border: "1px solid #cbd5e1", borderRadius: "4px", background: "#ffffff", fontSize: "12px", cursor: empCurrentPage === totalPages ? "default" : "pointer", opacity: empCurrentPage === totalPages ? 0.5 : 1 }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
}
