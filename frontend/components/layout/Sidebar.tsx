import React, { useState } from "react";
import { Repository, Conversation } from "@/lib/types";
import {
  FolderGit2, MessageSquare, ChevronLeft, ChevronRight,
  Plus, Github, UploadCloud, Database, Sparkles, FileCode2
} from "lucide-react";

interface SidebarProps {
  repositories: Repository[];
  currentRepo: Repository | null;
  onSelectRepo: (repo: Repository) => void;
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onOpenImport: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  repositories,
  currentRepo,
  onSelectRepo,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onOpenImport
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`border-r border-[#E5E1D8] bg-[#FBF9F5] flex flex-col transition-all duration-200 h-[calc(100vh-61px)] sticky top-[61px] ${
        collapsed ? "w-16" : "w-72"
      }`}
    >
      {/* Top Toggle */}
      <div className="flex items-center justify-between p-3 border-b border-[#EFECE6]">
        {!collapsed && (
          <span className="text-xs font-semibold text-[#76736A] uppercase tracking-wider">
            Workspace
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md text-[#76736A] hover:text-[#292824] hover:bg-[#EFECE6]/60 ml-auto transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Repositories section */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            {!collapsed && (
              <span className="text-xs font-medium text-[#76736A] flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5" />
                Repositories ({repositories.length})
              </span>
            )}
            <button
              onClick={onOpenImport}
              className="p-1 rounded hover:bg-[#EFECE6] text-[#76736A] hover:text-[#C66B48] transition-colors"
              title="Add Repository"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {repositories.map((repo) => {
              const active = currentRepo?.id === repo.id;
              return (
                <button
                  key={repo.id}
                  onClick={() => onSelectRepo(repo)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all ${
                    active
                      ? "bg-white text-[#292824] shadow-sm border border-[#E5E1D8] font-medium"
                      : "text-[#6B6860] hover:bg-[#F3EFE6] hover:text-[#292824]"
                  }`}
                  title={repo.name}
                >
                  <div className={`p-1.5 rounded-lg ${active ? "bg-[#FAF1EC] text-[#C66B48]" : "bg-[#EFECE6] text-[#76736A]"}`}>
                    {repo.source_type === "github" ? (
                      <Github className="w-3.5 h-3.5" />
                    ) : repo.source_type === "zip" ? (
                      <UploadCloud className="w-3.5 h-3.5" />
                    ) : (
                      <Database className="w-3.5 h-3.5" />
                    )}
                  </div>
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{repo.name}</p>
                      <p className="text-[10px] text-[#76736A] truncate">
                        {repo.total_files} files • {repo.status}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversations section */}
        {currentRepo && (
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              {!collapsed && (
                <span className="text-xs font-medium text-[#76736A] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Chat History
                </span>
              )}
              <button
                onClick={onNewConversation}
                className="p-1 rounded hover:bg-[#EFECE6] text-[#76736A] hover:text-[#C66B48] transition-colors"
                title="New Chat"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              <button
                onClick={onNewConversation}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#C66B48] bg-[#FAF1EC] hover:bg-[#F5E5DC] transition-colors mb-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {!collapsed && <span>Start New Chat</span>}
              </button>

              {conversations.length === 0 ? (
                !collapsed && (
                  <p className="text-[11px] text-[#A09C92] px-2 py-2 italic">
                    No recent chats yet
                  </p>
                )
              ) : (
                conversations.map((conv) => {
                  const active = activeConversationId === conv.id;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => onSelectConversation(conv.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition-colors ${
                        active
                          ? "bg-white text-[#292824] font-medium border border-[#E5E1D8] shadow-sm"
                          : "text-[#6B6860] hover:bg-[#F3EFE6]"
                      }`}
                      title={conv.title}
                    >
                      <MessageSquare className="w-3 h-3 text-[#A09C92] shrink-0" />
                      {!collapsed && (
                        <span className="truncate flex-1">{conv.title}</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-3 border-t border-[#EFECE6] bg-[#F7F5F0]/50 text-[11px] text-[#76736A] flex items-center justify-between">
          <span>Gemini 2.5 Flash</span>
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Local ChromaDB
          </span>
        </div>
      )}
    </aside>
  );
};
