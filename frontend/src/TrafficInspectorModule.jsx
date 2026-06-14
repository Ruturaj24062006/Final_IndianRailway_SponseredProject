import { useMemo, useState, useEffect } from "react";
import {
  Activity, AlertTriangle, ArrowUpDown, Award, BarChart3, Building2,
  CheckCircle2, CheckCircle, ChevronRight, ClipboardCheck,
  FileBarChart2, FileCheck, Filter, LogOut, Search, ShieldCheck,
  TrendingUp, TrendingDown, UserCircle2, Users, XCircle, Eye,
  Calendar, BookOpen, Clock, HeartHandshake, HelpCircle, Download,
  FileSpreadsheet, FileText, Bell, Plus, RefreshCw, Edit, Trash2, Lock, Maximize2,
  ArrowLeft, UserCheck, BusFront, ClipboardList, UserPlus, Send, Train, ExternalLink,
  Gauge, Cpu, Sparkles
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList
} from "recharts";
import { useLanguage } from "./utils/LanguageContext";
import "./sdom.css";
import TIDashboard from "./components/TrafficInspectorModule/TIDashboard";
import UserProfile from "./components/UserProfile";
import CommonRoleView from "./components/CommonRoleView";
import CommonLayout from "./components/CommonLayout";
import TIStations from "./components/TrafficInspectorModule/TIStations";
import TIApprovals from "./components/TrafficInspectorModule/TIApprovals";
import TIAssessments from "./components/TrafficInspectorModule/TIAssessments";
import MyAssessment from './components/MyAssessment';
import TIPmePosition from "./components/TrafficInspectorModule/TIPmePosition";
import TIRefPosition from "./components/TrafficInspectorModule/TIRefPosition";
import TIInspections from "./components/TrafficInspectorModule/TIInspections";
import TICounselling from "./components/TrafficInspectorModule/TICounselling";
import CommonReports from "./components/CommonReports";
import AiCommandCenter from "./components/AiCommandCenter";
import { getTiDashboard, getTiPendingApprovals, getTiAssessmentHistory, getTiPerformanceSummary, getCounsellingRecords, getEmployees, getStations, approveAssessment, rejectAssessment, createCounsellingRecord, getProfile, getMyAssessmentHistory, getMyAuditLogs, getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "./services/tiService";

/* ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ 
   NAV CONFIG
   (Full 12 Sidebar Menu Items)
═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═  */
const NAV = [
  { key: "dashboard",               label: "Dashboard",                    icon: Gauge },
  { key: "pointsmen",               label: "Pointsmen",                    icon: Users },
  { key: "stationMasters",          label: "Station Masters",              icon: Building2 },
  { key: "stationSuperintendents",  label: "Station Superintendents",      icon: UserCheck },
  { key: "trainManagers",           label: "Train Managers",               icon: BusFront },
  { key: "stations",                label: "Stations",                     icon: Building2 },
  { key: "approvals",               label: "Approvals",                    icon: CheckCircle },
  { key: "assessments",             label: "Assessments",                  icon: FileCheck },
  { key: "pmePosition",             label: "PME Position",                 icon: Activity },
  { key: "refPosition",             label: "REF Position",                 icon: Award },
  { key: "inspections",             label: "Inspections",                  icon: Eye },
  { key: "counselling",             label: "Counselling",                  icon: HeartHandshake },
  { key: "myAssessment",            label: "My Assessment",                icon: FileBarChart2 },
  { key: "reports",                 label: "Reports and Analytics",        icon: BarChart3 },
  { key: "profile",                 label: "My Profile",                   icon: UserCircle2 },
];

const TI_PROFILE = {
  designation: "Traffic Inspector (Safety Officer)",
  jurisdiction: "Parbhani-Amla Section",
  hrmsId: "TI_1001",
  dob: "1985-05-14",
  doa: "2017-04-12",
  pmeDueDate: "2029-08-20",
  pmeDoneDate: "2025-08-20",
  isolatorCertDate: "2026-02-18",
  autoTrainingDate: "2026-03-05",
  counsellingDate: "2026-05-12"
};

const stationTiMap = {
  "Parbhani Junction": "TI PAR",
  "Amla Junction": "TI AMLA",
  "Badnera Junction": "TI NGP",
  "Akola Junction": "TI PAR",
  "Nagpur Junction": "TI NGP",
  "Wardha Junction": "TI NGP",
  "Betul Station": "TI AMLA",
  "Itarsi Junction": "TI AMLA",
  "Chandrapur Station": "TI NGP",
  "Gondia Junction": "TI NGP",
  "Dhamangaon Station": "TI NGP",
  "Pulgaon Junction": "TI NGP"
};


/* ═══════════════════════════════════════════
   HELPERS & CATEGORIES
═══════════════════════════════════════════ */
const getCat = s => s >= 80 ? "A" : s >= 50 ? "B" : s >= 26 ? "C" : "D";

const getUserRisk = (u) => {
  return u.pmeStatus === "Overdue" || u.refStatus === "Expired" || u.score < 50 ? "High" : u.score >= 80 ? "Low" : "Medium";
};

const riskBadge = (r) => {
  const map = { Low: "sdom-badge-success", Medium: "sdom-badge-warning", High: "sdom-badge-danger" };
  return <span className={`sdom-badge ${map[r] || "sdom-badge-neutral"}`}>{r}</span>;
};

const catBadge = (c) => {
  const map = { A: "sdom-badge-success", B: "sdom-badge-info", C: "sdom-badge-warning", D: "sdom-badge-danger" };
  return <span className={`sdom-badge ${map[c] || "sdom-badge-neutral"}`}>{c}</span>;
};

const statusBadge = (s) => {
  const map = { 
    Approved: "sdom-badge-success", 
    Completed: "sdom-badge-success", 
    Active: "sdom-badge-success", 
    Pending: "sdom-badge-warning", 
    Submitted: "sdom-badge-warning", 
    Rejected: "sdom-badge-danger", 
    Expired: "sdom-badge-danger", 
    Overdue: "sdom-badge-danger" 
  };
  return <span className={`sdom-badge ${map[s] || "sdom-badge-neutral"}`}>{s}</span>;
};

const CAT_C  = { A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#dc2626" };
const CAT_B  = { A: "#dcfce7", B: "#dbeafe", C: "#fef3c7", D: "#fee2e2" };
const PIE_C  = ["#16a34a", "#2563eb", "#d97706", "#dc2626"];
const RISK_C = { High: "#dc2626", Medium: "#d97706", Low: "#16a34a" };
const RISK_B = { High: "#fee2e2", Medium: "#fef3c7", Low: "#dcfce7" };

const ROLE_MAP = {
  pointsmen: "Pointsman",
  Pointsman: "Pointsman",
  sm: "Station Master",
  "Station Master": "Station Master",
  ss: "Station Superintendent",
  "Station Superintendent": "Station Superintendent",
  tm: "Train Manager",
  "Train Manager": "Train Manager",
  ti: "Traffic Inspector",
  "Traffic Inspector": "Traffic Inspector"
};

const MONTHLY_TREND = [
  { month: "Dec'25", score: 81, safety: 80 },
  { month: "Jan'26", score: 83, safety: 82 },
  { month: "Feb'26", score: 85, safety: 85 },
  { month: "Mar'26", score: 87, safety: 88 },
  { month: "Apr'26", score: 89, safety: 91 },
  { month: "May'26", score: 91, safety: 94 }
];

const INIT_STATIONS = [];
const INIT_USERS = [];
const DEFAULT_SS_TM_USERS = [];
const MONTHLY = [];
const INIT_PM_ASSESSMENTS = [];
const INIT_SM_LIST = [];
const INIT_TM_LIST = [];
const INIT_SS_LIST = [];
const INIT_INSPECTIONS = [];
const INIT_COUNSELLING = [];
const INIT_TI_ASSESS_HISTORY = [];

const TI_SM_CRITERIA = [
  { key: "stationMgmt",  label: "Station Management",          weight: 5, count: 5,
    criteria: ["Efficient train handling", "Accurate scheduling", "Staff deployment", "Complaint resolution", "Log maintenance"] },
  { key: "safety",       label: "Safety & Compliance",         weight: 4, count: 5,
    criteria: ["Safety protocols followed", "Incident reporting timely", "Emergency drill conducted", "Hazard identification", "PPE enforced"] },
  { key: "staffSupervision", label: "Staff Supervision",       weight: 3, count: 5,
    criteria: ["Regular briefings conducted", "Feedback provided to staff", "Leave management", "Timekeeping enforced", "Staff morale maintained"] },
  { key: "documentation", label: "Documentation & Reporting",   weight: 3, count: 5,
    criteria: ["Daily log accurate", "Monthly report submitted", "Incident records maintained", "Assessment documents filed", "Handover notes complete"] },
  { key: "emergency",    label: "Emergency Handling",          weight: 5, count: 5,
    criteria: ["Responded to emergencies promptly", "Coordinated with control office", "Passenger management during disruption", "Track clear protocol followed", "Post-incident review done"] },
];

const defaultSMForm = () => ({
  stationMgmt:      Array(5).fill(null),
  safety:           Array(5).fill(null),
  staffSupervision: Array(5).fill(null),
  documentation:    Array(5).fill(null),
  emergency:        Array(5).fill(null),
  knowledgeMarks: "", alcoholicStatus: "", pmeStatus: "Fit",
  refStatus: "Cleared", counselling: "Not Required",
  automaticTraining: "Not Required", remarks: ""
});

const computeSMScore = form => {
  let total = 0;
  TI_SM_CRITERIA.forEach(c => {
    form[c.key].forEach(v => { if (v === "Yes") total += c.weight; });
  });
  const km = Math.min(parseInt(form.knowledgeMarks) || 0, 25);
  return { ynScore: Math.min(total, 75), knowledge: km, total: Math.min(total, 75) + km };
};

const TI_TM_CRITERIA = [
  { key: "trainSafety",  label: "Train Safety & Brake Inspection",   weight: 5, count: 5,
    criteria: ["Brake power certificate verification", "BP/FP pressure gauge monitoring", "Tail lamp/board correctness", "Loose coupling check", "Vigilance control check"] },
  { key: "signaling",    label: "Signaling & Whistle Compliance",    weight: 4, count: 5,
    criteria: ["Hand signal exchange with SM", "Whistling at gate/whistle boards", "Fog signal detonator drill", "Acknowledge route aspects", "Correct flags/lamps display"] },
  { key: "shunting",     label: "Shunting & Coupling Ops",           weight: 3, count: 5,
    criteria: ["Coordinating shunting movement", "Screw/CBC coupling secured", "Hand brake application on sidings", "Point locking verification", "Clearance distance estimation"] },
  { key: "documentation", label: "Train Log & Guard Certificates",  weight: 3, count: 5,
    criteria: ["Train journal logs accurate", "Caution orders noted", "Guard's certificate issued properly", "Rough journal handovers complete", "Incident report log filled"] },
  { key: "emergency",    label: "Emergency Train Protection",        weight: 5, count: 5,
    criteria: ["Flashing amber tail light active", "Detonator protection at 600m/1200m", "Informing control/SM of disruption", "First-aid response coordination", "Track clearance verification"] },
];

const defaultTMForm = () => ({
  trainSafety:      Array(5).fill(null),
  signaling:        Array(5).fill(null),
  shunting:         Array(5).fill(null),
  documentation:    Array(5).fill(null),
  emergency:        Array(5).fill(null),
  knowledgeMarks: "", alcoholicStatus: "", pmeStatus: "Fit",
  refStatus: "Cleared", counselling: "Not Required",
  automaticTraining: "Not Required", remarks: ""
});

const computeTMScore = form => {
  let total = 0;
  TI_TM_CRITERIA.forEach(c => {
    form[c.key]?.forEach(v => { if (v === "Yes") total += c.weight; });
  });
  const km = Math.min(parseInt(form.knowledgeMarks) || 0, 25);
  return { ynScore: Math.min(total, 75), knowledge: km, total: Math.min(total, 75) + km };
};

const TI_SS_CRITERIA = [
  { key: "stationOps",    label: "Station Operations & Supervision",   weight: 5, count: 5,
    criteria: ["Train reception/dispatch procedures", "Station yard supervision during peak hours", "Platform safety compliance", "Crowd management protocols", "Block instrument operation"] },
  { key: "staffMgmt",    label: "Staff Management & Discipline",       weight: 4, count: 5,
    criteria: ["Duty roster maintenance", "Punctuality and attendance tracking", "Leave management compliance", "Uniform & conduct enforcement", "Safety briefing conduct"] },
  { key: "records",      label: "Records & Documentation",             weight: 3, count: 5,
    criteria: ["Station log book accuracy", "Accident/incident reporting", "Block register maintenance", "Cash and freight register audit", "Train delay reporting"] },
  { key: "safety",       label: "Safety Compliance & Emergency",       weight: 5, count: 5,
    criteria: ["Emergency evacuation drill conduct", "Fire equipment serviceability check", "Signal failure response protocol", "Fog signal deployment knowledge", "Coordination with control office"] },
  { key: "infra",        label: "Infrastructure & Asset Maintenance",  weight: 3, count: 5,
    criteria: ["Platform surface and lighting check", "Footover bridge safety assessment", "Washroom hygiene maintenance", "Waiting room orderliness", "Coach indication board accuracy"] },
];

const defaultSSForm = () => ({
  stationOps:   Array(5).fill(null),
  staffMgmt:    Array(5).fill(null),
  records:      Array(5).fill(null),
  safety:       Array(5).fill(null),
  infra:        Array(5).fill(null),
  knowledgeMarks: "", alcoholicStatus: "", pmeStatus: "Fit",
  refStatus: "Cleared", counselling: "Not Required",
  automaticTraining: "Not Required", remarks: ""
});

const computeSSScore = form => {
  let total = 0;
  TI_SS_CRITERIA.forEach(c => {
    form[c.key]?.forEach(v => { if (v === "Yes") total += c.weight; });
  });
  const km = Math.min(parseInt(form.knowledgeMarks) || 0, 25);
  return { ynScore: Math.min(total, 75), knowledge: km, total: Math.min(total, 75) + km };
};

// Interactive quiz questions for self-assessments
const TI_QUIZ = [
  { q: "What whistle code must be sounded when a train is passing through a station without stopping?", opts: ["One long", "Continuous short blasts", "One long and one short", "Two short blasts"], ans: 0, explanation: "One long whistle is sounded to alert station staff, pointsmen, and level crossing gatemen of a train passing through without stopping." },
  { q: "During track circuit failures, what token is issued to authorize train movements into block sections?", opts: ["T/369(3b)", "T/806 (Shunting Order)", "Caution Order (T/B)", "Line Clear Ticket"], ans: 0, explanation: "T/369(3b) is the written authority issued to pass a defective reception stop signal at danger, containing speed restrictions for track anomalies." },
  { q: "Fouling mark lines indicate:", opts: ["Defective rail marker", "Safe distance clearance boundary limit", "Points switching end point", "Speed restrictions end"], ans: 1, explanation: "A fouling mark is placed at the convergence of two tracks, indicating the boundary within which vehicles must remain to avoid collision with traffic on the adjacent line." },
  { q: "Periodic Refresher Courses (REF) for Pointsman Grade I must be completed every:", opts: ["1 Year", "2 Years", "3 Years", "5 Years"], ans: 2, explanation: "Safety refresher training for pointsmen is mandated once every 3 years to ensure operational rule compliance and hands-on skill currency." },
  { q: "A Signal showing double yellow lights warns the driver to:", opts: ["Stop immediately", "Prepare to stop at the next signal", "Proceed at full authorized speed", "Sound whistle continuously"], ans: 1, explanation: "A double yellow aspect is an attention signal, warning the driver that they are approaching a signal showing a restrictive aspect (single yellow or red)." },
  { q: "How often must a Traffic Inspector audit the Station log registers?", opts: ["Weekly", "Monthly", "Quarterly", "Bi-annually"], ans: 1, explanation: "As per the Safety Audit Manual, a Traffic Inspector must perform a thorough physical audit of station logs, books, and registers at least once a month." },
  { q: "During a total failure of communications on double lines, which authority form is issued?", opts: ["T/A 602", "T/B 602", "T/C 602", "T/D 602"], ans: 1, explanation: "Form T/B 602 is the official authority issued to run trains during total failure of communication on a double line section." },
  { q: "What whistle code indicates 'Train Parting'?", opts: ["One long, one short", "Two long, two short", "One long, one short, one long, one short", "Continuous short blasts"], ans: 2, explanation: "One long, one short, one long, one short whistle code is sounded repeatedly to warn the station staff and loco crew of mid-section train parting." },
  { q: "A signal with double yellow aspect warns the driver to:", opts: ["Proceed at full speed", "Prepare to stop at the next signal", "Proceed with 15km/h", "Stop immediately"], ans: 1, explanation: "Prepare to stop at the next signal is indicated by a double yellow attention aspect on the distant signal." },
  { q: "Under normal conditions, a gate signal shows what aspect when the level crossing gate is open to road traffic?", opts: ["Red", "Yellow", "Green", "Double Yellow"], ans: 0, explanation: "A gate signal will show Red (Danger) if the interlocked level crossing gate is open to road traffic, protecting the block section from vehicles." },
  { q: "Refresher training for Pointsman Grade I must be completed every:", opts: ["1 Year", "2 Years", "3 Years", "5 Years"], ans: 2, explanation: "Standard operations manuals require Pointsmen Grade I to undergo refresher safety courses every 3 years." },
  { q: "Periodic medical examinations (PME) for Station Masters must be completed every four years until age:", opts: ["45", "50", "55", "60"], ans: 2, explanation: "Safety-category personnel including Station Masters must undergo a periodic medical examination (PME) every 4 years up to age 55, then every 2 years." },
  { q: "Isolation of a running line from sidings is designed to prevent:", opts: ["Over-speeding", "Collisions due to rolling stock escape", "Signal failures", "Interlocking failures"], ans: 1, explanation: "Siding isolation prevents rolling stock or stalled vehicles from accidentally escaping, rolling out, and fouling the active running lines." },
  { q: "What whistle code is sounded when entering a tunnel?", opts: ["One long blast", "Continuous short blasts", "Two short blasts", "Continuous long whistle"], ans: 3, explanation: "Loco pilots must sound a continuous long whistle when entering and passing through a tunnel to warn any track patrolmen or engineering staff." },
  { q: "Fuses or detonators are used to protect track defects at a distance of:", opts: ["600m and 1200m", "500m and 1000m", "800m and 2000m", "1200m and 2000m"], ans: 0, explanation: "In case of track obstruction, 3 detonators are placed: 1st at 600m, 2nd at 1200m, and the 3rd at 1210m to warn oncoming train crews." },
  { q: "What class of station has points and signals interlocked, enabling line clear exchange?", opts: ["Class A", "Class B", "Class C", "Non-interlocked"], ans: 1, explanation: "Class B stations are standard interlocked block stations equipped with home and starter signals, authorizing Line Clear exchange." },
  { q: "The standard shunting authority form is:", opts: ["T/369(3b)", "T/806", "T/A 901", "T/511"], ans: 1, explanation: "Form T/806 is the official shunting order, listing all authorized shunt movements, point locks, and speed restrictions." },
  { q: "If a Station Master detects a hot axle on a passing train, they must first:", opts: ["Call the division control office", "Display danger hand signal and stop the train", "Inform the next station", "Log the event"], ans: 1, explanation: "Safety protocols dictate that the Station Master must immediately exhibit a danger hand signal to stop the train and prevent axle failure or derailment." },
  { q: "The maximum speed under 'Caution Order' when no speed limit is specified is:", opts: ["15 km/h", "30 km/h", "45 km/h", "20 km/h"], ans: 0, explanation: "If no specific speed limit is written on a Caution Order, the standard maximum speed is restricted to 15 km/h for track inspection beats." },
  { q: "Which class of station serves strictly as a block hut without point switches?", opts: ["Class A", "Class B", "Class C", "Class D"], ans: 2, explanation: "Class C block stations (or block huts) do not have point switches or loop lines, serving strictly as intermediate block boundaries." },
  { q: "Who is responsible for point locking during shunting operations?", opts: ["Pointsman", "Station Master", "Cabin Master", "Train Manager"], ans: 1, explanation: "The Station Master on duty is ultimately responsible for ensuring that facing points are locked and clamped during shunting operations." },
  { q: "A flashing red aspect on a signal indicates:", opts: ["Track circuit defect", "Proceed with caution", "Stop and proceed after 1 min", "Gate signal alert"], ans: 2, explanation: "A flashing red light or 'Danger' aspect indicates that the driver must stop the train and can proceed after waiting 1 minute by day/2 minutes by night." },
  { q: "A trap point isolation is used to protect:", opts: ["Passenger platform lines", "Running lines from siding vehicles", "Level crossings", "Relay room locking"], ans: 1, explanation: "Trap points derail an escaping vehicle or siding vehicle to prevent it from fouling or colliding with trains running on the main line." },
  { q: "Refresher training for Traffic Inspectors must be completed every:", opts: ["3 Years", "5 Years", "2 Years", "None"], ans: 0, explanation: "Periodic training courses for Traffic Inspectors are conducted once every 3 years to maintain proficiency in safety, engineering, and operating rules." },
  { q: "During block instrument failure, line clear is authorized using:", opts: ["Token", "Paper Line Clear Ticket", "Cabin ticket", "Hand signal"], ans: 1, explanation: "A Paper Line Clear Ticket (PLCT) is the written authority issued to proceed when block instruments fail, ensuring absolute block safety." }
];

function generateTiMockResponses(score) {
  const correctCount = Math.round((score / 100) * 25);
  const arr = Array(25).fill(null);
  const indices = Array.from({ length: 25 }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const correctIndices = new Set(indices.slice(0, correctCount));
  for (let i = 0; i < 25; i++) {
    const q = TI_QUIZ[i];
    if (correctIndices.has(i)) {
      arr[i] = q.ans;
    } else {
      arr[i] = (q.ans + 1) % q.opts.length;
    }
  }
  return arr;
}

const getPerformanceSummaryText = (score, sections) => {
  if (!sections || sections.length === 0) return "Self-compliance check completed successfully.";
  const lowestSec = [...sections].sort((a, b) => a.marks - b.marks)[0];
  const highestSec = [...sections].sort((a, b) => b.marks - a.marks)[0];

  let summary = `Assessment score achieved: ${score}/100 (${score >= 80 ? 'Outstanding Competency' : score >= 50 ? 'Satisfactory Operations' : 'Requires Training'}). `;
  summary += `Demonstrated excellent compliance in "${highestSec.title}" scoring ${highestSec.marks}/${highestSec.outOf} marks. `;
  if (lowestSec.marks < lowestSec.outOf) {
    summary += `However, some area of improvement is observed in "${lowestSec.title}" (${lowestSec.marks}/${lowestSec.outOf}). It is recommended to review the standard operating manuals and safety bulletins for this section.`;
  } else {
    summary += `Achieved perfect scores across all compliance parameters.`;
  }
  return summary;
};

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



/* ═══════════════════════════════════════════
   CUSTOM TOOLTIP
═══════════════════════════════════════════ */
const TiTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="ti2-tooltip">
      <strong>{label}</strong>
      {payload.map(p => <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>)}
    </div>
  );
};

/* ═══════════════════════════════════════════
   MAIN MODULE COMPONENT
═══════════════════════════════════════════ */

const generateGraphCompleteData = (baseUsers, baseStations) => {
  const stationsList = baseStations || INIT_STATIONS;
  const usersList = [...(baseUsers || INIT_USERS)];
  
  const hasSS = usersList.some(u => u.role === "Station Superintendent");
  if (!hasSS) {
    usersList.push(...DEFAULT_SS_TM_USERS);
  }

  const names = [
    "Rahul Sharma", "Amit Patel", "Vikram Singh", "Sanjay Dutt", "Vijay Kumar",
    "Rohan Gupta", "Deepak Rao", "Karan Johar", "Abhishek Shah", "Manish Pandey",
    "Suresh Raina", "Girish Karnad", "Pranav Mukherji", "Shantanu Sen", "Animesh Roy"
  ];

  const designations = {
    "Pointsman": "Pointsman Grade I",
    "Station Master": "Station Master",
    "Station Superintendent": "Station Superintendent",
    "Train Manager": "Train Manager"
  };

  const categories = ["A", "B", "C"];
  let userCounter = 2000;

  stationsList.forEach((st, sidx) => {
    const roles = ["Pointsman", "Station Master", "Station Superintendent", "Train Manager"];
    roles.forEach(role => {
      const exists = usersList.some(u => u.station === st.name && u.role === role);
      if (!exists) {
        const id = (role === "Pointsman" ? "PM_" : role === "Station Master" ? "SM_" : role === "Station Superintendent" ? "SS_" : "TM_") + userCounter++;
        const nameIdx = (sidx + role.length) % names.length;
        const name = names[nameIdx] + " (" + st.code + ")";
        const cat = categories[userCounter % categories.length];
        
        usersList.push({
          id,
          name,
          role,
          designation: designations[role],
          station: st.name,
          cat,
          lastAssessDate: `2026-03-${10 + (userCounter % 15)}`,
          score: 65 + (userCounter % 30),
          pmeStatus: "Fit",
          refStatus: "Cleared",
          contact: `+91 98765 ${userCounter}`,
          joiningDate: `2018-05-${12 + (userCounter % 15)}`
        });
      }
    });
  });

  return usersList;
};

const generateAssessmentsForGraphs = (usersList, stationsList) => {
  const pmAssess = [];
  const smAssess = [];
  const ssAssess = [];
  const tmAssess = [];

  stationsList.forEach((st, sidx) => {
    // 1. Pointsman Assessments (1 Approved, 1 Pending for each station)
    const stPMs = usersList.filter(u => u.station === st.name && u.role === "Pointsman");
    stPMs.forEach((pm, pidx) => {
      const isApproved = pidx % 2 === 0;
      pmAssess.push({
        id: `PA_${pm.id}`,
        pointsmanName: pm.name,
        hrmsId: pm.id,
        station: st.name,
        assessingSM: `SM at ${st.code}`,
        submissionDate: `2026-04-${10 + pidx}`,
        status: isApproved ? "Approved" : "Pending",
        originalSections: [
          { title: "Knowledge of Rules",      score: 18 + (pidx % 6), max: 25 },
          { title: "Alertness & Observation", score: 18 + (pidx % 6), max: 25 },
          { title: "Safety Record",           score: 10 + (pidx % 4), max: 15 },
          { title: "Leadership & Management", score: 10 + (pidx % 4), max: 15 },
          { title: "Discipline",              score: 7 + (pidx % 3),  max: 10 },
          { title: "Appearance & Neatness",   score: 7 + (pidx % 3),  max: 10 },
        ],
        finalSections: isApproved ? [
          { title: "Knowledge of Rules",      score: 18 + (pidx % 6), max: 25 },
          { title: "Alertness & Observation", score: 18 + (pidx % 6), max: 25 },
          { title: "Safety Record",           score: 10 + (pidx % 4), max: 15 },
          { title: "Leadership & Management", score: 10 + (pidx % 4), max: 15 },
          { title: "Discipline",              score: 7 + (pidx % 3),  max: 10 },
          { title: "Appearance & Neatness",   score: 7 + (pidx % 3),  max: 10 },
        ] : undefined,
        meta: { pmeStatus: "Fit", refStatus: "Cleared", alcoholicStatus: "Non-Alcoholic" },
        tiRemarks: isApproved ? "Field assessment approved successfully." : "",
        tiModified: false,
        approvalDate: isApproved ? "2026-04-12" : undefined,
        auditTrail: isApproved ? [{ action: "Approved without modification", by: "TI R. Khan", date: "2026-04-12" }] : []
      });
    });

    // 2. SM Assessment (1 Pending or Submitted per station)
    const stSMs = usersList.filter(u => u.station === st.name && u.role === "Station Master");
    stSMs.forEach((sm, smidx) => {
      const status = smidx % 2 === 0 ? "Pending" : "Submitted";
      smAssess.push({
        id: `SMA_${sm.id}`,
        name: sm.name,
        hrmsId: sm.id,
        station: st.name,
        lastDate: `2026-03-${15 + smidx}`,
        status
      });
    });

    // 3. SS Assessment (1 Pending or Submitted per station)
    const stSSs = usersList.filter(u => u.station === st.name && u.role === "Station Superintendent");
    stSSs.forEach((ss, ssidx) => {
      const status = ssidx % 2 === 0 ? "Pending" : "Submitted";
      ssAssess.push({
        id: `SSA_${ss.id}`,
        name: ss.name,
        hrmsId: ss.id,
        station: st.name,
        lastDate: `2026-04-${5 + ssidx}`,
        status
      });
    });

    // 4. TM Assessment (1 Pending or Submitted per station)
    const stTMs = usersList.filter(u => u.station === st.name && u.role === "Train Manager");
    stTMs.forEach((tm, tmidx) => {
      const status = tmidx % 2 === 0 ? "Pending" : "Submitted";
      tmAssess.push({
        id: `TMA_${tm.id}`,
        name: tm.name,
        hrmsId: tm.id,
        station: st.name,
        lastDate: `2026-03-${20 + tmidx}`,
        status
      });
    });
  });

  return { pmAssess, smAssess, ssAssess, tmAssess };
};

const POPULATED_USERS = generateGraphCompleteData(INIT_USERS, INIT_STATIONS);
const { pmAssess: POPULATED_PM, smAssess: POPULATED_SM, ssAssess: POPULATED_SS, tmAssess: POPULATED_TM } = generateAssessmentsForGraphs(POPULATED_USERS, INIT_STATIONS);

export default function TrafficInspectorModule({ user, onLogout }) {
  const { locale, changeLanguage, t } = useLanguage();
  const [activePage, setActivePage]       = useState("dashboard");
  const [dataLoaded, setDataLoaded]       = useState(false);


  const [statusMsg, setStatusMsg]         = useState("");
  const [view, setView]                   = useState(null);

  // Chart Zoom Modal States
  const [isChartZoomModalOpen, setIsChartZoomModalOpen] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState("progress"); // "progress" | "score" | "category"
  const [zoomPopupPage, setZoomPopupPage] = useState(1);
  const [zoomPopupSearch, setZoomPopupSearch] = useState("");
  const [zoomPopupZone, setZoomPopupZone] = useState("All");
  const [zoomPopupDivision, setZoomPopupDivision] = useState("All");
  const [zoomPopupStationName, setZoomPopupStationName] = useState("All");
  const [zoomPopupStationCode, setZoomPopupStationCode] = useState("All");
  const [zoomPopupCategory, setZoomPopupCategory] = useState("All");
  const [zoomPopupRisk, setZoomPopupRisk] = useState("All");
  const [zoomPopupStatus, setZoomPopupStatus] = useState("All");
  const [zoomPopupStartDate, setZoomPopupStartDate] = useState("");
  const [zoomPopupEndDate, setZoomPopupEndDate] = useState("");

  // Fullscreen Analytics States
  const [fullscreenChart, setFullscreenChart] = useState(null); // 'station' | 'trend' | 'grade' | null
  const [fsSearch, setFsSearch] = useState("");
  const [fsCatFilter, setFsCatFilter] = useState("All");
  const [fsRiskFilter, setFsRiskFilter] = useState("All");

  // Notifications Bell
  const [bellDropdownOpen, setBellDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // System Audit Logs
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, timestamp: "2026-05-27 10:00:12", event: "User session initialized.", details: "IP: 10.24.12.8" },
    { id: 2, timestamp: "2026-05-27 10:02:44", event: "Dashboard KPI matrices synced successfully.", details: "Calculations based on 12 stations" }
  ]);

  // Master Users & Stations States
  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);

  const [showAddStationModal, setShowAddStationModal] = useState(false);
  const [newStationData, setNewStationData] = useState({ name: "", code: "", division: "", zone: "", category: "B", smCount: "", pmCount: "" });

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    id: "",
    name: "",
    role: "Station Master",
    designation: "Station Master",
    station: "",
    contact: "",
    joiningDate: "",
    pmeStatus: "Fit",
    refStatus: "Cleared"
  });

  const [pmList, setPmList]               = useState([]);
  const [smList, setSmList]               = useState([]);
  const [tmList, setTmList]               = useState([]);

  // ── Real-time data loading from backend API ──
  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        // Fetch all employees (all roles)
        const [empData, stationsData, perfData, pendingData, historyData, myHistoryData, counsellingData] = await Promise.allSettled([
          getEmployees(),
          getStations(),
          getTiPerformanceSummary(),
          getTiPendingApprovals(),
          getTiAssessmentHistory(),
          getMyAssessmentHistory(),
          getCounsellingRecords()
        ]);

        if (cancelled) return;

        // Transform employees into the UI format
        if (empData.status === "fulfilled" && empData.value?.length > 0) {
          const transformed = empData.value.map(e => {
            const roleMap = { 1: "Pointsman", 2: "Station Master", 3: "Station Superintendent", 4: "Train Manager", 5: "Traffic Inspector" };
            const role = roleMap[e.role_id] || e.designation || e.role_name || "Pointsman";
            const score = parseFloat(e.score) || 0;
            return {
              id: e.hrms_id || e.employee_id || `EMP_${e.id}`,
              name: e.full_name || "Unknown",
              role,
              designation: e.designation || role,
              station: e.station_name || "Unassigned",
              cat: e.category_grade || getCat(score),
              lastAssessDate: e.last_assessment_date || "—",
              score,
              pmeStatus: e.pme_status || "Fit",
              refStatus: e.refStatus || "Cleared",
              contact: e.mobile || "—",
              joiningDate: e.date_of_joining ? new Date(e.date_of_joining).toISOString().slice(0, 10) : "—",
              dbId: e.id,
              stationId: e.station_id
            };
          });
          setUsers(transformed);
        } else {
          // Fallback to empty if API returns empty
          setUsers([]);
        }

        // Transform stations into the UI format
        if (stationsData.status === "fulfilled" && stationsData.value?.length > 0) {
          const stTransformed = stationsData.value.map(s => ({
            id: `ST_${s.id}`,
            name: s.station_name,
            code: s.station_code,
            division: s.division || "Nagpur Division",
            zone: s.zone || "Central Railway",
            avgScore: parseFloat(s.avg_score) || 75,
            safetyPct: Math.max(50, 100 - (parseInt(s.high_risk_count) || 0) * 12),
            highRisk: parseInt(s.high_risk_count) || 0,
            pointsmenCount: parseInt(s.pm_count) || 0,
            smCount: parseInt(s.sm_count) || 0,
            pendingCount: parseInt(s.pending_count) || 0
          }));
          setStations(stTransformed);
        } else {
          setStations(INIT_STATIONS);
        }

        // Transform pending approvals & history into PM assessment list format
        let combinedPmList = [];
        if (pendingData.status === "fulfilled" && pendingData.value?.length > 0) {
          combinedPmList.push(...pendingData.value.map(a => ({
            id: `PA_${a.assessment_id}`,
            pointsmanName: a.employee_name,
            hrmsId: a.employee_hrms_id,
            station: a.station_name || "—",
            assessingSM: a.assessor_name || "—",
            submissionDate: a.assessment_date || "—",
            status: a.assessment_status || "Pending",
            originalSections: [
              { title: "Knowledge of Rules", score: Math.round((a.practical_score || 0) * 0.25), max: 25 },
              { title: "Alertness & Observation", score: Math.round((a.practical_score || 0) * 0.25), max: 25 },
              { title: "Safety Record", score: Math.round((a.practical_score || 0) * 0.15), max: 15 },
              { title: "Leadership & Management", score: Math.round((a.practical_score || 0) * 0.15), max: 15 },
              { title: "Discipline", score: Math.round((a.practical_score || 0) * 0.10), max: 10 },
              { title: "Appearance & Neatness", score: Math.round((a.practical_score || 0) * 0.10), max: 10 },
            ],
            meta: { pmeStatus: "Fit", refStatus: "Cleared", alcoholicStatus: "Non-Alcoholic" },
            tiRemarks: a.assessor_remarks || "",
            tiModified: false,
            auditTrail: [],
            dbAssessmentId: a.assessment_id,
            dbApprovalId: a.approval_id
          })));
        }

        if (historyData.status === "fulfilled" && historyData.value?.length > 0) {
          combinedPmList.push(...historyData.value.map(h => ({
            id: `PA_${h.assessment_id}`,
            pointsmanName: h.employee_name,
            hrmsId: h.employee_hrms_id,
            station: h.station_name || "—",
            assessingSM: h.assessor_name || "—",
            submissionDate: h.assessment_date || "—",
            status: h.status || "Approved",
            originalSections: [
              { title: "Knowledge of Rules", score: Math.round((h.practical_score || 0) * 0.25), max: 25 },
              { title: "Alertness & Observation", score: Math.round((h.practical_score || 0) * 0.25), max: 25 },
              { title: "Safety Record", score: Math.round((h.practical_score || 0) * 0.15), max: 15 },
              { title: "Leadership & Management", score: Math.round((h.practical_score || 0) * 0.15), max: 15 },
              { title: "Discipline", score: Math.round((h.practical_score || 0) * 0.10), max: 10 },
              { title: "Appearance & Neatness", score: Math.round((h.practical_score || 0) * 0.10), max: 10 },
            ],
            meta: { pmeStatus: h.fitness_status || "Fit", refStatus: "Cleared", alcoholicStatus: "Non-Alcoholic" },
            tiRemarks: h.approver_remarks || "",
            tiModified: false,
            auditTrail: [],
            dbAssessmentId: h.assessment_id,
            dbApprovalId: h.approval_id
          })));
        }
        setPmList(combinedPmList);

        // Transform performance summary into SM/TM/SS assessment lists
        if (perfData.status === "fulfilled" && perfData.value?.length > 0) {
          const smRows = perfData.value.filter(r => { const d = (r.designation || "").toLowerCase(); return d === "station master" || d.includes("station master"); });
          const tmRows = perfData.value.filter(r => { const d = (r.designation || "").toLowerCase(); return d === "train manager" || d.includes("train manager"); });
          const ssRows = perfData.value.filter(r => { const d = (r.designation || "").toLowerCase(); return d.includes("superintendent"); });

          if (smRows.length > 0) {
            setSmList(smRows.map(r => ({
              id: `SMA_${r.employee_id}`,
              name: r.full_name,
              hrmsId: r.hrms_id,
              station: r.station_name || "—",
              lastDate: r.pme_date || "—",
              status: (r.assessment_status === "Submitted" || r.assessment_status === "Approved" || r.assessment_status === "Completed")
                ? r.assessment_status
                : (localStorage.getItem(`sm_test_activated_${r.hrms_id}`) === "true" ? "Exam Sent" : "Pending")
            })));
          } else {
            setSmList([]);
          }

          if (tmRows.length > 0) {
            setTmList(tmRows.map(r => ({
              id: `TMA_${r.employee_id}`,
              name: r.full_name,
              hrmsId: r.hrms_id,
              station: r.station_name || "—",
              lastDate: r.pme_date || "—",
              status: (r.assessment_status === "Submitted" || r.assessment_status === "Approved" || r.assessment_status === "Completed")
                ? r.assessment_status
                : (localStorage.getItem(`tm_test_activated_${r.hrms_id}`) === "true" ? "Exam Sent" : "Pending")
            })));
          } else {
            setTmList([]);
          }

          if (ssRows.length > 0) {
            setSsList(ssRows.map(r => ({
              id: `SSA_${r.employee_id}`,
              name: r.full_name,
              hrmsId: r.hrms_id,
              station: r.station_name || "—",
              lastDate: r.pme_date || "—",
              status: (r.assessment_status === "Submitted" || r.assessment_status === "Approved" || r.assessment_status === "Completed")
                ? r.assessment_status
                : (localStorage.getItem(`ss_test_activated_${r.hrms_id}`) === "true" ? "Exam Sent" : "Pending")
            })));
          } else {
            setSsList([]);
          }
        } else {
          setSmList([]);
          setTmList([]);
          setSsList([]);
        }

        // Transform counselling data
        if (counsellingData.status === "fulfilled" && counsellingData.value?.length > 0) {
          const counTransformed = counsellingData.value.map(c => ({
            id: `CL_${c.id}`,
            date: (c.counselling_date || c.session_date) ? new Date(c.counselling_date || c.session_date).toISOString().slice(0, 10) : "—",
            staffName: c.employee_name || c.staff_name || "—",
            designation: c.employee_designation || c.designation || "—",
            station: c.station_name || "—",
            topics: c.remarks || c.reason || c.topics_covered || c.notes || "—",
            duration: c.duration || "30 mins",
            progress: c.status || c.outcome || "Completed"
          }));
          setCounsellings(counTransformed);
        }

        // Transform TI's own assessment history (for My Assessment / Profile)
        if (myHistoryData.status === "fulfilled" && myHistoryData.value?.length > 0) {
          const myHistTransformed = myHistoryData.value.map(h => {
            const score = parseFloat(h.totalScore) || 0;
            return {
              id: h.assessment_id || h.result_id,
              date: h.date,
              period: h.assessmentPeriod || h.date,
              assessedBy: h.assessedBy || "—",
              totalScore: score,
              category: h.category || getCat(score),
              approvalStatus: h.approval_status || "Approved",
              cbtScore: h.cbt_score,
              practicalScore: h.practical_score,
              aomRemarks: h.remarks || "",
              userAnswers: generateTiMockResponses(score),
              sections: [
                { title: "Whistle Codes & Hand Signals", marks: Math.round(score * 0.20), outOf: 20 },
                { title: "Token & Line Clear Authorities", marks: Math.round(score * 0.20), outOf: 20 },
                { title: "Station Interlocking & Track Circuits", marks: Math.round(score * 0.20), outOf: 20 },
                { title: "Shunting Operations & Point Locking", marks: Math.round(score * 0.20), outOf: 20 },
                { title: "Gate Signals & Siding Isolation", marks: Math.round(score * 0.20), outOf: 20 }
              ]
            };
          });
          setTiAssessments(myHistTransformed);
        } else {
          setTiAssessments([]);
        }

        setDataLoaded(true);
      } catch (err) {
        console.error("Failed to load TI real-time data:", err);
        setUsers([]);
        setStations([]);
        setPmList([]);
        setSmList([]);
        setTmList([]);
        setSsList([]);
        setDataLoaded(true);
      }
    };
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const [inspections, setInspections]     = useState(INIT_INSPECTIONS);
  const [counsellings, setCounsellings]   = useState([]);
  
  // Interactive Self-Assessment State
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [tiAssessments, setTiAssessments] = useState([]);

  const [quizState, setQuizState]         = useState("idle"); // "idle" | "quiz" | "result"
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizAnswers, setQuizAnswers]     = useState(Array(25).fill(null));
  const [latestQuizScore, setLatestQuizScore] = useState(null);

  // AOM Assigned Exam State
  const [isExamAssigned, setIsExamAssigned] = useState(() => localStorage.getItem(`ti_exam_assigned_${user?.hrmsId || "TI_1001"}`) === "true");

  // Search, Filters & Expanded Blocks
  const [selectedReportUserId, setSelectedReportUserId] = useState(null);
  const [selectedSM, setSelectedSM]       = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [stSearch, setStSearch]           = useState("");
  const [stCatFilter, setStCatFilter]     = useState("All");
  
  // All Users Page Controls
  const [userSearch, setUserSearch]       = useState("");
  const [userStationFilter, setUserStationFilter] = useState("All");
  const [userDesignationFilter, setUserDesignationFilter] = useState("All");
  const [userCategoryFilter, setUserCategoryFilter] = useState("All");
  const [userRiskFilter, setUserRiskFilter] = useState("All");
  const [roleF, setRoleF] = useState({ name: "", station: "All", ti: "All", cat: "All", risk: "All" });
  
  // Edit User Modal State
  const [editingUser, setEditingUser]     = useState(null);
  const [transferringUser, setTransferringUser] = useState(null);

  // PM Review Page States
  const [reviewTab, setReviewTab]         = useState("Pending");
  const [reviewSearch, setReviewSearch]   = useState("");
  const [reviewStation, setReviewStation] = useState("All");
  const [selectedPmId, setSelectedPmId]   = useState(null);
  const [editSections, setEditSections]   = useState({});
  const [tiRemarks, setTiRemarks]         = useState({});
  const [showAudit, setShowAudit]         = useState({});
  const [rejectMode, setRejectMode]       = useState({});

  // SM Assess States
  const [activeSmId, setActiveSmId]       = useState(null);
  const [smForms, setSmForms]             = useState(() => {
    const saved = localStorage.getItem("ti_sm_forms");
    return saved ? JSON.parse(saved) : {};
  });
  useEffect(() => {
    localStorage.setItem("ti_sm_forms", JSON.stringify(smForms));
  }, [smForms]);

  useEffect(() => {
    const tiHrmsId = user?.hrmsId || "TI_1001";
    const handleStorageChange = () => {
      const savedSmForms = localStorage.getItem("ti_sm_forms");
      if (savedSmForms) setSmForms(JSON.parse(savedSmForms));

      setIsExamAssigned(localStorage.getItem(`ti_exam_assigned_${tiHrmsId}`) === "true");
    };
    window.addEventListener("storage", handleStorageChange);

    const interval = setInterval(() => {
      const current = localStorage.getItem(`ti_exam_assigned_${tiHrmsId}`) === "true";
      setIsExamAssigned(current);
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const [smLocked, setSmLocked]           = useState({});

  // TM Assess States
  const [activeTmId, setActiveTmId]       = useState(null);
  const [tmForms, setTmForms]             = useState(() => {
    const saved = localStorage.getItem("ti_tm_forms");
    return saved ? JSON.parse(saved) : {};
  });
  useEffect(() => {
    localStorage.setItem("ti_tm_forms", JSON.stringify(tmForms));
  }, [tmForms]);
  const [tmLocked, setTmLocked]           = useState({});

  // Station Superintendent assessment state
  const [ssList, setSsList]               = useState([]);
  const [ssForms, setSsForms]             = useState(() => {
    const saved = localStorage.getItem("ti_ss_forms");
    return saved ? JSON.parse(saved) : {};
  });
  useEffect(() => {
    localStorage.setItem("ti_ss_forms", JSON.stringify(ssForms));
  }, [ssForms]);
  const [ssLocked, setSsLocked]           = useState({});
  const [activeSsId, setActiveSsId]       = useState(null);

  // Unified Assessments page sub-state
  const [assessRole, setAssessRole]       = useState(null); // "SM" | "SS" | "TM"
  const [assessSearch, setAssessSearch]   = useState("");
  const [assessStation, setAssessStation] = useState("All");
  const [assessStatus, setAssessStatus]   = useState("All");
  const [assessCat, setAssessCat]         = useState("All");
  const [myAssessSelected, setMyAssessSelected] = useState(null);

  const [repF, setRepF] = useState({ search: "", role: "All", station: "All", cat: "All", risk: "All" });
  const [repApplied, setRepApplied] = useState(false);

  useEffect(() => {
    if (activeSmId) {
      const smAssess = smList.find(s => s.id === activeSmId);
      if (smAssess && smAssess.examScore !== undefined) {
        setSmForms(prev => {
          const existing = prev[activeSmId];
          if (existing && existing.knowledgeMarks !== smAssess.examScore.toString()) {
            return {
              ...prev,
              [activeSmId]: {
                ...existing,
                knowledgeMarks: smAssess.examScore.toString()
              }
            };
          }
          return prev;
        });
      }
    }
  }, [smList, activeSmId]);

  // Reports Filters
  const [rpStation, setRpStation]         = useState("All");
  const [rpCat, setRpCat]                 = useState("All");
  const [rpRisk, setRpRisk]               = useState("All");
  const [rpSearch, setRpSearch]           = useState("");
  const [rpSort, setRpSort]               = useState("date-desc");

  // Inspections / Counselling forms
  const [showInspForm, setShowInspForm]   = useState(false);
  const [newInsp, setNewInsp]             = useState({ station: "Parbhani Junction", officer: "TI R. Khan", observations: "", risk: "Low" });
  const [showCounForm, setShowCounForm]   = useState(false);
  const [newCoun, setNewCoun]             = useState({ staffName: "", designation: "Pointsman Grade I", station: "Parbhani Junction", topics: "", duration: "30 mins", progress: "Under Monitor" });

  // Dashboard filtering & scroll toggle
  const [dbStationFilter, setDbStationFilter] = useState("All");
  const [dbSearchQuery, setDbSearchQuery] = useState("");

  const tiName = user?.name  || "R. Khan";
  const tiId   = user?.hrmsId || "TI_1001";
  const fullName = tiName;
  const employeeId = tiId;
  const latestScore = tiAssessments.length > 0 ? tiAssessments[0].totalScore || tiAssessments[0].total : 86;
  const latestCategory = tiAssessments.length > 0 ? tiAssessments[0].category : "A";

  const myStations = useMemo(() => {
    return stations;
  }, [stations]);

  const performanceSummaryText = useMemo(() => {
    const rec = myAssessSelected || selectedRecord || (tiAssessments && tiAssessments[0]);
    if (!rec) return "";
    return getPerformanceSummaryText(rec.totalScore || rec.total || 0, rec.sections);
  }, [myAssessSelected, selectedRecord, tiAssessments]);

  const handleAddStationSubmit = (e) => {
    e.preventDefault();
    if (!newStationData.name.trim() || !newStationData.code.trim()) {
      setStatusMsg("Station name and code are required.");
      return;
    }
    const codeUpper = newStationData.code.trim().toUpperCase();
    if (stations.some(st => st.code.toUpperCase() === codeUpper)) {
      setStatusMsg(`Station with code ${codeUpper} already exists!`);
      return;
    }
    const newStation = {
      id: "ST_" + Date.now(),
      name: newStationData.name.trim(),
      code: codeUpper,
      division: newStationData.division?.trim() || "Nagpur Division",
      zone: newStationData.zone?.trim() || "Central Railway",
      category: newStationData.category || "B",
      smCount: parseInt(newStationData.smCount) || 0,
      pmCount: parseInt(newStationData.pmCount) || 0,
      pointsmenCount: parseInt(newStationData.pmCount) || 0,
      avgScore: 80,
      safetyPct: 100,
      highRisk: 0,
      assignedTi: tiId
    };
    setStations(prev => [...prev, newStation]);
    setShowAddStationModal(false);
    setNewStationData({ name: "", code: "", division: "", zone: "", category: "B", smCount: "", pmCount: "" });
    setStatusMsg(`Station "${newStation.name}" successfully added under your jurisdiction.`);
    addAuditLog("Added New Station", `Station: ${newStation.name} (${newStation.code})`);
    triggerNotification("success", `Added Station: ${newStation.name} (${newStation.code})`);
  };

  const openAddUserModal = (defaultRole = "Station Master") => {
    let defaultDesig = defaultRole;
    if (defaultRole === "Pointsman") defaultDesig = "Pointsman Grade I";
    setNewUserData({
      id: "",
      name: "",
      role: defaultRole,
      designation: defaultDesig,
      station: myStations[0]?.name || "",
      contact: "",
      joiningDate: new Date().toISOString().slice(0, 10),
      pmeStatus: "Fit",
      refStatus: "Cleared",
      reportingSm: defaultRole === "Pointsman" ? "S. Deshmukh" : defaultRole === "Train Manager" ? "NGP-BSL Section" : "",
      shift: defaultRole === "Pointsman" ? "Morning Shift (06:00 - 14:00)" : defaultRole === "Train Manager" ? "Goods Train Beat" : "",
      workLocation: defaultRole === "Pointsman" ? "Yard Area" : defaultRole === "Train Manager" ? "Nagpur Depot" : ""
    });
    setShowAddUserModal(true);
  };

  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    if (!newUserData.name.trim() || !newUserData.id.trim() || !newUserData.station || !newUserData.contact.trim() || !newUserData.joiningDate) {
      setStatusMsg("Please fill out all required fields.");
      return;
    }
    
    let finalId = newUserData.id.trim();
    if (newUserData.role === "Station Master") {
      if (!finalId.startsWith("SM_")) {
        finalId = "SM_" + finalId.replace(/^SM_|^PM_|^SS_|^TM_/i, "");
      }
    } else if (newUserData.role === "Pointsman") {
      if (!finalId.startsWith("PM_")) {
        finalId = "PM_" + finalId.replace(/^SM_|^PM_|^SS_|^TM_/i, "");
      }
    } else if (newUserData.role === "Station Superintendent") {
      if (!finalId.startsWith("SS_")) {
        finalId = "SS_" + finalId.replace(/^SM_|^PM_|^SS_|^TM_/i, "");
      }
    } else if (newUserData.role === "Train Manager") {
      if (!finalId.startsWith("TM_")) {
        finalId = "TM_" + finalId.replace(/^SM_|^PM_|^SS_|^TM_/i, "");
      }
    }

    if (users.some(u => u.id === finalId)) {
      setStatusMsg(`User with Employee ID ${finalId} already exists!`);
      return;
    }

    const newUser = {
      id: finalId,
      name: newUserData.name.trim(),
      role: newUserData.role,
      designation: newUserData.designation || newUserData.role,
      station: newUserData.station,
      cat: "A",
      lastAssessDate: new Date().toISOString().slice(0, 10),
      score: 80,
      pmeStatus: newUserData.pmeStatus,
      refStatus: newUserData.refStatus,
      contact: newUserData.contact.trim(),
      joiningDate: newUserData.joiningDate,
      reportingSm: newUserData.role === "Pointsman" || newUserData.role === "Train Manager" ? newUserData.reportingSm : "",
      shift: newUserData.role === "Pointsman" || newUserData.role === "Train Manager" ? newUserData.shift : "",
      workLocation: newUserData.role === "Pointsman" || newUserData.role === "Train Manager" ? newUserData.workLocation : ""
    };

    setUsers(prev => [...prev, newUser]);
    setShowAddUserModal(false);
    
    setStatusMsg(`Personnel "${newUser.name}" successfully added and rostered.`);
    addAuditLog("Added New User", `Staff: ${newUser.name} (${newUser.id})`);
    triggerNotification("success", `Added Staff: ${newUser.name} (${newUser.id})`);
  };

  // Trigger Notifications & Audit Logs Helper
  const triggerNotification = (type, message) => {
    setNotifications(prev => [{ id: Date.now(), type, message, time: "Just now", read: false }, ...prev]);
  };

  const addAuditLog = (event, details) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setAuditLogs(prev => [{ id: Date.now(), timestamp, event, details }, ...prev]);
  };

  const exportAlert = (format, filename) => {
    alert(`✓ EXPORT COMPLETE: Dataset "${filename}" exported successfully in ${format} format to your local downloads directory.`);
    addAuditLog("Report Exported", `File: ${filename}.${format.toLowerCase()}`);
    triggerNotification("success", `Report "${filename}" exported safely.`);
  };

  const [hierarchySubordinates, setHierarchySubordinates] = useState([]);

  useEffect(() => {
    const fetchSubordinates = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) return;
        let res;
        try {
          res = await fetch("http://127.0.0.1:5000/api/hierarchy/subordinates", {
            headers: { "Authorization": `Bearer ${token}` }
          });
        } catch {
          res = await fetch("/api/hierarchy/subordinates", {
            headers: { "Authorization": `Bearer ${token}` }
          });
        }
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setHierarchySubordinates(data.data);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch TI subordinates from hierarchy API:", err);
      }
    };
    fetchSubordinates();
  }, []);

  /* ── Derived calculations ── */
  const myUsers = useMemo(() => {
    const defaultList = users.filter(u => myStations.some(st => st.name === u.station));
    if (hierarchySubordinates && hierarchySubordinates.length > 0) {
      const subHrmsIds = new Set(hierarchySubordinates.map(s => (s.hrms_id || "").toUpperCase()));
      const subStations = new Set(hierarchySubordinates.map(s => s.station_name));
      return users.filter(u => {
        const designation = (u.designation || u.role || "").toLowerCase();
        if (designation.includes("master") || designation.includes("sm") || designation.includes("superintendent") || designation.includes("ss")) {
          return subHrmsIds.has((u.id || "").toUpperCase());
        } else if (designation.includes("pointsman")) {
          return subStations.has(u.station);
        }
        return myStations.some(st => st.name === u.station);
      });
    }
    return defaultList;
  }, [users, myStations, hierarchySubordinates]);

  const myPmList = useMemo(() => {
    const defaultList = pmList.filter(p => myStations.some(st => st.name === p.station));
    if (hierarchySubordinates && hierarchySubordinates.length > 0) {
      const subStations = new Set(hierarchySubordinates.map(s => s.station_name));
      return pmList.filter(p => subStations.has(p.station));
    }
    return defaultList;
  }, [pmList, myStations, hierarchySubordinates]);

  const mySmList = useMemo(() => {
    const defaultList = smList.filter(s => myStations.some(st => st.name === s.station));
    if (hierarchySubordinates && hierarchySubordinates.length > 0) {
      const subHrmsIds = new Set(hierarchySubordinates.map(s => (s.hrms_id || "").toUpperCase()));
      return smList.filter(s => subHrmsIds.has((s.hrmsId || "").toUpperCase()));
    }
    return defaultList;
  }, [smList, myStations, hierarchySubordinates]);

  const myTmList = useMemo(() => {
    const defaultList = tmList.filter(t => myStations.some(st => st.name === t.station));
    if (hierarchySubordinates && hierarchySubordinates.length > 0) {
      const subStations = new Set(hierarchySubordinates.map(s => s.station_name));
      return tmList.filter(t => subStations.has(t.station));
    }
    return defaultList;
  }, [tmList, myStations, hierarchySubordinates]);

  const totalPM     = myUsers.filter(u => u.role === "Pointsman").length;
  const totalSMs    = myUsers.filter(u => u.role === "Station Master").length;
  const pending     = myPmList.filter(p=>p.status==="Pending").length;
  const highRiskAll = myUsers.filter(u => u.pmeStatus === "Overdue" || u.refStatus === "Expired" || u.score < 50).length;
  const avgScoreAll = Math.round(myUsers.reduce((s, u) => s + u.score, 0) / (myUsers.length || 1));

  // Station level scores derived dynamically from user database!
  const stationStats = useMemo(() => {
    return myStations.map(st => {
      const stUsers = users.filter(u => u.station === st.name);
      const avg = stUsers.length ? Math.round(stUsers.reduce((s, u) => s + u.score, 0) / stUsers.length) : st.avgScore;
      const riskCount = stUsers.filter(u => u.pmeStatus === "Overdue" || u.refStatus === "Expired" || u.score < 50).length;
      return {
        ...st,
        avgScore: avg,
        highRisk: riskCount,
        safetyPct: Math.max(50, Math.min(100, 100 - (riskCount * 12)))
      };
    });
  }, [myStations, users]);

  const bestSt  = [...stationStats].sort((a,b)=>b.avgScore-a.avgScore)[0];
  const worstSt = [...stationStats].sort((a,b)=>a.avgScore-b.avgScore)[0];
  const highRiskSt = [...stationStats].sort((a,b)=>b.highRisk-a.highRisk)[0];

  const filteredStations = useMemo(() => {
    return stationStats.filter(st => {
      const matchesSearch = st.name.toLowerCase().includes(dbSearchQuery.toLowerCase()) || st.code.toLowerCase().includes(dbSearchQuery.toLowerCase());
      const matchesFilter = dbStationFilter === "All" || st.name === dbStationFilter;
      return matchesSearch && matchesFilter;
    });
  }, [stationStats, dbSearchQuery, dbStationFilter]);

  const stBarData = filteredStations.map(st=>({ name:st.code, nameFull: st.name, avgScore:st.avgScore, safetyPct:st.safetyPct, highRisk:st.highRisk }));

  const pieData = useMemo(()=>{
    const c = { A: 0, B: 0, C: 0, D: 0 };
    myUsers.forEach(u => {
      const cat = u.cat || getCat(u.score);
      if (c[cat] !== undefined) {
        c[cat]++;
      }
    });
    return Object.entries(c).map(([name,value])=>({name,value}));
  }, [myUsers]);

  const myStationsProgress = useMemo(() => {
    return myStations.map(st => {
      const pmCompleted = myPmList.filter(p => p.station === st.name && p.status === "Approved").length;
      const pmPending = myPmList.filter(p => p.station === st.name && p.status === "Pending").length;
      
      const smCompleted = mySmList.filter(s => s.station === st.name && (s.status === "Submitted" || s.status === "Approved")).length;
      const smPending = mySmList.filter(s => s.station === st.name && s.status === "Pending").length;
      
      const ssCompleted = ssList.filter(s => s.station === st.name && (s.status === "Submitted" || s.status === "Approved")).length;
      const ssPending = ssList.filter(s => s.station === st.name && s.status === "Pending").length;

      const tmCompleted = myTmList.filter(t => t.station === st.name && (t.status === "Submitted" || t.status === "Approved")).length;
      const tmPending = myTmList.filter(t => t.station === st.name && t.status === "Pending").length;

      return {
        name: st.code,
        completed: pmCompleted + smCompleted + ssCompleted + tmCompleted,
        pending: pmPending + smPending + ssPending + tmPending
      };
    });
  }, [myStations, myPmList, mySmList, ssList, myTmList]);

  const roleBarData = useMemo(() => {
    const pmCount = myUsers.filter(u => u.role === "Pointsman").length;
    const smCount = myUsers.filter(u => u.role === "Station Master").length;
    const ssCount = myUsers.filter(u => u.role === "Station Superintendent").length;
    const tmCount = myUsers.filter(u => u.role === "Train Manager").length;

    return [
      { role: "Pointsmen", count: pmCount },
      { role: "Station Masters", count: smCount },
      { role: "Station Superintendents", count: ssCount },
      { role: "Train Managers", count: tmCount }
    ];
  }, [myUsers]);

  const myCompliance = useMemo(() => {
    const overallSafetyPct = myStations.length ? Math.round(stationStats.reduce((s, st) => s + st.safetyPct, 0) / myStations.length) : 0;
    const pmeFitCount = myUsers.filter(u => u.pmeStatus === "Fit").length;
    const pmeCompletionRate = myUsers.length ? Math.round((pmeFitCount / myUsers.length) * 100) : 0;
    const refClearedCount = myUsers.filter(u => u.refStatus === "Cleared").length;
    const refCompletionRate = myUsers.length ? Math.round((refClearedCount / myUsers.length) * 100) : 0;

    return [
      { label: "Overall Safety Compliance", pct: overallSafetyPct, color: "#16a34a" },
      { label: "PME Completion Rate", pct: pmeCompletionRate, color: "#2563eb" },
      { label: "REF Completion Rate", pct: refCompletionRate, color: "#7c3aed" },
      { label: "Incident Reporting Compliance", pct: 92, color: "#0891b2" },
      { label: "Disciplinary Clean Record", pct: 96, color: "#16a34a" }
    ];
  }, [myStations, stationStats, myUsers]);

  const topStations = useMemo(() => [...stationStats].sort((a, b) => b.avgScore - a.avgScore).slice(0, 5), [stationStats]);
  const bottomStations = useMemo(() => [...stationStats].sort((a, b) => a.avgScore - b.avgScore).slice(0, 5), [stationStats]);

  const myPipeline = useMemo(() => {
    const approvedCount = myPmList.filter(p => p.status === "Approved").length + mySmList.filter(s => s.status === "Approved").length + myTmList.filter(t => t.status === "Approved").length;
    const pendingCount = myPmList.filter(p => p.status === "Pending").length + mySmList.filter(s => s.status === "Pending" || s.status === "Submitted").length + myTmList.filter(t => t.status === "Pending" || t.status === "Submitted").length;
    const rejectedCount = mySmList.filter(s => s.status === "Rejected").length + myTmList.filter(t => t.status === "Rejected").length;
    const overdueCount = myUsers.filter(u => u.pmeStatus === "Overdue" || u.refStatus === "Expired").length;

    return [
      { label: "Approved", count: approvedCount, dot: "#1E3A5F" },
      { label: "Pending", count: pendingCount, dot: "#4A90D9" },
      { label: "Rejected", count: rejectedCount, dot: "#B83A3A" },
      { label: "Overdue", count: overdueCount, dot: "#5A6B7C" }
    ];
  }, [myPmList, mySmList, myTmList, myUsers]);

  const MONTHLY = useMemo(() => {
    const months = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const label = `${monthNames[m.getMonth()]}'${m.getFullYear().toString().slice(-2)}`;
      months.push({
        label,
        monthNum: m.getMonth() + 1,
        year: m.getFullYear()
      });
    }

    return months.map(m => {
      const parseDate = (dStr) => {
        if (!dStr || dStr === "—") return null;
        const parsed = new Date(dStr);
        return isNaN(parsed.getTime()) ? null : parsed;
      };

      const filterByMonth = (list, dateField) => {
        return list.filter(item => {
          const date = parseDate(item[dateField]);
          if (!date) return false;
          return (date.getMonth() + 1) === m.monthNum && date.getFullYear() === m.year;
        });
      };

      const pmInMonth = filterByMonth(myPmList, "submissionDate");
      const smInMonth = filterByMonth(mySmList, "lastDate");
      const tmInMonth = filterByMonth(myTmList, "lastDate");
      const ssInMonth = filterByMonth(ssList, "lastDate");

      const allAssessmentsInMonth = [...pmInMonth, ...smInMonth, ...tmInMonth, ...ssInMonth];
      const assessmentsCount = allAssessmentsInMonth.length;

      let avgScore = 0;
      if (assessmentsCount > 0) {
        const scores = allAssessmentsInMonth.map(a => a.score || a.finalScore || 0).filter(s => s > 0);
        if (scores.length > 0) {
          avgScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
        } else {
          avgScore = avgScoreAll || 0;
        }
      } else {
        avgScore = myUsers.length > 0 ? avgScoreAll : 0;
      }

      const overallSafetyPct = myStations.length ? Math.round(stationStats.reduce((s, st) => s + st.safetyPct, 0) / myStations.length) : 0;
      
      const approved = allAssessmentsInMonth.filter(a => a.status === "Approved").length;
      const pending = allAssessmentsInMonth.filter(a => a.status === "Pending" || a.status === "Submitted").length;
      const rejected = allAssessmentsInMonth.filter(a => a.status === "Rejected").length;

      return {
        month: m.label,
        avgScore: avgScore,
        safetyAvg: myUsers.length > 0 ? overallSafetyPct : 0,
        assessments: assessmentsCount,
        approved,
        pending,
        rejected,
        overdue: myUsers.filter(u => u.pmeStatus === "Overdue" || u.refStatus === "Expired").length
      };
    });
  }, [myPmList, mySmList, myTmList, ssList, myUsers, avgScoreAll, myStations, stationStats]);

  const myAssessmentMonthly = useMemo(() => {
    return MONTHLY.map(m => {
      return {
        month: m.month,
        approved: m.approved,
        pending: m.pending,
        rejected: m.rejected,
        overdue: m.overdue
      };
    });
  }, [MONTHLY]);

  // Fullscreen Derived Calculations
  const filteredFsStations = useMemo(() => {
    return stationStats.filter(st => {
      const q = fsSearch.toLowerCase();
      const matchesSearch = st.name.toLowerCase().includes(q) || st.code.toLowerCase().includes(q);
      const grade = getCat(st.avgScore);
      const matchesCat = fsCatFilter === "All" || grade === fsCatFilter;
      const riskLevel = st.highRisk >= 2 ? "High" : st.highRisk > 0 ? "Medium" : "Low";
      const matchesRisk = fsRiskFilter === "All" || riskLevel === fsRiskFilter;
      return matchesSearch && matchesCat && matchesRisk;
    });
  }, [stationStats, fsSearch, fsCatFilter, fsRiskFilter]);

  const fsStBarData = useMemo(() => {
    return filteredFsStations.map(st => ({
      name: st.code,
      nameFull: st.name,
      avgScore: st.avgScore,
      safetyPct: st.safetyPct,
      highRisk: st.highRisk
    }));
  }, [filteredFsStations]);

  const filteredFsUsers = useMemo(() => {
    return users.filter(u => {
      if (u.role !== "Pointsman") return false;
      const q = fsSearch.toLowerCase();
      const matchesSearch = u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
      const grade = getCat(u.score);
      const matchesCat = fsCatFilter === "All" || grade === fsCatFilter;
      const risk = u.pmeStatus === "Overdue" || u.refStatus === "Expired" || u.score < 50 ? "High" : u.score >= 80 ? "Low" : "Medium";
      const matchesRisk = fsRiskFilter === "All" || risk === fsRiskFilter;
      return matchesSearch && matchesCat && matchesRisk;
    });
  }, [users, fsSearch, fsCatFilter, fsRiskFilter]);

  const fsPieData = useMemo(() => {
    const c = { A: 0, B: 0, C: 0, D: 0 };
    filteredFsUsers.forEach(u => {
      c[getCat(u.score)]++;
    });
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [filteredFsUsers]);

  const filteredPM = useMemo(()=>{
    return pmList.filter(p=>{
      const st = p.status === reviewTab;
      const s  = !reviewSearch || p.pointsmanName.toLowerCase().includes(reviewSearch.toLowerCase()) || p.hrmsId.toLowerCase().includes(reviewSearch.toLowerCase());
      const r  = reviewStation==="All" || p.station===reviewStation;
      return st && s && r;
    });
  },[pmList,reviewTab,reviewSearch,reviewStation]);

  const selectedPM = pmList.find(p=>p.id===selectedPmId)||null;

  /* ── Role Roster filtering ── */
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const isRoleMatch = 
        activePage === "pointsmen" ? u.role === "Pointsman" : 
        activePage === "stationMasters" ? u.role === "Station Master" : 
        activePage === "stationSuperintendents" ? u.role === "Station Superintendent" : 
        activePage === "trainManagers" ? u.role === "Train Manager" : true;
      if (!isRoleMatch) return false;

      const q = userSearch.toLowerCase();
      const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
      const matchesStation = userStationFilter === "All" || u.station === userStationFilter;
      const matchesCategory = userCategoryFilter === "All" || (u.cat || getCat(u.score)) === userCategoryFilter;
      
      const isHighRisk = u.pmeStatus === "Overdue" || u.refStatus === "Expired" || u.score < 50;
      const matchesRisk = userRiskFilter === "All" || (userRiskFilter === "High" && isHighRisk) || (userRiskFilter === "Non-High" && !isHighRisk);

      return matchesSearch && matchesStation && matchesCategory && matchesRisk;
    });
  }, [users, userSearch, userStationFilter, userCategoryFilter, userRiskFilter, activePage]);

  const filteredReport = useMemo(()=>{
    let list = users.map(u => ({
      name: u.name,
      hrmsId: u.id,
      station: u.station,
      score: u.score,
      cat: u.cat || getCat(u.score),
      risk: u.pmeStatus === "Overdue" || u.refStatus === "Expired" || u.score < 50 ? "High" : u.score >= 80 ? "Low" : "Medium",
      date: u.lastAssessDate
    }));
    list = list.filter(r=>{
      const q = rpSearch.toLowerCase();
      const srch = !q||r.name.toLowerCase().includes(q)||r.station.toLowerCase().includes(q);
      const st   = rpStation==="All"||r.station===rpStation;
      const cat  = rpCat==="All"||r.cat===rpCat;
      const risk = rpRisk==="All"||r.risk===rpRisk;
      return srch&&st&&cat&&risk;
    });
    if (rpSort==="score-desc") list=[...list].sort((a,b)=>b.score-a.score);
    if (rpSort==="score-asc")  list=[...list].sort((a,b)=>a.score-b.score);
    return list;
  },[users,rpSearch,rpStation,rpCat,rpRisk,rpSort]);

  /* ── Navigation ── */
  const goTo = pg => {
    setActivePage(pg);
    setStatusMsg("");
    setSelectedPmId(null);
    setActiveSmId(null);
    setActiveSsId(null);
    setActiveTmId(null);
    setAssessRole(null);
    setSelectedStation(null);
    setSelectedReportUserId(null);
    setRepApplied(false);
    setBellDropdownOpen(false);
    setRoleF({ name: "", station: "All", ti: "All", cat: "All", risk: "All" });
    setView(null);
  };

  useEffect(() => {
    if (selectedStation) {
      const st = selectedStation;
      const matched = stationStats.find(s => s.name === st.name || s.code === st.code) || st;
      
      const smCount = users.filter(u => u.station === matched.name && (u.role === "Station Master" || u.role === "sm")).length;
      const pmCount = users.filter(u => u.station === matched.name && (u.role === "Pointsman" || u.role === "pointsmen")).length;
      const pmPending = myPmList.filter(p => p.station === matched.name && p.status === "Pending").length;
      const smPending = mySmList.filter(s => s.station === matched.name && s.status === "Pending").length;
      const tmPending = myTmList.filter(t => t.station === matched.name && t.status === "Pending").length;
      const pending = pmPending + smPending + tmPending;
      
      setView({
        type: "stationDetail",
        data: {
          ...matched,
          ti: user.name || "TI R. Khan",
          smCount,
          pmCount,
          score: matched.avgScore || matched.score,
          safety: matched.safetyPct || matched.safety,
          highRisk: matched.highRisk,
          pending
        }
      });
    } else {
      setView(null);
    }
  }, [selectedStation, stationStats, users, myPmList, mySmList, myTmList, user]);

  const handleChartClick = (state, chartType) => {
    let clickedStationName = "";
    if (state && state.activeLabel) {
      const matched = stationStats.find(st => st.code === state.activeLabel);
      if (matched) {
        clickedStationName = matched.name;
      }
    }
    
    if (clickedStationName) {
      setFsSearch(clickedStationName);
    } else {
      setFsSearch("");
    }
    setFsCatFilter("All");
    setFsRiskFilter("All");

    if (chartType === "trend") {
      setFullscreenChart("trend");
    } else {
      setFullscreenChart("station");
    }
  };

  const handlePieClick = (data) => {
    if (data && data.name) {
      const catLetter = data.name.replace("Category ", "").replace("Grade ", "").replace("Cat ", "").trim();
      setFsCatFilter(catLetter);
    } else {
      setFsCatFilter("All");
    }
    setFsSearch("");
    setFsRiskFilter("All");
    setFullscreenChart("grade");
  };

  ;

  /* ── User admin actions ── */
  const handleEditUser = (userRec) => {
    setEditingUser({ ...userRec });
  };

  const saveEditedUser = (e) => {
    e.preventDefault();
    setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
    addAuditLog("User Profile Modified", `Staff ID: ${editingUser.id}, Name: ${editingUser.name}`);
    triggerNotification("success", `Profile updated for ${editingUser.name}.`);
    setEditingUser(null);
    setStatusMsg("User profile updated successfully.");
  };

  const handleDeleteUser = (userId, userName) => {
    if (window.confirm(`Are you absolutely sure you want to revoke operational access for ${userName} (${userId})?`)) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      addAuditLog("Revoked User Access", `Staff ID: ${userId}, Name: ${userName}`);
      triggerNotification("danger", `Revoked access: ${userName} (${userId}).`);
      setStatusMsg(`Revoked evaluation and access clearance for ${userName}.`);
    }
  };

  const handleTransferClick = (userRec) => {
    setTransferringUser({ ...userRec, targetStation: userRec.station });
  };

  const confirmTransfer = () => {
    setUsers(prev => prev.map(u => u.id === transferringUser.id ? { ...u, station: transferringUser.targetStation } : u));
    addAuditLog("Staff Station Transfer", `Staff: ${transferringUser.name} moved from ${transferringUser.station} to ${transferringUser.targetStation}`);
    triggerNotification("warning", `Transferred ${transferringUser.name} to ${transferringUser.targetStation}.`);
    setStatusMsg(`Operational deployment of ${transferringUser.name} transferred to ${transferringUser.targetStation}.`);
    setTransferringUser(null);
  };

  /* ── PM Review Actions ── */
  const openPmReview = id => {
    const rec = pmList.find(p=>p.id===id);
    if (!rec) return;
    setSelectedPmId(id);
    setEditSections(prev=>({...prev,[id]:rec.originalSections.map(s=>({...s}))}));
    setTiRemarks(prev=>({...prev,[id]:rec.tiRemarks||""}));
    setRejectMode(prev=>({...prev,[id]:false}));
  };

  const updateSec = (id,idx,val) => {
    setEditSections(prev=>{
      const arr=[...prev[id]]; arr[idx]={...arr[idx],score:Math.max(0,Math.min(arr[idx].max,Number(val)||0))};
      return {...prev,[id]:arr};
    });
  };

  const finalizePM = async (id, mode, rejectNote="") => {
    const targetAssess = pmList.find(p => p.id === id);
    if (!targetAssess) return;
    
    const dbAsmtId = targetAssess.dbAssessmentId;
    const remarks = mode === "reject" ? rejectNote : (tiRemarks[id] || "");
    const secs = editSections[id] || targetAssess.originalSections;
    const total = secs.reduce((s, x) => s + x.score, 0);
    const modified = JSON.stringify(secs) !== JSON.stringify(targetAssess.originalSections);

    try {
      if (mode === "reject") {
        await rejectAssessment(dbAsmtId, remarks);
      } else {
        await approveAssessment(dbAsmtId, remarks, total);
      }

      setPmList(prev => prev.map(p => {
        if (p.id !== id) return p;
        const audit = [...(p.auditTrail || []), {
          action: mode === "reject" ? "Rejected" : (modified ? "Modified & Approved" : "Approved without modification"),
          by: `TI ${tiName}`, date: new Date().toISOString().slice(0, 10),
          remark: remarks
        }];
        return {
          ...p, status: mode === "reject" ? "Rejected" : "Approved",
          finalSections: mode === "reject" ? p.originalSections : secs,
          finalScore: total, tiRemarks: remarks,
          tiModified: modified, approvalDate: new Date().toISOString().slice(0, 10),
          auditTrail: audit
        };
      }));

      // Update target Pointsman's dynamic performance score in the main users database!
      if (mode !== "reject") {
        setUsers(prev => prev.map(u => u.id === targetAssess.hrmsId ? { ...u, score: total, cat: getCat(total) } : u));
      }

      setSelectedPmId(null);
      setStatusMsg(mode === "reject" ? "Assessment rejected. SM has been notified." : `Assessment ${mode === "approve" ? "approved" : "modified & approved"} successfully.`);
      addAuditLog(mode === "reject" ? "Rejected PM Assessment" : "Approved PM Assessment", `Staff ID: ${targetAssess?.hrmsId || ""}, Score: ${mode === "reject" ? "-" : total}`);
      triggerNotification("success", `Reviewed PM Assessment for ${targetAssess?.pointsmanName || ""}.`);
      setReviewTab(mode === "reject" ? "Rejected" : "Approved");
    } catch (err) {
      console.error(`Failed to ${mode} assessment:`, err);
      setStatusMsg(`Error: Failed to register decision in the database. ${err.message || ""}`);
    }
  };

  /* ── SM Form ── */
  const openSMForm = (id, forceUnlock = false) => {
    setActiveSmId(id);
    const smAssess = smList.find(s => s.id === id);
    setSmLocked(prev => ({
      ...prev,
      [id]: forceUnlock ? false : (smAssess ? smAssess.status === "Submitted" : false)
    }));
    setSmForms(prev => {
      const existing = prev[id] || defaultSMForm();
      if (smAssess && smAssess.examScore !== undefined) {
        return {
          ...prev,
          [id]: {
            ...existing,
            knowledgeMarks: smAssess.examScore.toString()
          }
        };
      }
      return {
        ...prev,
        [id]: existing
      };
    });
  };

  const handleSendExamAccess = (id) => {
    setSmList(prev => prev.map(s => s.id === id ? { ...s, status: "Exam Sent" } : s));
    const targetHrmsId = smList.find(s => s.id === id)?.hrmsId;
    if (targetHrmsId) {
      localStorage.setItem(`sm_test_activated_${targetHrmsId}`, "true");
    }
    setStatusMsg("Exam access link sent successfully to the Station Master.");
    addAuditLog("Sent Exam Access", `Exam sent to SM: ${smList.find(s => s.id === id)?.name}`);
    triggerNotification("success", `Exam access granted to SM ${smList.find(s => s.id === id)?.name}`);
  };

  const toggleSMYN = (id,key,idx,val) => {
    if (smLocked[id]) return;
    setSmForms(prev=>{
      const f={...prev[id]}; const arr=[...f[key]]; arr[idx]=arr[idx]===val?null:val;
      return {...prev,[id]:{...f,[key]:arr}};
    });
  };
  const setSMField = (id,key,val) => { if(smLocked[id])return; setSmForms(p=>({...p,[id]:{...p[id],[key]:val}})); };

  const submitSMAssessment = id => {
    const f = smForms[id];
    if (!f?.alcoholicStatus){ setStatusMsg("Alcoholic/Non-Alcoholic status is mandatory."); return; }
    const {total} = computeSMScore(f);
    
    const isAlcoholic = f.alcoholicStatus === "Alcoholic";
    const cat = isAlcoholic ? "D" : getCat(total);

    setSmList(prev=>prev.map(s=>s.id===id?{...s,status:"Submitted",score:total,category:cat}:s));
    setSmLocked(p=>({...p,[id]:true}));
    
    // Update Station Master's dynamic performance score in the main users database!
    const smAssess = smList.find(s => s.id === id);
    if (smAssess) {
      setUsers(prev => prev.map(u => u.id === smAssess.hrmsId ? {
        ...u,
        score: total,
        cat: cat,
        alcoholicStatus: f.alcoholicStatus,
        pmeStatus: f.pmeStatus,
        refStatus: f.refStatus
      } : u));
    }

    setStatusMsg("SM assessment submitted. Pending AOM approval.");
    addAuditLog("Submitted SM Assessment", `SM: ${smAssess?.name || ""}, Grand Score: ${total}`);
    triggerNotification("success", `Field evaluation logged for SM ${smAssess?.name || ""}.`);
    setActiveSmId(null);
  };

  /* ── TM Form ── */
  const openTMForm = (id, forceUnlock = false) => {
    setActiveTmId(id);
    const tmAssess = tmList.find(t => t.id === id);
    setTmLocked(prev => ({
      ...prev,
      [id]: forceUnlock ? false : (tmAssess ? tmAssess.status === "Submitted" : false)
    }));
    setTmForms(prev => {
      const existing = prev[id] || defaultTMForm();
      if (tmAssess && tmAssess.examScore !== undefined) {
        return {
          ...prev,
          [id]: {
            ...existing,
            knowledgeMarks: tmAssess.examScore.toString()
          }
        };
      }
      return {
        ...prev,
        [id]: existing
      };
    });
  };

  const handleSendTMExamAccess = (id) => {
    setTmList(prev => prev.map(t => t.id === id ? { ...t, status: "Exam Sent" } : t));
    const targetHrmsId = tmList.find(t => t.id === id)?.hrmsId;
    if (targetHrmsId) {
      localStorage.setItem(`tm_test_activated_${targetHrmsId}`, "true");
    }
    setStatusMsg("Exam access link sent successfully to the Train Manager.");
    addAuditLog("Sent Exam Access", `Exam sent to TM: ${tmList.find(t => t.id === id)?.name}`);
    triggerNotification("success", `Exam access granted to TM ${tmList.find(t => t.id === id)?.name}`);
  };

  const toggleTMYN = (id, key, idx, val) => {
    if (tmLocked[id]) return;
    setTmForms(prev => {
      const f = { ...prev[id] };
      const arr = [...f[key]];
      arr[idx] = arr[idx] === val ? null : val;
      return { ...prev, [id]: { ...f, [key]: arr } };
    });
  };

  const setTMField = (id, key, val) => {
    if (tmLocked[id]) return;
    setTmForms(p => ({ ...p, [id]: { ...p[id], [key]: val } }));
  };

  const submitTMAssessment = id => {
    const f = tmForms[id];
    if (!f?.alcoholicStatus) {
      setStatusMsg("Alcoholic/Non-Alcoholic status is mandatory.");
      return;
    }
    const { total } = computeTMScore(f);

    const isAlcoholic = f.alcoholicStatus === "Alcoholic";
    const cat = isAlcoholic ? "D" : getCat(total);

    setTmList(prev => prev.map(t => t.id === id ? { ...t, status: "Submitted", score: total, category: cat } : t));
    setTmLocked(p => ({ ...p, [id]: true }));

    // Update Train Manager's dynamic performance score in the main users database!
    const tmAssess = tmList.find(t => t.id === id);
    if (tmAssess) {
      setUsers(prev => prev.map(u => u.id === tmAssess.hrmsId ? {
        ...u,
        score: total,
        cat: cat,
        alcoholicStatus: f.alcoholicStatus,
        pmeStatus: f.pmeStatus,
        refStatus: f.refStatus
      } : u));
    }

    setStatusMsg("TM assessment submitted. Pending AOM approval.");
    addAuditLog("Submitted TM Assessment", `TM: ${tmAssess?.name || ""}, Grand Score: ${total}`);
    triggerNotification("success", `Field evaluation logged for TM ${tmAssess?.name || ""}.`);
    setActiveTmId(null);
  };

  /* ── SS Helpers ── */
  const openSSForm = (id, forceUnlock = false) => {
    if (forceUnlock) setSsLocked(p => ({ ...p, [id]: false }));
    setActiveSsId(id);
    setAssessRole("SS");
    setActivePage("assessments");
  };

  const handleSendSSExamAccess = (id) => {
    setSsList(prev => prev.map(s => s.id === id ? { ...s, status: "Exam Sent" } : s));
    triggerNotification("info", "Exam access link sent to Station Superintendent.");
  };

  const toggleSSYN = (id, key, idx, val) => {
    if (ssLocked[id]) return;
    setSsForms(p => ({
      ...p,
      [id]: {
        ...(p[id] || defaultSSForm()),
        [key]: (p[id]?.[key] || Array(5).fill(null)).map((v, i) => i === idx ? (v === val ? null : val) : v)
      }
    }));
  };

  const setSSField = (id, key, val) => { if (ssLocked[id]) return; setSsForms(p => ({ ...p, [id]: { ...(p[id] || defaultSSForm()), [key]: val } })); };

  const submitSSAssessment = id => {
    const f = ssForms[id];
    if (!f?.alcoholicStatus) {
      setStatusMsg("Alcoholic/Non-Alcoholic status is mandatory.");
      return;
    }
    const { total } = computeSSScore(f);
    const isAlcoholic = f.alcoholicStatus === "Alcoholic";
    const cat = isAlcoholic ? "D" : getCat(total);

    setSsList(prev => prev.map(s => s.id === id ? { ...s, status: "Submitted", score: total, category: cat } : s));
    setSsLocked(p => ({ ...p, [id]: true }));

    const ssAssess = ssList.find(s => s.id === id);
    if (ssAssess) {
      setUsers(prev => prev.map(u => u.id === ssAssess.hrmsId ? {
        ...u, score: total, cat: cat,
        alcoholicStatus: f.alcoholicStatus, pmeStatus: f.pmeStatus, refStatus: f.refStatus
      } : u));
    }

    setStatusMsg("SS assessment submitted. Pending AOM approval.");
    addAuditLog("Submitted SS Assessment", `SS: ${ssAssess?.name || ""}, Grand Score: ${total}`);
    triggerNotification("success", `Field evaluation logged for SS ${ssAssess?.name || ""}.`);
    setActiveSsId(null);
  };

  /* ── Logging Inspections & Counselling ── */
  const submitInspection = (e) => {
    e.preventDefault();
    const newRecord = {
      id: "IN_" + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      station: newInsp.station,
      officer: newInsp.officer,
      observations: newInsp.observations,
      risk: newInsp.risk,
      status: "Active"
    };
    setInspections(prev => [newRecord, ...prev]);
    addAuditLog("Logged Station Inspection", `Station: ${newInsp.station}, Risk: ${newInsp.risk}`);
    triggerNotification("warning", `NEW INSPECTION REPORT FILED: ${newInsp.station}`);
    setStatusMsg(`Inspection audit log successfully created for ${newInsp.station}.`);
    setNewInsp({ station: "Parbhani Junction", officer: "TI R. Khan", observations: "", risk: "Low" });
    setShowInspForm(false);
  };

  const submitCounselling = async (e) => {
    e.preventDefault();
    const targetUser = users.find(u => u.name === newCoun.staffName);
    if (!targetUser) {
      setStatusMsg("Selected staff member not found.");
      return;
    }
    try {
      const payload = {
        employee_id: targetUser.dbId,
        counselling_date: new Date().toISOString().slice(0, 10),
        reason: "Safety Awareness Briefing",
        remarks: newCoun.topics,
        next_review_date: null
      };
      
      const createdRecord = await createCounsellingRecord(payload);
      
      const newRecord = {
        id: `CL_${createdRecord.id || Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        staffName: newCoun.staffName,
        designation: newCoun.designation,
        station: newCoun.station,
        topics: newCoun.topics,
        duration: newCoun.duration,
        progress: newCoun.progress
      };
      setCounsellings(prev => [newRecord, ...prev]);
      addAuditLog("Logged Counselling Session", `Staff: ${newCoun.staffName}, Topics: ${newCoun.topics.slice(0,25)}...`);
      triggerNotification("success", `Counselling session registered for ${newCoun.staffName}.`);
      setStatusMsg(`Staff safety counseling briefing registered for ${newCoun.staffName}.`);
      setNewCoun({ staffName: "", designation: "Pointsman Grade I", station: "Parbhani Junction", topics: "", duration: "30 mins", progress: "Under Monitor" });
      setShowCounForm(false);
    } catch (err) {
      console.error("Failed to submit counselling to database:", err);
      setStatusMsg("Failed to register counselling session in the database.");
    }
  };

  /* ── Self-Assessment Interactive Quiz ── */
  const startQuiz = () => {
    setQuizAnswers(Array(25).fill(null));
    setCurrentQuestion(0);
    setQuizState("quiz");
  };

  const handleSelectQuizOpt = (optIdx) => {
    setQuizAnswers(prev => {
      const next = [...prev];
      next[currentQuestion] = optIdx;
      return next;
    });
  };

  const submitQuiz = () => {
    let correctCount = 0;
    quizAnswers.forEach((ans, idx) => {
      if (ans === TI_QUIZ[idx].ans) correctCount++;
    });
    const finalScore = correctCount * 4; // 25 questions = 100 max
    setLatestQuizScore(finalScore);
    
    const getDomainScore = (startIdx, endIdx) => {
      let score = 0;
      for (let i = startIdx; i <= endIdx; i++) {
        if (quizAnswers[i] === TI_QUIZ[i].ans) score += 4;
      }
      return score;
    };

    // Add to assessment history in state
    const today = new Date().toISOString().slice(0, 10);
    const newRecord = {
      id: Date.now(),
      date: today,
      period: "Assigned Assessment " + today,
      assessedBy: "AOM Assigned Exam",
      totalScore: finalScore,
      category: getCat(finalScore),
      approvalStatus: "Approved",
      aomRemarks: "Assigned safety compliance assessment submitted by Traffic Inspector R. Khan.",
      sections: [
        { title: "Whistle Codes & Hand Signals", marks: getDomainScore(0, 4), outOf: 20 },
        { title: "Token & Line Clear Authorities", marks: getDomainScore(5, 9), outOf: 20 },
        { title: "Station Interlocking & Track Circuits", marks: getDomainScore(10, 14), outOf: 20 },
        { title: "Shunting Operations & Point Locking", marks: getDomainScore(15, 19), outOf: 20 },
        { title: "Gate Signals & Siding Isolation", marks: getDomainScore(20, 24), outOf: 20 }
      ],
      userAnswers: [...quizAnswers]
    };
    
    setTiAssessments(prev => [newRecord, ...prev]);
    setSelectedRecord(newRecord);
    localStorage.removeItem(`ti_exam_assigned_${employeeId}`);
    setIsExamAssigned(false);
    addAuditLog("Assigned Assessment Completed", `Score: ${finalScore}/100`);
    triggerNotification("success", `Compliance check complete: Scored ${finalScore}%`);
    setQuizState("result");
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    addAuditLog("Notifications Inbox Read", "Marked all alerts read.");
  };

  /* ═══════════════════════════════════════════
     RENDER: DASHBOARD
     (Highly scrollable & optimized for 12 stations)
  ═══════════════════════════════════════════ */
  ;

  /* ═══════════════════════════════════════════
     RENDER: PROFILE
  ═══════════════════════════════════════════ */
  ;

  // Sub-view: Staff Detail (drill-down) - Declared at parent scope
  ;

  /* ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ 
     RENDER: STATIONS
     (Card grid layout + detailed clickable sub-view)
  ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═  */
  ;

  /* ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ 
     RENDER: ROLE VIEW (Parity with AOM Pointsmen & Station Masters Directories)
     (Allows search, filter, edit, shift, and delete actions for scoped roles)
     (Provides full AOM design alignment using sdom.css tokens)
  ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═  */
  ;

  ;

  ;


  ;


  /* ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ 
     RENDER: MY ASSESSMENTS PAGE
     (Interactive Quiz + timeline scorecard history)
  ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═  */
  ;

  /* ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ 
     RENDER: PME POSITION PAGE
  ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═  */
  ;

  const setGoToCounselling = (name) => {
    setNewCoun(prev => ({ ...prev, staffName: name, topics: "PME evaluation preparation and rest compliance briefings." }));
    goTo("counselling");
    setShowCounForm(true);
  };

  /* ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ 
     RENDER: REF POSITION PAGE
  ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═  */
  ;

  /* ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ 
     RENDER: INSPECTIONS PAGE
  ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═  */
  ;

  /* ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ 
     RENDER: COUNSELLING PAGE
  ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═  */
  ;

  /* ── APPROVALS (AOM PARITY REPLICATION) ── */
  ;

  /* ── ASSESSMENTS (unified: SM / SS / TM) ── */
  ;


  /* ── REPORTS ── */
  ;

  /* ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ 
     RENDER: CONTENT ROUTER
  ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═  */
  const renderContent = () => {
    switch (activePage) {
      case "ai":
        return <AiCommandCenter user={{ name: tiName, hrmsId: tiId, role: "Traffic Inspector" }} role="Traffic Inspector" />;

      case "dashboard":
        return <TIDashboard
          dbStationFilter={dbStationFilter} setDbStationFilter={setDbStationFilter}
          dbSearchQuery={dbSearchQuery} setDbSearchQuery={setDbSearchQuery}
          myStations={myStations} users={users} getCat={getCat} getUserRisk={getUserRisk}
          riskBadge={riskBadge} catBadge={catBadge} statusBadge={statusBadge}
          tiAssessments={tiAssessments} inspections={inspections} counsellings={counsellings}
          activePage={activePage} setActivePage={setActivePage} setSelectedStation={setSelectedStation}
          fullscreenChart={fullscreenChart} setFullscreenChart={setFullscreenChart}
          TI_PROFILE={TI_PROFILE} stationTiMap={stationTiMap} MONTHLY={MONTHLY}
          DEFAULT_SS_TM_USERS={[]} totalPM={totalPM} totalSMs={totalSMs}
          pending={pending}
          highRiskAll={highRiskAll}
          avgScoreAll={avgScoreAll}
          goTo={goTo} setUserStationFilter={setUserStationFilter} setUserCategoryFilter={setUserCategoryFilter}
          setUserRiskFilter={setUserRiskFilter} setUserSearch={setUserSearch} setReviewTab={setReviewTab}
          myStationsProgress={myStationsProgress} stationStats={stationStats}
          roleBarData={roleBarData} pieData={pieData} myCompliance={myCompliance}
          topStations={topStations} bottomStations={bottomStations} myPipeline={myPipeline}
          myAssessmentMonthly={myAssessmentMonthly} handleChartClick={handleChartClick}
          handlePieClick={handlePieClick}
        />;
      case "pointsmen":
      case "stationMasters":
      case "stationSuperintendents":
      case "trainManagers": {
        const roleInfo = {
          pointsmen: { key: "Pointsman", title: "Pointsman" },
          stationMasters: { key: "Station Master", title: "Station Master" },
          stationSuperintendents: { key: "Station Superintendent", title: "Station Superintendent" },
          trainManagers: { key: "Train Manager", title: "Train Manager" }
        }[activePage] || { key: "", title: "" };

        return <CommonRoleView
          roleKey={roleInfo.key}
          title={roleInfo.title}
          activePage={activePage}
          users={users}
          setUsers={setUsers}
          stations={stations}
          view={view}
          setView={setView}
          editingUser={editingUser}
          setEditingUser={setEditingUser}
          transferringUser={transferringUser}
          setTransferringUser={setTransferringUser}
          showAddUserModal={showAddUserModal}
          setShowAddUserModal={setShowAddUserModal}
          handleEditUser={handleEditUser}
          handleTransferClick={handleTransferClick}
          handleDeleteUser={handleDeleteUser}
          newUserData={newUserData}
          setNewUserData={setNewUserData}
          handleAddUserSubmit={handleAddUserSubmit}
          myStations={myStations}
          roleF={roleF}
          setRoleF={setRoleF}
          saveEditedUser={saveEditedUser}
          confirmTransfer={confirmTransfer}
        />;
      }
      case "stations":
        return <TIStations
          stations={stations}
          setStations={setStations}
          showAddStationModal={showAddStationModal}
          setShowAddStationModal={setShowAddStationModal}
          newStationData={newStationData}
          setNewStationData={setNewStationData}
          handleAddStationSubmit={handleAddStationSubmit}
          stSearch={stSearch}
          setStSearch={setStSearch}
          stCatFilter={stCatFilter}
          setStCatFilter={setStCatFilter}
          selectedStation={selectedStation}
          setSelectedStation={setSelectedStation}
          view={view}
          setView={setView}
          myStations={myStations}
          stationStats={stationStats}
          users={users}
          getCat={getCat}
          getUserRisk={getUserRisk}
          riskBadge={riskBadge}
          catBadge={catBadge}
          statusBadge={statusBadge}
          stationTiMap={stationTiMap}
          tiName={tiName}
          myPmList={myPmList}
          mySmList={mySmList}
          myTmList={myTmList}
        />;
      case "approvals":
        return <TIApprovals
          myPmList={myPmList} mySmList={mySmList} myTmList={myTmList}
          myUsers={myUsers} reviewTab={reviewTab} setReviewTab={setReviewTab}
          reviewSearch={reviewSearch} setReviewSearch={setReviewSearch}
          reviewStation={reviewStation} setReviewStation={setReviewStation}
          filteredPM={filteredPM} getCat={getCat} catBadge={catBadge}
          openPmReview={openPmReview} selectedPmId={selectedPmId} selectedPM={selectedPM}
          editSections={editSections} setEditSections={setEditSections} updateSec={updateSec}
          tiRemarks={tiRemarks} setTiRemarks={setTiRemarks} rejectMode={rejectMode}
          setRejectMode={setRejectMode} finalizePM={finalizePM}
          myStations={myStations}
        />;
      case "assessments":
        return <TIAssessments
          assessRole={assessRole} setAssessRole={setAssessRole} assessSearch={assessSearch}
          setAssessSearch={setAssessSearch} assessStation={assessStation} setAssessStation={setAssessStation}
          assessStatus={assessStatus} setAssessStatus={setAssessStatus} assessCat={assessCat}
          setAssessCat={setAssessCat} smList={smList} ssList={ssList} tmList={tmList}
          getCat={getCat} catBadge={catBadge} activeSmId={activeSmId} openSMForm={openSMForm}
          smForms={smForms} toggleSMYN={toggleSMYN} setSMField={setSMField}
          submitSMAssessment={submitSMAssessment} smLocked={smLocked} handleSendExamAccess={handleSendExamAccess}
          activeSsId={activeSsId} openSSForm={openSSForm} ssForms={ssForms} toggleSSYN={toggleSSYN}
          setSSField={setSSField} submitSSAssessment={submitSSAssessment} ssLocked={ssLocked}
          handleSendSSExamAccess={handleSendSSExamAccess} activeTmId={activeTmId} openTMForm={openTMForm}
          tmForms={tmForms} toggleTMYN={toggleTMYN} setTMField={setTMField} submitTMAssessment={submitTMAssessment}
          tmLocked={tmLocked} handleSendTMExamAccess={handleSendTMExamAccess} myStations={myStations}
          setSmList={setSmList}
          setTmList={setTmList}
        />;
      case "pmePosition":
        return <TIPmePosition
          users={users} getCat={getCat} catBadge={catBadge} statusBadge={statusBadge} myStations={myStations}
          exportAlert={exportAlert} triggerNotification={triggerNotification} setGoToCounselling={setGoToCounselling}
          addAuditLog={addAuditLog}
        />;
      case "refPosition":
        return <TIRefPosition
          users={users} setUsers={setUsers} getCat={getCat} catBadge={catBadge} statusBadge={statusBadge} myStations={myStations}
          exportAlert={exportAlert} addAuditLog={addAuditLog}
        />;
      case "inspections":
        return <TIInspections
          inspections={inspections} showInspForm={showInspForm} setShowInspForm={setShowInspForm}
          newInsp={newInsp} setNewInsp={setNewInsp} submitInspection={submitInspection}
          statusBadge={statusBadge} riskBadge={riskBadge} myStations={myStations}
        />;
      case "counselling":
        return <TICounselling
          counsellings={counsellings} showCounForm={showCounForm} setShowCounForm={setShowCounForm}
          newCoun={newCoun} setNewCoun={setNewCoun} submitCounselling={submitCounselling}
          statusBadge={statusBadge} myStations={myStations} users={users}
        />;
      case "myAssessment":
        return <MyAssessment
          roleTitle="Traffic Inspector"
          assessedByTitle="Senior DOM"
          history={tiAssessments}
          myAssessSelected={myAssessSelected}
          setMyAssessSelected={setMyAssessSelected}
          performanceSummaryText={performanceSummaryText}
          getCat={getCat}
          catBadge={catBadge}
          statusBadge={statusBadge}
          selectedRecord={selectedRecord}
          setSelectedRecord={setSelectedRecord}
          isExamAssigned={isExamAssigned}
          quizState={quizState}
          startQuiz={startQuiz}
          currentQuestion={currentQuestion}
          quizAnswers={quizAnswers}
          handleSelectQuizOpt={handleSelectQuizOpt}
          submitQuiz={submitQuiz}
          latestQuizScore={latestQuizScore}
          TI_QUIZ={TI_QUIZ}
        />;
      case "reports":
        return <CommonReports
          users={users}
          selectedReportUserId={selectedReportUserId}
          setSelectedReportUserId={setSelectedReportUserId}
          repF={repF}
          setRepF={setRepF}
          userRole="Traffic Inspector"
        />;
      case "profile":
        return <UserProfile
          fullName={tiName}
          employeeId={tiId}
          latestCategory={tiAssessments.length ? getCat(tiAssessments[0].totalScore) : "A"}
          latestScore={tiAssessments.length ? tiAssessments[0].totalScore : 86}
          history={tiAssessments}
          profileData={TI_PROFILE}
        />;
      default:
        return <div>No page found for {activePage}</div>;
    }
  };

  /* ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ 
     SHELL LAYOUT
  ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═  */
  const userObj = { name: tiName, hrmsId: tiId, role: "Traffic Inspector" };

  return (
    <div className="ti2-layout">
      <CommonLayout
        user={userObj}
        navItems={NAV}
        activeTab={activePage}
        setActiveTab={goTo}
        onLogout={onLogout}
        statusMsg={statusMsg}
        setStatusMsg={setStatusMsg}
        brandTitle="Indian Railway Evaluation Command"
        brandSubtitle="Operations Workspace: Traffic Inspector Module"
        notifications={notifications}
        markAllNotificationsRead={markAllNotificationsRead}

      >
        <div className="ti2-page-wrap" style={{ padding: 0 }}>
          {renderContent()}
        </div>
      </CommonLayout>

      {/* ── Fullscreen Analytics Modal ── */}
      {fullscreenChart && (
        <div className="sm2-fullscreen-modal">
          {/* Header */}
          <div className="sm2-fullscreen-header">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="sm2-fullscreen-icon-wrap">
                {fullscreenChart === "station" && <Building2 size={18} color="#93c5fd" />}
                {fullscreenChart === "trend"   && <TrendingUp size={18} color="#a78bfa" />}
                {fullscreenChart === "grade"   && <BarChart3  size={18} color="#34d399" />}
              </div>
              <div>
                <h2>
                  {fullscreenChart === "station" && (t("analytics.stationSafetyDeepDive") || "Station-wise Safety & Performance — Deep Dive")}
                  {fullscreenChart === "trend"   && (t("analytics.complianceTrendsDeepDive") || "Compliance & Assessment Trends — Deep Dive")}
                  {fullscreenChart === "grade"   && (t("analytics.staffGradeDeepDive") || "Staff Grade Distribution (Pointsmen) — Deep Dive")}
                </h2>
                <p>{t("analytics.subTitle") || "Indian Railway Evaluation Command · Operations Workspace"}</p>
              </div>
            </div>
            <button className="sm2-fullscreen-close-btn" onClick={() => setFullscreenChart(null)}>
              {t("analytics.close") || "✕ Close"}
            </button>
          </div>

          {/* Filter Bar */}
          <div className="sm2-fullscreen-filter-bar">
            <span className="sm2-fs-filter-tag">{t("analytics.filters") || "FILTERS"}</span>
            <input
              type="text"
              placeholder={fullscreenChart === "station" ? (t("analytics.searchStationPlaceholder") || "Search station name / code...") : (t("analytics.searchPlaceholder") || "Search staff name / ID...")}
              value={fsSearch}
              onChange={e => setFsSearch(e.target.value)}
              className="sm2-fs-input"
            />
            {fullscreenChart !== "trend" && (
              <>
                <select value={fsCatFilter} onChange={e => setFsCatFilter(e.target.value)} className="sm2-fs-select">
                  <option value="All">{t("dashboard.allCategories") || "All Grades (A-D)"}</option>
                  <option value="A">{t("dashboard.colCategory") + " A"}</option>
                  <option value="B">{t("dashboard.colCategory") + " B"}</option>
                  <option value="C">{t("dashboard.colCategory") + " C"}</option>
                  <option value="D">{t("dashboard.colCategory") + " D"}</option>
                </select>
                <select value={fsRiskFilter} onChange={e => setFsRiskFilter(e.target.value)} className="sm2-fs-select">
                  <option value="All">{t("workflow.allPriorities") || "All Risk Levels"}</option>
                  <option value="High">{t("priority.high") + " " + (t("dashboard.colRiskLevel") || "Risk")}</option>
                  <option value="Medium">{t("priority.medium") + " " + (t("dashboard.colRiskLevel") || "Risk")}</option>
                  <option value="Low">{t("priority.low") + " " + (t("dashboard.colRiskLevel") || "Risk")}</option>
                </select>
              </>
            )}
            <button onClick={() => { setFsSearch(""); setFsCatFilter("All"); setFsRiskFilter("All"); }} className="sm2-fs-reset-btn">
              {t("analytics.reset") || "Reset"}
            </button>
            <div className="sm2-fs-counter">
              {fullscreenChart === "station" && (
                <>{t("analytics.showing") || "Showing"} <strong>{filteredFsStations.length}</strong> {t("analytics.of") || "of"} {stationStats.length} {t("sidebar.stations") || "stations"}</>
              )}
              {fullscreenChart === "grade" && (
                <>{t("analytics.showing") || "Showing"} <strong>{filteredFsUsers.length}</strong> {t("analytics.of") || "of"} {users.filter(u=>u.role==="Pointsman").length} {t("sidebar.pointsmen") || "Pointsmen"}</>
              )}
              {fullscreenChart === "trend" && (
                <>{t("analytics.showing") || "Showing"} <strong>{MONTHLY.length}</strong> {t("analytics.monthlyTrendDeepDive") || "monthly cycles"}</>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="sm2-fullscreen-content">
            
            {/* KPI Cards Row */}
            <div className="sm2-fs-kpi-row">
              {fullscreenChart === "station" && (
                <>
                  {[
                    { label: "Avg Performance Score", value: filteredFsStations.length ? Math.round(filteredFsStations.reduce((s,x)=>s+x.avgScore,0)/filteredFsStations.length) + "%" : "—", color: "#2563eb", glowColor: "rgba(37,99,235,0.15)" },
                    { label: "Avg Safety Compliance", value: filteredFsStations.length ? Math.round(filteredFsStations.reduce((s,x)=>s+x.safetyPct,0)/filteredFsStations.length) + "%" : "—", color: "#7c3aed", glowColor: "rgba(124,58,237,0.15)" },
                    { label: "High-Risk Stations", value: filteredFsStations.filter(st => st.highRisk >= 2).length, color: "#dc2626", glowColor: "rgba(220,38,38,0.15)" },
                    { label: "Grade A Stations", value: filteredFsStations.filter(st => getCat(st.avgScore) === "A").length, color: "#16a34a", glowColor: "rgba(22,163,74,0.15)" },
                    { label: "Total Filtered Stations", value: filteredFsStations.length, color: "#0891b2", glowColor: "rgba(8,145,178,0.15)" },
                  ].map(k => (
                    <div key={k.label} className="sm2-fs-kpi-card" style={{ "--glow": k.glowColor }}>
                      <div className="sm2-fs-kpi-value" style={{ color: k.color }}>{k.value}</div>
                      <div className="sm2-fs-kpi-label">{k.label}</div>
                    </div>
                  ))}
                </>
              )}

              {fullscreenChart === "trend" && (
                <>
                  {[
                    { label: "Total Tests Taken", value: MONTHLY.reduce((s,x)=>s+x.assessments,0), color: "#2563eb", glowColor: "rgba(37,99,235,0.15)" },
                    { label: "Overall Score Average", value: Math.round(MONTHLY.reduce((s,x)=>s+x.avgScore,0)/MONTHLY.length) + "%", color: "#0891b2", glowColor: "rgba(8,145,178,0.15)" },
                    { label: "Overall Safety Average", value: Math.round(MONTHLY.reduce((s,x)=>s+x.safetyAvg,0)/MONTHLY.length) + "%", color: "#16a34a", glowColor: "rgba(22,163,74,0.15)" },
                    { label: "Safety Compliance Peak", value: Math.max(...MONTHLY.map(m=>m.safetyAvg)) + "%", color: "#7c3aed", glowColor: "rgba(124,58,237,0.15)" },
                    { label: "Evaluation Cycles Logged", value: MONTHLY.length, color: "#475569", glowColor: "rgba(71,85,105,0.15)" },
                  ].map(k => (
                    <div key={k.label} className="sm2-fs-kpi-card" style={{ "--glow": k.glowColor }}>
                      <div className="sm2-fs-kpi-value" style={{ color: k.color }}>{k.value}</div>
                      <div className="sm2-fs-kpi-label">{k.label}</div>
                    </div>
                  ))}
                </>
              )}

              {fullscreenChart === "grade" && (
                <>
                  {[
                    { label: "Avg Personnel Score", value: filteredFsUsers.length ? Math.round(filteredFsUsers.reduce((s,x)=>s+x.score,0)/filteredFsUsers.length) + "%" : "—", color: "#2563eb", glowColor: "rgba(37,99,235,0.15)" },
                    { label: "Fit (PME Status)", value: filteredFsUsers.filter(u => u.pmeStatus === "Fit").length, color: "#16a34a", glowColor: "rgba(22,163,74,0.15)" },
                    { label: "Cleared (REF Status)", value: filteredFsUsers.filter(u => u.refStatus === "Cleared").length, color: "#0891b2", glowColor: "rgba(8,145,178,0.15)" },
                    { label: "Grade A Personnel", value: filteredFsUsers.filter(u => getCat(u.score) === "A").length, color: "#7c3aed", glowColor: "rgba(124,58,237,0.15)" },
                    { label: "High Risk Staff Count", value: filteredFsUsers.filter(u => u.pmeStatus === "Overdue" || u.refStatus === "Expired" || u.score < 50).length, color: "#dc2626", glowColor: "rgba(220,38,38,0.15)" },
                  ].map(k => (
                    <div key={k.label} className="sm2-fs-kpi-card" style={{ "--glow": k.glowColor }}>
                      <div className="sm2-fs-kpi-value" style={{ color: k.color }}>{k.value}</div>
                      <div className="sm2-fs-kpi-label">{k.label}</div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Scaled High-Fidelity Chart */}
            <div className="sm2-fs-chart-container" style={{ background: "#ffffff", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", color: "#0f172a" }}>
                {fullscreenChart === "station" && "📊 Station-wise Safety Compliance & Performance Comparison"}
                {fullscreenChart === "trend"   && "📈 Monthly Safety Audits & Compliance Volumes"}
                {fullscreenChart === "grade"   && "ðŸ … Staff Grading Allocation Matrix"}
              </h3>
              <div className="sm2-fs-chart-wrapper" style={{ width: "100%", height: "380px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  {fullscreenChart === "station" ? (
                    <BarChart data={fsStBarData} margin={{ top: 8, right: 10, left: -10, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b", fontWeight: 700 }}/>
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false}/>
                      <Tooltip content={<TiTooltip/>}/>
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12 }}/>
                      <Bar dataKey="avgScore" name="Avg Performance Score (%)" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={38}/>
                      <Bar dataKey="safetyPct" name="Safety Compliance Rate (%)" fill="#7c3aed" radius={[4, 4, 0, 0]} maxBarSize={38}/>
                    </BarChart>
                  ) : fullscreenChart === "trend" ? (
                    <LineChart data={MONTHLY} margin={{ top: 8, right: 10, left: -24, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}/>
                      <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false}/>
                      <Tooltip content={<TiTooltip/>}/>
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12 }}/>
                      <Line type="monotone" dataKey="assessments" name="Tests Taken" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                      <Line type="monotone" dataKey="safetyAvg" name="Safety Compliance Avg" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  ) : (
                    <PieChart>
                      <Pie data={fsPieData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} dataKey="value" paddingAngle={4}>
                        {fsPieData.map((e,i)=><Cell key={e.name} fill={PIE_C[i]}/>)}
                      </Pie>
                      <Tooltip formatter={(v,n,p)=>[`${v} Staff`,`Category ${p.payload.name}`]}/>
                      <Legend formatter={(v,e)=>`Grade ${e.payload.name} — ${e.payload.value} staff`} iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 13 }}/>
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Deep-Dive Grid/Table List */}
            <div className="sm2-fs-low-perf-section" style={{ background: "#ffffff", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
                🔎 Detailed Evaluation Ledger
              </h3>
              
              {fullscreenChart === "station" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
                  {filteredFsStations.map(st => {
                    const level = st.highRisk >= 2 ? "High" : st.highRisk > 0 ? "Medium" : "Low";
                    return (
                      <div key={st.id} className="ti2-highlight-card" style={{ borderTop: `4px solid ${RISK_C[level]}`, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "130px", background: "#f8fafc", padding: "16px", boxSizing: "border-box" }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <strong style={{ fontSize: "14px", color: "#0f172a" }}>{st.name} ({st.code})</strong>
                            <span className="ti2-badge" style={{ background: RISK_B[level], color: RISK_C[level] }}>{level} Risk</span>
                          </div>
                          <div style={{ fontSize: "12px", color: "#64748b", display: "flex", gap: "10px", marginTop: "8px" }}>
                            <span>Avg Score: <strong>{st.avgScore}%</strong></span>
                            <span>Compliance: <strong>{st.safetyPct}%</strong></span>
                          </div>
                        </div>
                        <button
                          onClick={() => { setSelectedStation(st); setActivePage("stations"); setFullscreenChart(null); }}
                          className="ti2-link-btn-sm"
                          style={{ width: "100%", justifyContent: "center", marginTop: "12px", background: "#ffffff" }}
                        >
                          View Station Analytics →
                        </button>
                      </div>
                    );
                  })}
                  {filteredFsStations.length === 0 && (
                    <p style={{ color: "#64748b", fontSize: "13px", textAlign: "center", gridColumn: "1/-1", padding: "20px 0" }}>No stations match your current filters.</p>
                  )}
                </div>
              )}

              {fullscreenChart === "trend" && (
                <div className="ti2-table-wrap">
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1.5fr 2fr", padding: "10px 14px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontWeight: "700", fontSize: "11px" }}>
                    <span>Evaluation Period</span>
                    <span>Assessments Volume</span>
                    <span>Performance Avg (%)</span>
                    <span>Safety Compliance Rating</span>
                  </div>
                  {MONTHLY.map(m => (
                    <div key={m.month} style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1.5fr 2fr", padding: "12px 14px", borderBottom: "1px solid #f1f5f9", fontSize: "13px" }}>
                      <strong>{m.month}</strong>
                      <span>{m.assessments} tests administered</span>
                      <span>{m.avgScore}% avg</span>
                      <strong style={{ color: m.safetyAvg >= 80 ? "#16a34a" : "#ea580c" }}>{m.safetyAvg}% compliance</strong>
                    </div>
                  ))}
                </div>
              )}

              {fullscreenChart === "grade" && (
                <div className="ti2-table-wrap">
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1.2fr 1fr 1fr", padding: "10px 14px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontWeight: "700", fontSize: "11px" }}>
                    <span>Pointsman Name</span>
                    <span>Staff ID</span>
                    <span>Station Location</span>
                    <span>PME Status</span>
                    <span>REF Status</span>
                    <span>Evaluation Score</span>
                  </div>
                  {filteredFsUsers.map(u => {
                    const grade = getCat(u.score);
                    return (
                      <div key={u.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1.2fr 1fr 1fr", padding: "12px 14px", borderBottom: "1px solid #f1f5f9", fontSize: "13px", alignItems: "center" }}>
                        <strong>{u.name}</strong>
                        <span style={{ fontFamily: "monospace" }}>{u.id}</span>
                        <span>{u.station}</span>
                        <span style={{ color: u.pmeStatus === "Fit" ? "#16a34a" : "#dc2626", fontWeight: "600" }}>{u.pmeStatus}</span>
                        <span style={{ color: u.refStatus === "Cleared" ? "#16a34a" : "#dc2626", fontWeight: "600" }}>{u.refStatus}</span>
                        <strong><span className="ti2-badge" style={{ background: CAT_B[grade], color: CAT_C[grade] }}>Grade {grade} ({u.score}%)</span></strong>
                      </div>
                    );
                  })}
                  {filteredFsUsers.length === 0 && (
                    <p style={{ color: "#64748b", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>No personnel match your current filters.</p>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
      
    </div>
  );
}