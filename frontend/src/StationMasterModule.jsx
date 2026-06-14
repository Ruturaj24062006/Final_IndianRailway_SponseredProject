import { useMemo, useState, useEffect } from "react";
import {
  AlertTriangle,
  Award,
  BarChart3,
  CalendarCheck2,
  CheckCircle2,
  ClipboardCheck,
  FileBarChart2,
  Filter,
  Gauge,
  LogOut,
  Search,
  ShieldCheck,
  TrendingUp,
  UserCircle2,
  Users,
  XCircle,
  ArrowUpDown,
  Activity,
  Lock,
  Info,
  Shield,
  FileDown,
  Maximize2,
  Plus,
  ArrowLeft,
  Building2,
  Edit,
  Trash2,
  UserPlus,
  ArrowRightLeft,
  Clock,
  HeartHandshake,
  Bell,
  Cpu
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar,
  LabelList
} from "recharts";
import { useLanguage } from "./utils/LanguageContext";
import "./sdom.css";
import SMDashboard from "./components/StationMasterModule/SMDashboard";
import UserProfile from "./components/UserProfile";
import CommonLayout from "./components/CommonLayout";
import SMPointsmen from "./components/StationMasterModule/SMPointsmen";
import SMAssess from "./components/StationMasterModule/SMAssess";
import MyAssessment from './components/MyAssessment';
import CommonReports from "./components/CommonReports";
import CommonUserModal from "./components/CommonUserModal";
import CommonPmePosition from "./components/CommonPmePosition";
import CommonRefPosition from "./components/CommonRefPosition";
import CommonCounselling from "./components/CommonCounselling";
import {
  getSmDashboard,
  getSmPointsmen,
  getSmPendingAssessments,
  getSmAssessmentHistory,
  getSmComplianceSummary,
  createAssessmentRequest,
  getSmShiftMasters,
  registerPointsman,
  updateMcqStatus
} from "./services/smService";
import { getToken } from "./utils/auth";
import { getSubordinates } from "./services/hierarchyService";


const DIVISION_STATIONS = [
  { id: "ST01", name: "Parbhani Junction", code: "PBN" },
  { id: "ST02", name: "Amla Junction", code: "AMLA" },
  { id: "ST03", name: "Badnera Junction", code: "BD" },
  { id: "ST04", name: "Nagpur Junction", code: "NGP" },
  { id: "ST05", name: "Akola Junction", code: "AK" },
  { id: "ST06", name: "Wardha Junction", code: "WR" },
  { id: "ST07", name: "Betul Station", code: "BYT" },
  { id: "ST08", name: "Itarsi Junction", code: "ET" },
  { id: "ST09", name: "Chandrapur Station", code: "CD" },
  { id: "ST10", name: "Gondia Junction", code: "G" },
  { id: "ST11", name: "Dhamangaon Station", code: "DMN" },
  { id: "ST12", name: "Pulgaon Junction", code: "PLO" }
];

/* ─── NAV ─── */
const navItems = [
  { key: "dashboard", label: "Dashboard", icon: Gauge },
  { key: "pointsmen", label: "Pointsmen", icon: Users },
  { key: "assess", label: "Assess Pointsmen", icon: ClipboardCheck },
  { key: "counselling", label: "Counselling", icon: HeartHandshake },
  { key: "pmePosition", label: "PME Position", icon: Activity },
  { key: "refPosition", label: "REF Position", icon: Award },
  { key: "myAssessment", label: "My Assessment", icon: FileBarChart2 },
  { key: "reports", label: "Reports and Analytics", icon: BarChart3 },
  { key: "profile", label: "My Profile", icon: UserCircle2 }
];

