import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export const modelsRouter = Router();

const MODELS_DIR = path.resolve(__dirname, "../../data/models");
function ensureDir() {
  if (!fs.existsSync(MODELS_DIR)) fs.mkdirSync(MODELS_DIR, { recursive: true });
}

/** POST /api/models — Sauvegarder un modèle */
modelsRouter.post("/", (req: Request, res: Response) => {
  ensureDir();
  const model = req.body;
  if (!model || !model.id) model.id = uuidv4();
  const fp = path.join(MODELS_DIR, `${model.id}.json`);
  fs.writeFileSync(fp, JSON.stringify(model, null, 2), "utf-8");
  res.json({ ok: true, id: model.id });
});

/** GET /api/models?id=XYZ — Charger un modèle, ou lister tous */
modelsRouter.get("/", (req: Request, res: Response) => {
  ensureDir();
  const id = req.query.id as string | undefined;
  if (id) {
    const fp = path.join(MODELS_DIR, `${id}.json`);
    if (!fs.existsSync(fp)) {
      res.status(404).json({ error: "Modèle non trouvé" });
      return;
    }
    const data = JSON.parse(fs.readFileSync(fp, "utf-8"));
    res.json(data);
    return;
  }
  const files = fs.readdirSync(MODELS_DIR).filter((f) => f.endsWith(".json"));
  const models = files.map((f) => {
    const data = JSON.parse(fs.readFileSync(path.join(MODELS_DIR, f), "utf-8"));
    return { id: data.id, name: data.name || "Sans nom", type: data.type || "custom" };
  });
  res.json({ models });
});

/** DELETE /api/models?id=XYZ — Supprimer un modèle */
modelsRouter.delete("/", (req: Request, res: Response) => {
  ensureDir();
  const id = req.query.id as string;
  if (!id) {
    res.status(400).json({ error: "id requis" });
    return;
  }
  const fp = path.join(MODELS_DIR, `${id}.json`);
  if (!fs.existsSync(fp)) {
    res.status(404).json({ error: "Modèle non trouvé" });
    return;
  }
  fs.unlinkSync(fp);
  res.json({ ok: true });
});
