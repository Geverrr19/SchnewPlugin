// ══════════════════════════════════════════
// Types pour les mobs customs
// ══════════════════════════════════════════

export interface MobMeta {
  id: string;
  name: string;
  author: string;
  description: string;
  created_at: string;
  version: number;
}

export interface MobStats {
  max_health: number;
  move_speed: number;
  attack_damage: number;
  detection_range: number;
  armor: number;
  knockback_resistance: number;
  base_mob_type: string;
  scale: number;
}

export type PartType = "block_display" | "item_display" | "text_display";

export interface ModelPart {
  id: string;
  name: string;
  type: PartType;
  block: string; // minecraft:id or text for text_display
  offset: [number, number, number];
  rotation: [number, number, number]; // euler angles
  scale: [number, number, number];
  parent_id: string | null;
  /** Dossier / groupe visuel pour l'organisation dans l'arbre */
  group: string;
}

// ── Hitboxes ──────────────────────────────

export type HitboxShape = "box" | "sphere" | "cylinder";

export interface Hitbox {
  id: string;
  name: string;
  shape: HitboxShape;
  offset: [number, number, number];
  /** Pour box: [w,h,d], sphere: [r,0,0], cylinder: [r,h,0] */
  size: [number, number, number];
  rotation: [number, number, number];
  /** Si rattachée à une part (suit ses transformations) */
  attached_part_id: string | null;
}

/** Hitbox d'attaque – animée par keyframes */
export interface AttackHitbox {
  id: string;
  name: string;
  shape: HitboxShape;
  offset: [number, number, number];
  size: [number, number, number];
  rotation: [number, number, number];
  /** tick de début (dans l'animation liée) */
  active_start_tick: number;
  /** tick de fin */
  active_end_tick: number;
  /** Dégâts propres (si différents de l'attaque) */
  damage_override: number | null;
  /** Knockback direction override */
  knockback_direction: [number, number, number] | null;
}

