/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from "fs";
import * as path from "path";
import { User, ScanHistory, DetectedFeature, AnalyticsStats } from "../types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "scamshield_database.json");

interface DatabaseSchema {
  users: User[];
  scan_history: ScanHistory[];
  detected_features: DetectedFeature[];
}

export class DBManager {
  constructor() {
    this.initializeDatabase();
  }

  /**
   * Automatically verify directory presence and establish initial schema templates.
   */
  private initializeDatabase() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const initialSchema: DatabaseSchema = {
        users: [
          {
            id: "u_1",
            username: "cyber_analyst_college",
            email: "jayupandey749@gmail.com",
            created_at: new Date().toISOString()
          }
        ],
        scan_history: [],
        detected_features: []
      };
      
      // Seed initial mock timeline scan if empty to provide a beautiful initial dashboard experience
      this.seedInitialStats(initialSchema);
      
      fs.writeFileSync(DB_FILE, JSON.stringify(initialSchema, null, 2), "utf8");
    }
  }

  private seedInitialStats(schema: DatabaseSchema) {
    const categories = [
      "Banking Scam", "OTP Scam", "UPI Scam", "Lottery Scam", "Job Scam", "Loan Scam", "Crypto Scam", "Investment Scam"
    ];
    
    const messages = [
      "Dear customer your SBI account is locked. Please update your KYC immediately at https://sbi-secure-kyc.net/update to prevent suspension.",
      "URGENT: You have won a lottery of Rs 25,00,000 from KBC. Send Rs 15,000 RBI clearing tax fees to UPI check-pay@upi to claim your reward.",
      "Hello team, the final year project submission has been opened on the portal. Please upload your documents before Friday - Prof. Verma.",
      "Congratulations! Your pre-approved loan of Rs 5,00,000 is ready. Click here to get instant transfer without income proof: shorturl.at/loan",
      "Earn Rs 5,000 daily from home by just liking Youtube videos. Contact us on WhatsApp helper: wa.me/9128384812 with screenshot."
    ];

    const predictions: Array<"SAFE" | "SUSPICIOUS" | "SCAM"> = [
      "SCAM", "SCAM", "SAFE", "SUSPICIOUS", "SCAM"
    ];
    
    const scores = [
      { r: 92, t: 8, c: 98, cat: "Banking Scam" },
      { r: 95, t: 5, c: 99, cat: "Lottery Scam" },
      { r: 2, t: 98, c: 99, cat: "None (Safe Message)" },
      { r: 65, t: 35, c: 75, cat: "Loan Scam" },
      { r: 88, t: 12, c: 91, cat: "Job Scam" }
    ];

    // Seed historical scans spread across previous week to build gorgeous line-charts
    const now = new Date();
    for (let i = 0; i < 5; i++) {
      const scanId = `scan_${i + 1}`;
      const prevDate = new Date(now.getTime() - (5 - i) * 24 * 60 * 60 * 1000);
      
      schema.scan_history.push({
        id: scanId,
        message: messages[i],
        prediction: predictions[i],
        category: scores[i].cat,
        risk_score: scores[i].r,
        trust_score: scores[i].t,
        confidence: scores[i].c,
        created_at: prevDate.toISOString()
      });

      // Seed corresponding features
      if (predictions[i] !== "SAFE") {
        schema.detected_features.push({
          id: `feat_${scanId}_1`,
          scan_id: scanId,
          feature_name: "Urgency Indicator",
          feature_value: "Immediate action demanded"
        });
        if (scores[i].r > 80) {
          schema.detected_features.push({
            id: `feat_${scanId}_2`,
            scan_id: scanId,
            feature_name: "Financial Transference",
            feature_value: "Requests direct bank credentials or deposits"
          });
        }
      }
    }
  }

  private read(): DatabaseSchema {
    this.initializeDatabase();
    try {
      const content = fs.readFileSync(DB_FILE, "utf8");
      return JSON.parse(content);
    } catch (e) {
      console.error("Database read error, repairing database file:", e);
      // Re-initialize if corrupted
      fs.unlinkSync(DB_FILE);
      this.initializeDatabase();
      return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    }
  }

  private write(data: DatabaseSchema) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  }

  // --- USERS TABLE CRUD ---
  public users = {
    create: (username: string, email: string): User => {
      const db = this.read();
      const existing = db.users.find(u => u.email === email);
      if (existing) return existing;

      const newUser: User = {
        id: `u_${Date.now()}`,
        username,
        email,
        created_at: new Date().toISOString()
      };
      
      db.users.push(newUser);
      this.write(db);
      return newUser;
    },

    findLatest: (): User => {
      const db = this.read();
      return db.users[db.users.length - 1];
    }
  };

  // --- SCAN HISTORY TABLE CRUD ---
  public scanHistory = {
    create: (
      message: string,
      prediction: "SAFE" | "SUSPICIOUS" | "SCAM",
      category: string,
      risk_score: number,
      trust_score: number,
      confidence: number,
      createdAt?: string
    ): ScanHistory => {
      const db = this.read();
      const newScan: ScanHistory = {
        id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        message,
        prediction,
        category,
        risk_score,
        trust_score,
        confidence,
        created_at: createdAt || new Date().toISOString()
      };

      db.scan_history.push(newScan);
      this.write(db);
      return newScan;
    },

    findAll: (): ScanHistory[] => {
      const db = this.read();
      // return sorted by date descending (newest first)
      return [...db.scan_history].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },

    delete: (id: string): boolean => {
      const db = this.read();
      const initialCount = db.scan_history.length;
      db.scan_history = db.scan_history.filter(scan => scan.id !== id);
      db.detected_features = db.detected_features.filter(feat => feat.scan_id !== id);
      
      this.write(db);
      return db.scan_history.length < initialCount;
    },

    clearAll: (): void => {
      const db = this.read();
      db.scan_history = [];
      db.detected_features = [];
      this.write(db);
    },

    getStats: (): AnalyticsStats => {
      const db = this.read();
      const scans = db.scan_history;
      
      const total = scans.length;
      let safe = 0, susp = 0, scam = 0;
      let totalRisk = 0;
      const categories: Record<string, number> = {};

      scans.forEach(s => {
        if (s.prediction === "SAFE") safe++;
        else if (s.prediction === "SUSPICIOUS") susp++;
        else if (s.prediction === "SCAM") scam++;

        totalRisk += s.risk_score;

        if (s.category && s.category !== "None (Safe Message)") {
          categories[s.category] = (categories[s.category] || 0) + 1;
        }
      });

      // Trend History logic: group last 7 days of scans
      const now = new Date();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
        return d.toISOString().split("T")[0]; // YYYY-MM-DD
      });

      const trendMap = last7Days.reduce((acc, dateStr) => {
        acc[dateStr] = { safe: 0, suspicious: 0, scam: 0 };
        return acc;
      }, {} as Record<string, { safe: number; suspicious: number; scam: number }>);

      scans.forEach(s => {
        const scanDateStr = s.created_at.split("T")[0];
        if (trendMap[scanDateStr] !== undefined) {
          if (s.prediction === "SAFE") trendMap[scanDateStr].safe++;
          else if (s.prediction === "SUSPICIOUS") trendMap[scanDateStr].suspicious++;
          else if (s.prediction === "SCAM") trendMap[scanDateStr].scam++;
        }
      });

      const trendHistory = Object.keys(trendMap).map(date => {
        const formattedDate = new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric"
        });
        return {
          date: formattedDate,
          safe: trendMap[date].safe,
          suspicious: trendMap[date].suspicious,
          scam: trendMap[date].scam
        };
      });

      return {
        totalScans: total,
        safeCount: safe,
        suspiciousCount: susp,
        scamCount: scam,
        categoryDistribution: categories,
        trendHistory,
        averageRiskScore: total > 0 ? Math.round(totalRisk / total) : 0,
        threatIdentifiedRate: total > 0 ? Math.round(((susp + scam) / total) * 100) : 0
      };
    }
  };

  // --- DETECTED FEATURES TABLE CRUD ---
  public detectedFeatures = {
    create: (scanId: string, featureName: string, featureValue: string): DetectedFeature => {
      const db = this.read();
      const newFeature: DetectedFeature = {
        id: `feat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        scan_id: scanId,
        feature_name: featureName,
        feature_value: featureValue
      };

      db.detected_features.push(newFeature);
      this.write(db);
      return newFeature;
    },

    findByScanId: (scanId: string): DetectedFeature[] => {
      const db = this.read();
      return db.detected_features.filter(feat => feat.scan_id === scanId);
    }
  };
}

export const dbManager = new DBManager();
