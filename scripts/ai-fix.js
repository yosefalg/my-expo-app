const fs = require("fs");
  const path = require("path");
  const axios = require("axios");

  const mistralKey = process.env.MISTRAL_API_KEY;
  const geminiKey  = process.env.GEMINI_API_KEY;
  const groqKey    = process.env.GROQ_API_KEY;

  async function sendToAI(service, apiKey, code) {
    let url, payload;

    if (service === "mistral") {
      url = "https://api.mistral.ai/v1/chat/completions";
      payload = {
        model: "mistral-small",
        messages: [{ role: "user", content: "صلح الأخطاء في هذا الكود:\n\n" + code }]
      };
    } else if (service === "gemini") {
      url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + apiKey;
      payload = {
        contents: [{ role: "user", parts: [{ text: "صلح الأخطاء في هذا الكود:\n\n" + code }] }]
      };
    } else if (service === "groq") {
      url = "https://api.groq.com/openai/v1/chat/completions";
      payload = {
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: "صلح الأخطاء في هذا الكود:\n\n" + code }]
      };
    }

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: "Bearer " + apiKey,
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
      if (!mistralKey) throw new Error("No MISTRAL_API_KEY");
      fixedCode = await sendToAI("mistral", mistralKey, code);
      console.log("[Mistral] تم اصلاح: " + filePath);
    } catch (e1) {
      try {
        if (!geminiKey) throw new Error("No GEMINI_API_KEY");
        fixedCode = await sendToAI("gemini", geminiKey, code);
        console.log("[Gemini] تم اصلاح: " + filePath);
      } catch (e2) {
        try {
          if (!groqKey) throw new Error("No GROQ_API_KEY");
          fixedCode = await sendToAI("groq", groqKey, code);
          console.log("[Groq] تم اصلاح: " + filePath);
        } catch (e3) {
          console.warn("[تخطي] فشل كل الـ APIs - " + filePath);
          return;
        }
      }
    }
    fs.writeFileSync(filePath, fixedCode, "utf8");
  }

  const SKIP_DIRS = new Set([
    "node_modules", ".git", ".expo", "android", "ios",
    "dist", "build", "static-build", ".github",
    "attached_assets", "uploads",
  ]);

  const SKIP_EXTS = new Set([
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico",
    ".md", ".lock", ".yaml", ".yml", ".toml", ".sh",
    ".zip", ".tar", ".gz", ".ttf", ".otf", ".woff", ".woff2",
    ".mp4", ".mp3", ".wav",
  ]);

  function getAllFiles(dirPath, arrayOfFiles) {
    if (!arrayOfFiles) arrayOfFiles = [];
    var files = fs.readdirSync(dirPath);
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var fullPath = path.join(dirPath, file);
      var stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (!SKIP_DIRS.has(file)) getAllFiles(fullPath, arrayOfFiles);
      } else {
        var ext = path.extname(file).toLowerCase();
        if (!SKIP_EXTS.has(ext)) arrayOfFiles.push(fullPath);
      }
    }
    return arrayOfFiles;
  }

  async function main() {
    var targetDir = path.resolve("artifacts/omnivision");
    if (!fs.existsSync(targetDir)) {
      console.error("المجلد غير موجود: " + targetDir);
      process.exit(1);
    }
    var files = getAllFiles(targetDir);
    console.log("عدد الملفات للفحص: " + files.length);
    for (var i = 0; i < files.length; i++) {
      await fixFile(files[i]);
    }
    console.log("اكتمل الاصلاح التلقائي");
  }

  main().catch(function(err) {
    console.error("خطأ اثناء الاصلاح:", err.message);
    process.exit(1);
  });
  