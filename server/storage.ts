import { users, scores, type User, type InsertUser, type Score, type InsertScore } from "@shared/schema";
import { db } from "./db";
import { desc, eq } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Scores/Leaderboard operations
  createScore(score: InsertScore): Promise<Score>;
  getTopScores(limit: number): Promise<Score[]>;
  getUserHighScore(name?: string): Promise<Score | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private scores: Map<number, Score>;
  currentId: number;
  currentScoreId: number;

  constructor() {
    this.users = new Map();
    this.scores = new Map();
    this.currentId = 1;
    this.currentScoreId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Score operations for leaderboard
  async createScore(insertScore: InsertScore): Promise<Score> {
    const id = this.currentScoreId++;
    const score: Score = {
      id,
      name: insertScore.name ?? null,
      handle: insertScore.handle ?? null,
      score: insertScore.score,
      createdAt: new Date(),
    };
    this.scores.set(id, score);
    return score;
  }

  async getTopScores(limit: number): Promise<Score[]> {
    return Array.from(this.scores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async getUserHighScore(name?: string): Promise<Score | undefined> {
    if (!name) return undefined;
    return Array.from(this.scores.values())
      .filter(score => score.name === name)
      .sort((a, b) => b.score - a.score)[0];
  }
}

// Real database storage using PostgreSQL + Drizzle
export class DatabaseStorage implements IStorage {
  // User operations (existing)
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Score operations for leaderboard
  async createScore(insertScore: InsertScore): Promise<Score> {
    // Input validation and sanitization
    const sanitizedScore = {
      name: insertScore.name?.trim().slice(0, 50) || null, // Max 50 chars
      handle: insertScore.handle?.trim().slice(0, 30) || null, // Max 30 chars
      score: Math.max(0, Math.floor(insertScore.score)), // Ensure positive integer
    };

    const result = await db.insert(scores).values(sanitizedScore).returning();
    return result[0];
  }

  async getTopScores(limit: number): Promise<Score[]> {
    const safeLimit = Math.min(Math.max(1, limit), 100); // Between 1-100
    return await db
      .select()
      .from(scores)
      .orderBy(desc(scores.score), desc(scores.createdAt))
      .limit(safeLimit);
  }

  async getUserHighScore(name?: string): Promise<Score | undefined> {
    if (!name?.trim()) return undefined;
    const result = await db
      .select()
      .from(scores)
      .where(eq(scores.name, name.trim()))
      .orderBy(desc(scores.score))
      .limit(1);
    return result[0];
  }
}

// Use real database storage if DATABASE_URL is available, otherwise MemStorage
export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage()  // Real PostgreSQL with proper validation
  : new MemStorage();      // In-memory fallback for development
