import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const searchJobsTable = pgTable("search_jobs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  status: text("status").notNull().default("pending"),
  imageUrl: text("image_url"),
  results: jsonb("results"),
  providerResults: jsonb("provider_results"),
  totalResults: integer("total_results"),
  processingTimeMs: integer("processing_time_ms"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertSearchJobSchema = createInsertSchema(searchJobsTable).omit({ createdAt: true });
export type InsertSearchJob = z.infer<typeof insertSearchJobSchema>;
export type SearchJob = typeof searchJobsTable.$inferSelect;
