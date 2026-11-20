import React from "react";
import { Repository } from "@/lib/types";
import { StatsCards } from "./StatsCards";
import { LanguageDistribution } from "./LanguageDistribution";
import {
  Sparkles, MessageSquare, Compass, ShieldAlert,
  TestTube2, ArrowRight, ExternalLink, GitFork, BookOpen
} from "lucide-react";

interface RepoDashboardProps {
  repo: Repository;
  onNavigateTab: (tab: string) => void;
}

export const RepoDashboard: React.FC<RepoDashboardProps> = ({ repo, onNavigateTab }) => {
  const quickActions = [
    {
      title: "Ask Codebase Questions",
      description: "Perform grounded RAG search to inspect authentication, state, and API routes.",
      tab: "chat",
      icon: MessageSquare,
      accent: "text-amber-800 bg-amber-50 hover:bg-amber-100"
    },
    {
      title: "Explore Architecture",
      description: "Interactive dependency graph, module boundaries, and entry-point flows.",
      tab: "architecture",
      icon: Compass,
      accent: "text-indigo-800 bg-indigo-50 hover:bg-indigo-100"
    },
    {
      title: "Scan for Bugs & Code Smells",
      description: "Automated analysis of potential exceptions, security risks, and unhandled errors.",
      tab: "bugs",
      icon: ShieldAlert,
      accent: "text-rose-800 bg-rose-50 hover:bg-rose-100"
    },
    {
      title: "Generate Unit Tests",
      description: "Create unit test suites for functions, classes, or entire modules.",
      tab: "tests",
      icon: TestTube2,
      accent: "text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Banner */}
      <div className="p-7 rounded-3xl bg-gradient-to-br from-[#FAF1EC] via-white to-[#FBF9F5] border border-[#E5E1D8] shadow-sm relative overflow-hidden">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#C66B48]/10 text-[#C66B48] border border-[#C66B48]/20">
              {repo.source_type.toUpperCase()} REPOSITORY
            </span>
            {repo.source_url && (
              <a
                href={repo.source_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#76736A] hover:text-[#C66B48] flex items-center gap-1 transition-colors"
              >
                <span>View on GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <h2 className="text-2xl font-bold text-[#292824] tracking-tight">{repo.name}</h2>
          <p className="text-sm text-[#6B6860] mt-1.5 leading-relaxed">
            {repo.status_message || "Codebase indexed and ready for semantic exploration, architecture analysis, and question answering."}
          </p>

          <div className="flex flex-wrap gap-3 mt-5">
            <button
              onClick={() => onNavigateTab("chat")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white bg-[#C66B48] hover:bg-[#B35B39] transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI about this codebase</span>
            </button>
            <button
              onClick={() => onNavigateTab("explorer")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-[#292824] bg-white border border-[#D6D0C4] hover:bg-[#F3EFE6] transition-all shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#76736A]" />
              <span>Browse Source Code</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Stat Cards */}
      <StatsCards repo={repo} />

      {/* Middle row: Language breakdown & Quick Action cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <LanguageDistribution languages={repo.languages} />
        </div>

        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-semibold text-[#292824] px-1">Capabilities</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map((qa, i) => {
              const Icon = qa.icon;
              return (
                <div
                  key={i}
                  onClick={() => onNavigateTab(qa.tab)}
                  className="p-4 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm hover:border-[#C66B48]/50 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-xl ${qa.accent}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#A09C92] group-hover:text-[#C66B48] group-hover:translate-x-1 transition-all" />
                    </div>
                    <h4 className="text-xs font-semibold text-[#292824] group-hover:text-[#C66B48] transition-colors">
                      {qa.title}
                    </h4>
                    <p className="text-[11px] text-[#76736A] mt-1 line-clamp-2">
                      {qa.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
