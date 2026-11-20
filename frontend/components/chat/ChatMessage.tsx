import React from "react";
import { Message, Citation } from "@/lib/types";
import { Sparkles, User, FileCode2, ExternalLink } from "lucide-react";

interface ChatMessageProps {
  message: Message;
  onSelectCitation: (citation: Citation) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onSelectCitation,
}) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3.5 ${isUser ? "justify-end" : "justify-start"} group`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-[#FAF1EC] border border-[#F3D7CC] flex items-center justify-center text-[#C66B48] shrink-0 mt-0.5 shadow-sm">
          <Sparkles className="w-4 h-4" />
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed transition-all ${
          isUser
            ? "bg-[#C66B48] text-white shadow-sm font-normal"
            : "bg-white text-[#292824] border border-[#E5E1D8] shadow-sm"
        }`}
      >
        {/* Content Body with basic codeblock / markdown formatting */}
        <div className="whitespace-pre-wrap break-words leading-relaxed space-y-2">
          {message.content}
        </div>

        {/* Citations Tag Bar */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-[#EFECE6]">
            <p className="text-[10px] font-semibold text-[#76736A] uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileCode2 className="w-3 h-3 text-[#C66B48]" />
              Sources Referenced ({message.citations.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {message.citations.map((c, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectCitation(c)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF1EC] hover:bg-[#F3E2D8] text-[11px] font-mono text-[#C66B48] border border-[#F0D0C2] transition-colors"
                >
                  <span className="truncate max-w-[150px]">{c.file_path}</span>
                  <span className="text-[9px] text-[#A0644E]">L{c.start_line}-{c.end_line}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-[#EFECE6] flex items-center justify-center text-[#76736A] shrink-0 mt-0.5">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
