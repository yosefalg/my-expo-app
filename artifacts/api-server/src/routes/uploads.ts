import { Router, type IRouter } from "express";
import { serveUpload } from "../lib/imageStorage";

const router: IRouter = Router();

router.get("/uploads/:filename", async (req, res): Promise<void> => {
  const rawFilename = Array.isArray(req.params.filename) ? req.params.filename[0] : req.params.filename;
  const filename = rawFilename.replace(/[^a-zA-Z0-9._-]/g, "");
  const data = await serveUpload(filename);
  if (!data) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const ext = filename.split(".").pop() ?? "jpg";
  res.setHeader("Content-Type", `image/${ext}`);
  res.send(data);
});

export default router;
