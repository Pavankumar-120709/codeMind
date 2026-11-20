import os
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.database.models import RepositoryModel
from app.schemas.analysis import BugAnalysisResponse, BugFinding
from app.llm.gemini_client import gemini_client
from app.utils.file_utils import get_file_language, is_ignored_path

class BugAnalysisService:
    async def analyze_bugs(self, db: Session, repo_id: str, target_file: Optional[str] = None) -> BugAnalysisResponse:
        repo = db.query(RepositoryModel).filter(RepositoryModel.id == repo_id).first()
        if not repo:
            raise HTTPException(status_code=404, detail="Repository not found")

        repo_dir = Path(repo.local_path).resolve()
        code_samples: List[Dict[str, Any]] = []

        if target_file:
            target_path = (repo_dir / target_file).resolve()
            if not str(target_path).startswith(str(repo_dir)) or not target_path.exists():
                raise HTTPException(status_code=404, detail="Requested file does not exist")
            
            with open(target_path, "r", encoding="utf-8", errors="ignore") as f:
                code_samples.append({
                    "file_path": target_file.replace("\\", "/"),
                    "language": get_file_language(target_path),
                    "content": f.read()[:5000]
                })
        else:
            # Pick representative code files across directories
            count = 0
            for root, _, files in os.walk(repo_dir):
                for f in files:
                    f_path = Path(root) / f
                    rel = f_path.relative_to(repo_dir)
                    if is_ignored_path(rel):
                        continue
                    lang = get_file_language(f_path)
                    if lang in ["python", "typescript", "javascript", "go", "java", "rust", "php"]:
                        try:
                            with open(f_path, "r", encoding="utf-8", errors="ignore") as f_in:
                                code_samples.append({
                                    "file_path": str(rel).replace("\\", "/"),
                                    "language": lang,
                                    "content": f_in.read()[:3000]
                                })
                                count += 1
                                if count >= 10:
                                    break
                        except Exception:
                            pass
                if count >= 10:
                    break

        analysis = await gemini_client.analyze_bugs(code_samples)
        findings = [BugFinding(**f) for f in analysis.get("findings", [])]

        return BugAnalysisResponse(
            repository_id=repo_id,
            total_findings=len(findings),
            summary=analysis.get("summary", "Automated code quality & bug analysis complete."),
            findings=findings
        )

bug_analysis_service = BugAnalysisService()
