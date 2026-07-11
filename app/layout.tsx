"use client";

import React, { useState } from "react";
import Link from "next/link";
import Sidebar from "./components/Sidebar";
import { Menu } from "lucide-react";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <html lang="en">
      <head>
        <title>Sitecore Content Transfer Console</title>
        <meta name="description" content="Web dashboard for managing and orchestrating SitecoreAI migrations" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body className="flex flex-col min-h-screen mesh-bg text-slate-800 lg:flex-row">
        {/* Mobile Navbar Header */}
        <header className="h-16 px-4 bg-white/70 backdrop-blur-md border-b border-slate-200/50 flex items-center justify-between sticky top-0 z-30 lg:hidden w-full">
          <Link href="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 flex items-center justify-center font-bold text-white text-xs tracking-wider shadow-md shadow-indigo-500/20">
              SCT
            </div>
            <span className="font-bold tracking-tight text-sm text-slate-800">SitecoreAI Console</span>
          </Link>

          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-650 hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Sidebar Backdrop Overlay on Mobile */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden transition-opacity duration-300"
          ></div>
        )}

        {/* Navigation Sidebar */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Main Content Pane */}
        <main className="flex-1 lg:pl-64 min-h-screen relative w-full overflow-x-hidden">
          <div className="p-4 sm:p-8 max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
