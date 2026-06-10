/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from "fs";
import * as path from "path";

// Datastructures to randomize and seed 3000 items (1000 of each: safe, suspicious, scam)
const RETAILERS = ["Amazon", "Flipkart", "Myntra", "Ajio", "Meesho", "Zomato", "Swiggy", "Tata Cliq"];
const BANKS = ["SBI", "HDFC", "ICICI", "Axis Bank", "Punjab National Bank", "Canara Bank", "Bank of Baroda", "Kotak Mahindra"];
const COLLEGES = ["IIT Delhi", "BITS Pilani", "Delhi University", "VIT Vellore", "SRM Institute", "Symbiosis", "Amity University", "DTU"];
const SUBJECTS = ["Machine Learning", "Cybersecurity", "Software Engineering", "Mathematics", "DB Management", "Distributed Systems"];
const PROFESSORS = ["Prof. Sharma", "Dr. Verma", "Prof. Iyer", "Dr. Mehta", "Prof. Choudhury", "Dr. Gupta"];
const ROOMS = ["Seminar Hall B", "Room 402", "CS Lab 3", "Auditorium 1", "Block C-205", "Online Teams Room"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TOPICS = ["project milestone review", "thesis defense prep", "code audit review", "internship feedback", "mid-term syllabus briefing"];
const FAMILY_WORDS = ["sab theek hai na?", "how are you baby?", "ghar kab aa rahe ho?", "khana kha liya?", "papa is asking about your test result", "take care of your health"];
const FAMILY_ACTIONS = ["call me back", "send some home photos", "we are visiting next week", "your parcel arrived here", "tell dad if you need anything"];
const DOMAINS = ["sbi-safe-update.com", "hdfc-verification-panel.net", "verify-online-kyc.org", "axis-bank-login.cc", "secure-upi-pay.in", "lotterybazaar.info", "earn-daily-work.co", "loan-instant-approval.xyz"];
const MONEY_PEOPLE = ["KBC Lottery Board", "Kaun Banega Crorepati Team", "RBI Reward Department", "Presidential Grant Group", "Google Promo Coordinator"];

export function generateScamShieldDataset(): string {
  const datasetPath = path.join(process.cwd(), "dataset.csv");

  // If CSV already exists, just return its location or load confirmation
  if (fs.existsSync(datasetPath)) {
    return datasetPath;
  }

  const records: Array<{ text: string; label: string; category: string }> = [];

  // --- 1. GENERATE 1000 SAFE MESSAGES ---
  // Delivery (200), College Notices (200), Shopping Confirmations (200), Meeting Reminders (200), Family (200)
  for (let i = 0; i < 200; i++) {
    const r = RETAILERS[i % RETAILERS.length];
    const trackId = `IN${100000 + i}XP`;
    const status = i % 2 === 0 ? "has been safely delivered to your security desk" : "is out for delivery today. Please collect it";
    records.push({
      text: `Your package from ${r} with tracking ID ${trackId} ${status}. Contact counter if you did not receive it. Thank you of shopping.`,
      label: "safe",
      category: "None (Safe Message)"
    });
  }

  for (let i = 0; i < 200; i++) {
    const col = COLLEGES[i % COLLEGES.length];
    const sub = SUBJECTS[i % SUBJECTS.length];
    const prof = PROFESSORS[i % PROFESSORS.length];
    const rm = ROOMS[i % ROOMS.length];
    const day = DAYS[i % DAYS.length];
    const hr = 9 + (i % 8);
    records.push({
      text: `Notice from ${col}: The guest lecture on ${sub} by ${prof} has been scheduled for ${day} at ${hr}:00 AM at ${rm}. Attendance is mandatory.`,
      label: "safe",
      category: "None (Safe Message)"
    });
  }

  for (let i = 0; i < 200; i++) {
    const rx = RETAILERS[i % RETAILERS.length];
    const ordId = `ORD-${876210 + i}`;
    const amount = 499 + (i * 12);
    records.push({
      text: `Thank you for your order ${ordId} under ${rx}. We have received your payment of Rs ${amount}. Your shipment is being packed. Track progress under the official app.`,
      label: "safe",
      category: "None (Safe Message)"
    });
  }

  for (let i = 0; i < 200; i++) {
    const topic = TOPICS[i % TOPICS.length];
    const prof = PROFESSORS[i % PROFESSORS.length];
    const day = DAYS[i % DAYS.length];
    const hr = 2 + (i % 4);
    records.push({
      text: `Hi student, this is a reminder regarding our scheduled academic meeting on "${topic}" with ${prof} on ${day} afternoon at ${hr}:30 PM. Please be prompt.`,
      label: "safe",
      category: "None (Safe Message)"
    });
  }

  for (let i = 0; i < 200; i++) {
    const fWord = FAMILY_WORDS[i % FAMILY_WORDS.length];
    const fAct = FAMILY_ACTIONS[i % FAMILY_ACTIONS.length];
    const names = ["Beta", "Beta ji", "Beta,", "Chintu", "Sunny", "Rohan", "Sneha", "Didi"];
    const currentName = names[i % names.length];
    records.push({
      text: `Hello ${currentName}, ${fWord} Mom called yesterday and was saying she missed you. ${fAct} whenever you are free from college. Take care!`,
      label: "safe",
      category: "None (Safe Message)"
    });
  }

  // --- 2. GENERATE 1000 SUSPICIOUS MESSAGES ---
  // Suspicious messages are borderline: notifications about password changes, login attempts, bank maintenance limits, or generic high priority warnings.
  const suspiciousTemplates = [
    (idx: number) => {
      const b = BANKS[idx % BANKS.length];
      const code = 10000 + idx;
      return `ALERT: A password change request was detected from an unrecognized IP address for your ${b} Internet Banking account. If this was not you, lock profile instantly.`;
    },
    (idx: number) => {
      const b = BANKS[idx % BANKS.length];
      const cur = idx % 2 === 0 ? "Mumbai" : "Chennai";
      return `WARNING: A login attempt was blocked on your ${b} card from a terminal near ${cur}. Please verify if you authorized this access. Reply block to freeze.`;
    },
    (idx: number) => {
      const b = BANKS[idx % BANKS.length];
      return `Dear Customer, ${b} is undergoing a scheduled security transition. As a result, your withdrawal limit is capped at Rs 5,000. Access full limit by refreshing details in your nearest branch or official application portal.`;
    },
    (idx: number) => {
      const r = RETAILERS[idx % RETAILERS.length];
      return `Dear customer, we detected unusual activities in your ${r} loyalty points wallets. Check recent ledger transfers to make sure no unauthorized claims took place.`;
    },
    (idx: number) => {
      return `HIGH PRIORITY ALERT: Your central storage backup allocation has exceeded 98% space. Sync is temporarily suspended. Please clear backup files immediately or purchase storage expansion.`;
    }
  ];

  for (let i = 0; i < 1000; i++) {
    const templateFn = suspiciousTemplates[i % suspiciousTemplates.length];
    records.push({
      text: templateFn(i),
      label: "suspicious",
      category: "None (Safe Message)"
    });
  }

  // --- 3. GENERATE 1000 SCAM MESSAGES ---
  // Categories: Banking (125), OTP (125), UPI (125), Lottery (125), Job (125), Loan (125), Crypto (125), Investment (125)
  
  // Banking Scam
  for (let i = 0; i < 125; i++) {
    const b = BANKS[i % BANKS.length];
    const dom = DOMAINS[0]; // Banking domain
    records.push({
      text: `Dear customer, your ${b} bank account has been blocked due to missing pan card details. Please update your KYC immediately at https://${dom}/${b}-update to resume transfers.`,
      label: "scam",
      category: "Banking Scam"
    });
  }

  // OTP Scam
  for (let i = 0; i < 125; i++) {
    const b = BANKS[i % BANKS.length];
    const otp = 100000 + i * 7;
    records.push({
      text: `URGENT SECURITY ALERTS: Verification code ${otp} is requested to register a new transaction device of Rs 25,000 on your card. If this wasn't you, call our executive officer immediately at +91900100${100 + i}. Do not share.`,
      label: "scam",
      category: "OTP Scam"
    });
  }

  // UPI Scam
  for (let i = 0; i < 125; i++) {
    const amount = 25000 + i * 200;
    records.push({
      text: `Hello, you have a pending cashback refund of Rs ${amount} approved from Paytm rewards department. Click this UPI link now https://paytm-upi-cashback.in/claim to receive money directly on your UPI wallet!`,
      label: "scam",
      category: "UPI Scam"
    });
  }

  // Lottery Scam
  for (let i = 0; i < 125; i++) {
    const amount = 15 + (i % 10);
    const fee = 12500 + i * 15;
    const org = MONEY_PEOPLE[i % MONEY_PEOPLE.length];
    records.push({
      text: `CONGRATULATIONS!! Your mobile number has won Rs ${amount},00,000 Cash Prize from ${org}. To claim your winning files transfer RBI state fee of Rs ${fee} to UPI kbc-finance@upi now!`,
      label: "scam",
      category: "Lottery Scam"
    });
  }

  // Job Scam
  for (let i = 0; i < 125; i++) {
    const parts = [
      "Work from Home opportunity for college students",
      "Part-time Job Offer from Amazon Recruiting Partners",
      "Earn Rs 4,500 daily by simply rating movies online"
    ];
    const p = parts[i % parts.length];
    records.push({
      text: `JOB OFFER: Earn Rs 5,000 to Rs 12,000 Daily! ${p}. No experience needed, age above 18. Contact HR officer on official Telegram helpline message support: t.me/amazon_job_hr_india${100 + i}. Apply now.`,
      label: "scam",
      category: "Job Scam"
    });
  }

  // Loan Scam
  for (let i = 0; i < 125; i++) {
    const amount = 1 + (i % 5);
    records.push({
      text: `Congratulations! Your pre-approved Personal Loan of Rs ${amount},50,000 is ready for instant transfer without document validation! Flat 0% interest. Click here to confirm application: http://loan-quick-approval.xyz/fastpay`,
      label: "scam",
      category: "Loan Scam"
    });
  }

  // Crypto Scam
  for (let i = 0; i < 125; i++) {
    const multiplier = 5 + (i % 10);
    records.push({
      text: `CRYPTO WEALTH ALERT: Turn Rs 1,000 into Rs ${multiplier},000 in just 3 hours! Our automated expert Bitcoin mining algorithms guarantee instant payouts. Message our advisor at +91809021${100 + i} on WhatsApp for free signup.`,
      label: "scam",
      category: "Crypto Scam"
    });
  }

  // Investment Scam
  for (let i = 0; i < 125; i++) {
    const percent = 200 + i * 2;
    records.push({
      text: `Double your wealth! Get ${percent}% guaranteed monthly returns from our high-frequency stock index trading bots under regulated RBI managers. Join Telegram premium trading signals list now: t.me/rbi_bots_signals`,
      label: "scam",
      category: "Investment Scam"
    });
  }

  // Shuffle records to ensure variety and robust gradient descent training splits
  for (let idx = records.length - 1; idx > 0; idx--) {
    const j = Math.floor(Math.random() * (idx + 1));
    [records[idx], records[j]] = [records[j], records[idx]];
  }

  // Build CSV string
  let csvContent = "message,prediction,category\n";
  records.forEach(rec => {
    // Escape quote marks in csv
    const escapedMsg = rec.text.replace(/"/g, '""');
    const escapedCat = rec.category.replace(/"/g, '""');
    csvContent += `"${escapedMsg}","${rec.label}","${escapedCat}"\n`;
  });

  fs.writeFileSync(datasetPath, csvContent, "utf8");
  return datasetPath;
}
