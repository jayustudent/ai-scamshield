/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Smartphone, Mail, MessageSquare, Phone, 
  ShieldAlert, ShieldCheck, AlertTriangle, Cpu, Sparkles, 
  Globe, Info, Link as LinkIcon, AlertCircle, Eye, ChevronRight 
} from "lucide-react";

interface Props {
  onAnalyze: (payload: { text: string; type: string; enableGemini: boolean }) => Promise<any>;
  geminiConfigured: boolean;
}

export default function AnalyzeMessage({ onAnalyze, geminiConfigured }: Props) {
  const [text, setText] = useState("");
  const [channel, setChannel] = useState("SMS");
  const [enableGemini, setEnableGemini] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Real-time loading lines simulation
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [recommendationTab, setRecommendationTab] = useState<"en" | "hi">("en");

  // Presets to let professors/evaluators instantly evaluate different threat patterns
  const PRESETS = [
    {
      title: "Bank KYC Scam",
      text: "Dear Customer, SBI alert. Account suspension warning: Your netbanking has been locked because of missing Pan card. Tap immediately here to reverify KYC inside 24 hrs: http://sbi-securelogin.net/kyc-update",
      type: "SMS"
    },
    {
      title: "KBC Lottery Scams",
      text: "CONGRATULATIONS! You have won a grand lottery of 25,00,000 from KBC & Jio! Contact SBI Cashier Mr. Rana on WhatsApp at +91902010212 and pay Rs 12,500 RBI state tax registration fee to claim prize.",
      type: "WhatsApp"
    },
    {
      title: "Earn Part-time Job",
      text: "Earn Rs 5,000 daily from home! Work just 1 hour rating film clips and likes. No cost sign-up. Register with our corporate HR coordinator on Telegram: t.me/amazon_job_hr_india",
      type: "WhatsApp"
    },
    {
      title: "UPI Cashback Reward",
      text: "Paytm Reward Service: Rs 1,490 cashback approved for you! Scan QR code sent to your chat to credit money into your Google Pay wallet now.",
      type: "SMS"
    },
    {
      title: "Academic Reminder",
      text: "Hello everyone, the final term draft for the Cyber Security system is scheduled for submission on Wednesday. Please upload folders in PDF format on DU portal. Regards, Prof. Sharma.",
      type: "Email"
    },
    {
      title: "Family Chat",
      text: "Chintu beta, have you reached Delhi? Call mom when you get to your hostel. Dad has transferred Rs 5,000 to your card for the books fee.",
      type: "WhatsApp"
    }
  ];

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setText(preset.text);
    setChannel(preset.type);
    setError(null);
  };

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || text.trim().length === 0) {
      setError("Please paste or type a communication transcript to scan.");
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);
    setLoadingStep(0);

    // Simulate cyber security intelligence pipeline logs
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev < 3 ? prev + 1 : prev));
    }, 450);

    try {
      const scanData = await onAnalyze({ text, type: channel, enableGemini });
      setResult(scanData);
    } catch (err: any) {
      setError(err.message || "Threat analyzer timed out. Please check network port logs.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const getLogMessage = (step: number) => {
    switch (step) {
      case 0: return "Mining communication text structures...";
      case 1: return "Extracting TF-IDF feature vocabulary vectors...";
      case 2: return "Evaluating risks via Edge Logistic Regression weights...";
      case 3: return enableGemini && geminiConfigured 
        ? "Translating and invoking Expert Gemini 3.5 LLM..." 
        : "Executing heuristic scam filters...";
      default: return "Finalizing defensive reports...";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="analyzer-grid">
      {/* --- INPUT BLOCK AND PRESETS --- */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-[#0d1117] border border-white/5 p-6 rounded-xl shadow-xl">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 uppercase">
            <Smartphone className="h-5 w-5 text-blue-400" />
            Message Input Analyzer
          </h2>
          <p className="text-xs text-gray-400 mt-1 mb-5">
            Ingest chat streams, calls transcripts, short links, or messages to dissect phish traces.
          </p>

          <form onSubmit={handleScanSubmit} className="space-y-4">
            {/* Communication selectors */}
            <div>
              <label className="text-[11px] font-mono text-blue-400 uppercase tracking-widest block mb-2 font-bold">
                Intelligence Vectors Channel
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "SMS", name: "SMS", icon: Smartphone },
                  { id: "WhatsApp", name: "WhatsApp", icon: MessageSquare },
                  { id: "Email", name: "Email", icon: Mail },
                  { id: "Call Transcript", name: "Voice Call", icon: Phone }
                ].map(item => {
                  const IconComp = item.icon;
                  const isActive = channel === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setChannel(item.id)}
                      className={`py-2.5 px-1 rounded-lg border text-center flex flex-col items-center justify-center gap-1.5 transition-all duration-200 ${
                        isActive 
                          ? "bg-blue-600/20 border-blue-600/50 text-blue-400" 
                          : "bg-white/5 border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/10"
                      }`}
                    >
                      <IconComp className={`h-4 w-4 ${isActive ? "text-blue-400 animate-pulse" : "text-gray-400"}`} />
                      <span className="text-[10px] font-bold">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main message text-area */}
            <div>
              <label htmlFor="message-textbox" className="text-[11px] font-mono text-blue-400 uppercase tracking-widest block mb-2 font-bold">
                Communication Body Transcript
              </label>
              <textarea
                id="message-textbox"
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste the WhatsApp chat forward, SMS, email payload, or call tape logs here..."
                className="w-full bg-[#161b22] text-gray-300 text-xs p-4 rounded-lg border border-white/10 focus:outline-none focus:border-blue-500/50 font-mono leading-relaxed resize-y"
              />
              <span className="text-[10px] text-gray-500 float-right mt-1">
                Words count: {text.trim() ? text.trim().split(/\s+/).length : 0}
              </span>
            </div>

            {/* Model switch choices */}
            <div className="bg-black/30 border border-white/5 p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-gray-400" />
                <div>
                  <span className="text-xs font-semibold text-gray-300 block">Expert Gemini Model Assist</span>
                  <span className="text-[10px] text-gray-500 block">
                    {geminiConfigured 
                      ? "Advanced neural text analysis enabled." 
                      : "No Custom Gemini key detected. Falls back cleanly to local ML models."}
                  </span>
                </div>
              </div>
              <input
                id="gemini-assist-toggle"
                type="checkbox"
                checked={enableGemini && geminiConfigured}
                disabled={!geminiConfigured}
                onChange={(e) => setEnableGemini(e.target.checked)}
                className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500 bg-gray-800 border-white/10 pointer-events-auto cursor-pointer"
              />
            </div>

            {/* Error notifications */}
            {error && (
              <div className="flex items-start gap-2 bg-red-950/35 border border-red-900/40 text-red-400 p-3 rounded-lg text-xs leading-relaxed animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Push submit action */}
            <button
              id="analyze-message-btn"
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-bold text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
                loading
                  ? "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_4px_20px_rgba(37,99,235,0.3)] active:opacity-90"
              }`}
            >
              <Sparkles className="h-4 w-4 text-white" />
              {loading ? "Initializing Core Security Audit..." : "Execute AI Analysis"}
            </button>
          </form>
        </div>

        {/* Preset Evaluators */}
        <div className="bg-[#0d1117] border border-white/5 p-5 rounded-xl">
          <h3 className="text-xs font-mono text-blue-400 uppercase tracking-widest font-bold mb-3">
            Academic Evaluator Presets
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map(preset => {
              const isSelected = text === preset.text;
              return (
                <button
                  type="button"
                  key={preset.title}
                  onClick={() => handleApplyPreset(preset)}
                  className={`text-left p-2.5 rounded-lg border text-xs transition-all duration-200 hover:bg-white/5 ${
                    isSelected
                      ? "border-blue-500/40 bg-white/10"
                      : "border-white/5 bg-black/20"
                  }`}
                >
                  <span className="font-semibold text-gray-300 block">{preset.title}</span>
                  <span className="text-[10px] text-gray-500 font-mono mt-1 block uppercase">
                    {preset.type} Vector
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- RESULTS COLUMN --- */}
      <div className="lg:col-span-5 space-y-6">
        {/* Loader Screen */}
        {loading && (
          <div className="bg-[#0d1117] border border-white/5 p-12 rounded-xl flex flex-col items-center justify-center min-h-[400px] shadow-xl">
            <div className="relative flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full border-2 border-white/5 border-t-blue-500 animate-spin" />
              <Cpu className="h-6 w-6 text-blue-400 absolute animate-pulse" />
            </div>
            <p className="text-xs font-bold text-white tracking-widest uppercase font-mono mb-2">
              Auditing Communications
            </p>
            <div className="max-w-xs text-center">
              <span className="text-[10px] text-gray-400 font-mono italic block bg-black/40 px-4 py-2 border border-white/5 rounded animate-pulse">
                {getLogMessage(loadingStep)}
              </span>
            </div>
          </div>
        )}

        {/* Waiting Placeholder */}
        {!loading && !result && (
          <div className="bg-[#0d1117] border border-dashed border-white/10 p-12 rounded-xl flex flex-col items-center justify-center text-center min-h-[400px]">
            <ShieldCheck className="h-12 w-12 text-gray-600 mb-4" />
            <span className="text-xs text-white uppercase font-bold tracking-wider block">Security Audit Idle</span>
            <p className="text-xs text-gray-500 max-w-xs mt-2 leading-relaxed">
              Select an academic threat preset from the left panel or paste a suspicious body feed to verify communication vector integrity.
            </p>
          </div>
        )}

        {/* Finished Report Layout */}
        {!loading && result && (
          <div className="space-y-6 animate-fade-in" id="auditor-report">
            {/* Visual Risk Banner */}
            <div className={`bg-[#0d1117] border rounded-xl p-5 flex flex-col gap-5 shadow-xl ${
              result.prediction === "SCAM" 
                ? "border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.1)]" 
                : result.prediction === "SUSPICIOUS"
                ? "border-amber-500/20 shadow-[0_0_40px_rgba(245,158,11,0.05)]"
                : "border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.05)]"
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${
                    result.prediction === "SCAM" ? "text-red-500" : result.prediction === "SUSPICIOUS" ? "text-amber-500" : "text-green-500"
                  }`}>Detection Result</p>
                  <h2 className={`text-2xl font-black uppercase italic ${
                    result.prediction === "SCAM" ? "text-red-500" : result.prediction === "SUSPICIOUS" ? "text-amber-400" : "text-green-400"
                  }`}>
                    {result.prediction === "SCAM" ? "Scam Detected" : result.prediction === "SUSPICIOUS" ? "Suspicious Thread" : "Safe verified"}
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Category</p>
                  <p className="text-xs font-bold text-white uppercase mt-0.5">{result.category || "None (Safe Message)"}</p>
                </div>
              </div>

              {/* Glow indicators circular gauges row */}
              <div className="grid grid-cols-3 gap-2 py-2">
                {/* Risk score gauge */}
                <div className="bg-black/30 rounded-lg p-3 text-center border border-white/5">
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-800" />
                      <circle 
                        cx="32" 
                        cy="32" 
                        r="28" 
                        stroke="currentColor" 
                        strokeWidth="4" 
                        fill="transparent" 
                        strokeDasharray="175.9" 
                        strokeDashoffset={175.9 - (175.9 * (result.risk_score || 0)) / 100} 
                        className={result.prediction === "SCAM" ? "text-red-500" : result.prediction === "SUSPICIOUS" ? "text-amber-500" : "text-green-500"} 
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">{result.risk_score}%</span>
                  </div>
                  <p className="text-[9px] text-gray-500 font-bold uppercase">Risk Score</p>
                </div>

                {/* Trust score gauge */}
                <div className="bg-black/30 rounded-lg p-3 text-center border border-white/5">
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="4" fill="transparent" className="text-gray-800" />
                      <circle 
                        cx="32" 
                        cy="32" 
                        r="28" 
                        stroke="currentColor" 
                        strokeWidth="4" 
                        fill="transparent" 
                        strokeDasharray="175.9" 
                        strokeDashoffset={175.9 - (175.9 * (result.trust_score || 0)) / 100} 
                        className="text-blue-400" 
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">{result.trust_score}%</span>
                  </div>
                  <p className="text-[9px] text-gray-500 font-bold uppercase">Trust Score</p>
                </div>

                {/* Confidence gauge */}
                <div className="bg-black/30 rounded-lg p-3 text-center border border-white/5">
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="4" fill="transparent" className="text-gray-800" />
                      <circle 
                        cx="32" 
                        cy="32" 
                        r="28" 
                        stroke="currentColor" 
                        strokeWidth="4" 
                        fill="transparent" 
                        strokeDasharray="175.9" 
                        strokeDashoffset={175.9 - (175.9 * (result.confidence_score || 100)) / 100} 
                        className="text-yellow-500" 
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">{result.confidence_score}%</span>
                  </div>
                  <p className="text-[9px] text-gray-500 font-bold uppercase">Confidence</p>
                </div>
              </div>

              {/* Indicator Flags */}
              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 uppercase font-bold">AI Explanation Flags</p>
                <div className="flex flex-wrap gap-2">
                  {result.detected_keywords && result.detected_keywords.slice(0, 3).map((word: string) => (
                    <span key={word} className="px-2 py-0.5 bg-red-955 border border-red-500/20 text-red-400 rounded text-[10px] font-mono">
                      {word.toUpperCase() || "PATTERN"} KEYWORD
                    </span>
                  ))}
                  {result.qr_scam_detected && (
                    <span className="px-2 py-0.5 bg-yellow-900/30 text-yellow-400 border border-yellow-700/30 rounded text-[10px] font-mono">URGENT QR EXPLOIT</span>
                  )}
                  {result.financial_request && (
                    <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 border border-blue-700/30 rounded text-[10px] font-mono">FINANCIAL TRANSIT</span>
                  )}
                  {result.prediction === "SAFE" && (
                    <span className="px-2 py-0.5 bg-green-900/30 text-green-400 border border-green-700/30 rounded text-[10px] font-mono">BENIGN COMMUNICATIONS</span>
                  )}
                </div>
              </div>

              <div className="mt-1 pt-4 border-t border-white/5">
                <p className="text-[11px] leading-relaxed text-gray-400">
                  <span className={`font-bold italic ${
                    result.prediction === "SCAM" ? "text-red-400" : result.prediction === "SUSPICIOUS" ? "text-amber-400" : "text-green-400"
                  }`}>AI Analysis Insight:</span> {result.explanation}
                </p>
              </div>

              <div className="text-[9px] font-mono text-gray-500 border-t border-white/5 pt-3 flex items-center justify-between">
                <span>Core Engine: {result.isExpertAIResponse ? "Expert Gemini Model" : "Local SGD classifier"}</span>
                <span className="uppercase">ID: {result.id?.substr(0, 8)}</span>
              </div>
            </div>

            {/* Extracted Identifiers Panel */}
            <div className="bg-[#0d1117] border border-white/5 p-5 rounded-xl space-y-3">
              <h3 className="text-xs font-bold text-gray-300 flex items-center gap-1.5 uppercase tracking-wide">
                <LinkIcon className="h-4 w-4 text-blue-400" /> Extracted Identifiers Panel
              </h3>

              <div className="space-y-2">
                {[
                  { label: "Suspicious Hyperlinks", data: result.detected_urls, emptyMsg: "No hyper-anchors found." },
                  { label: "Phone Handles harvested", data: result.detected_phones, emptyMsg: "No source contacts detected." },
                  { label: "E-Mail Traces harvested", data: result.detected_emails, emptyMsg: "No mailbox traces found." }
                ].map((row, rIdx) => (
                  <div key={rIdx} className="bg-[#161b22] p-2.5 rounded-lg border border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">{row.label}</span>
                    <div className="text-right">
                      {row.data && row.data.length > 0 ? (
                        row.data.map((item: string, idx: number) => (
                          <span key={idx} className="inline-block bg-black/40 text-gray-300 text-[10px] font-mono px-2 py-0.5 rounded border border-white/5 mx-0.5 max-w-[180px] truncate select-all">
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-gray-500 italic block">{row.emptyMsg}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bilingual Advice tabs recommendations */}
            <div className="bg-[#0d1117] border border-white/5 p-5 rounded-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                <h3 className="text-xs font-bold text-gray-300 flex items-center gap-1.5 uppercase">
                  <Globe className="h-4 w-4 text-emerald-400" />
                  Bilingual Safety Recommendations
                </h3>
                
                <div className="flex bg-black/40 p-0.5 rounded border border-white/5">
                  <button
                    type="button"
                    onClick={() => setRecommendationTab("en")}
                    className={`px-3 py-1 text-[10px] font-bold rounded uppercase tracking-wider transition-all duration-200 ${
                      recommendationTab === "en" ? "bg-blue-600/20 text-blue-400 border border-blue-600/30" : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecommendationTab("hi")}
                    className={`px-3 py-1 text-[10px] font-bold rounded uppercase tracking-wider transition-all duration-200 ${
                      recommendationTab === "hi" ? "bg-blue-600/20 text-blue-400 border border-blue-600/30" : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    हिंदी
                  </button>
                </div>
              </div>

              <div className="space-y-2 animate-fade-in">
                {recommendationTab === "en" ? (
                  result.recommendations?.english && result.recommendations.english.length > 0 ? (
                    result.recommendations.english.map((rec: string, idx: number) => (
                      <div key={idx} className="flex gap-2 text-xs text-gray-300 leading-relaxed font-sans">
                        <ChevronRight className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500 italic block">No active recommendations compiled.</span>
                  )
                ) : (
                  result.recommendations?.hindi && result.recommendations.hindi.length > 0 ? (
                    result.recommendations.hindi.map((rec: string, idx: number) => (
                      <div key={idx} className="flex gap-2 text-xs text-gray-300 leading-relaxed font-sans">
                        <ChevronRight className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500 italic block">कोई सलाह संकलited नहीं है।</span>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
