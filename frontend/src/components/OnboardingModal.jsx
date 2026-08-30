import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { GraduationCap, ArrowRight, Sparkles, ShieldCheck, Lock } from "lucide-react";
import confetti from "canvas-confetti";

export default function OnboardingModal({ isOpen, onClose, onSwitchToAdmin }) {
  const { login, loading, error } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [localError, setLocalError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setLocalError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setLocalError("Please enter a valid email address.");
      return;
    }

    try {
      setLocalError("");
      await login(name.trim(), email.trim());
      // Student delight confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {}
      if (onClose) onClose();
    } catch (err) {
      setLocalError(err.message || "Failed to enter portal");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div className="welcome-icon-box" style={{ width: "54px", height: "54px", marginBottom: "1rem" }}>
            <GraduationCap size={28} />
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            Welcome to College AI
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "0.4rem" }}>
            Access verified syllabus, fees, academic calendars, and lab manuals through RAG-powered intelligence.
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
            <label className="form-label">Your Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Tanvi Punekar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. tanvi@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            {loading ? "Connecting..." : "Enter Assistant"}
            <ArrowRight size={18} />
          </button>
        </form>

        <div
          style={{
            marginTop: "1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.4rem",
            color: "var(--text-muted)",
            fontSize: "0.74rem",
          }}
        >
          <ShieldCheck size={14} color="var(--accent-emerald)" />
          <span>No password or college ID required. Auto-associates your chat history.</span>
        </div>

        <div style={{ marginTop: "1rem", textAlign: "center", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
          <button
            onClick={onSwitchToAdmin}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "0.88rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              margin: "0 auto",
              textDecoration: "underline",
            }}
          >
            <Lock size={14} />
            Admin Access
          </button>
        </div>
      </div>
    </div>
  );
}
