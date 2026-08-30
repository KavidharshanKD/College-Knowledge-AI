import React from "react";
import { Menu, Sparkles, BookOpen, Layers } from "lucide-react";

export default function Header({ currentTitle, onToggleMobileMenu, onOpenKBModal }) {
  return (
    <header className="main-header">
      <div className="header-title-container">
        <button className="mobile-menu-toggle" onClick={onToggleMobileMenu}>
          <Menu size={18} />
        </button>
        <span className="header-title">{currentTitle || "New Conversation"}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button
          onClick={onOpenKBModal}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--border-glass)",
            color: "var(--text-secondary)",
            padding: "0.35rem 0.75rem",
            borderRadius: "var(--radius-full)",
            fontSize: "0.75rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          <Layers size={14} color="var(--accent-teal)" />
          <span>Knowledge Base</span>
        </button>

        <div className="status-pill">
          <div className="status-dot"></div>
          <span>RAG Pipeline Active</span>
        </div>
      </div>
    </header>
  );
}
