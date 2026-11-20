from pathlib import Path
from typing import Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.database.models import RepositoryModel
from app.schemas.analysis import TestGenerationRequest, TestGenerationResponse
from app.llm.gemini_client import gemini_client
from app.utils.file_utils import get_file_language

class TestGenerationService:
    async def generate_tests(self, db: Session, repo_id: str, req: TestGenerationRequest) -> TestGenerationResponse:
        repo = db.query(RepositoryModel).filter(RepositoryModel.id == repo_id).first()
        if not repo:
            raise HTTPException(status_code=404, detail="Repository not found")

        repo_dir = Path(repo.local_path).resolve()
        target_path = (repo_dir / req.file_path).resolve()

        if not str(target_path).startswith(str(repo_dir)) or not target_path.exists():
            raise HTTPException(status_code=404, detail="Target file not found in repository")

        with open(target_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        lang = get_file_language(target_path)
        auto_framework = req.framework
        if not auto_framework:
            if lang == "python":
                auto_framework = "pytest"
            elif lang in ["typescript", "javascript"]:
                auto_framework = "jest"
            elif lang == "go":
                auto_framework = "testing"
            else:
                auto_framework = "standard"

        result = await gemini_client.generate_tests(
            file_path=req.file_path,
            code_content=content,
            target_symbol=req.target_symbol,
            framework=auto_framework
        )

        return TestGenerationResponse(
            file_path=req.file_path,
            framework=result.get("framework", auto_framework),
            test_code=result.get("test_code", "# Generated tests"),
            instructions=result.get("instructions", f"Run with {auto_framework}"),
            coverage_notes=result.get("coverage_notes", [])
        )

test_generation_service = TestGenerationService()
