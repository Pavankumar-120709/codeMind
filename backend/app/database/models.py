import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def generate_uuid() -> str:
    return str(uuid.uuid4())

class RepositoryModel(Base):
    __tablename__ = "repositories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    source_type = Column(String(50), nullable=False)  # 'github', 'zip', 'demo'
    source_url = Column(String(1024), nullable=True)
    local_path = Column(String(1024), nullable=False)
    status = Column(String(50), default="pending")  # pending, processing, completed, failed
    status_message = Column(Text, default="Repository registered.")
    
    # Statistics
    total_files = Column(Integer, default=0)
    total_chunks = Column(Integer, default=0)
    total_lines = Column(Integer, default=0)
    languages = Column(Text, default="{}")  # JSON encoded dict of language counts
    
    # Cached summaries
    file_tree = Column(Text, default="[]")  # JSON encoded file tree
    architecture_overview = Column(Text, nullable=True)  # Markdown or JSON summary
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    conversations = relationship("ConversationModel", back_populates="repository", cascade="all, delete-orphan")

class ConversationModel(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    repository_id = Column(String(36), ForeignKey("repositories.id"), nullable=False)
    title = Column(String(255), default="New Conversation")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    repository = relationship("RepositoryModel", back_populates="conversations")
    messages = relationship("MessageModel", back_populates="conversation", cascade="all, delete-orphan")

class MessageModel(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id"), nullable=False)
    role = Column(String(50), nullable=False)  # 'user', 'assistant'
    content = Column(Text, nullable=False)
    citations = Column(Text, default="[]")  # JSON encoded list of citation objects
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("ConversationModel", back_populates="messages")
