import React from "react";

interface LanguageDistributionProps {
  languages: Record<string, number>;
}

const LANGUAGE_COLORS: Record<string, string> = {
  python: "#3572A5",
  typescript: "#3178C6",
  javascript: "#F1E05A",
  go: "#00ADD8",
  rust: "#DEA584",
  java: "#B07219",
  html: "#E34C26",
  css: "#563D7C",
  markdown: "#083FA1",
  json: "#292929",
  shell: "#89E051",
  dockerfile: "#384D54"
};

export const LanguageDistribution: React.FC<LanguageDistributionProps> = ({ languages }) => {
  const entries = Object.entries(languages || {}).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((acc, curr) => acc + curr[1], 0);

  if (entries.length === 0 || total === 0) {
    return (
      <div className="p-5 rounded-2xl bg-white border border-[#E5E1D8] text-center text-xs text-[#76736A]">
        No language data available.
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-sm">
      <h3 className="text-sm font-semibold text-[#292824] mb-3">Language Composition</h3>
      
      {/* Visual Bar */}
      <div className="h-3 w-full rounded-full overflow-hidden flex bg-[#EFECE6] mb-4">
        {entries.map(([lang, count]) => {
          const pct = (count / total) * 100;
          const color = LANGUAGE_COLORS[lang.toLowerCase()] || "#A09C92";
          return (
            <div
              key={lang}
              style={{ width: `${pct}%`, backgroundColor: color }}
              title={`${lang}: ${pct.toFixed(1)}% (${count} files)`}
              className="h-full transition-all"
            />
          );
        })}
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {entries.slice(0, 6).map(([lang, count]) => {
          const pct = ((count / total) * 100).toFixed(1);
          const color = LANGUAGE_COLORS[lang.toLowerCase()] || "#A09C92";
          return (
            <div key={lang} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs font-medium text-[#292824] capitalize truncate">
                {lang}
              </span>
              <span className="text-xs text-[#76736A] ml-auto">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
