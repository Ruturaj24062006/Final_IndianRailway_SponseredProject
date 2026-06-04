import { useMemo, useState, useEffect } from "react";
import {
  Activity, AlertTriangle, ArrowUpDown, Award, BarChart3, Building2,
  CheckCircle2, CheckCircle, ChevronRight, ClipboardCheck,
  FileBarChart2, FileCheck, Filter, LogOut, Search, ShieldCheck,
  TrendingUp, TrendingDown, UserCircle2, Users, XCircle, Eye,
  Calendar, BookOpen, Clock, HeartHandshake, HelpCircle, Download,
  FileSpreadsheet, FileText, Bell, Plus, RefreshCw, Edit, Trash2, Lock, Maximize2,
  ArrowLeft, UserCheck, BusFront, ClipboardList, UserPlus, Send, Train, ExternalLink,
  Gauge
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList
} from "recharts";
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

/* ═══════════════════════════════════════════
   NAV CONFIG
   (Full 12 Sidebar Menu Items)
═══════════════════════════════════════════ */
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
  const map = { Approved: "sdom-badge-success", Pending: "sdom-badge-warning", Rejected: "sdom-badge-danger", Overdue: "sdom-badge-danger", Active: "sdom-badge-success" };
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


/* ═══════════════════════════════════════════
   STATIC MOCK DATA — 12 STATIONS
═══════════════════════════════════════════ */
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

