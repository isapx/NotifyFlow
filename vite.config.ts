import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import basicSsl from "@vitejs/plugin-basic-ssl";
import fs from "fs";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    basicSsl(),
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  // If you generate mkcert certificates and place them in `certs/`
  // as `localhost-key.pem` and `localhost.pem`, Vite will use them
  // to provide a trusted HTTPS dev server. Otherwise it falls back
  // to `https: true` (basicSsl) which uses an auto-signed cert.
  server: (() => {
    let httpsConfig: boolean | { key: Buffer; cert: Buffer } = true;
    try {
      const certDir = path.resolve(import.meta.dirname, "certs");
      const keyPath = path.join(certDir, "localhost-key.pem");
      const certPath = path.join(certDir, "localhost.pem");

      if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        httpsConfig = {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        };
        console.log(`Using local HTTPS certs from ${certDir}`);
      }
    } catch (e) {
      console.warn("Failed to load local certs, falling back to default HTTPS (auto-signed)", e);
      httpsConfig = true;
    }

    return {
      host: true,
      https: httpsConfig as any,
      proxy: {
      // Proxy API requests to the backend running on port 3000
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      },
    } as any;
  })(),
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});
