import { useMemo, useState, useEffect } from "react";
import {
  Award,
  BarChart2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileBarChart2,
  Gauge,
  LogOut,
  PlayCircle,
  Search,
  Target,
  TrendingUp,
  UserCircle2,
  ArrowUpDown,
  ShieldCheck,
  Bell,
  ShieldAlert,
  Clock,
  Activity,
  FileText,
  AlertTriangle,
  Lock,
  RefreshCw,
  Paperclip,
  Trash2,
  Volume2,
  VolumeX,
  Plus,
  HeartHandshake
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import "./sdom.css";
import PointsmanDashboard from "./components/PointsmanModule/PointsmanDashboard";
import UserProfile from "./components/UserProfile";
import MyAssessment from './components/MyAssessment';
import PointsmanSafety from "./components/PointsmanModule/PointsmanSafety";
import { getPointsmanDashboard } from "./services/pointsmanService";
import { getEmployeeProfile, getEmployeeHistory, getEmployeeAuditLogs, getSafetyReports, createSafetyReport } from "./services/employeeService";
import { getExamStatus, startExam, submitAnswer, submitExam } from "./services/examService";
import NotificationBell from "./components/NotificationBell";
import LanguageSwitcher from "./components/LanguageSwitcher";
import { getEmployeeCounselling } from "./services/phase16Service";
import { useLanguage } from "./utils/LanguageContext";

const TEST_NAME = "Pointsman Periodic Assessment";

/* ─── Navigation ─── */
const navItems = [
  { key: "dashboard",    label: "Dashboard",     icon: Gauge },
  { key: "myAssessment", label: "My Assessment",  icon: FileBarChart2 },
  { key: "pme",          label: "PME Status",     icon: Activity },
  { key: "ref",          label: "REF Course",     icon: RefreshCw },
  { key: "counselling",  label: "Counselling",    icon: HeartHandshake },
  { key: "profile",      label: "Profile",        icon: UserCircle2 }
];

/* ─── Helper: Score → Category ─── */
function getCategory(score) {
  if (score >= 80) return "A";
  if (score >= 50) return "B";
  if (score >= 26) return "C";
  return "D";
}

function getCategoryColor(cat) {
  return { A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#dc2626" }[cat] || "#6b7280";
}

function getCategoryBg(cat) {
  return { A: "#dcfce7", B: "#dbeafe", C: "#fef3c7", D: "#fee2e2" }[cat] || "#f3f4f6";
}

const formatQuarterPeriod = (periodStr) => {
  if (!periodStr) return "—";
  const match = periodStr.match(/Q([1-4])\s+(\d{4})/i);
  if (!match) return periodStr;
  const quarter = parseInt(match[1], 10);
  const year = match[2];
  switch (quarter) {
    case 1: return `01 Jan ${year} – 31 Mar ${year}`;
    case 2: return `01 Apr ${year} – 30 Jun ${year}`;
    case 3: return `01 Jul ${year} – 30 Sep ${year}`;
    case 4: return `01 Oct ${year} – 31 Dec ${year}`;
    default: return periodStr;
  }
};

/* ─── Pie chart custom label ─── */
const PIE_COLORS = { A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#dc2626" };

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value, payload: inner } = payload[0];
    return (
      <div className="pm-pie-tooltip" style={{ background: '#fff', border: '1px solid #dbe5f0', padding: '8px', borderRadius: '8px' }}>
        <strong>Category {name}</strong>
        <div>{value}% &nbsp;({inner.count} attempt{inner.count !== 1 ? "s" : ""})</div>
      </div>
    );
  }
  return null;
};

// Global Web Audio synth for Emergency sound
let audioCtx = null;
let alarmOsc = null;
let alarmGain = null;
let alarmInterval = null;

function startAlarmSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioCtx = new AudioContextClass();
    
    alarmOsc = audioCtx.createOscillator();
    alarmGain = audioCtx.createGain();
    
    alarmOsc.connect(alarmGain);
    alarmGain.connect(audioCtx.destination);
    
    alarmOsc.type = "sine";
    alarmOsc.frequency.setValueAtTime(500, audioCtx.currentTime);
    alarmGain.gain.setValueAtTime(0, audioCtx.currentTime);
    
    alarmOsc.start();
    
    let state = true;
    alarmInterval = setInterval(() => {
      if (!audioCtx) return;
      // sweep frequency between 500Hz and 850Hz to sound like a warning klaxon
      alarmOsc.frequency.setValueAtTime(state ? 850 : 500, audioCtx.currentTime);
      alarmGain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      state = !state;
    }, 450);
  } catch (err) {
    console.error("Audio Context initiation failed:", err);
  }
}

function stopAlarmSound() {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
  if (alarmOsc) {
    try { alarmOsc.stop(); } catch(e) {}
    alarmOsc = null;
  }
  if (audioCtx) {
    try { audioCtx.close(); } catch(e) {}
    audioCtx = null;
  }
}

