import os
from typing import List
from app.core.config import settings
from app.utils.logger import logger

class EmbeddingService:
    def __init__(self):
        self._model = None
        self._model_name = settings.EMBEDDING_MODEL

    def _load_model(self):
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info(f"Loading SentenceTransformer model '{self._model_name}'...")
                self._model = SentenceTransformer(self._model_name)
                logger.info("SentenceTransformer model loaded successfully.")
            except Exception as e:
                logger.warning(f"SentenceTransformer load failed: {e}. Falling back to lightweight semantic hash vectors.")
                self._model = "fallback"

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        self._load_model()
        if self._model != "fallback":
            try:
                embeddings = self._model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
                return [emb.tolist() for emb in embeddings]
            except Exception as e:
                logger.error(f"Error encoding with SentenceTransformer: {e}")
        
        # Fallback 384-dimensional normalized pseudo-vector from text n-grams
        return [self._fallback_vector(t) for t in texts]

    def embed_query(self, query: str) -> List[float]:
        return self.embed_texts([query])[0]

    def _fallback_vector(self, text: str, dim: int = 384) -> List[float]:
        import hashlib
        import math
        vec = [0.0] * dim
        tokens = text.lower().split()
        for tok in tokens:
            h = int(hashlib.md5(tok.encode("utf-8")).hexdigest(), 16)
            idx = h % dim
            vec[idx] += 1.0
        # Normalize
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        return vec

embedding_service = EmbeddingService()
