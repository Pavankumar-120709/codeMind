from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.analysis import (
    ArchitectureResponse, BugAnalysisRequest, BugAnalysisResponse,
    TestGenerationRequest, TestGenerationResponse
)
from app.services.architecture_service import architecture_service
from app.services.bug_analysis_service import bug_analysis_service
from app.services.test_generation_service import test_generation_service

router = APIRouter(prefix="/repositories", tags=["Analysis"])

@router.get("/{id}/architecture", response_model=ArchitectureResponse)
async def get_repository_architecture(
    id: str,
    force: bool = False,
    db: Session = Depends(get_db)
):
    return await architecture_service.get_or_analyze_architecture(db, id, force=force)

@router.post("/{id}/analyze", response_model=BugAnalysisResponse)
async def analyze_bugs_and_code_smells(
    id: str,
    req: BugAnalysisRequest = BugAnalysisRequest(),
    db: Session = Depends(get_db)
):
    return await bug_analysis_service.analyze_bugs(db, id, req.file_path)

@router.post("/{id}/generate-tests", response_model=TestGenerationResponse)
async def generate_unit_tests(
    id: str,
    req: TestGenerationRequest,
    db: Session = Depends(get_db)
):
    return await test_generation_service.generate_tests(db, id, req)
