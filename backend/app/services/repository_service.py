import os
import json
import shutil
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import UploadFile, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.models import RepositoryModel
from app.database.session import SessionLocal
from app.ingestion.github_loader import clone_github_repo, extract_repo_name_from_url
from app.ingestion.zip_loader import extract_zip_repo
from app.ingestion.file_scanner import scan_repository_files, build_file_tree
from app.ingestion.chunker import chunk_code_file, CodeChunk
from app.vector_store.chroma_store import chroma_store
from app.utils.file_utils import get_file_language, is_ignored_path
from app.utils.logger import logger

class RepositoryService:
    def create_github_repo(self, db: Session, github_url: str, bg_tasks: BackgroundTasks) -> RepositoryModel:
        repo_name = extract_repo_name_from_url(github_url)
        repo_record = RepositoryModel(
            name=repo_name,
            source_type="github",
            source_url=github_url,
            local_path="",
            status="pending",
            status_message="Repository queued for cloning and indexing."
        )
        db.add(repo_record)
        db.commit()
        db.refresh(repo_record)

        target_dir = Path(settings.STORAGE_DIRECTORY) / "repos" / repo_record.id
        repo_record.local_path = str(target_dir)
        db.commit()

        bg_tasks.add_task(self._process_github_clone_and_index, repo_record.id, github_url, target_dir)
        return repo_record

    def create_zip_repo(self, db: Session, file: UploadFile, bg_tasks: BackgroundTasks) -> RepositoryModel:
        original_name = Path(file.filename).stem or "uploaded_project"
        repo_record = RepositoryModel(
            name=original_name,
            source_type="zip",
            source_url=None,
            local_path="",
            status="pending",
            status_message="ZIP uploaded. Extraction and indexing queued."
        )
        db.add(repo_record)
        db.commit()
        db.refresh(repo_record)

        upload_dir = Path(settings.STORAGE_DIRECTORY) / "uploads"
        temp_zip_path = upload_dir / f"{repo_record.id}_{file.filename}"
        target_dir = Path(settings.STORAGE_DIRECTORY) / "repos" / repo_record.id
        repo_record.local_path = str(target_dir)
        db.commit()

        # Save uploaded zip temporarily
        with open(temp_zip_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        bg_tasks.add_task(self._process_zip_extract_and_index, repo_record.id, temp_zip_path, target_dir)
        return repo_record

    def _process_github_clone_and_index(self, repo_id: str, github_url: str, target_dir: Path):
        db = SessionLocal()
        try:
            repo = db.query(RepositoryModel).filter(RepositoryModel.id == repo_id).first()
            if not repo:
                return
            repo.status = "processing"
            repo.status_message = "Cloning repository from GitHub..."
            db.commit()

            clone_github_repo(github_url, target_dir, max_size_mb=settings.MAX_REPOSITORY_SIZE_MB)
            self._index_directory(db, repo, target_dir)
        except Exception as e:
            logger.error(f"Failed processing GitHub repo {repo_id}: {e}")
            repo = db.query(RepositoryModel).filter(RepositoryModel.id == repo_id).first()
            if repo:
                repo.status = "failed"
                repo.status_message = f"Cloning or indexing failed: {str(e)}"
                db.commit()
        finally:
            db.close()

    def _process_zip_extract_and_index(self, repo_id: str, zip_path: Path, target_dir: Path):
        db = SessionLocal()
        try:
            repo = db.query(RepositoryModel).filter(RepositoryModel.id == repo_id).first()
            if not repo:
                return
            repo.status = "processing"
            repo.status_message = "Extracting ZIP archive safely..."
            db.commit()

            extract_zip_repo(zip_path, target_dir, max_size_mb=settings.MAX_REPOSITORY_SIZE_MB)
            if zip_path.exists():
                os.remove(zip_path)

            self._index_directory(db, repo, target_dir)
        except Exception as e:
            logger.error(f"Failed processing ZIP repo {repo_id}: {e}")
            repo = db.query(RepositoryModel).filter(RepositoryModel.id == repo_id).first()
            if repo:
                repo.status = "failed"
                repo.status_message = f"Extraction or indexing failed: {str(e)}"
                db.commit()
        finally:
            db.close()

    def _index_directory(self, db: Session, repo: RepositoryModel, target_dir: Path):
        repo.status_message = "Scanning files and parsing code structure..."
        db.commit()

        valid_files, lang_stats, total_files, total_lines = scan_repository_files(target_dir)
        file_tree = build_file_tree(target_dir)

        repo.total_files = total_files
        repo.total_lines = total_lines
        repo.languages = json.dumps(lang_stats)
        repo.file_tree = json.dumps(file_tree)
        repo.status_message = f"Chunking and embedding {total_files} source files..."
        db.commit()

        all_chunks: List[CodeChunk] = []
        for rel_file in valid_files:
            abs_path = target_dir / rel_file
            try:
                with open(abs_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                lang = get_file_language(abs_path)
                posix_path = str(rel_file).replace("\\", "/")
                file_chunks = chunk_code_file(posix_path, content, lang)
                all_chunks.extend(file_chunks)
            except Exception as e:
                logger.warning(f"Could not chunk file {rel_file}: {e}")

        repo.total_chunks = len(all_chunks)
        repo.status_message = f"Saving {len(all_chunks)} vector embeddings into ChromaDB..."
        db.commit()

        chroma_store.index_repository_chunks(repo.id, all_chunks)

        repo.status = "completed"
        repo.status_message = f"Successfully indexed {total_files} files and {len(all_chunks)} code chunks."
        db.commit()
        logger.info(f"Repository {repo.id} indexing completed.")

    def get_repository(self, db: Session, repo_id: str) -> Optional[RepositoryModel]:
        return db.query(RepositoryModel).filter(RepositoryModel.id == repo_id).first()

    def list_repositories(self, db: Session) -> List[RepositoryModel]:
        return db.query(RepositoryModel).order_by(RepositoryModel.created_at.desc()).all()

    def get_file_content(self, db: Session, repo_id: str, file_path: str) -> Dict[str, Any]:
        repo = self.get_repository(db, repo_id)
        if not repo:
            raise HTTPException(status_code=404, detail="Repository not found")

        base_dir = Path(repo.local_path).resolve()
        target_path = (base_dir / file_path).resolve()

        # Prevent directory traversal
        if not str(target_path).startswith(str(base_dir)):
            raise HTTPException(status_code=403, detail="Access denied: outside repository root")

        if not target_path.exists() or not target_path.is_file():
            raise HTTPException(status_code=404, detail="File not found")

        try:
            with open(target_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            lines = content.count("\n") + 1
            return {
                "path": file_path.replace("\\", "/"),
                "name": target_path.name,
                "language": get_file_language(target_path),
                "size": target_path.stat().st_size,
                "lines": lines,
                "content": content
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")

    def ensure_demo_repository(self, db: Session) -> RepositoryModel:
        # Check if demo repo already exists
        existing = db.query(RepositoryModel).filter(RepositoryModel.source_type == "demo").first()
        if existing and existing.status == "completed":
            return existing

        demo_dir = Path("./storage/repos/demo-ecommerce").resolve()
        demo_dir.mkdir(parents=True, exist_ok=True)

        # Create sample codebase if not exists
        sample_files = {
            "src/auth/jwt.py": """import jwt
from datetime import datetime, timedelta

SECRET_KEY = "super-secret-key-for-demo"
ALGORITHM = "HS256"

def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=1)) -> str:
    \"\"\"Generates a signed JWT access token for user authentication.\"\"\"
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    \"\"\"Verifies the JWT token signature and expiration.\"\"\"
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return {}
""",
            "src/services/payment.py": """from decimal import Decimal

class PaymentService:
    def __init__(self, gateway_client=None):
        self.gateway = gateway_client

    def process_charge(self, customer_id: str, amount: Decimal, currency: str = "USD") -> dict:
        \"\"\"Executes a customer charge through payment provider.\"\"\"
        if amount <= 0:
            raise ValueError("Charge amount must be strictly greater than 0")
        
        # Simulating external gateway charge
        return {
            "transaction_id": f"tx_{customer_id}_9982",
            "status": "success",
            "amount": float(amount),
            "currency": currency
        }
""",
            "src/models/user.py": """from dataclasses import dataclass
from typing import Optional

@dataclass
class User:
    id: str
    email: str
    role: str = "customer"
    is_active: bool = True

    def is_admin(self) -> bool:
        return self.role == "admin"
""",
            "src/api/routes.py": """from fastapi import APIRouter, HTTPException, Depends
from src.auth.jwt import create_access_token, verify_token
from src.services.payment import PaymentService

router = APIRouter(prefix="/api/v1")
payment_service = PaymentService()

@router.post("/login")
def login(username: str, password: str):
    if username == "admin" and password == "secret":
        token = create_access_token({"sub": username, "role": "admin"})
        return {"access_token": token, "token_type": "bearer"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/checkout")
def checkout(customer_id: str, amount: float):
    return payment_service.process_charge(customer_id, amount)
""",
            "README.md": """# Demo E-Commerce Microservice
A lightweight e-commerce backend demonstration showcasing authentication, checkout, and customer management.
"""
        }

        for path_str, file_content in sample_files.items():
            f_path = demo_dir / path_str
            f_path.parent.mkdir(parents=True, exist_ok=True)
            with open(f_path, "w", encoding="utf-8") as f:
                f.write(file_content)

        demo_record = existing or RepositoryModel(
            name="Demo E-Commerce Microservice",
            source_type="demo",
            source_url="https://github.com/codemind-demo/ecommerce-microservice",
            local_path=str(demo_dir),
            status="processing",
            status_message="Indexing demo repository..."
        )
        if not existing:
            db.add(demo_record)
        db.commit()
        db.refresh(demo_record)

        self._index_directory(db, demo_record, demo_dir)
        return demo_record

repository_service = RepositoryService()
