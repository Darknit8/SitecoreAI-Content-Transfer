"use client";

import React, { useState, useEffect } from "react";
import { History, Calendar, CheckCircle2, XCircle, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle } from "lucide-react";

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchHistory = (pageNumber: number) => {
    setLoading(true);
    setErrorMessage(null);
    fetch(`/api/destination?action=history&page=${pageNumber}&size=15`)
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
    fetchHistory(1);
  }, []);

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
          onClick={() => fetchHistory(page)}
          className="flex items-center justify-center w-10 h-10 border border-slate-200/50 bg-white/70 rounded-lg hover:bg-white transition-all text-slate-500 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
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
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-rose-700 font-semibold bg-rose-50 border border-rose-200/50 px-2 py-0.5 rounded-full">
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
    </div>
  );
}
