import React, { useState, useEffect } from "react";
import { X, Database, RefreshCw, FileText, CheckCircle2, AlertCircle, Search } from "lucide-react";
import { getDocumentsStatus, triggerReindex } from "../services/api";

export default function KnowledgeBaseModal({ isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getDocumentsStatus();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleReindex = async () => {
    setReindexing(true);
    try {
      await triggerReindex();
      setTimeout(() => {
        loadData();
        setReindexing(false);
      }, 3000);
    } catch (err) {
      alert("Failed to start re-indexing: " + err.message);
      setReindexing(false);
    }
  };

  if (!isOpen) return null;

  const filteredDocs = (data?.documents || []).filter((doc) => {
    const matchesSearch = doc.filename.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === "all" || doc.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "var(--radius-md)",
                background: "rgba(6, 182, 212, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-teal)",
              }}
            >
              <Database size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.25rem" }}>College Knowledge Base Library</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                Official repositories scanned across 5 document categories
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "0.75rem",
            marginBottom: "1.25rem",
          }}
        >
          <div style={{ background: "var(--bg-surface)", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-glass)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Total Documents</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", marginTop: "2px" }}>{data?.total_documents || 0}</div>
          </div>
          <div style={{ background: "var(--bg-surface)", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-glass)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Processed</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--accent-emerald)", marginTop: "2px" }}>{data?.processed_documents || 0}</div>
          </div>
          <div style={{ background: "var(--bg-surface)", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-glass)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Indexed Chunks</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--accent-teal)", marginTop: "2px" }}>{data?.total_chunks || 0}</div>
          </div>
          <div style={{ background: "var(--bg-surface)", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-glass)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Categories</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--accent-purple)", marginTop: "2px" }}>5</div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "0.5rem", flex: 1 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={16} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search documents by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.55rem 0.75rem 0.55rem 2.2rem",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-glass)",
                  borderRadius: "var(--radius-sm)",
                  color: "#fff",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              />
            </div>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              style={{
                padding: "0.55rem 0.75rem",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-glass)",
                borderRadius: "var(--radius-sm)",
                color: "#fff",
                fontSize: "0.82rem",
                outline: "none",
              }}
            >
              <option value="all">All Categories</option>
              <option value="01_College_information">01 College Info</option>
              <option value="02_Syllabus">02 Syllabus</option>
              <option value="03_Academic_Calendar">03 Academic Calendar</option>
              <option value="04_Lab_Manuals">04 Lab Manuals</option>
              <option value="05_Fees_Placement_Funding">05 Fees & Placement</option>
            </select>
          </div>

          <button
            onClick={handleReindex}
            disabled={reindexing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.55rem 0.85rem",
              background: "rgba(99, 102, 241, 0.15)",
              color: "var(--accent-primary)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: reindexing ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw size={14} className={reindexing ? "spin" : ""} />
            {reindexing ? "Scanning..." : "Sync / Ingest"}
          </button>
        </div>

        {/* Document Table */}
        <div style={{ flex: 1, overflowY: "auto", border: "1px solid var(--border-glass)", borderRadius: "var(--radius-md)", background: "var(--bg-primary)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid var(--border-glass)", color: "var(--text-muted)" }}>
                <th style={{ padding: "0.65rem 1rem" }}>Filename</th>
                <th style={{ padding: "0.65rem 1rem" }}>Category</th>
                <th style={{ padding: "0.65rem 1rem" }}>Chunks</th>
                <th style={{ padding: "0.65rem 1rem" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                    {loading ? "Loading knowledge base..." : "No documents found."}
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.document_id} style={{ borderBottom: "1px solid var(--border-glass)" }}>
                    <td style={{ padding: "0.65rem 1rem", color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <FileText size={15} color="var(--accent-teal)" />
                      <span style={{ maxWidth: "340px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {doc.filename}
                      </span>
                    </td>
                    <td style={{ padding: "0.65rem 1rem", color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                      {doc.category.replace(/^[0-9]+_/, "")}
                    </td>
                    <td style={{ padding: "0.65rem 1rem", color: "var(--accent-teal)", fontWeight: 600 }}>
                      {doc.chunk_count}
                    </td>
                    <td style={{ padding: "0.65rem 1rem" }}>
                      {doc.status === "processed" ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", color: "var(--accent-emerald)", fontSize: "0.78rem", fontWeight: 600 }}>
                          <CheckCircle2 size={13} /> Active
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", color: "#f87171", fontSize: "0.78rem" }}>
                          <AlertCircle size={13} /> {doc.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
