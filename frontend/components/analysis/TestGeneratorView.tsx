import React, { useState } from "react";
import { Repository, TestGenerationResult } from "@/lib/types";
import { generateTests } from "@/lib/api";
import {
  TestTube2, Sparkles, Loader2, Download, Copy, Check,
  FileCode2, CheckCircle2, ArrowRight
} from "lucide-react";

interface TestGeneratorViewProps {
  repo: Repository;
  initialFilePath?: string;
}

export const TestGeneratorView: React.FC<TestGeneratorViewProps> = ({
  repo,
  initialFilePath,
}) => {
  const [filePath, setFilePath] = useState(initialFilePath || "src/auth/jwt.py");
  const [symbolName, setSymbolName] = useState("");
  const [framework, setFramework] = useState("auto");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestGenerationResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filePath.trim()) return;

    setLoading(true);
    try {
      const data = await generateTests(
        repo.id,
        filePath.trim(),
        symbolName.trim() || undefined,
        framework !== "auto" ? framework : undefined
      );
      setResult(data);
    } catch (err) {
      console.error("Test generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.test_code) return;
    navigator.clipboard.writeText(result.test_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result?.test_code) return;
    const blob = new Blob([result.test_code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `test_${filePath.split("/").pop() || "suite"}.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Top Config Form */}
      <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-semibold text-[#292824] flex items-center gap-2">
            <TestTube2 className="w-5 h-5 text-[#C66B48]" />
            Automated Unit Test Generator
          </h3>
          <p className="text-xs text-[#76736A] mt-1">
            Synthesize idiomatic unit tests with edge-cases, validation checks, and mocks.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[#292824] mb-1">Target File Path</label>
            <input
              type="text"
              placeholder="e.g. src/services/payment.py"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-[#D6D0C4] bg-[#FBF9F5] text-xs text-[#292824] focus:outline-none focus:ring-1 focus:ring-[#C66B48]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#292824] mb-1">Target Symbol (Optional)</label>
            <input
              type="text"
              placeholder="e.g. process_charge"
              value={symbolName}
              onChange={(e) => setSymbolName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D6D0C4] bg-[#FBF9F5] text-xs text-[#292824] focus:outline-none focus:ring-1 focus:ring-[#C66B48]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#292824] mb-1">Framework</label>
            <select
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D6D0C4] bg-[#FBF9F5] text-xs text-[#292824] focus:outline-none focus:ring-1 focus:ring-[#C66B48]"
            >
              <option value="auto">Auto-detect</option>
              <option value="pytest">pytest (Python)</option>
              <option value="unittest">unittest (Python)</option>
              <option value="jest">Jest (TS/JS)</option>
              <option value="vitest">Vitest (TS/JS)</option>
            </select>
          </div>

          <div className="md:col-span-4 flex justify-end pt-1">
            <button
              type="submit"
              disabled={loading || !filePath.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium text-white bg-[#C66B48] hover:bg-[#B35B39] disabled:opacity-50 transition-all shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{loading ? "Generating Tests..." : "Generate Test Suite"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Result Display */}
      {result && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Metadata & Instructions bar */}
          <div className="p-4 rounded-xl bg-white border border-[#E5E1D8] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
            <div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#FAF1EC] text-[#C66B48] border border-[#F3D7CC] font-bold">
                {result.framework}
              </span>
              <p className="text-xs text-[#4E4B43] mt-1 font-medium">{result.instructions}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg border border-[#E5E1D8] text-xs font-medium text-[#292824] hover:bg-[#F3EFE6] flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#76736A]" />}
                <span>{copied ? "Copied!" : "Copy Code"}</span>
              </button>
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-lg bg-[#FAF1EC] text-xs font-medium text-[#C66B48] border border-[#F3D7CC] hover:bg-[#F5E5DC] flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Test Code Viewer */}
          <div className="rounded-2xl border border-[#2E2E2A] bg-[#181816] overflow-hidden shadow-lg">
            <div className="px-4 py-2 bg-[#20201D] border-b border-[#2E2E2A] flex items-center justify-between">
              <span className="font-mono text-xs text-[#A09C92]">Generated Unit Test Code</span>
            </div>
            <pre className="p-5 font-mono text-xs text-[#E8E6DF] leading-6 overflow-x-auto">
              {result.test_code}
            </pre>
          </div>

          {/* Coverage Notes */}
          {result.coverage_notes && result.coverage_notes.length > 0 && (
            <div className="p-4 rounded-xl bg-white border border-[#E5E1D8] shadow-sm space-y-2">
              <h5 className="text-xs font-semibold text-[#292824] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Coverage Analysis
              </h5>
              <ul className="list-disc pl-5 text-xs text-[#4E4B43] space-y-1">
                {result.coverage_notes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
