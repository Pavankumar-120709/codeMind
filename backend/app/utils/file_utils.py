import os
from pathlib import Path
from typing import List, Set

# Ignored directory names
IGNORED_DIRECTORIES: Set[str] = {
    ".git", ".svn", ".hg", "node_modules", "vendor",
    "venv", ".venv", "env", ".env", "virtualenv",
    "__pycache__", ".pytest_cache", ".mypy_cache", ".ruff_cache",
    "dist", "build", "out", ".next", ".nuxt", "target", "bin", "obj",
    ".idea", ".vscode", ".vs", "coverage", ".turbo"
}

# Ignored file extensions (binaries, archives, media, lockfiles if massive)
IGNORED_EXTENSIONS: Set[str] = {
    ".exe", ".dll", ".so", ".dylib", ".bin",
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".webp",
    ".mp3", ".wav", ".mp4", ".avi", ".mov",
    ".zip", ".tar", ".gz", ".7z", ".rar",
    ".pyc", ".pyo", ".pyd", ".class", ".jar", ".war",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx",
    ".iso", ".img", ".dmg", ".sqlite", ".db"
}

# Sensitive files that must NEVER be indexed
SENSITIVE_FILES: Set[str] = {
    ".env", ".env.local", ".env.production", ".env.development",
    "id_rsa", "id_ed25519", "credentials.json", "service-account.json",
    "key.pem", "cert.pem", "secrets.json", "auth.json"
}

# Extension to language map
EXTENSION_TO_LANGUAGE = {
    ".py": "python",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".js": "javascript",
    ".jsx": "javascript",
    ".json": "json",
    ".html": "html",
    ".css": "css",
    ".scss": "scss",
    ".java": "java",
    ".go": "go",
    ".rs": "rust",
    ".c": "c",
    ".cpp": "cpp",
    ".h": "c",
    ".hpp": "cpp",
    ".cs": "csharp",
    ".php": "php",
    ".rb": "ruby",
    ".sql": "sql",
    ".sh": "shell",
    ".bash": "shell",
    ".ps1": "powershell",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".md": "markdown",
    ".toml": "toml",
    ".xml": "xml",
    ".dockerfile": "dockerfile"
}

def is_ignored_path(relative_path: Path) -> bool:
    parts = relative_path.parts
    for part in parts:
        if part in IGNORED_DIRECTORIES:
            return True
        if part.startswith(".") and part not in [".github"]:
            return True
    
    file_name = relative_path.name
    if file_name in SENSITIVE_FILES or file_name.startswith(".env"):
        return True
    if any(file_name.endswith(ext) for ext in IGNORED_EXTENSIONS):
        return True
    return False

def get_file_language(file_path: Path) -> str:
    ext = file_path.suffix.lower()
    if file_path.name.lower() == "dockerfile":
        return "dockerfile"
    return EXTENSION_TO_LANGUAGE.get(ext, "text")

def format_file_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
