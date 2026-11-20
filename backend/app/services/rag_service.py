import json
from typing import List, Dict, Any, AsyncIterator, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.database.models import RepositoryModel, ConversationModel, MessageModel
from app.schemas.chat import ChatRequest, Citation, MessageResponse, ConversationResponse
from app.vector_store.chroma_store import chroma_store
from app.llm.gemini_client import gemini_client
from app.utils.logger import logger

class RAGService:
    def get_or_create_conversation(self, db: Session, repo_id: str, conv_id: Optional[str] = None, title_hint: str = "") -> ConversationModel:
        if conv_id:
            conv = db.query(ConversationModel).filter(
                ConversationModel.id == conv_id,
                ConversationModel.repository_id == repo_id
            ).first()
            if conv:
                return conv

        title = title_hint[:40] if title_hint else "New Conversation"
        conv = ConversationModel(
            repository_id=repo_id,
            title=title
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
        return conv

    def list_conversations(self, db: Session, repo_id: str) -> List[ConversationResponse]:
        convs = db.query(ConversationModel).filter(
            ConversationModel.repository_id == repo_id
        ).order_by(ConversationModel.created_at.desc()).all()

        results = []
        for c in convs:
            messages = [
                MessageResponse(
                    id=m.id,
                    conversation_id=m.conversation_id,
                    role=m.role,
                    content=m.content,
                    citations=[Citation(**cit) for cit in json.loads(m.citations or "[]")],
                    created_at=m.created_at
                )
                for m in c.messages
            ]
            results.append(ConversationResponse(
                id=c.id,
                repository_id=c.repository_id,
                title=c.title,
                created_at=c.created_at,
                updated_at=c.updated_at,
                messages=messages
            ))
        return results

    async def chat(self, db: Session, repo_id: str, req: ChatRequest) -> Dict[str, Any]:
        repo = db.query(RepositoryModel).filter(RepositoryModel.id == repo_id).first()
        if not repo:
            raise HTTPException(status_code=404, detail="Repository not found")

        conv = self.get_or_create_conversation(db, repo_id, req.conversation_id, title_hint=req.message)

        # Retrieve relevant code context from ChromaDB
        chunks = chroma_store.search_chunks(
            repository_id=repo_id,
            query=req.message,
            limit=7,
            file_filter=req.file_focus
        )

        # Prepare citations
        citations = []
        for c in chunks:
            meta = c.get("metadata", {})
            citations.append(Citation(
                file_path=meta.get("file_path", "unknown"),
                start_line=meta.get("start_line", 1),
                end_line=meta.get("end_line", 1),
                symbol_name=meta.get("symbol_name"),
                symbol_type=meta.get("symbol_type"),
                code_snippet=c.get("content", "")[:300],
                score=round(c.get("score", 0.0), 3)
            ))

        # Build conversation history
        history = [
            {"role": m.role, "content": m.content}
            for m in conv.messages[-6:]
        ]

        # Record User Message
        user_msg = MessageModel(
            conversation_id=conv.id,
            role="user",
            content=req.message,
            citations="[]"
        )
        db.add(user_msg)
        db.commit()

        # Generate Gemini Answer
        ai_answer = await gemini_client.generate_chat_response(
            query=req.message,
            context_chunks=chunks,
            history=history
        )

        citations_json = json.dumps([c.dict() for c in citations])
        assistant_msg = MessageModel(
            conversation_id=conv.id,
            role="assistant",
            content=ai_answer,
            citations=citations_json
        )
        db.add(assistant_msg)
        db.commit()
        db.refresh(assistant_msg)

        return {
            "conversation_id": conv.id,
            "message": MessageResponse(
                id=assistant_msg.id,
                conversation_id=conv.id,
                role=assistant_msg.role,
                content=assistant_msg.content,
                citations=citations,
                created_at=assistant_msg.created_at
            )
        }

    async def stream_chat(self, db: Session, repo_id: str, req: ChatRequest) -> AsyncIterator[str]:
        repo = db.query(RepositoryModel).filter(RepositoryModel.id == repo_id).first()
        if not repo:
            yield json.dumps({"type": "error", "message": "Repository not found"}) + "\n"
            return

        conv = self.get_or_create_conversation(db, repo_id, req.conversation_id, title_hint=req.message)

        # Retrieve chunks
        chunks = chroma_store.search_chunks(
            repository_id=repo_id,
            query=req.message,
            limit=7,
            file_filter=req.file_focus
        )

        citations = []
        for c in chunks:
            meta = c.get("metadata", {})
            citations.append({
                "file_path": meta.get("file_path", "unknown"),
                "start_line": meta.get("start_line", 1),
                "end_line": meta.get("end_line", 1),
                "symbol_name": meta.get("symbol_name"),
                "symbol_type": meta.get("symbol_type"),
                "code_snippet": c.get("content", "")[:300],
                "score": round(c.get("score", 0.0), 3)
            })

        # Save user message
        user_msg = MessageModel(
            conversation_id=conv.id,
            role="user",
            content=req.message,
            citations="[]"
        )
        db.add(user_msg)
        db.commit()

        # Send meta event (conversation id and citations)
        yield json.dumps({
            "type": "meta",
            "conversation_id": conv.id,
            "citations": citations
        }) + "\n"

        history = [
            {"role": m.role, "content": m.content}
            for m in conv.messages[-6:]
        ]

        full_response = ""
        async for chunk in gemini_client.stream_chat_response(req.message, chunks, history):
            full_response += chunk
            yield json.dumps({"type": "token", "token": chunk}) + "\n"

        # Save assistant message
        assistant_msg = MessageModel(
            conversation_id=conv.id,
            role="assistant",
            content=full_response,
            citations=json.dumps(citations)
        )
        db.add(assistant_msg)
        db.commit()

        yield json.dumps({"type": "done"}) + "\n"

rag_service = RAGService()
