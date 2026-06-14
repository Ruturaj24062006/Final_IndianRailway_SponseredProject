import { useState } from "react";
import { LogIn, AlertCircle } from "lucide-react";
import { useLanguage } from "./utils/LanguageContext";
import LanguageSwitcher from "./components/LanguageSwitcher";

function LoginPage({ onLogin }) {
  const { locale, changeLanguage, t } = useLanguage();
  const [hrmsId, setHrmsId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const inputHrms = hrmsId.trim();
    const inputPass = password.trim();

    if (!inputHrms || !inputPass) {
      setError(t("login.errorEmpty"));
      return;
    }

    setLoading(true);

    try {
      let response;
      try {
        response = await fetch("http://127.0.0.1:5000/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            hrms_id: inputHrms,
            password: inputPass,
          }),
        });
      } catch (e) {
        console.warn("Direct login to http://localhost:5000 failed, trying relative proxy path...", e);
        response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            hrms_id: inputHrms,
            password: inputPass,
          }),
        });
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || t("login.errorInvalid"));
        setLoading(false);
        return;
      }

      // Pass success data to App parent component
      onLogin(data);
    } catch (err) {
      console.error("Login request error:", err);
      setError(t("login.errorNetwork"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div style={{ position: "absolute", top: "20px", right: "20px", zIndex: 10 }}>
        <LanguageSwitcher />
      </div>
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <div className="logo-badge">IR</div>
            </div>
            <h1>{t("login.title")}</h1>
            <p>{t("login.subtitle")}</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            {error && (
              <div className="login-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="login-field">
              <label>{t("login.hrmsId")}</label>
              <input
                type="text"
                value={hrmsId}
                onChange={(e) => setHrmsId(e.target.value)}
                placeholder={t("login.hrmsIdPlaceholder")}
                disabled={loading}
              />
            </div>

            <div className="login-field">
              <label>{t("login.password")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("login.passwordPlaceholder")}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner">{t("login.signingIn")}</span>
              ) : (
                <>
                  <LogIn size={16} />
                  {t("login.signIn")}
                </>
              )}
            </button>
          </form>

        </div>

        <div className="login-footer">
          <p>{t("login.footer")}</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
