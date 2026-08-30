import React from "react";
import { Clock, User, MessageCircle } from "lucide-react";

export default function AdminActivityView({ activity, formatDate, getInitials }) {
  return (
    <div
      style={{
        padding: "1.5rem",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
      }}
    >
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.5rem" }}>
        Recent Student Questions
      </h2>

      {activity.length === 0 ? (
        <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem" }}>
          No recent activity
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {activity.map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: "1.25rem",
                background: "rgba(99, 102, 241, 0.05)",
                border: "1px solid rgba(99, 102, 241, 0.1)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  marginBottom: "0.75rem",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {getInitials(item.student_name)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.5rem",
                      gap: "1rem",
                    }}
                  >
                    <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                      {item.student_name}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        color: "var(--text-muted)",
                        fontSize: "0.8rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Clock size={14} />
                      {formatDate(item.timestamp)}
                    </div>
                  </div>

                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.9rem",
                      lineHeight: "1.5",
                      marginBottom: "0.75rem",
                      overflowWrap: "break-word",
                    }}
                  >
                    {item.message_preview || "No preview available"}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      gap: "1.5rem",
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <MessageCircle size={14} />
                      Conversation: {item.conversation_title || "Untitled"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
