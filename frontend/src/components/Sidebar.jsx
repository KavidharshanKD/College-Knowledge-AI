import React from "react";
import { Plus, MessageSquare, Trash2, Database, LogOut, Bot, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onOpenKBModal,
  isOpen,
  onCloseMobile,
}) {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <div className="brand-badge">
          <div className="brand-icon">
            <Bot size={22} />
          </div>
          <div className="brand-info">
            <h1>College AI</h1>
            <span>RAG Knowledge Base</span>
          </div>
        </div>
      </div>

      <button className="new-chat-btn" onClick={onNewChat}>
        <Plus size={18} />
        <span>New Conversation</span>
      </button>

      <div className="conversation-list">
        {conversations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
            No chat history yet. Ask a question to begin!
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.conversation_id}
              className={`conv-item ${conv.conversation_id === activeId ? "active" : ""}`}
              onClick={() => {
                onSelectConversation(conv.conversation_id);
                if (onCloseMobile) onCloseMobile();
              }}
            >
              <MessageSquare size={15} style={{ flexShrink: 0, marginRight: "0.5rem" }} />
              <span className="conv-title">{conv.title || "Untitled Conversation"}</span>
              <button
                className="conv-delete-btn"
                title="Delete Conversation"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conv.conversation_id);
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="sidebar-footer">
        <button className="kb-status-btn" onClick={onOpenKBModal}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Database size={15} />
            <span>Document Knowledge Base</span>
          </div>
          <span style={{ fontSize: "0.7rem", background: "rgba(6, 182, 212, 0.2)", padding: "1px 6px", borderRadius: "999px" }}>
            63 Docs
          </span>
        </button>

        {user && (
          <div className="user-profile-badge">
            <div className="user-avatar">{getInitials(user.name)}</div>
            <div className="user-details">
              <div className="user-name">{user.name}</div>
              <div className="user-email">{user.email}</div>
            </div>
            <button className="user-logout-btn" title="Switch User" onClick={logout}>
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
