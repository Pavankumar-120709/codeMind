import React, { useState } from "react";
import { ArchitectureNode, ArchitectureEdge } from "@/lib/types";
import { Compass, Box, ArrowRight, Layers, Database, Globe, Wrench } from "lucide-react";

interface DependencyGraphProps {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  onSelectNode?: (node: ArchitectureNode) => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; icon: any }> = {
  frontend: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: Globe },
  backend: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: Layers },
  database: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: Database },
  service: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", icon: Box },
  utility: { bg: "bg-stone-50", border: "border-stone-200", text: "text-stone-700", icon: Wrench },
};

export const DependencyGraph: React.FC<DependencyGraphProps> = ({
  nodes,
  edges,
  onSelectNode,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleNodeClick = (node: ArchitectureNode) => {
    setSelectedId(node.id);
    onSelectNode?.(node);
  };

  const getStyle = (cat: string) => {
    return CATEGORY_COLORS[cat.toLowerCase()] || CATEGORY_COLORS.service;
  };

  return (
    <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-[#292824] flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#C66B48]" />
            Interactive Module Dependency Graph
          </h4>
          <p className="text-xs text-[#76736A]">Click any architectural component to explore its files and connections</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px]">
          {Object.entries(CATEGORY_COLORS).map(([cat, style]) => (
            <div key={cat} className="flex items-center gap-1.5 capitalize">
              <span className={`w-2.5 h-2.5 rounded-full border ${style.border} ${style.bg}`} />
              <span className="text-[#6B6860]">{cat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Nodes Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {nodes.map((node) => {
          const style = getStyle(node.category);
          const Icon = style.icon;
          const isSelected = selectedId === node.id;

          // Find connected edges
          const outgoing = edges.filter((e) => e.source === node.id);
          const incoming = edges.filter((e) => e.target === node.id);

          return (
            <div
              key={node.id}
              onClick={() => handleNodeClick(node)}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                isSelected
                  ? "bg-[#FAF1EC] border-[#C66B48] shadow-md ring-2 ring-[#C66B48]/20"
                  : `${style.bg} ${style.border} hover:shadow-sm hover:scale-[1.01]`
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg bg-white ${style.text} shadow-xs`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-[#292824]">{node.label}</h5>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#76736A]">
                      {node.category}
                    </span>
                  </div>
                </div>
              </div>

              {node.description && (
                <p className="text-xs text-[#4E4B43] mt-2 line-clamp-2 leading-relaxed">
                  {node.description}
                </p>
              )}

              {/* Connected edges pill count */}
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#E5E1D8]/60 text-[10px] text-[#76736A]">
                <span>{incoming.length} incoming</span>
                <span>•</span>
                <span>{outgoing.length} outgoing</span>
                {node.files && node.files.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{node.files.length} files</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Relationships Table / Edge Flow */}
      {edges.length > 0 && (
        <div className="mt-6 pt-4 border-t border-[#EFECE6]">
          <h5 className="text-xs font-semibold text-[#292824] mb-3">Module Interactions & Data Flow</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {edges.map((edge, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#FBF9F5] border border-[#E5E1D8] text-xs"
              >
                <span className="font-medium text-[#292824]">{edge.source}</span>
                <span className="flex items-center gap-1 text-[11px] font-mono text-[#C66B48] px-2 py-0.5 rounded bg-white border border-[#E5E1D8]">
                  <span>{edge.relation}</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
                <span className="font-medium text-[#292824]">{edge.target}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
