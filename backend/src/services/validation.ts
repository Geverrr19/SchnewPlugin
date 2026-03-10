const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VALID_CAST_TYPES = ["instant", "projectile", "area"] as const;
const VALID_DAMAGE_TYPES = ["magic", "fire", "ice", "lightning", "void", "holy", "physical", "necrotic"] as const;
const VALID_STATUS_TYPES = [
  "burn", "slow", "poison", "weakness", "blindness",
  "freeze", "wither", "stun", "levitation", "glowing",
  "nausea", "regeneration", "absorption",
] as const;
const VALID_TRAIL_PARTICLES = [
  "FLAME", "SOUL_FIRE_FLAME", "SMOKE", "ENCHANT", "DUST",
  "HEART", "CRIT", "WITCH", "END_ROD", "DRAGON_BREATH",
  "ELECTRIC_SPARK", "SNOWFLAKE", "CHERRY_LEAVES",
  "CAMPFIRE_SIGNAL_SMOKE", "DRIPPING_LAVA", "WAX_ON",
  "SCULK_CHARGE", "SONIC_BOOM", "TRIAL_SPAWNER_DETECTION",
] as const;
const VALID_IMPACT_PARTICLES = [
  "EXPLOSION", "LARGE_SMOKE", "FLASH", "SWEEP_ATTACK",
  "EXPLOSION_EMITTER", "TOTEM_OF_UNDYING", "SONIC_BOOM",
  "ELECTRIC_SPARK", "CAMPFIRE_SIGNAL_SMOKE",
] as const;
const VALID_SOUND_KEYS = [
  "ENTITY_BLAZE_SHOOT", "ENTITY_GENERIC_EXPLODE",
  "ENTITY_ENDER_DRAGON_GROWL", "ENTITY_WITHER_SHOOT",
  "ENTITY_FIREWORK_ROCKET_BLAST", "ENTITY_LIGHTNING_BOLT_THUNDER",
  "ENTITY_ELDER_GUARDIAN_CURSE", "ITEM_TRIDENT_THUNDER",
  "ENTITY_ILLUSIONER_CAST_SPELL", "ENTITY_EVOKER_PREPARE_ATTACK",
  "BLOCK_BEACON_ACTIVATE", "BLOCK_END_PORTAL_SPAWN",
  "ENTITY_PHANTOM_BITE", "ENTITY_WARDEN_SONIC_BOOM",
  "BLOCK_AMETHYST_BLOCK_CHIME", "ENTITY_ALLAY_AMBIENT_WITH_ITEM",
] as const;
const VALID_PATTERNS = ["linear", "spiral", "ring", "helix", "burst", "wave"] as const;

function validateSound(sound: Record<string, unknown>, prefix: string, errors: string[]) {
  if (!VALID_SOUND_KEYS.includes(sound.key as any))
    errors.push(`${prefix}.key: doit être une valeur valide`);
  if (typeof sound.volume !== "number" || sound.volume < 0 || sound.volume > 2)
    errors.push(`${prefix}.volume: doit être entre 0 et 2`);
  if (typeof sound.pitch !== "number" || sound.pitch < 0.5 || sound.pitch > 2)
    errors.push(`${prefix}.pitch: doit être entre 0.5 et 2`);
}

