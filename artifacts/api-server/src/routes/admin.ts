import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, searchJobsTable, providersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/admin/stats", requireAuth, async (_req: AuthRequest, res): Promise<void> => {
  const [users, jobs, providers] = await Promise.all([
    db.select().from(usersTable),
    db.select().from(searchJobsTable),
    db.select().from(providersTable),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayJobs = jobs.filter(j => new Date(j.createdAt) >= today);
  const completedJobs = jobs.filter(j => j.status === "completed");
  const totalMs = completedJobs.reduce((s, j) => s + (j.processingTimeMs ?? 0), 0);
  const avgResponseMs = completedJobs.length ? Math.round(totalMs / completedJobs.length) : 0;
  const successRate = jobs.length ? completedJobs.length / jobs.length : 0;

  const providerStats = providers.map(p => ({
    providerId: p.id,
    providerName: p.name,
    totalCalls: p.totalCalls,
    successCalls: p.successCalls,
    avgResponseMs: p.avgResponseMs ?? 0,
    successRate: p.successRate ?? 0,
  }));

  res.json({
    totalUsers: users.length,
    totalSearches: jobs.length,
    activeUsers: users.length,
    searchesToday: todayJobs.length,
    avgResponseMs,
    successRate,
    providerStats,
  });
});

router.get("/admin/users", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));
  const offset = (page - 1) * limit;

  const all = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  const total = all.length;
  const slice = all.slice(offset, offset + limit);

  res.json({
    users: slice.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      plan: u.plan,
      searchesUsed: u.searchesUsed,
      searchesLimit: u.searchesLimit,
      createdAt: u.createdAt.toISOString(),
      lastActiveAt: null,
    })),
    total,
    page,
    limit,
  });
});

export default router;
