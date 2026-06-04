import React, { useMemo, useState } from "react";
import {
  BarChart3, Building2, ClipboardList, FileBarChart2, LogOut,
  Search, ShieldCheck, UserRound, Users, UserCheck, TrainFront,
  Plus, Edit, Trash2, ArrowRightLeft, ArrowLeft, TrendingUp,
  AlertTriangle, CheckCircle, Clock, XCircle, Activity,
  MapPin, Phone, Calendar, Award, UserPlus, FileText
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
  LineChart, Line, LabelList
} from "recharts";
import "./sdom.css";
import SADashboard from "./components/SuperAdminModule/SADashboard";
import UserProfile from "./components/UserProfile";
import CommonRoleView from "./components/CommonRoleView";
import CommonLayout from "./components/CommonLayout";
import SAStations from "./components/SuperAdminModule/SAStations";
import SARecords from "./components/SuperAdminModule/SARecords";
import CommonReports from "./components/CommonReports";

/* ═══════════════════════════════════════════
   DUMMY DATA
   ═══════════════════════════════════════════ */

const NAV = [
  { key: "dashboard",  label: "Dashboard",                icon: BarChart3 },
  { key: "hierarchy",  label: "Staff Hierarchy",          icon: Users },
  { key: "stations",   label: "Stations",                 icon: Building2 },
  { key: "records",    label: "Assessment Records",       icon: ClipboardList },
  { key: "reports",    label: "Reports & Analytics",      icon: FileBarChart2 },
  { key: "profile",    label: "My Profile",               icon: Award },
];


// Enterprise palette — navy/slate only
const CHART_NAVY  = ["#1E3A5F","#2B6CB0","#4A90D9","#7EB3D8","#BFD7ED"];
const CAT_COLORS  = { A: "#1E3A5F", B: "#2B6CB0", C: "#D69E2E", D: "#C53030" };
const RISK_COLORS = { Low: "#2F855A", Medium: "#D69E2E", High: "#C53030" };
const STATUS_COLORS = { Approved: "#2F855A", Pending: "#D69E2E", Rejected: "#C53030", Overdue: "#9B2C2C" };

const generateUnified96Stations = () => {
  const baseStations = [
    { name: "Nagpur Junction", code: "NGP", ti: "TI NGP", smCount: 4, pmCount: 86, score: 91, safety: 96, highRisk: 2, pending: 4 },
    { name: "Parbhani Junction", code: "PBN", ti: "TI PAR", smCount: 3, pmCount: 58, score: 86, safety: 92, highRisk: 3, pending: 6 },
    { name: "Amla", code: "AMLA", ti: "TI AMLA", smCount: 2, pmCount: 41, score: 78, safety: 84, highRisk: 5, pending: 9 },
    { name: "Wardha", code: "WR", ti: "TI NGP", smCount: 2, pmCount: 32, score: 88, safety: 90, highRisk: 1, pending: 3 },
    { name: "Betul", code: "BZU", ti: "TI AMLA", smCount: 2, pmCount: 28, score: 74, safety: 79, highRisk: 7, pending: 12 },
    { name: "Purna", code: "PUU", ti: "TI PAR", smCount: 2, pmCount: 38, score: 82, safety: 87, highRisk: 4, pending: 7 },
    { name: "Ajni", code: "AJN", ti: "TI NGP", smCount: 1, pmCount: 18, score: 93, safety: 97, highRisk: 0, pending: 1 },
    { name: "Kamptee", code: "KTE", ti: "TI NGP", smCount: 1, pmCount: 14, score: 89, safety: 93, highRisk: 1, pending: 2 },
    { name: "Multai", code: "MAI", ti: "TI AMLA", smCount: 1, pmCount: 12, score: 71, safety: 76, highRisk: 8, pending: 15 },
    { name: "Jintur", code: "JNR", ti: "TI PAR", smCount: 1, pmCount: 16, score: 84, safety: 88, highRisk: 2, pending: 5 }
  ];

  const names = [
    "Sevagram", "Dhamangaon", "Pulgaon", "Badnera Town", "Murtajapur", "Shegaon", "Malkapur", "Jalgaon Junction",
    "Chalisgaon", "Dongargarh", "Gondia Jn", "Durg Jn", "Raipur Jn", "Bilaspur Jn", "Lonavala", "Shivajinagar",
    "Khadki", "Dapodi", "Chinchwad", "Pimpri", "Taloja", "Dehu Road", "Khadala", "Daund Jn", "Ahmednagar",
    "Kopargaon", "Sainagar Shirdi", "Satara", "Kolhapur", "Sangli", "Miraj Jn", "Londa", "Ghatprabha",
    "Byculla", "Dadar Central", "Kurla Jn", "Ghatkopar", "Thane Main", "Diva Jn", "Dombivli", "Kalyan Jn",
    "Shahad", "Ambivali", "Titwala", "Ulhasnagar", "Vithalwadi", "Badlapur", "Vashi", "Karjat Jn", "Igatpuri",
    "Bhandup", "Mulund", "Solapur Jn", "Kurduvadi Jn", "Pandharpur", "Latur Town", "Osmanabad", "Barsi Town",
    "Bhusawal Jn", "Nashik Road", "Manmad Jn", "Burhanpur", "Khandwa Jn", "Harda", "Devlali", "Khamgaon",
    "Pachora", "Nandurbar", "Amravati", "Chandrapur", "Ballarshah", "Wardha East", "Sindi Town", "Butibori",
    "Kalmeshwar", "Katol", "Narkher", "Pandhurna", "Ghoradongri", "Itarsi West", "Hoshangabad", "Budni",
    "Obaidullaganj", "Mandideep", "Visapur", "Partur", "Mudkhed", "Parli Vaijnath", "Vikarabad", "Aurangabad"
  ];
  
  const tis = ["TI NGP", "TI PAR", "TI AMLA"];
  const res = [];
  
  for (let i = 0; i < 10; i++) {
    res.push({
      id: `ST_${1001 + i}`,
      ...baseStations[i]
    });
  }
  
  for (let i = 10; i < 96; i++) {
    const name = names[(i - 10) % names.length];
    const code = name.replace(/[^A-Z]/g, "").substring(0, 4) || name.substring(0, 3).toUpperCase();
    let assignedTi = "";
    if (i < 20) {
      assignedTi = "TI NGP";
    } else {
      assignedTi = i % 2 === 0 ? "TI PAR" : "TI AMLA";
    }
    const smCount = 1 + (i % 3);
    const pmCount = 10 + ((i * 7) % 80);
    const score = 70 + ((i * 3) % 28);
    const safety = 75 + ((i * 2) % 24);
    const highRisk = (i * 3) % 9;
    const pending = 1 + ((i * 5) % 15);
    res.push({
      id: `ST_${1001 + i}`,
      name,
      code: code + `_${10 + i}`,
      ti: assignedTi,
      smCount,
      pmCount,
      score,
      safety,
      highRisk,
      pending
    });
  }
  return res;
};

