// ==================== TYPES SORT CUSTOM ====================

export type CastType = "instant" | "projectile" | "area";

export type DamageType =
  | "magic" | "fire" | "ice" | "lightning"
  | "void" | "holy" | "physical" | "necrotic";

export type StatusType =
  | "burn" | "slow" | "poison" | "weakness" | "blindness"
  | "freeze" | "wither" | "stun" | "levitation" | "glowing"
  | "nausea" | "regeneration" | "absorption";

export type TrailParticle =
  // Feu & Flammes
  | "FLAME" | "SOUL_FIRE_FLAME" | "SMALL_FLAME" | "DRIPPING_LAVA" | "LAVA"
  | "CAMPFIRE_COSY_SMOKE" | "CAMPFIRE_SIGNAL_SMOKE"
  // Fumée & Brume
  | "SMOKE" | "LARGE_SMOKE" | "ASH" | "WHITE_ASH"
  // Magie & Enchantement
  | "ENCHANT" | "DUST" | "DUST_COLOR_TRANSITION" | "WITCH" | "END_ROD"
  | "CRIT" | "MAGIC_CRIT" | "GLOW" | "TOTEM_OF_UNDYING"
  // Nature & Créatures
  | "HEART" | "VILLAGER_HAPPY" | "NOTE" | "CHERRY_LEAVES"
  | "SPORE_BLOSSOM_AIR" | "WARPED_SPORE" | "CRIMSON_SPORE"
  | "FALLING_SPORE_BLOSSOM" | "FALLING_HONEY" | "FALLING_NECTAR"
  | "DRIPPING_HONEY" | "DRIPPING_WATER" | "DRIPPING_OBSIDIAN_TEAR"
  // Énergie & Électricité
  | "ELECTRIC_SPARK" | "SONIC_BOOM" | "DRAGON_BREATH"
  // Froid & Neige
  | "SNOWFLAKE" | "CLOUD" | "BUBBLE_POP" | "BUBBLE"
  // Portails & Espace
  | "PORTAL" | "REVERSE_PORTAL" | "SQUID_INK" | "GLOW_SQUID_INK"
  // Sculk & Deep Dark
  | "SCULK_CHARGE" | "SCULK_SOUL" | "SCULK_CHARGE_POP"
  // Redstone & Mécanique
  | "WAX_ON" | "WAX_OFF" | "SCRAPE" | "COMPOSTER"
  // Trial & 1.21+
  | "TRIAL_SPAWNER_DETECTION" | "TRIAL_SPAWNER_DETECTION_OMINOUS"
  | "INFESTED" | "OMINOUS_SPAWNING" | "RAID_OMEN" | "VAULT_CONNECTION"
  | "DUST_PILLAR" | "SMALL_GUST" | "GUST"
  // Feuilles & Végétal (1.21.4+)
  | "PALE_OAK_LEAVES" | "TINTED_LEAVES"
  // Poussière & Chute
  | "FALLING_DUST" | "BLOCK_MARKER"
  // Combat & Slash
  | "SWEEP_ATTACK" | "DAMAGE_INDICATOR"
  // Feu d'artifice
  | "FIREWORK" | "FLASH";

export type ImpactParticle =
  // Explosions
  | "EXPLOSION" | "EXPLOSION_EMITTER" | "FLASH" | "SONIC_BOOM"
  // Fumée & Brume
  | "LARGE_SMOKE" | "CAMPFIRE_SIGNAL_SMOKE" | "CAMPFIRE_COSY_SMOKE"
  // Combat & Slash
  | "SWEEP_ATTACK" | "DAMAGE_INDICATOR" | "CRIT" | "MAGIC_CRIT"
  // Magie & Spécial
  | "TOTEM_OF_UNDYING" | "ELECTRIC_SPARK" | "DRAGON_BREATH"
  | "END_ROD" | "WITCH" | "ENCHANT" | "GLOW"
  // Élémentaire
  | "CLOUD" | "FIREWORK" | "DUST" | "DUST_COLOR_TRANSITION"
  | "CHERRY_LEAVES" | "FLAME" | "SOUL_FIRE_FLAME" | "SNOWFLAKE" | "LAVA"
  // Nature
  | "HEART" | "VILLAGER_HAPPY" | "BUBBLE_POP" | "SQUID_INK"
  | "WARPED_SPORE" | "CRIMSON_SPORE" | "SPORE_BLOSSOM_AIR"
  // Sculk
  | "SCULK_SOUL" | "SCULK_CHARGE" | "SCULK_CHARGE_POP"
  // Trial & 1.21+
  | "TRIAL_SPAWNER_DETECTION" | "INFESTED" | "DUST_PILLAR" | "GUST"
  // Portails
  | "PORTAL" | "REVERSE_PORTAL";

export type SoundKey =
  | "ENTITY_BLAZE_SHOOT" | "ENTITY_GENERIC_EXPLODE"
  | "ENTITY_ENDER_DRAGON_GROWL" | "ENTITY_WITHER_SHOOT"
  | "ENTITY_FIREWORK_ROCKET_BLAST" | "ENTITY_LIGHTNING_BOLT_THUNDER"
  | "ENTITY_ELDER_GUARDIAN_CURSE" | "ITEM_TRIDENT_THUNDER"
  | "ENTITY_ILLUSIONER_CAST_SPELL" | "ENTITY_EVOKER_PREPARE_ATTACK"
  | "BLOCK_BEACON_ACTIVATE" | "BLOCK_END_PORTAL_SPAWN"
  | "ENTITY_PHANTOM_BITE" | "ENTITY_WARDEN_SONIC_BOOM"
  | "BLOCK_AMETHYST_BLOCK_CHIME" | "ENTITY_ALLAY_AMBIENT_WITH_ITEM"
  | "ENTITY_WITHER_SPAWN" | "ENTITY_ZOMBIE_VILLAGER_CURE"
  | "ITEM_TOTEM_USE" | "ENTITY_RAVAGER_ROAR"
  | "BLOCK_BEACON_DEACTIVATE" | "ENTITY_GHAST_SCREAM"
  | "ENTITY_ENDERMAN_TELEPORT" | "ENTITY_VEX_CHARGE"
  | "ENTITY_WOLF_HOWL" | "BLOCK_ANVIL_LAND"
  | "ENTITY_IRON_GOLEM_REPAIR" | "BLOCK_BELL_USE"
  | "BLOCK_SCULK_SHRIEKER_SHRIEK" | "ENTITY_BREEZE_SHOOT"
  | "ENTITY_HORSE_GALLOP" | "BLOCK_TRIAL_SPAWNER_AMBIENT";

export type ParticlePattern =
  // Basiques
  | "linear" | "spiral" | "ring" | "helix" | "burst" | "wave"
  | "sphere" | "tornado" | "rain" | "orbit" | "cone"
  // Géométriques
  | "star" | "cross" | "diamond" | "pentagon" | "hexagon" | "octagon"
  | "crescent" | "arrow" | "shield_shape"
  // Complexes
  | "figure8" | "infinity" | "dna" | "vortex" | "zigzag" | "pulse"
  // Combat
  | "slash" | "slash_x" | "slash_vertical" | "stab" | "uppercut"
  // Auras
  | "aura" | "aura_flame" | "aura_frost" | "aura_electric" | "aura_dark" | "aura_holy"
  // Spéciaux
  | "beam" | "chain_lightning" | "shockwave" | "black_hole" | "wings";

export type ProjectileShape = "single" | "cone" | "line" | "rain" | "spiral";

// ==================== INTERFACES ====================

export interface SpellMeta {
  id: string;
  name: string;
  author: string;
  created_at: string;
  version: number;
  description?: string;
}

export interface SpellMechanics {
  cast_type: CastType;
  cooldown: number;
  mana_cost: number;
  range: number;
  speed?: number;
  radius?: number;
  area_duration?: number;
  area_pulses?: number;
  piercing?: boolean;
  bounce_count?: number;
  gravity?: number;
  // Nouvelles mécaniques avancées
  multi_projectile_count?: number;   // 1-10: nombre de projectiles
  multi_projectile_spread?: number;  // 5-90: angle de dispersion en degrés
  homing?: boolean;                  // projectile à tête chercheuse
  homing_strength?: number;          // 0.1-2.0: force du tracking
  cursor_guided?: boolean;           // le projectile suit le curseur du joueur
  charge_time?: number;              // 0-5: temps de charge en secondes
  projectile_shape?: ProjectileShape;// forme du tir
  area_follow_caster?: boolean;      // la zone suit le lanceur
  lifetime?: number;                 // 1-30: durée de vie du sort en secondes
}

// ── Particules par effet individuel ──

export interface EffectParticleConfig {
  particle: TrailParticle;
  count: number;           // 1-50
  spread: number;          // 0.5-10
  speed: number;           // 0.01-2
  pattern: "burst" | "ring" | "spiral" | "column" | "sphere";
  color?: [number, number, number];
  color_end?: [number, number, number];
  sound?: string;
}

// ── Effets étendus (Ars Nouveau + sorts existants) ──

