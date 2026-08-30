import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    MessageResponse,
    SourceReference
)
from app.services.embedding_service import embedding_service
from app.services.vector_store import vector_store
from app.services.llm_service import llm_service

class RAGService:
    def process_query(self, request: ChatRequest, db: Session) -> ChatResponse:
        """Executes the full RAG pipeline and persists the turn to the database."""
        
        # 1. Verify User exists
        user = db.query(User).filter(User.user_id == request.user_id).first()
        if not user:
            raise ValueError(f"User with id {request.user_id} not found.")

        # 2. Find or Create Conversation
        conversation = None
        if request.conversation_id:
            conversation = db.query(Conversation).filter(
                Conversation.conversation_id == request.conversation_id,
                Conversation.user_id == user.user_id
            ).first()

        if not conversation:
            # Create new conversation with title generated from query
            clean_title = request.message.strip()
            if len(clean_title) > 45:
                clean_title = clean_title[:42] + "..."
            
            conversation = Conversation(
                conversation_id=str(uuid.uuid4()),
                user_id=user.user_id,
                title=clean_title
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)

        # 3. Save User Message to Database
        user_msg = Message(
            message_id=str(uuid.uuid4()),
            conversation_id=conversation.conversation_id,
            role="user",
            content=request.message.strip()
        )
        db.add(user_msg)
        db.commit()
        db.refresh(user_msg)

        # 4. Fetch Previous Messages for Multi-turn Context (last 6 messages)
        prev_messages = db.query(Message).filter(
            Message.conversation_id == conversation.conversation_id
        ).order_by(Message.created_at.asc()).all()

        history = [
            {"role": m.role, "content": m.content}
            for m in prev_messages[:-1] # exclude the just-added user message
        ]

        # 5. Retrieve Relevant Chunks from ChromaDB
        retrieved_chunks: List[Dict[str, Any]] = []
        source_refs: List[SourceReference] = []

        if embedding_service.is_ready() and vector_store.count() > 0:
            try:
                query_embedding = embedding_service.get_query_embedding(request.message)
                retrieved_chunks = vector_store.similarity_search(
                    query_embedding=query_embedding,
                    top_k=settings.TOP_K_RESULTS,
                    query_text=request.message
                )

                # Format source references for frontend and database persistence
                for c in retrieved_chunks:
                    ref = SourceReference(
                        document_filename=c.get("document_filename", "Unknown"),
                        category=c.get("category", "General"),
                        page_number=c.get("page_number", 1),
                        chunk_index=c.get("chunk_index", 0),
                        snippet=c.get("text", "")[:350] + ("..." if len(c.get("text", "")) > 350 else ""),
                        score=c.get("similarity_score")
                    )
                    source_refs.append(ref)

            except Exception as e:
                # Log error and continue to LLM with empty context
                print(f"Error during vector retrieval: {e}")

        # 6. Generate Grounded Answer via Gemini LLM
        if not embedding_service.is_ready() or not llm_service.is_ready():
            assistant_text = (
                "⚠️ **Gemini API Key Required**\n\n"
                "The College AI Knowledge Base requires a Google Gemini API Key to embed documents and generate answers.\n\n"
                "Please add your `GEMINI_API_KEY` to the `backend/.env` file and restart or re-ingest the knowledge base."
            )
        elif vector_store.count() == 0:
            assistant_text = (
                "📚 **No Documents Ingested Yet**\n\n"
                "The knowledge base is currently empty. Please run the document ingestion script (`python backend/ingest.py`) "
                "or click **Re-index Knowledge Base** in the dashboard to process the college documents."
            )
        else:
            assistant_text = llm_service.generate_answer(
                query=request.message,
                context_chunks=retrieved_chunks,
                conversation_history=history
            )

        # 7. Save Assistant Message to Database
        sources_payload = [ref.model_dump() for ref in source_refs]
        assistant_msg = Message(
            message_id=str(uuid.uuid4()),
            conversation_id=conversation.conversation_id,
            role="assistant",
            content=assistant_text,
            sources_json=None
        )
        assistant_msg.sources = sources_payload
        db.add(assistant_msg)

        # Update Conversation timestamp
        conversation.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(assistant_msg)

        # 8. Return ChatResponse
        return ChatResponse(
            conversation_id=conversation.conversation_id,
            user_message=MessageResponse.model_validate(user_msg),
            assistant_message=MessageResponse(
                message_id=assistant_msg.message_id,
                conversation_id=assistant_msg.conversation_id,
                role=assistant_msg.role,
                content=assistant_msg.content,
                sources=sources_payload,
                created_at=assistant_msg.created_at
            ),
            sources=source_refs
        )

rag_service = RAGService()
