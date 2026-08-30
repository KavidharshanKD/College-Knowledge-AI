import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User as UserIcon, Bookmark, Copy, Check, FileText } from "lucide-react";

export default function MessageBubble({ message, onSelectSource }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`message-row ${isUser ? "user" : "assistant"}`}>
      <div className={`message-avatar ${isUser ? "user" : "assistant"}`}>
        {isUser ? <UserIcon size={18} /> : <Bot size={18} />}
      </div>

      <div className="message-content-wrapper">
        <div className={`message-bubble ${isUser ? "user" : "assistant"}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Source References */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="sources-container">
            <div className="sources-header">
              <Bookmark size={13} color="var(--accent-teal)" />
              <span>Verified Sources ({message.sources.length})</span>
            </div>
            <div className="sources-chips-row">
              {message.sources.map((src, idx) => (
                <div
                  key={idx}
                  className="source-chip"
                  onClick={() => onSelectSource && onSelectSource(src)}
                  title="Click to view extracted document passage"
                >
                  <FileText size={12} color="var(--accent-teal)" />
                  <span style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {src.document_filename}
                  </span>
                  <span className="source-badge-cat">
                    p.{src.page_number || "1"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action bar for assistant message */}
        {!isUser && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2px" }}>
            <button
              onClick={handleCopy}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                fontSize: "0.72rem",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              {copied ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
              <span>{copied ? "Copied" : "Copy answer"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
