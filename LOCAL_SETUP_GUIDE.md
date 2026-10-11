# 🚀 Local Setup & Configuration Guide — College AI Knowledge Base

This guide outlines step-by-step instructions to configure, run, and customize the **College AI Knowledge Base** chatbot on your local computer.

---

## 🏗️ Architecture & How It Works

```
                                ┌─────────────────────────┐
                                │   Frontend (React+Vite) │
                                │   http://localhost:5173 │
                                └────────────┬────────────┘
                                             │ HTTP API Requests
                                             ▼
                                ┌─────────────────────────┐
                                │   Backend (FastAPI)     │
                                │   http://localhost:8000 │
                                └────────────┬────────────┘
                                             │
             ┌───────────────────────────────┴───────────────────────────────┐
             ▼                                                               ▼
┌─────────────────────────┐                                     ┌─────────────────────────┐
│   ChromaDB (Vector DB)  │                                     │   Google Gemini API     │
│   Semantic Search on    │                                     │   (gemini-1.5-flash)    │
│   63 College PDFs/Docs  │                                     │   Strictly Grounded RAG │
└─────────────────────────┘                                     └─────────────────────────┘
```

1. **Frontend**: React 19 + Vite interface. Displays chat, sources/citations, and sidebar history. (No login required; connects directly as a student session).
2. **Backend**: FastAPI server providing RAG pipeline, SQLite conversation history, and document indexing.
3. **Embeddings & Vector Store**: ChromaDB stores vector embeddings for all documents in the 5 categories (`01_College_information`, `02_Syllabus`, `03_Academic_Calendar`, `04_Lab_Manuals`, `05_Fees_Placement_Funding`). By default, uses local ONNX embeddings (`all-MiniLM-L6-v2`) to prevent API quota exhaustion.
4. **LLM**: Google Gemini generates verified answers grounded strictly in official college documents.

---

## 📋 System Prerequisites

Ensure you have the following installed on your machine:
- **Python**: Version `3.10` or higher (`python --version`)
- **Node.js**: Version `18.0` or higher (`node -v`) & npm (`npm -v`)
- **Git** (`git --version`)
- **Google Gemini API Key**: Free key from [Google AI Studio](https://aistudio.google.com/)

---

## ⚙️ Step 1: Backend Configuration & Setup

### 1.1 Open a terminal in the project root
```bash
cd "e:\College Knowledge AI"
```

### 1.2 Create and activate a Python virtual environment
**On Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```
*(If PowerShell restricts scripts, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first).*

**On Windows (Command Prompt):**
```cmd
python -m venv venv
.\venv\Scripts\activate.bat
```

### 1.3 Install Python dependencies
```bash
pip install -r backend/requirements.txt
```

### 1.4 Configure Backend Environment Variables (`backend/.env`)
A template file has been created at `backend/.env`. Open it and insert your Gemini API Key:

```ini
# Google Gemini API Key (Get your free key from https://aistudio.google.com/)
GEMINI_API_KEY=AIzaSy...your_actual_key_here...

# Database URL (Default SQLite database stored in backend/college_ai.db)
DATABASE_URL=sqlite:///./college_ai.db

# ChromaDB Vector Store
CHROMA_PERSIST_DIR=./data/chroma_db
CHROMA_COLLECTION_NAME=college_knowledge_base

# LLM Model (Supported: gemini-3.8-flash)
LLM_MODEL=gemini-3.8-flash

# Embeddings: "local" (uses Chroma's built-in ONNX model, zero API quota cost)
# Or "models/text-embedding-004" to use Gemini embeddings
EMBEDDING_MODEL=local

# RAG Hyperparameters
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K_RESULTS=6
```

---

## 📚 Step 2: Index College Documents (Ingestion)

Before querying the AI assistant, the 63 college documents in folders `01_` through `05_` need to be chunked and indexed into ChromaDB.

Run the ingestion script from the project root:
```bash
python backend/ingest.py
```

- To reset and rebuild the vector database from scratch at any time:
  ```bash
  python backend/ingest.py --reset
  ```

---

## 🖥️ Step 3: Start the Backend Server

From the `backend` folder, launch the FastAPI server using Uvicorn:

```bash
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- **API Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/api/docs`
- **Health Check**: `http://127.0.0.1:8000/api/health`

---

## 🎨 Step 4: Frontend Configuration & Setup

In a **separate terminal window**:

### 4.1 Navigate to `frontend`
```bash
cd "e:\College Knowledge AI\frontend"
```

### 4.2 Install npm packages
```bash
npm install
```

### 4.3 Configure Frontend Environment (`frontend/.env`)
The file `frontend/.env` is already created with:
```ini
VITE_API_URL=http://localhost:8000/api
```
*(If you run FastAPI on a different host or port, change this URL accordingly).*

### 4.4 Start the Vite dev server
```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:5173
```

The app will load directly into the chatbot without asking for login or registration.

---

## 🔌 API Endpoints Summary

| Endpoint | Method | Description |
|---|---|---|
| `/api/chat` | `POST` | Ask a question; returns answers with source citations |
| `/api/conversations` | `GET` | Fetch list of recent conversation threads |
| `/api/conversations/{id}` | `GET` | Fetch messages from a specific conversation |
| `/api/documents` | `GET` | View list of indexed documents and chunk statistics |
| `/api/health` | `GET` | Health check verifying DB, Gemini, and ChromaDB status |
| `/api/auth/login` | `POST` | Auto-registers or retrieves student session |

---

## 🛠️ Troubleshooting & Tips

1. **Port 8000 or 5173 already in use**:
   - Change backend port: `uvicorn app.main:app --reload --port 8080`
   - Remember to update `VITE_API_URL=http://localhost:8080/api` in `frontend/.env`.

2. **CORS Errors**:
   - CORS is configured in `backend/app/config.py` to accept origins `*`, `http://localhost:5173`, and `http://127.0.0.1:5173`.

3. **Gemini API Key Errors**:
   - Verify that your key is active and correctly pasted in `backend/.env` without quotes.
   - Test key access at [Google AI Studio](https://aistudio.google.com/).

4. **Embedding Memory / Quota**:
   - `EMBEDDING_MODEL=local` runs entirely on your CPU using Chroma's built-in ONNX runtime (`all-MiniLM-L6-v2`), so no Google embedding rate limits or costs occur.
