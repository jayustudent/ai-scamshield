/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScamLabel } from "../types";

/**
 * Clean and tokenize a text message: lowercase, remove punctuation, split by whitespace.
 */
export function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s\d]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 2); // filter short words to keep clean vectors
}

export interface TrainingInstance {
  text: string;
  label: ScamLabel;
}

export class LocalScamClassifier {
  public vocabulary: Set<string> = new Set();
  public vocabList: string[] = [];
  public idf: Record<string, number> = {};
  
  // Weights map: class -> (word -> weight)
  public weights: {
    SAFE: Record<string, number>;
    SUSPICIOUS: Record<string, number>;
    SCAM: Record<string, number>;
  } = {
    SAFE: {},
    SUSPICIOUS: {},
    SCAM: {}
  };

  // Bias for each class
  public biases: Record<ScamLabel, number> = {
    SAFE: 0.1,
    SUSPICIOUS: -0.1,
    SCAM: -0.1
  };

  private isTrained = false;

  constructor() {
    this.seedPriorKnowledge();
  }

  /**
   * Seed standard threat vocabulary and weights to ensure out-of-the-box local intelligence
   * before any dynamic dataset training is executed.
   */
  private seedPriorKnowledge() {
    // Highly informative words
    const safeWords = [
      "meeting", "schedule", "tomorrow", "project", "class", "homework", 
      "mom", "dad", "dadu", "dinner", "home", "ok", "cool", "lunch", "coffee",
      "exam", "assignment", "lecture", "professor", "colleague", "delivered",
      "shipping", "received", "receipt", "order", "invoice", "hi", "thanks", "hello",
      "reminder", "submitting", "calendar", "study", "group", "remind", "thanks", "sure"
    ];

    const suspiciousWords = [
      "dear", "customer", "important", "alert", "notice", "attention", "immediate",
      "warning", "update", "required", "access", "temporarily", "locked", "verify",
      "account", "pending", "transfer", "transaction", "code", "security", "limit",
      "expire", "soon", "hurry"
    ];

    const scamWords = [
      "lakh", "crore", "lottery", "prize", "won", "winner", "reward", "cash",
      "otp", "pin", "cvv", "bank", "freeze", "suspended", "police", "arrest",
      "cbi", "rbi", "income_tax", "kyc", "pan", "aadhar", "link", "click", "claim",
      "job", "offer", "earn", "salary", "loan", "approved", "crypto", "bitcoin",
      "investment", "profit", "telegram", "whatsapp", "income", "interest", "bonus",
      "gift", "card", "free", "vouchers", "summons", "cbi_office", "legal", "court"
    ];

    // Build initial vocabulary
    const allWords = [...safeWords, ...suspiciousWords, ...scamWords];
    allWords.forEach(word => this.vocabulary.add(word));
    this.vocabList = Array.from(this.vocabulary);

    // Initialize initial IDFs randomly or as standard defaults
    this.vocabList.forEach(word => {
      this.idf[word] = 1.5; // default moderate importance
    });
    safeWords.forEach(w => this.idf[w] = 1.2);
    suspiciousWords.forEach(w => this.idf[w] = 1.4);
    scamWords.forEach(w => this.idf[w] = 1.8); // higher weights on dangerous terms

    // Seed direct weights (Safe terms boost SAFE class, subtract Suspicious/Scam, etc.)
    this.vocabList.forEach(word => {
      this.weights.SAFE[word] = 0.0;
      this.weights.SUSPICIOUS[word] = 0.0;
      this.weights.SCAM[word] = 0.0;
    });

    safeWords.forEach(word => {
      this.weights.SAFE[word] = 1.8;
      this.weights.SUSPICIOUS[word] = -0.5;
      this.weights.SCAM[word] = -1.5;
    });

    suspiciousWords.forEach(word => {
      this.weights.SAFE[word] = -0.6;
      this.weights.SUSPICIOUS[word] = 1.5;
      this.weights.SCAM[word] = 0.5;
    });

    scamWords.forEach(word => {
      this.weights.SAFE[word] = -2.5;
      this.weights.SUSPICIOUS[word] = 0.2;
      this.weights.SCAM[word] = 2.8;
    });

    this.isTrained = true;
  }

