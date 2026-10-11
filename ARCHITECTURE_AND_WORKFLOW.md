# 📖 College AI Knowledge Base — Architecture, Prompt Engineering & System Workflow

This document provides a comprehensive technical breakdown of how the **College AI Knowledge Base** functions under the hood: models in use, vector retrieval pipeline, prompt construction, data flow, and current feature set.

---

## 1. 🤖 AI Models & Embedding Engines

The project uses a hybrid architecture combining **local on-device embeddings** with **cloud-based large language model (LLM) reasoning**:

| Component | Model Name | Host / Provider | Dimensionality / Architecture | Purpose |
|---|---|---|---|---|
| **Language Model (LLM)** | `gemini-3.8-flash` | Google Gemini API (`google-genai` SDK) | Multimodal Transformer with Structured System Instructions | Generates natural language responses strictly grounded in college context |
| **Embedding Engine** | `all-MiniLM-L6-v2` | Local CPU via ChromaDB ONNX Runtime | 384-dimensional dense vectors | Converts text chunks and search queries into vector embeddings |
| **Vector Store** | `ChromaDB` (Persistent) | Local Disk (`backend/data/chroma_db`) | HNSW Index with Cosine Distance (`hnsw:space: cosine`) | Stores and ranks document chunk embeddings |
| **Metadata & History DB** | `SQLite` via SQLAlchemy | Local Disk (`backend/college_ai.db`) | Relational SQL Schema | Stores Users, Conversations, Messages, and Source References |

### Why This Combination?
- **Zero API Quota on Indexing**: By embedding all 4,995 chunks with Chroma's local ONNX model, indexing 63 large PDF/Word files costs $0 and will never exhaust Google API rate limits.
- **Fast, High-Context Reasoning**: `gemini-3.8-flash` processes large assembled prompts (retrieved chunks + conversation history + system constraints) in seconds with low latency.

---

## 2. 🧠 Prompt Engineering & Computation

