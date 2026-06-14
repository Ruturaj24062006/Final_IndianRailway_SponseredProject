import React, { useState, useEffect, useRef } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useLanguage } from "../utils/LanguageContext";

export default function LanguageSwitcher() {
  const { locale, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Click outside listener to auto-close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const languages = [
    { code: "en", name: "English" },
    { code: "hi", name: "हिन्दी" },
    { code: "mr", name: "मराठी" }
  ];

  const currentLangName = languages.find(l => l.code === locale)?.name || "English";

  return (
    <div ref={dropdownRef} className="sdom-lang-switcher-container" style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          color: "#ffffff !important",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "8px",
          padding: "6px 12px",
          fontSize: "12px",
          fontWeight: "600",
          outline: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          transition: "all 0.2s ease-in-out",
          backdropFilter: "blur(4px)"
        }}
        className="sdom-lang-btn"
        aria-label="Change Language"
      >
        <Globe size={15} style={{ color: "#ffffff" }} />
        <span style={{ color: "#ffffff" }}>{currentLangName}</span>
        <ChevronDown size={12} style={{
          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s ease",
          color: "#ffffff"
        }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "38px",
            right: 0,
            background: "#ffffff",
            border: "1px solid #e2edf8",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.15)",
            zIndex: 1000,
            width: "140px",
            padding: "4px",
            overflow: "hidden",
            color: "#0f172a",
            fontFamily: "'Inter', system-ui, sans-serif",
            animation: "sdomFadeIn 0.15s ease-out"
          }}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                changeLanguage(lang.code);
                setIsOpen(false);
              }}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "none",
                border: "none",
                borderRadius: "6px",
                color: locale === lang.code ? "#2563eb !important" : "#1e293b !important",
                fontSize: "13px",
                fontWeight: locale === lang.code ? "700" : "500",
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                transition: "background 0.15s ease"
              }}
              className="sdom-lang-item-hover"
            >
              <span style={{ color: locale === lang.code ? "#2563eb !important" : "#1e293b !important" }}>{lang.name}</span>
              {locale === lang.code && <Check size={14} style={{ color: "#2563eb !important" }} />}
            </button>
          ))}
        </div>
      )}

      {/* Dynamic style tag for CSS transitions and hovers */}
      <style>{`
        @keyframes sdomFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .sdom-lang-btn {
          color: #ffffff !important;
        }
        .sdom-lang-btn span {
          color: #ffffff !important;
        }
        .sdom-lang-btn svg {
          color: #ffffff !important;
        }
        .sdom-lang-btn:hover {
          background: rgba(255, 255, 255, 0.15) !important;
          border-color: rgba(255, 255, 255, 0.25) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .sdom-lang-item-hover {
          color: #1e293b !important;
        }
        .sdom-lang-item-hover span {
          color: #1e293b !important;
        }
        .sdom-lang-item-hover:hover {
          background: #f1f5f9 !important;
          color: #0f172a !important;
        }
        .sdom-lang-item-hover:hover span {
          color: #0f172a !important;
        }
      `}</style>
    </div>
  );
}
