"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, ShieldAlert, KeyRound, Terminal, RefreshCw, Play, Edit3, Info } from "lucide-react";

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
          {/* Guide Section */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Guide Card 1: Running the Application */}
            <div className="glow-card p-6 rounded-xl bg-white/80 space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2 border-b border-slate-200/50 pb-3 text-slate-800">
                <Play className="w-5 h-5 text-emerald-500" />
                How to Run the Application
              </h2>
              <div className="text-sm text-slate-600 space-y-4 leading-relaxed max-h-[440px] overflow-y-auto pr-1">
                <div>
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-1">1. Clone GitHub Repository</h3>
                  <p className="text-xs text-slate-500 mb-2">Clone the source code repository from GitHub and navigate into it:</p>
                  <pre className="bg-slate-900 p-3 rounded-lg text-[11px] font-mono text-slate-100 whitespace-pre-wrap select-all">
{`git clone https://github.com/Darknit8/SitecoreAI-Content-Transfer.git
cd SitecoreAI-Content-Transfer`}
                  </pre>
                </div>
                <div>
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-1">2. Create Environment Variable File</h3>
                  <p className="text-xs text-slate-500 mb-2">Create a new file named <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono font-semibold text-indigo-700">.env.local</code> in the root folder of the project. Fill it with the variables shown in the configuration panel on the right.</p>
                </div>
                <div>
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-1">3. Install Dependencies</h3>
                  <p className="text-xs text-slate-500 mb-2">Install all project dependencies using npm:</p>
                  <pre className="bg-slate-900 p-3 rounded-lg text-xs font-mono text-slate-100 whitespace-pre-wrap select-all">
{`npm install`}
                  </pre>
                </div>
                <div>
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-1">4. Start Development Server</h3>
                  <p className="text-xs text-slate-500 mb-2">Launch the Next.js server locally in development mode:</p>
                  <pre className="bg-slate-900 p-3 rounded-lg text-xs font-mono text-slate-100 whitespace-pre-wrap select-all">
{`npm run dev`}
                  </pre>
                  <p className="text-xs text-indigo-500 mt-1.5 font-semibold">
                    ➜ Server will run on: <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-650 transition-colors">http://localhost:3000</a>
                  </p>
                </div>
              </div>
            </div>

            {/* Guide Card 2: Configuring/Updating Environment Variables */}
            <div className="glow-card p-6 rounded-xl bg-white/80 space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2 border-b border-slate-200/50 pb-3 text-slate-800">
                <Edit3 className="w-5 h-5 text-indigo-500" />
                How to Update Environment Variables
              </h2>
              <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                <p>
                  Credentials are loaded securely using system environment variables. Next.js automatically loads these from a <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono font-semibold text-indigo-700">.env.local</code> file in your project root during development.
                </p>
                <div className="bg-amber-50/70 border border-amber-200/30 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Server Restart Required:</strong> Because Next.js loads environment variables only at startup, you <strong className="font-bold">must restart the server</strong> (press <kbd className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px] border border-amber-200">Ctrl + C</kbd> in your terminal, and run <code className="font-mono text-xs">npm run dev</code> again) after modifying <code className="font-mono text-xs">.env.local</code>.
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-500 mb-1.5">Example `.env.local` contents:</span>
                  <pre className="bg-slate-900 p-4 pb-6 rounded-lg text-xs font-mono text-slate-100 whitespace-pre-wrap select-all max-h-[260px] overflow-y-auto leading-normal">
{`# Dev Environment Settings
SCT_DEV_HOST=xmc-source.mock
SCT_DEV_CLIENT_ID=mock-source-client-id
SCT_DEV_CLIENT_SECRET=mock-source-client-secret

# QA Environment Settings
SCT_QA_HOST=xmc-dest.mock
SCT_QA_CLIENT_ID=mock-dest-client-id
SCT_QA_CLIENT_SECRET=mock-dest-client-secret

# UAT Environment Settings
SCT_UAT_HOST=uat.mock
SCT_UAT_CLIENT_ID=mock-uat-client-id
SCT_UAT_CLIENT_SECRET=mock-uat-client-secret

# Production Environment Settings
SCT_PRODUCTION_HOST=production.mock
SCT_PRODUCTION_CLIENT_ID=mock-production-client-id
SCT_PRODUCTION_CLIENT_SECRET=mock-production-client-secret

# High-Risk Operations Authorization Password
SCT_ADMIN_PASSWORD=admin

# Standard Operations Authorization Password
SCT_STANDARD_PASSWORD=admin1`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

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
        </div>
      )}
    </div>
  );
}
