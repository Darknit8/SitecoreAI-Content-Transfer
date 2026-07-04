"use client";

import React, { useState, useEffect } from "react";
import { Database, FolderOpen, Play, CheckCircle2, AlertCircle, RefreshCw, Trash2 } from "lucide-react";
import { CustomSelect } from "../components/CustomSelect";

export default function SourcesPage() {
  const [sources, setSources] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ name: string; isBlob: boolean } | null>(null);
  const [destEnv, setDestEnv] = useState("QA");
  const [environments, setEnvironments] = useState<any>(null);

  const fetchSources = (envName = destEnv) => {
    setLoading(true);
    fetch(`/api/destination?action=sources&env=${envName}`)
      .then((res) => res.json())
      .then((data) => {
        setSources(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    const savedDest = localStorage.getItem("sct_dest_env") || "QA";
    setDestEnv(savedDest);

    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setEnvironments(data))
      .catch(() => {});

    fetchSources(savedDest);
  }, []);

  const handleEnvChange = (value: string) => {
    setDestEnv(value);
    localStorage.setItem("sct_dest_env", value);
    fetchSources(value);
  };

  const handleConsume = async (name: string, isBlob: boolean) => {
    setStatus(null);
    try {
      const res = await fetch(`/api/destination?action=consume&env=${destEnv}`, {
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
        fetchSources(destEnv);
      } else {
        throw new Error(data.error || "Failed to trigger ingestion.");
      }
    } catch (err) {
      setStatus({ type: "error", message: (err as Error).message });
    }
  };

  const proceedDelete = async (name: string, isBlob: boolean) => {
    setStatus(null);
    try {
      const res = await fetch(`/api/destination?action=${isBlob ? "blob" : "file"}&name=${encodeURIComponent(name)}&env=${destEnv}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: "success", message: `Successfully deleted ${name}.` });
        fetchSources(destEnv);
      } else {
        throw new Error(data.error || "Failed to delete source.");
      }
    } catch (err) {
      setStatus({ type: "error", message: (err as Error).message });
    }
  };

  const handleRetryAll = async () => {
    setStatus(null);
    try {
      const res = await fetch(`/api/destination?action=retry&env=${destEnv}`, {
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
            onClick={() => fetchSources(destEnv)}
            className="flex items-center justify-center w-10 h-10 border border-slate-200/50 bg-white/70 rounded-lg hover:bg-white transition-all text-slate-500 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Target Environment Selector Row */}
      <div className="flex items-center gap-3 bg-white/60 border border-slate-200/50 p-3.5 rounded-xl shadow-sm text-sm">
        <span className="text-slate-500 font-bold uppercase text-xs tracking-wider">Target Environment:</span>
        <CustomSelect
          value={destEnv}
          onChange={handleEnvChange}
          className="w-44"
          options={[
            { value: "Dev", label: "Dev", sublabel: "Development environment" },
            { value: "QA", label: "QA", sublabel: "Quality assurance environment" },
            { value: "UAT", label: "UAT", sublabel: "User acceptance testing" },
            { value: "Production", label: "Production", sublabel: "⚠ Live production environment" },
          ]}
        />
        {environments && (
          <span className="text-xs text-slate-400 font-mono">
            Host: <span className="text-slate-650 font-medium">{environments[destEnv.toLowerCase()]?.host || "Not configured"}</span>
          </span>
        )}
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
                {sources.blobs.sources.map((blob: any) => {
                  const isTransferred = blob.state === "Transferred" || blob.state === "Consumed";
                  return (
                    <div
                      key={blob.name}
                      className="flex items-center justify-between p-3.5 rounded-lg bg-white/50 border border-slate-200/40"
                    >
                      <div className="space-y-1">
                        <span className="block font-semibold text-sm text-slate-700">{blob.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">
                            Size: {(blob.size / 1024 / 1024).toFixed(2)} MB • {new Date(blob.lastModified).toLocaleDateString()}
                          </span>
                          <span
                            className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isTransferred
                                ? "text-emerald-700 bg-emerald-50 border-emerald-200/30"
                                : "text-slate-500 bg-slate-50 border-slate-200/50"
                            }`}
                          >
                            {blob.state || "Uploaded"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isTransferred && (
                          <button
                            onClick={() => handleConsume(blob.name, true)}
                            className="flex items-center gap-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 hover:opacity-95 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-all shadow-sm shadow-indigo-500/10"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            Consume
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteConfirm({ name: blob.name, isBlob: true })}
                          className="flex items-center justify-center p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors shadow-sm"
                          title="Delete Source"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
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
                {sources.files.sources.map((file: any) => {
                  const isTransferred = file.state === "Transferred" || file.state === "Consumed";
                  return (
                    <div
                      key={file.name}
                      className="flex items-center justify-between p-3.5 rounded-lg bg-white/50 border border-slate-200/40"
                    >
                      <div className="space-y-1">
                        <span className="block font-semibold text-sm text-slate-700">{file.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">
                            Size: {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.lastModified).toLocaleDateString()}
                          </span>
                          <span
                            className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isTransferred
                                ? "text-emerald-700 bg-emerald-50 border-emerald-200/30"
                                : "text-slate-500 bg-slate-50 border-slate-200/50"
                            }`}
                          >
                            {file.state || "Uploaded"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isTransferred && (
                          <button
                            onClick={() => handleConsume(file.name, false)}
                            className="flex items-center gap-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 hover:opacity-95 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-all shadow-sm shadow-indigo-500/10"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            Consume
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteConfirm({ name: file.name, isBlob: false })}
                          className="flex items-center justify-center p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors shadow-sm"
                          title="Delete Source"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/50 space-y-6 transform scale-100 transition-transform">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Delete Source Package</h3>
                <p className="text-sm text-slate-500">
                  Are you sure you want to permanently delete the {deleteConfirm.isBlob ? "blob" : "file"} source <strong className="text-slate-800 break-all">"{deleteConfirm.name}"</strong>? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const { name, isBlob } = deleteConfirm;
                  setDeleteConfirm(null);
                  await proceedDelete(name, isBlob);
                }}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-sm shadow-rose-600/10"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
