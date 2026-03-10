// ==================== TYPES COMMUNAUTÉ & POUVOIRS ====================

import type { Spell } from "./spell";

// ─── Publication de sort ───

export interface PublishedSpell {
  token: string;
  spell: Spell;
  thumbnail?: string; // base64 data URL
  published_at: string;
  updated_at: string;
  likes: number;
  liked_by: string[]; // player names
  comments: SpellComment[];
  downloads: number;
}

export interface SpellComment {
  id: string;
  author: string;
  text: string;
  created_at: string;
}

export interface PublishedSpellSummary {
  token: string;
  name: string;
  author: string;
  cast_type: string;
  description: string;
  thumbnail?: string;
  likes: number;
  comments_count: number;
  downloads: number;
  published_at: string;
}

// ─── Pouvoir (groupe de sorts) ───

export interface Power {
  id: string;
  name: string;
  description: string;
  author: string;
  icon: string; // emoji or material name
  color: string; // hex color e.g. "#FFD700"
  spell_ids: string[]; // tokens of spells in this power
  created_at: string;
  version: number;
}

export interface PowerSummary {
  id: string;
  name: string;
  author: string;
  description: string;
  icon: string;
  spell_count: number;
  color: string;
}

// ─── Templates ───

export interface SpellTemplate {
  id: string;
  name: string;
  description: string;
  spell: Spell;
  created_at: string;
}

export interface PowerTemplate {
  id: string;
  name: string;
  description: string;
  power: Power;
  spells: Spell[];
  created_at: string;
}

// ─── Deploy ───

export interface DeployResult {
  ok: boolean;
  message: string;
  deployed_spells?: number;
}
