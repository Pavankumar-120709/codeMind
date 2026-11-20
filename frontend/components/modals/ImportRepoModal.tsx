import React, { useState } from "react";
import { importGitHubRepo, uploadZipRepo } from "@/lib/api";
import { Repository } from "@/lib/types";
import {
  X, Github, UploadCloud, Check, AlertCircle, Loader2,
  FolderArchive, Link2
} from "lucide-react";

interface ImportRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (repo: Repository) => void;
}

export const ImportRepoModal: React.FC<ImportRepoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<"github" | "zip">("github");
  const [githubUrl, setGithubUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGitHubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const repo = await importGitHubRepo(githubUrl.trim());
      onSuccess(repo);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to clone repository.");
    } finally {
      setLoading(false);
    }
  };

  const handleZipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setLoading(true);
    setError(null);

    try {
      const repo = await uploadZipRepo(selectedFile);
      onSuccess(repo);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to upload and extract ZIP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-[#FBF9F5] rounded-2xl border border-[#E5E1D8] shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EFECE6] bg-white">
          <div>
            <h3 className="text-base font-semibold text-[#292824]">Import Repository</h3>
            <p className="text-xs text-[#76736A]">Connect a public GitHub repo or upload a project ZIP</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#76736A] hover:bg-[#F0ECE1] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 p-1.5 mx-6 mt-5 bg-[#F0ECE1]/70 rounded-xl border border-[#E5E1D8]">
          <button
            type="button"
            onClick={() => { setActiveTab("github"); setError(null); }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === "github"
                ? "bg-white text-[#292824] shadow-sm font-semibold"
                : "text-[#6B6860] hover:text-[#292824]"
            }`}
          >
            <Github className="w-4 h-4" />
            GitHub URL
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("zip"); setError(null); }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === "zip"
                ? "bg-white text-[#292824] shadow-sm font-semibold"
                : "text-[#6B6860] hover:text-[#292824]"
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Upload ZIP
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {activeTab === "github" ? (
            <form onSubmit={handleGitHubSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#292824] mb-1.5">
                  Public GitHub Repository URL
                </label>
                <div className="relative">
                  <Link2 className="w-4 h-4 text-[#A09C92] absolute left-3 top-3" />
                  <input
                    type="url"
                    placeholder="https://github.com/pallets/flask"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#D6D0C4] bg-white text-xs text-[#292824] focus:outline-none focus:ring-2 focus:ring-[#C66B48]/30 focus:border-[#C66B48]"
                  />
                </div>
                <p className="text-[11px] text-[#76736A] mt-1.5">
                  CodeMind performs shallow clone and safely parses source files.
                </p>
              </div>

              {/* Sample suggested repositories */}
              <div>
                <span className="text-[11px] text-[#76736A] font-medium">Popular quick-test repositories:</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {[
                    "https://github.com/tiangolo/fastapi",
                    "https://github.com/pallets/flask",
                    "https://github.com/expressjs/express"
                  ].map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setGithubUrl(url)}
                      className="text-[10px] bg-white border border-[#E5E1D8] px-2 py-1 rounded-md text-[#6B6860] hover:text-[#C66B48] hover:border-[#C66B48] transition-colors"
                    >
                      {url.replace("https://github.com/", "")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#6B6860] hover:bg-[#EFECE6] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !githubUrl.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white bg-[#C66B48] hover:bg-[#B35B39] disabled:opacity-50 transition-all shadow-sm"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{loading ? "Cloning & Indexing..." : "Import & Index"}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleZipSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#292824] mb-1.5">
                  Select ZIP Archive
                </label>
                <div className="border-2 border-dashed border-[#D6D0C4] rounded-2xl p-6 text-center hover:bg-white transition-colors cursor-pointer relative bg-white/50">
                  <input
                    type="file"
                    accept=".zip"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <FolderArchive className="w-8 h-8 text-[#C66B48] mx-auto mb-2" />
                  {selectedFile ? (
                    <div>
                      <p className="text-xs font-medium text-[#292824]">{selectedFile.name}</p>
                      <p className="text-[11px] text-[#76736A]">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-medium text-[#292824]">Click or drag & drop project ZIP</p>
                      <p className="text-[11px] text-[#76736A] mt-1">Maximum size: 100 MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#6B6860] hover:bg-[#EFECE6] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedFile}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white bg-[#C66B48] hover:bg-[#B35B39] disabled:opacity-50 transition-all shadow-sm"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{loading ? "Extracting & Indexing..." : "Upload & Index"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
