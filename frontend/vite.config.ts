import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Honor an injected PORT (e.g. preview tooling) but default to 5173 for `npm run dev`.
    port: Number(process.env.PORT) || 5173,
    proxy: {
      // changeOrigin is required so the backend receives Host: localhost:8000
      // instead of localhost:5173 — without it the OAuth state cookie that
      // authlib stores during /api/auth/login is not forwarded correctly on
      // the /api/auth/callback round-trip.
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        // Without this, when the backend is down Vite falls through to its
        // SPA handler and serves index.html for /api/* requests instead of
        // returning an error, causing auth probes to silently get HTML back.
        configure: (proxy) => {
          proxy.on("error", (_err, _req, res) => {
            res.writeHead(502, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ detail: "Backend unavailable — is uvicorn running?" }));
          });
        },
      },
    },
  },
});
