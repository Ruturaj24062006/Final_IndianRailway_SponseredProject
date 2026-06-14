import React, { useState, useEffect } from "react";
import { FileText, Upload, Trash2, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { getEmployeeDocuments, uploadDocument, deleteDocument } from "../../services/phase16Service";

export default function DossierTab({ employeeId, employeeName }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("Medical Certificate");
  const [error, setError] = useState(null);

  const loadDocs = async () => {
    if (!employeeId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getEmployeeDocuments(employeeId);
      setDocuments(data);
    } catch (err) {
      console.error("Error loading dossier documents:", err);
      setError("Failed to load dossier documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, [employeeId]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit.");
      return;
    }

    try {
      setUploading(true);
      const reader = new FileReader();
      
      reader.onload = async () => {
        const base64Data = reader.result;
        try {
          await uploadDocument({
            employee_id: employeeId,
            document_type: docType,
            fileName: file.name,
            fileData: base64Data
          });
          alert("Document uploaded successfully!");
          // Clear input file
          e.target.value = null;
          loadDocs();
        } catch (uploadErr) {
          alert(`Upload failed: ${uploadErr.message}`);
        } finally {
          setUploading(false);
        }
      };

      reader.onerror = () => {
        alert("Failed to read file.");
        setUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error preparing upload:", err);
      alert("Error preparing file upload.");
      setUploading(false);
    }
  };

  const handleDelete = async (docId, type) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteDocument(docId);
      alert("Document deleted successfully.");
      loadDocs();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
      setLoading(false);
    }
  };

  const getAbsoluteUrl = (relativeUrl) => {
    if (!relativeUrl) return "#";
    if (relativeUrl.startsWith("http")) return relativeUrl;
    return `http://127.0.0.1:5000${relativeUrl}`;
  };

  return (
    <div style={{ marginTop: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1.5px solid #cbd5e1", paddingBottom: "10px", marginBottom: "16px" }}>
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
          <FileText size={16} color="#2563eb" />
          Safety Documents &amp; Digital Dossier ({employeeName})
        </h3>
        <button 
          onClick={loadDocs} 
          disabled={loading}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "#64748b" }}
        >
          <RefreshCw size={14} className={loading ? "sdom-spin" : ""} />
        </button>
      </div>

      {/* Upload Panel */}
      <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px dashed #cbd5e1", marginBottom: "20px", display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Document Classification</label>
          <select 
            value={docType} 
            onChange={(e) => setDocType(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white", fontSize: "13px", minWidth: "200px" }}
          >
            <option value="Medical Certificate">Medical Certificate (PME)</option>
            <option value="Refresher Certificate">Refresher Certificate (REF)</option>
            <option value="CBT Score Sheet">CBT Score Sheet</option>
            <option value="Counselling Note">Safety Counselling Record</option>
            <option value="Other">Other Assessment Certificate</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Upload Digital Attachment (PDF, PNG, JPG)</label>
          <div style={{ position: "relative" }}>
            <input 
              type="file" 
              accept=".pdf,.png,.jpg,.jpeg" 
              onChange={handleFileUpload}
              disabled={uploading}
              id="dossier-file-input"
              style={{ display: "none" }}
            />
            <label 
              htmlFor="dossier-file-input" 
              style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "8px", 
                padding: "8px 16px", 
                background: uploading ? "#94a3b8" : "#2563eb", 
                color: "white", 
                borderRadius: "6px", 
                fontWeight: "700", 
                fontSize: "13px", 
                cursor: uploading ? "not-allowed" : "pointer",
                border: "none",
                transition: "all 0.2s"
              }}
            >
              <Upload size={14} />
              {uploading ? "Uploading Attachment..." : "Select & Upload File"}
            </label>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && documents.length === 0 && (
        <div style={{ display: "flex", justifyContent: "center", padding: "32px", color: "#64748b" }}>
          <RefreshCw size={20} className="sdom-spin" style={{ marginRight: "8px" }} /> Loading dossier attachment list...
        </div>
      )}

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#c53030", fontSize: "13px", marginBottom: "16px" }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Documents List */}
      {!loading && documents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px", color: "#64748b", background: "#f8fafc", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
          No digital documents have been uploaded to this employee's dossier yet.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="sdom-table" style={{ width: "100%" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Document Type</th>
                <th style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>File Path</th>
                <th style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Uploaded At</th>
                <th style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td style={{ fontWeight: "700", color: "#0f172a" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <FileText size={14} color="#64748b" />
                      {doc.document_type}
                    </span>
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: "12px", color: "#475569" }}>
                    {doc.file_url}
                  </td>
                  <td style={{ fontSize: "13px", color: "#64748b" }}>
                    {new Date(doc.uploaded_at).toLocaleString()}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "8px" }}>
                      <a 
                        href={getAbsoluteUrl(doc.file_url)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="sdom-btn-outline"
                        style={{ padding: "4px 8px", fontSize: "11.5px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        <ExternalLink size={12} /> View File
                      </a>
                      <button 
                        type="button" 
                        className="sdom-btn-danger"
                        style={{ padding: "4px 8px", fontSize: "11.5px", background: "#fee2e2", color: "#c53030", border: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        onClick={() => handleDelete(doc.id, doc.document_type)}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
