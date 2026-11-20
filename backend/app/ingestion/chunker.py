from dataclasses import dataclass
from typing import List, Optional
from app.ingestion.code_parser import parse_code_file, CodeSymbol

@dataclass
class CodeChunk:
    chunk_id: str
    file_path: str
    language: str
    symbol_name: Optional[str]
    symbol_type: Optional[str]
    start_line: int
    end_line: int
    content: str

def chunk_code_file(
    rel_path: str,
    content: str,
    language: str,
    max_chunk_lines: int = 50,
    overlap_lines: int = 10
) -> List[CodeChunk]:
    chunks: List[CodeChunk] = []
    lines = content.splitlines()
    total_lines = len(lines)

    if total_lines == 0:
        return chunks

    symbols = parse_code_file(content, language)
    # Filter out imports for primary chunk boundaries if functions/classes exist
    def_symbols = [s for s in symbols if s.symbol_type in ["function", "class", "method", "interface"]]

    # If we found defined symbols, we can produce symbol-anchored chunks
    if def_symbols:
        for idx, sym in enumerate(def_symbols):
            # Ensure boundaries are within range
            s_line = max(1, sym.start_line)
            e_line = min(total_lines, sym.end_line)
            
            # If end_line was an approximation, try to capture up to next symbol start or max_chunk_lines
            if idx + 1 < len(def_symbols):
                next_sym_start = def_symbols[idx + 1].start_line
                if next_sym_start > s_line:
                    e_line = min(next_sym_start - 1, s_line + max_chunk_lines)

            chunk_lines = lines[s_line - 1 : e_line]
            chunk_text = "\n".join(chunk_lines)

            if chunk_text.strip():
                chunks.append(CodeChunk(
                    chunk_id=f"{rel_path}:{s_line}-{e_line}",
                    file_path=rel_path,
                    language=language,
                    symbol_name=sym.name,
                    symbol_type=sym.symbol_type,
                    start_line=s_line,
                    end_line=e_line,
                    content=f"// File: {rel_path} (Lines {s_line}-{e_line}) [{sym.symbol_type}: {sym.name}]\n{chunk_text}"
                ))

    # Also do a sliding window pass if file has sections not covered or has no symbols
    if not chunks or (total_lines > max_chunk_lines and len(chunks) < total_lines // max_chunk_lines):
        step = max(1, max_chunk_lines - overlap_lines)
        for i in range(0, total_lines, step):
            s_line = i + 1
            e_line = min(total_lines, i + max_chunk_lines)
            chunk_slice = lines[s_line - 1 : e_line]
            chunk_text = "\n".join(chunk_slice)
            
            if chunk_text.strip():
                chunks.append(CodeChunk(
                    chunk_id=f"{rel_path}:{s_line}-{e_line}",
                    file_path=rel_path,
                    language=language,
                    symbol_name=None,
                    symbol_type="block",
                    start_line=s_line,
                    end_line=e_line,
                    content=f"// File: {rel_path} (Lines {s_line}-{e_line})\n{chunk_text}"
                ))

    # Deduplicate chunks with same id
    seen = set()
    unique_chunks = []
    for c in chunks:
        if c.chunk_id not in seen:
            seen.add(c.chunk_id)
            unique_chunks.append(c)

    return unique_chunks
