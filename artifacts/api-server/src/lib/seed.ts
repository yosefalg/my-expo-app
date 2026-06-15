import { db } from "@workspace/db";
import { usersTable, providersTable } from "@workspace/db";
import { hashPassword, generateId } from "./auth";
import { logger } from "./logger";

const DEFAULT_PROVIDERS = [
  {
    id: "google_lens",
    name: "Google Lens",
    description: "Google's visual search engine with massive web index",
    enabled: true,
    type: "reverse_image",
    apiKeyRequired: false,
  },
  {
    id: "bing_visual",
    name: "Bing Visual Search",
    description: "Microsoft's visual search with Bing index coverage",
    enabled: true,
    type: "reverse_image",
    apiKeyRequired: false,
  },
  {
    id: "tineye",
    name: "TinEye",
    description: "Reverse image search specialist with exact match detection",
    enabled: true,
    type: "reverse_image",
    apiKeyRequired: false,
  },
  {
    id: "yandex",
    name: "Yandex Images",
    description: "Russian search engine with strong face and object recognition",
    enabled: true,
    type: "reverse_image",
    apiKeyRequired: false,
  },
  {
    id: "gemini_vision",
    name: "Gemini Vision",
    description: "Google's multimodal AI for advanced visual understanding",
    enabled: false,
    type: "ai_vision",
    apiKeyRequired: true,
  },
  {
    id: "openai_vision",
    name: "OpenAI Vision",
    description: "GPT-4V powered visual analysis and description",
    enabled: false,
    type: "ai_vision",
    apiKeyRequired: true,
  },
];

export async function seedDatabase(): Promise<void> {
  try {
    // Seed providers
    for (const provider of DEFAULT_PROVIDERS) {
      const existing = await db.select().from(providersTable)
        .then(rows => rows.find(r => r.id === provider.id));
      if (!existing) {
        await db.insert(providersTable).values(provider as any);
        logger.info({ id: provider.id }, "Seeded provider");
      }
    }

    // Seed demo user
    const demoEmail = "demo@omnivision.ai";
    const existing = await db.select().from(usersTable)
      .then(rows => rows.find(r => r.email === demoEmail));
    if (!existing) {
      await db.insert(usersTable).values({
        id: generateId(),
        email: demoEmail,
        passwordHash: hashPassword("password"),
        name: "Demo User",
        role: "user",
        plan: "pro",
        searchesUsed: 5,
        searchesLimit: 100,
      });
      logger.info("Seeded demo user");
    }

    // Seed admin user
    const adminEmail = "admin@omnivision.ai";
    const existingAdmin = await db.select().from(usersTable)
      .then(rows => rows.find(r => r.email === adminEmail));
    if (!existingAdmin) {
      await db.insert(usersTable).values({
        id: generateId(),
        email: adminEmail,
        passwordHash: hashPassword("admin123"),
        name: "Admin",
        role: "admin",
        plan: "enterprise",
        searchesUsed: 0,
        searchesLimit: 999999,
      });
      logger.info("Seeded admin user");
    }
  } catch (err) {
    logger.error({ err }, "Seed failed (non-fatal)");
  }
}
