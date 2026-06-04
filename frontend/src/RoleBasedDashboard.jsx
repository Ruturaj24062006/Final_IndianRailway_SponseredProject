import { LogOut, Home, FileCheck, ClipboardCheck, CheckCircle } from "lucide-react";
import { useState } from "react";

function RoleBasedDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");

  // Assessment Workflow Configuration
  const assessmentWorkflow = {
    "Pointsman": {
      assessedBy: "SM INCHARGE",
      approvedBy: "TI",
      canAssess: false,
      canApprove: false
    },
    "Station Master": {
      assessedBy: "TI/SS",
      approvedBy: "AOM/G",
      canAssess: false,
      canApprove: false
    },
    "Train Manager": {
      assessedBy: "TI/SS",
      approvedBy: "AOM/G",
      canAssess: false,
      canApprove: false
    },
    "Station Supervisor": {
      assessedBy: "AOM/G",
      approvedBy: "AOM/G",
      canAssess: true,
      canApprove: false
    },
    "Traffic Inspector": {
      assessedBy: "AOM/G",
      approvedBy: "AOM/G",
      canAssess: true,
      canApprove: false
    },
    "AOM/General": {
      assessedBy: "N/A",
      approvedBy: "N/A",
      canAssess: true,
      canApprove: true
    }
  };

  // Who each role can assess
  const assessmentTargets = {
    "SM INCHARGE": ["Pointsman"],
    "TI": ["Pointsman"],
    "TI/SS": ["Station Master", "Train Manager"],
    "AOM/G": ["Station Master", "Train Manager", "Traffic Inspector", "Station Supervisor"]
  };

  const getRoleDashboardTitle = () => {
    const messages = {
      "Pointsman": "Pointsman Dashboard",
      "Station Master": "Station Master Dashboard",
      "Train Manager": "Train Manager Dashboard",
      "Station Supervisor": "Station Supervisor Dashboard",
      "Traffic Inspector": "Traffic Inspector Dashboard",
      "AOM/General": "AOM/General Dashboard",
      "Super Admin": "Super Admin Dashboard"
    };
    return messages[user.role] || "Dashboard";
  };

  const getAssessmentInfo = () => {
    return assessmentWorkflow[user.role] || {};
  };

  const assessmentInfo = getAssessmentInfo();

  return (
    <div className="role-dashboard-wrapper">
      <header className="role-topbar">
        <div className="role-brand">
          <div className="role-logo">IR</div>
          <div>
            <h2>Indian Railway Evaluation System</h2>
            <p>{user.role}</p>
          </div>
        </div>
        <div className="role-topbar-right">
          <div className="role-user-info">
            <div className="role-avatar">{user.hrmsId.substring(0, 2)}</div>
            <div>
              <strong>{user.hrmsId}</strong>
              <span>{user.role}</span>
            </div>
          </div>
          <button className="role-logout-btn" onClick={onLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <div className="role-dashboard-content">
        {/* Tab Navigation */}
        <div className="role-tabs">
          <button 
            className={`role-tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <Home size={16} /> Overview
          </button>
          <button 
            className={`role-tab ${activeTab === "assessment" ? "active" : ""}`}
            onClick={() => setActiveTab("assessment")}
          >
            <FileCheck size={16} /> Assessment Workflow
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="role-dashboard-card">
            <div className="role-dashboard-icon">
              <Home size={48} />
            </div>
            <h1>{getRoleDashboardTitle()}</h1>
            <p>Role-based evaluation system dashboard</p>
            <div className="role-info-grid">
              <div className="role-info-item">
                <label>HRMS ID</label>
                <span>{user.hrmsId}</span>
              </div>
              <div className="role-info-item">
                <label>Role</label>
                <span>{user.role}</span>
              </div>
              <div className="role-info-item">
                <label>Status</label>
                <span className="status-active">Active</span>
              </div>
            </div>
          </div>
        )}

        {/* Assessment Workflow Tab */}
        {activeTab === "assessment" && (
          <div className="assessment-workflow-container">
            <div className="assessment-card">
              <h2>Assessment Workflow for {user.role}</h2>
              
              {/* Assessment Info */}
              <div className="assessment-info-grid">
                <div className="assessment-info-box">
                  <div className="assessment-label">
                    <FileCheck size={20} /> Assessed By
                  </div>
                  <div className="assessment-value">{assessmentInfo.assessedBy}</div>
                </div>

                <div className="assessment-info-box">
                  <div className="assessment-label">
                    <CheckCircle size={20} /> Approved By
                  </div>
                  <div className="assessment-value">{assessmentInfo.approvedBy}</div>
                </div>
              </div>

              {/* Assessment Permissions */}
              <div className="assessment-permissions">
                <h3>Your Assessment Permissions</h3>
                <div className="permission-items">
                  <div className={`permission-item ${assessmentInfo.canAssess ? "active" : "inactive"}`}>
                    <div className={`permission-icon ${assessmentInfo.canAssess ? "green" : "gray"}`}>
                      ✓
                    </div>
                    <div className="permission-text">
                      <strong>Can Assess</strong>
                      <p>{assessmentInfo.canAssess ? "You can assess employees" : "You cannot assess employees"}</p>
                    </div>
                  </div>

                  <div className={`permission-item ${assessmentInfo.canApprove ? "active" : "inactive"}`}>
                    <div className={`permission-icon ${assessmentInfo.canApprove ? "green" : "gray"}`}>
                      ✓
                    </div>
                    <div className="permission-text">
                      <strong>Can Approve</strong>
                      <p>{assessmentInfo.canApprove ? "You can approve assessments" : "You cannot approve assessments"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assessment Chain */}
              <div className="assessment-chain">
                <h3>Complete Assessment Chain</h3>
                <div className="chain-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Designation</th>
                        <th>Assessed By</th>
                        <th>Approved By</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Pointsman</td>
                        <td>SM INCHARGE</td>
                        <td>TI</td>
                      </tr>
                      <tr>
                        <td>Station Master</td>
                        <td>TI/SS</td>
                        <td>AOM/G</td>
                      </tr>
                      <tr>
                        <td>Traffic Inspector / Station Supervisor</td>
                        <td>AOM/G</td>
                        <td>AOM/G</td>
                      </tr>
                      <tr>
                        <td>Train Manager</td>
                        <td>TI/SS</td>
                        <td>AOM/G</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .role-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 2px solid #e0e0e0;
        }

        .role-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #666;
          border-bottom: 3px solid transparent;
          transition: all 0.3s ease;
        }

        .role-tab.active {
          color: #0066cc;
          border-bottom-color: #0066cc;
        }

        .role-tab:hover {
          color: #0066cc;
        }

        .assessment-workflow-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .assessment-card {
          background: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .assessment-card h2 {
          color: #333;
          margin-bottom: 30px;
          font-size: 20px;
        }

        .assessment-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 40px;
        }

        .assessment-info-box {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #0066cc;
        }

        .assessment-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #666;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .assessment-value {
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .assessment-permissions {
          margin-bottom: 40px;
        }

        .assessment-permissions h3 {
          color: #333;
          margin-bottom: 15px;
          font-size: 16px;
        }

        .permission-items {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .permission-item {
          display: flex;
          gap: 12px;
          padding: 15px;
          border-radius: 8px;
          border: 2px solid #e0e0e0;
        }

        .permission-item.active {
          border-color: #4caf50;
          background: #f1f8f5;
        }

        .permission-item.inactive {
          border-color: #ccc;
          background: #f9f9f9;
        }

        .permission-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          flex-shrink: 0;
        }

        .permission-icon.green {
          background: #4caf50;
        }

        .permission-icon.gray {
          background: #bbb;
        }

        .permission-text strong {
          display: block;
          color: #333;
          margin-bottom: 5px;
        }

        .permission-text p {
          color: #666;
          font-size: 13px;
          margin: 0;
        }

        .assessment-chain {
          border-top: 2px solid #e0e0e0;
          padding-top: 30px;
        }

        .assessment-chain h3 {
          color: #333;
          margin-bottom: 15px;
          font-size: 16px;
        }

        .chain-table {
          overflow-x: auto;
        }

        .chain-table table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .chain-table th {
          background: #0066cc;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
        }

        .chain-table td {
          padding: 12px;
          border-bottom: 1px solid #e0e0e0;
        }

        .chain-table tr:hover {
          background: #f5f5f5;
        }
      `}</style>
    </div>
  );
}

export default RoleBasedDashboard;
