import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// Simple in-memory rate limiting (production should use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // Max requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute in milliseconds

const rateLimit = (req: any, res: any, next: any) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const clientData = rateLimitMap.get(clientIP);
  
  if (clientData && now < clientData.resetTime) {
    if (clientData.count >= RATE_LIMIT) {
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }
    clientData.count++;
  } else {
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_WINDOW });
  }
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Leaderboard API routes
  
  // Submit a new score (with rate limiting)
  app.post("/api/scores", rateLimit, async (req, res) => {
    try {
      const { name, handle, score } = req.body;
      
      if (!score || typeof score !== "number" || score < 0 || score > 1000000) {
        return res.status(400).json({ error: "Valid score is required (0-1,000,000)" });
      }
      
      // Additional validation for name/handle
      if (name && (typeof name !== "string" || name.length > 50)) {
        return res.status(400).json({ error: "Name must be a string with max 50 characters" });
      }
      
      if (handle && (typeof handle !== "string" || handle.length > 30)) {
        return res.status(400).json({ error: "Handle must be a string with max 30 characters" });
      }
      
      const newScore = await storage.createScore({
        name: name || null,
        handle: handle || null,
        score,
      });
      
      res.json(newScore);
    } catch (error) {
      console.error("Error creating score:", error);
      res.status(500).json({ error: "Failed to save score" });
    }
  });
  
  // Get top scores for leaderboard
  app.get("/api/scores/top", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const topScores = await storage.getTopScores(Math.min(limit, 100)); // Cap at 100
      
      res.json(topScores);
    } catch (error) {
      console.error("Error fetching top scores:", error);
      res.status(500).json({ error: "Failed to fetch scores" });
    }
  });
  
  // Get user's high score
  app.get("/api/scores/user/:name", async (req, res) => {
    try {
      const { name } = req.params;
      const userHighScore = await storage.getUserHighScore(name);
      
      res.json(userHighScore || null);
    } catch (error) {
      console.error("Error fetching user score:", error);
      res.status(500).json({ error: "Failed to fetch user score" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