export interface AnimationKeyframe {
  tick: number;
  part_ids: string[];
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export interface MobAnimation {
  id: string;
  name: string;
  duration_ticks: number;
  loop: boolean;
  keyframes: AnimationKeyframe[];
}

export type AttackType = "melee" | "ranged" | "area";

export interface MobAttack {
  id: string;
  name: string;
  attack_type: AttackType;
  damage: number;
  range: number;
  cooldown: number;
  animation_id: string | null;
  speed: number;
  radius: number;
  particle: string | null;
  particle_count: number;
  color: [number, number, number];
  sound: string | null;
  sound_volume: number;
  sound_pitch: number;
  status_effect: string | null;
  status_duration: number;
  status_amplifier: number;
  knockback: number;
  /** Hitboxes d'attaque avec timing d'activation */
  hitboxes: AttackHitbox[];
}

export interface MobBehavior {
  hostile: boolean;
  passive: boolean;
  neutral: boolean;
  wandering: boolean;
  wander_radius: number;
  can_burn: boolean;
  can_drown: boolean;
  show_health_bar: boolean;
  name_color: string;
  boss: boolean;
  boss_bar_range: number;
  /** Règles IA custom (conditions → actions) */
  ai_rules: AIRule[];
}

// ── Règles IA custom ──────────────────────

export type AIConditionType =
  | "health_below"
  | "health_above"
  | "target_distance_below"
  | "target_distance_above"
  | "time_in_state_above"
  | "random_chance"
  | "target_exists"
  | "no_target";

export type AIActionType =
  | "flee"
  | "summon_mob"
  | "play_animation"
  | "play_sound"
  | "spawn_particles"
  | "heal"
  | "teleport_random"
  | "apply_effect_self"
  | "change_speed"
  | "explode";

export interface AIRule {
  id: string;
  name: string;
  enabled: boolean;
  /** Priorité (plus petit = évalué en premier) */
  priority: number;
  condition: AIConditionType;
  /** Valeur du seuil (pourcentage HP, distance, ticks, etc.) */
  condition_value: number;
  action: AIActionType;
  /** Paramètres de l'action (dépend du type) */
  action_value: string;
  /** Cooldown en secondes avant de ré-exécuter cette règle */
  cooldown: number;
}

export interface LootEntry {
  item: string;
  min_amount: number;
  max_amount: number;
  chance: number;
}

export interface MobSounds {
  ambient: string | null;
  hurt: string | null;
  death: string | null;
}

export interface CustomMob {
  meta: MobMeta;
  stats: MobStats;
  parts: ModelPart[];
  animations: MobAnimation[];
  attacks: MobAttack[];
  behavior: MobBehavior;
  loot: LootEntry[];
  sounds: MobSounds;
  /** Hitboxes du mob (collision / dégâts reçus) */
  hitboxes: Hitbox[];
}

// ══════════════════════════════════════════
// Résumé d'un mob (pour la liste)
// ══════════════════════════════════════════

export interface MobSummary {
  id: string;
  name: string;
  author: string;
  description: string;
  max_health: number;
  base_mob_type: string;
  parts_count: number;
  attacks_count: number;
  animations_count: number;
}

// ══════════════════════════════════════════
// Constantes
// ══════════════════════════════════════════

export const BASE_MOB_TYPES = [
  "zombie", "skeleton", "spider", "creeper", "enderman",
  "blaze", "witch", "warden", "iron_golem", "wolf",
  "bee", "fox", "axolotl", "phantom", "vex",
  "allay", "slime", "pillager", "vindicator", "ravager",
] as const;

export const PART_TYPES: { value: PartType; label: string }[] = [
  { value: "block_display", label: "🧱 Block Display" },
  { value: "item_display", label: "🗡️ Item Display" },
  { value: "text_display", label: "📝 Text Display" },
];

export const ATTACK_TYPES: { value: AttackType; label: string }[] = [
  { value: "melee", label: "⚔️ Mêlée" },
  { value: "ranged", label: "🏹 Distance" },
  { value: "area", label: "💥 Zone" },
];

export const COMMON_PARTICLES = [
  "FLAME", "SOUL_FIRE_FLAME", "CRIT", "ENCHANTED_HIT", "SMOKE",
  "LARGE_SMOKE", "DRAGON_BREATH", "END_ROD", "WITCH", "HEART",
  "ANGRY_VILLAGER", "CLOUD", "ELECTRIC_SPARK", "SNOWFLAKE",
  "ENCHANT", "PORTAL", "DUST", "WAX_ON", "WAX_OFF",
] as const;

export const COMMON_SOUNDS = [
  "entity.zombie.attack_iron_door", "entity.blaze.shoot", "entity.wither.shoot",
  "entity.ender_dragon.growl", "entity.evoker.prepare_attack", "entity.ravager.roar",
  "entity.lightning_bolt.thunder", "entity.generic.explode", "entity.iron_golem.attack",
  "entity.warden.sonic_boom", "entity.elder_guardian.curse", "entity.enderman.scream",
  "entity.ghast.shoot", "entity.phantom.bite", "entity.wolf.growl",
] as const;

export const STATUS_EFFECTS = [
  "slowness", "weakness", "poison", "wither", "blindness",
  "mining_fatigue", "nausea", "levitation", "darkness",
  "hunger", "instant_damage", "glowing",
] as const;

export const COMMON_BLOCKS = [
  // ── Pierre & Minerais ──
  "minecraft:stone", "minecraft:cobblestone", "minecraft:obsidian",
  "minecraft:netherrack", "minecraft:end_stone", "minecraft:bone_block",
  "minecraft:deepslate", "minecraft:blackstone", "minecraft:sculk",
  "minecraft:prismarine", "minecraft:crying_obsidian", "minecraft:tuff",
  "minecraft:calcite", "minecraft:dripstone_block", "minecraft:muddy_mangrove_roots",
  // ── Métal & Gemmes ──
  "minecraft:iron_block", "minecraft:gold_block", "minecraft:diamond_block",
  "minecraft:emerald_block", "minecraft:lapis_block", "minecraft:redstone_block",
  "minecraft:amethyst_block", "minecraft:netherite_block", "minecraft:copper_block",
  "minecraft:raw_iron_block", "minecraft:raw_gold_block", "minecraft:raw_copper_block",
  // ── Lumineux ──
  "minecraft:glowstone", "minecraft:sea_lantern", "minecraft:shroomlight",
  "minecraft:ochre_froglight", "minecraft:verdant_froglight", "minecraft:pearlescent_froglight",
  // ── Bois ──
  "minecraft:oak_log", "minecraft:dark_oak_log", "minecraft:birch_log",
  "minecraft:spruce_log", "minecraft:acacia_log", "minecraft:jungle_log",
  "minecraft:crimson_stem", "minecraft:warped_stem", "minecraft:mangrove_log",
  "minecraft:cherry_log", "minecraft:bamboo_block",
  "minecraft:oak_planks", "minecraft:dark_oak_planks", "minecraft:birch_planks",
  "minecraft:spruce_planks", "minecraft:crimson_planks", "minecraft:warped_planks",
  "minecraft:cherry_planks",
  // ── Béton (16 couleurs) ──
  "minecraft:white_concrete", "minecraft:orange_concrete", "minecraft:magenta_concrete",
  "minecraft:light_blue_concrete", "minecraft:yellow_concrete", "minecraft:lime_concrete",
  "minecraft:pink_concrete", "minecraft:gray_concrete", "minecraft:light_gray_concrete",
  "minecraft:cyan_concrete", "minecraft:purple_concrete", "minecraft:blue_concrete",
  "minecraft:brown_concrete", "minecraft:green_concrete", "minecraft:red_concrete",
  "minecraft:black_concrete",
  // ── Laine (16 couleurs) ──
  "minecraft:white_wool", "minecraft:orange_wool", "minecraft:magenta_wool",
  "minecraft:light_blue_wool", "minecraft:yellow_wool", "minecraft:lime_wool",
  "minecraft:pink_wool", "minecraft:gray_wool", "minecraft:light_gray_wool",
  "minecraft:cyan_wool", "minecraft:purple_wool", "minecraft:blue_wool",
  "minecraft:brown_wool", "minecraft:green_wool", "minecraft:red_wool",
  "minecraft:black_wool",
  // ── Terracotta (16 couleurs) ──
  "minecraft:white_terracotta", "minecraft:orange_terracotta", "minecraft:magenta_terracotta",
  "minecraft:light_blue_terracotta", "minecraft:yellow_terracotta", "minecraft:lime_terracotta",
  "minecraft:pink_terracotta", "minecraft:gray_terracotta", "minecraft:light_gray_terracotta",
  "minecraft:cyan_terracotta", "minecraft:purple_terracotta", "minecraft:blue_terracotta",
  "minecraft:brown_terracotta", "minecraft:green_terracotta", "minecraft:red_terracotta",
  "minecraft:black_terracotta", "minecraft:terracotta",
  // ── Verre teinté ──
  "minecraft:white_stained_glass", "minecraft:orange_stained_glass", "minecraft:magenta_stained_glass",
  "minecraft:light_blue_stained_glass", "minecraft:yellow_stained_glass", "minecraft:lime_stained_glass",
  "minecraft:pink_stained_glass", "minecraft:gray_stained_glass", "minecraft:cyan_stained_glass",
  "minecraft:purple_stained_glass", "minecraft:blue_stained_glass", "minecraft:brown_stained_glass",
  "minecraft:green_stained_glass", "minecraft:red_stained_glass", "minecraft:black_stained_glass",
  "minecraft:glass", "minecraft:tinted_glass",
  // ── Glazed Terracotta ──
  "minecraft:white_glazed_terracotta", "minecraft:orange_glazed_terracotta",
  "minecraft:magenta_glazed_terracotta", "minecraft:light_blue_glazed_terracotta",
  "minecraft:yellow_glazed_terracotta", "minecraft:lime_glazed_terracotta",
  "minecraft:pink_glazed_terracotta", "minecraft:cyan_glazed_terracotta",
  "minecraft:purple_glazed_terracotta", "minecraft:blue_glazed_terracotta",
  "minecraft:green_glazed_terracotta", "minecraft:red_glazed_terracotta",
  "minecraft:black_glazed_terracotta",
  // ── Divers ──
  "minecraft:quartz_block", "minecraft:smooth_quartz", "minecraft:purpur_block",
  "minecraft:packed_ice", "minecraft:blue_ice", "minecraft:honey_block",
  "minecraft:slime_block", "minecraft:dried_kelp_block", "minecraft:hay_block",
  "minecraft:moss_block", "minecraft:mud_bricks", "minecraft:sandstone",
  "minecraft:red_sandstone", "minecraft:smooth_stone", "minecraft:bricks",
  "minecraft:nether_bricks", "minecraft:red_nether_bricks", "minecraft:chiseled_nether_bricks",
] as const;

/** Catégories de blocs pour le sélecteur groupé */
export const BLOCK_CATEGORIES: { label: string; icon: string; prefix: string }[] = [
  { label: "Pierre", icon: "🪨", prefix: "stone|cobble|obsidian|nether|end_stone|bone|deep|black|sculk|prism|cry|tuff|calc|drip|mud" },
  { label: "Métal & Gemmes", icon: "💎", prefix: "iron_b|gold_b|diamond_b|emerald_b|lapis_b|redstone_b|amethyst|netherite_b|copper_b|raw_" },
  { label: "Lumineux", icon: "💡", prefix: "glow|sea_l|shroom|frog" },
  { label: "Bois", icon: "🪵", prefix: "oak|dark_oak|birch|spruce|acacia|jungle|crimson|warped|mangrove|cherry|bamboo" },
  { label: "Béton", icon: "🧱", prefix: "concrete" },
  { label: "Laine", icon: "🧶", prefix: "wool" },
  { label: "Terracotta", icon: "🏺", prefix: "terracotta" },
  { label: "Verre", icon: "🪟", prefix: "glass|tinted" },
  { label: "Divers", icon: "📦", prefix: "quartz|purpur|ice|honey|slime|kelp|hay|moss|mud_b|sand|smooth|brick|nether_b|red_nether" },
];

// ══════════════════════════════════════════
// Factories
// ══════════════════════════════════════════

export function createDefaultMob(author: string = "Joueur"): CustomMob {
  return {
    meta: {
      id: generateId(),
      name: "Nouveau Mob",
      author,
      description: "",
      created_at: new Date().toISOString(),
      version: 1,
    },
    stats: {
      max_health: 20,
      move_speed: 0.25,
      attack_damage: 4,
      detection_range: 16,
      armor: 0,
      knockback_resistance: 0,
      base_mob_type: "zombie",
      scale: 1.0,
    },
    parts: [],
    animations: createBaseAnimations(),
    attacks: [],
    behavior: {
      hostile: true,
      passive: false,
      neutral: false,
      wandering: true,
      wander_radius: 10,
      can_burn: false,
      can_drown: true,
      show_health_bar: true,
      name_color: "#ff4444",
      boss: false,
      boss_bar_range: 32,
      ai_rules: [],
    },
    loot: [],
    sounds: {
      ambient: null,
      hurt: null,
      death: null,
    },
    hitboxes: [],
  };
}

export function createDefaultPart(group: string = ""): ModelPart {
  return {
    id: generateId(),
    name: "Nouvelle Part",
    type: "block_display",
    block: "minecraft:stone",
    offset: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    parent_id: null,
    group,
  };
}

export function createDefaultAnimation(): MobAnimation {
  return {
    id: generateId(),
    name: "Nouvelle Animation",
    duration_ticks: 20,
    loop: true,
    keyframes: [],
  };
}

/** IDs réservés pour les animations de base (doivent correspondre aux états du StateMachine Java) */
export const BASE_ANIMATION_IDS = ["idle", "walk", "hurt", "death"] as const;

/** Crée les 4 animations de base vides que le joueur peut compléter */
export function createBaseAnimations(): MobAnimation[] {
  return [
    { id: "idle",  name: "Idle (repos)",   duration_ticks: 40, loop: true,  keyframes: [] },
    { id: "walk",  name: "Walk (marche)",  duration_ticks: 20, loop: true,  keyframes: [] },
    { id: "hurt",  name: "Hurt (dégât)",   duration_ticks: 10, loop: false, keyframes: [] },
    { id: "death", name: "Death (mort)",   duration_ticks: 30, loop: false, keyframes: [] },
  ];
}

export function createDefaultKeyframe(partIds: string | string[], tick: number = 0): AnimationKeyframe {
  return {
    tick,
    part_ids: Array.isArray(partIds) ? partIds : [partIds],
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  };
}

export function createDefaultAttack(): MobAttack {
  return {
    id: generateId(),
    name: "Nouvelle Attaque",
    attack_type: "melee",
    damage: 4,
    range: 3,
    cooldown: 2,
    animation_id: null,
    speed: 1.5,
    radius: 3,
    particle: null,
    particle_count: 10,
    color: [255, 255, 255],
    sound: null,
    sound_volume: 1.0,
    sound_pitch: 1.0,
    status_effect: null,
    status_duration: 3,
    status_amplifier: 0,
    knockback: 0.5,
    hitboxes: [],
  };
}

export function createDefaultHitbox(): Hitbox {
  return {
    id: generateId(),
    name: "Hitbox",
    shape: "box",
    offset: [0, 0.5, 0],
    size: [0.6, 1.8, 0.6],
    rotation: [0, 0, 0],
    attached_part_id: null,
  };
}

export function createDefaultAttackHitbox(durationTicks: number = 20): AttackHitbox {
  return {
    id: generateId(),
    name: "Zone d'impact",
    shape: "box",
    offset: [0, 0.5, 1.5],
    size: [1.5, 1.0, 1.5],
    rotation: [0, 0, 0],
    active_start_tick: Math.floor(durationTicks * 0.3),
    active_end_tick: Math.floor(durationTicks * 0.6),
    damage_override: null,
    knockback_direction: null,
  };
}

export function createDefaultLootEntry(): LootEntry {
  return {
    item: "minecraft:rotten_flesh",
    min_amount: 1,
    max_amount: 2,
    chance: 0.5,
  };
}

export function createDefaultAIRule(): AIRule {
  return {
    id: generateId(),
    name: "Nouvelle règle",
    enabled: true,
    priority: 10,
    condition: "health_below",
    condition_value: 30,
    action: "flee",
    action_value: "",
    cooldown: 10,
  };
}

export const AI_CONDITIONS: { value: AIConditionType; label: string; description: string; unit: string }[] = [
  { value: "health_below",           label: "❤️ Vie en-dessous de",        description: "% de vie restante", unit: "%" },
  { value: "health_above",           label: "❤️ Vie au-dessus de",         description: "% de vie restante", unit: "%" },
  { value: "target_distance_below",  label: "📏 Cible à moins de",         description: "Distance en blocs", unit: "blocs" },
  { value: "target_distance_above",  label: "📏 Cible à plus de",          description: "Distance en blocs", unit: "blocs" },
  { value: "time_in_state_above",    label: "⏱️ Temps dans l'état >",      description: "Ticks dans l'état actuel", unit: "ticks" },
  { value: "random_chance",          label: "🎲 Chance aléatoire",         description: "% de chance par tick", unit: "%" },
  { value: "target_exists",          label: "🎯 Cible existante",          description: "Valeur ignorée", unit: "" },
  { value: "no_target",              label: "🚫 Aucune cible",             description: "Valeur ignorée", unit: "" },
];

export const AI_ACTIONS: { value: AIActionType; label: string; description: string; valueHint: string }[] = [
  { value: "flee",              label: "🏃 Fuir",                description: "S'éloigne de la cible",                       valueHint: "Vitesse (ex: 1.5)" },
  { value: "summon_mob",        label: "👥 Invoquer un mob",      description: "Invoque un mob custom allié",                  valueHint: "ID du mob à invoquer" },
  { value: "play_animation",    label: "🎬 Jouer une animation", description: "Joue une animation spécifique",                valueHint: "ID de l'animation" },
  { value: "play_sound",        label: "🔊 Jouer un son",        description: "Joue un son Minecraft",                        valueHint: "entity.wither.spawn" },
  { value: "spawn_particles",   label: "✨ Particules",           description: "Émet des particules autour du mob",            valueHint: "FLAME:30 (type:quantité)" },
  { value: "heal",              label: "💚 Se soigner",           description: "Restaure des points de vie",                   valueHint: "Points de vie (ex: 10)" },
  { value: "teleport_random",   label: "🌀 Téléportation",       description: "Se téléporte aléatoirement près",              valueHint: "Rayon max (ex: 8)" },
  { value: "apply_effect_self", label: "🧪 Effet sur soi",       description: "S'applique un effet de potion",                valueHint: "speed:5:1 (effet:durée:niveau)" },
  { value: "change_speed",      label: "💨 Changer vitesse",      description: "Modifie temporairement la vitesse",            valueHint: "Multiplicateur (ex: 2.0)" },
  { value: "explode",           label: "💥 Exploser",             description: "Crée une explosion (sans dégâts aux blocs)",   valueHint: "Puissance (ex: 3.0)" },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}
