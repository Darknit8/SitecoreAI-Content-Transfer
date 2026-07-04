"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, Terminal, XCircle, ArrowLeft } from "lucide-react";

export default function TransferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const transferId = params.id as string;

  const [state, setState] = useState<"running" | "completed" | "failed" | "cancelled">("running");
  const [events, setEvents] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [processedItems, setProcessedItems] = useState(0);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [streamingProgress, setStreamingProgress] = useState({ current: 0, total: 0 });
  const [importingProgress, setImportingProgress] = useState({ current: 0, total: 0 });

  const logEndRef = useRef<HTMLDivElement>(null);

  // Setup EventSource with a robust Polling Fallback
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;
    let sseActive = false;

    // Helper to process individual event transitions
    const handleEvent = (event: any) => {
      if (event.type === "transfer:created") {
        setCurrentStep(2);
      } else if (event.type === "transfer:ready") {
        setCurrentStep(3);
        setTotalItems(event.totalItems);
        const totalChunks = event.chunkSets.reduce((sum: number, cs: any) => sum + cs.chunkCount, 0);
        setStreamingProgress((prev) => ({ ...prev, total: totalChunks }));
      } else if (event.type === "chunk:transferred") {
        setStreamingProgress((prev) => ({ ...prev, current: prev.current + 1 }));
      } else if (event.type === "consume:started") {
        setCurrentStep(4);
      } else if (event.type === "consume:polling") {
        setImportingProgress({
          current: event.processedItems,
          total: event.totalItems || totalItems,
        });
      } else if (event.type === "consume:completed") {
        setImportingProgress({
          current: event.processedItems,
          total: event.processedItems || totalItems,
        });
      } else if (event.type === "transfer:complete") {
        setCurrentStep(5);
        setState("completed");
        setProcessedItems(event.summary.totalItemsTransferred);
        setImportingProgress({
          current: event.summary.totalItemsTransferred,
          total: event.summary.totalItemsTransferred,
        });
      } else if (event.type === "transfer:error") {
        setState("failed");
      }
    };

    // 1. Try EventSource (SSE)
    try {
      eventSource = new EventSource(`/api/transfer?id=${transferId}&sse=true`);

      eventSource.onmessage = (e) => {
        sseActive = true;
        try {
          const event = JSON.parse(e.data);
          
          // Deduplicate events in visual list
          setEvents((prev) => {
            if (prev.some((existing) => existing.timestamp === event.timestamp && existing.type === event.type)) {
              return prev;
            }
            return [...prev, event];
          });

          handleEvent(event);

          if (event.type === "transfer:complete" || event.type === "transfer:error") {
            if (eventSource) eventSource.close();
            if (fallbackInterval) clearInterval(fallbackInterval);
          }
        } catch (err) {
          console.error("Error parsing SSE event:", err);
        }
      };

      eventSource.onerror = () => {
        // SSE closed or errored, let the polling fallback run
        if (eventSource) eventSource.close();
      };
    } catch (err) {
      console.error("SSE connection error:", err);
    }

    // 2. Setup Polling Fallback (Runs if SSE is blocked, buffered, or failed)
    fallbackInterval = setInterval(() => {
      if (!sseActive) {
        fetch(`/api/transfer?id=${transferId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data && data.events) {
              setEvents(data.events);

              if (data.state === "completed") {
                setState("completed");
                setCurrentStep(5);
                clearInterval(fallbackInterval!);
              } else if (data.state === "failed") {
                setState("failed");
                clearInterval(fallbackInterval!);
              }

              // Replay/update progress parameters
              data.events.forEach((ev: any) => handleEvent(ev));
            }
          })
          .catch((err) => console.error("Status polling failed:", err));
      }
    }, 1500);

    return () => {
      if (eventSource) eventSource.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [transferId, totalItems]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to abort this content migration?")) return;
    
    try {
      const res = await fetch(`/api/transfer?id=${transferId}`, { method: "DELETE" });
      if (res.ok) {
        setState("cancelled");
        setCurrentStep(0);
      }
    } catch (_) {}
  };

  const steps = [
    { num: 1, label: "Initialization" },
    { num: 2, label: "Packaging" },
    { num: 3, label: "Chunk Streaming" },
    { num: 4, label: "Destination Import" },
    { num: 5, label: "Verification" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/")} className="text-slate-400 hover:text-slate-655 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Migration Live Monitor</h1>
            <p className="text-xs text-slate-400">ID: {transferId}</p>
          </div>
        </div>

        {state === "running" && (
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 border border-rose-200 bg-rose-50 text-rose-600 text-xs px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors font-semibold"
          >
            <XCircle className="w-3.5 h-3.5" />
            Abort Run
          </button>
        )}
      </div>

      {/* Wizard timeline */}
      <div className="glow-card p-6 rounded-xl bg-white/80">
        <div className="flex justify-between items-center relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200/50 -translate-y-1/2 z-0"></div>
          {steps.map((s) => {
            const isCompleted = currentStep > s.num || state === "completed";
            const isActive = currentStep === s.num && state === "running";
            
            return (
              <div key={s.num} className="flex flex-col items-center z-10 space-y-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    isCompleted
                      ? "bg-emerald-600 text-white shadow-sm"
                      : isActive
                      ? "bg-indigo-500 text-white border-2 border-white animate-pulse shadow-md"
                      : "bg-slate-100 text-slate-400 border border-slate-200/70"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                </div>
                <span
                  className={`text-xs font-bold ${
                    isActive ? "text-indigo-600" : isCompleted ? "text-emerald-600" : "text-slate-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pipeline metrics */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="glow-card p-6 rounded-xl md:col-span-2 space-y-6 bg-white/80">
          <h2 className="text-lg font-bold text-slate-800">Pipeline Workloads</h2>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">Stream Chunks (Source ➜ Dest)</span>
              <span className="font-bold text-slate-700">
                {streamingProgress.current} / {streamingProgress.total} Chunks
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{
                  width: `${(streamingProgress.current / (streamingProgress.total || 1)) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">Destination DB Import</span>
              <span className="font-bold text-slate-700">
                {importingProgress.current} / {importingProgress.total || totalItems || "?"} Items
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{
                  width: `${
                    (importingProgress.current / (importingProgress.total || totalItems || 1)) * 100
                  }%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* State details */}
        <div className="glow-card p-6 rounded-xl bg-white/80 flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-slate-400 text-xs font-semibold uppercase">Pipeline Status</span>
            
            {state === "running" && (
              <div className="flex items-center gap-3 text-amber-600 font-bold text-lg">
                <div className="w-3.5 h-3.5 rounded-full bg-amber-500 animate-ping"></div>
                Syncing Environment Data
              </div>
            )}
            {state === "completed" && (
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-lg">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                Completed
              </div>
            )}
            {state === "failed" && (
              <div className="flex items-center gap-2 text-rose-600 font-bold text-lg">
                <AlertCircle className="w-6 h-6 text-rose-600" />
                Execution Failed
              </div>
            )}
            {state === "cancelled" && (
              <div className="flex items-center gap-2 text-slate-500 font-bold text-lg">
                <XCircle className="w-6 h-6 text-slate-400" />
                Pipeline Aborted
              </div>
            )}

            <div className="text-xs space-y-1 text-slate-500">
              <div>Total items packaged: <span className="text-slate-800 font-medium">{totalItems || "Calculating..."}</span></div>
              {state === "completed" && (
                <div>Total items imported: <span className="text-slate-800 font-medium">{processedItems}</span></div>
              )}
            </div>
          </div>

          {state === "completed" && (
            <button
              onClick={() => router.push("/history")}
              className="mt-6 w-full text-center bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold py-2 rounded-lg transition-all border border-slate-200/60"
            >
              View Ingestion Audit Log
            </button>
          )}
        </div>
      </div>

      {/* Terminal log widget */}
      <div className="glow-card rounded-xl overflow-hidden flex flex-col bg-white/80">
        <div className="bg-slate-50/50 px-4 py-3 border-b border-slate-200/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Terminal className="w-4 h-4 text-indigo-500" />
            Execution Pipeline Events
          </div>
        </div>

        <div className="bg-slate-900 p-4 h-64 overflow-y-auto font-mono text-xs text-slate-300 space-y-2">
          {events.length === 0 && (
            <div className="text-slate-500 italic">Waiting for event stream connectivity...</div>
          )}
          {events.map((e, idx) => (
            <div key={idx} className="flex gap-4">
              <span className="text-slate-500">{new Date(e.timestamp).toLocaleTimeString()}</span>
              {e.type === "transfer:created" && (
                <span className="text-cyan-400">Initialized content transfer operation.</span>
              )}
              {e.type === "transfer:polling" && (
                <span className="text-slate-400">Source server packing content assets... State: {e.state}</span>
              )}
              {e.type === "transfer:ready" && (
                <span className="text-emerald-400 font-semibold">Source packaging complete. Discovered {e.chunkSets.length} chunkset(s).</span>
              )}
              {e.type === "chunk:fetching" && (
                <span className="text-slate-400">Streaming chunk {e.chunkId} of chunkset {e.chunkSetId}...</span>
              )}
              {e.type === "chunk:transferred" && (
                <span className="text-slate-400">Transferred chunk {e.chunkId} (Processed: {e.itemsProcessed}, Skipped: {e.itemsSkipped})</span>
              )}
              {e.type === "chunkset:completed" && (
                <span className="text-emerald-400">Chunkset complete. Created destination .raif: {e.raifFileName}</span>
              )}
              {e.type === "cleanup:done" && (
                <span className="text-slate-550">Source side workspace cleanup completed.</span>
              )}
              {e.type === "consume:started" && (
                <span className="text-amber-400 font-semibold">Began import process for file: {e.raifFileName} into database '{e.database}'</span>
              )}
              {e.type === "consume:polling" && (
                <span className="text-slate-400">Import in progress. State: {e.state} (Processed items: {e.processedItems})</span>
              )}
              {e.type === "consume:completed" && (
                <span className="text-emerald-400 font-semibold">Import complete! Items Processed: {e.processedItems}, Failures: {e.failedItems}</span>
              )}
              {e.type === "transfer:complete" && (
                <span className="text-emerald-400 font-bold">Migration pipeline finished! Successfully imported {e.summary.totalItemsTransferred} items.</span>
              )}
              {e.type === "transfer:error" && (
                <span className="text-rose-400 font-bold">Error in phase '{e.phase}': {e.error.message}</span>
              )}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
}