const DEFAULT_SS_TM_USERS = [
  // Station Superintendents
  { id: "SS_1001", name: "S. K. Mukherjee", role: "Station Superintendent", designation: "Station Superintendent", station: "Nagpur Junction", cat: "A", lastAssessDate: "2026-04-14", score: 92, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 33001", joiningDate: "2012-05-18" },
  { id: "SS_1002", name: "H. S. Rawat", role: "Station Superintendent", designation: "Station Superintendent", station: "Parbhani Junction", cat: "A", lastAssessDate: "2026-03-22", score: 89, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 33002", joiningDate: "2013-09-10" },
  { id: "SS_1003", name: "Anand Vardhan", role: "Station Superintendent", designation: "Station Superintendent", station: "Akola Junction", cat: "B", lastAssessDate: "2026-02-18", score: 75, pmeStatus: "Fit", refStatus: "Pending", contact: "+91 98765 33003", joiningDate: "2015-11-05" },

  // Train Managers
  { id: "TM_1001", name: "Dilip Kumar", role: "Train Manager", designation: "Train Manager", station: "Nagpur Junction", cat: "A", lastAssessDate: "2026-04-20", score: 90, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 44001", joiningDate: "2017-06-12" },
  { id: "TM_1002", name: "Vikas Dubey", role: "Train Manager", designation: "Train Manager", station: "Badnera Junction", cat: "B", lastAssessDate: "2026-03-11", score: 78, pmeStatus: "Fit", refStatus: "Pending", contact: "+91 98765 44002", joiningDate: "2019-10-22" },
  { id: "TM_1003", name: "J. P. Nadda", role: "Train Manager", designation: "Train Manager", station: "Amla Junction", cat: "C", lastAssessDate: "2026-01-25", score: 56, pmeStatus: "Pending", refStatus: "Expired", contact: "+91 98765 44003", joiningDate: "2021-04-15" }
];

const MONTHLY = [
  { month: "Nov 25", assessments: 14, avgScore: 72, safetyAvg: 74 },
  { month: "Dec 25", assessments: 18, avgScore: 74, safetyAvg: 76 },
  { month: "Jan 26", assessments: 24, avgScore: 71, safetyAvg: 73 },
  { month: "Feb 26", assessments: 32, avgScore: 77, safetyAvg: 79 },
  { month: "Mar 26", assessments: 38, avgScore: 80, safetyAvg: 82 },
  { month: "Apr 26", assessments: 42, avgScore: 83, safetyAvg: 85 }
];

const INIT_PM_ASSESSMENTS = [
  {
    id: "PA_1001", pointsmanName: "K. Pawar", hrmsId: "PM_1001",
    station: "Parbhani Junction", assessingSM: "S. Deshmukh",
    submissionDate: "2026-04-10", status: "Pending",
    originalSections: [
      { title: "Knowledge of Rules",      score: 20, max: 25 },
      { title: "Alertness & Observation", score: 18, max: 25 },
      { title: "Safety Record",           score: 12, max: 15 },
      { title: "Leadership & Management", score: 11, max: 15 },
      { title: "Discipline",              score: 8,  max: 10 },
      { title: "Appearance & Neatness",   score: 7,  max: 10 },
    ],
    meta: { pmeStatus: "Fit", refStatus: "Cleared", alcoholicStatus: "Non-Alcoholic" },
    tiRemarks: "", tiModified: false, auditTrail: []
  },
  {
    id: "PA_1002", pointsmanName: "R. Verma", hrmsId: "PM_1002",
    station: "Amla Junction", assessingSM: "M. Patil",
    submissionDate: "2026-04-09", status: "Pending",
    originalSections: [
      { title: "Knowledge of Rules",      score: 17, max: 25 },
      { title: "Alertness & Observation", score: 16, max: 25 },
      { title: "Safety Record",           score: 10, max: 15 },
      { title: "Leadership & Management", score: 9,  max: 15 },
      { title: "Discipline",              score: 6,  max: 10 },
      { title: "Appearance & Neatness",   score: 6,  max: 10 },
    ],
    meta: { pmeStatus: "Fit", refStatus: "Pending", alcoholicStatus: "Non-Alcoholic" },
    tiRemarks: "", tiModified: false, auditTrail: []
  },
  {
    id: "PA_1003", pointsmanName: "D. Rane", hrmsId: "PM_1003",
    station: "Amla Junction", assessingSM: "M. Patil",
    submissionDate: "2026-04-08", status: "Pending",
    originalSections: [
      { title: "Knowledge of Rules",      score: 14, max: 25 },
      { title: "Alertness & Observation", score: 13, max: 25 },
      { title: "Safety Record",           score: 8,  max: 15 },
      { title: "Leadership & Management", score: 7,  max: 15 },
      { title: "Discipline",              score: 4,  max: 10 },
      { title: "Appearance & Neatness",   score: 4,  max: 10 },
    ],
    meta: { pmeStatus: "Unfit", refStatus: "Pending", alcoholicStatus: "Alcoholic" },
    tiRemarks: "", tiModified: false, auditTrail: []
  },
  {
    id: "PA_1004", pointsmanName: "J. Shaikh", hrmsId: "PM_1004",
    station: "Badnera Junction", assessingSM: "V. Singh",
    submissionDate: "2026-04-04", status: "Approved",
    originalSections: [
      { title: "Knowledge of Rules",      score: 23, max: 25 },
      { title: "Alertness & Observation", score: 22, max: 25 },
      { title: "Safety Record",           score: 15, max: 15 },
      { title: "Leadership & Management", score: 13, max: 15 },
      { title: "Discipline",              score: 9,  max: 10 },
      { title: "Appearance & Neatness",   score: 9,  max: 10 },
    ],
    finalSections: [
      { title: "Knowledge of Rules",      score: 23, max: 25 },
      { title: "Alertness & Observation", score: 22, max: 25 },
      { title: "Safety Record",           score: 15, max: 15 },
      { title: "Leadership & Management", score: 13, max: 15 },
      { title: "Discipline",              score: 9,  max: 10 },
      { title: "Appearance & Neatness",   score: 9,  max: 10 },
    ],
    meta: { pmeStatus: "Fit", refStatus: "Cleared", alcoholicStatus: "Non-Alcoholic" },
    tiRemarks: "Excellent field performance. Approved as submitted.",
    tiModified: false, approvalDate: "2026-04-05",
    auditTrail: [{ action: "Approved without modification", by: "TI R. Khan", date: "2026-04-05" }]
  },
];

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

const INIT_SM_LIST = [
  { id: "SMA_5001", name: "S. Deshmukh", hrmsId: "SM_1001", station: "Parbhani Junction", lastDate: "2026-03-20", status: "Pending" },
  { id: "SMA_5002", name: "M. Patil",    hrmsId: "SM_2201", station: "Amla Junction",       lastDate: "2026-03-12", status: "Pending" },
  { id: "SMA_5003", name: "V. Singh",    hrmsId: "SM_2301", station: "Badnera Junction",   lastDate: "2026-03-15", status: "Submitted" },
  { id: "SMA_5004", name: "A. Kulkarni", hrmsId: "SM_2102", station: "Parbhani Junction",  lastDate: "2026-02-14", status: "Pending" },
];

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

const INIT_TM_LIST = [
  { id: "TMA_6001", name: "R. P. Yadav", hrmsId: "TM_3001", station: "Nagpur Junction", lastDate: "2026-04-02", status: "Pending" },
  { id: "TMA_6002", name: "S. K. Mishra", hrmsId: "TM_3002", station: "Parbhani Junction", lastDate: "2026-03-25", status: "Pending" },
  { id: "TMA_6003", name: "D. K. Sen", hrmsId: "TM_3003", station: "Badnera Junction", lastDate: "2026-03-18", status: "Submitted" },
  { id: "TMA_6004", name: "A. V. Joshi", hrmsId: "TM_3004", station: "Amla Junction", lastDate: "2026-02-28", status: "Pending" },
];

const INIT_SS_LIST = [
  { id: "SSA_7001", name: "S. K. Mukherjee", hrmsId: "SS_1001", station: "Nagpur Junction",    lastDate: "2026-04-05", status: "Pending" },
  { id: "SSA_7002", name: "H. S. Rawat",     hrmsId: "SS_1002", station: "Parbhani Junction",  lastDate: "2026-03-28", status: "Pending" },
  { id: "SSA_7003", name: "Anand Vardhan",   hrmsId: "SS_1003", station: "Akola Junction",     lastDate: "2026-03-10", status: "Submitted" },
];

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

const INIT_INSPECTIONS = [
  { id: "IN_101", date: "2026-05-10", station: "Amla Junction", officer: "TI R. Khan", observations: "Siding point interlocking operation checked. Satisfactory speed compliance.", risk: "Low", status: "Closed" },
  { id: "IN_102", date: "2026-05-18", station: "Chandrapur Station", officer: "TI R. Khan", observations: "Joint gap clearance in crossing 12B slightly wide. Safety Speed restriction of 15km/h advised.", risk: "Medium", status: "Active" },
  { id: "IN_103", date: "2026-05-24", station: "Akola Junction", officer: "TI R. Khan", observations: "Station Master logs audit. Slight delay in registering daily block clearing times.", risk: "Low", status: "Pending Action" }
];

const INIT_COUNSELLING = [
  { id: "CL_101", date: "2026-05-12", staffName: "D. Rane", designation: "Pointsman Grade II", station: "Amla Junction", topics: "Alcoholic rehabilitation counseling. Safety and alertness briefing.", duration: "45 mins", progress: "Under Monitor" },
  { id: "CL_102", date: "2026-05-20", staffName: "A. Gade", designation: "Pointsman Grade II", station: "Akola Junction", topics: "Periodic medical exam preparation. Rest compliance counseling.", duration: "30 mins", progress: "Completed" }
];

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

const INIT_TI_ASSESS_HISTORY = [
  {
    id: 1, date: "2026-03-20", period: "Q1 2026", assessedBy: "AOM_GM_1001 — P. Joshi",
    totalScore: 88, category: "A", approvalStatus: "Approved",
    aomRemarks: "Outstanding supervisory performance. Excellent cross-station coordination.",
    sections: [
      { title: "Whistle Codes & Hand Signals",          marks: 18, outOf: 20 },
      { title: "Token & Line Clear Authorities",        marks: 17, outOf: 20 },
      { title: "Station Interlocking & Track Circuits", marks: 18, outOf: 20 },
      { title: "Shunting Operations & Point Locking",   marks: 17, outOf: 20 },
      { title: "Gate Signals & Siding Isolation",        marks: 18, outOf: 20 },
    ],
    userAnswers: generateTiMockResponses(88)
  },
  {
    id: 2, date: "2025-12-15", period: "Q4 2025", assessedBy: "AOM_GM_1001 — P. Joshi",
    totalScore: 81, category: "A", approvalStatus: "Approved",
    aomRemarks: "Good performance. Minor issues in documentation speed.",
    sections: [
      { title: "Whistle Codes & Hand Signals",          marks: 16, outOf: 20 },
      { title: "Token & Line Clear Authorities",        marks: 16, outOf: 20 },
      { title: "Station Interlocking & Track Circuits", marks: 17, outOf: 20 },
      { title: "Shunting Operations & Point Locking",   marks: 15, outOf: 20 },
      { title: "Gate Signals & Siding Isolation",        marks: 17, outOf: 20 },
    ],
    userAnswers: generateTiMockResponses(81)
  },
  {
    id: 3, date: "2025-09-10", period: "Q3 2025", assessedBy: "AOM_GM_1001 — P. Joshi",
    totalScore: 93, category: "A", approvalStatus: "Approved",
    aomRemarks: "Exemplary. Best performing TI in the division this quarter.",
    sections: [
      { title: "Whistle Codes & Hand Signals",          marks: 19, outOf: 20 },
      { title: "Token & Line Clear Authorities",        marks: 18, outOf: 20 },
      { title: "Station Interlocking & Track Circuits", marks: 19, outOf: 20 },
      { title: "Shunting Operations & Point Locking",   marks: 18, outOf: 20 },
      { title: "Gate Signals & Siding Isolation",        marks: 19, outOf: 20 },
    ],
    userAnswers: generateTiMockResponses(93)
  }
];


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
  const [activePage, setActivePage]       = useState("dashboard");
  // Dynamic Graph Completer V3 Migration Block
  if (localStorage.getItem("ti_data_graph_complete_v3") !== "true") {
    localStorage.setItem("ti_users", JSON.stringify(POPULATED_USERS));
    localStorage.setItem("ti_sm_list", JSON.stringify(POPULATED_SM));
    localStorage.setItem("ti_tm_list", JSON.stringify(POPULATED_TM));
    localStorage.setItem("ti_ss_list", JSON.stringify(POPULATED_SS));
    localStorage.setItem("ti_data_graph_complete_v3", "true");
  }


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
  const [notifications, setNotifications] = useState([
    { id: 1, type: "danger", message: "CRITICAL: PME overdue for SM P. Wankhede (Akola Junction)", time: "Just now", read: false },
    { id: 2, type: "warning", message: "Safety alert: Joint gap crack observed at Chandrapur Crossing 12B", time: "2 hours ago", read: false },
    { id: 3, type: "success", message: "Audit cleared: Parbhani Junction monthly logs verified.", time: "1 day ago", read: true }
  ]);

  // System Audit Logs
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, timestamp: "2026-05-27 10:00:12", event: "User session initialized.", details: "IP: 10.24.12.8" },
    { id: 2, timestamp: "2026-05-27 10:02:44", event: "Dashboard KPI matrices synced successfully.", details: "Calculations based on 12 stations" }
  ]);

  // Master Users & Stations States
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem("ti_users");
    const initialList = saved ? JSON.parse(saved) : POPULATED_USERS;
    const hasSS = initialList.some(u => u.role === "Station Superintendent");
    if (!hasSS) {
      return [...initialList, ...DEFAULT_SS_TM_USERS];
    }
    return initialList;
  });
  useEffect(() => {
    localStorage.setItem("ti_users", JSON.stringify(users));
  }, [users]);

  const [stations, setStations] = useState(() => {
    const saved = localStorage.getItem("ti_stations");
    return saved ? JSON.parse(saved) : INIT_STATIONS;
  });
  useEffect(() => {
    localStorage.setItem("ti_stations", JSON.stringify(stations));
  }, [stations]);

  const [showAddStationModal, setShowAddStationModal] = useState(false);
  const [newStationData, setNewStationData] = useState({ name: "", code: "" });

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

  const [pmList, setPmList]               = useState(POPULATED_PM);
  const [smList, setSmList]               = useState(() => {
    const saved = localStorage.getItem("ti_sm_list");
    return saved ? JSON.parse(saved) : POPULATED_SM;
  });
  useEffect(() => {
    localStorage.setItem("ti_sm_list", JSON.stringify(smList));
  }, [smList]);

  const [tmList, setTmList]               = useState(() => {
    const saved = localStorage.getItem("ti_tm_list");
    return saved ? JSON.parse(saved) : POPULATED_TM;
  });
  useEffect(() => {
    localStorage.setItem("ti_tm_list", JSON.stringify(tmList));
  }, [tmList]);

  useEffect(() => {
    // Migration: automatically update any references of SM_2101 to SM_1001 in localStorage
    const savedUsers = localStorage.getItem("ti_users");
    if (savedUsers) {
      try {
        const parsed = JSON.parse(savedUsers);
        let changed = false;
        const updated = parsed.map(u => {
          if (u.id === "SM_2101") {
            changed = true;
            return { ...u, id: "SM_1001" };
          }
          return u;
        });
        if (changed) {
          localStorage.setItem("ti_users", JSON.stringify(updated));
          setUsers(updated);
        }
      } catch (e) {
        console.error(e);
      }
    }

    const savedSmList = localStorage.getItem("ti_sm_list");
    if (savedSmList) {
      try {
        const parsed = JSON.parse(savedSmList);
        let changed = false;
        const updated = parsed.map(s => {
          if (s.hrmsId === "SM_2101") {
            changed = true;
            return { ...s, hrmsId: "SM_1001" };
          }
          return s;
        });
        if (changed) {
          localStorage.setItem("ti_sm_list", JSON.stringify(updated));
          setSmList(updated);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const [inspections, setInspections]     = useState(INIT_INSPECTIONS);
  const [counsellings, setCounsellings]   = useState(INIT_COUNSELLING);
  
  // Interactive Self-Assessment State
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [tiAssessments, setTiAssessments] = useState(() => {
    const saved = localStorage.getItem("ti_assessments");
    let history = saved ? JSON.parse(saved) : INIT_TI_ASSESS_HISTORY;
    let changed = false;
    history = history.map(item => {
      if (!item.userAnswers) {
        changed = true;
        return {
          ...item,
          userAnswers: generateTiMockResponses(item.totalScore)
        };
      }
      return item;
    });
    if (changed) {
      localStorage.setItem("ti_assessments", JSON.stringify(history));
    }
    return history;
  });
  useEffect(() => {
    localStorage.setItem("ti_assessments", JSON.stringify(tiAssessments));
  }, [tiAssessments]);

  const [quizState, setQuizState]         = useState("idle"); // "idle" | "quiz" | "result"
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizAnswers, setQuizAnswers]     = useState(Array(25).fill(null));
  const [latestQuizScore, setLatestQuizScore] = useState(null);

  // AOM Assigned Exam State
  const [isExamAssigned, setIsExamAssigned] = useState(() => localStorage.getItem("ti_exam_assigned") === "true");

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
    const handleStorageChange = () => {
      const savedUsers = localStorage.getItem("ti_users");
      if (savedUsers) setUsers(JSON.parse(savedUsers));

      const savedStations = localStorage.getItem("ti_stations");
      if (savedStations) setStations(JSON.parse(savedStations));

      const savedSmList = localStorage.getItem("ti_sm_list");
      if (savedSmList) setSmList(JSON.parse(savedSmList));

      const savedSmForms = localStorage.getItem("ti_sm_forms");
      if (savedSmForms) setSmForms(JSON.parse(savedSmForms));

      setIsExamAssigned(localStorage.getItem("ti_exam_assigned") === "true");
    };
    window.addEventListener("storage", handleStorageChange);

    const interval = setInterval(() => {
      const current = localStorage.getItem("ti_exam_assigned") === "true";
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
  const [ssList, setSsList]               = useState(() => {
    const saved = localStorage.getItem("ti_ss_list");
    return saved ? JSON.parse(saved) : POPULATED_SS;
  });
  useEffect(() => {
    localStorage.setItem("ti_ss_list", JSON.stringify(ssList));
  }, [ssList]);
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
  const [rosterSearch, setRosterSearch]   = useState("");
  const [rosterStation, setRosterStation] = useState("All");
  const [rosterStatus, setRosterStatus]   = useState("All");
  const [rosterDate, setRosterDate]       = useState("");

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
    return stations.filter(st => !st.assignedTi || st.assignedTi === tiId);
  }, [stations, tiId]);

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
      avgScore: 80,
      safetyPct: 100,
      highRisk: 0,
      pointsmenCount: 0,
      assignedTi: tiId
    };
    setStations(prev => [...prev, newStation]);
    setShowAddStationModal(false);
    setNewStationData({ name: "", code: "" });
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

  /* ── Derived calculations ── */
  const myUsers = useMemo(() => {
    return users.filter(u => myStations.some(st => st.name === u.station));
  }, [users, myStations]);

  const myPmList = useMemo(() => {
    return pmList.filter(p => myStations.some(st => st.name === p.station));
  }, [pmList, myStations]);

  const mySmList = useMemo(() => {
    return smList.filter(s => myStations.some(st => st.name === s.station));
  }, [smList, myStations]);

  const myTmList = useMemo(() => {
    return tmList.filter(t => myStations.some(st => st.name === t.station));
  }, [tmList, myStations]);

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

  const myAssessmentMonthly = useMemo(() => {
    return MONTHLY.map(m => {
      const scale = myStations.length / 12.0;
      return {
        month: m.month,
        approved: Math.round(m.assessments * scale * 0.8),
        pending: Math.round(m.assessments * scale * 0.15),
        rejected: Math.round(m.assessments * scale * 0.04),
        overdue: Math.round(m.assessments * scale * 0.01)
      };
    });
  }, [myStations]);

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
      setZoomPopupSearch(clickedStationName);
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

  const finalizePM = (id,mode,rejectNote="") => {
    setPmList(prev=>prev.map(p=>{
      if (p.id!==id) return p;
      const secs  = editSections[id]||p.originalSections;
      const total = secs.reduce((s,x)=>s+x.score,0);
      const modified = JSON.stringify(secs)!==JSON.stringify(p.originalSections);
      const audit = [...(p.auditTrail||[]),{
        action: mode==="reject"?"Rejected":(modified?"Modified & Approved":"Approved without modification"),
        by:`TI ${tiName}`, date:new Date().toISOString().slice(0,10),
        remark: mode==="reject"?rejectNote:(tiRemarks[id]||"")
      }];
      return {
        ...p, status: mode==="reject"?"Rejected":"Approved",
        finalSections:mode==="reject"?p.originalSections:secs,
        finalScore:total, tiRemarks:tiRemarks[id]||rejectNote,
        tiModified:modified, approvalDate:new Date().toISOString().slice(0,10),
        auditTrail:audit
      };
    }));
    
    // Update target Pointsman's dynamic performance score in the main users database!
    const targetAssess = pmList.find(p => p.id === id);
    if (targetAssess && mode !== "reject") {
      const finalSecs = editSections[id] || targetAssess.originalSections;
      const finalSum = finalSecs.reduce((s, x) => s + x.score, 0);
      setUsers(prev => prev.map(u => u.id === targetAssess.hrmsId ? { ...u, score: finalSum, cat: getCat(finalSum) } : u));
    }

    setSelectedPmId(null);
    setStatusMsg(mode==="reject"?"Assessment rejected. SM has been notified.":`Assessment ${mode==="approve"?"approved":"modified & approved"} successfully.`);
    addAuditLog(mode==="reject"?"Rejected PM Assessment":"Approved PM Assessment", `Staff ID: ${targetAssess?.hrmsId || ""}, Score: ${mode==="reject"?"-":total}`);
    triggerNotification("success", `Reviewed PM Assessment for ${targetAssess?.pointsmanName || ""}.`);
    setReviewTab(mode==="reject"?"Rejected":"Approved");
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

  const submitCounselling = (e) => {
    e.preventDefault();
    const newRecord = {
      id: "CL_" + Date.now(),
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
    localStorage.removeItem("ti_exam_assigned");
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
          DEFAULT_SS_TM_USERS={[]} totalPM={pmList.length} totalSMs={smList.length}
          pending={myPmList.length + mySmList.length + myTmList.length}
          highRiskAll={users.filter(u => getUserRisk(u) === "High").length}
          avgScoreAll={Math.round(users.reduce((s, u) => s + (u.score || 0), 0) / (users.length || 1))}
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
          tiAssessments={tiAssessments} getCat={getCat} catBadge={catBadge} statusBadge={statusBadge}
          selectedRecord={selectedRecord} setSelectedRecord={setSelectedRecord}
          isExamAssigned={isExamAssigned} quizState={quizState} startQuiz={startQuiz}
          currentQuestion={currentQuestion} quizAnswers={quizAnswers} handleSelectQuizOpt={handleSelectQuizOpt}
          submitQuiz={submitQuiz} latestQuizScore={latestQuizScore} TI_QUIZ={TI_QUIZ}
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
                  {fullscreenChart === "station" && "Station-wise Safety & Performance — Deep Dive"}
                  {fullscreenChart === "trend"   && "Compliance & Assessment Trends — Deep Dive"}
                  {fullscreenChart === "grade"   && "Staff Grade Distribution (Pointsmen) — Deep Dive"}
                </h2>
                <p>Indian Railway Evaluation Command · Operations Workspace</p>
              </div>
            </div>
            <button className="sm2-fullscreen-close-btn" onClick={() => setFullscreenChart(null)}>
              ✕ Close
            </button>
          </div>

          {/* Filter Bar */}
          <div className="sm2-fullscreen-filter-bar">
            <span className="sm2-fs-filter-tag">FILTERS</span>
            <input
              type="text"
              placeholder={fullscreenChart === "station" ? "Search station name / code..." : "Search staff name / ID..."}
              value={fsSearch}
              onChange={e => setFsSearch(e.target.value)}
              className="sm2-fs-input"
            />
            {fullscreenChart !== "trend" && (
              <>
                <select value={fsCatFilter} onChange={e => setFsCatFilter(e.target.value)} className="sm2-fs-select">
                  <option value="All">All Grades (A-D)</option>
                  <option value="A">Grade A</option>
                  <option value="B">Grade B</option>
                  <option value="C">Grade C</option>
                  <option value="D">Grade D</option>
                </select>
                <select value={fsRiskFilter} onChange={e => setFsRiskFilter(e.target.value)} className="sm2-fs-select">
                  <option value="All">All Risk Levels</option>
                  <option value="High">High Risk</option>
                  <option value="Medium">Medium Risk</option>
                  <option value="Low">Low Risk</option>
                </select>
              </>
            )}
            <button onClick={() => { setFsSearch(""); setFsCatFilter("All"); setFsRiskFilter("All"); }} className="sm2-fs-reset-btn">
              Reset
            </button>
            <div className="sm2-fs-counter">
              {fullscreenChart === "station" && (
                <>Showing <strong>{filteredFsStations.length}</strong> of {stationStats.length} stations</>
              )}
              {fullscreenChart === "grade" && (
                <>Showing <strong>{filteredFsUsers.length}</strong> of {users.filter(u=>u.role==="Pointsman").length} Pointsmen</>
              )}
              {fullscreenChart === "trend" && (
                <>Displaying all <strong>{MONTHLY.length}</strong> monthly cycles</>
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