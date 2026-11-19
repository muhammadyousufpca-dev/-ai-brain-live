"use strict";
/**
 * AI Brain — Progressive Public School (Live version).
 * Serves the static AI Brain page and answers Topic Questions
 * through Gemini (server-side only).
 *
 * The Gemini API key comes ONLY from the GEMINI_API_KEY environment
 * variable. It is never hardcoded, never written to a file, and never
 * sent to the browser.
 */
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const MODEL = "gemini-3.1-flash-lite";
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/" +
  MODEL +
  ":generateContent";

app.use(express.json({ limit: "16kb" }));

// NOTE (root layout): GitHub web upload does not handle folders well, so
// index.html lives at the repo ROOT (not in public/). The page is a single
// self-contained file (no other local assets), so serve it directly at "/".
// /api/ask-topic and /api/health below are unaffected.
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ---- Light rate limit: 20 topic requests per IP per rolling hour,
// so one visitor cannot burn the whole free Gemini quota. ----
const hits = new Map(); // ip -> [timestamps]
function rateLimited(ip) {
  const now = Date.now();
  const windowStart = now - 60 * 60 * 1000;
  const list = (hits.get(ip) || []).filter((t) => t > windowStart);
  if (list.length >= 20) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  return false;
}

// ---- Strip the model's working notes from its answer. ----
const META_PATTERNS = [
  "role:",
  "target audience:",
  "draft",
  "refining",
  "checking line count",
  "practice questions included?",
  "roman urdu only?",
  "simple language?",
  "max 6-7 lines?",
  "english words explained?",
  "constraints:",
  "style:",
  "vocabulary:",
  "closing:",
  "steps:",
];

function cleanAnswer(text) {
  return (text || "")
    .split("\n")
    .filter((line) => {
      const lower = line.toLowerCase();
      return !META_PATTERNS.some((p) => lower.includes(p));
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractText(data) {
  const parts = [];
  const candidates = (data && data.candidates) || [];
  for (const c of candidates) {
    const contentParts = (c.content && c.content.parts) || [];
    for (const p of contentParts) {
      if (typeof p.text === "string") parts.push(p.text);
    }
  }
  return parts.join("").trim();
}

const SYSTEM_INSTRUCTION =
  "You are a friendly school teacher for children in Play Group to Class 8 " +
  "at Progressive Public School, Pakistan. Answer the student's topic question " +
  "in simple Roman Urdu only (Urdu written in Latin letters, easy words a child " +
  "can understand). Keep the explanation to 5-7 short lines. Then write the " +
  "heading 'Practice Questions:' followed by exactly 3 short practice questions. " +
  "Output ONLY the final explanation and the 3 practice questions — no planning, " +
  "no drafts, no checklists, no notes about your process.";

app.post("/api/ask-topic", async (req, res) => {
  const ip = req.ip || (req.socket && req.socket.remoteAddress) || "unknown";
  if (rateLimited(ip)) {
    return res.status(429).json({
      error:
        "Aap ne is ghante mein bohat sawal pooch liye hain — thori der baad dobara koshish karein.",
    });
  }

  const question =
    req.body && typeof req.body.question === "string"
      ? req.body.question.trim()
      : "";
  if (question.length < 2 || question.length > 300) {
    return res
      .status(400)
      .json({ error: "Sawal 2 se 300 harf ke beech mein likhein." });
  }

  if (!GEMINI_API_KEY) {
    return res.status(503).json({
      error:
        "Server par abhi API key set nahi hai — admin se key set karwayein, phir dobara koshish karein.",
    });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);
    let response;
    try {
      response = await fetch(
        GEMINI_URL + "?key=" + encodeURIComponent(GEMINI_API_KEY),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            contents: [{ parts: [{ text: question }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
          }),
          signal: controller.signal,
        }
      );
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      if (response.status === 429) {
        return res.status(503).json({
          error: "Aaj ki limit poori ho gayi hai — kal dobara koshish karein.",
        });
      }
      if (response.status === 404) {
        return res.status(503).json({
          error:
            "Model abhi available nahi hai — thori der baad dobara koshish karein.",
        });
      }
      return res.status(503).json({
        error: "Abhi jawab nahi mil saka — thori der baad dobara koshish karein.",
      });
    }

    const data = await response.json();
    const answer = cleanAnswer(extractText(data));
    if (!answer) {
      return res.status(503).json({
        error: "Abhi jawab nahi mil saka — thori der baad dobara koshish karein.",
      });
    }
    return res.json({ answer });
  } catch (err) {
    return res.status(503).json({
      error: "Abhi jawab nahi mil saka — thori der baad dobara koshish karein.",
    });
  }
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, "0.0.0.0", () => {
  console.log("AI Brain Live listening on port " + PORT);
});
