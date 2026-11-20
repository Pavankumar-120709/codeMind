import React, { useState } from "react";
import { FileTreeNode } from "@/lib/types";
import {
  Folder, FolderOpen, FileCode, ChevronRight, ChevronDown,
  Search, FileText
} from "lucide-react";

interface FileTreeProps {
  nodes: FileTreeNode[];
  selectedPath?: string;
  onSelectFile: (path: string) => void;
}

const FileTreeNodeItem: React.FC<{
  node: FileTreeNode;
  selectedPath?: string;
  onSelectFile: (path: string) => void;
  level: number;
}> = ({ node, selectedPath, onSelectFile, level }) => {
  const [isOpen, setIsOpen] = useState(true);
  const isDir = node.type === "directory";
  const isSelected = selectedPath === node.path;

  const handleClick = () => {
    if (isDir) {
      setIsOpen(!isOpen);
    } else {
      onSelectFile(node.path);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        style={{ paddingLeft: `${level * 14 + 10}px` }}
        className={`flex items-center gap-1.5 py-1.5 pr-2 rounded-lg cursor-pointer text-xs transition-colors select-none ${
          isSelected
            ? "bg-[#FAF1EC] text-[#C66B48] font-medium border border-[#F3D7CC]"
            : "text-[#4E4B43] hover:bg-[#F3EFE6] hover:text-[#292824]"
        }`}
      >
        {isDir ? (
          <>
            <span className="text-[#A09C92]">
              {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </span>
            {isOpen ? (
              <FolderOpen className="w-4 h-4 text-[#C66B48] shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-[#C66B48] shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-3.5" />
            <FileCode className="w-3.5 h-3.5 text-[#76736A] shrink-0" />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </div>

      {isDir && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNodeItem
              key={child.path}
              node={child}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTree: React.FC<FileTreeProps> = ({
  nodes,
  selectedPath,
  onSelectFile,
}) => {
  const [filter, setFilter] = useState("");

  const flattenFiles = (items: FileTreeNode[]): FileTreeNode[] => {
    let results: FileTreeNode[] = [];
    for (const item of items) {
      if (item.type === "file") results.push(item);
      if (item.children) results = results.concat(flattenFiles(item.children));
    }
    return results;
  };

  const filteredFlatFiles = filter.trim()
    ? flattenFiles(nodes).filter((f) =>
        f.path.toLowerCase().includes(filter.toLowerCase())
      )
    : null;

  return (
    <div className="flex flex-col h-full bg-[#FBF9F5] border-r border-[#E5E1D8]">
      {/* Search Input */}
      <div className="p-3 border-b border-[#EFECE6]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#A09C92] absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search files..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-[#D6D0C4] bg-white text-xs text-[#292824] placeholder:text-[#A09C92] focus:outline-none focus:ring-1 focus:ring-[#C66B48]"
          />
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {filteredFlatFiles ? (
          <div>
            <p className="text-[10px] uppercase font-semibold text-[#76736A] px-2 py-1">
              Search Results ({filteredFlatFiles.length})
            </p>
            {filteredFlatFiles.map((file) => (
              <div
                key={file.path}
                onClick={() => onSelectFile(file.path)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs transition-colors ${
                  selectedPath === file.path
                    ? "bg-[#FAF1EC] text-[#C66B48] font-medium border border-[#F3D7CC]"
                    : "text-[#4E4B43] hover:bg-[#F3EFE6]"
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-[#76736A] shrink-0" />
                <span className="truncate">{file.path}</span>
              </div>
            ))}
          </div>
        ) : (
          nodes.map((node) => (
            <FileTreeNodeItem
              key={node.path}
              node={node}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
              level={0}
            />
          ))
        )}
      </div>
    </div>
  );
};
