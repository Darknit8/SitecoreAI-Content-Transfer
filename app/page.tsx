"use client";

import React from "react";
import {
  ArrowRightLeft,
  Database,
  History,
  Settings,
  BookOpen,
  ExternalLink,
  Zap,
  Shield,
  Layers,
  GitBranch,
  Play,
  FileCode2,
} from "lucide-react";

const apiLinks = [
  {
    label: "Content Transfer API — Overview",
    href: "https://doc.sitecore.com/xp/en/developers/103/sitecore-experience-platform/sitecore-content-transfer.html",
    description: "Official Sitecore XP content transfer documentation",
  },
  {
    label: "Item Transfer REST API Reference",
    href: "https://doc.sitecore.com/xp/en/developers/103/sitecore-experience-platform/the-item-transfer-api.html",
    description: "Endpoints for exporting & ingesting items via REST",
  },
  {
    label: "Chunk Streaming Protocol",
    href: "https://doc.sitecore.com/xp/en/developers/103/sitecore-experience-platform/transferring-content-with-the-sitecore-content-transfer-module.html",
    description: "How chunked .raif packages are built and consumed",
  },
  {
    label: "Identity Server — OAuth2 / Client Credentials",
    href: "https://doc.sitecore.com/xp/en/developers/103/sitecore-experience-platform/configure-client-credentials-flow-for-sitecore-services-client.html",
    description: "Configuring Client ID & Client Secret for API access",
  },
  {
    label: "Transfer Scope & Conflict Strategy",
    href: "https://doc.sitecore.com/xp/en/developers/103/sitecore-experience-platform/content-transfer-command-line-tool.html",
    description: "SingleItem, ItemAndDescendants, conflict resolution modes",
  },
];

const navCards = [
  {
    href: "/transfer/new",
    label: "New Migration",
    icon: ArrowRightLeft,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
    description: "Initiate a new chunk-stream content migration pipeline between environments.",
  },
  {
    href: "/sources",
    label: "Blob & File Sources",
    icon: Database,
    color: "text-purple-500",
    bg: "bg-purple-50",
    description: "Browse .raif packages in Azure Blob or CMS filesystem and trigger ingestion.",
  },
  {
    href: "/history",
    label: "Transfer History",
    icon: History,
    color: "text-cyan-500",
    bg: "bg-cyan-50",
    description: "Browse the destination Item Transfer API ingestion log and status records.",
  },
  {
    href: "/settings",
    label: "Environment Settings",
    icon: Settings,
    color: "text-slate-500",
    bg: "bg-slate-50",
    description: "Verify configured credential status for Dev, QA, UAT and Production environments.",
  },
];

const pipelineSteps = [
  { step: "1", label: "Export", detail: "Source CM fetches items and builds chunked .raif archive via the Content Transfer API." },
  { step: "2", label: "Upload", detail: "The orchestrator uploads the .raif to destination Azure Blob storage or CMS filesystem." },
  { step: "3", label: "Consume", detail: "The destination Item Transfer API ingests the .raif package asynchronously into SQL." },
  { step: "4", label: "Monitor", detail: "Poll ingestion status until Finished or error. Results visible in Transfer History." },
];

export default function DashboardOverview() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-800 to-indigo-900 bg-clip-text text-transparent">
            Migration Command Center
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            SitecoreAI Content Transfer — chunked data streaming between Sitecore environments.
          </p>
        </div>
        <a
          href="/transfer/new"
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 hover:opacity-95 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-all shadow-md shadow-indigo-500/20"
        >
          <Play className="w-4 h-4 fill-current" />
          New Migration
        </a>
      </div>

      {/* About this implementation */}
      <div className="glow-card p-7 rounded-xl bg-white/80 space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-200/50 pb-4">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <FileCode2 className="w-5 h-5 text-indigo-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">About This Implementation</h2>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          This console is a <strong className="text-slate-800">Next.js 16 web application</strong> built to orchestrate Sitecore content migrations between multiple environments (Dev, QA, UAT, Production) using the{" "}
          <strong className="text-slate-800">Sitecore Content Transfer API</strong>. It manages the full end-to-end pipeline — from exporting chunked <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 text-xs font-mono">.raif</code> packages on the source, uploading them to the destination, and triggering asynchronous ingestion via the Item Transfer REST API.
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap gap-2">
          {[
            { icon: Zap, label: "Chunk-stream pipeline", color: "text-indigo-600 bg-indigo-50 border-indigo-200/50" },
            { icon: Shield, label: "Auth-gated high-risk ops", color: "text-rose-600 bg-rose-50 border-rose-200/50" },
            { icon: Layers, label: "Multi-environment support", color: "text-purple-600 bg-purple-50 border-purple-200/50" },
            { icon: GitBranch, label: "Conflict strategy control", color: "text-emerald-600 bg-emerald-50 border-emerald-200/50" },
          ].map(({ icon: Icon, label, color }) => (
            <span key={label} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${color}`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </span>
          ))}
        </div>

        {/* Pipeline Steps */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Migration Pipeline Flow</h3>
          <div className="grid sm:grid-cols-4 gap-3">
            {pipelineSteps.map(({ step, label, detail }) => (
              <div key={step} className="relative p-3.5 rounded-xl bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200/50 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{step}</span>
                  <span className="text-sm font-bold text-slate-700">{label}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two-col: Nav shortcuts + Quick Reference */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Navigation Shortcuts */}
        <div className="glow-card p-6 rounded-xl bg-white/80 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-200/50 pb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <ArrowRightLeft className="w-5 h-5 text-purple-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Navigate</h2>
          </div>
          <div className="space-y-3">
            {navCards.map(({ href, label, icon: Icon, color, bg, description }) => (
              <a
                key={href}
                href={href}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200/50 hover:border-indigo-200 hover:bg-white transition-all hover:shadow-sm group"
              >
                <div className={`p-2 rounded-lg ${bg} flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <span className="block text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{label}</span>
                  <span className="block text-[11px] text-slate-400 mt-0.5 leading-snug">{description}</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Quick Reference & API Links */}
        <div className="glow-card p-6 rounded-xl bg-white/80 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-200/50 pb-4">
            <div className="p-2 bg-cyan-50 rounded-lg">
              <BookOpen className="w-5 h-5 text-cyan-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Quick Reference</h2>
          </div>
          <div className="space-y-2">
            {apiLinks.map(({ label, href, description }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-200/50 hover:border-cyan-200 hover:bg-cyan-50/30 transition-all group"
              >
                <div>
                  <span className="block text-xs font-bold text-slate-700 group-hover:text-cyan-700 transition-colors leading-snug">{label}</span>
                  <span className="block text-[10px] text-slate-400 mt-0.5 leading-snug">{description}</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-cyan-500 transition-colors flex-shrink-0 mt-0.5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
