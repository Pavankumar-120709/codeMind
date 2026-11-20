import React from "react";
import { FileContent } from "@/lib/types";
import { Copy, Check, FileCode2, Sparkles, TestTube2, ShieldAlert } from "lucide-react";

interface CodeViewerProps {
  file: FileContent | null;
  onAskAboutFile?: (filePath: string) => void;
  onAnalyzeBugs?: (filePath: string) => void;
  onGenerateTests?: (filePath: string) => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  file,
  onAskAboutFile,
  onAnalyzeBugs,
  onGenerateTests,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center bg-[#F7F5F0] text-center p-6">
        <div>
          <FileCode2 className="w-10 h-10 text-[#A09C92] mx-auto mb-2 opacity-60" />
          <p className="text-xs font-medium text-[#76736A]">Select a file from the left to inspect its code</p>
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = file.content.split("\n");

  return (
    <div className="flex flex-col h-full bg-[#181816] text-[#E8E6DF] overflow-hidden">
      {/* File Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#20201D] border-b border-[#2E2E2A]">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode2 className="w-4 h-4 text-[#C66B48] shrink-0" />
          <span className="font-mono text-xs font-medium text-[#F7F5F0] truncate">
            {file.path}
          </span>
          <span className="text-[10px] text-[#A09C92] uppercase bg-[#2C2C28] px-2 py-0.5 rounded font-mono">
            {file.language} • {file.lines} lines
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onAskAboutFile && (
            <button
              onClick={() => onAskAboutFile(file.path)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-[#FAF1EC] bg-[#C66B48] hover:bg-[#B35B39] flex items-center gap-1 transition-colors"
              title="Ask AI questions focused on this file"
            >
              <Sparkles className="w-3 h-3" />
              <span>Ask AI</span>
            </button>
          )}

          {onAnalyzeBugs && (
            <button
              onClick={() => onAnalyzeBugs(file.path)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-rose-300 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/50 flex items-center gap-1 transition-colors"
              title="Scan this file for bugs"
            >
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              <span>Bugs</span>
            </button>
          )}

          {onGenerateTests && (
            <button
              onClick={() => onGenerateTests(file.path)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/50 flex items-center gap-1 transition-colors"
              title="Generate unit tests for this file"
            >
              <TestTube2 className="w-3 h-3 text-emerald-400" />
              <span>Tests</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-[#A09C92] hover:text-[#F7F5F0] hover:bg-[#2C2C28] transition-colors"
            title="Copy file contents"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Code Area with Line Numbers */}
      <div className="flex-1 overflow-auto font-mono text-xs leading-6 p-4">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-[#22221F] transition-colors">
                <td className="w-12 text-right pr-4 select-none text-[#5A5952] font-mono text-[11px] align-top">
                  {idx + 1}
                </td>
                <td className="whitespace-pre font-mono text-[#E8E6DF] align-top break-all">
                  {line || " "}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
