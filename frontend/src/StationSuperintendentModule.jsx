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
  ArrowLeft,
  Users,
  Building2,
  UserPlus,
  Edit,
  Cpu,
  Sparkles
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
import SSDashboard from "./components/StationSuperintendentModule/SSDashboard";
import UserProfile from "./components/UserProfile";
import SSSafety from "./components/StationSuperintendentModule/SSSafety";
import MyAssessment from './components/MyAssessment';
import CommonRoleView from "./components/CommonRoleView";
import CommonLayout from "./components/CommonLayout";
import AiCommandCenter from "./components/AiCommandCenter";
import { getEmployeeProfile, getEmployeeHistory } from "./services/employeeService";
import { getSmPointsmen, getSmDashboard, getSmComplianceSummary } from "./services/smService";


/* ─── Navigation ─── */
const navItems = [
  { key: "dashboard",      label: "Dashboard",      icon: Gauge },
  { key: "pointsmen",      label: "Pointsmen",      icon: Users },
  { key: "stationMasters", label: "Station Masters",icon: Building2 },
  { key: "myAssessment",   label: "My Assessment",  icon: FileBarChart2 },
  { key: "profile",        label: "Profile",        icon: UserCircle2 }
];

/* ─── Static profile data with requested fields ─── */
const stationSuperintendentProfile = {
  name: "R. Kulkarni",
  hrmsId: "SS_1001",
  stationName: "Nagpur Junction (NGP)",
  designation: "Station Superintendent",
  mobileNumber: "+91 98220 55001",
  pmeStatus: "FIT (Periodic Medical Exam) - Due: 2029-05-14",
  refStatus: "COMPLETED (Refresher Course) - Due: 2027-04-12",
  trainingStatus: "ACTIVE (Safety & Supervision Certified)",
  currentCategory: "A",
  department: "Operations",
  reportingOfficer: "Traffic Inspector",
  joiningDate: "2012-03-10"
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

const INIT_STATIONS = [
  { id: "ST01", name: "Parbhani Junction", code: "PBN", avgScore: 82, safetyPct: 88, highRisk: 1, pointsmenCount: 10 },
  { id: "ST02", name: "Amla Junction", code: "AMLA", avgScore: 65, safetyPct: 71, highRisk: 3, pointsmenCount: 8 },
  { id: "ST03", name: "Badnera Junction", code: "BD", avgScore: 78, safetyPct: 83, highRisk: 1, pointsmenCount: 7 },
  { id: "ST04", name: "Nagpur Junction", code: "NGP", avgScore: 89, safetyPct: 94, highRisk: 0, pointsmenCount: 12 },
  { id: "ST05", name: "Akola Junction", code: "AK", avgScore: 71, safetyPct: 76, highRisk: 2, pointsmenCount: 8 },
  { id: "ST06", name: "Wardha Junction", code: "WR", avgScore: 80, safetyPct: 85, highRisk: 1, pointsmenCount: 9 },
  { id: "ST07", name: "Betul Station", code: "BYT", avgScore: 74, safetyPct: 80, highRisk: 1, pointsmenCount: 6 },
  { id: "ST08", name: "Itarsi Junction", code: "ET", avgScore: 85, safetyPct: 91, highRisk: 1, pointsmenCount: 11 },
  { id: "ST09", name: "Chandrapur Station", code: "CD", avgScore: 68, safetyPct: 73, highRisk: 2, pointsmenCount: 7 },
  { id: "ST10", name: "Gondia Junction", code: "G", avgScore: 82, safetyPct: 87, highRisk: 0, pointsmenCount: 9 },
  { id: "ST11", name: "Dhamangaon Station", code: "DMN", avgScore: 73, safetyPct: 79, highRisk: 1, pointsmenCount: 5 },
  { id: "ST12", name: "Pulgaon Junction", code: "PLO", avgScore: 76, safetyPct: 81, highRisk: 1, pointsmenCount: 6 }
];

const INIT_USERS = [
  // Station Masters
  { id: "SM_1001", name: "S. Deshmukh", role: "Station Master", designation: "Station Master", station: "Parbhani Junction", cat: "A", lastAssessDate: "2026-03-20", score: 86, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 11001", joiningDate: "2018-02-12" },
  { id: "SM_2102", name: "A. Kulkarni", role: "Station Master", designation: "Station Master", station: "Parbhani Junction", cat: "B", lastAssessDate: "2026-02-14", score: 72, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 11002", joiningDate: "2019-05-15" },
  { id: "SM_2201", name: "M. Patil", role: "Station Master", designation: "Station Master", station: "Amla Junction", cat: "A", lastAssessDate: "2026-03-12", score: 84, pmeStatus: "Fit", refStatus: "Pending", contact: "+91 98765 11003", joiningDate: "2016-08-20" },
  { id: "SM_2202", name: "R. Sharma", role: "Station Master", designation: "Station Master", station: "Amla Junction", cat: "C", lastAssessDate: "2026-01-30", score: 54, pmeStatus: "Pending", refStatus: "Pending", contact: "+91 98765 11004", joiningDate: "2021-10-10" },
  { id: "SM_2301", name: "V. Singh", role: "Station Master", designation: "Station Master", station: "Badnera Junction", cat: "A", lastAssessDate: "2026-03-15", score: 88, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 11005", joiningDate: "2015-04-12" },
  { id: "SM_2302", name: "T. Mehta", role: "Station Master", designation: "Station Master", station: "Badnera Junction", cat: "B", lastAssessDate: "2026-02-20", score: 71, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 11006", joiningDate: "2020-03-18" },
  { id: "SM_2401", name: "K. Raghuvanshi", role: "Station Master", designation: "Station Master", station: "Nagpur Junction", cat: "A", lastAssessDate: "2026-03-22", score: 92, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 11007", joiningDate: "2014-06-25" },
  { id: "SM_2501", name: "P. Wankhede", role: "Station Master", designation: "Station Master", station: "Akola Junction", cat: "B", lastAssessDate: "2026-03-01", score: 74, pmeStatus: "Overdue", refStatus: "Expired", contact: "+91 98765 11008", joiningDate: "2017-09-08" },
  
  // Pointsmen
  { id: "PM_1001", name: "K. Pawar", role: "Pointsman", designation: "Pointsman Grade I", station: "Parbhani Junction", cat: "A", lastAssessDate: "2026-04-10", score: 80, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 22001", joiningDate: "2020-01-10" },
  { id: "PM_1002", name: "R. Verma", role: "Pointsman", designation: "Pointsman Grade I", station: "Amla Junction", cat: "B", lastAssessDate: "2026-04-09", score: 68, pmeStatus: "Fit", refStatus: "Pending", contact: "+91 98765 22002", joiningDate: "2021-06-18" },
  { id: "PM_1003", name: "D. Rane", role: "Pointsman", designation: "Pointsman Grade II", station: "Amla Junction", cat: "D", lastAssessDate: "2026-04-08", score: 44, pmeStatus: "Unfit", refStatus: "Pending", contact: "+91 98765 22003", joiningDate: "2022-11-22" },
  { id: "PM_1004", name: "J. Shaikh", role: "Pointsman", designation: "Pointsman Grade I", station: "Badnera Junction", cat: "A", lastAssessDate: "2026-04-04", score: 88, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 22004", joiningDate: "2019-12-05" },
  { id: "PM_1005", name: "A. Gade", role: "Pointsman", designation: "Pointsman Grade II", station: "Akola Junction", cat: "C", lastAssessDate: "2026-03-24", score: 58, pmeStatus: "Overdue", refStatus: "Cleared", contact: "+91 98765 22005", joiningDate: "2023-04-15" },
  { id: "PM_1006", name: "S. Meshram", role: "Pointsman", designation: "Pointsman Grade I", station: "Nagpur Junction", cat: "A", lastAssessDate: "2026-03-28", score: 94, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 22006", joiningDate: "2018-05-19" },
  { id: "PM_1007", name: "G. Chawla", role: "Pointsman", designation: "Pointsman Grade II", station: "Itarsi Junction", cat: "A", lastAssessDate: "2026-03-14", score: 82, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 22007", joiningDate: "2020-07-20" },
  { id: "PM_1008", name: "H. Singh", role: "Pointsman", designation: "Pointsman Grade I", station: "Wardha Junction", cat: "B", lastAssessDate: "2026-03-10", score: 76, pmeStatus: "Fit", refStatus: "Expired", contact: "+91 98765 22008", joiningDate: "2017-02-28" },
  { id: "PM_1009", name: "B. Yadav", role: "Pointsman", designation: "Pointsman Grade II", station: "Chandrapur Station", cat: "C", lastAssessDate: "2026-03-05", score: 51, pmeStatus: "Overdue", refStatus: "Pending", contact: "+91 98765 22009", joiningDate: "2022-09-01" },
  { id: "PM_1010", name: "N. Dewangan", role: "Pointsman", designation: "Pointsman Grade I", station: "Gondia Junction", cat: "A", lastAssessDate: "2026-03-18", score: 85, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 22010", joiningDate: "2019-08-11" },
  
  // Station Superintendents
  { id: "SS_1001", name: "S. K. Mukherjee", role: "Station Superintendent", designation: "Station Superintendent", station: "Nagpur Junction", cat: "A", lastAssessDate: "2026-04-14", score: 92, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 33001", joiningDate: "2012-05-18" },
  { id: "SS_1002", name: "H. S. Rawat", role: "Station Superintendent", designation: "Station Superintendent", station: "Parbhani Junction", cat: "A", lastAssessDate: "2026-03-22", score: 89, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 33002", joiningDate: "2013-09-10" },
  { id: "SS_1003", name: "Anand Vardhan", role: "Station Superintendent", designation: "Station Superintendent", station: "Akola Junction", cat: "B", lastAssessDate: "2026-02-18", score: 75, pmeStatus: "Fit", refStatus: "Pending", contact: "+91 98765 33003", joiningDate: "2015-11-05" },

  // Train Managers
  { id: "TM_1001", name: "Dilip Kumar", role: "Train Manager", designation: "Train Manager", station: "Nagpur Junction", cat: "A", lastAssessDate: "2026-04-20", score: 90, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 44001", joiningDate: "2017-06-12" },
  { id: "TM_1002", name: "Vikas Dubey", role: "Train Manager", designation: "Train Manager", station: "Badnera Junction", cat: "B", lastAssessDate: "2026-03-11", score: 78, pmeStatus: "Fit", refStatus: "Pending", contact: "+91 98765 44002", joiningDate: "2019-10-22" },
  { id: "TM_1003", name: "J. P. Nadda", role: "Train Manager", designation: "Train Manager", station: "Amla Junction", cat: "C", lastAssessDate: "2026-01-25", score: 56, pmeStatus: "Pending", refStatus: "Expired", contact: "+91 98765 44003", joiningDate: "2021-04-15" }
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

/* ─── Seed history — ONE test type repeated ─── */
const TEST_NAME = "Station Superintendent Periodic Assessment";

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
  { text: "Who is the primary authority responsible for verifying and signing the Station Working Rules (SWR) correction slips?", options: ["The Senior Section Engineer (Signal)", "The Station Superintendent and Senior DOM", "The AOM/G on duty", "The Chief Track Inspector"], answer: 1, explanation: "The Station Superintendent, along with the Senior Divisional Operations Manager (DOM), holds joint responsibility for signing and implementing SWR correction slips at the station yard limits." },
  { text: "During non-interlocked working for yard remodeling, what is the most critical duty of the Station Superintendent?", options: ["Delegating all route setup to pointsmen", "Personally supervising correct line setup, clamping, and padlocking of points", "Increasing train speed to clear congestion", "Suspending all communications with adjacent stations"], answer: 1, explanation: "Non-interlocked working is highly safety-critical. The Station Superintendent must personally ensure points are set, clamped, and padlocked before authorizing movements." },
  { text: "If a train passes a reception signal at danger (SPAD) inside station limits, what immediate action must the Station Superintendent take?", options: ["Direct the driver to proceed immediately to avoid delay", "Log the incident and instruct the SM on duty to protect the line and inform Control", "Quietly replace the signal bulb", "Blame the station superintendent on duty"], answer: 1, explanation: "SPAD is a major incident. The SS must ensure the line is immediately protected, the incident is logged, and the Divisional Control/Safety officer is notified." },
  { text: "In the event of a fire in the station control room, what is the first priority for the Station Superintendent?", options: ["Call the railway division headquarters for permission to evacuate", "Evacuate staff, use portable CO2 extinguishers, and isolate power supplies", "Protect physical files first", "Run out to the platform to check train schedules"], answer: 1, explanation: "The first priority in case of fire is life safety, followed by utilizing fire fighting equipment and isolating the electric/traction supply." },
  { text: "Who is responsible for supervising the shunting of passenger coaches containing passengers?", options: ["Any Station Superintendent", "The Station Superintendent or AOM/G on duty", "The Train Guard only", "The Coach Attendant"], answer: 1, explanation: "Shunting of occupied passenger vehicles must be personally supervised by the SS or the AOM/G on duty to prevent casualties." },
  { text: "If a AOM/G on duty is observed showing severe signs of fatigue or illness, the Station Superintendent must:", options: ["Instruct them to complete the shift anyway", "Arrange immediate relief and ensure the SM does not perform active block operations", "Give them strong coffee and ignore it", "Report them for misconduct"], answer: 1, explanation: "Active block operations require high alertness. Operating under fatigue/illness is a major safety hazard; relief must be arranged immediately." },
  { text: "In single-line token block working, what must the SS verify regarding token custody?", options: ["Tokens can be left on the counter", "Tokens must be secured in the block instrument and handled only by authorized staff", "Any passenger can hand over the token", "Drivers can carry multiple tokens"], answer: 1, explanation: "Safety tokens represent block authority and must remain secured inside block instruments under lock and key." },
  { text: "When a passing train is reported to have a 'Hot Axle' by the gateman, what must the Station Superintendent ensure?", options: ["The train is allowed to proceed to destination", "The train is stopped immediately at the station and the hot axle wagon is detached", "The train is speeded up to cool down the axle", "Instruct the driver to turn off the alarm"], answer: 1, explanation: "A hot axle can cause derailment. The train must be stopped at the station immediately, examined, and the defective wagon detached." },
  { text: "Before authorizing a Track Maintenance Block (Traffic Block) for the P-Way team, what is required?", options: ["A verbal nod from the driver", "A signed block permit exchanged between the SS/SM on duty and the block applicant", "No formal paperwork is required", "A general announcement on the platform"], answer: 1, explanation: "Track block working requires strict adherence to physical block permits, exchange of private numbers, and physical block protection." },
  { text: "A large parcel has fallen onto the track of Platform 3. The SS must immediately:", options: ["Wait for the scheduled cleaning staff", "Instruct the SM to set the signals to 'Red' for Platform 3 and clear the track", "Let the next incoming train push the parcel away", "Move it after the next train passes"], answer: 1, explanation: "Any track obstruction must be protected immediately by setting signals to danger/on and verifying the obstruction is cleared." },
  { text: "If water rises above rail level at the station yard, what action should the SS coordinate?", options: ["Allow trains to pass at normal speed", "Stop train movements or restrict speed to walking pace under direct engineering guidance", "Turn off all station lights", "Drain water onto the adjacent highway"], answer: 1, explanation: "Water logging reduces track stability and obscures points. Train movements must be stopped or restricted under track engineer supervision." },
  { text: "A passenger collapses on Platform 2 with severe chest pain. What is the SS's protocol?", options: ["Ask the passenger to take a taxi to the hospital", "Call the railway doctor, summon local ambulance, and administer basic first aid", "Tell them to wait for the next train", "Do nothing unless they are railway staff"], answer: 1, explanation: "The SS is responsible for arranging immediate medical aid, coordinating with local ambulances, and contacting the nearest railway hospital." },
  { text: "A freight train halts at the station. Before clearing the signal for an adjacent line train, the SS must verify:", options: ["The freight train is painted clean", "The rear vehicle of the freight train has completely cleared the fouling mark", "The freight driver has signed the logbook", "The passenger platform is empty"], answer: 1, explanation: "A train must stand completely clear of the fouling mark to prevent side-swipe collisions with trains on adjacent lines." },
  { text: "How often should the Station Superintendent conduct mock fire drills at the station?", options: ["Once in 3 years", "Jointly with fire services every 3 months or as per division rules", "Only when a fire occurs", "Never, it is not required"], answer: 1, explanation: "Periodic safety audits and mock drills (fire, emergency evacuation) are mandatory to ensure staff preparedness." },
  { text: "Under what condition can a driver pass a semi-automatic signal at 'Danger' within station limits?", options: ["On verbal instructions over walkie-talkie", "On receiving a physical Authority Memo (T/369-3b) and verifying points are correctly set", "When they are running late", "If the signal flashes yellow"], answer: 1, explanation: "Passing a signal at danger requires strict physical authorization (T/369-3b) and verifying the route is locked and clear." },
  { text: "To prevent stabled wagons from rolling back or moving, what must the SS ensure?", options: ["Hand brakes are fully applied, safety chains locked, and wooden wedges placed under wheels", "Points are kept unlocked", "A station superintendent stands behind the wagon", "Nothing, wagons cannot move on their own"], answer: 0, explanation: "Securing stabled loads requires full handbrake application, safety chains, and wooden wedges/skids to prevent runaway movements." },
  { text: "When exhibiting a hand signal to a pilot, where should the station staff stand?", options: ["Directly between the rails", "In a safe, highly visible position clear of the tracks", "On top of the cabin", "Inside the station master's office"], answer: 1, explanation: "Personal safety is key. Staff must stand in a safe, visible location, clear of track suction or vehicle overhang." },
  { text: "A signal is bobbing (randomly changing aspects). What must the SS instruct the SM on duty to do?", options: ["Ignore it until it stabilizes", "Treat it as showing its most restrictive aspect (Stop/Red) and report the defect immediately", "Turn off the signal power", "Tell the driver to speed through"], answer: 1, explanation: "Any fluctuating or bobbing signal must be treated as a danger/restrictive signal for safety." },
  { text: "Where should the emergency point chain keys and interlocking override keys be stored?", options: ["In the station superintendent's personal locker", "In a sealed glass box under the joint custody of the Station Superintendent/Master on duty", "Left in the keyholes at all times", "In the station manager's car"], answer: 1, explanation: "Safety critical keys must remain under strict custody in a secure box to prevent unauthorized operations." },
  { text: "If a Station Superintendent's PME is overdue by even one day, the Station Superintendent must:", options: ["Allow them to work shunting duties today anyway", "Strictly pull them off safety-related duties and send them for medical evaluation", "Extend their medical fitness verbally", "Let them work night shifts only"], answer: 1, explanation: "Safety rules forbid any staff with overdue PME from performing active safety-critical railway duties." },
  { text: "A train passes with its rear brake van missing. The SS/SM on duty must immediately:", options: ["Close the block section and alert adjacent stations and control of train parting", "Let the train proceed to destination", "Call a track maintenance worker", "Wave a green flag at the next train"], answer: 0, explanation: "A missing brake van indicates a train parting. The block section must be closed and adjacent stations notified to prevent rear-end collisions." },
  { text: "Where must safety detonators be stored at the station?", options: ["In a damp basement", "In a dry, locked metallic tin box away from heat and moisture", "On the open booking office shelf", "In the staff dining room"], answer: 1, explanation: "Detonators contain explosives and must be stored in dry, secure metallic boxes to prevent deterioration." },
  { text: "How often should safety briefings be held for the station staff under the SS's oversight?", options: ["Once a year during inspections", "Daily or before shift handovers to discuss SWR highlights and safe operations", "Only after a major accident", "Bi-annually"], answer: 1, explanation: "Shift-level safety briefings keep rules fresh and prevent complacency among station masters and ground crew." },
  { text: "When block instruments fail on a double line section, what block system must be adopted?", options: ["Line Clear Ticket / Paper Line Clear Working under SWR guidance", "Automatic block working without permission", "Stop all trains indefinitely", "Follow the train ahead closely"], answer: 0, explanation: "Block instrument failure requires transitioning to Paper Line Clear Ticket working, adhering strictly to SWR manual block procedures." },
  { text: "A AOM/G has missed their scheduled safety refresher course training. The SS must:", options: ["Allow them to continue active duty", "Take them off block operations duties immediately until retraining is completed", "Give them a handbook to read on shift", "Exempt them under station authority"], answer: 1, explanation: "Retraining is a statutory safety requirement. Staff with expired refresher training cannot operate block consoles." }
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
    try { alarmOsc.stop(); } catch(e) {}
    alarmOsc = null;
  }
  if (audioCtx) {
    try { audioCtx.close(); } catch(e) {}
    audioCtx = null;
  }
}

const mapUserToFrontend = (u) => ({
  id: u.hrms_id,
  hrmsId: u.hrms_id,
  name: u.full_name,
  role: u.designation === "Pointsman Grade I" || u.designation === "Pointsman Grade II" || u.designation === "Pointsman" ? "Pointsman" : u.designation,
  designation: u.designation,
  station: u.station_name,
  stationCode: u.station_code,
  cat: u.category_grade || "A",
  score: u.final_score || u.practical_score || 80,
  pmeStatus: u.pme_status || "Fit",
  refStatus: u.ref_status || "Cleared",
  contact: u.mobile || "N/A",
  joiningDate: u.joining_date || "2020-01-10",
  status: u.status || "Active",
  reportingSm: u.reporting_officer_name || "N/A"
});

/* ─── Main component ─── */
function StationSuperintendentModule({ user, onLogout }) {
  const [profileData, setProfileData] = useState(stationSuperintendentProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fullName = profileData?.full_name || user?.name || stationSuperintendentProfile.name;
  const employeeId = profileData?.hrms_id || user?.hrmsId || stationSuperintendentProfile.hrmsId;

  const [activeNav, setActiveNav] = useState("dashboard");

  // CRUD & Staff Directory States
  const [view, setView] = useState(null);
  const [users, setUsers] = useState([]);

  const [stations, setStations] = useState(() => {
    return INIT_STATIONS;
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

        // Fetch station staff roster dynamically
        const pms = await getSmPointsmen("Pointsman");
        const sms = await getSmPointsmen("Station Master");
        const mappedPms = pms.map(mapUserToFrontend);
        const mappedSms = sms.map(mapUserToFrontend);
        setUsers([...mappedPms, ...mappedSms]);
      } catch (err) {
        console.warn("Failed to load superintendent dashboard databases:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const myStations = useMemo(() => stations, [stations]);

  const [roleF, setRoleF] = useState({ name: "", station: "All", ti: "All", cat: "All", risk: "All" });
  const [editingUser, setEditingUser] = useState(null);
  const [transferringUser, setTransferringUser] = useState(null);
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

  const addAuditLog = (event, details) => {
    logActivity("System", `${event}: ${details}`);
  };
  const [screenMode, setScreenMode] = useState("default");
  const [historyDateSearch, setHistoryDateSearch] = useState("");
  const [historySortOrder, setHistorySortOrder] = useState("date-desc");
  const [historyPage, setHistoryPage] = useState(1);
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(`ss_history_${employeeId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Error reading SS history:", e);
    }
    return initialHistory;
  });

  const [selectedRecord, setSelectedRecord] = useState(null);

  // My Assessment state (mirrors SM module)
  const [myAssessSelected, setMyAssessSelected] = useState(null);
  const [ssMcqTest, setSsMcqTest] = useState(() => {
    const saved = localStorage.getItem(`ss_mcq_test_${employeeId}`);
    return saved ? JSON.parse(saved) : null;
  });
  const [testAssigned, setTestAssigned] = useState(() => {
    const saved = localStorage.getItem(`ss_test_assigned_${employeeId}`);
    if (saved === null) {
      localStorage.setItem(`ss_test_assigned_${employeeId}`, "Assigned");
      return "Assigned";
    }
    return saved;
  });
  const [ssActiveQIdx, setSsActiveQIdx] = useState(0);
  const [ssTestResponses, setSsTestResponses] = useState(() => Array(25).fill(null));
  
  const [currentTest, setCurrentTest] = useState(() => {
    const saved = localStorage.getItem(`ss_current_test_${employeeId}`);
    if (saved) return JSON.parse(saved);
    const mcqResult = localStorage.getItem(`ss_mcq_test_${employeeId}`);
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
    { id: 1, timestamp: "2026-05-27 10:00:12", category: "Auth", action: "User session initialized (IP: 10.244.15.68)", user: "R. Kulkarni" },
    { id: 2, timestamp: "2026-05-27 10:01:45", category: "Profile", action: "PME & REF health profile retrieved", user: "R. Kulkarni" },
    { id: 3, timestamp: "2026-05-27 10:03:10", category: "System", action: "Audited dashboard integrity checklist successfully", user: "R. Kulkarni" }
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
    { id: 102, type: "Abnormal Incident", defect: "Hot Axle Exchanged Flag", location: "Line 1 Main", severity: "Medium - Investigating", status: "UNDER REPAIR", date: "2026-05-26", desc: "Detected sparks during all-right hand signal. Notified AOM/G." }
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

  /* ── User admin actions ── */
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
      triggerNotification("danger", "Please fill out all required fields.");
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
      triggerNotification("danger", `User with Employee ID ${finalId} already exists!`);
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
    
    addAuditLog("Added New User", `Staff: ${newUser.name} (${newUser.id})`);
    triggerNotification("success", `Added Staff: ${newUser.name} (${newUser.id})`);
  };

  const handleEditUser = (userRec) => {
    setEditingUser({ ...userRec });
  };

  const saveEditedUser = (e) => {
    e.preventDefault();
    setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
    addAuditLog("User Profile Modified", `Staff ID: ${editingUser.id}, Name: ${editingUser.name}`);
    triggerNotification("success", `Profile updated for ${editingUser.name}.`);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId, userName) => {
    if (window.confirm(`Are you absolutely sure you want to revoke operational access for ${userName} (${userId})?`)) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      addAuditLog("Revoked User Access", `Staff ID: ${userId}, Name: ${userName}`);
      triggerNotification("danger", `Revoked access: ${userName} (${userId}).`);
    }
  };

  const handleTransferClick = (userRec) => {
    setTransferringUser({ ...userRec, targetStation: userRec.station });
  };

  const confirmTransfer = () => {
    setUsers(prev => prev.map(u => u.id === transferringUser.id ? { ...u, station: transferringUser.targetStation } : u));
    addAuditLog("Staff Station Transfer", `Staff: ${transferringUser.name} moved from ${transferringUser.station} to ${transferringUser.targetStation}`);
    triggerNotification("warning", `Transferred ${transferringUser.name} to ${transferringUser.targetStation}.`);
    setTransferringUser(null);
  };

  /* ─── My Assessment Test Actions (mirrors SM) ─── */
  const startTestAttempt = () => {
    setSsActiveQIdx(0);
    setSsTestResponses(Array(25).fill(null));
    setScreenMode("takeTest");
  };

  const handleSubmitTestAttempt = () => {
    const correctCount = ssTestResponses.filter((r, idx) => r === testQuestions[idx].answer).length;
    const percentage = Math.round((correctCount / 25) * 100);
    const passStatus = percentage >= 60 ? "PASSED" : "FAILED";
    const today = new Date().toISOString().slice(0, 10);
    const testResult = {
      completed: true,
      correctCount,
      responses: [...ssTestResponses],
      submittedDate: today,
      percentage,
      passStatus
    };
    localStorage.setItem(`ss_mcq_test_${employeeId}`, JSON.stringify(testResult));
    setSsMcqTest(testResult);
    localStorage.setItem(`ss_test_assigned_${employeeId}`, "Completed");
    setTestAssigned("Completed");
    const record = {
      id: Date.now(),
      date: today,
      assessmentPeriod: "Q2 2026",
      name: TEST_NAME,
      assessedBy: "Online Self-Exam",
      totalScore: correctCount * 4,
      sections: [
        { title: "Signal Rules",          marks: 0, outOf: 20 },
        { title: "Track Handling",         marks: 0, outOf: 20 },
        { title: "Communication",          marks: 0, outOf: 20 },
        { title: "Safety Response",        marks: 0, outOf: 20 },
        { title: "Operational Judgement",  marks: 0, outOf: 20 }
      ],
      responses: [...ssTestResponses],
      approvalStatus: "Completed",
      isOnlineExam: true
    };
    const newHistory = [record, ...history];
    setHistory(newHistory);
    localStorage.setItem(`ss_history_${employeeId}`, JSON.stringify(newHistory));
    setScreenMode("default");
    setStatusText(`Assessment submitted! Score: ${percentage}% (${correctCount}/25). Status: Completed.`);
  };

  /* ─── Test Actions ─── */
  const handleReattempt = () => {
    localStorage.removeItem(`ss_mcq_test_${employeeId}`);
    localStorage.setItem(`ss_current_test_${employeeId}`, JSON.stringify(currentTestSeed));
    setCurrentTest(currentTestSeed);
    setActiveTest(currentTestSeed);
    setResponses(Array(25).fill(null));
    setCurrentQuestion(0);
    setStatusText("New CBT shunting safety test session initialized.");
    setActiveNav("current");
    setScreenMode("attempt");
    logActivity("Assessment", "Periodic CBT assessment re-attempt session started.");
    triggerNotification("info", "New shunting safety CBT competency exam session active.");
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
      responses: [...responses],
      assessedBy: "Traffic Inspector",
      approvalStatus: "Completed",
      isOnlineExam: true
    };
    const newHistory = [record, ...history];
    setHistory(newHistory);
    localStorage.setItem(`ss_history_${employeeId}`, JSON.stringify(newHistory));
    
    setCurrentTest(null);
    localStorage.setItem(`ss_current_test_${employeeId}`, JSON.stringify(null));

    // Save MCQ result for Traffic Inspector
    const correctCount = Math.round(totalScore / 4);
    const percentage = Math.round((correctCount / 25) * 100);
    const mcqResult = {
      completed: true,
      correctCount: correctCount,
      submittedDate: today,
      percentage: percentage
    };
    localStorage.setItem(`ss_mcq_test_${employeeId}`, JSON.stringify(mcqResult));

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
      logActivity("Safety", `Attached safety evidence: ${files.map(x=>x.name).join(', ')}`);
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
    setStatusText("Safety report logged. Forwarded to Traffic Inspector & P-Way inspector.");
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
  /* ─── Content dispatcher ─── */
  const renderBodyContent = () => {
    if (screenMode === "takeTest" || activeNav === "myAssessment" || screenMode === "attempt" || screenMode === "scorecard") {
      return (
        <MyAssessment
      roleTitle="Station Superintendent"
      assessedByTitle="AOM"
          myAssessSelected={myAssessSelected}
          setMyAssessSelected={setMyAssessSelected}
          performanceSummaryText={performanceSummaryText}
          getCategory={getCategory}
          getCategoryColor={getCategoryColor}
          getCategoryBg={getCategoryBg}
          testQuestions={testQuestions}
          testAssigned={testAssigned}
          mcqTest={ssMcqTest}
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
          activeQIdx={ssActiveQIdx}
          setActiveQIdx={setSsActiveQIdx}
          testResponses={ssTestResponses}
          setTestResponses={setSsTestResponses}
          handleSubmitTestAttempt={handleSubmitTestAttempt}
          screenMode={screenMode}
          setScreenMode={setScreenMode}
          activeNav={activeNav}
          goToNavPage={goToNavPage}
          fullName={fullName}
          employeeId={employeeId}
          historyPage={historyPage}
          setHistoryPage={setHistoryPage}
          historyDateSearch={historyDateSearch}
          setHistoryDateSearch={setHistoryDateSearch}
          historySortOrder={historySortOrder}
          setHistorySortOrder={setHistorySortOrder}
          myStations={myStations}
          triggerNotification={triggerNotification}
          logActivity={logActivity}
        />
      );
    }

    if (activeNav === "ai") {
      return <AiCommandCenter user={{ name: fullName, hrmsId: employeeId, role: "Station Superintendent" }} role="Station Superintendent" />;
    }

    if (activeNav === "dashboard") {
      const pmList = users.filter(u => u.role === "Pointsman" && u.station === "Nagpur Junction");
      const smList = users.filter(u => u.role === "Station Master" && u.station === "Nagpur Junction");
      return (
        <SSDashboard
          latestScore={latestScore}
          averageScore={averageScore}
          latestCategory={latestCategory}
          latestPmeStatus="Fit"
          latestRefStatus="Cleared"
          history={history}
          trendData={trendData}
          pieData={pieData}
          openScorecard={openScorecard}
          getCategoryBg={getCategoryBg}
          getCategoryColor={getCategoryColor}
          setActiveNav={setActiveNav}
          pointsmen={pmList}
          stationMasters={smList}
          employeeId={employeeId}
          profileData={profileData}
        />
      );
    }

    if (activeNav === "profile") {
      return (
        <UserProfile
          fullName={fullName}
          employeeId={employeeId}
          latestCategory={latestCategory}
          latestScore={latestScore}
          history={history}
          profileData={profileData}
        />
      );
    }

    if (activeNav === "safety") {
      return (
        <SSSafety
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
    }

    if (activeNav === "pointsmen" || activeNav === "stationMasters") {
      const roleInfo = {
        pointsmen: { key: "Pointsman", title: "Pointsman" },
        stationMasters: { key: "Station Master", title: "Station Master" }
      }[activeNav] || { key: "", title: "" };

      return (
        <CommonRoleView
          roleKey={roleInfo.key}
          title={roleInfo.title}
          activePage={activeNav}
          users={users}
          setUsers={setUsers}
          stations={stations}
          view={view}
          setView={setView}
          roleF={roleF}
          setRoleF={setRoleF}
          editingUser={editingUser}
          setEditingUser={setEditingUser}
          transferringUser={transferringUser}
          setTransferringUser={setTransferringUser}
          showAddUserModal={showAddUserModal}
          setShowAddUserModal={setShowAddUserModal}
          newUserData={newUserData}
          setNewUserData={setNewUserData}
          confirmTransfer={confirmTransfer}
          handleAddUserSubmit={handleAddUserSubmit}
          saveEditedUser={saveEditedUser}
          handleEditUser={handleEditUser}
          handleTransferClick={handleTransferClick}
          handleDeleteUser={handleDeleteUser}
          myStations={myStations}
        />
      );
    }

    return null;
  };

  /* ═══════════════════════════════════════
     SHELL LAYOUT
  ═══════════════════════════════════════ */
  const userObj = { name: fullName, hrmsId: employeeId, role: "Station Superintendent" };

  return (
    <div className={`pm-layout ${emergencyActive ? "emergency-glow-active" : ""}`}>
      
      {/* ── Flashing Emergency Alert Banner ── */}
      {emergencyActive && (
        <div className="pm-emergency-siren-banner" style={{ zIndex: 999 }}>
          <div className="siren-message">
            <span className="siren-light animate-flash">🚨 ALERT</span>
            <strong>MANDATORY EMERGENCY BROADCAST ACTIVE: {emergencyType} detected at {emergencyLocation}! All train & siding movements are frozen immediately.</strong>
          </div>
          <div className="siren-controls">
            <button className="pm-siren-mute-btn" onClick={toggleAlarmMute}>
              {alarmMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              {alarmMuted ? "Unmute Alarm" : "Mute Sound"}
            </button>
            <button className="pm-siren-clear-btn" onClick={clearEmergencyState}>
              Clear & Safe Return
            </button>
          </div>
        </div>
      )}

      <CommonLayout
        user={userObj}
        navItems={navItems}
        activeTab={activeNav}
        setActiveTab={goToNavPage}
        onLogout={() => { stopAlarmSound(); onLogout(); }}
        statusMsg={statusText}
        setStatusMsg={setStatusText}
        brandTitle="Indian Railway Evaluation Command"
        brandSubtitle="Operations Workspace: Station Superintendent Module"
        notifications={notifications}
        markAllNotificationsRead={markAllNotificationsRead}

      >
        <div className="pm-main-panel" style={{ background: "transparent", border: "none", boxShadow: "none", padding: 0 }}>
          <div className="pm-main-header-band" style={{ marginBottom: "24px" }}>
            <div>
              <p className="pm-hero-eyebrow">Nagpur Junction Operations</p>
              <h2 className="pm-main-title" style={{ margin: 0 }}>
                {screenMode === "scorecard" ? "Detailed Evaluation scorecard"
                  : screenMode === "attempt" ? "Competency Examination Attempt"
                  : navItems.find(i => i.key === activeNav)?.label || "Workspace"}
              </h2>
            </div>
            <div className="pm-header-kpis">
              <div className="pm-hkpi">
                <Award size={14} />
                <span>{history.length} Assessments</span>
              </div>
              <div className="pm-hkpi">
                <Gauge size={14} />
                <span>Avg {averageScore}</span>
              </div>
              <div className="pm-hkpi" style={{ color: getCategoryColor(latestCategory) }}>
                <ShieldCheck size={14} />
                <span>Cat. {latestCategory}</span>
              </div>
            </div>
          </div>

          {renderBodyContent()}
        </div>
      </CommonLayout>

      {/* ── EMERGENCY BROADCAST SETUP MODAL ── */}
      {emergencyModalOpen && (
        <div className="pm-emergency-modal-overlay" style={{ zIndex: 9999 }}>
          <div className="pm-emergency-modal">
            <div className="modal-header">
              <h2>🚨 CONFIRM URGENT DIVISION-WIDE BROADCAST</h2>
              <button onClick={() => setEmergencyModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="danger-notice">
                WARNING: Triggering this broadcast sends an audio warning signal and locks shunting/movement panels on all active Traffic Inspector & Superintendent terminals! Use for genuine safety emergencies only.
              </p>
              <div className="modal-fields">
                <label>Emergency Category</label>
                <select value={emergencyType} onChange={e => setEmergencyType(e.target.value)}>
                  <option value="Obstruction on Track">Obstruction on Siding (Fouling Clearance)</option>
                  <option value="Derailment Danger">Visible Rail Crack / Splitting Point</option>
                  <option value="Signal Failure">Critical Signal Lock Failure</option>
                  <option value="Hot Axle Fire Spark">Hot Axle / Spark Smoke in Incoming train</option>
                  <option value="Other Danger">Other Major Track Danger</option>
                </select>
                
                <label>Vulnerable Location / Track</label>
                <input 
                  type="text" 
                  value={emergencyLocation} 
                  onChange={e => setEmergencyLocation(e.target.value)} 
                  placeholder="e.g. Line 2 Loop Siding, KM 102/4" 
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setEmergencyModalOpen(false)}>Cancel</button>
              <button className="confirm-btn" onClick={triggerEmergencyBroadcast}>
                CONFIRM & BROADCAST ALARM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StationSuperintendentModule;


