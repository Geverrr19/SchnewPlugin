import { Router, Request, Response } from "express";
import { loadSpell, listTokens } from "../services/store";
import {
  listPublished,
  getPublished,
  publishSpell,
  unpublishSpell,
  toggleLike,
  addComment,
  deleteComment,
  updatePublished,
} from "../services/community-store";

export const communityRouter = Router();

/** POST /api/community/publish — Publier un sort */
communityRouter.post("/publish", (req: Request, res: Response) => {
  const { token, player, thumbnail } = req.body;
  if (!token || !player) {
    res.status(400).json({ error: "token et player requis" });
    return;
  }
  const spell = loadSpell(token);
  if (!spell) {
    res.status(404).json({ error: "Sort non trouvé (token invalide)" });
    return;
  }
  publishSpell(token, player, spell, thumbnail);
  res.json({ ok: true });
});

/** GET /api/community/spells — Liste des sorts publiés */
communityRouter.get("/spells", (req: Request, res: Response) => {
  const sort = (req.query.sort as string) || "recent";
  const search = req.query.search as string | undefined;
  const author = req.query.author as string | undefined;
  const spells = listPublished({ sort, search, author });
  res.json({ spells });
});

/** GET /api/community/spells/:token — Détail d'un sort publié */
communityRouter.get("/spells/:token", (req: Request, res: Response) => {
  const entry = getPublished(req.params.token);
  if (!entry) {
    res.status(404).json({ error: "Sort non trouvé" });
    return;
  }
  res.json(entry);
});

/** POST /api/community/spells/:token/like — Liker/unliker */
communityRouter.post("/spells/:token/like", (req: Request, res: Response) => {
  const { player } = req.body;
  if (!player) {
    res.status(400).json({ error: "player requis" });
    return;
  }
  const result = toggleLike(req.params.token, player);
  if (!result) {
    res.status(404).json({ error: "Sort non trouvé" });
    return;
  }
  res.json(result);
});

/** POST /api/community/spells/:token/comment — Ajouter un commentaire */
communityRouter.post("/spells/:token/comment", (req: Request, res: Response) => {
  const { player, text } = req.body;
  if (!player || !text) {
    res.status(400).json({ error: "player et text requis" });
    return;
  }
  const comment = addComment(req.params.token, player, text);
  if (!comment) {
    res.status(404).json({ error: "Sort non trouvé" });
    return;
  }
  res.json({ ok: true, comment });
});

/** POST /api/community/spells/:token/delete-comment — Supprimer un commentaire */
communityRouter.post("/spells/:token/delete-comment", (req: Request, res: Response) => {
  const { player, comment_id } = req.body;
  if (!player || !comment_id) {
    res.status(400).json({ error: "player et comment_id requis" });
    return;
  }
  const ok = deleteComment(req.params.token, player, comment_id);
  if (!ok) {
    res.status(404).json({ error: "Commentaire non trouvé" });
    return;
  }
  res.json({ ok: true });
});

/** DELETE /api/community/spells/:token — Supprimer un sort publié */
communityRouter.delete("/spells/:token", (req: Request, res: Response) => {
  const player = req.query.player as string;
  if (!player) {
    res.status(400).json({ error: "player requis" });
    return;
  }
  const ok = unpublishSpell(req.params.token, player);
  if (!ok) {
    res.status(403).json({ error: "Non autorisé ou sort non trouvé" });
    return;
  }
  res.json({ ok: true });
});

/** POST /api/community/spells/:token/edit — Mettre à jour un sort publié */
communityRouter.post("/spells/:token/edit", (req: Request, res: Response) => {
  const { player, thumbnail } = req.body;
  if (!player) {
    res.status(400).json({ error: "player requis" });
    return;
  }
  const spell = loadSpell(req.params.token);
  if (!spell) {
    res.status(404).json({ error: "Sort source non trouvé" });
    return;
  }
  const ok = updatePublished(req.params.token, player, spell, thumbnail);
  if (!ok) {
    res.status(403).json({ error: "Non autorisé ou sort non trouvé" });
    return;
  }
  res.json({ ok: true });
});
