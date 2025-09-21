import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set NODE_ENV to development for Replit development environment
// Only set to production if explicitly configured for deployment
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    log("Starting server initialization...");
    const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log the error for debugging
    log(`Error ${status}: ${message}`, "error");
    console.error("Server error:", err);

    res.status(status).json({ message });
    // Don't throw the error again to prevent crashes
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  
  // Detect Replit environment and check if build directory exists
  const isReplit = !!process.env.REPL_ID || !!process.env.REPL_SLUG;
  const distPath = path.resolve(__dirname, 'public');
  const distExists = fs.existsSync(distPath);
  
  if (isReplit || process.env.NODE_ENV !== 'production' || !distExists) {
    log('Setting up Vite development server...');
    await setupVite(app, server);
  } else {
    log('Setting up static file serving for production...');
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  const port = 5000;
  const host = "0.0.0.0";
  
  // Use correct Node.js server.listen syntax
  server.listen(port, host, () => {
    log(`Server successfully started on ${host}:${port}`);
    log(`Environment: ${process.env.NODE_ENV}`);
  });
  
  // Add error handling for server startup
  server.on('error', (err: any) => {
    log(`Server error: ${err.message}`, "error");
    console.error("Failed to start server:", err);
    process.exit(1);
  });
  
  } catch (error) {
    log(`Failed to initialize server: ${error}`, "error");
    console.error("Server initialization failed:", error);
    process.exit(1);
  }
})();
