"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, ShieldAlert, KeyRound, Terminal, RefreshCw } from "lucide-react";

export default function SettingsPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = () => {
    setLoading(true);
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const isConfigured = (env: any) => {
    return env && env.host && env.clientId && env.clientSecret;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
            Environment Settings
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Review the status of the environment credentials loaded via system environment variables.
          </p>
        </div>

        <button
          onClick={loadSettings}
          className="flex items-center justify-center w-10 h-10 border border-slate-200/50 bg-white/70 rounded-lg hover:bg-white transition-all text-slate-500 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Dev */}
            <div className="glow-card p-6 rounded-xl space-y-4 bg-white/70">
              <h2 className="text-lg font-bold flex items-center justify-between border-b border-slate-200/50 pb-3 text-slate-800">
                <span className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-indigo-500" />
                  Dev Environment
                </span>
                {isConfigured(config?.dev) ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-bold animate-pulse">
                    <ShieldAlert className="w-3 h-3" />
                    Missing
                  </span>
                )}
              </h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-slate-100 py-1.5">
                  <span className="text-slate-400 font-semibold uppercase text-xs">Host Name</span>
                  <span className="text-slate-700 font-medium break-all">{config?.dev?.host || "Not Loaded"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 py-1.5">
                  <span className="text-slate-400 font-semibold uppercase text-xs">Client ID</span>
                  <span className="text-slate-700 font-medium">{config?.dev?.clientId || "Not Loaded"}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400 font-semibold uppercase text-xs">Client Secret</span>
                  <span className="text-slate-700 font-medium">{config?.dev?.clientSecret || "Not Loaded"}</span>
                </div>
              </div>
            </div>

            {/* QA */}
            <div className="glow-card p-6 rounded-xl space-y-4 bg-white/70">
              <h2 className="text-lg font-bold flex items-center justify-between border-b border-slate-200/50 pb-3 text-slate-800">
                <span className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-indigo-500" />
                  QA Environment
                </span>
                {isConfigured(config?.qa) ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-bold animate-pulse">
                    <ShieldAlert className="w-3 h-3" />
                    Missing
                  </span>
                )}
              </h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-slate-100 py-1.5">
                  <span className="text-slate-400 font-semibold uppercase text-xs">Host Name</span>
                  <span className="text-slate-700 font-medium break-all">{config?.qa?.host || "Not Loaded"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 py-1.5">
                  <span className="text-slate-400 font-semibold uppercase text-xs">Client ID</span>
                  <span className="text-slate-700 font-medium">{config?.qa?.clientId || "Not Loaded"}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400 font-semibold uppercase text-xs">Client Secret</span>
                  <span className="text-slate-700 font-medium">{config?.qa?.clientSecret || "Not Loaded"}</span>
                </div>
              </div>
            </div>

            {/* UAT */}
            <div className="glow-card p-6 rounded-xl space-y-4 bg-white/70">
              <h2 className="text-lg font-bold flex items-center justify-between border-b border-slate-200/50 pb-3 text-slate-800">
                <span className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-indigo-500" />
                  UAT Environment
                </span>
                {isConfigured(config?.uat) ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-bold animate-pulse">
                    <ShieldAlert className="w-3 h-3" />
                    Missing
                  </span>
                )}
              </h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-slate-100 py-1.5">
                  <span className="text-slate-400 font-semibold uppercase text-xs">Host Name</span>
                  <span className="text-slate-700 font-medium break-all">{config?.uat?.host || "Not Loaded"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 py-1.5">
                  <span className="text-slate-400 font-semibold uppercase text-xs">Client ID</span>
                  <span className="text-slate-700 font-medium">{config?.uat?.clientId || "Not Loaded"}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400 font-semibold uppercase text-xs">Client Secret</span>
                  <span className="text-slate-700 font-medium">{config?.uat?.clientSecret || "Not Loaded"}</span>
                </div>
              </div>
            </div>

            {/* Production */}
            <div className="glow-card p-6 rounded-xl space-y-4 bg-white/70">
              <h2 className="text-lg font-bold flex items-center justify-between border-b border-slate-200/50 pb-3 text-slate-800">
                <span className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-indigo-500" />
                  Production Environment
                </span>
                {isConfigured(config?.production) ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-bold animate-pulse">
                    <ShieldAlert className="w-3 h-3" />
                    Missing
                  </span>
                )}
              </h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-slate-100 py-1.5">
                  <span className="text-slate-400 font-semibold uppercase text-xs">Host Name</span>
                  <span className="text-slate-700 font-medium break-all">{config?.production?.host || "Not Loaded"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 py-1.5">
                  <span className="text-slate-400 font-semibold uppercase text-xs">Client ID</span>
                  <span className="text-slate-700 font-medium">{config?.production?.clientId || "Not Loaded"}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400 font-semibold uppercase text-xs">Client Secret</span>
                  <span className="text-slate-700 font-medium">{config?.production?.clientSecret || "Not Loaded"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Guide Card */}
          <div className="glow-card p-6 rounded-xl bg-white/80 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b border-slate-200/50 pb-3 text-slate-800">
              <Terminal className="w-5 h-5 text-indigo-500" />
              How to Configure Environment Settings
            </h2>
            <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
              <p>
                Credentials are loaded securely using system environment variables. Next.js automatically loads these from a **`.env.local`** file in your project root during development.
              </p>
              <p>
                Create a file named **`.env.local`** in the root workspace folder:
              </p>
              <pre className="bg-slate-900 p-4 rounded-lg text-xs font-mono text-slate-250 overflow-x-auto select-all leading-normal">
{`# Dev Environment Settings
SCT_DEV_HOST=cm.dev.sitecorecloud.io
SCT_DEV_CLIENT_ID=your-dev-client-id
SCT_DEV_CLIENT_SECRET=your-dev-client-secret

# QA Environment Settings
SCT_QA_HOST=cm.qa.sitecorecloud.io
SCT_QA_CLIENT_ID=your-qa-client-id
SCT_QA_CLIENT_SECRET=your-qa-client-secret

# UAT Environment Settings
SCT_UAT_HOST=cm.uat.sitecorecloud.io
SCT_UAT_CLIENT_ID=your-uat-client-id
SCT_UAT_CLIENT_SECRET=your-uat-client-secret

# Production Environment Settings
SCT_PRODUCTION_HOST=cm.prod.sitecorecloud.io
SCT_PRODUCTION_CLIENT_ID=your-production-client-id
SCT_PRODUCTION_CLIENT_SECRET=your-production-client-secret`}
              </pre>
              <p className="text-xs text-slate-400 font-medium">
                * Note: After editing `.env.local`, you will need to restart the Node.js server (`npm run dev`) for the changes to take effect.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
