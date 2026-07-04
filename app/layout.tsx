import React from "react";
import Link from "next/link";
import "./globals.css";
import { LayoutDashboard, ArrowRightLeft, Database, History, Settings } from "lucide-react";

export const metadata = {
  title: "Sitecore Content Transfer Console",
  description: "Web dashboard for managing and orchestrating SitecoreAI migrations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen mesh-bg text-slate-800">
        {/* Navigation Sidebar */}
        <aside className="w-64 glass-sidebar flex flex-col fixed top-0 bottom-0 left-0 z-20">
          {/* Logo */}
          <div className="h-16 px-6 border-b border-slate-200/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 flex items-center justify-center font-bold text-white text-xs tracking-wider shadow-md shadow-indigo-500/20">
              SCT
            </div>
            <div>
              <span className="font-bold tracking-tight text-sm text-slate-800">SitecoreAI</span>
              <span className="block text-xs text-slate-400">Content Transfer</span>
            </div>
          </div>

          {/* Links */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-white/80 hover:shadow-sm transition-all"
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              Overview
            </Link>
            <Link
              href="/transfer/new"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-white/80 hover:shadow-sm transition-all"
            >
              <ArrowRightLeft className="w-4 h-4 text-slate-400" />
              New Migration
            </Link>
            <Link
              href="/sources"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-white/80 hover:shadow-sm transition-all"
            >
              <Database className="w-4 h-4 text-slate-400" />
              Blob & File Sources
            </Link>
            <Link
              href="/history"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-white/80 hover:shadow-sm transition-all"
            >
              <History className="w-4 h-4 text-slate-400" />
              Transfer History
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-white/80 hover:shadow-sm transition-all"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              Environment Settings
            </Link>
          </nav>

          {/* Footer Status */}
          <div className="p-4 border-t border-slate-200/50 bg-white/20">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Orchestrator Ready
            </div>
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="flex-1 pl-64 min-h-screen relative">
          <div className="p-8 max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
