import { useState, useMemo, useEffect } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRightLeft,
  ArrowLeft,
  BarChart3,
  Building2,
  BusFront,
  ClipboardCheck,
  Eye,
  ExternalLink,
  Filter,
  Cog,
  HeartHandshake,
  FileCheck,
  FileDown,
  FileText,
  FileBarChart2,
  LayoutDashboard,
  Lock,
  LogOut,
  PlusCircle,
  Plus,
  Search,
  ShieldCheck,
  Star,
  UserCheck,
  UserPlus,
  UserRoundSearch,
  Users,
  Edit,
  Trash2,
  TrendingUp,
  UserRound,
  TrainFront,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  Phone,
  Calendar,
  Award,
  Globe,
  Tag,
  GitBranch,
  Cpu,
  Layers,
  Zap,
  Mail,
  AlignJustify,
  Gauge,
  UserCircle2
} from "lucide-react";
import CommonUserModal from "./components/CommonUserModal";
import CommonPmePosition from "./components/CommonPmePosition";
import CommonRefPosition from "./components/CommonRefPosition";
import CommonCounselling from "./components/CommonCounselling";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
  CartesianGrid,
  LabelList
} from "recharts";
import "./sdom.css";
import UserProfile from "./components/UserProfile";
import CommonReports from "./components/CommonReports";
import AOmDashboard from "./components/AOmModule/AOmDashboard";

const MONTHLY_TREND = [
  { month: "Dec'25", score: 81, safety: 80 },
  { month: "Jan'26", score: 83, safety: 82 },
  { month: "Feb'26", score: 85, safety: 85 },
  { month: "Mar'26", score: 87, safety: 88 },
  { month: "Apr'26", score: 89, safety: 91 },
  { month: "May'26", score: 91, safety: 94 }
];

const ASSESSMENT_MONTHLY = [
  { month: "Nov", approved: 380, pending: 60, rejected: 18, overdue: 12 },
  { month: "Dec", approved: 410, pending: 55, rejected: 22, overdue: 15 },
  { month: "Jan", approved: 440, pending: 70, rejected: 19, overdue: 10 },
  { month: "Feb", approved: 460, pending: 65, rejected: 21, overdue: 9 },
  { month: "Mar", approved: 490, pending: 58, rejected: 17, overdue: 8 },
  { month: "Apr", approved: 520, pending: 68, rejected: 20, overdue: 11 }
];

const COMPLIANCE = [
  { label: "Overall Safety Compliance", pct: 91, color: "#16a34a" },
  { label: "PME Completion Rate", pct: 87, color: "#2563eb" },
  { label: "REF Completion Rate", pct: 83, color: "#7c3aed" },
  { label: "Incident Reporting Compliance", pct: 94, color: "#0891b2" },
  { label: "Disciplinary Clean Record", pct: 96, color: "#16a34a" }
];

const CAT_COLORS = { A: "#1E3A5F", B: "#2B6CB0", C: "#D69E2E", D: "#C53030" };
const RISK_COLORS = { Low: "#2F855A", Medium: "#D69E2E", High: "#C53030" };
const STATUS_COLORS = { Approved: "#2F855A", Pending: "#D69E2E", Rejected: "#C53030", Overdue: "#9B2C2C" };

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
    const code = codeList[Math.floor(i / divisions.length) % codeList.length] + `_${10 + Math.floor(i / 10)}`;
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

const categoryData = [
  { name: "Grade A", value: 14.6, color: "#57b35a" },
  { name: "Grade B", value: 37.5, color: "#3f9be6" },
  { name: "Grade C", value: 36.5, color: "#f5a623" },
  { name: "Grade D", value: 11.5, color: "#e55a54" }
];

const sidebarItems = [
  { icon: Gauge, label: "Dashboard" },
  { icon: Users, label: "Pointsmen" },
  { icon: Building2, label: "Station Masters" },
  { icon: UserCheck, label: "Station Superintendents" },
  { icon: BusFront, label: "Train Managers" },
  { icon: ShieldCheck, label: "Traffic Inspectors" },
  { icon: Building2, label: "Stations" },
  { icon: CheckCircle, label: "Approvals" },
  { icon: FileCheck, label: "Assessments" },
  { icon: HeartHandshake, label: "Counselling" },
  { icon: Activity, label: "PME Position" },
  { icon: Award, label: "REF Position" },
  { icon: BarChart3, label: "Reports and Analytics" },
  { icon: UserCircle2, label: "My Profile" }
];

const summaryCards = [
  {
    icon: Users,
    iconClass: "icon-slate",
    trend: "+2.4%",
    value: "14,280",
    title: "TOTAL EMPLOYEES",
    subtitle: "Active Staff Count"
  },
  {
    icon: UserCheck,
    iconClass: "icon-green",
    trend: "+1.5%",
    value: "12,104",
    title: "EVALUATIONS COMPLETED",
    subtitle: "85% Global Rate"
  },
  {
    icon: AlertCircle,
    iconClass: "icon-orange",
    trend: "Attention",
    value: "482",
    title: "PENDING APPROVALS",
    subtitle: "Requires resolution",
    trendAlert: true
  },
  {
    icon: Star,
    iconClass: "icon-blue",
    value: "78.5",
    title: "AVERAGE SCORE",
    subtitle: "B-Grade Average"
  },
  {
    icon: ShieldCheck,
    iconClass: "icon-green",
    value: "99.2%",
    title: "SAFETY COMPLIANCE",
    subtitle: "Divisional Audit",
    status: "Standard Met"
  }
];

const designationOptions = ["Pointsman", "Station Master", "Train Manager", "Station Supervisor", "Traffic Inspector"];
const departmentOptions = ["Operations", "Administration", "Finance", "HR", "IT"];
const userTypeOptions = ["AOM", "Manager", "Employee", "Viewer"];
const reportingOfficerOptions = ["R. Kumar", "S. Deshmukh", "P. Nair", "M. Verma", "A. Singh"];

const aomReadOnlyProfile = {
  designation: "AOM / General",
  zoneHq: "Zonal Headquarters",
  division: "Central Division",
  reportingOfficer: "Super Admin - SA_1001",
  contact: "+91 99880 11223",
  email: "aom.console@rail.in"
};

const initialUserFormData = {
  employeeName: "",
  hrmsId: "",
  mobileNo: "",
  emailId: "",
  designation: "",
  department: "Operations",
  userType: "Employee",
  reportingOfficer: "R. Kumar",
  zone: "",
  division: "",
  stationName: "",

  // Pointsman-specific
  reportingSm: "",
  shift: "",
  workLocation: "",

  // SM-specific
  smStation: "",
  smDivision: "",
  smZone: "",

  // TI-specific
  jurisdiction: "",
  linkedStations: "",
  reportingAom: ""
};

const initialFilterData = {
  mobileNo: "",
  designation: "",
  hrmsId: "",
  department: "",
  userType: ""
};

const stationZoneOptions = ["Central Railway", "Western Railway", "Northern Railway", "Southern Railway", "Eastern Railway"];
const stationDivisionOptions = ["Nagpur", "Pune", "Mumbai", "Delhi", "Chennai"];
const stationCategoryOptions = ["A", "B", "C", "D", "Halt"];
const stationTypeOptions = ["Junction", "Terminal", "Halt"];

const initialStationFormData = {
  stationName: "",
  stationCode: "",
  zone: "",
  division: "",
  category: "",
  stationType: "",
  platforms: "",
  tracks: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  stationMasterName: "",
  contactNumber: "",
  emailId: "",
  latitude: "",
  longitude: "",
  status: "Active"
};

const initialStationFilterData = {
  zone: "",
  division: "",
  category: "",
  status: ""
};

const initialStations = [
  {
    id: 1,
    stationName: "Nagpur Junction",
    stationCode: "NGP",
    zone: "Central Railway",
    division: "Nagpur",
    category: "A",
    platforms: 8,
    tracks: 14,
    stationType: "Junction",
    status: "Active",
    createdBy: "SA_1001",
    address: "Station Road, Sitabuldi",
    city: "Nagpur",
    state: "Maharashtra",
    pincode: "440001",
    stationMasterName: "A. Patil",
    contactNumber: "9890011122",
    emailId: "ngp.station@rail.in",
    latitude: "21.1458",
    longitude: "79.0882"
  },
  {
    id: 2,
    stationName: "Pune Junction",
    stationCode: "PUNE",
    zone: "Central Railway",
    division: "Pune",
    category: "A",
    platforms: 6,
    tracks: 12,
    stationType: "Junction",
    status: "Active",
    createdBy: "SA_1001",
    address: "Railway Station Rd, Agarkar Nagar",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001",
    stationMasterName: "R. Jadhav",
    contactNumber: "9880012233",
    emailId: "pune.station@rail.in",
    latitude: "18.5284",
    longitude: "73.8742"
  },
  {
    id: 3,
    stationName: "New Delhi",
    stationCode: "NDLS",
    zone: "Northern Railway",
    division: "Delhi",
    category: "A",
    platforms: 16,
    tracks: 24,
    stationType: "Terminal",
    status: "Active",
    createdBy: "SA_1001",
    address: "Bhavbhuti Marg, Ajmeri Gate",
    city: "New Delhi",
    state: "Delhi",
    pincode: "110006",
    stationMasterName: "M. Sharma",
    contactNumber: "9870014455",
    emailId: "ndls.station@rail.in",
    latitude: "28.6436",
    longitude: "77.2194"
  }
];

const tiCategoryOptions = ["A", "B", "C", "D"];
const tiAssessmentStatusOptions = ["Completed", "Pending"];

const initialTrafficInspectors = [
  {
    id: 1,
    name: "R. Khan",
    employeeId: "TI_1001",
    stationName: "Parbhani Junction",
    tiArea: "TI PAR",
    division: "TI PAR",
    category: "A",
    riskLevel: "Low",
    lastScore: 88,
    assessmentStatus: "Completed",
    phone: "9890029911",
    email: "rkhan@rail.in"
  },
  {
    id: 2,
    name: "A. Kulkarni",
    employeeId: "TI_1002",
    stationName: "Amla",
    tiArea: "TI AMLA",
    division: "TI AMLA",
    category: "B",
    riskLevel: "Medium",
    lastScore: 77,
    assessmentStatus: "Pending",
    phone: "9890017788",
    email: "akulkarni@rail.in"
  },
  {
    id: 3,
    name: "S. Verma",
    employeeId: "TI_1003",
    stationName: "Nagpur Junction",
    tiArea: "TI NGP",
    division: "TI NGP",
    category: "A",
    riskLevel: "Low",
    lastScore: 91,
    assessmentStatus: "Pending",
    phone: "9873312211",
    email: "sverma@rail.in"
  }
];

const hrmsTiDirectory = [
  {
    hrmsId: "TI3201",
    name: "S. Verma",
    jurisdiction: "Delhi",
    category: "TI",
    assessmentStatus: "Pending",
    division: "Delhi",
    phone: "9873312211",
    email: "sverma@rail.in"
  },
  {
    hrmsId: "TI3202",
    name: "M. Das",
    jurisdiction: "Nagpur",
    category: "Assistant TI",
    assessmentStatus: "In Progress",
    division: "Nagpur",
    phone: "9890016644",
    email: "mdas@rail.in"
  }
];

const initialTiFormData = {
  name: "",
  employeeId: "",
  jurisdiction: "",
  category: "",
  assessmentStatus: "Pending"
};

const stationAverageScoreData = [
  { station: "Nagpur", avgScore: 86 },
  { station: "Pune", avgScore: 89 },
  { station: "Delhi", avgScore: 84 },
  { station: "Mumbai", avgScore: 88 },
  { station: "Jalna", avgScore: 91 },
  { station: "Parbhani", avgScore: 82 }
];

const initialPendingAssessments = [
  {
    id: "SM_1001",
    title: "Station Master - SM_1001",
    statusLabel: "Pending Approval",
    assessedByLine: "Assessed by: TI/SS - on 2026-04-15",
    employeeLine: "Employee: R. Jadhav | Division: Pune",
    actionType: "approval"
  },
  {
    id: "TM_1001",
    title: "Train Manager - TM_1001",
    statusLabel: "Pending Approval",
    assessedByLine: "Assessed by: TI/SS - on 2026-04-14",
    employeeLine: "Employee: V. Singh | Division: Mumbai",
    actionType: "approval"
  },
  {
    id: "TI_1001",
    title: "Traffic Inspector - TI_1001",
    statusLabel: "Pending Approval",
    assessedByLine: "Assessed by: AOM/G - on 2026-04-13",
    employeeLine: "Employee: A. Kulkarni | Division: Nagpur",
    actionType: "approval"
  },
  {
    id: "SS_1001",
    title: "Station Supervisor - SS_1001",
    statusLabel: "Pending Assessment",
    assessedByLine: "Awaiting: Your Assessment - on 2026-04-12",
    employeeLine: "Employee: P. Verma | Division: Delhi",
    actionType: "assessment"
  }
];

const initialApprovedAssessments = [
  {
    id: "SM_1002",
    title: "Station Master - SM_1002",
    detail: "Approved by: AOM/G - on 2026-04-09",
    score: "Score: 92/100 - Grade: A"
  },
  {
    id: "TM_1002",
    title: "Train Manager - TM_1002",
    detail: "Approved by: AOM/G - on 2026-04-08",
    score: "Score: 88/100 - Grade: B"
  },
  {
    id: "TI_1005",
    title: "Traffic Inspector - TI_1005",
    detail: "Approved by: AOM/G - on 2026-04-07",
    score: "Score: 85/100 - Grade: B"
  }
];

const initialReportRows = [
  {
    id: "PM_1001",
    hrmsId: "PM_1001",
    name: "K. Pawar",
    designation: "Pointsman",
    assessmentStatus: "Approved",
    score: "85",
    grade: "B",
    lastAssessed: "2026-04-10"
  },
  {
    id: "SM_1001",
    hrmsId: "SM_1001",
    name: "R. Jadhav",
    designation: "Station Master",
    assessmentStatus: "Approved",
    score: "92",
    grade: "A",
    lastAssessed: "2026-04-09"
  },
  {
    id: "TM_1001",
    hrmsId: "TM_1001",
    name: "V. Singh",
    designation: "Train Manager",
    assessmentStatus: "Approved",
    score: "88",
    grade: "B",
    lastAssessed: "2026-04-08"
  },
  {
    id: "TI_1001",
    hrmsId: "TI_1001",
    name: "A. Kulkarni",
    designation: "Traffic Inspector",
    assessmentStatus: "Approved",
    score: "85",
    grade: "B",
    lastAssessed: "2026-04-07"
  },
  {
    id: "SS_1001",
    hrmsId: "SS_1001",
    name: "P. Verma",
    designation: "Station Supervisor",
    assessmentStatus: "Pending",
    score: "-",
    grade: "-",
    lastAssessed: "-"
  },
  {
    id: "SM_1002",
    hrmsId: "SM_1002",
    name: "M. Sharma",
    designation: "Station Master",
    assessmentStatus: "Approved",
    score: "90",
    grade: "A",
    lastAssessed: "2026-04-06"
  }
];

const assessmentCriteria = [
  { key: "knowledgeOfRules", label: "Knowledge of Rules", marks: 25 },
  { key: "alertnessAndObservation", label: "Alertness and observation of rules", marks: 25 },
  { key: "safetyRecord", label: "Safety Record", marks: 15 },
  { key: "leadershipAndManagement", label: "Leadership and Management", marks: 15 },
  { key: "discipline", label: "Discipline", marks: 10 },
  { key: "appearanceAndNeatness", label: "Appearance & neatness", marks: 10 }
];

function AOmModule({ user, onLogout }) {
  const [activePage, setActivePage] = useState("Dashboard");
  const [pmModal, setPmModal] = useState(null);
  const [pmF, setPmF] = useState({ name: "", station: "All", cat: "All", risk: "All" });

  const openPmAdd = () => {
    setPmModal({
      mode: "add",
      data: {
        hrmsId: `PM_${Date.now().toString().slice(-4)}`,
        name: "",
        gender: "Male",
        age: 35,
        doj: new Date().toISOString().split('T')[0],
        basePay: "â‚¹25,000",
        lastScore: 80,
        safetyScore: 90,
        totalAssessments: 1,
        pmeStatus: "Fit",
        refStatus: "Cleared",
        disciplinary: "None",
        incidents: 0,
        approvalStatus: "Approved",
        monitoringStatus: "Active",
        stationCode: "NGP",
        stationName: "Nagpur Junction",
        contact: "",
        email: "",
        cat: "A",
        risk: "Low",
        reportingSm: "",
        workLocation: "",
        shift: ""
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

  const savePmModal = () => {
    if (!pmModal.data.name || !pmModal.data.hrmsId) {
      alert("Name and HRMS ID are required.");
      return;
    }
    if (pmModal.mode === "shift") {
      const targetStation = pmModal.data.targetStation || pmModal.data.station || pmModal.data.stationName;
      if (targetStation) {
        const stObj = stations.find(s => (s.name || s.stationName) === targetStation);
        const code = stObj ? (stObj.code || stObj.stationCode) : "STN";
        setAomPointsmen(prev => prev.map(u => u.hrmsId === pmModal.data.hrmsId ? {
          ...u,
          station: targetStation,
          stationName: targetStation,
          stationCode: code
        } : u));
        alert(`${pmModal.data.name} transferred to ${targetStation} station successfully.`);
        setPmModal(null);
        return;
      }
    }
    if (pmModal.mode === "add") {
      setAomPointsmen(p => [pmModal.data, ...p]);
    } else {
      setAomPointsmen(p => p.map(x => x.hrmsId === pmModal.data.hrmsId ? pmModal.data : x));
    }
    setPmModal(null);
  };

  const removePm = (hrmsId) => {
    if (window.confirm("Remove this pointsman?")) {
      setAomPointsmen(p => p.filter(x => x.hrmsId !== hrmsId));
    }
  };

  const openSmAdd = () => {
    setSmModal({
      mode: "add",
      data: {
        hrmsId: `SM_${Date.now().toString().slice(-4)}`,
        name: "",
        gender: "Male",
        age: 38,
        doj: new Date().toISOString().split('T')[0],
        basePay: "â‚¹52,000",
        lastScore: 80,
        safetyScore: 88,
        totalAssessments: 1,
        pmeStatus: "Fit",
        refStatus: "Cleared",
        disciplinary: "None",
        incidents: 0,
        approvalStatus: "Approved",
        monitoringStatus: "Active",
        stationCode: "NGP",
        stationName: "Nagpur Junction",
        contact: "",
        email: "",
        cat: "A",
        risk: "Low",
        smStation: "Nagpur Junction",
        smZone: "Central Railway",
        smDivision: "Nagpur"
      }
    });
  };

  const openSmEdit = (sm) => {
    setSmModal({
      mode: "edit",
      data: { ...sm, smStation: sm.stationName, smDivision: sm.division, smZone: sm.zone }
    });
  };

  const openSmShift = (sm) => {
    setSmModal({
      mode: "shift",
      data: { ...sm }
    });
  };

  const saveSmModal = () => {
    if (!smModal.data.name || !smModal.data.hrmsId) {
      alert("Name and HRMS ID are required.");
      return;
    }
    if (smModal.mode === "shift") {
      const targetStation = smModal.data.targetStation || smModal.data.station || smModal.data.stationName;
      if (targetStation) {
        const stObj = stations.find(s => (s.name || s.stationName) === targetStation);
        const code = stObj ? (stObj.code || stObj.stationCode) : "STN";
        setAomStationMasters(prev => prev.map(u => (u.hrmsId || u.id) === smModal.data.hrmsId ? {
          ...u,
          station: targetStation,
          stationName: targetStation,
          stationCode: code
        } : u));
        alert(`${smModal.data.name} transferred to ${targetStation} station successfully.`);
        setSmModal(null);
        return;
      }
    }
    const processedData = {
      ...smModal.data,
      stationName: smModal.data.smStation || smModal.data.stationName || "Nagpur Junction",
      stationCode: smModal.data.smStation === "Pune Junction" ? "PUNE" : smModal.data.smStation === "New Delhi" ? "NDLS" : "NGP",
      division: smModal.data.smDivision || smModal.data.division || "Nagpur",
      zone: smModal.data.smZone || smModal.data.zone || "Central Railway"
    };
    if (smModal.mode === "add") {
      setAomStationMasters(p => [processedData, ...p]);
    } else {
      setAomStationMasters(p => p.map(x => (x.hrmsId || x.id) === processedData.hrmsId ? processedData : x));
    }
    setSmModal(null);
  };

  const removeSm = (hrmsId) => {
    if (window.confirm("Remove this Station Master?")) {
      setAomStationMasters(p => p.filter(x => (x.hrmsId || x.id) !== hrmsId));
    }
  };

  const openTiAdd = () => {
    setTiModal({
      mode: "add",
      data: {
        employeeId: `TI_${Date.now().toString().slice(-4)}`,
        name: "",
        stationName: "Nagpur Junction",
        tiArea: "TI NGP",
        division: "TI NGP",
        category: "A",
        riskLevel: "Low",
        lastScore: 85,
        assessmentStatus: "Pending",
        phone: "",
        email: ""
      }
    });
  };

  const openTiEdit = (ti) => {
    setTiModal({
      mode: "edit",
      data: {
        id: ti.id,
        name: ti.name,
        employeeId: ti.hrmsId,
        stationName: ti.stationName,
        tiArea: ti.division,
        division: ti.division,
        category: ti.category,
        riskLevel: ti.riskLevel,
        lastScore: ti.lastScore,
        assessmentStatus: ti.assessmentStatus === "Approved" ? "Completed" : "Pending",
        phone: ti.contactNumber,
        email: ti.emailId
      }
    });
  };

  const removeTi = (employeeId) => {
    if (window.confirm("Remove this Traffic Inspector?")) {
      setTrafficInspectors(prev => prev.filter(t => t.employeeId !== employeeId));
    }
  };

  const saveTiModal = () => {
    if (!tiModal.data.name || !tiModal.data.employeeId) {
      alert("Name and Employee ID are required.");
      return;
    }
    const processed = {
      id: tiModal.data.id || Date.now(),
      name: tiModal.data.name,
      employeeId: tiModal.data.employeeId,
      stationName: tiModal.data.stationName,
      tiArea: tiModal.data.tiArea,
      division: tiModal.data.tiArea,
      category: tiModal.data.category,
      riskLevel: tiModal.data.riskLevel,
      lastScore: parseInt(tiModal.data.lastScore) || 80,
      assessmentStatus: tiModal.data.assessmentStatus,
      phone: tiModal.data.phone,
      email: tiModal.data.email
    };

    setTrafficInspectors(prev => {
      if (tiModal.mode === "add") {
        return [processed, ...prev];
      } else {
        return prev.map(t => (t.id === processed.id || t.employeeId === processed.employeeId) ? processed : t);
      }
    });
    setTiModal(null);
  };

  const openSsAdd = () => {
    setSsModal({
      mode: "add",
      data: {
        employeeId: `SS_${Date.now().toString().slice(-4)}`,
        name: "",
        role: "ss",
        designation: "Station Superintendent",
        station: "Nagpur Junction",
        division: "Nagpur",
        zone: "Central Railway",
        cat: "A",
        risk: "Low",
        score: 80,
        contact: "",
        email: "",
        lastDate: new Date().toISOString().split('T')[0],
        status: "Approved",
        smStation: "Nagpur Junction",
        smZone: "Central Railway",
        smDivision: "Nagpur"
      }
    });
  };

  const openSsEdit = (ss) => {
    setSsModal({
      mode: "edit",
      data: { ...ss, smStation: ss.station, smDivision: ss.division, smZone: ss.zone }
    });
  };

  const openSsShift = (ss) => {
    setSsModal({
      mode: "shift",
      data: { ...ss }
    });
  };

  const saveSsModal = () => {
    if (!ssModal.data.name || !ssModal.data.employeeId) {
      alert("Name and HRMS ID are required.");
      return;
    }
    if (ssModal.mode === "shift") {
      const targetStation = ssModal.data.targetStation || ssModal.data.station || ssModal.data.stationName;
      if (targetStation) {
        const stObj = stations.find(s => (s.name || s.stationName) === targetStation);
        const code = stObj ? (stObj.code || stObj.stationCode) : "STN";
        setAomSuperintendents(prev => prev.map(u => (u.employeeId || u.hrmsId) === ssModal.data.employeeId ? {
          ...u,
          station: targetStation,
          stationName: targetStation,
          stationCode: code
        } : u));
        alert(`${ssModal.data.name} transferred to ${targetStation} station successfully.`);
        setSsModal(null);
        return;
      }
    }
    const processedData = {
      ...ssModal.data,
      station: ssModal.data.smStation || ssModal.data.station || "Nagpur Junction",
      division: ssModal.data.smDivision || ssModal.data.division || "Nagpur",
      zone: ssModal.data.smZone || ssModal.data.zone || "Central Railway",
      cat: ssModal.data.category || ssModal.data.cat || "A",
      risk: ssModal.data.riskLevel || ssModal.data.risk || "Low",
      score: ssModal.data.lastScore || ssModal.data.score || 80
    };
    if (ssModal.mode === "add") {
      setAomSuperintendents(p => [processedData, ...p]);
    } else {
      setAomSuperintendents(p => p.map(x => x.employeeId === processedData.employeeId ? processedData : x));
    }
    setSsModal(null);
  };

  const removeSs = (employeeId) => {
    if (window.confirm("Remove this Station Superintendent?")) {
      setAomSuperintendents(p => p.filter(x => x.employeeId !== employeeId));
    }
  };

  const openTmAdd = () => {
    setTmModal({
      mode: "add",
      data: {
        employeeId: `TM_${Date.now().toString().slice(-4)}`,
        name: "",
        role: "tm",
        designation: "Train Manager",
        station: "Nagpur Junction",
        division: "Nagpur",
        zone: "Central Railway",
        cat: "A",
        risk: "Low",
        score: 80,
        contact: "",
        email: "",
        lastDate: new Date().toISOString().split('T')[0],
        status: "Approved",
        workLocation: "Nagpur Depot",
        reportingSm: "NGP-BSL Section",
        shift: "Goods Train Beat",
        smStation: "Nagpur Junction",
        smZone: "Central Railway",
        smDivision: "Nagpur"
      }
    });
  };

  const openTmEdit = (tm) => {
    setTmModal({
      mode: "edit",
      data: { ...tm, smStation: tm.station, smDivision: tm.division, smZone: tm.zone }
    });
  };

  const openTmShift = (tm) => {
    setTmModal({
      mode: "shift",
      data: { ...tm }
    });
  };

  const saveTmModal = () => {
    if (!tmModal.data.name || !tmModal.data.employeeId) {
      alert("Name and HRMS ID are required.");
      return;
    }
    if (tmModal.mode === "shift") {
      const targetStation = tmModal.data.targetStation || tmModal.data.station || tmModal.data.stationName;
      if (targetStation) {
        const stObj = stations.find(s => (s.name || s.stationName) === targetStation);
        const code = stObj ? (stObj.code || stObj.stationCode) : "STN";
        setAomTrainManagers(prev => prev.map(u => (u.employeeId || u.hrmsId) === tmModal.data.employeeId ? {
          ...u,
          station: targetStation,
          stationName: targetStation,
          stationCode: code
        } : u));
        alert(`${tmModal.data.name} transferred to ${targetStation} station successfully.`);
        setTmModal(null);
        return;
      }
    }
    const processedData = {
      ...tmModal.data,
      station: tmModal.data.smStation || tmModal.data.station || "Nagpur Junction",
      division: tmModal.data.smDivision || tmModal.data.division || "Nagpur",
      zone: tmModal.data.smZone || tmModal.data.zone || "Central Railway",
      cat: tmModal.data.category || tmModal.data.cat || "A",
      risk: tmModal.data.riskLevel || tmModal.data.risk || "Low",
      score: tmModal.data.lastScore || tmModal.data.score || 80
    };
    if (tmModal.mode === "add") {
      setAomTrainManagers(p => [processedData, ...p]);
    } else {
      setAomTrainManagers(p => p.map(x => x.employeeId === processedData.employeeId ? processedData : x));
    }
    setTmModal(null);
  };

  const removeTm = (employeeId) => {
    if (window.confirm("Remove this Train Manager?")) {
      setAomTrainManagers(p => p.filter(x => x.employeeId !== employeeId));
    }
  };
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("FY 2025-26 - Q3");

  // â”€â”€ AOM Approvals Page State (mirrors TI's PM Review exactly) â”€â”€
  const [aomApprovalTab, setAomApprovalTab] = useState("SM"); // "SM" | "TM"
  const [aomReviewTab, setAomReviewTab] = useState("Pending"); // Pending/Approved/Rejected
  const [aomReviewSearch, setAomReviewSearch] = useState("");
  const [aomReviewStation, setAomReviewStation] = useState("All");
  const [aomSelectedId, setAomSelectedId] = useState(null);
  const [aomEditSections, setAomEditSections] = useState({});
  const [aomAomRemarks, setAomAomRemarks] = useState({});
  const [aomShowAudit, setAomShowAudit] = useState({});
  const [aomRejectMode, setAomRejectMode] = useState({});
  const [aomApprovalNotice, setAomApprovalNotice] = useState("");
  const [aomSMList, setAomSMList] = useState(() => {
    try { const s = localStorage.getItem("ti_sm_list"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [aomTMList, setAomTMList] = useState(() => {
    try { const s = localStorage.getItem("ti_tm_list"); return s ? JSON.parse(s) : []; } catch { return []; }
  });

  // Refresh SM/TM lists from localStorage whenever Approvals page is active
  useEffect(() => {
    if (activePage === "Approvals") {
      try { const s = localStorage.getItem("ti_sm_list"); if (s) setAomSMList(JSON.parse(s)); } catch { }
      try { const s = localStorage.getItem("ti_tm_list"); if (s) setAomTMList(JSON.parse(s)); } catch { }
    }
  }, [activePage]);

  const aomCatColor = { A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#dc2626" };
  const aomCatBg = { A: "#dcfce7", B: "#dbeafe", C: "#fef3c7", D: "#fee2e2" };
  const aomGetCat = s => s >= 80 ? "A" : s >= 50 ? "B" : s >= 26 ? "C" : "D";

  const aomCurrentList = aomApprovalTab === "SM" ? aomSMList : aomTMList;
  const aomSelectedItem = aomSelectedId ? aomCurrentList.find(x => x.id === aomSelectedId) || null : null;

  const aomFilteredList = aomCurrentList.filter(item => {
    const st = aomReviewTab === "Pending" ? item.status === "Submitted" : item.status === aomReviewTab;
    const s = !aomReviewSearch || item.name.toLowerCase().includes(aomReviewSearch.toLowerCase()) || item.hrmsId.toLowerCase().includes(aomReviewSearch.toLowerCase());
    const r = aomReviewStation === "All" || item.station === aomReviewStation;
    return st && s && r;
  });

  const aomOpenReview = (id) => {
    const rec = aomCurrentList.find(x => x.id === id);
    if (!rec) return;
    setAomSelectedId(id);
    // Build editable sections from the TI form data if available
    const savedForms = aomApprovalTab === "SM"
      ? (localStorage.getItem("ti_sm_forms") ? JSON.parse(localStorage.getItem("ti_sm_forms")) : {})
      : (localStorage.getItem("ti_tm_forms") ? JSON.parse(localStorage.getItem("ti_tm_forms")) : {});
    const form = savedForms[id];

    let builtSecs = [];
    if (rec.sections && rec.sections.length > 0) {
      builtSecs = rec.sections.map(s => ({ ...s }));
    } else if (aomApprovalTab === "SM") {
      // Station Master criteria
      const stationMgmtScore = (form?.stationMgmt || []).filter(v => v === "Yes").length * 5;
      const safetyScore = (form?.safety || []).filter(v => v === "Yes").length * 4;
      const staffSupervisionScore = (form?.staffSupervision || []).filter(v => v === "Yes").length * 3;
      const documentationScore = (form?.documentation || []).filter(v => v === "Yes").length * 3;
      const emergencyScore = (form?.emergency || []).filter(v => v === "Yes").length * 5;
      const knowledgeScore = parseInt(form?.knowledgeMarks) || 0;

      // If form doesn't exist (mock record), distribute total score proportionally
      if (!form) {
        const total = rec.score || 80;
        builtSecs = [
          { title: "Station Management", score: Math.round(total * 0.25), max: 25 },
          { title: "Safety & Compliance", score: Math.round(total * 0.20), max: 20 },
          { title: "Staff Supervision", score: Math.round(total * 0.15), max: 15 },
          { title: "Documentation & Reporting", score: Math.round(total * 0.15), max: 15 },
          { title: "Emergency Handling", score: Math.round(total * 0.25), max: 25 },
          { title: "Written Exam (Knowledge)", score: Math.round(total * 0.20), max: 25 }
        ];
      } else {
        builtSecs = [
          { title: "Station Management", score: stationMgmtScore, max: 25 },
          { title: "Safety & Compliance", score: safetyScore, max: 20 },
          { title: "Staff Supervision", score: staffSupervisionScore, max: 15 },
          { title: "Documentation & Reporting", score: documentationScore, max: 15 },
          { title: "Emergency Handling", score: emergencyScore, max: 25 },
          { title: "Written Exam (Knowledge)", score: knowledgeScore, max: 25 }
        ];
      }
    } else {
      // Train Manager criteria
      const trainSafetyScore = (form?.trainSafety || []).filter(v => v === "Yes").length * 5;
      const signalingScore = (form?.signaling || []).filter(v => v === "Yes").length * 4;
      const shuntingScore = (form?.shunting || []).filter(v => v === "Yes").length * 3;
      const documentationScore = (form?.documentation || []).filter(v => v === "Yes").length * 3;
      const emergencyScore = (form?.emergency || []).filter(v => v === "Yes").length * 5;
      const knowledgeScore = parseInt(form?.knowledgeMarks) || 0;

      if (!form) {
        const total = rec.score || 80;
        builtSecs = [
          { title: "Train Safety & Brake Inspection", score: Math.round(total * 0.25), max: 25 },
          { title: "Signaling & Whistle Compliance", score: Math.round(total * 0.20), max: 20 },
          { title: "Shunting & Coupling Ops", score: Math.round(total * 0.15), max: 15 },
          { title: "Train Log & Guard Certificates", score: Math.round(total * 0.15), max: 15 },
          { title: "Emergency Train Protection", score: Math.round(total * 0.25), max: 25 },
          { title: "Written Exam (Knowledge)", score: Math.round(total * 0.20), max: 25 }
        ];
      } else {
        builtSecs = [
          { title: "Train Safety & Brake Inspection", score: trainSafetyScore, max: 25 },
          { title: "Signaling & Whistle Compliance", score: signalingScore, max: 20 },
          { title: "Shunting & Coupling Ops", score: shuntingScore, max: 15 },
          { title: "Train Log & Guard Certificates", score: documentationScore, max: 15 },
          { title: "Emergency Train Protection", score: emergencyScore, max: 25 },
          { title: "Written Exam (Knowledge)", score: knowledgeScore, max: 25 }
        ];
      }
    }

    setAomEditSections(prev => ({ ...prev, [id]: builtSecs }));
    setAomAomRemarks(prev => ({ ...prev, [id]: rec.aomRemarks || "" }));
    setAomRejectMode(prev => ({ ...prev, [id]: false }));
  };

  const aomUpdateSec = (id, idx, val) => {
    setAomEditSections(prev => {
      const arr = [...prev[id]]; arr[idx] = { ...arr[idx], score: Math.max(0, Math.min(arr[idx].max, Number(val) || 0)) };
      return { ...prev, [id]: arr };
    });
  };

  const aomFinalize = (id, mode, rejectNote = "") => {
    const setter = aomApprovalTab === "SM" ? setAomSMList : setAomTMList;
    const listKey = aomApprovalTab === "SM" ? "ti_sm_list" : "ti_tm_list";
    setter(prev => {
      const updated = prev.map(item => {
        if (item.id !== id) return item;
        const secs = aomEditSections[id] || [];
        const total = secs.reduce((s, x) => s + x.score, 0);
        const audit = [...(item.auditTrail || []), {
          action: mode === "reject" ? "Rejected" : (mode === "modify" ? "Modified & Approved" : "Approved without modification"),
          by: `AOM ${user?.name || ""}`,
          date: new Date().toISOString().slice(0, 10),
          remark: mode === "reject" ? rejectNote : (aomAomRemarks[id] || "")
        }];
        return {
          ...item,
          status: mode === "reject" ? "Rejected" : "Approved",
          score: mode === "reject" ? item.score : total,
          category: mode === "reject" ? item.category : aomGetCat(total),
          aomRemarks: aomAomRemarks[id] || rejectNote,
          auditTrail: audit,
          sections: secs
        };
      });
      localStorage.setItem(listKey, JSON.stringify(updated));
      return updated;
    });
    setAomSelectedId(null);
    setAomApprovalNotice(mode === "reject" ? "Assessment rejected." : "Assessment approved successfully.");
    setTimeout(() => setAomApprovalNotice(""), 4000);
    setAomReviewTab(mode === "reject" ? "Rejected" : "Approved");
  };

  const aomAllStations = [...new Set(aomCurrentList.map(x => x.station))];
  const [searchStations, setSearchStations] = useState("");
  // Chart Zoom Modal states
  const [isChartZoomModalOpen, setIsChartZoomModalOpen] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState("progress"); // "progress" or "score"
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
  const [userFormData, setUserFormData] = useState(initialUserFormData);
  const [formErrors, setFormErrors] = useState({});
  const [users, setUsers] = useState([
    {
      id: 1,
      employeeName: "S. K. Sharma",
      hrmsId: "PM_8820",
      mobileNo: "9876543210",
      emailId: "sksharma@rail.in",
      designation: "Pointsman",
      department: "Operations",
      userType: "Employee",
      reportingOfficer: "R. Kumar",
      zone: "Central Railway",
      division: "Nagpur",
      stationName: "Nagpur Main",
      reportingSm: "A. Patil",
      shift: "Morning Shift (06:00 - 14:00)",
      workLocation: "Yard",
      status: "Active",
      marks: 85
    },
    {
      id: 2,
      employeeName: "R. D. Jadhav",
      hrmsId: "SM_5521",
      mobileNo: "9876543211",
      emailId: "rdjadhav@rail.in",
      designation: "Station Master",
      department: "Operations",
      userType: "Manager",
      reportingOfficer: "S. Deshmukh",
      zone: "Central Railway",
      division: "Pune",
      stationName: "Pune Junction",
      smStation: "Pune Junction",
      smDivision: "Pune",
      smZone: "Central Railway",
      status: "Active",
      marks: 92
    },
    {
      id: 3,
      employeeName: "A. P. Kulkarni",
      hrmsId: "TI_2101",
      mobileNo: "9876543212",
      emailId: "apkulkarni@rail.in",
      designation: "Traffic Inspector",
      department: "Operations",
      userType: "Manager",
      reportingOfficer: "P. Nair",
      zone: "Central Railway",
      division: "Nagpur",
      stationName: "Nagpur Main",
      jurisdiction: "Nagpur Division",
      linkedStations: "Nagpur Main, Wardha Junction, Sewagram",
      reportingAom: "A. K. Sinha (AOM/G)",
      status: "Active",
      marks: 78
    }
  ]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [pendingFilters, setPendingFilters] = useState(initialFilterData);
  const [appliedFilters, setAppliedFilters] = useState(initialFilterData);
  const [tableSearch, setTableSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [stations, setStations] = useState(initialStations);
  const [stationFormData, setStationFormData] = useState(initialStationFormData);
  const [stationFormErrors, setStationFormErrors] = useState({});
  const [pendingStationFilters, setPendingStationFilters] = useState(initialStationFilterData);
  const [appliedStationFilters, setAppliedStationFilters] = useState(initialStationFilterData);
  const [stationSearch, setStationSearch] = useState("");
  const [stationMasterSearch, setStationMasterSearch] = useState("");
  const [stationCurrentPage, setStationCurrentPage] = useState(1);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [selectedSMProfile, setSelectedSMProfile] = useState(null);
  const [userShiftDrafts, setUserShiftDrafts] = useState({});

  // Super Admin Replicated Stations View States
  const [view, setView] = useState(null); // { type, data, returnTo, stationData } for station/staff drill-down pages
  const [stF, setStF] = useState({ name: "" }); // search filter
  const [newStName, setNewStName] = useState("");
  const [newStCode, setNewStCode] = useState("");
  const [newStTi, setNewStTi] = useState("TI NGP");
  const [newStDivision, setNewStDivision] = useState("Nagpur");
  const [newStZone, setNewStZone] = useState("CR");
  const [newStCategory, setNewStCategory] = useState("A");
  const [newStClass, setNewStClass] = useState("Class B");
  const [newStType, setNewStType] = useState("Junction");
  const [newStSignaling, setNewStSignaling] = useState("Electronic Interlocking (EI)");
  const [newStPlatforms, setNewStPlatforms] = useState(3);
  const [newStTracks, setNewStTracks] = useState(5);
  const [newStDailyFootfall, setNewStDailyFootfall] = useState(15000);
  const [newStLatitude, setNewStLatitude] = useState("21.1500Â° N");
  const [newStLongitude, setNewStLongitude] = useState("79.0900Â° E");
  const [newStContactNumber, setNewStContactNumber] = useState("+91-712-2560158");
  const [newStEmailId, setNewStEmailId] = useState("");
  const [newStLineConfig, setNewStLineConfig] = useState("Double Line");
  const [newStElectrified, setNewStElectrified] = useState("Electrified AC 25kV");
  const [showAddStation, setShowAddStation] = useState(false);

  // States for Pointsman Under Station Master Page
  const [selectedSMForPointsmen, setSelectedSMForPointsmen] = useState(null);
  const [selectedPointsmanForMonitoring, setSelectedPointsmanForMonitoring] = useState(null);
  const [pointsmanSearchText, setPointsmanSearchText] = useState("");
  const [pointsmanRiskFilter, setPointsmanRiskFilter] = useState("All");
  const [pointsmanStatusFilter, setPointsmanStatusFilter] = useState("All");

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

  const aomPointsmenSeed = [
    { id: 1, hrmsId: "PM_1001", name: "Ravi Kumar", gender: "Male", age: 38, doj: "2012-04-10", basePay: "â‚¹28,500", lastScore: 92, safetyScore: 95, totalAssessments: 12, pmeStatus: "Fit", refStatus: "Cleared", disciplinary: "None", incidents: 0, approvalStatus: "Approved", monitoringStatus: "Active", stationCode: "NGP", stationName: "Nagpur Junction" },
    { id: 2, hrmsId: "PM_1102", name: "Sanjay Patil", gender: "Male", age: 34, doj: "2015-08-22", basePay: "â‚¹26,200", lastScore: 78, safetyScore: 80, totalAssessments: 9, pmeStatus: "Fit", refStatus: "Cleared", disciplinary: "None", incidents: 0, approvalStatus: "Pending", monitoringStatus: "On Duty", stationCode: "NGP", stationName: "Nagpur Junction" },
    { id: 3, hrmsId: "PM_1103", name: "Deepak Nair", gender: "Male", age: 41, doj: "2009-11-05", basePay: "â‚¹31,000", lastScore: 48, safetyScore: 62, totalAssessments: 15, pmeStatus: "Fit", refStatus: "Pending", disciplinary: "Warning", incidents: 1, approvalStatus: "Approved", monitoringStatus: "Off Duty", stationCode: "PUNE", stationName: "Pune Junction" },
    { id: 4, hrmsId: "PM_1104", name: "Ajay Sharma", gender: "Male", age: 29, doj: "2019-02-18", basePay: "â‚¹23,400", lastScore: 84, safetyScore: 88, totalAssessments: 6, pmeStatus: "Fit", refStatus: "Cleared", disciplinary: "None", incidents: 0, approvalStatus: "Pending", monitoringStatus: "Active", stationCode: "PUNE", stationName: "Pune Junction" },
    { id: 5, hrmsId: "PM_1105", name: "Kunal Verma", gender: "Male", age: 36, doj: "2013-07-30", basePay: "â‚¹27,800", lastScore: 35, safetyScore: 55, totalAssessments: 11, pmeStatus: "Unfit", refStatus: "Pending", disciplinary: "Warning", incidents: 2, approvalStatus: "Rejected", monitoringStatus: "Absent", stationCode: "NGP", stationName: "Nagpur Junction" },
    { id: 6, hrmsId: "PM_1106", name: "Priya Menon", gender: "Female", age: 31, doj: "2018-03-14", basePay: "â‚¹25,100", lastScore: 67, safetyScore: 74, totalAssessments: 7, pmeStatus: "Fit", refStatus: "Cleared", disciplinary: "None", incidents: 0, approvalStatus: "Approved", monitoringStatus: "On Duty", stationCode: "NDLS", stationName: "New Delhi" },
    { id: 7, hrmsId: "PM_1107", name: "Ramesh Yadav", gender: "Male", age: 45, doj: "2005-09-01", basePay: "â‚¹34,600", lastScore: 82, safetyScore: 90, totalAssessments: 18, pmeStatus: "Fit", refStatus: "Cleared", disciplinary: "None", incidents: 0, approvalStatus: "Approved", monitoringStatus: "Off Duty", stationCode: "NDLS", stationName: "New Delhi" },
    { id: 8, hrmsId: "PM_1108", name: "Sneha Iyer", gender: "Female", age: 28, doj: "2020-01-20", basePay: "â‚¹22,000", lastScore: 19, safetyScore: 40, totalAssessments: 3, pmeStatus: "Unfit", refStatus: "Pending", disciplinary: "Serious", incidents: 3, approvalStatus: "Rejected", monitoringStatus: "Absent", stationCode: "NDLS", stationName: "New Delhi" }
  ];

  const [aomPointsmen, setAomPointsmen] = useState(aomPointsmenSeed);

  const [aomStationMasters, setAomStationMasters] = useState(() => {
    const saved = localStorage.getItem("aom_station_masters");
    if (saved) return JSON.parse(saved);
    return [
      { id: "SM_1001", hrmsId: "SM_1001", name: "A. Patil", gender: "Male", age: 42, doj: "2010-05-15", basePay: "â‚¹56,000", designation: "Station Master", role: "sm", stationName: "Nagpur Junction", stationCode: "NGP", division: "Nagpur", zone: "Central Railway", category: "A", contactNumber: "9890011122", emailId: "ngp.station@rail.in", lastAssessDate: "2026-03-20", score: 85, pmeStatus: "Fit", refStatus: "Cleared" },
      { id: "SM_1002", hrmsId: "SM_1002", name: "R. Jadhav", gender: "Male", age: 39, doj: "2012-08-22", basePay: "â‚¹54,000", designation: "Station Master", role: "sm", stationName: "Pune Junction", stationCode: "PUNE", division: "Pune", zone: "Central Railway", category: "A", contactNumber: "9880012233", emailId: "pune.station@rail.in", lastAssessDate: "2026-02-14", score: 72, pmeStatus: "Fit", refStatus: "Cleared" },
      { id: "SM_1003", hrmsId: "SM_1003", name: "M. Sharma", gender: "Male", age: 45, doj: "2008-03-10", basePay: "â‚¹62,000", designation: "Station Master", role: "sm", stationName: "New Delhi", stationCode: "NDLS", division: "Delhi", zone: "Northern Railway", category: "A", contactNumber: "9876543210", emailId: "ndls.station@rail.in", lastAssessDate: "2026-03-12", score: 84, pmeStatus: "Fit", refStatus: "Cleared" }
    ];
  });

  useEffect(() => {
    localStorage.setItem("aom_station_masters", JSON.stringify(aomStationMasters));
  }, [aomStationMasters]);

  const [smModal, setSmModal] = useState(null);
  const [ssModal, setSsModal] = useState(null);
  const [tmModal, setTmModal] = useState(null);
  const [tiModal, setTiModal] = useState(null);

  const getPmCat = (score) => {
    if (score >= 80) return "A";
    if (score >= 50) return "B";
    if (score >= 26) return "C";
    return "D";
  };

  const getPmRisk = (pm) => {
    if (pm.safetyScore < 60 || pm.lastScore < 50) return "High";
    if (pm.safetyScore < 75 || pm.lastScore < 65) return "Medium";
    return "Low";
  };

  const handleTiViewClick = (tiRow) => {
    setSelectedTIForStationMasters(tiRow);
    setActivePage("Station Masters Under TI");
  };

  const handleStationMasterClick = (sm) => {
    setSelectedSMForPointsmen(sm);
    setSelectedPointsmanForMonitoring(null);
    setPointsmanSearchText("");
    setPointsmanRiskFilter("All");
    setPointsmanStatusFilter("All");
    setActivePage("Pointsman Under Station Master");
  };

  const stationMastersDirectory = aomStationMasters;

  const filteredStationMasters = stationMastersDirectory.filter((row) => {
    const q = stationMasterSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      row.name.toLowerCase().includes(q) ||
      row.stationName.toLowerCase().includes(q) ||
      row.stationCode.toLowerCase().includes(q) ||
      row.division.toLowerCase().includes(q)
    );
  });

  const handleShiftStationMaster = (smName, targetStationCode) => {
    if (!targetStationCode) return;

    const currentStation = stations.find(s => s.stationMasterName === smName);
    if (!currentStation) return;

    const targetStationObj = stations.find(s => s.stationCode === targetStationCode);
    const targetStationName = targetStationObj ? targetStationObj.stationName : targetStationCode;

    if (!window.confirm(`Are you sure you want to shift Station Master ${smName} from ${currentStation.stationName} to ${targetStationName}?`)) {
      return;
    }

    setStations(prev => prev.map(s => {
      if (s.stationCode === currentStation.stationCode) {
        return {
          ...s,
          stationMasterName: "",
          contactNumber: "",
          emailId: ""
        };
      }
      if (s.stationCode === targetStationCode) {
        return {
          ...s,
          stationMasterName: smName,
          contactNumber: currentStation.contactNumber,
          emailId: currentStation.emailId
        };
      }
      return s;
    }));

    setSmShiftDrafts(prev => {
      const next = { ...prev };
      delete next[smName];
      return next;
    });
  };

  const handleDeleteStationMaster = (smName) => {
    if (!window.confirm(`Are you sure you want to delete Station Master ${smName}?`)) {
      return;
    }

    setStations(prev => prev.map(s => {
      if (s.stationMasterName === smName) {
        return {
          ...s,
          stationMasterName: "",
          contactNumber: "",
          emailId: ""
        };
      }
      return s;
    }));
  };

  const [stationDetailId, setStationDetailId] = useState(null);
  const [isStationEditMode, setIsStationEditMode] = useState(false);
  const [tiSearch, setTiSearch] = useState("");
  const [trafficInspectors, setTrafficInspectors] = useState(initialTrafficInspectors);
  const [tiFormData, setTiFormData] = useState(initialTiFormData);
  const [tiFormErrors, setTiFormErrors] = useState({});
  const [tiAddMode, setTiAddMode] = useState("form");
  const [tiHrmsSearch, setTiHrmsSearch] = useState("");
  const [tiNotice, setTiNotice] = useState("");
  const [selectedTiId, setSelectedTiId] = useState(null);
  const [tiLinkTargetId, setTiLinkTargetId] = useState(null);
  const [tiLinkDraft, setTiLinkDraft] = useState({ stations: [], sms: [] });
  const [tiShiftDrafts, setTiShiftDrafts] = useState({});
  const [smShiftDrafts, setSmShiftDrafts] = useState({});
  const [selectedTIForStationMasters, setSelectedTIForStationMasters] = useState(null);
  const [pendingAssessments, setPendingAssessments] = useState(initialPendingAssessments);
  const [approvedAssessments, setApprovedAssessments] = useState(initialApprovedAssessments);
  const [reportRows, setReportRows] = useState(initialReportRows);
  const [reportSearchQuery, setReportSearchQuery] = useState("");
  const [reportDesignation, setReportDesignation] = useState("All Designations");
  const [repF, setRepF] = useState({ search: "", role: "All", station: "All", cat: "All", risk: "All", ti: "All" });
  const [repApplied, setRepApplied] = useState(false);
  const [selectedReportUserId, setSelectedReportUserId] = useState(null);
  const [assessmentActionNotice, setAssessmentActionNotice] = useState("");
  const [assessmentRoleTab, setAssessmentRoleTab] = useState("TI");
  const [openAssessmentId, setOpenAssessmentId] = useState(null);
  const [answersByAssessment, setAnswersByAssessment] = useState({});
  const [expandedCriterionKey, setExpandedCriterionKey] = useState({});
  const [assessSearch, setAssessSearch] = useState("");
  const [assessStation, setAssessStation] = useState("All");
  const [assessStatus, setAssessStatus] = useState("All");
  const [assessDate, setAssessDate] = useState("");
  const [aomSettings, setAomSettings] = useState({
    emailAlerts: true,
    smsAlerts: true,
    weeklyDigest: true,
    autoEscalation: true,
    reportVisibility: "All",
    defaultAssessmentTab: "TI"
  });
  const [settingsNotice, setSettingsNotice] = useState("");

  // Open assessment from URL (e.g. ?assessment=ID) in a new tab/link
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const aid = params.get("assessment");
      if (aid) {
        setActivePage("Assessments");
        setOpenAssessmentId(aid);
        const found = pendingAssessments.find((it) => it.id === aid) || approvedAssessments.find((it) => it.id === aid);
        if (found) {
          if ((found.title || "").startsWith("Station Master")) setAssessmentRoleTab("SM");
          else if ((found.title || "").startsWith("Train Manager")) setAssessmentRoleTab("TM");
          else setAssessmentRoleTab("TI");
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Employee Management Page State
  const [empSearchText, setEmpSearchText] = useState("");
  const [empDesignationFilter, setEmpDesignationFilter] = useState("All");
  const [empStationFilter, setEmpStationFilter] = useState("All");
  const [empDivisionFilter, setEmpDivisionFilter] = useState("All");
  const [empZoneFilter, setEmpZoneFilter] = useState("All");
  const [empCategoryFilter, setEmpCategoryFilter] = useState("All");
  const [empRiskFilter, setEmpRiskFilter] = useState("All");
  const [empStatusFilter, setEmpStatusFilter] = useState("All");
  const [empMonitoringFilter, setEmpMonitoringFilter] = useState("All");

  const [empSortConfig, setEmpSortConfig] = useState({ key: "name", direction: "ascending" });
  const [empCurrentPage, setEmpCurrentPage] = useState(1);
  const [deactivatedUserIds, setDeactivatedUserIds] = useState(new Set());
  const [empShiftDrafts, setEmpShiftDrafts] = useState({});

  // Role-directory filter state (shared for all 5 roles)
  const [roleFilterName, setRoleFilterName] = useState("");
  const [roleFilterStation, setRoleFilterStation] = useState("All");
  const [roleFilterDivision, setRoleFilterDivision] = useState("All");
  const [roleFilterCat, setRoleFilterCat] = useState("All");
  const [roleFilterRisk, setRoleFilterRisk] = useState("All");
  const [selectedRoleEmployee, setSelectedRoleEmployee] = useState(null);
  const [roleShiftDrafts, setRoleShiftDrafts] = useState({});
  const [tiActivatedAssessments, setTiActivatedAssessments] = useState({});
  const [tiAssessmentFormOpen, setTiAssessmentFormOpen] = useState(null); // hrmsId of TI being assessed
  const [tiAssessmentAnswers, setTiAssessmentAnswers] = useState({});

  const [aomSuperintendents, setAomSuperintendents] = useState(() => {
    const saved = localStorage.getItem("aom_superintendents");
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, employeeId: "SS_001", name: "R. Desai", role: "ss", designation: "Station Superintendent", station: "Nagpur Junction", division: "Nagpur", zone: "Central Railway", cat: "A", risk: "Low", score: 92, contact: "9999911111", email: "rdesai@rail.in", lastDate: "2026-04-18", status: "Approved" },
      { id: 2, employeeId: "SS_002", name: "M. Kulkarni", role: "ss", designation: "Station Superintendent", station: "Parbhani Junction", division: "Nagpur", zone: "Central Railway", cat: "A", risk: "Low", score: 87, contact: "9999922222", email: "mkulkarni@rail.in", lastDate: "2026-04-10", status: "Approved" }
    ];
  });

  useEffect(() => {
    localStorage.setItem("aom_superintendents", JSON.stringify(aomSuperintendents));
  }, [aomSuperintendents]);
  /* ─────────────── AOM SS ASSESSMENT CRITERIA ─────────────── */
  const AOM_SS_CRITERIA = [
    {
      key: "stationOps", label: "Station Operations & Supervision", weight: 5, count: 5,
      criteria: ["Train reception/dispatch procedures", "Station yard supervision during peak hours", "Platform safety compliance", "Crowd management protocols", "Block instrument operation"]
    },
    {
      key: "staffMgmt", label: "Staff Management & Discipline", weight: 4, count: 5,
      criteria: ["Duty roster maintenance", "Punctuality and attendance tracking", "Leave management compliance", "Uniform & conduct enforcement", "Safety briefing conduct"]
    },
    {
      key: "records", label: "Records & Documentation", weight: 3, count: 5,
      criteria: ["Station log book accuracy", "Accident/incident reporting", "Block register maintenance", "Cash and freight register audit", "Train delay reporting"]
    },
    {
      key: "safety", label: "Safety Compliance & Emergency", weight: 5, count: 5,
      criteria: ["Emergency evacuation drill conduct", "Fire equipment serviceability check", "Signal failure response protocol", "Fog signal deployment knowledge", "Coordination with control office"]
    },
    {
      key: "infra", label: "Infrastructure & Asset Maintenance", weight: 3, count: 5,
      criteria: ["Platform surface and lighting check", "Footover bridge safety assessment", "Washroom hygiene maintenance", "Waiting room orderliness", "Coach indication board accuracy"]
    },
  ];

  const aomDefaultSsForm = () => ({
    stationOps: Array(5).fill("No"), staffMgmt: Array(5).fill("No"),
    records: Array(5).fill("No"), safety: Array(5).fill("No"),
    infra: Array(5).fill("No"), knowledgeMarks: "", alcoholicStatus: "",
    pmeStatus: "Fit", refStatus: "Cleared", counselling: "Not Required",
    automaticTraining: "Not Required", remarks: ""
  });

  const calcAomSsLiveScore = (form) => {
    let total = 0;
    AOM_SS_CRITERIA.forEach(c => { (form[c.key] || []).forEach(v => { if (v === "Yes") total += c.weight; }); });
    const km = Math.min(parseInt(form.knowledgeMarks) || 0, 25);
    return { ynScore: Math.min(total, 75), knowledge: km, total: Math.min(total, 75) + km };
  };

  const [aomSsList, setAomSsList] = useState(() => {
    const saved = localStorage.getItem("aom_ss_assess_list");
    if (saved) return JSON.parse(saved);
    return [
      { id: "ASSA_1001", name: "R. Desai", hrmsId: "SS_001", station: "Nagpur Junction", lastDate: "2026-04-18", status: "Pending" },
      { id: "ASSA_1002", name: "M. Kulkarni", hrmsId: "SS_002", station: "Parbhani Junction", lastDate: "2026-04-10", status: "Pending" },
    ];
  });
  useEffect(() => { localStorage.setItem("aom_ss_assess_list", JSON.stringify(aomSsList)); }, [aomSsList]);

  const [aomSsForms, setAomSsForms] = useState(() => {
    const saved = localStorage.getItem("aom_ss_forms");
    return saved ? JSON.parse(saved) : {};
  });
  useEffect(() => { localStorage.setItem("aom_ss_forms", JSON.stringify(aomSsForms)); }, [aomSsForms]);

  const [aomSsLocked, setAomSsLocked] = useState({});
  const [activeAomSsId, setActiveAomSsId] = useState(null);

  const openAomSsForm = (id) => {
    setActiveAomSsId(id);
    setAomSsForms(prev => ({ ...prev, [id]: prev[id] || aomDefaultSsForm() }));
    setAomSsLocked(prev => {
      const item = aomSsList.find(s => s.id === id);
      return { ...prev, [id]: item?.status === "Approved" };
    });
  };

  const toggleAomSsYN = (id, key, idx, val) => {
    if (aomSsLocked[id]) return;
    setAomSsForms(prev => {
      const f = { ...(prev[id] || aomDefaultSsForm()) };
      const arr = [...(f[key] || Array(5).fill("No"))];
      arr[idx] = arr[idx] === val ? "No" : val;
      return { ...prev, [id]: { ...f, [key]: arr } };
    });
  };

  const setAomSsField = (id, key, val) => {
    if (aomSsLocked[id]) return;
    setAomSsForms(prev => ({ ...prev, [id]: { ...(prev[id] || aomDefaultSsForm()), [key]: val } }));
  };

  const AOM_CAT_BG = { A: "#dcfce7", B: "#dbeafe", C: "#fef3c7", D: "#fee2e2" };
  const AOM_CAT_CLR = { A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#dc2626" };

  const submitAomSsAssessment = (id) => {
    const f = aomSsForms[id];
    if (!f?.alcoholicStatus) { alert("Alcoholic/Non-Alcoholic status is mandatory."); return; }
    const { total } = calcAomSsLiveScore(f);
    const isAlcoholic = f.alcoholicStatus === "Alcoholic";
    const getCatAomSs = s => s >= 80 ? "A" : s >= 50 ? "B" : s >= 26 ? "C" : "D";
    const cat = isAlcoholic ? "D" : getCatAomSs(total);
    setAomSsList(prev => prev.map(s => s.id === id ? { ...s, status: "Approved", score: total, category: cat, lastDate: new Date().toISOString().slice(0, 10) } : s));
    setAomSsLocked(p => ({ ...p, [id]: true }));
    const ssItem = aomSsList.find(s => s.id === id);
    const ssHrmsId = ssItem?.hrmsId || id;
    setApprovedAssessments(prev => [{
      id: ssHrmsId, title: `Station Superintendent - ${ssHrmsId}`,
      detail: `Approved by: AOM/G - on ${new Date().toISOString().slice(0, 10)}`,
      score: `Score: ${total}/100 - Grade: ${cat}`
    }, ...prev]);
    setActiveAomSsId(null);
    alert("SS assessment approved and locked.");
  };


  const [aomTrainManagers, setAomTrainManagers] = useState(() => {
    const saved = localStorage.getItem("aom_train_managers");
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, employeeId: "TM_3001", name: "V. Sharma", role: "tm", designation: "Train Manager", station: "Nagpur Junction", division: "Nagpur", zone: "Central Railway", cat: "A", risk: "Low", score: 89, contact: "9999988888", email: "vsharma@rail.in", lastDate: "2026-04-14", status: "Approved", workLocation: "Nagpur Depot", reportingSm: "NGP-BSL Section", shift: "Goods Train Beat" },
      { id: 2, employeeId: "TM_3002", name: "P. Jadhav", role: "tm", designation: "Train Manager", station: "Amla Junction", division: "Nagpur", zone: "Central Railway", cat: "C", risk: "High", score: 52, contact: "9999999999", email: "pjadhav@rail.in", lastDate: "2026-03-10", status: "Rejected", workLocation: "Nagpur Depot", reportingSm: "NGP-BSL Section", shift: "Goods Train Beat" }
    ];
  });

  useEffect(() => {
    localStorage.setItem("aom_train_managers", JSON.stringify(aomTrainManagers));
  }, [aomTrainManagers]);

  const allEmployees = useMemo(() => {
    return [
      ...aomPointsmen.map((p) => ({
        hrmsId: p.hrmsId,
        name: p.name,
        gender: p.gender || "Male",
        age: p.age || 35,
        doj: p.doj || "2018-06-15",
        basePay: p.basePay || "â‚¹28,500",
        designation: "Pointsman",
        role: "pointsmen",
        stationName: p.stationName,
        stationCode: p.stationCode,
        division: p.stationCode === "NGP" ? "Nagpur" : p.stationCode === "PUNE" ? "Pune" : "Mumbai",
        zone: p.zone || "CR",
        category: getPmCat(p.lastScore),
        riskLevel: getPmRisk(p),
        assessmentStatus: p.approvalStatus,
        lastScore: p.lastScore,
        safetyScore: p.safetyScore,
        totalAssessments: p.totalAssessments,
        lastAssessedDate: p.lastAssessDate || "2026-03-28",
        monitoringStatus: deactivatedUserIds.has(p.hrmsId) ? "Deactivated" : (p.monitoringStatus || "Active"),
        contactNumber: p.contact || "—",
        emailId: p.email || `${p.hrmsId.toLowerCase()}@rail.in`
      })),
      ...aomStationMasters.map((sm, idx) => {
        const smHrmsId = sm.hrmsId || sm.id || `SM_${1001 + idx}`;
        return {
          hrmsId: smHrmsId,
          name: sm.name,
          gender: sm.gender || "Male",
          age: sm.age || 42,
          doj: sm.doj || "2010-05-15",
          basePay: sm.basePay || "â‚¹56,000",
          designation: "Station Master",
          role: "sm",
          stationName: sm.stationName,
          stationCode: sm.stationCode,
          division: sm.division,
          zone: sm.zone || "CR",
          category: sm.category || "A",
          riskLevel: sm.riskLevel || (idx % 3 === 0 ? "Medium" : "Low"),
          assessmentStatus: sm.assessmentStatus || (idx % 2 === 0 ? "Approved" : "Pending"),
          lastScore: sm.lastScore || sm.score || 85,
          safetyScore: sm.safetyScore || 90,
          totalAssessments: sm.totalAssessments || 10,
          lastAssessedDate: sm.lastAssessedDate || sm.lastAssessDate || "2026-04-12",
          monitoringStatus: deactivatedUserIds.has(smHrmsId) ? "Deactivated" : (sm.monitoringStatus || "Active"),
          contactNumber: sm.contactNumber || sm.contact || "—",
          emailId: sm.emailId || sm.email || `${smHrmsId.toLowerCase()}@rail.in`
        };
      }),
      ...aomSuperintendents.map((ss) => ({
        hrmsId: ss.employeeId,
        name: ss.name,
        gender: "Male",
        age: 46,
        doj: "2008-03-12",
        basePay: "â‚¹62,000",
        designation: "Station Superintendent",
        role: "ss",
        stationName: ss.station,
        stationCode: ss.station === "Nagpur Junction" ? "NGP" : "PBN",
        division: ss.division,
        zone: ss.zone || "CR",
        category: ss.cat || "A",
        riskLevel: ss.risk || "Low",
        assessmentStatus: ss.status || "Approved",
        lastScore: ss.score,
        safetyScore: ss.score + 4,
        totalAssessments: 11,
        lastAssessedDate: ss.lastDate || "2026-04-18",
        monitoringStatus: deactivatedUserIds.has(ss.employeeId) ? "Deactivated" : "Active",
        contactNumber: ss.contact || "—",
        emailId: ss.email || `${ss.employeeId.toLowerCase()}@rail.in`
      })),
      ...aomTrainManagers.map((tm) => ({
        hrmsId: tm.employeeId,
        name: tm.name,
        gender: "Male",
        age: 39,
        doj: "2014-09-05",
        basePay: "â‚¹48,000",
        designation: "Train Manager",
        role: "tm",
        stationName: tm.station,
        stationCode: tm.station === "Nagpur Junction" ? "NGP" : "AMLA",
        division: tm.division,
        zone: tm.zone || "CR",
        category: tm.cat || "A",
        riskLevel: tm.risk || "Low",
        assessmentStatus: tm.status || "Approved",
        lastScore: tm.score,
        safetyScore: tm.score + 3,
        totalAssessments: 8,
        lastAssessedDate: tm.lastDate || "2026-04-14",
        monitoringStatus: deactivatedUserIds.has(tm.employeeId) ? "Deactivated" : "Active",
        contactNumber: tm.contact || "—",
        emailId: tm.email || `${tm.employeeId.toLowerCase()}@rail.in`,
        workLocation: tm.workLocation || "Nagpur Depot",
        reportingSm: tm.reportingSm || "NGP-BSL Section",
        shift: tm.shift || "Goods Train Beat"
      })),
      ...trafficInspectors.map((ti, idx) => ({
        hrmsId: ti.employeeId,
        name: ti.name,
        gender: "Male",
        age: 48,
        doj: "2006-11-20",
        basePay: "â‚¹68,000",
        designation: "Traffic Inspector",
        role: "ti",
        stationName: ti.stationName || "Division HQ",
        stationCode: ti.stationName === "Nagpur Junction" ? "NGP" : ti.stationName === "Parbhani Junction" ? "PBN" : "AMLA",
        division: ti.division || "Nagpur",
        zone: "CR",
        category: ti.category || "A",
        riskLevel: ti.riskLevel || "Low",
        assessmentStatus: ti.assessmentStatus === "Completed" ? "Approved" : (ti.assessmentStatus === "Pending" ? "Pending" : "Approved"),
        lastScore: ti.lastScore || 88,
        safetyScore: 95,
        totalAssessments: 8,
        lastAssessedDate: "2026-03-15",
        monitoringStatus: deactivatedUserIds.has(ti.employeeId) ? "Deactivated" : "Active",
        contactNumber: ti.phone || "—",
        emailId: ti.email || `${ti.employeeId.toLowerCase()}@rail.in`
      }))
    ];
  }, [aomPointsmen, aomStationMasters, stations, aomSuperintendents, aomTrainManagers, trafficInspectors, deactivatedUserIds]);

  const pageSize = 8;
  const stationPageSize = 8;

  const todayIso = () => new Date().toISOString().slice(0, 10);

  const extractDesignation = (title) => title.split(" - ")[0] || "Employee";

  const resolveAssessmentTab = (title) => {
    const designation = extractDesignation(title);
    if (designation === "Station Master") return "SM";
    if (designation === "Train Manager") return "TM";
    return "TI";
  };

  const renderCategoryBadge = (category) => {
    const value = String(category || "").trim().toUpperCase();
    const isRank = ["A", "B", "C", "D"].includes(value);

    if (isRank) {
      return <span className={`category-circle category-${value.toLowerCase()}`}>{value}</span>;
    }

    return <span className="category-text-chip">{value || "-"}</span>;
  };

  const buildPrefilledAnswers = (title) => {
    const tab = resolveAssessmentTab(title);
    if (tab === "SM" || tab === "TM") {
      return {
        knowledgeOfRules: "yes",
        alertnessAndObservation: "yes",
        safetyRecord: "no",
        leadershipAndManagement: "yes",
        discipline: "yes",
        appearanceAndNeatness: "yes",
        alcoholicStatus: "Non-Alcoholic",
        pmeStatus: "Fit",
        refStatus: "Cleared",
        counselling: "Not Required",
        automaticTraining: "Not Required",
        remarks: ""
      };
    }

    return {
      knowledgeOfRules: "no",
      alertnessAndObservation_0: "no",
      alertnessAndObservation_1: "no",
      alertnessAndObservation_2: "no",
      safetyRecord_0: "no",
      safetyRecord_1: "no",
      leadershipAndManagement_0: "no",
      leadershipAndManagement_1: "no",
      discipline_0: "no",
      discipline_1: "no",
      appearanceAndNeatness_0: "no",
      appearanceAndNeatness_1: "no",
      alcoholicStatus: "Non-Alcoholic",
      pmeStatus: "Fit",
      refStatus: "Cleared",
      counselling: "Not Required",
      automaticTraining: "Not Required",
      remarks: ""
    };
  };

  const getTiSectionScore = (criterionKey, answers) => {
    if (criterionKey === "knowledgeOfRules") {
      return answers.knowledgeOfRules === "yes" ? 25 : 0;
    }
    let score = 0;
    if (criterionKey === "alertnessAndObservation") {
      if (answers.alertnessAndObservation_0 === "yes") score += 8;
      if (answers.alertnessAndObservation_1 === "yes") score += 8;
      if (answers.alertnessAndObservation_2 === "yes") score += 9;
    } else if (criterionKey === "safetyRecord") {
      if (answers.safetyRecord_0 === "yes") score += 7;
      if (answers.safetyRecord_1 === "yes") score += 8;
    } else if (criterionKey === "leadershipAndManagement") {
      if (answers.leadershipAndManagement_0 === "yes") score += 7;
      if (answers.leadershipAndManagement_1 === "yes") score += 8;
    } else if (criterionKey === "discipline") {
      if (answers.discipline_0 === "yes") score += 5;
      if (answers.discipline_1 === "yes") score += 5;
    } else if (criterionKey === "appearanceAndNeatness") {
      if (answers.appearanceAndNeatness_0 === "yes") score += 5;
      if (answers.appearanceAndNeatness_1 === "yes") score += 5;
    }
    return score;
  };

  const calculateAssessmentScore = (answers = {}, isTi = false) => {
    if (isTi) {
      return assessmentCriteria.reduce((total, criterion) => {
        return total + getTiSectionScore(criterion.key, answers);
      }, 0);
    }
    return assessmentCriteria.reduce((total, criterion) => {
      return total + (answers[criterion.key] === "yes" ? criterion.marks : 0);
    }, 0);
  };

  const countAnsweredCriteria = (answers = {}) =>
    assessmentCriteria.reduce((count, criterion) => {
      const value = answers[criterion.key];
      return count + (value === "yes" || value === "no" ? 1 : 0);
    }, 0);

  const computeScoreAndGrade = (target) => {
    const effectiveAnswers = answersByAssessment[target.id] || buildPrefilledAnswers(target.title);
    const isTi = target.title?.startsWith("Traffic Inspector");
    const score = calculateAssessmentScore(effectiveAnswers, isTi);
    const grade = score >= 90 ? "A" : score >= 80 ? "B" : "C";
    return { score, grade };
  };

  const buildAssessmentTableMeta = (item, approved = false) => {
    const designation = extractDesignation(item.title);
    const hrmsId = item.id || item.title.split(" - ")[1] || "-";
    const nameMatch = item.employeeLine?.match(/Employee:\s*([^|]+)/i);
    const employeeName = nameMatch ? nameMatch[1].trim() : "-";
    const dateLine = item.assessedByLine || item.detail || "";
    const dateMatch = dateLine.match(/(\d{4}-\d{2}-\d{2})/);
    const lastAssessed = dateMatch ? dateMatch[1] : "-";

    if (approved) {
      const scoreMatch = (item.score || "").match(/Score:\s*(\d+)\/100\s*-\s*Grade:\s*([A-D])/i);
      return {
        hrmsId,
        employeeName,
        designation,
        status: "Approved",
        score: scoreMatch ? scoreMatch[1] : "-",
        grade: scoreMatch ? scoreMatch[2].toUpperCase() : "-",
        lastAssessed
      };
    }

    const { score, grade } = computeScoreAndGrade(item);
    return {
      hrmsId,
      employeeName,
      designation,
      status: item.statusLabel || "Pending",
      score,
      grade,
      lastAssessed
    };
  };

  const handleViewAssessmentDetails = (title, detailLine, statusLabel) => {
    setAssessmentActionNotice(`Opened details for ${title}`);
    window.alert(`${title}\n${detailLine}\nStatus: ${statusLabel}`);
  };

  const handleApproveAssessment = (id) => {
    const target = pendingAssessments.find((item) => item.id === id);
    if (!target) {
      return;
    }

    const { score: computedScore, grade } = computeScoreAndGrade(target);

    setPendingAssessments((prev) => prev.filter((item) => item.id !== id));
    setApprovedAssessments((prev) => [
      {
        id: target.id,
        title: target.title,
        detail: `Approved by: AOM/G - on ${todayIso()}`,
        score: `Score: ${computedScore}/100 - Grade: ${grade}`
      },
      ...prev
    ]);
    setReportRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
            ...row,
            assessmentStatus: "Approved",
            score: String(computedScore),
            grade,
            lastAssessed: todayIso()
          }
          : row
      )
    );
    setAssessmentActionNotice(`${target.title} approved successfully.`);
    setOpenAssessmentId((prev) => (prev === id ? null : prev));
  };

  const handleRejectAssessment = (id) => {
    const target = pendingAssessments.find((item) => item.id === id);
    setPendingAssessments((prev) => prev.filter((item) => item.id !== id));
    if (target) {
      setAssessmentActionNotice(`${target.title} rejected.`);
    }
    setOpenAssessmentId((prev) => (prev === id ? null : prev));
  };

  const handleStartAssessment = (id) => {
    setPendingAssessments((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
            ...item,
            statusLabel: "Pending Approval",
            assessedByLine: `Assessed by: AOM/G - on ${todayIso()}`,
            actionType: "approval"
          }
          : item
      )
    );
    setReportRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
            ...row,
            assessmentStatus: "In Progress",
            lastAssessed: todayIso()
          }
          : row
      )
    );
    setAssessmentActionNotice(`Assessment started for ${id}.`);
  };

  const handleOpenAssessmentForm = (item) => {
    const tab = resolveAssessmentTab(item.title);
    setAssessmentRoleTab(tab);
    setOpenAssessmentId(item.id);
    setAnswersByAssessment((prev) => {
      if (prev[item.id]) {
        return prev;
      }
      return {
        ...prev,
        [item.id]: buildPrefilledAnswers(item.title)
      };
    });
  };

  const getTiRosterList = () => {
    return trafficInspectors.map((ti) => {
      const pending = pendingAssessments.find(p => p.id === ti.employeeId);
      const approved = approvedAssessments.find(a => a.id === ti.employeeId);

      let status = "Pending";
      let score = ti.lastScore || "";
      let lastAssessed = ti.lastAssessedDate || "2026-04-07";

      if (pending) {
        const isExamAssigned = localStorage.getItem(`ti_exam_assigned_${ti.employeeId}`) === "true";
        const isExamTaken = localStorage.getItem(`ti_exam_taken_${ti.employeeId}`) === "true";

        if (isExamTaken) {
          status = "Exam Taken";
        } else if (isExamAssigned) {
          status = "Exam Sent";
        } else if (pending.actionType === "approval") {
          status = "Submitted";
        } else {
          status = "Pending";
        }
      } else if (approved) {
        status = "Approved";
        const match = approved.score?.match(/Score:\s*(\d+)/i);
        score = match ? parseInt(match[1]) : (ti.lastScore || 85);
        const dateMatch = approved.detail?.match(/on\s+(\d{4}-\d{2}-\d{2})/i);
        lastAssessed = dateMatch ? dateMatch[1] : "2026-04-07";
      } else {
        status = ti.assessmentStatus === "Completed" ? "Approved" : (ti.assessmentStatus || "Pending");
      }

      return {
        ...ti,
        status,
        score,
        lastAssessed
      };
    });
  };

  const openTiForm = (ti) => {
    let pendingItem = pendingAssessments.find(p => p.id === ti.employeeId);
    if (!pendingItem) {
      const approvedItem = approvedAssessments.find(a => a.id === ti.employeeId);
      if (approvedItem) {
        pendingItem = {
          id: approvedItem.id,
          title: approvedItem.title,
          statusLabel: "Approved",
          assessedByLine: approvedItem.detail,
          employeeLine: `Employee: ${ti.name} | Division: ${ti.division || "Nagpur"}`,
          actionType: "approval"
        };
      } else {
        pendingItem = {
          id: ti.employeeId,
          title: `Traffic Inspector - ${ti.employeeId}`,
          statusLabel: "Pending Assessment",
          assessedByLine: `Awaiting: Your Assessment - on ${todayIso()}`,
          employeeLine: `Employee: ${ti.name} | Division: ${ti.division || "Nagpur"}`,
          actionType: "assessment"
        };
        setPendingAssessments(prev => [pendingItem, ...prev]);
      }
    }

    setOpenAssessmentId(pendingItem.id);
    setAnswersByAssessment((prev) => {
      if (prev[pendingItem.id]) {
        return prev;
      }
      return {
        ...prev,
        [pendingItem.id]: buildPrefilledAnswers(pendingItem.title)
      };
    });
  };

  const handleAnswerChange = (assessmentId, criterionKey, value) => {
    setAnswersByAssessment((prev) => ({
      ...prev,
      [assessmentId]: {
        ...(prev[assessmentId] || {}),
        [criterionKey]: value
      }
    }));
  };

  const handleSelectAllYes = (assessmentIds, roleTab) => {
    if (!assessmentIds || assessmentIds.length === 0) {
      setAssessmentActionNotice("No employees available in the selected option.");
      return;
    }

    const allYes = assessmentCriteria.reduce((acc, criterion) => {
      acc[criterion.key] = "yes";
      return acc;
    }, {});

    const isTi = roleTab === "TI";
    const tiYes = {
      knowledgeOfRules: "yes",
      alertnessAndObservation_0: "yes",
      alertnessAndObservation_1: "yes",
      alertnessAndObservation_2: "yes",
      safetyRecord_0: "yes",
      safetyRecord_1: "yes",
      leadershipAndManagement_0: "yes",
      leadershipAndManagement_1: "yes",
      discipline_0: "yes",
      discipline_1: "yes",
      appearanceAndNeatness_0: "yes",
      appearanceAndNeatness_1: "yes",
      alcoholicStatus: "Non-Alcoholic",
      pmeStatus: "Fit",
      refStatus: "Cleared",
      counselling: "Not Required",
      automaticTraining: "Not Required",
      remarks: ""
    };

    setAnswersByAssessment((prev) => {
      const next = { ...prev };
      assessmentIds.forEach((assessmentId) => {
        next[assessmentId] = isTi ? { ...tiYes } : { ...allYes };
      });
      return next;
    });

    setAssessmentActionNotice(`All answers marked Yes for ${assessmentIds.length} employee(s) in ${roleTab} option.`);
  };

  const handleApproveAllInSelectedOption = () => {
    const targets = pendingAssessments.filter((item) => resolveAssessmentTab(item.title) === assessmentRoleTab);
    if (targets.length === 0) {
      setAssessmentActionNotice("No employees to approve in the selected option.");
      return;
    }

    const approvedDate = todayIso();
    const approvedBatch = targets.map((target) => {
      const { score, grade } = computeScoreAndGrade(target);
      return {
        id: target.id,
        title: target.title,
        employeeLine: target.employeeLine,
        detail: `Approved by: AOM/G - on ${approvedDate}`,
        score: `Score: ${score}/100 - Grade: ${grade}`
      };
    });

    const updatesById = approvedBatch.reduce((acc, item) => {
      const scoreMatch = (item.score || "").match(/Score:\s*(\d+)\/100\s*-\s*Grade:\s*([A-D])/i);
      acc[item.id] = {
        score: scoreMatch ? scoreMatch[1] : "-",
        grade: scoreMatch ? scoreMatch[2].toUpperCase() : "-",
        lastAssessed: approvedDate
      };
      return acc;
    }, {});

    setPendingAssessments((prev) => prev.filter((item) => resolveAssessmentTab(item.title) !== assessmentRoleTab));
    setApprovedAssessments((prev) => [...approvedBatch, ...prev]);
    setReportRows((prev) =>
      prev.map((row) => {
        const updated = updatesById[row.id];
        if (!updated) {
          return row;
        }

        return {
          ...row,
          assessmentStatus: "Approved",
          score: updated.score,
          grade: updated.grade,
          lastAssessed: updated.lastAssessed
        };
      })
    );

    setOpenAssessmentId((prev) => (targets.some((item) => item.id === prev) ? null : prev));
    setAssessmentActionNotice(`Approved all ${targets.length} employee(s) in ${assessmentRoleTab} option.`);
  };

  const toggleCriterion = (assessmentId, criterionKey) => {
    setExpandedCriterionKey((prev) => {
      const mapKey = `${assessmentId}:${criterionKey}`;
      return {
        ...prev,
        [mapKey]: !prev[mapKey]
      };
    });
  };

  const handleViewReport = (row) => {
    window.alert(
      `${row.designation} - ${row.hrmsId}\nEmployee: ${row.name}\nStatus: ${row.assessmentStatus}\nScore: ${row.score}\nGrade: ${row.grade}\nLast Assessed: ${row.lastAssessed}`
    );
  };

  const handleAssessReport = (id) => {
    setReportRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
            ...row,
            assessmentStatus: "In Progress",
            lastAssessed: todayIso()
          }
          : row
      )
    );
    setAssessmentActionNotice(`Assessment opened for ${id}.`);
  };

  const handleSettingsToggle = (key) => {
    setAomSettings((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSettingsSelect = (key, value) => {
    setAomSettings((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = () => {
    setAssessmentRoleTab(aomSettings.defaultAssessmentTab);
    setSettingsNotice("Settings saved successfully.");
  };

  const filteredReportRows = reportRows.filter((row) => {
    const searchText = reportSearchQuery.trim().toLowerCase();
    const matchesSearch =
      searchText.length === 0 ||
      row.hrmsId.toLowerCase().includes(searchText) ||
      row.name.toLowerCase().includes(searchText);
    const matchesDesignation = reportDesignation === "All Designations" || row.designation === reportDesignation;
    return matchesSearch && matchesDesignation;
  });

  const handleSidebarClick = (label) => {
    setView(null);
    setSelectedReportUserId(null);
    setRepApplied(false);
    setActivePage(label);

    if (label !== "Add Station") {
      setStationFormErrors({});
    }

    if (label === "Add Station") {
      setStationFormData(initialStationFormData);
      setStationFormErrors({});
      setStationDetailId(null);
      setIsStationEditMode(false);
    }

    // Reset role-directory filters when switching between role pages
    if (["Pointsmen", "Station Masters", "Station Superintendents", "Train Managers", "Traffic Inspectors"].includes(label)) {
      setRoleFilterName("");
      setRoleFilterStation("All");
      setRoleFilterDivision("All");
      setRoleFilterCat("All");
      setRoleFilterRisk("All");
      setSelectedRoleEmployee(null);
      setTiAssessmentFormOpen(null);
    }
  };


  const handleStationSubPage = (label) => {
    setActivePage(label);

    if (label === "Add Station") {
      setStationFormData(initialStationFormData);
      setStationFormErrors({});
      setStationDetailId(null);
      setIsStationEditMode(false);
    }
  };

  const handleUserFormChange = (e) => {
    const { name, value } = e.target;
    setUserFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setPendingFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const validateUserForm = () => {
    const errors = {};
    if (!userFormData.employeeName || !userFormData.employeeName.trim()) errors.employeeName = "Full Name is required";
    if (!userFormData.hrmsId || !userFormData.hrmsId.trim()) errors.hrmsId = "HRMS ID / Employee ID is required";
    if (!userFormData.mobileNo || !userFormData.mobileNo.trim()) errors.mobileNo = "Mobile Number is required";
    if (!userFormData.emailId || !userFormData.emailId.trim()) errors.emailId = "Email ID is required";
    if (!userFormData.designation) errors.designation = "Role / Designation is required";
    if (!userFormData.zone) errors.zone = "Zone is required";
    if (!userFormData.division) errors.division = "Division is required";
    if (!userFormData.stationName) errors.stationName = "Station Name is required";

    if (userFormData.designation === "Pointsman") {
      if (!userFormData.reportingSm || !userFormData.reportingSm.trim()) errors.reportingSm = "Reporting Station Master is required";
      if (!userFormData.shift) errors.shift = "Shift is required";
      if (!userFormData.workLocation || !userFormData.workLocation.trim()) errors.workLocation = "Work Location is required";
    } else if (userFormData.designation === "Station Master") {
      if (!userFormData.smStation) errors.smStation = "SM Station is required";
      if (!userFormData.smDivision) errors.smDivision = "SM Division is required";
      if (!userFormData.smZone) errors.smZone = "SM Zone is required";
    } else if (userFormData.designation === "Traffic Inspector") {
      if (!userFormData.jurisdiction || !userFormData.jurisdiction.trim()) errors.jurisdiction = "Jurisdiction is required";
      if (!userFormData.linkedStations || !userFormData.linkedStations.trim()) errors.linkedStations = "Linked Stations are required";
      if (!userFormData.reportingAom) errors.reportingAom = "Reporting AOM is required";
    }
    return errors;
  };

  const handleSubmitUser = (e) => {
    e.preventDefault();
    const errors = validateUserForm();

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingUserId) {
      setUsers((prev) =>
        prev.map((row) =>
          row.id === editingUserId
            ? {
              ...row,
              ...userFormData
            }
            : row
        )
      );
      setEditingUserId(null);
    } else {
      setUsers((prev) => [
        ...prev,
        {
          ...userFormData,
          id: Date.now(),
          marks: 0
        }
      ]);
    }

    setUserFormData(initialUserFormData);
    setFormErrors({});
  };

  const handleEditUser = (id) => {
    const existing = users.find((row) => row.id === id);
    if (!existing) {
      return;
    }

    setUserFormData({
      employeeName: existing.employeeName || "",
      hrmsId: existing.hrmsId || "",
      mobileNo: existing.mobileNo || "",
      emailId: existing.emailId || "",
      designation: existing.designation || "",
      department: existing.department || "Operations",
      userType: existing.userType || "Employee",
      reportingOfficer: existing.reportingOfficer || "R. Kumar",
      zone: existing.zone || "",
      division: existing.division || "",
      stationName: existing.stationName || "",
      reportingSm: existing.reportingSm || "",
      shift: existing.shift || "",
      workLocation: existing.workLocation || "",
      smStation: existing.smStation || "",
      smDivision: existing.smDivision || "",
      smZone: existing.smZone || "",
      jurisdiction: existing.jurisdiction || "",
      linkedStations: existing.linkedStations || "",
      reportingAom: existing.reportingAom || ""
    });
    setEditingUserId(id);
    setFormErrors({});
  };

  const handleDeleteUser = (id) => {
    setUsers((prev) => prev.filter((row) => row.id !== id));
    if (editingUserId === id) {
      setEditingUserId(null);
      setUserFormData(initialUserFormData);
      setFormErrors({});
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setAppliedFilters(pendingFilters);
    setCurrentPage(1);
  };

  const filteredUsers = users.filter((row) => {
    const normalizedSearch = tableSearch.trim().toLowerCase();
    const matchSearch =
      normalizedSearch.length === 0 ||
      row.employeeName.toLowerCase().includes(normalizedSearch) ||
      row.hrmsId.toLowerCase().includes(normalizedSearch) ||
      row.mobileNo.toLowerCase().includes(normalizedSearch);

    const matchFilters =
      (appliedFilters.mobileNo === "" || row.mobileNo.includes(appliedFilters.mobileNo)) &&
      (appliedFilters.designation === "" || row.designation === appliedFilters.designation) &&
      (appliedFilters.hrmsId === "" || row.hrmsId.toLowerCase().includes(appliedFilters.hrmsId.toLowerCase())) &&
      (appliedFilters.department === "" || row.department === appliedFilters.department) &&
      (appliedFilters.userType === "" || row.userType === appliedFilters.userType);

    return matchSearch && matchFilters;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pagedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handleStationFormChange = (e) => {
    const { name, value } = e.target;
    setStationFormData((prev) => ({
      ...prev,
      [name]: name === "stationCode" ? value.toUpperCase() : value
    }));

    if (stationFormErrors[name]) {
      setStationFormErrors((prev) => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleStationStatusToggle = () => {
    setStationFormData((prev) => ({
      ...prev,
      status: prev.status === "Active" ? "Inactive" : "Active"
    }));
  };

  const validateStationForm = (formMode) => {
    const errors = {};
    const codeExists = stations.some(
      (station) => station.stationCode === stationFormData.stationCode.trim().toUpperCase() && station.id !== stationDetailId
    );

    if (!stationFormData.stationName.trim()) errors.stationName = "Station Name is required";
    if (!stationFormData.stationCode.trim()) errors.stationCode = "Station Code is required";
    if (codeExists) errors.stationCode = "Station Code must be unique";
    if (!stationFormData.zone) errors.zone = "Zone is required";
    if (!stationFormData.division) errors.division = "Division is required";
    if (!stationFormData.category) errors.category = "Station Category is required";
    if (!stationFormData.stationType) errors.stationType = "Station Type is required";
    if (!stationFormData.platforms) errors.platforms = "Platforms count is required";
    if (!stationFormData.tracks) errors.tracks = "Tracks count is required";
    if (!stationFormData.address.trim()) errors.address = "Address is required";
    if (!stationFormData.city.trim()) errors.city = "City is required";
    if (!stationFormData.state.trim()) errors.state = "State is required";
    if (!stationFormData.pincode.trim()) errors.pincode = "Pincode is required";
    if (!stationFormData.contactNumber.trim()) errors.contactNumber = "Contact Number is required";
    if (!stationFormData.emailId.trim()) errors.emailId = "Email ID is required";
    if (!stationFormData.latitude.trim()) errors.latitude = "Latitude is required";
    if (!stationFormData.longitude.trim()) errors.longitude = "Longitude is required";

    return errors;
  };

  const handleAddStationSubmit = (e) => {
    e.preventDefault();
    const errors = validateStationForm("create");

    if (Object.keys(errors).length > 0) {
      setStationFormErrors(errors);
      return;
    }

    setStations((prev) => [
      ...prev,
      {
        ...stationFormData,
        id: Date.now(),
        stationCode: stationFormData.stationCode.trim().toUpperCase(),
        platforms: Number(stationFormData.platforms),
        tracks: Number(stationFormData.tracks),
        createdBy: user.hrmsId
      }
    ]);

    setStationFormData(initialStationFormData);
    setStationFormErrors({});
    setActivePage("Station Management");
  };

  const handleResetStationForm = () => {
    setStationFormData(initialStationFormData);
    setStationFormErrors({});
  };

  const handleStationFilterChange = (e) => {
    const { name, value } = e.target;
    setPendingStationFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyStationFilter = (e) => {
    e.preventDefault();
    setAppliedStationFilters(pendingStationFilters);
    setStationCurrentPage(1);
  };

  const filteredStations = stations.filter((station) => {
    const normalizedSearch = stationSearch.trim().toLowerCase();
    const matchSearch =
      normalizedSearch.length === 0 ||
      station.stationName.toLowerCase().includes(normalizedSearch) ||
      station.stationCode.toLowerCase().includes(normalizedSearch);

    const matchFilters =
      (appliedStationFilters.zone === "" || station.zone === appliedStationFilters.zone) &&
      (appliedStationFilters.division === "" || station.division === appliedStationFilters.division) &&
      (appliedStationFilters.category === "" || station.category === appliedStationFilters.category) &&
      (appliedStationFilters.status === "" || station.status === appliedStationFilters.status);

    return matchSearch && matchFilters;
  });

  const stationTotalPages = Math.max(1, Math.ceil(filteredStations.length / stationPageSize));
  const pagedStations = filteredStations.slice(
    (stationCurrentPage - 1) * stationPageSize,
    stationCurrentPage * stationPageSize
  );

  const goToPrevStationPage = () => {
    setStationCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const goToNextStationPage = () => {
    setStationCurrentPage((prev) => Math.min(stationTotalPages, prev + 1));
  };

  const openStationView = (stationId, editable = false) => {
    const target = stations.find((station) => station.id === stationId);
    if (!target) {
      return;
    }

    setStationDetailId(stationId);
    setStationFormData({
      ...target,
      platforms: String(target.platforms),
      tracks: String(target.tracks)
    });
    setStationFormErrors({});
    setIsStationEditMode(editable);
    setActivePage("View / Edit Station");
  };

  const handleUpdateStation = (e) => {
    e.preventDefault();

    const errors = validateStationForm("update");
    if (Object.keys(errors).length > 0) {
      setStationFormErrors(errors);
      return;
    }

    setStations((prev) =>
      prev.map((station) =>
        station.id === stationDetailId
          ? {
            ...station,
            ...stationFormData,
            stationCode: stationFormData.stationCode.trim().toUpperCase(),
            platforms: Number(stationFormData.platforms),
            tracks: Number(stationFormData.tracks)
          }
          : station
      )
    );

    setIsStationEditMode(false);
    setStationFormErrors({});
  };

  const handleDeleteStation = (stationId) => {
    setStations((prev) => prev.filter((station) => station.id !== stationId));
    if (stationDetailId === stationId) {
      setActivePage("Station Management");
      setStationDetailId(null);
      setIsStationEditMode(false);
    }
  };

  const handleTiFormChange = (e) => {
    const { name, value } = e.target;
    setTiFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (tiFormErrors[name]) {
      setTiFormErrors((prev) => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateTiForm = () => {
    const errors = {};
    if (!tiFormData.name.trim()) errors.name = "Name is required";
    if (!tiFormData.employeeId.trim()) errors.employeeId = "Employee ID is required";
    if (!tiFormData.jurisdiction.trim()) errors.jurisdiction = "Jurisdiction is required";
    if (!tiFormData.category.trim()) errors.category = "Category is required";

    const duplicate = trafficInspectors.some(
      (row) => row.employeeId.toLowerCase() === tiFormData.employeeId.trim().toLowerCase()
    );
    if (duplicate) errors.employeeId = "Employee ID already exists";

    return errors;
  };

  const handleAddTiByForm = (e) => {
    e.preventDefault();
    const errors = validateTiForm();

    if (Object.keys(errors).length > 0) {
      setTiFormErrors(errors);
      return;
    }

    setTrafficInspectors((prev) => [
      ...prev,
      {
        id: Date.now(),
        ...tiFormData,
        employeeId: tiFormData.employeeId.trim().toUpperCase(),
        division: tiFormData.jurisdiction,
        linkedStations: [],
        linkedSms: [],
        phone: "-",
        email: "-"
      }
    ]);

    setTiFormData(initialTiFormData);
    setTiFormErrors({});
    setTiNotice("Traffic Inspector added successfully.");
  };

  const matchedTiByHrms = hrmsTiDirectory.find(
    (row) => row.hrmsId.toLowerCase() === tiHrmsSearch.trim().toLowerCase()
  );

  const handleAddTiByHrms = () => {
    if (!matchedTiByHrms) {
      setTiNotice("No TI found with this HRMS ID.");
      return;
    }

    const alreadyExists = trafficInspectors.some(
      (row) => row.employeeId.toLowerCase() === matchedTiByHrms.hrmsId.toLowerCase()
    );

    if (alreadyExists) {
      setTiNotice("This TI already exists in the division list.");
      return;
    }

    setTrafficInspectors((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: matchedTiByHrms.name,
        employeeId: matchedTiByHrms.hrmsId,
        jurisdiction: matchedTiByHrms.jurisdiction,
        category: matchedTiByHrms.category,
        assessmentStatus: matchedTiByHrms.assessmentStatus,
        linkedStations: [],
        linkedSms: [],
        division: matchedTiByHrms.division,
        phone: matchedTiByHrms.phone,
        email: matchedTiByHrms.email
      }
    ]);

    setTiNotice(`Added ${matchedTiByHrms.name} from HRMS search.`);
    setTiHrmsSearch("");
  };

  const handleRemoveTi = (id) => {
    const ti = trafficInspectors.find((t) => t.id === id);
    const name = ti ? ti.name : "this Traffic Inspector";
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }
    setTrafficInspectors((prev) => prev.filter((ti) => ti.id !== id));
    if (selectedTiId === id) {
      setSelectedTiId(null);
    }
    if (tiLinkTargetId === id) {
      setTiLinkTargetId(null);
      setTiLinkDraft({ stations: [], sms: [] });
    }
  };

  const handleOpenTiProfile = (id) => {
    setSelectedTiId(id);
    setActivePage("Traffic Inspector Profile");
  };

  const handleOpenLinkTi = (id) => {
    const selected = trafficInspectors.find((row) => row.id === id);
    if (!selected) {
      return;
    }

    setTiLinkTargetId(id);
    setTiLinkDraft({
      stations: selected.linkedStations || [],
      sms: selected.linkedSms || []
    });
  };

  const toggleMultiValue = (type, value) => {
    setTiLinkDraft((prev) => {
      const currentValues = prev[type];
      const exists = currentValues.includes(value);
      return {
        ...prev,
        [type]: exists ? currentValues.filter((entry) => entry !== value) : [...currentValues, value]
      };
    });
  };

  const handleSaveTiLinks = () => {
    setTrafficInspectors((prev) =>
      prev.map((row) =>
        row.id === tiLinkTargetId
          ? {
            ...row,
            linkedStations: tiLinkDraft.stations,
            linkedSms: tiLinkDraft.sms
          }
          : row
      )
    );

    setTiNotice("TI links updated for Stations and SMs.");
    setTiLinkTargetId(null);
    setTiLinkDraft({ stations: [], sms: [] });
  };

  const handleShiftTi = (id) => {
    const targetDivision = tiShiftDrafts[id];
    if (!targetDivision) {
      return;
    }

    setTrafficInspectors((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
            ...row,
            jurisdiction: targetDivision,
            division: targetDivision
          }
          : row
      )
    );

    setTiNotice("TI jurisdiction updated successfully.");
  };

  const filteredTrafficInspectors = trafficInspectors.filter((row) => {
    const q = tiSearch.trim().toLowerCase();
    if (!q) {
      return true;
    }

    return row.name.toLowerCase().includes(q) || row.employeeId.toLowerCase().includes(q);
  });

  const selectedTiProfile = trafficInspectors.find((row) => row.id === selectedTiId) || null;
  const linkTargetTi = trafficInspectors.find((row) => row.id === tiLinkTargetId) || null;
  const stationLinkOptions = Array.from(new Set(stations.map((station) => station.stationName)));
  const smLinkOptions = Array.from(
    new Set(stations.map((station) => station.stationMasterName).filter((name) => Boolean(name && name.trim())))
  );

  const renderStationFormFields = (isReadOnly = false) => {
    return (
      <>
        <div className="add-user-grid station-grid">
          <div className="add-user-col">
            <div className="form-group">
              <label>Station Name *</label>
              <input
                type="text"
                name="stationName"
                value={stationFormData.stationName}
                onChange={handleStationFormChange}
                placeholder="Enter station name"
                className={stationFormErrors.stationName ? "error" : ""}
                readOnly={isReadOnly}
              />
              {stationFormErrors.stationName && <span className="error-text">{stationFormErrors.stationName}</span>}
            </div>

            <div className="form-group">
              <label>Station Code *</label>
              <input
                type="text"
                name="stationCode"
                value={stationFormData.stationCode}
                onChange={handleStationFormChange}
                placeholder="e.g. PUNE, NDLS"
                className={stationFormErrors.stationCode ? "error" : ""}
                readOnly={isReadOnly}
              />
              {stationFormErrors.stationCode && <span className="error-text">{stationFormErrors.stationCode}</span>}
            </div>

            <div className="form-group">
              <label>Zone *</label>
              <select
                name="zone"
                value={stationFormData.zone}
                onChange={handleStationFormChange}
                className={stationFormErrors.zone ? "error" : ""}
                disabled={isReadOnly}
              >
                <option value="">Select Zone</option>
                {stationZoneOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {stationFormErrors.zone && <span className="error-text">{stationFormErrors.zone}</span>}
            </div>

            <div className="form-group">
              <label>Division *</label>
              <select
                name="division"
                value={stationFormData.division}
                onChange={handleStationFormChange}
                className={stationFormErrors.division ? "error" : ""}
                disabled={isReadOnly}
              >
                <option value="">Select Division</option>
                {stationDivisionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {stationFormErrors.division && <span className="error-text">{stationFormErrors.division}</span>}
            </div>

            <div className="form-group">
              <label>Station Category *</label>
              <select
                name="category"
                value={stationFormData.category}
                onChange={handleStationFormChange}
                className={stationFormErrors.category ? "error" : ""}
                disabled={isReadOnly}
              >
                <option value="">Select Category</option>
                {stationCategoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {stationFormErrors.category && <span className="error-text">{stationFormErrors.category}</span>}
            </div>

            <div className="form-group">
              <label>Station Type *</label>
              <select
                name="stationType"
                value={stationFormData.stationType}
                onChange={handleStationFormChange}
                className={stationFormErrors.stationType ? "error" : ""}
                disabled={isReadOnly}
              >
                <option value="">Select Station Type</option>
                {stationTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {stationFormErrors.stationType && <span className="error-text">{stationFormErrors.stationType}</span>}
            </div>
          </div>

          <div className="add-user-col">
            <div className="form-group">
              <label>Number of Platforms *</label>
              <input
                type="number"
                min="0"
                name="platforms"
                value={stationFormData.platforms}
                onChange={handleStationFormChange}
                placeholder="Enter number of platforms"
                className={stationFormErrors.platforms ? "error" : ""}
                readOnly={isReadOnly}
              />
              {stationFormErrors.platforms && <span className="error-text">{stationFormErrors.platforms}</span>}
            </div>

            <div className="form-group">
              <label>Number of Tracks *</label>
              <input
                type="number"
                min="0"
                name="tracks"
                value={stationFormData.tracks}
                onChange={handleStationFormChange}
                placeholder="Enter number of tracks"
                className={stationFormErrors.tracks ? "error" : ""}
                readOnly={isReadOnly}
              />
              {stationFormErrors.tracks && <span className="error-text">{stationFormErrors.tracks}</span>}
            </div>

            <div className="form-group">
              <label>Address *</label>
              <textarea
                name="address"
                value={stationFormData.address}
                onChange={handleStationFormChange}
                placeholder="Enter address"
                className={stationFormErrors.address ? "error" : ""}
                readOnly={isReadOnly}
              />
              {stationFormErrors.address && <span className="error-text">{stationFormErrors.address}</span>}
            </div>

            <div className="form-group">
              <label>City *</label>
              <input
                type="text"
                name="city"
                value={stationFormData.city}
                onChange={handleStationFormChange}
                placeholder="Enter city"
                className={stationFormErrors.city ? "error" : ""}
                readOnly={isReadOnly}
              />
              {stationFormErrors.city && <span className="error-text">{stationFormErrors.city}</span>}
            </div>

            <div className="form-group">
              <label>State *</label>
              <input
                type="text"
                name="state"
                value={stationFormData.state}
                onChange={handleStationFormChange}
                placeholder="Enter state"
                className={stationFormErrors.state ? "error" : ""}
                readOnly={isReadOnly}
              />
              {stationFormErrors.state && <span className="error-text">{stationFormErrors.state}</span>}
            </div>

            <div className="form-group">
              <label>Pincode *</label>
              <input
                type="number"
                min="0"
                name="pincode"
                value={stationFormData.pincode}
                onChange={handleStationFormChange}
                placeholder="Enter pincode"
                className={stationFormErrors.pincode ? "error" : ""}
                readOnly={isReadOnly}
              />
              {stationFormErrors.pincode && <span className="error-text">{stationFormErrors.pincode}</span>}
            </div>
          </div>
        </div>

        <div className="station-additional-grid">
          <div className="form-group">
            <label>Station Master Name (Optional)</label>
            <input
              type="text"
              name="stationMasterName"
              value={stationFormData.stationMasterName}
              onChange={handleStationFormChange}
              placeholder="Enter station master name"
              readOnly={isReadOnly}
            />
          </div>

          <div className="form-group">
            <label>Contact Number *</label>
            <input
              type="text"
              name="contactNumber"
              value={stationFormData.contactNumber}
              onChange={handleStationFormChange}
              placeholder="Enter contact number"
              className={stationFormErrors.contactNumber ? "error" : ""}
              readOnly={isReadOnly}
            />
            {stationFormErrors.contactNumber && <span className="error-text">{stationFormErrors.contactNumber}</span>}
          </div>

          <div className="form-group">
            <label>Email ID *</label>
            <input
              type="email"
              name="emailId"
              value={stationFormData.emailId}
              onChange={handleStationFormChange}
              placeholder="Enter email ID"
              className={stationFormErrors.emailId ? "error" : ""}
              readOnly={isReadOnly}
            />
            {stationFormErrors.emailId && <span className="error-text">{stationFormErrors.emailId}</span>}
          </div>

          <div className="form-group">
            <label>Latitude *</label>
            <input
              type="text"
              name="latitude"
              value={stationFormData.latitude}
              onChange={handleStationFormChange}
              placeholder="Enter latitude"
              className={stationFormErrors.latitude ? "error" : ""}
              readOnly={isReadOnly}
            />
            {stationFormErrors.latitude && <span className="error-text">{stationFormErrors.latitude}</span>}
          </div>

          <div className="form-group">
            <label>Longitude *</label>
            <input
              type="text"
              name="longitude"
              value={stationFormData.longitude}
              onChange={handleStationFormChange}
              placeholder="Enter longitude"
              className={stationFormErrors.longitude ? "error" : ""}
              readOnly={isReadOnly}
            />
            {stationFormErrors.longitude && <span className="error-text">{stationFormErrors.longitude}</span>}
          </div>

          <div className="form-group status-toggle-group">
            <label>Status</label>
            <button
              type="button"
              className={`status-toggle-btn ${stationFormData.status === "Active" ? "active" : "inactive"}`}
              onClick={handleStationStatusToggle}
              disabled={isReadOnly}
            >
              {stationFormData.status}
            </button>
          </div>
        </div>
      </>
    );
  };

  const renderPointsmanMonitoringDetail = (pm) => {
    const cat = getPmCat(pm.lastScore);
    const risk = getPmRisk(pm);

    // Mock assessment history for pointsman
    const pmAssessmentHistoryMock = {
      PM_1001: [
        { date: "2026-03-28", testMarks: 80, addMarks: 12, total: 92, grade: "A", approvalStatus: "Approved", remarks: "Excellent yard duties and signaling knowledge." },
        { date: "2025-12-15", testMarks: 74, addMarks: 10, total: 84, grade: "A", approvalStatus: "Approved", remarks: "Solid performance under winter operations." }
      ],
      PM_1102: [
        { date: "2026-03-10", testMarks: 65, addMarks: 13, total: 78, grade: "B", approvalStatus: "Pending", remarks: "Demonstrates consistent safety alertness." }
      ],
      PM_1103: [
        { date: "2026-02-15", testMarks: 38, addMarks: 10, total: 48, grade: "C", approvalStatus: "Approved", remarks: "Requires strict adherence to signal placement guidelines." }
      ],
      PM_1104: [
        { date: "2026-03-18", testMarks: 72, addMarks: 12, total: 84, grade: "A", approvalStatus: "Pending", remarks: "Very proactive and vigilant on main line siding duties." }
      ],
      PM_1105: [
        { date: "2026-01-20", testMarks: 25, addMarks: 10, total: 35, grade: "D", approvalStatus: "Rejected", remarks: "Unsatisfactory compliance on hand signaling drills." }
      ],
      PM_1106: [
        { date: "2026-03-05", testMarks: 55, addMarks: 12, total: 67, grade: "B", approvalStatus: "Approved", remarks: "Alert and prompt response to train siding movements." }
      ],
      PM_1107: [
        { date: "2026-03-20", testMarks: 70, addMarks: 12, total: 82, grade: "A", approvalStatus: "Approved", remarks: "Outstanding safety observance during high traffic shift." }
      ],
      PM_1108: [
        { date: "2026-02-01", testMarks: 12, addMarks: 7, total: 19, grade: "D", approvalStatus: "Rejected", remarks: "Severe safety oversight near point 4B. Re-training mandatory." }
      ]
    };

    const hist = pmAssessmentHistoryMock[pm.hrmsId] || [];

    return (
      <div className="pointsman-monitoring-detail-wrapper" style={{ animation: "fadeIn 0.3s ease-out" }}>
        {/* TITLE AND BACK BUTTON HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Pointsman Details</h2>
          <button
            type="button"
            className="sm2-monitor-btn"
            onClick={() => setSelectedPointsmanForMonitoring(null)}
            style={{
              backgroundColor: "#ffffff",
              color: "#1d4ed8",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              padding: "6px 16px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            — Back
          </button>
        </div>

        {/* HERO CARD */}
        <div className="sm2-pm-hero" style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          color: "#0f172a",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.02)",
          marginBottom: "24px",
          flexWrap: "wrap"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div className="sm2-pm-avatar" style={{
              width: "54px",
              height: "54px",
              background: "#2563eb",
              color: "#ffffff",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              fontWeight: "800"
            }}>
              {pm.name.charAt(0)}
            </div>
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>{pm.name}</h3>
              <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#64748b", fontWeight: "500" }}>
                {pm.hrmsId} Â· Pointsman Â· {pm.stationName}
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <span style={{
                  background: "#dcfce7",
                  color: "#15803d",
                  padding: "3px 10px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: "700"
                }}>
                  Category {cat}
                </span>
                <span style={{
                  background: "#dcfce7",
                  color: "#15803d",
                  padding: "3px 10px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: "700"
                }}>
                  {risk} Risk
                </span>
                <span style={{
                  background: "#fef3c7",
                  color: "#d97706",
                  padding: "3px 10px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: "700"
                }}>
                  {pm.approvalStatus}
                </span>
              </div>
            </div>
          </div>

          {/* QUICK STATS */}
          <div className="sm2-pm-quick-stats" style={{
            display: "flex",
            gap: "36px",
            marginRight: "20px"
          }}>
            <div style={{ textAlign: "center" }}>
              <span style={{ display: "block", fontSize: "9px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Latest Score</span>
              <strong style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>{pm.lastScore}/100</strong>
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ display: "block", fontSize: "9px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Safety Score</span>
              <strong style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>{pm.safetyScore}%</strong>
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ display: "block", fontSize: "9px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Assessments</span>
              <strong style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>{pm.totalAssessments}</strong>
            </div>
          </div>
        </div>

        {/* DETAILS GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px" }}>
            <span style={{ fontSize: "9px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Gender</span>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a", marginTop: "4px", display: "block" }}>{pm.gender}</span>
          </div>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px" }}>
            <span style={{ fontSize: "9px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Age</span>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a", marginTop: "4px", display: "block" }}>{pm.age} yrs</span>
          </div>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px" }}>
            <span style={{ fontSize: "9px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Date of Joining</span>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a", marginTop: "4px", display: "block" }}>{pm.doj}</span>
          </div>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px" }}>
            <span style={{ fontSize: "9px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Base Pay</span>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a", marginTop: "4px", display: "block" }}>â‚¹28,500</span>
          </div>
        </div>

        {/* MONITORING STATUS SECTION */}
        <div style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          padding: "20px",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.02)",
          marginBottom: "24px"
        }}>
          <h4 style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            margin: "0 0 16px 0",
            fontSize: "14px",
            fontWeight: "750",
            color: "#0f172a",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            <Activity size={16} color="#0f172a" style={{ marginRight: "4px" }} /> Monitoring Status
          </h4>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            {[
              {
                status: "Active",
                color: "#16a34a",
                bg: "#dcfce7",
                icon: (
                  <span style={{ color: "#16a34a", marginRight: "4px", fontSize: "14px" }}>ðŸŸ¢</span>
                ),
                desc: "Available for yard operations"
              },
              {
                status: "On Duty",
                color: "#d97706",
                bg: "#fef3c7",
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}>
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                ),
                desc: "Currently executing track tasks"
              },
              {
                status: "Off Duty",
                color: "#64748b",
                bg: "#f1f5f9",
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                ),
                desc: "Resting / Shift ended"
              },
              {
                status: "Absent",
                color: "#dc2626",
                bg: "#fee2e2",
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                ),
                desc: "Unexcused leave of absence"
              }
            ].map(item => {
              const isActive = (pm.monitoringStatus || "Active") === item.status;
              return (
                <div
                  key={item.status}
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    border: isActive ? `1.5px solid ${item.color}` : "1.5px solid #e2e8f0",
                    background: isActive ? item.bg : "#ffffff",
                    boxShadow: isActive ? `0 4px 14px ${item.color}15` : "none",
                    opacity: isActive ? 1 : 0.6,
                    transform: isActive ? "scale(1.02)" : "none",
                    transition: "all 0.2s ease",
                    cursor: "default"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ display: "flex", alignItems: "center" }}>{item.icon}</span>
                      <span style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color: isActive ? item.color : "#334155"
                      }}>
                        {item.status}
                      </span>
                    </div>
                    {isActive && (
                      <span style={{
                        fontSize: "9px",
                        fontWeight: "800",
                        background: item.color,
                        color: "#ffffff",
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        textTransform: "uppercase",
                        letterSpacing: "0.2px"
                      }}>
                        Current
                      </span>
                    )}
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: "11px",
                    color: isActive ? "#334155" : "#64748b",
                    fontWeight: isActive ? "500" : "400",
                    lineHeight: "1.4"
                  }}>
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* SAFETY COMPLIANCE SECTION */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "20px", marginBottom: "24px" }}>
          <h4 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Safety Compliance</h4>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "20px" }}>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px" }}>
              <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>PME Status</span>
              <strong style={{ fontSize: "15px", fontWeight: "700", color: pm.pmeStatus === "Fit" ? "#16a34a" : "#dc2626", marginTop: "4px", display: "block" }}>{pm.pmeStatus}</strong>
            </div>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px" }}>
              <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>REF Status</span>
              <strong style={{ fontSize: "15px", fontWeight: "700", color: pm.refStatus === "Cleared" ? "#16a34a" : "#d97706", marginTop: "4px", display: "block" }}>{pm.refStatus}</strong>
            </div>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px" }}>
              <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Disciplinary</span>
              <strong style={{ fontSize: "15px", fontWeight: "700", color: pm.disciplinary === "None" ? "#16a34a" : "#dc2626", marginTop: "4px", display: "block" }}>{pm.disciplinary}</strong>
            </div>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px" }}>
              <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Incidents</span>
              <strong style={{ fontSize: "15px", fontWeight: "700", color: pm.incidents === 0 ? "#16a34a" : "#dc2626", marginTop: "4px", display: "block" }}>{pm.incidents === 0 ? "0 reported" : `${pm.incidents} reported`}</strong>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "8px" }}>Overall Safety Compliance</span>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: 1, height: "8px", background: "#e2e8f0", borderRadius: "9999px", overflow: "hidden" }}>
                <div style={{ width: `${pm.safetyScore}%`, height: "100%", background: "#16a34a", borderRadius: "9999px" }}></div>
              </div>
              <span style={{ fontSize: "13px", fontWeight: "800", color: "#16a34a", marginLeft: "12px" }}>{pm.safetyScore}%</span>
            </div>
          </div>
        </div>

        {/* HISTORICAL ASSESSMENTS TABLE */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "20px" }}>
          <h4 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Assessment History</h4>
          <div className="users-table-wrapper" style={{ overflowX: "auto" }}>
            <table className="reports-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", background: "#f8fafc" }}>Date</th>
                  <th style={{ padding: "12px 16px", fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", background: "#f8fafc" }}>Test Marks</th>
                  <th style={{ padding: "12px 16px", fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", background: "#f8fafc" }}>Add. Marks</th>
                  <th style={{ padding: "12px 16px", fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", background: "#f8fafc" }}>Total</th>
                  <th style={{ padding: "12px 16px", fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", background: "#f8fafc" }}>Grade</th>
                  <th style={{ padding: "12px 16px", fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", background: "#f8fafc" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {hist.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
                      No assessment records found.
                    </td>
                  </tr>
                ) : (
                  hist.map((h, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontSize: "13px", color: "#334155" }}>{h.date}</td>
                      <td style={{ padding: "12px 16px", fontSize: "13px", color: "#334155" }}>{h.testMarks}</td>
                      <td style={{ padding: "12px 16px", fontSize: "13px", color: "#334155" }}>{h.addMarks}</td>
                      <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>{h.total}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          background: h.grade === "A" ? "#dcfce7" : h.grade === "B" ? "#dbeafe" : h.grade === "C" ? "#fef3c7" : "#fee2e2",
                          color: h.grade === "A" ? "#15803d" : h.grade === "B" ? "#1d4ed8" : h.grade === "C" ? "#b45309" : "#b91c1c",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontWeight: "700",
                          fontSize: "11px"
                        }}>Cat. {h.grade}</span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          background: h.approvalStatus === "Approved" ? "#dcfce7" : h.approvalStatus === "Pending" ? "#fef3c7" : "#fee2e2",
                          color: h.approvalStatus === "Approved" ? "#15803d" : h.approvalStatus === "Pending" ? "#d97706" : "#b91c1c",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontWeight: "700",
                          fontSize: "11px"
                        }}>{h.approvalStatus}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAddStationModal = () => {
    if (!showAddStation) return null;
    return (
      <div className="sdom-modal-overlay" style={{ zIndex: 99999, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }}>
        <div className="sdom-modal" style={{ width: "800px", maxWidth: "95%", borderRadius: "16px", padding: "28px", display: "flex", flexDirection: "column", maxHeight: "90vh", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, color: "#0B1F3A", display: "flex", alignItems: "center", gap: "8px" }}>
                <Building2 size={24} style={{ color: "#2563eb" }} /> Add New Railway Station
              </h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "#64748b" }}>Create a comprehensive official record with infrastructure & technical parameters.</p>
            </div>
            <button type="button" onClick={() => setShowAddStation(false)} style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "#94a3b8", lineHeight: 1, padding: 0 }}>&times;</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* SECTION 1: IDENTITY */}
            <div>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "0.9rem", fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em", borderLeft: "3px solid #2563eb", paddingLeft: "8px" }}>1. Station Identity & Jurisdiction</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Station Name *</label>
                  <input type="text" value={newStName} onChange={e => setNewStName(e.target.value)} placeholder="e.g. Wardha Junction" />
                </div>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Station Code *</label>
                  <input type="text" value={newStCode} onChange={e => setNewStCode(e.target.value)} placeholder="e.g. WR" />
                </div>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Assigned TI Area *</label>
                  <select value={newStTi} onChange={e => setNewStTi(e.target.value)}>
                    <option value="TI NGP">TI NGP (Nagpur)</option>
                    <option value="TI PAR">TI PAR (Parasia)</option>
                    <option value="TI AMLA">TI AMLA (Amla)</option>
                  </select>
                </div>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Railway Division *</label>
                  <select value={newStDivision} onChange={e => setNewStDivision(e.target.value)}>
                    <option value="Nagpur">Nagpur Division</option>
                    <option value="Pune">Pune Division</option>
                    <option value="Mumbai">Mumbai Division</option>
                    <option value="Solapur">Solapur Division</option>
                    <option value="Bhusawal">Bhusawal Division</option>
                  </select>
                </div>
                <div className="sdom-filter-field" style={{ gridColumn: "span 2" }}>
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Railway Zone *</label>
                  <select value={newStZone} onChange={e => setNewStZone(e.target.value)}>
                    <option value="CR">Central Railway (CR)</option>
                    <option value="WR">Western Railway (WR)</option>
                    <option value="SECR">South East Central Railway (SECR)</option>
                    <option value="SR">Southern Railway (SR)</option>
                    <option value="NR">Northern Railway (NR)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: TECHNICAL & INFRASTRUCTURE */}
            <div>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "0.9rem", fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em", borderLeft: "3px solid #2563eb", paddingLeft: "8px" }}>2. Technical Infrastructure & Systems</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Number of Platforms *</label>
                  <input type="number" min="1" max="24" value={newStPlatforms} onChange={e => setNewStPlatforms(Math.max(1, parseInt(e.target.value) || 1))} />
                </div>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Operational Tracks *</label>
                  <input type="number" min="1" max="48" value={newStTracks} onChange={e => setNewStTracks(Math.max(1, parseInt(e.target.value) || 1))} />
                </div>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Line Configuration *</label>
                  <select value={newStLineConfig} onChange={e => setNewStLineConfig(e.target.value)}>
                    <option value="Single Line">Single Line</option>
                    <option value="Double Line">Double Line</option>
                    <option value="Triple Line">Triple Line</option>
                    <option value="Quadruple Line">Quadruple Line</option>
                  </select>
                </div>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Electrification Status *</label>
                  <select value={newStElectrified} onChange={e => setNewStElectrified(e.target.value)}>
                    <option value="Electrified AC 25kV">Electrified AC 25kV</option>
                    <option value="Under Electrification">Under Electrification</option>
                    <option value="Non-Electrified">Non-Electrified</option>
                  </select>
                </div>
                <div className="sdom-filter-field" style={{ gridColumn: "span 2" }}>
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Signaling System Type *</label>
                  <select value={newStSignaling} onChange={e => setNewStSignaling(e.target.value)}>
                    <option value="Electronic Interlocking (EI)">Electronic Interlocking (EI)</option>
                    <option value="Route Relay Interlocking (RRI)">Route Relay Interlocking (RRI)</option>
                    <option value="Panel Interlocking (PI)">Panel Interlocking (PI)</option>
                    <option value="Mechanical Lever Cabin">Mechanical Lever Cabin</option>
                    <option value="One Train Only System">One Train Only System</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 3: LOGISTICS & LOGISTICAL CLASS */}
            <div>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "0.9rem", fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em", borderLeft: "3px solid #2563eb", paddingLeft: "8px" }}>3. Logistics & Operating Profile</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Station Category *</label>
                  <select value={newStCategory} onChange={e => setNewStCategory(e.target.value)}>
                    <option value="A">Category A (Major Junctions)</option>
                    <option value="B">Category B (Intermediate Stations)</option>
                    <option value="C">Category C (Suburban Stations)</option>
                    <option value="D">Category D (Halts & Flag Stations)</option>
                  </select>
                </div>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Operating Class *</label>
                  <select value={newStClass} onChange={e => setNewStClass(e.target.value)}>
                    <option value="Special Class">Special Class</option>
                    <option value="Class A">Class A Station</option>
                    <option value="Class B">Class B Station</option>
                    <option value="Class C">Class C Station</option>
                  </select>
                </div>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Station Type *</label>
                  <select value={newStType} onChange={e => setNewStType(e.target.value)}>
                    <option value="Junction">Junction Station</option>
                    <option value="Terminal">Terminal Station</option>
                    <option value="Block Station">Block Station</option>
                    <option value="Flag Station">Flag Station</option>
                    <option value="Wayside Station">Wayside Station</option>
                  </select>
                </div>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Average Daily Passenger Footfall *</label>
                  <input type="number" min="0" value={newStDailyFootfall} onChange={e => setNewStDailyFootfall(Math.max(0, parseInt(e.target.value) || 0))} placeholder="e.g. 15000" />
                </div>
              </div>
            </div>

            {/* SECTION 4: LOCATION & CONTACTS */}
            <div>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "0.9rem", fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em", borderLeft: "3px solid #2563eb", paddingLeft: "8px" }}>4. Geographic Location & Official Communications</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Latitude *</label>
                  <input type="text" value={newStLatitude} onChange={e => setNewStLatitude(e.target.value)} placeholder="e.g. 21.1500Â° N" />
                </div>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Longitude *</label>
                  <input type="text" value={newStLongitude} onChange={e => setNewStLongitude(e.target.value)} placeholder="e.g. 79.0900Â° E" />
                </div>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Official Station Contact *</label>
                  <input type="text" value={newStContactNumber} onChange={e => setNewStContactNumber(e.target.value)} placeholder="e.g. +91-712-2560158" />
                </div>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Official Email ID (Optional)</label>
                  <input type="email" value={newStEmailId} onChange={e => setNewStEmailId(e.target.value)} placeholder="e.g. station.master@cr.railnet.gov.in" />
                </div>
              </div>
            </div>

          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "14px", marginTop: "28px", borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
            <button className="sdom-btn-outline" style={{ padding: "10px 20px" }} onClick={() => setShowAddStation(false)}>Cancel</button>
            <button className="sdom-btn-primary" style={{ padding: "10px 24px", display: "flex", alignItems: "center", gap: "6px" }} onClick={handleAddStation}>
              <Plus size={16} /> Create Station
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPmModal = () => {
    if (!pmModal) return null;
    const isShift = pmModal.mode === "shift";
    return (
      <div className="sdom-modal-overlay" style={{ zIndex: 99999 }} onClick={e => e.target === e.currentTarget && setPmModal(null)}>
        <div className="sdom-modal" style={!isShift ? { width: "900px", maxWidth: "95vw" } : undefined}>

          {!isShift ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Header inside modal */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
                <div style={{
                  background: "linear-gradient(135deg, #0d2c4d 0%, #1e40af 100%)",
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(13, 44, 77, 0.2)",
                  color: "#ffffff"
                }}>
                  <UserPlus size={28} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0d2c4d", letterSpacing: "-0.5px" }}>
                    {pmModal.mode === "edit" ? "EDIT OPERATIONAL POINTSMAN" : "ADD NEW OPERATIONAL POINTSMAN"}
                  </h2>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                    Role-Based Operational Staff Provisioning & Management Console
                  </p>
                </div>
              </div>

              {/* Section 1: General & Contact Information */}
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
                  1. General & Contact Information
                </h4>
                <div style={{ height: '1px', background: '#d5dfeb', marginBottom: '16px' }}></div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Full Name *</label>
                    <input
                      value={pmModal.data.name || ""}
                      onChange={e => setPmModal(p => ({ ...p, data: { ...p.data, name: e.target.value } }))}
                      placeholder="Enter full name (e.g. A. K. Sharma)"
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>Mobile Number *</label>
                    <input
                      value={pmModal.data.contact || ""}
                      onChange={e => setPmModal(p => ({ ...p, data: { ...p.data, contact: e.target.value } }))}
                      placeholder="Enter 10-digit mobile number"
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>HRMS ID / Employee ID *</label>
                    <input
                      value={pmModal.data.hrmsId || ""}
                      disabled={pmModal.mode === "edit"}
                      onChange={e => setPmModal(p => ({ ...p, data: { ...p.data, hrmsId: e.target.value } }))}
                      placeholder="Enter unique ID (e.g. PM_8820)"
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>Email ID *</label>
                    <input
                      value={pmModal.data.email || ""}
                      onChange={e => setPmModal(p => ({ ...p, data: { ...p.data, email: e.target.value } }))}
                      placeholder="Enter email address (e.g. user@rail.in)"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Designation & Station Placement Setup */}
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
                  2. Designation & Station Placement Setup
                </h4>
                <div style={{ height: '1px', background: '#d5dfeb', marginBottom: '16px' }}></div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Role / Designation *</label>
                    <select value="pointsmen" disabled>
                      <option value="pointsmen">Pointsman</option>
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Division *</label>
                    <select
                      value={pmModal.data.division || "Nagpur"}
                      onChange={e => {
                        const div = e.target.value;
                        setPmModal(p => ({ ...p, data: { ...p.data, division: div } }));
                      }}
                    >
                      {["Nagpur", "Pune", "Mumbai", "Solapur", "Bhusawal"].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Railway Zone *</label>
                    <select
                      value={pmModal.data.zone || "Central Railway"}
                      onChange={e => {
                        const zone = e.target.value;
                        setPmModal(p => ({ ...p, data: { ...p.data, zone: zone } }));
                      }}
                    >
                      {["Central Railway", "Western Railway", "Northern Railway", "Southern Railway", "Eastern Railway"].map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Station Name *</label>
                    <select
                      value={pmModal.data.stationName || ""}
                      onChange={e => {
                        const stName = e.target.value;
                        const matchedSt = stations.find(s => s.stationName === stName);
                        setPmModal(p => ({
                          ...p,
                          data: {
                            ...p.data,
                            stationName: stName,
                            stationCode: matchedSt ? matchedSt.stationCode : p.data.stationCode
                          }
                        }));
                      }}
                    >
                      <option value="">Select Station</option>
                      {stations.map(s => <option key={s.id || s.stationCode} value={s.stationName}>{s.stationName}</option>)}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Category *</label>
                    <select
                      value={pmModal.data.cat || "A"}
                      onChange={e => setPmModal(p => ({ ...p, data: { ...p.data, cat: e.target.value } }))}
                    >
                      <option>A</option><option>B</option><option>C</option><option>D</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Pointsman Operational Setup */}
              <div style={{ padding: 18, background: "#f0f7ff", border: "1px solid #c2e0ff", borderRadius: 10 }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                  Pointsman Operational Setup
                </h4>
                <div style={{ height: '1px', backgroundColor: '#c2e0ff', marginBottom: '16px' }}></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Reporting Station Master *</label>
                    <input
                      value={pmModal.data.reportingSm || ""}
                      onChange={e => setPmModal(p => ({ ...p, data: { ...p.data, reportingSm: e.target.value } }))}
                      placeholder="Station Master Name"
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>Work Location Setup *</label>
                    <select
                      value={pmModal.data.workLocation || ""}
                      onChange={e => setPmModal(p => ({ ...p, data: { ...p.data, workLocation: e.target.value } }))}
                    >
                      <option value="">Select Location</option>
                      <option value="Yard">Yard Area</option>
                      <option value="Cabin A">Cabin A</option>
                      <option value="Cabin B">Cabin B</option>
                      <option value="Platform Area">Platform Area</option>
                      <option value="Level Crossing Gate">Level Crossing Gate</option>
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Assigned Shift *</label>
                    <select
                      value={pmModal.data.shift || ""}
                      onChange={e => setPmModal(p => ({ ...p, data: { ...p.data, shift: e.target.value } }))}
                    >
                      <option value="">Select Shift</option>
                      <option value="Morning Shift (06:00 - 14:00)">Morning Shift (06:00 - 14:00)</option>
                      <option value="Evening Shift (14:00 - 22:00)">Evening Shift (14:00 - 22:00)</option>
                      <option value="Night Shift (22:00 - 06:00)">Night Shift (22:00 - 06:00)</option>
                      <option value="General Shift (09:00 - 18:00)">General Shift (09:00 - 18:00)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="sdom-modal-title" style={{ marginBottom: 20 }}>Shift Staff Role</div>
              <div className="sdom-modal-field">
                <label>Role (Shift to)</label>
                <select
                  value={pmModal.role || "pointsmen"}
                  onChange={e => setPmModal(p => ({ ...p, role: e.target.value }))}
                >
                  <option value="pointsmen">Pointsman</option>
                  <option value="sm">Station Master</option>
                  <option value="ss">Station Superintendent</option>
                  <option value="tm">Train Manager</option>
                  <option value="ti">Traffic Inspector</option>
                </select>
              </div>
            </>
          )}

          <div className="sdom-modal-actions" style={{ marginTop: 24 }}>
            <button className="sdom-btn-primary" style={{ flex: 1 }} onClick={savePmModal}>
              {pmModal.mode === "edit" ? "ðŸ”’ UPDATE POINTSMAN" : isShift ? "ðŸ”„ SHIFT POINTSMAN ROLE" : "ðŸ‘¤ ADD POINTSMAN"}
            </button>
            <button className="sdom-btn-ghost" style={{ flex: 1 }} onClick={() => setPmModal(null)}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  const renderTiModal = () => {
    if (!tiModal) return null;
    const isShift = tiModal.mode === "shift";
    return (
      <div className="sdom-modal-overlay" style={{ zIndex: 99999 }} onClick={e => e.target === e.currentTarget && setTiModal(null)}>
        <div className="sdom-modal" style={!isShift ? { width: "900px", maxWidth: "95vw" } : undefined}>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Header inside modal */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
              <div style={{
                background: "linear-gradient(135deg, #0d2c4d 0%, #1e40af 100%)",
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(13, 44, 77, 0.2)",
                color: "#ffffff"
              }}>
                <UserPlus size={28} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0d2c4d", letterSpacing: "-0.5px" }}>
                  {tiModal.mode === "edit" ? "EDIT TRAFFIC INSPECTOR" : "ADD NEW TRAFFIC INSPECTOR"}
                </h2>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                  Role-Based Operational Staff Provisioning & Management Console
                </p>
              </div>
            </div>

            {/* Section 1: General & Contact Information */}
            <div>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
                1. General & Contact Information
              </h4>
              <div style={{ height: '1px', background: '#d5dfeb', marginBottom: '16px' }}></div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="sdom-modal-field">
                  <label>Full Name *</label>
                  <input
                    value={tiModal.data.name || ""}
                    onChange={e => setTiModal(p => ({ ...p, data: { ...p.data, name: e.target.value } }))}
                    placeholder="Enter full name (e.g. A. K. Kulkarni)"
                  />
                </div>
                <div className="sdom-modal-field">
                  <label>Mobile Number *</label>
                  <input
                    value={tiModal.data.phone || ""}
                    onChange={e => setTiModal(p => ({ ...p, data: { ...p.data, phone: e.target.value } }))}
                    placeholder="Enter 10-digit mobile number"
                  />
                </div>
                <div className="sdom-modal-field">
                  <label>Employee ID *</label>
                  <input
                    value={tiModal.data.employeeId || ""}
                    disabled={tiModal.mode === "edit"}
                    onChange={e => setTiModal(p => ({ ...p, data: { ...p.data, employeeId: e.target.value } }))}
                    placeholder="Enter unique ID (e.g. TI_1004)"
                  />
                </div>
                <div className="sdom-modal-field">
                  <label>Email ID *</label>
                  <input
                    value={tiModal.data.email || ""}
                    onChange={e => setTiModal(p => ({ ...p, data: { ...p.data, email: e.target.value } }))}
                    placeholder="Enter email address (e.g. user@rail.in)"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Designation & Station Placement Setup */}
            <div>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
                2. Designation & Station Placement Setup
              </h4>
              <div style={{ height: '1px', background: '#d5dfeb', marginBottom: '16px' }}></div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="sdom-modal-field">
                  <label>Role / Designation *</label>
                  <select value="ti" disabled>
                    <option value="ti">Traffic Inspector</option>
                  </select>
                </div>
                <div className="sdom-modal-field">
                  <label>TI Area *</label>
                  <select
                    value={tiModal.data.tiArea || "TI NGP"}
                    onChange={e => {
                      const area = e.target.value;
                      setTiModal(p => ({ ...p, data: { ...p.data, tiArea: area, division: area } }));
                    }}
                  >
                    {["TI NGP", "TI PAR", "TI AMLA"].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="sdom-modal-field">
                  <label>Station Placement *</label>
                  <select
                    value={tiModal.data.stationName || "Nagpur Junction"}
                    onChange={e => setTiModal(p => ({ ...p, data: { ...p.data, stationName: e.target.value } }))}
                  >
                    {["Nagpur Junction", "Pune Junction", "Parbhani Junction", "Amla", "New Delhi"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="sdom-modal-field">
                  <label>Category *</label>
                  <select
                    value={tiModal.data.category || "A"}
                    onChange={e => setTiModal(p => ({ ...p, data: { ...p.data, category: e.target.value } }))}
                  >
                    {["A", "B", "C", "D"].map(c => <option key={c} value={c}>Category {c}</option>)}
                  </select>
                </div>
                <div className="sdom-modal-field">
                  <label>Risk Level *</label>
                  <select
                    value={tiModal.data.riskLevel || "Low"}
                    onChange={e => setTiModal(p => ({ ...p, data: { ...p.data, riskLevel: e.target.value } }))}
                  >
                    {["Low", "Medium", "High"].map(r => <option key={r} value={r}>{r} Risk</option>)}
                  </select>
                </div>
                <div className="sdom-modal-field">
                  <label>Last Assessment Score *</label>
                  <input
                    type="number"
                    value={tiModal.data.lastScore || ""}
                    onChange={e => setTiModal(p => ({ ...p, data: { ...p.data, lastScore: e.target.value } }))}
                    placeholder="Enter last assessment score (e.g. 85)"
                  />
                </div>
                <div className="sdom-modal-field">
                  <label>Assessment Status *</label>
                  <select
                    value={tiModal.data.assessmentStatus || "Pending"}
                    onChange={e => setTiModal(p => ({ ...p, data: { ...p.data, assessmentStatus: e.target.value } }))}
                  >
                    <option value="Completed">Completed (Approved)</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
              <button className="sdom-btn-primary" style={{ flex: 1 }} onClick={saveTiModal}>
                {tiModal.mode === "edit" ? "ðŸ”’ UPDATE TRAFFIC INSPECTOR" : "ðŸ‘¤ ADD TRAFFIC INSPECTOR"}
              </button>
              <button className="sdom-btn-ghost" style={{ flex: 1 }} onClick={() => setTiModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSmModal = () => {
    if (!smModal) return null;
    const isShift = smModal.mode === "shift";
    const ROLE_MAP = { pointsmen: "Pointsman", sm: "Station Master", ss: "Station Superintendent", tm: "Train Manager", ti: "Traffic Inspector" };
    return (
      <div className="sdom-modal-overlay" style={{ zIndex: 99999 }} onClick={e => e.target === e.currentTarget && setSmModal(null)}>
        <div className="sdom-modal" style={!isShift ? { width: "900px", maxWidth: "95vw" } : undefined}>

          {!isShift ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Header inside modal */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
                <div style={{
                  background: "linear-gradient(135deg, #0d2c4d 0%, #1e40af 100%)",
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(13, 44, 77, 0.2)",
                  color: "#ffffff"
                }}>
                  <UserPlus size={28} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0d2c4d", letterSpacing: "-0.5px" }}>
                    {smModal.mode === "edit" ? "EDIT STATION MASTER" : "ADD NEW STATION MASTER"}
                  </h2>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                    Role-Based Operational Staff Provisioning & Management Console
                  </p>
                </div>
              </div>

              {/* Section 1: General & Contact Information */}
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
                  1. General & Contact Information
                </h4>
                <div style={{ height: '1px', background: '#d5dfeb', marginBottom: '16px' }}></div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Full Name *</label>
                    <input
                      value={smModal.data.name || ""}
                      onChange={e => setSmModal(p => ({ ...p, data: { ...p.data, name: e.target.value } }))}
                      placeholder="Enter full name (e.g. A. K. Sharma)"
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>Mobile Number *</label>
                    <input
                      value={smModal.data.contact || smModal.data.contactNumber || ""}
                      onChange={e => setSmModal(p => ({ ...p, data: { ...p.data, contact: e.target.value, contactNumber: e.target.value } }))}
                      placeholder="Enter 10-digit mobile number"
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>HRMS ID / Employee ID *</label>
                    <input
                      value={smModal.data.hrmsId || smModal.data.id || ""}
                      disabled={smModal.mode === "edit"}
                      onChange={e => setSmModal(p => ({ ...p, data: { ...p.data, hrmsId: e.target.value, id: e.target.value } }))}
                      placeholder="Enter unique ID (e.g. SM_8820)"
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>Email ID *</label>
                    <input
                      value={smModal.data.email || smModal.data.emailId || ""}
                      onChange={e => setSmModal(p => ({ ...p, data: { ...p.data, email: e.target.value, emailId: e.target.value } }))}
                      placeholder="Enter email address (e.g. user@rail.in)"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Designation & Station Placement Setup */}
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
                  2. Designation & Station Placement Setup
                </h4>
                <div style={{ height: '1px', background: '#d5dfeb', marginBottom: '16px' }}></div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Role / Designation *</label>
                    <select value="sm" disabled>
                      <option value="sm">Station Master</option>
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Division *</label>
                    <select
                      value={smModal.data.smDivision || "Nagpur"}
                      onChange={e => {
                        const div = e.target.value;
                        setSmModal(p => ({ ...p, data: { ...p.data, smDivision: div, division: div } }));
                      }}
                    >
                      {["Nagpur", "Pune", "Mumbai", "Delhi", "Chennai"].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Railway Zone *</label>
                    <select
                      value={smModal.data.smZone || "Central Railway"}
                      onChange={e => {
                        const zone = e.target.value;
                        setSmModal(p => ({ ...p, data: { ...p.data, smZone: zone, zone } }));
                      }}
                    >
                      {["Central Railway", "Western Railway", "Northern Railway", "Southern Railway", "Eastern Railway"].map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Station Name *</label>
                    <select
                      value={smModal.data.smStation || ""}
                      onChange={e => {
                        const stName = e.target.value;
                        setSmModal(p => ({ ...p, data: { ...p.data, smStation: stName, stationName: stName } }));
                      }}
                    >
                      {stations.map(st => <option key={st.id} value={st.stationName}>{st.stationName}</option>)}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Category *</label>
                    <select
                      value={smModal.data.cat || smModal.data.category || "A"}
                      onChange={e => setSmModal(p => ({ ...p, data: { ...p.data, cat: e.target.value, category: e.target.value } }))}
                    >
                      <option>A</option><option>B</option><option>C</option><option>D</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Station Master Operational Setup */}
              <div style={{ padding: 18, background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10 }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                  Station Master Operational Setup
                </h4>
                <div style={{ height: '1px', backgroundColor: '#a7f3d0', marginBottom: '16px' }}></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Operational Station *</label>
                    <select
                      value={smModal.data.smStation || ""}
                      onChange={e => setSmModal(p => ({ ...p, data: { ...p.data, smStation: e.target.value, stationName: e.target.value } }))}
                    >
                      <option value="">Select Operational Station</option>
                      {stations.map(st => <option key={st.id} value={st.stationName}>{st.stationName}</option>)}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Operational Zone *</label>
                    <select
                      value={smModal.data.smZone || ""}
                      onChange={e => setSmModal(p => ({ ...p, data: { ...p.data, smZone: e.target.value, zone: e.target.value } }))}
                    >
                      <option value="">Select Zone</option>
                      {["Central Railway", "Western Railway", "Northern Railway", "Southern Railway", "Eastern Railway"].map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Operational Division *</label>
                    <select
                      value={smModal.data.smDivision || ""}
                      onChange={e => setSmModal(p => ({ ...p, data: { ...p.data, smDivision: e.target.value, division: e.target.value } }))}
                    >
                      <option value="">Select Division</option>
                      {["Nagpur", "Pune", "Mumbai", "Delhi", "Chennai"].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="sdom-modal-title" style={{ marginBottom: 20 }}>Shift Station Master Role</div>
              <div className="sdom-modal-field">
                <label>Role (Shift to)</label>
                <select
                  value={smModal.role || "sm"}
                  onChange={e => setSmModal(p => ({ ...p, role: e.target.value }))}
                >
                  {Object.entries(ROLE_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="sdom-modal-actions" style={{ marginTop: 24 }}>
            <button className="sdom-btn-primary" style={{ flex: 1 }} onClick={saveSmModal}>
              {smModal.mode === "edit" ? "ðŸ”’ UPDATE STATION MASTER" : isShift ? "ðŸ”„ SHIFT STATION MASTER ROLE" : "ðŸ‘¤ ADD STATION MASTER"}
            </button>
            <button className="sdom-btn-ghost" style={{ flex: 1 }} onClick={() => setSmModal(null)}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  const renderSsModal = () => {
    if (!ssModal) return null;
    const isShift = ssModal.mode === "shift";
    const ROLE_MAP = { pointsmen: "Pointsman", sm: "Station Master", ss: "Station Superintendent", tm: "Train Manager", ti: "Traffic Inspector" };
    return (
      <div className="sdom-modal-overlay" style={{ zIndex: 99999 }} onClick={e => e.target === e.currentTarget && setSsModal(null)}>
        <div className="sdom-modal" style={!isShift ? { width: "900px", maxWidth: "95vw" } : undefined}>

          {!isShift ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Header inside modal */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
                <div style={{
                  background: "linear-gradient(135deg, #0d2c4d 0%, #1e40af 100%)",
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(13, 44, 77, 0.2)",
                  color: "#ffffff"
                }}>
                  <UserPlus size={28} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0d2c4d", letterSpacing: "-0.5px" }}>
                    {ssModal.mode === "edit" ? "EDIT STATION SUPERINTENDENT" : "ADD NEW STATION SUPERINTENDENT"}
                  </h2>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                    Role-Based Operational Staff Provisioning & Management Console
                  </p>
                </div>
              </div>

              {/* Section 1: General & Contact Information */}
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
                  1. General & Contact Information
                </h4>
                <div style={{ height: '1px', background: '#d5dfeb', marginBottom: '16px' }}></div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Full Name *</label>
                    <input
                      value={ssModal.data.name || ""}
                      onChange={e => setSsModal(p => ({ ...p, data: { ...p.data, name: e.target.value } }))}
                      placeholder="Enter full name (e.g. A. K. Sharma)"
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>Mobile Number *</label>
                    <input
                      value={ssModal.data.contact || ssModal.data.contactNumber || ""}
                      onChange={e => setSsModal(p => ({ ...p, data: { ...p.data, contact: e.target.value, contactNumber: e.target.value } }))}
                      placeholder="Enter 10-digit mobile number"
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>HRMS ID / Employee ID *</label>
                    <input
                      value={ssModal.data.employeeId || ssModal.data.id || ""}
                      disabled={ssModal.mode === "edit"}
                      onChange={e => setSsModal(p => ({ ...p, data: { ...p.data, employeeId: e.target.value, id: e.target.value } }))}
                      placeholder="Enter unique ID (e.g. SS_8820)"
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>Email ID *</label>
                    <input
                      value={ssModal.data.email || ssModal.data.emailId || ""}
                      onChange={e => setSsModal(p => ({ ...p, data: { ...p.data, email: e.target.value, emailId: e.target.value } }))}
                      placeholder="Enter email address (e.g. user@rail.in)"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Designation & Station Placement Setup */}
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
                  2. Designation & Station Placement Setup
                </h4>
                <div style={{ height: '1px', background: '#d5dfeb', marginBottom: '16px' }}></div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Role / Designation *</label>
                    <select value="ss" disabled>
                      <option value="ss">Station Superintendent</option>
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Division *</label>
                    <select
                      value={ssModal.data.smDivision || "Nagpur"}
                      onChange={e => {
                        const div = e.target.value;
                        setSsModal(p => ({ ...p, data: { ...p.data, smDivision: div, division: div } }));
                      }}
                    >
                      {["Nagpur", "Pune", "Mumbai", "Delhi", "Chennai"].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Railway Zone *</label>
                    <select
                      value={ssModal.data.smZone || "Central Railway"}
                      onChange={e => {
                        const zone = e.target.value;
                        setSsModal(p => ({ ...p, data: { ...p.data, smZone: zone, zone } }));
                      }}
                    >
                      {["Central Railway", "Western Railway", "Northern Railway", "Southern Railway", "Eastern Railway"].map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Station Name *</label>
                    <select
                      value={ssModal.data.smStation || ""}
                      onChange={e => {
                        const stName = e.target.value;
                        setSsModal(p => ({ ...p, data: { ...p.data, smStation: stName, station: stName } }));
                      }}
                    >
                      {stations.map(st => <option key={st.id} value={st.stationName}>{st.stationName}</option>)}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Category *</label>
                    <select
                      value={ssModal.data.cat || ssModal.data.category || "A"}
                      onChange={e => setSsModal(p => ({ ...p, data: { ...p.data, cat: e.target.value, category: e.target.value } }))}
                    >
                      <option>A</option><option>B</option><option>C</option><option>D</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Station Superintendent Operational Setup */}
              <div style={{ padding: 18, background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10 }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                  Station Superintendent Operational Setup
                </h4>
                <div style={{ height: '1px', backgroundColor: '#a7f3d0', marginBottom: '16px' }}></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Operational Station *</label>
                    <select
                      value={ssModal.data.smStation || ""}
                      onChange={e => setSsModal(p => ({ ...p, data: { ...p.data, smStation: e.target.value, station: e.target.value } }))}
                    >
                      <option value="">Select Operational Station</option>
                      {stations.map(st => <option key={st.id} value={st.stationName}>{st.stationName}</option>)}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Operational Zone *</label>
                    <select
                      value={ssModal.data.smZone || ""}
                      onChange={e => setSsModal(p => ({ ...p, data: { ...p.data, smZone: e.target.value, zone: e.target.value } }))}
                    >
                      <option value="">Select Zone</option>
                      {["Central Railway", "Western Railway", "Northern Railway", "Southern Railway", "Eastern Railway"].map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Operational Division *</label>
                    <select
                      value={ssModal.data.smDivision || ""}
                      onChange={e => setSsModal(p => ({ ...p, data: { ...p.data, smDivision: e.target.value, division: e.target.value } }))}
                    >
                      <option value="">Select Division</option>
                      {["Nagpur", "Pune", "Mumbai", "Delhi", "Chennai"].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="sdom-modal-title" style={{ marginBottom: 20 }}>Shift Station Superintendent Role</div>
              <div className="sdom-modal-field">
                <label>Role (Shift to)</label>
                <select
                  value={ssModal.role || "ss"}
                  onChange={e => setSsModal(p => ({ ...p, role: e.target.value }))}
                >
                  {Object.entries(ROLE_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="sdom-modal-actions" style={{ marginTop: 24 }}>
            <button className="sdom-btn-primary" style={{ flex: 1 }} onClick={saveSsModal}>
              {ssModal.mode === "edit" ? "ðŸ”’ UPDATE STATION SUPERINTENDENT" : isShift ? "ðŸ”„ SHIFT STATION SUPERINTENDENT ROLE" : "ðŸ‘¤ ADD STATION SUPERINTENDENT"}
            </button>
            <button className="sdom-btn-ghost" style={{ flex: 1 }} onClick={() => setSsModal(null)}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  const renderTmModal = () => {
    if (!tmModal) return null;
    const isShift = tmModal.mode === "shift";
    const ROLE_MAP = { pointsmen: "Pointsman", sm: "Station Master", ss: "Station Superintendent", tm: "Train Manager", ti: "Traffic Inspector" };
    return (
      <div className="sdom-modal-overlay" style={{ zIndex: 99999 }} onClick={e => e.target === e.currentTarget && setTmModal(null)}>
        <div className="sdom-modal" style={!isShift ? { width: "900px", maxWidth: "95vw" } : undefined}>

          {!isShift ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Header inside modal */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
                <div style={{
                  background: "linear-gradient(135deg, #0d2c4d 0%, #1e40af 100%)",
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(13, 44, 77, 0.2)",
                  color: "#ffffff"
                }}>
                  <UserPlus size={28} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0d2c4d", letterSpacing: "-0.5px" }}>
                    {tmModal.mode === "edit" ? "EDIT TRAIN MANAGER" : "ADD NEW TRAIN MANAGER"}
                  </h2>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                    Role-Based Operational Staff Provisioning & Management Console
                  </p>
                </div>
              </div>

              {/* Section 1: General & Contact Information */}
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
                  1. General & Contact Information
                </h4>
                <div style={{ height: '1px', background: '#d5dfeb', marginBottom: '16px' }}></div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Full Name *</label>
                    <input
                      value={tmModal.data.name || ""}
                      onChange={e => setTmModal(p => ({ ...p, data: { ...p.data, name: e.target.value } }))}
                      placeholder="Enter full name (e.g. A. K. Sharma)"
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>Mobile Number *</label>
                    <input
                      value={tmModal.data.contact || ""}
                      onChange={e => setTmModal(p => ({ ...p, data: { ...p.data, contact: e.target.value } }))}
                      placeholder="Enter 10-digit mobile number"
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>HRMS ID / Employee ID *</label>
                    <input
                      value={tmModal.data.employeeId || ""}
                      disabled={tmModal.mode === "edit"}
                      onChange={e => setTmModal(p => ({ ...p, data: { ...p.data, employeeId: e.target.value } }))}
                      placeholder="Enter unique ID (e.g. TM_3001)"
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>Email ID *</label>
                    <input
                      value={tmModal.data.email || ""}
                      onChange={e => setTmModal(p => ({ ...p, data: { ...p.data, email: e.target.value } }))}
                      placeholder="Enter email address (e.g. user@rail.in)"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Designation & Station Placement Setup */}
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
                  2. Designation & Station Placement Setup
                </h4>
                <div style={{ height: '1px', background: '#d5dfeb', marginBottom: '16px' }}></div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Role / Designation *</label>
                    <select value="tm" disabled>
                      <option value="tm">Train Manager</option>
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Division *</label>
                    <select
                      value={tmModal.data.division || "Nagpur"}
                      onChange={e => {
                        const div = e.target.value;
                        setTmModal(p => ({ ...p, data: { ...p.data, division: div } }));
                      }}
                    >
                      {["Nagpur", "Pune", "Mumbai", "Delhi", "Chennai"].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Railway Zone *</label>
                    <select
                      value={tmModal.data.zone || "Central Railway"}
                      onChange={e => {
                        const zone = e.target.value;
                        setTmModal(p => ({ ...p, data: { ...p.data, zone: zone } }));
                      }}
                    >
                      {["Central Railway", "Western Railway", "Northern Railway", "Southern Railway", "Eastern Railway"].map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Station Name *</label>
                    <select
                      value={tmModal.data.station || ""}
                      onChange={e => {
                        const stName = e.target.value;
                        setTmModal(p => ({ ...p, data: { ...p.data, station: stName } }));
                      }}
                    >
                      {stations.map(st => <option key={st.id} value={st.stationName}>{st.stationName}</option>)}
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Category *</label>
                    <select
                      value={tmModal.data.cat || "A"}
                      onChange={e => setTmModal(p => ({ ...p, data: { ...p.data, cat: e.target.value } }))}
                    >
                      <option>A</option><option>B</option><option>C</option><option>D</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Train Manager Operational Setup */}
              <div style={{ padding: 18, background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 10 }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b21a8', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                  Train Manager Operational Setup
                </h4>
                <div style={{ height: '1px', backgroundColor: '#e9d5ff', marginBottom: '16px' }}></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sdom-modal-field">
                    <label>Crew Depot *</label>
                    <select
                      value={tmModal.data.workLocation || "Nagpur Depot"}
                      onChange={e => setTmModal(p => ({ ...p, data: { ...p.data, workLocation: e.target.value } }))}
                    >
                      <option value="Nagpur Depot">Nagpur Depot</option>
                      <option value="Pune Depot">Pune Depot</option>
                      <option value="Mumbai Depot">Mumbai Depot</option>
                      <option value="Solapur Depot">Solapur Depot</option>
                      <option value="Bhusawal Depot">Bhusawal Depot</option>
                    </select>
                  </div>
                  <div className="sdom-modal-field">
                    <label>Assigned Section Beats *</label>
                    <input
                      value={tmModal.data.reportingSm || "NGP-BSL Section"}
                      onChange={e => setTmModal(p => ({ ...p, data: { ...p.data, reportingSm: e.target.value } }))}
                      placeholder="E.g. NGP-BSL, NGP-DURG"
                    />
                  </div>
                  <div className="sdom-modal-field">
                    <label>Assigned Shift *</label>
                    <select
                      value={tmModal.data.shift || "Goods Train Beat"}
                      onChange={e => setTmModal(p => ({ ...p, data: { ...p.data, shift: e.target.value } }))}
                    >
                      <option value="Mail/Express Beat">Mail/Express Beat</option>
                      <option value="Passenger Beat">Passenger Beat</option>
                      <option value="Goods Train Beat">Goods Train Beat</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="sdom-modal-title" style={{ marginBottom: 20 }}>Shift Train Manager Role</div>
              <div className="sdom-modal-field">
                <label>Role (Shift to)</label>
                <select
                  value={tmModal.role || "tm"}
                  onChange={e => setTmModal(p => ({ ...p, role: e.target.value }))}
                >
                  {Object.entries(ROLE_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="sdom-modal-actions" style={{ marginTop: 24 }}>
            <button className="sdom-btn-primary" style={{ flex: 1 }} onClick={saveTmModal}>
              {tmModal.mode === "edit" ? "ðŸ”’ UPDATE TRAIN MANAGER" : isShift ? "ðŸ”„ SHIFT TRAIN MANAGER ROLE" : "ðŸ‘¤ ADD TRAIN MANAGER"}
            </button>
            <button className="sdom-btn-ghost" style={{ flex: 1 }} onClick={() => setTmModal(null)}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  const renderChartZoomModal = () => {
    if (!isChartZoomModalOpen) return null;

    // Filter math logic on DASHBOARD_96_STATIONS
    const filtered = DASHBOARD_96_STATIONS.filter(st => {
      const q = zoomPopupSearch.trim().toLowerCase();
      const matchesSearch = !q || st.stationName.toLowerCase().includes(q) || st.stationCode.toLowerCase().includes(q);

      const matchesZone = zoomPopupZone === "All" || st.zone === zoomPopupZone;
      const matchesDivision = zoomPopupDivision === "All" || st.division === zoomPopupDivision;

      const matchesName = zoomPopupStationName === "All" || !zoomPopupStationName.trim() || st.stationName.toLowerCase().includes(zoomPopupStationName.toLowerCase());
      const matchesCode = zoomPopupStationCode === "All" || !zoomPopupStationCode.trim() || st.stationCode.toLowerCase().includes(zoomPopupStationCode.toLowerCase());

      const matchesCategory = zoomPopupCategory === "All" || st.category === zoomPopupCategory;
      const matchesRisk = zoomPopupRisk === "All" || st.riskLevel === zoomPopupRisk;
      const matchesStatus = zoomPopupStatus === "All" || st.assessmentStatus === zoomPopupStatus;

      let matchesDate = true;
      if (zoomPopupStartDate) {
        matchesDate = matchesDate && st.lastUpdatedDate >= zoomPopupStartDate;
      }
      if (zoomPopupEndDate) {
        matchesDate = matchesDate && st.lastUpdatedDate <= zoomPopupEndDate;
      }

      return matchesSearch && matchesZone && matchesDivision && matchesName && matchesCode && matchesCategory && matchesRisk && matchesStatus && matchesDate;
    });

    const itemsPerPage = 10;
    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const currentPage = Math.min(zoomPopupPage, totalPages);

    const paginated = filtered.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );

    const modalChartData = paginated.map(st => ({
      station: st.stationCode,
      name: st.stationName,
      completed: st.completed,
      pending: st.pending,
      avgScore: st.avgScore
    }));

    const catA = paginated.filter(s => s.category === "A").length;
    const catB = paginated.filter(s => s.category === "B").length;
    const catC = paginated.filter(s => s.category === "C").length;
    const catD = paginated.filter(s => s.category === "D").length;
    const totalCount = catA + catB + catC + catD;

    const modalPieData = [
      { name: "Category A", value: catA, color: "#1e40af" },
      { name: "Category B", value: catB, color: "#5b21b6" },
      { name: "Category C", value: catC, color: "#92400e" },
      { name: "Category D", value: catD, color: "#9d174d" }
    ].filter(item => item.value > 0);

    const handleResetPopupFilters = () => {
      setZoomPopupSearch("");
      setZoomPopupZone("All");
      setZoomPopupDivision("All");
      setZoomPopupStationName("All");
      setZoomPopupStationCode("All");
      setZoomPopupCategory("All");
      setZoomPopupRisk("All");
      setZoomPopupStatus("All");
      setZoomPopupStartDate("");
      setZoomPopupEndDate("");
      setZoomPopupPage(1);
    };

    return (
      <div
        className="zoom-modal-overlay"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(8px)",
          zIndex: 9999,
          overflowY: "auto",
          display: "block",
          padding: 0,
          animation: "fadeIn 0.2s ease-out"
        }}
      >
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
        <div
          className="zoom-modal-container"
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 0,
            width: "100%",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "none",
            overflow: "visible",
            border: "none",
            animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          {/* Modal Header */}
          <div
            style={{
              padding: "18px 24px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#f8fafc",
              position: "sticky",
              top: 0,
              zIndex: 100
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
                {selectedChartType === "progress"
                  ? "Station-wise Evaluation Progress"
                  : selectedChartType === "score"
                    ? "Station-wise Average Score"
                    : "Category Distribution"}
              </h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                Page {currentPage} of {totalPages} (Showing 10 stations per page out of {filtered.length} matching stations)
              </p>
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setIsChartZoomModalOpen(false)}
                style={{
                  background: "#fee2e2",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                Close Zoom View
              </button>
            </div>
          </div>

          {/* Modal Body Container */}
          <div style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: "20px", overflow: "visible" }}>

            {/* 1. FILTER CONTROLS GRID */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "16px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h4 style={{ margin: 0, fontSize: "12px", fontWeight: "700", color: "#334155", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Operational Search & Diagnostics Filters
                </h4>
                <button
                  type="button"
                  onClick={handleResetPopupFilters}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2563eb",
                    fontSize: "12px",
                    fontWeight: "750",
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                >
                  Reset Diagnostics Filters
                </button>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: "12px"
                }}
              >
                {/* Search */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Quick Search</label>
                  <input
                    type="text"
                    placeholder="Search name/code..."
                    value={zoomPopupSearch}
                    onChange={(e) => { setZoomPopupSearch(e.target.value); setZoomPopupPage(1); }}
                    style={{ width: "100%", padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  />
                </div>

                {/* Zone */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Zone</label>
                  <select
                    value={zoomPopupZone}
                    onChange={(e) => { setZoomPopupZone(e.target.value); setZoomPopupPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", background: "#ffffff", color: "#334155" }}
                  >
                    <option value="All">All Zones</option>
                    <option value="CR">CR (Central Rly)</option>
                  </select>
                </div>

                {/* Division */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Division</label>
                  <select
                    value={zoomPopupDivision}
                    onChange={(e) => { setZoomPopupDivision(e.target.value); setZoomPopupPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", background: "#ffffff", color: "#334155" }}
                  >
                    <option value="All">All Divisions</option>
                    <option value="Nagpur">Nagpur</option>
                    <option value="Pune">Pune</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Solapur">Solapur</option>
                    <option value="Bhusawal">Bhusawal</option>
                  </select>
                </div>

                {/* Station Name */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Station Name</label>
                  <input
                    type="text"
                    placeholder="Filter by name..."
                    value={zoomPopupStationName === "All" ? "" : zoomPopupStationName}
                    onChange={(e) => { setZoomPopupStationName(e.target.value || "All"); setZoomPopupPage(1); }}
                    style={{ width: "100%", padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  />
                </div>

                {/* Station Code */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Station Code</label>
                  <input
                    type="text"
                    placeholder="Filter by code..."
                    value={zoomPopupStationCode === "All" ? "" : zoomPopupStationCode}
                    onChange={(e) => { setZoomPopupStationCode(e.target.value || "All"); setZoomPopupPage(1); }}
                    style={{ width: "100%", padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  />
                </div>

                {/* Category */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Category</label>
                  <select
                    value={zoomPopupCategory}
                    onChange={(e) => { setZoomPopupCategory(e.target.value); setZoomPopupPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", background: "#ffffff", color: "#334155" }}
                  >
                    <option value="All">All Categories</option>
                    <option value="A">Cat. A</option>
                    <option value="B">Cat. B</option>
                    <option value="C">Cat. C</option>
                    <option value="D">Cat. D</option>
                  </select>
                </div>

                {/* Risk Level */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Risk Level</label>
                  <select
                    value={zoomPopupRisk}
                    onChange={(e) => { setZoomPopupRisk(e.target.value); setZoomPopupPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", background: "#ffffff", color: "#334155" }}
                  >
                    <option value="All">All Risks</option>
                    <option value="Low">Low Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="High">High Risk</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Status</label>
                  <select
                    value={zoomPopupStatus}
                    onChange={(e) => { setZoomPopupStatus(e.target.value); setZoomPopupPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", background: "#ffffff", color: "#334155" }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                {/* Date range start */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Start Date</label>
                  <input
                    type="date"
                    value={zoomPopupStartDate}
                    onChange={(e) => { setZoomPopupStartDate(e.target.value); setZoomPopupPage(1); }}
                    style={{ width: "100%", padding: "5px 8px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", color: "#334155" }}
                  />
                </div>

                {/* Date range end */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>End Date</label>
                  <input
                    type="date"
                    value={zoomPopupEndDate}
                    onChange={(e) => { setZoomPopupEndDate(e.target.value); setZoomPopupPage(1); }}
                    style={{ width: "100%", padding: "5px 8px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", color: "#334155" }}
                  />
                </div>
              </div>
            </div>

            {/* 2. DYNAMIC REAL-TIME CHART BOX */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "750", color: "#0f172a" }}>
                  {selectedChartType === "progress"
                    ? "Evaluation Progress Trends (Completed vs Pending)"
                    : selectedChartType === "score"
                      ? "Average Safety Evaluation Scores (/100)"
                      : "Category Distribution Breakdown"}
                </h4>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                  Showing 10 stations on this page
                </span>
              </div>

              <div style={{ height: "260px", width: "100%" }}>
                {selectedChartType === "category" ? (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", gap: "60px" }}>
                    <div style={{ width: "220px", height: "220px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={modalPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={88}
                            dataKey="value"
                            label={({ name, value }) => `${name.replace("Category ", "")}: ${value}`}
                          >
                            {modalPieData.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} Station(s)`, "Count"]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {modalPieData.map((item) => (
                        <div key={item.name} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "700", color: "#334155" }}>
                          <span style={{ display: "inline-block", width: "12px", height: "12px", borderRadius: "50%", backgroundColor: item.color }} />
                          <span>{item.name}:</span>
                          <span style={{ color: "#0f172a" }}>{item.value} Station(s) ({((item.value / (totalCount || 1)) * 100).toFixed(0)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={modalChartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                      barGap={6}
                    >
                      <XAxis
                        dataKey="station"
                        tick={{ fontSize: 10, fill: "#475569" }}
                        height={40}
                      />
                      <YAxis tick={{ fontSize: 10, fill: "#475569" }} domain={selectedChartType === "score" ? [0, 100] : undefined} />
                      <Tooltip
                        contentStyle={{ background: "#0f172a", color: "#ffffff", borderRadius: "8px", border: "none", fontSize: "12px" }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                      {selectedChartType === "progress" ? (
                        <>
                          <Bar dataKey="completed" fill="#0d2948" name="Completed Evaluations" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="pending" fill="#f5ae3f" name="Pending Evaluations" radius={[4, 4, 0, 0]} />
                        </>
                      ) : (
                        <Bar dataKey="avgScore" fill="#1f7a5c" name="Average Evaluation Score" radius={[4, 4, 0, 0]} />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* 3. DETAILED STATION DATA TABLE */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 16px", fontWeight: "700", color: "#334155" }}>Station Name</th>
                    <th style={{ padding: "12px 16px", fontWeight: "700", color: "#334155" }}>Code</th>
                    <th style={{ padding: "12px 16px", fontWeight: "700", color: "#334155" }}>Division</th>
                    <th style={{ padding: "12px 16px", fontWeight: "700", color: "#334155" }}>Zone</th>
                    <th style={{ padding: "12px 16px", fontWeight: "700", color: "#334155", textAlign: "right" }}>Completed</th>
                    <th style={{ padding: "12px 16px", fontWeight: "700", color: "#334155", textAlign: "right" }}>Pending</th>
                    <th style={{ padding: "12px 16px", fontWeight: "700", color: "#334155", textAlign: "right" }}>Avg. Score</th>
                    <th style={{ padding: "12px 16px", fontWeight: "700", color: "#334155", textAlign: "center" }}>Category</th>
                    <th style={{ padding: "12px 16px", fontWeight: "700", color: "#334155", textAlign: "center" }}>Risk Level</th>
                    <th style={{ padding: "12px 16px", fontWeight: "700", color: "#334155" }}>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                        No stations matching the selected diagnostics criteria.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((st) => {
                      const riskColor = st.riskLevel === "High" ? "#ef4444" : st.riskLevel === "Medium" ? "#ea580c" : "#16a34a";
                      const riskBg = st.riskLevel === "High" ? "#fef2f2" : st.riskLevel === "Medium" ? "#fff7ed" : "#dcfce7";
                      const catBg = st.category === "A" ? "#eff6ff" : st.category === "B" ? "#f5f3ff" : st.category === "C" ? "#fffbeb" : "#fdf2f8";
                      const catColor = st.category === "A" ? "#1e40af" : st.category === "B" ? "#5b21b6" : st.category === "C" ? "#92400e" : "#9d174d";

                      return (
                        <tr key={st.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 16px", fontWeight: "600", color: "#0f172a" }}>{st.stationName}</td>
                          <td style={{ padding: "12px 16px", fontWeight: "700", color: "#475569" }}>{st.stationCode}</td>
                          <td style={{ padding: "12px 16px", color: "#475569" }}>{st.division}</td>
                          <td style={{ padding: "12px 16px", color: "#475569" }}>{st.zone}</td>
                          <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "700", color: "#0d2948" }}>{st.completed}</td>
                          <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "700", color: "#f5ae3f" }}>{st.pending}</td>
                          <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "700", color: "#1f7a5c" }}>{st.avgScore}/100</td>
                          <td style={{ padding: "12px 16px", textAlign: "center" }}>
                            <span style={{ background: catBg, color: catColor, padding: "2px 8px", borderRadius: "4px", fontWeight: "700", fontSize: "11px" }}>
                              Cat {st.category}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "center" }}>
                            <span style={{ background: riskBg, color: riskColor, padding: "3px 8px", borderRadius: "6px", fontWeight: "700", fontSize: "11px" }}>
                              {st.riskLevel}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", color: "#64748b" }}>{st.lastUpdatedDate}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Modal Footer (SLIDER / TABS PAGINATION) */}
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #e2e8f0",
              background: "#f8fafc",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div style={{ fontSize: "13px", color: "#475569", fontWeight: "600" }}>
              Showing {filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} stations
            </div>

            {/* Page tabs */}
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setZoomPopupPage(p => Math.max(p - 1, 1))}
                style={{
                  padding: "6px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  background: "#ffffff",
                  color: "#334155",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: currentPage === 1 ? "default" : "pointer",
                  opacity: currentPage === 1 ? 0.5 : 1
                }}
              >
                Previous
              </button>

              <div style={{ display: "flex", gap: "4px" }}>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  const isActive = currentPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setZoomPopupPage(pageNum)}
                      style={{
                        width: "32px",
                        height: "32px",
                        border: isActive ? "1px solid #2563eb" : "1px solid #cbd5e1",
                        borderRadius: "6px",
                        background: isActive ? "#2563eb" : "#ffffff",
                        color: isActive ? "#ffffff" : "#334155",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setZoomPopupPage(p => Math.min(p + 1, totalPages))}
                style={{
                  padding: "6px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  background: "#ffffff",
                  color: "#334155",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: currentPage === totalPages ? "default" : "pointer",
                  opacity: currentPage === totalPages ? 0.5 : 1
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEmployeeManagement = () => {
    // 1. Dynamic Master Employee List Compilation
    const allEmployees = [
      ...aomPointsmen.map(p => ({
        hrmsId: p.hrmsId,
        name: p.name,
        gender: p.gender,
        age: p.age,
        doj: p.doj,
        basePay: p.basePay,
        designation: "Pointsman",
        stationName: p.stationName,
        stationCode: p.stationCode,
        division: p.stationCode === "NGP" ? "Nagpur" : p.stationCode === "PUNE" ? "Pune" : "Mumbai",
        zone: "CR",
        category: getPmCat(p.lastScore),
        riskLevel: getPmRisk(p),
        assessmentStatus: p.approvalStatus,
        lastScore: p.lastScore,
        safetyScore: p.safetyScore,
        totalAssessments: p.totalAssessments,
        lastAssessedDate: p.hrmsId === "PM_1001" ? "2026-03-28" :
          p.hrmsId === "PM_1102" ? "2026-03-10" :
            p.hrmsId === "PM_1103" ? "2026-02-15" :
              p.hrmsId === "PM_1104" ? "2026-03-18" :
                p.hrmsId === "PM_1105" ? "2026-01-20" :
                  p.hrmsId === "PM_1106" ? "2026-03-05" :
                    p.hrmsId === "PM_1107" ? "2026-03-20" :
                      p.hrmsId === "PM_1108" ? "2026-02-01" : "—",
        monitoringStatus: deactivatedUserIds.has(p.hrmsId) ? "Deactivated" : (p.monitoringStatus || "Active")
      })),
      ...stationMastersDirectory.map((sm, idx) => {
        const smHrmsId = `SM_${1001 + idx}`;
        return {
          hrmsId: smHrmsId,
          name: sm.name,
          gender: "Male",
          age: 42,
          doj: "2010-05-15",
          basePay: "â‚¹56,000",
          designation: "Station Master",
          stationName: sm.stationName,
          stationCode: sm.stationCode,
          division: sm.division,
          zone: sm.zone || "CR",
          category: sm.category || "A",
          riskLevel: idx % 3 === 0 ? "Medium" : "Low",
          assessmentStatus: idx % 2 === 0 ? "Approved" : "Pending",
          lastScore: 85 - (idx * 4),
          safetyScore: 92 - (idx * 2),
          totalAssessments: 10,
          lastAssessedDate: "2026-04-12",
          monitoringStatus: deactivatedUserIds.has(smHrmsId) ? "Deactivated" : (idx % 3 === 0 ? "On Duty" : "Active")
        };
      }),
      ...trafficInspectors.map((ti, idx) => ({
        hrmsId: ti.employeeId,
        name: ti.name,
        gender: "Male",
        age: 48,
        doj: "2006-11-20",
        basePay: "â‚¹68,000",
        designation: "Traffic Inspector",
        stationName: "Division HQ",
        stationCode: "HQ",
        division: ti.division || "Nagpur",
        zone: "CR",
        category: ti.category || "Senior TI",
        riskLevel: "Low",
        assessmentStatus: ti.assessmentStatus === "Completed" ? "Approved" : "Pending",
        lastScore: 88,
        safetyScore: 95,
        totalAssessments: 8,
        lastAssessedDate: "2026-03-15",
        monitoringStatus: deactivatedUserIds.has(ti.employeeId) ? "Deactivated" : "Active"
      }))
    ];

    // Unique filter options computed dynamically
    const uniqueDesignations = ["All", "Pointsman", "Station Master", "Traffic Inspector"];
    const uniqueStations = ["All", ...Array.from(new Set(allEmployees.map(e => e.stationName)))];
    const uniqueDivisions = ["All", "Nagpur", "Pune", "Mumbai"];
    const uniqueZones = ["All", "CR"];
    const uniqueCategories = ["All", "A", "B", "C", "D", "Senior TI", "TI", "Assistant TI"];
    const uniqueRisks = ["All", "Low", "Medium", "High"];
    const uniqueStatuses = ["All", "Approved", "Pending", "Rejected"];
    const uniqueMonitorings = ["All", "Active", "On Duty", "Off Duty", "Absent", "Deactivated"];

    // Filter math logic
    const filteredEmployees = allEmployees.filter(emp => {
      const q = empSearchText.trim().toLowerCase();
      const matchesSearch = !q || emp.name.toLowerCase().includes(q) || emp.hrmsId.toLowerCase().includes(q);

      const matchesDesignation = empDesignationFilter === "All" || emp.designation === empDesignationFilter;
      const matchesStation = empStationFilter === "All" || emp.stationName === empStationFilter;
      const matchesDivision = empDivisionFilter === "All" || emp.division === empDivisionFilter;
      const matchesZone = empZoneFilter === "All" || emp.zone === empZoneFilter;
      const matchesCategory = empCategoryFilter === "All" || emp.category === empCategoryFilter;
      const matchesRisk = empRiskFilter === "All" || emp.riskLevel === empRiskFilter;
      const matchesStatus = empStatusFilter === "All" || emp.assessmentStatus === empStatusFilter;
      const matchesMonitoring = empMonitoringFilter === "All" || emp.monitoringStatus === empMonitoringFilter;

      return matchesSearch && matchesDesignation && matchesStation && matchesDivision && matchesZone && matchesCategory && matchesRisk && matchesStatus && matchesMonitoring;
    });

    // Summary calculations
    const totalCount = filteredEmployees.length;
    const activeCount = filteredEmployees.filter(e => e.monitoringStatus === "Active" || e.monitoringStatus === "On Duty").length;
    const approvedCount = filteredEmployees.filter(e => e.assessmentStatus === "Approved").length;
    const pendingCount = filteredEmployees.filter(e => e.assessmentStatus === "Pending").length;
    const highRiskCount = filteredEmployees.filter(e => e.riskLevel === "High").length;

    // Sorting
    const sortedEmployees = [...filteredEmployees].sort((a, b) => {
      if (a[empSortConfig.key] < b[empSortConfig.key]) {
        return empSortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[empSortConfig.key] > b[empSortConfig.key]) {
        return empSortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    const requestSort = (key) => {
      let direction = 'ascending';
      if (empSortConfig.key === key && empSortConfig.direction === 'ascending') {
        direction = 'descending';
      }
      setEmpSortConfig({ key, direction });
    };

    // Pagination
    const itemsPerPage = 8;
    const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);
    const paginatedEmployees = sortedEmployees.slice(
      (empCurrentPage - 1) * itemsPerPage,
      empCurrentPage * itemsPerPage
    );

    const handleActionClick = (emp) => {
      if (emp.designation === "Pointsman") {
        const pmObj = aomPointsmen.find(p => p.hrmsId === emp.hrmsId);
        setSelectedPointsmanForMonitoring(pmObj);
      } else {
        const mockPmObj = {
          id: emp.hrmsId,
          hrmsId: emp.hrmsId,
          name: emp.name,
          gender: emp.gender || "Male",
          age: emp.age || 40,
          doj: emp.doj || "2015-01-01",
          basePay: emp.basePay || "â‚¹45,000",
          lastScore: emp.lastScore,
          safetyScore: emp.safetyScore || 90,
          totalAssessments: emp.totalAssessments || 10,
          incidents: 0,
          approvalStatus: emp.assessmentStatus,
          monitoringStatus: emp.monitoringStatus,
          stationCode: emp.stationCode,
          stationName: emp.stationName
        };
        setSelectedPointsmanForMonitoring(mockPmObj);
      }
    };

    const handleToggleDeactivate = (hrmsId) => {
      setDeactivatedUserIds(prev => {
        const next = new Set(prev);
        if (next.has(hrmsId)) {
          next.delete(hrmsId);
        } else {
          next.add(hrmsId);
        }
        return next;
      });
    };

    const handleShiftEmployeeClick = (row) => {
      const target = empShiftDrafts[row.hrmsId];
      if (!target) return;

      if (row.designation === "Pointsman") {
        const targetStationObj = stations.find(s => s.stationCode === target);
        const targetStationName = targetStationObj ? targetStationObj.stationName : target;
        if (window.confirm(`Are you sure you want to shift Pointsman ${row.name} from ${row.stationName} to ${targetStationName}?`)) {
          setAomPointsmen(prev => prev.map(p => {
            if (p.hrmsId === row.hrmsId) {
              return {
                ...p,
                stationCode: target,
                stationName: targetStationName
              };
            }
            return p;
          }));
          setEmpShiftDrafts(prev => {
            const next = { ...prev };
            delete next[row.hrmsId];
            return next;
          });
          alert(`Successfully shifted Pointsman ${row.name} to ${targetStationName}`);
        }
      } else if (row.designation === "Station Master") {
        handleShiftStationMaster(row.name, target);
        setEmpShiftDrafts(prev => {
          const next = { ...prev };
          delete next[row.hrmsId];
          return next;
        });
      } else if (row.designation === "Traffic Inspector") {
        const ti = trafficInspectors.find(t => t.employeeId === row.hrmsId);
        if (ti) {
          setTrafficInspectors((prev) =>
            prev.map((r) =>
              r.employeeId === row.hrmsId
                ? {
                  ...r,
                  jurisdiction: target,
                  division: target
                }
                : r
            )
          );
          setTiNotice("TI jurisdiction updated successfully.");
          setEmpShiftDrafts(prev => {
            const next = { ...prev };
            delete next[row.hrmsId];
            return next;
          });
          alert(`Successfully shifted Traffic Inspector ${row.name} to ${target} Division`);
        }
      }
    };

    const handleResetFilters = () => {
      setEmpSearchText("");
      setEmpDesignationFilter("All");
      setEmpStationFilter("All");
      setEmpDivisionFilter("All");
      setEmpZoneFilter("All");
      setEmpCategoryFilter("All");
      setEmpRiskFilter("All");
      setEmpStatusFilter("All");
      setEmpMonitoringFilter("All");
      setEmpCurrentPage(1);
    };

    return (
      <div className="user-management-page">
        {selectedPointsmanForMonitoring ? (
          renderPointsmanMonitoringDetail(selectedPointsmanForMonitoring)
        ) : (
          <>
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Employee Management</h2>
                <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748b" }}>
                  Unified railway workforce intelligence & real-time monitoring console
                </p>
              </div>
              <button
                type="button"
                className="sm2-monitor-btn"
                onClick={handleResetFilters}
                style={{
                  backgroundColor: "#ffffff",
                  color: "#2563eb",
                  border: "1px solid #bfdbfe",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                Reset Filters
              </button>
            </div>

            {/* KPI Cards */}
            <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", marginBottom: "20px", marginTop: "20px" }}>
              <div className="metric-card" onClick={() => { setEmpDesignationFilter("All"); setEmpRiskFilter("All"); setEmpStatusFilter("All"); setEmpSearchText(""); setEmpCurrentPage(1); }} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }} onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(37,99,235,0.15)"; e.currentTarget.style.borderColor = "#93c5fd"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Users size={20} />
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "10px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Total Employees</span>
                  <h3 style={{ margin: "2px 0 0 0", fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>{totalCount}</h3>
                </div>
              </div>
              <div className="metric-card" onClick={() => { setEmpStatusFilter("Active"); setEmpRiskFilter("All"); setEmpDesignationFilter("All"); setEmpSearchText(""); setEmpCurrentPage(1); }} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }} onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(59,130,246,0.15)"; e.currentTarget.style.borderColor = "#93c5fd"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Activity size={20} />
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "10px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Active / On Duty</span>
                  <h3 style={{ margin: "2px 0 0 0", fontSize: "20px", fontWeight: "800", color: "#3b82f6" }}>{activeCount}</h3>
                </div>
              </div>
              <div className="metric-card" onClick={() => { setEmpStatusFilter("Approved"); setEmpRiskFilter("All"); setEmpDesignationFilter("All"); setEmpSearchText(""); setEmpCurrentPage(1); }} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }} onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(22,163,74,0.15)"; e.currentTarget.style.borderColor = "#86efac"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "10px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Approved Staff</span>
                  <h3 style={{ margin: "2px 0 0 0", fontSize: "20px", fontWeight: "800", color: "#16a34a" }}>{approvedCount}</h3>
                </div>
              </div>
              <div className="metric-card" onClick={() => { setEmpStatusFilter("Pending"); setEmpRiskFilter("All"); setEmpDesignationFilter("All"); setEmpSearchText(""); setEmpCurrentPage(1); }} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }} onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(161,98,7,0.15)"; e.currentTarget.style.borderColor = "#fde047"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#fef08a", color: "#a16207", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Activity size={20} />
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "10px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Pending Approvals</span>
                  <h3 style={{ margin: "2px 0 0 0", fontSize: "20px", fontWeight: "800", color: "#a16207" }}>{pendingCount}</h3>
                </div>
              </div>
              <div className="metric-card" onClick={() => { setEmpRiskFilter("High"); setEmpStatusFilter("All"); setEmpDesignationFilter("All"); setEmpSearchText(""); setEmpCurrentPage(1); }} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }} onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(220,38,38,0.15)"; e.currentTarget.style.borderColor = "#fca5a5"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "10px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>High Risk Staff</span>
                  <h3 style={{ margin: "2px 0 0 0", fontSize: "20px", fontWeight: "800", color: "#dc2626" }}>{highRiskCount}</h3>
                </div>
              </div>
            </div>

            {/* ADVANCED FILTERS CARD */}
            <div className="chart-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: "700", color: "#334155", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                ðŸ” Advanced Intelligence Filters
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
                {/* Search */}
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Search Name / HRMS ID</label>
                  <div style={{ position: "relative" }}>
                    <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "#94a3b8" }} />
                    <input
                      type="text"
                      value={empSearchText}
                      onChange={(e) => { setEmpSearchText(e.target.value); setEmpCurrentPage(1); }}
                      placeholder="Type query..."
                      style={{ width: "100%", padding: "6px 10px 6px 30px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                    />
                  </div>
                </div>

                {/* Designation */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Designation</label>
                  <select
                    value={empDesignationFilter}
                    onChange={(e) => { setEmpDesignationFilter(e.target.value); setEmpCurrentPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  >
                    {uniqueDesignations.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* Station */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Station</label>
                  <select
                    value={empStationFilter}
                    onChange={(e) => { setEmpStationFilter(e.target.value); setEmpCurrentPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  >
                    {uniqueStations.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* Division */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Division</label>
                  <select
                    value={empDivisionFilter}
                    onChange={(e) => { setEmpDivisionFilter(e.target.value); setEmpCurrentPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  >
                    {uniqueDivisions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* Zone */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Zone</label>
                  <select
                    value={empZoneFilter}
                    onChange={(e) => { setEmpZoneFilter(e.target.value); setEmpCurrentPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  >
                    {uniqueZones.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Category</label>
                  <select
                    value={empCategoryFilter}
                    onChange={(e) => { setEmpCategoryFilter(e.target.value); setEmpCurrentPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  >
                    {uniqueCategories.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* Risk Level */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Risk Level</label>
                  <select
                    value={empRiskFilter}
                    onChange={(e) => { setEmpRiskFilter(e.target.value); setEmpCurrentPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  >
                    {uniqueRisks.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* Assessment Status */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Assessment Status</label>
                  <select
                    value={empStatusFilter}
                    onChange={(e) => { setEmpStatusFilter(e.target.value); setEmpCurrentPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  >
                    {uniqueStatuses.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* Monitoring Status */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Monitoring Status</label>
                  <select
                    value={empMonitoringFilter}
                    onChange={(e) => { setEmpMonitoringFilter(e.target.value); setEmpCurrentPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  >
                    {uniqueMonitorings.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* DATA TABLE */}
            <div className="users-list-container" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <div className="users-table-wrapper" style={{ overflowX: "auto", maxHeight: "550px", overflowY: "auto", position: "relative" }}>
                <table className="users-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "1400px" }}>
                  <thead>
                    <tr style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      background: "linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)",
                      borderBottom: "2px solid #cbd5e1",
                      textAlign: "left",
                      color: "#475569",
                      fontWeight: "700",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("name")}>
                        Employee Name {empSortConfig.key === "name" && (empSortConfig.direction === "ascending" ? "â–²" : "â–¼")}
                      </th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("hrmsId")}>
                        HRMS ID {empSortConfig.key === "hrmsId" && (empSortConfig.direction === "ascending" ? "â–²" : "â–¼")}
                      </th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("designation")}>
                        Designation {empSortConfig.key === "designation" && (empSortConfig.direction === "ascending" ? "â–²" : "â–¼")}
                      </th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("stationName")}>
                        Station {empSortConfig.key === "stationName" && (empSortConfig.direction === "ascending" ? "â–²" : "â–¼")}
                      </th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("division")}>
                        Division {empSortConfig.key === "division" && (empSortConfig.direction === "ascending" ? "â–²" : "â–¼")}
                      </th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("zone")}>
                        Zone {empSortConfig.key === "zone" && (empSortConfig.direction === "ascending" ? "â–²" : "â–¼")}
                      </th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("category")}>
                        Category {empSortConfig.key === "category" && (empSortConfig.direction === "ascending" ? "â–²" : "â–¼")}
                      </th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("riskLevel")}>
                        Risk Level {empSortConfig.key === "riskLevel" && (empSortConfig.direction === "ascending" ? "â–²" : "â–¼")}
                      </th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("assessmentStatus")}>
                        Assessment {empSortConfig.key === "assessmentStatus" && (empSortConfig.direction === "ascending" ? "â–²" : "â–¼")}
                      </th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("lastScore")}>
                        Score {empSortConfig.key === "lastScore" && (empSortConfig.direction === "ascending" ? "â–²" : "â–¼")}
                      </th>
                      <th style={{ padding: "14px 10px" }}>Assessed Date</th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("monitoringStatus")}>
                        Monitoring {empSortConfig.key === "monitoringStatus" && (empSortConfig.direction === "ascending" ? "â–²" : "â–¼")}
                      </th>
                      <th style={{ padding: "14px 10px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="13" style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                          No employees matched the query filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedEmployees.map((row, idx) => {
                        const riskColor = row.riskLevel === "High" ? "#ef4444" : row.riskLevel === "Medium" ? "#ea580c" : "#16a34a";
                        const riskBg = row.riskLevel === "High" ? "#fef2f2" : row.riskLevel === "Medium" ? "#fff7ed" : "#dcfce7";

                        const statusColor = row.assessmentStatus === "Approved" ? "#16a34a" : row.assessmentStatus === "Pending" ? "#d97706" : "#ef4444";
                        const statusBg = row.assessmentStatus === "Approved" ? "#dcfce7" : row.assessmentStatus === "Pending" ? "#fef3c7" : "#fee2e2";

                        const isDeactivated = deactivatedUserIds.has(row.hrmsId);
                        const displayMonStatus = isDeactivated ? "Deactivated" : row.monitoringStatus;

                        const monColor = displayMonStatus === "Active" ? "#16a34a" :
                          displayMonStatus === "On Duty" ? "#d97706" :
                            displayMonStatus === "Off Duty" ? "#475569" :
                              displayMonStatus === "Deactivated" ? "#64748b" : "#dc2626";
                        const monBg = displayMonStatus === "Active" ? "#dcfce7" :
                          displayMonStatus === "On Duty" ? "#fef3c7" :
                            displayMonStatus === "Off Duty" ? "#f1f5f9" :
                              displayMonStatus === "Deactivated" ? "#f1f5f9" : "#fee2e2";

                        const draftShift = empShiftDrafts[row.hrmsId] || "";

                        return (
                          <tr key={row.hrmsId} style={{ borderBottom: "1px solid #e2e8f0", fontSize: "13px" }}>
                            <td style={{ padding: "12px 10px", fontWeight: "700", color: "#0f172a" }}>{row.name}</td>
                            <td style={{ padding: "12px 10px", color: "#64748b", fontWeight: "600" }}>{row.hrmsId}</td>
                            <td style={{ padding: "12px 10px" }}>
                              <span style={{
                                background: "#f8fafc",
                                border: "1px solid #cbd5e1",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: "650",
                                color: "#334155"
                              }}>{row.designation}</span>
                            </td>
                            <td style={{ padding: "12px 10px", fontWeight: "600", color: "#334155" }}>{row.stationName}</td>
                            <td style={{ padding: "12px 10px", color: "#475569" }}>{row.division}</td>
                            <td style={{ padding: "12px 10px", color: "#475569" }}>{row.zone}</td>
                            <td style={{ padding: "12px 10px" }}>
                              <span style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontWeight: "700", fontSize: "11px" }}>
                                {row.category}
                              </span>
                            </td>
                            <td style={{ padding: "12px 10px" }}>
                              <span style={{ background: riskBg, color: riskColor, padding: "3px 8px", borderRadius: "6px", fontWeight: "700", fontSize: "11px" }}>
                                {row.riskLevel}
                              </span>
                            </td>
                            <td style={{ padding: "12px 10px" }}>
                              <span style={{ background: statusBg, color: statusColor, padding: "3px 8px", borderRadius: "6px", fontWeight: "700", fontSize: "11px" }}>
                                {row.assessmentStatus}
                              </span>
                            </td>
                            <td style={{ padding: "12px 10px", fontWeight: "700", color: "#0f172a" }}>{row.lastScore}/100</td>
                            <td style={{ padding: "12px 10px", color: "#64748b" }}>{row.lastAssessedDate}</td>
                            <td style={{ padding: "12px 10px" }}>
                              <span style={{ background: monBg, color: monColor, padding: "3px 8px", borderRadius: "6px", fontWeight: "700", fontSize: "11px" }}>
                                {displayMonStatus}
                              </span>
                            </td>
                            <td style={{ padding: "12px 10px", textAlign: "right" }}>
                              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => handleActionClick(row)}
                                  style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                                >
                                  Profile
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleDeactivate(row.hrmsId)}
                                  style={{
                                    background: isDeactivated ? "#f0fdf4" : "#fee2e2",
                                    color: isDeactivated ? "#16a34a" : "#dc2626",
                                    border: isDeactivated ? "1px solid #bbf7d0" : "1px solid #fecaca",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    cursor: "pointer"
                                  }}
                                >
                                  {isDeactivated ? "Activate" : "Deactivate"}
                                </button>
                                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                                  <select
                                    value={draftShift}
                                    onChange={(e) => setEmpShiftDrafts(prev => ({ ...prev, [row.hrmsId]: e.target.value }))}
                                    style={{
                                      padding: "3px 6px",
                                      border: "1px solid #cbd5e1",
                                      borderRadius: "4px",
                                      fontSize: "11px",
                                      background: "#ffffff",
                                      maxWidth: "110px",
                                      color: "#334155"
                                    }}
                                  >
                                    <option value="">Shift to...</option>
                                    {row.designation === "Pointsman" || row.designation === "Station Master" ? (
                                      stations
                                        .filter(s => s.stationCode !== row.stationCode)
                                        .map(s => (
                                          <option key={s.stationCode} value={s.stationCode}>
                                            {s.stationCode} ({s.stationName})
                                          </option>
                                        ))
                                    ) : (
                                      ["Nagpur", "Pune", "Mumbai", "Solapur"]
                                        .filter(div => div !== row.division)
                                        .map(div => (
                                          <option key={div} value={div}>
                                            {div} Div
                                          </option>
                                        ))
                                    )}
                                  </select>
                                  <button
                                    type="button"
                                    disabled={!draftShift}
                                    onClick={() => handleShiftEmployeeClick(row)}
                                    style={{
                                      background: draftShift ? "#2563eb" : "#f1f5f9",
                                      color: draftShift ? "#ffffff" : "#94a3b8",
                                      border: draftShift ? "1px solid #2563eb" : "1px solid #cbd5e1",
                                      padding: "4px 8px",
                                      borderRadius: "4px",
                                      fontSize: "11px",
                                      fontWeight: "700",
                                      cursor: draftShift ? "pointer" : "default"
                                    }}
                                  >
                                    Shift
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", padding: "0 8px" }}>
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                    Showing {(empCurrentPage - 1) * itemsPerPage + 1} to {Math.min(empCurrentPage * itemsPerPage, sortedEmployees.length)} of {sortedEmployees.length} employees
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      disabled={empCurrentPage === 1}
                      onClick={() => setEmpCurrentPage(prev => Math.max(prev - 1, 1))}
                      style={{ padding: "4px 10px", border: "1px solid #cbd5e1", borderRadius: "4px", background: "#ffffff", fontSize: "12px", cursor: empCurrentPage === 1 ? "default" : "pointer", opacity: empCurrentPage === 1 ? 0.5 : 1 }}
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setEmpCurrentPage(i + 1)}
                        style={{
                          padding: "4px 10px",
                          border: empCurrentPage === i + 1 ? "1px solid #2563eb" : "1px solid #cbd5e1",
                          borderRadius: "4px",
                          background: empCurrentPage === i + 1 ? "#2563eb" : "#ffffff",
                          color: empCurrentPage === i + 1 ? "#ffffff" : "#0f172a",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={empCurrentPage === totalPages}
                      onClick={() => setEmpCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      style={{ padding: "4px 10px", border: "1px solid #cbd5e1", borderRadius: "4px", background: "#ffffff", fontSize: "12px", cursor: empCurrentPage === totalPages ? "default" : "pointer", opacity: empCurrentPage === totalPages ? 0.5 : 1 }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const handleExportCSV = () => {
    const headers = ["HRMS ID", "Employee Name", "Designation", "Assessment Status", "Score", "Grade", "Last Assessed"];
    const csvRows = filteredReportRows.map(row => [
      `"${row.hrmsId || ""}"`,
      `"${row.name || ""}"`,
      `"${row.designation || ""}"`,
      `"${row.assessmentStatus || ""}"`,
      `"${row.score || ""}"`,
      `"${row.grade || ""}"`,
      `"${row.lastAssessed || ""}"`
    ]);
    const csvContent = [headers.join(","), ...csvRows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `AOM_Employee_Reports_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // â”€â”€ Helper: reset role filters when switching roles
  const resetRoleFilters = () => {
    setRoleFilterName("");
    setRoleFilterStation("All");
    setRoleFilterDivision("All");
    setRoleFilterCat("All");
    setRoleFilterRisk("All");
    setSelectedRoleEmployee(null);
    setTiAssessmentFormOpen(null);
  };

  // â”€â”€ Reusable role directory renderer (SA-style)
  const renderAomRole = (roleKey, title) => {
    // If a profile detail is being viewed
    if (selectedRoleEmployee && selectedRoleEmployee._roleKey === roleKey) {
      const s = selectedRoleEmployee;
      const scoreData = MONTHLY_TREND.map((m, i) => ({ month: m.month, score: Math.max(50, (s.lastScore || 80) - 10 + i * 2) }));
      const roleLabel = { pointsmen: "Pointsman", sm: "Station Master", ss: "Station Superintendent", tm: "Train Manager", ti: "Traffic Inspector" }[roleKey] || title;
      return (
        <div className="sdom-fade">
          <div style={{ marginBottom: 24 }}>
            <button className="sdom-back-btn" onClick={() => setSelectedRoleEmployee(null)}>
              <ArrowLeft size={16} /> Back to List
            </button>
          </div>
          <div className="sdom-station-header" style={{ marginBottom: 24 }}>
            <div className="sdom-station-header-meta">
              <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Staff Profile</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 4 }}>{s.name}</div>
              <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>{roleLabel} &bull; {s.stationName} &bull; {s.zone || "Central Railway"}</div>
              <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                <span className={`sdom-badge ${{ A: "sdom-badge-success", B: "sdom-badge-info", C: "sdom-badge-warning", D: "sdom-badge-danger" }[s.category] || "sdom-badge-neutral"}`}>{s.category}</span>
                <span className={`sdom-badge ${{ Low: "sdom-badge-success", Medium: "sdom-badge-warning", High: "sdom-badge-danger" }[s.riskLevel] || "sdom-badge-neutral"}`}>{s.riskLevel}</span>
                <span className={`sdom-badge ${{ Approved: "sdom-badge-success", Pending: "sdom-badge-warning", Rejected: "sdom-badge-danger" }[s.assessmentStatus] || "sdom-badge-neutral"}`}>{s.assessmentStatus}</span>
              </div>
            </div>
            <div className="sdom-station-header-stats">
              <div className="sdom-station-header-stat"><span className="val">{s.lastScore || "–"}</span><span className="lbl">Latest Score</span></div>
              <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
              <div className="sdom-station-header-stat"><span className="val">{s.contactNumber || "—"}</span><span className="lbl">Contact</span></div>
              <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
              <div className="sdom-station-header-stat"><span className="val">{s.lastAssessedDate || "—"}</span><span className="lbl">Last Assessment</span></div>
            </div>
          </div>
          <div className="sdom-row-2">
            <div className="sdom-chart-card">
              <div className="sdom-chart-title" style={{ marginBottom: 16 }}>Personal &amp; Professional Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 15, paddingBottom: 20 }}>
                {[
                  ["HRMS ID", s.hrmsId],
                  ["Designation", roleLabel],
                  ["Mobile Number", s.contactNumber || "N/A"],
                  ["Email ID", s.emailId || `${s.hrmsId?.toLowerCase()}@rail.in`],
                  ["Account Status", s.monitoringStatus || "Active"],
                  ["Zone", s.zone || "Central Railway"],
                  ["Division", s.division || "Nagpur"],
                  ["Station", s.stationName],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{lbl}</div>
                    <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Operational Specifications */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' }}>
                  Operational Profile Specifications
                </h4>

                {s.role === "pointsmen" && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                    <div><strong>Reporting Station Master:</strong><div style={{ fontWeight: 700, color: "#1e3a5f", marginTop: 4 }}>{s.reportingSm || "S. Deshmukh (SM)"}</div></div>
                    <div><strong>Assigned Shift:</strong><div style={{ fontWeight: 700, color: "#1e3a5f", marginTop: 4 }}>{s.shift || "Morning Shift (06:00 - 14:00)"}</div></div>
                    <div><strong>Work Location Setup:</strong><div style={{ fontWeight: 700, color: "#1e3a5f", marginTop: 4 }}>{s.workLocation || "Yard Area"}</div></div>
                  </div>
                )}

                {(s.role === "sm" || s.role === "ss") && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                    <div><strong>Operational Station:</strong><div style={{ fontWeight: 700, color: "#065f46", marginTop: 4 }}>{s.smStation || s.stationName || "N/A"}</div></div>
                    <div><strong>Operational Division:</strong><div style={{ fontWeight: 700, color: "#065f46", marginTop: 4 }}>{s.smDivision || s.division || "Nagpur"}</div></div>
                    <div><strong>Operational Zone:</strong><div style={{ fontWeight: 700, color: "#065f46", marginTop: 4 }}>{s.smZone || s.zone || "Central Railway"}</div></div>
                  </div>
                )}

                {s.role === "tm" && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                    <div><strong>Crew Depot:</strong><div style={{ fontWeight: 700, color: "#6b21a8", marginTop: 4 }}>{s.workLocation || "Nagpur Depot"}</div></div>
                    <div><strong>Assigned Shift:</strong><div style={{ fontWeight: 700, color: "#6b21a8", marginTop: 4 }}>{s.shift || "Goods Train Beat"}</div></div>
                    <div><strong>Assigned Section Beats:</strong><div style={{ fontWeight: 700, color: "#6b21a8", marginTop: 4 }}>{s.reportingSm || "NGP-BSL Section"}</div></div>
                  </div>
                )}
              </div>
            </div>
            <div className="sdom-chart-card">
              <div className="sdom-chart-title">Score Trend</div>
              <div className="sdom-chart-subtitle">Assessment score progression</div>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={11} />
                    <YAxis domain={[40, 100]} fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // TI Assessment fill form
    if (roleKey === "ti" && tiAssessmentFormOpen) {
      const tiEmployee = allEmployees.find(e => e.hrmsId === tiAssessmentFormOpen && e.role === "ti");
      const answers = tiAssessmentAnswers[tiAssessmentFormOpen] || {};
      const totalMarks = assessmentCriteria.reduce((t, c) => t + c.marks, 0);
      const scored = assessmentCriteria.reduce((t, c) => t + (answers[c.key] === "yes" ? c.marks : 0), 0);
      return (
        <div className="sdom-fade">
          <div style={{ marginBottom: 24 }}>
            <button className="sdom-back-btn" onClick={() => setTiAssessmentFormOpen(null)}>
              <ArrowLeft size={16} /> Back to Traffic Inspectors
            </button>
          </div>
          <div className="sdom-station-header" style={{ marginBottom: 24 }}>
            <div className="sdom-station-header-meta">
              <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginBottom: 6, textTransform: "uppercase" }}>Traffic Inspector Assessment</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 4 }}>{tiEmployee?.name || tiAssessmentFormOpen}</div>
              <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>HRMS: {tiAssessmentFormOpen} &bull; Division: {tiEmployee?.division || "–"}</div>
            </div>
            <div className="sdom-station-header-stats">
              <div className="sdom-station-header-stat"><span className="val">{scored}/{totalMarks}</span><span className="lbl">Current Score</span></div>
            </div>
          </div>
          <div className="sdom-chart-card">
            <div className="sdom-chart-title" style={{ marginBottom: 20 }}>Safety & Competency Assessment — Yes / No Checklist</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {assessmentCriteria.map((c) => (
                <div key={c.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "14px 18px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>{c.label}</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 2 }}>Max Marks: {c.marks}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setTiAssessmentAnswers(prev => ({ ...prev, [tiAssessmentFormOpen]: { ...prev[tiAssessmentFormOpen], [c.key]: "yes" } }))}
                      style={{
                        padding: "8px 20px", borderRadius: 6, border: "2px solid", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem",
                        borderColor: answers[c.key] === "yes" ? "#16a34a" : "#d1d5db",
                        background: answers[c.key] === "yes" ? "#dcfce7" : "#ffffff",
                        color: answers[c.key] === "yes" ? "#15803d" : "#6b7280"
                      }}
                    >âœ“ Yes</button>
                    <button
                      type="button"
                      onClick={() => setTiAssessmentAnswers(prev => ({ ...prev, [tiAssessmentFormOpen]: { ...prev[tiAssessmentFormOpen], [c.key]: "no" } }))}
                      style={{
                        padding: "8px 20px", borderRadius: 6, border: "2px solid", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem",
                        borderColor: answers[c.key] === "no" ? "#dc2626" : "#d1d5db",
                        background: answers[c.key] === "no" ? "#fee2e2" : "#ffffff",
                        color: answers[c.key] === "no" ? "#b91c1c" : "#6b7280"
                      }}
                    >âœ— No</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Score: {scored} / {totalMarks} — Grade: {scored >= 90 ? "A" : scored >= 70 ? "B" : "C"}</div>
              <div style={{ display: "flex", gap: 12 }}>
                <button className="sdom-btn-outline" onClick={() => setTiAssessmentFormOpen(null)}>Cancel</button>
                <button className="sdom-btn-primary" onClick={() => {
                  const grade = scored >= 90 ? "A" : scored >= 70 ? "B" : "C";
                  alert(`Assessment submitted for ${tiEmployee?.name || tiAssessmentFormOpen}.\nScore: ${scored}/${totalMarks} — Grade: ${grade}`);
                  setTiActivatedAssessments(prev => ({ ...prev, [tiAssessmentFormOpen]: "submitted" }));
                  setTiAssessmentFormOpen(null);
                }}>Submit Assessment</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const filtered = allEmployees.filter(e =>
      e.role === roleKey &&
      (roleFilterStation === "All" || e.stationName === roleFilterStation) &&
      (roleFilterDivision === "All" || e.division === roleFilterDivision) &&
      (roleFilterCat === "All" || e.category === roleFilterCat) &&
      (roleFilterRisk === "All" || e.riskLevel === roleFilterRisk) &&
      (!roleFilterName || e.name.toLowerCase().includes(roleFilterName.toLowerCase()) || e.hrmsId.toLowerCase().includes(roleFilterName.toLowerCase()))
    );

    const stationOpts = ["All", ...Array.from(new Set(allEmployees.filter(e => e.role === roleKey).map(e => e.stationName)))];
    const divisionOpts = ["All", ...Array.from(new Set(allEmployees.filter(e => e.role === roleKey).map(e => e.division)))];

    return (
      <div className="sdom-fade">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 className="sdom-page-title">{title} Management</h1>
            <p className="sdom-page-subtitle">Search, filter and manage all {title.toLowerCase()}s in the division.</p>
          </div>
          {(roleKey === "pointsmen" || roleKey === "sm" || roleKey === "ss" || roleKey === "tm" || roleKey === "ti") && (
            <button className="sdom-btn-primary" onClick={
              roleKey === "pointsmen" ? openPmAdd :
                roleKey === "sm" ? openSmAdd :
                  roleKey === "ss" ? openSsAdd :
                    roleKey === "tm" ? openTmAdd : openTiAdd
            }>
              <Plus size={16} /> Add New {title}
            </button>
          )}
        </div>

        {/* Filters - matching SuperAdmin style */}
        <div className="sdom-filter-bar">
          <div className="sdom-filter-field" style={{ minWidth: 200 }}>
            <label>Name / ID</label>
            <input value={roleFilterName} onChange={e => setRoleFilterName(e.target.value)} placeholder="Search..." />
          </div>
          <div className="sdom-filter-field">
            <label>Station</label>
            <select value={roleFilterStation} onChange={e => setRoleFilterStation(e.target.value)}>
              {stationOpts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="sdom-filter-field">
            <label>{roleKey === "ti" ? "TI Area" : "Division"}</label>
            <select value={roleFilterDivision} onChange={e => setRoleFilterDivision(e.target.value)}>
              {divisionOpts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="sdom-filter-field">
            <label>Category</label>
            <select value={roleFilterCat} onChange={e => setRoleFilterCat(e.target.value)}>
              <option>All</option><option>A</option><option>B</option><option>C</option><option>D</option>
            </select>
          </div>
          <div className="sdom-filter-field">
            <label>Risk Level</label>
            <select value={roleFilterRisk} onChange={e => setRoleFilterRisk(e.target.value)}>
              <option>All</option><option>Low</option><option>Medium</option><option>High</option>
            </select>
          </div>
        </div>

        <div className="sdom-chart-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontWeight: 700, color: "#1e293b" }}>{filtered.length} staff found</span>
          </div>
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>{roleKey === "ti" ? "Emp ID" : "HRMS ID"}</th>
                  <th>Station</th>
                  <th>{roleKey === "ti" ? "TI Area" : "Division"}</th>
                  <th>Category</th>
                  <th>Risk</th>
                  <th>Last Score</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>No records found</td></tr>
                )}
                {filtered.map(s => {
                  const isPending = s.assessmentStatus === "Pending";
                  const tiActivated = tiActivatedAssessments[s.hrmsId];

                  const renderCategoryBadge = (cat) => {
                    const bgMap = { A: "#dcfce7", B: "#dbeafe", C: "#fef3c7", D: "#fee2e2" };
                    const fgMap = { A: "#15803d", B: "#1d4ed8", C: "#b45309", D: "#b91c1c" };

                    if (roleKey === "ti") {
                      return (
                        <span style={{
                          background: bgMap[cat] || "#f1f5f9",
                          color: fgMap[cat] || "#475569",
                          border: `1px solid ${fgMap[cat] || "#cbd5e1"}`,
                          width: "26px",
                          height: "26px",
                          borderRadius: "50%",
                          fontWeight: "700",
                          fontSize: "12px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "center"
                        }}>
                          {cat}
                        </span>
                      );
                    }

                    return (
                      <span style={{
                        background: bgMap[cat] || "#f1f5f9",
                        color: fgMap[cat] || "#475569",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontWeight: "700",
                        fontSize: "12px",
                        display: "inline-block",
                        minWidth: "24px",
                        textAlign: "center"
                      }}>
                        {cat}
                      </span>
                    );
                  };

                  const renderRiskBadge = (risk) => {
                    const bgMap = { Low: "#dcfce7", Medium: "#fff7ed", High: "#fee2e2" };
                    const fgMap = { Low: "#16a34a", Medium: "#ea580c", High: "#dc2626" };
                    return (
                      <span style={{
                        background: bgMap[risk] || "#f1f5f9",
                        color: fgMap[risk] || "#475569",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontWeight: "700",
                        fontSize: "11px",
                        textTransform: "uppercase",
                        display: "inline-block"
                      }}>
                        {risk}
                      </span>
                    );
                  };

                  const renderStatusBadge = (status) => {
                    const bgMap = { Approved: "#dcfce7", Completed: "#dcfce7", Pending: "#fff7ed", "In Progress": "#fef08a", Rejected: "#fee2e2" };
                    const fgMap = { Approved: "#16a34a", Completed: "#16a34a", Pending: "#ea580c", "In Progress": "#ca8a04", Rejected: "#dc2626" };
                    const text = status === "Completed" ? "APPROVED" : status.toUpperCase();
                    return (
                      <span style={{
                        background: bgMap[status] || "#f1f5f9",
                        color: fgMap[status] || "#475569",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontWeight: "700",
                        fontSize: "11px",
                        display: "inline-block"
                      }}>
                        {text}
                      </span>
                    );
                  };

                  return (
                    <tr key={s.hrmsId}>
                      <td style={{ fontWeight: 700 }}>{s.name}</td>
                      <td style={{ color: "#64748b", fontSize: "0.85rem" }}>{s.hrmsId}</td>
                      <td>{s.stationName}</td>
                      <td>{s.division}</td>
                      <td>{renderCategoryBadge(s.category)}</td>
                      <td>{renderRiskBadge(s.riskLevel)}</td>
                      <td style={{ fontWeight: 700 }}>{s.lastScore || "–"}</td>
                      <td>{renderStatusBadge(s.assessmentStatus)}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                          {/* View Profile */}
                          <button className="sdom-btn-outline" style={{ padding: "5px 10px", fontSize: "0.8rem" }}
                            onClick={() => setSelectedRoleEmployee({ ...s, _roleKey: roleKey })}>
                            View
                          </button>

                          {/* Edit */}
                          {roleKey === "ti" ? (
                            <button className="sdom-icon-btn" title="Edit" onClick={() => openTiEdit(s)}>
                              <Edit size={15} color="#2563eb" />
                            </button>
                          ) : roleKey === "pointsmen" ? (
                            <button className="sdom-icon-btn" title="Edit" onClick={() => {
                              const pmObj = aomPointsmen.find(pm => pm.hrmsId === s.hrmsId);
                              if (pmObj) openPmEdit(pmObj);
                            }}>
                              <Edit size={15} color="#2563eb" />
                            </button>
                          ) : roleKey === "sm" ? (
                            <button className="sdom-icon-btn" title="Edit" onClick={() => {
                              const smObj = aomStationMasters.find(sm => (sm.hrmsId || sm.id) === s.hrmsId);
                              if (smObj) openSmEdit(smObj);
                            }}>
                              <Edit size={15} color="#2563eb" />
                            </button>
                          ) : roleKey === "ss" ? (
                            <button className="sdom-icon-btn" title="Edit" onClick={() => {
                              const ssObj = aomSuperintendents.find(ss => ss.employeeId === s.hrmsId);
                              if (ssObj) openSsEdit(ssObj);
                            }}>
                              <Edit size={15} color="#2563eb" />
                            </button>
                          ) : (
                            <button className="sdom-icon-btn" title="Edit" onClick={() => {
                              const tmObj = aomTrainManagers.find(tm => tm.employeeId === s.hrmsId);
                              if (tmObj) openTmEdit(tmObj);
                            }}>
                              <Edit size={15} color="#2563eb" />
                            </button>
                          )}

                          {/* Shift */}
                          {roleKey === "ti" ? (
                            <button className="sdom-icon-btn" title="Transfer to Another Station" onClick={() => {
                              const dest = window.prompt(`Enter new Division to shift ${s.name} (e.g. Pune, Mumbai, Delhi):`);
                              if (dest) {
                                if (window.confirm(`Shift ${s.name} to ${dest} Division?`)) {
                                  setTrafficInspectors(prev => prev.map(t => t.employeeId === s.hrmsId ? { ...t, division: dest, jurisdiction: dest } : t));
                                  alert(`${s.name} shifted to ${dest} Division successfully.`);
                                }
                              }
                            }}>
                              <ArrowRightLeft size={15} color="#d97706" />
                            </button>
                          ) : roleKey === "pointsmen" ? (
                            <button className="sdom-icon-btn" title="Transfer to Another Station" onClick={() => {
                              const pmObj = aomPointsmen.find(pm => pm.hrmsId === s.hrmsId);
                              if (pmObj) openPmShift(pmObj);
                            }}>
                              <ArrowRightLeft size={15} color="#d97706" />
                            </button>
                          ) : roleKey === "sm" ? (
                            <button className="sdom-icon-btn" title="Transfer to Another Station" onClick={() => {
                              const smObj = aomStationMasters.find(sm => (sm.hrmsId || sm.id) === s.hrmsId);
                              if (smObj) openSmShift(smObj);
                            }}>
                              <ArrowRightLeft size={15} color="#d97706" />
                            </button>
                          ) : roleKey === "ss" ? (
                            <button className="sdom-icon-btn" title="Transfer to Another Station" onClick={() => {
                              const ssObj = aomSuperintendents.find(ss => ss.employeeId === s.hrmsId);
                              if (ssObj) openSsShift(ssObj);
                            }}>
                              <ArrowRightLeft size={15} color="#d97706" />
                            </button>
                          ) : (
                            <button className="sdom-icon-btn" title="Transfer to Another Station" onClick={() => {
                              const tmObj = aomTrainManagers.find(tm => tm.employeeId === s.hrmsId);
                              if (tmObj) openTmShift(tmObj);
                            }}>
                              <ArrowRightLeft size={15} color="#d97706" />
                            </button>
                          )}

                          {/* Remove */}
                          {roleKey === "ti" ? (
                            <button className="sdom-icon-btn" title="Remove" onClick={() => removeTi(s.hrmsId)}>
                              <Trash2 size={15} color="#dc2626" />
                            </button>
                          ) : roleKey === "pointsmen" ? (
                            <button className="sdom-icon-btn" title="Remove" onClick={() => removePm(s.hrmsId)}>
                              <Trash2 size={15} color="#dc2626" />
                            </button>
                          ) : roleKey === "sm" ? (
                            <button className="sdom-icon-btn" title="Remove" onClick={() => removeSm(s.hrmsId)}>
                              <Trash2 size={15} color="#dc2626" />
                            </button>
                          ) : roleKey === "ss" ? (
                            <button className="sdom-icon-btn" title="Remove" onClick={() => removeSs(s.hrmsId)}>
                              <Trash2 size={15} color="#dc2626" />
                            </button>
                          ) : (
                            <button className="sdom-icon-btn" title="Remove" onClick={() => removeTm(s.hrmsId)}>
                              <Trash2 size={15} color="#dc2626" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Super Admin Stations Replication Mappers & Helpers
  const isStationMatch = (stationA, stationB) => {
    if (!stationA || !stationB) return false;
    const a = stationA.toLowerCase().trim();
    const b = stationB.toLowerCase().trim();
    if (a === b) return true;
    const clean = s => s.replace(/\s+/g, '').replace(/junction|central|main|town|jn|station/gi, '');
    return clean(a) === clean(b) || clean(a).includes(clean(b)) || clean(b).includes(clean(a));
  };

  const unifiedStaff = useMemo(() => {
    return allEmployees.map(u => ({
      id: u.hrmsId,
      name: u.name,
      station: u.stationName,
      role: u.role,
      cat: u.category || "A",
      risk: u.riskLevel || "Low",
      score: u.lastScore || 80,
      status: u.assessmentStatus || "Approved",
      contact: u.contactNumber || "+91 99000 11000",
      email: u.emailId || `${u.hrmsId?.toLowerCase()}@rail.in`,
      lastDate: u.lastAssessedDate || "2026-03-10",
      reportingAom: "P. K. Verma (Sr. DOM)"
    }));
  }, [allEmployees]);

  const unifiedStations = useMemo(() => {
    return DASHBOARD_96_STATIONS.map(st => {
      const stStaff = unifiedStaff.filter(s => isStationMatch(s.station, st.stationName || st.name));
      const pmCount = stStaff.filter(s => s.role === "pointsmen").length;
      const smCount = stStaff.filter(s => s.role === "sm").length;
      const safety = Math.min(100, Math.max(60, 95 - st.pending));
      const highRisk = stStaff.filter(s => s.risk === "High").length;
      return {
        id: st.id,
        name: st.stationName,
        code: st.stationCode,
        ti: st.division === "Nagpur" ? "TI NGP" : st.division === "Pune" ? "TI PAR" : "TI AMLA",
        smCount: smCount || 5,
        pmCount: pmCount || 20,
        score: st.avgScore,
        safety,
        highRisk: highRisk || (st.riskLevel === "High" ? 4 : st.riskLevel === "Medium" ? 2 : 0),
        pending: st.pending,
        stationName: st.stationName,
        stationCode: st.stationCode,
        division: st.division,
        zone: st.zone || "CR",
        category: st.category,
        riskLevel: st.riskLevel,
        assessmentStatus: st.assessmentStatus,
        lastUpdatedDate: st.lastUpdatedDate,
        stationClass: st.stationClass || "Class B",
        stationType: st.stationType || "Junction",
        signalingType: st.signalingType || "Route Relay Interlocking (RRI)",
        platforms: st.platforms || 3,
        tracks: st.tracks || 5,
        dailyFootfall: st.dailyFootfall || 15000,
        latitude: st.latitude || "21.1500Â° N",
        longitude: st.longitude || "79.0900Â° E",
        contactNumber: st.contactNumber || "+91-712-2560158",
        emailId: st.emailId || `station.${(st.stationCode || st.id || "NGP").toLowerCase().split('_')[0]}@cr.railnet.gov.in`,
        lineConfig: st.lineConfig || "Double Line",
        electrified: st.electrified || "Electrified AC 25kV"
      };
    });
  }, [DASHBOARD_96_STATIONS, unifiedStaff]);

  const ROLE_MAP = {
    pointsmen: "Pointsman",
    sm: "Station Master",
    ss: "Station Superintendent",
    tm: "Train Manager",
    ti: "Traffic Inspector"
  };


  function riskBadge(r) {
    const map = { Low: "sdom-badge-success", Medium: "sdom-badge-warning", High: "sdom-badge-danger" };
    return <span className={`sdom-badge ${map[r] || "sdom-badge-neutral"}`}>{r}</span>;
  }
  function catBadge(c) {
    const map = { A: "sdom-badge-success", B: "sdom-badge-info", C: "sdom-badge-warning", D: "sdom-badge-danger" };
    return <span className={`sdom-badge ${map[c] || "sdom-badge-neutral"}`}>{c}</span>;
  }
  function statusBadge(s) {
    const map = { Approved: "sdom-badge-success", Pending: "sdom-badge-warning", Rejected: "sdom-badge-danger", Overdue: "sdom-badge-danger" };
    return <span className={`sdom-badge ${map[s] || "sdom-badge-neutral"}`}>{s}</span>;
  }

  const handleAddStation = () => {
    if (!newStName || !newStCode) return;
    const newSt = {
      id: "ST_" + Date.now(),
      stationName: newStName,
      stationCode: newStCode.toUpperCase(),
      division: newStDivision,
      zone: newStZone,
      completed: 250,
      pending: 10,
      avgScore: 82,
      category: newStCategory,
      riskLevel: "Low",
      assessmentStatus: "Approved",
      lastUpdatedDate: new Date().toISOString().split('T')[0],
      stationClass: newStClass,
      stationType: newStType,
      signalingType: newStSignaling,
      platforms: parseInt(newStPlatforms) || 1,
      tracks: parseInt(newStTracks) || 1,
      dailyFootfall: parseInt(newStDailyFootfall) || 5000,
      latitude: newStLatitude || "21.1500Â° N",
      longitude: newStLongitude || "79.0900Â° E",
      contactNumber: newStContactNumber || "+91-712-2560158",
      emailId: newStEmailId || `station.${newStCode.toLowerCase().trim()}@cr.railnet.gov.in`,
      lineConfig: newStLineConfig,
      electrified: newStElectrified
    };
    DASHBOARD_96_STATIONS.push(newSt);
    setShowAddStation(false);
  };

  function renderStaffDetail(s) {
    const scoreData = MONTHLY_TREND.map((m, i) => ({ month: m.month, score: Math.max(50, s.score - 10 + i * 2) }));
    return (
      <div className="sdom-fade">
        <div style={{ marginBottom: 24 }}>
          <button className="sdom-back-btn" onClick={() => {
            if (view?.returnTo === "stationDetail") {
              setView({ type: "stationDetail", data: view.stationData });
            } else {
              setView(null);
            }
          }}><ArrowLeft size={16} /> Back to List</button>
        </div>

        <div className="sdom-station-header" style={{ marginBottom: 24 }}>
          <div className="sdom-station-header-meta">
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Staff Profile</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 4 }}>{s.name}</div>
            <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>{ROLE_MAP[s.role] || s.role} &bull; {s.station} &bull; {s.zone || "Central Railway"}</div>
            <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
              {catBadge(s.cat)}
              {riskBadge(s.risk)}
              {statusBadge(s.status)}
            </div>
          </div>
          <div className="sdom-station-header-stats">
            <div className="sdom-station-header-stat">
              <span className="val">{s.score}</span>
              <span className="lbl">Latest Score</span>
            </div>
            <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
            <div className="sdom-station-header-stat">
              <span className="val">{s.contact || "—"}</span>
              <span className="lbl">Contact</span>
            </div>
            <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
            <div className="sdom-station-header-stat">
              <span className="val">{s.lastDate || "—"}</span>
              <span className="lbl">Last Assessment</span>
            </div>
          </div>
        </div>

        <div className="sdom-row-2">
          <div className="sdom-chart-card">
            <div className="sdom-chart-title" style={{ marginBottom: "16px" }}>Personal & Professional Details</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', paddingBottom: '20px' }}>
              {[
                ["Employee ID / HRMS ID", s.id],
                ["Designation", ROLE_MAP[s.role] || s.role],
                ["Mobile Number", s.contact || "N/A"],
                ["Email ID", s.email || `${s.id?.toLowerCase()}@rail.in`],
                ["Account Status", s.status || "Active"],
                ["Current Zone", s.zone || "Central Railway"],
                ["Current Division", s.division || "Nagpur"],
                ["Current Station Placement", s.station],
                ["Reporting Officer", s.reportingAom || "P. K. Verma (Sr. DOM)"]
              ].map(([lbl, val]) => (
                <div key={lbl} style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{lbl}</div>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="sdom-chart-card">
            <div className="sdom-chart-title">Score Trend</div>
            <div className="sdom-chart-subtitle">Monthly performance tracking for this employee</div>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis domain={[40, 100]} fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderStationDetail(st) {
    const stStaff = unifiedStaff.filter(s => isStationMatch(s.station, st.name));
    const pmList = stStaff.filter(s => s.role === "pointsmen");
    const smList = stStaff.filter(s => s.role === "sm");
    const tiPerson = stStaff.find(s => s.role === "ti") || { name: st.ti, id: "—", contact: "—", cat: "—" };

    const catCount = ["A", "B", "C", "D"].map(c => ({ cat: `Cat ${c}`, count: stStaff.filter(s => s.cat === c).length, fill: CAT_COLORS[c] }));
    const riskCount = [
      { name: "Low", value: stStaff.filter(s => s.risk === "Low").length, fill: "#16a34a" },
      { name: "Medium", value: stStaff.filter(s => s.risk === "Medium").length, fill: "#f59e0b" },
      { name: "High", value: stStaff.filter(s => s.risk === "High").length, fill: "#ef4444" },
    ].filter(r => r.value > 0);

    const trend = MONTHLY_TREND.map(m => ({ ...m, score: Math.max(60, st.score - 8 + MONTHLY_TREND.indexOf(m) * 2) }));

    return (
      <div className="sdom-fade">
        <div style={{ marginBottom: 20 }}>
          <button className="sdom-back-btn" onClick={() => setView(null)}><ArrowLeft size={16} /> Back to Stations</button>
        </div>

        <div className="sdom-station-header">
          <div className="sdom-station-header-meta">
            <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Station Analytics Dashboard</div>
            <div style={{ fontSize: "1.9rem", fontWeight: 800, marginBottom: 4 }}>{st.name}</div>
            <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>Code: <b>{st.code}</b> &bull; Assigned TI: <b>{st.ti}</b></div>
            <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
              <span className="sdom-badge" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>{st.smCount} Station Masters</span>
              <span className="sdom-badge" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>{st.pmCount} Pointsmen</span>
              <span className={`sdom-badge ${st.highRisk > 4 ? "sdom-badge-red" : "sdom-badge-green"}`}>{st.highRisk} High-Risk</span>
            </div>
          </div>
          <div className="sdom-station-header-stats">
            <div className="sdom-station-header-stat">
              <span className="val">{st.score}</span>
              <span className="lbl">Avg Score</span>
            </div>
            <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
            <div className="sdom-station-header-stat">
              <span className="val">{st.safety}%</span>
              <span className="lbl">Safety</span>
            </div>
            <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
            <div className="sdom-station-header-stat">
              <span className="val">{st.pending}</span>
              <span className="lbl">Pending</span>
            </div>
            <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
            <div className="sdom-station-header-stat">
              <span className="val">{stStaff.length}</span>
              <span className="lbl">Total Staff</span>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Total Staff", val: stStaff.length },
            { label: "Pending Assessments", val: st.pending },
            { label: "Completed", val: stStaff.filter(s => s.status === "Approved").length },
            { label: "High-Risk Pointsmen", val: pmList.filter(s => s.risk === "High").length },
            { label: "Safety Compliance", val: `${st.safety}%` },
          ].map(c => (
            <div key={c.label} className="sdom-stat-card">
              <div className="sdom-stat-value">{c.val}</div>
              <div className="sdom-stat-label">{c.label}</div>
            </div>
          ))}
        </div>

        {/* STATION OPERATIONAL INFRASTRUCTURE & TECHNICAL PROFILE */}
        <div className="sdom-chart-card" style={{ marginBottom: 24, padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <div className="sdom-chart-title" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.1rem", fontWeight: 700, color: "#0B1F3A", marginBottom: "4px" }}>
            <Building2 size={20} style={{ color: "#2563eb" }} />
            Station Operational Infrastructure & Technical Profile
          </div>
          <div className="sdom-chart-subtitle" style={{ marginBottom: "18px", color: "#64748b", fontSize: "0.85rem" }}>
            Official configuration, signaling details, geographical references, and logistics profile of the station.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            {[
              { label: "Operating Division", val: st.division || "Nagpur", icon: <Layers size={16} /> },
              { label: "Railway Zone", val: st.zone || "CR", icon: <Globe size={16} /> },
              { label: "Station Category", val: `Category ${st.category || "A"}`, icon: <Tag size={16} /> },
              { label: "Operating Class", val: st.stationClass || "Class B", icon: <Award size={16} /> },
              { label: "Station Type", val: st.stationType || "Junction", icon: <GitBranch size={16} /> },
              { label: "Signaling System", val: st.signalingType || "Electronic Interlocking (EI)", icon: <Cpu size={16} /> },
              { label: "Platforms", val: `${st.platforms || 3} Platforms`, icon: <AlignJustify size={16} /> },
              { label: "Operational Tracks", val: `${st.tracks || 5} Tracks/Lines`, icon: <TrendingUp size={16} /> },
              { label: "Line Configuration", val: st.lineConfig || "Double Line", icon: <AlignJustify size={16} /> },
              { label: "Electrification", val: st.electrified || "Electrified AC 25kV", icon: <Zap size={16} /> },
              { label: "Daily Avg Footfall", val: `${(st.dailyFootfall || 15000).toLocaleString()} Passengers`, icon: <Users size={16} /> },
              { label: "Latitude & Longitude", val: `${st.latitude || "21.1500Â° N"} / ${st.longitude || "79.0900Â° E"}`, icon: <MapPin size={16} /> },
              { label: "Official Contact", val: st.contactNumber || "+91-712-2560158", icon: <Phone size={16} /> },
              { label: "Official Email ID", val: st.emailId || `station.${(st.code || "NGP").toLowerCase().split('_')[0]}@cr.railnet.gov.in`, icon: <Mail size={16} /> },
            ].map((item, idx) => (
              <div key={idx} style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}>
                <div style={{
                  background: "#eff6ff",
                  color: "#2563eb",
                  borderRadius: "6px",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }} title={item.val}>
                    {item.val}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sdom-row-2">
          <div className="sdom-chart-card">
            <div className="sdom-chart-title">Category Distribution</div>
            <div className="sdom-chart-subtitle">A/B/C/D breakdown of staff at this station</div>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={catCount} barSize={46} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC" />
                  <XAxis dataKey="cat" fontSize={12} tick={{ fill: "#102A43", fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis fontSize={11} tick={{ fill: "#627D98" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                  <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                    {catCount.map((d, i) => <Cell key={i} fill={CAT_COLORS[Object.keys(CAT_COLORS)[i]]} />)}
                    <LabelList dataKey="count" position="top" style={{ fontSize: 12, fontWeight: 700, fill: "#102A43" }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="sdom-chart-card">
            <div className="sdom-chart-title">Risk Distribution</div>
            <div className="sdom-chart-subtitle">Staff risk level breakdown at this station</div>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskCount} cx="50%" cy="50%" innerRadius={70} outerRadius={105}
                    dataKey="value" paddingAngle={4}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}>
                    {riskCount.map((d, i) => <Cell key={i} fill={RISK_COLORS[d.name]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: "0.82rem" }} />
                  <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="sdom-row-1">
          <div className="sdom-chart-card">
            <div className="sdom-chart-title" style={{ marginBottom: 16 }}>Station Masters</div>
            <div className="sdom-table-wrap">
              <table className="sdom-table">
                <thead><tr><th>Name</th><th>HRMS ID</th><th>Category</th><th>Last Score</th><th>Last Assessment</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {smList.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>No Station Masters assigned</td></tr>}
                  {smList.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 700 }}>{s.name}</td>
                      <td style={{ color: "#64748b", fontSize: "0.85rem" }}>{s.id}</td>
                      <td>{catBadge(s.cat)}</td>
                      <td style={{ fontWeight: 700 }}>{s.score}</td>
                      <td>{s.lastDate}</td>
                      <td>{statusBadge(s.status)}</td>
                      <td><button className="sdom-btn-ghost" onClick={() => setView({ type: "staffDetail", data: s, returnTo: "stationDetail", stationData: st })}>View Details</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="sdom-row-1">
          <div className="sdom-chart-card">
            <div className="sdom-chart-title" style={{ marginBottom: 16 }}>Pointsmen</div>
            <div className="sdom-table-wrap">
              <table className="sdom-table">
                <thead><tr><th>Name</th><th>HRMS ID</th><th>Category</th><th>Risk Level</th><th>Latest Score</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {pmList.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>No Pointsmen assigned</td></tr>}
                  {pmList.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 700 }}>{s.name}</td>
                      <td style={{ color: "#64748b", fontSize: "0.85rem" }}>{s.id}</td>
                      <td>{catBadge(s.cat)}</td>
                      <td>{riskBadge(s.risk)}</td>
                      <td style={{ fontWeight: 700 }}>{s.score}</td>
                      <td>{statusBadge(s.status)}</td>
                      <td><button className="sdom-btn-ghost" onClick={() => setView({ type: "staffDetail", data: s, returnTo: "stationDetail", stationData: st })}>View Details</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderStations = () => {
    if (view?.type === "staffDetail") return renderStaffDetail(view.data);
    if (view?.type === "stationDetail") return renderStationDetail(view.data);
    const filtered = unifiedStations.filter(st =>
      !stF.name || st.name.toLowerCase().includes(stF.name.toLowerCase()) || st.code.toLowerCase().includes(stF.name.toLowerCase())
    );

    return (
      <div className="sdom-fade">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h1 className="sdom-page-title">Stations</h1>
            <p className="sdom-page-subtitle">Full list of stations in Nagpur Division. Click a station to open its complete analytics dashboard.</p>
          </div>
          <button className="sdom-btn-primary" onClick={() => {
            setNewStName("");
            setNewStCode("");
            setNewStTi("TI NGP");
            setNewStDivision("Nagpur");
            setNewStZone("CR");
            setNewStCategory("A");
            setNewStClass("Class B");
            setNewStType("Junction");
            setNewStSignaling("Electronic Interlocking (EI)");
            setNewStPlatforms(3);
            setNewStTracks(5);
            setNewStDailyFootfall(15000);
            setNewStLatitude("21.1500Â° N");
            setNewStLongitude("79.0900Â° E");
            setNewStContactNumber("+91-712-2560158");
            setNewStEmailId("");
            setNewStLineConfig("Double Line");
            setNewStElectrified("Electrified AC 25kV");
            setShowAddStation(true);
          }}>
            <Plus size={16} /> Add New Station
          </button>
        </div>

        <div className="sdom-filter-bar" style={{ flexWrap: "nowrap" }}>
          <div className="sdom-filter-field" style={{ flex: 1 }}>
            <label>Search Station</label>
            <input value={stF.name} onChange={e => setStF({ name: e.target.value })} placeholder="Station name or code..." />
          </div>
        </div>

        <div className="sdom-chart-card">
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr><th>Station Name</th><th>Code</th><th>Assigned TI</th><th>SMs</th><th>Pointsmen</th><th>Avg Score</th><th>Safety %</th><th>High Risk</th><th>Pending</th><th>Dashboard</th></tr>
              </thead>
              <tbody>
                {filtered.map(st => (
                  <tr key={st.id}>
                    <td style={{ fontWeight: 700 }}>{st.name}</td>
                    <td><span className="sdom-badge sdom-badge-blue">{st.code}</span></td>
                    <td>{st.ti}</td>
                    <td>{st.smCount}</td>
                    <td>{st.pmCount}</td>
                    <td style={{ fontWeight: 700, color: st.score >= 85 ? "#16a34a" : st.score >= 75 ? "#d97706" : "#dc2626" }}>{st.score}</td>
                    <td>{st.safety}%</td>
                    <td>{st.highRisk > 3 ? <span style={{ color: "#dc2626", fontWeight: 700 }}>{st.highRisk}</span> : st.highRisk}</td>
                    <td>{st.pending}</td>
                    <td>
                      <button className="sdom-btn-primary" style={{ padding: "7px 14px", fontSize: "0.82rem" }} onClick={() => setView({ type: "stationDetail", data: st })}>
                        Open Station Dashboard
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderPageContent = () => {
    switch (activePage) {
      case "Station Master Profile":
        if (!selectedSMProfile) return null;
        return (
          <div className="user-management-page">
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                  STATION MASTER PROFILE
                </h2>
                <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748b" }}>
                  Detailed operational card for Station Master <strong>{selectedSMProfile.name}</strong>
                </p>
              </div>
              <button
                type="button"
                className="action-btn"
                onClick={() => setActivePage("Station Masters")}
                style={{ background: "#64748b", color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}
              >
                â† Back to List
              </button>
            </div>

            <div className="chart-card ti-profile-card animate-fade-in" style={{ borderTop: '4px solid #059669', backgroundColor: '#fcfdfe', padding: '20px' }}>
              <div className="ti-profile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#059669', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: '800', fontSize: '18px' }}>
                    {selectedSMProfile.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '800', color: '#059669' }}>
                      {selectedSMProfile.name}
                    </h3>
                    <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>Designation: Station Master | Station: {selectedSMProfile.stationName} ({selectedSMProfile.stationCode})</p>
                  </div>
                </div>
              </div>

              <div className="ti-profile-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', padding: '15px 0' }}>
                <div><strong>Designation:</strong> <span style={{ color: '#059669', fontWeight: '700' }}>Station Master</span></div>
                <div><strong>Mobile No:</strong> {selectedSMProfile.contactNumber}</div>
                <div><strong>Email ID:</strong> {selectedSMProfile.emailId}</div>
                <div><strong>Account Status:</strong> <span style={{ color: '#10b981', fontWeight: '700' }}>Active</span></div>

                <div><strong>Current Zone:</strong> {selectedSMProfile.zone}</div>
                <div><strong>Current Division:</strong> {selectedSMProfile.division}</div>
                <div><strong>Station Name:</strong> {selectedSMProfile.stationName}</div>
                <div><strong>Station Code:</strong> {selectedSMProfile.stationCode}</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '15px' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '14px', color: '#0f172a', fontWeight: '800' }}>Station Master Operational Authority</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '13px' }}>
                  <div><strong>Station Category:</strong> {selectedSMProfile.category}</div>
                  <div><strong>Division HQ:</strong> {selectedSMProfile.division} Division</div>
                  <div><strong>Supervising Authority:</strong> AOM ({selectedSMProfile.division})</div>
                </div>
              </div>
            </div>
          </div>
        );

      case "Traffic Inspector Profile":
        if (!selectedTiProfile) return null;
        return (
          <div className="user-management-page">
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                  TRAFFIC INSPECTOR PROFILE
                </h2>
                <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748b" }}>
                  Detailed operational card for Traffic Inspector <strong>{selectedTiProfile.name}</strong>
                </p>
              </div>
              <button
                type="button"
                className="action-btn"
                onClick={() => setActivePage("Traffic Inspector")}
                style={{ background: "#64748b", color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}
              >
                â† Back to List
              </button>
            </div>

            <div className="chart-card ti-profile-card animate-fade-in" style={{ borderTop: '4px solid #2563eb', backgroundColor: '#fcfdfe', padding: '20px' }}>
              <div className="ti-profile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: '800', fontSize: '18px' }}>
                    {selectedTiProfile.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '800', color: '#2563eb' }}>
                      {selectedTiProfile.name}
                    </h3>
                    <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>HRMS ID: {selectedTiProfile.employeeId} | Designation: {selectedTiProfile.category}</p>
                  </div>
                </div>
              </div>

              <div className="ti-profile-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', padding: '15px 0' }}>
                <div><strong>Designation:</strong> <span style={{ color: '#2563eb', fontWeight: '700' }}>{selectedTiProfile.category}</span></div>
                <div><strong>Employee ID:</strong> {selectedTiProfile.employeeId}</div>
                <div><strong>Jurisdiction:</strong> {selectedTiProfile.jurisdiction} Division</div>
                <div><strong>Account Status:</strong> <span style={{ color: '#10b981', fontWeight: '700' }}>Active</span></div>

                <div><strong>Mobile No:</strong> {selectedTiProfile.phone || "+91 98900 12211"}</div>
                <div><strong>Email ID:</strong> {selectedTiProfile.email || "ti.officer@rail.in"}</div>
                <div><strong>Assessment Status:</strong> <span style={{ color: selectedTiProfile.assessmentStatus === "Completed" ? '#10b981' : '#f59e0b', fontWeight: '700' }}>{selectedTiProfile.assessmentStatus}</span></div>
                <div><strong>Department:</strong> Operations</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '15px' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '14px', color: '#0f172a', fontWeight: '800' }}>Assigned Supervision Jurisdiction</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <strong>Supervised Stations:</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {selectedTiProfile.linkedStations && selectedTiProfile.linkedStations.length ? (
                        selectedTiProfile.linkedStations.map(st => (
                          <span key={st} className="station-code-chip" style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>{st}</span>
                        ))
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No stations linked yet. Use "Link Stations & SMs" to assign.</span>
                      )}
                    </div>
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <strong>Supervised Station Masters:</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {selectedTiProfile.linkedSms && selectedTiProfile.linkedSms.length ? (
                        selectedTiProfile.linkedSms.map(sm => (
                          <span key={sm} className="station-code-chip" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>{sm}</span>
                        ))
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No Station Masters linked yet. Use "Link Stations & SMs" to assign.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "Employee Management":
        return renderEmployeeManagement();

      case "Dashboard": {
        return (
          <AOmDashboard
            aomPointsmen={aomPointsmen}
            stationMastersDirectory={stationMastersDirectory}
            aomSuperintendents={aomSuperintendents}
            aomTrainManagers={aomTrainManagers}
            trafficInspectors={trafficInspectors}
            stations={stations}
            stationProgressData={stationProgressData}
            stationAverageScoreData={stationAverageScoreData}
            DASHBOARD_96_STATIONS={DASHBOARD_96_STATIONS}
            MONTHLY_TREND={MONTHLY_TREND}
            COMPLIANCE={COMPLIANCE}
            ASSESSMENT_MONTHLY={ASSESSMENT_MONTHLY}
            handleChartClick={handleChartClick}
            handlePieClick={handlePieClick}
            setActivePage={setActivePage}
          />
        );
      }

      case "Station Management":
      case "All Stations":
        return (
          <div className="user-management-page">
            <div className="page-header">
              <h2>STATION MANAGEMENT</h2>
            </div>

            <div className="chart-card station-list-intro">
              <div>
                <h3>All Stations Directory</h3>
                <p>Manage station records, quickly search data, and keep operational information up to date.</p>
              </div>
              <div className="station-list-kpi">Total Stations: {stations.length}</div>
            </div>

            <div className="station-action-bar chart-card">
              <button type="button" className="submit-btn" onClick={() => handleStationSubPage("Add Station")}>
                Add New Station
              </button>
              <input
                type="text"
                className="users-table-search"
                placeholder="Search by Station Name / Code"
                value={stationSearch}
                onChange={(e) => {
                  setStationSearch(e.target.value);
                  setStationCurrentPage(1);
                }}
              />
            </div>

            <div className="users-filter-section chart-card">
              <form className="filter-grid station-filter-grid" onSubmit={handleApplyStationFilter}>
                <div className="form-group">
                  <label>Zone</label>
                  <select name="zone" value={pendingStationFilters.zone} onChange={handleStationFilterChange}>
                    <option value="">All Zones</option>
                    {stationZoneOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Division</label>
                  <select name="division" value={pendingStationFilters.division} onChange={handleStationFilterChange}>
                    <option value="">All Divisions</option>
                    {stationDivisionOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Station Category</label>
                  <select name="category" value={pendingStationFilters.category} onChange={handleStationFilterChange}>
                    <option value="">All Categories</option>
                    {stationCategoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={pendingStationFilters.status} onChange={handleStationFilterChange}>
                    <option value="">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="filter-submit-wrap">
                  <button type="submit" className="submit-btn">Apply Filter</button>
                </div>
              </form>
            </div>

            <div className="users-list-container">
              <div className="users-table-wrapper">
                <div className="users-table station-table-wide">
                  <div className="table-header station-table-cols">
                    <div>Sr No</div>
                    <div>Station Name</div>
                    <div>Station Code</div>
                    <div>Zone</div>
                    <div>Division</div>
                    <div>Category</div>
                    <div>Platforms</div>
                    <div>Tracks</div>
                    <div>Station Type</div>
                    <div>Status</div>
                    <div>Created By</div>
                    <div>Actions</div>
                  </div>

                  {pagedStations.length === 0 ? (
                    <div className="table-empty-state">No stations found.</div>
                  ) : (
                    pagedStations.map((station, index) => (
                      <div key={station.id} className="table-row station-table-cols">
                        <div>{(stationCurrentPage - 1) * stationPageSize + index + 1}</div>
                        <div>{station.stationName}</div>
                        <div>
                          <span className="station-code-chip">{station.stationCode}</span>
                        </div>
                        <div>{station.zone}</div>
                        <div>{station.division}</div>
                        <div>{renderCategoryBadge(station.category)}</div>
                        <div>{station.platforms}</div>
                        <div>{station.tracks}</div>
                        <div>{station.stationType}</div>
                        <div>
                          <span className={station.status === "Active" ? "status-active-pill" : "status-inactive-pill"}>
                            {station.status}
                          </span>
                        </div>
                        <div>{station.createdBy}</div>
                        <div className="table-action-cell">
                          <button type="button" className="action-btn" onClick={() => openStationView(station.id, false)}>
                            View
                          </button>
                          <button type="button" className="action-btn action-edit" onClick={() => openStationView(station.id, true)}>
                            Edit
                          </button>
                          <button type="button" className="action-btn action-delete" onClick={() => handleDeleteStation(station.id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="table-pagination-wrap">
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={goToPrevStationPage}
                  disabled={stationCurrentPage === 1}
                >
                  Prev
                </button>
                <span className="pagination-text">
                  Page {stationCurrentPage} of {stationTotalPages}
                </span>
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={goToNextStationPage}
                  disabled={stationCurrentPage === stationTotalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        );

      case "Stations":
        return renderStations();

      case "Pointsmen":
        return renderAomRole("pointsmen", "Pointsman");

      case "Station Masters":
        return renderAomRole("sm", "Station Master");

      case "Station Superintendents":
        return renderAomRole("ss", "Station Superintendent");

      case "Train Managers":
        return renderAomRole("tm", "Train Manager");

      case "Traffic Inspectors":
        return renderAomRole("ti", "Traffic Inspector");

      case "Station Masters Under TI": {
        if (!selectedTIForStationMasters) return null;

        const tiSmsNames = selectedTIForStationMasters.linkedSms || [];
        const smsForTI = stationMastersDirectory.filter(sm => tiSmsNames.includes(sm.name));

        // Find total pointsmen under these SMs
        const smStationCodes = smsForTI.map(sm => sm.stationCode);
        const pmForTI = aomPointsmen.filter(pm => smStationCodes.includes(pm.stationCode));

        const approvedCount = pmForTI.filter(p => p.approvalStatus === "Approved").length;
        const highRiskCount = pmForTI.filter(p => getPmRisk(p) === "High").length;

        return (
          <div className="user-management-page">
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                  Station Masters Management – {selectedTIForStationMasters.name}
                </h2>
                <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748b" }}>
                  Supervising operations in {selectedTIForStationMasters.jurisdiction} Division
                </p>
              </div>
              <button
                type="button"
                className="sm2-monitor-btn"
                onClick={() => {
                  setActivePage("Traffic Inspector");
                  setSelectedTIForStationMasters(null);
                }}
                style={{
                  backgroundColor: "#ffffff",
                  color: "#334155",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                â† Back to Traffic Inspectors
              </button>
            </div>

            {/* KPI Cards */}
            <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "24px", marginTop: "20px" }}>
              <div className="metric-card" onClick={() => setActivePage("Station Masters")} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 1px 3px rgba(15, 23, 42, 0.02)", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }} onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(37,99,235,0.15)"; e.currentTarget.style.borderColor = "#93c5fd"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(15,23,42,0.02)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Users size={24} />
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Station Masters</span>
                  <h3 style={{ margin: "2px 0 0 0", fontSize: "24px", fontWeight: "800", color: "#0f172a" }}>{smsForTI.length}</h3>
                </div>
              </div>
              <div className="metric-card" onClick={() => setActivePage("Pointsmen")} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 1px 3px rgba(15, 23, 42, 0.02)", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }} onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(239,68,68,0.15)"; e.currentTarget.style.borderColor = "#fca5a5"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(15,23,42,0.02)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#fef2f2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Users size={24} />
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Pointsman</span>
                  <h3 style={{ margin: "2px 0 0 0", fontSize: "24px", fontWeight: "800", color: "#0f172a" }}>{pmForTI.length}</h3>
                </div>
              </div>
              <div className="metric-card" onClick={() => setActivePage("Assessments")} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 1px 3px rgba(15, 23, 42, 0.02)", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }} onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(22,163,74,0.15)"; e.currentTarget.style.borderColor = "#86efac"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(15,23,42,0.02)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Approved Assessments</span>
                  <h3 style={{ margin: "2px 0 0 0", fontSize: "24px", fontWeight: "800", color: "#16a34a" }}>{approvedCount}</h3>
                </div>
              </div>
              <div className="metric-card" onClick={() => { setActivePage("Employee Management"); setEmpRiskFilter("High"); }} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 1px 3px rgba(15, 23, 42, 0.02)", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }} onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(234,88,12,0.15)"; e.currentTarget.style.borderColor = "#fdba74"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(15,23,42,0.02)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#fff7ed", color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>High Risk Staff</span>
                  <h3 style={{ margin: "2px 0 0 0", fontSize: "24px", fontWeight: "800", color: "#ea580c" }}>{highRiskCount}</h3>
                </div>
              </div>
            </div>

            <div className="users-list-container" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", boxShadow: "0 1px 3px rgba(15, 23, 42, 0.02)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "16px", paddingLeft: "8px" }}>Station Masters Directory</h3>
              <div className="users-table-wrapper" style={{ overflowX: "auto" }}>
                <div className="users-table" style={{ minWidth: "1000px" }}>
                  <div className="table-header" style={{
                    display: "grid",
                    gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr 1fr",
                    padding: "16px",
                    background: "linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)",
                    borderBottom: "1px solid #e2e8f0",
                    borderTopLeftRadius: "8px",
                    borderTopRightRadius: "8px",
                    color: "#475569",
                    fontWeight: "700",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    <div>Station Master</div>
                    <div>Station</div>
                    <div>Division</div>
                    <div>Category</div>
                    <div>Assessment</div>
                    <div>Risk Level</div>
                    <div style={{ textAlign: "right" }}>Action</div>
                  </div>

                  {smsForTI.length === 0 ? (
                    <div style={{ padding: "32px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
                      No Station Masters found under this Traffic Inspector.
                    </div>
                  ) : (
                    smsForTI.map((row, idx) => {
                      // Mocking risk and assessment for SM
                      const smRisk = idx % 3 === 0 ? "Medium" : "Low";
                      const smRiskColor = smRisk === "High" ? "#ef4444" : smRisk === "Medium" ? "#ea580c" : "#16a34a";
                      const smRiskBg = smRisk === "High" ? "#fef2f2" : smRisk === "Medium" ? "#fff7ed" : "#dcfce7";

                      const smAss = idx % 2 === 0 ? "Completed" : "Pending";
                      const smAssColor = smAss === "Completed" ? "#16a34a" : "#ca8a04";
                      const smAssBg = smAss === "Completed" ? "#dcfce7" : "#fef08a";

                      return (
                        <div key={row.id || row.name} className="table-row" style={{
                          display: "grid",
                          gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr 1fr",
                          padding: "16px",
                          borderBottom: "1px solid #e2e8f0",
                          alignItems: "center",
                          transition: "background 0.2s",
                          cursor: "default"
                        }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <div>
                            <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>{row.name}</div>
                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>ID: SM_{1000 + idx}</div>
                          </div>
                          <div>
                            <div style={{ fontWeight: "600", color: "#334155", fontSize: "13px" }}>{row.stationName}</div>
                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{row.stationCode}</div>
                          </div>
                          <div style={{ fontSize: "13px", color: "#475569", fontWeight: "500" }}>{row.division}</div>
                          <div>
                            <span style={{
                              background: "#f1f5f9",
                              color: "#475569",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                              border: "1px solid #e2e8f0"
                            }}>
                              {row.category}
                            </span>
                          </div>
                          <div>
                            <span style={{
                              background: smAssBg,
                              color: smAssColor,
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "700"
                            }}>
                              {smAss}
                            </span>
                          </div>
                          <div>
                            <span style={{
                              background: smRiskBg,
                              color: smRiskColor,
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "700",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}>
                              <span style={{ fontSize: "10px" }}>â—</span> {smRisk}
                            </span>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              onClick={() => handleStationMasterClick(row)}
                              style={{
                                background: "#eff6ff",
                                color: "#2563eb",
                                border: "1px solid #bfdbfe",
                                padding: "6px 16px",
                                borderRadius: "6px",
                                fontSize: "13px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#2563eb";
                                e.currentTarget.style.color = "#ffffff";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#eff6ff";
                                e.currentTarget.style.color = "#2563eb";
                              }}
                            >
                              View
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "Pointsman Under Station Master":
        if (!selectedSMForPointsmen) return null;

        // Find pointsmen under this station
        const stationPointsmen = aomPointsmen.filter(
          (pm) => pm.stationCode === selectedSMForPointsmen.stationCode
        );

        // Calculate KPI summaries
        const approvedCount = stationPointsmen.filter(p => p.approvalStatus === "Approved").length;
        const pendingCount = stationPointsmen.filter(p => p.approvalStatus === "Pending").length;
        const highRiskCount = stationPointsmen.filter(p => getPmRisk(p) === "High").length;

        // Apply filters
        const filteredStationPointsmen = stationPointsmen.filter((pm) => {
          const risk = getPmRisk(pm);
          const searchText = pointsmanSearchText.trim().toLowerCase();
          const matchesSearch =
            searchText.length === 0 ||
            pm.name.toLowerCase().includes(searchText) ||
            pm.hrmsId.toLowerCase().includes(searchText);

          const matchesRisk = pointsmanRiskFilter === "All" || risk === pointsmanRiskFilter;
          const matchesStatus = pointsmanStatusFilter === "All" || pm.approvalStatus === pointsmanStatusFilter;

          return matchesSearch && matchesRisk && matchesStatus;
        });

        return (
          <div className="user-management-page">
            {selectedPointsmanForMonitoring ? (
              renderPointsmanMonitoringDetail(selectedPointsmanForMonitoring)
            ) : (
              <>
                <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                      Pointsman Management – {selectedSMForPointsmen.stationName}
                    </h2>
                    <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748b" }}>
                      Operational directory under Station Master: <strong>{selectedSMForPointsmen.name}</strong> ({selectedSMForPointsmen.stationCode})
                    </p>
                  </div>
                  <button
                    type="button"
                    className="sm2-monitor-btn"
                    onClick={() => {
                      setActivePage("Station Masters");
                      setSelectedSMForPointsmen(null);
                    }}
                    style={{
                      backgroundColor: "#ffffff",
                      color: "#334155",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    â† Back to Station Masters
                  </button>
                </div>

                {/* KPI Cards */}
                <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "24px", marginTop: "20px" }}>
                  <div className="metric-card" onClick={() => setActivePage("Pointsmen")} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 1px 3px rgba(15, 23, 42, 0.02)", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }} onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(37,99,235,0.15)"; e.currentTarget.style.borderColor = "#93c5fd"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(15,23,42,0.02)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Users size={24} />
                    </div>
                    <div>
                      <span style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Pointsmen</span>
                      <h3 style={{ margin: "2px 0 0 0", fontSize: "24px", fontWeight: "800", color: "#0f172a" }}>{stationPointsmen.length}</h3>
                    </div>
                  </div>
                  <div className="metric-card" onClick={() => setActivePage("Assessments")} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 1px 3px rgba(15, 23, 42, 0.02)", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }} onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(22,163,74,0.15)"; e.currentTarget.style.borderColor = "#86efac"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(15,23,42,0.02)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <span style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Approved Staff</span>
                      <h3 style={{ margin: "2px 0 0 0", fontSize: "24px", fontWeight: "800", color: "#16a34a" }}>{approvedCount}</h3>
                    </div>
                  </div>
                  <div className="metric-card" onClick={() => setActivePage("Assessments")} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 1px 3px rgba(15, 23, 42, 0.02)", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }} onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(37,99,235,0.15)"; e.currentTarget.style.borderColor = "#93c5fd"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(15,23,42,0.02)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ClipboardCheck size={24} />
                    </div>
                    <div>
                      <span style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Pending Assessments</span>
                      <h3 style={{ margin: "2px 0 0 0", fontSize: "24px", fontWeight: "800", color: "#2563eb" }}>{pendingCount}</h3>
                    </div>
                  </div>
                  <div className="metric-card" onClick={() => { setActivePage("Employee Management"); setEmpRiskFilter("High"); }} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 1px 3px rgba(15, 23, 42, 0.02)", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }} onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(220,38,38,0.15)"; e.currentTarget.style.borderColor = "#fca5a5"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(15,23,42,0.02)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <span style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>High Risk Staff</span>
                      <h3 style={{ margin: "2px 0 0 0", fontSize: "24px", fontWeight: "800", color: "#dc2626" }}>{highRiskCount}</h3>
                    </div>
                  </div>
                </div>

                {/* Filter Toolbar */}
                <div className="station-action-bar chart-card" style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "20px", background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", marginTop: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                    <Search size={16} color="#64748b" />
                    <input
                      type="text"
                      className="users-table-search"
                      placeholder="Search by Pointsman Name / HRMS ID..."
                      value={pointsmanSearchText}
                      onChange={(e) => setPointsmanSearchText(e.target.value)}
                      style={{ flex: 1, border: "none", outline: "none", fontSize: "14px", background: "transparent" }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "12px" }}>
                    <select
                      value={pointsmanRiskFilter}
                      onChange={(e) => setPointsmanRiskFilter(e.target.value)}
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#334155",
                        background: "#ffffff"
                      }}
                    >
                      <option value="All">All Risk Levels</option>
                      <option value="Low">Low Risk</option>
                      <option value="Medium">Medium Risk</option>
                      <option value="High">High Risk</option>
                    </select>
                    <select
                      value={pointsmanStatusFilter}
                      onChange={(e) => setPointsmanStatusFilter(e.target.value)}
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#334155",
                        background: "#ffffff"
                      }}
                    >
                      <option value="All">All Approval Statuses</option>
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className="users-list-container">
                  <div className="users-table-wrapper">
                    <div className="users-table pointsman-list-table-wide">
                      <div className="table-header pointsman-list-table-cols">
                        <div>Sr No</div>
                        <div>Pointsman Name</div>
                        <div>HRMS ID</div>
                        <div>Grade / Category</div>
                        <div>Last Assessment Score</div>
                        <div>Last Assessed Date</div>
                        <div>Approval Status</div>
                        <div>Risk Level</div>
                        <div>Action</div>
                      </div>

                      {filteredStationPointsmen.length === 0 ? (
                        <div className="table-empty-state">No Pointsman staff found.</div>
                      ) : (
                        filteredStationPointsmen.map((pm, idx) => {
                          const cat = getPmCat(pm.lastScore);
                          const risk = getPmRisk(pm);
                          const isHighRisk = risk === "High";
                          const isMedRisk = risk === "Medium";

                          return (
                            <div
                              key={pm.id}
                              className="table-row pointsman-list-table-cols"
                              style={{ cursor: "default" }}
                            >
                              <div>{idx + 1}</div>
                              <div><strong>{pm.name}</strong></div>
                              <div>{pm.hrmsId}</div>
                              <div>
                                <span style={{
                                  background: cat === "A" ? "#dcfce7" : cat === "B" ? "#dbeafe" : cat === "C" ? "#fef3c7" : "#fee2e2",
                                  color: cat === "A" ? "#15803d" : cat === "B" ? "#1d4ed8" : cat === "C" ? "#b45309" : "#b91c1c",
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  fontWeight: "700",
                                  fontSize: "11px"
                                }}>Category {cat}</span>
                              </div>
                              <div><strong>{pm.lastScore}/100</strong></div>
                              <div>
                                {pm.hrmsId === "PM_1001" ? "2026-03-28" :
                                  pm.hrmsId === "PM_1102" ? "2026-03-10" :
                                    pm.hrmsId === "PM_1103" ? "2026-02-15" :
                                      pm.hrmsId === "PM_1104" ? "2026-03-18" :
                                        pm.hrmsId === "PM_1105" ? "2026-01-20" :
                                          pm.hrmsId === "PM_1106" ? "2026-03-05" :
                                            pm.hrmsId === "PM_1107" ? "2026-03-20" :
                                              pm.hrmsId === "PM_1108" ? "2026-02-01" : "—"}
                              </div>
                              <div>
                                <span className={`sm2-status-pill sm2-status-${pm.approvalStatus.toLowerCase()}`} style={{ display: "inline-block" }}>
                                  {pm.approvalStatus}
                                </span>
                              </div>
                              <div>
                                <span style={{
                                  background: isHighRisk ? "#fee2e2" : isMedRisk ? "#fef3c7" : "#dcfce7",
                                  color: isHighRisk ? "#b91c1c" : isMedRisk ? "#b45309" : "#15803d",
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  fontWeight: "700",
                                  fontSize: "11px"
                                }}>{risk}</span>
                              </div>
                              <div>
                                <button
                                  type="button"
                                  className="sm2-monitor-btn"
                                  onClick={() => {
                                    setSelectedPointsmanForMonitoring(pm);
                                  }}
                                  style={{
                                    backgroundColor: "#1d4ed8",
                                    color: "#ffffff",
                                    border: "none",
                                    padding: "6px 12px",
                                    fontSize: "12px",
                                    borderRadius: "6px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    boxShadow: "0 2px 4px rgba(29, 78, 216, 0.15)"
                                  }}
                                >
                                  Monitor
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <style>{`
                  .pointsman-list-table-wide {
                    min-width: 1000px;
                  }
                  .pointsman-list-table-cols {
                    display: grid;
                    grid-template-columns: 60px 1.5fr 1fr 1.2fr 1.3fr 1.3fr 1.2fr 1fr 100px;
                    align-items: center;
                    gap: 10px;
                  }
                `}</style>
              </>
            )}
          </div>
        );

      case "Add Station":
        return (
          <div className="user-management-page">
            <div className="add-user-title-wrap">
              <h2>ADD STATION</h2>
            </div>

            <div className="form-container structured-form-card">
              <form onSubmit={handleAddStationSubmit} className="user-form">
                {renderStationFormFields(false)}

                <div className="add-user-actions two-btn-actions">
                  <button type="button" className="action-btn" onClick={handleResetStationForm}>
                    Reset
                  </button>
                  <button type="submit" className="submit-btn">
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        );

      case "View / Edit Station":
        return (
          <div className="user-management-page">
            <div className="page-header">
              <h2>VIEW / EDIT STATION</h2>
            </div>

            <div className="form-container structured-form-card">
              <form onSubmit={handleUpdateStation} className="user-form">
                {renderStationFormFields(!isStationEditMode)}

                <div className="add-user-actions two-btn-actions">
                  <button type="button" className="action-btn" onClick={() => setActivePage("Station Management")}>
                    Back
                  </button>
                  {!isStationEditMode ? (
                    <button type="button" className="submit-btn" onClick={() => setIsStationEditMode(true)}>
                      Edit Station
                    </button>
                  ) : (
                    <button type="submit" className="submit-btn">
                      Update
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        );

      case "Traffic Inspector":
        return (
          <div className="user-management-page">
            <div className="page-header">
              <h2>TRAFFIC INSPECTOR MANAGEMENT</h2>
            </div>

            <div className="chart-card ti-top-search">
              <label htmlFor="ti-top-search-input">Search (Name / HRMS ID)</label>
              <div className="ti-top-search-input-wrap">
                <Search size={16} />
                <input
                  id="ti-top-search-input"
                  type="text"
                  placeholder="Type name or HRMS ID"
                  value={tiSearch}
                  onChange={(e) => setTiSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="users-list-container">
              <div className="users-table-wrapper">
                <div className="users-table ti-table-wide">
                  <div className="table-header ti-table-cols">
                    <div>Name</div>
                    <div>Employee ID</div>
                    <div>Jurisdiction</div>
                    <div>Category</div>
                    <div>Assessment Status</div>
                    <div>Actions</div>
                  </div>

                  {filteredTrafficInspectors.length === 0 ? (
                    <div className="table-empty-state">No Traffic Inspectors found.</div>
                  ) : (
                    filteredTrafficInspectors.map((row) => (
                      <div key={row.id} className="table-row ti-table-cols">
                        <div>
                          <button type="button" className="ti-name-link" onClick={() => handleOpenTiProfile(row.id)}>
                            {row.name}
                          </button>
                        </div>
                        <div>{row.employeeId}</div>
                        <div>{row.jurisdiction}</div>
                        <div>{renderCategoryBadge(row.category)}</div>
                        <div>
                          <span className={row.assessmentStatus === "Completed" ? "status-active-pill" : "status-inactive-pill"}>
                            {row.assessmentStatus}
                          </span>
                        </div>
                        <div className="table-action-cell ti-actions-cell">
                          <button type="button" className="action-btn" onClick={() => handleTiViewClick(row)}>
                            View
                          </button>
                          <button
                            type="button"
                            className="action-btn"
                            style={{
                              background: localStorage.getItem("ti_exam_assigned") === "true" ? "#16a34a" : "#2563eb",
                              color: "#fff",
                              fontWeight: "600"
                            }}
                            onClick={() => {
                              const currentStatus = localStorage.getItem("ti_exam_assigned") === "true";
                              if (currentStatus) {
                                localStorage.removeItem("ti_exam_assigned");
                                alert(`Exam recalled for Traffic Inspector ${row.name || ""}.`);
                                setTrafficInspectors(prev => prev.map(ti => ti.id === row.id ? { ...ti, assessmentStatus: "Pending" } : ti));
                              } else {
                                localStorage.setItem("ti_exam_assigned", "true");
                                alert(`Exam assigned and sent to Traffic Inspector ${row.name || ""}.`);
                                setTrafficInspectors(prev => prev.map(ti => ti.id === row.id ? { ...ti, assessmentStatus: "In Progress" } : ti));
                              }
                              window.dispatchEvent(new Event("storage"));
                            }}
                          >
                            {localStorage.getItem("ti_exam_assigned") === "true" ? "Exam Sent âœ“" : "Send Exam"}
                          </button>
                          <button type="button" className="action-btn action-edit" onClick={() => handleOpenLinkTi(row.id)}>
                            Link Stations & SMs
                          </button>
                          <div className="ti-shift-inline">
                            <select
                              value={tiShiftDrafts[row.id] || ""}
                              onChange={(e) =>
                                setTiShiftDrafts((prev) => ({
                                  ...prev,
                                  [row.id]: e.target.value
                                }))
                              }
                            >
                              <option value="">Shift to...</option>
                              {stationDivisionOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                            <button type="button" className="action-btn" onClick={() => handleShiftTi(row.id)}>
                              <ArrowRightLeft size={14} />
                              Shift
                            </button>
                          </div>
                          <button type="button" className="action-btn action-delete" onClick={() => handleRemoveTi(row.id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>



            {linkTargetTi && (
              <div className="chart-card ti-link-card">
                <div className="ti-profile-header">
                  <h3>Link {linkTargetTi.name} to Stations & SMs</h3>
                  <button
                    type="button"
                    className="action-btn"
                    onClick={() => {
                      setTiLinkTargetId(null);
                      setTiLinkDraft({ stations: [], sms: [] });
                    }}
                  >
                    Close
                  </button>
                </div>

                <div className="ti-link-grid">
                  <div className="ti-link-block">
                    <h4>Stations</h4>
                    {stationLinkOptions.map((stationName) => (
                      <label key={stationName} className="ti-link-option">
                        <input
                          type="checkbox"
                          checked={tiLinkDraft.stations.includes(stationName)}
                          onChange={() => toggleMultiValue("stations", stationName)}
                        />
                        <span>{stationName}</span>
                      </label>
                    ))}
                  </div>

                  <div className="ti-link-block">
                    <h4>Station Masters</h4>
                    {smLinkOptions.map((smName) => (
                      <label key={smName} className="ti-link-option">
                        <input
                          type="checkbox"
                          checked={tiLinkDraft.sms.includes(smName)}
                          onChange={() => toggleMultiValue("sms", smName)}
                        />
                        <span>{smName}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="add-user-actions">
                  <button type="button" className="submit-btn" onClick={handleSaveTiLinks}>
                    Save Links
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case "User Management": {
        const uniqueStationsList = Array.from(new Set(DASHBOARD_96_STATIONS.map(s => s.stationName))).sort();

        return (
          <div className="user-management-page">
            <div className="add-user-title-wrap" style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
              <div style={{
                background: "linear-gradient(135deg, #0d2c4d 0%, #1e40af 100%)",
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(13, 44, 77, 0.2)",
                color: "#ffffff"
              }}>
                <UserPlus size={28} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0d2c4d", letterSpacing: "-0.5px" }}>ADD NEW SYSTEM USER</h2>
                <p className="subtitle-text" style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                  Role-Based Operational Staff Provisioning & Management Console
                </p>
              </div>
            </div>

            <div className="form-container structured-form-card">
              <form onSubmit={handleSubmitUser} className="user-form">

                {/* Field Group 1: General & Contact Info */}
                <div className="form-section-header">
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
                    1. General & Contact Information
                  </h4>
                  <div className="section-divider" style={{ height: '1px', background: '#d5dfeb', marginBottom: '16px' }}></div>
                </div>

                <div className="add-user-grid">
                  <div className="add-user-col">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        name="employeeName"
                        value={userFormData.employeeName}
                        onChange={handleUserFormChange}
                        placeholder="Enter full name (e.g. A. K. Sharma)"
                        className={formErrors.employeeName ? "error" : ""}
                      />
                      {formErrors.employeeName && <span className="error-text">{formErrors.employeeName}</span>}
                    </div>

                    <div className="form-group">
                      <label>HRMS ID / Employee ID *</label>
                      <input
                        type="text"
                        name="hrmsId"
                        value={userFormData.hrmsId}
                        onChange={handleUserFormChange}
                        placeholder="Enter unique ID (e.g. PM_8820)"
                        className={formErrors.hrmsId ? "error" : ""}
                      />
                      {formErrors.hrmsId && <span className="error-text">{formErrors.hrmsId}</span>}
                    </div>
                  </div>

                  <div className="add-user-col">
                    <div className="form-group">
                      <label>Mobile Number *</label>
                      <input
                        type="text"
                        name="mobileNo"
                        value={userFormData.mobileNo}
                        onChange={handleUserFormChange}
                        placeholder="Enter 10-digit mobile number"
                        className={formErrors.mobileNo ? "error" : ""}
                      />
                      {formErrors.mobileNo && <span className="error-text">{formErrors.mobileNo}</span>}
                    </div>

                    <div className="form-group">
                      <label>Email ID *</label>
                      <input
                        type="email"
                        name="emailId"
                        value={userFormData.emailId}
                        onChange={handleUserFormChange}
                        placeholder="Enter email address (e.g. user@rail.in)"
                        className={formErrors.emailId ? "error" : ""}
                      />
                      {formErrors.emailId && <span className="error-text">{formErrors.emailId}</span>}
                    </div>
                  </div>
                </div>

                {/* Field Group 2: Designation & Station Placement */}
                <div className="form-section-header" style={{ marginTop: '24px' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
                    2. Designation & Station Placement Setup
                  </h4>
                  <div className="section-divider" style={{ height: '1px', background: '#d5dfeb', marginBottom: '16px' }}></div>
                </div>

                <div className="add-user-grid">
                  <div className="add-user-col">
                    <div className="form-group">
                      <label>Role / Designation *</label>
                      <select
                        name="designation"
                        value={userFormData.designation}
                        onChange={handleUserFormChange}
                        className={formErrors.designation ? "error" : ""}
                      >
                        <option value="">Select Role</option>
                        {designationOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {formErrors.designation && <span className="error-text">{formErrors.designation}</span>}
                    </div>

                    <div className="form-group">
                      <label>Railway Zone *</label>
                      <select
                        name="zone"
                        value={userFormData.zone}
                        onChange={handleUserFormChange}
                        className={formErrors.zone ? "error" : ""}
                      >
                        <option value="">Select Zone</option>
                        {stationZoneOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {formErrors.zone && <span className="error-text">{formErrors.zone}</span>}
                    </div>
                  </div>

                  <div className="add-user-col">
                    <div className="form-group">
                      <label>Division *</label>
                      <select
                        name="division"
                        value={userFormData.division}
                        onChange={handleUserFormChange}
                        className={formErrors.division ? "error" : ""}
                      >
                        <option value="">Select Division</option>
                        {stationDivisionOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {formErrors.division && <span className="error-text">{formErrors.division}</span>}
                    </div>

                    <div className="form-group">
                      <label>Station Name *</label>
                      <select
                        name="stationName"
                        value={userFormData.stationName}
                        onChange={handleUserFormChange}
                        className={formErrors.stationName ? "error" : ""}
                      >
                        <option value="">Select Station</option>
                        {uniqueStationsList.map((station) => (
                          <option key={station} value={station}>
                            {station}
                          </option>
                        ))}
                      </select>
                      {formErrors.stationName && <span className="error-text">{formErrors.stationName}</span>}
                    </div>
                  </div>
                </div>

                {/* Field Group 3: Dynamic Role-Based Custom Operational Profile */}
                {userFormData.designation === "Pointsman" && (
                  <div className="role-specific-section pointsman-box animate-fade-in" style={{ marginTop: '24px', padding: '18px', background: '#f0f7ff', border: '1px solid #c2e0ff', borderRadius: '10px' }}>
                    <div className="form-section-header">
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                        Pointsman Operational Setup
                      </h4>
                      <div className="section-divider" style={{ height: '1px', backgroundColor: '#c2e0ff', marginBottom: '16px' }}></div>
                    </div>
                    <div className="add-user-grid">
                      <div className="add-user-col">
                        <div className="form-group">
                          <label>Reporting Station Master *</label>
                          <input
                            type="text"
                            name="reportingSm"
                            value={userFormData.reportingSm}
                            onChange={handleUserFormChange}
                            placeholder="Station Master Name"
                            className={formErrors.reportingSm ? "error" : ""}
                          />
                          {formErrors.reportingSm && <span className="error-text">{formErrors.reportingSm}</span>}
                        </div>
                        <div className="form-group">
                          <label>Work Location Setup *</label>
                          <select
                            name="workLocation"
                            value={userFormData.workLocation}
                            onChange={handleUserFormChange}
                            className={formErrors.workLocation ? "error" : ""}
                          >
                            <option value="">Select Location</option>
                            <option value="Yard">Yard Area</option>
                            <option value="Cabin A">Cabin A</option>
                            <option value="Cabin B">Cabin B</option>
                            <option value="Platform Area">Platform Area</option>
                            <option value="Level Crossing Gate">Level Crossing Gate</option>
                          </select>
                          {formErrors.workLocation && <span className="error-text">{formErrors.workLocation}</span>}
                        </div>
                      </div>
                      <div className="add-user-col">
                        <div className="form-group">
                          <label>Assigned Shift *</label>
                          <select
                            name="shift"
                            value={userFormData.shift}
                            onChange={handleUserFormChange}
                            className={formErrors.shift ? "error" : ""}
                          >
                            <option value="">Select Shift</option>
                            <option value="Morning Shift (06:00 - 14:00)">Morning Shift (06:00 - 14:00)</option>
                            <option value="Evening Shift (14:00 - 22:00)">Evening Shift (14:00 - 22:00)</option>
                            <option value="Night Shift (22:00 - 06:00)">Night Shift (22:00 - 06:00)</option>
                            <option value="General Shift (09:00 - 18:00)">General Shift (09:00 - 18:00)</option>
                          </select>
                          {formErrors.shift && <span className="error-text">{formErrors.shift}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {userFormData.designation === "Station Master" && (
                  <div className="role-specific-section sm-box animate-fade-in" style={{ marginTop: '24px', padding: '18px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px' }}>
                    <div className="form-section-header">
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                        Station Master Operational Setup
                      </h4>
                      <div className="section-divider" style={{ height: '1px', backgroundColor: '#a7f3d0', marginBottom: '16px' }}></div>
                    </div>
                    <div className="add-user-grid">
                      <div className="add-user-col">
                        <div className="form-group">
                          <label>Operational Station *</label>
                          <select
                            name="smStation"
                            value={userFormData.smStation}
                            onChange={handleUserFormChange}
                            className={formErrors.smStation ? "error" : ""}
                          >
                            <option value="">Select Operational Station</option>
                            {uniqueStationsList.map((station) => (
                              <option key={station} value={station}>
                                {station}
                              </option>
                            ))}
                          </select>
                          {formErrors.smStation && <span className="error-text">{formErrors.smStation}</span>}
                        </div>
                        <div className="form-group">
                          <label>Operational Zone *</label>
                          <select
                            name="smZone"
                            value={userFormData.smZone}
                            onChange={handleUserFormChange}
                            className={formErrors.smZone ? "error" : ""}
                          >
                            <option value="">Select Zone</option>
                            {stationZoneOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          {formErrors.smZone && <span className="error-text">{formErrors.smZone}</span>}
                        </div>
                      </div>
                      <div className="add-user-col">
                        <div className="form-group">
                          <label>Operational Division *</label>
                          <select
                            name="smDivision"
                            value={userFormData.smDivision}
                            onChange={handleUserFormChange}
                            className={formErrors.smDivision ? "error" : ""}
                          >
                            <option value="">Select Division</option>
                            {stationDivisionOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          {formErrors.smDivision && <span className="error-text">{formErrors.smDivision}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {userFormData.designation === "Traffic Inspector" && (
                  <div className="role-specific-section ti-box animate-fade-in" style={{ marginTop: '24px', padding: '18px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px' }}>
                    <div className="form-section-header">
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                        Traffic Inspector Operational Setup
                      </h4>
                      <div className="section-divider" style={{ height: '1px', backgroundColor: '#fde68a', marginBottom: '16px' }}></div>
                    </div>
                    <div className="add-user-grid">
                      <div className="add-user-col">
                        <div className="form-group">
                          <label>Jurisdiction Division *</label>
                          <input
                            type="text"
                            name="jurisdiction"
                            value={userFormData.jurisdiction}
                            onChange={handleUserFormChange}
                            placeholder="Enter Jurisdiction (e.g. Nagpur Division)"
                            className={formErrors.jurisdiction ? "error" : ""}
                          />
                          {formErrors.jurisdiction && <span className="error-text">{formErrors.jurisdiction}</span>}
                        </div>
                        <div className="form-group">
                          <label>Reporting AOM *</label>
                          <select
                            name="reportingAom"
                            value={userFormData.reportingAom}
                            onChange={handleUserFormChange}
                            className={formErrors.reportingAom ? "error" : ""}
                          >
                            <option value="">Select AOM</option>
                            <option value="A. K. Sinha (AOM/G)">A. K. Sinha (AOM/G)</option>
                            <option value="M. K. Nair (AOM/Safety)">M. K. Nair (AOM/Safety)</option>
                            <option value="R. S. Prasad (AOM/Chg)">R. S. Prasad (AOM/Chg)</option>
                            <option value="P. K. Verma (Sr. DOM)">P. K. Verma (Sr. DOM)</option>
                          </select>
                          {formErrors.reportingAom && <span className="error-text">{formErrors.reportingAom}</span>}
                        </div>
                      </div>
                      <div className="add-user-col">
                        <div className="form-group">
                          <label>Linked Stations under supervision *</label>
                          <input
                            type="text"
                            name="linkedStations"
                            value={userFormData.linkedStations}
                            onChange={handleUserFormChange}
                            placeholder="E.g. Nagpur Main, Wardha Jn, Sewagram"
                            className={formErrors.linkedStations ? "error" : ""}
                          />
                          {formErrors.linkedStations && <span className="error-text">{formErrors.linkedStations}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="add-user-actions" style={{ marginTop: '24px' }}>
                  <button type="submit" className="submit-btn" style={{ padding: '12px 36px', fontSize: '14px' }}>
                    {editingUserId ? "ðŸ”’ UPDATE USER ACCOUNT" : "ðŸ‘¤ ADD USER ACCOUNT"}
                  </button>
                </div>
              </form>
            </div>

            <div className="users-filter-section chart-card">
              <form className="filter-grid" onSubmit={handleFilterSubmit}>
                <div className="form-group">
                  <label>Mobile No</label>
                  <input
                    type="text"
                    name="mobileNo"
                    value={pendingFilters.mobileNo}
                    onChange={handleFilterChange}
                    placeholder="Filter by mobile"
                  />
                </div>
                <div className="form-group">
                  <label>Designation</label>
                  <select name="designation" value={pendingFilters.designation} onChange={handleFilterChange}>
                    <option value="">All Designations</option>
                    {designationOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>HRMS ID</label>
                  <input
                    type="text"
                    name="hrmsId"
                    value={pendingFilters.hrmsId}
                    onChange={handleFilterChange}
                    placeholder="Filter by HRMS ID"
                  />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select name="department" value={pendingFilters.department} onChange={handleFilterChange}>
                    <option value="">All Departments</option>
                    {departmentOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>User Type</label>
                  <select name="userType" value={pendingFilters.userType} onChange={handleFilterChange}>
                    <option value="">All User Types</option>
                    {userTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-submit-wrap">
                  <button type="submit" className="submit-btn">Search / Submit</button>
                </div>
              </form>
            </div>

            <div className="users-list-container">
              <div className="users-table-toolbar">
                <h3>System User Directory</h3>
                <input
                  type="text"
                  className="users-table-search"
                  placeholder="Search users..."
                  value={tableSearch}
                  onChange={(e) => {
                    setTableSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="users-table-wrapper">
                <div className="users-table users-table-wide" style={{ minWidth: '1280px' }}>
                  <div className="table-header" style={{ display: 'grid', gridTemplateColumns: '60px 1.8fr 1.2fr 1.8fr 1.5fr 1.2fr 3fr' }}>
                    <div>Sr No</div>
                    <div>Employee Profile</div>
                    <div>Designation</div>
                    <div>Appointed</div>
                    <div>Contact Info</div>
                    <div>Account Status</div>
                    <div style={{ textAlign: 'center' }}>Actions</div>
                  </div>

                  {pagedUsers.length === 0 ? (
                    <div className="table-empty-state">No user accounts match criteria.</div>
                  ) : (
                    pagedUsers.map((row, idx) => (
                      <div key={row.id} className="table-row" style={{ display: 'grid', gridTemplateColumns: '60px 1.8fr 1.2fr 1.8fr 1.5fr 1.2fr 3fr', alignItems: 'center' }}>
                        <div>{(currentPage - 1) * pageSize + idx + 1}</div>
                        <div>
                          <button
                            type="button"
                            className="ti-name-link"
                            onClick={() => setSelectedUserProfile(row)}
                            style={{ display: 'block', textDecoration: 'underline', color: '#0d2c4d', fontSize: '13px', fontWeight: '800' }}
                          >
                            {row.employeeName}
                          </button>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>HRMS: {row.hrmsId}</span>
                        </div>
                        <div>
                          <span style={{ padding: '4px 8px', borderRadius: '4px', background: row.designation === "Pointsman" ? '#eff6ff' : row.designation === "Station Master" ? '#ecfdf5' : '#fffbeb', color: row.designation === "Pointsman" ? '#1d4ed8' : row.designation === "Station Master" ? '#047857' : '#b45309', fontWeight: '700', fontSize: '11px' }}>
                            {row.designation}
                          </span>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '500' }}>{row.stationName}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{row.division} / {row.zone === "Central Railway" ? "CR" : row.zone}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px' }}>{row.mobileNo}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{row.emailId || "No Email"}</div>
                        </div>
                        <div>
                          <button
                            type="button"
                            className={row.status === "Inactive" ? "status-inactive-pill" : "status-active-pill"}
                            onClick={() => {
                              setUsers((prev) =>
                                prev.map((u) =>
                                  u.id === row.id
                                    ? { ...u, status: u.status === "Inactive" ? "Active" : "Inactive" }
                                    : u
                                )
                              );
                            }}
                            style={{ cursor: 'pointer', border: '0', fontSize: '11px', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}
                          >
                            {row.status || "Active"}
                          </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <button type="button" className="action-btn" onClick={() => setSelectedUserProfile(row)}>
                            Profile
                          </button>

                          <button type="button" className="action-btn action-edit" onClick={() => handleEditUser(row.id)}>
                            Edit
                          </button>

                          <div className="ti-shift-inline" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <select
                              value={userShiftDrafts[row.id] || ""}
                              onChange={(e) =>
                                setUserShiftDrafts((prev) => ({
                                  ...prev,
                                  [row.id]: e.target.value
                                }))
                              }
                              style={{ height: '30px', border: '1px solid #d1dce8', borderRadius: '6px', fontSize: '11px', padding: '0 4px', background: '#fff' }}
                            >
                              <option value="">Shift Div...</option>
                              {stationDivisionOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="action-btn"
                              onClick={() => {
                                const newDiv = userShiftDrafts[row.id];
                                if (!newDiv) {
                                  alert("Please select a division to shift.");
                                  return;
                                }
                                setUsers((prev) =>
                                  prev.map((u) =>
                                    u.id === row.id
                                      ? {
                                        ...u,
                                        division: newDiv,
                                        smDivision: newDiv,
                                        jurisdiction: newDiv + " Division"
                                      }
                                      : u
                                  )
                                );
                                alert(`Successfully shifted ${row.employeeName} to ${newDiv} Division.`);
                              }}
                              style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '4px 8px' }}
                            >
                              <ArrowRightLeft size={12} />
                              Shift
                            </button>
                          </div>

                          <button type="button" className="action-btn action-delete" onClick={() => handleDeleteUser(row.id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="table-pagination-wrap">
                <button type="button" className="pagination-btn" onClick={goToPrevPage} disabled={currentPage === 1}>
                  Prev
                </button>
                <span className="pagination-text">
                  Page {currentPage} of {totalPages}
                </span>
                <button type="button" className="pagination-btn" onClick={goToNextPage} disabled={currentPage === totalPages}>
                  Next
                </button>
              </div>
            </div>

            {/* Premium User Profile View Detail Card */}
            {selectedUserProfile && (
              <div className="chart-card ti-profile-card animate-fade-in" style={{ marginTop: '20px', borderTop: '4px solid #0d2c4d', backgroundColor: '#fcfdfe' }}>
                <div className="ti-profile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#0d2c4d', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: '800', fontSize: '16px' }}>
                      {selectedUserProfile.employeeName?.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '800', color: '#0d2c4d' }}>
                        {selectedUserProfile.employeeName}
                      </h3>
                      <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>HRMS ID: {selectedUserProfile.hrmsId} | Department: {selectedUserProfile.department || "Operations"}</p>
                    </div>
                  </div>
                  <button type="button" className="action-btn" onClick={() => setSelectedUserProfile(null)} style={{ background: '#64748b', color: '#fff' }}>
                    Close Profile
                  </button>
                </div>

                <div className="ti-profile-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', padding: '15px 0' }}>
                  <div><strong>Designation:</strong> <span style={{ color: '#1d4ed8', fontWeight: '700' }}>{selectedUserProfile.designation}</span></div>
                  <div><strong>Mobile No:</strong> {selectedUserProfile.mobileNo}</div>
                  <div><strong>Email ID:</strong> {selectedUserProfile.emailId || "N/A"}</div>
                  <div><strong>Account Status:</strong> <span style={{ color: selectedUserProfile.status === "Inactive" ? '#ef4444' : '#10b981', fontWeight: '700' }}>{selectedUserProfile.status || "Active"}</span></div>

                  <div><strong>Current Zone:</strong> {selectedUserProfile.zone || "N/A"}</div>
                  <div><strong>Current Division:</strong> {selectedUserProfile.division || "N/A"}</div>
                  <div><strong>Current Station:</strong> {selectedUserProfile.stationName || "N/A"}</div>
                  <div><strong>Reporting Officer:</strong> {selectedUserProfile.reportingOfficer || "N/A"}</div>
                </div>

                {/* Role Specific details */}
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#0f172a', fontWeight: '800' }}>Operational Profile Specifications</h4>

                  {selectedUserProfile.designation === "Pointsman" && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '13px' }}>
                      <div><strong>Reporting Station Master:</strong> {selectedUserProfile.reportingSm || "N/A"}</div>
                      <div><strong>Assigned Shift:</strong> {selectedUserProfile.shift || "N/A"}</div>
                      <div><strong>Work Location Setup:</strong> {selectedUserProfile.workLocation || "N/A"}</div>
                    </div>
                  )}

                  {selectedUserProfile.designation === "Station Master" && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '13px' }}>
                      <div><strong>Operational Station:</strong> {selectedUserProfile.smStation || selectedUserProfile.stationName || "N/A"}</div>
                      <div><strong>Operational Division:</strong> {selectedUserProfile.smDivision || selectedUserProfile.division || "N/A"}</div>
                      <div><strong>Operational Zone:</strong> {selectedUserProfile.smZone || selectedUserProfile.zone || "N/A"}</div>
                    </div>
                  )}

                  {selectedUserProfile.designation === "Traffic Inspector" && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '13px' }}>
                      <div><strong>Jurisdiction Division:</strong> {selectedUserProfile.jurisdiction || "N/A"}</div>
                      <div><strong>Reporting AOM Officer:</strong> {selectedUserProfile.reportingAom || "N/A"}</div>
                      <div style={{ gridColumn: 'span 3', marginTop: '5px' }}><strong>Linked Stations under supervision:</strong> {selectedUserProfile.linkedStations || "N/A"}</div>
                    </div>
                  )}

                  {!["Pointsman", "Station Master", "Traffic Inspector"].includes(selectedUserProfile.designation) && (
                    <span style={{ fontSize: '13px', color: '#64748b' }}>No dynamic operational specifications required for this designation.</span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      }

      case "Pending Approvals": {
        const getEmployeeName = (empLine) => {
          if (!empLine) return "—";
          const match = empLine.match(/Employee:\s*([^|]+)/i);
          return match ? match[1].trim() : empLine;
        };
        const getDivision = (empLine) => {
          if (!empLine) return "—";
          const match = empLine.match(/Division:\s*(.+)/i);
          return match ? match[1].trim() : "—";
        };
        const getAssessedBy = (byLine) => {
          if (!byLine) return "—";
          const match = byLine.match(/(?:Assessed by|Awaiting):\s*([^-]+)/i);
          return match ? match[1].trim() : byLine;
        };
        const getPendingSince = (byLine) => {
          if (!byLine) return "—";
          const match = byLine.match(/on\s+(\d{4}-\d{2}-\d{2})/i);
          return match ? match[1].trim() : "2026-04-12";
        };
        const getDesignation = (title) => {
          if (!title) return "—";
          return title.split(" - ")[0] || "Employee";
        };

        const handleViewDetails = (item) => {
          const tab = resolveAssessmentTab(item.title);
          setAssessmentRoleTab(tab);
          setOpenAssessmentId(item.id);
          setActivePage("Assessments");
        };

        return (
          <div className="reports-page">
            <div className="page-header" style={{ marginBottom: "20px" }}>
              <h2>Pending Approval Requests</h2>
              <p>Review safety and performance metrics, then approve or reject pending evaluations.</p>
            </div>

            {assessmentActionNotice && (
              <div className="notice-card success" style={{ marginBottom: "16px", padding: "12px 16px" }}>
                <span>âœ“</span>
                <p><strong>System Action:</strong> {assessmentActionNotice}</p>
                <button
                  type="button"
                  onClick={() => setAssessmentActionNotice("")}
                  style={{ marginLeft: "auto", background: "none", border: "none", color: "#16a34a", cursor: "pointer", fontWeight: "bold" }}
                >
                  âœ•
                </button>
              </div>
            )}

            <div className="reports-container">
              <div className="reports-table-section">
                <h3>Awaiting Sign-Off ({pendingAssessments.length})</h3>
                <div style={{ overflowX: "auto" }}>
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>HRMS ID</th>
                        <th>Employee Details</th>
                        <th>Designation</th>
                        <th>Submitted Score</th>
                        <th>Submitted By</th>
                        <th>Pending Since</th>
                        <th style={{ textAlign: "center" }}>Approval Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingAssessments.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                            No pending assessments require approval at this time.
                          </td>
                        </tr>
                      ) : (
                        pendingAssessments.map((item) => {
                          const { score, grade } = computeScoreAndGrade(item);
                          const empName = getEmployeeName(item.employeeLine);
                          const division = getDivision(item.employeeLine);
                          const designation = getDesignation(item.title);
                          const assessedBy = getAssessedBy(item.assessedByLine);
                          const pendingSince = getPendingSince(item.assessedByLine);

                          return (
                            <tr key={item.id}>
                              <td><strong>{item.id}</strong></td>
                              <td>
                                <div style={{ fontWeight: 600, color: "#0f172a" }}>{empName}</div>
                                <div style={{ fontSize: "11px", color: "#64748b" }}>Division: {division}</div>
                              </td>
                              <td>
                                <span style={{
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                  backgroundColor: "#f1f5f9",
                                  color: "#475569",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  textTransform: "uppercase"
                                }}>
                                  {designation}
                                </span>
                              </td>
                              <td>
                                <strong style={{ color: score >= 90 ? "#16a34a" : score >= 80 ? "#2563eb" : "#dc2626" }}>
                                  {score}/100
                                </strong>
                                <span style={{
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  backgroundColor: "#eff6ff",
                                  color: "#2563eb",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  marginLeft: "6px"
                                }}>
                                  Grade {grade}
                                </span>
                              </td>
                              <td>{assessedBy}</td>
                              <td>{pendingSince}</td>
                              <td>
                                <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                                  <button
                                    type="button"
                                    className="sm2-monitor-btn"
                                    onClick={() => handleViewDetails(item)}
                                    style={{
                                      backgroundColor: "#eff6ff",
                                      color: "#2563eb",
                                      border: "1px solid #bfdbfe",
                                      padding: "6px 12px",
                                      fontSize: "12px"
                                    }}
                                  >
                                    View Details
                                  </button>
                                  <button
                                    type="button"
                                    className="sm2-monitor-btn"
                                    onClick={() => handleApproveAssessment(item.id)}
                                    style={{
                                      backgroundColor: "#f0fdf4",
                                      color: "#16a34a",
                                      border: "1px solid #bbf7d0",
                                      padding: "6px 12px",
                                      fontSize: "12px"
                                    }}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    className="sm2-monitor-btn"
                                    onClick={() => handleRejectAssessment(item.id)}
                                    style={{
                                      backgroundColor: "#fef2f2",
                                      color: "#dc2626",
                                      border: "1px solid #fecaca",
                                      padding: "6px 12px",
                                      fontSize: "12px"
                                    }}
                                  >
                                    Reject
                                  </button>
                                </div>
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
          </div>
        );
      }

      case "Assessments": {
        // We resolve if there's an active assessment open (Level 3 - Form View)
        // If openAssessmentId is NOT null, activeAssessment is the item in pendingAssessments (or approvedAssessments)
        const activeAssessment = pendingAssessments.find((item) => item.id === openAssessmentId) ||
          approvedAssessments.find((item) => item.id === openAssessmentId) || null;

        if (activeAssessment) {
          // Render Level 3: Structured Evaluation Form View!
          const activeAnswers = answersByAssessment[activeAssessment.id] || buildPrefilledAnswers(activeAssessment.title);
          const liveScore = calculateAssessmentScore(activeAnswers, true);

          // Map to TI employee info
          const tiEmployee = trafficInspectors.find(t => t.employeeId === activeAssessment.id);
          const name = tiEmployee ? tiEmployee.name : (activeAssessment.employeeLine?.match(/Employee:\s*([^|]+)/i)?.[1]?.trim() || "Traffic Inspector");
          const hrmsId = activeAssessment.id;
          const division = tiEmployee ? tiEmployee.division : (activeAssessment.employeeLine?.match(/Division:\s*(.+)/i)?.[1]?.trim() || "Nagpur");

          const isApproved = approvedAssessments.some(a => a.id === activeAssessment.id);
          const locked = isApproved;

          let ynScore = 0;
          assessmentCriteria.forEach(sec => {
            if (sec.key !== "knowledgeOfRules") {
              ynScore += getTiSectionScore(sec.key, activeAnswers);
            }
          });
          const isAlcoholic = activeAnswers.alcoholicStatus === "Alcoholic";
          const liveCat = isAlcoholic ? "D" : (liveScore >= 90 ? "A" : liveScore >= 80 ? "B" : "C");

          const CAT_B = { A: "#dcfce7", B: "#eff6ff", C: "#fff7ed", D: "#fef2f2" };
          const CAT_C = { A: "#16a34a", B: "#2563eb", C: "#ea580c", D: "#dc2626" };

          const checklistDetails = {
            alertnessAndObservation: [
              "Maintains high situational awareness during station safety audits",
              "Monitors and corrects hand signaling compliance among pointsmen",
              "Inspects station master cabins for correct block instrument procedures"
            ],
            safetyRecord: [
              "No active safety violation reports or warnings on personal record",
              "Proactively reports and documents track and signaling safety defects"
            ],
            leadershipAndManagement: [
              "Conducts regular safety counseling sessions for supervised station staff",
              "Resolves operational bottlenecks efficiently during duty shifts"
            ],
            discipline: [
              "Adheres strictly to official inspection rosters and schedules",
              "Maintains up-to-date and accurate inspection logbooks"
            ],
            appearanceAndNeatness: [
              "Wears prescribed uniform, cap, and badges during active duty hours",
              "Exhibits neat, professional, and highly disciplined personal conduct"
            ]
          };

          const isActivated = localStorage.getItem(`ti_exam_assigned_${activeAssessment.id}`) === "true";
          const isMcqCompleted = localStorage.getItem(`ti_exam_taken_${activeAssessment.id}`) === "true";
          const knowledge = isMcqCompleted ? 25 : 0;

          return (
            <section className="sm2-card animate-fade-in" style={{ padding: "24px" }}>
              {/* Header */}
              <div className="sm2-card-hdr" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                    Assessment — {name}
                  </h2>
                  <p style={{ margin: "4px 0 0 0", fontSize: "12.5px", color: "#64748b" }}>
                    {hrmsId} Â· {division} Division
                  </p>
                </div>
                <button
                  className="sm2-ghost-btn"
                  style={{ display: "flex", alignItems: "center", gap: "6px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", color: "#475569" }}
                  onClick={() => setOpenAssessmentId(null)}
                >
                  â† Back
                </button>
              </div>

              {assessmentActionNotice && (
                <div className="assessment-action-notice" style={{ marginBottom: "16px", padding: "10px 14px", background: "#e8f5e9", border: "1px solid #c8e6c9", color: "#1b5e20", borderRadius: "6px", fontSize: "13px", fontWeight: "600" }}>
                  {assessmentActionNotice}
                </div>
              )}

              {/* â”€â”€ Section 1: Knowledge of Rules â”€â”€ */}
              <div className="sm2-assess-section">
                <div className="sm2-assess-sec-hdr">
                  <span className="sm2-assess-sec-num">01</span>
                  <div>
                    <strong>Knowledge of Rules (MCQ-based)</strong>
                    <span className="sm2-assess-sec-meta">Auto-calculated from Traffic Inspector Online Competency Test</span>
                  </div>
                  <span className="sm2-assess-live-marks">{knowledge} / 25</span>
                </div>

                <div className="sm2-mcq-card-container" style={{ marginTop: 16 }}>
                  {isMcqCompleted ? (
                    <div className="sm2-mcq-success-card">
                      <div className="sm2-mcq-card-header">
                        <div className="sm2-mcq-status">
                          <span className="sm2-status-dot green"></span>
                          <span className="sm2-status-text text-green font-semibold">MCQ Test Completed</span>
                        </div>
                        <div className="sm2-mcq-lock-badge">
                          <Lock size={12} />
                          <span>Read-Only (Synced)</span>
                        </div>
                      </div>

                      <div className="sm2-mcq-card-body">
                        <div className="sm2-mcq-score-display">
                          <div className="sm2-mcq-large-score">
                            <strong>25</strong>
                            <span>/ 25</span>
                          </div>
                          <div className="sm2-mcq-percentage-badge">
                            100% Score
                          </div>
                          <button
                            type="button"
                            style={{ marginLeft: "auto", background: "#fee2e2", border: "none", color: "#dc2626", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                            onClick={() => {
                              localStorage.removeItem(`ti_exam_taken_${activeAssessment.id}`);
                              handleAnswerChange(activeAssessment.id, "knowledgeOfRules", "no");
                            }}
                          >
                            Reset Mock Exam
                          </button>
                        </div>

                        <div className="sm2-mcq-progress-container">
                          <div className="sm2-mcq-progress-bar">
                            <div
                              className="sm2-mcq-progress-fill"
                              style={{
                                width: `100%`,
                                background: "#16a34a"
                              }}
                            />
                          </div>
                        </div>

                        <div className="sm2-mcq-meta-grid">
                          <div className="sm2-mcq-meta-item">
                            <span className="sm2-mcq-meta-label">Submitted On</span>
                            <strong className="sm2-mcq-meta-val">30 May 2026</strong>
                          </div>
                          <div className="sm2-mcq-meta-item">
                            <span className="sm2-mcq-meta-label">Assessed Entity</span>
                            <strong className="sm2-mcq-meta-val">{name}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="sm2-mcq-pending-card">
                      <div className="sm2-mcq-card-header">
                        <div className="sm2-mcq-status">
                          <span className={`sm2-status-dot ${isActivated ? "amber" : "red"}`}></span>
                          <span className={`sm2-status-text text-${isActivated ? "amber" : "red"} font-semibold`}>
                            {isActivated ? "MCQ Test Active" : "MCQ Test Locked"}
                          </span>
                        </div>
                        <div className="sm2-mcq-lock-badge">
                          <Lock size={12} />
                          <span>Read-Only</span>
                        </div>
                      </div>

                      <div className="sm2-mcq-card-body pending" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div className="sm2-mcq-pending-message" style={{ display: "flex", gap: "12px", background: isActivated ? "#fffbeb" : "#fef2f2", border: isActivated ? "1px solid #fef3c7" : "1px solid #fee2e2", padding: "16px", borderRadius: "8px" }}>
                          <AlertTriangle size={24} color={isActivated ? "#d97706" : "#dc2626"} style={{ marginTop: 2, flexShrink: 0 }} />
                          <div>
                            <h4 style={{ margin: "0 0 4px", fontSize: 14, color: isActivated ? "#b45309" : "#991b1b" }}>{isActivated ? "Awaiting Traffic Inspector Attempt" : "Competency Exam Locked"}</h4>
                            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: isActivated ? "#d97706" : "#dc2626" }}>
                              {isActivated ? (
                                <span>The Traffic Inspector safety competency trial is active. Request TI (<strong>{name}</strong>) to log into their portal and attempt the 25 safety questions to automatically sync scores.</span>
                              ) : (
                                <span>The Traffic Inspector MCQ exam is currently locked. You must click the <strong>Activate Safety Exam</strong> button below to enable the Traffic Inspector to log in and attempt the test.</span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "12px" }}>
                          <button
                            type="button"
                            style={{
                              padding: "8px 16px",
                              borderRadius: "8px",
                              fontSize: "13px",
                              fontWeight: "700",
                              cursor: "pointer",
                              border: "none",
                              background: isActivated ? "#fef2f2" : "#2563eb",
                              color: isActivated ? "#dc2626" : "#ffffff",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                            }}
                            onClick={() => {
                              const nextVal = !isActivated;
                              localStorage.setItem(`ti_exam_assigned_${activeAssessment.id}`, nextVal ? "true" : "false");
                              handleAnswerChange(activeAssessment.id, "knowledgeOfRules", "no");
                            }}
                          >
                            {isActivated ? "Deactivate Safety Competency Exam" : "Activate Safety Competency Exam"}
                          </button>
                        </div>

                        <div className="sm2-mcq-meta-grid">
                          <div className="sm2-mcq-meta-item">
                            <span className="sm2-mcq-meta-label">Assessment Status</span>
                            <strong className={`sm2-mcq-meta-val text-${isActivated ? "amber" : "red"}`}>{isActivated ? "Active & Awaiting Attempt" : "Locked (Awaiting Activation)"}</strong>
                          </div>
                          <div className="sm2-mcq-meta-item">
                            <span className="sm2-mcq-meta-label">Assessed Entity</span>
                            <strong className="sm2-mcq-meta-val">{name}</strong>
                          </div>
                          <div className="sm2-mcq-meta-item">
                            <span className="sm2-mcq-meta-label">Total Questions</span>
                            <strong className="sm2-mcq-meta-val">25 Questions (1 mark each)</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* â”€â”€ Sections 02-06: Yes/No blocks â”€â”€ */}
              {assessmentCriteria.filter(x => x.key !== "knowledgeOfRules").map((sec, si) => {
                const checklist = checklistDetails[sec.key] || [];
                const count = checklist.length;
                const sectionScore = getTiSectionScore(sec.key, activeAnswers);
                const sectionMax = sec.marks;
                const weight = count > 0 ? (sectionMax / count).toFixed(2) : 0;

                return (
                  <div key={sec.key} className="sm2-assess-section" style={{ opacity: 1 }}>
                    <div className="sm2-assess-sec-hdr">
                      <span className="sm2-assess-sec-num">{String(si + 2).padStart(2, "0")}</span>
                      <div>
                        <strong>{sec.label}</strong>
                        <span className="sm2-assess-sec-meta">{count} criteria Â· {weight} marks each Â· Total {sectionMax}</span>
                      </div>
                      <span className="sm2-assess-live-marks">{sectionScore} / {sectionMax}</span>
                    </div>
                    <div className="sm2-yn-grid">
                      {checklist.map((itemText, idx) => {
                        const itemKey = `${sec.key}_${idx}`;
                        const currentAnswer = activeAnswers[itemKey] || "no";

                        return (
                          <div key={idx} className="sm2-yn-row">
                            <span style={{ fontSize: "13.5px" }} className="sm2-yn-label">{idx + 1}. {itemText}</span>
                            <div className="sm2-yn-btns">
                              <button
                                type="button" disabled={locked}
                                className={currentAnswer === "yes" ? "sm2-yn-btn sm2-yn-yes active" : "sm2-yn-btn sm2-yn-yes"}
                                style={{ cursor: locked ? "not-allowed" : "pointer" }}
                                onClick={() => handleAnswerChange(activeAssessment.id, itemKey, "yes")}
                              >
                                Yes
                              </button>
                              <button
                                type="button" disabled={locked}
                                className={currentAnswer === "no" ? "sm2-yn-btn sm2-yn-no active" : "sm2-yn-btn sm2-yn-no"}
                                style={{ cursor: locked ? "not-allowed" : "pointer" }}
                                onClick={() => handleAnswerChange(activeAssessment.id, itemKey, "no")}
                              >
                                No
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* â”€â”€ Section 07: Additional Details â”€â”€ */}
              <div className="sm2-assess-section" style={{ opacity: 1 }}>
                <div className="sm2-assess-sec-hdr">
                  <span className="sm2-assess-sec-num">07</span>
                  <div><strong>Additional Details</strong><span className="sm2-assess-sec-meta">Mandatory fields</span></div>
                </div>
                <div className="sm2-assess-form" style={{ marginTop: 12 }}>
                  <div className="sm2-form-field">
                    <label>Knowledge Marks (MCQ Test)</label>
                    <input type="number" min={0} max={25} disabled={locked} value={knowledge} style={{ background: "#f1f5f9" }} readOnly />
                  </div>
                  <div className="sm2-form-field">
                    <label>Alcoholic Status <span style={{ color: "#dc2626" }}>*</span></label>
                    <select disabled={locked} value={activeAnswers.alcoholicStatus || "Non-Alcoholic"} onChange={e => handleAnswerChange(activeAssessment.id, "alcoholicStatus", e.target.value)}>
                      <option value="">Selectâ€¦</option>
                      <option>Non-Alcoholic</option>
                      <option>Alcoholic</option>
                    </select>
                  </div>
                  <div className="sm2-form-field">
                    <label>PME Status</label>
                    <select disabled={locked} value={activeAnswers.pmeStatus || "Fit"} onChange={e => handleAnswerChange(activeAssessment.id, "pmeStatus", e.target.value)}>
                      <option>Fit</option><option>Unfit</option><option>Pending</option>
                    </select>
                  </div>
                  <div className="sm2-form-field">
                    <label>REF Status</label>
                    <select disabled={locked} value={activeAnswers.refStatus || "Cleared"} onChange={e => handleAnswerChange(activeAssessment.id, "refStatus", e.target.value)}>
                      <option>Cleared</option><option>Pending</option><option>Failed</option>
                    </select>
                  </div>
                  <div className="sm2-form-field">
                    <label>Counselling</label>
                    <select disabled={locked} value={activeAnswers.counselling || "Not Required"} onChange={e => handleAnswerChange(activeAssessment.id, "counselling", e.target.value)}>
                      <option>Not Required</option><option>Recommended</option><option>Mandatory</option>
                    </select>
                  </div>
                  <div className="sm2-form-field">
                    <label>Automatic Training</label>
                    <select disabled={locked} value={activeAnswers.automaticTraining || "Not Required"} onChange={e => handleAnswerChange(activeAssessment.id, "automaticTraining", e.target.value)}>
                      <option>Not Required</option><option>Recommended</option><option>Mandatory</option>
                    </select>
                  </div>
                  <div className="sm2-form-field sm2-form-full" style={{ gridColumn: "1/-1" }}>
                    <label>Remarks for Officer / AOM</label>
                    <textarea rows={3} disabled={locked} value={activeAnswers.remarks || ""} onChange={e => handleAnswerChange(activeAssessment.id, "remarks", e.target.value)} placeholder="Enter observations, recommendationsâ€¦" />
                  </div>
                </div>
              </div>

              {/* â”€â”€ Live Score Bar â”€â”€ */}
              <div className="sm2-live-score" style={{ opacity: 1 }}>
                <div><label>Knowledge (MCQ)</label><strong>{knowledge}/25</strong></div>
                <div><label>Yes/No Score</label><strong>{ynScore}/75</strong></div>
                <div><label>Grand Total</label><strong style={{ color: CAT_C[liveCat], fontSize: 22 }}>{liveScore}/100</strong></div>
                <div><label>Category</label><span className="sm2-badge" style={{ background: CAT_B[liveCat], color: CAT_C[liveCat], fontSize: 13, padding: "4px 14px" }}>Category {liveCat}</span></div>
              </div>

              {locked ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
                  <div style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0", padding: "12px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", textAlign: "center" }}>
                    âœ“ Assessment Approved and Locked (AOM Approved)
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                    <button
                      className="sm2-ghost-btn"
                      style={{ padding: "10px 20px", borderRadius: "8px", fontWeight: "700", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", color: "#334155" }}
                      onClick={() => {
                        alert("Assessment saved as draft successfully!");
                      }}
                    >
                      Save as Draft
                    </button>
                    <button
                      className="sm2-ghost-btn"
                      style={{ padding: "10px 20px", borderRadius: "8px", fontWeight: "700", border: "1px solid #fca5a5", background: "#fef2f2", cursor: "pointer", color: "#dc2626" }}
                      onClick={() => handleRejectAssessment(activeAssessment.id)}
                    >
                      Reject
                    </button>
                    <button
                      className="sm2-primary-btn"
                      style={{ padding: "10px 20px", borderRadius: "8px", fontWeight: "700", border: "none", background: "#2563eb", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
                      onClick={() => handleApproveAssessment(activeAssessment.id)}
                    >
                      <CheckCircle size={14} /> Approve &amp; Lock Assessment
                    </button>
                  </div>
                </div>
              )}
            </section>
          );
        }


        // --- SS Form View ---
        if (activeAomSsId) {
          const ssItem = aomSsList.find(s => s.id === activeAomSsId);
          const ssForm = aomSsForms[activeAomSsId] || aomDefaultSsForm();
          const ssIsLocked = aomSsLocked[activeAomSsId] || ssItem?.status === "Approved";
          const { ynScore: ssYn, knowledge: ssKm, total: ssTotal } = calcAomSsLiveScore(ssForm);
          const isSSAlco = ssForm.alcoholicStatus === "Alcoholic";
          const ssCatRaw = ssTotal >= 80 ? "A" : ssTotal >= 50 ? "B" : ssTotal >= 26 ? "C" : "D";
          const ssCat = isSSAlco ? "D" : ssCatRaw;
          const SS_CAT_BG = { A: "#dcfce7", B: "#dbeafe", C: "#fef3c7", D: "#fee2e2" };
          const SS_CAT_CLR = { A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#dc2626" };
          return (
            <section className="sm2-card animate-fade-in" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Assessment — {ssItem?.name}</h2>
                  <p style={{ margin: "4px 0 0 0", fontSize: "12.5px", color: "#64748b" }}>{ssItem?.hrmsId} · Station Superintendent · {ssItem?.station}</p>
                </div>
                <button style={{ border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", color: "#475569" }} onClick={() => setActiveAomSsId(null)}>Back</button>
              </div>
              {AOM_SS_CRITERIA.map((sec, si) => {
                const secArr = ssForm[sec.key] || Array(sec.count).fill("No");
                const secScore = secArr.filter(v => v === "Yes").length * sec.weight;
                const secMax = sec.count * sec.weight;
                return (
                  <div key={sec.key} className="sm2-assess-section">
                    <div className="sm2-assess-sec-hdr">
                      <span className="sm2-assess-sec-num">{String(si + 1).padStart(2, "0")}</span>
                      <div><strong>{sec.label}</strong><span className="sm2-assess-sec-meta">{sec.count} criteria · {sec.weight} marks each · Total {secMax}</span></div>
                      <span className="sm2-assess-live-marks">{secScore} / {secMax}</span>
                    </div>
                    <div className="sm2-yn-grid">
                      {sec.criteria.map((itemText, idx) => {
                        const val = secArr[idx] || "No";
                        return (
                          <div key={idx} className="sm2-yn-row">
                            <span style={{ fontSize: "13.5px" }} className="sm2-yn-label">{idx + 1}. {itemText}</span>
                            <div className="sm2-yn-btns">
                              <button type="button" disabled={ssIsLocked} className={val === "Yes" ? "sm2-yn-btn sm2-yn-yes active" : "sm2-yn-btn sm2-yn-yes"} style={{ cursor: ssIsLocked ? "not-allowed" : "pointer" }} onClick={() => toggleAomSsYN(activeAomSsId, sec.key, idx, "Yes")}>Yes</button>
                              <button type="button" disabled={ssIsLocked} className={val === "No" ? "sm2-yn-btn sm2-yn-no active" : "sm2-yn-btn sm2-yn-no"} style={{ cursor: ssIsLocked ? "not-allowed" : "pointer" }} onClick={() => toggleAomSsYN(activeAomSsId, sec.key, idx, "No")}>No</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div className="sm2-assess-section" style={{ opacity: 1 }}>
                <div className="sm2-assess-sec-hdr">
                  <span className="sm2-assess-sec-num">06</span>
                  <div><strong>Additional Details</strong><span className="sm2-assess-sec-meta">Mandatory fields</span></div>
                </div>
                <div className="sm2-assess-form" style={{ marginTop: 12 }}>
                  <div className="sm2-form-field"><label>Knowledge Marks (out of 25)</label><input type="number" min={0} max={25} disabled={ssIsLocked} value={ssForm.knowledgeMarks} onChange={e => setAomSsField(activeAomSsId, "knowledgeMarks", e.target.value)} placeholder="0-25" /></div>
                  <div className="sm2-form-field"><label>Alcoholic Status <span style={{ color: "#dc2626" }}>*</span></label><select disabled={ssIsLocked} value={ssForm.alcoholicStatus || ""} onChange={e => setAomSsField(activeAomSsId, "alcoholicStatus", e.target.value)}><option value="">Select...</option><option>Non-Alcoholic</option><option>Alcoholic</option></select></div>
                  <div className="sm2-form-field"><label>PME Status</label><select disabled={ssIsLocked} value={ssForm.pmeStatus} onChange={e => setAomSsField(activeAomSsId, "pmeStatus", e.target.value)}><option>Fit</option><option>Unfit</option><option>Pending</option></select></div>
                  <div className="sm2-form-field"><label>REF Status</label><select disabled={ssIsLocked} value={ssForm.refStatus} onChange={e => setAomSsField(activeAomSsId, "refStatus", e.target.value)}><option>Cleared</option><option>Pending</option><option>Failed</option></select></div>
                  <div className="sm2-form-field"><label>Counselling</label><select disabled={ssIsLocked} value={ssForm.counselling} onChange={e => setAomSsField(activeAomSsId, "counselling", e.target.value)}><option>Not Required</option><option>Recommended</option><option>Mandatory</option></select></div>
                  <div className="sm2-form-field"><label>Automatic Training</label><select disabled={ssIsLocked} value={ssForm.automaticTraining} onChange={e => setAomSsField(activeAomSsId, "automaticTraining", e.target.value)}><option>Not Required</option><option>Recommended</option><option>Mandatory</option></select></div>
                  <div className="sm2-form-field sm2-form-full" style={{ gridColumn: "1/-1" }}><label>Remarks</label><textarea rows={3} disabled={ssIsLocked} value={ssForm.remarks} onChange={e => setAomSsField(activeAomSsId, "remarks", e.target.value)} placeholder="Enter observations, recommendations..." /></div>
                </div>
              </div>
              <div className="sm2-live-score" style={{ opacity: 1 }}>
                <div><label>Knowledge (Written)</label><strong>{ssKm}/25</strong></div>
                <div><label>Yes/No Score</label><strong>{ssYn}/75</strong></div>
                <div><label>Grand Total</label><strong style={{ color: SS_CAT_CLR[ssCat], fontSize: 22 }}>{ssTotal}/100</strong></div>
                <div><label>Category</label><span className="sm2-badge" style={{ background: SS_CAT_BG[ssCat], color: SS_CAT_CLR[ssCat], fontSize: 13, padding: "4px 14px" }}>Category {ssCat}</span></div>
              </div>
              {ssIsLocked ? (
                <div style={{ marginTop: "16px", background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0", padding: "12px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", textAlign: "center" }}>Assessment Approved and Locked</div>
              ) : (
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                  <button style={{ padding: "10px 20px", borderRadius: "8px", fontWeight: "700", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", color: "#334155" }} onClick={() => alert("Saved as draft!")}>Save as Draft</button>
                  <button style={{ padding: "10px 20px", borderRadius: "8px", fontWeight: "700", border: "none", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }} onClick={() => submitAomSsAssessment(activeAomSsId)}>Approve &amp; Lock Assessment</button>
                </div>
              )}
            </section>
          );
        }

        // --- LEVEL 2: Roster View ---
        const rosterList = getTiRosterList();

        // Roster totals
        const totalTIs = rosterList.length;
        const pendingCount = rosterList.filter(x => x.status === "Pending" || x.status === "Exam Sent").length;
        const completedCount = rosterList.filter(x => x.status === "Approved" || x.status === "Exam Taken" || x.status === "Submitted").length;
        const rejectedCount = rosterList.filter(x => x.status === "Rejected").length;
        const lastUpdatedDate = "30 May 2026";

        // Filter elements
        const uniqueStationsList = ["All", ...new Set(stations.map(s => s.name || s.stationName).filter(Boolean))];

        const filteredTiList = rosterList.filter((ti) => {
          const matchesSearch = assessSearch === "" ||
            ti.name.toLowerCase().includes(assessSearch.toLowerCase()) ||
            ti.employeeId.toLowerCase().includes(assessSearch.toLowerCase());

          const matchesStation = assessStation === "All" ||
            ti.stationName === assessStation ||
            ti.division === assessStation;

          const matchesStatus = assessStatus === "All" || ti.status === assessStatus;
          const matchesDate = assessDate === "" || ti.lastAssessed === assessDate;

          return matchesSearch && matchesStation && matchesStatus && matchesDate;
        });

        const stationCodeMap = {
          "Parbhani Junction": "PBN",
          "Amla": "AMLA",
          "Nagpur Junction": "NGP",
          "Pune Junction": "PUNE",
          "Mumbai Junction": "BCT",
          "Delhi Junction": "DLI"
        };

        return (
          <div className="ti2-page-body animate-fade-in" style={{ padding: "24px", background: "#f8fafc", minHeight: "100%", width: "100%", boxSizing: "border-box" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px" }}>
                  Assessments — Traffic Inspectors
                </h1>
                <p style={{ margin: 0, fontSize: "14px", color: "#64748b", fontWeight: "500" }}>
                  Traffic Inspectors pending assessment. Open the form to conduct a structured evaluation.
                </p>
              </div>
            </div>

            {/* Role Tab Switcher */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              {[{ key: "TI", label: "Traffic Inspectors" }, { key: "SS", label: "Station Superintendents" }].map(tab => (
                <button key={tab.key}
                  onClick={() => { setAssessmentRoleTab(tab.key); setActiveAomSsId(null); setOpenAssessmentId(null); }}
                  style={{
                    padding: "8px 20px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer",
                    border: assessmentRoleTab === tab.key ? "none" : "1px solid #cbd5e1",
                    background: assessmentRoleTab === tab.key ? "#0f172a" : "#ffffff",
                    color: assessmentRoleTab === tab.key ? "#ffffff" : "#475569"
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* SS Roster Table */}
            {assessmentRoleTab === "SS" && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1.5px solid #e2e8f0", background: "#f8fafc", textAlign: "left" }}>
                      {["STATION SUPERINTENDENT", "HRMS ID", "STATION", "LAST ASSESSED", "SCORE", "STATUS", "ACTION"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: h === "ACTION" ? "right" : "left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {aomSsList.map(ss => {
                      const catBg = { A: "#dcfce7", B: "#dbeafe", C: "#fef3c7", D: "#fee2e2" };
                      const catClr = { A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#dc2626" };
                      return (
                        <tr key={ss.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#1e3a8a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px" }}>{ss.name.charAt(0)}</div>
                              <div>
                                <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>{ss.name}</div>
                                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "500", marginTop: "2px" }}>Station Superintendent</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px", color: "#475569", fontWeight: "600", fontSize: "13px", fontFamily: "monospace" }}>{ss.hrmsId}</td>
                          <td style={{ padding: "14px 16px", color: "#334155", fontSize: "13px", fontWeight: "500" }}>{ss.station}</td>
                          <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "13px", fontWeight: "500" }}>{ss.lastDate || "—"}</td>
                          <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: "800", fontSize: "14px" }}>
                            {ss.score != null ? <span>{ss.score}/100 {ss.category && <span style={{ marginLeft: "6px", background: catBg[ss.category], color: catClr[ss.category], borderRadius: "4px", padding: "2px 6px", fontSize: "11px", fontWeight: "700" }}>Cat {ss.category}</span>}</span> : "—"}
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{ background: ss.status === "Approved" ? "#dcfce7" : "#f1f5f9", color: ss.status === "Approved" ? "#166534" : "#475569", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}>{ss.status}</span>
                          </td>
                          <td style={{ padding: "14px 16px", textAlign: "right" }}>
                            <button onClick={() => openAomSsForm(ss.id)} style={{ background: ss.status === "Approved" ? "#2563eb" : "#16a34a", border: "none", color: "#fff", padding: "6px 14px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "12px" }}>
                              {ss.status === "Approved" ? "View Form" : "Open Form"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {aomSsList.length === 0 && (
                      <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>No Station Superintendents found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {assessmentRoleTab === "TI" && (
              <>
                {/* KPI Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", marginBottom: "24px" }}>
                  {[
                    { label: `Total Traffic Inspectors`, value: totalTIs, subtitle: "In your jurisdiction", icon: Users, bg: "#ffffff", color: "#475569", valColor: "#0f172a" },
                    { label: "Pending Assessments", value: pendingCount, subtitle: "Awaiting completion", icon: ClipboardCheck, bg: "#ffffff", color: "#ea580c", valColor: "#ea580c" },
                    { label: "Completed This Month", value: completedCount, subtitle: "Assessments done", icon: CheckCircle, bg: "#ffffff", color: "#16a34a", valColor: "#16a34a" },
                    { label: "Rejected", value: rejectedCount, subtitle: "Needs review", icon: AlertTriangle, bg: "#ffffff", color: "#dc2626", valColor: "#dc2626" },
                    { label: "Last Updated", value: lastUpdatedDate, subtitle: "Recent activity", icon: Calendar, bg: "#ffffff", color: "#64748b", valColor: "#0f172a" }
                  ].map((stat, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "16px",
                        padding: "20px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                        display: "flex",
                        alignItems: "center",
                        gap: "16px"
                      }}
                    >
                      <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: stat.color, flexShrink: 0 }}>
                        <stat.icon size={20} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                          <span style={{ fontSize: "22px", fontWeight: "800", color: stat.valColor }}>{stat.value}</span>
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: "#334155", marginTop: "2px" }}>{stat.label}</div>
                        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "500", marginTop: "1px" }}>{stat.subtitle}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Filters Section */}
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "20px",
                    marginBottom: "24px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr auto", gap: "16px", alignItems: "end" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                        Search Traffic Inspector
                      </label>
                      <div style={{ position: "relative" }}>
                        <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                        <input
                          type="text"
                          placeholder="Name or HRMS ID..."
                          value={assessSearch}
                          onChange={(e) => setAssessSearch(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "10px 12px 10px 36px",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            fontSize: "13px",
                            fontWeight: "500",
                            color: "#0f172a",
                            boxSizing: "border-box"
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>Station</label>
                      <select
                        value={assessStation}
                        onChange={(e) => setAssessStation(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "13px",
                          fontWeight: "500",
                          color: "#0f172a",
                          boxSizing: "border-box"
                        }}
                      >
                        <option value="All">All Stations</option>
                        {uniqueStationsList.filter(x => x !== "All").map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>Exam Status</label>
                      <select
                        value={assessStatus}
                        onChange={(e) => setAssessStatus(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "13px",
                          fontWeight: "500",
                          color: "#0f172a",
                          boxSizing: "border-box"
                        }}
                      >
                        <option value="All">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Exam Sent">Exam Sent</option>
                        <option value="Exam Taken">Exam Taken</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>Last Assessed</label>
                      <div style={{ position: "relative" }}>
                        <Calendar size={14} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                        <input
                          type="date"
                          value={assessDate}
                          onChange={(e) => setAssessDate(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "10px 36px 10px 12px",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            fontSize: "13px",
                            fontWeight: "500",
                            color: "#0f172a",
                            boxSizing: "border-box"
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        onClick={() => { setAssessSearch(""); setAssessStation("All"); setAssessStatus("All"); setAssessDate(""); }}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          padding: "10px 16px",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: "700",
                          color: "#475569",
                          cursor: "pointer"
                        }}
                      >
                        Reset
                      </button>
                      <button
                        style={{
                          background: "#0f172a",
                          border: "none",
                          padding: "10px 20px",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: "700",
                          color: "#ffffff",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          cursor: "pointer"
                        }}
                      >
                        <Filter size={14} /> Apply Filters
                      </button>
                    </div>
                  </div>
                </div>

                {/* Roster Table */}
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "24px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                  }}
                >
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1.5px solid #e2e8f0", background: "#f8fafc", textAlign: "left" }}>
                          <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            TRAFFIC INSPECTOR
                          </th>
                          <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>HRMS ID</th>
                          <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>STATION</th>
                          <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>LAST ASSESSED</th>
                          <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>SCORE</th>
                          <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>EXAM STATUS</th>
                          <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "right" }}>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTiList.map((item) => {
                          const stationCode = stationCodeMap[item.stationName] || "STN";

                          const examStatusBadgeStyle = (status) => {
                            if (status === "Exam Sent") return { bg: "#f3e8ff", color: "#6b21a8" };
                            if (status === "Exam Taken") return { bg: "#dcfce7", color: "#166534" };
                            if (status === "Submitted") return { bg: "#dbeafe", color: "#2563eb" };
                            if (status === "Rejected") return { bg: "#fee2e2", color: "#dc2626" };
                            if (status === "Approved") return { bg: "#dcfce7", color: "#166534" };
                            return { bg: "#f1f5f9", color: "#475569" };
                          };

                          const statusColors = examStatusBadgeStyle(item.status);

                          return (
                            <tr key={item.id || item.employeeId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "14px 16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#1e3a8a", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px" }}>
                                    {item.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>{item.name}</div>
                                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "500", marginTop: "2px" }}>Senior Scale</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: "14px 16px", color: "#475569", fontWeight: "600", fontSize: "13px", fontFamily: "monospace" }}>
                                {item.employeeId}
                              </td>
                              <td style={{ padding: "14px 16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ color: "#334155", fontSize: "13px", fontWeight: "500" }}>{item.stationName}</span>
                                  <span style={{ background: "#eff6ff", color: "#2563eb", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" }}>
                                    {stationCode}
                                  </span>
                                </div>
                              </td>
                              <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "13px", fontWeight: "500" }}>
                                {item.lastAssessed || "—"}
                              </td>
                              <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: "800", fontSize: "14px" }}>
                                {item.score ? `${item.score}/100` : "—"}
                              </td>
                              <td style={{ padding: "14px 16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <span style={{ background: statusColors.bg, color: statusColors.color, padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}>
                                    {item.status}
                                  </span>
                                  {item.status === "Exam Sent" && (
                                    <span style={{ background: "#f3e8ff", color: "#6b21a8", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                                      <Clock size={12} /> Waiting for Response
                                    </span>
                                  )}
                                  {item.status === "Rejected" && (
                                    <span style={{ background: "#fee2e2", color: "#dc2626", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                                      <AlertTriangle size={12} /> Needs Review
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={{ padding: "14px 16px", textAlign: "right" }}>
                                <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "flex-end" }}>
                                  {(item.status === "Pending" || item.status === "Rejected") && (
                                    <>
                                      <button
                                        onClick={() => {
                                          localStorage.setItem(`ti_exam_assigned_${item.employeeId}`, "true");
                                          // Add an item to pendingAssessments if it doesn't exist
                                          const exists = pendingAssessments.some(p => p.id === item.employeeId);
                                          if (!exists) {
                                            setPendingAssessments(prev => [{
                                              id: item.employeeId,
                                              title: `Traffic Inspector - ${item.employeeId}`,
                                              statusLabel: "Pending Assessment",
                                              assessedByLine: `Awaiting: Your Assessment - on ${todayIso()}`,
                                              employeeLine: `Employee: ${item.name} | Division: ${item.division || "Nagpur"}`,
                                              actionType: "assessment"
                                            }, ...prev]);
                                          }
                                          alert(`Exam assigned and sent to Traffic Inspector ${item.name || ""}.`);
                                          setAssessmentActionNotice(`Exam assigned to ${item.name}.`);
                                        }}
                                        style={{
                                          background: "#7c3aed",
                                          border: "none",
                                          color: "#ffffff",
                                          padding: "6px 12px",
                                          borderRadius: "8px",
                                          cursor: "pointer",
                                          fontWeight: "700",
                                          fontSize: "12px"
                                        }}
                                      >
                                        Send Access
                                      </button>
                                      <button
                                        onClick={() => openTiForm(item)}
                                        style={{
                                          background: "#ffffff",
                                          border: "1px solid #cbd5e1",
                                          padding: "5px 12px",
                                          borderRadius: "8px",
                                          fontSize: "12px",
                                          fontWeight: "700",
                                          color: "#475569",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "4px",
                                          cursor: "pointer"
                                        }}
                                      >
                                        Open Form <ExternalLink size={12} />
                                      </button>
                                    </>
                                  )}
                                  {item.status === "Exam Sent" && (
                                    <>
                                      <button
                                        onClick={() => {
                                          localStorage.setItem(`ti_exam_taken_${item.employeeId}`, "true");
                                          alert(`Mock sync: Traffic Inspector ${item.name} completed the online exam.`);
                                          setAssessmentActionNotice(`Online exam completed by ${item.name}.`);
                                        }}
                                        style={{
                                          background: "#2563eb",
                                          border: "none",
                                          color: "#ffffff",
                                          padding: "6px 12px",
                                          borderRadius: "8px",
                                          cursor: "pointer",
                                          fontWeight: "700",
                                          fontSize: "12px"
                                        }}
                                      >
                                        Simulate Exam Taken
                                      </button>
                                      <button
                                        onClick={() => openTiForm(item)}
                                        style={{
                                          background: "#ffffff",
                                          border: "1px solid #cbd5e1",
                                          padding: "5px 12px",
                                          borderRadius: "8px",
                                          fontSize: "12px",
                                          fontWeight: "700",
                                          color: "#475569",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "4px",
                                          cursor: "pointer"
                                        }}
                                      >
                                        Open Form <ExternalLink size={12} />
                                      </button>
                                    </>
                                  )}
                                  {item.status === "Exam Taken" && (
                                    <button
                                      onClick={() => openTiForm(item)}
                                      style={{
                                        background: "#16a34a",
                                        border: "none",
                                        color: "#ffffff",
                                        padding: "6px 16px",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        fontWeight: "700",
                                        fontSize: "12px"
                                      }}
                                    >
                                      Start Assessment
                                    </button>
                                  )}
                                  {item.status === "Submitted" && (
                                    <>
                                      <button
                                        onClick={() => openTiForm(item)}
                                        style={{
                                          background: "#2563eb",
                                          border: "none",
                                          color: "#ffffff",
                                          padding: "6px 12px",
                                          borderRadius: "8px",
                                          cursor: "pointer",
                                          fontWeight: "700",
                                          fontSize: "12px"
                                        }}
                                      >
                                        View Form
                                      </button>
                                      <button
                                        onClick={() => openTiForm(item)}
                                        style={{
                                          background: "#ea580c",
                                          border: "none",
                                          color: "#ffffff",
                                          padding: "6px 12px",
                                          borderRadius: "8px",
                                          cursor: "pointer",
                                          fontWeight: "700",
                                          fontSize: "12px"
                                        }}
                                      >
                                        Edit
                                      </button>
                                    </>
                                  )}
                                  {item.status === "Approved" && (
                                    <button
                                      onClick={() => openTiForm(item)}
                                      style={{
                                        background: "#2563eb",
                                        border: "none",
                                        color: "#ffffff",
                                        padding: "6px 12px",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        fontWeight: "700",
                                        fontSize: "12px"
                                      }}
                                    >
                                      View Form
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredTiList.length === 0 && (
                          <tr>
                            <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#64748b", fontSize: "14px", fontWeight: "500" }}>
                              No Traffic Inspectors match your current filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Info */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
                    <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                      Showing 1 to {filteredTiList.length} of {filteredTiList.length} entries
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        disabled
                        style={{
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          width: "32px",
                          height: "32px",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#cbd5e1",
                          cursor: "not-allowed"
                        }}
                      >
                        &lt;
                      </button>
                      <button
                        style={{
                          background: "#0f172a",
                          border: "none",
                          width: "32px",
                          height: "32px",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          fontWeight: "700",
                          fontSize: "13px"
                        }}
                      >
                        1
                      </button>
                      <button
                        disabled
                        style={{
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          width: "32px",
                          height: "32px",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#cbd5e1",
                          cursor: "not-allowed"
                        }}
                      >
                        &gt;
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      }

      case "Reports and Analytics": {
        return (
          <CommonReports
            aomPointsmen={aomPointsmen}
            stationMastersDirectory={stationMastersDirectory}
            aomSSs={aomSuperintendents}
            aomTMs={aomTrainManagers}
            aomTIs={trafficInspectors}
            stations={stations}
            selectedReportUserId={selectedReportUserId}
            setSelectedReportUserId={setSelectedReportUserId}
            repF={repF}
            setRepF={setRepF}
            userRole="AOM"
          />
        );
      }

      case "Settings":
        return (
          <div className="reports-page">
            <div className="page-header">
              <h2>Settings</h2>
              <p>Configure AOM console preferences</p>
            </div>

            <div className="reports-container settings-container">
              {settingsNotice && <div className="assessment-action-notice">{settingsNotice}</div>}

              <div className="settings-grid">
                <div className="settings-card">
                  <h3>Notification Preferences</h3>
                  <label className="settings-toggle">
                    <input
                      type="checkbox"
                      checked={aomSettings.emailAlerts}
                      onChange={() => handleSettingsToggle("emailAlerts")}
                    />
                    <span>Email alerts for approvals and pending items</span>
                  </label>
                  <label className="settings-toggle">
                    <input
                      type="checkbox"
                      checked={aomSettings.smsAlerts}
                      onChange={() => handleSettingsToggle("smsAlerts")}
                    />
                    <span>SMS alerts for critical safety and escalation events</span>
                  </label>
                  <label className="settings-toggle">
                    <input
                      type="checkbox"
                      checked={aomSettings.weeklyDigest}
                      onChange={() => handleSettingsToggle("weeklyDigest")}
                    />
                    <span>Weekly performance digest summary</span>
                  </label>
                </div>

                <div className="settings-card">
                  <h3>Workflow Preferences</h3>
                  <label className="settings-toggle">
                    <input
                      type="checkbox"
                      checked={aomSettings.autoEscalation}
                      onChange={() => handleSettingsToggle("autoEscalation")}
                    />
                    <span>Auto escalation for overdue assessments</span>
                  </label>

                  <div className="form-group">
                    <label>Default Assessment Tab</label>
                    <select
                      value={aomSettings.defaultAssessmentTab}
                      onChange={(e) => handleSettingsSelect("defaultAssessmentTab", e.target.value)}
                    >
                      <option value="TI">TI Assessment + Approval</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Report Visibility</label>
                    <select
                      value={aomSettings.reportVisibility}
                      onChange={(e) => handleSettingsSelect("reportVisibility", e.target.value)}
                    >
                      <option value="All">All Staff</option>
                      <option value="SM_TM_TI_SS">SM/TM/TI/SS</option>
                      <option value="Operational">Operational Roles Only</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="add-user-actions">
                <button type="button" className="submit-btn" onClick={handleSaveSettings}>
                  Save Settings
                </button>
              </div>
            </div>

            <style>{`
              .settings-container {
                display: grid;
                gap: 14px;
              }

              .settings-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 14px;
              }

              .settings-card {
                border: 1px solid #dbe4ef;
                border-radius: 10px;
                padding: 14px;
                background: #f9fbfe;
              }

              .settings-card h3 {
                margin: 0 0 10px;
                color: #1f3653;
              }

              .settings-toggle {
                display: flex;
                align-items: flex-start;
                gap: 8px;
                margin-bottom: 10px;
                color: #334155;
                font-size: 13px;
              }
            `}</style>
          </div>
        );

      case "My Profile": {
        return (
          <UserProfile
            fullName={user?.name || "General Manager User"}
            employeeId={user?.hrmsId || "GM_1001"}
            profileData={aomReadOnlyProfile}
          />
        );
      }

      case "Approvals": {
        const aomCAT_C = { A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#dc2626" };
        const aomCAT_B = { A: "#dcfce7", B: "#dbeafe", C: "#fef3c7", D: "#fee2e2" };
        const tabs = ["Pending", "Approved", "Rejected"];

        /* â”€â”€â”€ DETAIL VIEW â”€â”€â”€ */
        if (aomSelectedItem) {
          const secs = aomEditSections[aomSelectedItem.id] || [];
          const liveTotal = secs.reduce((s, x) => s + x.score, 0);
          const liveCat = aomGetCat(liveTotal);
          const locked = aomSelectedItem.status !== "Submitted" && aomSelectedItem.status !== "Pending";
          const reject = aomRejectMode[aomSelectedItem.id] || false;

          const savedForms = aomApprovalTab === "SM"
            ? (localStorage.getItem("ti_sm_forms") ? JSON.parse(localStorage.getItem("ti_sm_forms")) : {})
            : (localStorage.getItem("ti_tm_forms") ? JSON.parse(localStorage.getItem("ti_tm_forms")) : {});
          const form = savedForms[aomSelectedItem.id] || {};
          const pme = form.pmeStatus || aomSelectedItem.pmeStatus || (aomSelectedItem.meta?.pmeStatus) || "Fit";
          const ref = form.refStatus || aomSelectedItem.refStatus || (aomSelectedItem.meta?.refStatus) || "Cleared";
          const alc = form.alcoholicStatus || aomSelectedItem.alcoholicStatus || (aomSelectedItem.meta?.alcoholicStatus) || "Non-Alcoholic";

          return (
            <div className="ti2-card animate-fade-in">
              <div className="ti2-card-hdr">
                <div>
                  <h2>Review — {aomSelectedItem.name} ({aomSelectedItem.hrmsId})</h2>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                    {aomSelectedItem.station} Â· {aomApprovalTab === "SM" ? "Station Master" : "Train Manager"} Â· Assessed on {aomSelectedItem.lastDate}
                  </p>
                </div>
                <button className="ti2-link-btn" onClick={() => setAomSelectedId(null)}>â† Back</button>
              </div>

              {/* Info meta — same ti2-review-meta grid as TI */}
              <div className="ti2-review-meta">
                <div><label>{aomApprovalTab === "SM" ? "Station Master" : "Train Manager"}</label><strong>{aomSelectedItem.name}</strong></div>
                <div><label>HRMS ID</label><strong>{aomSelectedItem.hrmsId}</strong></div>
                <div><label>Station</label><strong>{aomSelectedItem.station}</strong></div>
                <div><label>PME Status</label><strong className={pme === "Fit" ? "ti2-green" : "ti2-red"}>{pme}</strong></div>
                <div><label>REF Status</label><strong className={ref === "Cleared" ? "ti2-green" : "ti2-amber"}>{ref}</strong></div>
                <div><label>Alcoholic Status</label><strong>{alc}</strong></div>
              </div>

              {/* Section-wise marks — same ti2-review-sections as TI */}
              <h4 className="ti2-sec-title">Section-wise Assessment Marks</h4>
              <div className="ti2-review-sections">
                {secs.map((sec, idx) => {
                  const pct = sec.max > 0 ? Math.round((sec.score / sec.max) * 100) : 0;
                  return (
                    <div key={sec.title} className="ti2-review-sec-row">
                      <span className="ti2-review-sec-name">{sec.title}</span>
                      <div className="ti2-review-bar-wrap">
                        <div className="ti2-review-bar" style={{ width: `${pct}%`, background: pct >= 80 ? "#16a34a" : pct >= 50 ? "#2563eb" : "#dc2626" }} />
                      </div>
                      {locked ? (
                        <span className="ti2-review-score-static">{sec.score}/{sec.max}</span>
                      ) : (
                        <div className="ti2-review-score-input">
                          <input type="number" min={0} max={sec.max} value={sec.score}
                            onChange={e => aomUpdateSec(aomSelectedItem.id, idx, e.target.value)} />
                          <span className="ti2-sec-max">/ {sec.max}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Live score — same ti2-live-score as TI */}
              <div className="ti2-live-score">
                <div><label>Grand Total</label><strong style={{ color: aomCAT_C[liveCat], fontSize: 22 }}>{liveTotal}/100</strong></div>
                <div><label>Category</label><span className="ti2-badge" style={{ background: aomCAT_B[liveCat], color: aomCAT_C[liveCat], fontSize: 13, padding: "4px 14px" }}>Category {liveCat}</span></div>
              </div>

              {/* AOM remarks — mirrors TI Remarks */}
              {!locked && (
                <div className="ti2-form-field">
                  <label>AOM Remarks</label>
                  <textarea rows={3}
                    value={aomAomRemarks[aomSelectedItem.id] || ""}
                    onChange={e => setAomAomRemarks(p => ({ ...p, [aomSelectedItem.id]: e.target.value }))}
                    placeholder="Add remarksâ€¦" />
                </div>
              )}

              {/* Reject reason input */}
              {reject && !locked && (
                <div className="ti2-form-field" style={{ marginTop: 10 }}>
                  <label style={{ color: "#dc2626" }}>Rejection Reason (mandatory)</label>
                  <textarea rows={2} placeholder="Enter rejection reasonâ€¦" id={`aom-reject-${aomSelectedItem.id}`} />
                </div>
              )}

              {/* Audit trail */}
              {aomSelectedItem.auditTrail?.length > 0 && (
                <div>
                  <button className="ti2-link-btn-sm" style={{ marginTop: 12 }}
                    onClick={() => setAomShowAudit(p => ({ ...p, [aomSelectedItem.id]: !p[aomSelectedItem.id] }))}>
                    {aomShowAudit[aomSelectedItem.id] ? "Hide" : "View"} Audit Trail
                  </button>
                  {aomShowAudit[aomSelectedItem.id] && (
                    <div className="ti2-audit-trail">
                      {aomSelectedItem.auditTrail.map((a, i) => (
                        <div key={i} className="ti2-audit-row">
                          <strong>{a.action}</strong> Â· {a.by} Â· {a.date}
                          {a.remark && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>"{a.remark}"</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Locked banner */}
              {locked && (
                <div className="ti2-locked-banner">
                  {aomSelectedItem.status === "Approved" ? "âœ“ Assessment Approved and Locked" : "âœ— Assessment Rejected"}
                  {aomSelectedItem.aomRemarks && <div style={{ marginTop: 4, fontSize: 12 }}>Remarks: {aomSelectedItem.aomRemarks}</div>}
                </div>
              )}

              {/* Action buttons — exact same as TI: Reject / Approve as Submitted / Modify & Approve */}
              {!locked && !reject && (
                <div className="ti2-review-actions">
                  <button className="ti2-danger-btn" onClick={() => setAomRejectMode(p => ({ ...p, [aomSelectedItem.id]: true }))}>
                    <XCircle size={14} /> Reject
                  </button>
                  <button className="ti2-ghost-btn" onClick={() => aomFinalize(aomSelectedItem.id, "approve")}>
                    <CheckCircle size={14} /> Approve as Submitted
                  </button>
                  <button className="ti2-primary-btn" onClick={() => aomFinalize(aomSelectedItem.id, "modify")}>
                    <CheckCircle size={14} /> Modify &amp; Approve
                  </button>
                </div>
              )}
              {reject && !locked && (
                <div className="ti2-review-actions">
                  <button className="ti2-ghost-btn" onClick={() => setAomRejectMode(p => ({ ...p, [aomSelectedItem.id]: false }))}>Cancel</button>
                  <button className="ti2-danger-btn" onClick={() => {
                    const note = document.getElementById(`aom-reject-${aomSelectedItem.id}`)?.value || "No reason provided";
                    aomFinalize(aomSelectedItem.id, "reject", note);
                  }}>Confirm Rejection</button>
                </div>
              )}
            </div>
          );
        }

        /* â”€â”€â”€ LIST VIEW â”€â”€â”€ */
        return (
          <div className="ti2-card animate-fade-in">
            <div className="ti2-card-hdr">
              <h2>Approvals — {aomApprovalTab === "SM" ? "Station Masters" : "Train Managers"}</h2>
            </div>
            <p className="ti2-subtitle">Review and approve {aomApprovalTab === "SM" ? "Station Master" : "Train Manager"} assessments submitted by Traffic Inspectors.</p>

            {/* Role switch — mirrors TI's ti2-tabs style */}
            <div className="ti2-tabs" style={{ marginBottom: 4 }}>
              {["SM", "TM"].map(role => (
                <button key={role}
                  className={`ti2-tab ${aomApprovalTab === role ? "active" : ""}`}
                  onClick={() => { setAomApprovalTab(role); setAomSelectedId(null); setAomReviewTab("Pending"); setAomReviewSearch(""); setAomReviewStation("All"); }}>
                  {role === "SM" ? "Station Masters" : "Train Managers"}
                  <span className="ti2-tab-count">
                    {(role === "SM" ? aomSMList : aomTMList).filter(p => p.status === "Submitted").length}
                  </span>
                </button>
              ))}
            </div>

            {/* Status tabs — same ti2-tabs as TI */}
            <div className="ti2-tabs">
              {tabs.map(t => (
                <button key={t} className={`ti2-tab ${aomReviewTab === t ? "active" : ""}`} onClick={() => setAomReviewTab(t)}>
                  {t} <span className="ti2-tab-count">
                    {aomCurrentList.filter(p => t === "Pending" ? p.status === "Submitted" : p.status === t).length}
                  </span>
                </button>
              ))}
            </div>

            {/* Filters — exact same as TI */}
            <div className="ti2-filter-row">
              <div className="ti2-search-box">
                <Search size={13} />
                <input placeholder={`Search ${aomApprovalTab === "SM" ? "station master" : "train manager"}â€¦`}
                  value={aomReviewSearch} onChange={e => setAomReviewSearch(e.target.value)} />
              </div>
              <select className="ti2-select" value={aomReviewStation} onChange={e => setAomReviewStation(e.target.value)}>
                <option value="All">All Stations</option>
                {aomAllStations.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {aomApprovalNotice && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: "10px 14px", borderRadius: "8px", marginBottom: "12px", fontWeight: 700, fontSize: "13px" }}>
                {aomApprovalNotice}
              </div>
            )}

            {/* Table — exact same structure as TI */}
            <div className="ti2-table-wrap">
              <div className="ti2-pm-head ti2-pm-row">
                {["Name", "HRMS ID", "Station", "Submitted By", "Date", "Score", "Status", "Action"].map(h => <span key={h}>{h}</span>)}
              </div>
              {aomFilteredList.length === 0 && <p className="ti2-empty">No records in this category.</p>}
              {aomFilteredList.map(item => {
                const score = item.score || 0;
                const cat = item.category || aomGetCat(score);
                return (
                  <div key={item.id} className="ti2-pm-row ti2-pm-data-row">
                    <span><strong>{item.name}</strong></span>
                    <span>{item.hrmsId}</span>
                    <span>{item.station}</span>
                    <span>Traffic Inspector</span>
                    <span>{item.lastDate}</span>
                    <span><strong style={{ color: aomCAT_C[cat] }}>{score}/100</strong></span>
                    <span>
                      <span className={`ti2-status-pill ti2-status-${item.status.toLowerCase() === "submitted" ? "pending" : item.status.toLowerCase()}`}>
                        {item.status === "Submitted" ? "Pending" : item.status}
                      </span>
                    </span>
                    <span>
                      <button className="ti2-link-btn-sm" onClick={() => aomOpenReview(item.id)}>
                        {item.status === "Submitted" ? <><ClipboardCheck size={12} /> Review</> : <><Eye size={12} /> View</>}
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case "Counselling":
        return (
          <CommonCounselling
            users={allEmployees}
            isAom={true}
            addAuditLog={() => { }}
          />
        );

      case "PME Position":
        return (
          <CommonPmePosition
            users={allEmployees}
            exportAlert={(format, name) => alert(`Exporting PME Report in ${format} format...`)}
          />
        );

      case "REF Position":
        return (
          <CommonRefPosition
            users={allEmployees}
            exportAlert={(format, name) => alert(`Exporting REF Report in ${format} format...`)}
          />
        );

      default:
        return (
          <div className="page-header">
            <h2>{activePage}</h2>
            <p style={{ marginTop: "20px", fontSize: "14px", color: "#6a7385" }}>
              {activePage} content will be displayed here.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="app-shell">
      <input type="checkbox" id="sdom-sidebar-toggle" className="sdom-sidebar-checkbox" style={{ display: "none" }} />
      <label htmlFor="sdom-sidebar-toggle" className="sdom-sidebar-close-backdrop"></label>
      <header className="topbar">
        <label htmlFor="sdom-sidebar-toggle" className="sdom-sidebar-toggle-btn"></label>
        <div className="brand-group">
          <div className="brand-mark">IR</div>
          <h1>Indian Railway Evaluation System</h1>
        </div>
        <div className="topbar-right">
          <div className="admin-badge">
            <div className="avatar">{user.hrmsId.substring(0, 2).toUpperCase()}</div>
            <div>
              <strong>AOM Console</strong>
              <span>Zonal Headquarters</span>
            </div>
          </div>
          <button className="logout-btn" type="button" onClick={onLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <div className="layout-grid">
        <aside className="sidebar">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const stationPageActive = ["Station Management", "All Stations", "Add Station", "View / Edit Station"].includes(activePage);
            const assessmentsPageActive = ["Assessments", "Pending Approvals"].includes(activePage);
            const stationMastersActive = ["Station Masters", "Pointsman Under Station Master"].includes(activePage);
            const isActive =
              item.label === "Station Management" ? stationPageActive :
                item.label === "Assessments" ? assessmentsPageActive :
                  item.label === "Station Masters" ? stationMastersActive :
                    item.label === "Approvals" ? activePage === "Approvals" :
                      activePage === item.label;

            return (
              <button
                key={item.label}
                type="button"
                className={`sidebar-item ${isActive ? "active" : ""}`}
                onClick={() => handleSidebarClick(item.label)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        <main className="main-content">
          <div className="category-legend-row">
            <span className="category-legend-label">Category Legend</span>
            <div className="category-legend-circles">
              {[
                { key: "A", className: "category-a" },
                { key: "B", className: "category-b" },
                { key: "C", className: "category-c" },
                { key: "D", className: "category-d" }
              ].map((item) => (
                <span key={item.key} className={`category-circle ${item.className}`}>
                  {item.key}
                </span>
              ))}
            </div>
          </div>
          {renderPageContent()}
        </main>
      </div>
      {renderChartZoomModal()}
      <CommonUserModal
        isOpen={!!pmModal}
        onClose={() => setPmModal(null)}
        mode={pmModal?.mode}
        userData={pmModal?.data}
        setUserData={(data) => setPmModal(p => ({ ...p, data }))}
        onSubmit={savePmModal}
        stations={stations}
      />
      <CommonUserModal
        isOpen={!!smModal}
        onClose={() => setSmModal(null)}
        mode={smModal?.mode}
        userData={smModal?.data}
        setUserData={(data) => setSmModal(p => ({ ...p, data }))}
        onSubmit={saveSmModal}
        stations={stations}
      />
      <CommonUserModal
        isOpen={!!ssModal}
        onClose={() => setSsModal(null)}
        mode={ssModal?.mode}
        userData={ssModal?.data}
        setUserData={(data) => setSsModal(p => ({ ...p, data }))}
        onSubmit={saveSsModal}
        stations={stations}
      />
      <CommonUserModal
        isOpen={!!tmModal}
        onClose={() => setTmModal(null)}
        mode={tmModal?.mode}
        userData={tmModal?.data}
        setUserData={(data) => setTmModal(p => ({ ...p, data }))}
        onSubmit={saveTmModal}
        stations={stations}
      />
      {renderTiModal()}
      {renderAddStationModal()}
    </div>
  );
}

export default AOmModule;