Prompts are dynamically generated in [`backend/app/services/llm_service.py`](file:///e:/College%20Knowledge%20AI/backend/app/services/llm_service.py) via a two-layer structure:

### Layer 1: System Instruction (`SYSTEM_PROMPT`)
The system instruction enforces **strict grounding** and forbids hallucinations:

```text
You are the official College AI Knowledge Assistant for our college.
Your mission is to provide accurate, helpful, and strictly verified answers to students, faculty, and visitors based ONLY on the official college documents provided in the context below.

CRITICAL GUIDELINES:
1. STRICT GROUNDING: You MUST base your answers ONLY on the provided context snippets.
2. NO HALLUCINATIONS / FABRICATION: If the question cannot be answered using the provided context, or if the context does not contain sufficient details, you MUST explicitly respond with:
   "I could not find information regarding this in the available college documents. Please consult the relevant department or administrative office for official confirmation."
   DO NOT make up fee amounts, exam dates, subject names, faculty details, placement packages, attendance rules, or policies.
3. CITATIONS & SOURCES: Always reference the specific document name and page number when stating facts (e.g., "[Source: AICTE-Mandatory-Disclosure.pdf, Page 4]").
4. FORMATTING: Use clean, student-friendly Markdown with bullet points, bold key terms, and tables when presenting schedules, syllabus structures, or fee breakdowns.
5. TONE: Professional, welcoming, encouraging, and clear.
```

### Layer 2: Augmented User Prompt Computation (`build_prompt`)
When a student asks a question, the backend assembles a 3-part structured prompt:

$$\text{Final Prompt} = \text{Conversation History (last 4 turns)} + \text{Retrieved Document Context} + \text{Student Query}$$

#### Prompt Assembly Format:
```text
CONVERSATION HISTORY:
Student: What is the fee structure?
Assistant: The total fee approved by FRA is Rs. 1,24,000/- per year [Source: AICTE-Mandatory-Disclosure.pdf, Page 8].

OFFICIAL COLLEGE DOCUMENTS CONTEXT:
====================================
--- CONTEXT SNIPPET #1 ---
Document: AICTE-Mandatory-Disclosure.pdf
Category: 01_College_information
Page: 8
Content:
18.9 FEE DETAILS: Tuition Fee Sanctioned by FRA: Rs. 107826, Development Fee: Rs. 16174, Total Fee: Rs. 124000/-

--- CONTEXT SNIPPET #2 ---
Document: FRA-Fee-Structure.pdf
Category: 05_Fees_Placement_Funding
Page: 1
Content:
FRA Fee Structure For A.Y. 2025-26 (For UG): Tuition Fee: 1,07,826; Development Fee: 16,174; Total: 1,24,000/-
...
====================================

STUDENT QUESTION:
Give the fees structure of CSE

INSTRUCTIONS FOR YOUR RESPONSE:
1. Answer the student's question accurately using ONLY the official context above.
2. If the context does NOT contain the answer, politely state that the information was not found in the available college documents.
3. Cite the document names and page numbers in your answer wherever applicable.
4. Format your answer with clear Markdown headings and bullet points.
```

---

## 3. 🔄 End-to-End System Workflow

```
                                  [ User Enters Question in React UI ]
                                                   │
                                                   ▼
                                        POST /api/chat (FastAPI)
                                                   │
                      ┌────────────────────────────┴────────────────────────────┐
                      ▼                                                         ▼
            [ Validate / Provision ]                                   [ Fetch Recent History ]
            Student session in SQLite                                  (Last 4 messages from DB)
                      │                                                         │
                      └────────────────────────────┬────────────────────────────┘
                                                   │
                                                   ▼
                                [ Query Vectorization ]
                   Query converted to 384-dim vector using local ONNX
                                                   │
                                                   ▼
                                [ Vector Similarity Search ]
                 ChromaDB performs Cosine Search across 4,995 document chunks
                                                   │
                                                   ▼
                               [ Filter & Rank (Top-K = 6) ]
                    Top 6 chunks extracted with metadata (filename, page, score)
                                                   │
                                                   ▼
                               [ Prompt Assembly (Augmentation) ]
                  Combines History + Context Snippets #1..#6 + Student Query
                                                   │
                                                   ▼
                                 [ Gemini 3.8 Flash Generation ]
                   Model evaluates context under strict non-hallucination rules
                                                   │
                                                   ▼
                                   [ Response Parsing & DB Save ]
           Saves User Question, Assistant Reply, & Source References into SQLite
                                                   │
                                                   ▼
                                    [ HTTP 200 JSON Response ]
                                                   │
                                                   ▼
                             [ React Frontend Markdown Rendering ]
             Renders answer with formatted tables, code, and clickable source badges
```

---

## 4. 📂 Document Processing & Chunking Architecture

During ingestion (`python backend/ingest.py`):
1. **Document Discovery**: Recursively scans 5 official category folders:
   - `01_College_information` (Mandatory disclosures, NIRF, OBE manual)
   - `02_Syllabus` (AIML, CSE, DS, Civil, Mech, ETC, M-Tech)
   - `03_Academic_Calendar` (Odd/Even semester schedules)
   - `04_Lab_Manuals` (CC, DBE, DevOps, IML, Java, FAI)
   - `05_Fees_Placement_Funding` (FRA fee structure, PGCS, Placement brochures)
2. **Page-by-Page Extraction**: Uses `PyMuPDF` (`fitz`) for PDFs and `python-docx` for `.docx` manuals, preserving exact `page_number` tags.
3. **Sliding Window Chunking**:
   - `CHUNK_SIZE`: **1000 characters**
   - `CHUNK_OVERLAP`: **200 characters** (prevents splitting critical sentences across boundaries)
4. **Metadata Enrichment**: Every chunk is stored with:
   - `document_filename`
   - `category`
   - `page_number`
   - `chunk_index`

---

## 5. ✨ Current Features of the Project

### 💬 Chat & RAG Capabilities
- **Strictly Grounded Answers**: If a document does not contain an answer (e.g. asking about a department not in disclosures), the assistant politely informs the student rather than making up answers.
- **Interactive Source Badges**: Answers display the exact source document, category folder, and page number with clickable badges.
- **Markdown & Rich Content**: Supports Markdown tables (e.g., fee breakdowns, course structures), bold callouts, lists, and code blocks.
- **Contextual Follow-ups**: Remembers previous turns in the current conversation thread for natural back-and-forth dialogue.

### 👥 Seamless User Experience (Zero Friction)
- **No Login Screen Barrier**: Automatically connects into a guest student session without passwords or registration walls.
- **Persistent Conversation History**: Multi-session conversation drawer sidebar saved in local SQLite. Students can switch between conversations or click **+ New Chat**.
- **Quick-Prompt Cards**: One-click suggested prompts for quick inquiries (AIML Syllabus, Academic Calendar, College Fees, Placements).

### 🛡️ Production & Local Architecture
- **Self-Contained Local Vector Store**: Uses ChromaDB and ONNX locally with no external vector cloud dependencies.
- **Automated Path Anchoring**: Backend automatically resolves paths relative to the backend folder regardless of where scripts are executed.
- **Interactive Swagger Documentation**: Full interactive testing suite available at `http://127.0.0.1:8000/api/docs`.
- **System Health Monitor**: Built-in `/api/health` endpoint reporting database status, chunk count, and Gemini readiness.
