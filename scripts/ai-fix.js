import fs from "fs";
import path from "path";
import axios from "axios";

const mistralKey = process.env.MISTRAL_API_KEY;
const geminiKey = process.env.GEMINI_API_KEY;
const groqKey   = process.env.GROQ_API_KEY;

async function sendToAI(service, apiKey, code) {
  let url, payload;

  if (service === "mistral") {
    url = "https://api.mistral.ai/v1/chat/completions";
    payload = {
      model: "mistral-small",
      messages: [{ role: "user", content: `صلح الأخطاء في هذا الكود:\n\n${code}` }]
    };
  } else if (service === "gemini") {
    url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    payload = {
      contents: [{ role: "user", parts: [{ text: `صلح الأخطاء في هذا الكود:\n\n${code}` }]}]
    };
  } else if (service === "groq") {
    url = "https://api.groq.com/openai/v1/chat/completions";
    payload = {
      model: "llama3-8b-8192",
      messages: [{ role: "user", content: `صلح الأخطاء في هذا الكود:\n\n${code}` }]
    };
  }

  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (service === "gemini") {
    return response.data.candidates[0].content.parts[0].text;
  } else {
    return response.data.choices[0].message.content;
  }
}

async function fixFile(filePath) {
  const code = fs.readFileSync(filePath, "utf8");

  let fixedCode;
  try {
    fixedCode = await sendToAI("mistral", mistralKey, code);
    console.log(`✅ تم الإصلاح باستخدام Mistral: ${filePath}`);
  } catch {
    try {
      fixedCode = await sendToAI("gemini", geminiKey, code);
      console.log(`✅ تم الإصلاح باستخدام Gemini: ${filePath}`);
    } catch {
      fixedCode = await sendToAI("groq", groqKey, code);
      console.log(`✅ تم الإصلاح باستخدام Groq: ${filePath}`);
    }
  }

  fs.writeFileSync(filePath, fixedCode, "utf8");
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      if (!file.endsWith(".png") && !file.endsWith(".jpg") && !file.endsWith(".md")) {
        arrayOfFiles.push(fullPath);
      }
    }
  });
  return arrayOfFiles;
}

async function main() {
  const projectRoot = path.resolve(".");
  const files = getAllFiles(projectRoot);
  for (const file of files) {
    await fixFile(file);
  }
}

main().catch(err => {
  console.error("❌ خطأ أثناء الإصلاح:", err);
  process.exit(1);
});
