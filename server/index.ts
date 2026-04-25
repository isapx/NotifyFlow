import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

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
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  // In development we normally mount Vite as middleware. For the
  // alternative workflow where Vite runs as a standalone dev server
  // (https://localhost:5173) and proxies API calls to this backend,
  // set `SKIP_VITE=true` in the environment to skip mounting Vite here.
  if (app.get("env") === "development") {
    if (process.env.SKIP_VITE !== "true") {
      await setupVite(app, server);
    } else {
      // SKIP_VITE=true: do not mount Vite middleware and do not try to
      // serve static production files. This lets a standalone Vite dev
      // server (running on :5173) handle the client assets and proxy
      // API requests to this backend on :3000.
      log("SKIP_VITE=true, skipping Vite middleware (run client separately)");
    }
  } else {
    serveStatic(app);
  }

  // Normally serve the app on port 5000
  // this serves both the API and the client.
  // Port 5000 is the only port that is not firewalled, but we're temporarily
  // using port 3000 for development as port 5000 is in use by ControlCenter.
  const port = 3000;
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();
