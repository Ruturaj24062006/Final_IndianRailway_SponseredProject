import React from "react";
import SMDashboard from "../StationMasterModule/SMDashboard";

export default function SSDashboard({
  latestScore,
  averageScore,
  latestCategory,
  history,
  trendData,
  pieData,
  openScorecard,
  getCategoryBg,
  getCategoryColor,
  setActiveNav,
  users = [],
  viewingStaff,
  setViewingStaff
}) {
  // Helpers
  function riskLevel(pm) {
    if (pm.lastScore < 50 || pm.incidents > 1) return "High";
    if (pm.lastScore < 80 || pm.incidents === 1) return "Medium";
    return "Low";
  }

  function getCat(score) {
    if (score >= 80) return "A";
    if (score >= 50) return "B";
    if (score >= 26) return "C";
    return "D";
  }

  // Filter staff under the SS (Nagpur Junction)
  const pointsmen = users
    .filter(u => u.role === "Pointsman" && u.station === "Nagpur Junction")
    .map(u => ({
      ...u,
      hrmsId: u.id,
      lastScore: u.score || 80,
      safetyScore: u.score || 80,
      incidents: 0,
      pmeStatus: u.pmeStatus || "Fit",
      refStatus: u.refStatus || "Cleared"
    }));

  const smList = users
    .filter(u => u.role === "Station Master" && u.station === "Nagpur Junction")
    .map(u => ({
      ...u,
      hrmsId: u.id,
      score: u.score || 80,
      lastDate: u.lastAssessDate,
      status: "Approved"
    }));

  return (
    <SMDashboard
      averageScore={averageScore}
      complianceRate={94}
      pointsmen={pointsmen}
      stationHistory={trendData}
      scoreHistory={trendData}
      barChartData={pieData}
      pieData={pieData}
      openScorecard={openScorecard}
      latestCategory={latestCategory}
      latestScore={latestScore}
      latestPmeStatus="Fit"
      latestRefStatus="Cleared"
      smId="SS_1001"
      drafts={[]}
      riskLevel={riskLevel}
      getCat={getCat}
      setActiveTab={setActiveNav}
      viewingStaff={viewingStaff}
      setViewingStaff={setViewingStaff}
      openPmDetail={openScorecard}
      smList={smList}
    />
  );
}
