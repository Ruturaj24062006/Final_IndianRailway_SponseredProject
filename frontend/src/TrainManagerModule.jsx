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
  Plus
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
import TMDashboard from "./components/TrainManagerModule/TMDashboard";
import UserProfile from "./components/UserProfile";
import MyAssessment from './components/MyAssessment';
import TMSafety from "./components/TrainManagerModule/TMSafety";
import NotificationBell from "./components/NotificationBell";
import LanguageSwitcher from "./components/LanguageSwitcher";
import { getEmployeeProfile, getEmployeeHistory } from "./services/employeeService";
import { useLanguage } from "./utils/LanguageContext";


/* ─── Navigation ─── */
const navItems = [
  { key: "dashboard", label: "Dashboard", icon: Gauge },
  { key: "myAssessment", label: "My Assessment", icon: FileBarChart2 },
  { key: "profile", label: "Profile", icon: UserCircle2 }
];

/* ─── Static profile data with requested fields ─── */
const trainManagerProfile = {
  name: "A. Mehta",
  hrmsId: "TM_1001",
  stationName: "Nagpur Junction (NGP)",
  designation: "Train Manager",
  mobileNumber: "+91 98220 77001",
  pmeStatus: "FIT (Periodic Medical Exam) - Due: 2029-08-20",
  refStatus: "COMPLETED (Refresher Course) - Due: 2027-05-12",
  trainingStatus: "ACTIVE (Safety & Automatic Block Certified)",
  currentCategory: "A",
  department: "Operations",
  reportingOfficer: "TI_1001 (Traffic Inspector)",
  joiningDate: "2019-04-12"
};

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

/* ─── Seed history — ONE test type repeated ─── */
const TEST_NAME = "Train Manager Periodic Assessment";

// Helper to generate correct/incorrect response array for seeded history
function generateMockResponses(score) {
  const correctCount = Math.round((score / 100) * 25);
  const arr = Array(25).fill(null);
  const indices = Array.from({ length: 25 }, (_, i) => i);
  // shuffle indices
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const correctIndices = new Set(indices.slice(0, correctCount));
  for (let i = 0; i < 25; i++) {
    const q = testQuestions[i];
    if (correctIndices.has(i)) {
      arr[i] = q.answer; // correct
    } else {
      arr[i] = (q.answer + 1) % 4; // incorrect
    }
  }
  return arr;
}

