import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.repository import (
    ImportRepoRequest, RepositoryResponse, FileTreeNode,
    RepositoryStatsResponse, FileContentResponse
)
from app.services.repository_service import repository_service

router = APIRouter(prefix="/repositories", tags=["Repositories"])

@router.post("/import", response_model=RepositoryResponse)
def import_github_repository(
    req: ImportRepoRequest,
    bg_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    try:
        repo = repository_service.create_github_repo(db, req.github_url, bg_tasks)
        return RepositoryResponse(
            id=repo.id,
            name=repo.name,
            source_type=repo.source_type,
            source_url=repo.source_url,
            local_path=repo.local_path,
            status=repo.status,
            status_message=repo.status_message,
            total_files=repo.total_files,
            total_chunks=repo.total_chunks,
            total_lines=repo.total_lines,
            languages=json.loads(repo.languages or "{}"),
            created_at=repo.created_at,
            updated_at=repo.updated_at
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")

@router.post("/upload", response_model=RepositoryResponse)
async def upload_zip_repository(
    bg_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip files are supported.")
    try:
        repo = repository_service.create_zip_repo(db, file, bg_tasks)
        return RepositoryResponse(
            id=repo.id,
            name=repo.name,
            source_type=repo.source_type,
            source_url=repo.source_url,
            local_path=repo.local_path,
            status=repo.status,
            status_message=repo.status_message,
            total_files=repo.total_files,
            total_chunks=repo.total_chunks,
            total_lines=repo.total_lines,
            languages=json.loads(repo.languages or "{}"),
            created_at=repo.created_at,
            updated_at=repo.updated_at
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload processing failed: {str(e)}")

@router.get("", response_model=List[RepositoryResponse])
def list_repositories(db: Session = Depends(get_db)):
    # Auto-initialize demo repo if database is completely empty
    existing = repository_service.list_repositories(db)
    if not existing:
        try:
            repository_service.ensure_demo_repository(db)
            existing = repository_service.list_repositories(db)
        except Exception:
            pass

    return [
        RepositoryResponse(
            id=r.id,
            name=r.name,
            source_type=r.source_type,
            source_url=r.source_url,
            local_path=r.local_path,
            status=r.status,
            status_message=r.status_message,
            total_files=r.total_files,
            total_chunks=r.total_chunks,
            total_lines=r.total_lines,
            languages=json.loads(r.languages or "{}"),
            created_at=r.created_at,
            updated_at=r.updated_at
        )
        for r in existing
    ]

@router.get("/{id}", response_model=RepositoryResponse)
def get_repository(id: str, db: Session = Depends(get_db)):
    repo = repository_service.get_repository(db, id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    return RepositoryResponse(
        id=repo.id,
        name=repo.name,
        source_type=repo.source_type,
        source_url=repo.source_url,
        local_path=repo.local_path,
        status=repo.status,
        status_message=repo.status_message,
        total_files=repo.total_files,
        total_chunks=repo.total_chunks,
        total_lines=repo.total_lines,
        languages=json.loads(repo.languages or "{}"),
        created_at=repo.created_at,
        updated_at=repo.updated_at
    )

@router.get("/{id}/tree", response_model=List[Dict[str, Any]])
def get_repository_tree(id: str, db: Session = Depends(get_db)):
    repo = repository_service.get_repository(db, id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    return json.loads(repo.file_tree or "[]")

@router.get("/{id}/files", response_model=FileContentResponse)
def get_repository_file(
    id: str,
    path: str = Query(..., description="Relative file path"),
    db: Session = Depends(get_db)
):
    return repository_service.get_file_content(db, id, path)

@router.get("/{id}/stats", response_model=RepositoryStatsResponse)
def get_repository_stats(id: str, db: Session = Depends(get_db)):
    repo = repository_service.get_repository(db, id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    lang_dict = json.loads(repo.languages or "{}")
    return RepositoryStatsResponse(
        id=repo.id,
        name=repo.name,
        status=repo.status,
        total_files=repo.total_files,
        total_chunks=repo.total_chunks,
        total_lines=repo.total_lines,
        languages=lang_dict,
        top_symbols=[]
    )
