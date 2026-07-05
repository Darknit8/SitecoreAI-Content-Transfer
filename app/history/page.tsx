"use client";

import React, { useState, useEffect } from "react";
import { History, Calendar, CheckCircle2, XCircle, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle, Shield, AlertCircle } from "lucide-react";
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
export default function HistoryPage() {
  const [historyData, setHistoryData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [destEnv, setDestEnv] = useState("QA");
  const [environments, setEnvironments] = useState<any>(null);

  // Production auth gate
  const [pendingEnv, setPendingEnv] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [prevEnv, setPrevEnv] = useState("QA");
  const [verifiedPassword, setVerifiedPassword] = useState("");
  const [verifying, setVerifying] = useState(false);

  const fetchHistory = (pageNumber: number, envName = destEnv, password = verifiedPassword) => {
    setLoading(true);
    setErrorMessage(null);
    fetch(`/api/destination?action=history&page=${pageNumber}&size=15&env=${envName}`, {
      headers: {
        "x-auth-password": password
      }
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then(d => { throw new Error(d.error || "Failed to load history") });
        }
        return res.json();
      })
      .then((data) => {
        setHistoryData(data);
        setPage(pageNumber);
        setLoading(false);
      })
      .catch((err) => {
        setErrorMessage(err.message);
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
      .catch(() => {});

    if (savedDest === "Production") {
      setPendingEnv("Production");
    } else {
      fetchHistory(1, savedDest);
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
      fetchHistory(1, value, "");
    }
  };

  const handleAuthConfirm = (password: string) => {
    setVerifying(true);
    setAuthError(null);
    const target = pendingEnv || "Production";

    fetch(`/api/destination?action=history&page=1&size=15&env=${target}`, {
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
        setHistoryData(data);
        setPage(1);
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
    fetchHistory(1, prevEnv, "");
  };

  const totalPages = historyData ? Math.ceil(historyData.totalCount / 15) || 1 : 1;
  const records = historyData && Array.isArray(historyData.records) ? historyData.records : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
            Transfer Ingestion History
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Complete transition logs of all consumed data sources across databases.
          </p>
        </div>

        <button
          onClick={() => fetchHistory(page, destEnv)}
          className="flex items-center justify-center w-10 h-10 border border-slate-200/50 bg-white/70 rounded-lg hover:bg-white transition-all text-slate-500 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
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

      {/* Error alert banner */}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <span className="font-semibold block">Configuration Error</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      <div className="glow-card rounded-xl overflow-hidden bg-white/80">
        <div className="p-4 border-b border-slate-200/50 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-2 text-slate-700">
            <History className="w-4 h-4 text-indigo-500" />
            Ingestion Audits
          </h2>
          <span className="text-xs text-slate-400 font-semibold uppercase">
            Total logs: {historyData?.totalCount || 0}
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Loading historical records...</div>
        ) : errorMessage ? (
          <div className="py-20 text-center text-slate-400 text-sm italic">Could not load audits due to configuration state.</div>
        ) : records.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">No historical records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs text-slate-400 uppercase bg-slate-50 border-b border-slate-200/40">
                <tr>
                  <th className="px-6 py-3 font-semibold">Log ID</th>
                  <th className="px-6 py-3 font-semibold">Source Package</th>
                  <th className="px-6 py-3 font-semibold">Target DB</th>
                  <th className="px-6 py-3 font-semibold">Ingestion State</th>
                  <th className="px-6 py-3 font-semibold">Finished Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60">
                {records.map((rec: any) => (
                  <tr key={rec.id} className="hover:bg-white/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {rec.id.length > 18 ? `${rec.id.substring(0, 15)}...` : rec.id}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">{rec.sourceName}</td>
                    <td className="px-6 py-4 text-slate-500">{rec.databaseName}</td>
                    <td className="px-6 py-4">
                      {rec.state === "Completed" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-55 border border-emerald-250/20 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-rose-700 font-semibold bg-rose-55 border border-rose-250/20 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(rec.consumeDate).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100/60 flex items-center justify-between text-xs text-slate-450">
                <span>
                  Showing page {page} of {totalPages}
                </span>

                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => fetchHistory(page - 1)}
                    className="flex items-center justify-center p-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => fetchHistory(page + 1)}
                    className="flex items-center justify-center p-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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
