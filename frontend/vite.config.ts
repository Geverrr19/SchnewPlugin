import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isGitHubPages = !!process.env.GITHUB_PAGES;

export default defineConfig({
  plugins: [react()],
  base: isGitHubPages ? "/SchnewPlugin/" : "/",
  build: {
    outDir: isGitHubPages ? "dist" : "../backend/public",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
