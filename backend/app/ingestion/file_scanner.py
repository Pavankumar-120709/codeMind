import os
from pathlib import Path
from typing import List, Dict, Tuple, Any
from app.utils.file_utils import is_ignored_path, get_file_language
from app.utils.logger import logger

def scan_repository_files(repo_path: Path) -> Tuple[List[Path], Dict[str, int], int, int]:
    """
    Scans repository directory and returns:
    - valid_files: List of file Paths relative to repo_path
    - language_stats: Dict of {language: file_count}
    - total_files: Count of valid files
    - total_lines: Approximate total lines across all valid files
    """
    valid_files: List[Path] = []
    language_stats: Dict[str, int] = {}
    total_lines = 0

    if not repo_path.exists() or not repo_path.is_dir():
        return valid_files, language_stats, 0, 0

    for root, dirs, files in os.walk(repo_path):
        current_dir = Path(root)
        rel_dir = current_dir.relative_to(repo_path)
        
        # In-place modify dirs to avoid descending into ignored directories
        dirs[:] = [d for d in dirs if not is_ignored_path(rel_dir / d)]

        for file_name in files:
            file_path = current_dir / file_name
            rel_file_path = file_path.relative_to(repo_path)

            if is_ignored_path(rel_file_path):
                continue

            # Limit individual file size to 2MB to prevent massive minified bundle issues
            try:
                if file_path.stat().st_size > 2 * 1024 * 1024:
                    continue
                
                lang = get_file_language(file_path)
                language_stats[lang] = language_stats.get(lang, 0) + 1
                valid_files.append(rel_file_path)

                # Count lines safely
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        lines = sum(1 for _ in f)
                        total_lines += lines
                except Exception:
                    pass

            except Exception as e:
                logger.warning(f"Failed to inspect file {file_path}: {e}")

    return valid_files, language_stats, len(valid_files), total_lines

def build_file_tree(repo_path: Path) -> List[Dict[str, Any]]:
    """
    Builds a JSON-serializable hierarchical file tree for the repository.
    """
    def _build_node(current_path: Path) -> Dict[str, Any]:
        rel = current_path.relative_to(repo_path)
        is_dir = current_path.is_dir()
        
        node: Dict[str, Any] = {
            "name": current_path.name if str(rel) != "." else repo_path.name,
            "path": str(rel).replace("\\", "/"),
            "type": "directory" if is_dir else "file",
        }

        if not is_dir:
            node["size"] = current_path.stat().st_size
            node["language"] = get_file_language(current_path)
            return node

        children = []
        try:
            entries = sorted(list(current_path.iterdir()), key=lambda e: (not e.is_dir(), e.name.lower()))
            for entry in entries:
                rel_entry = entry.relative_to(repo_path)
                if is_ignored_path(rel_entry):
                    continue
                # If directory, ensure it has unignored contents
                if entry.is_dir():
                    sub_node = _build_node(entry)
                    if sub_node.get("children") or len(sub_node.get("children", [])) > 0:
                        children.append(sub_node)
                else:
                    children.append(_build_node(entry))
        except Exception as e:
            logger.warning(f"Error reading directory {current_path}: {e}")

        node["children"] = children
        return node

    tree_root = _build_node(repo_path)
    return tree_root.get("children", [])