  /**
   * Compute TF-IDF vector for a text document.
   * Returns a map of word -> tfIdfValue.
   */
  public getTfIdfVector(text: string): Record<string, number> {
    const tokens = tokenize(text);
    const tf: Record<string, number> = {};
    
    tokens.forEach(tok => {
      tf[tok] = (tf[tok] || 0) + 1;
    });

    const vector: Record<string, number> = {};
    Object.keys(tf).forEach(tok => {
      if (this.vocabulary.has(tok)) {
        const tfValue = tf[tok] / tokens.length;
        const idfValue = this.idf[tok] || 1.0;
        vector[tok] = tfValue * idfValue;
      }
    });

    return vector;
  }

  /**
   * Train the classifier using Logistic Regression (with Softmax) and gradient descent over a custom dataset.
   */
  public train(instances: TrainingInstance[], epochs = 35, learningRate = 0.1) {
    if (instances.length === 0) return;

    // 1. Re-build vocabulary and TF-IDF structures from the dynamic dataset
    const newVocab = new Set<string>();
    const docCounts: Record<string, number> = {};
    const N = instances.length;

    instances.forEach(ins => {
      const tokens = Array.from(new Set(tokenize(ins.text)));
      tokens.forEach(tok => {
        if (tok.length > 2) {
          newVocab.add(tok);
          docCounts[tok] = (docCounts[tok] || 0) + 1;
        }
      });
    });

    this.vocabulary = newVocab;
    this.vocabList = Array.from(newVocab);

    // 2. Compute Inverse Document Frequency (IDF)
    this.idf = {};
    this.vocabList.forEach(word => {
      // idf = ln(N / (df + 1))
      this.idf[word] = Math.log(N / (docCounts[word] + 1)) + 1.0;
    });

    // 3. Initialize Weights to 0
    this.weights = {
      SAFE: {},
      SUSPICIOUS: {},
      SCAM: {}
    };
    
    this.vocabList.forEach(word => {
      this.weights.SAFE[word] = 0.0;
      this.weights.SUSPICIOUS[word] = 0.0;
      this.weights.SCAM[word] = 0.0;
    });

    this.biases = {
      SAFE: 0.0,
      SUSPICIOUS: 0.0,
      SCAM: 0.0
    };

    // Pre-calculate TF-IDF vectors for all training documents to optimize speed
    const vectors = instances.map(ins => this.getTfIdfVector(ins.text));

    // 4. Run Softmax / Multiclass Gradient Descent Optimization
    const labels: ScamLabel[] = ["SAFE", "SUSPICIOUS", "SCAM"];

    for (let epoch = 0; epoch < epochs; epoch++) {
      for (let i = 0; i < N; i++) {
        const ins = instances[i];
        const vec = vectors[i];
        
        // Compute raw logits: score = bias + sum(feature * weight)
        const logits: Record<ScamLabel, number> = { SAFE: 0, SUSPICIOUS: 0, SCAM: 0 };
        labels.forEach(label => {
          let score = this.biases[label];
          Object.keys(vec).forEach(word => {
            score += vec[word] * (this.weights[label][word] || 0);
          });
          logits[label] = score;
        });

        // Compute Softmax probabilities
        const maxLogit = Math.max(logits.SAFE, logits.SUSPICIOUS, logits.SCAM);
        const expSafe = Math.exp(logits.SAFE - maxLogit);
        const expSusp = Math.exp(logits.SUSPICIOUS - maxLogit);
        const expScam = Math.exp(logits.SCAM - maxLogit);
        const sumExp = expSafe + expSusp + expScam;

        const probs = {
          SAFE: expSafe / sumExp,
          SUSPICIOUS: expSusp / sumExp,
          SCAM: expScam / sumExp
        };

        // Targets: one-hot encoding
        const targets = {
          SAFE: ins.label === "SAFE" ? 1.0 : 0.0,
          SUSPICIOUS: ins.label === "SUSPICIOUS" ? 1.0 : 0.0,
          SCAM: ins.label === "SCAM" ? 1.0 : 0.0
        };

        // Update weights and biases: grad = (prob - target)
        labels.forEach(label => {
          const error = probs[label] - targets[label];
          // Update bias
          this.biases[label] -= learningRate * error;
          
          // Update sparse weights matching active tokens
          Object.keys(vec).forEach(word => {
            if (this.weights[label][word] === undefined) {
              this.weights[label][word] = 0.0;
            }
            this.weights[label][word] -= learningRate * error * vec[word];
          });
        });
      }
    }

    this.isTrained = true;
  }

