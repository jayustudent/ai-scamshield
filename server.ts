/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import * as path from "path";
import * as fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

import { dbManager } from "./src/lib/db";
import { LocalScamClassifier, tokenize } from "./src/lib/ml";
import { generateScamShieldDataset } from "./src/lib/dataset";
import { ScamCategory, ScamLabel, ScanResult } from "./src/types";

dotenv.config();

// Initialize the Local machine learning classifier
const localClassifier = new LocalScamClassifier();

// Initialize the Google Gemini AI client
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (geminiApiKey && geminiApiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
    console.log("AI ScamShield: Gemini AI client initialized successfully.");
  } catch (err) {
    console.error("AI ScamShield: Failed to initialize Gemini Client:", err);
  }
} else {
  console.log("AI ScamShield: running in Edge/Local ML mode. Backing up and utilizing local models.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. --- DATASET GENERATION ON STARTUP ---
  try {
    console.log("AI ScamShield: Pre-verifying 3,000-message training dataset...");
    const datasetPath = generateScamShieldDataset();
    console.log(`AI ScamShield: Training dataset finalized at ${datasetPath}`);
  } catch (err) {
    console.error("AI ScamShield: Dataset generation failed:", err);
  }

  // 2. --- BACKEND API ENDPOINTS ---

  // GET /api/health
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", isGeminiConfigured: !!ai });
  });

  // GET /api/dataset/download - Stream training dataset to user
  app.get("/api/dataset/download", (req, res) => {
    const datasetPath = path.join(process.cwd(), "dataset.csv");
    if (fs.existsSync(datasetPath)) {
      res.setHeader("Content-Disposition", "attachment; filename=scamshield_dataset.csv");
      res.setHeader("Content-Type", "text/csv");
      fs.createReadStream(datasetPath).pipe(res);
    } else {
      res.status(404).json({ error: "Dataset file not generated yet." });
    }
  });

  // POST /api/train - Train local Logistic Regression ML model on custom 3,000 CSV file in real-time
  app.get("/api/train-status", (req, res) => {
    res.json({ vocabularySize: localClassifier.vocabList.length });
  });

  app.post("/api/train", async (req, res) => {
    try {
      console.log("AI ScamShield: Tracing dataset.csv to initialize model training...");
      generateScamShieldDataset(); // guarantee existence
      const datasetPath = path.join(process.cwd(), "dataset.csv");
      
      const fileContent = fs.readFileSync(datasetPath, "utf8");
      const lines = fileContent.split(/\r?\n/);
      
      const trainingInstances: Array<{ text: string; label: ScamLabel }> = [];
      
      // Quick CSV Parser skipping header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Match: "message","prediction","category"
        const matches = line.match(/^"([\s\S]*?)","(safe|suspicious|scam)","([\s\S]*?)"$/);
        if (matches) {
          const message = matches[1];
          const prediction = matches[2].toUpperCase() as ScamLabel;
          trainingInstances.push({ text: message, label: prediction });
        }
      }

      if (trainingInstances.length === 0) {
        return res.status(400).json({ error: "Could not parse any valid training examples." });
      }

      console.log(`AI ScamShield: Launching ML training on ${trainingInstances.length} processed corpus items...`);
      const startTime = Date.now();
      localClassifier.train(trainingInstances, 35, 0.1); // train local coefficients
      const duration = Date.now() - startTime;

      // Evaluate accuracy over trained dataset
      let correct = 0;
      trainingInstances.forEach(ins => {
        const pred = localClassifier.predict(ins.text).prediction;
        if (pred === ins.label) correct++;
      });
      const accuracy = (correct / trainingInstances.length) * 100;

      res.json({
        success: true,
        instancesCount: trainingInstances.length,
        vocabularySize: localClassifier.vocabList.length,
        durationMs: duration,
        accuracy: parseFloat(accuracy.toFixed(2))
      });
    } catch (err: any) {
      console.error("AI ScamShield: Model training triggered an error:", err);
      res.status(500).json({ error: err.message || "Failed to train localized classifier." });
    }
  });

  // POST /api/analyze - Complete analyzer engine integrating Local TF-IDF and Gemini deep analysis
  app.post("/api/analyze", async (req, res) => {
    const { text, type, enableGemini } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Input text is required to run analysis." });
    }

    try {
      console.log(`AI ScamShield: Analyzing text length=${text.length} channel=${type || "SMS"}`);

      // 1. Core Heuristic and Local Extraction Logic
      const lowercaseText = text.toLowerCase();
      
      // Pattern Detections
      const urlRegex = /(https?:\/\/[^\s\/\?#]+\.[^\s]*|www\.[^\s]+\.[^\s]+|shorturl\.at\/[^\s]+|wa\.me\/[^\s]+|t\.me\/[^\s]+)/gi;
      const phoneRegex = /(\+?\d[\d-\s]{8,14}\d)/g;
      const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;

      const detected_urls = text.match(urlRegex) || [];
      const detected_phones = text.match(phoneRegex) || [];
      const detected_emails = text.match(emailRegex) || [];

      // Clean urls
      const cleanedUrls = detected_urls.map((u: string) => u.trim().replace(/[.,]$/, ""));
      const cleanedPhones = detected_phones.map((p: string) => p.trim());
      const cleanedEmails = detected_emails.map((e: string) => e.trim());

      // Indian QR Scam indicators (UPI request requests involving receiving money via scanning)
      const qrRegex = /(scan.*qr|gpay.*qr|paytm.*qr|qr.*code.*receive|scan.*code.*get|receive.*money.*scan)/gi;
      const qr_scam_detected = qrRegex.test(lowercaseText);

      // Financial Request Detection
      const moneyRegex = /(gpay|paytm|phonepe|transfer|deposit|account|rbi|upi|fees|cash|lakh|crore|send.*money|receive.*money|bonus|lottery)/gi;
      const financial_request = moneyRegex.test(lowercaseText);

      // Urgency indicators
      const urgencyRegex = /(urgent|immediate|hurry|locked|suspended|blocked|expire|within.*hour|kyc.*update|hours|now|fast)/gi;
      const matchesUrgency = lowercaseText.match(urgencyRegex) || [];
      const urgency_score = Math.min(100, Math.round((matchesUrgency.length * 25)));

      // Threat indicators
      const threatRegex = /(police|arrest|cbi|rbi|law|court|summons|illegal|tax|jail|fine|frozen|suspend)/gi;
      const matchesThreat = lowercaseText.match(threatRegex) || [];
      const threat_score = Math.min(100, Math.round((matchesThreat.length * 30)));

      // 2. Perform Local Machine Learning prediction
      const localML = localClassifier.predict(text);

      // Initialize default ScanResult populated by Local ML with safety recommendations
      let result: ScanResult = {
        prediction: localML.prediction,
        confidence_score: localML.confidence_score,
        risk_score: localML.risk_score,
        trust_score: localML.trust_score,
        category: ScamCategory.SAFE,
        urgency_score,
        threat_score,
        financial_request,
        detected_keywords: Array.from(new Set([...tokenize(text)]))
          .filter(word => {
            const exp = localClassifier.getKeywordExplanations(text);
            return exp.some(e => e.word === word && e.weight > 0.1);
          })
          .slice(0, 10),
        explanation: "Analyzed locally under edge machine learning models.",
        detected_urls: cleanedUrls,
        detected_phones: cleanedPhones,
        detected_emails: cleanedEmails,
        qr_scam_detected,
        recommendations: {
          english: ["Always check URL names carefully.", "Do not click unverified links from unknown messages."],
          hindi: ["कभी भी अनजान लिंक पर क्लिक न करें।", "संदिग्ध होने पर अपने बैंक से संपर्क करें।"]
        }
      };

      // Best guess category based on heuristics if offline
      if (result.prediction !== "SAFE") {
        if (/otp|code|pin|verification/i.test(lowercaseText)) {
          result.category = ScamCategory.OTP;
        } else if (/upi|paytm|gpay|ref|phonepe/i.test(lowercaseText)) {
          result.category = ScamCategory.UPI;
        } else if (/bank|kcy|pan|aadhar|locked|sbi|icici|hdfc/i.test(lowercaseText)) {
          result.category = ScamCategory.BANKING;
        } else if (/lottery|kb|won|prize|crore|lakh/i.test(lowercaseText)) {
          result.category = ScamCategory.LOTTERY;
        } else if (/job|part.time|earn|recruit/i.test(lowercaseText)) {
          result.category = ScamCategory.JOB;
        } else if (/loan|approved|verification|finance/i.test(lowercaseText)) {
          result.category = ScamCategory.LOAN;
        } else if (/crypto|bitcoin|usdt|profit/i.test(lowercaseText)) {
          result.category = ScamCategory.CRYPTO;
        } else if (/invest|returns|bot|stocks/i.test(lowercaseText)) {
          result.category = ScamCategory.INVESTMENT;
        } else {
          result.category = ScamCategory.BANKING; // default scam fallback category
        }
        
        result.explanation = `Edge ML flagged this message with high probability of suspicious traits. Keywords matched suggest a potential ${result.category} threat.`;
        
        // Multi-language safety recommendation engine
        if (result.category === ScamCategory.BANKING) {
          result.recommendations.english = [
            "Never tap on external links to complete KYC verification.",
            "Banks will never ask for complete account passwords or credentials via SMS.",
            "Inspect details by visiting your official branch or checking bank mobile application."
          ];
          result.recommendations.hindi = [
            "kyc पूर्ण करने के लिए कभी भी बाहरी लिंक पर क्लिक न करें।",
            "बैंक कभी भी मोबाइल नंबर पर मैसेज भेजकर गोपनीय लॉगिन पासवर्ड नहीं मांगते।",
            "संदिग्ध होने पर सीधे अपनी बैंक शाखा या आधिकारिक सहायता के माध्यम से पुष्टि करें।"
          ];
        } else if (result.category === ScamCategory.OTP) {
          result.recommendations.english = [
            "Advisory: Do not share One Time Passwords (OTPs) under any scenario.",
            "OTP sharing enables fraudsters to bind cards to external virtual wallets instantly.",
            "Strictly report calling executives who pressure you to reveal OTP keys immediately."
          ];
          result.recommendations.hindi = [
            "सावधानी: किसी के भी साथ अपना ओटीपी (OTP) साझा न करें।",
            "ओटीपी साझा करने से जालसाज तुरंत बैंक खाते से पैसे उड़ा सकते हैं।",
            "जल्दबाजी करने वाले अज्ञात कॉल्स को तुरंत डिस्कनेक्ट करें।"
          ];
        } else if (result.category === ScamCategory.UPI) {
          result.recommendations.english = [
            "Entering your UPI PIN is ONLY meant for sending money, never for receiving rewards.",
            "Reject cashback request pages on Paytm or GPay showing up as random payment prompts.",
            "UPI links sent from unknown parties pose critical exploitation risks."
          ];
          result.recommendations.hindi = [
            "यूपीआई पिन हमेशा पैसे भेजने के लिए दर्ज किया जाता है, पैसे प्राप्त करने के लिए कभी नहीं।",
            "पेटीएम या फोनपे पर कैशबैक प्राप्त करने के दावों को तुरंत खारिज करें।"
          ];
        } else if (result.category === ScamCategory.LOTTERY) {
          result.recommendations.english = [
            "Lottery scams seek initial deposit fees disguised as processing or clearance taxes.",
            "KBC or regulatory bodies like RBI do not organize generic sweepstakes on WhatsApp.",
            "Block numbers promising grand returns without explicit official authorizations."
          ];
          result.recommendations.hindi = [
            "लॉटरी घोटाले शुरू में टैक्स या फाइल शुल्क के नाम पर पैसों की मांग करते हैं।",
            "केबीसी या आरबीआई व्हाट्सएप के माध्यम से लॉटरी का वितरण नहीं करते हैं।"
          ];
        } else {
          result.recommendations.english = [
            "Do not transfer processing fees or personal identities to stranger profiles.",
            "Reject high-interest cryptos or part-time Youtube watch assignments.",
            "When in doubt, block and file reports on cybercrime.gov.in."
          ];
          result.recommendations.hindi = [
            "अज्ञात व्यक्तियों को फीस ट्रांसफर न करें और न ही आधार/पैन की कॉपियां साझा करें।",
            "संदिग्ध ऑफर्स के लिए cybercrime.gov.in (भारतीय साइबर अपराध सेल) में शिकायत दर्ज करें।"
          ];
        }
      } else {
        result.explanation = "No standard phishing signatures matched. Edge ML predicts this message is likely genuine and safe to engage with.";
        result.recommendations.english = [
          "This message looks clean and normal.",
          "However, remain cautious about sharing passwords if the conversation changes direction."
        ];
        result.recommendations.hindi = [
          "यह संदेश सामान्य और सुरक्षित प्रतीत होता है।",
          "यदि भविष्य में वित्तीय विवरण मांगे जाएं, तो सावधानी बरतें।"
        ];
      }

      // 3. Optional Expert Model Upgrades (Gemini API schema validation block)
      const shouldQueryGemini = enableGemini === true && ai !== null;
      
      if (shouldQueryGemini) {
        console.log("AI ScamShield: Invoking Gemini 3.5 expert model for deep inspection...");

        const systemText = `You are the core intelligence processor of 'AI ScamShield', a highly secure, final-year college project analyzing SMS, WhatsApp, Emails, and Call Transcripts. 
        Your task is to analyze the user's message text and provide deep threat modeling, scam category identification, explainable AI markers, and custom multi-lingual advice (English + Hindi) as structured JSON matching the database schema.
        
        The possible ScamCategories are:
        - "Banking Scam" (includes bank suspensions, KYC updates, fake links, PAN blockages)
        - "OTP Scam" (requesting code shares, fake alerts asking to share PIN, transaction blocks)
        - "UPI Scam" (claiming cashbacks requiring pin verification, Paytm prize links, request-to-receive scams)
        - "Lottery Scam" (claiming winnings from KBC, RBI, randomly won sweepstakes requiring processing fees)
        - "Job Scam" (promising part-time jobs, YouTube video like tasks paying heavy cash, fake Amazon recruiters)
        - "Loan Scam" (offering pre-approved instant loans without documents, low interest plans, payment required)
        - "Crypto Scam" (promising multi-fold crypto mining profits, Whatsapp/Telegram experts, USDT deposits)
        - "Investment Scam" (offering high returns, stock tips bots, Telegram VIP signal groups, RBI-authorized bots)
        - "None (Safe Message)" (for legitimate delivery alerts, college announcements, family chats, reminders)

        The possible Predictions are:
        - "SAFE" (totally authentic, cooperative or friendly contents)
        - "SUSPICIOUS" (borderline logins, password attempts, high-priority system alerts with zero links or calls to action)
        - "SCAM" (clear-cut phishing, requests to receive money, suspicious link clicks, or sharing of codes)`;

        const formatPrompt = `Analyze the following message of type: "${type || "SMS"}". Analyze carefully for English, Hindi (Devanagari script), or Hinglish (Hindi written in Latin script).
        
        --- Message Target Text ---
        "${text}"
        ---------------------------

        Assess this text and return structured JSON matching these exact properties:
        - category: matching the exactly specified list above.
        - prediction: matching "SAFE", "SUSPICIOUS", or "SCAM".
        - risk_score: integer from 0 to 100 indicating general risk level.
        - trust_score: integer from 0 to 100.
        - confidence_score: integer from 0 to 100 indicating your confidence in this categorization.
        - urgency_score: integer from 0 to 100 indicating levels of pressure words or time clamps.
        - threat_score: integer from 0 to 100 indicating levels of intimidation (e.g. police summons, bank account blockage, tax arrest).
        - financial_request: boolean indicating if it requests transfers, upi pins, deposits, or transactions.
        - detected_keywords: an array of 4-7 specific high-alert words triggers extracted from the message.
        - explanation: 2 to 3 sentences detailing exactly why you made this prediction, highlighting exact tactics used (e.g., domain spoofing, urgency traps, emotional triggers).
        - recommendations_english: array of 3 actionable safety precautions in English.
        - recommendations_hindi: array of 3 actionable safety precautions in Hindi (written in Devanagari script).
        
        Note: Be extremely precise. For Hinglish/Hindi text, translate mentally and flag threats properly. Keep recommendations extremely specific.`;

        try {
          const response = await ai!.models.generateContent({
            model: "gemini-3.5-flash",
            contents: formatPrompt,
            config: {
              systemInstruction: systemText,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  prediction: { type: Type.STRING },
                  risk_score: { type: Type.INTEGER },
                  trust_score: { type: Type.INTEGER },
                  confidence_score: { type: Type.INTEGER },
                  urgency_score: { type: Type.INTEGER },
                  threat_score: { type: Type.INTEGER },
                  financial_request: { type: Type.BOOLEAN },
                  detected_keywords: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  explanation: { type: Type.STRING },
                  recommendations_english: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  recommendations_hindi: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: [
                  "category", "prediction", "risk_score", "trust_score", "confidence_score",
                  "urgency_score", "threat_score", "financial_request", "detected_keywords",
                  "explanation", "recommendations_english", "recommendations_hindi"
                ]
              }
            }
          });

          if (response.text) {
            const rawJson = JSON.parse(response.text.trim());
            
            // Map JSON properties to our ScanResult schema
            let mappedCategory: ScamCategory = ScamCategory.SAFE;
            const categoryInput = rawJson.category;
            
            if (Object.values(ScamCategory).includes(categoryInput as ScamCategory)) {
              mappedCategory = categoryInput as ScamCategory;
            } else {
              // Best smart matching if category string differs slightly
              if (/bank/i.test(categoryInput)) mappedCategory = ScamCategory.BANKING;
              else if (/otp/i.test(categoryInput)) mappedCategory = ScamCategory.OTP;
              else if (/upi/i.test(categoryInput)) mappedCategory = ScamCategory.UPI;
              else if (/lottery/i.test(categoryInput)) mappedCategory = ScamCategory.LOTTERY;
              else if (/job/i.test(categoryInput)) mappedCategory = ScamCategory.JOB;
              else if (/loan/i.test(categoryInput)) mappedCategory = ScamCategory.LOAN;
              else if (/crypto/i.test(categoryInput)) mappedCategory = ScamCategory.CRYPTO;
              else if (/invest/i.test(categoryInput)) mappedCategory = ScamCategory.INVESTMENT;
            }

            result = {
              prediction: (rawJson.prediction as ScamLabel) || result.prediction,
              confidence_score: rawJson.confidence_score || result.confidence_score,
              risk_score: rawJson.risk_score !== undefined ? rawJson.risk_score : result.risk_score,
              trust_score: rawJson.trust_score !== undefined ? rawJson.trust_score : result.trust_score,
              category: mappedCategory,
              urgency_score: rawJson.urgency_score !== undefined ? rawJson.urgency_score : result.urgency_score,
              threat_score: rawJson.threat_score !== undefined ? rawJson.threat_score : result.threat_score,
              financial_request: rawJson.financial_request !== undefined ? rawJson.financial_request : result.financial_request,
              detected_keywords: rawJson.detected_keywords || result.detected_keywords,
              explanation: rawJson.explanation || result.explanation,
              detected_urls: cleanedUrls,
              detected_phones: cleanedPhones,
              detected_emails: cleanedEmails,
              qr_scam_detected: qr_scam_detected || rawJson.qr_scam_detected || false,
              recommendations: {
                english: rawJson.recommendations_english || result.recommendations.english,
                hindi: rawJson.recommendations_hindi || result.recommendations.hindi
              }
            };
            console.log(`AI ScamShield: Gemini threat-analysis complete. Label=${result.prediction} Category=${result.category}`);
          }
        } catch (gemIniErr) {
          console.error("AI ScamShield: Gemini execution failed, falling back to local ML prediction:", gemIniErr);
          result.explanation = `[Gemini fallback] Processed locally. ${result.explanation}`;
        }
      }

      // 4. SAVE COMPLETED SCAN RECORD INTO DATABASE SQL TABLES CODES
      const savedScan = dbManager.scanHistory.create(
        text,
        result.prediction,
        result.category,
        result.risk_score,
        result.trust_score,
        result.confidence_score
      );

      // Save extracted vectors/features to feature logs table
      if (result.financial_request) {
        dbManager.detectedFeatures.create(savedScan.id, "Financial Request Flag", "Requests direct transfer, wallet deposit or login sharing");
      }
      if (result.urgency_score > 50) {
        dbManager.detectedFeatures.create(savedScan.id, "High Pressure Urgency", `Contains rush clauses, scored priority limit code: ${result.urgency_score}`);
      }
      if (result.threat_score > 50) {
        dbManager.detectedFeatures.create(savedScan.id, "Coercive Intimidation Threat", `Matches threat/legal terminology pattern scores: ${result.threat_score}`);
      }
      if (result.detected_urls.length > 0) {
        dbManager.detectedFeatures.create(savedScan.id, "Spoofed Domain Pointer", `Links harvested: ${result.detected_urls.join(", ")}`);
      }
      if (result.qr_scam_detected) {
        dbManager.detectedFeatures.create(savedScan.id, "UPI QR Receive Request", "Mentions code-scanning specifically targeting UPI incoming credits");
      }
      if (result.detected_phones.length > 0) {
        dbManager.detectedFeatures.create(savedScan.id, "Alert Source Contact", `Associated telephone triggers: ${result.detected_phones.join(", ")}`);
      }

      // Add actual edge ML class probabilities in details
      dbManager.detectedFeatures.create(
        savedScan.id,
        "Edge Model Probabilities",
        `SAFE: ${Math.round(localML.probabilities.SAFE * 100)}%, SUSPICIOUS: ${Math.round(localML.probabilities.SUSPICIOUS * 100)}%, SCAM: ${Math.round(localML.probabilities.SCAM * 100)}%`
      );

      res.json({
        id: savedScan.id,
        ...result,
        localModelPrediction: localML.prediction,
        localModelProbabilities: localML.probabilities,
        isExpertAIResponse: shouldQueryGemini
      });

    } catch (err: any) {
      console.error("AI ScamShield: Endpoint processing error:", err);
      res.status(500).json({ error: err.message || "Threat analyzer crashed during evaluation." });
    }
  });

  // GET /api/history - Return full logged database records
  app.get("/api/history", (req, res) => {
    try {
      const scans = dbManager.scanHistory.findAll();
      // append threat features detail mapped directly via scan relation joins
      const historyWithFeatures = scans.map(s => {
        const features = dbManager.detectedFeatures.findByScanId(s.id);
        return {
          ...s,
          features
        };
      });
      res.json(historyWithFeatures);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch scan repository." });
    }
  });

  // GET /api/stats - Dashboard metric bento aggregator
  app.get("/api/stats", (req, res) => {
    try {
      const stats = dbManager.scanHistory.getStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to compile dataset analytics." });
    }
  });

  // DELETE /api/history/:id - Clear relational parameters
  app.delete("/api/history/:id", (req, res) => {
    const { id } = req.params;
    try {
      const deleted = dbManager.scanHistory.delete(id);
      if (deleted) {
        res.json({ success: true, message: `Removed audit scan vector ID: ${id}` });
      } else {
        res.status(404).json({ error: "Scanned profile node not found." });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update relational history node." });
    }
  });

  // DELETE /api/history - Reset database
  app.delete("/api/history", (req, res) => {
    try {
      dbManager.scanHistory.clearAll();
      res.json({ success: true, message: "Relational scam shields dataset reset successfully." });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to purge threat database logs." });
    }
  });


  // 3. --- EMBED VITE MIDDLEWARE INTERCEPT FOR INGRESS ROUTE RESOLUTIONS ---

  if (process.env.NODE_ENV !== "production") {
    console.log("AI ScamShield: Mounting reactive Vite development server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    console.log(`AI ScamShield: Serving compiled production assets located in ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI ScamShield Server is online, responding at http://localhost:${PORT}`);
  });
}

startServer();
