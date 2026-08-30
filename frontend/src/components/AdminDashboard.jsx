import React, { useState, useEffect } from "react";
import {
  Users,
  MessageCircle,
  HelpCircle,
  Database,
  LogOut,
  BarChart3,
  Activity,
  ChevronRight,
  Clock,
  Mail,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getAdminStats,
  getAdminActivity,
  getAdminStudents,
  getAdminDocuments,
} from "../services/api";
import AdminStudentsList from "./AdminStudentsList";
import AdminActivityView from "./AdminActivityView";
import AdminDocumentsView from "./AdminDocumentsView";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("stats"); // stats, students, activity, documents
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [students, setStudents] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const [statsRes, activityRes, studentsRes, documentsRes] = await Promise.all([
        getAdminStats(user.user_id),
        getAdminActivity(user.user_id, 10),
        getAdminStudents(user.user_id, 0, 100),
        getAdminDocuments(user.user_id),
      ]);

      setStats(statsRes);
      setActivity(activityRes);
      setStudents(studentsRes);
      setDocuments(documentsRes);
    } catch (err) {
      setError(err.message || "Failed to load dashboard");
      console.error(err);
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
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!user || user.role !== "admin") {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
        <p>Access Denied - Admin privileges required</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg-primary)" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "250px",
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          padding: "1.5rem",
        }}
      >
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.25rem" }}>College AI</h2>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>ADMIN DASHBOARD</p>
        </div>

        <nav style={{ flex: 1 }}>
          {[
            { id: "stats", label: "Dashboard", icon: BarChart3 },
            { id: "students", label: "Students", icon: Users },
            { id: "activity", label: "Activity", icon: Activity },
            { id: "documents", label: "Knowledge Base", icon: Database },
          ].map((item) => {
            const IconComp = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  marginBottom: "0.5rem",
                  background: isActive ? "rgba(99, 102, 241, 0.1)" : "transparent",
                  border: "1px solid " + (isActive ? "rgba(99, 102, 241, 0.3)" : "transparent"),
                  borderRadius: "var(--radius-sm)",
                  color: isActive ? "var(--accent-indigo)" : "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: isActive ? 600 : 500,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.target.style.background = "rgba(99, 102, 241, 0.05)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.target.style.background = "transparent";
                }}
              >
                <IconComp size={18} />
                <span>{item.label}</span>
                {isActive && <ChevronRight size={16} style={{ marginLeft: "auto" }} />}
              </button>
            );
          })}
        </nav>

        {/* Admin Profile */}
        <div
          style={{
            padding: "1rem",
            background: "rgba(99, 102, 241, 0.05)",
            borderRadius: "var(--radius-sm)",
            borderTop: "1px solid var(--border)",
            marginTop: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
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
              {getInitials(user.name)}
            </div>
            <div style={{ fontSize: "0.85rem", overflow: "hidden" }}>
              <div style={{ fontWeight: 600 }}>{user.name}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{user.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "0.5rem",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "#f87171",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(239, 68, 68, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(239, 68, 68, 0.1)";
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <header
          style={{
            padding: "1.5rem 2rem",
            background: "var(--bg-secondary)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>
              {activeTab === "stats" && "Dashboard"}
              {activeTab === "students" && "Students"}
              {activeTab === "activity" && "Recent Activity"}
              {activeTab === "documents" && "Knowledge Base"}
            </h1>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {activeTab === "stats" && "System overview and key metrics"}
              {activeTab === "students" && "Registered students and their usage"}
              {activeTab === "activity" && "Recent student interactions"}
              {activeTab === "documents" && "Indexed documents and status"}
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            style={{
              padding: "0.5rem 1rem",
              background: "rgba(6, 182, 212, 0.1)",
              border: "1px solid rgba(6, 182, 212, 0.3)",
              color: "#22d3ee",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              transition: "all 0.2s",
            }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {/* Content Area */}
        <div style={{ flex: 1, overflow: "auto", padding: "2rem" }}>
          {error && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#f87171",
                padding: "1rem",
                borderRadius: "var(--radius-sm)",
                marginBottom: "1.5rem",
              }}
            >
              {error}
            </div>
          )}

          {loading && !stats ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
              <p>Loading dashboard...</p>
            </div>
          ) : (
            <>
              {activeTab === "stats" && (
                <div>
                  {/* Stats Cards */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "1.5rem",
                      marginBottom: "2rem",
                    }}
                  >
                    {[
                      { label: "Total Students", value: stats?.total_students || 0, icon: Users, color: "#a78bfa" },
                      { label: "Total Conversations", value: stats?.total_conversations || 0, icon: MessageCircle, color: "#f472b6" },
                      { label: "Total Questions", value: stats?.total_messages || 0, icon: HelpCircle, color: "#22d3ee" },
                      { label: "Knowledge Base Chunks", value: stats?.knowledge_base_chunks || 0, icon: Database, color: "#86efac" },
                    ].map((card, idx) => {
                      const IconComp = card.icon;
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: "1.5rem",
                            background: "var(--bg-secondary)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-md)",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                            <h3 style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 500 }}>{card.label}</h3>
                            <IconComp size={20} style={{ color: card.color }} />
                          </div>
                          <p style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text-primary)" }}>
                            {card.value.toLocaleString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Recent Activity Section */}
                  <div
                    style={{
                      padding: "1.5rem",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    }}
                  >
                    <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Activity size={20} /> Recent Student Activity
                    </h2>

                    {activity.length === 0 ? (
                      <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem" }}>No recent activity</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {activity.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: "1rem",
                              background: "rgba(99, 102, 241, 0.05)",
                              border: "1px solid rgba(99, 102, 241, 0.1)",
                              borderRadius: "var(--radius-sm)",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flex: 1, minWidth: 0 }}>
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
                                  fontWeight: 700",
                                  flexShrink: 0,
                                }}
                              >
                                {getInitials(item.student_name)}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.25rem" }}>{item.student_name}</p>
                                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {item.message_preview || "No preview"}
                                </p>
                              </div>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                color: "var(--text-muted)",
                                fontSize: "0.8rem",
                                flexShrink: 0,
                              }}
                            >
                              <Clock size={14} />
                              {formatDate(item.timestamp)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "students" && (
                <AdminStudentsList
                  students={students}
                  adminId={user.user_id}
                  onSelectStudent={setSelectedStudent}
                  selectedStudent={selectedStudent}
                />
              )}

              {activeTab === "activity" && <AdminActivityView activity={activity} formatDate={formatDate} getInitials={getInitials} />}

              {activeTab === "documents" && <AdminDocumentsView documents={documents} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
