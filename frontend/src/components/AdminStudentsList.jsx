import React, { useState, useEffect } from "react";
import { ChevronRight, MessageCircle, HelpCircle } from "lucide-react";
import { getAdminStudentConversations, getAdminConversationDetails } from "../services/api";
import AdminStudentConversationsList from "./AdminStudentConversationsList";

export default function AdminStudentsList({ students, adminId, onSelectStudent, selectedStudent }) {
  const [selectedStudentData, setSelectedStudentData] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSelectStudent = async (student) => {
    setSelectedStudentData(student);
    setSelectedConversation(null);
    setLoading(true);
    setError(null);

    try {
      const convs = await getAdminStudentConversations(adminId, student.user_id);
      setConversations(convs);
    } catch (err) {
      setError(err.message || "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (selectedConversation && selectedStudentData) {
    return (
      <AdminStudentConversationsList
        conversation={selectedConversation}
        student={selectedStudentData}
        adminId={adminId}
        onBack={() => setSelectedConversation(null)}
      />
    );
  }

  if (selectedStudentData) {
    return (
      <div>
        <button
          onClick={() => {
            setSelectedStudentData(null);
            setConversations([]);
          }}
          style={{
            marginBottom: "1.5rem",
            background: "transparent",
            border: "1px solid var(--border)",
            padding: "0.5rem 1rem",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          ← Back to Students
        </button>

        {/* Student Info */}
        <div
          style={{
            padding: "1.5rem",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.5rem",
            display: "flex",
            gap: "1.5rem",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "1.2rem",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {getInitials(selectedStudentData.name)}
          </div>
          <div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              {selectedStudentData.name}
            </h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              {selectedStudentData.email}
            </p>
            <div style={{ display: "flex", gap: "2rem", fontSize: "0.9rem" }}>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Student ID:</span>{" "}
                <code style={{ background: "rgba(99, 102, 241, 0.1)", padding: "0.25rem 0.5rem", borderRadius: "3px" }}>
                  {selectedStudentData.user_id.slice(0, 8)}...
                </code>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Joined:</span> {formatDate(selectedStudentData.created_at)}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <div
            style={{
              padding: "1rem",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              textAlign: "center",
            }}
          >
            <MessageCircle size={20} style={{ margin: "0 auto 0.5rem", color: "#f472b6" }} />
            <p style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>
              {selectedStudentData.conversation_count}
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Conversations</p>
          </div>
          <div
            style={{
              padding: "1rem",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              textAlign: "center",
            }}
          >
            <HelpCircle size={20} style={{ margin: "0 auto 0.5rem", color: "#22d3ee" }} />
            <p style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>
              {selectedStudentData.message_count}
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Questions</p>
          </div>
        </div>

        {/* Conversations List */}
        <div
          style={{
            padding: "1.5rem",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.5rem" }}>
            Conversation History ({conversations.length})
          </h3>

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
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "1rem" }}>Loading...</p>
          ) : conversations.length === 0 ? (
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "1rem" }}>
              No conversations yet
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {conversations.map((conv) => (
                <button
                  key={conv.conversation_id}
                  onClick={() => setSelectedConversation(conv)}
                  style={{
                    width: "100%",
                    padding: "1rem",
                    background: "rgba(99, 102, 241, 0.05)",
                    border: "1px solid rgba(99, 102, 241, 0.1)",
                    borderRadius: "var(--radius-sm)",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(99, 102, 241, 0.05)";
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{conv.title}</p>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      {conv.message_count} messages • {formatDate(conv.created_at)}
                    </p>
                  </div>
                  <ChevronRight size={18} style={{ color: "var(--accent-indigo)" }} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Students List Table
  return (
    <div
      style={{
        padding: "1.5rem",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        overflowX: "auto",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--border)" }}>
            <th style={{ padding: "1rem", textAlign: "left", fontWeight: 700, color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Student
            </th>
            <th style={{ padding: "1rem", textAlign: "left", fontWeight: 700, color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Email
            </th>
            <th style={{ padding: "1rem", textAlign: "center", fontWeight: 700, color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Conversations
            </th>
            <th style={{ padding: "1rem", textAlign: "center", fontWeight: 700, color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Questions
            </th>
            <th style={{ padding: "1rem", textAlign: "left", fontWeight: 700, color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Joined
            </th>
            <th style={{ padding: "1rem", textAlign: "center", fontWeight: 700, color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                No students found
              </td>
            </tr>
          ) : (
            students.map((student) => (
              <tr
                key={student.user_id}
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
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                      }}
                    >
                      {getInitials(student.name)}
                    </div>
                    <p style={{ fontWeight: 600 }}>{student.name}</p>
                  </div>
                </td>
                <td style={{ padding: "1rem" }}>
                  <code
                    style={{
                      background: "rgba(99, 102, 241, 0.1)",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "3px",
                      fontSize: "0.85rem",
                    }}
                  >
                    {student.email}
                  </code>
                </td>
                <td style={{ padding: "1rem", textAlign: "center" }}>
                  <strong>{student.conversation_count}</strong>
                </td>
                <td style={{ padding: "1rem", textAlign: "center" }}>
                  <strong>{student.message_count}</strong>
                </td>
                <td style={{ padding: "1rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                  {formatDate(student.created_at)}
                </td>
                <td style={{ padding: "1rem", textAlign: "center" }}>
                  <button
                    onClick={() => handleSelectStudent(student)}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "rgba(99, 102, 241, 0.1)",
                      border: "1px solid rgba(99, 102, 241, 0.3)",
                      color: "var(--accent-indigo)",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(99, 102, 241, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
