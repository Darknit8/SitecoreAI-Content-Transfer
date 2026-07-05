"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowRightLeft, Database, History, Settings, X } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/transfer/new", label: "New Migration", icon: ArrowRightLeft },
    { href: "/sources", label: "Blob & File Sources", icon: Database },
    { href: "/history", label: "Transfer History", icon: History },
    { href: "/settings", label: "Environment Settings", icon: Settings },
  ];

  return (
    <aside
      className={`w-64 glass-sidebar flex flex-col fixed top-0 bottom-0 left-0 z-40 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Logo Area */}
      <div className="h-16 px-6 border-b border-slate-200/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 flex items-center justify-center font-bold text-white text-xs tracking-wider shadow-md shadow-indigo-500/20">
            SCT
          </div>
          <div>
            <span className="font-bold tracking-tight text-sm text-slate-800">SitecoreAI</span>
            <span className="block text-xs text-slate-400">Content Transfer</span>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Links */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          // Check if active: exact match for home, or startsWith for subroutes
          const isActive = link.href === "/"
            ? pathname === "/"
            : pathname.startsWith(link.href) || (link.href === "/transfer/new" && pathname.startsWith("/transfer"));

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                isActive
                  ? "text-indigo-650 bg-white/90 shadow-sm border border-slate-100/50"
                  : "text-slate-600 hover:text-indigo-600 hover:bg-white/85 hover:shadow-sm"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-indigo-550" : "text-slate-400"}`} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer Status */}
      <div className="p-4 border-t border-slate-200/50 bg-white/20 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Orchestrator Ready
        </div>
        <p className="text-[10px] text-slate-400 leading-snug">
          Developed by{" "}
          <span className="font-semibold text-slate-500">Nitesh Kumar</span>
        </p>
      </div>
    </aside>
  );
}