const UNIFIED_96_STATIONS = generateUnified96Stations();

const generate96Stations = () => {
  const divisionMap = {
    Nagpur: ["NGP", "WR", "BD", "AK", "SEGM", "AJNI", "PLO", "DMN", "MZR", "SEG", "MKU", "JL", "CSN", "ET"],
    Pune: ["PUNE", "LNL", "SVJR", "KK", "DAPD", "CCH", "PMP", "TGN", "DEHR", "KAD", "DD", "ANG", "KPG", "SNSI", "STR"],
    Mumbai: ["CSMT", "BY", "DR", "CLA", "GC", "TNA", "DIVA", "DI", "KYN", "SHAD", "ABY", "AMR", "ULNR", "VLDI"],
    Solapur: ["SUR", "KWV", "PVR", "LUR", "UMD", "BTW"],
    Bhusawal: ["BSL", "NK", "MMR", "JL", "BAU", "KNW", "HD", "DVL"]
  };

  const stationsData = [];
  const divisions = Object.keys(divisionMap);
  const categories = ["A", "B", "C", "D"];
  const risks = ["Low", "Medium", "High"];
  const statuses = ["Approved", "Pending", "Completed"];
  
  const baseNames = [
    "Nagpur Main", "Wardha Junction", "Badnera Town", "Akola Junction", "Sewagram", "Ajni Central", 
    "Pulgaon", "Dhamangaon", "Murtajapur", "Shegaon", "Malkapur", "Jalgaon Junction", "Chalisgaon", 
    "Itarsi Jn", "Bhopal Junction", "Dongargarh", "Gondia Jn", "Durg Jn", "Raipur Jn", "Bilaspur Jn",
    "Pune Junction", "Lonavala", "Shivajinagar", "Khadki", "Dapodi", "Chinchwad", "Pimpri", 
    "Taloja", "Dehu Road", "Khadala", "Daund Jn", "Ahmednagar", "Kopargaon", "Sainagar Shirdi", 
    "Satara", "Kolhapur", "Sangli", "Miraj Jn", "Londa", "Ghatprabha",
    "CSMT Terminal", "Byculla", "Dadar Central", "Kurla Jn", "Ghatkopar", "Thane Main", "Diva Jn", 
    "Dombivli", "Kalyan Jn", "Shahad", "Ambivali", "Titwala", "Ulhasnagar", "Vithalwadi", "Badlapur", 
    "Vashi", "Karjat Jn", "Igatpuri", "Bhandup", "Mulund",
    "Solapur Jn", "Kurduvadi Jn", "Pandharpur", "Latur Town", "Osmanabad", "Barsi Town",
    "Bhusawal Jn", "Nashik Road", "Manmad Jn", "Burhanpur", "Khandwa Jn", "Harda", "Devlali", 
    "Khamgaon", "Pachora", "Nandurbar", "Amravati", "Chandrapur", "Ballarshah", "Wardha East",
    "Sindi Town", "Butibori", "Kalmeshwar", "Katol", "Narkher", "Pandhurna", "Multai", "Amla Jn",
    "Betul", "Ghoradongri", "Itarsi West", "Hoshangabad", "Budni", "Obaidullaganj", "Mandideep"
  ];

  for (let i = 0; i < 96; i++) {
    const division = divisions[i % divisions.length];
    const codeList = divisionMap[division];
    const code = codeList[Math.floor(i / divisions.length) % codeList.length] + `_${10 + Math.floor(i/10)}`;
    const name = baseNames[i % baseNames.length];
    const completed = 200 + ((i * 17) % 600);
    const pending = 15 + ((i * 11) % 130);
    const avgScore = 72 + ((i * 3) % 25);
    const category = categories[i % categories.length];
    const riskLevel = i % 7 === 0 ? "High" : i % 3 === 0 ? "Medium" : "Low";
    const assessmentStatus = statuses[i % statuses.length];
    
    const day = 10 + (i % 45);
    const lastUpdatedDate = `2026-04-${day < 10 ? "0" + day : day}`;

    stationsData.push({
      id: `ST_${1001 + i}`,
      stationName: name,
      stationCode: code,
      division,
      zone: "CR",
      completed,
      pending,
      avgScore,
      category,
      riskLevel,
      assessmentStatus,
      lastUpdatedDate
    });
  }
  return stationsData;
};

