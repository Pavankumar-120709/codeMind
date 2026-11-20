import React from "react";
import { Repository } from "@/lib/types";
import {
  Code2, GitBranch, Sparkles, FolderGit2, CheckCircle2,
  Clock, AlertCircle, RefreshCw
} from "lucide-react";

interface HeaderProps {
  currentRepo: Repository | null;
  onOpenImport: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRepo,
  onOpenImport,
  activeTab,
  setActiveTab,
  onRefresh,
  isRefreshing
}) => {
  const tabs = [
    { id: "dashboard", label: "Overview" },
    { id: "chat", label: "AI Chat & RAG" },
    { id: "explorer", label: "Code Explorer" },
    { id: "architecture", label: "Architecture" },
    { id: "bugs", label: "Bug Detection" },
    { id: "tests", label: "Test Generator" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Indexed
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <Clock className="w-3 h-3 text-amber-600" />
            Indexing...
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
            Pending
          </span>
        );
    }
  };

  return (
    <header className="border-b border-[#E5E1D8] bg-[#FBF9F5]/90 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Brand & Active Repo */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#C66B48] flex items-center justify-center text-white shadow-sm shadow-[#C66B48]/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-base text-[#292824] tracking-tight">CodeMind</h1>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FAF1EC] text-[#C66B48] border border-[#F3D7CC] font-medium">
                  AGENT
                </span>
              </div>
              <p className="text-xs text-[#76736A]">AI Codebase Understanding</p>
            </div>
          </div>

          {currentRepo && (
            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-[#E5E1D8]">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-[#76736A]" />
                <span className="text-sm font-medium text-[#292824] max-w-[200px] truncate">
                  {currentRepo.name}
                </span>
              </div>
              {getStatusBadge(currentRepo.status)}
            </div>
          )}
        </div>

        {/* Center: Navigation Tabs */}
        {currentRepo && (
          <nav className="hidden lg:flex items-center gap-1 bg-[#F0ECE1]/60 p-1 rounded-xl border border-[#E5E1D8]">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    active
                      ? "bg-white text-[#292824] shadow-sm font-semibold"
                      : "text-[#6B6860] hover:text-[#292824] hover:bg-white/50"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {currentRepo && (
            <button
              onClick={onRefresh}
              title="Refresh repository status"
              disabled={isRefreshing}
              className="p-2 rounded-lg border border-[#E5E1D8] text-[#76736A] hover:text-[#292824] hover:bg-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          )}

          <button
            onClick={onOpenImport}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-[#C66B48] hover:bg-[#B35B39] rounded-xl shadow-sm transition-all"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Import Repo</span>
          </button>
        </div>
      </div>

      {/* Mobile navigation row */}
      {currentRepo && (
        <div className="flex lg:hidden overflow-x-auto gap-1 pt-3 mt-2 border-t border-[#EFECE6]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-[#C66B48] text-white"
                  : "text-[#6B6860] bg-white/70 hover:bg-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
