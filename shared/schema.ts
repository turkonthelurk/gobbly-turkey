import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Scores table for leaderboard
export const scores = pgTable("scores", {
  id: serial("id").primaryKey(),
  name: text("name"), // Optional player name
  handle: text("handle"), // Optional social media handle
  score: integer("score").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertScoreSchema = createInsertSchema(scores).pick({
  name: true,
  handle: true,
  score: true,
});

export type InsertScore = z.infer<typeof insertScoreSchema>;
export type Score = typeof scores.$inferSelect;