const DASHBOARD_96_STATIONS = generate96Stations();

const stationProgressData = [
  { station: "Nagpur", completed: 450, pending: 100 },
  { station: "Wardha", completed: 490, pending: 130 },
  { station: "Badnera", completed: 530, pending: 160 },
  { station: "Akola", completed: 570, pending: 190 },
  { station: "Yavatmal", completed: 610, pending: 220 },
  { station: "Parbhani", completed: 640, pending: 250 },
  { station: "Parli Vaijnath", completed: 680, pending: 95 },
  { station: "Latur", completed: 710, pending: 130 },
  { station: "Vikarabad", completed: 750, pending: 160 },
  { station: "Aurangabad", completed: 790, pending: 190 },
  { station: "Pundlik", completed: 830, pending: 210 },
  { station: "Jalna", completed: 860, pending: 240 },
  { station: "Partur", completed: 440, pending: 90 },
  { station: "Mudkhed", completed: 480, pending: 120 },
  { station: "Visapur", completed: 510, pending: 150 }
];

const stationAverageScoreData = [
  { station: "Nagpur", avgScore: 86 },
  { station: "Pune", avgScore: 89 },
  { station: "Delhi", avgScore: 84 },
  { station: "Mumbai", avgScore: 88 },
  { station: "Jalna", avgScore: 91 },
  { station: "Parbhani", avgScore: 82 }
];

