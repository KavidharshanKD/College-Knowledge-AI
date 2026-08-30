import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Shield, ArrowRight, Lock, Mail } from "lucide-react";

export default function AdminLoginModal({ isOpen, onClose, onSwitchToStudent }) {
  const { adminLogin, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setLocalError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setLocalError("Please enter your password.");
      return;
    }

    try {
      setLocalError("");
      await adminLogin(email.trim(), password);
      if (onClose) onClose();
    } catch (err) {
      setLocalError(err.message || "Failed to log in as admin");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div className="welcome-icon-box" style={{ width: "54px", height: "54px", marginBottom: "1rem", background: "linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)" }}>
            <Shield size={28} />
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            Admin Access
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "0.4rem" }}>
            Secure administrator dashboard for system management.
          </p>
        </div>

        {(localError || error) && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#f87171",
              padding: "0.6rem 0.85rem",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.82rem",
              marginBottom: "1rem",
            }}
          >
            {localError || error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Admin Email</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
              <input
                type="email"
                className="form-input"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoFocus
                style={{ paddingLeft: "36px" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                style={{ paddingLeft: "36px" }}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: "1rem" }}>
            {loading ? "Authenticating..." : "Admin Access"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div style={{ marginTop: "1rem", textAlign: "center", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
          <button
            onClick={onSwitchToStudent}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "0.88rem",
              textDecoration: "underline",
            }}
          >
            Switch to Student Login
          </button>
        </div>
      </div>
    </div>
  );
}
