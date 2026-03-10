import { useCallback, useState, useEffect } from "react";
import type {
  Spell, SpellEffect, CastType, DamageType, StatusType, SummonType,
  TrailParticle, ImpactParticle, SoundKey, ParticlePattern, CustomParticleConfig,
  ParticleLayer, EffectTarget, BlockPlacement, PlaceableBlock, BlockPattern, SpellMode,
  ProjectileShape, PlacementEffect, TargetParticleConfig,
  CastVisualConfig, ProjectileVisualConfig, ImpactAnimationConfig, ImpactAnimationStep,
  SlashVisualConfig, SlashStyle, ParticlePreset, EffectParticleConfig,
} from "../types/spell";
import {
  CAST_TYPES, DAMAGE_TYPES, STATUS_TYPES, TRAIL_PARTICLES,
  IMPACT_PARTICLES, SOUND_KEYS, PARTICLE_PATTERNS, SUMMON_TYPES,
  EFFECT_TYPE_LABELS, EFFECT_TARGETS, PLACEABLE_BLOCKS, BLOCK_PATTERNS,
  PROJECTILE_SHAPES, PLACEMENT_EFFECTS, TARGET_PARTICLE_PATTERNS,
  SLASH_STYLES, PROJECTILE_VISUAL_SHAPES, INTENSITY_CURVES, PRESET_CATEGORIES,
  createDefaultCustomParticle, createDefaultParticleLayer,
  createDefaultBlockPlacement, createDefaultAnimation,
  createDefaultCastVisual, createDefaultProjectileVisual,
  createDefaultImpactAnimation, createDefaultImpactStep,
  createDefaultSlashVisual, createDefaultPreset,
  calculateManaCost,
} from "../types/spell";
import { generateSpellWithAI, checkAIEnabled, listMobs } from "../api/client";
import { AnimationEditor } from "./AnimationEditor";
import type { MobSummary } from "../types/mob";


const MAX_PARTICLE_LAYERS = 6;
const MAX_EFFECTS = 10;

/* ═══════════════════════════════════════════════════════
   Catégories d'effets — regroupement logique
   ═══════════════════════════════════════════════════════ */
const EFFECT_CATEGORIES: { label: string; icon: string; types: SpellEffect["type"][] }[] = [
  {
    label: "Offensif", icon: "⚔️",
    types: ["damage", "aoe_dot", "chain", "meteor", "earthquake", "poison_cloud", "ignite_area", "freeze_area", "explosion"],
  },
  {
    label: "Défensif", icon: "🛡️",
    types: ["shield", "reflect_shield", "heal", "cleanse", "lifedrain", "vampiric_aura"],
  },
  {
    label: "Contrôle", icon: "🎯",
    types: ["knockback", "pull", "blind_flash", "gravity_well", "status", "time_warp"],
  },
  {
    label: "Mouvement", icon: "💨",
    types: ["teleport", "swap", "launch", "speed_boost"],
  },
  {
    label: "Invocation", icon: "✨",
    types: ["summon", "decoy"],
  },
];

/* ═══════════════════════════════════════════════════════
   Section pliable réutilisable
   ═══════════════════════════════════════════════════════ */
