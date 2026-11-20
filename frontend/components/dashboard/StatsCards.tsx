import React from "react";
import { Repository } from "@/lib/types";
import { FileCode, Layers, FileText, Cpu, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

interface StatsCardsProps {
  repo: Repository;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ repo }) => {
  const cards = [
    {
      label: "Indexed Files",
      value: (repo?.total_files ?? 0).toLocaleString(),
      subtext: "Parsed source files",
      icon: FileCode,
      color: "text-amber-700 bg-amber-50 border-amber-200"
    },
    {
      label: "Vector Chunks",
      value: (repo?.total_chunks ?? 0).toLocaleString(),
      subtext: "Semantic embeddings in Chroma",
      icon: Layers,
      color: "text-indigo-700 bg-indigo-50 border-indigo-200"
    },
    {
      label: "Lines of Code",
      value: (repo?.total_lines ?? 0).toLocaleString(),
      subtext: "Across tracked languages",
      icon: FileText,
      color: "text-emerald-700 bg-emerald-50 border-emerald-200"
    },
    {
      label: "Index Status",
      value: (repo?.status ?? "ready").toUpperCase(),
      subtext: repo.status === "completed" ? "Ready for queries" : "In progress",
      icon: repo.status === "completed" ? CheckCircle2 : Cpu,
      color: repo.status === "completed" 
        ? "text-emerald-700 bg-emerald-50 border-emerald-200" 
        : "text-amber-700 bg-amber-50 border-amber-200"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#76736A] uppercase tracking-wider">
                {c.label}
              </span>
              <div className={`p-2 rounded-xl border ${c.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#292824] tracking-tight">{c.value}</p>
            <p className="text-xs text-[#76736A] mt-1">{c.subtext}</p>
          </div>
        );
      })}
    </div>
  );
};
