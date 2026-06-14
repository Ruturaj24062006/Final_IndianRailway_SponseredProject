import React, { useState, useEffect } from "react";
import { Users, UserCheck, ChevronDown, ChevronRight, UserPlus, RefreshCw, AlertTriangle, Plus, X } from "lucide-react";
import { getHierarchyTree, assignSupervisor } from "../../services/hierarchyService";

export default function HierarchyTree({ staff = [], onHierarchyUpdated }) {
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState(null); // { supervisorNode }
  const [selectedSubordinateId, setSelectedSubordinateId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState({});

  const loadTree = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getHierarchyTree();
      setTreeData(data);
      
      // Auto-expand root nodes by default
      const initialExpanded = {};
      data.forEach(root => {
        initialExpanded[root.id] = true;
      });
      setExpandedNodes(initialExpanded);
    } catch (err) {
      console.error("Error loading hierarchy tree:", err);
      setError("Failed to load division command hierarchy from PostgreSQL.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTree();
  }, []);

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const handleOpenAssign = (supervisor) => {
    setAssignModal(supervisor);
    setSelectedSubordinateId("");
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubordinateId || !assignModal) return;

    try {
      setSubmitting(true);
      await assignSupervisor(selectedSubordinateId, assignModal.id);
      alert("Supervisor relationship assigned successfully!");
      setAssignModal(null);
      loadTree();
      if (onHierarchyUpdated) onHierarchyUpdated();
    } catch (err) {
      alert(`Assignment failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveSupervisor = async (employeeId, employeeName) => {
    if (!window.confirm(`Are you sure you want to remove the supervisor for ${employeeName}?`)) {
      return;
    }

    try {
      setLoading(true);
      await assignSupervisor(employeeId, null);
      alert("Supervisor relationship removed successfully.");
      loadTree();
      if (onHierarchyUpdated) onHierarchyUpdated();
    } catch (err) {
      alert(`Removal failed: ${err.message}`);
      setLoading(false);
    }
  };

  // Helper to count total nodes in tree recursively
  const countNodes = (nodes) => {
    let count = 0;
    nodes.forEach(n => {
      count += 1 + countNodes(n.children || []);
    });
    return count;
  };

  // Filter available subordinates to prevent cycle and follow tier rules
  const getSubordinateOptions = (supervisor) => {
    if (!supervisor) return [];
    const superRole = (supervisor.designation || "").toLowerCase();

    return staff.filter(emp => {
      // 1. Cannot report to themselves
      if (emp.dbUuid === supervisor.id) return false;

      // 2. Validate operational tiers
      const empRole = (emp.designation || "").toLowerCase();
      
      if (superRole.includes("dom")) {
        // Sr. DOM supervises AOM
        return empRole.includes("aom");
      }
      if (superRole.includes("aom")) {
        // AOM supervises Traffic Inspectors (TIs)
        return empRole.includes("inspector") || empRole === "ti";
      }
      if (superRole.includes("inspector") || superRole === "ti") {
        // TI supervises Station Masters (SM)
        return empRole.includes("master") || empRole === "sm";
      }
      if (superRole.includes("master") || superRole === "sm" || superRole.includes("superintendent") || superRole.includes("supervisor")) {
        // SM supervises Pointsmen
        return empRole.includes("pointsman");
      }

      return false;
    });
  };

  // Collapsible node recursive renderer
  const renderTreeNode = (node, depth = 0) => {
    const isExpanded = !!expandedNodes[node.id];
    const hasChildren = node.children && node.children.length > 0;
    
    let categoryBg = "sdom-badge-success";
    if (node.category === "B") categoryBg = "sdom-badge-info";
    else if (node.category === "C") categoryBg = "sdom-badge-warning";
    else if (node.category === "D") categoryBg = "sdom-badge-danger";

    return (
      <div key={node.id} style={{ marginLeft: depth > 0 ? "32px" : "0", position: "relative" }}>
        {/* Connection line helper */}
        {depth > 0 && (
          <div style={{
            position: "absolute",
            left: "-20px",
            top: "24px",
            width: "20px",
            height: "1px",
            background: "#cbd5e1"
          }} />
        )}
        {depth > 0 && (
          <div style={{
            position: "absolute",
            left: "-20px",
            top: "-10px",
            width: "1px",
            height: "35px",
            background: "#cbd5e1"
          }} />
        )}

        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          background: "white", 
          border: "1px solid #cbd5e1", 
          borderRadius: "10px", 
          padding: "12px 18px", 
          marginBottom: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.01)",
          transition: "all 0.2s ease",
          minWidth: "450px"
        }} className="sdom-hierarchy-node-hover">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {hasChildren ? (
              <button 
                type="button" 
                onClick={() => toggleNode(node.id)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#64748b" }}
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <div style={{ width: "24px" }} />
            )}

            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a" }}>
                {node.name} <span style={{ fontFamily: "monospace", fontSize: "11px", fontWeight: "700", color: "#64748b" }}>({node.hrmsId})</span>
              </span>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569", marginTop: "2px" }}>
                {node.designation} · <span style={{ color: "#1e3a5f" }}>{node.station}</span>
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Category badge */}
            <span className={`sdom-badge ${categoryBg}`} style={{ fontSize: "11px", fontWeight: "800" }}>
              Grade {node.category}
            </span>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "6px" }}>
              {/* Only show assign option for management/supervisory roles */}
              {!node.designation.toLowerCase().includes("pointsman") && (
                <button
                  type="button"
                  onClick={() => handleOpenAssign(node)}
                  className="sdom-btn-outline"
                  style={{ padding: "4px 8px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                >
                  <UserPlus size={11} /> Add Reportee
                </button>
              )}
              {depth > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemoveSupervisor(node.id, node.name)}
                  className="sdom-btn-danger"
                  style={{ padding: "4px 8px", fontSize: "11px", border: "none", background: "#fef2f2", color: "#c53030" }}
                >
                  Remove Supervisor
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Children Render */}
        {hasChildren && isExpanded && (
          <div style={{ 
            borderLeft: "1px dashed #cbd5e1", 
            marginLeft: "11px",
            paddingLeft: "1px"
          }}>
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const totalRegistered = countNodes(treeData);

  return (
    <div className="sdom-fade">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0d2c4d", margin: 0 }}>Nagpur Division Command Structure</h2>
          <p className="sdom-page-subtitle">Divisional command reporting lines mapping pointsmen up to Sr. DOM.</p>
        </div>
        <button 
          onClick={loadTree} 
          disabled={loading}
          className="sdom-btn-outline" 
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <RefreshCw size={14} className={loading ? "sdom-spin" : ""} /> Reload Command Tree
        </button>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", padding: "16px", borderRadius: "10px", color: "#991b1b", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "white", padding: "16px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
          <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Hierarchy Registered Staff</span>
          <strong style={{ display: "block", fontSize: "24px", color: "#0f172a", marginTop: "4px" }}>{totalRegistered}</strong>
        </div>
        <div style={{ background: "white", padding: "16px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
          <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Division Command Roots</span>
          <strong style={{ display: "block", fontSize: "24px", color: "#0d2c4d", marginTop: "4px" }}>{treeData.length}</strong>
        </div>
      </div>

      {loading && treeData.length === 0 ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "64px", color: "#475569" }}>
          <RefreshCw size={20} className="sdom-spin" style={{ marginRight: "8px" }} /> Loading command tree structure...
        </div>
      ) : (
        <div style={{ background: "#f8fafc", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          {treeData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
              No operational reporting links registered. Use "Add Reportee" on supervisors to build the tree.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {treeData.map(root => renderTreeNode(root, 0))}
            </div>
          )}
        </div>
      )}

      {/* Assign Subordinate Modal */}
      {assignModal && (
        <div className="sdom-modal-overlay" style={{ zIndex: 99999 }} onClick={e => e.target === e.currentTarget && setAssignModal(null)}>
          <div className="sdom-modal sdom-modal--compact" style={{ background: "#fff", borderRadius: "12px", padding: "24px", width: "450px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1.5px solid #e2e8f0", paddingBottom: "12px", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#0d2c4d", fontWeight: "800" }}>Assign Subordinate Reportee</h3>
              <button type="button" onClick={() => setAssignModal(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Supervisor Name</label>
                  <input type="text" value={`${assignModal.name} (${assignModal.designation})`} disabled style={{ background: "#f1f5f9", width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", marginTop: "4px" }} />
                </div>

                <div className="sdom-modal-field">
                  <label style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Select Subordinate Staff *</label>
                  <select
                    value={selectedSubordinateId}
                    onChange={(e) => setSelectedSubordinateId(e.target.value)}
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", marginTop: "4px", background: "white" }}
                  >
                    <option value="">-- Choose Subordinate --</option>
                    {getSubordinateOptions(assignModal).map(emp => (
                      <option key={emp.dbUuid} value={emp.dbUuid}>
                        {emp.name} ({emp.hrmsId}) [{emp.designation}]
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {getSubordinateOptions(assignModal).length === 0 && (
                <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", padding: "12px", borderRadius: "6px", color: "#b45309", marginTop: "16px", fontSize: "12px", display: "flex", gap: "6px", alignItems: "center" }}>
                  <AlertTriangle size={14} />
                  <span>No compatible active staff matching reporting level bounds found.</span>
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button 
                  type="submit" 
                  disabled={submitting || !selectedSubordinateId}
                  className="sdom-btn-primary" 
                  style={{ flex: 1, height: "40px" }}
                >
                  {submitting ? "Assigning..." : "Assign Reportee"}
                </button>
                <button 
                  type="button" 
                  className="sdom-btn-ghost" 
                  style={{ flex: 1, height: "40px" }} 
                  onClick={() => setAssignModal(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
