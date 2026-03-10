import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export const templatesRouter = Router();

const TEMPLATES_DIR = path.resolve(__dirname, "../../data/templates");

function ensureDir(sub: string) {
  const dir = path.join(TEMPLATES_DIR, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// ── Spell Templates ──

/** POST /api/templates/spells?player=X — Sauvegarder un template de sort */
templatesRouter.post("/spells", (req: Request, res: Response) => {
  const player = req.query.player as string;
  if (!player) {
    res.status(400).json({ error: "player requis" });
    return;
  }
  const dir = ensureDir(`spells/${player}`);
  const template = req.body;
  if (!template.id) template.id = uuidv4();
  fs.writeFileSync(path.join(dir, `${template.id}.json`), JSON.stringify(template, null, 2), "utf-8");
  res.json({ ok: true, id: template.id });
});

/** GET /api/templates/spells?player=X — Lister les templates de sorts */
templatesRouter.get("/spells", (req: Request, res: Response) => {
  const player = req.query.player as string;
  if (!player) {
    res.status(400).json({ error: "player requis" });
    return;
  }
  const dir = ensureDir(`spells/${player}`);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const templates = files.map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")));
  res.json({ templates });
});

/** DELETE /api/templates/spells/:id?player=X — Supprimer un template */
templatesRouter.delete("/spells/:id", (req: Request, res: Response) => {
  const player = req.query.player as string;
  if (!player) {
    res.status(400).json({ error: "player requis" });
    return;
  }
  const fp = path.join(TEMPLATES_DIR, `spells/${player}/${req.params.id}.json`);
  if (!fs.existsSync(fp)) {
    res.status(404).json({ error: "Template non trouvé" });
    return;
  }
  fs.unlinkSync(fp);
  res.json({ ok: true });
});

// ── Power Templates ──

/** POST /api/templates/powers — Sauvegarder un template de pouvoir */
templatesRouter.post("/powers", (req: Request, res: Response) => {
  const { player, template } = req.body;
  if (!player || !template) {
    res.status(400).json({ error: "player et template requis" });
    return;
  }
  const dir = ensureDir(`powers/${player}`);
  if (!template.id) template.id = uuidv4();
  fs.writeFileSync(path.join(dir, `${template.id}.json`), JSON.stringify(template, null, 2), "utf-8");
  res.json({ ok: true, id: template.id });
});

/** GET /api/templates/powers?player=X — Lister les templates de pouvoirs */
templatesRouter.get("/powers", (req: Request, res: Response) => {
  const player = req.query.player as string;
  if (!player) {
    res.status(400).json({ error: "player requis" });
    return;
  }
  const dir = ensureDir(`powers/${player}`);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const templates = files.map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")));
  res.json({ templates });
});

/** DELETE /api/templates/powers/:id?player=X */
templatesRouter.delete("/powers/:id", (req: Request, res: Response) => {
  const player = req.query.player as string;
  if (!player) {
    res.status(400).json({ error: "player requis" });
    return;
  }
  const fp = path.join(TEMPLATES_DIR, `powers/${player}/${req.params.id}.json`);
  if (!fs.existsSync(fp)) {
    res.status(404).json({ error: "Template non trouvé" });
    return;
  }
  fs.unlinkSync(fp);
  res.json({ ok: true });
});
