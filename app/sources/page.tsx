"use client";

import React, { useState, useEffect } from "react";
import { Database, FolderOpen, Play, CheckCircle2, AlertCircle, RefreshCw, Trash2, Shield } from "lucide-react";
import { CustomSelect } from "../components/CustomSelect";

// ── Auth Modal ─────────────────────────────────────────────────────────────
function ProductionAuthModal({
  onConfirm,
  onCancel,
  error,
  verifying,
}: {
  onConfirm: (password: string) => void;
  onCancel: () => void;
  error: string | null;
  verifying: boolean;
}) {
  const [password, setPassword] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/50 space-y-5 transform scale-100 transition-transform">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl flex-shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">Production Authorization Required</h3>
            <p className="text-sm text-slate-500">
              An admin password is required to authorize read/write access to the <strong className="text-rose-600">Production</strong> environment.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-500 uppercase">Admin Authorization Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && password && !verifying && onConfirm(password)}
            placeholder="Enter admin password"
            className="w-full bg-white border border-slate-200 focus:border-rose-400 focus:ring-1 focus:ring-rose-400 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none transition-all shadow-sm"
            autoFocus
            disabled={verifying}
          />
        </div>

        <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onCancel}
            disabled={verifying}
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(password)}
            disabled={!password || verifying}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white transition-all shadow-sm"
          >
            {verifying ? "Verifying..." : "Authorize"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function SourcesPage() {
  const [sources, setSources] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ name: string; isBlob: boolean } | null>(null);
  const [destEnv, setDestEnv] = useState("QA");
  const [environments, setEnvironments] = useState<any>(null);

  // Production auth gate state
  const [pendingEnv, setPendingEnv] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [prevEnv, setPrevEnv] = useState("QA");
  const [verifiedPassword, setVerifiedPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [consumeConfirm, setConsumeConfirm] = useState<{ name: string; isBlob: boolean } | null>(null);
  const [consumePassword, setConsumePassword] = useState("");
  const [consumeError, setConsumeError] = useState<string | null>(null);
  const [consuming, setConsuming] = useState(false);
  const [retryConfirm, setRetryConfirm] = useState(false);
  const [retryPassword, setRetryPassword] = useState("");
  const [retryError, setRetryError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);


  const fetchSources = (envName = destEnv, password = verifiedPassword) => {
    setLoading(true);
    fetch(`/api/destination?action=sources&env=${envName}`, {
      headers: {
        "x-auth-password": password
      }
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then(d => { throw new Error(d.error || "Failed to load sources") });
        }
        return res.json();
      })
      .then((data) => {
        setSources(data);
        setLoading(false);
      })
      .catch((err) => {
        setStatus({ type: "error", message: err.message });
        setLoading(false);
      });
  };

  useEffect(() => {
    const savedDest = localStorage.getItem("sct_dest_env") || "QA";
    setDestEnv(savedDest);
    setPrevEnv(savedDest);

    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setEnvironments(data))
      .catch(() => { });

    if (savedDest === "Production") {
      setPendingEnv("Production");
    } else {
      fetchSources(savedDest);
    }
  }, []);

  const handleEnvChange = (value: string) => {
    if (value === "Production") {
      setPrevEnv(destEnv);
      setPendingEnv(value);
      setAuthError(null);
    } else {
      setDestEnv(value);
      setVerifiedPassword("");
      localStorage.setItem("sct_dest_env", value);
      fetchSources(value, "");
    }
  };

  const handleAuthConfirm = (password: string) => {
    setVerifying(true);
    setAuthError(null);
    const target = pendingEnv || "Production";

    fetch(`/api/destination?action=sources&env=${target}`, {
      headers: {
        "x-auth-password": password
      }
    })
      .then(async (res) => {
        if (!res.ok) {
          const d = await res.json().catch(() => ({ error: "Invalid password" }));
          throw new Error(d.error || "Invalid password");
        }
        return res.json();
      })
      .then((data) => {
        setSources(data);
        setDestEnv(target);
        setPrevEnv(target);
        localStorage.setItem("sct_dest_env", target);
        setVerifiedPassword(password);
        setPendingEnv(null);
        setAuthError(null);
        setVerifying(false);
        setLoading(false);
      })
      .catch((err) => {
        setAuthError(err.message || "Invalid authorization password.");
        setVerifying(false);
      });
  };

  const handleAuthCancel = () => {
    setPendingEnv(null);
    setAuthError(null);
    setDestEnv(prevEnv);
    fetchSources(prevEnv, "");
  };

  const handleConsume = async (name: string, isBlob: boolean, passwordToUse: string) => {
    setConsumeError(null);
    setConsuming(true);
    try {
      const res = await fetch(`/api/destination?action=consume&env=${destEnv}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-auth-password": passwordToUse
        },
        body: JSON.stringify({
          [isBlob ? "blobName" : "fileName"]: name,
          database: "master",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: "success", message: `Ingestion scheduled successfully for ${name}.` });
        if (destEnv === "Production") {
          setVerifiedPassword(passwordToUse);
        }
        setConsumeConfirm(null);
        setConsumePassword("");
        fetchSources(destEnv, passwordToUse);
      } else {
        throw new Error(data.error || "Failed to trigger ingestion.");
      }
    } catch (err) {
      setConsumeError((err as Error).message);
    } finally {
      setConsuming(false);
    }
  };

  const proceedDelete = async (name: string, isBlob: boolean, passwordToUse: string) => {
    setDeleteError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/destination?action=${isBlob ? "blob" : "file"}&name=${encodeURIComponent(name)}&env=${destEnv}`, {
        method: "DELETE",
        headers: {
          "x-auth-password": passwordToUse
        }
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: "success", message: `Successfully deleted ${name}.` });
        if (destEnv === "Production") {
          setVerifiedPassword(passwordToUse);
        }
        setDeleteConfirm(null);
        setDeletePassword("");
        fetchSources(destEnv, passwordToUse);
      } else {
        throw new Error(data.error || "Failed to delete source.");
      }
    } catch (err) {
      setDeleteError((err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const handleRetryAll = async (passwordToUse: string) => {
    setRetryError(null);
    setRetrying(true);
    try {
      const res = await fetch(`/api/destination?action=retry&env=${destEnv}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-auth-password": passwordToUse
        },
        body: JSON.stringify({ database: "master" }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: "success", message: `Retry triggered: ${data.message || "scheduled."}` });
        if (destEnv === "Production") {
          setVerifiedPassword(passwordToUse);
        }
        setRetryConfirm(false);
        setRetryPassword("");
      } else {
        throw new Error(data.error || "Failed to trigger retry.");
      }
    } catch (err) {
      setRetryError((err as Error).message);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
            Blob &amp; File Sources
          </h1>
          <p className="text-slate-500 text-sm">
            Browse and consume transfer files (.raif) currently located on the destination filesystem or Azure Blob storage.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              setRetryConfirm(true);
              setRetryPassword(verifiedPassword || "");
            }}
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
      <div className={`flex items-center gap-3 border p-3.5 rounded-xl shadow-sm text-sm transition-colors ${destEnv === "Production" ? "bg-rose-50/60 border-rose-200/50" : "bg-white/60 border-slate-200/50"}`}>
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
        {destEnv === "Production" && (
          <span className="ml-auto flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200/50 px-2.5 py-1 rounded-full animate-pulse">
            <Shield className="w-3 h-3" />
            Production — admin authorized
          </span>
        )}
      </div>

      {status && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg border text-sm ${status.type === "success"
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
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg bg-white/50 border border-slate-200/40 gap-3 sm:gap-2"
                    >
                      <div className="space-y-1 min-w-0">
                        <span className="block font-semibold text-sm text-slate-700 break-all" title={blob.name}>
                          {blob.name}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-slate-400">
                            Size: {(blob.size / 1024 / 1024).toFixed(2)} MB • {new Date(blob.lastModified).toLocaleDateString()}
                          </span>
                          <span
                            className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${isTransferred
                              ? "text-emerald-700 bg-emerald-50 border-emerald-200/30"
                              : "text-slate-500 bg-slate-50 border-slate-200/50"
                              }`}
                          >
                            {blob.state || "Uploaded"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        {!isTransferred && (
                          <button
                            onClick={() => {
                              setConsumeConfirm({ name: blob.name, isBlob: true });
                              setConsumePassword(verifiedPassword || "");
                            }}
                            className="flex items-center gap-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 hover:opacity-95 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-all shadow-sm shadow-indigo-500/10"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            Consume
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setDeleteConfirm({ name: blob.name, isBlob: true });
                            setDeletePassword(verifiedPassword || "");
                          }}
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
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg bg-white/50 border border-slate-200/40 gap-3 sm:gap-2"
                    >
                      <div className="space-y-1 min-w-0">
                        <span className="block font-semibold text-sm text-slate-700 break-all" title={file.name}>
                          {file.name}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-slate-400">
                            Size: {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.lastModified).toLocaleDateString()}
                          </span>
                          <span
                            className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${isTransferred
                              ? "text-emerald-700 bg-emerald-50 border-emerald-200/30"
                              : "text-slate-500 bg-slate-50 border-slate-200/50"
                              }`}
                          >
                            {file.state || "Uploaded"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        {!isTransferred && (
                          <button
                            onClick={() => {
                              setConsumeConfirm({ name: file.name, isBlob: false });
                              setConsumePassword(verifiedPassword || "");
                            }}
                            className="flex items-center gap-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 hover:opacity-95 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-all shadow-sm shadow-indigo-500/10"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            Consume
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setDeleteConfirm({ name: file.name, isBlob: false });
                            setDeletePassword(verifiedPassword || "");
                          }}
                          className="flex items-center justify-center p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-650 hover:bg-rose-100 transition-colors shadow-sm"
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (deletePassword && !deleting) {
                const { name, isBlob } = deleteConfirm;
                proceedDelete(name, isBlob, deletePassword);
              }
            }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/50 space-y-6 transform scale-100 transition-transform"
          >
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

            {/* Error Message inside popup */}
            {deleteError && (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-xs font-semibold animate-pulse">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            {/* Password input for validation */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                {destEnv === "Production" ? "Admin Authorization Password" : "Standard Authorization Password"}
              </label>
              <input
                type="password"
                placeholder="Enter password to authorize deletion"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-550 focus:border-rose-550 outline-none transition-all font-mono"
                autoFocus
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirm(null);
                  setDeletePassword("");
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!deletePassword || deleting}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all shadow-sm shadow-rose-600/10 flex items-center gap-1.5"
              >
                {deleting && <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-white"></div>}
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Consume Confirmation Modal */}
      {consumeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (consumePassword && !consuming) {
                const { name, isBlob } = consumeConfirm;
                handleConsume(name, isBlob, consumePassword);
              }
            }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/50 space-y-6 transform scale-100 transition-transform"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-650 rounded-xl">
                <Database className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Ingest Source Package</h3>
                <p className="text-sm text-slate-500">
                  Are you sure you want to trigger database ingestion for the {consumeConfirm.isBlob ? "blob" : "file"} source <strong className="text-slate-800 break-all">"{consumeConfirm.name}"</strong>? This will install items into the destination database.
                </p>
              </div>
            </div>

            {/* Error Message inside popup */}
            {consumeError && (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-xs font-semibold animate-pulse">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{consumeError}</span>
              </div>
            )}

            {/* Password input for validation */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                {destEnv === "Production" ? "Admin Authorization Password" : "Standard Authorization Password"}
              </label>
              <input
                type="password"
                placeholder="Enter password to authorize ingestion"
                value={consumePassword}
                onChange={(e) => {
                  setConsumePassword(e.target.value);
                  setConsumeError(null);
                }}
                disabled={consuming}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono"
                autoFocus
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setConsumeConfirm(null);
                  setConsumePassword("");
                  setConsumeError(null);
                }}
                disabled={consuming}
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!consumePassword || consuming}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 text-white transition-all shadow-sm shadow-indigo-500/10 flex items-center gap-1.5"
              >
                {consuming && <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-white"></div>}
                {consuming ? "Ingesting..." : "Confirm Ingest"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Retry Confirmation Modal */}
      {retryConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (retryPassword && !retrying) {
                handleRetryAll(retryPassword);
              }
            }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/50 space-y-6 transform scale-100 transition-transform"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-650 rounded-xl">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Retry Failed Imports</h3>
                <p className="text-sm text-slate-500">
                  Are you sure you want to retry all failed import operations for the destination database <strong className="text-slate-800">"master"</strong>?
                </p>
              </div>
            </div>

            {/* Error Message inside popup */}
            {retryError && (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-xs font-semibold animate-pulse">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{retryError}</span>
              </div>
            )}

            {/* Password input for validation */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                {destEnv === "Production" ? "Admin Authorization Password" : "Standard Authorization Password"}
              </label>
              <input
                type="password"
                placeholder="Enter password to authorize retry"
                value={retryPassword}
                onChange={(e) => {
                  setRetryPassword(e.target.value);
                  setRetryError(null);
                }}
                disabled={retrying}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono"
                autoFocus
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setRetryConfirm(false);
                  setRetryPassword("");
                  setRetryError(null);
                }}
                disabled={retrying}
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!retryPassword || retrying}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 text-white transition-all shadow-sm shadow-indigo-500/10 flex items-center gap-1.5"
              >
                {retrying && <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-white"></div>}
                {retrying ? "Retrying..." : "Confirm Retry"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Production Auth Modal */}
      {pendingEnv === "Production" && (
        <ProductionAuthModal
          onConfirm={handleAuthConfirm}
          onCancel={handleAuthCancel}
          error={authError}
          verifying={verifying}
        />
      )}
    </div>
  );
}
