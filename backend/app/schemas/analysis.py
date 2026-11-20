from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ArchitectureNode(BaseModel):
    id: str
    label: str
    category: str  # e.g., 'frontend', 'backend', 'database', 'service', 'utility', 'config'
    description: Optional[str] = None
    files: List[str] = []

class ArchitectureEdge(BaseModel):
    source: str
    target: str
    relation: str

class ArchitectureResponse(BaseModel):
    overview: str
    modules: List[Dict[str, Any]]
    entry_points: List[Dict[str, Any]]
    relationships: List[Dict[str, str]]
    nodes: List[ArchitectureNode] = []
    edges: List[ArchitectureEdge] = []
    mermaid_diagram: str

class BugFinding(BaseModel):
    id: str
    title: str
    severity: str  # 'critical', 'high', 'medium', 'low', 'info'
    category: str  # 'security', 'error_handling', 'performance', 'code_smell', 'null_safety'
    file_path: str
    start_line: int
    end_line: int
    code_evidence: str
    description: str
    suggested_fix: str

class BugAnalysisRequest(BaseModel):
    file_path: Optional[str] = None  # If None, scans key modules/files across repository

class BugAnalysisResponse(BaseModel):
    repository_id: str
    total_findings: int
    summary: str
    findings: List[BugFinding]

class TestGenerationRequest(BaseModel):
    file_path: str
    target_symbol: Optional[str] = None  # specific function or class name
    framework: Optional[str] = None  # 'pytest', 'jest', 'vitest', etc.

class TestGenerationResponse(BaseModel):
    file_path: str
    framework: str
    test_code: str
    instructions: str
    coverage_notes: List[str]
