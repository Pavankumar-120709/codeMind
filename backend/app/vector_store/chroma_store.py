import os
import json
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.core.config import settings
from app.embeddings.embedding_service import embedding_service
from app.ingestion.chunker import CodeChunk
from app.utils.logger import logger

class ChromaStore:
    def __init__(self):
        self.persist_dir = settings.CHROMA_PERSIST_DIRECTORY
        os.makedirs(self.persist_dir, exist_ok=True)
        self.client = chromadb.PersistentClient(
            path=self.persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False)
        )

    def _get_collection_name(self, repository_id: str) -> str:
        clean_id = repository_id.replace("-", "_")
        return f"repo_{clean_id}"[:63]

    def index_repository_chunks(self, repository_id: str, chunks: List[CodeChunk]) -> int:
        if not chunks:
            return 0

        col_name = self._get_collection_name(repository_id)
        # Re-create collection for clean idempotent re-indexing
        try:
            self.client.delete_collection(name=col_name)
        except Exception:
            pass

        collection = self.client.create_collection(
            name=col_name,
            metadata={"repository_id": repository_id, "hnsw:space": "cosine"}
        )

        batch_size = 64
        total_indexed = 0

        for i in range(0, len(chunks), batch_size):
            batch = chunks[i : i + batch_size]
            ids = [f"{repository_id}_{c.chunk_id}" for c in batch]
            documents = [c.content for c in batch]
            metadatas = [
                {
                    "repository_id": repository_id,
                    "file_path": c.file_path,
                    "language": c.language,
                    "symbol_name": c.symbol_name or "",
                    "symbol_type": c.symbol_type or "",
                    "start_line": c.start_line,
                    "end_line": c.end_line
                }
                for c in batch
            ]
            embeddings = embedding_service.embed_texts(documents)

            collection.add(
                ids=ids,
                documents=documents,
                embeddings=embeddings,
                metadatas=metadatas
            )
            total_indexed += len(batch)

        logger.info(f"Indexed {total_indexed} chunks into Chroma collection {col_name}")
        return total_indexed

    def search_chunks(
        self,
        repository_id: str,
        query: str,
        limit: int = 8,
        file_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        col_name = self._get_collection_name(repository_id)
        try:
            collection = self.client.get_collection(name=col_name)
        except Exception as e:
            logger.warning(f"Chroma collection {col_name} not found: {e}")
            return []

        query_emb = embedding_service.embed_query(query)
        where_filter = None
        if file_filter:
            where_filter = {"file_path": file_filter}

        results = collection.query(
            query_embeddings=[query_emb],
            n_results=min(limit, collection.count() or 1),
            where=where_filter
        )

        formatted: List[Dict[str, Any]] = []
        if not results or not results.get("documents"):
            return formatted

        docs = results["documents"][0]
        metas = results["metadatas"][0] if results.get("metadatas") else []
        distances = results["distances"][0] if results.get("distances") else []

        for idx, doc in enumerate(docs):
            meta = metas[idx] if idx < len(metas) else {}
            dist = distances[idx] if idx < len(distances) else 1.0
            # Cosine distance to similarity score
            score = max(0.0, 1.0 - dist)
            formatted.append({
                "content": doc,
                "metadata": meta,
                "score": round(score, 3)
            })

        return formatted

chroma_store = ChromaStore()
