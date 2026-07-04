import React from "react";
import Sidebar from "./components/Sidebar";
import "./globals.css";

export const metadata = {
  title: "Sitecore Content Transfer Console",
  description: "Web dashboard for managing and orchestrating SitecoreAI migrations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen mesh-bg text-slate-800">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Main Content Pane */}
        <main className="flex-1 pl-64 min-h-screen relative">
          <div className="p-8 max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
