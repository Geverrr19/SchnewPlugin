import type { Spell } from "../types/spell";
import type {
  PublishedSpellSummary,
  SpellComment,
  Power,
  PowerSummary,
  SpellTemplate,
  PowerTemplate,
  DeployResult,
} from "../types/community";
import type { CustomMob, MobSummary } from "../types/mob";
import type { CustomModel, ModelSummary } from "../types/model";

const API_BASE = "/api";

export async function exportSpell(token: string, spell: Spell): Promise<{ ok: boolean; error?: string; details?: string[] }> {
  try {
    const res = await fetch(`${API_BASE}/spells?token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(spell),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        ok: false,
        error: data.error || "Erreur serveur",
        details: data.details,
      };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

export async function loadSpell(token: string): Promise<{ ok: boolean; spell?: Spell; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/spells/${encodeURIComponent(token)}`);

    if (res.status === 404) {
      return { ok: false, error: "Aucun sort trouvé pour ce token" };
    }

    if (!res.ok) {
      return { ok: false, error: "Erreur serveur" };
    }

    const spell = await res.json();
    return { ok: true, spell };
  } catch (err) {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

export interface SpellSummary {
  token: string;
  name: string;
  author: string;
  cast_type: string;
  version: number;
}

/** Liste tous les sorts sauvegardés sur le serveur */
export async function listSpells(): Promise<{ ok: boolean; spells?: SpellSummary[]; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/spells`);
    if (!res.ok) return { ok: false, error: "Erreur serveur" };
    const data = await res.json();
    return { ok: true, spells: data.spells ?? [] };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

// ==================== COMMUNAUTÉ ====================

/** Publier un sort dans la galerie communautaire */
export async function publishSpell(
  token: string,
  player: string,
  thumbnail?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/community/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, player, thumbnail }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "Erreur serveur" };
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

/** Lister les sorts publiés */
export async function listPublishedSpells(params?: {
  sort?: "recent" | "popular" | "downloads";
  search?: string;
  author?: string;
}): Promise<{ ok: boolean; spells?: PublishedSpellSummary[]; error?: string }> {
  try {
    const q = new URLSearchParams();
    if (params?.sort) q.set("sort", params.sort);
    if (params?.search) q.set("search", params.search);
    if (params?.author) q.set("author", params.author);
    const res = await fetch(`${API_BASE}/community/spells?${q}`);
    if (!res.ok) return { ok: false, error: "Erreur serveur" };
    const data = await res.json();
    return { ok: true, spells: data.spells };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

/** Détail d'un sort publié */
export async function getPublishedSpell(token: string): Promise<{
  ok: boolean;
  spell?: Spell;
  likes?: number;
  liked_by?: string[];
  comments?: SpellComment[];
  thumbnail?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/community/spells/${encodeURIComponent(token)}`);
    if (!res.ok) return { ok: false, error: "Sort non trouvé" };
    const data = await res.json();
    return { ok: true, ...data };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

/** Liker / unliker un sort */
export async function toggleLike(
  token: string,
  player: string
): Promise<{ ok: boolean; likes?: number; liked?: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/community/spells/${encodeURIComponent(token)}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "Erreur" };
    return { ok: true, likes: data.likes, liked: data.liked };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

/** Ajouter un commentaire */
export async function addComment(
  token: string,
  player: string,
  text: string
): Promise<{ ok: boolean; comment?: SpellComment; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/community/spells/${encodeURIComponent(token)}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player, text }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "Erreur" };
    return { ok: true, comment: data.comment };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

/** Supprimer un sort publié (auteur seulement) */
export async function deletePublishedSpell(
  token: string,
  player: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(
      `${API_BASE}/community/spells/${encodeURIComponent(token)}?player=${encodeURIComponent(player)}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "Erreur" };
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

/** Mettre à jour un sort publié (auteur seulement, re-charge depuis spell-store) */
export async function updatePublishedSpell(
  token: string,
  player: string,
  thumbnail?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(
      `${API_BASE}/community/spells/${encodeURIComponent(token)}/edit`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player, thumbnail }),
      }
    );
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "Erreur" };
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

/** Supprimer un commentaire (auteur du sort ou du commentaire) */
export async function deleteComment(
  token: string,
  player: string,
  commentId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(
      `${API_BASE}/community/spells/${encodeURIComponent(token)}/delete-comment`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player, comment_id: commentId }),
      }
    );
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "Erreur" };
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

// ==================== POUVOIRS ====================

/** Créer / mettre à jour un pouvoir */
export async function savePower(power: Power): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/powers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(power),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "Erreur" };
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

/** Lister les pouvoirs */
export async function listPowers(): Promise<{ ok: boolean; powers?: PowerSummary[]; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/powers`);
    if (!res.ok) return { ok: false, error: "Erreur serveur" };
    const data = await res.json();
    return { ok: true, powers: data.powers };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

/** Charger un pouvoir */
export async function loadPower(id: string): Promise<Power | null> {
  try {
    const res = await fetch(`${API_BASE}/powers/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    const data: Power = await res.json();
    return data;
  } catch {
    return null;
  }
}

/** Supprimer un pouvoir */
export async function deletePower(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/powers/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) return { ok: false, error: "Erreur" };
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

// ==================== TEMPLATES ====================

/** Sauvegarder un template de sort */
export async function saveSpellTemplate(
  player: string,
  template: SpellTemplate
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/templates/spells?player=${encodeURIComponent(player)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(template),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "Erreur" };
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

/** Charger les templates de sorts d'un joueur */
export async function listSpellTemplates(
  player: string
): Promise<{ ok: boolean; templates?: SpellTemplate[]; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/templates/spells?player=${encodeURIComponent(player)}`);
    if (!res.ok) return { ok: false, error: "Erreur" };
    const data = await res.json();
    return { ok: true, templates: data.templates };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

/** Supprimer un template de sort */
export async function deleteSpellTemplate(
  player: string,
  id: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/templates/spells/${encodeURIComponent(id)}?player=${encodeURIComponent(player)}`, {
      method: "DELETE",
    });
    if (!res.ok) return { ok: false, error: "Erreur" };
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

/** Sauvegarder un template de pouvoir */
export async function savePowerTemplate(
  player: string,
  template: PowerTemplate
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/templates/powers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player, template }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "Erreur" };
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

/** Charger les templates de pouvoirs d'un joueur */
export async function listPowerTemplates(
  player: string
): Promise<{ ok: boolean; templates?: PowerTemplate[]; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/templates/powers?player=${encodeURIComponent(player)}`);
    if (!res.ok) return { ok: false, error: "Erreur" };
    const data = await res.json();
    return { ok: true, templates: data.templates };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

// ==================== DEPLOY ====================

/** Déployer un sort ou un pouvoir directement sur le serveur */
export async function deployToServer(
  token: string,
  type: "spell" | "power"
): Promise<DeployResult> {
  try {
    const res = await fetch(`${API_BASE}/deploy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, type }),
    });
    const data = await res.json();
    return data;
  } catch {
    return { ok: false, message: "Impossible de contacter le serveur" };
  }
}

/** Supprimer un template de pouvoir */
export async function deletePowerTemplate(
  player: string,
  id: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/templates/powers/${encodeURIComponent(id)}?player=${encodeURIComponent(player)}`, {
      method: "DELETE",
    });
    if (!res.ok) return { ok: false, error: "Erreur" };
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

/** Vérifier si le déploiement web est activé */
export async function checkDeployEnabled(): Promise<{ enabled: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/deploy/status`);
    const data = await res.json();
    return { enabled: data.enabled === true };
  } catch {
    return { enabled: false };
  }
}

// ==================== IA GÉNÉRATION ====================

/** Générer un sort via IA à partir d'une description textuelle */
export async function generateSpellWithAI(
  prompt: string
): Promise<{ ok: boolean; spell?: import("../types/spell").Spell; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/ai/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "Erreur IA" };
    return { ok: true, spell: data.spell };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

/** Vérifier si l'IA est configurée */
export async function checkAIEnabled(): Promise<{ enabled: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/ai/status`);
    const data = await res.json();
    return { enabled: data.enabled === true };
  } catch {
    return { enabled: false };
  }
}

// ==================== IA GÉNÉRATION MOBS ====================

/** Générer un mob via IA à partir d'une description textuelle */
export async function generateMobWithAI(
  prompt: string
): Promise<{ ok: boolean; mob?: import("../types/mob").CustomMob; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/ai-mob/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "Erreur IA" };
    return { ok: true, mob: data.mob };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

/** Vérifier si l'IA mob est configurée */
export async function checkAIMobEnabled(): Promise<{ enabled: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/ai-mob/status`);
    const data = await res.json();
    return { enabled: data.enabled === true };
  } catch {
    return { enabled: false };
  }
}

// ==================== ÉDITEUR JSON DIRECT ====================

/** Vérifier si l'éditeur JSON direct est activé sur le serveur */
export async function checkJsonEditorEnabled(): Promise<{ enabled: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/spells/json-editor/status`);
    const data = await res.json();
    return { enabled: data.enabled === true };
  } catch {
    return { enabled: false };
  }
}

/** Sauvegarder un sort via JSON brut (avec validation serveur complète) */
export async function saveRawJson(
  token: string,
  jsonString: string
): Promise<{ ok: boolean; error?: string; errors?: string[]; warnings?: string[] }> {
  try {
    // Valider le JSON côté client d'abord
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e: any) {
      return { ok: false, error: "JSON invalide: " + e.message };
    }

    const res = await fetch(`${API_BASE}/spells/raw?token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        ok: false,
        error: data.error || "Erreur serveur",
        errors: data.errors,
        warnings: data.warnings,
      };
    }

    return { ok: true, warnings: data.warnings };
  } catch (err) {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

// ══════════════════════════════════════════
// CUSTOM MOBS API
// ══════════════════════════════════════════

export async function listMobs(): Promise<{ ok: boolean; mobs: MobSummary[]; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/mobs`);
    const data = await res.json();
    if (!res.ok) return { ok: false, mobs: [], error: data.error };
    return { ok: true, mobs: data.mobs || [] };
  } catch {
    return { ok: false, mobs: [], error: "Impossible de contacter le serveur" };
  }
}

export async function loadMob(id: string): Promise<{ ok: boolean; mob?: CustomMob; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/mobs?id=${encodeURIComponent(id)}`);
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };
    // Normalize old format: part_id (string) → part_ids (array)
    if (data.animations) {
      for (const anim of data.animations) {
        if (anim.keyframes) {
          for (const kf of anim.keyframes) {
            if (kf.part_id && !kf.part_ids) {
              kf.part_ids = [kf.part_id];
              delete kf.part_id;
            }
          }
        }
      }
    }
    return { ok: true, mob: data };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

export async function saveMob(mob: CustomMob): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/mobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mob),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };
    return { ok: true, id: data.id };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

export async function deleteMob(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/mobs?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

// ══════════════════════════════════════════
// CUSTOM MODELS API
// ══════════════════════════════════════════

export async function listModels(): Promise<{ ok: boolean; models: ModelSummary[]; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/models`);
    const data = await res.json();
    if (!res.ok) return { ok: false, models: [], error: data.error };
    return { ok: true, models: data.models || [] };
  } catch {
    return { ok: false, models: [], error: "Impossible de contacter le serveur" };
  }
}

export async function loadModel(id: string): Promise<{ ok: boolean; model?: CustomModel; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/models?id=${encodeURIComponent(id)}`);
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };
    return { ok: true, model: data };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

export async function saveModel(model: CustomModel): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/models`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(model),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };
    return { ok: true, id: data.id };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}

export async function deleteModel(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/models?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}
