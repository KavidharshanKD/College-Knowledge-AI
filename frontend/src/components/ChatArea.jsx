import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot, GraduationCap } from "lucide-react";
import MessageBubble from "./MessageBubble";
import SuggestedQuestions from "./SuggestedQuestions";

export default function ChatArea({
  messages,
  loading,
  onSendMessage,
  onSelectSource,
  userName,
}) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = () => {
    if (!inputText.trim() || loading) return;
    onSendMessage(inputText.trim());
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setInputText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div className="chat-scroll-area">
        {messages.length === 0 ? (
          <div className="welcome-container">
            <div className="welcome-icon-box">
              <GraduationCap size={32} />
            </div>
            <h1 className="welcome-title">
              Hello, <span>{userName || "Student"}</span>!
            </h1>
            <p className="welcome-subtitle">
              Ask anything about our college documents. Queries are cross-referenced with syllabus guides, academic calendars, fee structures, and lab manuals.
            </p>
            <SuggestedQuestions onSelectQuestion={(q) => onSendMessage(q)} />
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.message_id || Math.random()}
                message={msg}
                onSelectSource={onSelectSource}
              />
            ))}

            {loading && (
              <div className="message-row assistant">
                <div className="message-avatar assistant">
                  <Bot size={18} />
                </div>
                <div className="message-content-wrapper">
                  <div className="message-bubble assistant">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        Searching college documents & generating answer...
                      </span>
                      <div className="typing-indicator">
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Form */}
      <div className="chat-input-container">
        <div className="input-box">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            placeholder="Ask about syllabus, exam schedule, fees, placements, or lab experiments..."
            rows={1}
            value={inputText}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!inputText.trim() || loading}
            title="Send Message"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="input-disclaimer">
          College AI responses are strictly grounded in official documents. Never hallucinated.
        </div>
      </div>
    </div>
  );
}
