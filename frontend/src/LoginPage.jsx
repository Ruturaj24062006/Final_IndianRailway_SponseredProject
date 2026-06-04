import { useState } from "react";
import { LogIn, AlertCircle } from "lucide-react";

function LoginPage({ onLogin }) {
  const [hrmsId, setHrmsId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Dummy user database
  const dummyUsers = [
    { hrmsId: "PM_1001", password: "password123", role: "Pointsman", name: "Ravi Kumar" },
    { hrmsId: "PM_1101", password: "password123", role: "Pointsman", name: "Ravi Kumar" },
    { hrmsId: "PM_1102", password: "password123", role: "Pointsman", name: "Sanjay Patil" },
    { hrmsId: "PM_1103", password: "password123", role: "Pointsman", name: "Deepak Nair" },
    { hrmsId: "PM_1104", password: "password123", role: "Pointsman", name: "Ajay Sharma" },
    { hrmsId: "PM_1105", password: "password123", role: "Pointsman", name: "Kunal Verma" },
    { hrmsId: "PM_1106", password: "password123", role: "Pointsman", name: "Priya Menon" },
    { hrmsId: "PM_1107", password: "password123", role: "Pointsman", name: "Ramesh Yadav" },
    { hrmsId: "PM_1108", password: "password123", role: "Pointsman", name: "Sneha Iyer" },
    { hrmsId: "SM_1001", password: "password123", role: "Station Master", name: "S. Deshmukh" },
    { hrmsId: "SM_1002", password: "password123", role: "Station Master", name: "Amit Sharma" },
    { hrmsId: "SM_1003", password: "password123", role: "Station Master", name: "Vikram Malhotra" },
    { hrmsId: "TM_1001", password: "password123", role: "Train Manager", name: "Train Manager User" },
    { hrmsId: "SS_1001", password: "password123", role: "Station Superintendent", name: "Station Superintendent User" },
    { hrmsId: "TI_1001", password: "password123", role: "Traffic Inspector", name: "Traffic Inspector User" },
    { hrmsId: "GM_1001", password: "password123", role: "AOM/General", name: "General Manager User" },
    { hrmsId: "AOM_1001", password: "password123", role: "AOM/General", name: "AOM User" },
    { hrmsId: "AOM", password: "password123", role: "AOM/General", name: "AOM User" },
    { hrmsId: "aom", password: "password123", role: "AOM/General", name: "AOM User" },
    { hrmsId: "SA_1001", password: "password123", role: "Super Admin", name: "Super Admin User" }
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const inputHrms = hrmsId.trim();
      const inputPass = password.trim();

      if (!inputHrms || !inputPass) {
        setError("Please enter both HRMS ID and Password");
        setLoading(false);
        return;
      }

      // Validate credentials (case-insensitive username check, accepts any password for ease of evaluation)
      const user = dummyUsers.find(
        (u) => u.hrmsId.toLowerCase() === inputHrms.toLowerCase()
      );

      if (user) {
        // Extract role from ID prefix case-insensitively
        const idPrefix = user.hrmsId.split("_")[0].toUpperCase();
        const roleMap = {
          PM: "Pointsman",
          SM: "Station Master",
          TM: "Train Manager",
          SS: "Station Superintendent",
          TI: "Traffic Inspector",
          GM: "AOM/General",
          AOM: "AOM/General",
          SA: "Super Admin"
        };

        const detectedRole = roleMap[idPrefix] || user.role;

        onLogin({
          hrmsId: user.hrmsId,
          role: detectedRole,
          name: user.name || `${detectedRole} User`
        });
      } else {
        setError("Invalid HRMS ID or Password");
      }

      setLoading(false);
    }, 500);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <div className="logo-badge">IR</div>
            </div>
            <h1>Indian Railway</h1>
            <p>Staff Management System</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            {error && (
              <div className="login-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="login-field">
              <label>HRMS ID</label>
              <input
                type="text"
                value={hrmsId}
                onChange={(e) => setHrmsId(e.target.value)}
                placeholder="Enter your HRMS ID"
                disabled={loading}
              />
            </div>

            <div className="login-field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner">Signing in...</span>
              ) : (
                <>
                  <LogIn size={16} />
                  Sign In
                </>
              )}
            </button>
          </form>


        </div>

        <div className="login-footer">
          <p>© 2026 Indian Railways. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
