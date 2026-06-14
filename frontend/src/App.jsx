import { useState, useEffect, lazy, Suspense } from "react";
import LoginPage from "./LoginPage";
import { getToken, getCurrentUser, logout, isAuthenticated, normalizeRole } from "./utils/auth";
import { LanguageProvider } from "./utils/LanguageContext";

const AOmModule = lazy(() => import("./AOmModule"));
const PointsmanModule = lazy(() => import("./PointsmanModule"));
const StationMasterModule = lazy(() => import("./StationMasterModule"));
const TrafficInspectorModule = lazy(() => import("./TrafficInspectorModule"));
const SuperAdminModule = lazy(() => import("./SuperAdminModule"));
const TrainManagerModule = lazy(() => import("./TrainManagerModule"));
const StationSuperintendentModule = lazy(() => import("./StationSuperintendentModule"));

// Visual-grade Loading Skeleton
function LoadingSkeleton() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f172a",
      color: "#f8fafc",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif"
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        width: "50px",
        height: "50px",
        border: "3px solid rgba(56, 189, 248, 0.1)",
        borderTop: "3px solid #38bdf8",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        marginBottom: "20px"
      }}></div>
      <div style={{
        fontSize: "16px",
        fontWeight: "700",
        letterSpacing: "0.07em",
        color: "#38bdf8",
        animation: "pulse 1.8s infinite ease-in-out",
        marginBottom: "6px",
        textTransform: "uppercase"
      }}>
        Indian Railways
      </div>
      <div style={{
        fontSize: "11px",
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        fontWeight: "600"
      }}>
        Loading Console Dashboard...
      </div>
    </div>
  );
}

// Visual-grade Unauthorized Page for Role Mismatch
function UnauthorizedPage({ onLogout }) {
  return (
    <div className="login-page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "20px" }}>
      <div className="login-card" style={{ maxWidth: "450px", width: "100%", textAlign: "center", padding: "40px" }}>
        <div className="login-header">
          <div className="logo-badge" style={{ backgroundColor: "#e03131", margin: "0 auto 20px" }}>⚠️</div>
          <h1 style={{ color: "#e03131", fontSize: "24px", margin: "10px 0 5px" }}>Unauthorized Access</h1>
          <p style={{ color: "#495057", fontSize: "14px", lineHeight: "1.6", margin: "15px 0 25px" }}>
            Your account role is not recognized or does not have access permissions for the dashboard modules in this system.
          </p>
        </div>
        <button 
          className="login-button" 
          onClick={onLogout} 
          style={{ 
            backgroundColor: "#1c7ed6", 
            color: "white", 
            padding: "12px 24px", 
            border: "none", 
            borderRadius: "6px", 
            fontSize: "14px", 
            fontWeight: "600", 
            cursor: "pointer", 
            width: "100%" 
          }}
        >
          Return to Login
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  if (window.location.search.includes("clear")) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  }

  const [isLoggedIn, setIsLoggedIn] = useState(() => isAuthenticated());
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "token" || e.key === "user") {
        setIsLoggedIn(isAuthenticated());
        setCurrentUser(getCurrentUser());
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogin = (loginData) => {
    const { token, employee } = loginData;
    
    // Normalize user designation
    const normalizedRole = normalizeRole(employee.designation);

    // Map database snake_case keys to frontend camelCase properties
    const mappedUser = {
      id: employee.id,
      hrmsId: employee.hrms_id,
      name: employee.name || "Employee",
      role: normalizedRole,
      email: employee.email,
      phone: employee.phone,
      stationCode: employee.station_code,
      gender: employee.gender,
      age: employee.age,
      reportingOfficerId: employee.reporting_officer_id
    };

    // Store auth details in localStorage
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(mappedUser));
    localStorage.setItem("role", normalizedRole);

    setCurrentUser(mappedUser);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  // Show login page if not authenticated or token is missing
  if (!isLoggedIn || !getToken()) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const role = currentUser?.role;

  const renderDashboard = () => {
    // Show AOM Dashboard for normalized AOM/General role
    if (role === "AOM/General") {
      return <AOmModule user={currentUser} onLogout={handleLogout} />;
    }

    if (role === "Pointsman") {
      return <PointsmanModule user={currentUser} onLogout={handleLogout} />;
    }

    if (role === "Station Master") {
      return <StationMasterModule user={currentUser} onLogout={handleLogout} />;
    }

    if (role === "Station Superintendent") {
      return <StationSuperintendentModule user={currentUser} onLogout={handleLogout} />;
    }

    if (role === "Train Manager") {
      return <TrainManagerModule user={currentUser} onLogout={handleLogout} />;
    }

    if (role === "Traffic Inspector") {
      return <TrafficInspectorModule user={currentUser} onLogout={handleLogout} />;
    }

    if (role === "Super Admin") {
      return <SuperAdminModule user={currentUser} onLogout={handleLogout} />;
    }

    // Fallback unauthorized view for unmapped or mismatching roles
    return <UnauthorizedPage onLogout={handleLogout} />;
  };

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      {renderDashboard()}
    </Suspense>
  );
}

// Root Application component wrapping all authenticated route modules under the LanguageProvider
function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
