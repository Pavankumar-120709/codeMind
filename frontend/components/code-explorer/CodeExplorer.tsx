import React, { useState, useEffect } from "react";
import { Repository, FileTreeNode, FileContent } from "@/lib/types";
import { fetchRepositoryTree, fetchRepositoryFile } from "@/lib/api";
import { FileTree } from "./FileTree";
import { CodeViewer } from "./CodeViewer";
import { Loader2 } from "lucide-react";

interface CodeExplorerProps {
  repo: Repository;
  initialFilePath?: string;
  onAskAboutFile?: (filePath: string) => void;
  onAnalyzeBugs?: (filePath: string) => void;
  onGenerateTests?: (filePath: string) => void;
}

export const CodeExplorer: React.FC<CodeExplorerProps> = ({
  repo,
  initialFilePath,
  onAskAboutFile,
  onAnalyzeBugs,
  onGenerateTests,
}) => {
  const [tree, setTree] = useState<FileTreeNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | undefined>(initialFilePath);
  const [currentFile, setCurrentFile] = useState<FileContent | null>(null);
  const [loadingTree, setLoadingTree] = useState(true);
  const [loadingFile, setLoadingFile] = useState(false);

  useEffect(() => {
    const loadTree = async () => {
      setLoadingTree(true);
      try {
        const data = await fetchRepositoryTree(repo.id);
        setTree(data);
        if (!selectedPath && data.length > 0) {
          // Find first file in tree to preview
          const findFirstFile = (nodes: FileTreeNode[]): string | undefined => {
            for (const n of nodes) {
              if (n.type === "file") return n.path;
              if (n.children) {
                const found = findFirstFile(n.children);
                if (found) return found;
              }
            }
          };
          const first = findFirstFile(data);
          if (first) setSelectedPath(first);
        }
      } catch (err) {
        console.error("Failed to load repository tree:", err);
      } finally {
        setLoadingTree(false);
      }
    };
    loadTree();
  }, [repo.id]);

  useEffect(() => {
    if (!selectedPath) return;
    const loadFile = async () => {
      setLoadingFile(true);
      try {
        const fileData = await fetchRepositoryFile(repo.id, selectedPath);
        setCurrentFile(fileData);
      } catch (err) {
        console.error("Failed to load file contents:", err);
      } finally {
        setLoadingFile(false);
      }
    };
    loadFile();
  }, [repo.id, selectedPath]);

  return (
    <div className="flex h-full w-full bg-white border border-[#E5E1D8] rounded-2xl overflow-hidden shadow-sm">
      {/* Left File Tree */}
      <div className="w-72 md:w-80 h-full shrink-0">
        {loadingTree ? (
          <div className="h-full flex items-center justify-center p-6 text-xs text-[#76736A]">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading file tree...
          </div>
        ) : (
          <FileTree
            nodes={tree}
            selectedPath={selectedPath}
            onSelectFile={(path) => setSelectedPath(path)}
          />
        )}
      </div>

      {/* Right Code Viewer */}
      <div className="flex-1 h-full min-w-0">
        {loadingFile ? (
          <div className="h-full flex items-center justify-center bg-[#181816] text-[#A09C92] text-xs font-mono">
            <Loader2 className="w-4 h-4 animate-spin mr-2 text-[#C66B48]" />
            Loading code...
          </div>
        ) : (
          <CodeViewer
            file={currentFile}
            onAskAboutFile={onAskAboutFile}
            onAnalyzeBugs={onAnalyzeBugs}
            onGenerateTests={onGenerateTests}
          />
        )}
      </div>
    </div>
  );
};
