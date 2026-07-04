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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [confirmStep, setConfirmStep] = useState(1);
  const [modalError, setModalError] = useState<string | null>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setModalError(null);
    setAuthPassword("");
    setConfirmStep(1);

    const paths = itemPathInput
      .split(",")
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (paths.length === 0) {
      setError("Please specify at least one valid Sitecore item path.");
      return;
    }

    setShowConfirmModal(true);
  };

  const executeTransfer = async () => {
    if (confirmStep === 1) {
      setConfirmStep(2);
      setModalError(null);
      return;
    }

    setLoading(true);
    setModalError(null);
    setError(null);

    const paths = itemPathInput
      .split(",")
      .map(p => p.trim())
      .filter(p => p.length > 0);

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
          authPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start transfer");
      }

      setShowConfirmModal(false);
      router.push(`/transfer/${data.transferId}`);
    } catch (err) {
      setModalError((err as Error).message);
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
            placeholder="e.g. /sitecore/content/Home, /sitecore/media library/Images"
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

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200/50 space-y-6 transform scale-100 transition-transform">
            {confirmStep === 1 ? (
              <>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <ArrowRightLeft className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900">Confirm Content Migration</h3>
                    <p className="text-sm text-slate-500">
                      Please review the migration configuration before starting the content migration pipeline.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl border border-slate-200/50 p-4 space-y-4 text-sm text-slate-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase">Source Env</span>
                      <span className="block font-medium text-slate-800 break-all">{source?.host}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase">Destination Env</span>
                      <span className="block font-medium text-slate-800 break-all">{destination?.host}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200/50 pt-3">
                    <span className="block text-xs font-semibold text-slate-400 uppercase">Sitecore Item Paths</span>
                    <div className="max-h-24 overflow-y-auto space-y-1 mt-1">
                      {itemPathInput.split(",").map((path, idx) => (
                        <span key={idx} className="block font-mono text-xs text-slate-700 bg-white border border-slate-200/40 px-2 py-1 rounded">
                          {path.trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 border-t border-slate-200/50 pt-3">
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase">Scope</span>
                      <span className={`block font-medium ${scope === "ItemAndDescendants" ? "text-rose-600 font-bold" : "text-slate-800"}`}>
                        {scope === "SingleItem" ? "Single Item" : "Item & Descendants"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase">Conflict Strategy</span>
                      <span className={`block font-medium ${mergeStrategy === "OverrideExistingItem" || mergeStrategy === "OverrideExistingTree" ? "text-rose-600 font-bold" : "text-slate-800"}`}>
                        {mergeStrategy === "OverrideExistingItem" && "Override Existing Item"}
                        {mergeStrategy === "KeepExistingItem" && "Keep Existing Item"}
                        {mergeStrategy === "LatestWin" && "Latest Modified Wins"}
                        {mergeStrategy === "OverrideExistingTree" && "Override Existing Tree"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase">Database</span>
                      <span className="block font-medium text-slate-800">{database}</span>
                    </div>
                  </div>
                </div>

                {(scope === "ItemAndDescendants" || mergeStrategy === "OverrideExistingItem" || mergeStrategy === "OverrideExistingTree") && (
                  <div className="flex gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-250/20 text-amber-800 text-xs shadow-inner">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div className="space-y-0.5">
                      <span className="font-bold block text-amber-900">High-Resource / Destructive Operation</span>
                      <span>
                        {scope === "ItemAndDescendants" && "• Migrating an entire item tree (including all descendants) is resource-intensive. "}
                        {(mergeStrategy === "OverrideExistingItem" || mergeStrategy === "OverrideExistingTree") && "• Overriding existing items/trees will permanently overwrite destination content. "}
                        Please ensure you have backups of your destination database before proceeding.
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeTransfer}
                    className="px-5 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 text-white transition-all shadow-sm shadow-indigo-500/10"
                  >
                    Proceed to Authorize
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${
                    (scope === "ItemAndDescendants" || mergeStrategy === "OverrideExistingItem" || mergeStrategy === "OverrideExistingTree")
                      ? "bg-rose-50 text-rose-600"
                      : "bg-indigo-50 text-indigo-600"
                  }`}>
                    <Settings className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900">
                      {(scope === "ItemAndDescendants" || mergeStrategy === "OverrideExistingItem" || mergeStrategy === "OverrideExistingTree")
                        ? "Authorize Destination Changes"
                        : "Authorize Content Migration"}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {(scope === "ItemAndDescendants" || mergeStrategy === "OverrideExistingItem" || mergeStrategy === "OverrideExistingTree")
                        ? "An administrator password is required to execute this high-resource or destructive migration pipeline."
                        : "A standard migration password is required to execute this content migration pipeline."}
                    </p>
                  </div>
                </div>

                {modalError && (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {modalError}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase">
                    {(scope === "ItemAndDescendants" || mergeStrategy === "OverrideExistingItem" || mergeStrategy === "OverrideExistingTree")
                      ? "Admin Authorization Password"
                      : "Standard Authorization Password"}
                  </label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Enter security password"
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none transition-all shadow-sm"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setConfirmStep(1);
                      setModalError(null);
                    }}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-sm"
                  >
                    Back
                  </button>
                  <button
                    onClick={executeTransfer}
                    disabled={loading || !authPassword}
                    className="px-5 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 text-white disabled:opacity-50 transition-all shadow-sm shadow-indigo-500/10"
                  >
                    {loading ? "Verifying..." : "Confirm & Start"}
                  </button>
                </div>
              </>
            )
          }
          </div>
        </div>
      )}
    </div>
  );
}
