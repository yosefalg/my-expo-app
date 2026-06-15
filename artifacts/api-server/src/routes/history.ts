import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { searchJobsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/history", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));
  const offset = (page - 1) * limit;

  const all = await db
    .select()
    .from(searchJobsTable)
    .where(eq(searchJobsTable.userId, req.userId!))
    .orderBy(desc(searchJobsTable.createdAt));

  const total = all.length;
  const items = all.slice(offset, offset + limit).map(job => ({
    id: job.id,
    imageUrl: job.imageUrl,
    status: job.status,
    totalResults: job.totalResults,
    processingTimeMs: job.processingTimeMs,
    createdAt: job.createdAt.toISOString(),
    results: null,
  }));

  res.json({ items, total, page, limit });
});

router.get("/history/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [job] = await db.select().from(searchJobsTable).where(eq(searchJobsTable.id, rawId));

  if (!job || job.userId !== req.userId) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({
    id: job.id,
    imageUrl: job.imageUrl,
    status: job.status,
    totalResults: job.totalResults,
    processingTimeMs: job.processingTimeMs,
    createdAt: job.createdAt.toISOString(),
    results: job.results,
  });
});

router.delete("/history/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [job] = await db.select().from(searchJobsTable).where(eq(searchJobsTable.id, rawId));

  if (!job || job.userId !== req.userId) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db.delete(searchJobsTable).where(eq(searchJobsTable.id, rawId));
  res.sendStatus(204);
});

export default router;
