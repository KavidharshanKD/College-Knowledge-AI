import React from "react";
import { FileText, Zap, Calendar } from "lucide-react";

export default function AdminDocumentsView({ documents }) {
  const getFileIcon = (filename) => {
    if (filename.endsWith(".pdf")) return "📄";
    if (filename.endsWith(".txt")) return "📃";
    if (filename.endsWith(".docx")) return "📝";
    if (filename.endsWith(".xlsx")) return "📊";
    return "📋";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div>
      {/* Statistics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            padding: "1.5rem",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            textAlign: "center",
          }}
        >
          <FileText size={24} style={{ margin: "0 auto 0.75rem", color: "#f472b6" }} />
          <p style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>
            {documents.length || 0}
          </p>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Total Documents</p>
        </div>

        <div
          style={{
            padding: "1.5rem",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            textAlign: "center",
          }}
        >
          <Zap size={24} style={{ margin: "0 auto 0.75rem", color: "#86efac" }} />
          <p style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>
            {documents.reduce((sum, doc) => sum + (doc.chunk_count || 0), 0) || 0}
          </p>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Total Chunks Indexed</p>
        </div>
      </div>

      {/* Documents List */}
      <div
        style={{
          padding: "1.5rem",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          overflowX: "auto",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.5rem" }}>
          Indexed Documents
        </h2>

        {documents.length === 0 ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem" }}>
            No documents indexed yet
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    fontSize: "0.9rem",
                  }}
                >
                  Document
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    fontSize: "0.9rem",
                  }}
                >
                  Category
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "center",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    fontSize: "0.9rem",
                  }}
                >
                  Chunks
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    fontSize: "0.9rem",
                  }}
                >
                  Added
                </th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(99, 102, 241, 0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <td style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontSize: "1.2rem" }}>
                        {getFileIcon(doc.filename)}
                      </span>
                      <p style={{ fontWeight: 600, wordBreak: "break-all" }}>
                        {doc.filename}
                      </p>
                    </div>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.35rem 0.75rem",
                        background: "rgba(6, 182, 212, 0.1)",
                        border: "1px solid rgba(6, 182, 212, 0.3)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.85rem",
                        color: "#22d3ee",
                      }}
                    >
                      {doc.category || "General"}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", textAlign: "center" }}>
                    <strong>{doc.chunk_count || 0}</strong>
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      fontSize: "0.9rem",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <Calendar size={14} />
                    {formatDate(doc.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
