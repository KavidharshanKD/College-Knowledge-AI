import React, { useState, useEffect } from "react";
import { ArrowLeft, Loader } from "lucide-react";
import { getAdminConversationDetails } from "../services/api";

export default function AdminStudentConversationsList({ conversation, student, adminId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConversationDetails();
  }, [conversation.conversation_id]);

  const fetchConversationDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const details = await getAdminConversationDetails(adminId, conversation.conversation_id);
      setMessages(details.messages || []);
    } catch (err) {
      setError(err.message || "Failed to load conversation");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <button
          onClick={onBack}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            padding: "0.5rem 1rem",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <ArrowLeft size={16} />
          Back to {student.name}
        </button>
      </div>

      {/* Conversation Info */}
      <div
        style={{
          padding: "1.5rem",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          {conversation.title}
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
          {student.name} • {formatDate(conversation.created_at)} • {messages.length} messages
        </p>
        <div style={{ display: "flex", gap: "2rem", fontSize: "0.85rem" }}>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Student Email:</span> {student.email}
          </div>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Conversation ID:</span>{" "}
            <code style={{ background: "rgba(99, 102, 241, 0.1)", padding: "0.25rem 0.5rem", borderRadius: "3px" }}>
              {conversation.conversation_id.slice(0, 8)}...
            </code>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          padding: "1.5rem",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          minHeight: "400px",
        }}
      >
        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1.5rem" }}>Conversation</h3>

        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#f87171",
              padding: "0.75rem",
              borderRadius: "var(--radius-sm)",
              marginBottom: "1rem",
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
            <Loader size={24} style={{ margin: "0 auto 0.5rem", animation: "spin 1s linear infinite" }} />
            <p>Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem" }}>
            No messages in this conversation
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {messages.map((message, idx) => (
              <div
                key={message.message_id}
                style={{
                  padding: "1rem",
                  background: message.role === "user" ? "rgba(6, 182, 212, 0.05)" : "rgba(99, 102, 241, 0.05)",
                  border: message.role === "user" ? "1px solid rgba(6, 182, 212, 0.1)" : "1px solid rgba(99, 102, 241, 0.1)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <p style={{ fontWeight: 700, color: message.role === "user" ? "#22d3ee" : "#a78bfa" }}>
                    {message.role === "user" ? "Student Question" : "AI Response"}
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {formatTime(message.created_at)}
                  </p>
                </div>

                <div style={{ marginBottom: "0.75rem" }}>
                  <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: "1.6" }}>
                    {message.content}
                  </p>
                </div>

                {/* Sources (for AI responses) */}
                {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                  <div
                    style={{
                      marginTop: "0.75rem",
                      paddingTop: "0.75rem",
                      borderTop: "1px solid " + (message.role === "user" ? "rgba(6, 182, 212, 0.2)" : "rgba(99, 102, 241, 0.2)"),
                    }}
                  >
                    <p style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-muted)" }}>
                      Sources:
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {message.sources.map((source, sidx) => (
                        <div key={sidx} style={{ fontSize: "0.85rem" }}>
                          <p style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                            {source.document_filename || "Unknown"}
                          </p>
                          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                            Category: {source.category || "N/A"} • Page: {source.page_number || "N/A"} • Score: {(source.score || 0).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
