import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export const mobsRouter = Router();

const MOBS_DIR = path.resolve(__dirname, "../../data/mobs");
function ensureDir() {
  if (!fs.existsSync(MOBS_DIR)) fs.mkdirSync(MOBS_DIR, { recursive: true });
}

/** POST /api/mobs — Sauvegarder un mob */
mobsRouter.post("/", (req: Request, res: Response) => {
  ensureDir();
  const mob = req.body;
  if (!mob || !mob.id) mob.id = uuidv4();
  const fp = path.join(MOBS_DIR, `${mob.id}.json`);
  fs.writeFileSync(fp, JSON.stringify(mob, null, 2), "utf-8");
  res.json({ ok: true, id: mob.id });
});

/** GET /api/mobs?id=XYZ — Charger un mob, ou lister tous */
mobsRouter.get("/", (req: Request, res: Response) => {
  ensureDir();
  const id = req.query.id as string | undefined;
  if (id) {
    const fp = path.join(MOBS_DIR, `${id}.json`);
    if (!fs.existsSync(fp)) {
      res.status(404).json({ error: "Mob non trouvé" });
      return;
    }
    const data = JSON.parse(fs.readFileSync(fp, "utf-8"));
    res.json(data);
    return;
  }
  const files = fs.readdirSync(MOBS_DIR).filter((f) => f.endsWith(".json"));
  const mobs = files.map((f) => {
    const data = JSON.parse(fs.readFileSync(path.join(MOBS_DIR, f), "utf-8"));
    return { id: data.id, name: data.name || "Sans nom", type: data.type || "custom" };
  });
  res.json({ mobs });
});

/** DELETE /api/mobs?id=XYZ — Supprimer un mob */
mobsRouter.delete("/", (req: Request, res: Response) => {
  ensureDir();
  const id = req.query.id as string;
  if (!id) {
    res.status(400).json({ error: "id requis" });
    return;
  }
  const fp = path.join(MOBS_DIR, `${id}.json`);
  if (!fs.existsSync(fp)) {
    res.status(404).json({ error: "Mob non trouvé" });
    return;
  }
  fs.unlinkSync(fp);
  res.json({ ok: true });
});