/* ─── 25 MCQ questions ─── */
const rawQuestions = [
  { text: "A signal shows double yellow. The driver should:", options: ["Proceed at full speed", "Prepare to stop at next signal", "Stop immediately", "Sound horn continuously"], answer: 1, explanation: "A double yellow aspect is an attention signal, warning the driver that they are approaching a signal showing a restrictive aspect (single yellow or red) and must prepare to stop." },
  { text: "When a track circuit fails, the train manager must:", options: ["Ignore it and proceed", "Immediately inform the station master", "Wait for someone else to act", "Close the station"], answer: 1, explanation: "Any signal or track circuit failure is a safety hazard. The train manager must notify the Station Master immediately so that proper block working or manual pilot-in procedures can be initiated." },
  { text: "The safe distance to stand from a moving train is:", options: ["0.5 metres", "1 metre", "2 metres", "5 metres"], answer: 2, explanation: "To avoid aerodynamic suction and flying ballast, personnel must maintain a safe distance of at least 2 metres from any moving rail vehicle." },
  { text: "A 'Line Clear' token must be:", options: ["Carried by the guard", "Exchanged only at block stations", "Kept at the engine", "Kept at the signal box"], answer: 1, explanation: "In single line token working territory, the authority to proceed is a tangible token that must only be exchanged at designated block stations under the SM's authority." },
  { text: "Points must be clipped and padlocked when:", options: ["A train is expected", "Maintenance is not needed", "No train is expected for 8 hours", "During night only"], answer: 0, explanation: "For maximum protection during non-interlocked working or defect conditions, points must be physically clipped and padlocked for the authorized route before a train is received." },
  { text: "Which colour indicates a 'Stop' signal?", options: ["Green", "Yellow", "Red", "White"], answer: 2, explanation: "Red is the universal danger aspect indicating a mandatory stop before the signal." },
  { text: "An emergency brake application mid-section requires:", options: ["Driver to restart immediately", "Informing the guard and station master", "Reversing to the last station", "Disconnecting the coupling"], answer: 1, explanation: "An unexpected emergency halt requires immediate coordination with the train guard and the adjacent station masters to protect the block section." },
  { text: "A detonator placed on the track signals the driver to:", options: ["Increase speed", "Stop and proceed cautiously", "Reverse immediately", "Ignore it"], answer: 1, explanation: "A detonator explosion is an audible warning. The loco pilot must stop immediately, investigate, and then proceed with extreme caution at restricted speed." },
  { text: "Fixed signals are distinguished from working signals by:", options: ["Being painted blue", "Having no moving parts", "Being placed lower", "Flashing continuously"], answer: 1, explanation: "Fixed signals are permanent trackside landmarks or boards (like warning boards) that do not have active moving arms or shifting light aspects." },
  { text: "The whistle code for 'Stop' is:", options: ["One long", "Two short", "Three short", "One short"], answer: 0, explanation: "One long continuous blast of the engine whistle is the standard operational code signaling a stop or warning." },
  { text: "When automatic block operations, the speed limit in station limits is:", options: ["15 km/h", "25 km/h", "30 km/h", "50 km/h"], answer: 0, explanation: "Standard automatic block operations speed is strictly capped at 15 km/h to allow train managers and automatic block operations staff to safely switch tracks and prevent high-impact collisions." },
  { text: "A fouling mark indicates:", options: ["The limit of safe track clearance", "A defective rail", "Speed restriction end", "Gradient change"], answer: 0, explanation: "A fouling mark is a physical block placed between two converging tracks indicating the limit up to which vehicles can stand without obstructing movements on the adjacent line." },
  { text: "Who authorises working on a live track?", options: ["The nearest train manager", "The gang mate", "The station master with permit", "Any senior staff"], answer: 2, explanation: "Safety rules forbid working on active tracks without an official block permit and authorization issued by the Station Master on duty." },
  { text: "Verbal communication during train operations must be:", options: ["Quick and informal", "Clear, loud, and repeated back", "Whispered to avoid panic", "Written only"], answer: 1, explanation: "To prevent fatal misunderstandings, all verbal automatic block operations commands and line instructions must be clearly spoken and actively repeated back by the receiver." },
  { text: "A Point Indicator showing 'Normal' means:", options: ["Points are in reverse position", "Points are in normal position", "Points are defective", "No train is expected"], answer: 1, explanation: "A point indicator operates in correspondence with the switch rail position. A 'Normal' display confirms that the points are set for the straight/main line." },
  { text: "In fog, the frequency of detonator placement is:", options: ["Every 500 metres", "Every 1 km", "Every signal", "At engine only"], answer: 2, explanation: "During dense fog or thick weather, additional detonators are placed at the distant signal limits to warn incoming loco pilots of their proximity to the station." },
  { text: "When a train passes, the train manager should:", options: ["Walk along the track", "Stand at least 2 m away and observe", "Record speed", "Signal with a flag immediately"], answer: 1, explanation: "Train Managers are required to perform visual inspection of passing trains (checking for hot axles, hanging parts, or sparks) while standing at a safe distance." },
  { text: "A green hand signal during automatic block operations means:", options: ["Stop", "Proceed", "Caution", "Reverse"], answer: 1, explanation: "A green flag or green hand lamp signal indicates authorization to proceed with the automatic block operations movement." },
  { text: "Interlocking ensures that:", options: ["Signals and points cannot be in conflicting positions", "Only one train can enter the yard", "Points are locked at all times", "Signals always show green"], answer: 0, explanation: "Interlocking is a safety arrangement of signals, points, and other appliances, operated mechanically or electrically, preventing conflicting routes from being cleared simultaneously." },
  { text: "A 'Caution Order' issued to a driver must be:", options: ["Signed and returned to station master", "Kept by the driver until destination", "Torn after reading", "Radioed to control"], answer: 0, explanation: "A caution order contains temporary speed restrictions. The driver must sign and acknowledge receipt, returning the counterfoil to the SM." },
  { text: "The correct way to hold a flag when giving an 'All Right' signal is:", options: ["Waving it rapidly overhead", "Held steadily by the side", "Stretched horizontally at arm's length", "Pointing at the engine"], answer: 2, explanation: "An 'All Right' signal is presented by holding the green flag steadily stretched horizontally at arm's length towards the passing train." },
  { text: "Trap points are used to:", options: ["Increase train speed", "Prevent unauthorized entry into main line", "Derail a runaway vehicle away from the main line", "Signal an emergency stop"], answer: 2, explanation: "Trap points are safety switches designed to derail any runaway carriage or vehicle shifting unauthorizedly towards a busy passenger running line, protecting main line movements." },
  { text: "The SWR (Station Working Rules) must be revised:", options: ["Every 5 years", "As and when changes occur", "Only by the GM", "Never once issued"], answer: 1, explanation: "SWR rules must be amended immediately whenever physical layouts, signaling systems, or operating block instruments are modified at the station." },
  { text: "Before restoring points to normal after engineering work, the train manager must:", options: ["Inform the driver", "Check that the track is clear and inform station master", "Replace detonators", "Wait for green signal"], answer: 1, explanation: "Safety requires the train manager to visually verify that the track switches are free of tools, ballast, or staff before notifying the SM to normalise the routing." },
  { text: "If a signal cannot be lowered, the driver should be given:", options: ["A red flag and stopped", "A 'T/369' caution memo and proceed at 15 km/h", "Permission to proceed at full speed", "A verbal confirmation only"], answer: 1, explanation: "A defective signal requires a physical authorization memo (T/369-3b) handed to the driver, authorizing them to pass the signal at danger at restricted speed." }
];

