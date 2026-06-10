/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  ResponsiveContainer, PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, AreaChart, Area 
} from "recharts";
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, 
  Activity, BarChart3, TrendingUp, Skull, ShieldCheck as CleanShield 
} from "lucide-react";
import { AnalyticsStats } from "../types";

interface Props {
  stats: AnalyticsStats;
  loading: boolean;
  onRefresh: () => void;
}

export default function DashboardAnalytics({ stats, loading, onRefresh }: Props) {
  // Chart Color Palettes (Emerald, Amber, Vivid Red)
  const COLORS = ["#10B981", "#F59E0B", "#EF4444"];
  
  const pieData = [
    { name: "Safe", value: stats.safeCount },
    { name: "Suspicious", value: stats.suspiciousCount },
    { name: "Scam", value: stats.scamCount }
  ].filter(item => item.value > 0);

  const defaultPieData = [
    { name: "Awaiting Scans", value: 1 }
  ];

  // Map category hashmap to structured array for BarChart
  const barData = Object.keys(stats.categoryDistribution).map(cat => ({
    category: cat.replace(" Scam", ""),
    count: stats.categoryDistribution[cat]
  })).sort((a, b) => b.count - a.count);

  return (
    <div id="analytics-panel" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h2 id="command-center-title" className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 uppercase">
            <Activity className="h-6 w-6 text-blue-400 animate-pulse" />
            Cyber Threat Command Center
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Real-time visual reports of communication threat signatures matching localized classifiers and expert AI.
          </p>
        </div>
        <button
          id="refresh-stats-btn"
          onClick={onRefresh}
          disabled={loading}
          className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold rounded transition-colors disabled:opacity-50"
        >
          {loading ? "Re-Analyzing..." : "Reload Stream Grid"}
        </button>
      </div>

      {/* --- BENTO TOP STAT GRIDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scans Card */}
        <div id="stat-total-scans" className="bg-[#0d1117] border border-white/5 p-5 rounded-xl hover:border-blue-500/20 shadow-[0_4px_25px_rgba(37,99,235,0.05)] transition-all duration-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-16 w-16 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all duration-200" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">System Audits</span>
            <div className="p-2 bg-blue-600/10 rounded border border-blue-500/30">
              <BarChart3 className="h-4 w-4 text-blue-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-white tracking-tight">{stats.totalScans}</span>
            <span className="text-xs text-gray-500 block mt-1">Incoming communication streams</span>
          </div>
        </div>

        {/* Clean Safe Card */}
        <div id="stat-safe-scans" className="bg-[#0d1117] border border-green-500/20 p-5 rounded-xl shadow-[0_4px_25px_rgba(16,185,129,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-full blur-xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">Clean Messages</span>
            <div className="p-2 bg-emerald-950/40 rounded border border-emerald-800/20">
              <CleanShield className="h-4 w-4 text-[#10B981]" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-[#10B981] tracking-tight">{stats.safeCount}</span>
            <span className="text-xs text-gray-500 block mt-1">Verified safe communication vectors</span>
          </div>
        </div>

        {/* Suspicious Card */}
        <div id="stat-suspicious-scans" className="bg-[#0d1117] border border-amber-500/20 p-5 rounded-xl shadow-[0_4px_25px_rgba(245,158,11,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/5 rounded-full blur-xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">Suspicious Alerts</span>
            <div className="p-2 bg-amber-950/40 rounded border border-amber-800/20">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-amber-500 tracking-tight">{stats.suspiciousCount}</span>
            <span className="text-xs text-gray-500 block mt-1">Borderline triggers/potential anomalies</span>
          </div>
        </div>

        {/* Scam Card */}
        <div id="stat-scam-scans" className="bg-[#0d1117] border border-red-500/20 p-5 rounded-xl shadow-[0_4px_25px_rgba(239,68,68,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-16 w-16 bg-red-500/5 rounded-full blur-xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">Confirmed Fraud</span>
            <div className="p-2 bg-red-950/40 rounded border border-red-800/30">
              <ShieldAlert className="h-4 w-4 text-red-500 animate-pulse" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-red-500 tracking-tight">{stats.scamCount}</span>
            <span className="text-xs text-gray-500 block mt-1">Malicious phish & scams intercepted</span>
          </div>
        </div>
      </div>

      {/* --- GAUGES AND RATIOS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Gauge & Trust Level Indicators */}
        <div className="bg-[#0d1117] border border-white/5 p-5 rounded-xl flex flex-col justify-between shadow-xl">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-1.5 mb-2">
              <Skull className="h-4 w-4 text-gray-500" /> Threat Exposure Index
            </h3>
            <p className="text-xs text-gray-400 select-none">
              Aggregate threat density and overall average risk metrics matching existing parameters.
            </p>
          </div>

          <div className="my-6 flex flex-col items-center justify-center relative">
            {/* Real Gauge Speedometer representation represented cleanly in CSS  */}
            <div className="w-40 h-20 overflow-hidden relative flex items-end justify-center">
              <div className="w-40 h-40 rounded-full border-[10px] border-[#161b22] absolute top-0 left-0" />
              <div 
                className="w-40 h-40 rounded-full border-[11px] border-gradient-to-r absolute top-0 left-0 transition-all duration-1000"
                style={{
                  clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)",
                  transform: "rotate(90deg)",
                  borderColor: stats.averageRiskScore > 75 ? "#EF4444" : stats.averageRiskScore > 40 ? "#F59E0B" : "#10B981"
                }}
              />
              <div className="flex flex-col items-center z-10">
                <span className="text-3xl font-black text-white">{stats.averageRiskScore}%</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Avg Risk Score</span>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4 w-full justify-around text-center border-t border-white/5 pt-4">
              <div>
                <span className="text-xs font-bold text-gray-400">Threat Identified</span>
                <span className="text-base font-black text-gray-200 block mt-0.5">{stats.threatIdentifiedRate}%</span>
              </div>
              <div className="h-8 w-[1px] bg-white/5" />
              <div>
                <span className="text-xs font-bold text-gray-400">Clear Rate</span>
                <span className="text-base font-black text-gray-200 block mt-0.5">
                  {stats.totalScans > 0 ? Math.round((stats.safeCount / stats.totalScans) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-gray-400 text-center leading-relaxed bg-black/30 p-2.5 rounded border border-white/5">
            {stats.averageRiskScore > 75 
              ? "🔴 Warning: High exposure incident rate. Recommended to monitor incoming links." 
              : stats.averageRiskScore > 40 
              ? "🟡 Warning: Moderate anomalous spikes. Ensure KYC notices are double checked." 
              : "🟢 Normal operation: Communication channels are clean of major campaign activity."}
          </div>
        </div>

        {/* Area Trend Graph */}
        <div className="bg-[#0d1117] border border-white/5 p-5 rounded-xl lg:col-span-2 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-blue-400" /> Weekly Scan Volume Trend
            </h3>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-600/20 border border-blue-600/50 px-2 py-0.5 rounded uppercase font-bold">
              Live Temporal Stream
            </span>
          </div>

          <div className="h-56 mt-2">
            {stats.totalScans === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <p className="text-xs">No scan history recorded to draw temporal timelines.</p>
                <p className="text-[10px] text-gray-650 mt-1">Initiate scans in the analyzer to build stats.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trendHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSafe" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSusp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorScam" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#475569" strokeWidth={0.5} style={{ fontSize: "10px", fontFamily: "JetBrains Mono" }} dy={10} />
                  <YAxis stroke="#475569" strokeWidth={0.5} style={{ fontSize: "10px", fontFamily: "JetBrains Mono" }} dx={-5} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#161b22", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "11px", color: "#e0e2e5" }}
                    labelStyle={{ color: "#8b949e", fontWeight: "bold" }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px" }} iconSize={8} />
                  <Area type="monotone" dataKey="safe" name="Safe" stroke="#10B981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorSafe)" />
                  <Area type="monotone" dataKey="suspicious" name="Susp" stroke="#F59E0B" strokeWidth={1.5} fillOpacity={1} fill="url(#colorSusp)" />
                  <Area type="monotone" dataKey="scam" name="Scam" stroke="#EF4444" strokeWidth={1.5} fillOpacity={1} fill="url(#colorScam)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* --- BOTTOM ROW: CATEGORIES AND RATIOS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scam Categories Breakdown BarChart */}
        <div className="bg-[#0d1117] border border-white/5 p-5 rounded-xl flex flex-col justify-between shadow-xl">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Threat Category Distribution</h3>
            <p className="text-xs text-gray-400 mt-1">
              Prevalence of customized threat genres identified among malicious scans.
            </p>
          </div>

          <div className="h-52">
            {barData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <p className="text-xs font-semibold">No active fraud signatures isolated yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <XAxis type="number" stroke="#475569" strokeWidth={0.5} style={{ fontSize: "9px" }} />
                  <YAxis type="category" dataKey="category" stroke="#475569" strokeWidth={0.5} style={{ fontSize: "10px", fontWeight: "medium" }} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: "#161b22", border: "1px solid rgba(255,255,255,0.08)", fontSize: "11px", color: "#e0e2e5" }} />
                  <Bar dataKey="count" fill="#EF4444" radius={[0, 4, 4, 0]} barSize={12}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[2]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Vulnerability Ratio PieChart */}
        <div className="bg-[#0d1117] border border-white/5 p-5 rounded-xl flex flex-col justify-between shadow-xl">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Proportional Threat Shares</h3>
            <p className="text-xs text-gray-400 mt-1">
              Percentage comparison of parsed message streams.
            </p>
          </div>

          <div className="h-52 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip contentStyle={{ backgroundColor: "#161b22", border: "1px solid rgba(255,255,255,0.08)", fontSize: "11px", color: "#e0e2e5" }} />
                  <Pie
                    data={pieData.length > 0 ? pieData : defaultPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.length > 0 ? (
                      pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))
                    ) : (
                      <Cell fill="#334155" />
                    )}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-xs w-full max-w-[150px]">
              {pieData.length > 0 ? (
                pieData.map((entry, index) => {
                  const percentage = Math.round((entry.value / stats.totalScans) * 100);
                  return (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span>{entry.name}</span>
                      </div>
                      <span className="font-mono text-gray-450 font-bold">{percentage}%</span>
                    </div>
                  );
                })
              ) : (
                <div className="text-[11px] text-gray-500 leading-normal text-center sm:text-left select-none">
                  Awaiting threat stream ingest to generate active proportions.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
