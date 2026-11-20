import os
import zipfile
import shutil
from pathlib import Path
from app.utils.logger import logger

def is_safe_zip_path(base_dir: Path, target_path: Path) -> bool:
    try:
        resolved_base = base_dir.resolve()
        resolved_target = target_path.resolve()
        return os.path.commonpath([resolved_base]) == os.path.commonpath([resolved_base, resolved_target])
    except Exception:
        return False

def extract_zip_repo(zip_path: Path, target_dir: Path, max_size_mb: int = 100) -> Path:
    if not zipfile.is_zipfile(zip_path):
        raise ValueError("The uploaded file is not a valid ZIP archive.")

    if target_dir.exists():
        shutil.rmtree(target_dir, ignore_errors=True)
    target_dir.mkdir(parents=True, exist_ok=True)

    max_size_bytes = max_size_mb * 1024 * 1024
    total_uncompressed_size = 0

    with zipfile.ZipFile(zip_path, 'r') as zf:
        # Validate all paths before extracting to avoid Zip Slip
        for info in zf.infolist():
            total_uncompressed_size += info.file_size
            if total_uncompressed_size > max_size_bytes:
                shutil.rmtree(target_dir, ignore_errors=True)
                raise ValueError(f"Extracted ZIP contents exceed maximum allowed size of {max_size_mb} MB.")
            
            dest_file = target_dir / info.filename
            if not is_safe_zip_path(target_dir, dest_file):
                shutil.rmtree(target_dir, ignore_errors=True)
                raise ValueError(f"Unsafe file path detected in ZIP archive: {info.filename}")

        # Extract safely
        zf.extractall(target_dir)

    # Flatten if there's a single root directory inside zip (common for GitHub ZIP downloads)
    sub_entries = [p for p in target_dir.iterdir() if p.name not in [".git", "__MACOSX"]]
    if len(sub_entries) == 1 and sub_entries[0].is_dir():
        nested_dir = sub_entries[0]
        temp_dir = target_dir.parent / f"{target_dir.name}_temp"
        nested_dir.rename(temp_dir)
        shutil.rmtree(target_dir, ignore_errors=True)
        temp_dir.rename(target_dir)

    # Remove __MACOSX if present
    macosx_dir = target_dir / "__MACOSX"
    if macosx_dir.exists():
        shutil.rmtree(macosx_dir, ignore_errors=True)

    logger.info(f"Successfully extracted ZIP repository to {target_dir}")
    return target_dir
