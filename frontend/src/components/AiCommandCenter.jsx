import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Search,
  Download,
  Database,
  AlertTriangle,
  User,
  Activity,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  FileText,
  UserCheck
} from "lucide-react";
import { jsPDF } from "jspdf";
import {
  sendChat,
  sendQuery,
  getRiskExplanation,
  getInvestigationReport,
  getAiExecutiveSummary
} from "../services/aiService";
import { useLanguage } from "../utils/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";

export default function AiCommandCenter({ user, role }) {
  const { locale, changeLanguage, t } = useLanguage();
  // Navigation tabs: chat | nlq | explain | investigate | executive
  const [activeTab, setActiveTab] = useState("chat");

  // Global disclaimer string
  const DISCLAIMER_TEXT = t("ai.disclaimer") || "Disclaimer: AI-generated reports are tools for operational assistance and must be verified against official system records before executing safety-critical decisions.";

  // Loading & error states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Voice recognition support check
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;
  const [isListening, setIsListening] = useState(false);

  // Chat tab states
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      role: "assistant",
      isGreeting: true
    }
  ]);
  const chatEndRef = useRef(null);

  // NLQ tab states
  const [nlqInput, setNlqInput] = useState("");
  const [nlqResult, setNlqResult] = useState(null);

  // Risk Explainer tab states
  const [hrmsId, setHrmsId] = useState("");
  const [riskData, setRiskData] = useState(null);

  // Investigation tab states
  const [investigateHrms, setInvestigateHrms] = useState("");
  const [incidentDetails, setIncidentDetails] = useState("");
  const [investigationResult, setInvestigationResult] = useState(null);

  // Executive Summary tab states
  const [summaryNarrative, setSummaryNarrative] = useState("");
  const [summaryMeta, setSummaryMeta] = useState(null);

  // Scroll to bottom of chat
  useEffect(() => {
    if (activeTab === "chat" && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, activeTab]);

  // Fetch Executive Summary automatically when tab opens
  useEffect(() => {
    if (activeTab === "executive" && !summaryNarrative) {
      handleFetchSummary();
    }
  }, [activeTab]);

  // General error handling wrapper
  const handleApiCall = async (apiFn, ...args) => {
    setLoading(true);
    setErrorMsg("");
    setQuotaExceeded(false);
    try {
      const res = await apiFn(...args);
      setLoading(false);
      return res;
    } catch (err) {
      setLoading(false);
      const errMsg = err.message || "An unexpected error occurred.";
      setErrorMsg(errMsg);
      if (err.message && (err.message.includes("429") || err.message.toLowerCase().includes("limit"))) {
        setQuotaExceeded(true);
      }
      throw err;
    }
  };

  // --- Web Speech API (Voice Support) ---
  const handleVoiceInput = () => {
    if (!recognition) {
      alert(t("ai.speechUnsupported") || "Speech recognition is not supported in this browser. Please use Google Chrome.");
      return;
    }
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = locale === "hi" ? "hi-IN" : (locale === "mr" ? "mr-IN" : "en-IN");

      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (activeTab === "chat") {
          setChatInput(transcript);
        } else if (activeTab === "nlq") {
          setNlqInput(transcript);
        } else if (activeTab === "explain") {
          setHrmsId(transcript.toUpperCase().replace(/\s/g, ""));
        } else if (activeTab === "investigate") {
          setInvestigateHrms(transcript.toUpperCase().replace(/\s/g, ""));
        }
        setIsListening(false);
      };

      recognition.onerror = (err) => {
        console.error("Speech recognition error:", err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    }
  };

  // --- Action Handlers ---

  // 1. Send Chat message
  const handleSendChat = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setChatHistory(prev => [...prev, { role: "user", text: userMsg }]);

    try {
      const res = await handleApiCall(sendChat, userMsg);
      if (res && res.success) {
        setChatHistory(prev => [...prev, { role: "assistant", text: res.reply }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: "assistant", text: `⚠️ Error: ${err.message || "Failed to communicate with AI Safety bot."}` }]);
    }
  };

  // Chat suggestion pill trigger
  const handleSuggestionClick = (text) => {
    setChatInput(text);
  };

  // 2. Run NLQ Safety Query
  const handleRunNlq = async (e) => {
    if (e) e.preventDefault();
    if (!nlqInput.trim()) return;

    try {
      const res = await handleApiCall(sendQuery, nlqInput.trim());
      setNlqResult(res);
    } catch (err) {
      setNlqResult(null);
    }
  };

  // 3. Get Risk Diagnostic Explanation
  const handleRunRiskExplain = async (e) => {
    if (e) e.preventDefault();
    if (!hrmsId.trim()) return;

    try {
      const res = await handleApiCall(getRiskExplanation, hrmsId.trim().toUpperCase());
      if (res && res.success) {
        setRiskData(res.data);
      }
    } catch (err) {
      setRiskData(null);
    }
  };

  // 4. Incident Safety Audit Report
  const handleRunInvestigate = async (e) => {
    if (e) e.preventDefault();
    if (!investigateHrms.trim() || !incidentDetails.trim()) return;

    try {
      const res = await handleApiCall(getInvestigationReport, investigateHrms.trim().toUpperCase(), incidentDetails.trim());
      if (res && res.success) {
        setInvestigationResult(res.data);
      }
    } catch (err) {
      setInvestigationResult(null);
    }
  };

  // 5. Fetch Division Cached Safety Briefing Narrative
  const handleFetchSummary = async () => {
    try {
      const res = await handleApiCall(getAiExecutiveSummary);
      if (res && res.success) {
        setSummaryNarrative(res.summary);
        setSummaryMeta({
          fromCache: res.fromCache,
          cachedAt: res.cachedAt || new Date().toLocaleTimeString()
        });
      }
    } catch (err) {
      setSummaryNarrative("");
    }
  };

  // 6. Export Safety Briefing PDF
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Page styling helper
      const addPageHeader = (title) => {
        doc.setFillColor(11, 31, 58); // Navy brand primary
        doc.rect(0, 0, 210, 35, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text(t("ai.pdfIr") || "INDIAN RAILWAYS", 105, 15, { align: "center" });
        doc.setFontSize(12);
        doc.text(t("ai.pdfSub") || "Nagpur Division - Division Safety Command Center", 105, 25, { align: "center" });
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(11, 31, 58);
        doc.text(title, 15, 48);
      };

      // PAGE 1: Division Briefing Summary
      addPageHeader(t("ai.pdfBriefingTitle") || "1. DIVISION EXECUTIVE SAFETY BRIEFING");
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);

      let textContent = summaryNarrative || t("ai.pdfNoNarrative") || "No Nagpur Division Safety briefing cached at this time.";
      // Clean up markdown markers from narrative
      textContent = textContent.replace(/\*\*/g, "").replace(/\*/g, "").replace(/###/g, "");

      const lines = doc.splitTextToSize(textContent, 180);
      doc.text(lines, 15, 56);

      // PAGE 2: Safety Audit Protocols & Action Items
      doc.addPage();
      addPageHeader(t("ai.pdfProtocolTitle") || "2. SAFETY AUDIT PROTOCOLS & COMPLIANCE ACTION LOG");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(11, 31, 58);
      doc.text(t("ai.pdfDirectiveIndex") || "Safety Directive Indexes:", 15, 56);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      const points = [
        t("ai.pdfDirectiveP1") || "Directive P1: Verify all overdue Periodical Medical Examinations (PME) immediately.",
        t("ai.pdfDirectiveP2") || "Directive P2: Schedule failed CBT re-test candidates within 7 calendar days.",
        t("ai.pdfDirectiveP3") || "Directive P3: Supervisor joint practical assessment review mandatory at AJNI/NGP stations.",
        t("ai.pdfDirectiveP4") || "Directive P4: High-risk safety personnel subject to counseling prior to roster scheduling."
      ];
      
      let yp = 64;
      points.forEach(pt => {
        doc.text("• " + pt, 15, yp);
        yp += 8;
      });

      yp += 10;
      doc.setFillColor(248, 250, 252);
      doc.rect(15, yp, 180, 40, "F");
      doc.rect(15, yp, 180, 40);
      
      doc.setTextColor(11, 31, 58);
      doc.setFont("helvetica", "bold");
      doc.text(t("ai.pdfAuditRef") || "Audit Reference Context:", 20, yp + 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const refText = t("ai.pdfRefText") || "This system audit matches live personnel scores against General Rules (GR) Chapter III railway standards. Staff are evaluated automatically based on examination, simulator parameters, medical compliance schedules, and training histories.";
      const refLines = doc.splitTextToSize(refText, 170);
      doc.text(refLines, 20, yp + 16);

      // Disclaimer Banner (Appended on second page)
      doc.setFillColor(254, 242, 242);
      doc.rect(15, 230, 180, 30, "F");
      doc.setDrawColor(239, 68, 68);
      doc.rect(15, 230, 180, 30);
      
      doc.setTextColor(220, 38, 38);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(t("ai.pdfWarningTitle") || "MANDATORY SAFETY REGULATORY WARNING:", 20, 238);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(185, 28, 28);
      const linesDisclaimer = doc.splitTextToSize(DISCLAIMER_TEXT, 170);
      doc.text(linesDisclaimer, 20, 246);

      doc.save(`Nagpur_Safety_Briefing_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF download failed:", err);
      alert("Failed to export PDF: " + err.message);
    }
  };

  return (
    <div className="workflow-dashboard-container animate-fade-in" style={{ padding: "24px", minHeight: "100vh", backgroundColor: "#0b1329", color: "#f8fafc", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
      
      {/* ─── HEADER ─── */}
      <div className="workflow-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 className="workflow-title" style={{ fontSize: "28px", fontWeight: "800", color: "#f8fafc", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <Sparkles size={26} style={{ color: "#38bdf8" }} /> {t("ai.title") || "AI Safety Command Center"}
          </h1>
          <p className="workflow-subtitle" style={{ fontSize: "14px", color: "#94a3b8", marginTop: "4px" }}>
            {t("ai.subtitle") || "Natural Language Safety Command & Automated Briefings Assistant (Nagpur Division)"}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Language Selector Dropdown */}
          <LanguageSwitcher />

          {/* Voice Microphone Control */}
          <button
            onClick={handleVoiceInput}
            title={recognition ? t("buttons.mute") || "Toggle voice recognition" : "Speech recognition unsupported"}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              border: isListening ? "2px solid #ef4444" : "1px solid rgba(255,255,255,0.1)",
              background: isListening ? "#ef4444" : "rgba(30, 41, 59, 0.6)",
              color: "#fff",
              cursor: recognition ? "pointer" : "not-allowed",
              boxShadow: isListening ? "0 0 12px #ef4444" : "none",
              transition: "all 0.3s ease"
            }}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          
          <div className="refresh-status-badge" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b", background: "rgba(30, 41, 59, 0.5)", padding: "10px 14px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontWeight: "700", color: "#38bdf8", marginRight: "4px" }}>{t("ai.roleLimit") || "Role Limit Status:"}</span>
            <span>{role} {t("ai.quotaChecked") || "Quota Checked"}</span>
          </div>
        </div>
      </div>

      {/* ─── ERROR & RATE LIMIT BANNERS ─── */}
      {errorMsg && (
        <div style={{ padding: "14px 18px", background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: "8px", color: "#f87171", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <AlertCircle size={18} />
          <div>
            <strong>{t("ai.errorLabel") || "Error:"}</strong> {errorMsg}
            {quotaExceeded && (
              <span style={{ display: "block", fontSize: "12px", color: "#fca5a5", marginTop: "2px" }}>
                {t("ai.quotaExceeded") || "You have reached your daily request quota. Quotas reset at midnight."}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ─── NAVIGATION TABS ─── */}
      <div className="tim-tab-row" style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
        <button className={`tim-tab-btn ${activeTab === "chat" ? "active" : ""}`} onClick={() => setActiveTab("chat")}>
          {t("ai.tabCopilot") || "💬 AI Safety Copilot"}
        </button>
        <button className={`tim-tab-btn ${activeTab === "nlq" ? "active" : ""}`} onClick={() => setActiveTab("nlq")}>
          {t("ai.tabNlq") || "🔎 NLQ Command Search"}
        </button>
        <button className={`tim-tab-btn ${activeTab === "explain" ? "active" : ""}`} onClick={() => setActiveTab("explain")}>
          {t("ai.tabRisk") || "🛡️ Risk Explainer"}
        </button>
        <button className={`tim-tab-btn ${activeTab === "investigate" ? "active" : ""}`} onClick={() => setActiveTab("investigate")}>
          {t("ai.tabGap") || "⚠️ Safety Gap Audit"}
        </button>
        <button className={`tim-tab-btn ${activeTab === "executive" ? "active" : ""}`} onClick={() => setActiveTab("executive")}>
          {t("ai.tabExecutive") || "📈 Division Executive Briefing"}
        </button>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="tim-panel-card" style={{ background: "rgba(15, 23, 42, 0.4)", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)", padding: "24px", minHeight: "450px" }}>
        
        {/* TABS CONTROLLER CONTAINER */}

        {/* 1. COPILOT PANEL */}
        {activeTab === "chat" && (
          <div style={{ display: "flex", flexDirection: "column", height: "450px" }}>
            <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#f8fafc" }}>{t("ai.copilotTitle") || "AI Safety Assistant"}</h3>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>{t("ai.copilotDesc") || "Ask railway safety rule, medical schedules, or compliance standard questions."}</p>
            </div>
            
            {/* Suggestion Quick Chips */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
              <button className="tim-tab-btn" onClick={() => handleSuggestionClick(t("ai.suggestionRefresher") || "Explain safety refresher rules for Pointsmen")} style={{ fontSize: "11px", padding: "4px 10px", background: "rgba(255,255,255,0.02)" }}>
                {t("ai.suggestionRefresherChip") || "💡 Pointsmen Refresher Rules"}
              </button>
              <button className="tim-tab-btn" onClick={() => handleSuggestionClick(t("ai.suggestionMedical") || "What are the medical classification standards for Station Master?")} style={{ fontSize: "11px", padding: "4px 10px", background: "rgba(255,255,255,0.02)" }}>
                {t("ai.suggestionMedicalChip") || "💡 SM Medical Classification"}
              </button>
              <button className="tim-tab-btn" onClick={() => handleSuggestionClick(t("ai.suggestionJoint") || "Detail rules regarding joint checks for point switch lines")} style={{ fontSize: "11px", padding: "4px 10px", background: "rgba(255,255,255,0.02)" }}>
                {t("ai.suggestionJointChip") || "💡 Switch Line Joint Checks"}
              </button>
            </div>

            {/* Chat Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "10px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", background: "rgba(10, 15, 30, 0.4)", marginBottom: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {chatHistory.map((msg, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "75%",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    whiteSpace: "pre-line",
                    background: msg.role === "user" ? "#2563eb" : "rgba(30, 41, 59, 0.8)",
                    color: "#f8fafc",
                    border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.04)"
                  }}>
                    <strong>{msg.role === "user" ? t("ai.userLabel") || "You" : t("ai.assistantLabel") || "AI Copilot"}:</strong>
                    <div style={{ marginTop: "4px" }}>{msg.isGreeting ? t("ai.assistantGreeting") : msg.text}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{ padding: "10px 14px", borderRadius: "12px", background: "rgba(30, 41, 59, 0.5)", border: "1px solid rgba(255,255,255,0.04)", color: "#94a3b8", fontSize: "13px" }}>
                    <RefreshCw size={13} className="anim-spin" style={{ marginRight: "6px" }} /> {t("ai.copilotThinking") || "AI Copilot is thinking..."}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={t("ai.copilotPlaceholder") || "Ask your safety guideline question..."}
                style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", color: "#f8fafc", fontSize: "13px", outline: "none" }}
              />
              <button type="submit" disabled={loading || !chatInput.trim()} className="tim-primary-btn" style={{ display: "flex", alignItems: "center", gap: "6px", height: "100%", padding: "10px 18px", border: "none", borderRadius: "8px" }}>
                <Send size={14} /> {t("ai.send") || "Send"}
              </button>
            </form>
          </div>
        )}

        {/* 2. NLQ COMMAND PANEL */}
        {activeTab === "nlq" && (
          <div>
            <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#f8fafc" }}>{t("ai.nlqTitle") || "Natural Language Querying (NLQ) Command Console"}</h3>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>{t("ai.nlqDesc") || "Search dynamic compliance details using natural English sentences (pre-defined security templates)."}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleRunNlq} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <div className="tim-search-box" style={{ flex: 1, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", display: "flex", alignItems: "center", padding: "8px 12px", borderRadius: "8px" }}>
                <Search size={15} style={{ color: "#64748b", marginRight: "8px" }} />
                <input
                  type="text"
                  value={nlqInput}
                  onChange={(e) => setNlqInput(e.target.value)}
                  placeholder={t("ai.nlqPlaceholder") || "e.g. Show safety profile of employee YDYMLI OR What is the risk level at AJNI station?"}
                  style={{ width: "100%", border: "none", background: "transparent", color: "#f8fafc", fontSize: "13px", outline: "none" }}
                />
              </div>
              <button type="submit" disabled={loading || !nlqInput.trim()} className="tim-primary-btn" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 20px" }}>
                <Database size={14} /> {t("ai.execute") || "Execute Query"}
              </button>
            </form>

            {/* Examples list */}
            <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "20px" }}>
              <strong>{t("ai.predefinedTemplates") || "Predefined templates supported:"}</strong>
              <ul style={{ margin: "4px 0", paddingLeft: "18px" }}>
                <li>{t("ai.templatePme") || "Who has PME due in 30 days?"}</li>
                <li>{t("ai.templateRisk") || "What is the risk level at Nagpur station?"}</li>
                <li>{t("ai.templateRec") || "List pending recommendations for employee YDYMLI"}</li>
                <li>{t("ai.templateEsc") || "Show critical escalations"}</li>
              </ul>
            </div>

            {/* Results Grid */}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#94a3b8" }}>
                <RefreshCw size={14} className="anim-spin" /> {t("ai.nlqExecuting") || "Classifying query intent and executing safe SELECT template..."}
              </div>
            )}

            {!loading && nlqResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Intent & Explanation box */}
                <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: "14px 18px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "11px", textTransform: "uppercase", background: "#1e293b", color: "#38bdf8", padding: "3px 8px", borderRadius: "4px", fontWeight: "700" }}>
                      {t("ai.intent") || "Intent"}: {nlqResult.intent || "UNKNOWN"}
                    </span>
                  </div>
                  {nlqResult.success === false ? (
                    <div style={{ display: "flex", gap: "8px", color: "#fb7185", fontSize: "13px", alignItems: "center" }}>
                      <AlertTriangle size={15} /> {nlqResult.suggestion}
                    </div>
                  ) : (
                    <div>
                      <p style={{ margin: 0, fontSize: "13px", color: "#cbd5e1", lineHeight: "1.6", whiteSpace: "pre-line" }}>
                        <strong>{t("ai.aiSummary") || "AI Summary Explanation:"}</strong><br />
                        {nlqResult.explanation}
                      </p>
                      {nlqResult.query && (
                        <div style={{ marginTop: "12px", background: "#090d16", padding: "10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.04)" }}>
                          <span style={{ fontSize: "10px", color: "#475569", fontWeight: "700", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>{t("ai.whitelistedSql") || "Whitelisted SQL executed (Read-only SELECT):"}</span>
                          <code style={{ fontSize: "11px", color: "#a855f7", whiteSpace: "pre-line" }}>{nlqResult.query}</code>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Raw Database results Table */}
                {nlqResult.success && nlqResult.data && nlqResult.data.length > 0 && (
                  <div style={{ overflowX: "auto", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                    <table style={{ borderCollapse: "collapse", width: "100%", textAlign: "left", fontSize: "12px" }}>
                      <thead>
                        <tr style={{ background: "rgba(30, 41, 59, 0.5)", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "#94a3b8" }}>
                          {Object.keys(nlqResult.data[0]).map((col, idx) => (
                            <th key={idx} style={{ padding: "10px 12px", fontWeight: "700", textTransform: "uppercase" }}>{col.replace(/_/g, " ")}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {nlqResult.data.map((row, rIdx) => (
                          <tr key={rIdx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", background: rIdx % 2 === 0 ? "transparent" : "rgba(30, 41, 59, 0.2)", color: "#cbd5e1" }}>
                            {Object.values(row).map((val, cIdx) => (
                              <td key={cIdx} style={{ padding: "8px 12px" }}>
                                {typeof val === "boolean" ? (val ? t("buttons.yes") || "Yes" : t("buttons.no") || "No") : String(val || "-")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. RISK EXPLAINER PANEL */}
        {activeTab === "explain" && (
          <div>
            <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#f8fafc" }}>{t("ai.riskTitle") || "Safety Risk Score Explainer"}</h3>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>{t("ai.riskDesc") || "Input employee HRMS ID to analyze compliance indicators (PME, Refresher, CBT scores, evaluations) and generate a safety risk diagnostic report."}</p>
            </div>

            <form onSubmit={handleRunRiskExplain} style={{ display: "flex", gap: "10px", marginBottom: "20px", maxWidth: "400px" }}>
              <input
                type="text"
                value={hrmsId}
                onChange={(e) => setHrmsId(e.target.value)}
                placeholder={t("ai.hrmsPlaceholder") || "HRMS ID (e.g. YDYMLI)"}
                style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", color: "#f8fafc", fontSize: "13px" }}
              />
              <button type="submit" disabled={loading || !hrmsId.trim()} className="tim-primary-btn" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Activity size={14} /> {t("ai.diagnose") || "Diagnose Risk"}
              </button>
            </form>

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#94a3b8" }}>
                <RefreshCw size={14} className="anim-spin" /> {t("ai.riskCompiling") || "Compiling safety dossier metrics and generating AI risk diagnosis..."}
              </div>
            )}

            {!loading && riskData && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Profile header */}
                <div style={{ background: "rgba(30, 41, 59, 0.4)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "16px", color: "#f8fafc" }}>{riskData.profile.full_name} ({riskData.profile.hrms_id})</h4>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>{riskData.profile.designation} {t("ai.atStation") || "at station"} {riskData.profile.station_name}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", display: "block" }}>{t("ai.riskScoreLabel") || "Risk Score"}</span>
                    <strong style={{ fontSize: "20px", color: riskData.profile.is_high_risk ? "#ef4444" : "#16a34a" }}>
                      {parseFloat(riskData.profile.score || 0).toFixed(2)} / 100
                    </strong>
                  </div>
                </div>

                {/* Diagnosis Narrative */}
                <div style={{ background: "rgba(10, 15, 30, 0.6)", padding: "18px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", fontSize: "13px", lineHeight: "1.6", color: "#cbd5e1", whiteSpace: "pre-line" }}>
                  <h4 style={{ margin: "0 0 10px", color: "#38bdf8", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
                    {t("ai.diagnosticReport") || "AI Safety Diagnostic Report"}
                  </h4>
                  {riskData.explanation}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. INCIDENT SAFETY GAP AUDIT PANEL */}
        {activeTab === "investigate" && (
          <div>
            <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#f8fafc" }}>{t("ai.investigateTitle") || "Incident Investigation Assistant"}</h3>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>{t("ai.investigateDesc") || "Generate custom safety gap audits and retraining remediation roadmaps based on safety histories and incident reports."}</p>
            </div>

            <form onSubmit={handleRunInvestigate} style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "600px", marginBottom: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "700" }}>{t("ai.employeeHrmsId") || "Employee HRMS ID"}</label>
                <input
                  type="text"
                  value={investigateHrms}
                  onChange={(e) => setInvestigateHrms(e.target.value)}
                  placeholder={t("ai.hrmsPlaceholder") || "e.g. YDYMLI"}
                  style={{ padding: "8px 12px", borderRadius: "8px", background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", color: "#f8fafc", fontSize: "13px", outline: "none", width: "200px" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "700" }}>{t("ai.incidentLabel") || "Incident Details / Operational Breach Description"}</label>
                <textarea
                  value={incidentDetails}
                  onChange={(e) => setIncidentDetails(e.target.value)}
                  placeholder={t("ai.incidentPlaceholder") || "Describe the incident (e.g. Pointsman left switch points reversed without padlock during shunting, violating CR shunting rules page 12)..."}
                  rows={4}
                  style={{ padding: "10px 12px", borderRadius: "8px", background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", color: "#f8fafc", fontSize: "13px", outline: "none" }}
                />
              </div>

              <button type="submit" disabled={loading || !investigateHrms.trim() || !incidentDetails.trim()} className="tim-primary-btn" style={{ width: "fit-content", display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                <AlertTriangle size={14} /> {t("ai.auditGap") || "Audit Gap Analysis"}
              </button>
            </form>

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#94a3b8" }}>
                <RefreshCw size={14} className="anim-spin" /> {t("ai.gapAuditing") || "Auditing compliance history logs and compiling safety gap roadmap..."}
              </div>
            )}

            {!loading && investigationResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ background: "rgba(30, 41, 59, 0.4)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <h4 style={{ margin: "0 0 4px", fontSize: "14px", color: "#f8fafc" }}>{t("ai.employeeAudited") || "Employee Audited"}: {investigationResult.profile.full_name} ({investigationResult.profile.hrms_id})</h4>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>{t("ai.designationLabel") || "Designation"}: {investigationResult.profile.designation} | {t("ai.stationLabel") || "Station"}: {investigationResult.profile.station_name}</span>
                </div>

                <div style={{ background: "rgba(10, 15, 30, 0.6)", padding: "18px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", fontSize: "13px", lineHeight: "1.6", color: "#cbd5e1", whiteSpace: "pre-line" }}>
                  <h4 style={{ margin: "0 0 10px", color: "#fb7185", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
                    {t("ai.gapRoadmap") || "Safety Gap Analysis & Remediation Roadmap"}
                  </h4>
                  {investigationResult.report}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. EXECUTIVE SUMMARY PANEL */}
        {activeTab === "executive" && (
          <div>
            <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", color: "#f8fafc" }}>{t("ai.execBriefingTitle") || "Division Executive Safety Briefing"}</h3>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>{t("ai.execBriefingDesc") || "Nagpur Division aggregate safety metrics and synthesis briefings narrative (6-hour cache)."}</p>
              </div>
              <button onClick={handleExportPDF} disabled={!summaryNarrative} className="tim-link-btn" style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Download size={14} /> {t("ai.exportPdf") || "Export Briefing PDF"}
              </button>
            </div>

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#94a3b8" }}>
                <RefreshCw size={14} className="anim-spin" /> {t("ai.fetchingCache") || "Fetching cached executive safety narrative summary..."}
              </div>
            )}

            {!loading && summaryNarrative && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                
                {/* Cache meta tag */}
                {summaryMeta && (
                  <div style={{ alignSelf: "flex-start", fontSize: "11px", color: "#64748b", background: "rgba(255,255,255,0.02)", padding: "3px 10px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.04)" }}>
                    {summaryMeta.fromCache ? `${t("ai.cachedAt") || "⚡ Retrieved from 6-hour cache (cached at "}${summaryMeta.cachedAt})` : t("ai.freshBriefing") || "🔄 Generated fresh briefing narrative (cached for 6 hours)"}
                  </div>
                )}

                {/* Safety narrative content */}
                <div style={{ background: "rgba(10, 15, 30, 0.5)", padding: "20px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", fontSize: "13px", lineHeight: "1.6", color: "#cbd5e1", whiteSpace: "pre-line" }}>
                  {summaryNarrative}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ─── GLOBAL SAFETY WARNING DISCLAIMER BANNER ─── */}
      <div style={{
        marginTop: "24px",
        padding: "12px 16px",
        background: "rgba(239, 68, 68, 0.05)",
        border: "1px solid rgba(239, 68, 68, 0.15)",
        borderRadius: "8px",
        display: "flex",
        alignItems: "flex-start",
        gap: "10px"
      }}>
        <AlertTriangle size={16} style={{ color: "#f87171", flexShrink: 0, marginTop: "2px" }} />
        <p style={{ margin: 0, fontSize: "11px", color: "#fca5a5", lineHeight: "1.4" }}>
          <strong>{t("ai.globalWarning") || "MANDATORY SAFETY DISCLAIMER DIRECTIVE:"}</strong> {DISCLAIMER_TEXT}
        </p>
      </div>

    </div>
  );
}
