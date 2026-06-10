/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Shield, BarChart3, Smartphone, History, Database, 
  Sparkles, Cpu, Clock, Activity, CheckCircle, Wifi 
} from "lucide-react";

import DashboardAnalytics from "./components/DashboardAnalytics";
import AnalyzeMessage from "./components/AnalyzeMessage";
import AuditLedger from "./components/ScanHistory";
import DatasetManager from "./components/DatasetManager";
import { AnalyticsStats, ScanHistory } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "analyze" | "history" | "labs">("dashboard");
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AnalyticsStats>({
    totalScans: 0,
    safeCount: 0,
    suspiciousCount: 0,
    scamCount: 0,
    categoryDistribution: {},
    trendHistory: [],
    averageRiskScore: 0,
    threatIdentifiedRate: 0
  });
  const [history, setHistory] = useState<ScanHistory[]>([]);

  // Simulated live clock matching GMT telemetry criteria
  const [timeStr, setTimeStr] = useState("2026-06-10 17:47:28 UTC");

  useEffect(() => {
    // Dynamic countdown/clock tick
    const timer = setInterval(() => {
      const gmtDate = new Date();
      setTimeStr(gmtDate.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial system credentials and data logs
  const fetchData = async () => {
    setLoading(true);
    try {
      // Check backend health / gemini configuration status
      const healthRes = await fetch("/api/health");
      const health = await healthRes.json();
      setGeminiConfigured(health.isGeminiConfigured);

      // Fetch Stats
      const statsRes = await fetch("/api/stats");
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch History
      const histRes = await fetch("/api/history");
      const histData = await histRes.json();
      setHistory(histData);

    } catch (err) {
      console.error("Failed to fetch scamshield daemon telemetry stream:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAnalyzeMessage = async (payload: { text: string; type: string; enableGemini: boolean }) => {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Analyzer service connection lost.");
    }

    const data = await response.json();
    
    // Refresh stats and history in the background asynchronously
    fetchData();
    return data;
  };

  const handleDeleteHistoryItem = async (id: string) => {
    try {
      await fetch(`/api/history/${id}`, {
        method: "DELETE"
      });
      fetchData(); // reload
    } catch (err) {
      console.error("Failed to delete audit scan profile:", err);
    }
  };

  const handleClearHistory = async () => {
    try {
      await fetch("/api/history", {
        method: "DELETE"
      });
      fetchData(); // reload
    } catch (err) {
      console.error("Failed to purge ledger database:", err);
    }
  };

  const handleTrainLocalModel = async () => {
    const response = await fetch("/api/train", {
      method: "POST"
    });
    const stats = await response.json();
    return stats;
  };

  return (
    <div id="scamshield-app-canvas" className="min-h-screen bg-[#05070a] text-[#e0e2e5] flex flex-col font-sans select-none antialiased">
      
      {/* --- TOP HEADER NAVIGATION PANEL --- */}
      <header id="app-header-nav" className="bg-[#0d1117]/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-50 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo and project titles */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)] animate-pulse">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white uppercase">AI ScamShield</h1>
                <span className="text-[9px] font-mono font-bold bg-blue-600/20 text-blue-400 border border-blue-600/50 px-2 py-0.5 rounded tracking-wider uppercase">
                  V2.5 LITE
                </span>
              </div>
              <p className="text-[10px] text-blue-400 font-mono tracking-widest uppercase">
                Scam Call & Fraud Message Analyzer
              </p>
            </div>
          </div>

          {/* Right network statuses and time logs stream */}
          <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
            {/* Live GMT telemetry clock */}
            <div id="live-telemetry-clock" className="bg-white/5 border border-white/10 px-3 py-1.5 rounded flex items-center gap-1.5 text-gray-300">
              <Clock className="h-3.5 w-3.5 text-blue-400 animate-spin-slow" />
              <span>{timeStr}</span>
            </div>

            {/* AI brain configuration indicator */}
            <div id="ai-agent-status-badge" className={`px-3 py-1.5 rounded border flex items-center gap-1.5 ${
              geminiConfigured 
                ? "bg-blue-600/20 border-blue-600/50 text-blue-400" 
                : "bg-white/5 border border-white/10 text-gray-400"
            }`}>
              <Cpu className="h-3.5 w-3.5" />
              <span>{geminiConfigured ? "EXPERT AI: ON" : "EDGE ML ONLY"}</span>
            </div>

            {/* General network ping online flag */}
            <div id="network-daemon-flag" className="bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-1.5 rounded flex items-center gap-1.5 animate-pulse">
              <Wifi className="h-3.5 w-3.5" />
              <span>DAEMON ONLINE</span>
            </div>
          </div>
        </div>
      </header>

      {/* --- MASTER SUB-NAVIGATION SHELF TABS LIST --- */}
      <div id="tabs-navigation-panel" className="bg-[#0b0f19]/60 border-b border-white/5 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto select-none sm:justify-start">
          {[
            { id: "dashboard", label: "Threat Analytics", icon: BarChart3 },
            { id: "analyze", label: "Audit Message Scanner", icon: Smartphone },
            { id: "history", label: "Ledger Registry", icon: History },
            { id: "labs", label: "Local ML Research Labs", icon: Database }
          ].map(tab => {
            const IconComp = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-1.5 text-xs font-semibold rounded flex items-center gap-2 transition-all duration-200 border ${
                  isSelected 
                    ? "bg-blue-600/20 border-blue-600/50 text-blue-400" 
                    : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                }`}
              >
                <IconComp className={`h-3.5 w-3.5 ${isSelected ? "text-blue-400" : "text-gray-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- MAIN CORE PANEL WORKSPACE DISPLAY --- */}
      <main id="main-app-content" className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        {activeTab === "dashboard" && (
          <DashboardAnalytics 
            id="analytics-dashboard-panel"
            stats={stats} 
            loading={loading} 
            onRefresh={fetchData} 
          />
        )}

        {activeTab === "analyze" && (
          <AnalyzeMessage 
            id="message-analyzer-panel"
            onAnalyze={handleAnalyzeMessage} 
            geminiConfigured={geminiConfigured} 
          />
        )}

        {activeTab === "history" && (
          <AuditLedger 
            id="historics-ledger-panel"
            history={history} 
            loading={loading} 
            onDelete={handleDeleteHistoryItem} 
            onClearAll={handleClearHistory} 
          />
        )}

        {activeTab === "labs" && (
          <DatasetManager 
            id="ml-research-panel"
            onTrainModel={handleTrainLocalModel} 
          />
        )}
      </main>

      {/* --- ACADEMIC CAPSTONE CREDENTIAL FOOTER --- */}
      <footer id="app-capstone-footer" className="bg-[#05070a] border-t border-white/10 py-6 px-4 text-center text-[10px] font-mono text-gray-500 tracking-wider">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span>AI SCAMSHIELD — SCAM CALL & FRAUD MESSAGE ANALYZER DAEMON FRAMEWORK</span>
          <span className="uppercase text-gray-400">
            B.TECH COMPUTER SCIENCE & ENGINEERING FINAL-YEAR CAPSTONE DISSERTATION PROJECT © 2026
          </span>
        </div>
      </footer>

    </div>
  );
}
