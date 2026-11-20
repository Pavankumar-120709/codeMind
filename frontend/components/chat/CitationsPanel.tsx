import React from "react";
import { Citation } from "@/lib/types";
import { FileCode, X, ExternalLink, Bookmark } from "lucide-react";

interface CitationsPanelProps {
  citation: Citation | null;
  onClose: () => void;
  onOpenFileInExplorer?: (filePath: string) => void;
}

export const CitationsPanel: React.FC<CitationsPanelProps> = ({
  citation,
  onClose,
  onOpenFileInExplorer,
}) => {
  if (!citation) return null;

  return (
    <div className="w-80 md:w-96 border-l border-[#E5E1D8] bg-[#FBF9F5] flex flex-col h-full animate-in slide-in-from-right duration-200">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-[#EFECE6] flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-[#C66B48]" />
          <h4 className="text-xs font-semibold text-[#292824]">Retrieved Code Evidence</h4>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-[#76736A] hover:bg-[#EFECE6] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Metadata Overview */}
      <div className="p-4 space-y-3 flex-1 overflow-y-auto">
        <div className="p-3 bg-white rounded-xl border border-[#E5E1D8] space-y-1.5 shadow-sm">
          <p className="text-[10px] font-semibold text-[#76736A] uppercase">File</p>
          <p className="text-xs font-mono font-medium text-[#292824] break-all">
            {citation.file_path}
          </p>

          <div className="flex items-center justify-between pt-1 text-[11px] text-[#76736A]">
            <span>Lines: {citation.start_line} – {citation.end_line}</span>
            {citation.score !== undefined && (
              <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                match: {(citation.score * 100).toFixed(0)}%
              </span>
            )}
          </div>

          {citation.symbol_name && (
            <p className="text-[11px] text-[#C66B48] font-mono pt-1">
              {citation.symbol_type}: <span className="font-bold">{citation.symbol_name}</span>
            </p>
          )}

          {onOpenFileInExplorer && (
            <button
              onClick={() => onOpenFileInExplorer(citation.file_path)}
              className="mt-2 w-full py-1.5 px-2 bg-[#F7F5F0] hover:bg-[#EFECE6] text-xs font-medium text-[#292824] rounded-lg border border-[#E5E1D8] flex items-center justify-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#76736A]" />
              <span>View in Code Explorer</span>
            </button>
          )}
        </div>

        {/* Snippet Viewer */}
        <div>
          <p className="text-[10px] font-semibold text-[#76736A] uppercase mb-1.5">
            Indexed Chunk Content
          </p>
          <div className="rounded-xl border border-[#2E2E2A] bg-[#1E1E1C] p-3 overflow-x-auto text-stone-200 font-mono text-[11px] leading-relaxed shadow-inner">
            <pre>{citation.code_snippet || "No snippet available."}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