export function validateSpell(data: unknown): string[] {
  const errors: string[] = [];
  if (!data || typeof data !== "object") return ["Le sort doit être un objet JSON"];
  const spell = data as Record<string, unknown>;

  // META
  if (!spell.meta || typeof spell.meta !== "object") {
    errors.push("meta: section manquante");
  } else {
    const meta = spell.meta as Record<string, unknown>;
    if (typeof meta.id !== "string" || !UUID_V4_REGEX.test(meta.id))
      errors.push("meta.id: doit être un UUID v4 valide");
    if (typeof meta.name !== "string" || meta.name.trim().length === 0)
      errors.push("meta.name: doit être une string non vide");
    if (typeof meta.author !== "string" || meta.author.trim().length === 0)
      errors.push("meta.author: doit être une string non vide");
    if (typeof meta.created_at !== "string")
      errors.push("meta.created_at: doit être une string ISO");
    if (meta.version !== 1) errors.push("meta.version: doit être 1");
  }

  // MECHANICS
  if (!spell.mechanics || typeof spell.mechanics !== "object") {
    errors.push("mechanics: section manquante");
  } else {
    const mech = spell.mechanics as Record<string, unknown>;
    if (!VALID_CAST_TYPES.includes(mech.cast_type as any))
      errors.push(`mechanics.cast_type: doit être ${VALID_CAST_TYPES.join(", ")}`);
    if (typeof mech.cooldown !== "number" || mech.cooldown < 0)
      errors.push("mechanics.cooldown: doit être un nombre >= 0");
    if (typeof mech.mana_cost !== "number" || mech.mana_cost < 0)
      errors.push("mechanics.mana_cost: doit être un nombre >= 0");
    if (typeof mech.range !== "number" || mech.range < 0)
      errors.push("mechanics.range: doit être un nombre >= 0");
    if (mech.cast_type === "projectile") {
      if (typeof mech.speed !== "number" || mech.speed <= 0)
        errors.push("mechanics.speed: obligatoire et > 0 pour projectile");
    }
    if (mech.cast_type === "area") {
      if (typeof mech.radius !== "number" || mech.radius <= 0)
        errors.push("mechanics.radius: obligatoire et > 0 pour area");
    }
    // optional fields
    if (mech.area_duration !== undefined && (typeof mech.area_duration !== "number" || mech.area_duration < 0))
      errors.push("mechanics.area_duration: doit être >= 0");
    if (mech.area_pulses !== undefined && (typeof mech.area_pulses !== "number" || mech.area_pulses < 1))
      errors.push("mechanics.area_pulses: doit être >= 1");
    if (mech.piercing !== undefined && typeof mech.piercing !== "boolean")
      errors.push("mechanics.piercing: doit être un booléen");
  }

  // EFFECTS
  if (!Array.isArray(spell.effects)) {
    errors.push("effects: doit être un tableau");
  } else if (spell.effects.length < 1) {
    errors.push("effects: doit contenir au moins 1 effet");
  } else {
    spell.effects.forEach((effect: unknown, i: number) => {
      if (!effect || typeof effect !== "object") {
        errors.push(`effects[${i}]: doit être un objet`);
        return;
      }
      const eff = effect as Record<string, unknown>;
      switch (eff.type) {
        case "damage":
          if (typeof eff.amount !== "number" || eff.amount <= 0)
            errors.push(`effects[${i}].amount: doit être > 0`);
          if (!VALID_DAMAGE_TYPES.includes(eff.damage_type as any))
            errors.push(`effects[${i}].damage_type: valeur invalide`);
          break;
        case "heal":
          if (typeof eff.amount !== "number" || eff.amount <= 0)
            errors.push(`effects[${i}].amount: doit être > 0`);
          break;
        case "status":
          if (!VALID_STATUS_TYPES.includes(eff.status as any))
            errors.push(`effects[${i}].status: valeur invalide`);
          if (typeof eff.duration !== "number" || eff.duration <= 0)
            errors.push(`effects[${i}].duration: doit être > 0`);
          if (typeof eff.amplifier !== "number" || eff.amplifier < 0)
            errors.push(`effects[${i}].amplifier: doit être >= 0`);
          break;
        case "knockback":
          if (typeof eff.strength !== "number" || eff.strength <= 0)
            errors.push(`effects[${i}].strength: doit être > 0`);
          break;
        default:
          errors.push(`effects[${i}].type: doit être damage, heal, status ou knockback`);
      }
    });
  }

  // VISUAL
  if (!spell.visual || typeof spell.visual !== "object") {
    errors.push("visual: section manquante");
  } else {
    const vis = spell.visual as Record<string, unknown>;

    // color
    if (!Array.isArray(vis.color) || vis.color.length !== 3) {
      errors.push("visual.color: doit être [R, G, B]");
    } else {
      const valid = vis.color.every(
        (c: unknown) => typeof c === "number" && c >= 0 && c <= 255
      );
      if (!valid) errors.push("visual.color: valeurs entre 0 et 255");
    }

    // particle_trail
    if (!vis.particle_trail || typeof vis.particle_trail !== "object") {
      errors.push("visual.particle_trail: section manquante");
    } else {
      const trail = vis.particle_trail as Record<string, unknown>;
      if (!VALID_TRAIL_PARTICLES.includes(trail.particle as any))
        errors.push("visual.particle_trail.particle: valeur invalide");
      if (typeof trail.count !== "number" || trail.count < 1)
        errors.push("visual.particle_trail.count: doit être >= 1");
      if (typeof trail.frequency !== "number" || trail.frequency <= 0)
        errors.push("visual.particle_trail.frequency: doit être > 0");

      // optional custom particle config
      if (trail.custom && typeof trail.custom === "object") {
        const cp = trail.custom as Record<string, unknown>;
        if (typeof cp.enabled !== "boolean")
          errors.push("custom.enabled: doit être un booléen");
        if (typeof cp.size_min !== "number" || cp.size_min < 0.1)
          errors.push("custom.size_min: >= 0.1");
        if (typeof cp.size_max !== "number" || cp.size_max < 0.1)
          errors.push("custom.size_max: >= 0.1");
        if (typeof cp.speed !== "number" || cp.speed < 0)
          errors.push("custom.speed: >= 0");
        if (typeof cp.gravity !== "number")
          errors.push("custom.gravity: nombre requis");
        if (typeof cp.spread !== "number" || cp.spread < 0)
          errors.push("custom.spread: >= 0");
        if (typeof cp.lifetime !== "number" || cp.lifetime <= 0)
          errors.push("custom.lifetime: > 0");
        if (!Array.isArray(cp.color_start) || cp.color_start.length !== 3)
          errors.push("custom.color_start: [R, G, B]");
        if (!Array.isArray(cp.color_end) || cp.color_end.length !== 3)
          errors.push("custom.color_end: [R, G, B]");
        if (!VALID_PATTERNS.includes(cp.pattern as any))
          errors.push("custom.pattern: valeur invalide");
        if (typeof cp.density !== "number" || cp.density < 1)
          errors.push("custom.density: >= 1");
      }
    }

    // impact
    if (!vis.impact || typeof vis.impact !== "object") {
      errors.push("visual.impact: section manquante");
    } else {
      const impact = vis.impact as Record<string, unknown>;
      if (!VALID_IMPACT_PARTICLES.includes(impact.particle as any))
        errors.push("visual.impact.particle: valeur invalide");
      if (!impact.sound || typeof impact.sound !== "object") {
        errors.push("visual.impact.sound: section manquante");
      } else {
        validateSound(
          impact.sound as Record<string, unknown>,
          "visual.impact.sound",
          errors
        );
      }
    }

    // optional cast_sound
    if (vis.cast_sound && typeof vis.cast_sound === "object") {
      validateSound(
        vis.cast_sound as Record<string, unknown>,
        "visual.cast_sound",
        errors
      );
    }
  }

  return errors;
}
