import os
import time
import logging
from typing import List

from app.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    def __init__(self):
        # Read embedding model from settings
        raw_name = settings.EMBEDDING_MODEL
        # "local" means use local ONNX embeddings, skip Gemini
        # "models/xxx" or "xxx" means use Gemini
        self.model_name = raw_name.replace("models/", "")
        self.use_local_only = (raw_name.lower() == "local")

        self._gemini_ready = False
        self._gemini_client = None
        self._local_embedder = None

        self._check_configuration()

    def _check_configuration(self):
        """Check whether Gemini API is configured."""

        # If explicitly set to "local", skip Gemini entirely
        if self.use_local_only:
            self._gemini_ready = False
            return

        api_key = settings.GEMINI_API_KEY or os.environ.get(
            "GEMINI_API_KEY", ""
        )

        if (
            api_key
            and api_key.strip()
            and api_key.strip() != "your_google_gemini_api_key_here"
        ):
            try:
                from google import genai

                self._gemini_client = genai.Client(
                    api_key=api_key.strip()
                )

                self._gemini_ready = True

            except Exception as e:
                logger.warning(
                    f"Google GenAI client could not be configured: {e}"
                )

                self._gemini_client = None
                self._gemini_ready = False

        else:
            self._gemini_ready = False

    def _get_local_embedder(self):
        """
        Load Chroma's built-in local embedding model.

        This uses all-MiniLM-L6-v2 and produces
        384-dimensional embeddings.
        """

        if self._local_embedder is None:
            try:
                from chromadb.utils import embedding_functions

                self._local_embedder = (
                    embedding_functions.DefaultEmbeddingFunction()
                )

                logger.info(
                    "Local ONNX embedding model loaded successfully."
                )

            except Exception as e:
                logger.error(
                    f"Failed to load local ONNX embedder: {e}"
                )

                self._local_embedder = None

        return self._local_embedder

    def is_gemini_ready(self) -> bool:
        """Return True if Gemini API is configured."""

        self._check_configuration()
        return self._gemini_ready

    def is_ready(self) -> bool:
        """
        Return True if either Gemini or the local
        embedding model is available.
        """

        if self.is_gemini_ready():
            return True

        return self._get_local_embedder() is not None

    def get_embedding_provider_name(self) -> str:
        """Return the currently available embedding provider."""

        if self.use_local_only:
            return "Local ONNX Embeddings (all-MiniLM-L6-v2, 384-dim)"

        if self.is_gemini_ready():
            return f"Google Gemini ({self.model_name})"

        return "Local ONNX Embeddings (all-MiniLM-L6-v2, 384-dim)"

    def _convert_to_python_floats(self, embedding) -> List[float]:
        """
        Convert NumPy float32 / other numeric values
        into normal Python floats.

        This is important because ChromaDB expects
        standard Python numeric values.
        """

        return [float(value) for value in embedding]

    def get_embedding(self, text: str) -> List[float]:
        """
        Generate an embedding for a single piece of text.

        Gemini is attempted first.
        If Gemini is unavailable, the local ONNX
        embedding model is used automatically.
        """

        # --------------------------------------------------
        # 1. Try Gemini
        # --------------------------------------------------

        if self.is_gemini_ready():

            try:
                if self._gemini_client:

                    response = self._gemini_client.models.embed_content(
                        model=self.model_name,
                        contents=text
                    )

                    if (
                        hasattr(response, "embeddings")
                        and response.embeddings
                    ):
                        embedding = response.embeddings[0].values

                        return self._convert_to_python_floats(
                            embedding
                        )

                    if (
                        hasattr(response, "embedding")
                        and response.embedding
                    ):
                        embedding = response.embedding.values

                        return self._convert_to_python_floats(
                            embedding
                        )

            except Exception as e:

                logger.warning(
                    f"Gemini embedding unavailable: {e}. "
                    "Using local embedding model instead."
                )

        # --------------------------------------------------
        # 2. Local ONNX fallback
        # --------------------------------------------------

        local_fn = self._get_local_embedder()

        if local_fn:

            try:
                embeddings = local_fn([text])

                if embeddings and len(embeddings) > 0:

                    # Convert np.float32 -> Python float
                    return self._convert_to_python_floats(
                        embeddings[0]
                    )

            except Exception as e:

                logger.error(
                    f"Local embedding generation failed: {e}"
                )

        raise RuntimeError(
            "No embedding provider available."
        )

    def get_query_embedding(self, query: str) -> List[float]:
        """
        Generate an embedding specifically for a user query.

        The same embedding model used for the documents
        should be used for the query.
        """

        return self.get_embedding(query)

    def get_embeddings_batch(
        self,
        texts: List[str],
        batch_size: int = 50
    ) -> List[List[float]]:
        """
        Generate embeddings for multiple text chunks.

        Gemini is attempted first.
        If Gemini fails, local ONNX embeddings are used.
        """

        if not texts:
            return []

        # --------------------------------------------------
        # 1. Try Gemini
        # --------------------------------------------------

        if self.is_gemini_ready():

            all_embeddings = []

            for i in range(0, len(texts), batch_size):

                batch = texts[i:i + batch_size]

                success = False
                retries = 3

                while not success and retries > 0:

                    try:

                        if self._gemini_client:

                            response = (
                                self._gemini_client.models.embed_content(
                                    model=self.model_name,
                                    contents=batch
                                )
                            )

                            if (
                                hasattr(response, "embeddings")
                                and response.embeddings
                            ):

                                batch_embeddings = [
                                    self._convert_to_python_floats(
                                        embedding.values
                                    )
                                    for embedding in response.embeddings
                                ]

                                all_embeddings.extend(
                                    batch_embeddings
                                )

                                success = True

                                time.sleep(0.1)

                                continue

                    except Exception as e:

                        retries -= 1

                        logger.warning(
                            f"Gemini batch embedding error: {e}"
                        )

                        if retries > 0:
                            time.sleep(1.0)

            # If Gemini successfully embedded everything
            if len(all_embeddings) == len(texts):

                return all_embeddings

            logger.warning(
                "Gemini could not embed the complete batch. "
                "Switching to local embeddings."
            )

        # --------------------------------------------------
        # 2. Local ONNX fallback
        # --------------------------------------------------

        local_fn = self._get_local_embedder()

        if local_fn:

            try:

                all_embeddings = []

                chunk_batch_size = 100

                for i in range(
                    0,
                    len(texts),
                    chunk_batch_size
                ):

                    batch = texts[
                        i:i + chunk_batch_size
                    ]

                    embeddings = local_fn(batch)

                    # Convert every np.float32 value
                    # to normal Python float
                    converted_embeddings = [
                        self._convert_to_python_floats(
                            embedding
                        )
                        for embedding in embeddings
                    ]

                    all_embeddings.extend(
                        converted_embeddings
                    )

                return all_embeddings

            except Exception as e:

                logger.error(
                    f"Local batch embedding failed: {e}"
                )

        raise RuntimeError(
            "No embedding provider available."
        )


# Create one shared embedding service instance
embedding_service = EmbeddingService()