export type SpellEffect =
  | ({ type: "damage"; amount: number; damage_type: DamageType } & { particles?: EffectParticleConfig })
  | ({ type: "heal"; amount: number } & { particles?: EffectParticleConfig })
  | ({ type: "status"; status: StatusType; duration: number; amplifier: number } & { particles?: EffectParticleConfig })
  | ({ type: "knockback"; strength: number } & { particles?: EffectParticleConfig })
  | ({ type: "pull"; strength: number } & { particles?: EffectParticleConfig })
  | ({ type: "shield"; amount: number; duration: number } & { particles?: EffectParticleConfig })
  | ({ type: "lifedrain"; amount: number } & { particles?: EffectParticleConfig })
  | ({ type: "teleport"; distance: number } & { particles?: EffectParticleConfig })
  | ({ type: "launch"; height: number } & { particles?: EffectParticleConfig })
  | ({ type: "speed_boost"; multiplier: number; duration: number } & { particles?: EffectParticleConfig })
  | ({ type: "aoe_dot"; amount: number; duration: number; tick_rate: number; damage_type: DamageType } & { particles?: EffectParticleConfig })
  | ({ type: "chain"; amount: number; damage_type: DamageType; max_targets: number; chain_range: number } & { particles?: EffectParticleConfig })
  | ({ type: "summon"; entity_type: SummonType; count: number; duration: number } & { particles?: EffectParticleConfig })
  | ({ type: "cleanse" } & { particles?: EffectParticleConfig })
  | ({ type: "ignite_area"; radius: number; duration: number } & { particles?: EffectParticleConfig })
  | ({ type: "freeze_area"; radius: number; duration: number } & { particles?: EffectParticleConfig })
  // Nouveaux effets avancés
  | ({ type: "swap" } & { particles?: EffectParticleConfig })
  | ({ type: "meteor"; amount: number; damage_type: DamageType; radius: number } & { particles?: EffectParticleConfig })
  | ({ type: "gravity_well"; strength: number; radius: number; duration: number } & { particles?: EffectParticleConfig })
  | ({ type: "poison_cloud"; amount: number; radius: number; duration: number; tick_rate: number } & { particles?: EffectParticleConfig })
  | ({ type: "blind_flash"; radius: number; duration: number } & { particles?: EffectParticleConfig })
  | ({ type: "earthquake"; amount: number; radius: number; duration: number } & { particles?: EffectParticleConfig })
  | ({ type: "vampiric_aura"; amount: number; radius: number; duration: number } & { particles?: EffectParticleConfig })
  | ({ type: "reflect_shield"; duration: number; amount: number } & { particles?: EffectParticleConfig })
  | ({ type: "decoy" } & { particles?: EffectParticleConfig })
  | ({ type: "time_warp"; radius: number; duration: number } & { particles?: EffectParticleConfig })
  | ({ type: "explosion"; amount: number; radius: number; damage_type: DamageType } & { particles?: EffectParticleConfig });

export type SummonType =
  | "wolf" | "vex" | "iron_golem" | "blaze" | "skeleton" | "zombie"
  | "bee" | "fox" | "axolotl" | "enderman" | "witch" | "creeper"
  | "spider" | "phantom" | "warden" | "allay"
  | (string & {}); // Permet les IDs de mobs customs (ex: "custom:mon_mob")

// ── Ciblage ──

export type EffectTarget = "target" | "caster" | "area_all" | "area_enemies" | "area_allies";

// ── Placement de blocs ──

export type PlaceableBlock =
  // Pierre
  | "stone" | "cobblestone" | "obsidian" | "deepslate" | "blackstone" | "basalt"
  | "netherrack" | "end_stone" | "crying_obsidian" | "calcite" | "tuff"
  | "dripstone_block" | "mud_bricks" | "prismarine" | "purpur_block"
  // Glace
  | "ice" | "packed_ice" | "blue_ice" | "snow_block" | "powder_snow"
  // Feu & Lumière
  | "fire" | "soul_fire" | "magma_block" | "glowstone" | "sea_lantern"
  | "shroomlight" | "jack_o_lantern" | "lantern" | "soul_lantern"
  // Verre
  | "glass" | "tinted_glass"
  | "white_stained_glass" | "black_stained_glass" | "red_stained_glass"
  | "blue_stained_glass" | "purple_stained_glass" | "cyan_stained_glass"
  // Spécial
  | "cobweb" | "slime_block" | "honey_block"
  | "soul_sand" | "scaffolding"
  // Nature
  | "moss_block" | "sculk" | "hay_block" | "honeycomb_block"
  | "mushroom_stem" | "brown_mushroom_block" | "melon" | "pumpkin"
  // Métal & Décoratif
  | "copper_block" | "iron_block" | "quartz_block" | "redstone_block"
  // Béton
  | "white_concrete" | "black_concrete" | "red_concrete" | "blue_concrete"
  | "green_concrete" | "yellow_concrete" | "orange_concrete" | "purple_concrete"
  | "cyan_concrete" | "pink_concrete" | "lime_concrete" | "light_blue_concrete"
  | "magenta_concrete" | "gray_concrete" | "light_gray_concrete" | "brown_concrete"
  // Laine
  | "white_wool" | "black_wool" | "red_wool" | "blue_wool"
  | "green_wool" | "yellow_wool" | "orange_wool" | "purple_wool"
  // Terracotta
  | "terracotta" | "white_terracotta" | "black_terracotta" | "red_terracotta"
  | "blue_terracotta" | "cyan_terracotta" | "orange_terracotta" | "purple_terracotta"
  // Bois
  | "oak_planks" | "spruce_planks" | "birch_planks" | "dark_oak_planks"
  | "crimson_planks" | "warped_planks";

export type PlacementEffect =
  | "instant" | "left_to_right" | "right_to_left"
  | "top_to_bottom" | "bottom_to_top"
  | "inside_out" | "outside_in"
  | "random" | "spiral";

export interface BlockPlacement {
  block: PlaceableBlock;
  pattern: BlockPattern;
  radius: number;        // 1-15
  height: number;        // 1-10
  duration: number;      // seconds before removal (0 = permanent)
  breakable: boolean;
  replace_existing: boolean;
  filled: boolean;       // for shapes like flat/dome/sphere/ring: fill interior
  offset_y: number;      // vertical offset from cast position (-5 to 10)
  placement_effect: PlacementEffect; // animation effect for block appearance
  placement_speed: number;           // seconds over which blocks progressively appear (0 = instant)
}

export type BlockPattern =
  | "flat" | "wall" | "dome" | "pillar" | "ring" | "scatter"
  | "sphere" | "cage" | "stairs" | "line" | "cross" | "spiral_tower"
  | "pyramid" | "cylinder" | "arch" | "platform";

// ── Animation (timeline) ──

export type SpellMode = "classic" | "animation";

export interface AnimationKeyframe {
  id: string;
  time: number;           // seconds from cast start
  type: "particles" | "effects" | "sound" | "blocks";
  // Particle zone
  particle_zone?: {
    particle: TrailParticle;
    pattern: ParticlePattern;
    offset: { x: number; y: number; z: number }; // relative to spell origin
    spread: number;
    count: number;
    duration: number;     // how long it persists
    custom?: CustomParticleConfig;
  };
  // Effects at this time
  effects?: SpellEffect[];
  effect_target?: EffectTarget;
  // Sound at this time
  sound?: SoundConfig;
  // Blocks at this time
  blocks?: BlockPlacement;
}

export interface SpellAnimation {
  duration: number;       // total animation duration in seconds
  keyframes: AnimationKeyframe[];
  loop: boolean;
  loop_count: number;     // 0 = infinite (until duration)
}

// ── Multi-couche de particules ──

export interface ParticleLayer {
  id: string;
  name: string;
  particle: TrailParticle;
  count: number;
  frequency: number;
  custom?: CustomParticleConfig;
}

export interface CustomParticleConfig {
  enabled: boolean;
  size_min: number;
  size_max: number;
  speed: number;
  gravity: number;
  spread: number;
  lifetime: number;
  color_start: [number, number, number];
  color_end: [number, number, number];
  pattern: ParticlePattern;
  density: number;
}

export interface SoundConfig {
  key: SoundKey;
  volume: number;
  pitch: number;
}

export interface ImpactVisual {
  particle: ImpactParticle;
  sound: SoundConfig;
}

export interface TargetParticleConfig {
  enabled: boolean;
  particle: TrailParticle;
  count: number;       // particles per target (1-30)
  pattern: "burst" | "ring" | "spiral" | "column" | "orbit" | "vortex" | "rain" | "helix" | "flame_aura" | "frost_aura" | "chains";
  duration: number;    // ticks the particle effect lasts (1-60 = 0.05-3s)
  color?: [number, number, number];           // couleur personnalisée
  color_end?: [number, number, number];       // fin de dégradé
  size?: number;                              // taille des particules (0.5-5)
  repeat?: boolean;                           // se répète pendant la durée
  repeat_interval?: number;                   // ticks entre chaque répétition
  custom?: CustomParticleConfig;              // config avancée complète
}

// ── Visuel de cast/charge ──

export interface CastVisualConfig {
  enabled: boolean;
  particle: TrailParticle;
  pattern: ParticlePattern;
  count: number;            // 1-50
  speed: number;            // 0.1-5
  radius: number;           // 0.5-5: rayon de l'animation de charge
  color?: [number, number, number];
  color_end?: [number, number, number];
  grow_with_charge?: boolean;  // le rayon grandit avec le temps de charge
  intensity_curve?: "linear" | "ease_in" | "ease_out" | "pulse" | "accelerate";
  sound?: SoundConfig;
}

// ── Visuel du projectile (au-delà de la traînée) ──

export interface ProjectileVisualConfig {
  enabled: boolean;
  shape: "sphere" | "cube" | "star" | "skull" | "rune" | "crystal" | "orb" | "arrow" | "disc" | "custom";
  particle: TrailParticle;
  size: number;            // 0.2-5: taille du projectile visuel
  rotation_speed: number;  // 0-10: vitesse de rotation (0 = pas de rotation)
  glow: boolean;           // lueur autour du projectile
  glow_color?: [number, number, number];
  pulse: boolean;          // le projectile pulse
  pulse_speed?: number;    // 0.5-5: vitesse du pulse
  secondary_particle?: TrailParticle;   // particule secondaire
  secondary_count?: number;
}

