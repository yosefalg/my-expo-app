import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const axios = require("axios");

const mistralKey = process.env.MISTRAL_API_KEY;
const geminiKey  = process.env.GEMINI_API_KEY;
const groqKey    = process.env.GROQ_API_KEY;

async function sendToAI(service, apiKey, code) {
  let url, payload;
  if (service === "mistral") {
    url = "https://api.mistral.ai/v1/chat/completions";
    payload = { model: "mistral-small", messages: [{ role: "user", content: "Fix errors in this code:\n\n" + code }] };
  } else if (service === "gemini") {
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + apiKey;
    payload = { contents: [{ role: "user", parts: [{ text: "Fix errors in this code:\n\n" + code }] }] };
  } else if (service === "groq") {
    url = "https://api.groq.com/openai/v1/chat/completions";
    payload = { model: "llama3-8b-8192", messages: [{ role: "user", content: "Fix errors in this code:\n\n" + code }] };
  }
  const response = await axios.post(url, payload, {
    headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
  });
  if (service === "gemini") return response.data.candidates[0].content.parts[0].text;
  return response.data.choices[0].message.content;
}

async function fixFile(filePath) {
  const code = fs.readFileSync(filePath, "utf8");
  let fixedCode;
  try {
    if (!mistralKey) throw new Error("no key");
    fixedCode = await sendToAI("mistral", mistralKey, code);
    console.log("[Mistral] fixed: " + filePath);
  } catch {
    try {
      if (!geminiKey) throw new Error("no key");
      fixedCode = await sendToAI("gemini", geminiKey, code);
      console.log("[Gemini] fixed: " + filePath);
    } catch {
      try {
        if (!groqKey) throw new Error("no key");
        fixedCode = await sendToAI("groq", groqKey, code);
        console.log("[Groq] fixed: " + filePath);
      } catch {
        console.warn("[SKIP] no API available: " + filePath);
        return;
      }
    }
  }
  fs.writeFileSync(filePath, fixedCode, "utf8");
}

const SKIP_DIRS = new Set(["node_modules",".git",".expo","android","ios","dist","build","static-build",".github","attached_assets","uploads"]);
const SKIP_EXTS = new Set([".png",".jpg",".jpeg",".gif",".webp",".svg",".ico",".md",".lock",".yaml",".yml",".toml",".sh",".zip",".tar",".gz",".ttf",".otf",".woff",".woff2",".mp4",".mp3",".wav"]);

function getAllFiles(dirPath, list) {
  if (!list) list = [];
  for (const file of fs.readdirSync(dirPath)) {
    const full = path.join(dirPath, file);
    if (fs.statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(file)) getAllFiles(full, list);
    } else {
      if (!SKIP_EXTS.has(path.extname(file).toLowerCase())) list.push(full);
    }
  }
  return list;
}

async function main() {
  const targetDir = path.resolve("artifacts/omnivision");
  if (!fs.existsSync(targetDir)) { console.error("Not found: " + targetDir); process.exit(1); }
  const files = getAllFiles(targetDir);
  console.log("Files to check: " + files.length);
  for (const file of files) await fixFile(file);
  console.log("Done.");
}

main().catch(err => { console.error("Error:", err.message); process.exit(1); });
