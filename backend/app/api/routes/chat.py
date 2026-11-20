from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.chat import ChatRequest, ConversationResponse
from app.services.rag_service import rag_service

router = APIRouter(prefix="/repositories", tags=["Chat & RAG"])

@router.post("/{id}/chat")
async def chat_with_codebase(
    id: str,
    req: ChatRequest,
    stream: bool = Query(True, description="Enable SSE token streaming"),
    db: Session = Depends(get_db)
):
    if stream:
        return StreamingResponse(
            rag_service.stream_chat(db, id, req),
            media_type="application/x-ndjson"
        )
    else:
        return await rag_service.chat(db, id, req)

@router.get("/{id}/conversations", response_model=List[ConversationResponse])
def get_conversations(id: str, db: Session = Depends(get_db)):
    return rag_service.list_conversations(db, id)