const testQuestions = rawQuestions.map((q, i) => ({ id: i + 1, ...q }));

const initialHistory = [
  {
    id: 1,
    date: "2026-03-10",
    name: TEST_NAME,
    assessmentPeriod: "March 2026",
    totalScore: 84,
    sections: [
      { title: "Signal Rules", marks: 17, outOf: 20 },
      { title: "Track Handling", marks: 16, outOf: 20 },
      { title: "Communication", marks: 17, outOf: 20 },
      { title: "Safety Response", marks: 17, outOf: 20 },
      { title: "Operational Judgement", marks: 17, outOf: 20 }
    ],
    responses: generateMockResponses(84)
  },
  {
    id: 2,
    date: "2026-02-10",
    name: TEST_NAME,
    assessmentPeriod: "February 2026",
    totalScore: 76,
    sections: [
      { title: "Signal Rules", marks: 15, outOf: 20 },
      { title: "Track Handling", marks: 16, outOf: 20 },
      { title: "Communication", marks: 14, outOf: 20 },
      { title: "Safety Response", marks: 13, outOf: 20 },
      { title: "Operational Judgement", marks: 18, outOf: 20 }
    ],
    responses: generateMockResponses(76)
  },
  {
    id: 3,
    date: "2026-01-10",
    name: TEST_NAME,
    assessmentPeriod: "January 2026",
    totalScore: 88,
    sections: [
      { title: "Signal Rules", marks: 18, outOf: 20 },
      { title: "Track Handling", marks: 18, outOf: 20 },
      { title: "Communication", marks: 17, outOf: 20 },
      { title: "Safety Response", marks: 18, outOf: 20 },
      { title: "Operational Judgement", marks: 17, outOf: 20 }
    ],
    responses: generateMockResponses(88)
  },
  {
    id: 4,
    date: "2025-12-10",
    name: TEST_NAME,
    assessmentPeriod: "December 2025",
    totalScore: 68,
    sections: [
      { title: "Signal Rules", marks: 13, outOf: 20 },
      { title: "Track Handling", marks: 14, outOf: 20 },
      { title: "Communication", marks: 14, outOf: 20 },
      { title: "Safety Response", marks: 14, outOf: 20 },
      { title: "Operational Judgement", marks: 13, outOf: 20 }
    ],
    responses: generateMockResponses(68)
  },
  {
    id: 5,
    date: "2025-11-10",
    name: TEST_NAME,
    assessmentPeriod: "November 2025",
    totalScore: 72,
    sections: [
      { title: "Signal Rules", marks: 15, outOf: 20 },
      { title: "Track Handling", marks: 14, outOf: 20 },
      { title: "Communication", marks: 14, outOf: 20 },
      { title: "Safety Response", marks: 15, outOf: 20 },
      { title: "Operational Judgement", marks: 14, outOf: 20 }
    ],
    responses: generateMockResponses(72)
  }
];

