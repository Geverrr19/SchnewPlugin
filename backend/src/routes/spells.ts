import { Router, Request, Response } from "express";
import { loadSpell, saveSpell } from "../services/store";
import { validateSpell } from "../services/validation";

export const spellsRouter = Router();

/**
 * POST /api/spells?token=XYZ
 * Sauvegarde un sort JSON sous le token donné.
 */
spellsRouter.post("/", (req: Request, res: Response) => {
  const token = req.query.token as string | undefined;

  if (!token || token.trim().length === 0) {
    res.status(400).json({ error: "Token manquant dans la query (?token=XYZ)" });
    return;
  }

  // Sécurité: le token ne doit contenir que des caractères alphanumériques, tirets et underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(token)) {
    res.status(400).json({ error: "Token invalide (caractères alphanumériques, - et _ uniquement)" });
    return;
  }

  const body = req.body;
  if (!body || typeof body !== "object") {
    res.status(400).json({ error: "Body JSON manquant ou invalide" });
    return;
  }

  // Validation du sort
  const errors = validateSpell(body);
  if (errors.length > 0) {
    res.status(400).json({ error: "Sort invalide", details: errors });
    return;
  }

  // Sauvegarde
  try {
    saveSpell(token, body);
    console.log(`[Spell] Sort sauvegardé: ${token} (${body.meta?.name || "?"})`);
    res.json({ ok: true, token });
  } catch (err) {
    console.error("[Spell] Erreur de sauvegarde:", err);
    res.status(500).json({ error: "Erreur de sauvegarde" });
  }
});

/**
 * GET /api/spells/:token
 * Récupère un sort sauvegardé.
 */
spellsRouter.get("/:token", (req: Request, res: Response) => {
  const { token } = req.params;

  if (!/^[a-zA-Z0-9_-]+$/.test(token)) {
    res.status(400).json({ error: "Token invalide" });
    return;
  }

  const spell = loadSpell(token);
  if (!spell) {
    res.status(404).json({ error: "Sort non trouvé" });
    return;
  }

  res.json(spell);
});