// ── Animation d'impact multi-étapes ──

export interface ImpactAnimationStep {
  delay: number;            // ticks après impact (0 = immédiat)
  particle: TrailParticle | ImpactParticle;
  pattern: ParticlePattern;
  count: number;            // 1-100
  spread: number;           // 0.5-10
  speed: number;            // 0.1-5
  color?: [number, number, number];
  color_end?: [number, number, number];
  sound?: SoundConfig;
  camera_shake?: number;    // 0-5: intensité du shake
}

export interface ImpactAnimationConfig {
  enabled: boolean;
  steps: ImpactAnimationStep[];  // séquence d'effets d'impact
  total_duration: number;        // durée totale en ticks
  screen_flash?: boolean;        // flash d'écran à l'impact
  screen_flash_color?: [number, number, number];
}

// ── Effet de slash / mêlée ──

export type SlashStyle = "horizontal" | "vertical" | "diagonal_right" | "diagonal_left"
  | "x_cross" | "spin" | "uppercut" | "crescent" | "double_slash" | "triple_combo";

export interface SlashVisualConfig {
  enabled: boolean;
  style: SlashStyle;
  particle: TrailParticle;
  arc_angle: number;       // 30-360: angle de l'arc de slash en degrés
  arc_width: number;       // 0.5-5: épaisseur de l'arc
  range: number;           // 1-10: portée du slash
  speed: number;           // 0.5-10: vitesse de l'animation
  color?: [number, number, number];
  color_end?: [number, number, number];
  trail_particles?: TrailParticle;  // particules de traînée du slash
  trail_count?: number;
  afterimage?: boolean;    // image rémanente (après-image)
  afterimage_count?: number; // 1-5: nombre d'après-images
}

// ── Présets de particules sauvegardés ──

export interface ParticlePreset {
  id: string;
  name: string;
  description?: string;
  author?: string;
  created_at: string;
  category?: "fire" | "ice" | "lightning" | "nature" | "dark" | "holy" | "water" | "wind" | "custom";
  layers: ParticleLayer[];
  impact?: ImpactVisual;
  impact_animation?: ImpactAnimationConfig;
  target_particles?: TargetParticleConfig;
  cast_visual?: CastVisualConfig;
  projectile_visual?: ProjectileVisualConfig;
  slash_visual?: SlashVisualConfig;
}

export interface SpellVisual {
  color: [number, number, number];
  particle_layers: ParticleLayer[];
  particle_trail?: {
    particle: TrailParticle;
    count: number;
    frequency: number;
    custom?: CustomParticleConfig;
  };
  impact: ImpactVisual;
  cast_sound?: SoundConfig;
  target_particles?: TargetParticleConfig;
  // ── Nouvelles animations de phases ──
  cast_visual?: CastVisualConfig;           // visuel pendant le cast/charge
  projectile_visual?: ProjectileVisualConfig; // apparence du projectile
  impact_animation?: ImpactAnimationConfig;  // animation d'impact multi-étapes
  slash_visual?: SlashVisualConfig;          // effet de slash/mêlée
  // ── Présets ──
  preset_id?: string;                        // référence à un preset sauvegardé
}

export interface Spell {
  meta: SpellMeta;
  mechanics: SpellMechanics;
  effects: SpellEffect[];
  visual: SpellVisual;
  // New systems
  mode?: SpellMode;                    // "classic" (default) or "animation"
  animation?: SpellAnimation;          // timeline keyframes (mode=animation)
  effect_target?: EffectTarget;        // global default target (mode=classic)
  block_placement?: BlockPlacement;    // optional block placement
  self_effects?: SpellEffect[];        // effets appliqués au lanceur lors du cast
  on_hit_effects?: SpellEffect[];      // effets supplémentaires à l'impact
  tags?: string[];                     // tags descriptifs (feu, glace, buff, etc.)
  particle_presets?: ParticlePreset[]; // présets de particules sauvegardés
  // ── Modèles visuels ──
  projectile_model?: SpellModelRef;    // modèle 3D pour le projectile
  impact_model?: SpellModelRef;        // modèle 3D à l'impact
  cast_model?: SpellModelRef;          // modèle 3D pendant le cast
  summon_model?: SpellModelRef;        // modèle 3D à invoquer
}

/** Référence légère à un modèle custom dans un sort */
export interface SpellModelRef {
  model_id: string;
  scale: number;
  animation_id: string | null;
  animation_speed: number;
  glow: boolean;
  glow_color: string;
  lifetime: number; // ticks, 0 = durée du sort
  rotation_offset: [number, number, number];
}

// ==================== CALCUL AUTO DU COÛT ====================

/**
 * Calcul auto de la Schnewrie (rebalancé pour s'aligner sur les sorts du plugin).
 * Plage cible : 5–40 Schnewrie, équivalent aux sorts de base :
 *   Utilitaire simple (gust, jet)    = 5-8
 *   Offensif moyen (fireball, chain)  = 10-16
 *   Puissant (meteor, tsunami)        = 18-28
 *   Ultime (black hole, meltdown)     = 30-40
 */
export function calculateManaCost(spell: Spell): number {
  let cost = 2; // coût de base minimal
  const m = spell.mechanics;

  // ── Portée ──
  // Portée courte (< 10) = peu cher, longue (30+) = plus cher
  cost += Math.max(0, m.range * 0.15);

  // ── Type de lancer ──
  if (m.cast_type === "projectile") {
    // Vitesse : un projectile rapide est plus puissant
    const speed = m.speed ?? 1.5;
    cost += speed * 0.5;
    // Perforant : traverse les entités → beaucoup plus fort
    if (m.piercing) cost += 4;
    // Rebonds : chaque rebond = chance de toucher plus de cibles
    const bounces = m.bounce_count ?? 0;
    if (bounces > 0) cost += bounces * 2;
    // Gravité négative (monte) = avantage tactique
    const grav = m.gravity ?? 0;
    if (grav < 0) cost += 1.5;
    // Guidé par curseur : très fort, le joueur contrôle la trajectoire
    if (m.cursor_guided) cost += 6;
  }
  if (m.cast_type === "area") {
    // Rayon : impact exponentiel car touche plus de cibles
    const radius = m.radius ?? 3;
    cost += radius * 1.2;
    // Pulsations multiples = dégâts répétés
    const pulses = m.area_pulses ?? 1;
    if (pulses > 1) cost += (pulses - 1) * 1.8;
    // Durée de zone = contrôle territorial
    const duration = m.area_duration ?? 0;
    if (duration > 0) cost += duration * 0.8;
  }

  // ── Effets (principal facteur de coût) ──
  const allEffects = spell.mode === "animation" && spell.animation
    ? spell.animation.keyframes.flatMap(kf => kf.effects ?? [])
    : spell.effects;

  for (const e of allEffects) {
    switch (e.type) {
      case "damage": {
        // Dégâts : principal facteur offensif
        const amt = e.amount ?? 0;
        cost += amt * 0.7;
        // Types élémentaires premium
        if (e.damage_type === "void") cost += 2;
        else if (e.damage_type === "holy") cost += 1.5;
        else if (e.damage_type === "lightning") cost += 1;
        break;
      }
      case "heal": cost += (e.amount ?? 0) * 0.9; break;
      case "status": {
        const dur = e.duration ?? 1;
        const amp = e.amplifier ?? 0;
        cost += dur * 0.8 + amp * 1.5;
        // Status très forts
        if (e.status === "stun") cost += 5;
        else if (e.status === "wither") cost += 2;
        else if (e.status === "blindness") cost += 1.5;
        else if (e.status === "levitation") cost += 2;
        break;
      }
      case "knockback": cost += (e.strength ?? 1) * 1.2; break;
      case "pull": cost += (e.strength ?? 1) * 1.5; break;
      case "shield": {
        const amt = e.amount ?? 2;
        const dur = e.duration ?? 5;
        cost += amt * 0.8 + dur * 0.4;
        break;
      }
      case "lifedrain": cost += (e.amount ?? 2) * 1.8; break; // heal + damage combined
      case "teleport": cost += 7; break;
      case "launch": cost += (e.height ?? 1) * 1.5; break;
      case "speed_boost": {
        const mul = e.multiplier ?? 1;
        const dur = e.duration ?? 5;
        cost += mul * 1.5 + dur * 0.3;
        break;
      }
      case "aoe_dot": {
        const amt = e.amount ?? 1;
        const dur = e.duration ?? 3;
        cost += amt * dur * 0.4;
        break;
      }
      case "chain": {
        const amt = e.amount ?? 2;
        const targets = e.max_targets ?? 3;
        cost += amt * 0.6 + targets * 1.5;
        break;
      }
      case "summon": {
        const count = e.count ?? 1;
        const dur = e.duration ?? 30;
        cost += count * 3.5 + dur * 0.2;
        break;
      }
      case "cleanse": cost += 5; break;
      case "ignite_area": {
        const r = e.radius ?? 3;
        const d = e.duration ?? 5;
        cost += r * 1.2 + d * 0.8;
        break;
      }
      case "freeze_area": {
        const r = e.radius ?? 3;
        const d = e.duration ?? 5;
        cost += r * 1.5 + d * 0.8;
        break;
      }
      case "swap": cost += 7; break;
      case "meteor": {
        const amt = e.amount ?? 1;
        const r = e.radius ?? 3;
        cost += amt * 1.5 + r * 1.5;
        break;
      }
      case "gravity_well": {
        const str = e.strength ?? 1;
        const r = e.radius ?? 4;
        const d = e.duration ?? 5;
        cost += str * 1.8 + r * 1.2 + d * 0.6;
        break;
      }
      case "poison_cloud": {
        const amt = e.amount ?? 1;
        const d = e.duration ?? 5;
        const r = e.radius ?? 3;
        cost += amt * d * 0.3 + r * 1.2;
        break;
      }
      case "blind_flash": {
        const r = e.radius ?? 5;
        const d = e.duration ?? 3;
        cost += r * 1.5 + d * 1.2;
        break;
      }
      case "earthquake": {
        const amt = e.amount ?? 5;
        const r = e.radius ?? 5;
        const d = e.duration ?? 3;
        cost += amt * 0.8 + r * 1.5 + d * 0.4;
        break;
      }
      case "vampiric_aura": {
        const amt = e.amount ?? 2;
        const r = e.radius ?? 4;
        const d = e.duration ?? 10;
        cost += amt * 1.2 + r * 0.8 + d * 0.4;
        break;
      }
      case "reflect_shield": {
        const d = e.duration ?? 10;
        const amt = e.amount ?? 2;
        cost += d * 1.2 + amt * 0.5;
        break;
      }
      case "decoy": cost += 5; break;
      case "time_warp": {
        const r = e.radius ?? 5;
        const d = e.duration ?? 5;
        cost += r * 2.5 + d * 1.5;
        break;
      }
    }
  }

  // ── Bloc placement ──
  if (spell.block_placement) {
    const bp = spell.block_placement;
    const r = bp.radius ?? 1;
    const h = bp.height ?? 1;
    cost += r * 1.5 + h * 1.0;
    if (bp.filled) cost += r * 0.5;
    if (!bp.breakable) cost += 2;
    if (bp.duration === 0) cost += 4; // permanent
    // Blocs résistants
    if (bp.block === "obsidian" || bp.block === "crying_obsidian") cost += 3;
  }

  // ── Self-effects et On-hit effects ──
  if (spell.self_effects?.length) {
    cost += spell.self_effects.length * 1.2;
  }
  if (spell.on_hit_effects?.length) {
    cost += spell.on_hit_effects.length * 1.5;
  }

  // ── Mécaniques avancées projectile ──
  const multiCount = m.multi_projectile_count ?? 1;
  if (multiCount > 1) {
    // Multi-projectile : coût progressif
    cost += (multiCount - 1) * 1.8;
  }
  if (m.homing) cost += 4;
  if (m.charge_time && m.charge_time > 0) {
    // Le temps de charge réduit le coût (contrepartie)
    cost -= Math.min(m.charge_time * 1.2, 5);
  }
  if (m.projectile_shape && m.projectile_shape !== "single") cost += 2.5;

  // ── Animation complexity ──
  if (spell.mode === "animation" && spell.animation) {
    cost += spell.animation.keyframes.length * 0.4;
    cost += spell.animation.duration * 0.2;
    if (spell.animation.loop) cost += 3;
  }

  // ── Visual complexity (nouvelles phases) ──
  const v = spell.visual;
  if (v.cast_visual?.enabled) {
    cost += 1.5;
    if (v.cast_visual.grow_with_charge) cost += 0.5;
  }
  if (v.projectile_visual?.enabled) {
    cost += 1.0;
    if (v.projectile_visual.glow) cost += 0.5;
    if (v.projectile_visual.pulse) cost += 0.3;
    if (v.projectile_visual.secondary_particle) cost += 0.5;
  }
  if (v.impact_animation?.enabled) {
    cost += (v.impact_animation.steps?.length ?? 0) * 0.8;
    if (v.impact_animation.screen_flash) cost += 0.5;
  }
  if (v.slash_visual?.enabled) {
    cost += 2.0;
    if (v.slash_visual.afterimage) cost += 1.0;
    const style = v.slash_visual.style;
    if (style === "triple_combo") cost += 1.5;
    else if (style === "double_slash" || style === "x_cross") cost += 0.8;
  }

  // ── Multiplicateur cooldown ──
  // CD très court (2s) → x1.5, CD moyen (10s) → x1.0, CD long (30s) → x0.65
  // Formule exponentielle pour être plus précis
  const cdMultiplier = Math.max(0.5, Math.min(1.6, 1.4 * Math.pow(0.97, m.cooldown)));
  cost *= cdMultiplier;

  // Arrondir et clamper entre 5 et 99999
  return Math.round(Math.max(5, Math.min(99999, cost)));
}

