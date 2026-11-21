import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// VITE_BASE is "/" normally. Only set it if the site is served from a sub-path.
// In dev, /api is forwarded to the backend on localhost:8081 (same origin, no CORS).
export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
  server: { proxy: { "/api": "http://localhost:8081" } },
});
