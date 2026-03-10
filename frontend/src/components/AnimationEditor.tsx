import { useCallback, useState } from "react";
import type {
  Spell, SpellAnimation, AnimationKeyframe, SpellEffect, EffectTarget,
  TrailParticle, ParticlePattern, SoundKey, BlockPlacement, PlaceableBlock, BlockPattern,
  CustomParticleConfig, PlacementEffect,
} from "../types/spell";
import {
  TRAIL_PARTICLES, PARTICLE_PATTERNS, SOUND_KEYS, EFFECT_TYPE_LABELS,
  EFFECT_TARGETS, PLACEABLE_BLOCKS, BLOCK_PATTERNS, PLACEMENT_EFFECTS,
  createDefaultKeyframe, createDefaultCustomParticle,
  DAMAGE_TYPES, STATUS_TYPES, SUMMON_TYPES,
} from "../types/spell";
import type { DamageType, StatusType, SummonType } from "../types/spell";

const MAX_KEYFRAMES = 20;
const MAX_DURATION = 30;

interface Props {
  spell: Spell;
  onChange: (spell: Spell) => void;
}

const hexToRgb = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};
const rgbToHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");

export function AnimationEditor({ spell, onChange }: Props) {
  const anim = spell.animation!;
  const [showHelp, setShowHelp] = useState(false);

  const updateAnim = useCallback(
    (key: string, value: number | boolean) => {
      onChange({ ...spell, animation: { ...anim, [key]: value } });
    },
    [spell, anim, onChange]
  );

  const updateKeyframe = useCallback(
    (index: number, kf: AnimationKeyframe) => {
      const newKfs = [...anim.keyframes];
      newKfs[index] = kf;
      onChange({ ...spell, animation: { ...anim, keyframes: newKfs } });
    },
    [spell, anim, onChange]
  );

  const addKeyframe = useCallback(
    (type: AnimationKeyframe["type"]) => {
      if (anim.keyframes.length >= MAX_KEYFRAMES) return;
      const maxTime = Math.max(0, ...anim.keyframes.map(k => k.time));
      const newKf = createDefaultKeyframe(Math.min(maxTime + 0.5, anim.duration));
      newKf.type = type;
      if (type === "effects") {
        newKf.particle_zone = undefined;
        newKf.effects = [{ type: "damage", amount: 4, damage_type: "magic" as DamageType }];
        newKf.effect_target = "target";
      } else if (type === "sound") {
        newKf.particle_zone = undefined;
        newKf.sound = { key: "ENTITY_BLAZE_SHOOT", volume: 1.0, pitch: 1.0 };
      } else if (type === "blocks") {
        newKf.particle_zone = undefined;
        newKf.blocks = { block: "stone", pattern: "flat", radius: 3, height: 1, duration: 10, breakable: true, replace_existing: false, filled: true, offset_y: 0, placement_effect: "instant", placement_speed: 0 };
      }
      onChange({ ...spell, animation: { ...anim, keyframes: [...anim.keyframes, newKf].sort((a, b) => a.time - b.time) } });
    },
    [spell, anim, onChange]
  );

  const removeKeyframe = useCallback(
    (index: number) => {
      if (anim.keyframes.length <= 1) return;
      const newKfs = anim.keyframes.filter((_, i) => i !== index);
      onChange({ ...spell, animation: { ...anim, keyframes: newKfs } });
    },
    [spell, anim, onChange]
  );

  function renderKeyframeContent(kf: AnimationKeyframe, index: number) {
    switch (kf.type) {
      case "particles": {
        const pz = kf.particle_zone!;
        return (
          <div className="kf-content">
            <div className="form-row-3">
              <div className="form-group">
                <label>Particule</label>
                <select value={pz.particle}
                  onChange={(e) => updateKeyframe(index, { ...kf, particle_zone: { ...pz, particle: e.target.value as TrailParticle } })}>
                  {TRAIL_PARTICLES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Motif</label>
                <select value={pz.pattern}
                  onChange={(e) => updateKeyframe(index, { ...kf, particle_zone: { ...pz, pattern: e.target.value as ParticlePattern } })}>
                  {PARTICLE_PATTERNS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Quantité</label>
                <input type="number" min={1} max={50} value={pz.count}
                  onChange={(e) => updateKeyframe(index, { ...kf, particle_zone: { ...pz, count: parseInt(e.target.value) || 1 } })} />
              </div>
            </div>
            <div className="form-row-3">
              <div className="form-group">
                <label>Offset X</label>
                <input type="number" min={-10} max={10} step={0.5} value={pz.offset.x}
                  onChange={(e) => updateKeyframe(index, { ...kf, particle_zone: { ...pz, offset: { ...pz.offset, x: parseFloat(e.target.value) || 0 } } })} />
              </div>
              <div className="form-group">
                <label>Offset Y</label>
                <input type="number" min={-10} max={10} step={0.5} value={pz.offset.y}
                  onChange={(e) => updateKeyframe(index, { ...kf, particle_zone: { ...pz, offset: { ...pz.offset, y: parseFloat(e.target.value) || 0 } } })} />
              </div>
              <div className="form-group">
                <label>Offset Z</label>
                <input type="number" min={-10} max={10} step={0.5} value={pz.offset.z}
                  onChange={(e) => updateKeyframe(index, { ...kf, particle_zone: { ...pz, offset: { ...pz.offset, z: parseFloat(e.target.value) || 0 } } })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Dispersion</label>
                <input type="number" min={0.1} max={10} step={0.1} value={pz.spread}
                  onChange={(e) => updateKeyframe(index, { ...kf, particle_zone: { ...pz, spread: parseFloat(e.target.value) || 0.1 } })} />
              </div>
              <div className="form-group">
                <label>Durée (s)</label>
                <input type="number" min={0.1} max={10} step={0.1} value={pz.duration}
                  onChange={(e) => updateKeyframe(index, { ...kf, particle_zone: { ...pz, duration: parseFloat(e.target.value) || 0.1 } })} />
              </div>
            </div>

            {/* Custom particle config — synced with base particle layer system */}
            <div className="particle-designer-toggle">
              <label className="checkbox-label">
                <input type="checkbox" checked={pz.custom?.enabled ?? false}
                  onChange={(e) => {
                    const custom = pz.custom ?? createDefaultCustomParticle();
                    updateKeyframe(index, { ...kf, particle_zone: { ...pz, custom: { ...custom, enabled: e.target.checked } } });
                  }} />
                ✨ Personnalisation avancée
              </label>
            </div>

            {pz.custom?.enabled && (() => {
              const cp = pz.custom!;
              const updateCp = (key: string, val: unknown) =>
                updateKeyframe(index, { ...kf, particle_zone: { ...pz, custom: { ...cp, [key]: val } } });
              return (
                <div className="particle-designer">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Taille min ({cp.size_min.toFixed(1)})</label>
                      <input type="range" min={0.1} max={5} step={0.1} value={cp.size_min}
                        onChange={(e) => updateCp("size_min", parseFloat(e.target.value))} />
                    </div>
                    <div className="form-group">
                      <label>Taille max ({cp.size_max.toFixed(1)})</label>
                      <input type="range" min={0.1} max={5} step={0.1} value={cp.size_max}
                        onChange={(e) => updateCp("size_max", parseFloat(e.target.value))} />
                    </div>
                  </div>
                  <div className="form-row-3">
                    <div className="form-group">
                      <label>Vitesse ({cp.speed.toFixed(1)})</label>
                      <input type="range" min={0} max={5} step={0.1} value={cp.speed}
                        onChange={(e) => updateCp("speed", parseFloat(e.target.value))} />
                    </div>
                    <div className="form-group">
                      <label>Gravité ({cp.gravity.toFixed(1)})</label>
                      <input type="range" min={-3} max={3} step={0.1} value={cp.gravity}
                        onChange={(e) => updateCp("gravity", parseFloat(e.target.value))} />
                    </div>
                    <div className="form-group">
                      <label>Dispersion ({cp.spread.toFixed(1)})</label>
                      <input type="range" min={0} max={5} step={0.1} value={cp.spread}
                        onChange={(e) => updateCp("spread", parseFloat(e.target.value))} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Durée ({cp.lifetime.toFixed(1)}s)</label>
                      <input type="range" min={0.1} max={5} step={0.1} value={cp.lifetime}
                        onChange={(e) => updateCp("lifetime", parseFloat(e.target.value))} />
                    </div>
                    <div className="form-group">
                      <label>Densité ({cp.density})</label>
                      <input type="range" min={1} max={30} step={1} value={cp.density}
                        onChange={(e) => updateCp("density", parseInt(e.target.value))} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Couleur début</label>
                      <input type="color"
                        value={rgbToHex(cp.color_start[0], cp.color_start[1], cp.color_start[2])}
                        onChange={(e) => updateCp("color_start", hexToRgb(e.target.value))} />
                    </div>
                    <div className="form-group">
                      <label>Couleur fin</label>
                      <input type="color"
                        value={rgbToHex(cp.color_end[0], cp.color_end[1], cp.color_end[2])}
                        onChange={(e) => updateCp("color_end", hexToRgb(e.target.value))} />
                    </div>
                    <div className="form-group">
                      <label>Motif avancé</label>
                      <select value={cp.pattern}
                        onChange={(e) => updateCp("pattern", e.target.value as ParticlePattern)}>
                        {PARTICLE_PATTERNS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="particle-color-preview">
                    <div className="color-gradient"
                      style={{ background: `linear-gradient(90deg, rgb(${cp.color_start.join(",")}), rgb(${cp.color_end.join(",")}))` }} />
                    <span className="color-gradient-label">Dégradé de couleur</span>
                    {pz.particle !== "DUST" && pz.particle !== "DUST_COLOR_TRANSITION" && (
                      <span className="label-hint" style={{ display: 'block', marginTop: 4, color: 'var(--accent)' }}>
                        ℹ️ Le dégradé ne fonctionne qu'avec DUST / DUST_COLOR_TRANSITION.
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        );
      }
      case "effects": {
        const effects = kf.effects ?? [];
        return (
          <div className="kf-content">
            <div className="form-group">
              <label>Cible</label>
              <select value={kf.effect_target ?? "target"}
                onChange={(e) => updateKeyframe(index, { ...kf, effect_target: e.target.value as EffectTarget })}>
                {EFFECT_TARGETS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            {effects.map((eff, ei) => {
              const info = EFFECT_TYPE_LABELS[eff.type];
              return (
                <div className="kf-effect-item" key={ei}>
                  <div className="effect-header">
                    <span className="effect-type-badge" style={{ backgroundColor: info.color + "22", color: info.color, borderColor: info.color + "44" }}>
                      {info.icon} {info.label}
                    </span>
                    <button className="btn btn-danger btn-sm" onClick={() => {
                      const newEffects = effects.filter((_, i) => i !== ei);
                      updateKeyframe(index, { ...kf, effects: newEffects });
                    }}>✕</button>
                  </div>
                  {renderKfEffectFields(eff, index, ei)}
                </div>
              );
            })}
            {effects.length < 4 && (
              <div className="kf-add-effect">
                <select onChange={(e) => {
                  if (!e.target.value) return;
                  const type = e.target.value as SpellEffect["type"];
                  const eff = createKfDefaultEffect(type);
                  updateKeyframe(index, { ...kf, effects: [...effects, eff] });
                  e.target.value = "";
                }}>
                  <option value="">+ Ajouter un effet...</option>
                  {(Object.keys(EFFECT_TYPE_LABELS) as SpellEffect["type"][]).map((t) => (
                    <option key={t} value={t}>{EFFECT_TYPE_LABELS[t].icon} {EFFECT_TYPE_LABELS[t].label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        );
      }
      case "sound":
        return (
          <div className="kf-content">
            <div className="form-group">
              <label>Son</label>
              <select value={kf.sound?.key ?? "ENTITY_BLAZE_SHOOT"}
                onChange={(e) => updateKeyframe(index, { ...kf, sound: { ...(kf.sound ?? { key: "ENTITY_BLAZE_SHOOT" as SoundKey, volume: 1, pitch: 1 }), key: e.target.value as SoundKey } })}>
                {SOUND_KEYS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Volume ({(kf.sound?.volume ?? 1).toFixed(1)})</label>
                <input type="range" min={0} max={2} step={0.1} value={kf.sound?.volume ?? 1}
                  onChange={(e) => updateKeyframe(index, { ...kf, sound: { ...(kf.sound!), volume: parseFloat(e.target.value) } })} />
              </div>
              <div className="form-group">
                <label>Pitch ({(kf.sound?.pitch ?? 1).toFixed(1)})</label>
                <input type="range" min={0.5} max={2} step={0.1} value={kf.sound?.pitch ?? 1}
                  onChange={(e) => updateKeyframe(index, { ...kf, sound: { ...(kf.sound!), pitch: parseFloat(e.target.value) } })} />
              </div>
            </div>
          </div>
        );
      case "blocks": {
        const bp = kf.blocks!;
        const updateBP = (patch: Partial<BlockPlacement>) => updateKeyframe(index, { ...kf, blocks: { ...bp, ...patch } });
        const selectedPattern = BLOCK_PATTERNS.find((p) => p.value === bp.pattern);
        // Group blocks by category
        const blockCategories = PLACEABLE_BLOCKS.reduce<Record<string, typeof PLACEABLE_BLOCKS>>((acc, b) => {
          if (!acc[b.category]) acc[b.category] = [];
          acc[b.category].push(b);
          return acc;
        }, {});
        return (
          <div className="kf-content">
            <div className="form-row">
              <div className="form-group">
                <label>Bloc</label>
                <select value={bp.block}
                  onChange={(e) => updateBP({ block: e.target.value as PlaceableBlock })}>
                  {Object.entries(blockCategories).map(([cat, blocks]) => (
                    <optgroup key={cat} label={cat}>
                      {blocks.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Motif</label>
                <select value={bp.pattern}
                  onChange={(e) => {
                    const newPattern = e.target.value as BlockPattern;
                    const patternInfo = BLOCK_PATTERNS.find((p) => p.value === newPattern);
                    const patch: Partial<BlockPlacement> = { pattern: newPattern };
                    if (patternInfo?.supportsFilled) {
                      patch.filled = newPattern !== 'cage';
                    }
                    updateBP(patch);
                  }}>
                  {BLOCK_PATTERNS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
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
            {/* Placement effect */}
            <div className="form-row">
              <div className="form-group">
                <label>🎬 Effet d'apparition</label>
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
              </div>
              {(bp.placement_effect ?? "instant") !== "instant" && (
                <div className="form-group">
                  <label>Vitesse <span className="label-hint">(s)</span></label>
                  <input type="number" min={0.5} max={30} step={0.5} value={bp.placement_speed ?? 2}
                    onChange={(e) => updateBP({ placement_speed: Math.max(0.5, Math.min(30, parseFloat(e.target.value) || 2)) })} />
                </div>
              )}
            </div>
            {selectedPattern?.supportsFilled && (
              <div className="form-group filled-toggle" style={{ marginTop: 4, padding: '6px 10px', background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <label className="checkbox-label">
                  <input type="checkbox" checked={bp.filled ?? true}
                    onChange={(e) => updateBP({ filled: e.target.checked })} />
                  {bp.filled ?? true ? '🟥 Rempli' : '⬜ Creux'}
                </label>
              </div>
            )}
            <div className="form-row" style={{ marginTop: 4 }}>
              <label className="checkbox-label">
                <input type="checkbox" checked={bp.breakable}
                  onChange={(e) => updateBP({ breakable: e.target.checked })} />
                Cassable
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={bp.replace_existing}
                  onChange={(e) => updateBP({ replace_existing: e.target.checked })} />
                Remplacer blocs existants
              </label>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  }

  function renderKfEffectFields(effect: SpellEffect, kfIndex: number, effectIndex: number) {
    const updateEff = (eff: SpellEffect) => {
      const kf = anim.keyframes[kfIndex];
      const newEffects = [...(kf.effects ?? [])];
      newEffects[effectIndex] = eff;
      updateKeyframe(kfIndex, { ...kf, effects: newEffects });
    };

    switch (effect.type) {
      case "damage":
        return (
          <div className="form-row">
            <div className="form-group">
              <label>Dégâts</label>
              <input type="number" min={0.5} max={50} step={0.5} value={effect.amount}
                onChange={(e) => updateEff({ ...effect, amount: Math.min(50, parseFloat(e.target.value) || 0.5) })} />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={effect.damage_type}
                onChange={(e) => updateEff({ ...effect, damage_type: e.target.value as DamageType })}>
                {DAMAGE_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>
        );
      case "heal":
        return (
          <div className="form-group">
            <label>Points de vie</label>
            <input type="number" min={0.5} max={40} step={0.5} value={effect.amount}
              onChange={(e) => updateEff({ ...effect, amount: Math.min(40, parseFloat(e.target.value) || 0.5) })} />
          </div>
        );
      case "status":
        return (
          <div className="form-row">
            <div className="form-group">
              <label>Statut</label>
              <select value={effect.status}
                onChange={(e) => updateEff({ ...effect, status: e.target.value as StatusType })}>
                {STATUS_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Amplificateur <span className="label-hint">(max 4)</span></label>
              <input type="number" min={0} max={4} step={1} value={effect.amplifier}
                onChange={(e) => updateEff({ ...effect, amplifier: Math.min(4, Math.max(0, parseInt(e.target.value) || 0)) })} />
            </div>
            <div className="form-group">
              <label>Durée</label>
              <input type="number" min={0.5} max={30} step={0.5} value={effect.duration}
                onChange={(e) => updateEff({ ...effect, duration: Math.min(30, parseFloat(e.target.value) || 0.5) })} />
            </div>
          </div>
        );
      case "knockback":
      case "pull":
        return (
          <div className="form-group">
            <label>Force</label>
            <input type="number" min={0.1} max={10} step={0.1} value={effect.strength}
              onChange={(e) => updateEff({ ...effect, strength: Math.min(10, parseFloat(e.target.value) || 0.1) })} />
          </div>
        );
      case "shield":
      case "reflect_shield":
        return (
          <div className="form-row">
            <div className="form-group">
              <label>{effect.type === "reflect_shield" ? "Réflexion" : "Bouclier"}</label>
              <input type="number" min={1} max={30} step={1} value={effect.amount}
                onChange={(e) => updateEff({ ...effect, amount: Math.min(30, parseFloat(e.target.value) || 1) })} />
            </div>
            <div className="form-group">
              <label>Durée</label>
              <input type="number" min={1} max={30} step={1} value={effect.duration}
                onChange={(e) => updateEff({ ...effect, duration: Math.min(30, parseFloat(e.target.value) || 1) })} />
            </div>
          </div>
        );
      case "lifedrain":
        return (
          <div className="form-group">
            <label>Dégâts/Soin</label>
            <input type="number" min={0.5} max={30} step={0.5} value={effect.amount}
              onChange={(e) => updateEff({ ...effect, amount: Math.min(30, parseFloat(e.target.value) || 0.5) })} />
          </div>
        );
      case "teleport":
        return (
          <div className="form-group">
            <label>Distance</label>
            <input type="number" min={1} max={30} step={1} value={effect.distance}
              onChange={(e) => updateEff({ ...effect, distance: Math.min(30, parseFloat(e.target.value) || 1) })} />
          </div>
        );
      case "launch":
        return (
          <div className="form-group">
            <label>Hauteur</label>
            <input type="number" min={0.5} max={15} step={0.5} value={effect.height}
              onChange={(e) => updateEff({ ...effect, height: Math.min(15, parseFloat(e.target.value) || 0.5) })} />
          </div>
        );
      case "speed_boost":
        return (
          <div className="form-row">
            <div className="form-group">
              <label>Multiplicateur</label>
              <input type="number" min={1} max={5} step={0.1} value={effect.multiplier}
                onChange={(e) => updateEff({ ...effect, multiplier: parseFloat(e.target.value) || 1 })} />
            </div>
            <div className="form-group">
              <label>Durée</label>
              <input type="number" min={1} max={20} step={1} value={effect.duration}
                onChange={(e) => updateEff({ ...effect, duration: Math.min(20, parseFloat(e.target.value) || 1) })} />
            </div>
          </div>
        );
      case "aoe_dot":
      case "poison_cloud":
        return (
          <div className="form-row">
            <div className="form-group">
              <label>Dégâts/tick</label>
              <input type="number" min={0.5} max={20} step={0.5} value={effect.amount}
                onChange={(e) => updateEff({ ...effect, amount: Math.min(20, parseFloat(e.target.value) || 0.5) })} />
            </div>
            <div className="form-group">
              <label>Durée</label>
              <input type="number" min={1} max={30} step={1} value={effect.duration}
                onChange={(e) => updateEff({ ...effect, duration: Math.min(30, parseFloat(e.target.value) || 1) })} />
            </div>
          </div>
        );
      case "chain":
        return (
          <div className="form-row">
            <div className="form-group">
              <label>Dégâts</label>
              <input type="number" min={0.5} max={30} step={0.5} value={effect.amount}
                onChange={(e) => updateEff({ ...effect, amount: Math.min(30, parseFloat(e.target.value) || 0.5) })} />
            </div>
            <div className="form-group">
              <label>Cibles max</label>
              <input type="number" min={1} max={8} step={1} value={effect.max_targets}
                onChange={(e) => updateEff({ ...effect, max_targets: parseInt(e.target.value) || 1 })} />
            </div>
          </div>
        );
      case "summon":
        return (
          <div className="form-row-3">
            <div className="form-group">
              <label>Entité</label>
              <select value={effect.entity_type}
                onChange={(e) => updateEff({ ...effect, entity_type: e.target.value as SummonType })}>
                {SUMMON_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Nombre</label>
              <input type="number" min={1} max={5} step={1} value={effect.count}
                onChange={(e) => updateEff({ ...effect, count: parseInt(e.target.value) || 1 })} />
            </div>
            <div className="form-group">
              <label>Durée</label>
              <input type="number" min={5} max={60} step={5} value={effect.duration}
                onChange={(e) => updateEff({ ...effect, duration: parseFloat(e.target.value) || 5 })} />
            </div>
          </div>
        );
      case "meteor":
        return (
          <div className="form-row">
            <div className="form-group">
              <label>Dégâts</label>
              <input type="number" min={1} max={25} step={1} value={effect.amount}
                onChange={(e) => updateEff({ ...effect, amount: Math.min(25, parseFloat(e.target.value) || 1) })} />
            </div>
            <div className="form-group">
              <label>Rayon</label>
              <input type="number" min={1} max={10} step={1} value={effect.radius}
                onChange={(e) => updateEff({ ...effect, radius: Math.min(10, parseInt(e.target.value) || 1) })} />
            </div>
          </div>
        );
      case "earthquake":
        return (
          <div className="form-row-3">
            <div className="form-group">
              <label>Dégâts</label>
              <input type="number" min={1} max={25} step={1} value={effect.amount}
                onChange={(e) => updateEff({ ...effect, amount: Math.min(25, parseFloat(e.target.value) || 1) })} />
            </div>
            <div className="form-group">
              <label>Rayon</label>
              <input type="number" min={1} max={10} step={1} value={effect.radius}
                onChange={(e) => updateEff({ ...effect, radius: Math.min(10, parseInt(e.target.value) || 1) })} />
            </div>
            <div className="form-group">
              <label>Durée</label>
              <input type="number" min={1} max={10} step={1} value={effect.duration ?? 3}
                onChange={(e) => updateEff({ ...effect, duration: Math.min(10, parseInt(e.target.value) || 1) })} />
            </div>
          </div>
        );
      case "gravity_well":
      case "vampiric_aura":
        return (
          <div className="form-row-3">
            <div className="form-group">
              <label>{effect.type === "gravity_well" ? "Force" : "Drain/s"}</label>
              <input type="number" min={0.5} max={5} step={0.5} value={effect.type === "gravity_well" ? effect.strength : effect.amount}
                onChange={(e) => {
                  const val = Math.min(5, parseFloat(e.target.value) || 0.5);
                  updateEff(effect.type === "gravity_well" ? { ...effect, strength: val } : { ...effect, amount: val });
                }} />
            </div>
            <div className="form-group">
              <label>Rayon</label>
              <input type="number" min={1} max={10} step={1} value={effect.radius}
                onChange={(e) => updateEff({ ...effect, radius: Math.min(10, parseInt(e.target.value) || 1) })} />
            </div>
            <div className="form-group">
              <label>Durée</label>
              <input type="number" min={1} max={15} step={1} value={effect.duration}
                onChange={(e) => updateEff({ ...effect, duration: Math.min(15, parseInt(e.target.value) || 1) })} />
            </div>
          </div>
        );
      case "blind_flash":
      case "ignite_area":
      case "freeze_area":
      case "time_warp":
        return (
          <div className="form-row">
            <div className="form-group">
              <label>Rayon</label>
              <input type="number" min={1} max={15} step={1} value={effect.radius}
                onChange={(e) => updateEff({ ...effect, radius: Math.min(15, parseInt(e.target.value) || 1) })} />
            </div>
            <div className="form-group">
              <label>Durée</label>
              <input type="number" min={1} max={20} step={1} value={effect.duration}
                onChange={(e) => updateEff({ ...effect, duration: Math.min(20, parseInt(e.target.value) || 1) })} />
            </div>
          </div>
        );
      case "cleanse":
        return <p className="effect-desc">Retire tous les effets négatifs.</p>;
      case "swap":
        return <p className="effect-desc">Échange les positions.</p>;
      case "decoy":
        return <p className="effect-desc">Crée un leurre attirant les mobs.</p>;
      default: {
        const t = (effect as any).type as string;
        return <p className="effect-desc">{(EFFECT_TYPE_LABELS as any)[t]?.label ?? t}</p>;
      }
    }
  }

  const kfTypeLabels: Record<AnimationKeyframe["type"], { icon: string; label: string; color: string }> = {
    particles: { icon: "✨", label: "Particules", color: "#a855f7" },
    effects:   { icon: "⚔️", label: "Effets",     color: "#ef4444" },
    sound:     { icon: "🔊", label: "Son",        color: "#3b82f6" },
    blocks:    { icon: "🧱", label: "Blocs",      color: "#f97316" },
  };

  return (
    <div className="card animation-editor">
      <div className="anim-header-row">
        <h2>🎬 Éditeur d'Animation</h2>
        <button className="btn btn-outline btn-sm" onClick={() => setShowHelp(!showHelp)} type="button">
          {showHelp ? "✕ Fermer" : "❓ Aide"}
        </button>
      </div>

      {showHelp && (
        <div className="anim-help-box">
          <p><strong>Comment ça marche ?</strong></p>
          <ul>
            <li><strong>✨ Particules</strong> — Spawn de particules à un moment précis avec position, motif et dispersion</li>
            <li><strong>⚔️ Effets</strong> — Applique des effets de sort (dégâts, soins, statuts...) à un instant T</li>
            <li><strong>🔊 Son</strong> — Joue un son Minecraft avec volume et pitch personnalisés</li>
            <li><strong>🧱 Blocs</strong> — Place des blocs temporaires avec un motif configurable</li>
          </ul>
          <p>Chaque keyframe se déclenche au temps indiqué (T=). La timeline les trie automatiquement.</p>
        </div>
      )}

      {/* Timeline controls */}
      <div className="form-row">
        <div className="form-group">
          <label>Durée totale (max {MAX_DURATION}s)</label>
          <input type="number" min={0.5} max={MAX_DURATION} step={0.5} value={anim.duration}
            onChange={(e) => updateAnim("duration", Math.min(MAX_DURATION, parseFloat(e.target.value) || 0.5))} />
        </div>
        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={anim.loop}
              onChange={(e) => updateAnim("loop", e.target.checked)} />
            Boucle
          </label>
        </div>
        {anim.loop && (
          <div className="form-group">
            <label>Répétitions (0=∞)</label>
            <input type="number" min={0} max={20} step={1} value={anim.loop_count}
              onChange={(e) => updateAnim("loop_count", parseInt(e.target.value) || 0)} />
          </div>
        )}
      </div>

      {/* Visual timeline bar */}
      <div className="timeline-bar">
        <div className="timeline-track">
          {/* Time scale markers */}
          {Array.from({ length: Math.min(11, Math.ceil(anim.duration) + 1) }).map((_, i) => {
            const t = (i / Math.min(10, Math.ceil(anim.duration))) * anim.duration;
            const left = (t / anim.duration) * 100;
            return (
              <div key={`scale-${i}`} className="timeline-scale-mark" style={{ left: `${left}%` }}>
                <span className="timeline-scale-label">{t.toFixed(1)}s</span>
              </div>
            );
          })}
          {anim.keyframes.map((kf, i) => {
            const left = (kf.time / anim.duration) * 100;
            const info = kfTypeLabels[kf.type];
            return (
              <div key={kf.id} className="timeline-marker"
                style={{ left: `${Math.min(98, Math.max(1, left))}%`, borderColor: info.color, backgroundColor: info.color + "33" }}
                title={`${info.icon} ${info.label} @ ${kf.time.toFixed(1)}s`}>
                <span className="timeline-marker-icon">{info.icon}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Keyframes list */}
      <div className="keyframes-list">
        {anim.keyframes.map((kf, index) => {
          const info = kfTypeLabels[kf.type];
          return (
            <div className="keyframe-item" key={kf.id}>
              <div className="keyframe-header">
                <span className="kf-type-badge" style={{ backgroundColor: info.color + "22", color: info.color, borderColor: info.color + "44" }}>
                  {info.icon} {info.label}
                </span>
                <div className="form-group kf-time-input">
                  <label>T=</label>
                  <input type="number" min={0} max={anim.duration} step={0.1} value={kf.time}
                    onChange={(e) => {
                      const t = Math.min(anim.duration, Math.max(0, parseFloat(e.target.value) || 0));
                      const newKfs = [...anim.keyframes];
                      newKfs[index] = { ...kf, time: t };
                      newKfs.sort((a, b) => a.time - b.time);
                      onChange({ ...spell, animation: { ...anim, keyframes: newKfs } });
                    }} />
                  <span className="kf-time-unit">s</span>
                </div>
                {anim.keyframes.length > 1 && (
                  <button className="btn btn-danger btn-sm" onClick={() => removeKeyframe(index)}>✕</button>
                )}
              </div>
              {renderKeyframeContent(kf, index)}
            </div>
          );
        })}
      </div>

      {/* Add keyframe buttons */}
      {anim.keyframes.length < MAX_KEYFRAMES && (
        <div className="kf-add-buttons">
          <span className="kf-add-title">Ajouter un keyframe :</span>
          {(Object.keys(kfTypeLabels) as AnimationKeyframe["type"][]).map((type) => {
            const info = kfTypeLabels[type];
            return (
              <button key={type} className="btn btn-outline btn-sm"
                style={{ borderColor: info.color + "66", color: info.color }}
                onClick={() => addKeyframe(type)}>
                {info.icon} {info.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function createKfDefaultEffect(type: SpellEffect["type"]): SpellEffect {
  switch (type) {
    case "damage": return { type: "damage", amount: 4, damage_type: "magic" as DamageType };
    case "heal": return { type: "heal", amount: 4 };
    case "status": return { type: "status", status: "burn", duration: 3, amplifier: 0 };
    case "knockback": return { type: "knockback", strength: 1.5 };
    case "pull": return { type: "pull", strength: 1.5 };
    case "shield": return { type: "shield", amount: 6, duration: 5 };
    case "lifedrain": return { type: "lifedrain", amount: 4 };
    case "teleport": return { type: "teleport", distance: 8 };
    case "launch": return { type: "launch", height: 3 };
    case "speed_boost": return { type: "speed_boost", multiplier: 1.5, duration: 5 };
    case "aoe_dot": return { type: "aoe_dot", amount: 2, duration: 5, tick_rate: 1, damage_type: "fire" as DamageType };
    case "chain": return { type: "chain", amount: 4, damage_type: "lightning" as DamageType, max_targets: 3, chain_range: 5 };
    case "summon": return { type: "summon", entity_type: "wolf", count: 1, duration: 15 };
    case "cleanse": return { type: "cleanse" };
    case "ignite_area": return { type: "ignite_area", radius: 3, duration: 5 };
    case "freeze_area": return { type: "freeze_area", radius: 3, duration: 5 };
    case "swap": return { type: "swap" };
    case "meteor": return { type: "meteor", amount: 10, damage_type: "fire" as DamageType, radius: 4 };
    case "gravity_well": return { type: "gravity_well", strength: 2, radius: 5, duration: 5 };
    case "poison_cloud": return { type: "poison_cloud", amount: 2, radius: 4, duration: 8, tick_rate: 1 };
    case "blind_flash": return { type: "blind_flash", radius: 6, duration: 3 };
    case "earthquake": return { type: "earthquake", amount: 6, radius: 5, duration: 3 };
    case "vampiric_aura": return { type: "vampiric_aura", amount: 2, radius: 5, duration: 10 };
    case "reflect_shield": return { type: "reflect_shield", duration: 5, amount: 4 };
    case "decoy": return { type: "decoy" };
    case "time_warp": return { type: "time_warp", radius: 5, duration: 4 };
    default: return { type: "damage", amount: 4, damage_type: "magic" as DamageType };
  }
}
