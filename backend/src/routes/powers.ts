import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export const powersRouter = Router();

const POWERS_DIR = path.resolve(__dirname, "../../data/powers");
function ensureDir() {
  if (!fs.existsSync(POWERS_DIR)) fs.mkdirSync(POWERS_DIR, { recursive: true });
}

/** POST /api/powers — Sauvegarder un pouvoir */
powersRouter.post("/", (req: Request, res: Response) => {
  ensureDir();
  const power = req.body;
  if (!power || !power.id) {
    power.id = uuidv4();
  }
  const fp = path.join(POWERS_DIR, `${power.id}.json`);
  fs.writeFileSync(fp, JSON.stringify(power, null, 2), "utf-8");
  res.json({ ok: true, id: power.id });
});

/** GET /api/powers — Lister les pouvoirs */
powersRouter.get("/", (_req: Request, res: Response) => {
  ensureDir();
  const files = fs.readdirSync(POWERS_DIR).filter((f) => f.endsWith(".json"));
  const powers = files.map((f) => {
    const data = JSON.parse(fs.readFileSync(path.join(POWERS_DIR, f), "utf-8"));
    return { id: data.id, name: data.name || "Sans nom", type: data.type || "unknown" };
  });
  res.json({ powers });
});

/** GET /api/powers/:id — Charger un pouvoir */
powersRouter.get("/:id", (req: Request, res: Response) => {
  ensureDir();
  const fp = path.join(POWERS_DIR, `${req.params.id}.json`);
  if (!fs.existsSync(fp)) {
    res.status(404).json({ error: "Pouvoir non trouvé" });
    return;
  }
  const data = JSON.parse(fs.readFileSync(fp, "utf-8"));
  res.json(data);
});

/** DELETE /api/powers/:id — Supprimer un pouvoir */
powersRouter.delete("/:id", (req: Request, res: Response) => {
  ensureDir();
  const fp = path.join(POWERS_DIR, `${req.params.id}.json`);
  if (!fs.existsSync(fp)) {
    res.status(404).json({ error: "Pouvoir non trouvé" });
    return;
  }
  fs.unlinkSync(fp);
  res.json({ ok: true });
});
