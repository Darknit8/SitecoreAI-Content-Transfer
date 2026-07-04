"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, History, Play, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

export default function DashboardOverview() {
  const router = useRouter();
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/transfer")
      .then(res => res.json())
      .then(data => {
        setRuns(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalRuns = runs.length;
  const activeRuns = runs.filter(r => r.state === "running").length;
  const completedRuns = runs.filter(r => r.state === "completed").length;
  const failedRuns = runs.filter(r => r.state === "failed").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-800 to-indigo-900 bg-clip-text text-transparent">
            Migration Command Center
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Orchestrate and monitor SitecoreAI environment content synchronization pipelines.
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

      {/* Stats Cards: Color-coded glassmorphic widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="glow-card p-6 rounded-xl space-y-2 border-l-4 border-l-indigo-500 bg-white/70">
          <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Total Runs</span>
          <div className="text-3xl font-extrabold text-slate-800">{totalRuns}</div>
        </div>
        <div className="glow-card p-6 rounded-xl space-y-2 border-l-4 border-l-amber-500 bg-white/70">
          <span className="text-xs text-amber-600 font-bold uppercase tracking-wider">Active Runs</span>
          <div className="text-3xl font-extrabold text-amber-700">{activeRuns}</div>
        </div>
        <div className="glow-card p-6 rounded-xl space-y-2 border-l-4 border-l-emerald-500 bg-white/70">
          <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Successful</span>
          <div className="text-3xl font-extrabold text-emerald-700">{completedRuns}</div>
        </div>
        <div className="glow-card p-6 rounded-xl space-y-2 border-l-4 border-l-rose-500 bg-white/70">
          <span className="text-xs text-rose-600 font-bold uppercase tracking-wider">Failed</span>
          <div className="text-3xl font-extrabold text-rose-700">{failedRuns}</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Active/Recent Pipelines */}
        <div className="glow-card p-6 rounded-xl md:col-span-2 space-y-6 bg-white/80">
          <div className="flex justify-between items-center border-b border-slate-200/50 pb-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
              Migration Pipelines
            </h2>
            <button
              onClick={() => {
                setLoading(true);
                fetch("/api/transfer")
                  .then(res => res.json())
                  .then(data => {
                    setRuns(data);
                    setLoading(false);
                  });
              }}
              className="text-slate-400 hover:text-slate-650 transition-colors"
            >
              <RefreshCw className="w-4 h-4 animate-spin-hover" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading pipelines...</div>
          ) : runs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm space-y-4">
              <p>No migration pipelines found in memory.</p>
              <a
                href="/transfer/new"
                className="inline-flex items-center gap-1.5 text-indigo-500 hover:underline text-xs font-semibold"
              >
                Create one now ➜
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {runs.map((run) => (
                <div
                  key={run.id}
                  onClick={() => router.push(`/transfer/${run.id}`)}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/50 border border-slate-200/40 hover:border-indigo-200 cursor-pointer hover:bg-white transition-all hover:shadow-sm"
                >
                  <div className="space-y-1">
                    <span className="block text-xs font-semibold text-slate-500">ID: {run.id.substring(0, 18)}...</span>
                    <span className="block text-xs text-slate-400">Started: {new Date(run.startedAt).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {run.state === "running" && (
                      <span className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold bg-amber-50 border border-amber-200/50 px-2.5 py-1 rounded-full animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                        Running
                      </span>
                    )}
                    {run.state === "completed" && (
                      <span className="flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-55 border border-emerald-200/50 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Completed
                      </span>
                    )}
                    {run.state === "failed" && (
                      <span className="flex items-center gap-1 text-xs text-rose-700 font-semibold bg-rose-55 border border-rose-200/50 px-2.5 py-1 rounded-full">
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

        {/* Quick info panel */}
        <div className="glow-card p-6 rounded-xl space-y-6 bg-white/80">
          <h2 className="text-lg font-bold flex items-center gap-2 border-b border-slate-200/50 pb-4 text-slate-800">
            <History className="w-5 h-5 text-indigo-500" />
            Quick Reference
          </h2>
          <div className="space-y-4 text-xs text-slate-500 leading-relaxed">
            <p>
              Content transfer uses **chunked data streaming**. Content chunks are streamed directly from the source to destination environment to build `.raif` files.
            </p>
            <p>
              The destination **Item Transfer API** then asynchronously ingests `.raif` packages into the SQL database.
            </p>
            <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-slate-200/60 space-y-2">
              <span className="block font-semibold uppercase text-indigo-700">File Ingestion status</span>
              <p className="text-slate-500">Verify blob packages and manual ingestion status in the **Blob & File Sources** tab.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
