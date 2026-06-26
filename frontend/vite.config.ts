import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Honor an injected PORT (e.g. preview tooling) but default to 5173 for `npm run dev`.
    port: Number(process.env.PORT) || 5173,
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
});
