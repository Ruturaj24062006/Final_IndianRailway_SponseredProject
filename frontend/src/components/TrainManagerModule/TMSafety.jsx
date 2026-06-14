import { AlertTriangle, FileText, ShieldCheck, Paperclip, Plus } from "lucide-react";
import { useLanguage } from "../../utils/LanguageContext";

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
  const { t } = useLanguage();

  return (
    <section className="pm-page-card">
      <div className="pm-page-header">
        <h2>{t("safety.title")}</h2>
        <button className="pm-emergency-trigger-btn animate-pulse" onClick={openEmergencyDialog}>
          {t("buttons.triggerEmergency")}
        </button>
      </div>
      <p className="pm-subtitle font-semibold">{t("safety.subtitle")}</p>

      {/* Safety Sub-Tabs */}
      <div className="pm-subnav-tabs" style={{ marginBottom: "16px" }}>
        <button
          className={`pm-subtab-btn ${safetySubTab === "track" ? "active" : ""}`}
          onClick={() => setSafetySubTab("track")}
        >
          <AlertTriangle size={16} /> {t("safety.reportTrackDefect")}
        </button>
        <button
          className={`pm-subtab-btn ${safetySubTab === "incident" ? "active" : ""}`}
          onClick={() => setSafetySubTab("incident")}
        >
          <FileText size={16} /> {t("safety.logIncident")}
        </button>
        <button
          className={`pm-subtab-btn ${safetySubTab === "history" ? "active" : ""}`}
          onClick={() => setSafetySubTab("history")}
        >
          <ShieldCheck size={16} /> {t("safety.viewTickets")} ({safetyReports.length})
        </button>
      </div>

      {safetySubTab === "track" && (
        <form onSubmit={submitTrackIssue} className="pm-safety-form">
          <div className="pm-safety-form-grid">
            <div className="pm-form-field">
              <label>{t("safety.sidingLocation")}</label>
              <select value={trackLine} onChange={e => setTrackLine(e.target.value)}>
                <option value="Line 1 Main">{t("safetyOptions.line1Main")}</option>
                <option value="Line 2 Loop">{t("safetyOptions.line2Loop")}</option>
                <option value="Siding Line A">{t("safetyOptions.sidingLineA")}</option>
                <option value="Marshalling Yard Point 14">{t("safetyOptions.yardPoint14")}</option>
                <option value="Cross-over 11A">{t("safetyOptions.crossover11A")}</option>
              </select>
            </div>
            <div className="pm-form-field">
              <label>{t("safety.kmMark")}</label>
              <input
                type="text"
                placeholder={t("safety.kmMarkPlaceholder") || "Enter KM Mark"}
                value={trackLocation}
                onChange={e => setTrackLocation(e.target.value)}
                required
              />
            </div>
            <div className="pm-form-field">
              <label>{t("safety.defectClass")}</label>
              <select value={trackDefect} onChange={e => setTrackDefect(e.target.value)}>
                <option value="Rail Fracture">{t("safetyOptions.railFracture")}</option>
                <option value="Points Jammed">{t("safetyOptions.pointsJammed")}</option>
                <option value="Track Obstruction">{t("safetyOptions.trackObstruction")}</option>
                <option value="Ballast Washout">{t("safetyOptions.ballastWashout")}</option>
                <option value="Vegetation Overgrowth">{t("safetyOptions.vegetationOvergrowth")}</option>
              </select>
            </div>
            <div className="pm-form-field">
              <label>{t("safety.severityCategory")}</label>
              <select value={trackSeverity} onChange={e => setTrackSeverity(e.target.value)}>
                <option value="High - Urgent Action">{t("safetyOptions.highUrgent")}</option>
                <option value="Medium - Caution Advised">{t("safetyOptions.mediumCaution")}</option>
                <option value="Low - Monitor Area">{t("safetyOptions.lowMonitor")}</option>
              </select>
            </div>
            <div className="pm-form-field pm-field-wide">
              <label>{t("safety.observations")}</label>
              <textarea
                rows="4"
                placeholder={t("safety.explainVisualFindings") || "Explain the visual findings, track alignment defects, or points feedback failures in detail..."}
                value={trackDesc}
                onChange={e => setTrackDesc(e.target.value)}
                required
              />
            </div>

            {/* File Attachment Upload Mock */}
            <div className="pm-form-field pm-field-wide pm-upload-area">
              <label><Paperclip size={14} /> {t("safety.uploadDetails")}</label>
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
                  <Plus size={18} /> {t("safety.chooseFiles")}
                </label>
              </div>

              {attachedFiles.length > 0 && (
                <div className="pm-attached-files-list">
                  <h5>{t("safety.evidenceQueued") || "Evidence Files Queued"} ({attachedFiles.length}):</h5>
                  <ul>
                    {attachedFiles.map((file, fIdx) => (
                      <li key={fIdx}>
                        <span>📎 {file.name} ({file.size})</span>
                        <button type="button" onClick={() => removeAttachedFile(fIdx)}>{t("buttons.delete") || "Remove"}</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <button type="submit" className="pm-safety-submit-btn">
            {t("safety.submitTicket")}
          </button>
        </form>
      )}

      {safetySubTab === "incident" && (
        <form onSubmit={submitIncidentReport} className="pm-safety-form">
          <div className="pm-safety-form-grid">
            <div className="pm-form-field">
              <label>{t("safety.incidentType")}</label>
              <select value={incidentType} onChange={e => setIncidentType(e.target.value)}>
                <option value="Hot Axle">{t("safetyOptions.hotAxle")}</option>
                <option value="Flat Tyre">{t("safetyOptions.flatTyre")}</option>
                <option value="Brake Binding">{t("safetyOptions.brakeBinding")}</option>
                <option value="Hanging Parts">{t("safetyOptions.hangingParts")}</option>
                <option value="SPAD Incident">{t("safetyOptions.spadIncident")}</option>
                <option value="Open Siding Gate">{t("safetyOptions.openSidingGate")}</option>
              </select>
            </div>
            <div className="pm-form-field">
              <label>{t("safety.trainNumber")}</label>
              <input
                type="text"
                placeholder={t("safety.trainNumberPlaceholder") || "Enter Train Details"}
                value={incidentTrain}
                onChange={e => setIncidentTrain(e.target.value)}
                required
              />
            </div>
            <div className="pm-form-field">
              <label>{t("safety.observationTime")}</label>
              <input
                type="datetime-local"
                value={incidentTime}
                onChange={e => setIncidentTime(e.target.value)}
              />
            </div>
            <div className="pm-form-field">
              <label>{t("safety.safetyActions")}</label>
              <input
                type="text"
                placeholder={t("safety.safetyActionsPlaceholder") || "e.g. Flagged Red, informed SM on Walkie-Talkie"}
                value={incidentAction}
                onChange={e => setIncidentAction(e.target.value)}
                required
              />
            </div>
            <div className="pm-form-field pm-field-wide">
              <label>{t("safety.incidentDetails")}</label>
              <textarea
                rows="4"
                placeholder={t("safety.explainIncident") || "Describe the train movement, shunting speeds, visual smoke, wheel fire, or hand signal exchanges..."}
                value={trackDesc}
                onChange={e => setTrackDesc(e.target.value)}
              />
            </div>

            {/* File Upload Incident Details */}
            <div className="pm-form-field pm-field-wide pm-upload-area">
              <label><Paperclip size={14} /> {t("safety.uploadDetails") || "Upload Incident Photos / Logs"}</label>
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
                  <Plus size={18} /> {t("safety.chooseFiles") || "Choose Evidence Logs"}
                </label>
              </div>

              {attachedFiles.length > 0 && (
                <div className="pm-attached-files-list">
                  <h5>{t("safety.evidenceQueued") || "Attached Evidence Logs"} ({attachedFiles.length}):</h5>
                  <ul>
                    {attachedFiles.map((file, fIdx) => (
                      <li key={fIdx}>
                        <span>📎 {file.name} ({file.size})</span>
                        <button type="button" onClick={() => removeAttachedFile(fIdx)}>{t("buttons.delete") || "Remove"}</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <button type="submit" className="pm-safety-submit-btn warning">
            {t("safety.submitIncident")}
          </button>
        </form>
      )}

      {safetySubTab === "history" && (
        <div className="pm-safety-records-list">
          <h3 style={{ fontSize: "16px", color: "#0e2e4f", marginBottom: "14px" }}>{t("safety.ledgerTitle")}</h3>
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
                  <div><strong>{t("safety.sidingLocation")}:</strong> {report.location}</div>
                  <div><strong>{t("safety.severityCategory")}:</strong> <span className="text-danger-bold">{report.severity}</span></div>
                </div>
                <p className="pm-ticket-desc">{report.desc}</p>
                {report.attachments && report.attachments.length > 0 && (
                  <div className="pm-ticket-attachments">
                    <strong>{t("safety.uploadDetails")} ({report.attachments.length}):</strong>
                    <ul>
                      {report.attachments.map((at, idx) => <li key={idx} className="font-mono text-small">📎 {at.name} ({at.size})</li>)}
                    </ul>
                  </div>
                )}
                <div className="pm-ticket-footer">
                  <span>{t("safety.ticket")} #{report.id}</span>
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