const ALL_STAFF = [
  // Pointsmen
  { id:"PM_1001", name:"K. Pawar",     role:"pointsmen", station:"Parbhani Junction", ti:"TI PAR",  cat:"A", risk:"Low",    score:86, contact:"8888811111", lastDate:"2026-04-10", status:"Approved" },
  { id:"PM_1002", name:"R. Verma",     role:"pointsmen", station:"Amla",              ti:"TI AMLA", cat:"B", risk:"Medium", score:78, contact:"8888822222", lastDate:"2026-04-07", status:"Pending"  },
  { id:"PM_1003", name:"J. Shaikh",    role:"pointsmen", station:"Nagpur Junction",   ti:"TI NGP",  cat:"A", risk:"Low",    score:91, contact:"8888833333", lastDate:"2026-04-05", status:"Approved" },
  { id:"PM_1004", name:"D. More",      role:"pointsmen", station:"Betul",             ti:"TI AMLA", cat:"C", risk:"High",   score:55, contact:"8888844444", lastDate:"2026-03-20", status:"Rejected" },
  { id:"PM_1005", name:"A. Ghule",     role:"pointsmen", station:"Wardha",            ti:"TI NGP",  cat:"A", risk:"Low",    score:90, contact:"8888855555", lastDate:"2026-04-12", status:"Approved" },
  { id:"PM_1006", name:"S. Bhosale",   role:"pointsmen", station:"Purna",             ti:"TI PAR",  cat:"B", risk:"Medium", score:76, contact:"8888866666", lastDate:"2026-04-08", status:"Pending"  },
  // Station Masters
  { id:"SM_2101", name:"S. Deshmukh",  role:"sm",        station:"Parbhani Junction", ti:"TI PAR",  cat:"A", risk:"Low",    score:88, contact:"9999955555", lastDate:"2026-04-01", status:"Approved" },
  { id:"SM_2201", name:"M. Patil",     role:"sm",        station:"Amla",              ti:"TI AMLA", cat:"B", risk:"Medium", score:76, contact:"9999966666", lastDate:"2026-03-15", status:"Pending"  },
  { id:"SM_2301", name:"D. Nair",      role:"sm",        station:"Nagpur Junction",   ti:"TI NGP",  cat:"A", risk:"Low",    score:94, contact:"9999977777", lastDate:"2026-04-15", status:"Approved" },
  { id:"SM_2302", name:"K. Solanki",   role:"sm",        station:"Nagpur Junction",   ti:"TI NGP",  cat:"A", risk:"Low",    score:90, contact:"9999978888", lastDate:"2026-04-12", status:"Approved" },
  { id:"SM_2303", name:"L. Raut",      role:"sm",        station:"Nagpur Junction",   ti:"TI NGP",  cat:"B", risk:"Low",    score:78, contact:"9999979999", lastDate:"2026-03-22", status:"Pending"  },
  // Station Superintendents
  { id:"SS_001",  name:"R. Desai",     role:"ss",        station:"Nagpur Junction",   ti:"TI NGP",  cat:"A", risk:"Low",    score:92, contact:"9999911111", lastDate:"2026-04-18", status:"Approved" },
  { id:"SS_002",  name:"M. Kulkarni",  role:"ss",        station:"Parbhani Junction", ti:"TI PAR",  cat:"A", risk:"Low",    score:87, contact:"9999922222", lastDate:"2026-04-10", status:"Approved" },
  // Train Managers
  { id:"TM_3001", name:"V. Sharma",    role:"tm",        station:"Nagpur Junction",   ti:"TI NGP",  cat:"A", risk:"Low",    score:89, contact:"9999988888", lastDate:"2026-04-14", status:"Approved" },
  { id:"TM_3002", name:"P. Jadhav",    role:"tm",        station:"Amla",              ti:"TI AMLA", cat:"C", risk:"High",   score:52, contact:"9999999999", lastDate:"2026-03-10", status:"Rejected" },
  // Traffic Inspectors
  { id:"TI_1001", name:"R. Khan",      role:"ti",        station:"Parbhani Junction", ti:"TI PAR",  cat:"A", risk:"Low",    score:88, contact:"9999933333", lastDate:"2026-04-09", status:"Approved" },
  { id:"TI_1002", name:"A. Kulkarni",  role:"ti",        station:"Amla",              ti:"TI AMLA", cat:"B", risk:"Medium", score:77, contact:"9999944444", lastDate:"2026-04-08", status:"Pending"  },
  { id:"TI_1003", name:"S. Verma",     role:"ti",        station:"Nagpur Junction",   ti:"TI NGP",  cat:"A", risk:"Low",    score:91, contact:"9999955566", lastDate:"2026-04-06", status:"Approved" },
];

const MONTHLY_TREND = [
  { month:"Dec'25", score:81, safety:80 },
  { month:"Jan'26", score:83, safety:82 },
  { month:"Feb'26", score:85, safety:85 },
  { month:"Mar'26", score:87, safety:88 },
  { month:"Apr'26", score:89, safety:91 },
  { month:"May'26", score:91, safety:94 },
];

const ASSESSMENT_MONTHLY = [
  { month:"Nov", approved:380, pending:60, rejected:18, overdue:12 },
  { month:"Dec", approved:410, pending:55, rejected:22, overdue:15 },
  { month:"Jan", approved:440, pending:70, rejected:19, overdue:10 },
  { month:"Feb", approved:460, pending:65, rejected:21, overdue:9 },
  { month:"Mar", approved:490, pending:58, rejected:17, overdue:8 },
  { month:"Apr", approved:520, pending:68, rejected:20, overdue:11 },
];

const ACTIVITY = [
  { text:"PM_1003 J. Shaikh assessment approved by TI NGP.", time:"10 mins ago", color:"#16a34a" },
  { text:"SM_2201 M. Patil assessment pending TI review at Amla.", time:"45 mins ago", color:"#d97706" },
  { text:"New pointsman PM_1007 N. Bhagat added at Wardha station.", time:"2 hrs ago", color:"#2563eb" },
  { text:"TI_1001 R. Khan completed monthly inspection report.", time:"4 hrs ago", color:"#2563eb" },
  { text:"PM_1004 D. More assessment rejected — sent for counselling.", time:"6 hrs ago", color:"#dc2626" },
  { text:"SS_001 R. Desai quarterly review completed.", time:"Yesterday", color:"#16a34a" },
];

