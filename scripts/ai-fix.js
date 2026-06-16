import fs from "fs";
import path from "path";
import axios from "axios";

const mistralKey = process.env.MISTRAL_API_KEY;
const geminiKey = process.env.GEMINI_API_KEY;
const groqKey   = process.env.GROQ_API_KEY;

async function sendToAI(service, apiKey, code) {
  let url;
  if (service === "mistral") {
    url = "https://api.mistral.ai/v1/fix";
  } else if (service === "gemini") {
    url = "https://api.gemini.com/v1/fix";
  } else if (service === "groq") {
    url = "https://api.groq.com/v1/fix";
  }

  const response = await axios.post(
    url,
    { prompt: `صلح الأخطاء في هذا الكود:\n\n${code}` },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.fixed_code;
}

async function fixFile(filePath) {
  const code = fs.readFileSync(filePath, "utf8");

  let fixedCode;
  try {
    fixedCode = await sendToAI("mistral", mistralKey, code);
    console.log(`✅ تم الإصلاح باستخدام Mistral: ${filePath}`);
  } catch (err1) {
    try {
      fixedCode = await sendToAI("gemini", geminiKey, code);
      console.log(`✅ تم الإصلاح باستخدام Gemini: ${filePath}`);
    } catch (err2) {
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
