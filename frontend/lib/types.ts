export interface Repository {
  id: string;
  name: string;
  source_type: "github" | "zip" | "demo";
  source_url?: string;
  local_path: string;
  status: "pending" | "processing" | "completed" | "failed";
  status_message?: string;
  total_files: number;
  total_chunks: number;
  total_lines: number;
  languages: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  language?: string;
  children?: FileTreeNode[];
}

export interface FileContent {
  path: string;
  name: string;
  language: string;
  size: number;
  lines: number;
  content: string;
}

export interface Citation {
  file_path: string;
  start_line: number;
  end_line: number;
  symbol_name?: string;
  symbol_type?: string;
  code_snippet?: string;
  score?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  created_at: string;
}

export interface Conversation {
  id: string;
  repository_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export interface ArchitectureNode {
  id: string;
  label: string;
  category: string;
  description?: string;
  files: string[];
}

export interface ArchitectureEdge {
  source: string;
  target: string;
  relation: string;
}

export interface ArchitectureOverview {
  overview: string;
  modules: Array<{
    name: string;
    category: string;
    description: string;
    key_files: string[];
  }>;
  entry_points: Array<{
    name: string;
    file_path: string;
    description: string;
  }>;
  relationships: Array<{
    from: string;
    to: string;
    type: string;
  }>;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  mermaid_diagram: string;
}

export interface BugFinding {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: "security" | "error_handling" | "performance" | "code_smell" | "null_safety";
  file_path: string;
  start_line: number;
  end_line: number;
  code_evidence: string;
  description: string;
  suggested_fix: string;
}

export interface BugAnalysisResult {
  repository_id: string;
  total_findings: number;
  summary: string;
  findings: BugFinding[];
}

export interface TestGenerationResult {
  file_path: string;
  framework: string;
  test_code: string;
  instructions: string;
  coverage_notes: string[];
}
