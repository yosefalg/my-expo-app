import { pgTable, text, boolean, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const providersTable = pgTable("providers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  type: text("type").notNull().default("reverse_image"),
  apiKeyRequired: boolean("api_key_required").notNull().default(false),
  apiKey: text("api_key"),
  iconUrl: text("icon_url"),
  avgResponseMs: integer("avg_response_ms"),
  successRate: real("success_rate"),
  totalCalls: integer("total_calls").notNull().default(0),
  successCalls: integer("success_calls").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProviderSchema = createInsertSchema(providersTable).omit({ createdAt: true });
export type InsertProvider = z.infer<typeof insertProviderSchema>;
export type Provider = typeof providersTable.$inferSelect;
