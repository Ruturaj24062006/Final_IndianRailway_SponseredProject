import { useState } from "react";
import { Search, ClipboardList, CheckCircle, RefreshCw, Paperclip, ChevronLeft, ChevronRight, XCircle } from "lucide-react";

export default function AOmApprovals({
  aomPointsmen,
  setAomPointsmen,
  reviewTab,
  setReviewTab,
  reviewSearch,
  setReviewSearch,
  reviewStation,
  setReviewStation,
  selectedPmId,
  setSelectedPmId,
  editSections,
  setEditSections,
  tiRemarks,
  setTiRemarks,
  showAudit,
  setShowAudit,
  rejectMode,
  setRejectMode,
  stationsDirectory,
  catBadge,
  statusBadge,
  riskBadge
}) {
  const getEmployeeName = (empLine) => {
          if (!empLine) return "—";
          const match = empLine.match(/Employee:\s*([^|]+)/i);
          return match ? match[1].trim() : empLine;
        };
        const getDivision = (empLine) => {
          if (!empLine) return "—";
          const match = empLine.match(/Division:\s*(.+)/i);
          return match ? match[1].trim() : "—";
        };
        const getAssessedBy = (byLine) => {
          if (!byLine) return "—";
          const match = byLine.match(/(?:Assessed by|Awaiting):\s*([^-]+)/i);
          return match ? match[1].trim() : byLine;
        };
        const getPendingSince = (byLine) => {
          if (!byLine) return "—";
          const match = byLine.match(/on\s+(\d{4}-\d{2}-\d{2})/i);
          return match ? match[1].trim() : "2026-04-12";
        };
        const getDesignation = (title) => {
          if (!title) return "—";
          return title.split(" - ")[0] || "Employee";
        };
        
        const handleViewDetails = (item) => {
          const tab = resolveAssessmentTab(item.title);
          setAssessmentRoleTab(tab);
          setOpenAssessmentId(item.id);
          setActivePage("Assessments");
        };

        return (
          <div className="reports-page">
            <div className="page-header" style={{ marginBottom: "20px" }}>
              <h2>Pending Approval Requests</h2>
              <p>Review safety and performance metrics, then approve or reject pending evaluations.</p>
            </div>

            {assessmentActionNotice && (
              <div className="notice-card success" style={{ marginBottom: "16px", padding: "12px 16px" }}>
                <span>✓</span>
                <p><strong>System Action:</strong> {assessmentActionNotice}</p>
                <button 
                  type="button" 
                  onClick={() => setAssessmentActionNotice("")} 
                  style={{ marginLeft: "auto", background: "none", border: "none", color: "#16a34a", cursor: "pointer", fontWeight: "bold" }}
                >
                  ✕
                </button>
              </div>
            )}

            <div className="reports-container">
              <div className="reports-table-section">
                <h3>Awaiting Sign-Off ({pendingAssessments.length})</h3>
                <div style={{ overflowX: "auto" }}>
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>HRMS ID</th>
                        <th>Employee Details</th>
                        <th>Designation</th>
                        <th>Submitted Score</th>
                        <th>Submitted By</th>
                        <th>Pending Since</th>
                        <th style={{ textAlign: "center" }}>Approval Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingAssessments.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                            No pending assessments require approval at this time.
                          </td>
                        </tr>
                      ) : (
                        pendingAssessments.map((item) => {
                          const { score, grade } = computeScoreAndGrade(item);
                          const empName = getEmployeeName(item.employeeLine);
                          const division = getDivision(item.employeeLine);
                          const designation = getDesignation(item.title);
                          const assessedBy = getAssessedBy(item.assessedByLine);
                          const pendingSince = getPendingSince(item.assessedByLine);

                          return (
                            <tr key={item.id}>
                              <td><strong>{item.id}</strong></td>
                              <td>
                                <div style={{ fontWeight: 600, color: "#0f172a" }}>{empName}</div>
                                <div style={{ fontSize: "11px", color: "#64748b" }}>Division: {division}</div>
                              </td>
                              <td>
                                <span style={{
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                  backgroundColor: "#f1f5f9",
                                  color: "#475569",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  textTransform: "uppercase"
                                }}>
                                  {designation}
                                </span>
                              </td>
                              <td>
                                <strong style={{ color: score >= 90 ? "#16a34a" : score >= 80 ? "#2563eb" : "#dc2626" }}>
                                  {score}/100
                                </strong>
                                <span style={{
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  backgroundColor: "#eff6ff",
                                  color: "#2563eb",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  marginLeft: "6px"
                                }}>
                                  Grade {grade}
                                </span>
                              </td>
                              <td>{assessedBy}</td>
                              <td>{pendingSince}</td>
                              <td>
                                <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                                  <button
                                    type="button"
                                    className="sm2-monitor-btn"
                                    onClick={() => handleViewDetails(item)}
                                    style={{
                                      backgroundColor: "#eff6ff",
                                      color: "#2563eb",
                                      border: "1px solid #bfdbfe",
                                      padding: "6px 12px",
                                      fontSize: "12px"
                                    }}
                                  >
                                    View Details
                                  </button>
                                  <button
                                    type="button"
                                    className="sm2-monitor-btn"
                                    onClick={() => handleApproveAssessment(item.id)}
                                    style={{
                                      backgroundColor: "#f0fdf4",
                                      color: "#16a34a",
                                      border: "1px solid #bbf7d0",
                                      padding: "6px 12px",
                                      fontSize: "12px"
                                    }}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    className="sm2-monitor-btn"
                                    onClick={() => handleRejectAssessment(item.id)}
                                    style={{
                                      backgroundColor: "#fef2f2",
                                      color: "#dc2626",
                                      border: "1px solid #fecaca",
                                      padding: "6px 12px",
                                      fontSize: "12px"
                                    }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
}
