from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl

class ImportRepoRequest(BaseModel):
    github_url: str = Field(..., description="Public GitHub repository URL (e.g., https://github.com/owner/repo)")

class RepositoryResponse(BaseModel):
    id: str
    name: str
    source_type: str
    source_url: Optional[str] = None
    local_path: str
    status: str
    status_message: Optional[str] = None
    total_files: int = 0
    total_chunks: int = 0
    total_lines: int = 0
    languages: Dict[str, int] = {}
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FileTreeNode(BaseModel):
    name: str
    path: str
    type: str  # 'file' | 'directory'
    size: Optional[int] = None
    language: Optional[str] = None
    children: Optional[List["FileTreeNode"]] = None

FileTreeNode.update_forward_refs()

class RepositoryStatsResponse(BaseModel):
    id: str
    name: str
    status: str
    total_files: int
    total_chunks: int
    total_lines: int
    languages: Dict[str, int]
    top_symbols: List[Dict[str, Any]] = []

class FileContentResponse(BaseModel):
    path: str
    name: str
    language: str
    size: int
    lines: int
    content: str
