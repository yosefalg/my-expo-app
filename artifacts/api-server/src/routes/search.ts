import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { searchJobsTable, providersTable, imagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { generateId } from "../lib/auth";
import { runVisualSearch } from "../lib/visualSearch";
import { saveBase64Image } from "../lib/imageStorage";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Upload image endpoint
router.post("/search/upload", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { imageData, mimeType, filename } = req.body ?? {};
  if (!imageData || !mimeType) {
    res.status(400).json({ error: "imageData and mimeType are required" });
    return;
  }

  const imageId = generateId();
  const imageUrl = await saveBase64Image(imageId, imageData, mimeType);

  await db.insert(imagesTable).values({
    id: imageId,
    userId: req.userId!,
    url: imageUrl,
    mimeType,
    filename: filename ?? null,
  });

  res.json({ imageUrl, imageId });
});

// Start visual search
router.post("/search/visual", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { imageUrl, providerIds } = req.body ?? {};
  if (!imageUrl) {
    res.status(400).json({ error: "imageUrl is required" });
    return;
  }

  const jobId = generateId();
  const now = new Date();

  await db.insert(searchJobsTable).values({
    id: jobId,
    userId: req.userId!,
    status: "pending",
    imageUrl,
  });

  // Return immediately, run search in background
  res.status(202).json({
    id: jobId,
    status: "running",
    imageUrl,
    results: null,
    providerResults: null,
    totalResults: null,
    processingTimeMs: null,
    error: null,
    createdAt: now.toISOString(),
    completedAt: null,
  });

  // Run asynchronously
  setImmediate(async () => {
    const start = Date.now();
    try {
      await db.update(searchJobsTable).set({ status: "running" }).where(eq(searchJobsTable.id, jobId));

      // Get enabled providers
      let providers = await db.select().from(providersTable).where(eq(providersTable.enabled, true));
      if (providerIds?.length) {
        providers = providers.filter(p => providerIds.includes(p.id));
      }

      const { results, providerResults } = await runVisualSearch(imageUrl, providers);
      const elapsed = Date.now() - start;

      await db.update(searchJobsTable)
        .set({
          status: "completed",
          results: results as any,
          providerResults: providerResults as any,
          totalResults: results.length,
          processingTimeMs: elapsed,
          completedAt: new Date(),
        })
        .where(eq(searchJobsTable.id, jobId));

      // Update provider stats
      for (const pr of providerResults) {
        const [existing] = await db.select().from(providersTable).where(eq(providersTable.id, pr.providerId));
        if (existing) {
          const newTotal = (existing.totalCalls ?? 0) + 1;
          const newSuccess = (existing.successCalls ?? 0) + (pr.status === "success" ? 1 : 0);
          await db.update(providersTable)
            .set({
              totalCalls: newTotal,
              successCalls: newSuccess,
              successRate: newSuccess / newTotal,
              avgResponseMs: pr.processingTimeMs ?? existing.avgResponseMs,
            })
            .where(eq(providersTable.id, pr.providerId));
        }
      }

      logger.info({ jobId, results: results.length, elapsed }, "Search completed");
    } catch (err) {
      logger.error({ jobId, err }, "Search failed");
      await db.update(searchJobsTable)
        .set({ status: "failed", error: String(err), completedAt: new Date() })
        .where(eq(searchJobsTable.id, jobId));
    }
  });
});

// Get job status
router.get("/search/jobs/:jobId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
  const [job] = await db.select().from(searchJobsTable).where(eq(searchJobsTable.id, rawId));
  if (!job || job.userId !== req.userId) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.json({
    id: job.id,
    status: job.status,
    imageUrl: job.imageUrl,
    results: job.results,
    providerResults: job.providerResults,
    totalResults: job.totalResults,
    processingTimeMs: job.processingTimeMs,
    error: job.error,
    createdAt: job.createdAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
  });
});

export default router;
