import { AlertTriangle, FileText, ShieldCheck, Paperclip, Plus } from "lucide-react";

export default function TMSafety({
  openEmergencyDialog,
  safetySubTab,
  setSafetySubTab,
  safetyReports,
  submitTrackIssue,
  trackLine,
  setTrackLine,
  trackLocation,
  setTrackLocation,
  trackDefect,
  setTrackDefect,
  trackSeverity,
  setTrackSeverity,
  trackDesc,
  setTrackDesc,
  fileInputKey,
  handleFileChange,
  attachedFiles,
  removeAttachedFile,
  submitIncidentReport,
  incidentType,
  setIncidentType,
  incidentTrain,
  setIncidentTrain,
  incidentTime,
  setIncidentTime,
  incidentAction,
  setIncidentAction
}) {
  return (
          <section className="pm-page-card">
      <div className="pm-page-header">
        <h2>Safety Broadcast & Incident Reports</h2>
        <button className="pm-emergency-trigger-btn animate-pulse" onClick={openEmergencyDialog}>
          🚨 TRIGGER SYSTEM EMERGENCY ALERT
        </button>
      </div>
      <p className="pm-subtitle font-semibold">Immediate access to railway safety logs, abnormal track defect forms, and division-wide broadcasts.</p>

      {/* Safety Sub-Tabs */}
      <div className="pm-subnav-tabs" style={{ marginBottom: "16px" }}>
        <button
          className={`pm-subtab-btn ${safetySubTab === "track" ? "active" : ""}`}
          onClick={() => setSafetySubTab("track")}
        >
          <AlertTriangle size={16} /> Report Track Defect
        </button>
        <button
          className={`pm-subtab-btn ${safetySubTab === "incident" ? "active" : ""}`}
          onClick={() => setSafetySubTab("incident")}
        >
          <FileText size={16} /> Log Abnormal Incident
        </button>
        <button
          className={`pm-subtab-btn ${safetySubTab === "history" ? "active" : ""}`}
          onClick={() => setSafetySubTab("history")}
        >
          <ShieldCheck size={16} /> View Filed Safety Tickets ({safetyReports.length})
        </button>
      </div>

      {safetySubTab === "track" && (
        <form onSubmit={submitTrackIssue} className="pm-safety-form">
          <div className="pm-safety-form-grid">
            <div className="pm-form-field">
              <label>Siding / Station Line Location</label>
              <select value={trackLine} onChange={e => setTrackLine(e.target.value)}>
                <option value="Line 1 Main">Line 1 Main</option>
                <option value="Line 2 Loop">Line 2 Loop</option>
                <option value="Siding Line A">Siding Line A</option>
                <option value="Marshalling Yard Point 14">Marshalling Yard Point 14</option>
                <option value="Cross-over 11A">Cross-over 11A</option>
              </select>
            </div>
            <div className="pm-form-field">
              <label>KM Mark Location (e.g. 102/4)</label>
              <input
                type="text"
                placeholder="Enter KM Mark"
                value={trackLocation}
                onChange={e => setTrackLocation(e.target.value)}
                required
              />
            </div>
            <div className="pm-form-field">
              <label>Track Defect Class</label>
              <select value={trackDefect} onChange={e => setTrackDefect(e.target.value)}>
                <option value="Rail Fracture">Rail Joint Crack / Fracture</option>
                <option value="Points Jammed">Siding Point Jam / Failure</option>
                <option value="Track Obstruction">Obstruction on Siding (Fouling)</option>
                <option value="Ballast Washout">Ballast Washout / Sinkage</option>
                <option value="Vegetation Overgrowth">High Vegetation Blockage</option>
              </select>
            </div>
            <div className="pm-form-field">
              <label>Severity Category</label>
              <select value={trackSeverity} onChange={e => setTrackSeverity(e.target.value)}>
                <option value="High - Urgent Action">High - Urgent (Suspend Movements)</option>
                <option value="Medium - Caution Advised">Medium - Caution (15 km/h restriction)</option>
                <option value="Low - Monitor Area">Low - Watchful (Monitor daily)</option>
              </select>
            </div>
            <div className="pm-form-field pm-field-wide">
              <label>Defect Observations & Technical Details</label>
              <textarea
                rows="4"
                placeholder="Explain the visual findings, track alignment defects, or points feedback failures in detail..."
                value={trackDesc}
                onChange={e => setTrackDesc(e.target.value)}
                required
              />
            </div>

            {/* File Attachment Upload Mock */}
            <div className="pm-form-field pm-field-wide pm-upload-area">
              <label><Paperclip size={14} /> Upload Details (Photos, Track Reports, Audio Logs)</label>
              <div className="pm-file-selector-box">
                <input
                  key={fileInputKey}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="pm-hidden-file-input"
                  id="safety-evidence-files"
                />
                <label htmlFor="safety-evidence-files" className="pm-file-upload-label">
                  <Plus size={18} /> Click to Choose Files to Upload
                </label>
              </div>

              {attachedFiles.length > 0 && (
                <div className="pm-attached-files-list">
                  <h5>Evidence Files Queued ({attachedFiles.length}):</h5>
                  <ul>
                    {attachedFiles.map((file, fIdx) => (
                      <li key={fIdx}>
                        <span>📎 {file.name} ({file.size})</span>
                        <button type="button" onClick={() => removeAttachedFile(fIdx)}>Remove</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <button type="submit" className="pm-safety-submit-btn">
            Log Track defect safety ticket
          </button>
        </form>
      )}

      {safetySubTab === "incident" && (
        <form onSubmit={submitIncidentReport} className="pm-safety-form">
          <div className="pm-safety-form-grid">
            <div className="pm-form-field">
              <label>Abnormal incident Type</label>
              <select value={incidentType} onChange={e => setIncidentType(e.target.value)}>
                <option value="Hot Axle">Hot Axle / Sparks on Wheel</option>
                <option value="Flat Tyre">Flat Tyre / Heavy Impact Thuds</option>
                <option value="Brake Binding">Brake Binding (Heavy Smoke)</option>
                <option value="Hanging Parts">Hanging Coupling / Gear Parts</option>
                <option value="SPAD Incident">SPAD (Signal Passed at Danger)</option>
                <option value="Open Siding Gate">Unlocked Siding Gate during transit</option>
              </select>
            </div>
            <div className="pm-form-field">
              <label>Train Number & Name (e.g. 12289 Duronto)</label>
              <input
                type="text"
                placeholder="Enter Train Details"
                value={incidentTrain}
                onChange={e => setIncidentTrain(e.target.value)}
                required
              />
            </div>
            <div className="pm-form-field">
              <label>Time of Observation</label>
              <input
                type="datetime-local"
                value={incidentTime}
                onChange={e => setIncidentTime(e.target.value)}
              />
            </div>
            <div className="pm-form-field">
              <label>Immediate Safety Actions Taken</label>
              <input
                type="text"
                placeholder="e.g. Flagged Red, informed SM on Walkie-Talkie"
                value={incidentAction}
                onChange={e => setIncidentAction(e.target.value)}
                required
              />
            </div>
            <div className="pm-form-field pm-field-wide">
              <label>Incident Details & Hand-Signal Remarks</label>
              <textarea
                rows="4"
                placeholder="Describe the train movement, automatic block operations speeds, visual smoke, wheel fire, or hand signal exchanges..."
                value={trackDesc}
                onChange={e => setTrackDesc(e.target.value)}
              />
            </div>

            {/* File Upload Incident Details */}
            <div className="pm-form-field pm-field-wide pm-upload-area">
              <label><Paperclip size={14} /> Upload Incident Photos / Logs</label>
              <div className="pm-file-selector-box">
                <input
                  key={fileInputKey}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="pm-hidden-file-input"
                  id="incident-evidence-files"
                />
                <label htmlFor="incident-evidence-files" className="pm-file-upload-label">
                  <Plus size={18} /> Choose Evidence Logs
                </label>
              </div>

              {attachedFiles.length > 0 && (
                <div className="pm-attached-files-list">
                  <h5>Attached Evidence Logs ({attachedFiles.length}):</h5>
                  <ul>
                    {attachedFiles.map((file, fIdx) => (
                      <li key={fIdx}>
                        <span>📎 {file.name} ({file.size})</span>
                        <button type="button" onClick={() => removeAttachedFile(fIdx)}>Remove</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <button type="submit" className="pm-safety-submit-btn warning">
            File Critical Incident Report
          </button>
        </form>
      )}

      {safetySubTab === "history" && (
        <div className="pm-safety-records-list">
          <h3 style={{ fontSize: "16px", color: "#0e2e4f", marginBottom: "14px" }}>Submitted Safety Reports Ledger</h3>
          <div className="pm-safety-ledger-grid">
            {safetyReports.map(report => (
              <article key={report.id} className="pm-safety-ticket-card">
                <div className="pm-ticket-header">
                  <span className={`pm-ticket-type-badge ${report.type === "Track Defect" ? "defect" : "incident"}`}>
                    {report.type}
                  </span>
                  <span className="pm-ticket-date font-mono">{report.date}</span>
                </div>
                <h4>{report.defect}</h4>
                <div className="pm-ticket-details">
                  <div><strong>Loc:</strong> {report.location}</div>
                  <div><strong>Severity:</strong> <span className="text-danger-bold">{report.severity}</span></div>
                </div>
                <p className="pm-ticket-desc">{report.desc}</p>
                {report.attachments && report.attachments.length > 0 && (
                  <div className="pm-ticket-attachments">
                    <strong>Attachments ({report.attachments.length}):</strong>
                    <ul>
                      {report.attachments.map((at, idx) => <li key={idx} className="font-mono text-small">📎 {at.name} ({at.size})</li>)}
                    </ul>
                  </div>
                )}
                <div className="pm-ticket-footer">
                  <span>Ticket #{report.id}</span>
                  <span className={`pm-ticket-status ${report.status.replace(/\s+/g, '-').toLowerCase()}`}>
                    {report.status}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  
  );
}