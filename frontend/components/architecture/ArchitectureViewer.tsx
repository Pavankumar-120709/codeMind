import React, { useState, useEffect } from "react";
import { Repository, ArchitectureOverview } from "@/lib/types";
import { fetchArchitecture } from "@/lib/api";
import { DependencyGraph } from "./DependencyGraph";
import {
  Compass, Layers, Workflow, FileCode, CheckCircle,
  Loader2, RefreshCw, Terminal, ArrowRight
} from "lucide-react";

interface ArchitectureViewerProps {
  repo: Repository;
}

export const ArchitectureViewer: React.FC<ArchitectureViewerProps> = ({ repo }) => {
  const [data, setData] = useState<ArchitectureOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadArchitecture = async (force: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchArchitecture(repo.id, force);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to analyze codebase architecture");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArchitecture(false);
  }, [repo.id]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-[#FAF1EC] border border-[#F3D7CC] flex items-center justify-center text-[#C66B48] mb-4 shadow-sm animate-pulse">
          <Compass className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-[#292824] mb-1">Synthesizing Architecture...</h3>
        <p className="text-xs text-[#76736A] leading-relaxed">
          Gemini is analyzing directory boundaries, imports, and execution entry points to map module relationships.
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <p className="text-xs text-rose-600 mb-4">{error || "No architecture data available"}</p>
        <button
          onClick={loadArchitecture}
          className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-[#C66B48] hover:bg-[#B35B39]"
        >
          Retry Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Overview Banner */}
      <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#292824] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#C66B48]" />
            Project Architectural Overview
          </h3>
          <button
            onClick={() => loadArchitecture(true)}
            className="p-1.5 rounded-lg border border-[#E5E1D8] text-[#76736A] hover:text-[#292824] hover:bg-[#F3EFE6] transition-colors"
            title="Re-run architecture analysis"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-xs text-[#4E4B43] leading-relaxed whitespace-pre-wrap">
          {data.overview}
        </p>
      </div>

      {/* Interactive Dependency Graph */}
      <DependencyGraph
        nodes={data.nodes}
        edges={data.edges}
      />

      {/* Entry points & key modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Entry points */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm space-y-3">
          <h4 className="text-xs font-semibold text-[#292824] uppercase tracking-wider flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#C66B48]" />
            Primary Entry Points ({data.entry_points.length})
          </h4>
          <div className="space-y-2">
            {data.entry_points.map((ep, i) => (
              <div key={i} className="p-3 rounded-xl bg-[#FBF9F5] border border-[#E5E1D8] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#292824]">{ep.name}</span>
                  <span className="text-[10px] font-mono text-[#76736A] bg-white px-2 py-0.5 rounded border border-[#E5E1D8]">
                    {ep.file_path}
                  </span>
                </div>
                <p className="text-[11px] text-[#6B6860]">{ep.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Modules breakdown */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm space-y-3">
          <h4 className="text-xs font-semibold text-[#292824] uppercase tracking-wider flex items-center gap-2">
            <Workflow className="w-4 h-4 text-[#C66B48]" />
            Detected Modules ({data.modules.length})
          </h4>
          <div className="space-y-2">
            {data.modules.map((m, i) => (
              <div key={i} className="p-3 rounded-xl bg-[#FBF9F5] border border-[#E5E1D8] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#292824]">{m.name}</span>
                  <span className="text-[10px] font-mono capitalize px-2 py-0.5 rounded bg-[#FAF1EC] text-[#C66B48] border border-[#F3D7CC]">
                    {m.category}
                  </span>
                </div>
                <p className="text-[11px] text-[#6B6860]">{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mermaid raw diagram if available */}
      {data.mermaid_diagram && (
        <div className="p-5 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm space-y-2">
          <h4 className="text-xs font-semibold text-[#292824] uppercase tracking-wider">
            Mermaid Architectural Definition
          </h4>
          <pre className="p-4 rounded-xl bg-[#1E1E1C] text-[#E8E6DF] font-mono text-xs overflow-x-auto leading-relaxed">
            {data.mermaid_diagram}
          </pre>
        </div>
      )}
    </div>
  );
};
