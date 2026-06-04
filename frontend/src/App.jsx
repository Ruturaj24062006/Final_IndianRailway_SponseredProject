import { useState } from "react";
import LoginPage from "./LoginPage";
import RoleBasedDashboard from "./RoleBasedDashboard";
import AOmModule from "./AOmModule";
import PointsmanModule from "./PointsmanModule";
import StationMasterModule from "./StationMasterModule";
import TrafficInspectorModule from "./TrafficInspectorModule";
import SuperAdminModule from "./SuperAdminModule";
import TrainManagerModule from "./TrainManagerModule";
import StationSuperintendentModule from "./StationSuperintendentModule";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  // Show login page if not authenticated
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Show AOM Dashboard for AOM/General role
  if (currentUser.role === "AOM/General") {
    return <AOmModule user={currentUser} onLogout={handleLogout} />;
  }

  if (currentUser.role === "Pointsman") {
    return <PointsmanModule user={currentUser} onLogout={handleLogout} />;
  }

  if (currentUser.role === "Station Master") {
    return <StationMasterModule user={currentUser} onLogout={handleLogout} />;
  }

  if (currentUser.role === "Station Superintendent" || currentUser.role === "Station Supervisor") {
    return <StationSuperintendentModule user={currentUser} onLogout={handleLogout} />;
  }

  if (currentUser.role === "Train Manager") {
    return <TrainManagerModule user={currentUser} onLogout={handleLogout} />;
  }

  if (currentUser.role === "Traffic Inspector") {
    return <TrafficInspectorModule user={currentUser} onLogout={handleLogout} />;
  }

  if (currentUser.role === "Super Admin") {
    return <SuperAdminModule user={currentUser} onLogout={handleLogout} />;
  }

  // Show role-based dashboard for other roles
  return <RoleBasedDashboard user={currentUser} onLogout={handleLogout} />;
}

export default App;