/* ─── Single active test for the current month ─── */
const currentTestSeed = {
  id: "CT-APR-2026",
  name: TEST_NAME,
  period: "April 2026"
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
    try { alarmOsc.stop(); } catch (e) { }
    alarmOsc = null;
  }
  if (audioCtx) {
    try { audioCtx.close(); } catch (e) { }
    audioCtx = null;
  }
}

/* ─── Main component ─── */
function TrainManagerModule({ user, onLogout }) {
  const { locale, changeLanguage, t } = useLanguage();
  const [profileData, setProfileData] = useState(trainManagerProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fullName = profileData?.full_name || user?.name || trainManagerProfile.name;
  const employeeId = profileData?.hrms_id || user?.hrmsId || trainManagerProfile.hrmsId;

  const [activeNav, setActiveNav] = useState("dashboard");
  const [screenMode, setScreenMode] = useState("default");

  const [history, setHistory] = useState(() => {
    return initialHistory;
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const profile = await getEmployeeProfile();
        setProfileData(profile);
        const histData = await getEmployeeHistory();
        if (histData && histData.length > 0) {
          setHistory(histData);
        }
      } catch (err) {
        console.warn("Failed to fetch Train Manager database profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const [historyDateSearch, setHistoryDateSearch] = useState("");
  const [historySortOrder, setHistorySortOrder] = useState("date-desc");
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // My Assessment state (mirrors SM module)
  const [myAssessSelected, setMyAssessSelected] = useState(null);
  const [tmMcqTest, setPmMcqTest] = useState(() => {
    const saved = localStorage.getItem(`tm_mcq_test_${employeeId}`);
    return saved ? JSON.parse(saved) : null;
  });
  const [testAssigned, setTestAssigned] = useState(() => {
    const saved = localStorage.getItem(`tm_test_assigned_${employeeId}`);
    if (saved === null) {
      localStorage.setItem(`tm_test_assigned_${employeeId}`, "Assigned");
      return "Assigned";
    }
    return saved;
  });
  const [tmActiveQIdx, setTmActiveQIdx] = useState(0);
  const [tmTestResponses, setTmTestResponses] = useState(() => Array(25).fill(null));

  const [currentTest, setCurrentTest] = useState(() => {
    const saved = localStorage.getItem(`tm_current_test_${employeeId}`);
    if (saved) return JSON.parse(saved);
    const mcqResult = localStorage.getItem(`tm_mcq_test_${employeeId}`);
    if (mcqResult && JSON.parse(mcqResult).completed) {
      return null;
    }
    return currentTestSeed;
  });

  const [activeTest, setActiveTest] = useState(null);
  const [responses, setResponses] = useState(Array(25).fill(null));
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [statusText, setStatusText] = useState("");

  /* ─── Extra State Additions ─── */
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
  const [activityLogs, setActivityLogs] = useState([
    { id: 1, timestamp: "2026-05-27 10:00:12", category: "Auth", action: "User session initialized (IP: 10.244.15.68)", user: "A. Mehta" },
    { id: 2, timestamp: "2026-05-27 10:01:45", category: "Profile", action: "PME & REF health profile retrieved", user: "A. Mehta" },
    { id: 3, timestamp: "2026-05-27 10:03:10", category: "System", action: "Audited dashboard integrity checklist successfully", user: "A. Mehta" }
  ]);

  // 5. Emergency Alert & Siren State
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [emergencyType, setEmergencyType] = useState("Obstruction on Track");
  const [emergencyLocation, setEmergencyLocation] = useState("Nagpur Yard Line 2");
  const [alarmMuted, setAlarmMuted] = useState(false);

  // 6. Safety Reports
  const [safetySubTab, setSafetySubTab] = useState("track"); // "track" | "incident" | "history"
  const [safetyReports, setSafetyReports] = useState([
    { id: 101, type: "Track Defect", defect: "Rail Joint Crack", location: "KM 104/2 Near Gate", severity: "High - Urgent Action", status: "RESOLVED", date: "2026-05-24", desc: "Visible hair crack on joint fishplate." },
    { id: 102, type: "Abnormal Incident", defect: "Hot Axle Exchanged Flag", location: "Line 1 Main", severity: "Medium - Investigating", status: "UNDER REPAIR", date: "2026-05-26", desc: "Detected sparks during all-right hand signal. Notified Station Master." }
  ]);

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

  // Track user notifications unread count
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

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
            submitTest(true); // force auto-submit!
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isAssessmentTimerRunning, assessmentTimeLeft]);
  /* ─── Derived metrics ─── */
  const latestScore = history.length ? history[0].totalScore : null;
  const latestCategory = latestScore !== null ? getCategory(latestScore) : "—";
  const averageScore = history.length
    ? Math.round(history.reduce((s, i) => s + i.totalScore, 0) / history.length)
    : 0;
  const answeredCount = responses.filter(v => v !== null).length;
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
      summary += `However, low-scoring markers are observed in "${lowestSec.title}" (${lowestSec.marks}/${lowestSec.outOf}). It is highly recommended to study the Station Working Rules (SWR) for block operations and undergo periodic coaching.`;
    } else {
      summary += `Achieved flawless accuracy in all modules. Recommended to maintain this premium standard in daily train manager operations.`;
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

  /* ─── Navigation ─── */
  const goToNavPage = (key) => {
    setActiveNav(key);
    setScreenMode("default");
    setStatusText("");
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
  const startTestAttempt = () => {
    setTmActiveQIdx(0);
    setTmTestResponses(Array(25).fill(null));
    setScreenMode("takeTest");
  };

  const handleSubmitTestAttempt = () => {
    const correctCount = tmTestResponses.filter((r, idx) => r === testQuestions[idx].answer).length;
    const percentage = Math.round((correctCount / 25) * 100);
    const passStatus = percentage >= 60 ? "PASSED" : "FAILED";
    const today = new Date().toISOString().slice(0, 10);
    const testResult = {
      completed: true,
      correctCount,
      responses: [...tmTestResponses],
      submittedDate: today,
      percentage,
      passStatus
    };
    localStorage.setItem(`tm_mcq_test_${employeeId}`, JSON.stringify(testResult));
    setPmMcqTest(testResult);
    localStorage.setItem(`tm_test_assigned_${employeeId}`, "Completed");
    setTestAssigned("Completed");
    const record = {
      id: Date.now(),
      date: today,
      assessmentPeriod: "Q2 2026",
      name: TEST_NAME,
      assessedBy: "Online Self-Exam",
      totalScore: correctCount * 4,
      sections: [
        { title: "Signal Rules", marks: 0, outOf: 20 },
        { title: "Track Handling", marks: 0, outOf: 20 },
        { title: "Communication", marks: 0, outOf: 20 },
        { title: "Safety Response", marks: 0, outOf: 20 },
        { title: "Operational Judgement", marks: 0, outOf: 20 }
      ],
      responses: [...tmTestResponses],
      approvalStatus: "Completed",
      isOnlineExam: true
    };
    const newHistory = [record, ...history];
    setHistory(newHistory);
    localStorage.setItem(`tm_history_${employeeId}`, JSON.stringify(newHistory));
    setScreenMode("default");
    setStatusText(`Assessment submitted! Score: ${percentage}% (${correctCount}/25). Status: Completed.`);
  };

  /* ─── Test Actions ─── */
  const handleReattempt = () => {
    localStorage.removeItem(`tm_mcq_test_${employeeId}`);
    localStorage.setItem(`tm_current_test_${employeeId}`, JSON.stringify(currentTestSeed));
    setCurrentTest(currentTestSeed);
    setActiveTest(currentTestSeed);
    setResponses(Array(25).fill(null));
    setCurrentQuestion(0);
    setStatusText("New CBT automatic block operations safety test session initialized.");
    setActiveNav("current");
    setScreenMode("attempt");
    logActivity("Assessment", "Periodic CBT assessment re-attempt session started.");
    triggerNotification("info", "New automatic block operations safety CBT competency exam session active.");
  };

  const startTest = () => {
    setActiveTest(currentTest || currentTestSeed);
    setResponses(Array(25).fill(null));
    setCurrentQuestion(0);
    setStatusText("");
    setIsAssessmentTimerRunning(false);
    setActiveNav("current");
    setScreenMode("attempt");
    logActivity("Assessment", "Periodic assessment test started.");
  };

  const handleSelectOption = (idx) => {
    setResponses(prev => { const n = [...prev]; n[currentQuestion] = idx; return n; });
  };

  const evaluateTest = () => {
    let correct = 0;
    const sec = [0, 0, 0, 0, 0];
    responses.forEach((r, i) => {
      const si = Math.floor(i / 5);
      if (r === testQuestions[i].answer) { correct++; sec[si] += 4; }
    });
    const sections = [
      "Signal Rules",
      "Track Handling",
      "Communication",
      "Safety Response",
      "Operational Judgement"
    ].map((title, i) => ({ title, marks: sec[i], outOf: 20 }));
    return { totalScore: correct * 4, sections };
  };

  const submitTest = (isAutoSubmit = false) => {
    setIsAssessmentTimerRunning(false);
    const { totalScore, sections } = evaluateTest();
    const today = new Date().toISOString().slice(0, 10);
    const record = {
      id: Date.now(),
      date: today,
      name: TEST_NAME,
      assessmentPeriod: activeTest ? activeTest.period : "April 2026",
      totalScore,
      sections,
      responses: [...responses]
    };
    const newHistory = [record, ...history];
    setHistory(newHistory);
    localStorage.setItem(`tm_history_${employeeId}`, JSON.stringify(newHistory));

    setCurrentTest(null);
    localStorage.setItem(`tm_current_test_${employeeId}`, JSON.stringify(null));

    // Save MCQ result for Traffic Inspector
    const correctCount = Math.round(totalScore / 4);
    const percentage = Math.round((correctCount / 25) * 100);
    const mcqResult = {
      completed: true,
      correctCount: correctCount,
      submittedDate: today,
      percentage: percentage
    };
    localStorage.setItem(`tm_mcq_test_${employeeId}`, JSON.stringify(mcqResult));

    setSelectedRecord(record);
    setActiveTest(null);
    setActiveNav("history");
    setScreenMode("scorecard");

    const label = isAutoSubmit ? "Auto-submitted (Time Expired)" : "Submitted Successfully";
    setStatusText(`Assessment evaluation completed! ${label}.`);
    logActivity("Assessment", `Submitted test with score ${totalScore}% (Cat. ${getCategory(totalScore)})`);
    triggerNotification("success", `Assessment complete! Score: ${totalScore}/100. Grade: Category ${getCategory(totalScore)}`);
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
      logActivity("Safety", `Attached safety evidence: ${files.map(x => x.name).join(', ')}`);
    }
  };

  const removeAttachedFile = (idx) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  /* ─── Form Submission: Track Issue ─── */
  const submitTrackIssue = (e) => {
    e.preventDefault();
    if (!trackLocation.trim() || !trackDesc.trim()) {
      alert("Please fill in location and description details.");
      return;
    }
    const newReport = {
      id: Date.now(),
      type: "Track Defect",
      defect: trackDefect,
      location: `${trackLine} - KM ${trackLocation}`,
      severity: trackSeverity,
      status: "PENDING MASTER ACTION",
      date: new Date().toISOString().slice(0, 10),
      desc: trackDesc,
      attachments: [...attachedFiles]
    };
    setSafetyReports(prev => [newReport, ...prev]);

    logActivity("Safety", `Safety track defect reported: ${trackDefect} at KM ${trackLocation}`);
    triggerNotification("danger", `SAFETY REPORT SUBMITTED: Defect: ${trackDefect} | Loc: KM ${trackLocation}`);

    // Reset
    setTrackLocation("");
    setTrackDesc("");
    setAttachedFiles([]);
    setFileInputKey(Date.now());
    setSafetySubTab("history");
    setStatusText("Safety report logged. Forwarded to Station Master & Traffic Inspector.");
  };

  /* ─── Form Submission: Incident ─── */
  const submitIncidentReport = (e) => {
    e.preventDefault();
    if (!incidentTrain.trim() || !incidentAction.trim()) {
      alert("Please enter Train Number and Actions taken.");
      return;
    }
    const newReport = {
      id: Date.now(),
      type: "Abnormal Incident",
      defect: incidentType,
      location: `Train ${incidentTrain} (${incidentTime || "Current"})`,
      severity: "High - Immediate Action",
      status: "STATION INVESTIGATION ACTIVE",
      date: new Date().toISOString().slice(0, 10),
      desc: incidentAction,
      attachments: [...attachedFiles]
    };
    setSafetyReports(prev => [newReport, ...prev]);

    logActivity("Safety", `Abnormal incident logged: ${incidentType} in Train ${incidentTrain}`);
    triggerNotification("warning", `INCIDENT ALERT: ${incidentType} detected on Train ${incidentTrain}.`);

    // Reset
    setIncidentTrain("");
    setIncidentAction("");
    setIncidentTime("");
    setAttachedFiles([]);
    setFileInputKey(Date.now());
    setSafetySubTab("history");
    setStatusText("Abnormal incident report logged and dispatched to Division Controller.");
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
    <TMDashboard
      fullName={fullName}
      latestScore={latestScore}
      latestCategory={latestCategory}
      averageScore={averageScore}
      history={history}
      trendData={trendData}
      pieData={pieData}
      openScorecard={openScorecard}
      testAssigned={testAssigned}
      mcqTest={tmMcqTest}
      startTestAttempt={startTestAttempt}
      handleReattempt={handleReattempt}
      notifications={notifications}
      unreadNotificationsCount={unreadNotificationsCount}
      bellDropdownOpen={bellDropdownOpen}
      setBellDropdownOpen={setBellDropdownOpen}
      markAllNotificationsRead={markAllNotificationsRead}
      setActiveNav={setActiveNav}
      profileData={profileData || trainManagerProfile}
    />
  );

  const renderProfilePage = () => (
    <UserProfile
      fullName={fullName}
      employeeId={employeeId}
      latestCategory={latestCategory}
      latestScore={latestScore}
      history={history}
      profileData={profileData}
    />
  );

  const renderMyAssessment = () => (
    <MyAssessment
      roleTitle="Train Manager"
      assessedByTitle="Station Master"
      myAssessSelected={myAssessSelected}
      setMyAssessSelected={setMyAssessSelected}
      performanceSummaryText={performanceSummaryText}
      testQuestions={testQuestions}
      testAssigned={testAssigned}
      mcqTest={tmMcqTest}
      startTestAttempt={startTest}
      activeTest={activeTest}
      setActiveTest={setActiveTest}
      currentQuestion={currentQuestion}
      setCurrentQuestion={setCurrentQuestion}
      responses={responses}
      setResponses={setResponses}
      handleSelectOption={handleSelectOption}
      submitTest={submitTest}
      history={history}
      openScorecard={openScorecard}
      handleReattempt={handleReattempt}
      activeQIdx={tmActiveQIdx}
      setActiveQIdx={setTmActiveQIdx}
      testResponses={tmTestResponses}
      setTestResponses={setTmTestResponses}
      handleSubmitTestAttempt={handleSubmitTestAttempt}
      screenMode={screenMode}
      setScreenMode={setScreenMode}
      fullName={fullName}
      employeeId={employeeId}
      profileData={trainManagerProfile}
    />
  );

  const renderSafetyPage = () => (
    <TMSafety
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

  /* ─── Content dispatcher ─── */
  const renderBodyContent = () => {
    if (screenMode === "takeTest") return renderMyAssessment();
    if (activeNav === "dashboard") return renderDashboardPage();
    if (activeNav === "profile") return renderProfilePage();
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
            <p>{t("layout.trainManagerWorkspace") || "Operations Workspace: Train Manager Module"}</p>
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
                {screenMode === "scorecard" ? (t("assessment.detailedScorecard") || "Detailed Evaluation scorecard")
                  : screenMode === "attempt" ? (t("assessment.activeSession") || "Competency Examination Attempt")
                    : (t(`sidebar.${activeNav}`) || navItems.find(i => i.key === activeNav)?.label || "Workspace")}
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
                {t("emergency.warningText") || "WARNING: Triggering this broadcast sends an audio warning signal and locks automatic block operations/movement panels on all active Station Master & Superintendent terminals! Use for genuine safety emergencies only."}
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

export default TrainManagerModule;


