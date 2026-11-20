import {
  Repository, FileTreeNode, FileContent, Conversation,
  ArchitectureOverview, BugAnalysisResult, TestGenerationResult
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}

export async function fetchRepositories(): Promise<Repository[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${API_BASE}/api/repositories`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    clearTimeout(timeoutId);
    console.warn("fetchRepositories failed or timed out:", e);
    return [];
  }
}

export async function fetchRepository(id: string): Promise<Repository> {
  const res = await fetch(`${API_BASE}/api/repositories/${id}`);
  if (!res.ok) throw new Error("Failed to fetch repository details");
  return res.json();
}

export async function importGitHubRepo(githubUrl: string): Promise<Repository> {
  const res = await fetch(`${API_BASE}/api/repositories/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ github_url: githubUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to import GitHub repository");
  }
  return res.json();
}

export async function uploadZipRepo(file: File): Promise<Repository> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/repositories/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to upload repository ZIP");
  }
  return res.json();
}

export async function fetchRepositoryTree(id: string): Promise<FileTreeNode[]> {
  const res = await fetch(`${API_BASE}/api/repositories/${id}/tree`);
  if (!res.ok) throw new Error("Failed to fetch repository tree");
  return res.json();
}

export async function fetchRepositoryFile(id: string, path: string): Promise<FileContent> {
  const res = await fetch(`${API_BASE}/api/repositories/${id}/files?path=${encodeURIComponent(path)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to load file contents");
  }
  return res.json();
}

export async function fetchConversations(id: string): Promise<Conversation[]> {
  const res = await fetch(`${API_BASE}/api/repositories/${id}/conversations`);
  if (!res.ok) throw new Error("Failed to fetch conversations");
  return res.json();
}

export async function streamChat(
  id: string,
  message: string,
  conversationId?: string,
  fileFocus?: string,
  onMeta?: (meta: { conversation_id: string; citations: any[] }) => void,
  onToken?: (token: string) => void,
  onDone?: () => void,
  onError?: (err: string) => void
) {
  try {
    const res = await fetch(`${API_BASE}/api/repositories/${id}/chat?stream=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: conversationId,
        message,
        file_focus: fileFocus
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Chat request failed");
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response stream");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.type === "meta") {
            onMeta?.(parsed);
          } else if (parsed.type === "token") {
            onToken?.(parsed.token);
          } else if (parsed.type === "error") {
            onError?.(parsed.message);
          } else if (parsed.type === "done") {
            onDone?.();
          }
        } catch (e) {
          console.error("Stream parse error:", e);
        }
      }
    }
    onDone?.();
  } catch (error: any) {
    onError?.(error.message || "Failed to connect to chat stream");
  }
}

export async function fetchArchitecture(id: string, force: boolean = false): Promise<ArchitectureOverview> {
  const res = await fetch(`${API_BASE}/api/repositories/${id}/architecture${force ? "?force=true" : ""}`);
  if (!res.ok) throw new Error("Failed to fetch architecture overview");
  return res.json();
}

export async function runBugAnalysis(id: string, filePath?: string): Promise<BugAnalysisResult> {
  const res = await fetch(`${API_BASE}/api/repositories/${id}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_path: filePath || null }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to run bug analysis");
  }
  return res.json();
}

export async function generateTests(
  id: string,
  filePath: string,
  targetSymbol?: string,
  framework?: string
): Promise<TestGenerationResult> {
  const res = await fetch(`${API_BASE}/api/repositories/${id}/generate-tests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file_path: filePath,
      target_symbol: targetSymbol || null,
      framework: framework || null,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate tests");
  }
  return res.json();
}