function CollapsibleSection({ title, icon, defaultOpen = true, badge, children }: {
  title: string; icon: string; defaultOpen?: boolean; badge?: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`card collapsible-card ${open ? "open" : "closed"}`}>
      <button className="collapsible-header" onClick={() => setOpen(!open)} type="button">
        <span className="collapsible-title">
          <span className="collapsible-icon">{icon}</span>
          <h2>{title}</h2>
          {badge && <span className="collapsible-badge">{badge}</span>}
        </span>
        <span className={`collapsible-chevron ${open ? "open" : ""}`}>▼</span>
      </button>
      {open && <div className="collapsible-body">{children}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Tooltip — aide contextuelle au survol
   ═══════════════════════════════════════════════════════ */
function Tip({ text }: { text: string }) {
  return (
    <span className="tooltip-wrapper">
      <span className="tooltip-icon">?</span>
      <span className="tooltip-popup">{text}</span>
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   TOOLTIPS — textes d'aide
   ═══════════════════════════════════════════════════════ */
const TIPS: Record<string, string> = {
  cast_type: "Projectile = lancé devant toi. Zone = posée au sol. Instantané = effet direct sans projectile.",
  cooldown: "Temps de recharge en secondes avant de pouvoir relancer le sort.",
  mana_cost: "Coût en mana. Le coût suggéré est calculé en fonction des effets.",
  range: "Distance max en blocs. Pour un sort instantané, c'est la portée de ciblage.",
  speed: "Vitesse du projectile (blocs/tick). Plus c'est élevé, plus il va vite.",
  radius: "Rayon de la zone d'effet en blocs.",
  piercing: "Le projectile traverse les entités au lieu de s'arrêter au premier impact.",
  bounce: "Nombre de rebonds du projectile sur les surfaces.",
  homing: "Le projectile traque automatiquement l'ennemi le plus proche.",
  charge: "Maintiens le clic pour charger le sort. Plus longtemps = plus puissant.",
  multi_proj: "Lance plusieurs projectiles à la fois dans un cône de dispersion.",
  gravity: "Gravité appliquée au projectile. 0 = vol droit, >0 = courbe vers le bas.",
  lifetime: "Durée de vie maximum du sort en secondes.",
  cursor_guided: "Le projectile suit la direction du curseur du joueur en temps réel.",
  particle_layer: "Ajoute des couches de particules pour un effet visuel plus riche.",
  pattern: "Le motif définit comment les particules sont disposées (hélice, spirale, aura...).",
  impact: "L'effet visuel et sonore quand le sort touche sa cible.",
  effect_target: "Qui est affecté : la cible touchée, le lanceur, tous dans la zone, etc.",
  block_placement: "Place des blocs temporaires dans le monde quand le sort est lancé.",
};

/* ═══════════════════════════════════════════════════════
   Smart Suggestions — auto-thème basé sur les effets
   ═══════════════════════════════════════════════════════ */
const ELEMENT_THEMES: Record<string, { color: [number, number, number]; particles: string[]; sounds: string[]; patterns: string[] }> = {
  fire:      { color: [255, 80, 0],   particles: ["FLAME", "LAVA", "LARGE_SMOKE"],              sounds: ["ENTITY_BLAZE_SHOOT", "ENTITY_GENERIC_EXPLODE"],    patterns: ["helix", "spiral"] },
  ice:       { color: [100, 200, 255], particles: ["SNOWFLAKE", "CLOUD", "CLOUD"],               sounds: ["BLOCK_AMETHYST_BLOCK_CHIME", "ENTITY_GENERIC_EXPLODE"], patterns: ["spiral", "ring"] },
  lightning: { color: [255, 255, 50],  particles: ["ELECTRIC_SPARK", "FLASH", "END_ROD"],        sounds: ["ENTITY_LIGHTNING_BOLT_THUNDER", "ENTITY_FIREWORK_ROCKET_BLAST"], patterns: ["chain_lightning", "zigzag"] },
  void:      { color: [80, 0, 130],    particles: ["PORTAL", "SMOKE", "WITCH"],                  sounds: ["ENTITY_ENDERMAN_TELEPORT", "BLOCK_END_PORTAL_SPAWN"], patterns: ["black_hole", "implode"] },
  holy:      { color: [255, 215, 0],   particles: ["END_ROD", "TOTEM_OF_UNDYING", "VILLAGER_HAPPY"], sounds: ["BLOCK_AMETHYST_BLOCK_CHIME", "ITEM_TOTEM_USE"], patterns: ["aura_holy", "ring"] },
  magic:     { color: [138, 43, 226],  particles: ["WITCH", "ENCHANT", "ENCHANT"],          sounds: ["ENTITY_EVOKER_PREPARE_ATTACK", "ENTITY_ILLUSIONER_CAST_SPELL"], patterns: ["helix", "vortex"] },
  physical:  { color: [200, 200, 200], particles: ["CRIT", "DAMAGE_INDICATOR", "SWEEP_ATTACK"],  sounds: ["BLOCK_ANVIL_LAND", "ENTITY_GENERIC_EXPLODE"], patterns: ["slash", "stab"] },
  necrotic:  { color: [50, 100, 50],   particles: ["SCULK_SOUL", "SMOKE", "SCULK_SOUL"],        sounds: ["ENTITY_WITHER_AMBIENT", "ENTITY_WITHER_SHOOT"],     patterns: ["aura_dark", "vortex"] },
  heal:      { color: [50, 255, 100],  particles: ["HEART", "VILLAGER_HAPPY", "COMPOSTER"],      sounds: ["BLOCK_AMETHYST_BLOCK_CHIME", "BLOCK_BELL_USE"], patterns: ["aura_holy", "ring"] },
};

function detectSpellElement(spell: Spell): string | null {
  for (const e of spell.effects) {
    if ("damage_type" in e && typeof (e as any).damage_type === "string") return (e as any).damage_type;
    if (e.type === "heal" || e.type === "lifedrain") return "heal";
    if (e.type === "ignite_area") return "fire";
    if (e.type === "freeze_area") return "ice";
    if (e.type === "earthquake") return "physical";
    if (e.type === "gravity_well") return "void";
    if (e.type === "blind_flash") return "lightning";
    if (e.type === "vampiric_aura") return "necrotic";
  }
  return null;
}

/* ═══════════════════════════════════════════════════════
   SpellForm — composant principal
   ═══════════════════════════════════════════════════════ */
interface Props {
  spell: Spell;
  onChange: (spell: Spell) => void;
}

export function SpellForm({ spell, onChange }: Props) {
  const autoCost = calculateManaCost(spell);
  const [customMobs, setCustomMobs] = useState<MobSummary[]>([]);

  useEffect(() => {
    listMobs().then(r => { if (r.ok) setCustomMobs(r.mobs); });
  }, []);
  const mode = spell.mode ?? "classic";
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);
  const [effectCategoryOpen, setEffectCategoryOpen] = useState<string | null>(null);
  const [showQuickStart, setShowQuickStart] = useState(() => spell.meta.name === "Nouveau Sort");

  // ── Vérification IA (correctement via useEffect) ──
  useEffect(() => {
    checkAIEnabled().then(r => setAiEnabled(r.enabled));
  }, []);

  // ── Mode ──
  const setMode = useCallback((m: SpellMode) => {
    const updated: Spell = { ...spell, mode: m };
    if (m === "animation" && !updated.animation) {
      updated.animation = createDefaultAnimation();
    }
    onChange(updated);
  }, [spell, onChange]);

  // ── IA ──
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError(null);
    const result = await generateSpellWithAI(aiPrompt);
    setAiLoading(false);
    if (result.ok && result.spell) {
      onChange({ ...result.spell, meta: { ...result.spell.meta, author: spell.meta.author } });
    } else {
      setAiError(result.error ?? "Erreur inconnue");
    }
  };

  // ── Meta ──
  const updateMeta = useCallback(
    (key: string, value: string) => {
      onChange({ ...spell, meta: { ...spell.meta, [key]: value } });
    },
    [spell, onChange]
  );

  // ── Mécanique ──
  const updateMechanics = useCallback(
    (key: string, value: number | string | boolean) => {
      const newMech = { ...spell.mechanics, [key]: value };
      if (key === "cast_type") {
        if (value !== "projectile") { delete newMech.speed; delete newMech.piercing; delete newMech.bounce_count; delete newMech.gravity; }
        else if (!newMech.speed) newMech.speed = 2;
        if (value !== "area") { delete newMech.radius; delete newMech.area_duration; delete newMech.area_pulses; }
        else { if (!newMech.radius) newMech.radius = 5; }
      }
      onChange({ ...spell, mechanics: newMech });
    },
    [spell, onChange]
  );

  // ── Effets ──
  const updateEffect = useCallback(
    (index: number, effect: SpellEffect) => {
      const newEffects = [...spell.effects];
      newEffects[index] = effect;
      onChange({ ...spell, effects: newEffects });
    },
    [spell, onChange]
  );

  const addEffect = useCallback(
    (type: SpellEffect["type"]) => {
      if (spell.effects.length >= MAX_EFFECTS) return;
      const newEffect = createDefaultEffect(type);
      if (!newEffect) return;
      onChange({ ...spell, effects: [...spell.effects, newEffect] });
    },
    [spell, onChange]
  );

  const removeEffect = useCallback(
    (index: number) => {
      onChange({ ...spell, effects: spell.effects.filter((_, i) => i !== index) });
    },
    [spell, onChange]
  );

  // ── Couleur visuelle ──
  const updateVisualColor = useCallback(
    (index: number, value: number) => {
      const newColor = [...spell.visual.color] as [number, number, number];
      newColor[index] = Math.max(0, Math.min(255, value));
      onChange({ ...spell, visual: { ...spell.visual, color: newColor } });
    },
    [spell, onChange]
  );

  const hexToRgb = (hex: string): [number, number, number] => {
    const n = parseInt(hex.replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };

  const rgbToHex = (r: number, g: number, b: number) =>
    `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;

  // ── Couches de particules ──
  const layers = spell.visual.particle_layers ?? [];

  const updateLayer = useCallback(
    (index: number, key: string, value: string | number) => {
      const newLayers = [...layers];
      newLayers[index] = { ...newLayers[index], [key]: value };
      onChange({ ...spell, visual: { ...spell.visual, particle_layers: newLayers } });
    },
    [spell, layers, onChange]
  );

  const addLayer = useCallback(() => {
    if (layers.length >= MAX_PARTICLE_LAYERS) return;
    const newLayers = [...layers, createDefaultParticleLayer(`Couche ${layers.length + 1}`)];
    onChange({ ...spell, visual: { ...spell.visual, particle_layers: newLayers } });
  }, [spell, layers, onChange]);

  const removeLayer = useCallback((index: number) => {
    if (layers.length <= 1) return;
    const newLayers = layers.filter((_, i) => i !== index);
    onChange({ ...spell, visual: { ...spell.visual, particle_layers: newLayers } });
  }, [spell, layers, onChange]);

  const toggleLayerCustom = useCallback(
    (index: number, enabled: boolean) => {
      const newLayers = [...layers];
      const existing = newLayers[index].custom;
      newLayers[index] = {
        ...newLayers[index],
        custom: existing ? { ...existing, enabled } : { ...createDefaultCustomParticle(), enabled },
      };
      onChange({ ...spell, visual: { ...spell.visual, particle_layers: newLayers } });
    },
    [spell, layers, onChange]
  );

  const updateLayerCustom = useCallback(
    (index: number, key: string, value: number | string | boolean | [number, number, number]) => {
      const newLayers = [...layers];
      const current = newLayers[index].custom ?? createDefaultCustomParticle();
      newLayers[index] = { ...newLayers[index], custom: { ...current, [key]: value } as CustomParticleConfig };
      onChange({ ...spell, visual: { ...spell.visual, particle_layers: newLayers } });
    },
    [spell, layers, onChange]
  );

  // ── Impact ──
  const updateImpact = useCallback(
    (key: string, value: string) => {
      onChange({ ...spell, visual: { ...spell.visual, impact: { ...spell.visual.impact, [key]: value } } });
    },
    [spell, onChange]
  );

  const updateImpactSound = useCallback(
    (key: string, value: string | number) => {
      onChange({
        ...spell,
        visual: { ...spell.visual, impact: { ...spell.visual.impact, sound: { ...spell.visual.impact.sound, [key]: value } } },
      });
    },
    [spell, onChange]
  );

  // ── Son de lancement ──
  const toggleCastSound = useCallback(
    (enabled: boolean) => {
      if (enabled) {
        onChange({
          ...spell,
          visual: { ...spell.visual, cast_sound: { key: "ENTITY_EVOKER_PREPARE_ATTACK", volume: 1.0, pitch: 1.0 } },
        });
      } else {
        const { cast_sound, ...rest } = spell.visual;
        onChange({ ...spell, visual: rest as typeof spell.visual });
      }
    },
    [spell, onChange]
  );

  const updateCastSound = useCallback(
    (key: string, value: string | number) => {
      if (!spell.visual.cast_sound) return;
      onChange({ ...spell, visual: { ...spell.visual, cast_sound: { ...spell.visual.cast_sound, [key]: value } } });
    },
    [spell, onChange]
  );

  /* ═══════════════════════════════════════════════════════
     Rendu d'une couche de particules
     ═══════════════════════════════════════════════════════ */
  function renderParticleLayer(layer: ParticleLayer, index: number) {
    const cp = layer.custom;
    return (
      <div className="particle-layer" key={layer.id}>
        <div className="particle-layer-header">
          <input type="text" className="layer-name-input" value={layer.name}
            onChange={(e) => updateLayer(index, "name", e.target.value)}
            placeholder="Nom de la couche" />
          {layers.length > 1 && (
            <button className="btn btn-danger btn-sm" onClick={() => removeLayer(index)} title="Supprimer cette couche">✕</button>
          )}
        </div>
        <div className="form-row-3">
          <div className="form-group">
            <label>Particule</label>
            <select value={layer.particle}
              onChange={(e) => updateLayer(index, "particle", e.target.value as TrailParticle)}>
              {TRAIL_PARTICLES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Quantité</label>
            <input type="number" min={1} max={50} value={layer.count}
              onChange={(e) => updateLayer(index, "count", parseInt(e.target.value) || 1)} />
          </div>
          <div className="form-group">
            <label>Fréquence</label>
            <input type="number" min={1} max={20} value={layer.frequency}
              onChange={(e) => updateLayer(index, "frequency", parseInt(e.target.value) || 1)} />
          </div>
        </div>

        {/* Personnalisation avancée */}
        <div className="particle-designer-toggle">
          <label className="checkbox-label">
            <input type="checkbox" checked={cp?.enabled ?? false}
              onChange={(e) => toggleLayerCustom(index, e.target.checked)} />
            ✨ Personnalisation avancée
          </label>
        </div>

        {cp?.enabled && (
          <div className="particle-designer">
            <div className="form-row">
              <div className="form-group">
                <label>Taille min ({cp.size_min.toFixed(1)})</label>
                <input type="range" min={0.1} max={5} step={0.1} value={cp.size_min}
                  onChange={(e) => updateLayerCustom(index, "size_min", parseFloat(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Taille max ({cp.size_max.toFixed(1)})</label>
                <input type="range" min={0.1} max={5} step={0.1} value={cp.size_max}
                  onChange={(e) => updateLayerCustom(index, "size_max", parseFloat(e.target.value))} />
              </div>
            </div>
            <div className="form-row-3">
              <div className="form-group">
                <label>Vitesse ({cp.speed.toFixed(1)})</label>
                <input type="range" min={0} max={5} step={0.1} value={cp.speed}
                  onChange={(e) => updateLayerCustom(index, "speed", parseFloat(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Gravité ({cp.gravity.toFixed(1)})</label>
                <input type="range" min={-3} max={3} step={0.1} value={cp.gravity}
                  onChange={(e) => updateLayerCustom(index, "gravity", parseFloat(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Dispersion ({cp.spread.toFixed(1)})</label>
                <input type="range" min={0} max={5} step={0.1} value={cp.spread}
                  onChange={(e) => updateLayerCustom(index, "spread", parseFloat(e.target.value))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Durée ({cp.lifetime.toFixed(1)}s)</label>
                <input type="range" min={0.1} max={5} step={0.1} value={cp.lifetime}
                  onChange={(e) => updateLayerCustom(index, "lifetime", parseFloat(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Densité ({cp.density})</label>
                <input type="range" min={1} max={30} step={1} value={cp.density}
                  onChange={(e) => updateLayerCustom(index, "density", parseInt(e.target.value))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Couleur début</label>
                <input type="color"
                  value={rgbToHex(cp.color_start[0], cp.color_start[1], cp.color_start[2])}
                  onChange={(e) => updateLayerCustom(index, "color_start", hexToRgb(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Couleur fin</label>
                <input type="color"
                  value={rgbToHex(cp.color_end[0], cp.color_end[1], cp.color_end[2])}
                  onChange={(e) => updateLayerCustom(index, "color_end", hexToRgb(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Motif</label>
                <select value={cp.pattern}
                  onChange={(e) => updateLayerCustom(index, "pattern", e.target.value as ParticlePattern)}>
                  {PARTICLE_PATTERNS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <div className="particle-color-preview">
              <div className="color-gradient"
                style={{ background: `linear-gradient(90deg, rgb(${cp.color_start.join(",")}), rgb(${cp.color_end.join(",")}))` }} />
              <span className="color-gradient-label">Dégradé de couleur</span>
              {layer.particle !== "DUST" && layer.particle !== "DUST_COLOR_TRANSITION" && (
                <span className="label-hint" style={{ display: 'block', marginTop: 4, color: 'var(--accent)' }}>
                  ℹ️ Le dégradé de couleur ne fonctionne qu'avec les particules DUST et DUST_COLOR_TRANSITION.
                  Les autres particules utiliseront leur apparence native avec les motifs configurés.
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     Rendu principal
     ═══════════════════════════════════════════════════════ */
  return (
    <>
      {/* ═══════════ IA GÉNÉRATION ═══════════ */}
      {aiEnabled && (
        <div className="card ai-card">
          <h2>🤖 Génération par IA</h2>
          <p className="ai-desc">Décris ton sort en quelques mots, et l'IA le créera pour toi automatiquement.</p>
          <div className="ai-prompt-row">
            <textarea className="ai-prompt-input" placeholder="Ex: Un sort de feu qui lance une boule enflammée qui rebondit 2 fois et inflige des brûlures aux ennemis proches..."
              value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} rows={2} />
            <button className="btn btn-accent" onClick={handleAIGenerate} disabled={aiLoading || !aiPrompt.trim()}>
              {aiLoading ? "⏳ Génération..." : "✨ Générer"}
            </button>
          </div>
          {aiError && <p className="ai-error">{aiError}</p>}
        </div>
      )}

      {/* ═══════════ QUICK START WIZARD ═══════════ */}
      {showQuickStart && (
        <div className="card quick-start-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>🚀 Démarrage Rapide</h2>
            <button className="btn btn-sm" onClick={() => setShowQuickStart(false)} title="Fermer" style={{ background: "transparent", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "var(--text-secondary)" }}>✕</button>
          </div>
          <p style={{ color: "var(--text-secondary)", marginBottom: 12 }}>Choisis un archétype pour pré-configurer ton sort rapidement :</p>
          <div className="quick-start-grid">
            {[
              { icon: "🔥", name: "Boule de Feu", desc: "Projectile enflammé avec dégâts et brûlure", apply: () => {
                onChange({ ...spell, mechanics: { ...spell.mechanics, cast_type: "projectile", speed: 2.5, range: 20, mana_cost: 25, cooldown: 4 },
                  effects: [{ type: "damage" as const, amount: 8, damage_type: "fire" as const }, { type: "status" as const, status: "burn" as const, duration: 3, amplifier: 1 }],
                  visual: { ...spell.visual, color: [255, 100, 0], particle_layers: [{ ...(spell.visual.particle_layers?.[0] || createDefaultParticleLayer()), particle: "FLAME" as TrailParticle, count: 8 }],
                    impact: { particle: "LAVA" as ImpactParticle, sound: { key: "ENTITY_BLAZE_SHOOT" as SoundKey, volume: 1, pitch: 0.8 } } } });
              }},
              { icon: "❄️", name: "Rayon de Givre", desc: "Projectile glacé qui ralentit les ennemis", apply: () => {
                onChange({ ...spell, mechanics: { ...spell.mechanics, cast_type: "projectile", speed: 3, range: 18, mana_cost: 20, cooldown: 3 },
                  effects: [{ type: "damage" as const, amount: 5, damage_type: "ice" as const }, { type: "status" as const, status: "freeze" as const, duration: 4, amplifier: 1 }],
                  visual: { ...spell.visual, color: [100, 200, 255], particle_layers: [{ ...(spell.visual.particle_layers?.[0] || createDefaultParticleLayer()), particle: "SNOWFLAKE" as TrailParticle, count: 6 }],
                    impact: { particle: "CLOUD" as ImpactParticle, sound: { key: "BLOCK_AMETHYST_BLOCK_CHIME" as SoundKey, volume: 1, pitch: 1.5 } } } });
              }},
              { icon: "💚", name: "Sort de Soin", desc: "Soin instantané avec aura lumineuse", apply: () => {
                onChange({ ...spell, mechanics: { ...spell.mechanics, cast_type: "instant", range: 0, mana_cost: 30, cooldown: 8 },
                  effects: [{ type: "heal" as const, amount: 10 }, { type: "status" as const, status: "regeneration" as const, duration: 5, amplifier: 1 }],
                  visual: { ...spell.visual, color: [50, 255, 100], particle_layers: [{ ...(spell.visual.particle_layers?.[0] || createDefaultParticleLayer()), particle: "HEART" as TrailParticle, count: 10 }],
                    impact: { particle: "VILLAGER_HAPPY" as ImpactParticle, sound: { key: "BLOCK_AMETHYST_BLOCK_CHIME" as SoundKey, volume: 1, pitch: 1.2 } } } });
              }},
              { icon: "⚡", name: "Foudre en Chaîne", desc: "Éclair qui rebondit entre les ennemis", apply: () => {
                onChange({ ...spell, mechanics: { ...spell.mechanics, cast_type: "projectile", speed: 5, range: 25, mana_cost: 35, cooldown: 6 },
                  effects: [{ type: "chain" as const, amount: 6, damage_type: "lightning" as const, max_targets: 4, chain_range: 8 }],
                  visual: { ...spell.visual, color: [255, 255, 50], particle_layers: [{ ...(spell.visual.particle_layers?.[0] || createDefaultParticleLayer()), particle: "ELECTRIC_SPARK" as TrailParticle, count: 12 }],
                    impact: { particle: "FLASH" as ImpactParticle, sound: { key: "ENTITY_LIGHTNING_BOLT_THUNDER" as SoundKey, volume: 1, pitch: 1.0 } } } });
              }},
              { icon: "🌑", name: "Zone d'Ombre", desc: "Zone AoE de dégâts continus (void)", apply: () => {
                onChange({ ...spell, mechanics: { ...spell.mechanics, cast_type: "area", range: 12, radius: 5, area_duration: 8, area_pulses: 4, mana_cost: 40, cooldown: 10 },
                  effects: [{ type: "aoe_dot" as const, amount: 3, duration: 8, tick_rate: 1, damage_type: "void" as const }, { type: "status" as const, status: "blindness" as const, duration: 3, amplifier: 0 }],
                  visual: { ...spell.visual, color: [80, 0, 120], particle_layers: [{ ...(spell.visual.particle_layers?.[0] || createDefaultParticleLayer()), particle: "SMOKE" as TrailParticle, count: 15 }],
                    impact: { particle: "PORTAL" as ImpactParticle, sound: { key: "ENTITY_ENDERMAN_TELEPORT" as SoundKey, volume: 1, pitch: 0.5 } } } });
              }},
              { icon: "🛡️", name: "Bouclier Sacré", desc: "Protection + régénération sur soi", apply: () => {
                onChange({ ...spell, mechanics: { ...spell.mechanics, cast_type: "instant", range: 0, mana_cost: 25, cooldown: 12 },
                  effects: [{ type: "shield" as const, amount: 8, duration: 10 }, { type: "status" as const, status: "absorption" as const, duration: 10, amplifier: 1 }],
                  visual: { ...spell.visual, color: [255, 215, 0], particle_layers: [{ ...(spell.visual.particle_layers?.[0] || createDefaultParticleLayer()), particle: "END_ROD" as TrailParticle, count: 10 }],
                    impact: { particle: "TOTEM_OF_UNDYING" as ImpactParticle, sound: { key: "ITEM_TOTEM_USE" as SoundKey, volume: 0.8, pitch: 1.2 } } } });
              }},
              { icon: "👻", name: "Invocation", desc: "Invoque des alliés pour combattre", apply: () => {
                onChange({ ...spell, mechanics: { ...spell.mechanics, cast_type: "instant", range: 5, mana_cost: 50, cooldown: 20 },
                  effects: [{ type: "summon" as const, entity_type: "wolf" as const, count: 3, duration: 30 }],
                  visual: { ...spell.visual, color: [180, 100, 255], particle_layers: [{ ...(spell.visual.particle_layers?.[0] || createDefaultParticleLayer()), particle: "WITCH" as TrailParticle, count: 10 }],
                    impact: { particle: "CLOUD" as ImpactParticle, sound: { key: "ENTITY_EVOKER_PREPARE_ATTACK" as SoundKey, volume: 1, pitch: 1 } } } });
              }},
              { icon: "💫", name: "Téléportation", desc: "Se téléporte dans la direction visée", apply: () => {
                onChange({ ...spell, mechanics: { ...spell.mechanics, cast_type: "instant", range: 20, mana_cost: 15, cooldown: 5 },
                  effects: [{ type: "teleport" as const, distance: 15 }],
                  visual: { ...spell.visual, color: [0, 255, 200], particle_layers: [{ ...(spell.visual.particle_layers?.[0] || createDefaultParticleLayer()), particle: "PORTAL" as TrailParticle, count: 20 }],
                    impact: { particle: "REVERSE_PORTAL" as ImpactParticle, sound: { key: "ENTITY_ENDERMAN_TELEPORT" as SoundKey, volume: 1, pitch: 1.2 } } } });
              }},
            ].map((arch) => (
              <button key={arch.name} className="quick-start-btn" onClick={() => { arch.apply(); setShowQuickStart(false); }}>
                <span className="qs-icon">{arch.icon}</span>
                <span className="qs-info">
                  <strong>{arch.name}</strong>
                  <small>{arch.desc}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════ RÉSUMÉ DU SORT ═══════════ */}
      {spell.meta.name !== "Nouveau Sort" && (
        <div className="spell-summary-bar">
          <div className="summary-stat">
            {spell.mechanics.cast_type === "projectile" ? "🎯" : spell.mechanics.cast_type === "area" ? "🌀" : "⚡"}
            <strong>{CAST_TYPES.find(t => t.value === spell.mechanics.cast_type)?.label ?? spell.mechanics.cast_type}</strong>
          </div>
          <div className="summary-stat">💰 <strong>{autoCost}</strong> mana</div>
          <div className="summary-stat">⏱️ <strong>{spell.mechanics.cooldown}s</strong> cd</div>
          <div className="summary-stat">📏 <strong>{spell.mechanics.range}</strong> blocs</div>
          {spell.effects.length > 0 && (
            <div className="summary-stat">
              {spell.effects.map((e, i) => {
                const info = EFFECT_TYPE_LABELS[e.type];
                return <span key={i} className="summary-chip" title={info.label}><span className="chip-icon">{info.icon}</span>{info.label}</span>;
              })}
            </div>
          )}
          {spell.mechanics.homing && <div className="summary-stat">🎯 <strong>Homing</strong></div>}
          {spell.mechanics.piercing && <div className="summary-stat">🔱 <strong>Perforant</strong></div>}
          {(spell.mechanics.charge_time ?? 0) > 0 && <div className="summary-stat">⏱️ <strong>{spell.mechanics.charge_time}s</strong> charge</div>}
        </div>
      )}

      {/* ═══════════ MODE SORT ═══════════ */}
      <div className="card mode-card">
        <h2>Mode du Sort</h2>
        <div className="mode-selector">
          <button className={`mode-btn ${mode === "classic" ? "active" : ""}`} onClick={() => setMode("classic")}>
            <span className="mode-btn-icon">⚡</span>
            <span className="mode-btn-info">
              <strong>Classique</strong>
              <small>Projectile, zone ou instant avec effets immédiats</small>
            </span>
          </button>
          <button className={`mode-btn ${mode === "animation" ? "active" : ""}`} onClick={() => setMode("animation")}>
            <span className="mode-btn-icon">🎬</span>
            <span className="mode-btn-info">
              <strong>Animation</strong>
              <small>Timeline avec particules, effets et sons séquencés</small>
            </span>
          </button>
        </div>
      </div>

      {/* ═══════════ INFORMATIONS ═══════════ */}
      <CollapsibleSection title="Informations" icon="📝" defaultOpen={true}>
        <div className="form-group">
          <label>Nom du sort</label>
          <input type="text" value={spell.meta.name}
            onChange={(e) => updateMeta("name", e.target.value)}
            placeholder="Ex: Boule de Feu Infernale" />
        </div>
        <div className="form-group">
          <label>Description <span className="label-hint">(optionnel)</span></label>
          <input type="text" value={spell.meta.description ?? ""}
            onChange={(e) => updateMeta("description", e.target.value)}
            placeholder="Ex: Un sort dévastateur de feu..." />
        </div>
      </CollapsibleSection>

      {/* ═══════════ MÉCANIQUE ═══════════ */}
      <CollapsibleSection title="Mécanique" icon="⚙️" defaultOpen={true} badge={`${autoCost} ⚡`}>
        {/* Coût calculé automatiquement */}
        <div className="auto-cost-display">
          <span className="auto-cost-label">Coût en Schnewrie (calculé automatiquement)</span>
          <span className="auto-cost-value">{autoCost} ⚡</span>
        </div>

        <div className="form-group">
          <label>Type de lancer <Tip text={TIPS.cast_type} /></label>
          <div className="cast-type-selector">
            {CAST_TYPES.map((t) => (
              <button key={t.value}
                className={`cast-type-btn ${spell.mechanics.cast_type === t.value ? "active" : ""}`}
                onClick={() => updateMechanics("cast_type", t.value as CastType)}
                title={t.value === "instant" ? "Effet instantané devant le lanceur" : t.value === "projectile" ? "Lance un projectile dirigé" : "Zone d'effet autour de la cible"}>
                {t.value === "instant" ? "⚡" : t.value === "projectile" ? "🎯" : "🌀"} {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Cooldown <span className="label-hint">(max 60s)</span> <Tip text={TIPS.cooldown} /></label>
            <input type="number" min={0.5} max={60} step={0.5} value={spell.mechanics.cooldown}
              onChange={(e) => updateMechanics("cooldown", Math.min(60, parseFloat(e.target.value) || 0.5))} />
          </div>
          <div className="form-group">
            <label>Portée <span className="label-hint">(max 50 blocs)</span> <Tip text={TIPS.range} /></label>
            <input type="number" min={1} max={50} step={1} value={spell.mechanics.range}
              onChange={(e) => updateMechanics("range", Math.min(50, parseFloat(e.target.value) || 1))} />
          </div>
        </div>

        {/* Projectile options */}
        {spell.mechanics.cast_type === "projectile" && (
          <div className="mechanic-sub-section">
            <div className="sub-section-label">🎯 Options projectile</div>
            <div className="form-row">
              <div className="form-group">
                <label>Vitesse <span className="label-hint">(max 5)</span> <Tip text={TIPS.speed} /></label>
                <input type="number" min={0.5} max={5} step={0.1} value={spell.mechanics.speed ?? 2}
                  onChange={(e) => updateMechanics("speed", Math.min(5, parseFloat(e.target.value) || 0.5))} />
              </div>
              <div className="form-group">
                <label>Gravité <span className="label-hint">(-1 à 1)</span> <Tip text={TIPS.gravity} /></label>
                <input type="number" min={-1} max={1} step={0.05} value={spell.mechanics.gravity ?? 0}
                  onChange={(e) => updateMechanics("gravity", Math.max(-1, Math.min(1, parseFloat(e.target.value) || 0)))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={spell.mechanics.piercing ?? false}
                    onChange={(e) => updateMechanics("piercing", e.target.checked)} />
                  Perforant <Tip text={TIPS.piercing} />
                </label>
              </div>
              <div className="form-group">
                <label>Rebonds <span className="label-hint">(max 5)</span> <Tip text={TIPS.bounce} /></label>
                <input type="number" min={0} max={5} step={1} value={spell.mechanics.bounce_count ?? 0}
                  onChange={(e) => updateMechanics("bounce_count", Math.min(5, parseInt(e.target.value) || 0))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={spell.mechanics.homing ?? false}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      onChange({ ...spell, mechanics: { ...spell.mechanics, homing: checked, ...(checked ? { cursor_guided: false } : {}) } });
                    }} />
                  🎯 Tête chercheuse <Tip text={TIPS.homing} />
                </label>
              </div>
              {spell.mechanics.homing && (
                <div className="form-group">
                  <label>Force tracking ({(spell.mechanics.homing_strength ?? 0.5).toFixed(1)})</label>
                  <input type="range" min={0.1} max={2.0} step={0.1} value={spell.mechanics.homing_strength ?? 0.5}
                    onChange={(e) => updateMechanics("homing_strength", parseFloat(e.target.value))} />
                </div>
              )}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={spell.mechanics.cursor_guided ?? false}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      onChange({ ...spell, mechanics: { ...spell.mechanics, cursor_guided: checked, ...(checked ? { homing: false } : {}) } });
                    }} />
                  🕹️ Guidé par le curseur <Tip text={TIPS.cursor_guided} />
                </label>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Forme du tir</label>
                <select value={spell.mechanics.projectile_shape ?? "single"}
                  onChange={(e) => updateMechanics("projectile_shape", e.target.value as ProjectileShape)}>
                  {PROJECTILE_SHAPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Nb. projectiles <span className="label-hint">(max 10)</span> <Tip text={TIPS.multi_proj} /></label>
                <input type="number" min={1} max={10} step={1} value={spell.mechanics.multi_projectile_count ?? 1}
                  onChange={(e) => updateMechanics("multi_projectile_count", Math.min(10, parseInt(e.target.value) || 1))} />
              </div>
            </div>
            {(spell.mechanics.multi_projectile_count ?? 1) > 1 && (
              <div className="form-group">
                <label>Angle de dispersion ({spell.mechanics.multi_projectile_spread ?? 15}°)</label>
                <input type="range" min={5} max={90} step={5} value={spell.mechanics.multi_projectile_spread ?? 15}
                  onChange={(e) => updateMechanics("multi_projectile_spread", parseInt(e.target.value))} />
              </div>
            )}
          </div>
        )}

        {/* Area options */}
        {spell.mechanics.cast_type === "area" && (
          <div className="mechanic-sub-section">
            <div className="sub-section-label">🌀 Options zone</div>
            <div className="form-row-3">
              <div className="form-group">
                <label>Rayon <span className="label-hint">(max 15)</span></label>
                <input type="number" min={0.5} max={15} step={0.5} value={spell.mechanics.radius ?? 5}
                  onChange={(e) => updateMechanics("radius", Math.min(15, parseFloat(e.target.value) || 0.5))} />
              </div>
              <div className="form-group">
                <label>Durée zone <span className="label-hint">(max 30s)</span></label>
                <input type="number" min={0} max={30} step={0.5} value={spell.mechanics.area_duration ?? 0}
                  onChange={(e) => updateMechanics("area_duration", Math.min(30, parseFloat(e.target.value) || 0))} />
              </div>
              <div className="form-group">
                <label>Pulses <span className="label-hint">(max 10)</span></label>
                <input type="number" min={1} max={10} step={1} value={spell.mechanics.area_pulses ?? 1}
                  onChange={(e) => updateMechanics("area_pulses", Math.min(10, parseInt(e.target.value) || 1))} />
              </div>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input type="checkbox" checked={spell.mechanics.area_follow_caster ?? false}
                  onChange={(e) => updateMechanics("area_follow_caster", e.target.checked)} />
                🚶 Zone suit le lanceur
              </label>
            </div>
          </div>
        )}

        {/* Charge time */}
        <div className="form-group" style={{ marginTop: 8 }}>
          <label>⏱️ Temps de charge ({(spell.mechanics.charge_time ?? 0).toFixed(1)}s) <Tip text={TIPS.charge} /></label>
          <input type="range" min={0} max={5} step={0.5} value={spell.mechanics.charge_time ?? 0}
            onChange={(e) => updateMechanics("charge_time", parseFloat(e.target.value))} />
        </div>
      </CollapsibleSection>

      {/* ═══════════ EFFETS (mode classique) ═══════════ */}
      {mode === "classic" && (
      <CollapsibleSection title="Effets" icon="⚔️" defaultOpen={true} badge={`${spell.effects.length}/${MAX_EFFECTS}`}>
        {/* Ciblage global */}
        <div className="form-group">
          <label>Cible des effets <Tip text={TIPS.effect_target} /></label>
          <select value={spell.effect_target ?? "target"}
            onChange={(e) => onChange({ ...spell, effect_target: e.target.value as EffectTarget })}>
            {EFFECT_TARGETS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Effets actuels */}
        {spell.effects.map((effect, index) => {
          const info = EFFECT_TYPE_LABELS[effect.type];
          return (
            <div className="effect-item" key={index}>
              <div className="effect-header">
                <span className="effect-type-badge" style={{ backgroundColor: info.color + "22", color: info.color, borderColor: info.color + "44" }}>
                  {info.icon} {info.label}
                </span>
                <button className="btn btn-danger btn-sm" onClick={() => removeEffect(index)} title="Supprimer cet effet">✕</button>
              </div>
              {renderEffectFields(effect, index, updateEffect, customMobs)}
            </div>
          );
        })}

        {/* Ajouter un effet — par catégorie */}
        {spell.effects.length < MAX_EFFECTS && (
          <div className="effect-add-section">
            <span className="effect-add-title">Ajouter un effet :</span>
            <div className="effect-categories">
              {EFFECT_CATEGORIES.map((cat) => (
                <div className="effect-category" key={cat.label}>
                  <button
                    className={`effect-category-btn ${effectCategoryOpen === cat.label ? "open" : ""}`}
                    onClick={() => setEffectCategoryOpen(effectCategoryOpen === cat.label ? null : cat.label)}
                    type="button"
                  >
                    {cat.icon} {cat.label}
                    <span className="effect-category-count">{cat.types.length}</span>
                  </button>
                  {effectCategoryOpen === cat.label && (
                    <div className="effect-category-items">
                      {cat.types.map((type) => {
                        const info = EFFECT_TYPE_LABELS[type];
                        if (!info) return null;
                        return (
                          <button key={type} className="btn btn-outline btn-sm effect-add-btn"
                            style={{ borderColor: info.color + "66", color: info.color }}
                            onClick={() => { addEffect(type); setEffectCategoryOpen(null); }}>
                            {info.icon} {info.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CollapsibleSection>
      )}

      {/* ═══════════ EFFETS SUR SOI (mode classique) ═══════════ */}
      {mode === "classic" && (
      <CollapsibleSection title="Effets sur le lanceur" icon="🧙" defaultOpen={false}>
        <p className="card-description">Effets appliqués à vous-même lors du lancement du sort.</p>
        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={!!(spell.self_effects && spell.self_effects.length > 0)}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange({ ...spell, self_effects: [{ type: "shield", amount: 4, duration: 5 }] });
                } else {
                  onChange({ ...spell, self_effects: undefined });
                }
              }} />
            Activer les effets sur soi
          </label>
        </div>
        {spell.self_effects && spell.self_effects.length > 0 && (
          <>
            {spell.self_effects.map((effect, index) => {
              const info = EFFECT_TYPE_LABELS[effect.type];
              return (
                <div className="effect-item" key={`self-${index}`}>
                  <div className="effect-header">
                    <span className="effect-type-badge" style={{ backgroundColor: info.color + "22", color: info.color, borderColor: info.color + "44" }}>
                      {info.icon} {info.label} (sur soi)
                    </span>
                    <button className="btn btn-danger btn-sm" onClick={() => {
                      const newSelf = spell.self_effects!.filter((_, i) => i !== index);
                      onChange({ ...spell, self_effects: newSelf.length > 0 ? newSelf : undefined });
                    }}>✕</button>
                  </div>
                  {renderEffectFields(effect, index, (i, eff) => {
                    const newSelf = [...(spell.self_effects ?? [])];
                    newSelf[i] = eff;
                    onChange({ ...spell, self_effects: newSelf });
                  }, customMobs)}
                </div>
              );
            })}
            {spell.self_effects.length < 4 && (
              <div className="effect-add-buttons" style={{ marginTop: 8 }}>
                {(["shield", "speed_boost", "heal", "status", "cleanse"] as SpellEffect["type"][]).map((type) => {
                  const info = EFFECT_TYPE_LABELS[type];
                  return (
                    <button key={type} className="btn btn-outline btn-sm effect-add-btn"
                      style={{ borderColor: info.color + "66", color: info.color }}
                      onClick={() => {
                        const newEffect = createDefaultEffect(type);
                        if (!newEffect) return;
                        if (type === "status") (newEffect as any).status = "regeneration";
                        onChange({ ...spell, self_effects: [...(spell.self_effects ?? []), newEffect] });
                      }}>
                      {info.icon} {info.label}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CollapsibleSection>
      )}

      {/* ═══════════ EFFETS À L'IMPACT (on_hit_effects) ═══════════ */}
      {mode === "classic" && (
      <CollapsibleSection title="Effets à l'impact" icon="💥" defaultOpen={false}>
        <p className="card-description">Effets supplémentaires déclenchés quand le sort touche une cible.</p>
        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={!!(spell.on_hit_effects && spell.on_hit_effects.length > 0)}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange({ ...spell, on_hit_effects: [{ type: "knockback", strength: 1.5 }] });
                } else {
                  onChange({ ...spell, on_hit_effects: undefined });
                }
              }} />
            Activer les effets à l'impact
          </label>
        </div>
        {spell.on_hit_effects && spell.on_hit_effects.length > 0 && (
          <>
            {spell.on_hit_effects.map((effect, index) => {
              const info = EFFECT_TYPE_LABELS[effect.type];
              return (
                <div className="effect-item" key={`onhit-${index}`}>
                  <div className="effect-header">
                    <span className="effect-type-badge" style={{ backgroundColor: info.color + "22", color: info.color, borderColor: info.color + "44" }}>
                      {info.icon} {info.label} (impact)
                    </span>
                    <button className="btn btn-danger btn-sm" onClick={() => {
                      const newHit = spell.on_hit_effects!.filter((_, i) => i !== index);
                      onChange({ ...spell, on_hit_effects: newHit.length > 0 ? newHit : undefined });
                    }}>✕</button>
                  </div>
                  {renderEffectFields(effect, index, (i, eff) => {
                    const newHit = [...(spell.on_hit_effects ?? [])];
                    newHit[i] = eff;
                    onChange({ ...spell, on_hit_effects: newHit });
                  }, customMobs)}
                </div>
              );
            })}
            {spell.on_hit_effects.length < 4 && (
              <div className="effect-add-buttons" style={{ marginTop: 8 }}>
                {(["damage", "knockback", "status", "ignite_area", "freeze_area", "explosion"] as SpellEffect["type"][]).map((type) => {
                  const info = EFFECT_TYPE_LABELS[type];
                  return (
                    <button key={type} className="btn btn-outline btn-sm effect-add-btn"
                      style={{ borderColor: info.color + "66", color: info.color }}
                      onClick={() => {
                        const newEffect = createDefaultEffect(type);
                        if (!newEffect) return;
                        onChange({ ...spell, on_hit_effects: [...(spell.on_hit_effects ?? []), newEffect] });
                      }}>
                      {info.icon} {info.label}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CollapsibleSection>
      )}

      {/* ═══════════ ANIMATION (mode animation) ═══════════ */}
      {mode === "animation" && spell.animation && (
        <AnimationEditor spell={spell} onChange={onChange} />
      )}

      {/* ═══════════ PLACEMENT DE BLOCS ═══════════ */}
      <CollapsibleSection title="Placement de Blocs" icon="🧱" defaultOpen={false}>
        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={!!spell.block_placement}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange({ ...spell, block_placement: createDefaultBlockPlacement() });
                } else {
                  const { block_placement, ...rest } = spell;
                  onChange(rest as Spell);
                }
              }} />
            Activer le placement de blocs
          </label>
        </div>
        {spell.block_placement && (() => {
          const bp = spell.block_placement!;
          const updateBP = (patch: Partial<BlockPlacement>) => onChange({ ...spell, block_placement: { ...bp, ...patch } });
          const selectedPattern = BLOCK_PATTERNS.find((p) => p.value === bp.pattern);
          // Group blocks by category
          const blockCategories = PLACEABLE_BLOCKS.reduce<Record<string, typeof PLACEABLE_BLOCKS>>((acc, b) => {
            if (!acc[b.category]) acc[b.category] = [];
            acc[b.category].push(b);
            return acc;
          }, {});
          return (
            <>
              {/* Block selector with optgroups */}
              <div className="form-row">
                <div className="form-group">
                  <label>Bloc</label>
                  <select value={bp.block} onChange={(e) => updateBP({ block: e.target.value as PlaceableBlock })}>
                    {Object.entries(blockCategories).map(([cat, blocks]) => (
                      <optgroup key={cat} label={cat}>
                        {blocks.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Motif</label>
                  <select value={bp.pattern} onChange={(e) => {
                    const newPattern = e.target.value as BlockPattern;
                    const patternInfo = BLOCK_PATTERNS.find((p) => p.value === newPattern);
                    const patch: Partial<BlockPlacement> = { pattern: newPattern };
                    // Auto-set filled default based on pattern
                    if (patternInfo?.supportsFilled) {
                      patch.filled = newPattern !== 'cage'; // cage defaults to hollow
                    }
                    updateBP(patch);
                  }}>
                    {BLOCK_PATTERNS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                  {selectedPattern && <span className="label-hint">{selectedPattern.desc}</span>}
                </div>
              </div>
              <div className="form-row-3">
                <div className="form-group">
                  <label>Rayon <span className="label-hint">(max 15)</span></label>
                  <input type="number" min={1} max={15} step={1} value={bp.radius}
                    onChange={(e) => updateBP({ radius: Math.min(15, parseInt(e.target.value) || 1) })} />
                </div>
                <div className="form-group">
                  <label>Hauteur <span className="label-hint">(max 10)</span></label>
                  <input type="number" min={1} max={10} step={1} value={bp.height}
                    onChange={(e) => updateBP({ height: Math.min(10, parseInt(e.target.value) || 1) })} />
                </div>
                <div className="form-group">
                  <label>Durée <span className="label-hint">(s, min 1)</span></label>
                  <input type="number" min={1} max={300} step={1} value={bp.duration}
                    onChange={(e) => updateBP({ duration: Math.max(1, parseInt(e.target.value) || 1) })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Décalage Y <span className="label-hint">(-5 à 10)</span></label>
                  <input type="number" min={-5} max={10} step={1} value={bp.offset_y ?? 0}
                    onChange={(e) => updateBP({ offset_y: Math.max(-5, Math.min(10, parseInt(e.target.value) || 0)) })} />
                </div>
              </div>
              {/* ── Effet de placement ── */}
              <div className="mechanic-sub-section" style={{ marginTop: 8 }}>
                <div className="sub-section-label">🎬 Animation de placement</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Effet d'apparition</label>
                    <select value={bp.placement_effect ?? "instant"}
                      onChange={(e) => {
                        const effect = e.target.value as PlacementEffect;
                        const patch: Partial<BlockPlacement> = { placement_effect: effect };
                        if (effect === "instant") patch.placement_speed = 0;
                        else if ((bp.placement_speed ?? 0) === 0) patch.placement_speed = 2;
                        updateBP(patch);
                      }}>
                      {PLACEMENT_EFFECTS.map((pe) => <option key={pe.value} value={pe.value}>{pe.label}</option>)}
                    </select>
                    {(() => {
                      const sel = PLACEMENT_EFFECTS.find((pe) => pe.value === (bp.placement_effect ?? "instant"));
                      return sel ? <span className="label-hint">{sel.desc}</span> : null;
                    })()}
                  </div>
                  {(bp.placement_effect ?? "instant") !== "instant" && (
                    <div className="form-group">
                      <label>Vitesse <span className="label-hint">(s, durée totale)</span></label>
                      <input type="number" min={0.5} max={30} step={0.5} value={bp.placement_speed ?? 2}
                        onChange={(e) => updateBP({ placement_speed: Math.max(0.5, Math.min(30, parseFloat(e.target.value) || 2)) })} />
                    </div>
                  )}
                </div>
              </div>
              {selectedPattern?.supportsFilled && (
                <div className="form-group filled-toggle" style={{ marginTop: 6, padding: '8px 12px', background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <label className="checkbox-label" style={{ fontWeight: 500 }}>
                    <input type="checkbox" checked={bp.filled ?? true}
                      onChange={(e) => updateBP({ filled: e.target.checked })} />
                    {bp.filled ?? true ? '🟫 Zone remplie (solide)' : '⬜ Zone creuse (contour uniquement)'}
                  </label>
                  <span className="label-hint" style={{ display: 'block', marginTop: 4, marginLeft: 24 }}>
                    {bp.filled ?? true
                      ? 'L\'intérieur de la forme sera rempli de blocs'
                      : 'Seul le contour/la surface sera placé (creux)'}
                  </span>
                </div>
              )}
              <div className="form-row" style={{ marginTop: 6 }}>
                <label className="checkbox-label">
                  <input type="checkbox" checked={bp.breakable}
                    onChange={(e) => updateBP({ breakable: e.target.checked })} />
                  Cassable par les joueurs
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" checked={bp.replace_existing}
                    onChange={(e) => updateBP({ replace_existing: e.target.checked })} />
                  Remplacer blocs existants
                </label>
              </div>
            </>
          );
        })()}
      </CollapsibleSection>

      {/* ═══════════ VISUEL (mode classique) ═══════════ */}
      {mode === "classic" && (
      <CollapsibleSection title="Visuel" icon="🎨" defaultOpen={false} badge={`${layers.length} couches`}>
        {/* Couleur */}
        <div className="form-group">
          <label>Couleur du sort</label>
          <div className="color-display">
            <input type="color"
              value={rgbToHex(spell.visual.color[0], spell.visual.color[1], spell.visual.color[2])}
              onChange={(e) => {
                const [r, g, b] = hexToRgb(e.target.value);
                onChange({ ...spell, visual: { ...spell.visual, color: [r, g, b] } });
              }} />
            <div className="color-swatch"
              style={{ backgroundColor: `rgb(${spell.visual.color[0]},${spell.visual.color[1]},${spell.visual.color[2]})` }} />
            <div className="color-inputs">
              {["R", "G", "B"].map((channel, i) => (
                <div key={channel}>
                  <label style={{ marginBottom: 0, fontSize: "0.7rem" }}>{channel}</label>
                  <input type="number" min={0} max={255} value={spell.visual.color[i]}
                    onChange={(e) => updateVisualColor(i, parseInt(e.target.value) || 0)} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Smart theme suggestion */}
        {(() => {
          const element = detectSpellElement(spell);
          const theme = element ? ELEMENT_THEMES[element] : null;
          if (!theme) return null;
          const currentHex = rgbToHex(spell.visual.color[0], spell.visual.color[1], spell.visual.color[2]);
          const suggestedHex = rgbToHex(theme.color[0], theme.color[1], theme.color[2]);
          if (currentHex === suggestedHex) return null;
          return (
            <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "1.1rem" }}>💡</span>
              <span style={{ flex: 1, fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                Thème <strong>{element}</strong> détecté — appliquer les visuels suggérés ?
              </span>
              <button className="btn btn-accent btn-sm" onClick={() => {
                const newLayers = (spell.visual.particle_layers || []).map((l, i) => i === 0 ? { ...l, particle: theme.particles[0] as TrailParticle } : l);
                onChange({ ...spell, visual: { ...spell.visual, color: [...theme.color] as [number, number, number], particle_layers: newLayers, impact: { ...spell.visual.impact, particle: theme.particles[1] as ImpactParticle, sound: { key: theme.sounds[0] as SoundKey, volume: 1, pitch: 1 } } } });
              }}>
                🎨 Appliquer le thème
              </button>
            </div>
          );
        })()}

        {/* Multi-couche de particules */}
        <div className="subsection-header">
          Particules ({layers.length}/{MAX_PARTICLE_LAYERS} couches)
          {layers.length < MAX_PARTICLE_LAYERS && (
            <button className="btn btn-outline btn-sm" onClick={addLayer} style={{ marginLeft: 8 }}>+ Couche</button>
          )}
        </div>

        {layers.map((layer, index) => renderParticleLayer(layer, index))}

        {/* Impact */}
        <div className="subsection-header" style={{ marginTop: 20 }}>Impact</div>
        <div className="form-row">
          <div className="form-group">
            <label>Particule d'impact</label>
            <select value={spell.visual.impact.particle}
              onChange={(e) => updateImpact("particle", e.target.value as ImpactParticle)}>
              {IMPACT_PARTICLES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Son d'impact</label>
            <select value={spell.visual.impact.sound.key}
              onChange={(e) => updateImpactSound("key", e.target.value as SoundKey)}>
              {SOUND_KEYS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Volume ({spell.visual.impact.sound.volume.toFixed(1)})</label>
            <input type="range" min={0} max={2} step={0.1} value={spell.visual.impact.sound.volume}
              onChange={(e) => updateImpactSound("volume", parseFloat(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Pitch ({spell.visual.impact.sound.pitch.toFixed(1)})</label>
            <input type="range" min={0.5} max={2} step={0.1} value={spell.visual.impact.sound.pitch}
              onChange={(e) => updateImpactSound("pitch", parseFloat(e.target.value))} />
          </div>
        </div>

        {/* Son de lancement */}
        <div className="subsection-header" style={{ marginTop: 20 }}>Son de lancement</div>
        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={!!spell.visual.cast_sound}
              onChange={(e) => toggleCastSound(e.target.checked)} />
            Son personnalisé au lancement
          </label>
        </div>
        {spell.visual.cast_sound && (
          <>
            <div className="form-group">
              <label>Son</label>
              <select value={spell.visual.cast_sound.key}
                onChange={(e) => updateCastSound("key", e.target.value as SoundKey)}>
                {SOUND_KEYS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Volume ({spell.visual.cast_sound.volume.toFixed(1)})</label>
                <input type="range" min={0} max={2} step={0.1} value={spell.visual.cast_sound.volume}
                  onChange={(e) => updateCastSound("volume", parseFloat(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Pitch ({spell.visual.cast_sound.pitch.toFixed(1)})</label>
                <input type="range" min={0.5} max={2} step={0.1} value={spell.visual.cast_sound.pitch}
                  onChange={(e) => updateCastSound("pitch", parseFloat(e.target.value))} />
              </div>
            </div>
          </>
        )}

        {/* Particules sur les cibles */}
        <div className="subsection-header" style={{ marginTop: 20 }}>Particules sur les cibles</div>
        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={spell.visual.target_particles?.enabled ?? false}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange({
                    ...spell,
                    visual: {
                      ...spell.visual,
                      target_particles: { enabled: true, particle: "FLAME", count: 10, pattern: "burst", duration: 10 },
                    },
                  });
                } else {
                  onChange({ ...spell, visual: { ...spell.visual, target_particles: undefined } });
                }
              }} />
            ✨ Particules autour des cibles touchées
          </label>
        </div>
        {spell.visual.target_particles?.enabled && (() => {
          const tp = spell.visual.target_particles!;
          const updateTP = (patch: Partial<TargetParticleConfig>) =>
            onChange({ ...spell, visual: { ...spell.visual, target_particles: { ...tp, ...patch } } });
          return (
            <>
              <div className="form-row-3">
                <div className="form-group">
                  <label>Particule</label>
                  <select value={tp.particle}
                    onChange={(e) => updateTP({ particle: e.target.value as TrailParticle })}>
                    {TRAIL_PARTICLES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Motif</label>
                  <select value={tp.pattern}
                    onChange={(e) => updateTP({ pattern: e.target.value as TargetParticleConfig["pattern"] })}>
                    {TARGET_PARTICLE_PATTERNS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantité <span className="label-hint">(max 30)</span></label>
                  <input type="number" min={1} max={30} value={tp.count}
                    onChange={(e) => updateTP({ count: Math.min(30, parseInt(e.target.value) || 1) })} />
                </div>
              </div>
              <div className="form-group">
                <label>Durée ({tp.duration} ticks ≈ {(tp.duration / 20).toFixed(1)}s)</label>
                <input type="range" min={1} max={60} step={1} value={tp.duration}
                  onChange={(e) => updateTP({ duration: parseInt(e.target.value) })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Couleur</label>
                  <input type="color"
                    value={tp.color ? rgbToHex(tp.color[0], tp.color[1], tp.color[2]) : "#ff6600"}
                    onChange={(e) => updateTP({ color: hexToRgb(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Couleur fin (dégradé)</label>
                  <input type="color"
                    value={tp.color_end ? rgbToHex(tp.color_end[0], tp.color_end[1], tp.color_end[2]) : "#ffcc00"}
                    onChange={(e) => updateTP({ color_end: hexToRgb(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Taille ({tp.size?.toFixed(1) ?? "1.0"})</label>
                  <input type="range" min={0.5} max={5} step={0.1} value={tp.size ?? 1.0}
                    onChange={(e) => updateTP({ size: parseFloat(e.target.value) })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={tp.repeat ?? false}
                      onChange={(e) => updateTP({ repeat: e.target.checked })} />
                    🔁 Répéter l'effet
                  </label>
                </div>
                {tp.repeat && (
                  <div className="form-group">
                    <label>Intervalle ({tp.repeat_interval ?? 5} ticks)</label>
                    <input type="range" min={1} max={20} step={1} value={tp.repeat_interval ?? 5}
                      onChange={(e) => updateTP({ repeat_interval: parseInt(e.target.value) })} />
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </CollapsibleSection>
      )}

      {/* ═══════════ ANIMATION DE CAST / CHARGE ═══════════ */}
      {mode === "classic" && (
      <CollapsibleSection title="Animation de Cast" icon="🌀" defaultOpen={false} badge="Nouveau">
        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={spell.visual.cast_visual?.enabled ?? false}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange({ ...spell, visual: { ...spell.visual, cast_visual: createDefaultCastVisual() } });
                } else {
                  onChange({ ...spell, visual: { ...spell.visual, cast_visual: undefined } });
                }
              }} />
            🌀 Animation visuelle pendant le lancement / charge
          </label>
        </div>
        {spell.visual.cast_visual?.enabled && (() => {
          const cv = spell.visual.cast_visual!;
          const updateCV = (patch: Partial<CastVisualConfig>) =>
            onChange({ ...spell, visual: { ...spell.visual, cast_visual: { ...cv, ...patch } } });
          return (
            <>
              <div className="form-row-3">
                <div className="form-group">
                  <label>Particule</label>
                  <select value={cv.particle}
                    onChange={(e) => updateCV({ particle: e.target.value as TrailParticle })}>
                    {TRAIL_PARTICLES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Motif</label>
                  <select value={cv.pattern}
                    onChange={(e) => updateCV({ pattern: e.target.value as ParticlePattern })}>
                    {PARTICLE_PATTERNS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantité ({cv.count})</label>
                  <input type="range" min={1} max={50} step={1} value={cv.count}
                    onChange={(e) => updateCV({ count: parseInt(e.target.value) })} />
                </div>
              </div>
              <div className="form-row-3">
                <div className="form-group">
                  <label>Vitesse ({cv.speed.toFixed(1)})</label>
                  <input type="range" min={0.1} max={5} step={0.1} value={cv.speed}
                    onChange={(e) => updateCV({ speed: parseFloat(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Rayon ({cv.radius.toFixed(1)})</label>
                  <input type="range" min={0.5} max={5} step={0.1} value={cv.radius}
                    onChange={(e) => updateCV({ radius: parseFloat(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Courbe d'intensité</label>
                  <select value={cv.intensity_curve ?? "linear"}
                    onChange={(e) => updateCV({ intensity_curve: e.target.value as CastVisualConfig["intensity_curve"] })}>
                    {INTENSITY_CURVES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Couleur</label>
                  <input type="color"
                    value={cv.color ? rgbToHex(cv.color[0], cv.color[1], cv.color[2]) : rgbToHex(spell.visual.color[0], spell.visual.color[1], spell.visual.color[2])}
                    onChange={(e) => updateCV({ color: hexToRgb(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Couleur fin</label>
                  <input type="color"
                    value={cv.color_end ? rgbToHex(cv.color_end[0], cv.color_end[1], cv.color_end[2]) : "#ffffff"}
                    onChange={(e) => updateCV({ color_end: hexToRgb(e.target.value) })} />
                </div>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={cv.grow_with_charge ?? false}
                    onChange={(e) => updateCV({ grow_with_charge: e.target.checked })} />
                  📈 Le rayon grandit avec le temps de charge
                </label>
              </div>
            </>
          );
        })()}
      </CollapsibleSection>
      )}

      {/* ═══════════ VISUEL DU PROJECTILE ═══════════ */}
      {mode === "classic" && spell.mechanics.cast_type === "projectile" && (
      <CollapsibleSection title="Visuel du Projectile" icon="🚀" defaultOpen={false} badge="Nouveau">
        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={spell.visual.projectile_visual?.enabled ?? false}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange({ ...spell, visual: { ...spell.visual, projectile_visual: createDefaultProjectileVisual() } });
                } else {
                  onChange({ ...spell, visual: { ...spell.visual, projectile_visual: undefined } });
                }
              }} />
            🚀 Apparence personnalisée du projectile
          </label>
        </div>
        {spell.visual.projectile_visual?.enabled && (() => {
          const pv = spell.visual.projectile_visual!;
          const updatePV = (patch: Partial<ProjectileVisualConfig>) =>
            onChange({ ...spell, visual: { ...spell.visual, projectile_visual: { ...pv, ...patch } } });
          return (
            <>
              <div className="form-row-3">
                <div className="form-group">
                  <label>Forme</label>
                  <select value={pv.shape}
                    onChange={(e) => updatePV({ shape: e.target.value as ProjectileVisualConfig["shape"] })}>
                    {PROJECTILE_VISUAL_SHAPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Particule</label>
                  <select value={pv.particle}
                    onChange={(e) => updatePV({ particle: e.target.value as TrailParticle })}>
                    {TRAIL_PARTICLES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Taille ({pv.size.toFixed(1)})</label>
                  <input type="range" min={0.2} max={5} step={0.1} value={pv.size}
                    onChange={(e) => updatePV({ size: parseFloat(e.target.value) })} />
                </div>
              </div>
              <div className="form-row-3">
                <div className="form-group">
                  <label>Rotation ({pv.rotation_speed.toFixed(1)})</label>
                  <input type="range" min={0} max={10} step={0.1} value={pv.rotation_speed}
                    onChange={(e) => updatePV({ rotation_speed: parseFloat(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={pv.glow}
                      onChange={(e) => updatePV({ glow: e.target.checked })} />
                    💡 Lueur
                  </label>
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={pv.pulse}
                      onChange={(e) => updatePV({ pulse: e.target.checked })} />
                    💓 Pulsation
                  </label>
                </div>
              </div>
              {pv.glow && (
                <div className="form-group">
                  <label>Couleur de lueur</label>
                  <input type="color"
                    value={pv.glow_color ? rgbToHex(pv.glow_color[0], pv.glow_color[1], pv.glow_color[2]) : rgbToHex(spell.visual.color[0], spell.visual.color[1], spell.visual.color[2])}
                    onChange={(e) => updatePV({ glow_color: hexToRgb(e.target.value) })} />
                </div>
              )}
              {pv.pulse && (
                <div className="form-group">
                  <label>Vitesse de pulsation ({(pv.pulse_speed ?? 1.0).toFixed(1)})</label>
                  <input type="range" min={0.5} max={5} step={0.1} value={pv.pulse_speed ?? 1.0}
                    onChange={(e) => updatePV({ pulse_speed: parseFloat(e.target.value) })} />
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label>Particule secondaire</label>
                  <select value={pv.secondary_particle ?? ""}
                    onChange={(e) => updatePV({ secondary_particle: e.target.value ? e.target.value as TrailParticle : undefined })}>
                    <option value="">Aucune</option>
                    {TRAIL_PARTICLES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                {pv.secondary_particle && (
                  <div className="form-group">
                    <label>Quantité sec. ({pv.secondary_count ?? 3})</label>
                    <input type="range" min={1} max={20} step={1} value={pv.secondary_count ?? 3}
                      onChange={(e) => updatePV({ secondary_count: parseInt(e.target.value) })} />
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </CollapsibleSection>
      )}

      {/* ═══════════ ANIMATION D'IMPACT ═══════════ */}
      {mode === "classic" && (
      <CollapsibleSection title="Animation d'Impact" icon="💥" defaultOpen={false} badge="Nouveau">
        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={spell.visual.impact_animation?.enabled ?? false}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange({ ...spell, visual: { ...spell.visual, impact_animation: createDefaultImpactAnimation() } });
                } else {
                  onChange({ ...spell, visual: { ...spell.visual, impact_animation: undefined } });
                }
              }} />
            💥 Animation d'impact multi-étapes (séquence d'effets à l'impact)
          </label>
        </div>
        {spell.visual.impact_animation?.enabled && (() => {
          const ia = spell.visual.impact_animation!;
          const updateIA = (patch: Partial<ImpactAnimationConfig>) =>
            onChange({ ...spell, visual: { ...spell.visual, impact_animation: { ...ia, ...patch } } });
          const updateStep = (idx: number, patch: Partial<ImpactAnimationStep>) => {
            const newSteps = [...ia.steps];
            newSteps[idx] = { ...newSteps[idx], ...patch };
            updateIA({ steps: newSteps });
          };
          const addStep = () => {
            if (ia.steps.length >= 8) return;
            const lastDelay = ia.steps.length > 0 ? ia.steps[ia.steps.length - 1].delay + 3 : 0;
            updateIA({ steps: [...ia.steps, createDefaultImpactStep(lastDelay)] });
          };
          const removeStep = (idx: number) => {
            if (ia.steps.length <= 1) return;
            updateIA({ steps: ia.steps.filter((_, i) => i !== idx) });
          };
          return (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Durée totale ({ia.total_duration} ticks ≈ {(ia.total_duration / 20).toFixed(1)}s)</label>
                  <input type="range" min={5} max={60} step={1} value={ia.total_duration}
                    onChange={(e) => updateIA({ total_duration: parseInt(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={ia.screen_flash ?? false}
                      onChange={(e) => updateIA({ screen_flash: e.target.checked })} />
                    ⚡ Flash d'écran à l'impact
                  </label>
                </div>
              </div>
              {ia.screen_flash && (
                <div className="form-group">
                  <label>Couleur du flash</label>
                  <input type="color"
                    value={ia.screen_flash_color ? rgbToHex(ia.screen_flash_color[0], ia.screen_flash_color[1], ia.screen_flash_color[2]) : "#ffffff"}
                    onChange={(e) => updateIA({ screen_flash_color: hexToRgb(e.target.value) })} />
                </div>
              )}

              <div className="subsection-header" style={{ marginTop: 12 }}>
                Étapes ({ia.steps.length}/8)
                {ia.steps.length < 8 && (
                  <button className="btn btn-outline btn-sm" onClick={addStep} style={{ marginLeft: 8 }}>+ Étape</button>
                )}
              </div>

              {ia.steps.map((step, idx) => (
                <div key={idx} className="particle-layer" style={{ marginBottom: 8 }}>
                  <div className="particle-layer-header">
                    <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>Étape {idx + 1}</span>
                    {ia.steps.length > 1 && (
                      <button className="btn btn-danger btn-sm" onClick={() => removeStep(idx)} title="Supprimer">✕</button>
                    )}
                  </div>
                  <div className="form-row-3">
                    <div className="form-group">
                      <label>Délai ({step.delay} ticks)</label>
                      <input type="range" min={0} max={40} step={1} value={step.delay}
                        onChange={(e) => updateStep(idx, { delay: parseInt(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label>Particule</label>
                      <select value={step.particle}
                        onChange={(e) => updateStep(idx, { particle: e.target.value as TrailParticle })}>
                        {TRAIL_PARTICLES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Motif</label>
                      <select value={step.pattern}
                        onChange={(e) => updateStep(idx, { pattern: e.target.value as ParticlePattern })}>
                        {PARTICLE_PATTERNS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row-3">
                    <div className="form-group">
                      <label>Quantité ({step.count})</label>
                      <input type="range" min={1} max={100} step={1} value={step.count}
                        onChange={(e) => updateStep(idx, { count: parseInt(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label>Dispersion ({step.spread.toFixed(1)})</label>
                      <input type="range" min={0.5} max={10} step={0.1} value={step.spread}
                        onChange={(e) => updateStep(idx, { spread: parseFloat(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label>Vitesse ({step.speed.toFixed(1)})</label>
                      <input type="range" min={0.1} max={5} step={0.1} value={step.speed}
                        onChange={(e) => updateStep(idx, { speed: parseFloat(e.target.value) })} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Couleur</label>
                      <input type="color"
                        value={step.color ? rgbToHex(step.color[0], step.color[1], step.color[2]) : rgbToHex(spell.visual.color[0], spell.visual.color[1], spell.visual.color[2])}
                        onChange={(e) => updateStep(idx, { color: hexToRgb(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label>Couleur fin</label>
                      <input type="color"
                        value={step.color_end ? rgbToHex(step.color_end[0], step.color_end[1], step.color_end[2]) : "#ffffff"}
                        onChange={(e) => updateStep(idx, { color_end: hexToRgb(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label>Camera shake ({step.camera_shake?.toFixed(1) ?? "0"})</label>
                      <input type="range" min={0} max={5} step={0.1} value={step.camera_shake ?? 0}
                        onChange={(e) => updateStep(idx, { camera_shake: parseFloat(e.target.value) })} />
                    </div>
                  </div>
                </div>
              ))}
            </>
          );
        })()}
      </CollapsibleSection>
      )}

      {/* ═══════════ EFFET DE SLASH / MÊLÉE ═══════════ */}
      {mode === "classic" && (
      <CollapsibleSection title="Effet de Slash" icon="🗡️" defaultOpen={false} badge="Nouveau">
        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={spell.visual.slash_visual?.enabled ?? false}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange({ ...spell, visual: { ...spell.visual, slash_visual: createDefaultSlashVisual() } });
                } else {
                  onChange({ ...spell, visual: { ...spell.visual, slash_visual: undefined } });
                }
              }} />
            🗡️ Effet de slash / mêlée visuel
          </label>
        </div>
        {spell.visual.slash_visual?.enabled && (() => {
          const sv = spell.visual.slash_visual!;
          const updateSV = (patch: Partial<SlashVisualConfig>) =>
            onChange({ ...spell, visual: { ...spell.visual, slash_visual: { ...sv, ...patch } } });
          return (
            <>
              <div className="form-row-3">
                <div className="form-group">
                  <label>Style du slash</label>
                  <select value={sv.style}
                    onChange={(e) => updateSV({ style: e.target.value as SlashStyle })}>
                    {SLASH_STYLES.map((s) => <option key={s.value} value={s.value} title={s.desc}>{s.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Particule</label>
                  <select value={sv.particle}
                    onChange={(e) => updateSV({ particle: e.target.value as TrailParticle })}>
                    {TRAIL_PARTICLES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Portée ({sv.range.toFixed(1)})</label>
                  <input type="range" min={1} max={10} step={0.1} value={sv.range}
                    onChange={(e) => updateSV({ range: parseFloat(e.target.value) })} />
                </div>
              </div>
              <div className="form-row-3">
                <div className="form-group">
                  <label>Angle de l'arc ({sv.arc_angle}°)</label>
                  <input type="range" min={30} max={360} step={5} value={sv.arc_angle}
                    onChange={(e) => updateSV({ arc_angle: parseInt(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Épaisseur ({sv.arc_width.toFixed(1)})</label>
                  <input type="range" min={0.5} max={5} step={0.1} value={sv.arc_width}
                    onChange={(e) => updateSV({ arc_width: parseFloat(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Vitesse ({sv.speed.toFixed(1)})</label>
                  <input type="range" min={0.5} max={10} step={0.1} value={sv.speed}
                    onChange={(e) => updateSV({ speed: parseFloat(e.target.value) })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Couleur</label>
                  <input type="color"
                    value={sv.color ? rgbToHex(sv.color[0], sv.color[1], sv.color[2]) : rgbToHex(spell.visual.color[0], spell.visual.color[1], spell.visual.color[2])}
                    onChange={(e) => updateSV({ color: hexToRgb(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Couleur fin (dégradé)</label>
                  <input type="color"
                    value={sv.color_end ? rgbToHex(sv.color_end[0], sv.color_end[1], sv.color_end[2]) : "#ffffff"}
                    onChange={(e) => updateSV({ color_end: hexToRgb(e.target.value) })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Traînée du slash</label>
                  <select value={sv.trail_particles ?? ""}
                    onChange={(e) => updateSV({ trail_particles: e.target.value ? e.target.value as TrailParticle : undefined })}>
                    <option value="">Aucune</option>
                    {TRAIL_PARTICLES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                {sv.trail_particles && (
                  <div className="form-group">
                    <label>Quantité traînée ({sv.trail_count ?? 5})</label>
                    <input type="range" min={1} max={20} step={1} value={sv.trail_count ?? 5}
                      onChange={(e) => updateSV({ trail_count: parseInt(e.target.value) })} />
                  </div>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={sv.afterimage ?? false}
                      onChange={(e) => updateSV({ afterimage: e.target.checked })} />
                    ✨ Après-image (rémanence)
                  </label>
                </div>
                {sv.afterimage && (
                  <div className="form-group">
                    <label>Nombre d'images ({sv.afterimage_count ?? 2})</label>
                    <input type="range" min={1} max={5} step={1} value={sv.afterimage_count ?? 2}
                      onChange={(e) => updateSV({ afterimage_count: parseInt(e.target.value) })} />
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </CollapsibleSection>
      )}

      {/* ═══════════ PRÉSETS DE PARTICULES ═══════════ */}
      {mode === "classic" && (
      <CollapsibleSection title="Présets de Particules" icon="💾" defaultOpen={false} badge="Nouveau">
        <p className="ai-desc" style={{ marginBottom: 12 }}>
          Sauvegardez vos configurations de particules pour les réutiliser dans d'autres sorts.
        </p>

        {/* Sauvegarder le préset actuel */}
        <div className="form-group">
          <button className="btn btn-accent" onClick={() => {
            const preset = createDefaultPreset(spell.meta.author);
            preset.name = `Préset de ${spell.meta.name}`;
            preset.layers = [...(spell.visual.particle_layers ?? [])];
            preset.impact = { ...spell.visual.impact };
            if (spell.visual.cast_visual) preset.cast_visual = { ...spell.visual.cast_visual };
            if (spell.visual.projectile_visual) preset.projectile_visual = { ...spell.visual.projectile_visual };
            if (spell.visual.impact_animation) preset.impact_animation = { ...spell.visual.impact_animation };
            if (spell.visual.slash_visual) preset.slash_visual = { ...spell.visual.slash_visual };
            if (spell.visual.target_particles) preset.target_particles = { ...spell.visual.target_particles };
            const presets = [...(spell.particle_presets ?? []), preset];
            onChange({ ...spell, particle_presets: presets });
          }}>
            💾 Sauvegarder la config actuelle comme préset
          </button>
        </div>

        {/* Liste des présets */}
        {(spell.particle_presets ?? []).length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div className="subsection-header">Présets sauvegardés ({spell.particle_presets!.length})</div>
            {spell.particle_presets!.map((preset, idx) => (
              <div key={preset.id} className="particle-layer" style={{ marginBottom: 8 }}>
                <div className="particle-layer-header">
                  <input type="text" className="layer-name-input" value={preset.name}
                    onChange={(e) => {
                      const newPresets = [...spell.particle_presets!];
                      newPresets[idx] = { ...newPresets[idx], name: e.target.value };
                      onChange({ ...spell, particle_presets: newPresets });
                    }}
                    placeholder="Nom du préset" />
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => {
                      const p = preset;
                      const newVisual = { ...spell.visual };
                      if (p.layers.length > 0) newVisual.particle_layers = [...p.layers];
                      if (p.impact) newVisual.impact = { ...p.impact };
                      if (p.cast_visual) newVisual.cast_visual = { ...p.cast_visual };
                      if (p.projectile_visual) newVisual.projectile_visual = { ...p.projectile_visual };
                      if (p.impact_animation) newVisual.impact_animation = { ...p.impact_animation };
                      if (p.slash_visual) newVisual.slash_visual = { ...p.slash_visual };
                      if (p.target_particles) newVisual.target_particles = { ...p.target_particles };
                      onChange({ ...spell, visual: newVisual });
                    }} title="Appliquer ce préset">
                      📥 Appliquer
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => {
                      const newPresets = spell.particle_presets!.filter((_, i) => i !== idx);
                      onChange({ ...spell, particle_presets: newPresets.length > 0 ? newPresets : undefined });
                    }} title="Supprimer">✕</button>
                  </div>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", padding: "4px 8px" }}>
                  {preset.layers.length} couche(s)
                  {preset.cast_visual?.enabled ? " • Cast" : ""}
                  {preset.projectile_visual?.enabled ? " • Projectile" : ""}
                  {preset.impact_animation?.enabled ? " • Impact anim." : ""}
                  {preset.slash_visual?.enabled ? " • Slash" : ""}
                  {preset.target_particles?.enabled ? " • Cibles" : ""}
                  <select value={preset.category ?? "custom"} style={{ marginLeft: 8, fontSize: "0.8rem" }}
                    onChange={(e) => {
                      const newPresets = [...spell.particle_presets!];
                      newPresets[idx] = { ...newPresets[idx], category: e.target.value as ParticlePreset["category"] };
                      onChange({ ...spell, particle_presets: newPresets });
                    }}>
                    {PRESET_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>
      )}


    </>
  );
}

/* ═══════════════════════════════════════════════════════
   Fonction utilitaire : créer un effet par défaut
   ═══════════════════════════════════════════════════════ */
function createDefaultEffect(type: SpellEffect["type"]): SpellEffect | null {
  switch (type) {
    case "damage": return { type: "damage", amount: 4, damage_type: "magic" };
    case "heal": return { type: "heal", amount: 4 };
    case "status": return { type: "status", status: "burn", duration: 3, amplifier: 0 };
    case "knockback": return { type: "knockback", strength: 1.5 };
    case "pull": return { type: "pull", strength: 1.5 };
    case "shield": return { type: "shield", amount: 6, duration: 5 };
    case "lifedrain": return { type: "lifedrain", amount: 4 };
    case "teleport": return { type: "teleport", distance: 8 };
    case "launch": return { type: "launch", height: 3 };
    case "speed_boost": return { type: "speed_boost", multiplier: 1.5, duration: 5 };
    case "aoe_dot": return { type: "aoe_dot", amount: 2, duration: 5, tick_rate: 1, damage_type: "fire" };
    case "chain": return { type: "chain", amount: 4, damage_type: "lightning", max_targets: 3, chain_range: 5 };
    case "summon": return { type: "summon", entity_type: "wolf", count: 1, duration: 15 };
    case "cleanse": return { type: "cleanse" };
    case "ignite_area": return { type: "ignite_area", radius: 3, duration: 5 };
    case "freeze_area": return { type: "freeze_area", radius: 3, duration: 5 };
    case "swap": return { type: "swap" };
    case "meteor": return { type: "meteor", amount: 10, damage_type: "fire", radius: 4 };
    case "gravity_well": return { type: "gravity_well", strength: 2, radius: 5, duration: 5 };
    case "poison_cloud": return { type: "poison_cloud", amount: 2, radius: 4, duration: 8, tick_rate: 1 };
    case "blind_flash": return { type: "blind_flash", radius: 6, duration: 3 };
    case "earthquake": return { type: "earthquake", amount: 6, radius: 5, duration: 3 };
    case "vampiric_aura": return { type: "vampiric_aura", amount: 2, radius: 5, duration: 10 };
    case "reflect_shield": return { type: "reflect_shield", duration: 5, amount: 4 };
    case "decoy": return { type: "decoy" };
    case "time_warp": return { type: "time_warp", radius: 5, duration: 4 };
    case "explosion": return { type: "explosion", amount: 8, radius: 4, damage_type: "fire" };
    default: return null;
  }
}

/* ═══════════════════════════════════════════════════════
   Rendu des champs d'un effet (partagé entre effets principaux et effets sur soi)
   ═══════════════════════════════════════════════════════ */
function renderEffectTypeFields(
  effect: SpellEffect,
  index: number,
  onUpdate: (index: number, effect: SpellEffect) => void,
  customMobs?: MobSummary[],
) {
  switch (effect.type) {
    case "damage":
      return (
        <div className="form-row">
          <div className="form-group">
            <label>Dégâts <span className="label-hint">(max 50)</span></label>
            <input type="number" min={0.5} max={50} step={0.5} value={effect.amount}
              onChange={(e) => onUpdate(index, { ...effect, amount: Math.min(50, parseFloat(e.target.value) || 0.5) })} />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={effect.damage_type}
              onChange={(e) => onUpdate(index, { ...effect, damage_type: e.target.value as DamageType })}>
              {DAMAGE_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
        </div>
      );
    case "heal":
      return (
        <div className="form-group">
          <label>Points de vie <span className="label-hint">(max 40)</span></label>
          <input type="number" min={0.5} max={40} step={0.5} value={effect.amount}
            onChange={(e) => onUpdate(index, { ...effect, amount: Math.min(40, parseFloat(e.target.value) || 0.5) })} />
        </div>
      );
    case "status":
      return (
        <>
          <div className="form-row">
            <div className="form-group">
              <label>Statut</label>
              <select value={effect.status}
                onChange={(e) => onUpdate(index, { ...effect, status: e.target.value as StatusType })}>
                {STATUS_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Durée <span className="label-hint">(max 30s)</span></label>
              <input type="number" min={0.5} max={30} step={0.5} value={effect.duration}
                onChange={(e) => onUpdate(index, { ...effect, duration: Math.min(30, parseFloat(e.target.value) || 0.5) })} />
            </div>
          </div>
          <div className="form-group">
            <label>Amplificateur <span className="label-hint">(max 4)</span></label>
            <input type="number" min={0} max={4} step={1} value={effect.amplifier}
              onChange={(e) => onUpdate(index, { ...effect, amplifier: Math.min(4, parseInt(e.target.value) || 0) })} />
          </div>
        </>
      );
    case "knockback":
      return (
        <div className="form-group">
          <label>Force <span className="label-hint">(max 10)</span></label>
          <input type="number" min={0.1} max={10} step={0.1} value={effect.strength}
            onChange={(e) => onUpdate(index, { ...effect, strength: Math.min(10, parseFloat(e.target.value) || 0.1) })} />
        </div>
      );
    case "pull":
      return (
        <div className="form-group">
          <label>Force d'attraction <span className="label-hint">(max 10)</span></label>
          <input type="number" min={0.1} max={10} step={0.1} value={effect.strength}
            onChange={(e) => onUpdate(index, { ...effect, strength: Math.min(10, parseFloat(e.target.value) || 0.1) })} />
        </div>
      );
    case "shield":
      return (
        <div className="form-row">
          <div className="form-group">
            <label>Points de bouclier <span className="label-hint">(max 30)</span></label>
            <input type="number" min={1} max={30} step={1} value={effect.amount}
              onChange={(e) => onUpdate(index, { ...effect, amount: Math.min(30, parseFloat(e.target.value) || 1) })} />
          </div>
          <div className="form-group">
            <label>Durée <span className="label-hint">(max 30s)</span></label>
            <input type="number" min={1} max={30} step={1} value={effect.duration}
              onChange={(e) => onUpdate(index, { ...effect, duration: Math.min(30, parseFloat(e.target.value) || 1) })} />
          </div>
        </div>
      );
    case "lifedrain":
      return (
        <div className="form-group">
          <label>Dégâts = soin au lanceur <span className="label-hint">(max 30)</span></label>
          <input type="number" min={0.5} max={30} step={0.5} value={effect.amount}
            onChange={(e) => onUpdate(index, { ...effect, amount: Math.min(30, parseFloat(e.target.value) || 0.5) })} />
        </div>
      );
    case "teleport":
      return (
        <div className="form-group">
          <label>Distance <span className="label-hint">(max 30 blocs)</span></label>
          <input type="number" min={1} max={30} step={1} value={effect.distance}
            onChange={(e) => onUpdate(index, { ...effect, distance: Math.min(30, parseFloat(e.target.value) || 1) })} />
        </div>
      );
    case "launch":
      return (
        <div className="form-group">
          <label>Hauteur <span className="label-hint">(max 15)</span></label>
          <input type="number" min={0.5} max={15} step={0.5} value={effect.height}
            onChange={(e) => onUpdate(index, { ...effect, height: Math.min(15, parseFloat(e.target.value) || 0.5) })} />
        </div>
      );
    case "speed_boost":
      return (
        <div className="form-row">
          <div className="form-group">
            <label>Multiplicateur</label>
            <input type="number" min={1} max={5} step={0.1} value={effect.multiplier}
              onChange={(e) => onUpdate(index, { ...effect, multiplier: parseFloat(e.target.value) || 1 })} />
          </div>
          <div className="form-group">
            <label>Durée <span className="label-hint">(max 20s)</span></label>
            <input type="number" min={1} max={20} step={1} value={effect.duration}
              onChange={(e) => onUpdate(index, { ...effect, duration: Math.min(20, parseFloat(e.target.value) || 1) })} />
          </div>
        </div>
      );
    case "aoe_dot":
      return (
        <>
          <div className="form-row">
            <div className="form-group">
              <label>Dégâts/tick <span className="label-hint">(max 20)</span></label>
              <input type="number" min={0.5} max={20} step={0.5} value={effect.amount}
                onChange={(e) => onUpdate(index, { ...effect, amount: Math.min(20, parseFloat(e.target.value) || 0.5) })} />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={effect.damage_type}
                onChange={(e) => onUpdate(index, { ...effect, damage_type: e.target.value as DamageType })}>
                {DAMAGE_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Durée <span className="label-hint">(max 30s)</span></label>
              <input type="number" min={1} max={30} step={1} value={effect.duration}
                onChange={(e) => onUpdate(index, { ...effect, duration: Math.min(30, parseFloat(e.target.value) || 1) })} />
            </div>
            <div className="form-group">
              <label>Fréquence <span className="label-hint">(s/tick)</span></label>
              <input type="number" min={0.5} step={0.5} value={effect.tick_rate}
                onChange={(e) => onUpdate(index, { ...effect, tick_rate: parseFloat(e.target.value) || 0.5 })} />
            </div>
          </div>
        </>
      );
    case "chain":
      return (
        <>
          <div className="form-row">
            <div className="form-group">
              <label>Dégâts <span className="label-hint">(max 30)</span></label>
              <input type="number" min={0.5} max={30} step={0.5} value={effect.amount}
                onChange={(e) => onUpdate(index, { ...effect, amount: Math.min(30, parseFloat(e.target.value) || 0.5) })} />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={effect.damage_type}
                onChange={(e) => onUpdate(index, { ...effect, damage_type: e.target.value as DamageType })}>
                {DAMAGE_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Cibles max</label>
              <input type="number" min={1} max={8} step={1} value={effect.max_targets}
                onChange={(e) => onUpdate(index, { ...effect, max_targets: parseInt(e.target.value) || 1 })} />
            </div>
            <div className="form-group">
              <label>Portée chaîne</label>
              <input type="number" min={1} max={15} step={1} value={effect.chain_range}
                onChange={(e) => onUpdate(index, { ...effect, chain_range: parseFloat(e.target.value) || 1 })} />
            </div>
          </div>
        </>
      );
    case "summon":
      return (
        <div className="form-row-3">
          <div className="form-group">
            <label>Entité</label>
            <select value={effect.entity_type}
              onChange={(e) => onUpdate(index, { ...effect, entity_type: e.target.value as SummonType })}>
              <optgroup label="Vanille">
                {SUMMON_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </optgroup>
              {customMobs && customMobs.length > 0 && (
                <optgroup label="🐉 Mobs Customs">
                  {customMobs.map((m) => <option key={m.id} value={`custom:${m.id}`}>🐉 {m.name}</option>)}
                </optgroup>
              )}
            </select>
          </div>
          <div className="form-group">
            <label>Nombre</label>
            <input type="number" min={1} max={5} step={1} value={effect.count}
              onChange={(e) => onUpdate(index, { ...effect, count: parseInt(e.target.value) || 1 })} />
          </div>
          <div className="form-group">
            <label>Durée <span className="label-hint">(sec)</span></label>
            <input type="number" min={5} max={60} step={5} value={effect.duration}
              onChange={(e) => onUpdate(index, { ...effect, duration: parseFloat(e.target.value) || 5 })} />
          </div>
        </div>
      );
    case "cleanse":
      return <p className="effect-desc">Retire tous les effets négatifs du lanceur.</p>;
    case "ignite_area":
    case "freeze_area":
      return (
        <div className="form-row">
          <div className="form-group">
            <label>Rayon</label>
            <input type="number" min={1} max={10} step={0.5} value={effect.radius}
              onChange={(e) => onUpdate(index, { ...effect, radius: parseFloat(e.target.value) || 1 })} />
          </div>
          <div className="form-group">
            <label>Durée <span className="label-hint">(max 20s)</span></label>
            <input type="number" min={1} max={20} step={1} value={effect.duration}
              onChange={(e) => onUpdate(index, { ...effect, duration: Math.min(20, parseFloat(e.target.value) || 1) })} />
          </div>
        </div>
      );
    case "swap":
      return <p className="effect-desc">Échange instantanément votre position avec la cible.</p>;
    case "meteor":
      return (
        <div className="form-row-3">
          <div className="form-group">
            <label>Dégâts</label>
            <input type="number" min={1} max={25} step={1} value={effect.amount}
              onChange={(e) => onUpdate(index, { ...effect, amount: Math.min(25, parseFloat(e.target.value) || 1) })} />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={effect.damage_type} onChange={(e) => onUpdate(index, { ...effect, damage_type: e.target.value as DamageType })}>
              {DAMAGE_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Rayon impact</label>
            <input type="number" min={1} max={10} step={1} value={effect.radius}
              onChange={(e) => onUpdate(index, { ...effect, radius: Math.min(10, parseInt(e.target.value) || 1) })} />
          </div>
        </div>
      );
    case "gravity_well":
      return (
        <div className="form-row-3">
          <div className="form-group">
            <label>Force</label>
            <input type="number" min={0.5} max={5} step={0.5} value={effect.strength}
              onChange={(e) => onUpdate(index, { ...effect, strength: Math.min(5, parseFloat(e.target.value) || 0.5) })} />
          </div>
          <div className="form-group">
            <label>Rayon</label>
            <input type="number" min={1} max={10} step={1} value={effect.radius}
              onChange={(e) => onUpdate(index, { ...effect, radius: Math.min(10, parseInt(e.target.value) || 1) })} />
          </div>
          <div className="form-group">
            <label>Durée</label>
            <input type="number" min={1} max={15} step={1} value={effect.duration}
              onChange={(e) => onUpdate(index, { ...effect, duration: Math.min(15, parseInt(e.target.value) || 1) })} />
          </div>
        </div>
      );
    case "poison_cloud":
      return (
        <>
          <div className="form-row">
            <div className="form-group">
              <label>Dégâts/tick</label>
              <input type="number" min={1} max={10} step={1} value={effect.amount}
                onChange={(e) => onUpdate(index, { ...effect, amount: Math.min(10, parseFloat(e.target.value) || 1) })} />
            </div>
            <div className="form-group">
              <label>Rayon</label>
              <input type="number" min={1} max={10} step={1} value={effect.radius}
                onChange={(e) => onUpdate(index, { ...effect, radius: Math.min(10, parseInt(e.target.value) || 1) })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Durée</label>
              <input type="number" min={1} max={30} step={1} value={effect.duration}
                onChange={(e) => onUpdate(index, { ...effect, duration: Math.min(30, parseInt(e.target.value) || 1) })} />
            </div>
            <div className="form-group">
              <label>Fréquence <span className="label-hint">(s)</span></label>
              <input type="number" min={0.5} max={5} step={0.5} value={effect.tick_rate}
                onChange={(e) => onUpdate(index, { ...effect, tick_rate: Math.min(5, parseFloat(e.target.value) || 0.5) })} />
            </div>
          </div>
        </>
      );
    case "blind_flash":
      return (
        <div className="form-row">
          <div className="form-group">
            <label>Rayon</label>
            <input type="number" min={1} max={15} step={1} value={effect.radius}
              onChange={(e) => onUpdate(index, { ...effect, radius: Math.min(15, parseInt(e.target.value) || 1) })} />
          </div>
          <div className="form-group">
            <label>Durée aveuglement</label>
            <input type="number" min={1} max={10} step={1} value={effect.duration}
              onChange={(e) => onUpdate(index, { ...effect, duration: Math.min(10, parseInt(e.target.value) || 1) })} />
          </div>
        </div>
      );
    case "earthquake":
      return (
        <div className="form-row-3">
          <div className="form-group">
            <label>Dégâts</label>
            <input type="number" min={1} max={15} step={1} value={effect.amount}
              onChange={(e) => onUpdate(index, { ...effect, amount: Math.min(15, parseFloat(e.target.value) || 1) })} />
          </div>
          <div className="form-group">
            <label>Rayon</label>
            <input type="number" min={1} max={10} step={1} value={effect.radius}
              onChange={(e) => onUpdate(index, { ...effect, radius: Math.min(10, parseInt(e.target.value) || 1) })} />
          </div>
          <div className="form-group">
            <label>Durée</label>
            <input type="number" min={1} max={10} step={1} value={effect.duration}
              onChange={(e) => onUpdate(index, { ...effect, duration: Math.min(10, parseInt(e.target.value) || 1) })} />
          </div>
        </div>
      );
    case "vampiric_aura":
      return (
        <div className="form-row-3">
          <div className="form-group">
            <label>Drain/s</label>
            <input type="number" min={0.5} max={5} step={0.5} value={effect.amount}
              onChange={(e) => onUpdate(index, { ...effect, amount: Math.min(5, parseFloat(e.target.value) || 0.5) })} />
          </div>
          <div className="form-group">
            <label>Rayon</label>
            <input type="number" min={1} max={10} step={1} value={effect.radius}
              onChange={(e) => onUpdate(index, { ...effect, radius: Math.min(10, parseInt(e.target.value) || 1) })} />
          </div>
          <div className="form-group">
            <label>Durée</label>
            <input type="number" min={1} max={20} step={1} value={effect.duration}
              onChange={(e) => onUpdate(index, { ...effect, duration: Math.min(20, parseInt(e.target.value) || 1) })} />
          </div>
        </div>
      );
    case "reflect_shield":
      return (
        <div className="form-row">
          <div className="form-group">
            <label>Réflexion (%)</label>
            <input type="number" min={1} max={10} step={1} value={effect.amount}
              onChange={(e) => onUpdate(index, { ...effect, amount: Math.min(10, parseInt(e.target.value) || 1) })} />
          </div>
          <div className="form-group">
            <label>Durée</label>
            <input type="number" min={1} max={20} step={1} value={effect.duration}
              onChange={(e) => onUpdate(index, { ...effect, duration: Math.min(20, parseInt(e.target.value) || 1) })} />
          </div>
        </div>
      );
    case "decoy":
      return <p className="effect-desc">Crée un leurre qui attire les mobs pendant quelques secondes.</p>;
    case "time_warp":
      return (
        <div className="form-row">
          <div className="form-group">
            <label>Rayon</label>
            <input type="number" min={1} max={10} step={1} value={effect.radius}
              onChange={(e) => onUpdate(index, { ...effect, radius: Math.min(10, parseInt(e.target.value) || 1) })} />
          </div>
          <div className="form-group">
            <label>Durée</label>
            <input type="number" min={1} max={10} step={1} value={effect.duration}
              onChange={(e) => onUpdate(index, { ...effect, duration: Math.min(10, parseInt(e.target.value) || 1) })} />
          </div>
        </div>
      );
    case "explosion":
      return (
        <div className="form-row-3">
          <div className="form-group">
            <label>Dégâts <span className="label-hint">(max 30)</span></label>
            <input type="number" min={1} max={30} step={1} value={effect.amount}
              onChange={(e) => onUpdate(index, { ...effect, amount: Math.min(30, parseFloat(e.target.value) || 1) })} />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={effect.damage_type} onChange={(e) => onUpdate(index, { ...effect, damage_type: e.target.value as DamageType })}>
              {DAMAGE_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Rayon <span className="label-hint">(max 10)</span></label>
            <input type="number" min={1} max={10} step={0.5} value={effect.radius}
              onChange={(e) => onUpdate(index, { ...effect, radius: Math.min(10, parseFloat(e.target.value) || 1) })} />
          </div>
        </div>
      );
    default:
      return null;
  }
}

const EFFECT_PARTICLE_PATTERNS: { value: EffectParticleConfig["pattern"]; label: string }[] = [
  { value: "burst", label: "Explosion" },
  { value: "ring", label: "Anneau" },
  { value: "spiral", label: "Spirale" },
  { value: "column", label: "Colonne" },
  { value: "sphere", label: "Sphère" },
];

function renderEffectFields(
  effect: SpellEffect,
  index: number,
  onUpdate: (index: number, effect: SpellEffect) => void,
  customMobs?: MobSummary[],
) {
  const typeFields = renderEffectTypeFields(effect, index, onUpdate, customMobs);
  const p = (effect as any).particles as EffectParticleConfig | undefined;

  const toggleParticles = (enabled: boolean) => {
    if (enabled) {
      onUpdate(index, {
        ...effect,
        particles: { particle: "FLAME", count: 10, spread: 1, speed: 0.1, pattern: "burst" },
      } as any);
    } else {
      const { particles: _, ...rest } = effect as any;
      onUpdate(index, rest as SpellEffect);
    }
  };

  const updateParticles = (patch: Partial<EffectParticleConfig>) => {
    onUpdate(index, {
      ...effect,
      particles: { ...p!, ...patch },
    } as any);
  };

  return (
    <>
      {typeFields}

      {/* ── Particules d'effet (commun à tous les types) ── */}
      <div style={{ marginTop: 8, padding: "8px 10px", background: "var(--bg-tertiary, #1a1a2e)", borderRadius: 6, border: "1px solid var(--border-color, #333)" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
          <input type="checkbox" checked={!!p} onChange={(e) => toggleParticles(e.target.checked)} />
          🎆 Particules d'effet
        </label>

        {p && (
          <div style={{ marginTop: 8 }}>
            <div className="form-row-3">
              <div className="form-group">
                <label>Particule</label>
                <select value={p.particle} onChange={(e) => updateParticles({ particle: e.target.value as TrailParticle })}>
                  {TRAIL_PARTICLES.map((tp) => <option key={tp.value} value={tp.value}>{tp.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Quantité <span className="label-hint">(1—50)</span></label>
                <input type="number" min={1} max={50} step={1} value={p.count}
                  onChange={(e) => updateParticles({ count: Math.min(50, Math.max(1, parseInt(e.target.value) || 1)) })} />
              </div>
              <div className="form-group">
                <label>Motif</label>
                <select value={p.pattern} onChange={(e) => updateParticles({ pattern: e.target.value as EffectParticleConfig["pattern"] })}>
                  {EFFECT_PARTICLE_PATTERNS.map((ep) => <option key={ep.value} value={ep.value}>{ep.label}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row-3">
              <div className="form-group">
                <label>Dispersion <span className="label-hint">(0.5—10)</span></label>
                <input type="number" min={0.5} max={10} step={0.5} value={p.spread}
                  onChange={(e) => updateParticles({ spread: Math.min(10, Math.max(0.5, parseFloat(e.target.value) || 1)) })} />
              </div>
              <div className="form-group">
                <label>Vitesse <span className="label-hint">(0.01—2)</span></label>
                <input type="number" min={0.01} max={2} step={0.01} value={p.speed}
                  onChange={(e) => updateParticles({ speed: Math.min(2, Math.max(0.01, parseFloat(e.target.value) || 0.1)) })} />
              </div>
              <div className="form-group">
                <label>Son <span className="label-hint">(optionnel)</span></label>
                <select value={p.sound ?? ""} onChange={(e) => updateParticles({ sound: e.target.value || undefined })}>
                  <option value="">— Aucun —</option>
                  {SOUND_KEYS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  <input type="checkbox" checked={!!p.color}
                    onChange={(e) => {
                      if (e.target.checked) updateParticles({ color: [255, 100, 0] });
                      else updateParticles({ color: undefined, color_end: undefined });
                    }} />
                  {" "}Couleur personnalisée
                </label>
                {p.color && (
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <div>
                      <small>Début</small>
                      <input type="color"
                        value={`#${p.color.map(c => c.toString(16).padStart(2, "0")).join("")}`}
                        onChange={(e) => {
                          const hex = e.target.value;
                          updateParticles({ color: [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)] });
                        }} />
                    </div>
                    <div>
                      <small>Fin (transition)</small>
                      <input type="color"
                        value={p.color_end ? `#${p.color_end.map(c => c.toString(16).padStart(2, "0")).join("")}` : "#ffffff"}
                        onChange={(e) => {
                          const hex = e.target.value;
                          updateParticles({ color_end: [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)] });
                        }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}


