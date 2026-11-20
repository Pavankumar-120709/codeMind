"use client";

import React, { useState, useEffect } from "react";
import { Repository, Conversation } from "@/lib/types";
import { fetchRepositories, fetchConversations, fetchRepository } from "@/lib/api";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { RepoDashboard } from "@/components/dashboard/RepoDashboard";
import { ChatWorkspace } from "@/components/chat/ChatWorkspace";
import { CodeExplorer } from "@/components/code-explorer/CodeExplorer";
import { ArchitectureViewer } from "@/components/architecture/ArchitectureViewer";
import { BugAnalysisView } from "@/components/analysis/BugAnalysisView";
import { TestGeneratorView } from "@/components/analysis/TestGeneratorView";
import { ImportRepoModal } from "@/components/modals/ImportRepoModal";
import { Sparkles, Loader2 } from "lucide-react";

export default function Home() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [currentRepo, setCurrentRepo] = useState<Repository | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [targetedFilePath, setTargetedFilePath] = useState<string | undefined>();

  // Load repositories on mount
  const loadRepos = async () => {
    try {
      const list = await fetchRepositories();
      setRepositories(list);
      if (list.length > 0 && !currentRepo) {
        setCurrentRepo(list[0]);
      }
    } catch (err) {
      console.error("Failed to load repositories:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRepos();
  }, []);

  // Load conversations when currentRepo changes
  const loadConversations = async (repoId: string) => {
    try {
      const convs = await fetchConversations(repoId);
      setConversations(convs);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  };

  useEffect(() => {
    if (currentRepo) {
      loadConversations(currentRepo.id);
      setActiveConversationId(undefined);
    }
  }, [currentRepo?.id]);

  const handleRefresh = async () => {
    if (!currentRepo) return;
    setIsRefreshing(true);
    try {
      const updated = await fetchRepository(currentRepo.id);
      setCurrentRepo(updated);
      setRepositories((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      await loadConversations(updated.id);
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSelectRepo = (repo: Repository) => {
    setCurrentRepo(repo);
    setActiveTab("dashboard");
    setActiveConversationId(undefined);
    setTargetedFilePath(undefined);
  };

  const handleOpenFileInExplorer = (filePath: string) => {
    setTargetedFilePath(filePath);
    setActiveTab("explorer");
  };

  const handleAskAboutFile = (filePath: string) => {
    setTargetedFilePath(filePath);
    setActiveTab("chat");
  };

  const handleAnalyzeBugsForFile = (filePath: string) => {
    setTargetedFilePath(filePath);
    setActiveTab("bugs");
  };

  const handleGenerateTestsForFile = (filePath: string) => {
    setTargetedFilePath(filePath);
    setActiveTab("tests");
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F7F5F0]">
        <div className="w-12 h-12 rounded-2xl bg-[#C66B48] flex items-center justify-center text-white mb-3 shadow-md animate-pulse">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-xs font-semibold text-[#292824]">Initializing CodeMind...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col">
      <Header
        currentRepo={currentRepo}
        onOpenImport={() => setIsImportOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          repositories={repositories}
          currentRepo={currentRepo}
          onSelectRepo={handleSelectRepo}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={(id) => {
            setActiveConversationId(id);
            setActiveTab("chat");
          }}
          onNewConversation={() => {
            setActiveConversationId(undefined);
            setActiveTab("chat");
          }}
          onOpenImport={() => setIsImportOpen(true)}
        />

        {/* Main Workspace Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F7F5F0]">
          {!currentRepo ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-3xl bg-white border border-[#E5E1D8] flex items-center justify-center text-[#C66B48] mb-4 shadow-sm">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-[#292824] mb-1">No Repository Selected</h2>
              <p className="text-xs text-[#76736A] mb-5 leading-relaxed">
                Import a public GitHub repository or project ZIP archive to start exploring with CodeMind.
              </p>
              <button
                onClick={() => setIsImportOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#C66B48] hover:bg-[#B35B39] text-white text-xs font-medium shadow-sm transition-all"
              >
                Import Repository
              </button>
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && (
                <RepoDashboard
                  repo={currentRepo}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === "chat" && (
                <ChatWorkspace
                  repo={currentRepo}
                  conversations={conversations}
                  activeConversationId={activeConversationId}
                  onConversationCreated={(id) => {
                    setActiveConversationId(id);
                    loadConversations(currentRepo.id);
                  }}
                  onOpenFileInExplorer={handleOpenFileInExplorer}
                />
              )}

              {activeTab === "explorer" && (
                <CodeExplorer
                  repo={currentRepo}
                  initialFilePath={targetedFilePath}
                  onAskAboutFile={handleAskAboutFile}
                  onAnalyzeBugs={handleAnalyzeBugsForFile}
                  onGenerateTests={handleGenerateTestsForFile}
                />
              )}

              {activeTab === "architecture" && (
                <ArchitectureViewer repo={currentRepo} />
              )}

              {activeTab === "bugs" && (
                <BugAnalysisView
                  repo={currentRepo}
                  initialFilePath={targetedFilePath}
                  onOpenFileInExplorer={handleOpenFileInExplorer}
                />
              )}

              {activeTab === "tests" && (
                <TestGeneratorView
                  repo={currentRepo}
                  initialFilePath={targetedFilePath}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Import Modal */}
      <ImportRepoModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={(newRepo) => {
          setRepositories((prev) => [newRepo, ...prev]);
          setCurrentRepo(newRepo);
          setActiveTab("dashboard");
        }}
      />
    </div>
  );
}
