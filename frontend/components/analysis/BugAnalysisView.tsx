import React, { useState, useEffect } from "react";
import { Repository, BugAnalysisResult, BugFinding } from "@/lib/types";
import { runBugAnalysis } from "@/lib/api";
import {
  ShieldAlert, AlertTriangle, AlertCircle, Info, CheckCircle2,
  RefreshCw, Loader2, ArrowRight, FileCode2, ExternalLink
} from "lucide-react";

interface BugAnalysisViewProps {
  repo: Repository;
  initialFilePath?: string;
  onOpenFileInExplorer?: (path: string) => void;
}

const SEVERITY_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: "bg-rose-100", text: "text-rose-800", border: "border-rose-300" },
  high: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300" },
  medium: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300" },
  low: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
  info: { bg: "bg-stone-100", text: "text-stone-800", border: "border-stone-300" },
};

export const BugAnalysisView: React.FC<BugAnalysisViewProps> = ({
  repo,
  initialFilePath,
  onOpenFileInExplorer,
}) => {
  const [result, setResult] = useState<BugAnalysisResult | null>(null);
  const [targetFile, setTargetFile] = useState<string>(initialFilePath || "");
  const [loading, setLoading] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  const runScan = async (fileToScan?: string) => {
    setLoading(true);
    try {
      const data = await runBugAnalysis(repo.id, fileToScan || undefined);
      setResult(data);
    } catch (err) {
      console.error("Bug analysis failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runScan(initialFilePath);
  }, [repo.id, initialFilePath]);

  const filteredFindings = result?.findings.filter((f) => {
    if (filterSeverity === "all") return true;
    return f.severity.toLowerCase() === filterSeverity.toLowerCase();
  }) || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Scan Control Header */}
      <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-[#C66B48]" />
            <h3 className="text-base font-semibold text-[#292824]">
              Automated Code Quality & Bug Detection
            </h3>
          </div>
          <p className="text-xs text-[#76736A] max-w-xl leading-relaxed">
            AI-driven static inspection for missing error handling, resource leaks, null pointer risks, and code smells.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter by file path (optional)..."
            value={targetFile}
            onChange={(e) => setTargetFile(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#D6D0C4] text-xs bg-[#FBF9F5] focus:outline-none focus:ring-1 focus:ring-[#C66B48] w-56"
          />
          <button
            onClick={() => runScan(targetFile)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white bg-[#C66B48] hover:bg-[#B35B39] disabled:opacity-50 transition-all shadow-sm"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>{loading ? "Scanning..." : "Run Inspection"}</span>
          </button>
        </div>
      </div>

      {loading && !result ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 text-[#C66B48] animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium text-[#292824]">Analyzing source files and potential edge cases...</p>
        </div>
      ) : result ? (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="p-5 rounded-2xl bg-[#FBF9F5] border border-[#E5E1D8] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white border border-[#E5E1D8]">
                <p className="text-xl font-bold text-[#292824]">{result.total_findings}</p>
                <p className="text-[10px] uppercase font-semibold text-[#76736A]">Total Flags</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#292824]">{result.summary}</p>
                <p className="text-[11px] text-[#76736A] mt-0.5">
                  Flags represent potential risks for review; unverified issues are not assumed to be definitely exploitable.
                </p>
              </div>
            </div>

            {/* Severity Filter Tabs */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E5E1D8]">
              {["all", "critical", "high", "medium", "low"].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] capitalize font-medium transition-colors ${
                    filterSeverity === sev
                      ? "bg-[#FAF1EC] text-[#C66B48] font-bold"
                      : "text-[#6B6860] hover:text-[#292824]"
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Findings List */}
          {filteredFindings.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-2xl border border-[#E5E1D8]">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-xs font-medium text-[#292824]">No issues matching selected filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFindings.map((finding) => {
                const badge = SEVERITY_BADGES[finding.severity.toLowerCase()] || SEVERITY_BADGES.info;
                return (
                  <div
                    key={finding.id}
                    className="p-5 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {finding.severity}
                          </span>
                          <span className="text-[10px] font-mono uppercase text-[#76736A] bg-[#F7F5F0] px-2 py-0.5 rounded border border-[#E5E1D8]">
                            {finding.category}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-[#292824]">{finding.title}</h4>
                      </div>

                      {onOpenFileInExplorer && (
                        <button
                          onClick={() => onOpenFileInExplorer(finding.file_path)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C66B48] hover:underline"
                        >
                          <span>{finding.file_path}:{finding.start_line}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-[#4E4B43] leading-relaxed">{finding.description}</p>

                    {/* Code Evidence snippet */}
                    {finding.code_evidence && (
                      <div className="rounded-xl bg-[#1E1E1C] p-3 text-[11px] font-mono text-[#E8E6DF] overflow-x-auto">
                        <pre>{finding.code_evidence}</pre>
                      </div>
                    )}

                    {/* Suggested Fix */}
                    {finding.suggested_fix && (
                      <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900 space-y-1">
                        <p className="font-semibold text-[11px] text-emerald-800">Suggested Remediation:</p>
                        <p className="leading-relaxed font-sans text-[11px]">{finding.suggested_fix}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
