import React, { useState, useRef, useEffect } from "react";
import { Repository, Conversation, Message, Citation } from "@/lib/types";
import { streamChat } from "@/lib/api";
import { ChatMessage } from "./ChatMessage";
import { CitationsPanel } from "./CitationsPanel";
import {
  Send, Sparkles, Loader2, RefreshCw, Compass,
  ShieldCheck, HelpCircle, FileCode2
} from "lucide-react";

interface ChatWorkspaceProps {
  repo: Repository;
  conversations: Conversation[];
  activeConversationId?: string;
  onConversationCreated: (convId: string) => void;
  onOpenFileInExplorer?: (path: string) => void;
}

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  repo,
  conversations,
  activeConversationId,
  onConversationCreated,
  onOpenFileInExplorer,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streamingToken, setStreamingToken] = useState("");
  const [activeCitations, setActiveCitations] = useState<Citation[]>([]);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync messages when activeConversationId changes
  useEffect(() => {
    if (activeConversationId) {
      const conv = conversations.find((c) => c.id === activeConversationId);
      if (conv) {
        setMessages(conv.messages || []);
      }
    } else {
      setMessages([]);
    }
  }, [activeConversationId, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingToken]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      conversation_id: activeConversationId || "",
      role: "user",
      content: text.trim(),
      citations: [],
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setStreamingToken("");
    setActiveCitations([]);

    let currentConversationId = activeConversationId;
    let accumulatedTokens = "";
    let fetchedCitations: Citation[] = [];

    await streamChat(
      repo.id,
      text.trim(),
      activeConversationId,
      undefined,
      (meta) => {
        if (meta.conversation_id && meta.conversation_id !== currentConversationId) {
          currentConversationId = meta.conversation_id;
          onConversationCreated(meta.conversation_id);
        }
        if (meta.citations) {
          fetchedCitations = meta.citations;
          setActiveCitations(meta.citations);
        }
      },
      (token) => {
        accumulatedTokens += token;
        setStreamingToken(accumulatedTokens);
      },
      () => {
        setIsLoading(false);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          conversation_id: currentConversationId || "",
          role: "assistant",
          content: accumulatedTokens || "No response received.",
          citations: fetchedCitations,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingToken("");
      },
      (err) => {
        setIsLoading(false);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          conversation_id: currentConversationId || "",
          role: "assistant",
          content: `⚠️ Error: ${err}`,
          citations: [],
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setStreamingToken("");
      }
    );
  };

  const sampleQuestions = [
    "Explain the overall architecture and main module boundaries.",
    "Where is authentication and request validation implemented?",
    "How does error handling and response serialization work?",
    "What are the primary entry points and startup lifecycle?"
  ];

  return (
    <div className="flex h-full w-full bg-[#F7F5F0]">
      {/* Main Chat Flow */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.length === 0 && !streamingToken && (
            <div className="h-full flex flex-col items-center justify-center max-w-xl mx-auto text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF1EC] border border-[#F3D7CC] flex items-center justify-center text-[#C66B48] mb-4 shadow-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#292824] mb-1">
                Ask CodeMind about {repo.name}
              </h3>
              <p className="text-xs text-[#76736A] max-w-md leading-relaxed mb-6">
                CodeMind uses persistent vector embeddings in ChromaDB to retrieve relevant functions and modules, providing strictly grounded answers citing exact line numbers.
              </p>

              {/* Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-left">
                {sampleQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="p-3 rounded-xl bg-white border border-[#E5E1D8] text-xs text-[#4E4B43] hover:text-[#C66B48] hover:border-[#C66B48]/40 hover:shadow-sm transition-all"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <ChatMessage
              key={m.id}
              message={m}
              onSelectCitation={(c) => setSelectedCitation(c)}
            />
          ))}

          {streamingToken && (
            <ChatMessage
              message={{
                id: "streaming",
                conversation_id: activeConversationId || "",
                role: "assistant",
                content: streamingToken,
                citations: activeCitations,
                created_at: new Date().toISOString(),
              }}
              onSelectCitation={(c) => setSelectedCitation(c)}
            />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-[#E5E1D8] bg-[#FBF9F5]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="max-w-4xl mx-auto flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={`Ask anything about ${repo.name} (e.g. "How does payment processing work?")...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-2xl border border-[#D6D0C4] bg-white text-xs text-[#292824] placeholder:text-[#A09C92] focus:outline-none focus:ring-2 focus:ring-[#C66B48]/30 focus:border-[#C66B48] shadow-sm disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-3 rounded-2xl bg-[#C66B48] hover:bg-[#B35B39] text-white disabled:opacity-40 transition-all shadow-sm shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
          <div className="flex items-center justify-between max-w-4xl mx-auto mt-2 px-1 text-[10px] text-[#76736A]">
            <span>Grounded on {repo.total_chunks} indexed Chroma code chunks</span>
            <span>Cites exact file paths & line numbers</span>
          </div>
        </div>
      </div>

      {/* Right Citations Panel */}
      <CitationsPanel
        citation={selectedCitation}
        onClose={() => setSelectedCitation(null)}
        onOpenFileInExplorer={onOpenFileInExplorer}
      />
    </div>
  );
};