const COMPLIANCE = [
  { label:"Overall Safety Compliance",      pct:91, color:"#16a34a" },
  { label:"PME Completion Rate",            pct:87, color:"#2563eb" },
  { label:"REF Completion Rate",            pct:83, color:"#7c3aed" },
  { label:"Incident Reporting Compliance",  pct:94, color:"#0891b2" },
  { label:"Disciplinary Clean Record",      pct:96, color:"#16a34a" },
];

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */
function riskBadge(r) {
  const map = { Low:"sdom-badge-success", Medium:"sdom-badge-warning", High:"sdom-badge-danger" };
  return <span className={`sdom-badge ${map[r] || "sdom-badge-neutral"}`}>{r}</span>;
}
function catBadge(c) {
  const map = { A:"sdom-badge-success", B:"sdom-badge-info", C:"sdom-badge-warning", D:"sdom-badge-danger" };
  return <span className={`sdom-badge ${map[c] || "sdom-badge-neutral"}`}>{c}</span>;
}
function statusBadge(s) {
  const map = { Approved:"sdom-badge-success", Pending:"sdom-badge-warning", Rejected:"sdom-badge-danger", Overdue:"sdom-badge-danger" };
  return <span className={`sdom-badge ${map[s] || "sdom-badge-neutral"}`}>{s}</span>;
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="sdom-section-title">{children}</div>
      {sub && <div style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: -10 }}>{sub}</div>}
    </div>
  );
}

