import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { providersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

function formatProvider(p: typeof providersTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    enabled: p.enabled,
    type: p.type,
    apiKeyRequired: p.apiKeyRequired,
    hasApiKey: !!p.apiKey,
    iconUrl: p.iconUrl,
    avgResponseMs: p.avgResponseMs,
    successRate: p.successRate,
  };
}

router.get("/providers", requireAuth, async (_req: AuthRequest, res): Promise<void> => {
  const providers = await db.select().from(providersTable);
  res.json(providers.map(formatProvider));
});

router.patch("/providers/:id/toggle", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { enabled } = req.body ?? {};

  const [existing] = await db.select().from(providersTable).where(eq(providersTable.id, rawId));
  if (!existing) {
    res.status(404).json({ error: "Provider not found" });
    return;
  }

  const [updated] = await db
    .update(providersTable)
    .set({ enabled: Boolean(enabled) })
    .where(eq(providersTable.id, rawId))
    .returning();

  res.json(formatProvider(updated));
});

export default router;
