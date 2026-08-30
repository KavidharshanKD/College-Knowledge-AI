from pathlib import Path
from typing import List, Dict, Any, Optional

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config import settings
from app.services.document_processor import ProcessedChunk


class VectorStore:
    """
    ChromaDB vector store for the college RAG system.

    Responsibilities:
    - Create/open the ChromaDB collection safely
    - Automatically recover if the collection was deleted
    - Store document chunks and embeddings
    - Perform similarity search
    - Delete chunks belonging to a document
    - Provide collection statistics
    """

    def __init__(self):
        persist_dir = Path(settings.CHROMA_PERSIST_DIR)
        persist_dir.mkdir(parents=True, exist_ok=True)

        self.client = chromadb.PersistentClient(
            path=str(persist_dir),
            settings=ChromaSettings(
                anonymized_telemetry=False
            )
        )

        self.collection = None
        self._ensure_collection()

    # ============================================================
    # COLLECTION MANAGEMENT
    # ============================================================

    def _ensure_collection(self):
        """
        Always make sure the current collection object is valid.

        This avoids using an old/stale ChromaDB collection reference.
        """

        try:
            self.collection = self.client.get_or_create_collection(
                name=settings.CHROMA_COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"}
            )

            # Verify that the collection actually exists.
            self.collection.count()

            return self.collection

        except Exception as exc:
            error_text = str(exc).lower()

            if (
                "does not exist" in error_text
                or "not found" in error_text
                or "collection" in error_text
            ):
                # Re-create the collection.
                try:
                    self.collection = self.client.get_or_create_collection(
                        name=settings.CHROMA_COLLECTION_NAME,
                        metadata={"hnsw:space": "cosine"}
                    )
                    return self.collection
                except Exception:
                    raise

            raise

    def _get_collection(self):
        """
        Return a fresh and valid collection reference.

        This is important because another operation may have deleted
        or recreated the collection.
        """

        try:
            collection = self.client.get_collection(
                name=settings.CHROMA_COLLECTION_NAME
            )

            # Verify the collection is usable.
            collection.count()

            self.collection = collection
            return collection

        except Exception as exc:
            error_text = str(exc).lower()

            if (
                "does not exist" in error_text
                or "not found" in error_text
                or "collection" in error_text
            ):
                return self._ensure_collection()

            raise

    # ============================================================
    # ADD / UPSERT CHUNKS
    # ============================================================

    def add_chunks(
        self,
        chunks: List[ProcessedChunk],
        embeddings: List[List[float]]
    ) -> int:
        """
        Add or update document chunks in ChromaDB.
        """

        if not chunks:
            return 0

        if not embeddings:
            return 0

        if len(chunks) != len(embeddings):
            raise ValueError(
                "Number of chunks and embeddings must be the same."
            )

        collection = self._get_collection()

        batch_size = 200
        total_added = 0

        for i in range(0, len(chunks), batch_size):

            chunk_batch = chunks[i:i + batch_size]
            embedding_batch = embeddings[i:i + batch_size]

            ids = [
                str(chunk.chunk_id)
                for chunk in chunk_batch
            ]

            documents = [
                str(chunk.text)
                for chunk in chunk_batch
            ]

            metadatas = [
                chunk.to_metadata()
                for chunk in chunk_batch
            ]

            clean_embeddings = []

            for embedding in embedding_batch:
                clean_embedding = [
                    float(value)
                    for value in embedding
                ]

                clean_embeddings.append(clean_embedding)

            try:
                collection.upsert(
                    ids=ids,
                    documents=documents,
                    embeddings=clean_embeddings,
                    metadatas=metadatas
                )

            except Exception as exc:
                error_text = str(exc).lower()

                # Collection disappeared between _get_collection()
                # and upsert(). Re-open it and retry once.
                if (
                    "does not exist" in error_text
                    or "not found" in error_text
                    or "collection" in error_text
                ):
                    collection = self._ensure_collection()

                    collection.upsert(
                        ids=ids,
                        documents=documents,
                        embeddings=clean_embeddings,
                        metadatas=metadatas
                    )

                else:
                    raise

            total_added += len(chunk_batch)

        return total_added

    # ============================================================
    # SIMILARITY SEARCH
    # ============================================================

    def similarity_search(
        self,
        query_embedding: List[float],
        top_k: int = None,
        category: Optional[str] = None,
        query_text: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Search ChromaDB for relevant chunks.

        Includes lightweight query-aware reranking for:
        - AIML
        - Third Year / TY
        - Syllabus-related queries
        """

        collection = self._get_collection()

        k = top_k or settings.TOP_K_RESULTS

        count = collection.count()

        if count == 0:
            return []

        fetch_k = min(
            count,
            max(k * 3, 15)
        )

        where_clause = None

        if category:
            where_clause = {
                "category": category
            }

        try:
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=fetch_k,
                where=where_clause,
                include=[
                    "documents",
                    "metadatas",
                    "distances"
                ]
            )

        except Exception as exc:
            error_text = str(exc).lower()

            if (
                "does not exist" in error_text
                or "not found" in error_text
                or "collection" in error_text
            ):
                collection = self._ensure_collection()

                results = collection.query(
                    query_embeddings=[query_embedding],
                    n_results=fetch_k,
                    where=where_clause,
                    include=[
                        "documents",
                        "metadatas",
                        "distances"
                    ]
                )

            else:
                raise

        formatted_results = []

        if not results:
            return formatted_results

        documents = results.get("documents") or [[]]
        metadatas = results.get("metadatas") or [[]]
        distances = results.get("distances") or [[]]
        ids = results.get("ids") or [[]]

        if not documents or not documents[0]:
            return formatted_results

        docs = documents[0]

        metas = (
            metadatas[0]
            if metadatas and metadatas[0]
            else [{} for _ in docs]
        )

        dists = (
            distances[0]
            if distances and distances[0]
            else [0.0 for _ in docs]
        )

        chunk_ids = (
            ids[0]
            if ids and ids[0]
            else ["" for _ in docs]
        )

        # --------------------------------------------------------
        # QUERY NORMALIZATION
        # --------------------------------------------------------

        q_lower = (
            query_text.lower()
            if query_text
            else ""
        )

        is_aiml = (
            "aiml" in q_lower
            or "a i m l" in q_lower
            or "artificial intelligence" in q_lower
            or "machine learning" in q_lower
        )

        is_third_year = (
            "ty" in q_lower
            or "third year" in q_lower
            or "3rd year" in q_lower
            or "third-year" in q_lower
            or "semester v" in q_lower
            or "semester vi" in q_lower
            or "sem v" in q_lower
            or "sem vi" in q_lower
        )

        is_syllabus = (
            "syllabus" in q_lower
            or "curriculum" in q_lower
            or "subjects" in q_lower
            or "course" in q_lower
            or "courses" in q_lower
        )

        # --------------------------------------------------------
        # RERANK RESULTS
        # --------------------------------------------------------

        for doc_text, meta, distance, chunk_id in zip(
            docs,
            metas,
            dists,
            chunk_ids
        ):

            meta = meta or {}

            doc_filename = str(
                meta.get(
                    "document_filename",
                    ""
                )
            ).lower()

            doc_text_lower = str(
                doc_text
            ).lower()

            # Chroma cosine distance:
            # 0 = identical
            # 1 = less similar
            # 2 = opposite
            base_similarity = max(
                0.0,
                1.0 - (float(distance) / 2.0)
            )

            adjusted_score = base_similarity

            # ----------------------------------------------------
            # AIML BOOST
            # ----------------------------------------------------

            if is_aiml:

                if (
                    "aiml" in doc_filename
                    or "aiml" in doc_text_lower
                    or "artificial intelligence" in doc_text_lower
                    or "machine learning" in doc_text_lower
                ):
                    adjusted_score += 0.20

                if any(
                    word in doc_filename
                    for word in [
                        "mechanical",
                        "civil",
                        "chemical",
                        "electronics"
                    ]
                ):
                    adjusted_score -= 0.25

            # ----------------------------------------------------
            # THIRD YEAR BOOST
            # ----------------------------------------------------

            if is_third_year:

                if any(
                    term in doc_filename
                    for term in [
                        "ty",
                        "third",
                        "aiml-ty",
                        "aiml_ty"
                    ]
                ):
                    adjusted_score += 0.20

                if any(
                    term in doc_text_lower
                    for term in [
                        "third year",
                        "third-year",
                        "semester-v",
                        "semester-vi",
                        "semester v",
                        "semester vi"
                    ]
                ):
                    adjusted_score += 0.15

            # ----------------------------------------------------
            # SYLLABUS BOOST
            # ----------------------------------------------------

            if is_syllabus:

                if (
                    "syllabus" in doc_filename
                    or "curriculum" in doc_text_lower
                    or "course code" in doc_text_lower
                    or "course title" in doc_text_lower
                    or "course type" in doc_text_lower
                ):
                    adjusted_score += 0.10

            formatted_results.append(
                {
                    "chunk_id": chunk_id,
                    "text": doc_text,
                    "document_filename": meta.get(
                        "document_filename",
                        "Unknown Document"
                    ),
                    "category": meta.get(
                        "category",
                        "General"
                    ),
                    "filepath": meta.get(
                        "filepath",
                        ""
                    ),
                    "page_number": meta.get(
                        "page_number",
                        1
                    ),
                    "chunk_index": meta.get(
                        "chunk_index",
                        0
                    ),
                    "distance": float(distance),
                    "similarity_score": round(
                        base_similarity,
                        4
                    ),
                    "adjusted_score": round(
                        adjusted_score,
                        4
                    )
                }
            )

        # Highest score first
        formatted_results.sort(
            key=lambda item: item["adjusted_score"],
            reverse=True
        )

        return formatted_results[:k]

    # ============================================================
    # DELETE DOCUMENT CHUNKS
    # ============================================================

    def delete_by_filename(
        self,
        filename: str
    ):
        """
        Delete all chunks belonging to a document.
        """

        collection = self._get_collection()

        try:
            collection.delete(
                where={
                    "document_filename": filename
                }
            )

        except Exception as exc:
            error_text = str(exc).lower()

            if (
                "does not exist" in error_text
                or "not found" in error_text
                or "collection" in error_text
            ):
                collection = self._ensure_collection()

                collection.delete(
                    where={
                        "document_filename": filename
                    }
                )

            else:
                raise

    # ============================================================
    # COUNT
    # ============================================================

    def count(self) -> int:
        """
        Return total number of indexed chunks.
        """

        collection = self._get_collection()

        return collection.count()

    # ============================================================
    # STATISTICS
    # ============================================================

    def get_stats(self) -> Dict[str, Any]:
        """
        Return statistics about indexed chunks.
        """

        collection = self._get_collection()

        total_chunks = collection.count()

        if total_chunks == 0:
            return {
                "total_chunks": 0,
                "categories": {},
                "documents": []
            }

        sample = collection.get(
            limit=min(total_chunks, 1000),
            include=["metadatas"]
        )

        categories: Dict[str, int] = {}
        documents = set()

        metadatas = (
            sample.get("metadatas")
            if sample
            else None
        )

        if metadatas:

            for metadata in metadatas:

                metadata = metadata or {}

                category = metadata.get(
                    "category",
                    "Other"
                )

                document = metadata.get(
                    "document_filename",
                    "Unknown"
                )

                categories[category] = (
                    categories.get(category, 0) + 1
                )

                documents.add(document)

        return {
            "total_chunks": total_chunks,
            "total_documents": len(documents),
            "categories": categories,
            "document_names": sorted(documents)
        }

    # ============================================================
    # CLEAR COLLECTION
    # ============================================================

    def clear(self):
        """
        Completely clear the ChromaDB collection and recreate it.

        This method is intentionally explicit.
        It should only be called when a full re-index is required.
        """

        try:
            self.client.delete_collection(
                name=settings.CHROMA_COLLECTION_NAME
            )
        except Exception as exc:
            error_text = str(exc).lower()

            if (
                "does not exist" not in error_text
                and "not found" not in error_text
            ):
                raise

        self.collection = None

        self._ensure_collection()


# ================================================================
# SINGLE VECTOR STORE INSTANCE
# ================================================================

vector_store = VectorStore()