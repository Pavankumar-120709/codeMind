import os
import json
from pathlib import Path
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.database.models import RepositoryModel
from app.schemas.analysis import ArchitectureResponse, ArchitectureNode, ArchitectureEdge
from app.llm.gemini_client import gemini_client
from app.utils.file_utils import get_file_language
from app.utils.logger import logger

class ArchitectureService:
    async def get_or_analyze_architecture(self, db: Session, repo_id: str, force: bool = False) -> ArchitectureResponse:
        repo = db.query(RepositoryModel).filter(RepositoryModel.id == repo_id).first()
        if not repo:
            raise HTTPException(status_code=404, detail="Repository not found")

        # Return cached analysis if valid and not forcing refresh
        if repo.architecture_overview and not force:
            try:
                cached = json.loads(repo.architecture_overview)
                overview_str = cached.get("overview", "")
                if "Configure GEMINI_API_KEY" not in overview_str and "error" not in overview_str.lower():
                    return ArchitectureResponse(**cached)
            except Exception:
                pass

        # Collect top files and structure
        repo_dir = Path(repo.local_path)
        file_summaries: List[Dict[str, Any]] = []

        if repo_dir.exists():
            for root, _, files in os.walk(repo_dir):
                for f in files:
                    f_path = Path(root) / f
                    rel = f_path.relative_to(repo_dir)
                    if len(file_summaries) < 60:
                        file_summaries.append({
                            "path": str(rel).replace("\\", "/"),
                            "name": f,
                            "language": get_file_language(f_path),
                            "size": f_path.stat().st_size
                        })

        analysis = await gemini_client.analyze_architecture(file_summaries)

        nodes = [ArchitectureNode(**n) for n in analysis.get("nodes", [])]
        edges = [ArchitectureEdge(**e) for e in analysis.get("edges", [])]

        # If model returned no nodes, construct baseline nodes from detected modules
        if not nodes and analysis.get("modules"):
            for idx, m in enumerate(analysis.get("modules", [])):
                nodes.append(ArchitectureNode(
                    id=f"mod_{idx}",
                    label=m.get("name", f"Module {idx}"),
                    category=m.get("category", "service"),
                    description=m.get("description", ""),
                    files=m.get("key_files", [])
                ))

        response = ArchitectureResponse(
            overview=analysis.get("overview", "Project architectural overview based on source structure."),
            modules=analysis.get("modules", []),
            entry_points=analysis.get("entry_points", []),
            relationships=analysis.get("relationships", []),
            nodes=nodes,
            edges=edges,
            mermaid_diagram=analysis.get("mermaid_diagram", "graph TD\n  App[Application] --> Modules[Detected Modules]")
        )

        # Cache in db
        repo.architecture_overview = json.dumps(response.dict())
        db.commit()

        return response

architecture_service = ArchitectureService()
