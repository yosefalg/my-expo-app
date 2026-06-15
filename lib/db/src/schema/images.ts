import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const imagesTable = pgTable("images", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  url: text("url").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes"),
  filename: text("filename"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertImageSchema = createInsertSchema(imagesTable).omit({ createdAt: true });
export type InsertImage = z.infer<typeof insertImageSchema>;
export type StoredImage = typeof imagesTable.$inferSelect;
