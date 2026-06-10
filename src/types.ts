/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ScamCategory {
  BANKING = "Banking Scam",
  OTP = "OTP Scam",
  UPI = "UPI Scam",
  LOTTERY = "Lottery Scam",
  JOB = "Job Scam",
  LOAN = "Loan Scam",
  CRYPTO = "Crypto Scam",
  INVESTMENT = "Investment Scam",
  SAFE = "None (Safe Message)"
}

export type ScamLabel = "SAFE" | "SUSPICIOUS" | "SCAM";

export interface ScanResult {
  prediction: ScamLabel;
  confidence_score: number; // 0 to 100
  risk_score: number; // 0 to 100
  trust_score: number; // 0 to 100
  category: ScamCategory;
  
  // Explainable AI indicators
  urgency_score: number; // 0 to 100
  threat_score: number; // 0 to 100
  financial_request: boolean;
  detected_keywords: string[];
  explanation: string;
  
  // Entity extractions
  detected_urls: string[];
  detected_phones: string[];
  detected_emails: string[];
  qr_scam_detected: boolean;
  
  // Multilingual safety advice
  recommendations: {
    english: string[];
    hindi: string[];
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

export interface ScanHistory {
  id: string;
  message: string;
  prediction: ScamLabel;
  category: string;
  risk_score: number;
  trust_score: number;
  confidence: number;
  created_at: string;
}

export interface DetectedFeature {
  id: string;
  scan_id: string;
  feature_name: string;
  feature_value: string;
}

export interface AnalyticsStats {
  totalScans: number;
  safeCount: number;
  suspiciousCount: number;
  scamCount: number;
  categoryDistribution: Record<string, number>;
  trendHistory: Array<{
    date: string;
    scam: number;
    suspicious: number;
    safe: number;
  }>;
  averageRiskScore: number;
  threatIdentifiedRate: number; // percentage
}
