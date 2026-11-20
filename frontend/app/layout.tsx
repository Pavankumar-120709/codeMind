import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeMind — AI Codebase Understanding Agent",
  description: "Understand, explore, debug, and test codebases using Google Gemini and RAG",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F7F5F0] text-[#292824] antialiased">
        {children}
      </body>
    </html>
  );
}