/* ─── HELPERS ─── */
function getCat(score) {
  if (score >= 80) return "A";
  if (score >= 50) return "B";
  if (score >= 26) return "C";
  return "D";
}
const CAT_COLOR = { A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#dc2626" };
const CAT_BG = { A: "#dcfce7", B: "#dbeafe", C: "#fef3c7", D: "#fee2e2" };
const PIE_COLORS = ["#16a34a", "#2563eb", "#d97706", "#dc2626"];

function getPerformanceSummaryText(totalScore, sections) {
  if (!sections || !sections.length) return "Periodic evaluation completed successfully.";
  const lowestSec = [...sections].sort((a, b) => a.marks - b.marks)[0];
  const highestSec = [...sections].sort((a, b) => b.marks - a.marks)[0];
  let summary = `Assessment score achieved: ${totalScore}/100 (${totalScore >= 80 ? 'Outstanding Competency' : totalScore >= 50 ? 'Satisfactory Operations' : 'Requires Training'}). `;
  summary += `Demonstrated excellent competency in "${highestSec.title}" scoring ${highestSec.marks}/${highestSec.outOf} marks. `;
  if (lowestSec.marks < lowestSec.outOf) {
    summary += `However, low-scoring markers are observed in "${lowestSec.title}" (${lowestSec.marks}/${lowestSec.outOf}). It is highly recommended to study the Station Working Rules (SWR) and undergo periodic coaching.`;
  } else {
    summary += `Achieved flawless accuracy in all modules. Recommended to maintain this premium standard in daily operations.`;
  }
  return summary;
}

function riskLevel(pm) {
  if (pm.safetyScore < 60 || pm.lastScore < 50) return "High";
  if (pm.safetyScore < 75 || pm.lastScore < 65) return "Medium";
  return "Low";
}
const RISK_COLOR = { High: "#dc2626", Medium: "#d97706", Low: "#16a34a" };
const RISK_BG = { High: "#fee2e2", Medium: "#fef3c7", Low: "#dcfce7" };

/* ─── SM PROFILE ─── */
const smProfile = {
  name: "S. Deshmukh",
  employeeId: "SM_1001",
  contact: "+91 98220 44556",
  designation: "Station Master",
  department: "Operations",
  station: "Nagpur Junction",
  reportingOfficer: "TI_2001 — A. Kulkarni",
  dob: "1985-04-12",
  dateOfAppointment: "2015-06-01",
  pmeDoneDate: "2024-06-02",
  pmeDueDate: "2028-06-01",
  isolatorCertificateIssuedDate: "2024-11-15",
  automaticTrainingDate: "2025-03-10",
  counsellingDate: "2026-01-20"
};

/* ─── POINTSMEN DATA ─── */
const initialPointsmen = [
  { id: 1, hrmsId: "PM_1001", name: "Ravi Kumar", gender: "Male", age: 38, doj: "2012-04-10", basePay: "₹28,500", lastScore: 92, safetyScore: 95, totalAssessments: 12, pmeStatus: "Fit", refStatus: "Cleared", disciplinary: "None", incidents: 0, approvalStatus: "Pending", monitoringStatus: "Active" },
  { id: 2, hrmsId: "PM_1102", name: "Sanjay Patil", gender: "Male", age: 34, doj: "2015-08-22", basePay: "₹26,200", lastScore: 78, safetyScore: 80, totalAssessments: 9, pmeStatus: "Fit", refStatus: "Cleared", disciplinary: "None", incidents: 0, approvalStatus: "Pending", monitoringStatus: "On Duty" },
  { id: 3, hrmsId: "PM_1103", name: "Deepak Nair", gender: "Male", age: 41, doj: "2009-11-05", basePay: "₹31,000", lastScore: 48, safetyScore: 62, totalAssessments: 15, pmeStatus: "Fit", refStatus: "Pending", disciplinary: "Warning", incidents: 1, approvalStatus: "Approved", monitoringStatus: "Off Duty" },
  { id: 4, hrmsId: "PM_1104", name: "Ajay Sharma", gender: "Male", age: 29, doj: "2019-02-18", basePay: "₹23,400", lastScore: 84, safetyScore: 88, totalAssessments: 6, pmeStatus: "Fit", refStatus: "Cleared", disciplinary: "None", incidents: 0, approvalStatus: "Pending", monitoringStatus: "Active" },
  { id: 5, hrmsId: "PM_1105", name: "Kunal Verma", gender: "Male", age: 36, doj: "2013-07-30", basePay: "₹27,800", lastScore: 35, safetyScore: 55, totalAssessments: 11, pmeStatus: "Unfit", refStatus: "Pending", disciplinary: "Warning", incidents: 2, approvalStatus: "Rejected", monitoringStatus: "Absent" },
  { id: 6, hrmsId: "PM_1106", name: "Priya Menon", gender: "Female", age: 31, doj: "2018-03-14", basePay: "₹25,100", lastScore: 67, safetyScore: 74, totalAssessments: 7, pmeStatus: "Fit", refStatus: "Cleared", disciplinary: "None", incidents: 0, approvalStatus: "Approved", monitoringStatus: "On Duty" },
  { id: 7, hrmsId: "PM_1107", name: "Ramesh Yadav", gender: "Male", age: 45, doj: "2005-09-01", basePay: "₹34,600", lastScore: 82, safetyScore: 90, totalAssessments: 18, pmeStatus: "Fit", refStatus: "Cleared", disciplinary: "None", incidents: 0, approvalStatus: "Approved", monitoringStatus: "Off Duty" },
  { id: 8, hrmsId: "PM_1108", name: "Sneha Iyer", gender: "Female", age: 28, doj: "2020-01-20", basePay: "₹22,000", lastScore: 19, safetyScore: 40, totalAssessments: 3, pmeStatus: "Unfit", refStatus: "Pending", disciplinary: "Serious", incidents: 3, approvalStatus: "Rejected", monitoringStatus: "Absent" }
];

/* ─── ASSESSMENT HISTORY per pointsman ─── */
const pmAssessmentHistory = {
  1: [{ id: 101, date: "2026-03-28", testMarks: 80, addMarks: 12, total: 92, grade: "A", approvalStatus: "Approved", remarks: "Excellent performance" }, { id: 102, date: "2025-12-15", testMarks: 74, addMarks: 10, total: 84, grade: "A", approvalStatus: "Approved", remarks: "Good" }],
  2: [{ id: 103, date: "2026-03-10", testMarks: 65, addMarks: 13, total: 78, grade: "B", approvalStatus: "Pending", remarks: "Satisfactory" }],
  3: [{ id: 104, date: "2026-02-15", testMarks: 38, addMarks: 10, total: 48, grade: "C", approvalStatus: "Approved", remarks: "Needs improvement in signals" }],
  4: [{ id: 105, date: "2026-03-18", testMarks: 72, addMarks: 12, total: 84, grade: "A", approvalStatus: "Pending", remarks: "Good fieldwork" }],
  5: [{ id: 106, date: "2026-01-20", testMarks: 25, addMarks: 10, total: 35, grade: "D", approvalStatus: "Rejected", tiRemarks: "TI: Score too low — re-assessment required" }],
  6: [{ id: 107, date: "2026-03-05", testMarks: 55, addMarks: 12, total: 67, grade: "B", approvalStatus: "Approved", remarks: "Consistent" }],
  7: [{ id: 108, date: "2026-03-20", testMarks: 70, addMarks: 12, total: 82, grade: "A", approvalStatus: "Approved", remarks: "Strong safety record" }],
  8: [{ id: 109, date: "2026-02-01", testMarks: 12, addMarks: 7, total: 19, grade: "D", approvalStatus: "Rejected", tiRemarks: "TI: Multiple incidents recorded" }]
};

/* ─── DRAFT ASSESSMENTS ─── */
const initialDrafts = [
  { pointsmanId: 1, hrmsId: "PM_1001", name: "Ravi Kumar", lastDate: "2026-03-28" },
  { pointsmanId: 2, hrmsId: "PM_1102", name: "Sanjay Patil", lastDate: "2026-03-10" },
  { pointsmanId: 4, hrmsId: "PM_1104", name: "Ajay Sharma", lastDate: "2026-03-18" }
];

/* ─── YES/NO CRITERIA LABELS ─── */
const YN_SECTIONS = [
  {
    key: "alertness", title: "Alertness & Observation",
    weight: 5, outOf: 25,
    criteria: [
      "Observes track and signals diligently",
      "Responds promptly to train movements",
      "Maintains vigilance during duty hours",
      "Reports anomalies immediately",
      "Demonstrates situational awareness"
    ]
  },
  {
    key: "safety", title: "Safety Record",
    weight: 3, outOf: 15,
    criteria: [
      "Follows all safety protocols consistently",
      "No safety violations in review period",
      "Wears required PPE at all times",
      "Participates in safety drills",
      "Maintains incident-free record"
    ]
  },
  {
    key: "leadership", title: "Leadership & Management",
    weight: 3, outOf: 15,
    criteria: [
      "Guides junior staff effectively",
      "Handles peak hours without disruption",
      "Communicates clearly with team",
      "Resolves operational issues promptly",
      "Maintains duty log accurately"
    ]
  },
  {
    key: "discipline", title: "Discipline",
    weight: 2, outOf: 10,
    criteria: [
      "Reports to duty on time",
      "Follows uniform and grooming standards",
      "Complies with supervisory instructions",
      "No disciplinary action in review period",
      "Maintains respectful conduct"
    ]
  },
  {
    key: "appearance", title: "Appearance & Neatness",
    weight: 2, outOf: 10,
    criteria: [
      "Uniform worn correctly and is clean",
      "Identification badge displayed",
      "Footwear as per regulation",
      "Grooming standards maintained",
      "Duty area kept tidy"
    ]
  }
];

const defaultAssessForm = {
  knowledgeMarks: "",
  alertness: Array(5).fill(null),
  safety: Array(5).fill(null),
  leadership: Array(5).fill(null),
  discipline: Array(5).fill(null),
  appearance: Array(5).fill(null),
  alcoholicStatus: "",
  pmeStatus: "Fit",
  refStatus: "Cleared",
  automaticTraining: "Not Required",
  counselling: "Not Required",
  dateOfAppointment: "",
  workingSince: "",
  remarks: ""
};

/* ─── SM TEST QUESTIONS (25 MCQs) ─── */
const smTestQuestions = [
  {
    id: 1,
    text: "Under Station Working Rules (SWR), what is the maximum speed permitted for a train passing through when main line points are set for loop line?",
    options: ["15 km/h", "30 km/h", "50 km/h", "As per Maximum Permissible Speed"],
    answer: 1,
    explanation: "As per standard operating manuals, the speed over loop lines is restricted to 30 km/h unless specifically authorized for 50 km/h with high-speed turnouts."
  },
  {
    id: 2,
    text: "In the Absolute Block System, what is the minimum distance required between two block stations to grant 'Line Clear'?",
    options: ["Station section length", "Block section length", "Adequate distance (usually 180m or 120m)", "Sighting board distance"],
    answer: 2,
    explanation: "Line Clear cannot be granted until the block section is clear and adequate distance (180m for absolute block, 120m for automatic block) is clear beyond the first stop signal."
  },
  {
    id: 3,
    text: "What does a double yellow aspect on a distant signal indicate to the loco pilot?",
    options: ["Proceed at Maximum Permissible Speed", "Prepare to stop at the next stop signal", "Prepare to pass next signal at caution/restricted speed", "Stop immediately"],
    answer: 2,
    explanation: "A double yellow aspect is an attention signal, warning the driver that they are approaching a signal showing a restrictive aspect (single yellow or red)."
  },
  {
    id: 4,
    text: "Who holds the ultimate administrative responsibility for the safe reception and dispatch of trains within station limits?",
    options: ["Section Controller", "Pointsman on duty", "Station Master", "Traffic Inspector"],
    answer: 2,
    explanation: "The Station Master is the overall in-charge of station limits and is personally responsible for ensuring all safety rules are followed during train reception and dispatch."
  },
  {
    id: 5,
    text: "When a passenger train is stopped at a station for an extended duration, what safety precaution must the Station Master take regarding the signals?",
    options: ["Ensure all reception signals are kept at green", "Ensure starter and advanced starter signals are kept at danger", "Inform the control room to disconnect track circuits", "Authorize the pointsman to reverse the points manually"],
    answer: 1,
    explanation: "Starter and advanced starter signals must be kept at 'Danger' to prevent accidental rolling or unauthorized departure of the train."
  },
  {
    id: 6,
    text: "If a train has parted mid-section, what is the primary duty of the Station Master upon noticing the parting?",
    options: ["Lower the Home signal for the next train", "Show red hand signal to the guard, do not lower signals for opposing directions", "Shunt the train immediately", "Call the Divisional Railway Manager"],
    answer: 1,
    explanation: "The SM must alert the train staff using a red hand signal to warn them of parting and ensure no other trains are authorized into the affected block section."
  },
  {
    id: 7,
    text: "What color of banner flag is used to protect a track section under engineering obstruction?",
    options: ["Green", "Yellow", "Red", "White"],
    answer: 2,
    explanation: "A red banner flag is placed across the rails to provide immediate visual protection for any track section undergoing maintenance or having an obstruction."
  },
  {
    id: 8,
    text: "How many detonators should be placed on the track to protect a train stalled in a block section on a double line?",
    options: ["1 detonator at 500m", "2 detonators at 1000m", "3 detonators (1 at 600m, 1 at 1200m, and 1 more 10m ahead)", "4 detonators placed randomly"],
    answer: 2,
    explanation: "According to general rules, 3 detonators must be placed: 1st at 600m, 2nd at 1200m, and the 3rd at 1210m from the stalled train to give warning in case of emergency."
  },
  {
    id: 9,
    text: "When points are blocked due to ballast or obstruction, what indication is observed on the VDU/Control Panel?",
    options: ["Steady green light", "Steady yellow light", "Flashing red/no indication (out of correspondence)", "Audible bell with green flashing light"],
    answer: 2,
    explanation: "When points cannot complete their operation and lock properly, they are 'out of correspondence,' showing a flashing red indicator or blank status on the panel."
  },
  {
    id: 10,
    text: "A 'Calling-on' signal is used under which of the following circumstances?",
    options: ["To permit a train to enter an obstructed line at slow speed", "To start a train from a loop line when starter is defective", "To warn the driver of an upcoming steep gradient", "To bypass shunting limits during night hours"],
    answer: 0,
    explanation: "A calling-on signal is a miniature signal fixed below a stop signal, used to admit a train into an occupied or obstructed line at restricted speed when the main signal cannot be cleared."
  },
  {
    id: 11,
    text: "Under what circumstances can a train pass a Semi-Automatic signal showing Red (Danger) in automatic territory?",
    options: ["After waiting for 1 minute by day / 2 minutes by night, then proceeding at restricted speed", "Only with written authority T-369(3b)", "Immediately at 15 km/h without stopping", "Only when accompanied by a pointsman"],
    answer: 0,
    explanation: "In automatic signaling territory, a loco pilot can pass a semi-automatic signal in automatic mode at danger after stopping for 1 min (day) or 2 min (night), proceeding with extreme caution at 10-15 km/h."
  },
  {
    id: 12,
    text: "What is the frequency of testing the emergency slide valves and emergency crossover operations by the Station Master?",
    options: ["Daily", "Weekly", "Fortnightly", "Monthly"],
    answer: 0,
    explanation: "Emergency crossover points and emergency signaling controls must be tested daily by the Station Master on duty to ensure high availability."
  },
  {
    id: 13,
    text: "During shunting of passenger coaches containing passengers, what is the maximum speed allowed?",
    options: ["15 km/h", "10 km/h", "5 km/h", "30 km/h"],
    answer: 0,
    explanation: "Shunting speed is strictly restricted to 15 km/h. When shunting coaching stock containing passengers, it must be performed with utmost care under direct supervisor control."
  },
  {
    id: 14,
    text: "What signal is used to indicate that the line is clear and shunting operations are authorized?",
    options: ["Shunt signal showing yellow", "Starter signal", "Home signal", "Shunt signal showing two white diagonal lights (or off position)"],
    answer: 3,
    explanation: "A position-light shunt signal in the 'off' position displays two diagonal white lights, indicating that shunting may proceed."
  },
  {
    id: 15,
    text: "To whom does a Gateman at an interlocked level crossing gate report immediately in case of gate defects?",
    options: ["Section Engineer (P-Way)", "Station Master in control of the section", "Traffic Inspector", "Divisional Safety Officer"],
    answer: 1,
    explanation: "The Gateman is under the direct operational control of the SM and must immediately report any gate defect or track obstruction to the SM on duty."
  },
  {
    id: 16,
    text: "Under the Absolute Block System, a train cannot enter the block section without obtaining:",
    options: ["Line Clear authority from the block station ahead", "Guard's hand signal", "Driver's whistle", "Passenger manifest clearance"],
    answer: 0,
    explanation: "Line Clear is the primary authority to proceed under the Absolute Block System, ensuring that the block section ahead is completely clear of other trains."
  },
  {
    id: 17,
    text: "The 'Advance Starter' signal is defined as:",
    options: ["The last stop signal of a station controlling entry into the block section", "The first stop signal of a station", "Shunting authority indicator", "Calling-on signal"],
    answer: 0,
    explanation: "The Advanced Starter is the last stop signal at a station, marking the boundary of station limits. Passing it represents entry into the block section."
  },
  {
    id: 18,
    text: "In case of total failure of communications on a single line section, which authority is given to the Loco Pilot?",
    options: ["T/B 602 (Authority to proceed during total failure)", "T/A 602", "T/C 602", "T/D 602"],
    answer: 0,
    explanation: "Form T/B 602 is the official authority issued to run trains during total failure of communication on a single line block section."
  },
  {
    id: 19,
    text: "When points are to be hand-cranked due to motor failure, what safety action is mandatory for the Station Master?",
    options: ["Ensure crank handle is locked back in the key box or kept in personal custody after use", "Rely entirely on the pointsman's verbal confirmation", "Lower the reception signals before cranking begins", "None, cranking is done independently by P-Way staff"],
    answer: 0,
    explanation: "The SM must keep the crank handle in safe custody or locked in the transmission box to prevent unauthorized point reversal during train movements."
  },
  {
    id: 20,
    text: "What form is issued to authorize a train to pass a defective Reception Stop Signal at Danger?",
    options: ["T/511", "T/512", "T/369(3b)", "T/806"],
    answer: 2,
    explanation: "Form T/369(3b) is the written authority to pass a defective reception stop signal at danger, which also contains speed restriction instructions."
  },
  {
    id: 21,
    text: "A Sighting Board is placed at what minimum distance before the First Stop Signal?",
    options: ["1400 metres", "1000 metres", "800 metres", "2000 metres"],
    answer: 0,
    explanation: "A sighting board is placed 1400 meters before the First Stop Signal (FSS) on high-speed lines to warn loco pilots of the upcoming signal location."
  },
  {
    id: 22,
    text: "What is the minimum adequate distance (overlap) required for shunting within station limits in the face of an approaching train?",
    options: ["45 metres", "180 metres", "120 metres", "90 metres"],
    answer: 1,
    explanation: "Under general safety rules, shunting must not be permitted within 180 meters of the path of an approaching train to prevent collision hazards."
  },
  {
    id: 23,
    text: "A flashing amber aspect on an auxiliary route indicator warns the driver of:",
    options: ["Severe speed restriction ahead", "Route deviation ahead onto a loop line", "Normal running speed on the main line", "Stop at next block station"],
    answer: 1,
    explanation: "A flashing amber aspect warns the loco pilot that the train is being routed onto a loop line or crossing over points, requiring an immediate speed reduction."
  },
  {
    id: 24,
    text: "During heavy rains or waterlogging exceeding rail level, what is the duty of the Station Master?",
    options: ["Suspend all traffic on the affected line and inform the controller", "Allow trains to pass at 15 km/h", "Allow trains only if the guard issues a permit", "Keep reception signals green to clear the yard"],
    answer: 0,
    explanation: "If water rises above rail level, the SM must immediately suspend train movements over that section, protect the track, and report the condition to the section controller."
  },
  {
    id: 25,
    text: "For shunting over a facing point that is not interlocked or has defective interlocking, what is the mandatory safety precaution?",
    options: ["Points must be clipped and padlocked", "Points must be clamped only", "Pointsman must hold the point lever manually", "No precaution needed, shunting speed is slow"],
    answer: 0,
    explanation: "Non-interlocked facing points must be securely clipped and padlocked before any train or shunting movement is authorized over them to prevent derailments."
  }
];

/* ─── SM SELF-ASSESSMENT HISTORY (done by TI) ─── */
const smAssessmentHistory = [
  {
    id: 1, date: "2026-03-25", period: "Q1 2026",
    assessedBy: "TI_2001 — R. Khan",
    totalScore: 86, category: "A", approvalStatus: "Approved",
    tiRemarks: "Station demonstrates strong operational discipline and safety culture.",
    sections: [
      { title: "Station Management", marks: 17, outOf: 20 },
      { title: "Safety Records", marks: 18, outOf: 20 },
      { title: "Staff Supervision", marks: 16, outOf: 20 },
      { title: "Emergency Handling", marks: 17, outOf: 20 },
      { title: "Documentation & Compliance", marks: 18, outOf: 20 }
    ],
    mcqResponses: [1, 2, 2, 2, 1, 1, 2, 2, 2, 0, 0, 0, 0, 3, 1, 0, 0, 0, 0, 2, 0, 1, 1, 0, 0]
  },
  {
    id: 2, date: "2025-12-18", period: "Q4 2025",
    assessedBy: "TI_2001 — R. Khan",
    totalScore: 79, category: "B", approvalStatus: "Approved",
    tiRemarks: "Good performance. Minor gaps in documentation — addressed in training.",
    sections: [
      { title: "Station Management", marks: 16, outOf: 20 },
      { title: "Safety Records", marks: 15, outOf: 20 },
      { title: "Staff Supervision", marks: 15, outOf: 20 },
      { title: "Emergency Handling", marks: 16, outOf: 20 },
      { title: "Documentation & Compliance", marks: 17, outOf: 20 }
    ],
    mcqResponses: [1, 2, 3, 2, 1, 1, 2, 2, 2, 1, 0, 0, 0, 2, 1, 0, 0, 2, 0, 2, 0, 1, 1, 1, 0]
  },
  {
    id: 3, date: "2025-09-10", period: "Q3 2025",
    assessedBy: "TI_2001 — R. Khan",
    totalScore: 91, category: "A", approvalStatus: "Approved",
    tiRemarks: "Excellent quarter. Exceptional handling of monsoon disruptions.",
    sections: [
      { title: "Station Management", marks: 19, outOf: 20 },
      { title: "Safety Records", marks: 18, outOf: 20 },
      { title: "Staff Supervision", marks: 18, outOf: 20 },
      { title: "Emergency Handling", marks: 19, outOf: 20 },
      { title: "Documentation & Compliance", marks: 17, outOf: 20 }
    ],
    mcqResponses: [1, 2, 2, 2, 1, 1, 2, 2, 2, 0, 0, 0, 0, 3, 1, 0, 0, 0, 0, 2, 0, 1, 1, 0, 0]
  },
  {
    id: 4, date: "2025-06-14", period: "Q2 2025",
    assessedBy: "TI_2001 — R. Khan",
    totalScore: 74, category: "B", approvalStatus: "Approved",
    tiRemarks: "Satisfactory. Focus needed on staff supervision logs.",
    sections: [
      { title: "Station Management", marks: 15, outOf: 20 },
      { title: "Safety Records", marks: 14, outOf: 20 },
      { title: "Staff Supervision", marks: 14, outOf: 20 },
      { title: "Emergency Handling", marks: 15, outOf: 20 },
      { title: "Documentation & Compliance", marks: 16, outOf: 20 }
    ],
    mcqResponses: [1, 2, 3, 2, 1, 2, 2, 1, 2, 1, 0, 1, 0, 2, 1, 0, 0, 2, 0, 2, 1, 1, 1, 1, 0]
  }
];

/* ─── SM SELF‑ASSESSMENT (done by TI) ─── */
const smSelfAssessment = {
  date: "2026-03-25",
  period: "Q1 2026",
  assessedBy: "TI_2001 — R. Khan",
  totalScore: 86,
  category: "A",
  approvalStatus: "Approved",
  tiRemarks: "Station demonstrates strong operational discipline and safety culture.",
  sections: [
    { title: "Station Management", marks: 17, outOf: 20 },
    { title: "Safety Records", marks: 18, outOf: 20 },
    { title: "Staff Supervision", marks: 16, outOf: 20 },
    { title: "Emergency Handling", marks: 17, outOf: 20 },
    { title: "Documentation & Compliance", marks: 18, outOf: 20 }
  ]
};

/* ─── MONTHLY TREND DATA ─── */
const monthlyTrend = [
  { month: "Nov 25", assessments: 6, avgScore: 71, safetyAvg: 68 },
  { month: "Dec 25", assessments: 5, avgScore: 74, safetyAvg: 72 },
  { month: "Jan 26", assessments: 7, avgScore: 68, safetyAvg: 70 },
  { month: "Feb 26", assessments: 8, avgScore: 77, safetyAvg: 75 },
  { month: "Mar 26", assessments: 8, avgScore: 80, safetyAvg: 79 }
];

/* ─── CUSTOM TOOLTIP ─── */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="sm2-tooltip">
        <strong>{label}</strong>
        {payload.map(p => <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>)}
      </div>
    );
  }
  return null;
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

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
function StationMasterModule({ user, onLogout }) {
  const { locale, changeLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [pageMode, setPageMode] = useState("default");
  const [statusMsg, setStatusMsg] = useState("");
  const [pointsmen, setPointsmen] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [submittedAssessments, setSubmittedAssessments] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [complianceSummary, setComplianceSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shiftMasters, setShiftMasters] = useState([]);

  const smName = user?.name || "S Deshmukh";
  const smId = user?.hrmsId || "SM_1001";
  const fullName = smName;
  const employeeId = smId;

  // Dynamic Station Master profile based on backend and context data
  const smProfile = {
    name: smName,
    employeeId: smId,
    contact: "+91 98220 44556",
    designation: "Station Master",
    department: "Operations",
    station: dashboardMetrics?.station_name || "Nagpur Junction",
    reportingOfficer: "TI_2001 — A. Kulkarni",
    dob: "1985-04-12",
    dateOfAppointment: "2015-06-01",
    pmeDoneDate: "2024-06-02",
    pmeDueDate: "2028-06-01",
    isolatorCertificateIssuedDate: "2024-11-15",
    automaticTrainingDate: "2025-03-10",
    counsellingDate: "2026-01-20"
  };

  const refreshData = async () => {
    try {
      setIsLoading(true);
      
      let rawPmList = [];
      let subList = [];
      try {
        const [pms, subs] = await Promise.all([
          getSmPointsmen(),
          getSubordinates().catch(err => {
            console.warn("Failed to fetch subordinates, falling back to station roster:", err);
            return [];
          })
        ]);
        rawPmList = pms || [];
        subList = subs || [];
      } catch (err) {
        console.error("Error loading pointsmen, attempting station-wide fallback:", err);
        rawPmList = await getSmPointsmen().catch(() => []);
      }

      const [metrics, pendingList, historyList, summary, shiftSMs] = await Promise.all([
        getSmDashboard(),
        getSmPendingAssessments(),
        getSmAssessmentHistory(),
        getSmComplianceSummary(),
        getSmShiftMasters().catch(err => {
          console.warn("Failed to fetch shift Station Masters:", err);
          return [];
        })
      ]);

      setDashboardMetrics(metrics);
      setComplianceSummary(summary);
      setShiftMasters(shiftSMs || []);

      if (subList && subList.length > 0) {
        const subHrmsIds = new Set(subList.map(s => (s.hrms_id || "").toUpperCase()));
        rawPmList = rawPmList.filter(p => subHrmsIds.has((p.hrms_id || "").toUpperCase()));
      }

      // Map backend pointsmen schema to UI expected properties
      const mappedPM = rawPmList.map(p => ({
        id: p.employee_id,
        hrmsId: p.hrms_id,
        name: p.full_name,
        contact: p.mobile,
        designation: p.designation || "Pointsman",
        station: p.station_name,
        lastScore: parseFloat(p.practical_score) || parseFloat(p.final_score) || 0,
        score: parseFloat(p.final_score) || 0,
        safetyScore: parseFloat(p.overall_compliance_percentage) || 0,
        totalAssessments: 1,
        pmeStatus: p.pme_status === 'Valid' ? 'Fit' : p.pme_status === 'Expired' ? 'Overdue' : 'Pending',
        pmeDate: p.pme_date,
        pmeDueDate: p.pme_next_due_date,
        refStatus: p.ref_status === 'Valid' ? 'Cleared' : p.ref_status === 'Expired' ? 'Expired' : 'Pending',
        refDate: p.ref_date,
        refDueDate: p.ref_next_due_date,
        cbtStatus: p.cbt_status,
        cbtScore: p.cbt_score,
        cbtResult: p.cbt_result,
        approvalStatus: p.assessment_status || "Not Started",
        monitoringStatus: "Active",
        cat: p.category_grade || getCat(parseFloat(p.practical_score) || parseFloat(p.final_score) || 0),
        category_grade: p.category_grade
      }));
      setPointsmen(mappedPM);

      // Map pending assessments
      const mappedDrafts = pendingList.map(d => ({
        pointsmanId: d.employee_id,
        hrmsId: d.employee_hrms_id,
        name: d.employee_name,
        lastDate: d.assessment_date,
        assessment_id: d.assessment_id,
        ...d
      }));
      setDrafts(mappedDrafts);

      // Map history assessments
      const mappedHistory = historyList.map(h => ({
        id: h.assessment_id,
        pointsmanId: h.employee_id,
        hrmsId: h.employee_hrms_id,
        name: h.employee_name,
        date: h.assessment_date,
        testMarks: parseFloat(h.cbt_score) || 0,
        addMarks: 0,
        total: parseFloat(h.practical_score) || 0,
        grade: h.grade_name || getCat(parseFloat(h.practical_score) || 0),
        approvalStatus: h.status,
        tiRemarks: h.remarks,
        ...h
      }));
      setSubmittedAssessments(mappedHistory);
    } catch (err) {
      console.error("Failed to load Station Master data from APIs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitiateAssessment = async (employeeId) => {
    try {
      setStatusMsg("Initiating safety assessment request...");
      await createAssessmentRequest(employeeId, new Date().toISOString().slice(0, 10));
      setStatusMsg("Safety assessment request initiated successfully.");
      await refreshData();
      alert("Safety assessment request initiated successfully! Pointsman can now attempt the safety exam.");
    } catch (err) {
      console.error("Error initiating assessment:", err);
      alert(err.message || "Failed to initiate assessment request.");
    }
  };

  const handleClearRef = (pointsman) => {
    setPointsmen(prev => prev.map(p => {
      if (p.hrmsId === pointsman.hrmsId) {
        return {
          ...p,
          refStatus: 'Cleared',
          refDate: new Date().toISOString().split('T')[0],
          refDueDate: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
      }
      return p;
    }));
    alert(`Successfully cleared Refresher Training (REF) status for ${pointsman.name} (${pointsman.hrmsId}).`);
  };

  const handleScheduleCounsellingFromPme = (pointsman) => {
    const todayStr = new Date(Date.now() + 24*60*60*1000).toISOString().slice(0, 16);
    const saved = localStorage.getItem("sm_counsel_schedules");
    const counselSchedules = saved ? JSON.parse(saved) : {};
    const [date, time] = todayStr.split("T");
    const updated = {
      ...counselSchedules,
      [pointsman.id]: { date, time, attended: false }
    };
    localStorage.setItem("sm_counsel_schedules", JSON.stringify(updated));
    alert(`Counselling scheduled for ${pointsman.name} on ${date} at ${time}.`);
    setActiveTab("counselling");
  };

  const handleToggleMcqStatus = async (assessmentId, nextMcqStatus) => {
    try {
      setStatusMsg("Updating MCQ exam access status...");
      await updateMcqStatus(assessmentId, nextMcqStatus);
      setStatusMsg(`CBT exam access updated to ${nextMcqStatus}.`);
      await refreshData();
    } catch (err) {
      console.error("Error updating MCQ status:", err);
      alert(err.message || "Failed to update CBT exam status.");
    }
  };

  useEffect(() => {
    if (employeeId) {
      refreshData();
      const interval = setInterval(() => {
        refreshData();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [employeeId]);

  const [selectedPm, setSelectedPm] = useState(null);
  const [assessTarget, setAssessTarget] = useState(null);
  const [assessForm, setAssessForm] = useState(defaultAssessForm);
  const [assessLocked, setAssessLocked] = useState(false);
  const [myAssessSelected, setMyAssessSelected] = useState(null);
  const [pmFilter, setPmFilter] = useState({ search: "", grade: "All", status: "All", risk: "All" });
  const [reportFilter, setReportFilter] = useState({ search: "", grade: "All", risk: "All", sortBy: "date-desc" });
  const [activatedTests, setActivatedTests] = useState(() => {
    const saved = localStorage.getItem("sm_pm_activated_tests");
    return saved ? JSON.parse(saved) : {};
  });
  const [repApplied, setRepApplied] = useState(false);
  const [selectedReportUserId, setSelectedReportUserId] = useState(null);
  const [repF, setRepF] = useState({ search: "", cat: "All", risk: "All" });
  const [viewingStaff, setViewingStaff] = useState(null);

  // Pointsman Replicated Dashboard States & Helpers
  const [pmModal, setPmModal] = useState(null);
  const [pmF, setPmF] = useState({ name: "", station: "All", cat: "All", risk: "All" });
  const [viewingPm, setViewingPm] = useState(null);

  const openPmAdd = () => {
    setPmModal({
      mode: "add",
      data: {
        id: `PM_${Date.now().toString().slice(-4)}`,
        hrmsId: `PM_${Date.now().toString().slice(-4)}`,
        name: "",
        role: "Pointsman",
        designation: "Pointsman Grade I",
        station: smProfile.station || "Nagpur Junction",
        cat: "A",
        lastAssessDate: new Date().toISOString().split('T')[0],
        score: 80,
        lastScore: 80,
        safetyScore: 90,
        totalAssessments: 1,
        pmeStatus: "Fit",
        refStatus: "Cleared",
        contact: "",
        joiningDate: new Date().toISOString().split('T')[0],
        doj: new Date().toISOString().split('T')[0],
        gender: "Male",
        age: 35,
        basePay: "₹25,000",
        approvalStatus: "Approved",
        reportingSm: smProfile.name || "S. Deshmukh (SM)",
        workLocation: "Yard",
        shift: "Morning Shift (06:00 - 14:00)"
      }
    });
  };

  const openPmEdit = (pm) => {
    setPmModal({
      mode: "edit",
      data: { ...pm }
    });
  };

  const openPmShift = (pm) => {
    setPmModal({
      mode: "shift",
      data: { ...pm }
    });
  };

  const savePmModal = async () => {
    if (!pmModal.data.name || !pmModal.data.hrmsId) {
      alert("Name and HRMS ID are required.");
      return;
    }
    if (pmModal.mode === "shift") {
      const targetStation = pmModal.data.targetStation || pmModal.data.station;
      if (targetStation) {
        setPointsmen(prev => prev.filter(u => u.hrmsId !== pmModal.data.hrmsId));
        alert(`${pmModal.data.name} transferred to ${targetStation} station successfully.`);
        setPmModal(null);
        return;
      }
    }
    if (pmModal.mode === "add") {
      try {
        await registerPointsman({
          name: pmModal.data.name,
          contact: pmModal.data.contact || pmModal.data.contactNumber || "N/A",
          hrmsId: pmModal.data.hrmsId,
          email: pmModal.data.email || pmModal.data.emailId || "",
          cat: pmModal.data.cat || pmModal.data.category || "A",
          joiningDate: pmModal.data.joiningDate || pmModal.data.doj
        });
        alert(`Pointsman registered successfully!\nHRMS ID: ${pmModal.data.hrmsId}\nDefault Password: Railway@123`);
        refreshData();
      } catch (err) {
        alert("Failed to register Pointsman: " + err.message);
        return;
      }
    } else {
      setPointsmen(prev => prev.map(u => u.hrmsId === pmModal.data.hrmsId ? pmModal.data : u));
    }
    setPmModal(null);
  };

  const removePm = (hrmsId) => {
    if (window.confirm("Remove this pointsman?")) {
      setPointsmen(prev => prev.filter(u => u.hrmsId !== hrmsId));
    }
  };

  // Fullscreen Analytics States
  const [fullscreenChart, setFullscreenChart] = useState(null); // 'monthly' | 'safety' | 'performance' | null
  const [fsStartDate, setFsStartDate] = useState("");
  const [fsEndDate, setFsEndDate] = useState("");
  const [fsCategory, setFsCategory] = useState("All");
  const [fsRisk, setFsRisk] = useState("All");
  const [fsSearch, setFsSearch] = useState("");

  // Reactively Filtered Pointsmen for Fullscreen View
  const filteredFsPointsmen = useMemo(() => {
    return pointsmen.filter(p => {
      const q = fsSearch.toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.hrmsId.toLowerCase().includes(q);
      const matchCategory = fsCategory === "All" || getCat(p.lastScore) === fsCategory;
      const matchRisk = fsRisk === "All" || riskLevel(p) === fsRisk;

      const pmHistoryList = pmAssessmentHistory[p.id] || [];
      const mostRecentDate = pmHistoryList.length > 0 ? pmHistoryList[0].date : p.doj;
      let matchDate = true;
      if (fsStartDate) matchDate = matchDate && mostRecentDate >= fsStartDate;
      if (fsEndDate) matchDate = matchDate && mostRecentDate <= fsEndDate;

      return matchSearch && matchCategory && matchRisk && matchDate;
    });
  }, [pointsmen, fsSearch, fsCategory, fsRisk, fsStartDate, fsEndDate]);

  // Reactively Recalculated Monthly Trend for Fullscreen View
  const dynamicMonthlyTrend = useMemo(() => {
    const months = [
      { label: "Nov 25", start: "2025-11-01", end: "2025-11-30", fallbackScore: 71, fallbackSafety: 68 },
      { label: "Dec 25", start: "2025-12-01", end: "2025-12-31", fallbackScore: 74, fallbackSafety: 72 },
      { label: "Jan 26", start: "2026-01-01", end: "2026-01-31", fallbackScore: 68, fallbackSafety: 70 },
      { label: "Feb 26", start: "2026-02-01", end: "2026-02-28", fallbackScore: 77, fallbackSafety: 75 },
      { label: "Mar 26", start: "2026-03-01", end: "2026-03-31", fallbackScore: 80, fallbackSafety: 79 }
    ];

    return months.map(m => {
      let totalScore = 0;
      let totalSafety = 0;
      let count = 0;

      filteredFsPointsmen.forEach(p => {
        const pmHistoryList = pmAssessmentHistory[p.id] || [];
        const matches = pmHistoryList.filter(h => h.date >= m.start && h.date <= m.end);
        matches.forEach(h => {
          totalScore += h.total;
          totalSafety += p.safetyScore;
          count++;
        });
      });

      return {
        month: m.label,
        assessments: count > 0 ? count : 5,
        avgScore: count > 0 ? Math.round(totalScore / count) : m.fallbackScore,
        safetyAvg: count > 0 ? Math.round(totalSafety / count) : m.fallbackSafety
      };
    });
  }, [filteredFsPointsmen]);

  // History State
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem(`sm_history_${smId}`);
    return saved ? JSON.parse(saved) : smAssessmentHistory;
  });

  const latestScore = history.length > 0 ? history[0].totalScore || history[0].total : 86;
  const latestCategory = history.length > 0 ? history[0].category : "A";

  const averageScore = history.length
    ? Math.round(history.reduce((s, i) => s + (i.totalScore || i.total || 0), 0) / history.length)
    : 80;
  const complianceRate = 92;
  const stationHistory = history;
  const scoreHistory = [];
  const barChartData = [];

  const latestPmeStatus = smProfile.pmeDueDate ? `Due: ${smProfile.pmeDueDate}` : "Fit";
  const latestRefStatus = smProfile.automaticTrainingDate ? `Completed: ${smProfile.automaticTrainingDate}` : "Cleared";

  const openScorecard = (record) => {
    setMyAssessSelected(record);
    setActiveTab("myAssessment");
    setPageMode("default");
  };

  const handleReattempt = () => {
    localStorage.removeItem(`sm_mcq_test_${smId}`);
    localStorage.setItem(`sm_test_assigned_${smId}`, "Assigned");
    setSmMcqTest(null);
    setTestAssigned("Assigned");
    setActiveQIdx(0);
    setTestResponses(Array(25).fill(null));
    setPageMode("takeTest");
    setStatusMsg("CBT safety exam re-attempt session started.");
  };

  const performanceSummaryText = useMemo(() => {
    const rec = myAssessSelected || (history && history[0]);
    if (!rec) return "";
    return getPerformanceSummaryText(rec.totalScore || rec.total || 0, rec.sections);
  }, [myAssessSelected, history]);

  // MCQ Test State
  const [smMcqTest, setSmMcqTest] = useState(() => {
    const saved = localStorage.getItem(`sm_mcq_test_${smId}`);
    return saved ? JSON.parse(saved) : null;
  });

  // MCQ Test Assignment State
  const [testAssigned, setTestAssigned] = useState(() => {
    const saved = localStorage.getItem(`sm_test_assigned_${smId}`);
    if (saved === null) {
      localStorage.setItem(`sm_test_assigned_${smId}`, "Assigned");
      return "Assigned";
    }
    return saved;
  });

  // Active MCQ Attempt States
  const [activeQIdx, setActiveQIdx] = useState(0);
  const [testResponses, setTestResponses] = useState(() => Array(25).fill(null));

  const startTestAttempt = () => {
    setActiveQIdx(0);
    setTestResponses(Array(25).fill(null));
    setPageMode("takeTest");
  };

  const handleSubmitTestAttempt = () => {
    const correctCount = testResponses.filter((r, idx) => r === smTestQuestions[idx].answer).length;
    const percentage = Math.round((correctCount / 25) * 100);
    const passStatus = percentage >= 60 ? "PASSED" : "FAILED";
    const today = new Date().toISOString().slice(0, 10);

    // Save to local storage for SM
    const testResult = {
      completed: true,
      correctCount: correctCount,
      responses: [...testResponses],
      submittedDate: today,
      percentage: percentage,
      passStatus: passStatus
    };
    localStorage.setItem(`sm_mcq_test_${smId}`, JSON.stringify(testResult));
    setSmMcqTest(testResult);

    // Update assigned status to 'Completed'
    localStorage.setItem(`sm_test_assigned_${smId}`, "Completed");
    setTestAssigned("Completed");

    // Generate a completed History record representing the Online self-exam
    const record = {
      id: Date.now(),
      date: today,
      period: "Q2 2026",
      assessedBy: "Online Self-Exam",
      totalScore: correctCount,
      category: getCat(percentage),
      approvalStatus: "Completed",
      tiRemarks: `Completed online safety competency assessment. Score: ${percentage}% (${correctCount}/25 correct). Awaiting TI evaluation.`,
      sections: [
        { title: "MCQ Safety & Rule Exam", marks: correctCount, outOf: 25 }
      ],
      mcqResponses: [...testResponses],
      isOnlineExam: true
    };

    const newHistory = [record, ...history];
    setHistory(newHistory);
    localStorage.setItem(`sm_history_${smId}`, JSON.stringify(newHistory));

    // Also notify TI list in localStorage!
    let tiSmListStr = localStorage.getItem("ti_sm_list");
    let tiSmList = tiSmListStr ? JSON.parse(tiSmListStr) : null;
    if (tiSmList) {
      tiSmList = tiSmList.map(s => s.hrmsId === smId ? { ...s, status: "Submitted", score: correctCount } : s);
      localStorage.setItem("ti_sm_list", JSON.stringify(tiSmList));
    }

    setPageMode("default");
    setStatusMsg(`Assessment submitted! Score: ${percentage}% (${correctCount}/25). Status: Completed.`);
  };

  /* ─── Derived: stats ─── */
  const stats = useMemo(() => {
    const total = pointsmen.length;
    const pending = drafts.length;
    const completed = Object.values(pmAssessmentHistory).flat().length + submittedAssessments.length;
    const highRisk = pointsmen.filter(p => riskLevel(p) === "High").length;
    const safetyPct = Math.round(
      pointsmen.reduce((s, p) => s + p.safetyScore, 0) / pointsmen.length
    );
    return { total, pending, completed, highRisk, safetyPct };
  }, [pointsmen, drafts, submittedAssessments]);

  /* ─── Pie: category dist ─── */
  const pieData = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    pointsmen.forEach(p => { counts[getCat(p.lastScore)]++; });
    return Object.entries(counts).filter(([, c]) => c > 0)
      .map(([cat, count]) => ({ name: cat, value: count }));
  }, [pointsmen]);

  /* ─── Bottom performers ─── */
  const lowPerformers = useMemo(() =>
    [...pointsmen].sort((a, b) => a.lastScore - b.lastScore).slice(0, 4)
    , [pointsmen]);

  /* ─── Filtered pointsmen list ─── */
  const filteredPm = useMemo(() => {
    return pointsmen.filter(p => {
      const clean = s => s.toLowerCase().trim().replace(/\s+/g, '').replace(/junction|central|main|town|jn|station/gi, '');
      const pmSt = p.station || "Nagpur Junction";
      const smSt = smProfile.station || "Nagpur Junction";
      if (clean(pmSt) !== clean(smSt) && !clean(pmSt).includes(clean(smSt)) && !clean(smSt).includes(clean(pmSt))) return false;

      if (pmF.name) {
        const s = pmF.name.toLowerCase();
        if (!p.name.toLowerCase().includes(s) && !p.hrmsId.toLowerCase().includes(s)) return false;
      }
      if (pmF.cat !== "All" && getCat(p.lastScore) !== pmF.cat) return false;
      if (pmF.risk !== "All" && riskLevel(p) !== pmF.risk) return false;
      return true;
    });
  }, [pointsmen, pmF]);

  /* ─── Filtered reports ─── */
  const filteredReports = useMemo(() => {
    let list = pointsmen.filter(p => {
      const q = reportFilter.search.toLowerCase();
      const srch = !q || p.name.toLowerCase().includes(q) || p.hrmsId.toLowerCase().includes(q);
      const grade = reportFilter.grade === "All" || getCat(p.lastScore) === reportFilter.grade;
      const risk = reportFilter.risk === "All" || riskLevel(p) === reportFilter.risk;
      return srch && grade && risk;
    });
    if (reportFilter.sortBy === "score-desc") list = [...list].sort((a, b) => b.lastScore - a.lastScore);
    else if (reportFilter.sortBy === "score-asc") list = [...list].sort((a, b) => a.lastScore - b.lastScore);
    return list;
  }, [pointsmen, reportFilter]);

  /* ─── Navigation ─── */
  const switchTab = (tab) => {
    setActiveTab(tab);
    setPageMode("default");
    setStatusMsg("");
    setSelectedReportUserId(null);
    setRepApplied(false);
  };

  /* ─── Open PM detail ─── */
  const openPmDetail = (pm) => { setSelectedPm(pm); setPageMode("pmDetail"); };

  /* ─── Open assess form ─── */
  const openAssessForm = (draft) => {
    setAssessTarget(draft);

    // Load MCQ score if it exists in localStorage
    const mcqDataStr = localStorage.getItem(`pm_mcq_test_${draft.hrmsId}`);
    const mcqData = mcqDataStr ? JSON.parse(mcqDataStr) : null;
    const initialMcqMarks = mcqData && mcqData.completed ? String(mcqData.correctCount) : "0";

    // Load local draft if any exists
    const savedDraftStr = localStorage.getItem(`sm_draft_form_${draft.hrmsId}`);
    const savedDraft = savedDraftStr ? JSON.parse(savedDraftStr) : null;

    if (savedDraft) {
      setAssessForm(savedDraft);
    } else {
      setAssessForm({
        ...defaultAssessForm,
        knowledgeMarks: initialMcqMarks
      });
    }
    setAssessLocked(false);
    setPageMode("assessForm");
  };

  /* ─── Yes/No toggle helper ─── */
  const toggleYN = (sectionKey, idx, val) => {
    if (assessLocked) return;
    setAssessForm(prev => {
      const next = [...prev[sectionKey]];
      next[idx] = next[idx] === val ? null : val;
      return { ...prev, [sectionKey]: next };
    });
  };

  /* ─── Live score computer ─── */
  const computeScore = (form) => {
    const knowledge = Math.min(parseInt(form.knowledgeMarks) || 0, 25);
    let ynTotal = 0;
    YN_SECTIONS.forEach(s => {
      form[s.key].forEach(v => { if (v === "Yes") ynTotal += s.weight; });
    });
    return { knowledge, ynTotal, total: knowledge + ynTotal };
  };

  /* ─── Submit assessment ─── */
  const submitAssessment = async (isDraft) => {
    if (isDraft) {
      localStorage.setItem(`sm_draft_form_${assessTarget.hrmsId}`, JSON.stringify(assessForm));
      setStatusMsg("Draft saved successfully to local storage.");
      return;
    }

    if (!assessForm.alcoholicStatus) {
      setStatusMsg("Alcoholic / Non-Alcoholic status is mandatory.");
      return;
    }

    try {
      setStatusMsg("Submitting evaluation to Traffic Inspector...");
      
      const scores = [];
      
      // 1. alertness -> IDs 1 to 5
      assessForm.alertness.forEach((v, idx) => {
        scores.push({
          checklist_id: idx + 1,
          response: v || "No",
          marks_awarded: v === "Yes" ? 4 : 0
        });
      });
      
      // 2. safety -> IDs 6 to 10
      assessForm.safety.forEach((v, idx) => {
        scores.push({
          checklist_id: idx + 6,
          response: v || "No",
          marks_awarded: v === "Yes" ? 4 : 0
        });
      });
      
      // 3. leadership -> IDs 11 to 15
      assessForm.leadership.forEach((v, idx) => {
        scores.push({
          checklist_id: idx + 11,
          response: v || "No",
          marks_awarded: v === "Yes" ? 4 : 0
        });
      });
      
      // 4. discipline -> IDs 16 to 20
      assessForm.discipline.forEach((v, idx) => {
        scores.push({
          checklist_id: idx + 16,
          response: v || "No",
          marks_awarded: v === "Yes" ? 4 : 0
        });
      });
      
      // 5. appearance -> IDs 21 to 25
      assessForm.appearance.forEach((v, idx) => {
        scores.push({
          checklist_id: idx + 21,
          response: v || "No",
          marks_awarded: v === "Yes" ? 4 : 0
        });
      });

      const token = getToken() || localStorage.getItem("token");
      let response;
      try {
        response = await fetch(`http://127.0.0.1:5000/api/assessments/${assessTarget.assessment_id}/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            scores,
            remarks: assessForm.remarks
          })
        });
      } catch {
        response = await fetch(`/api/assessments/${assessTarget.assessment_id}/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            scores,
            remarks: assessForm.remarks
          })
        });
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to submit assessment to database.");
      }

      setStatusMsg("Assessment evaluation submitted successfully to Traffic Inspector.");
      setAssessLocked(true);
      
      // Clear local draft
      localStorage.removeItem(`sm_draft_form_${assessTarget.hrmsId}`);
      
      // Refresh backend datasets
      await refreshData();
      
      setPageMode("default");
    } catch (err) {
      console.error("Error submitting assessment:", err);
      setStatusMsg(`Error: ${err.message}`);
    }
  };

  /* ════ RENDERERS ════ */

  /* ── DASHBOARD ── */
  /* ─── Content dispatcher ─── */
  const renderContent = () => {
    if (pageMode === "takeTest") {
      return (
        <MyAssessment
          roleTitle="Station Master"
          assessedByTitle="Traffic Inspector"
          myAssessSelected={myAssessSelected}
          setMyAssessSelected={setMyAssessSelected}
          performanceSummaryText={performanceSummaryText}
          testQuestions={smTestQuestions}
          testAssigned={testAssigned}
          mcqTest={smMcqTest}
          startTestAttempt={startTestAttempt}
          history={history}
          openScorecard={openScorecard}
          handleReattempt={handleReattempt}
          activeQIdx={activeQIdx}
          setActiveQIdx={setActiveQIdx}
          testResponses={testResponses}
          setTestResponses={setTestResponses}
          handleSubmitTestAttempt={handleSubmitTestAttempt}
          screenMode={pageMode}
          setScreenMode={setPageMode}
          fullName={fullName}
          employeeId={employeeId}
          profileData={smProfile}
        />
      );
    }

    switch (activeTab) {
      case "dashboard":
        return (
          <SMDashboard
            smList={shiftMasters}
            averageScore={averageScore}
            complianceRate={complianceRate}
            pointsmen={pointsmen}
            stationHistory={stationHistory}
            scoreHistory={scoreHistory}
            barChartData={barChartData}
            pieData={pieData}
            openScorecard={openScorecard}
            latestCategory={latestCategory}
            latestScore={latestScore}
            latestPmeStatus={latestPmeStatus}
            latestRefStatus={latestRefStatus}
            smId={employeeId}
            drafts={drafts}
            riskLevel={riskLevel}
            getCat={getCat}
            setActiveTab={setActiveTab}
            viewingStaff={viewingStaff}
            setViewingStaff={setViewingStaff}
            openPmDetail={openPmDetail}
            dashboardMetrics={dashboardMetrics}
            onInitiateAssessment={handleInitiateAssessment}
          />
        );
      case "profile":
        return (
          <UserProfile
            fullName={fullName}
            employeeId={employeeId}
            latestCategory={latestCategory}
            latestScore={latestScore}
            history={history}
            profileData={smProfile}
          />
        );
      case "pointsmen":
        return (
          <SMPointsmen
            pointsmen={pointsmen}
            setPointsmen={setPointsmen}
            stationMasterProfile={smProfile}
            employeeId={employeeId}
            selectedPointsman={selectedPm}
            setSelectedPointsman={setSelectedPm}
            pmModal={pmModal}
            setPmModal={setPmModal}
            openPmAdd={openPmAdd}
            openPmEdit={openPmEdit}
            openPmShift={openPmShift}
            savePmModal={savePmModal}
            removePm={removePm}
            pmF={pmF}
            setPmF={setPmF}
            stations={DIVISION_STATIONS}
            filteredPm={filteredPm}
            viewingPm={viewingPm}
            setViewingPm={setViewingPm}
            riskLevel={riskLevel}
            getCat={getCat}
            CAT_BG={CAT_BG}
            CAT_COLOR={CAT_COLOR}
            RISK_BG={RISK_BG}
            RISK_COLOR={RISK_COLOR}
            onInitiateAssessment={handleInitiateAssessment}
          />
        );
      case "assess":
        return (
          <SMAssess
            screenMode={pageMode}
            setScreenMode={setPageMode}
            assessTarget={assessTarget}
            setAssessTarget={setAssessTarget}
            assessForm={assessForm}
            setAssessForm={setAssessForm}
            assessLocked={assessLocked}
            setAssessLocked={setAssessLocked}
            submittedAssessments={submittedAssessments}
            setSubmittedAssessments={setSubmittedAssessments}
            drafts={drafts}
            setDrafts={setDrafts}
            statusMsg={statusMsg}
            setStatusMsg={setStatusMsg}
            pointsmen={pointsmen}
            setPointsmen={setPointsmen}
            submitAssessment={submitAssessment}
            toggleYN={toggleYN}
            openAssessForm={openAssessForm}
            activatedTests={activatedTests}
            setActivatedTests={setActivatedTests}
            onToggleMcqStatus={handleToggleMcqStatus}
          />
        );
      case "myAssessment":
        return (
          <MyAssessment
            roleTitle="Station Master"
            assessedByTitle="Traffic Inspector"
            myAssessSelected={myAssessSelected}
            setMyAssessSelected={setMyAssessSelected}
            performanceSummaryText={performanceSummaryText}
            testQuestions={smTestQuestions}
            testAssigned={testAssigned}
            smMcqTest={smMcqTest}
            startTestAttempt={startTestAttempt}
            history={history}
            openScorecard={openScorecard}
            handleReattempt={handleReattempt}
            activeQIdx={activeQIdx}
            setActiveQIdx={setActiveQIdx}
            testResponses={testResponses}
            setTestResponses={setTestResponses}
            handleSubmitTestAttempt={handleSubmitTestAttempt}
            screenMode={pageMode}
            setScreenMode={setPageMode}
            fullName={fullName}
            employeeId={employeeId}
            profileData={smProfile}
          />
        );
      case "reports":
        return (
          <CommonReports
            pointsmen={pointsmen}
            selectedReportUserId={selectedReportUserId}
            setSelectedReportUserId={setSelectedReportUserId}
            repF={repF}
            setRepF={setRepF}
            userRole="Station Master"
          />
        );
      case "counselling":
        return (
          <CommonCounselling
            users={pointsmen.map(p => ({
              ...p,
              role: "Pointsman",
              station: smProfile.station || "Nagpur Junction",
              stationName: smProfile.station || "Nagpur Junction",
              score: p.lastScore,
              cat: p.cat || p.category_grade || getCat(p.lastScore),
              category_grade: p.category_grade || p.cat,
              designation: "Pointsman"
            }))}
            stationFilter={smProfile.station || "Nagpur Junction"}
            isAom={false}
            addAuditLog={() => {}}
          />
        );
      case "pmePosition":
        return (
          <CommonPmePosition
            users={pointsmen.map(p => ({
              ...p,
              role: "Pointsman",
              station: smProfile.station || "Nagpur Junction",
              stationName: smProfile.station || "Nagpur Junction",
              score: p.lastScore,
              cat: p.cat || p.category_grade || getCat(p.lastScore),
              category_grade: p.category_grade || p.cat,
              designation: "Pointsman"
            }))}
            roleFilter="Pointsman"
            stationFilter={smProfile.station || "Nagpur Junction"}
            onScheduleCounselling={handleScheduleCounsellingFromPme}
            exportAlert={(format, name) => alert(`Exporting PME Report in ${format} format...`)}
          />
        );
      case "refPosition":
        return (
          <CommonRefPosition
            users={pointsmen.map(p => ({
              ...p,
              role: "Pointsman",
              station: smProfile.station || "Nagpur Junction",
              stationName: smProfile.station || "Nagpur Junction",
              score: p.lastScore,
              cat: p.cat || p.category_grade || getCat(p.lastScore),
              category_grade: p.category_grade || p.cat,
              designation: "Pointsman"
            }))}
            roleFilter="Pointsman"
            stationFilter={smProfile.station || "Nagpur Junction"}
            onClearRef={handleClearRef}
            exportAlert={(format, name) => alert(`Exporting REF Report in ${format} format...`)}
          />
        );
      default:
        return (
          <div className="sm2-page-hdr animate-fade-in">
            <h2>{activeTab}</h2>
            <p>Module workspace in progress.</p>
          </div>
        );
    }
  };

  const userObj = { name: smName, hrmsId: smId, role: "Station Master" };

  return (
    <div className="sm2-layout">
      <CommonLayout
        user={userObj}
        navItems={navItems}
        activeTab={activeTab}
        setActiveTab={switchTab}
        onLogout={onLogout}
        statusMsg={statusMsg}
        setStatusMsg={setStatusMsg}
        brandTitle="Indian Railway Evaluation System"
        brandSubtitle="Station Master Module"

      >
        <div className="sm2-page-wrap" style={{ padding: 0 }}>
          {renderContent()}
        </div>
      </CommonLayout>

      {/* ══════════════════════════════════════════
            FULLSCREEN ANALYTICS MODAL
        ══════════════════════════════════════════ */}
      {fullscreenChart && (
        <div className="sm2-fullscreen-modal">
          {/* ── Modal Header ── */}
          <div className="sm2-fullscreen-header">
            <div style={{ display: "flex", alignItems: 12, gap: 12 }}>
              <div className="sm2-fullscreen-icon-wrap">
                {fullscreenChart === "monthly" && <TrendingUp size={18} color="#93c5fd" />}
                {fullscreenChart === "safety" && <Activity size={18} color="#a78bfa" />}
                {fullscreenChart === "performance" && <BarChart3 size={18} color="#34d399" />}
              </div>
              <div>
                <h2>
                  {fullscreenChart === "monthly" && (t("analytics.monthlyTrendDeepDive") || "Monthly Assessment Trend — Deep Dive")}
                  {fullscreenChart === "safety" && (t("analytics.safetyTrendDeepDive") || "Safety Compliance Trend — Deep Dive")}
                  {fullscreenChart === "performance" && (t("analytics.performanceDistDeepDive") || "Performance Distribution — Deep Dive")}
                </h2>
                <p>
                  {t("analytics.subTitle") || "Indian Railway Evaluation Command · Operations Workspace"}
                </p>
              </div>
            </div>
            <button className="sm2-fullscreen-close-btn" onClick={() => setFullscreenChart(null)}>
              {t("analytics.close") || "✕ Close"}
            </button>
          </div>

          {/* ── Filter Bar ── */}
          <div className="sm2-fullscreen-filter-bar">
            <span className="sm2-fs-filter-tag">{t("analytics.filters") || "FILTERS"}</span>
            <input
              type="text" placeholder={t("analytics.searchPlaceholder") || "Search staff name / HRMS…"}
              value={fsSearch} onChange={e => setFsSearch(e.target.value)}
              className="sm2-fs-input"
            />
            <input type="date" value={fsStartDate} onChange={e => setFsStartDate(e.target.value)} className="sm2-fs-input" />
            <span className="sm2-fs-label">{t("analytics.to") || "to"}</span>
            <input type="date" value={fsEndDate} onChange={e => setFsEndDate(e.target.value)} className="sm2-fs-input" />
            <select value={fsCategory} onChange={e => setFsCategory(e.target.value)} className="sm2-fs-select">
              <option value="All">{t("dashboard.allCategories") || "All Categories"}</option>
              <option value="A">{t("dashboard.colCategory") + " A" || "Category A"}</option>
              <option value="B">{t("dashboard.colCategory") + " B" || "Category B"}</option>
              <option value="C">{t("dashboard.colCategory") + " C" || "Category C"}</option>
              <option value="D">{t("dashboard.colCategory") + " D" || "Category D"}</option>
            </select>
            <select value={fsRisk} onChange={e => setFsRisk(e.target.value)} className="sm2-fs-select">
              <option value="All">{t("workflow.allPriorities") || "All Risks"}</option>
              <option value="Low">{t("priority.low") + " " + (t("dashboard.colRiskLevel") || "Risk")}</option>
              <option value="Medium">{t("priority.medium") + " " + (t("dashboard.colRiskLevel") || "Risk")}</option>
              <option value="High">{t("priority.high") + " " + (t("dashboard.colRiskLevel") || "Risk")}</option>
            </select>
            <button onClick={() => { setFsSearch(""); setFsStartDate(""); setFsEndDate(""); setFsCategory("All"); setFsRisk("All"); }} className="sm2-fs-reset-btn">
              {t("analytics.reset") || "Reset"}
            </button>
            <div className="sm2-fs-counter">
              {t("analytics.showing") || "Showing"} <strong>{filteredFsPointsmen.length}</strong> {t("analytics.of") || "of"} {pointsmen.length} {t("analytics.staff") || "staff"}
            </div>
          </div>

          {/* ── Main Content ── */}
          <div className="sm2-fullscreen-content">

            {/* KPI Summary Row */}
            <div className="sm2-fs-kpi-row">
              {[
                { label: t("dashboard.colAverageScore") || "Avg Score", value: filteredFsPointsmen.length ? Math.round(filteredFsPointsmen.reduce((s, p) => s + p.lastScore, 0) / filteredFsPointsmen.length) + "%" : "—", color: "#60a5fa", glowColor: "rgba(96,165,250,0.15)" },
                { label: t("dashboard.colSafety") || "Avg Safety", value: filteredFsPointsmen.length ? Math.round(filteredFsPointsmen.reduce((s, p) => s + p.safetyScore, 0) / filteredFsPointsmen.length) + "%" : "—", color: "#a78bfa", glowColor: "rgba(167,139,250,0.15)" },
                { label: t("dashboard.colHighRisk") || "High Risk", value: filteredFsPointsmen.filter(p => riskLevel(p) === "High").length, color: "#f87171", glowColor: "rgba(248,113,113,0.15)" },
                { label: t("analytics.catAStaff") || "Cat A Staff", value: filteredFsPointsmen.filter(p => getCat(p.lastScore) === "A").length, color: "#34d399", glowColor: "rgba(52,211,153,0.15)" },
                { label: t("analytics.fitPme") || "Fit (PME)", value: filteredFsPointsmen.filter(p => p.pmeStatus === "Fit").length, color: "#fbbf24", glowColor: "rgba(251,191,36,0.15)" },
              ].map(k => (
                <div key={k.label} className="sm2-fs-kpi-card" style={{ "--glow": k.glowColor }}>
                  <div className="sm2-fs-kpi-value" style={{ color: k.color }}>{k.value}</div>
                  <div className="sm2-fs-kpi-label">{k.label}</div>
                </div>
              ))}
            </div>

            {/* Large Chart */}
            <div className="sm2-fs-chart-container">
              <h3>
                {fullscreenChart === "monthly" && (t("analytics.monthlyAvgChartTitle") || "📈 Monthly Avg Score & Assessment Volume")}
                {fullscreenChart === "safety" && (t("analytics.safetyAvgChartTitle") || "🛡️ Monthly Safety Compliance Avg (%)")}
                {fullscreenChart === "performance" && (t("analytics.staffCategoryChartTitle") || "🏅 Staff Category Distribution")}
              </h3>
              <div className="sm2-fs-chart-wrapper">
                <ResponsiveContainer width="100%" height={320}>
                  {fullscreenChart === "monthly" ? (
                    <LineChart data={dynamicMonthlyTrend} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} stroke="rgba(0,0,0,0.1)" />
                      <YAxis tick={{ fontSize: 12, fill: "#64748b" }} stroke="rgba(0,0,0,0.1)" />
                      <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12, color: "#4b5563" }} />
                      <Line type="monotone" dataKey="avgScore" name="Avg Score" stroke="#2563eb" strokeWidth={3} dot={{ r: 5, fill: "#2563eb" }} activeDot={{ r: 7 }} />
                      <Line type="monotone" dataKey="assessments" name="Assessments" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 4, fill: "#16a34a" }} strokeDasharray="6 3" />
                    </LineChart>
                  ) : fullscreenChart === "safety" ? (
                    <BarChart data={dynamicMonthlyTrend} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} stroke="rgba(0,0,0,0.1)" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b" }} stroke="rgba(0,0,0,0.1)" />
                      <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12, color: "#4b5563" }} />
                      <Bar dataKey="safetyAvg" name="Safety Avg %" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="avgScore" name="Score Avg %" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  ) : (
                    <PieChart>
                      <Pie
                        data={(() => {
                          const counts = { A: 0, B: 0, C: 0, D: 0 };
                          filteredFsPointsmen.forEach(p => { counts[getCat(p.lastScore)]++; });
                          return Object.entries(counts).filter(([, c]) => c > 0).map(([cat, count]) => ({ name: `Cat. ${cat}`, value: count }));
                        })()}
                        cx="50%" cy="50%" innerRadius={90} outerRadius={140}
                        dataKey="value" paddingAngle={4}
                      >
                        {["#2563eb", "#16a34a", "#f59e0b", "#dc2626"].map((c, i) => <Cell key={i} fill={c} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 13, color: "#4b5563" }} iconType="circle" iconSize={10} />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Low Performers Deep-Dive Table */}
            <div className="sm2-fs-low-perf-section">
              <h3>
                <span style={{ color: "#f87171", marginRight: 6 }}>⚠</span> {t("analytics.lowPerformingStaff") || "Low Performing Staff — Direct Intervention Required"}
              </h3>
              <div className="sm2-fs-grid">
                {[...filteredFsPointsmen]
                  .sort((a, b) => a.lastScore - b.lastScore)
                  .slice(0, 6)
                  .map(p => {
                    const cat = getCat(p.lastScore);
                    const risk = riskLevel(p);
                    const rColor = risk === "High" ? "#f87171" : risk === "Medium" ? "#fbbf24" : "#34d399";
                    return (
                      <div key={p.id} className="sm2-fs-card" style={{ "--border-color": rColor }} onClick={() => {
                        setFullscreenChart(null);
                        openPmDetail(p);
                        setActiveTab("pointsmen");
                      }}>
                        <div className="sm2-fs-card-header">
                          <div>
                            <div className="sm2-fs-card-name">{p.name}</div>
                            <div className="sm2-fs-card-id">{p.hrmsId}</div>
                          </div>
                          <span className="sm2-fs-card-cat" style={{ background: CAT_BG[cat], color: CAT_COLOR[cat] }}>
                            {t("dashboard.colCategory") || "Cat."} {cat}
                          </span>
                        </div>
                        <div className="sm2-fs-card-meta-row">
                          <span className="sm2-fs-card-risk-badge" style={{
                            background: risk === "High" ? "rgba(248,113,113,0.15)" : risk === "Medium" ? "rgba(251,191,36,0.15)" : "rgba(52,211,153,0.15)",
                            color: rColor
                          }}>{t("priority." + risk.toLowerCase()) || risk} {t("dashboard.colRiskLevel") || "Risk"}</span>
                          <span className="sm2-fs-card-incident-lbl">{p.incidents} {p.incidents !== 1 ? t("analytics.incidents") || "incidents" : t("analytics.incident") || "incident"}</span>
                        </div>
                        <div className="sm2-fs-card-progress-item">
                          <div className="sm2-fs-card-progress-lbl">
                            <span>{t("dashboard.score") || "Score"}</span>
                            <span style={{ color: p.lastScore < 50 ? "#f87171" : "#fbbf24" }}>{p.lastScore}/100</span>
                          </div>
                          <div className="sm2-fs-card-progress-track">
                            <div className="sm2-fs-card-progress-bar" style={{ width: `${p.lastScore}%`, background: p.lastScore < 50 ? "#f87171" : "#fbbf24" }} />
                          </div>
                        </div>
                        <div className="sm2-fs-card-progress-item" style={{ marginTop: 10 }}>
                          <div className="sm2-fs-card-progress-lbl">
                            <span>{t("dashboard.colSafety") || "Safety Score"}</span>
                            <span style={{ color: p.safetyScore < 60 ? "#f87171" : "#a78bfa" }}>{p.safetyScore}%</span>
                          </div>
                          <div className="sm2-fs-card-progress-track">
                            <div className="sm2-fs-card-progress-bar" style={{ width: `${p.safetyScore}%`, background: p.safetyScore < 60 ? "#f87171" : "#a78bfa" }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {filteredFsPointsmen.length === 0 && (
                  <p style={{ color: "#64748b", fontSize: 13, gridColumn: "1/-1", textAlign: "center", padding: "24px 0" }}>{t("analytics.noStaffMatch") || "No staff match the current filters."}</p>
                )}
              </div>
            </div>

          </div>{/* end content */}
        </div>
      )}

    </div>
  );
}

export default StationMasterModule;