// ==================== VALEURS PAR DEFAUT ====================

export function createDefaultCustomParticle(): CustomParticleConfig {
  return {
    enabled: false,
    size_min: 0.5,
    size_max: 2.0,
    speed: 1.0,
    gravity: 0.0,
    spread: 1.0,
    lifetime: 1.0,
    color_start: [255, 100, 50],
    color_end: [255, 200, 100],
    pattern: "linear",
    density: 5,
  };
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function createDefaultParticleLayer(name?: string): ParticleLayer {
  return {
    id: generateUUID(),
    name: name ?? "Couche 1",
    particle: "FLAME",
    count: 5,
    frequency: 2,
  };
}

export function createDefaultSpell(author: string): Spell {
  return {
    meta: {
      id: generateUUID(),
      name: "Nouveau Sort",
      author,
      created_at: new Date().toISOString(),
      version: 1,
      description: "",
    },
    mechanics: {
      cast_type: "projectile",
      cooldown: 5,
      mana_cost: 20,
      range: 15,
      speed: 2,
    },
    effects: [
      { type: "damage", amount: 6, damage_type: "magic" },
    ],
    visual: {
      color: [138, 43, 226],
      particle_layers: [createDefaultParticleLayer("Traînée principale")],
      impact: {
        particle: "EXPLOSION",
        sound: { key: "ENTITY_BLAZE_SHOOT", volume: 1.0, pitch: 1.0 },
      },
    },
  };
}

/** Migre l'ancien format (particle_trail) vers multi-couches (particle_layers). */
export function migrateSpell(spell: Spell): Spell {
  // Migrate block_placement: add new fields if missing
  if (spell.block_placement) {
    const bp = spell.block_placement;
    if (bp.filled === undefined) bp.filled = true;
    if (bp.offset_y === undefined) bp.offset_y = 0;
  }

  if (spell.visual.particle_layers && spell.visual.particle_layers.length > 0) {
    return spell;
  }
  const trail = spell.visual.particle_trail;
  if (trail) {
    return {
      ...spell,
      visual: {
        ...spell.visual,
        particle_layers: [{
          id: generateUUID(),
          name: "Traînée principale",
          particle: trail.particle,
          count: trail.count,
          frequency: trail.frequency,
          custom: trail.custom,
        }],
      },
    };
  }
  return {
    ...spell,
    visual: { ...spell.visual, particle_layers: [createDefaultParticleLayer()] },
  };
}

// ==================== CONSTANTES SELECTS ====================

export const CAST_TYPES: { value: CastType; label: string }[] = [
  { value: "instant", label: "Instantané" },
  { value: "projectile", label: "Projectile" },
  { value: "area", label: "Zone (AoE)" },
];

export const DAMAGE_TYPES: { value: DamageType; label: string }[] = [
  { value: "magic", label: "🔮 Magique" },
  { value: "fire", label: "🔥 Feu" },
  { value: "ice", label: "❄️ Glace" },
  { value: "lightning", label: "⚡ Foudre" },
  { value: "void", label: "🌑 Void" },
  { value: "holy", label: "✨ Sacré" },
  { value: "physical", label: "⚔️ Physique" },
  { value: "necrotic", label: "💀 Nécrotique" },
];

export const STATUS_TYPES: { value: StatusType; label: string }[] = [
  { value: "burn", label: "🔥 Brûlure" },
  { value: "slow", label: "🐌 Ralentissement" },
  { value: "poison", label: "☠️ Poison" },
  { value: "weakness", label: "💔 Faiblesse" },
  { value: "blindness", label: "🌑 Aveuglement" },
  { value: "freeze", label: "❄️ Gel" },
  { value: "wither", label: "💀 Wither" },
  { value: "stun", label: "⚡ Étourdissement" },
  { value: "levitation", label: "🎈 Lévitation" },
  { value: "glowing", label: "💡 Luminescence" },
  { value: "nausea", label: "🌀 Nausée" },
  { value: "regeneration", label: "💚 Régénération" },
  { value: "absorption", label: "🛡️ Absorption" },
];

export const SUMMON_TYPES: { value: SummonType; label: string }[] = [
  { value: "wolf", label: "🐺 Loup" },
  { value: "vex", label: "👻 Vex" },
  { value: "iron_golem", label: "🤖 Golem de Fer" },
  { value: "blaze", label: "🔥 Blaze" },
  { value: "skeleton", label: "💀 Squelette" },
  { value: "zombie", label: "🧟 Zombie" },
  { value: "bee", label: "🐝 Abeille" },
  { value: "fox", label: "🦊 Renard" },
  { value: "axolotl", label: "🦎 Axolotl" },
  { value: "enderman", label: "👾 Enderman" },
  { value: "witch", label: "🧙 Sorcière" },
  { value: "creeper", label: "💣 Creeper" },
  { value: "spider", label: "🕷️ Araignée" },
  { value: "phantom", label: "🦇 Phantom" },
  { value: "warden", label: "👹 Warden" },
  { value: "allay", label: "🧚 Allay" },
];

export const TRAIL_PARTICLES: { value: TrailParticle; label: string; category?: string }[] = [
  // Feu & Flammes
  { value: "FLAME", label: "🔥 Flamme", category: "Feu" },
  { value: "SOUL_FIRE_FLAME", label: "💙 Flamme d'Âme", category: "Feu" },
  { value: "SMALL_FLAME", label: "🔥 Petite flamme", category: "Feu" },
  { value: "DRIPPING_LAVA", label: "🌋 Gouttes de lave", category: "Feu" },
  { value: "LAVA", label: "🌋 Lave", category: "Feu" },
  { value: "CAMPFIRE_COSY_SMOKE", label: "🏕️ Fumée de feu de camp", category: "Feu" },
  { value: "CAMPFIRE_SIGNAL_SMOKE", label: "🌫️ Signal de feu", category: "Feu" },
  // Fumée & Brume
  { value: "SMOKE", label: "💨 Fumée", category: "Fumée" },
  { value: "LARGE_SMOKE", label: "💨 Grosse fumée", category: "Fumée" },
  { value: "ASH", label: "🌫️ Cendre", category: "Fumée" },
  { value: "WHITE_ASH", label: "🌫️ Cendre blanche", category: "Fumée" },
  // Magie & Enchantement
  { value: "ENCHANT", label: "✨ Enchantement", category: "Magie" },
  { value: "DUST", label: "🎨 Poussière colorée", category: "Magie" },
  { value: "DUST_COLOR_TRANSITION", label: "🌈 Poussière dégradée", category: "Magie" },
  { value: "WITCH", label: "🧙 Sorcière", category: "Magie" },
  { value: "END_ROD", label: "🔮 Bâton de l'End", category: "Magie" },
  { value: "CRIT", label: "⚔️ Critique", category: "Magie" },
  { value: "MAGIC_CRIT", label: "💫 Critique magique", category: "Magie" },
  { value: "GLOW", label: "💡 Lueur", category: "Magie" },
  { value: "TOTEM_OF_UNDYING", label: "🏆 Totem arc-en-ciel", category: "Magie" },
  // Nature & Créatures
  { value: "HEART", label: "❤️ Cœurs", category: "Nature" },
  { value: "VILLAGER_HAPPY", label: "😊 Villageois content", category: "Nature" },
  { value: "NOTE", label: "🎵 Note", category: "Nature" },
  { value: "CHERRY_LEAVES", label: "🌸 Feuilles de cerisier", category: "Nature" },
  { value: "SPORE_BLOSSOM_AIR", label: "🌺 Fleur de spore", category: "Nature" },
  { value: "WARPED_SPORE", label: "🟢 Spore tordue", category: "Nature" },
  { value: "CRIMSON_SPORE", label: "🔴 Spore carmin", category: "Nature" },
  { value: "FALLING_SPORE_BLOSSOM", label: "🌸 Spore tombante", category: "Nature" },
  { value: "FALLING_HONEY", label: "🍯 Miel tombant", category: "Nature" },
  { value: "FALLING_NECTAR", label: "🌼 Nectar tombant", category: "Nature" },
  { value: "DRIPPING_HONEY", label: "🍯 Gouttes de miel", category: "Nature" },
  { value: "DRIPPING_WATER", label: "💧 Gouttes d'eau", category: "Nature" },
  { value: "DRIPPING_OBSIDIAN_TEAR", label: "💜 Larme d'obsidienne", category: "Nature" },
  { value: "PALE_OAK_LEAVES", label: "🍂 Feuilles pâles", category: "Nature" },
  { value: "TINTED_LEAVES", label: "🍃 Feuilles teintées", category: "Nature" },
  // Énergie & Électricité
  { value: "ELECTRIC_SPARK", label: "⚡ Étincelle", category: "Énergie" },
  { value: "SONIC_BOOM", label: "💥 Boom sonique", category: "Énergie" },
  { value: "DRAGON_BREATH", label: "🐉 Souffle de Dragon", category: "Énergie" },
  // Froid & Eau
  { value: "SNOWFLAKE", label: "❄️ Flocon de neige", category: "Froid" },
  { value: "CLOUD", label: "☁️ Nuage", category: "Froid" },
  { value: "BUBBLE_POP", label: "🫧 Bulle", category: "Froid" },
  { value: "BUBBLE", label: "🫧 Bulle d'eau", category: "Froid" },
  // Portails & Espace
  { value: "PORTAL", label: "🌀 Portail", category: "Portail" },
  { value: "REVERSE_PORTAL", label: "🌀 Portail inversé", category: "Portail" },
  { value: "SQUID_INK", label: "🦑 Encre", category: "Portail" },
  { value: "GLOW_SQUID_INK", label: "✨ Encre luminescente", category: "Portail" },
  // Sculk & Deep Dark
  { value: "SCULK_CHARGE", label: "🟤 Charge de Sculk", category: "Sculk" },
  { value: "SCULK_SOUL", label: "💀 Âme de Sculk", category: "Sculk" },
  { value: "SCULK_CHARGE_POP", label: "🟤 Éclat de Sculk", category: "Sculk" },
  // Redstone & Mécanique
  { value: "WAX_ON", label: "🟡 Cire", category: "Mécanique" },
  { value: "WAX_OFF", label: "🟡 Retrait cire", category: "Mécanique" },
  { value: "SCRAPE", label: "🔧 Grattage", category: "Mécanique" },
  { value: "COMPOSTER", label: "🌱 Composteur", category: "Mécanique" },
  // Trial & 1.21+
  { value: "TRIAL_SPAWNER_DETECTION", label: "🔺 Détection Trial", category: "Trial" },
  { value: "TRIAL_SPAWNER_DETECTION_OMINOUS", label: "🔺 Détection Ominous", category: "Trial" },
  { value: "INFESTED", label: "🐛 Infesté", category: "Trial" },
  { value: "OMINOUS_SPAWNING", label: "🌑 Apparition sinistre", category: "Trial" },
  { value: "RAID_OMEN", label: "🏴 Présage de raid", category: "Trial" },
  { value: "VAULT_CONNECTION", label: "🔐 Connexion coffre", category: "Trial" },
  { value: "DUST_PILLAR", label: "🏛️ Pilier de poussière", category: "Trial" },
  { value: "SMALL_GUST", label: "🌬️ Petite rafale", category: "Trial" },
  { value: "GUST", label: "🌬️ Rafale", category: "Trial" },
  // Poussière & Chute
  { value: "FALLING_DUST", label: "🌫️ Poussière tombante", category: "Poussière" },
  { value: "BLOCK_MARKER", label: "🔲 Marqueur de bloc", category: "Poussière" },
  // Combat & Slash
  { value: "SWEEP_ATTACK", label: "🗡️ Balayage", category: "Combat" },
  { value: "DAMAGE_INDICATOR", label: "💔 Indicateur de dégâts", category: "Combat" },
  // Feu d'artifice
  { value: "FIREWORK", label: "🎆 Feu d'artifice", category: "Artifice" },
  { value: "FLASH", label: "⚡ Flash", category: "Artifice" },
];

export const IMPACT_PARTICLES: { value: ImpactParticle; label: string; category?: string }[] = [
  // Explosions
  { value: "EXPLOSION", label: "💥 Explosion", category: "Explosion" },
  { value: "EXPLOSION_EMITTER", label: "💣 Explosion massive", category: "Explosion" },
  { value: "FLASH", label: "⚡ Flash", category: "Explosion" },
  { value: "SONIC_BOOM", label: "💥 Boom sonique", category: "Explosion" },
  // Fumée
  { value: "LARGE_SMOKE", label: "💨 Grosse fumée", category: "Fumée" },
  { value: "CAMPFIRE_SIGNAL_SMOKE", label: "🌫️ Fumée de signal", category: "Fumée" },
  { value: "CAMPFIRE_COSY_SMOKE", label: "🏕️ Fumée douce", category: "Fumée" },
  // Combat & Slash
  { value: "SWEEP_ATTACK", label: "🗡️ Balayage", category: "Combat" },
  { value: "DAMAGE_INDICATOR", label: "💔 Indicateur dégâts", category: "Combat" },
  { value: "CRIT", label: "⚔️ Critique", category: "Combat" },
  { value: "MAGIC_CRIT", label: "💫 Critique magique", category: "Combat" },
  // Magie
  { value: "TOTEM_OF_UNDYING", label: "🏆 Totem", category: "Magie" },
  { value: "ELECTRIC_SPARK", label: "⚡ Étincelle", category: "Magie" },
  { value: "DRAGON_BREATH", label: "🐉 Souffle de dragon", category: "Magie" },
  { value: "END_ROD", label: "🔮 Bâton de l'End", category: "Magie" },
  { value: "WITCH", label: "🧙 Sorcière", category: "Magie" },
  { value: "ENCHANT", label: "✨ Enchantement", category: "Magie" },
  { value: "GLOW", label: "💡 Lueur", category: "Magie" },
  // Élémentaire
  { value: "CLOUD", label: "☁️ Nuage", category: "Élémentaire" },
  { value: "FIREWORK", label: "🎆 Feu d'artifice", category: "Élémentaire" },
  { value: "DUST", label: "🎨 Poussière", category: "Élémentaire" },
  { value: "DUST_COLOR_TRANSITION", label: "🌈 Poussière dégradée", category: "Élémentaire" },
  { value: "CHERRY_LEAVES", label: "🌸 Cerisier", category: "Élémentaire" },
  { value: "FLAME", label: "🔥 Flamme", category: "Élémentaire" },
  { value: "SOUL_FIRE_FLAME", label: "💙 Flamme d'âme", category: "Élémentaire" },
  { value: "SNOWFLAKE", label: "❄️ Flocon", category: "Élémentaire" },
  { value: "LAVA", label: "🌋 Lave", category: "Élémentaire" },
  // Nature
  { value: "HEART", label: "❤️ Cœur", category: "Nature" },
  { value: "VILLAGER_HAPPY", label: "😊 Content", category: "Nature" },
  { value: "BUBBLE_POP", label: "🫧 Bulle", category: "Nature" },
  { value: "SQUID_INK", label: "🦑 Encre", category: "Nature" },
  { value: "WARPED_SPORE", label: "🟢 Spore tordue", category: "Nature" },
  { value: "CRIMSON_SPORE", label: "🔴 Spore carmin", category: "Nature" },
  { value: "SPORE_BLOSSOM_AIR", label: "🌺 Spore fleur", category: "Nature" },
  // Sculk
  { value: "SCULK_SOUL", label: "💀 Âme de Sculk", category: "Sculk" },
  { value: "SCULK_CHARGE", label: "🟤 Charge Sculk", category: "Sculk" },
  { value: "SCULK_CHARGE_POP", label: "🟤 Éclat Sculk", category: "Sculk" },
  // Trial & 1.21+
  { value: "TRIAL_SPAWNER_DETECTION", label: "🔺 Détection Trial", category: "Trial" },
  { value: "INFESTED", label: "🐛 Infesté", category: "Trial" },
  { value: "DUST_PILLAR", label: "🏛️ Pilier pouss.", category: "Trial" },
  { value: "GUST", label: "🌬️ Rafale", category: "Trial" },
  // Portails
  { value: "PORTAL", label: "🌀 Portail", category: "Portail" },
  { value: "REVERSE_PORTAL", label: "🌀 Portail inversé", category: "Portail" },
];

export const SOUND_KEYS: { value: SoundKey; label: string }[] = [
  { value: "ENTITY_BLAZE_SHOOT", label: "🔥 Tir de Blaze" },
  { value: "ENTITY_GENERIC_EXPLODE", label: "💥 Explosion" },
  { value: "ENTITY_ENDER_DRAGON_GROWL", label: "🐉 Grondement de Dragon" },
  { value: "ENTITY_WITHER_SHOOT", label: "💀 Tir de Wither" },
  { value: "ENTITY_WITHER_SPAWN", label: "💀 Apparition du Wither" },
  { value: "ENTITY_FIREWORK_ROCKET_BLAST", label: "🎆 Feu d'artifice" },
  { value: "ENTITY_LIGHTNING_BOLT_THUNDER", label: "⚡ Tonnerre" },
  { value: "ENTITY_ELDER_GUARDIAN_CURSE", label: "👁️ Malédiction Guardian" },
  { value: "ITEM_TRIDENT_THUNDER", label: "🔱 Trident tonnerre" },
  { value: "ENTITY_ILLUSIONER_CAST_SPELL", label: "🧙 Cast illusionneur" },
  { value: "ENTITY_EVOKER_PREPARE_ATTACK", label: "⚔️ Attaque Evoker" },
  { value: "BLOCK_BEACON_ACTIVATE", label: "🔔 Activation beacon" },
  { value: "BLOCK_BEACON_DEACTIVATE", label: "🔕 Désactivation beacon" },
  { value: "BLOCK_END_PORTAL_SPAWN", label: "🌀 Portail de l'End" },
  { value: "ENTITY_PHANTOM_BITE", label: "🦇 Morsure Phantom" },
  { value: "ENTITY_WARDEN_SONIC_BOOM", label: "💥 Boom du Warden" },
  { value: "BLOCK_AMETHYST_BLOCK_CHIME", label: "💎 Carillon améthyste" },
  { value: "ENTITY_ALLAY_AMBIENT_WITH_ITEM", label: "🧚 Mélodie Allay" },
  { value: "ENTITY_ZOMBIE_VILLAGER_CURE", label: "🧟 Guérison zombie" },
  { value: "ITEM_TOTEM_USE", label: "🏆 Totem d'immortalité" },
  { value: "ENTITY_RAVAGER_ROAR", label: "🐂 Rugissement Ravager" },
  { value: "ENTITY_GHAST_SCREAM", label: "👻 Cri du Ghast" },
  { value: "ENTITY_ENDERMAN_TELEPORT", label: "👾 Téléport Enderman" },
  { value: "ENTITY_VEX_CHARGE", label: "👻 Charge de Vex" },
  { value: "ENTITY_WOLF_HOWL", label: "🐺 Hurlement de loup" },
  { value: "BLOCK_ANVIL_LAND", label: "🔨 Enclume" },
  { value: "ENTITY_IRON_GOLEM_REPAIR", label: "🤖 Réparation Golem" },
  { value: "BLOCK_BELL_USE", label: "🔔 Cloche" },
  { value: "BLOCK_SCULK_SHRIEKER_SHRIEK", label: "🟤 Cri de Sculk" },
  { value: "ENTITY_BREEZE_SHOOT", label: "🌬️ Tir de Breeze" },
  { value: "ENTITY_HORSE_GALLOP", label: "🐎 Galop" },
  { value: "BLOCK_TRIAL_SPAWNER_AMBIENT", label: "🔺 Spawner d'épreuve" },
];

export const PARTICLE_PATTERNS: { value: ParticlePattern; label: string; category?: string }[] = [
  // Basiques
  { value: "linear", label: "Linéaire", category: "Basique" },
  { value: "spiral", label: "Spirale", category: "Basique" },
  { value: "ring", label: "Anneau", category: "Basique" },
  { value: "helix", label: "Hélice", category: "Basique" },
  { value: "burst", label: "Explosion", category: "Basique" },
  { value: "wave", label: "Vague", category: "Basique" },
  { value: "sphere", label: "Sphère 3D", category: "Basique" },
  { value: "tornado", label: "Tornade", category: "Basique" },
  { value: "rain", label: "Pluie", category: "Basique" },
  { value: "orbit", label: "Orbite", category: "Basique" },
  { value: "cone", label: "Cône", category: "Basique" },
  // Géométriques
  { value: "star", label: "⭐ Étoile", category: "Géométrique" },
  { value: "cross", label: "✖ Croix", category: "Géométrique" },
  { value: "diamond", label: "💎 Diamant", category: "Géométrique" },
  { value: "pentagon", label: "⬟ Pentagone", category: "Géométrique" },
  { value: "hexagon", label: "⬡ Hexagone", category: "Géométrique" },
  { value: "octagon", label: "⬣ Octogone", category: "Géométrique" },
  { value: "crescent", label: "🌙 Croissant", category: "Géométrique" },
  { value: "arrow", label: "➡ Flèche", category: "Géométrique" },
  { value: "shield_shape", label: "🛡 Bouclier", category: "Géométrique" },
  // Complexes
  { value: "figure8", label: "♾ Figure 8", category: "Complexe" },
  { value: "infinity", label: "♾ Infini", category: "Complexe" },
  { value: "dna", label: "🧬 ADN", category: "Complexe" },
  { value: "vortex", label: "🌀 Vortex", category: "Complexe" },
  { value: "zigzag", label: "⚡ Zigzag", category: "Complexe" },
  { value: "pulse", label: "💫 Pulsation", category: "Complexe" },
  // Combat
  { value: "slash", label: "🗡 Slash horizontal", category: "Combat" },
  { value: "slash_x", label: "⚔ Slash en X", category: "Combat" },
  { value: "slash_vertical", label: "🗡 Slash vertical", category: "Combat" },
  { value: "stab", label: "💢 Estoc", category: "Combat" },
  { value: "uppercut", label: "💪 Uppercut", category: "Combat" },
  // Auras
  { value: "aura", label: "💫 Aura", category: "Aura" },
  { value: "aura_flame", label: "🔥 Aura de feu", category: "Aura" },
  { value: "aura_frost", label: "❄️ Aura de glace", category: "Aura" },
  { value: "aura_electric", label: "⚡ Aura électrique", category: "Aura" },
  { value: "aura_dark", label: "🌑 Aura sombre", category: "Aura" },
  { value: "aura_holy", label: "✨ Aura sacrée", category: "Aura" },
  // Spéciaux
  { value: "beam", label: "💠 Rayon", category: "Spécial" },
  { value: "chain_lightning", label: "⚡ Éclair en chaîne", category: "Spécial" },
  { value: "shockwave", label: "🌊 Onde de choc", category: "Spécial" },
  { value: "black_hole", label: "🌑 Trou noir", category: "Spécial" },
  { value: "wings", label: "🪶 Ailes", category: "Spécial" },
];

export const EFFECT_TYPE_LABELS: Record<SpellEffect["type"], { icon: string; label: string; color: string }> = {
  damage:         { icon: "⚔", label: "Dégâts",          color: "#ef4444" },
  heal:           { icon: "💚", label: "Soin",             color: "#22c55e" },
  status:         { icon: "☠", label: "Statut",           color: "#a855f7" },
  knockback:      { icon: "💨", label: "Knockback",        color: "#64748b" },
  pull:           { icon: "🌀", label: "Attraction",       color: "#6366f1" },
  shield:         { icon: "🛡", label: "Bouclier",         color: "#3b82f6" },
  lifedrain:      { icon: "🩸", label: "Drain de vie",     color: "#dc2626" },
  teleport:       { icon: "✦", label: "Téléportation",    color: "#8b5cf6" },
  launch:         { icon: "🚀", label: "Propulsion",       color: "#06b6d4" },
  speed_boost:    { icon: "⚡", label: "Boost vitesse",    color: "#eab308" },
  aoe_dot:        { icon: "🔥", label: "Zone de dégâts",   color: "#f97316" },
  chain:          { icon: "⛓", label: "Chaîne",           color: "#14b8a6" },
  summon:         { icon: "👾", label: "Invocation",       color: "#84cc16" },
  cleanse:        { icon: "✨", label: "Purification",     color: "#f0f9ff" },
  ignite_area:    { icon: "🔥", label: "Embrasement",     color: "#ff6b35" },
  freeze_area:    { icon: "❄", label: "Gel de zone",      color: "#38bdf8" },
  swap:           { icon: "🔄", label: "Échange",          color: "#c084fc" },
  meteor:         { icon: "☄️", label: "Météore",          color: "#ef4444" },
  gravity_well:   { icon: "🌑", label: "Puits de gravité", color: "#312e81" },
  poison_cloud:   { icon: "☁️", label: "Nuage de poison",  color: "#65a30d" },
  blind_flash:    { icon: "💡", label: "Flash aveuglant",  color: "#fde68a" },
  earthquake:     { icon: "🌍", label: "Tremblement",      color: "#92400e" },
  vampiric_aura:  { icon: "🧛", label: "Aura vampirique",  color: "#7f1d1d" },
  reflect_shield: { icon: "🔰", label: "Bouclier miroir",  color: "#06b6d4" },
  decoy:          { icon: "🎭", label: "Leurre",           color: "#a78bfa" },
  time_warp:      { icon: "⏳", label: "Distorsion temp.", color: "#1e40af" },
  explosion:      { icon: "💣", label: "Explosion",       color: "#f97316" },
};

// ==================== CONSTANTES NOUVELLES FONCTIONNALITÉS ====================

export const EFFECT_TARGETS: { value: EffectTarget; label: string }[] = [
  { value: "target", label: "🎯 Cible touchée" },
  { value: "caster", label: "🧙 Lanceur" },
  { value: "area_all", label: "🌀 Zone (tous)" },
  { value: "area_enemies", label: "⚔️ Zone (ennemis)" },
  { value: "area_allies", label: "💚 Zone (alliés)" },
];

export const TARGET_PARTICLE_PATTERNS: { value: string; label: string }[] = [
  { value: "burst", label: "💥 Explosion" },
  { value: "ring", label: "⭕ Anneau" },
  { value: "spiral", label: "🌀 Spirale" },
  { value: "column", label: "🗼 Colonne" },
  { value: "orbit", label: "🔄 Orbite" },
  { value: "vortex", label: "🌪️ Vortex" },
  { value: "rain", label: "🌧️ Pluie" },
  { value: "helix", label: "🧬 Hélice" },
  { value: "flame_aura", label: "🔥 Aura de feu" },
  { value: "frost_aura", label: "❄️ Aura de glace" },
  { value: "chains", label: "⛓️ Chaînes" },
];

export const SLASH_STYLES: { value: SlashStyle; label: string; desc: string }[] = [
  { value: "horizontal", label: "➖ Horizontal", desc: "Slash de gauche à droite" },
  { value: "vertical", label: "❘ Vertical", desc: "Slash de haut en bas" },
  { value: "diagonal_right", label: "╲ Diagonale droite", desc: "Slash en diagonale vers la droite" },
  { value: "diagonal_left", label: "╱ Diagonale gauche", desc: "Slash en diagonale vers la gauche" },
  { value: "x_cross", label: "✖ Croix en X", desc: "Double slash en X" },
  { value: "spin", label: "🌀 Rotation", desc: "Slash circulaire complet (360°)" },
  { value: "uppercut", label: "⬆️ Uppercut", desc: "Slash du bas vers le haut" },
  { value: "crescent", label: "🌙 Croissant", desc: "Arc de slash en croissant" },
  { value: "double_slash", label: "⚔️ Double slash", desc: "Deux slashes rapides" },
  { value: "triple_combo", label: "🔥 Triple combo", desc: "Trois slashes enchaînés" },
];

export const PROJECTILE_VISUAL_SHAPES: { value: string; label: string }[] = [
  { value: "sphere", label: "🔵 Sphère" },
  { value: "cube", label: "🟧 Cube" },
  { value: "star", label: "⭐ Étoile" },
  { value: "skull", label: "💀 Crâne" },
  { value: "rune", label: "🔮 Rune" },
  { value: "crystal", label: "💎 Cristal" },
  { value: "orb", label: "🌕 Orbe" },
  { value: "arrow", label: "➡️ Flèche" },
  { value: "disc", label: "💿 Disque" },
  { value: "custom", label: "✨ Personnalisé" },
];

export const INTENSITY_CURVES: { value: string; label: string }[] = [
  { value: "linear", label: "📈 Linéaire" },
  { value: "ease_in", label: "📉 Lent → Rapide" },
  { value: "ease_out", label: "📈 Rapide → Lent" },
  { value: "pulse", label: "💓 Pulsation" },
  { value: "accelerate", label: "🚀 Accélération" },
];

export const PRESET_CATEGORIES: { value: string; label: string }[] = [
  { value: "fire", label: "🔥 Feu" },
  { value: "ice", label: "❄️ Glace" },
  { value: "lightning", label: "⚡ Foudre" },
  { value: "nature", label: "🌿 Nature" },
  { value: "dark", label: "🌑 Ténèbres" },
  { value: "holy", label: "✨ Sacré" },
  { value: "water", label: "💧 Eau" },
  { value: "wind", label: "🌬️ Vent" },
  { value: "custom", label: "🎨 Personnalisé" },
];

export const PLACEABLE_BLOCKS: { value: PlaceableBlock; label: string; category: string }[] = [
  // Pierre
  { value: "stone", label: "🪨 Pierre", category: "Pierre" },
  { value: "cobblestone", label: "🧱 Pavé", category: "Pierre" },
  { value: "deepslate", label: "🪨 Ardoise des abîmes", category: "Pierre" },
  { value: "obsidian", label: "🟣 Obsidienne", category: "Pierre" },
  { value: "crying_obsidian", label: "💜 Obsid. pleurante", category: "Pierre" },
  { value: "blackstone", label: "⬛ Pierre noire", category: "Pierre" },
  { value: "basalt", label: "🌫️ Basalte", category: "Pierre" },
  { value: "netherrack", label: "🟤 Netherrack", category: "Pierre" },
  { value: "end_stone", label: "🟡 Pierre de l'End", category: "Pierre" },
  { value: "calcite", label: "⬜ Calcite", category: "Pierre" },
  { value: "tuff", label: "🟤 Tuf", category: "Pierre" },
  { value: "dripstone_block", label: "🪨 Pierre d'égouttement", category: "Pierre" },
  { value: "mud_bricks", label: "🟤 Briques de boue", category: "Pierre" },
  { value: "prismarine", label: "🟢 Prismarine", category: "Pierre" },
  { value: "purpur_block", label: "🟣 Purpur", category: "Pierre" },
  // Glace
  { value: "ice", label: "🧊 Glace", category: "Glace" },
  { value: "packed_ice", label: "❄️ Glace compactée", category: "Glace" },
  { value: "blue_ice", label: "💠 Glace bleue", category: "Glace" },
  { value: "snow_block", label: "⬜ Neige", category: "Glace" },
  { value: "powder_snow", label: "🌨️ Poudreuse", category: "Glace" },
  // Feu & Lumière
  { value: "fire", label: "🔥 Feu", category: "Feu & Lumière" },
  { value: "soul_fire", label: "💙 Feu d'âme", category: "Feu & Lumière" },
  { value: "magma_block", label: "🌋 Magma", category: "Feu & Lumière" },
  { value: "glowstone", label: "✨ Luminite", category: "Feu & Lumière" },
  { value: "sea_lantern", label: "🔮 Lanterne aquat.", category: "Feu & Lumière" },
  { value: "shroomlight", label: "🍄 Champilumine", category: "Feu & Lumière" },
  { value: "jack_o_lantern", label: "🎃 Citrouille lum.", category: "Feu & Lumière" },
  { value: "lantern", label: "🏮 Lanterne", category: "Feu & Lumière" },
  { value: "soul_lantern", label: "💙 Lanterne d'âme", category: "Feu & Lumière" },
  // Verre
  { value: "glass", label: "🪟 Verre", category: "Verre" },
  { value: "tinted_glass", label: "🪟 Verre teinté", category: "Verre" },
  { value: "white_stained_glass", label: "⬜ Verre blanc", category: "Verre" },
  { value: "black_stained_glass", label: "⬛ Verre noir", category: "Verre" },
  { value: "red_stained_glass", label: "🔴 Verre rouge", category: "Verre" },
  { value: "blue_stained_glass", label: "🔵 Verre bleu", category: "Verre" },
  { value: "purple_stained_glass", label: "🟣 Verre violet", category: "Verre" },
  { value: "cyan_stained_glass", label: "🔵 Verre cyan", category: "Verre" },
  // Spécial

  { value: "cobweb", label: "🕸️ Toile d'araignée", category: "Spécial" },
  { value: "slime_block", label: "🟢 Bloc de slime", category: "Spécial" },
  { value: "honey_block", label: "🍯 Bloc de miel", category: "Spécial" },
  { value: "soul_sand", label: "🟤 Sable des âmes", category: "Spécial" },
  { value: "scaffolding", label: "🪜 Échafaudage", category: "Spécial" },
  // Nature
  { value: "moss_block", label: "🌿 Mousse", category: "Nature" },
  { value: "sculk", label: "🟫 Sculk", category: "Nature" },
  { value: "hay_block", label: "🌾 Botte de foin", category: "Nature" },
  { value: "honeycomb_block", label: "🍯 Nid d'abeille", category: "Nature" },
  { value: "mushroom_stem", label: "🍄 Tige champi.", category: "Nature" },
  { value: "brown_mushroom_block", label: "🟤 Champi. brun", category: "Nature" },
  { value: "melon", label: "🍉 Pastèque", category: "Nature" },
  { value: "pumpkin", label: "🎃 Citrouille", category: "Nature" },
  // Métal & Décoratif
  { value: "iron_block", label: "⬜ Fer", category: "Métal" },
  { value: "copper_block", label: "🟠 Cuivre", category: "Métal" },
  { value: "quartz_block", label: "⬜ Quartz", category: "Métal" },
  { value: "redstone_block", label: "🔴 Redstone", category: "Métal" },
  // Béton
  { value: "white_concrete", label: "⬜ Béton blanc", category: "Béton" },
  { value: "black_concrete", label: "⬛ Béton noir", category: "Béton" },
  { value: "red_concrete", label: "🔴 Béton rouge", category: "Béton" },
  { value: "blue_concrete", label: "🔵 Béton bleu", category: "Béton" },
  { value: "green_concrete", label: "🟢 Béton vert", category: "Béton" },
  { value: "yellow_concrete", label: "🟡 Béton jaune", category: "Béton" },
  { value: "orange_concrete", label: "🟠 Béton orange", category: "Béton" },
  { value: "purple_concrete", label: "🟣 Béton violet", category: "Béton" },
  { value: "cyan_concrete", label: "🔵 Béton cyan", category: "Béton" },
  { value: "pink_concrete", label: "🩷 Béton rose", category: "Béton" },
  { value: "lime_concrete", label: "🟢 Béton vert clair", category: "Béton" },
  { value: "light_blue_concrete", label: "🩵 Béton bleu clair", category: "Béton" },
  { value: "magenta_concrete", label: "🟣 Béton magenta", category: "Béton" },
  { value: "gray_concrete", label: "⬜ Béton gris", category: "Béton" },
  { value: "light_gray_concrete", label: "⬜ Béton gris clair", category: "Béton" },
  { value: "brown_concrete", label: "🟤 Béton marron", category: "Béton" },
  // Laine
  { value: "white_wool", label: "⬜ Laine blanche", category: "Laine" },
  { value: "black_wool", label: "⬛ Laine noire", category: "Laine" },
  { value: "red_wool", label: "🔴 Laine rouge", category: "Laine" },
  { value: "blue_wool", label: "🔵 Laine bleue", category: "Laine" },
  { value: "green_wool", label: "🟢 Laine verte", category: "Laine" },
  { value: "yellow_wool", label: "🟡 Laine jaune", category: "Laine" },
  { value: "orange_wool", label: "🟠 Laine orange", category: "Laine" },
  { value: "purple_wool", label: "🟣 Laine violette", category: "Laine" },
  // Terracotta
  { value: "terracotta", label: "🟤 Terracotta", category: "Terracotta" },
  { value: "white_terracotta", label: "⬜ Terracotta blanc", category: "Terracotta" },
  { value: "black_terracotta", label: "⬛ Terracotta noir", category: "Terracotta" },
  { value: "red_terracotta", label: "🔴 Terracotta rouge", category: "Terracotta" },
  { value: "blue_terracotta", label: "🔵 Terracotta bleu", category: "Terracotta" },
  { value: "cyan_terracotta", label: "🔵 Terracotta cyan", category: "Terracotta" },
  { value: "orange_terracotta", label: "🟠 Terracotta orange", category: "Terracotta" },
  { value: "purple_terracotta", label: "🟣 Terracotta violet", category: "Terracotta" },
  // Bois
  { value: "oak_planks", label: "🟤 Chêne", category: "Bois" },
  { value: "spruce_planks", label: "🟤 Sapin", category: "Bois" },
  { value: "birch_planks", label: "🟡 Bouleau", category: "Bois" },
  { value: "dark_oak_planks", label: "⬛ Chêne noir", category: "Bois" },
  { value: "crimson_planks", label: "🔴 Carmin", category: "Bois" },
  { value: "warped_planks", label: "🔵 Biscornu", category: "Bois" },
];

export const BLOCK_PATTERNS: { value: BlockPattern; label: string; desc: string; supportsFilled: boolean }[] = [
  { value: "flat", label: "⬛ Plat", desc: "Disque au sol", supportsFilled: true },
  { value: "wall", label: "🧱 Mur", desc: "Mur devant le lanceur", supportsFilled: false },
  { value: "dome", label: "🏠 Dôme", desc: "Demi-sphère au-dessus", supportsFilled: true },
  { value: "pillar", label: "🗼 Pilier", desc: "Colonne verticale", supportsFilled: false },
  { value: "ring", label: "⭕ Anneau", desc: "Cercle horizontal", supportsFilled: true },
  { value: "scatter", label: "✨ Dispersé", desc: "Blocs aléatoires", supportsFilled: false },
  { value: "sphere", label: "🔵 Sphère", desc: "Sphère complète", supportsFilled: true },
  { value: "cage", label: "🔲 Cage", desc: "Cube (creux par défaut)", supportsFilled: true },
  { value: "stairs", label: "📶 Escalier", desc: "Marches vers l'avant", supportsFilled: false },
  { value: "line", label: "➖ Ligne", desc: "Ligne vers l'avant", supportsFilled: false },
  { value: "cross", label: "✚ Croix", desc: "Forme en plus au sol", supportsFilled: false },
  { value: "spiral_tower", label: "🌀 Tour spirale", desc: "Colonne en spirale", supportsFilled: false },
  { value: "pyramid", label: "🔺 Pyramide", desc: "Pyramide à base carrée", supportsFilled: true },
  { value: "cylinder", label: "🛢️ Cylindre", desc: "Colonne circulaire", supportsFilled: true },
  { value: "arch", label: "🌉 Arche", desc: "Arc devant le lanceur", supportsFilled: false },
  { value: "platform", label: "🟫 Plateforme", desc: "Plate-forme surélevée", supportsFilled: false },
];

export const PLACEMENT_EFFECTS: { value: PlacementEffect; label: string; desc: string }[] = [
  { value: "instant", label: "⚡ Instantané", desc: "Tous les blocs apparaissent en même temps" },
  { value: "left_to_right", label: "➡️ Gauche → Droite", desc: "Les blocs apparaissent de gauche à droite" },
  { value: "right_to_left", label: "⬅️ Droite → Gauche", desc: "Les blocs apparaissent de droite à gauche" },
  { value: "top_to_bottom", label: "⬇️ Haut → Bas", desc: "Les blocs apparaissent du haut vers le bas" },
  { value: "bottom_to_top", label: "⬆️ Bas → Haut", desc: "Les blocs apparaissent du bas vers le haut" },
  { value: "inside_out", label: "💫 Intérieur → Extérieur", desc: "Les blocs apparaissent du centre vers l'extérieur" },
  { value: "outside_in", label: "🎯 Extérieur → Intérieur", desc: "Les blocs apparaissent de l'extérieur vers le centre" },
  { value: "random", label: "🎲 Aléatoire", desc: "Les blocs apparaissent dans un ordre aléatoire" },
  { value: "spiral", label: "🌀 Spirale", desc: "Les blocs apparaissent en spirale depuis le centre" },
];

export const PROJECTILE_SHAPES: { value: ProjectileShape; label: string }[] = [
  { value: "single", label: "🎯 Unique" },
  { value: "cone", label: "🔺 Cône" },
  { value: "line", label: "➖ Ligne" },
  { value: "rain", label: "🌧️ Pluie" },
  { value: "spiral", label: "🌀 Spirale" },
];

export function createDefaultBlockPlacement(): BlockPlacement {
  return {
    block: "stone",
    pattern: "flat",
    radius: 3,
    height: 1,
    duration: 10,
    breakable: true,
    replace_existing: false,
    filled: true,
    offset_y: 0,
    placement_effect: "instant",
    placement_speed: 0,
  };
}

export function createDefaultCastVisual(): CastVisualConfig {
  return {
    enabled: false,
    particle: "ENCHANT",
    pattern: "spiral",
    count: 10,
    speed: 1.0,
    radius: 1.5,
    grow_with_charge: true,
    intensity_curve: "ease_in",
  };
}

export function createDefaultProjectileVisual(): ProjectileVisualConfig {
  return {
    enabled: false,
    shape: "orb",
    particle: "END_ROD",
    size: 1.0,
    rotation_speed: 2.0,
    glow: true,
    pulse: false,
  };
}

export function createDefaultImpactAnimation(): ImpactAnimationConfig {
  return {
    enabled: false,
    steps: [
      {
        delay: 0,
        particle: "EXPLOSION",
        pattern: "burst",
        count: 30,
        spread: 3,
        speed: 1.0,
      },
    ],
    total_duration: 10,
  };
}

export function createDefaultImpactStep(delay: number): ImpactAnimationStep {
  return {
    delay,
    particle: "FLAME",
    pattern: "ring",
    count: 15,
    spread: 2,
    speed: 1.0,
  };
}

export function createDefaultSlashVisual(): SlashVisualConfig {
  return {
    enabled: false,
    style: "horizontal",
    particle: "SWEEP_ATTACK",
    arc_angle: 120,
    arc_width: 1.5,
    range: 3,
    speed: 3.0,
    afterimage: false,
  };
}

export function createDefaultPreset(author?: string): ParticlePreset {
  return {
    id: generateUUID(),
    name: "Nouveau Préset",
    author,
    created_at: new Date().toISOString(),
    category: "custom",
    layers: [createDefaultParticleLayer("Couche 1")],
  };
}

export function createDefaultKeyframe(time: number): AnimationKeyframe {
  return {
    id: generateUUID(),
    time,
    type: "particles",
    particle_zone: {
      particle: "FLAME",
      pattern: "burst",
      offset: { x: 0, y: 0, z: 0 },
      spread: 2,
      count: 10,
      duration: 1,
    },
  };
}

export function createDefaultAnimation(): SpellAnimation {
  return {
    duration: 3,
    keyframes: [createDefaultKeyframe(0)],
    loop: false,
    loop_count: 0,
  };
}

export function createDefaultModelRef(): SpellModelRef {
  return {
    model_id: "",
    scale: 1.0,
    animation_id: null,
    animation_speed: 1.0,
    glow: false,
    glow_color: "#ffffff",
    lifetime: 0,
    rotation_offset: [0, 0, 0],
  };
}