const superAdminProfile = {
  designation: "Senior Divisional Operations Manager (Sr. DOM)",
  hrmsId: "SA_1001",
  contact: "+91 98220 99001",
  email: "srdom.ngp@rail.in",
  zone: "Central Railway",
  division: "Nagpur",
  stationName: "Nagpur Division HQ",
  reportingOfficer: "Zonal Chief Operations Manager (COM)",
  pmeStatus: "AUDITED: 2026-05-20 (Due: 2026-06-20)",
  refStatus: "COMPLETED: Executive Safety Training (2025-10-12)",
  trainingStatus: "ACTIVE: Zonal Operations Review Completed (2026-04-18)"
};

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
/* ── Helper functions ── */
function getCategoryColor(cat) {
  const map = { A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#dc2626" };
  return map[cat] || "#64748b";
}
function getCategoryBg(cat) {
  const map = { A: "#dcfce7", B: "#dbeafe", C: "#fef3c7", D: "#fee2e2" };
  return map[cat] || "#f1f5f9";
}
function isRoleAssessmentOverdue(s) { return s.status === "Overdue"; }
function isRolePmeOverdue(s) { return false; }
function isRoleRefOverdue(s) { return false; }
function getOverdueCount(arr) { return arr ? arr.filter(s => s.status === "Overdue").length : 0; }
function getAverageScore(arr) {
  if (!arr || !arr.length) return 0;
  return Math.round(arr.reduce((s, x) => s + (x.score || 0), 0) / arr.length);
}
function openScorecard(rec) { /* stub — SA doesn't open scorecards */ }

export default function SuperAdminModule({ user, onLogout }) {
  const fullName = user?.name || "Super Admin User";
  const employeeId = user?.hrmsId || "SA_1001";
  const latestScore = 84;
  const latestCategory = "A";
  const averageScore = 84;
  const complianceRate = 91;
  const [page, setPage]     = useState("dashboard");
  const [activeHierarchyTab, setActiveHierarchyTab] = useState("pointsmen");
  const [view, setView]     = useState(null); // { type, data } for drill-down pages
  const [staff, setStaff]   = useState(ALL_STAFF);
  const [stations, setStations] = useState(UNIFIED_96_STATIONS);
  const [showAddStation, setShowAddStation] = useState(false);
  const [newStName, setNewStName] = useState("");
  const [newStCode, setNewStCode] = useState("");
  const [newStTi, setNewStTi] = useState("TI NGP");
  const [modal, setModal]   = useState(null); // add/edit form

  // Filters
  const [roleF, setRoleF]   = useState({ name:"", station:"All", ti:"All", cat:"All", risk:"All" });
  const [stF,   setStF]     = useState({ name:"" });
  const [recF,  setRecF]    = useState({ role:"All", station:"All", status:"All", name:"" });
  const [repF,  setRepF]    = useState({ role:"All", station:"All", cat:"All", risk:"All", ti:"All" });
  const [repApplied, setRepApplied] = useState(false);
  const [selectedReportUserId, setSelectedReportUserId] = useState(null);

  // Chart Zoom Modal states (for showing the 96 stations graphical trends)
  const [isChartZoomModalOpen, setIsChartZoomModalOpen] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState("progress"); // "progress", "score", or "category"
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

  const handleChartClick = (state, chartType) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      const clickedStationName = state.activePayload[0].payload.station;
      if (clickedStationName) {
        setZoomPopupSearch(clickedStationName);
      }
      setSelectedChartType(chartType);
      setIsChartZoomModalOpen(true);
      setZoomPopupPage(1);
    } else {
      setSelectedChartType(chartType);
      setIsChartZoomModalOpen(true);
      setZoomPopupPage(1);
    }
  };

  const handlePieClick = (data) => {
    if (data && data.name) {
      const catLetter = data.name.replace("Category ", "").trim();
      setZoomPopupCategory(catLetter);
    } else {
      setZoomPopupCategory("All");
    }
    setSelectedChartType("category");
    setIsChartZoomModalOpen(true);
    setZoomPopupPage(1);
  };

  const STATION_OPTS = useMemo(() => ["All", ...stations.map(s => s.name)], [stations]);
  const TI_OPTS      = ["All","TI PAR","TI AMLA","TI NGP"];
  const ROLE_OPTS    = ["All","Pointsman","Station Master","Station Superintendent","Train Manager","Traffic Inspector"];
  const ROLE_MAP     = { pointsmen:"Pointsman", sm:"Station Master", ss:"Station Superintendent", tm:"Train Manager", ti:"Traffic Inspector" };

  /* ------- navigation ------- */
  function navigate(p) {
    setPage(p);
    setView(null);
    setSelectedReportUserId(null);
    setRoleF({ name:"", station:"All", ti:"All", cat:"All", risk:"All" });
  }
  function openView(type, data) { setView({ type, data }); }
  function closeView()           { setView(null); }

  const handleAddStation = () => {
    if (!newStName.trim() || !newStCode.trim()) {
      alert("Please enter both Station Name and Station Code.");
      return;
    }
    const newStation = {
      id: `ST_${Date.now()}`,
      name: newStName.trim(),
      code: newStCode.trim().toUpperCase(),
      ti: newStTi,
      smCount: 0,
      pmCount: 0,
      score: 80,
      safety: 100,
      highRisk: 0,
      pending: 0
    };
    setStations(prev => [newStation, ...prev]);
    setShowAddStation(false);
  };

  /* ------- CRUD ------- */
  function openAdd(role) {
    setModal({
      mode: "add",
      role,
      data: {
        id: `EMP_${Date.now()}`,
        name: "",
        station: stations[0].name,
        ti: "TI PAR",
        cat: "A",
        risk: "Low",
        score: 0,
        contact: "",
        lastDate: "",
        status: "Pending",
        email: "",
        division: "Nagpur",
        zone: "Central Railway",
        // Role-specific defaults matching AOmModule.jsx
        reportingSm: "",
        workLocation: "",
        shift: "",
        smStation: stations[0].name,
        smZone: "Central Railway",
        smDivision: "Nagpur",
        jurisdiction: "Nagpur Division",
        reportingAom: "P. K. Verma (Sr. DOM)",
        linkedStations: ""
      }
    });
  }
  function openEdit(s) {
    setModal({ mode:"edit", role:s.role, data:{ ...s } });
  }
  function openShift(s) {
    setModal({ mode:"shift", role:s.role, data:{ ...s } });
  }
  function saveModal() {
    if (!modal.data.name || !modal.data.id) return;
    if (modal.mode === "add") {
      setStaff(p => [...p, { ...modal.data, role: modal.role }]);
    } else {
      setStaff(p => p.map(s => s.id === modal.data.id ? { ...modal.data, role: modal.role } : s));
    }
    setModal(null);
  }
  function removeStaff(id) {
    if (window.confirm("Remove this staff member?")) setStaff(p => p.filter(s => s.id !== id));
  }

  /* ------- filtered data ------- */
  function filterByRole(roleKey) {
    return staff.filter(s =>
      s.role === roleKey &&
      (roleF.station === "All" || s.station === roleF.station) &&
      (roleF.ti      === "All" || s.ti      === roleF.ti)      &&
      (roleF.cat     === "All" || s.cat     === roleF.cat)     &&
      (roleF.risk    === "All" || s.risk    === roleF.risk)    &&
      (!roleF.name || s.name.toLowerCase().includes(roleF.name.toLowerCase()) ||
                      s.id.toLowerCase().includes(roleF.name.toLowerCase()))
    );
  }

  const recFiltered = useMemo(() => {
    const hasFilter = recF.role !== "All" || recF.station !== "All" || recF.status !== "All" || recF.name;
    if (!hasFilter) return null;
    return staff.filter(s => {
      const roleLabel = ROLE_MAP[s.role] || s.role;
      return (recF.role    === "All" || roleLabel === recF.role)      &&
             (recF.station === "All" || s.station === recF.station)   &&
             (recF.status  === "All" || s.status  === recF.status)    &&
             (!recF.name   || s.name.toLowerCase().includes(recF.name.toLowerCase()));
    });
  }, [recF, staff]);

  const repFiltered = useMemo(() => {
    if (!repApplied) return null;
    return staff.filter(s => {
      const roleLabel = ROLE_MAP[s.role] || s.role;
      return (repF.role    === "All" || roleLabel === repF.role)      &&
             (repF.station === "All" || s.station === repF.station)   &&
             (repF.cat     === "All" || s.cat     === repF.cat)       &&
             (repF.risk    === "All" || s.risk    === repF.risk)      &&
             (repF.ti      === "All" || s.ti      === repF.ti);
    });
  }, [repApplied, repF, staff]);

  /* ═══════════════════════════════════════════
     PAGES
     ═══════════════════════════════════════════ */

  /* ── Computed data ── */
  const catData = useMemo(() => ["A","B","C","D"].map(c => ({
    name: `Cat ${c}`, value: staff.filter(s => s.cat === c).length, fill: CAT_COLORS[c]
  })), [staff]);

  /* ── DASHBOARD ── */
  /* ─── Content dispatcher ─── */
  function renderBody() {
    switch (page) {
      case "dashboard":
        return (
          <SADashboard
            averageScore={averageScore}
            complianceRate={complianceRate}
            stationCount={stations.length}
            pointsmen={staff.filter(s=>s.role==="pointsmen")}
            stationMasters={staff.filter(s=>s.role==="sm")}
            stationSuperintendents={staff.filter(s=>s.role==="ss")}
            trainManagers={staff.filter(s=>s.role==="tm")}
            trafficInspectors={staff.filter(s=>s.role==="ti")}
            history={MONTHLY_TREND}
            trendData={MONTHLY_TREND}
            pieData={catData}
            openScorecard={openScorecard}
            getCategoryBg={getCategoryBg}
            getCategoryColor={getCategoryColor}
            isRoleAssessmentOverdue={isRoleAssessmentOverdue}
            isRolePmeOverdue={isRolePmeOverdue}
            isRoleRefOverdue={isRoleRefOverdue}
            getOverdueCount={getOverdueCount}
            getAverageScore={getAverageScore}
            staff={staff}
            stations={stations}
            stationProgressData={stationProgressData}
            stationAverageScoreData={stationAverageScoreData}
            MONTHLY_TREND={MONTHLY_TREND}
            catData={catData}
            COMPLIANCE={COMPLIANCE}
            ASSESSMENT_MONTHLY={ASSESSMENT_MONTHLY}
            handleChartClick={handleChartClick}
            handlePieClick={handlePieClick}
          />
        );
      case "profile":
        return (
          <UserProfile
            fullName={fullName}
            employeeId={employeeId}
            latestCategory={latestCategory}
            latestScore={latestScore}
            history={[]}
            profileData={superAdminProfile}
          />
        );
      case "hierarchy": {
        const roleInfo = {
          pointsmen: { key: "pointsmen", title: "Pointsman" },
          sm: { key: "sm", title: "Station Master" },
          ss: { key: "ss", title: "Station Superintendent" },
          tm: { key: "tm", title: "Train Manager" },
          ti: { key: "ti", title: "Traffic Inspector" }
        }[activeHierarchyTab] || { key: "", title: "" };

        return (
          <div className="sdom-fade">
            <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h1 className="sdom-page-title">Staff Hierarchy</h1>
                <p className="sdom-page-subtitle">Manage operations and profiles across Nagpur division's staff roles.</p>
              </div>
            </div>

            {/* Elegant Sub-tabs for different roles */}
            <div style={{
              display: "flex",
              gap: "8px",
              background: "#f1f5f9",
              padding: "6px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              marginBottom: "24px",
              width: "fit-content"
            }}>
              {[
                { key: "pointsmen", label: "Pointsman", count: staff.filter(s=>s.role==="pointsmen").length },
                { key: "sm", label: "Station Master", count: staff.filter(s=>s.role==="sm").length },
                { key: "ss", label: "Station Superintendent", count: staff.filter(s=>s.role==="ss").length },
                { key: "tm", label: "Train Manager", count: staff.filter(s=>s.role==="tm").length },
                { key: "ti", label: "Traffic Inspector", count: staff.filter(s=>s.role==="ti").length }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveHierarchyTab(tab.key)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: "700",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    background: activeHierarchyTab === tab.key ? "#1E3A5F" : "transparent",
                    color: activeHierarchyTab === tab.key ? "#ffffff" : "#475569",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{
                    fontSize: "0.75rem",
                    background: activeHierarchyTab === tab.key ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.06)",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    color: activeHierarchyTab === tab.key ? "#ffffff" : "#475569"
                  }}>{tab.count}</span>
                </button>
              ))}
            </div>

            {/* Active Hierarchy View */}
            {roleInfo.key && (
              <CommonRoleView
                roleKey={roleInfo.key}
                title={roleInfo.title}
                activePage={activeHierarchyTab}
                users={staff}
                setUsers={setStaff}
                stations={stations}
                view={view}
                setView={setView}
                roleF={roleF}
                setRoleF={setRoleF}
                editingUser={modal?.mode === "edit" ? modal.data : null}
                setEditingUser={(user) => setModal(user ? { mode: "edit", role: user.role, data: user } : null)}
                transferringUser={modal?.mode === "shift" ? modal.data : null}
                setTransferringUser={(user) => setModal(user ? { mode: "shift", role: user.role, data: user } : null)}
                showAddUserModal={modal?.mode === "add"}
                setShowAddUserModal={(show) => {
                  if (show) openAdd(roleInfo.key);
                  else setModal(null);
                }}
                newUserData={modal?.mode === "add" ? modal.data : null}
                setNewUserData={(data) => setModal(p => p ? { ...p, data } : null)}
                handleAddUserSubmit={(e) => { e.preventDefault(); saveModal(); }}
                handleEditUser={(user) => openEdit(user)}
                handleTransferClick={(user) => openShift(user)}
                handleDeleteUser={(id) => removeStaff(id)}
                saveEditedUser={saveModal}
                confirmTransfer={saveModal}
              />
            )}
          </div>
        );
      }
      case "stations":
        return (
          <SAStations
            stations={stations}
            setStations={setStations}
            showAddStation={showAddStation}
            setShowAddStation={setShowAddStation}
            newStName={newStName}
            setNewStName={setNewStName}
            newStCode={newStCode}
            setNewStCode={setNewStCode}
            newStTi={newStTi}
            setNewStTi={setNewStTi}
            handleAddStation={handleAddStation}
            stF={stF}
            setStF={setStF}
            view={view}
            setView={setView}
            getCategoryColor={getCategoryColor}
            getCategoryBg={getCategoryBg}
            catBadge={catBadge}
            statusBadge={statusBadge}
            riskBadge={riskBadge}
            staff={staff}
            STATION_OPTS={STATION_OPTS}
            TI_OPTS={TI_OPTS}
            openView={openView}
            closeView={closeView}
          />
        );
      case "records":
        return (
          <SARecords
            staff={staff}
            recF={recF}
            setRecF={setRecF}
            recFiltered={recFiltered}
            ROLE_MAP={ROLE_MAP}
            ROLE_OPTS={ROLE_OPTS}
            STATION_OPTS={STATION_OPTS}
            catBadge={catBadge}
            statusBadge={statusBadge}
          />
        );
      case "reports":
        return (
          <CommonReports
            users={staff}
            selectedReportUserId={selectedReportUserId}
            setSelectedReportUserId={setSelectedReportUserId}
            repF={repF}
            setRepF={setRepF}
            userRole="Super Admin"
          />
        );
      default:
        return (
          <SADashboard
            averageScore={averageScore}
            complianceRate={complianceRate}
            stationCount={stations.length}
            pointsmen={staff.filter(s=>s.role==="pointsmen")}
            stationMasters={staff.filter(s=>s.role==="sm")}
            stationSuperintendents={staff.filter(s=>s.role==="ss")}
            trainManagers={staff.filter(s=>s.role==="tm")}
            trafficInspectors={staff.filter(s=>s.role==="ti")}
            history={MONTHLY_TREND}
            trendData={MONTHLY_TREND}
            pieData={catData}
            openScorecard={openScorecard}
            getCategoryBg={getCategoryBg}
            getCategoryColor={getCategoryColor}
            isRoleAssessmentOverdue={isRoleAssessmentOverdue}
            isRolePmeOverdue={isRolePmeOverdue}
            isRoleRefOverdue={isRoleRefOverdue}
            getOverdueCount={getOverdueCount}
            getAverageScore={getAverageScore}
            staff={staff}
            stations={stations}
            stationProgressData={stationProgressData}
            stationAverageScoreData={stationAverageScoreData}
            MONTHLY_TREND={MONTHLY_TREND}
            catData={catData}
            COMPLIANCE={COMPLIANCE}
            ASSESSMENT_MONTHLY={ASSESSMENT_MONTHLY}
            handleChartClick={handleChartClick}
            handlePieClick={handlePieClick}
          />
        );
    }
  }
  /* ── RENDER ── */
  const userObj = { name: fullName, hrmsId: employeeId, role: "Super Admin" };

  return (
    <div className="sdom-app-layout">
      <CommonLayout
        user={userObj}
        navItems={NAV}
        activeTab={page}
        setActiveTab={navigate}
        onLogout={onLogout}
        brandTitle="Indian Railway Evaluation System"
        brandSubtitle="Nagpur Division — Sr. DOM Command Center"
      >
        <div className="sdom-content-scrollable" style={{ padding: 0 }}>
          {renderBody()}
        </div>
      </CommonLayout>
    </div>
  );
}