/* ─── Main component ─── */
function PointsmanModule({ user, onLogout }) {
  const { locale, changeLanguage, t } = useLanguage();
  const [dashboardData, setDashboardData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [questionBankCount, setQuestionBankCount] = useState(0);
  const [cbtAttempt, setCbtAttempt] = useState(null);
  const [examQuestions, setExamQuestions] = useState([]);
  const [lastSavedResponses, setLastSavedResponses] = useState(() => Array(25).fill(null));

  const [activeNav, setActiveNav] = useState("dashboard");
  const [screenMode, setScreenMode] = useState("default");
  
  const [history, setHistory] = useState([]);
  
  const [historyDateSearch, setHistoryDateSearch] = useState("");
  const [historySortOrder, setHistorySortOrder] = useState("date-desc");
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // My Assessment state (mirrors SM module)
  const [myAssessSelected, setMyAssessSelected] = useState(null);
  const [pmMcqTest, setPmMcqTest] = useState(null);

  const [pmActiveQIdx, setPmActiveQIdx] = useState(0);
  const [pmTestResponses, setPmTestResponses] = useState(() => Array(25).fill(null));
  const [statusText, setStatusText] = useState("");

  /* ─── Extra State Additions ─── */
  const [counsellingList, setCounsellingList] = useState([]);

  // 1. MCQ Timer (30 minutes = 1800 seconds)
  const [assessmentTimeLeft, setAssessmentTimeLeft] = useState(1800);
  const [isAssessmentTimerRunning, setIsAssessmentTimerRunning] = useState(false);

  // 2. Secure Login Session Timer (15 minutes = 900 seconds)
  const [sessionTimeLeft, setSessionTimeLeft] = useState(900);

  // 3. Real-Time Notifications
  const [bellDropdownOpen, setBellDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // 4. Audit Activity Logs
  const [profileSubTab, setProfileSubTab] = useState("details"); // "details" | "audit"
  const [activityLogs, setActivityLogs] = useState([]);

  // 5. Emergency Alert & Siren State
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [emergencyType, setEmergencyType] = useState("Obstruction on Track");
  const [emergencyLocation, setEmergencyLocation] = useState("Nagpur Yard Line 2");
  const [alarmMuted, setAlarmMuted] = useState(false);

  // 6. Safety Reports
  const [safetySubTab, setSafetySubTab] = useState("track"); // "track" | "incident" | "history"
  const [safetyReports, setSafetyReports] = useState([]);

  // File Upload State Mock
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  // Form Fields: Track Issue
  const [trackLocation, setTrackLocation] = useState("");
  const [trackLine, setTrackLine] = useState("Line 1");
  const [trackDefect, setTrackDefect] = useState("Rail Fracture");
  const [trackSeverity, setTrackSeverity] = useState("High - Urgent Action");
  const [trackDesc, setTrackDesc] = useState("");

  // Form Fields: Abnormal Incident
  const [incidentType, setIncidentType] = useState("Hot Axle");
  const [incidentTrain, setIncidentTrain] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [incidentAction, setIncidentAction] = useState("");

  const fullName = profileData?.full_name || dashboardData?.full_name || user?.name || "Pointsman User";
  const employeeId = profileData?.hrms_id || dashboardData?.hrms_id || user?.hrmsId || "N/A";

  const testAssigned = useMemo(() => {
    if (!dashboardData) return "Not Assigned";
    return dashboardData.assessment_status || "Not Assigned";
  }, [dashboardData]);

  // Track user notifications unread count
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [dash, profile] = await Promise.all([
        getPointsmanDashboard(),
        getEmployeeProfile()
      ]);
      setDashboardData(dash);
      setProfileData(profile);

      try {
        const examStatus = await getExamStatus();
        if (examStatus) {
          setQuestionBankCount(examStatus.question_count || 0);
          if (examStatus.has_active_attempt && examStatus.active_attempt) {
            const examData = await startExam();
            if (examData && examData.questions) {
              setCbtAttempt(examData);
              const mappedQuestions = examData.questions.map(q => ({
                id: q.id,
                text: q.question_text,
                options: [q.option_a, q.option_b, q.option_c, q.option_d],
                marks: q.marks || 4
              }));
              setExamQuestions(mappedQuestions);
              
              const initialResponses = examData.questions.map(q => {
                if (!q.selected_answer) return null;
                const ans = q.selected_answer.trim().toUpperCase();
                if (ans === 'A') return 0;
                if (ans === 'B') return 1;
                if (ans === 'C') return 2;
                if (ans === 'D') return 3;
                return null;
              });
              setPmTestResponses(initialResponses);
              setLastSavedResponses(initialResponses);
              setScreenMode("takeTest");
            }
          }
        }
      } catch (examErr) {
        console.warn("Could not check CBT exam status:", examErr);
      }

      try {
        const histData = await getEmployeeHistory();
        if (histData) {
          setHistory(histData);
        }
      } catch (histErr) {
        console.warn("Could not fetch employee assessment history from DB:", histErr);
      }

      try {
        const logsData = await getEmployeeAuditLogs();
        if (logsData) {
          setActivityLogs(logsData);
        }
      } catch (logsErr) {
        console.warn("Could not fetch employee audit logs from DB:", logsErr);
      }

      try {
        const safetyData = await getSafetyReports();
        if (safetyData) {
          setSafetyReports(safetyData);
        }
      } catch (safetyErr) {
        console.warn("Could not fetch safety reports from DB:", safetyErr);
      }

      if (profile && profile.id) {
        try {
          const counData = await getEmployeeCounselling(profile.id);
          setCounsellingList(counData || []);
        } catch (counErr) {
          console.warn("Could not fetch pointsman counselling logs:", counErr);
        }
      }
    } catch (err) {
      console.error("Error fetching pointsman dashboard:", err);
      setError(err.message || "Failed to load dashboard data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);




  /* ─── EFFECT: Secure Session CountDown ─── */
  useEffect(() => {
    const sessionTimer = setInterval(() => {
      setSessionTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(sessionTimer);
          stopAlarmSound();
          alert("Secure Session Timeout (15 mins reached). For safety, you are logged out of the Indian Railways Operations Panel.");
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(sessionTimer);
  }, [onLogout]);

  /* ─── EFFECT: Assessment MCQ Countdown Timer ─── */
  useEffect(() => {
    let timer = null;
    if (isAssessmentTimerRunning && assessmentTimeLeft > 0) {
      timer = setInterval(() => {
        setAssessmentTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsAssessmentTimerRunning(false);
            handleSubmitTestAttempt(); // force auto-submit!
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isAssessmentTimerRunning, assessmentTimeLeft]);

  /* ─── EFFECT: Autosave CBT Answers in Real-Time ─── */
  useEffect(() => {
    if (!cbtAttempt || !cbtAttempt.attempt_id) return;
    
    let changed = false;
    for (let i = 0; i < pmTestResponses.length; i++) {
      if (pmTestResponses[i] !== lastSavedResponses[i]) {
        changed = true;
        const answerValue = pmTestResponses[i];
        const charAnswer = answerValue === 0 ? 'A' : answerValue === 1 ? 'B' : answerValue === 2 ? 'C' : answerValue === 3 ? 'D' : null;
        
        if (charAnswer && examQuestions[i]) {
          const questionId = examQuestions[i].id;
          submitAnswer(cbtAttempt.attempt_id, questionId, charAnswer)
            .catch(err => console.error("Error autosaving answer:", err));
        }
      }
    }
    if (changed) {
      setLastSavedResponses([...pmTestResponses]);
    }
  }, [pmTestResponses, cbtAttempt, examQuestions, lastSavedResponses]);

  /* ─── Derived metrics ─── */
  const latestScore = history.length ? history[0].totalScore : null;
  const latestCategory = latestScore !== null ? getCategory(latestScore) : (dashboardData?.category_grade || "—");
  const averageScore = history.length
    ? Math.round(history.reduce((s, i) => s + i.totalScore, 0) / history.length)
    : 0;
  const answeredCount = pmTestResponses.filter(v => v !== null).length;
  const completionRate = Math.round((answeredCount / 25) * 100);

  /* ─── Dynamic Performance Summary ─── */
  const performanceSummaryText = useMemo(() => {
    const rec = myAssessSelected || selectedRecord;
    if (!rec || !rec.sections || rec.sections.length === 0) return "";
    const { totalScore, sections } = rec;
    const lowestSec = [...sections].sort((a, b) => a.marks - b.marks)[0];
    const highestSec = [...sections].sort((a, b) => b.marks - a.marks)[0];

    let summary = `Assessment score achieved: ${totalScore}/100 (${totalScore >= 80 ? 'Outstanding Competency' : totalScore >= 50 ? 'Satisfactory Operations' : 'Requires Training'}). `;
    summary += `Demonstrated excellent competency in "${highestSec.title}" scoring ${highestSec.marks}/${highestSec.outOf} marks. `;
    if (lowestSec.marks < lowestSec.outOf) {
      summary += `However, low-scoring markers are observed in "${lowestSec.title}" (${lowestSec.marks}/${lowestSec.outOf}). It is highly recommended to study the Station Working Rules (SWR) for points locking/shunting and undergo periodic coaching.`;
    } else {
      summary += `Achieved flawless accuracy in all modules. Recommended to maintain this premium standard in daily track shunting.`;
    }
    return summary;
  }, [myAssessSelected, selectedRecord]);

  /* ─── Chart data ─── */
  const trendData = useMemo(() =>
    [...history].reverse().map(r => ({
      date: r.assessmentPeriod.slice(0, 7),
      score: r.totalScore
    })), [history]);

  const pieData = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    history.forEach(r => { counts[getCategory(r.totalScore)]++; });
    const total = history.length || 1;
    return Object.entries(counts)
      .filter(([, c]) => c > 0)
      .map(([cat, count]) => ({
        name: cat,
        value: Math.round((count / total) * 100),
        count
      }));
  }, [history]);

  /* ─── Filtered / sorted history ─── */
  const filteredHistory = useMemo(() => {
    let list = history.filter(item =>
      historyDateSearch.trim() === "" || item.date.includes(historyDateSearch.trim())
    );
    if (historySortOrder === "score-asc") list = [...list].sort((a, b) => a.totalScore - b.totalScore);
    else if (historySortOrder === "score-desc") list = [...list].sort((a, b) => b.totalScore - a.totalScore);
    else if (historySortOrder === "date-asc") list = [...list].sort((a, b) => a.date.localeCompare(b.date));
    return list;
  }, [history, historyDateSearch, historySortOrder]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f1f5f9" }}>
        <style>{`
          @keyframes pm-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ border: "4px solid #cbd5e1", borderTop: "4px solid #2563eb", borderRadius: "50%", width: "40px", height: "40px", animation: "pm-spin 1s linear infinite", margin: "0 auto 16px" }}></div>
          <p style={{ color: "#475569", fontWeight: "600", fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>Loading Pointsman Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f1f5f9", padding: "20px" }}>
        <div className="login-card" style={{ maxWidth: "450px", width: "100%", textAlign: "center", padding: "40px", border: "1px solid #fed7aa" }}>
          <div className="login-header">
            <div className="logo-badge" style={{ backgroundColor: "#ef4444", margin: "0 auto 20px" }}>⚠️</div>
            <h1 style={{ color: "#ef4444", fontSize: "22px", margin: "10px 0 5px", fontFamily: "'Poppins', sans-serif" }}>Connection Error</h1>
            <p style={{ color: "#475569", fontSize: "14px", lineHeight: "1.6", margin: "15px 0 25px", fontFamily: "'Poppins', sans-serif" }}>
              {error}
            </p>
          </div>
          <button 
            className="login-button" 
            onClick={fetchDashboardData} 
            style={{ 
              backgroundColor: "#2563eb", 
              color: "white", 
              padding: "12px 24px", 
              border: "none", 
              borderRadius: "10px", 
              fontSize: "14px", 
              fontWeight: "700", 
              cursor: "pointer", 
              width: "100%",
              marginBottom: "12px",
              fontFamily: "'Poppins', sans-serif"
            }}
          >
            Retry Connection
          </button>
          <button 
            className="login-button" 
            onClick={() => { stopAlarmSound(); onLogout(); }} 
            style={{ 
              backgroundColor: "#475569", 
              color: "white", 
              padding: "12px 24px", 
              border: "none", 
              borderRadius: "10px", 
              fontSize: "14px", 
              fontWeight: "700", 
              cursor: "pointer", 
              width: "100%",
              fontFamily: "'Poppins', sans-serif"
            }}
          >
            Logout / Reset Session
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f1f5f9", padding: "20px" }}>
        <div className="login-card" style={{ maxWidth: "450px", width: "100%", textAlign: "center", padding: "40px", border: "1px solid #cbd5e1" }}>
          <div className="login-header">
            <div className="logo-badge" style={{ backgroundColor: "#64748b", margin: "0 auto 20px" }}>ℹ️</div>
            <h1 style={{ color: "#475569", fontSize: "22px", margin: "10px 0 5px", fontFamily: "'Poppins', sans-serif" }}>No Data Available</h1>
            <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.6", margin: "15px 0 25px", fontFamily: "'Poppins', sans-serif" }}>
              No dashboard data was found for this user account.
            </p>
          </div>
          <button 
            className="login-button" 
            onClick={() => { stopAlarmSound(); onLogout(); }} 
            style={{ 
              backgroundColor: "#475569", 
              color: "white", 
              padding: "12px 24px", 
              border: "none", 
              borderRadius: "10px", 
              fontSize: "14px", 
              fontWeight: "700", 
              cursor: "pointer", 
              width: "100%",
              fontFamily: "'Poppins', sans-serif"
            }}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  /* ─── Navigation ─── */
  const goToNavPage = (key) => {
    setActiveNav(key);
    setScreenMode("default");
    setStatusText("");
    if (key === "dashboard" || key === "myAssessment") {
      fetchDashboardData();
    }
  };

  const openScorecard = (record) => {
    setSelectedRecord(record);
    setActiveNav("history");
    setScreenMode("scorecard");
  };

  const logActivity = (category, action) => {
    const time = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newLog = {
      id: Date.now(),
      timestamp: time,
      category,
      action,
      user: fullName
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const triggerNotification = (type, message) => {
    const newAlert = {
      id: Date.now(),
      type,
      message,
      time: "Just now",
      read: false
    };
    setNotifications(prev => [newAlert, ...prev]);
  };

  /* ─── My Assessment Test Actions (mirrors SM) ─── */
  const startTestAttempt = async () => {
    const isActivated = dashboardData?.assessment_status === "Active";
    if (!isActivated) {
      alert("Competency Exam is locked. Please request your Station Master to activate it.");
      return;
    }
    try {
      setLoading(true);
      const examData = await startExam();
      setCbtAttempt(examData);
      
      const mappedQuestions = examData.questions.map(q => ({
        id: q.id,
        text: q.question_text,
        options: [q.option_a, q.option_b, q.option_c, q.option_d],
        marks: q.marks || 4
      }));
      setExamQuestions(mappedQuestions);
      
      const initialResponses = examData.questions.map(q => {
        if (!q.selected_answer) return null;
        const ans = q.selected_answer.trim().toUpperCase();
        if (ans === 'A') return 0;
        if (ans === 'B') return 1;
        if (ans === 'C') return 2;
        if (ans === 'D') return 3;
        return null;
      });
      setPmTestResponses(initialResponses);
      setLastSavedResponses(initialResponses);
      setPmActiveQIdx(0);
      setScreenMode("takeTest");
    } catch (err) {
      console.error("Error starting exam:", err);
      alert(err.message || "Failed to start exam. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTestAttempt = async () => {
    try {
      if (!cbtAttempt || !cbtAttempt.attempt_id) {
        throw new Error("No active exam session found.");
      }
      setLoading(true);
      const submitData = await submitExam(cbtAttempt.attempt_id);
      
      const correctCount = submitData.correct_answers;
      const percentage = submitData.score_percentage;
      const passStatus = submitData.result;
      const today = new Date().toISOString().slice(0, 10);
      
      const testResult = {
        completed: true,
        correctCount,
        responses: [...pmTestResponses],
        submittedDate: today,
        percentage,
        passStatus
      };
      
      setPmMcqTest(testResult);
      
      const sections = [
        { title: "Signal Rules",          marks: 0, outOf: 20 },
        { title: "Track Handling",         marks: 0, outOf: 20 },
        { title: "Communication",          marks: 0, outOf: 20 },
        { title: "Safety Response",        marks: 0, outOf: 20 },
        { title: "Operational Judgement",  marks: 0, outOf: 20 }
      ];
      
      let remainingCorrect = correctCount;
      for (let i = 0; i < 5; i++) {
        const allocated = Math.min(5, remainingCorrect);
        sections[i].marks = allocated * 4;
        remainingCorrect -= allocated;
      }
      
      const record = {
        id: submitData.attempt_id || Date.now(),
        date: today,
        assessmentPeriod: "Q2 2026",
        name: TEST_NAME,
        assessedBy: "Online Self-Exam",
        totalScore: percentage,
        sections,
        responses: [...pmTestResponses],
        approvalStatus: "Completed",
        isOnlineExam: true
      };
      
      setCbtAttempt(null);
      setScreenMode("default");
      setStatusText(`Assessment submitted! Score: ${percentage}% (${correctCount}/25). Status: Completed.`);
      
      await fetchDashboardData();
    } catch (err) {
      console.error("Error submitting exam:", err);
      alert(err.message || "Failed to submit exam. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ─── Secure Session Actions ─── */
  const refreshSession = () => {
    setSessionTimeLeft(900);
    logActivity("Auth", "User secure login session refreshed to 15:00.");
    triggerNotification("success", "Operations login session renewed safely.");
  };

  /* ─── File Attachment Handlers ─── */
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const files = Array.from(e.target.files).map(f => ({
        name: f.name,
        size: (f.size / (1024 * 1024)).toFixed(2) + " MB"
      }));
      setAttachedFiles(prev => [...prev, ...files]);
      logActivity("Safety", `Attached safety evidence: ${files.map(x=>x.name).join(', ')}`);
    }
  };

  const removeAttachedFile = (idx) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  /* ─── Form Submission: Track Issue ─── */
  const submitTrackIssue = async (e) => {
    e.preventDefault();
    if (!trackLocation.trim() || !trackDesc.trim()) {
      alert("Please fill in location and description details.");
      return;
    }
    
    try {
      const payload = {
        type: "Track Defect",
        defect: trackDefect,
        location: `${trackLine} - KM ${trackLocation}`,
        severity: trackSeverity,
        description: trackDesc
      };
      
      const newReport = await createSafetyReport(payload);
      setSafetyReports(prev => [newReport, ...prev]);
      
      try {
        const logsData = await getEmployeeAuditLogs();
        if (logsData) setActivityLogs(logsData);
      } catch (e) {}

      triggerNotification("danger", `SAFETY REPORT SUBMITTED: Defect: ${trackDefect} | Loc: KM ${trackLocation}`);
      
      // Reset
      setTrackLocation("");
      setTrackDesc("");
      setAttachedFiles([]);
      setFileInputKey(Date.now());
      setSafetySubTab("history");
      setStatusText("Safety report logged. Forwarded to Station Master & P-Way inspector.");
    } catch (err) {
      alert("Failed to submit track defect report: " + err.message);
    }
  };

  /* ─── Form Submission: Incident ─── */
  const submitIncidentReport = async (e) => {
    e.preventDefault();
    if (!incidentTrain.trim() || !incidentAction.trim()) {
      alert("Please enter Train Number and Actions taken.");
      return;
    }

    try {
      const payload = {
        type: "Abnormal Incident",
        defect: incidentType,
        location: `Train ${incidentTrain} (${incidentTime || "Current"})`,
        severity: "High - Immediate Action",
        description: incidentAction
      };
      
      const newReport = await createSafetyReport(payload);
      setSafetyReports(prev => [newReport, ...prev]);

      try {
        const logsData = await getEmployeeAuditLogs();
        if (logsData) setActivityLogs(logsData);
      } catch (e) {}
      
      triggerNotification("warning", `INCIDENT ALERT: ${incidentType} detected on Train ${incidentTrain}.`);
      
      // Reset
      setIncidentTrain("");
      setIncidentAction("");
      setIncidentTime("");
      setAttachedFiles([]);
      setFileInputKey(Date.now());
      setSafetySubTab("history");
      setStatusText("Abnormal incident report logged and dispatched to Division Controller.");
    } catch (err) {
      alert("Failed to submit incident report: " + err.message);
    }
  };

  /* ─── Emergency Broadcast Actions ─── */
  const openEmergencyDialog = () => {
    setEmergencyModalOpen(true);
  };

  const triggerEmergencyBroadcast = () => {
    setEmergencyModalOpen(false);
    setEmergencyActive(true);
    setAlarmMuted(false);
    startAlarmSound();
    
    logActivity("EMERGENCY", `CRITICAL: Pulse emergency alert triggered! Type: ${emergencyType} at ${emergencyLocation}`);
    triggerNotification("danger", `🚨 BROADCAST ACTIVE: ${emergencyType} at ${emergencyLocation}. Dispatching rescue!`);
    setStatusText("EMERGENCY BROADCAST TRANSMITTING SYSTEM-WIDE!");
  };

  const clearEmergencyState = () => {
    setEmergencyActive(false);
    stopAlarmSound();
    logActivity("EMERGENCY", "Emergency alert acknowledged and cleared.");
    triggerNotification("success", "Emergency alert deactivated. Operational line clear reinstated.");
    setStatusText("Emergency broadcast deactivated. Tracks returned to safe normal status.");
  };

  const toggleAlarmMute = () => {
    if (alarmMuted) {
      startAlarmSound();
      setAlarmMuted(false);
    } else {
      stopAlarmSound();
      setAlarmMuted(true);
    }
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    logActivity("System", "Notifications inbox marked read.");
  };

  /* ═══════════════════════════════════════
     RENDER: PROFILE & AUDIT
  ═══════════════════════════════════════ */
  /* ═══════════════════════════════════════
     RENDER: DASHBOARD
  ═══════════════════════════════════════ */
  /* ─── Sidebar extracted page component calls ─── */
  const renderDashboardPage = () => (
    <PointsmanDashboard
      fullName={fullName}
      latestScore={latestScore}
      latestCategory={latestCategory}
      averageScore={averageScore}
      history={history}
      trendData={trendData}
      pieData={pieData}
      openScorecard={openScorecard}
      testAssigned={testAssigned}
      mcqTest={pmMcqTest}
      startTestAttempt={startTestAttempt}
      notifications={notifications}
      unreadNotificationsCount={unreadNotificationsCount}
      bellDropdownOpen={bellDropdownOpen}
      setBellDropdownOpen={setBellDropdownOpen}
      markAllNotificationsRead={markAllNotificationsRead}
      setActiveNav={setActiveNav}
      profileData={profileData || dashboardData}
    />
  );

  const renderProfilePage = () => (
    <UserProfile
      fullName={fullName}
      employeeId={employeeId}
      latestCategory={latestCategory}
      latestScore={latestScore}
      history={history}
      profileData={dashboardData}
    />
  );

  const renderMyAssessment = () => (
    <MyAssessment
      roleTitle="Pointsman"
      assessedByTitle="Station Master"
      myAssessSelected={myAssessSelected}
      setMyAssessSelected={setMyAssessSelected}
      performanceSummaryText={performanceSummaryText}
      testQuestions={examQuestions}
      testAssigned={testAssigned}
      mcqTest={pmMcqTest}
      startTestAttempt={startTestAttempt}
      history={history}
      openScorecard={openScorecard}
      activeQIdx={pmActiveQIdx}
      setActiveQIdx={setPmActiveQIdx}
      testResponses={pmTestResponses}
      setTestResponses={setPmTestResponses}
      handleSubmitTestAttempt={handleSubmitTestAttempt}
      screenMode={screenMode}
      setScreenMode={setScreenMode}
      fullName={fullName}
      employeeId={employeeId}
      profileData={dashboardData}
      questionBankCount={questionBankCount}
      assessmentStatus={dashboardData?.assessment_status || "Not Assigned"}
      assessmentDetails={dashboardData?.assessment_details || null}
    />
  );

  const renderSafetyPage = () => (
    <PointsmanSafety
      openEmergencyDialog={openEmergencyDialog}
      safetySubTab={safetySubTab}
      setSafetySubTab={setSafetySubTab}
      safetyReports={safetyReports}
      submitTrackIssue={submitTrackIssue}
      trackLine={trackLine}
      setTrackLine={setTrackLine}
      trackLocation={trackLocation}
      setTrackLocation={setTrackLocation}
      trackDefect={trackDefect}
      setTrackDefect={setTrackDefect}
      trackSeverity={trackSeverity}
      setTrackSeverity={setTrackSeverity}
      trackDesc={trackDesc}
      setTrackDesc={setTrackDesc}
      fileInputKey={fileInputKey}
      handleFileChange={handleFileChange}
      attachedFiles={attachedFiles}
      removeAttachedFile={removeAttachedFile}
      submitIncidentReport={submitIncidentReport}
      incidentType={incidentType}
      setIncidentType={setIncidentType}
      incidentTrain={incidentTrain}
      setIncidentTrain={setIncidentTrain}
      incidentTime={incidentTime}
      setIncidentTime={setIncidentTime}
      incidentAction={incidentAction}
      setIncidentAction={setIncidentAction}
    />
  );

  const renderPmePage = () => {
    const pmeStatus = profileData?.pme_status || "FIT";
    const pmeDate = profileData?.pme_date || "—";
    const pmeDueDate = profileData?.pme_next_due_date || "—";
    const pmeRemarks = profileData?.pme_remarks || "Cleared normal vision and BP tests.";

    return (
      <div className="sdom-fade pm-pme-page" style={{ padding: "24px", color: "#1e293b" }}>
        <div className="pm-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Periodic Medical Examination (PME) Status</h2>
              <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748b" }}>Official record of medical wellness checks and fitness clearances for safety-critical shunting duties.</p>
            </div>
            <span style={{
              background: pmeStatus === "FIT" || pmeStatus === "Fit" ? "#dcfce7" : "#fee2e2",
              color: pmeStatus === "FIT" || pmeStatus === "Fit" ? "#16a34a" : "#dc2626",
              padding: "6px 16px",
              borderRadius: "20px",
              fontWeight: "800",
              fontSize: "14px",
              textTransform: "uppercase"
            }}>
              {pmeStatus}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "16px" }}>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Last Exam Date</div>
              <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>{pmeDate}</div>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "16px" }}>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Next Due Date</div>
              <div style={{ fontSize: "18px", fontWeight: "800", color: "#ea580c", marginTop: "4px" }}>{pmeDueDate}</div>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "16px" }}>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Medical Standard</div>
              <div style={{ fontSize: "18px", fontWeight: "800", color: "#2563eb", marginTop: "4px" }}>A-2 Classification</div>
            </div>
          </div>

          <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "16px", marginBottom: "24px" }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "800", color: "#0f172a" }}>Medical Examiner Remarks</h4>
            <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.6" }}>{pmeRemarks || "No examiner remarks logged. Clear for active shunting and track locking operations."}</p>
          </div>

          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>Safety Compliance Checklist</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {[
                { test: "Visual Acuity Check", desc: "Passed Distant/Near Vision standards (6/6 in both eyes without glasses)", status: "COMPLETED" },
                { test: "Color Blindness Examination", desc: "Ishihara test passed. Normal color perception confirmed.", status: "COMPLETED" },
                { test: "Blood Pressure & Sugar Check", desc: "BP and blood sugar values fall within operational limits.", status: "COMPLETED" },
                { test: "General Physical Examination", desc: "Fully fit for manual points operation and outdoor physical yard shunting.", status: "COMPLETED" }
              ].map((item, idx) => (
                <div key={idx} style={{ display: "flex", gap: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "12px" }}>
                  <div style={{ color: "#16a34a", fontWeight: "800", fontSize: "16px" }}>✓</div>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "13px", color: "#0f172a" }}>{item.test}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRefPage = () => {
    const refStatus = profileData?.ref_status || "Cleared";
    const refDate = profileData?.ref_date || "—";
    const refDueDate = profileData?.ref_next_due_date || "—";
    const refRemarks = profileData?.ref_remarks || "Completed points safety training at ZRTI.";

    return (
      <div className="sdom-fade pm-ref-page" style={{ padding: "24px", color: "#1e293b" }}>
        <div className="pm-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Refresher (REF) Training Course Details</h2>
              <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748b" }}>Mandatory periodic refresher training curriculum for active Pointsman staff.</p>
            </div>
            <span style={{
              background: refStatus === "Cleared" || refStatus === "FIT" || refStatus === "Fit" ? "#dcfce7" : "#fee2e2",
              color: refStatus === "Cleared" || refStatus === "FIT" || refStatus === "Fit" ? "#16a34a" : "#dc2626",
              padding: "6px 16px",
              borderRadius: "20px",
              fontWeight: "800",
              fontSize: "14px",
              textTransform: "uppercase"
            }}>
              {refStatus}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "16px" }}>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Last Course Completion</div>
              <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>{refDate}</div>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "16px" }}>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Retraining Due Date</div>
              <div style={{ fontSize: "18px", fontWeight: "800", color: "#ea580c", marginTop: "4px" }}>{refDueDate}</div>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "16px" }}>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Training Institute</div>
              <div style={{ fontSize: "18px", fontWeight: "800", color: "#2563eb", marginTop: "4px" }}>ZRTI, Bhusawal (CR)</div>
            </div>
          </div>

          <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "16px", marginBottom: "24px" }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "800", color: "#0f172a" }}>Instructor Assessment & Remarks</h4>
            <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.6" }}>{refRemarks || "Passed refresher practical assessments on yard shunting safety, interlocking codes, and block operations with distinction."}</p>
          </div>

          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>Course Syllabus Completion Status</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {[
                { module: "Station Working Rules (SWR)", desc: "Deep review of points layout, trap points, and shunting constraints for Nagpur Junction.", pct: 100 },
                { module: "Emergency Procedures", desc: "Handling derailment risks, hot axle detection, reporting defects, visual checks.", pct: 100 },
                { module: "Hand Signals and Communication", desc: "Correct usage of flags, tri-color hand lamps, walkie-talkie communication protocols.", pct: 100 },
                { module: "Points Locking & Clamp Placement", desc: "Practical locking of point switches during interlocking failures.", pct: 100 }
              ].map((item, idx) => (
                <div key={idx} style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "700", fontSize: "13px", color: "#0f172a" }}>
                    <span>{item.module}</span>
                    <span style={{ color: "#16a34a" }}>{item.pct}%</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", lineHeight: "1.4" }}>{item.desc}</div>
                  <div style={{ height: "4px", background: "#e2e8f0", borderRadius: "2px", marginTop: "8px" }}>
                    <div style={{ height: "100%", width: `${item.pct}%`, background: "#16a34a", borderRadius: "2px" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCounsellingPage = () => {
    return (
      <div className="sdom-fade pm-counselling-page" style={{ padding: "24px", color: "#1e293b" }}>
        <div className="pm-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Counselling Logbook</h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748b" }}>Assigned safety counseling sessions, correction notes, and guidance history log from station supervisors.</p>
          </div>

          <div className="pm-table-wrap" style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #cbd5e1" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "800", color: "#475569" }}>Counselling Date</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "800", color: "#475569" }}>Counselling Officer</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "800", color: "#475569" }}>Topics / Reason</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "800", color: "#475569" }}>Remarks / Safety Advice</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "12px", fontWeight: "800", color: "#475569" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {counsellingList.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "#64748b", fontStyle: "italic" }}>
                      No safety counselling records found. Your safety compliance index is currently fully satisfactory.
                    </td>
                  </tr>
                ) : (
                  counsellingList.map((c) => {
                    const cDate = c.counselling_date ? new Date(c.counselling_date).toISOString().slice(0, 10) : "—";
                    return (
                      <tr key={c.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "12px 16px", fontWeight: "700", fontSize: "13px", color: "#0f172a" }}>{cDate}</td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "#334155" }}>
                          <strong>{c.counsellor_name || "—"}</strong>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>{c.counsellor_designation || "Counsellor"}</div>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "#0f172a", fontWeight: "700" }}>{c.reason || "—"}</td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "#475569", lineHeight: "1.4" }}>{c.remarks || "—"}</td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <span style={{
                            background: c.status === "Completed" || c.status === "Closed" ? "#dcfce7" : "#fef3c7",
                            color: c.status === "Completed" || c.status === "Closed" ? "#16a34a" : "#d97706",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "800",
                            textTransform: "uppercase"
                          }}>
                            {c.status || "Open"}
                          </span>
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
    );
  };

  /* ─── Content dispatcher ─── */
  const renderBodyContent = () => {
    if (screenMode === "takeTest") return renderMyAssessment();
    if (activeNav === "dashboard") return renderDashboardPage();
    if (activeNav === "profile") return renderProfilePage();
    if (activeNav === "myAssessment") return renderMyAssessment();
    if (activeNav === "safety") return renderSafetyPage();
    if (activeNav === "pme") return renderPmePage();
    if (activeNav === "ref") return renderRefPage();
    if (activeNav === "counselling") return renderCounsellingPage();
    if (activeNav === "myAssessment") return renderMyAssessment();
    if (activeNav === "safety") return renderSafetyPage();

    return renderDashboardPage();
  };

  /* ═══════════════════════════════════════
     SHELL LAYOUT
  ═══════════════════════════════════════ */
  return (
    <div className={`pm-layout ${emergencyActive ? "emergency-glow-active" : ""}`}>
      
      {/* ── Flashing Emergency Alert Banner ── */}
      {emergencyActive && (
        <div className="pm-emergency-siren-banner">
          <div className="siren-message">
            <span className="siren-light animate-flash">🚨 {t("emergency.alert") || "ALERT"}</span>
            <strong>
              {(t("emergency.broadcastActive") !== "emergency.broadcastActive"
                ? t("emergency.broadcastActive")
                : "MANDATORY EMERGENCY BROADCAST ACTIVE: {type} detected at {location}! All train & siding movements are frozen immediately."
              ).replace("{type}", t(`emergency.options.${emergencyType.toLowerCase().replace(/\s+/g, '')}`) || emergencyType)
               .replace("{location}", emergencyLocation)}
            </strong>
          </div>
          <div className="siren-controls">
            <button className="pm-siren-mute-btn" onClick={toggleAlarmMute}>
              {alarmMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              {alarmMuted ? t("buttons.unmute") || "Unmute Alarm" : t("buttons.mute") || "Mute Sound"}
            </button>
            <button className="pm-siren-clear-btn" onClick={clearEmergencyState}>
              {t("buttons.clearEmergency") || "Clear & Safe Return"}
            </button>
          </div>
        </div>
      )}

      <header className="pm-topbar">
        <div className="pm-topbar-brand">
          <div className="pm-topbar-logo">IR</div>
          <div>
            <h1>{t("layout.brandTitle") || "Indian Railway Evaluation Command"}</h1>
            <p>{t("layout.pointsmanWorkspace") || "Operations Workspace: Pointsman Module"}</p>
          </div>
        </div>



        <div className="pm-user-strip">
          {/* ── Real-Time Notifications Bell Dropdown ── */}
          <div className="pm-notification-bell-container" style={{ marginRight: "12px" }}>
            <NotificationBell />
          </div>

          {/* Language Selector Component */}
          <div style={{ marginRight: "8px", display: "flex", alignItems: "center" }}>
            <LanguageSwitcher />
          </div>

          <div className="pm-user-avatar">{fullName.charAt(0)}</div>
          <div>
            <strong>{fullName}</strong>
            <span>HRMS ID: {employeeId}</span>
          </div>
          <button className="pm-logout-btn" onClick={() => { stopAlarmSound(); onLogout(); }}>
            <LogOut size={15} /> {t("layout.logout") || "Logout"}
          </button>
        </div>
      </header>

      <div className="pm-content-shell">
        <aside className="pm-sidebar">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeNav === item.key && screenMode === "default";
            const transKey = `sidebar.${item.key}`;
            const labelText = t(transKey) !== transKey ? t(transKey) : item.label;
            return (
              <button
                key={item.key}
                className={`pm-nav-item ${isActive ? "active" : ""}`}
                onClick={() => { goToNavPage(item.key); setBellDropdownOpen(false); }}
              >
                <Icon size={18} />
                <span>{labelText}</span>
              </button>
            );
          })}
          

        </aside>

        <main className="pm-main-panel">
          <div className="pm-main-header-band">
            <div>
              <p className="pm-hero-eyebrow">{t("layout.nagpurOperations") || "Nagpur Junction Operations"}</p>
              <h2 className="pm-main-title">
                {screenMode === "scorecard" ? t("assessment.detailedScorecard") || "Detailed Evaluation scorecard"
                  : screenMode === "attempt" ? t("assessment.activeSession") || "Competency Examination Attempt"
                  : t("sidebar." + activeNav) || navItems.find(i => i.key === activeNav)?.label || "Workspace"}
              </h2>
            </div>
            <div className="pm-header-kpis">
              <div className="pm-hkpi" onClick={() => goToNavPage("myAssessment")} style={{ cursor: "pointer" }}>
                <Award size={14} />
                <span>{history.length} {t("sidebar.assessments") || "Assessments"}</span>
              </div>
              <div className="pm-hkpi" onClick={() => goToNavPage("myAssessment")} style={{ cursor: "pointer" }}>
                <Gauge size={14} />
                <span>{t("dashboard.averageScore") || "Avg"} {averageScore}</span>
              </div>
              <div className="pm-hkpi" onClick={() => goToNavPage("myAssessment")} style={{ cursor: "pointer", color: getCategoryColor(latestCategory) }}>
                <ShieldCheck size={14} />
                <span>{t("dashboard.currentCategory") || "Cat."} {latestCategory}</span>
              </div>
            </div>
          </div>

          {statusText && (
            <div className="pm-status-banner">
              <CheckCircle2 size={15} /> {statusText}
            </div>
          )}

          {renderBodyContent()}
        </main>
      </div>

      {/* ── EMERGENCY BROADCAST SETUP MODAL ── */}
      {emergencyModalOpen && (
        <div className="pm-emergency-modal-overlay">
          <div className="pm-emergency-modal">
            <div className="modal-header">
              <h2>🚨 {t("emergency.confirmBroadcast") || "CONFIRM URGENT DIVISION-WIDE BROADCAST"}</h2>
              <button onClick={() => setEmergencyModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="danger-notice">
                {t("emergency.warningText") || "WARNING: Triggering this broadcast sends an audio warning signal and locks shunting/movement panels on all active Station Master & Superintendent terminals! Use for genuine safety emergencies only."}
              </p>
              <div className="modal-fields">
                <label>{t("emergency.category") || "Emergency Category"}</label>
                <select value={emergencyType} onChange={e => setEmergencyType(e.target.value)}>
                  <option value="Obstruction on Track">{t("emergency.options.obstruction") || "Obstruction on Siding (Fouling Clearance)"}</option>
                  <option value="Derailment Danger">{t("emergency.options.derailment") || "Visible Rail Crack / Splitting Point"}</option>
                  <option value="Signal Failure">{t("emergency.options.signalFailure") || "Critical Signal Lock Failure"}</option>
                  <option value="Hot Axle Fire Spark">{t("emergency.options.hotAxle") || "Hot Axle / Spark Smoke in Incoming train"}</option>
                  <option value="Other Danger">{t("emergency.options.other") || "Other Major Track Danger"}</option>
                </select>
                
                <label>{t("emergency.location") || "Vulnerable Location / Track"}</label>
                <input 
                  type="text" 
                  value={emergencyLocation} 
                  onChange={e => setEmergencyLocation(e.target.value)} 
                  placeholder={t("emergency.locationPlaceholder") || "e.g. Line 2 Loop Siding, KM 102/4"} 
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setEmergencyModalOpen(false)}>{t("buttons.cancel") || "Cancel"}</button>
              <button className="confirm-btn" onClick={triggerEmergencyBroadcast}>
                {t("emergency.confirmAndBroadcast") || "CONFIRM & BROADCAST ALARM"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PointsmanModule;
