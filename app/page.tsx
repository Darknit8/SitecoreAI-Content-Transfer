"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  BookOpen,
  ExternalLink,
  Zap,
  Shield,
  Layers,
  GitBranch,
  Play,
  FileCode2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const apiLinks = [
  {
    label: "Content Transfer API — Overview",
    href: "https://api-docs.sitecore.com/sai/content-transfer/section/authorization/create-an-automation-client",
    description: "Official Sitecore XP content transfer documentation",
  },
  {
    label: "Item Transfer REST API Reference",
    href: "https://api-docs.sitecore.com/sai/item-transfer",
    description: "Endpoints for exporting & ingesting items via REST",
  },
  {
    label: "Chunk Streaming Protocol",
    href: "https://api-docs.sitecore.com/sai/content-transfer/content-transfer-api/contenttransfer_savechunkasync",
    description: "How chunked .raif packages are built and consumed",
  },
  {
    label: "Identity Server — OAuth2 / Client Credentials",
    href: "https://api-docs.sitecore.com/sai/content-transfer/section/authorization/request-a-jwt",
    description: "Configuring Client ID & Client Secret for API access",
  }
];

const pipelineSteps = [
  { step: "1", label: "Export", detail: "Source CM fetches items via the Content Transfer API." },
  { step: "2", label: "Upload", detail: "Orchestrator streams chunks as .raif to destination storage." },
  { step: "3", label: "Consume", detail: "Destination REST API ingests package into SQL." },
  { step: "4", label: "Monitor", detail: "Verify execution status in Transfer History." },
];

export default function DashboardOverview() {
  const router = useRouter();
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRuns = () => {
    setLoading(true);
    fetch("/api/transfer")
      .then((res) => res.json())
      .then((data) => {
        const sorted = Array.isArray(data)
          ? data.sort((a: any, b: any) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
          : [];
        setRuns(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchRuns();
    // Poll active runs every 5 seconds
    const interval = setInterval(() => {
      fetch("/api/transfer")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const sorted = data.sort((a: any, b: any) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
            setRuns(sorted);
          }
        })
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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

      {/* Main Content Layout */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column (Runs + About) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active & Recent Migration Pipelines */}
          <div className="glow-card p-6 rounded-xl bg-white/80 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200/50 pb-3">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
                Active &amp; Recent Migration Pipelines
              </h2>
              <button
                onClick={fetchRuns}
                className="text-slate-400 hover:text-slate-655 transition-colors p-1 hover:bg-slate-100 rounded"
                title="Refresh list"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {loading && runs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">Loading pipelines...</div>
            ) : runs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm space-y-3">
                <p>No active or recent migration pipelines found in memory.</p>
                <a
                  href="/transfer/new"
                  className="inline-flex items-center gap-1.5 text-indigo-500 hover:underline text-xs font-semibold"
                >
                  Start a new migration ➜
                </a>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {runs.map((run) => (
                  <div
                    key={run.id}
                    onClick={() => router.push(`/transfer/${run.id}`)}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/50 border border-slate-200/40 hover:border-indigo-300 hover:bg-white cursor-pointer transition-all hover:shadow-md group relative overflow-hidden"
                  >
                    <div className="space-y-1.5 flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="block text-xs font-bold font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {run.id.substring(0, 8)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(run.startedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-700">{run.sourceEnv}</span>
                        <span className="text-slate-400">➜</span>
                        <span className="font-semibold text-slate-700">{run.destEnv}</span>
                        <span className="text-slate-350">•</span>
                        <span className="font-mono text-[10px] bg-slate-50 border border-slate-100 px-1 rounded">{run.database}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {run.state === "running" && (
                        <span className="flex items-center gap-1.5 text-xs text-amber-700 font-bold bg-amber-50 border border-amber-250/20 px-2.5 py-1 rounded-full animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                          Active
                        </span>
                      )}
                      {run.state === "completed" && (
                        <span className="flex items-center gap-1 text-xs text-emerald-700 font-bold bg-emerald-55 border border-emerald-250/20 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Success
                        </span>
                      )}
                      {run.state === "failed" && (
                        <span className="flex items-center gap-1 text-xs text-rose-700 font-bold bg-rose-55 border border-rose-250/20 px-2.5 py-1 rounded-full">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          Failed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                  <div key={step} className="relative p-3 rounded-xl bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200/50 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4.5 h-4.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{step}</span>
                      <span className="text-xs font-bold text-slate-700">{label}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-snug">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (Quick Reference Only) */}
        <div>
          
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
    </div>
  );
}
