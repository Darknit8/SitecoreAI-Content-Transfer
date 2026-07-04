"use client";

import React, { useState, useEffect } from "react";
import { Database, FolderOpen, Play, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

export default function SourcesPage() {
  const [sources, setSources] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);

  const fetchSources = () => {
    setLoading(true);
    fetch("/api/destination?action=sources")
      .then((res) => res.json())
      .then((data) => {
        setSources(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleConsume = async (name: string, isBlob: boolean) => {
    setStatus(null);
    try {
      const res = await fetch("/api/destination?action=consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [isBlob ? "blobName" : "fileName"]: name,
          database: "master",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: "success", message: `Ingestion scheduled successfully for ${name}.` });
      } else {
        throw new Error(data.error || "Failed to trigger ingestion.");
      }
    } catch (err) {
      setStatus({ type: "error", message: (err as Error).message });
    }
  };

  const handleRetryAll = async () => {
    setStatus(null);
    try {
      const res = await fetch("/api/destination?action=retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ database: "master" }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: "success", message: `Retry triggered: ${data.message || "scheduled."}` });
      } else {
        throw new Error(data.error || "Failed to trigger retry.");
      }
    } catch (err) {
      setStatus({ type: "error", message: (err as Error).message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
            Blob & File Sources
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Browse and consume transfer files (.raif) currently located on the destination filesystem or Azure Blob storage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRetryAll}
            className="flex items-center gap-2 border border-slate-200/50 bg-white/70 hover:bg-white px-4 py-2 rounded-lg text-sm transition-all text-slate-700 shadow-sm font-semibold"
          >
            Retry Failed Imports
          </button>
          <button
            onClick={fetchSources}
            className="flex items-center justify-center w-10 h-10 border border-slate-200/50 bg-white/70 rounded-lg hover:bg-white transition-all text-slate-500 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {status && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg border text-sm ${
            status.type === "success"
              ? "bg-emerald-50 border-emerald-250 text-emerald-800"
              : "bg-rose-50 border-rose-250 text-rose-800"
          }`}
        >
          {status.type === "success" ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          {status.message}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Azure Blob Sources */}
          <div className="glow-card p-6 rounded-xl space-y-4 bg-white/80">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b border-slate-200/50 pb-3 text-slate-800">
              <Database className="w-5 h-5 text-indigo-500" />
              Azure Blob Storage Sources
            </h2>

            {!sources?.blobs?.sources || sources.blobs.sources.length === 0 ? (
              <div className="text-sm text-slate-400 py-6 text-center">No packages found in blob container.</div>
            ) : (
              <div className="space-y-3">
                {sources.blobs.sources.map((blob: any) => (
                  <div
                    key={blob.name}
                    className="flex items-center justify-between p-3.5 rounded-lg bg-white/50 border border-slate-200/40"
                  >
                    <div>
                      <span className="block font-semibold text-sm text-slate-700">{blob.name}</span>
                      <span className="block text-xs text-slate-400 mt-0.5">
                        Size: {(blob.size / 1024 / 1024).toFixed(2)} MB • {new Date(blob.lastModified).toLocaleDateString()}
                      </span>
                    </div>

                    <button
                      onClick={() => handleConsume(blob.name, true)}
                      className="flex items-center gap-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 hover:opacity-95 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-all shadow-sm shadow-indigo-500/10"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Consume
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filesystem Sources */}
          <div className="glow-card p-6 rounded-xl space-y-4 bg-white/80">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b border-slate-200/50 pb-3 text-slate-800">
              <FolderOpen className="w-5 h-5 text-indigo-500" />
              CMS Filesystem Sources
            </h2>

            {!sources?.files?.sources || sources.files.sources.length === 0 ? (
              <div className="text-sm text-slate-400 py-6 text-center">No package files discovered on server path.</div>
            ) : (
              <div className="space-y-3">
                {sources.files.sources.map((file: any) => (
                  <div
                    key={file.name}
                    className="flex items-center justify-between p-3.5 rounded-lg bg-white/50 border border-slate-200/40"
                  >
                    <div>
                      <span className="block font-semibold text-sm text-slate-700">{file.name}</span>
                      <span className="block text-xs text-slate-400 mt-0.5">
                        Size: {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.lastModified).toLocaleDateString()}
                      </span>
                    </div>

                    <button
                      onClick={() => handleConsume(file.name, false)}
                      className="flex items-center gap-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 hover:opacity-95 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-all shadow-sm shadow-indigo-500/10"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Consume
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
