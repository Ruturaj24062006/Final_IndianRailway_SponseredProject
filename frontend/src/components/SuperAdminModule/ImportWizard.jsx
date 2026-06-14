import React, { useState, useEffect } from "react";
import { UserCheck, Users, AlertTriangle, Play, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { getImportPreview, executeImport } from "../../services/phase16Service";

export default function ImportWizard({ staff = [], onImportSuccess }) {
  const [stagedRows, setStagedRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);

  const loadStagedData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getImportPreview();
      setStagedRows(res.data || []);
    } catch (err) {
      console.error("Error loading import preview:", err);
      setError("Failed to load staged employee roster preview.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStagedData();
  }, []);

  // Determine potential duplicates
  const existingHrmsMap = new Set(staff.map(s => (s.hrmsId || "").trim().toUpperCase()));
  
  const analyzedRows = stagedRows.map(row => {
    const hrmsUpper = (row.hrms_id || "").trim().toUpperCase();
    const isDuplicate = existingHrmsMap.has(hrmsUpper);
    return {
      ...row,
      isDuplicate
    };
  });

  const duplicateCount = analyzedRows.filter(r => r.isDuplicate).length;
  const uniqueCount = analyzedRows.length - duplicateCount;

  const handleExecuteImport = async () => {
    if (!window.confirm(`Are you sure you want to process all ${stagedRows.length} staged records? Duplicates will be automatically skipped.`)) {
      return;
    }

    try {
      setProcessing(true);
      setImportResult(null);
      setError(null);

      const res = await executeImport();
      
      setImportResult(res.summary);
      setStagedRows([]); // Clear preview since it was truncated on backend
      alert("Bulk import executed successfully!");

      if (onImportSuccess) {
        onImportSuccess(); // Trigger parent reload of employees list
      }
    } catch (err) {
      console.error("Import processing error:", err);
      setError(err.message || "Failed to process bulk import.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="sdom-fade">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 className="sdom-page-title">Bulk Employee Import Wizard</h1>
          <p className="sdom-page-subtitle">Review, validate, and bulk-load employee rosters from temporary staging tables directly to the active system.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button 
            type="button" 
            onClick={loadStagedData} 
            disabled={loading || processing}
            className="sdom-btn-outline"
            style={{ display: "flex", alignItems: "center", gap: "6px", height: "40px" }}
          >
            <RefreshCw size={14} className={loading ? "sdom-spin" : ""} /> Reload Preview
          </button>
          {stagedRows.length > 0 && (
            <button 
              type="button" 
              onClick={handleExecuteImport} 
              disabled={processing || loading}
              className="sdom-btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "8px", background: "#16a34a", border: "none", color: "white", padding: "8px 16px", height: "40px" }}
            >
              <Play size={14} fill="white" />
              {processing ? "Processing Import..." : "Execute Bulk Import"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", padding: "16px", borderRadius: "10px", color: "#991b1b", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertTriangle size={18} />
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Summary Cards */}
      {stagedRows.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <div style={{ background: "white", padding: "18px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Staged Roster Rows</span>
            <strong style={{ display: "block", fontSize: "26px", color: "#0f172a", marginTop: "4px" }}>{stagedRows.length}</strong>
          </div>
          <div style={{ background: "white", padding: "18px", borderRadius: "12px", border: "1px solid #cbd5e1", borderLeft: "4px solid #16a34a" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Ready to Import (New)</span>
            <strong style={{ display: "block", fontSize: "26px", color: "#16a34a", marginTop: "4px" }}>{uniqueCount}</strong>
          </div>
          <div style={{ background: "white", padding: "18px", borderRadius: "12px", border: "1px solid #cbd5e1", borderLeft: "4px solid #d97706" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Flagged duplicates (to be skipped)</span>
            <strong style={{ display: "block", fontSize: "26px", color: "#d97706", marginTop: "4px" }}>{duplicateCount}</strong>
          </div>
        </div>
      )}

      {/* Duplicate Alert Warning */}
      {duplicateCount > 0 && stagedRows.length > 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", padding: "16px", borderRadius: "10px", color: "#b45309", marginBottom: "24px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700" }}>
            <AlertTriangle size={18} />
            <span>Duplicate Employee Profiles Detected in Staging</span>
          </div>
          <p style={{ margin: 0, fontSize: "13px" }}>
            There are {duplicateCount} employees in the staging queue whose HRMS IDs already exist in the Nagpur Division active safety registry. To protect active records and safety evaluation trails, these profiles will be **skipped** during import. They will not be overwritten.
          </p>
        </div>
      )}

      {/* Import Result Screen */}
      {importResult && (
        <div style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#1e293b", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle size={22} color="#16a34a" />
            Import Summary Roster Report
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px", margin: "16px 0 24px" }}>
            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", textAlign: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>STAGED TOTAL</span>
              <strong style={{ display: "block", fontSize: "20px", color: "#0f172a", marginTop: "4px" }}>{importResult.totalStaged}</strong>
            </div>
            <div style={{ background: "#f0fdf4", padding: "14px", borderRadius: "8px", textAlign: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#16a34a" }}>IMPORTED (NEW)</span>
              <strong style={{ display: "block", fontSize: "20px", color: "#16a34a", marginTop: "4px" }}>{importResult.importedCount}</strong>
            </div>
            <div style={{ background: "#fffbeb", padding: "14px", borderRadius: "8px", textAlign: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#b45309" }}>SKIPPED (DUPLICATE)</span>
              <strong style={{ display: "block", fontSize: "20px", color: "#b45309", marginTop: "4px" }}>{importResult.skippedCount}</strong>
            </div>
            <div style={{ background: "#fef2f2", padding: "14px", borderRadius: "8px", textAlign: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#991b1b" }}>FAILED</span>
              <strong style={{ display: "block", fontSize: "20px", color: "#dc2626", marginTop: "4px" }}>{importResult.failedCount}</strong>
            </div>
          </div>

          <p style={{ color: "#475569", fontSize: "14px", margin: 0 }}>
            New employee profiles have been registered with roles mapped and credentials auto-generated. Standard security password hash has been created using standard project cryptography policy (Initial login credential defaults to standard project password <code>Railway@123</code>).
          </p>
        </div>
      )}

      {/* Preview Table */}
      {stagedRows.length > 0 ? (
        <div style={{ background: "white", padding: "20px", borderRadius: "16px", border: "1px solid #cbd5e1" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", marginBottom: "14px" }}>Staging Table Preview ({stagedRows.length} Rows Available)</h3>
          <div style={{ overflowX: "auto" }}>
            <table className="sdom-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>HRMS ID</th>
                  <th>Full Name</th>
                  <th>Designation</th>
                  <th>Station Code</th>
                  <th>Mobile Number</th>
                  <th>PF Number</th>
                  <th>Grade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {analyzedRows.map((row, idx) => (
                  <tr key={idx} style={{ background: row.isDuplicate ? "#fffbeb" : "white" }}>
                    <td style={{ fontFamily: "monospace", fontWeight: "700" }}>{row.hrms_id}</td>
                    <td style={{ fontWeight: "700" }}>{row.full_name}</td>
                    <td>{row.designation}</td>
                    <td style={{ fontWeight: "700", color: "#1e3a5f" }}>{row.station_code}</td>
                    <td>{row.mobile}</td>
                    <td>{row.pf_number}</td>
                    <td>
                      <span className={`sdom-badge ${row.category_grade === "A" ? "sdom-badge-success" : row.category_grade === "D" ? "sdom-badge-danger" : "sdom-badge-info"}`}>
                        {row.category_grade}
                      </span>
                    </td>
                    <td>
                      {row.isDuplicate ? (
                        <span className="sdom-badge sdom-badge-warning" style={{ background: "#fef3c7", color: "#b45309" }}>Duplicate (Skip)</span>
                      ) : (
                        <span className="sdom-badge sdom-badge-success" style={{ background: "#dcfce7", color: "#16a34a" }}>Ready</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        !loading && !importResult && (
          <div style={{ textAlign: "center", padding: "48px", background: "white", borderRadius: "16px", border: "1px solid #cbd5e1", color: "#64748b" }}>
            <Users size={40} style={{ color: "#94a3b8", marginBottom: "12px", margin: "0 auto" }} />
            <h4 style={{ fontSize: "16px", color: "#475569", fontWeight: "700" }}>No Staged Import Records Found</h4>
            <p style={{ fontSize: "13px", marginTop: "4px" }}>The temporary database staging table <code>employee_import</code> is empty. All employee rosters have been loaded or none are currently scheduled.</p>
          </div>
        )
      )}
    </div>
  );
}
