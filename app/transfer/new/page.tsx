"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, AlertCircle, Settings } from "lucide-react";

export default function NewTransferPage() {
  const router = useRouter();
  const [configLoaded, setConfigLoaded] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);
  const [source, setSource] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);

  const [itemPathInput, setItemPathInput] = useState("");
  const [scope, setScope] = useState("SingleItem");
  const [mergeStrategy, setMergeStrategy] = useState("OverrideExistingItem");
  const [database, setDatabase] = useState("master");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        setConfigLoaded(true);
        if (data.source && data.destination) {
          setHasConfig(true);
          setSource(data.source);
          setDestination(data.destination);
        }
      })
      .catch(() => setConfigLoaded(true));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const paths = itemPathInput
      .split(",")
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (paths.length === 0) {
      setError("Please specify at least one valid Sitecore item path.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          destination,
          dataTrees: paths.map(itemPath => ({
            itemPath,
            scope,
            mergeStrategy,
          })),
          database,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start transfer");
      }

      router.push(`/transfer/${data.transferId}`);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  if (!configLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!hasConfig) {
    return (
      <div className="glow-card max-w-xl mx-auto p-8 rounded-xl text-center space-y-6 bg-white/80">
        <AlertCircle className="w-16 h-16 text-slate-400 mx-auto" />
        <div>
          <h2 className="text-xl font-bold text-slate-800">Environments Not Configured</h2>
          <p className="text-slate-500 text-sm mt-2">
            You must configure credentials for both source and destination environments before initiating a migration.
          </p>
        </div>
        <a
          href="/settings"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 text-white font-bold text-sm px-6 py-3 rounded-lg transition-all shadow-md shadow-indigo-500/20"
        >
          <Settings className="w-4 h-4" />
          Configure Settings
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
          New Content Migration
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Initiate a new chunk-stream content migration pipeline between environments.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glow-card p-8 rounded-xl space-y-6 bg-white/85">
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-rose-50 border border-rose-250 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200/50 text-xs">
          <div>
            <span className="block text-slate-400 font-semibold uppercase">Source Environment</span>
            <span className="block font-medium mt-0.5 text-slate-700">{source.host}</span>
          </div>
          <div>
            <span className="block text-slate-400 font-semibold uppercase">Destination Environment</span>
            <span className="block font-medium mt-0.5 text-slate-700">{destination.host}</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-550 uppercase">Sitecore Item Paths</label>
          <input
            type="text"
            value={itemPathInput}
            onChange={e => setItemPathInput(e.target.value)}
            placeholder="e.g. /sitecore/content/Home, /sitecore/media library/Files"
            className="w-full bg-white/50 border border-slate-200 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:bg-white transition-all shadow-inner"
            required
          />
          <span className="block text-xs text-slate-450">
            For multiple trees, separate paths with a comma.
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase">Scope</label>
            <select
              value={scope}
              onChange={e => setScope(e.target.value)}
              className="w-full bg-white/50 border border-slate-200 focus:border-indigo-500 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:bg-white transition-all shadow-sm"
            >
              <option value="SingleItem">Single Item Only</option>
              <option value="ItemAndDescendants">Item And Descendants</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-550 uppercase">Conflict Strategy</label>
            <select
              value={mergeStrategy}
              onChange={e => setMergeStrategy(e.target.value)}
              className="w-full bg-white/50 border border-slate-200 focus:border-indigo-500 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:bg-white transition-all shadow-sm"
            >
              <option value="OverrideExistingItem">Override Existing Item</option>
              <option value="KeepExistingItem">Keep Existing Item</option>
              <option value="LatestWin">Latest Modifed Wins</option>
              <option value="OverrideExistingTree">Override Existing Tree</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-550 uppercase">Target Database</label>
            <select
              value={database}
              onChange={e => setDatabase(e.target.value)}
              className="w-full bg-white/50 border border-slate-200 focus:border-indigo-500 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:bg-white transition-all shadow-sm"
            >
              <option value="master">master</option>
              <option value="web">web</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200/50">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 hover:opacity-95 text-white font-bold text-sm px-6 py-3 rounded-lg disabled:opacity-50 transition-all shadow-md shadow-indigo-500/20"
          >
            <ArrowRightLeft className="w-4 h-4" />
            {loading ? "Launching Pipeline..." : "Start Migration Pipeline"}
          </button>
        </div>
      </form>
    </div>
  );
}
