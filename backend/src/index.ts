import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { spellsRouter } from "./routes/spells";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

// CORS — accepte le frontend Vite et les requêtes du plugin Minecraft
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "DELETE"],
  })
);

// Limite de taille JSON à 200 KB
app.use(express.json({ limit: "200kb" }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Routes sorts
app.use("/api/spells", spellsRouter);

// ── Servir le frontend React en production ──
const publicDir = path.resolve(__dirname, "../public");
if (fs.existsSync(publicDir)) {
  // Fichiers statiques (JS, CSS, images)
  app.use(express.static(publicDir));

  // SPA fallback : toutes les routes non-API renvoient index.html
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });

  console.log("  ✦ Mode production : frontend servi depuis /public");
} else {
  // Dev : pas de frontend buildé, 404 fallback
  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });
}

// Error handler global
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[Error]", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n  ✦ Spell Editor API démarré sur http://0.0.0.0:${PORT}`);
  console.log(`  ✦ Accessible sur http://ZAZA.serv.gs:${PORT}`);
  console.log(`  ✦ Health check : http://localhost:${PORT}/api/health\n`);
});
