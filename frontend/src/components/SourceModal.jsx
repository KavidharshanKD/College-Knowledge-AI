import React from "react";
import { X, FileText, Bookmark, Hash, Layers } from "lucide-react";

export default function SourceModal({ source, isOpen, onClose }) {
  if (!isOpen || !source) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-sm)",
                background: "rgba(99, 102, 241, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-primary)",
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.15rem", color: "#ffffff" }}>
                {source.document_filename}
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "2px" }}>
                <span
                  style={{
                    background: "rgba(6, 182, 212, 0.15)",
                    color: "var(--accent-teal)",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                  }}
                >
                  {source.category}
                </span>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "2px" }}>
                  <Bookmark size={13} /> Page {source.page_number || "1"}
                </span>
                {source.score && (
                  <span style={{ fontSize: "0.78rem", color: "var(--accent-emerald)" }}>
                    Relevance: {Math.round(source.score * 100)}%
                  </span>
                )}
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.25rem",
            background: "var(--bg-primary)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-glass)",
            fontSize: "0.92rem",
            lineHeight: 1.7,
            color: "#e2e8f0",
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
          }}
        >
          {source.snippet}
        </div>

        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.78rem",
            color: "var(--text-muted)",
          }}
        >
          <span>Retrieved through ChromaDB vector similarity search</span>
          <button
            onClick={onClose}
            style={{
              padding: "0.45rem 1rem",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-glass)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
