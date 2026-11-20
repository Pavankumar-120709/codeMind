import re
import ast
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class CodeSymbol:
    name: str
    symbol_type: str  # 'function', 'class', 'method', 'interface', 'type', 'import'
    start_line: int
    end_line: int
    docstring: Optional[str] = None
    signature: Optional[str] = None

def parse_python_ast(content: str) -> List[CodeSymbol]:
    symbols: List[CodeSymbol] = []
    try:
        tree = ast.parse(content)
    except Exception:
        # Fallback to regex parser if AST fails due to syntax edge cases
        return parse_python_regex(content)

    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            doc = ast.get_docstring(node)
            symbols.append(CodeSymbol(
                name=node.name,
                symbol_type="function",
                start_line=node.lineno,
                end_line=getattr(node, "end_lineno", node.lineno),
                docstring=doc,
                signature=f"def {node.name}(...)"
            ))
        elif isinstance(node, ast.ClassDef):
            doc = ast.get_docstring(node)
            symbols.append(CodeSymbol(
                name=node.name,
                symbol_type="class",
                start_line=node.lineno,
                end_line=getattr(node, "end_lineno", node.lineno),
                docstring=doc,
                signature=f"class {node.name}"
            ))
            # Also capture class methods
            for item in node.body:
                if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    m_doc = ast.get_docstring(item)
                    symbols.append(CodeSymbol(
                        name=f"{node.name}.{item.name}",
                        symbol_type="method",
                        start_line=item.lineno,
                        end_line=getattr(item, "end_lineno", item.lineno),
                        docstring=m_doc,
                        signature=f"def {item.name}(self, ...)"
                    ))
        elif isinstance(node, (ast.Import, ast.ImportFrom)):
            names = []
            if isinstance(node, ast.Import):
                names = [alias.name for alias in node.names]
            else:
                module = node.module or ""
                names = [f"{module}.{alias.name}" for alias in node.names]
            symbols.append(CodeSymbol(
                name=", ".join(names),
                symbol_type="import",
                start_line=node.lineno,
                end_line=getattr(node, "end_lineno", node.lineno)
            ))
    return symbols

def parse_python_regex(content: str) -> List[CodeSymbol]:
    symbols: List[CodeSymbol] = []
    lines = content.splitlines()
    func_pattern = re.compile(r"^(?:async\s+)?def\s+([a-zA-Z_0-9]+)\s*\(")
    class_pattern = re.compile(r"^class\s+([a-zA-Z_0-9]+)")

    for idx, line in enumerate(lines):
        line_num = idx + 1
        m_func = func_pattern.match(line.strip())
        if m_func:
            symbols.append(CodeSymbol(
                name=m_func.group(1),
                symbol_type="function",
                start_line=line_num,
                end_line=min(line_num + 20, len(lines))
            ))
            continue
        m_cls = class_pattern.match(line.strip())
        if m_cls:
            symbols.append(CodeSymbol(
                name=m_cls.group(1),
                symbol_type="class",
                start_line=line_num,
                end_line=min(line_num + 30, len(lines))
            ))
    return symbols

def parse_js_ts_symbols(content: str) -> List[CodeSymbol]:
    symbols: List[CodeSymbol] = []
    lines = content.splitlines()

    # Regex patterns for JavaScript/TypeScript symbols
    func_pattern = re.compile(r"(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\(")
    const_func_pattern = re.compile(r"(?:export\s+)?const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>")
    class_pattern = re.compile(r"(?:export\s+)?(?:default\s+)?class\s+([a-zA-Z0-9_$]+)")
    interface_pattern = re.compile(r"(?:export\s+)?(?:interface|type)\s+([a-zA-Z0-9_$]+)")
    import_pattern = re.compile(r"^import\s+(?:.+from\s+)?['\"]([^'\"]+)['\"]")

    for idx, line in enumerate(lines):
        line_num = idx + 1
        stripped = line.strip()

        m_import = import_pattern.match(stripped)
        if m_import:
            symbols.append(CodeSymbol(
                name=m_import.group(1),
                symbol_type="import",
                start_line=line_num,
                end_line=line_num
            ))
            continue

        m_class = class_pattern.search(stripped)
        if m_class:
            symbols.append(CodeSymbol(
                name=m_class.group(1),
                symbol_type="class",
                start_line=line_num,
                end_line=min(line_num + 40, len(lines))
            ))
            continue

        m_func = func_pattern.search(stripped) or const_func_pattern.search(stripped)
        if m_func:
            symbols.append(CodeSymbol(
                name=m_func.group(1),
                symbol_type="function",
                start_line=line_num,
                end_line=min(line_num + 25, len(lines))
            ))
            continue

        m_iface = interface_pattern.search(stripped)
        if m_iface:
            symbols.append(CodeSymbol(
                name=m_iface.group(1),
                symbol_type="interface",
                start_line=line_num,
                end_line=min(line_num + 15, len(lines))
            ))

    return symbols

def parse_code_file(content: str, language: str) -> List[CodeSymbol]:
    if language == "python":
        return parse_python_ast(content)
    elif language in ["typescript", "javascript"]:
        return parse_js_ts_symbols(content)
    else:
        # Generic symbol extractor
        symbols: List[CodeSymbol] = []
        generic_func = re.compile(r"(?:func|fn|def|function)\s+([a-zA-Z0-9_]+)")
        for idx, line in enumerate(content.splitlines()):
            m = generic_func.search(line.strip())
            if m:
                symbols.append(CodeSymbol(
                    name=m.group(1),
                    symbol_type="function",
                    start_line=idx + 1,
                    end_line=idx + 20
                ))
        return symbols
