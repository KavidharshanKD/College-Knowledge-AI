import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import ChatArea from "./components/ChatArea";
import OnboardingModal from "./components/OnboardingModal";
import SourceModal from "./components/SourceModal";
import KnowledgeBaseModal from "./components/KnowledgeBaseModal";
import {
  getConversations,
  getConversationDetails,
  createConversation,
  deleteConversation,
  sendChatMessage,
} from "./services/api";

function AppContent() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);
  const [isKBModalOpen, setIsKBModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load user's conversations when user logs in or changes
  const fetchConversations = async (userId) => {
    try {
      const list = await getConversations(userId);
      setConversations(list);
      return list;
    } catch (err) {
      console.error("Error fetching conversations:", err);
      return [];
    }
  };

  useEffect(() => {
    if (user?.user_id) {
      fetchConversations(user.user_id);
    } else {
      setConversations([]);
      setActiveId(null);
      setMessages([]);
    }
  }, [user]);

  // Load messages when activeId changes
  const selectConversation = async (convId) => {
    setActiveId(convId);
    if (!convId) {
      setMessages([]);
      return;
    }
    try {
      const details = await getConversationDetails(convId);
      setMessages(details.messages || []);
    } catch (err) {
      console.error("Error loading conversation:", err);
    }
  };

  const handleNewChat = () => {
    setActiveId(null);
    setMessages([]);
    setIsMobileMenuOpen(false);
  };

  const handleDeleteConversation = async (convId) => {
    try {
      await deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.conversation_id !== convId));
      if (activeId === convId) {
        handleNewChat();
      }
    } catch (err) {
      alert("Failed to delete conversation: " + err.message);
    }
  };

  const handleSendMessage = async (text) => {
    if (!user) return;
    setLoading(true);

    // Optimistically add user message to the UI
    const optimisticUserMsg = {
      message_id: "temp-" + Date.now(),
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMsg]);

    try {
      const response = await sendChatMessage(user.user_id, activeId, text);
      
      // Update active ID if this was a new conversation
      if (!activeId && response.conversation_id) {
        setActiveId(response.conversation_id);
      }

      // Replace optimistic message and append assistant message
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.message_id !== optimisticUserMsg.message_id);
        return [
          ...filtered,
          response.user_message,
          response.assistant_message,
        ];
      });

      // Refresh conversations list in sidebar
      fetchConversations(user.user_id);
    } catch (err) {
      const errorAssistantMsg = {
        message_id: "err-" + Date.now(),
        role: "assistant",
        content: `❌ **Error:** ${err.message || "Failed to process question."}\n\nPlease verify that the backend is running and that your \`GEMINI_API_KEY\` is configured.`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorAssistantMsg]);
    } finally {
      setLoading(false);
    }
  };

  const activeConv = conversations.find((c) => c.conversation_id === activeId);

  return (
    <div className="app-container">
      {/* Onboarding / Login Modal */}
      <OnboardingModal isOpen={!user} />

      {/* Source Citation Modal */}
      <SourceModal
        source={selectedSource}
        isOpen={!!selectedSource}
        onClose={() => setSelectedSource(null)}
      />

      {/* Document Library / Knowledge Base Modal */}
      <KnowledgeBaseModal
        isOpen={isKBModalOpen}
        onClose={() => setIsKBModalOpen(false)}
      />

      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={selectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onOpenKBModal={() => setIsKBModalOpen(true)}
        isOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Chat Viewport */}
      <div className="main-area">
        <Header
          currentTitle={activeConv ? activeConv.title : "New Conversation"}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          onOpenKBModal={() => setIsKBModalOpen(true)}
        />

        <ChatArea
          messages={messages}
          loading={loading}
          onSendMessage={handleSendMessage}
          onSelectSource={(src) => setSelectedSource(src)}
          userName={user?.name}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
