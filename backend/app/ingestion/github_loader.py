import re
import os
import shutil
from pathlib import Path
from urllib.parse import urlparse
from git import Repo, GitCommandError
from app.core.config import settings
from app.utils.logger import logger

GITHUB_URL_PATTERN = re.compile(
    r"^https://github\.com/([a-zA-Z0-9_\-\.]+)/([a-zA-Z0-9_\-\.]+)(?:\.git)?/?$"
)

def validate_github_url(url: str) -> bool:
    parsed = urlparse(url.strip())
    if parsed.netloc != "github.com":
        return False
    match = GITHUB_URL_PATTERN.match(url.strip())
    return match is not None

def extract_repo_name_from_url(url: str) -> str:
    match = GITHUB_URL_PATTERN.match(url.strip())
    if match:
        repo_name = match.group(2)
        if repo_name.endswith(".git"):
            repo_name = repo_name[:-4]
        return repo_name
    return "repository"

def clone_github_repo(url: str, target_dir: Path, max_size_mb: int = 100) -> Path:
    if not validate_github_url(url):
        raise ValueError("Invalid GitHub URL. Only public GitHub URLs (https://github.com/owner/repo) are supported.")

    clean_url = url.strip()
    if clean_url.endswith("/"):
        clean_url = clean_url[:-1]

    if target_dir.exists():
        shutil.rmtree(target_dir, ignore_errors=True)
    target_dir.mkdir(parents=True, exist_ok=True)

    logger.info(f"Cloning GitHub repository from {clean_url} into {target_dir} (depth=1)...")
    try:
        # Clone with depth=1 to save bandwidth, speed up, and protect disk
        Repo.clone_from(clean_url, str(target_dir), depth=1)
    except GitCommandError as e:
        logger.error(f"Git clone failed: {e}")
        shutil.rmtree(target_dir, ignore_errors=True)
        raise RuntimeError(f"Failed to clone repository: {str(e)}")

    # Check total size
    total_size = sum(f.stat().st_size for f in target_dir.glob("**/*") if f.is_file())
    if total_size > max_size_mb * 1024 * 1024:
        shutil.rmtree(target_dir, ignore_errors=True)
        raise ValueError(f"Repository exceeds maximum allowed size of {max_size_mb} MB.")

    return target_dir