  /**
   * Predict the class probabilities for a message text.
   * Returns predictions, trust, risk, and confidence metrics.
   */
  public predict(text: string): {
    prediction: ScamLabel;
    confidence_score: number;
    risk_score: number;
    trust_score: number;
    probabilities: Record<ScamLabel, number>;
  } {
    const vec = this.getTfIdfVector(text);
    
    const labels: ScamLabel[] = ["SAFE", "SUSPICIOUS", "SCAM"];
    const logits: Record<ScamLabel, number> = { SAFE: 0, SUSPICIOUS: 0, SCAM: 0 };
    
    labels.forEach(label => {
      let score = this.biases[label];
      Object.keys(vec).forEach(word => {
        score += vec[word] * (this.weights[label][word] || 0);
      });
      logits[label] = score;
    });

    // Softmax
    const maxLogit = Math.max(logits.SAFE, logits.SUSPICIOUS, logits.SCAM);
    const expSafe = Math.exp(logits.SAFE - maxLogit);
    const expSusp = Math.exp(logits.SUSPICIOUS - maxLogit);
    const expScam = Math.exp(logits.SCAM - maxLogit);
    const sumExp = expSafe + expSusp + expScam;

    const probs = {
      SAFE: expSafe / sumExp,
      SUSPICIOUS: expSusp / sumExp,
      SCAM: expScam / sumExp
    };

    // Calculate winning prediction
    let winningClass: ScamLabel = "SAFE";
    let maxProbs = probs.SAFE;

    if (probs.SUSPICIOUS > maxProbs) {
      winningClass = "SUSPICIOUS";
      maxProbs = probs.SUSPICIOUS;
    }
    if (probs.SCAM > probs.SUSPICIOUS && probs.SCAM > probs.SAFE) {
      winningClass = "SCAM";
      maxProbs = probs.SCAM;
    }

    // Map probabilities to confidence, risk, and trust scores
    // Confidence coefficient is how much winning category dominates
    const confidence_score = Math.round(maxProbs * 100);

    // Risk score: scale based on probability of susp and scam
    // risk = [Prob(SUSP) * 0.5 + Prob(SCAM) * 1.0] * 100
    const risk_score = Math.round((probs.SUSPICIOUS * 0.4 + probs.SCAM * 1.0) * 100);

    // Trust score is high for SAFE, drops as SUSP or SCAM grows
    const trust_score = Math.round(probs.SAFE * 100);

    return {
      prediction: winningClass,
      confidence_score: Math.max(1, Math.min(99, confidence_score)),
      risk_score: Math.max(1, Math.min(99, risk_score)),
      trust_score: Math.max(1, Math.min(99, trust_score)),
      probabilities: probs
    };
  }

  /**
   * Returns features that contributed most heavily to the decision.
   * Helps power explainability dashboards.
   */
  public getKeywordExplanations(text: string): Array<{ word: string; category: ScamLabel; weight: number }> {
    const vec = this.getTfIdfVector(text);
    const words = Object.keys(vec);
    const explanations: Array<{ word: string; category: ScamLabel; weight: number }> = [];

    words.forEach(word => {
      const safeW = this.weights.SAFE[word] || 0;
      const suspW = this.weights.SUSPICIOUS[word] || 0;
      const scamW = this.weights.SCAM[word] || 0;

      let winningCat: ScamLabel = "SAFE";
      let maxW = safeW;

      if (suspW > maxW) {
        winningCat = "SUSPICIOUS";
        maxW = suspW;
      }
      if (scamW > suspW && scamW > safeW) {
        winningCat = "SCAM";
        maxW = scamW;
      }

      if (Math.abs(maxW) > 0.05) {
        explanations.push({
          word,
          category: winningCat,
          weight: parseFloat(maxW.toFixed(3))
        });
      }
    });

    return explanations.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
  }
}
