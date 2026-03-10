// ══════════════════════════════════════════
// Types pour les modèles customs (entités visuelles)
// ══════════════════════════════════════════
// Les modèles sont des entités purement visuelles composées de display blocks.
// Contrairement aux mobs, ils n'ont pas de stats, AI, attaques ou loot.
// Ils peuvent être utilisés dans les sorts (projectile, impact, invocation).

import { ModelPart, MobAnimation, AnimationKeyframe, Hitbox, PartType, COMMON_BLOCKS, BLOCK_CATEGORIES } from "./mob";

// ── Méta ──────────────────────────────────

export interface ModelMeta {
  id: string;
  name: string;
  author: string;
  description: string;
  created_at: string;
  version: number;
  /** Catégorie pour l'organisation */
  category: ModelCategory;
  /** Tags pour le filtrage */
  tags: string[];
  /** Aperçu miniature (base64 optionnel) */
  thumbnail?: string;
}

export type ModelCategory =
  | "projectile"   // Visuels de projectile (boule de feu, flèche magique...)
  | "impact"       // Effets d'impact (explosion, cratère...)
  | "summon"       // Créatures invoquées (familier, golem, élémentaire...)
  | "decoration"   // Décorations (rune au sol, totem, cristal...)
  | "weapon"       // Armes visuelles (épée géante, marteau...)
  | "shield"       // Boucliers / barrières visuelles
  | "aura"         // Auras autour du joueur
  | "structure"    // Structures (murs, ponts, tours...)
  | "other";       // Divers

// ── Configuration du modèle ──────────────

export interface ModelConfig {
  /** Échelle globale du modèle */
  scale: number;
  /** Offset Y de base (hauteur au-dessus du sol) */
  base_offset_y: number;
  /** Le modèle pivote pour faire face à la direction de mouvement */
  face_direction: boolean;
  /** Vitesse de rotation automatique (tours/sec, 0 = pas de rotation) */
  auto_rotate_speed: number;
  /** Axe de rotation automatique */
  auto_rotate_axis: "x" | "y" | "z";
  /** Billboard — le modèle fait toujours face au joueur */
  billboard: boolean;
  /** Le modèle émet de la lumière (glow effect) */
  glow: boolean;
  /** Couleur du glow */
  glow_color: string;
  /** Durée de vie par défaut en ticks (0 = permanent) */
  default_lifetime: number;
  /** Effet de fondu à l'apparition (ticks) */
  fade_in: number;
  /** Effet de fondu à la disparition (ticks) */
  fade_out: number;
}

// ── Hitbox de collision pour le modèle ───

export interface ModelHitbox {
  /** Utilise les hitboxes définies */
  enabled: boolean;
  /** Taille de la hitbox principale */
  width: number;
  height: number;
  /** Hitboxes additionnelles détaillées */
  custom_hitboxes: Hitbox[];
}

// ── Modèle complet ──────────────────────

export interface CustomModel {
  meta: ModelMeta;
  config: ModelConfig;
  parts: ModelPart[];
  animations: MobAnimation[];
  hitbox: ModelHitbox;
}

// ── Résumé pour la liste ─────────────────

export interface ModelSummary {
  id: string;
  name: string;
  author: string;
  description: string;
  category: ModelCategory;
  tags: string[];
  parts_count: number;
  animations_count: number;
  has_hitbox: boolean;
}

// ── Utilisation dans les sorts ────────────

export interface SpellModelReference {
  /** ID du modèle à utiliser */
  model_id: string;
  /** Surcharge d'échelle (multipliée avec l'échelle du modèle) */
  scale_override: number;
  /** Animation à jouer (vide = idle/défaut) */
  animation_id: string | null;
  /** Surcharge de la vitesse d'animation */
  animation_speed: number;
  /** Surcharge du glow */
  glow_override: boolean;
  /** Surcharge de la couleur de glow */
  glow_color_override: string | null;
  /** Surcharge de la durée de vie en ticks */
  lifetime_override: number;
  /** Rotation par rapport à la direction du sort */
  rotation_offset: [number, number, number];
}

// ══════════════════════════════════════════
// Constantes
// ══════════════════════════════════════════

export const MODEL_CATEGORIES: { value: ModelCategory; label: string; icon: string; desc: string }[] = [
  { value: "projectile", label: "Projectile", icon: "🔮", desc: "Visuels qui voyagent (boule de feu, flèche...)" },
  { value: "impact", label: "Impact", icon: "💥", desc: "Effets à l'impact (explosion, onde de choc...)" },
  { value: "summon", label: "Invocation", icon: "🐲", desc: "Créatures ou objets invoqués" },
  { value: "decoration", label: "Décoration", icon: "✨", desc: "Runes, totems, cristaux décoratifs" },
  { value: "weapon", label: "Arme", icon: "⚔️", desc: "Armes visuelles géantes (slash, marteau...)" },
  { value: "shield", label: "Bouclier", icon: "🛡️", desc: "Barrières et boucliers visuels" },
  { value: "aura", label: "Aura", icon: "🌟", desc: "Auras autour du joueur" },
  { value: "structure", label: "Structure", icon: "🏗️", desc: "Murs, ponts, tours temporaires" },
  { value: "other", label: "Autre", icon: "📦", desc: "Modèles divers" },
];

export const AUTO_ROTATE_AXES: { value: "x" | "y" | "z"; label: string }[] = [
  { value: "y", label: "↕ Axe Y (vertical)" },
  { value: "x", label: "↔ Axe X (horizontal)" },
  { value: "z", label: "↗ Axe Z (profondeur)" },
];

// ══════════════════════════════════════════
// Re-exports utiles depuis mob.ts
// ══════════════════════════════════════════
export type { ModelPart, MobAnimation, AnimationKeyframe, Hitbox, PartType };
export { COMMON_BLOCKS, BLOCK_CATEGORIES };

// ══════════════════════════════════════════
// Factories
// ══════════════════════════════════════════

export function createDefaultModel(author: string = "Joueur"): CustomModel {
  return {
    meta: {
      id: generateId(),
      name: "Nouveau Modèle",
      author,
      description: "",
      created_at: new Date().toISOString(),
      version: 1,
      category: "other",
      tags: [],
    },
    config: {
      scale: 1.0,
      base_offset_y: 0,
      face_direction: true,
      auto_rotate_speed: 0,
      auto_rotate_axis: "y",
      billboard: false,
      glow: false,
      glow_color: "#ffffff",
      default_lifetime: 0,
      fade_in: 0,
      fade_out: 0,
    },
    parts: [],
    animations: [],
    hitbox: {
      enabled: false,
      width: 1.0,
      height: 1.0,
      custom_hitboxes: [],
    },
  };
}

export function createDefaultModelReference(): SpellModelReference {
  return {
    model_id: "",
    scale_override: 1.0,
    animation_id: null,
    animation_speed: 1.0,
    glow_override: false,
    glow_color_override: null,
    lifetime_override: 0,
    rotation_offset: [0, 0, 0],
  };
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}
