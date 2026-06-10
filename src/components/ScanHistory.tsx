/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Search, Trash2, Download, AlertCircle, Calendar, 
  ChevronDown, ChevronUp, Filter, ShieldAlert, ShieldCheck, 
  MessageSquare, Smartphone, Mail, Phone 
} from "lucide-react";
import { ScanHistory } from "../types";

interface Props {
  history: ScanHistory[];
  loading: boolean;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export default function AuditLedger({ history, loading, onDelete, onClearAll }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState<"ALL" | "SAFE" | "SUSPICIOUS" | "SCAM">("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  // 1. Filtered data logic
  const filteredData = history.filter(item => {
    const textMatches = item.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterClass === "ALL") return textMatches;
    return textMatches && item.prediction === filterClass;
  });

  // 2. Local CSV export in web clients
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Scan Date,Message,Prediction,Scam Category,Risk Score,Trust Score,ConfidenceScore\n";

    filteredData.forEach(s => {
      const id = s.id;
      const date = new Date(s.created_at).toLocaleString().replace(/,/g, " ");
      const escapedMsg = s.message.replace(/"/g, '""');
      const label = s.prediction;
      const cat = s.category;
      const risk = s.risk_score;
      const trust = s.trust_score;
      const conf = s.confidence;

      csvContent += `"${id}","${date}","${escapedMsg}","${label}","${cat}",${risk},${trust},${conf}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `scamshield_threat_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getChannelIcon = (message: string) => {
    const msg = message.toLowerCase();
    if (msg.includes("wa.me") || msg.includes("whatsapp") || msg.includes("t.me")) {
      return <MessageSquare className="h-4 w-4 text-emerald-400" />;
    } else if (msg.includes("dear students") || msg.includes("unrecognized ip") || msg.includes("regards")) {
      return <Mail className="h-4 w-4 text-indigo-400" />;
    } else if (msg.includes("call our executive") || msg.includes("calling executives")) {
      return <Phone className="h-4 w-4 text-cyan-400" />;
    }
    return <Smartphone className="h-4 w-4 text-slate-400" />;
  };

  return (
    <div id="ledger-panel" className="space-y-6">
      {/* Header operations bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 uppercase">
            <Calendar className="h-6 w-6 text-blue-400" />
            Threat Vault Registry
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Historic database of checked packets. Query records and download Excel compatible sheets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="export-csv-btn"
            onClick={handleExportCSV}
            disabled={filteredData.length === 0}
            className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5 text-blue-400" />
            Export Filtered CSV
          </button>
          
          <button
            id="clear-vault-btn"
            onClick={() => {
              if (window.confirm("CRITICAL WARNING: Are you sure you want to permanently clear the historical database and feature indexes?")) {
                onClearAll();
              }
            }}
            disabled={history.length === 0}
            className="px-4 py-2 bg-red-950/20 border border-red-900/30 hover:bg-red-900/20 hover:border-red-500/35 text-red-400 text-xs font-semibold rounded transition-colors disabled:opacity-50"
          >
            Purge Ledger
          </button>
        </div>
      </div>

      {/* --- FILTER CONTROL BOARD PANEL --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-black/30 border border-white/5 p-4 rounded-xl">
        {/* Search input field */}
        <div className="sm:col-span-2 relative">
          <Search className="h-4 w-4 text-gray-500 absolute top-3 left-3" />
          <input
            id="search-history-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search matching words, phone contacts, hyperlinks, or categories..."
            className="w-full bg-[#161b22] border border-white/10 text-xs p-2.5 pl-10 rounded focus:outline-none focus:border-blue-500/50 text-white font-sans"
          />
        </div>

        {/* Dropdown status classification selector */}
        <div className="relative">
          <Filter className="h-3.5 w-3.5 text-gray-500 absolute top-3.5 left-3.5" />
          <select
            id="filter-class-dropdown"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value as any)}
            className="w-full bg-[#161b22] border border-white/10 text-xs p-2.5 pl-10 rounded focus:outline-none focus:border-blue-500/50 text-white font-mono font-medium"
          >
            <option value="ALL">Show All Classes</option>
            <option value="SAFE">SAFE Core Models</option>
            <option value="SUSPICIOUS">SUSPICIOUS anomalies</option>
            <option value="SCAM">SCAM campaigns</option>
          </select>
        </div>
      </div>

      {/* --- TABLE CONTENT LEDGER --- */}
      {loading ? (
        <div className="text-center py-12 bg-black/10 border border-white/5 rounded-xl">
          <div className="w-8 h-8 rounded-full border-2 border-white/15 border-t-blue-400 animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-400 font-mono">Synchronizing scam vault data...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-16 bg-black/10 border border-dashed border-white/5 rounded-xl">
          <AlertCircle className="h-10 w-10 text-gray-600 mx-auto mb-3" />
          <span className="text-sm text-gray-300 font-bold block">No Records Found</span>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
            {searchTerm || filterClass !== "ALL" 
              ? "Modify your search queries or category filters to locate threat nodes." 
              : "No historical scans registered. Paste messages in the scan panel to seed logs."}
          </p>
        </div>
      ) : (
        <div className="space-y-3 font-sans">
          {filteredData.map(item => {
            const isExpanded = expandedId === item.id;
            return (
              <div 
                key={item.id} 
                className={`bg-[#0d1117] border rounded-xl overflow-hidden transition-all duration-200 ${
                  isExpanded ? "border-white/10 shadow-xl" : "border-white/5 hover:border-white/10"
                }`}
              >
                {/* Expandable top summary header block row */}
                <div 
                  onClick={() => toggleExpand(item.id)}
                  className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-black/35"
                >
                  <div className="flex items-start gap-3 w-full">
                    {/* Class indicators */}
                    <div className="mt-1 shrink-0">
                      {getChannelIcon(item.message)}
                    </div>
                    
                    <div className="space-y-1 w-full min-w-0 pr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                          item.prediction === "SCAM" 
                            ? "bg-red-950/60 text-red-405 border border-red-900/30" 
                            : item.prediction === "SUSPICIOUS"
                            ? "bg-amber-950/60 text-amber-405 border border-amber-900/20"
                            : "bg-emerald-950/60 text-emerald-405 border border-emerald-900/20"
                        }`}>
                          {item.prediction}
                        </span>
                        
                        <span className="text-gray-300 text-xs font-bold truncate max-w-[150px] sm:max-w-xs block">
                          {item.category === "None (Safe Message)" ? "Safe Vector" : item.category}
                        </span>
                        
                        <span className="text-[10px] text-gray-500 font-mono">
                          {new Date(item.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                      
                      <p className="text-gray-400 text-xs truncate leading-relaxed">
                        {item.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    {/* Tiny risk stats badges */}
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-[9px] font-mono text-gray-500 block font-bold">RISK</span>
                        <span className={`text-xs font-bold font-mono ${
                          item.risk_score > 70 ? "text-red-400" : item.risk_score > 30 ? "text-amber-400" : "text-emerald-400"
                        }`}>{item.risk_score}%</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-gray-500 block font-bold">CONF</span>
                        <span className="text-xs font-bold font-mono text-gray-300">{item.confidence}%</span>
                      </div>
                    </div>

                    <div className="h-6 w-[1px] bg-white/5" />

                    <div className="flex items-center gap-1.5Packed flex">
                      <button
                        id={`delete-scan-btn-${item.id}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Are you sure you want to delete this scan entry?")) {
                            onDelete(item.id);
                          }
                        }}
                        className="p-1.5 bg-[#161b22] border border-white/5 hover:bg-red-950/20 hover:border-red-500/30 text-gray-400 hover:text-red-400 rounded transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      
                      <div className="text-gray-550 ml-1">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Relational details expansion matching SQL tables */}
                {isExpanded && (
                  <div className="bg-black/30 p-5 border-t border-white/5 space-y-4">
                    <div>
                      <h4 className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-bold mb-2">
                        Raw Transcript Body Check
                      </h4>
                      <p className="bg-[#161b22] p-3.5 rounded border border-white/5 text-xs text-gray-300 leading-relaxed max-h-40 overflow-y-auto select-all font-mono">
                        {item.message}
                      </p>
                    </div>

                    {/* Features Join table matches */}
                    <div>
                      <h4 className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-bold mb-2.5">
                        Relational Threat Signatures Logged (detected_features)
                      </h4>
                      
                      {/* @ts-ignore */}
                      {item.features && item.features.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {/* @ts-ignore */}
                          {item.features.map((feat: any) => (
                            <div key={feat.id} className="bg-[#161b22] border border-white/5 p-3 rounded flex flex-col justify-between shadow">
                              <span className="text-[10px] text-blue-405 font-mono font-bold uppercase">{feat.feature_name}</span>
                              <span className="text-xs text-gray-300 mt-1 leading-normal font-sans">
                                {feat.feature_value}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-[#161b22] p-3 rounded border border-white/5 text-[11px] text-gray-500 italic">
                          No anomalous triggers flagged for safe communication instances in sqlite features index.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
