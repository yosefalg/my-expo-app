import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, generateToken, generateId } from "../lib/auth";
import { type AuthRequest, requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const { email, password, name } = req.body ?? {};
  if (!email || !password || !name) {
    res.status(400).json({ error: "email, password, and name are required" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const id = generateId();
  const passwordHash = hashPassword(password);
  const [user] = await db.insert(usersTable).values({ id, email, passwordHash, name }).returning();
  const token = generateToken(user.id);

  res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
      searchesUsed: user.searchesUsed,
      searchesLimit: user.searchesLimit,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = generateToken(user.id);
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
      searchesUsed: user.searchesUsed,
      searchesLimit: user.searchesLimit,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

router.get("/auth/me", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    plan: user.plan,
    searchesUsed: user.searchesUsed,
    searchesLimit: user.searchesLimit,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
