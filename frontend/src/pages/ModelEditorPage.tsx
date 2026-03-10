import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CustomModel, ModelPart, MobAnimation, AnimationKeyframe, Hitbox, PartType,
  ModelCategory, ModelSummary, SpellModelReference,
  createDefaultModel,
  MODEL_CATEGORIES, AUTO_ROTATE_AXES, COMMON_BLOCKS, BLOCK_CATEGORIES,
} from "../types/model";
import {
  createDefaultPart, createDefaultAnimation, createDefaultKeyframe,
  createDefaultHitbox, PART_TYPES,
} from "../types/mob";
import { listModels, loadModel, saveModel, deleteModel, checkHealth } from "../api/client";
import { MobViewer3D, ViewerToolbar, getAnimatedPose, type TransformMode } from "../components/mob-viewer";
import { AnimationTimeline } from "../components/mob-viewer/AnimationTimeline";
import { importBlockbenchModel, readFileAsText } from "../utils/blockbench-importer";

const LOCAL_STORAGE_KEY = "model-editor-draft";

// ══════════════════════════════════════════
// Collapsible Section
// ══════════════════════════════════════════

function CollapsibleSection({ title, icon, defaultOpen = false, badge, children }: {
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

// ══════════════════════════════════════════
// Vec3 Editor
// ══════════════════════════════════════════

function Vec3Input({ label, value, onChange, step = 0.1 }: {
  label: string; value: [number, number, number]; onChange: (v: [number, number, number]) => void; step?: number;
}) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <div style={{ display: "flex", gap: 6 }}>
        {["X", "Y", "Z"].map((axis, i) => (
          <div key={axis} style={{ flex: 1 }}>
            <label style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{axis}</label>
            <input type="number" step={step} value={value[i]}
              onChange={e => {
                const v: [number, number, number] = [...value];
                v[i] = parseFloat(e.target.value) || 0;
                onChange(v);
              }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// MODEL EDITOR PAGE
// ══════════════════════════════════════════

export function ModelEditorPage() {
  const [mode, setMode] = useState<"list" | "edit">("list");
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [model, setModel] = useState<CustomModel>(createDefaultModel());
  const [serverOnline, setServerOnline] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // ── 3D Viewer State ──
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);
  const [transformMode, setTransformMode] = useState<TransformMode>("translate");
  const [animationState, setAnimationState] = useState({
    playing: false, animationId: null as string | null, currentTick: 0, speed: 1,
  });
  const [selectedKeyframe, setSelectedKeyframe] = useState<{ animIdx: number; kfIdx: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHitboxes, setShowHitboxes] = useState(false);
  const [blockCategory, setBlockCategory] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  // Grouped parts
  const partGroups = useMemo(() => {
    const groups: Record<string, ModelPart[]> = {};
    for (const part of model.parts) {
      const g = part.group || "";
      if (!groups[g]) groups[g] = [];
      groups[g].push(part);
    }
    return groups;
  }, [model.parts]);

  const groupNames = useMemo(() => {
    const names = Object.keys(partGroups).sort((a, b) => {
      if (a === "") return 1;
      if (b === "") return -1;
      return a.localeCompare(b);
    });
    return names;
  }, [partGroups]);

  const filteredBlocks = useMemo(() => {
    if (!blockCategory) return [...COMMON_BLOCKS];
    const cat = BLOCK_CATEGORIES.find(c => c.label === blockCategory);
    if (!cat) return [...COMMON_BLOCKS];
    const prefixes = cat.prefix.split("|");
    return COMMON_BLOCKS.filter(b => {
      const name = b.replace("minecraft:", "");
      return prefixes.some(p => name.includes(p));
    });
  }, [blockCategory]);

  // Keyboard shortcuts
  useEffect(() => {
    if (mode !== "edit") return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key.toLowerCase()) {
        case "g": setTransformMode("translate"); break;
        case "r": setTransformMode("rotate"); break;
        case "s": setTransformMode("scale"); break;
        case "escape": setSelectedPartIds([]); setSelectedKeyframe(null); break;
        case "delete": case "backspace":
          if (selectedPartIds.length > 0) {
            setModel(prev => ({ ...prev, parts: prev.parts.filter(p => !selectedPartIds.includes(p.id)) }));
            setSelectedPartIds([]);
          }
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, selectedPartIds]);

  // Load list
  useEffect(() => {
    checkHealth().then(ok => setServerOnline(ok));
    listModels().then(res => { if (res.ok) setModels(res.models); });
    // Load draft
    const draft = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (draft) {
      try { setModel(JSON.parse(draft)); } catch { /* ignore */ }
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (mode === "edit") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(model));
    }
  }, [model, mode]);

  // Message auto-dismiss
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const handleSave = useCallback(async () => {
    if (!serverOnline) { setMessage({ text: "Serveur hors-ligne", type: "error" }); return; }
    setSaving(true);
    const result = await saveModel(model);
    if (result.ok) {
      setMessage({ text: "Modèle sauvegardé !", type: "success" });
      const list = await listModels();
      if (list.ok) setModels(list.models);
    } else {
      setMessage({ text: result.error || "Erreur", type: "error" });
    }
    setSaving(false);
  }, [serverOnline, model]);

  const handleLoad = useCallback(async (id: string) => {
    const result = await loadModel(id);
    if (result.ok && result.model) {
      setModel(result.model);
      setMode("edit");
      setSelectedPartIds([]);
      setSelectedKeyframe(null);
    } else {
      setMessage({ text: result.error || "Erreur de chargement", type: "error" });
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Supprimer ce modèle ?")) return;
    const result = await deleteModel(id);
    if (result.ok) {
      setModels(prev => prev.filter(m => m.id !== id));
      setMessage({ text: "Modèle supprimé", type: "success" });
    }
  }, []);

  const handleNew = useCallback(() => {
    setModel(createDefaultModel());
    setMode("edit");
    setSelectedPartIds([]);
    setSelectedKeyframe(null);
  }, []);

  const handleImportBB = useCallback(async (file: File) => {
    try {
      const text = await readFileAsText(file);
      const { parts, animations } = importBlockbenchModel(text);
      setModel(prev => ({
        ...prev,
        parts: [...prev.parts, ...parts],
        animations: [...prev.animations, ...animations],
      }));
      setImportMessage(`Importé : ${parts.length} parts, ${animations.length} animations`);
      setTimeout(() => setImportMessage(null), 3000);
    } catch (e: any) {
      setImportMessage("Erreur d'import : " + e.message);
    }
  }, []);

  // ── Part update helpers ──
  const updatePart = useCallback((id: string, changes: Partial<ModelPart>) => {
    setModel(prev => ({
      ...prev,
      parts: prev.parts.map(p => p.id === id ? { ...p, ...changes } : p),
    }));
  }, []);

  const updateAnim = useCallback((idx: number, changes: Partial<MobAnimation>) => {
    setModel(prev => ({
      ...prev,
      animations: prev.animations.map((a, i) => i === idx ? { ...a, ...changes } : a),
    }));
  }, []);

  // ── Viewer action callbacks (add elements from 3D editor) ──
  const handleAddPartFromViewer = useCallback((type: string) => {
    const newPart = createDefaultPart();
    newPart.type = type as PartType;
    newPart.block = type === "text_display" ? "Texte"
      : type === "item_display" ? "minecraft:diamond_sword"
      : "minecraft:stone";
    if (selectedPartIds.length > 0) {
      const sel = model.parts.find(p => p.id === selectedPartIds[0]);
      if (sel) {
        newPart.offset = [sel.offset[0] + 1, sel.offset[1], sel.offset[2]];
        newPart.group = sel.group;
      }
    }
    setModel(prev => ({ ...prev, parts: [...prev.parts, newPart] }));
    setSelectedPartIds([newPart.id]);
    setMessage({ text: `🧊 Part "${newPart.name}" ajoutée`, type: "success" });
    setTimeout(() => setMessage(null), 2000);
  }, [selectedPartIds, model.parts]);

  const handleAddKeyframeFromViewer = useCallback(() => {
    if (selectedPartIds.length === 0 || !animationState.animationId) return;
    const parts = model.parts.filter(p => selectedPartIds.includes(p.id));
    if (parts.length === 0) return;
    const animIdx = model.animations.findIndex(a => a.id === animationState.animationId);
    if (animIdx === -1) return;
    const currentAnim = model.animations[animIdx];
    const newKf = createDefaultKeyframe(selectedPartIds, animationState.currentTick);
    // Use the animated pose at the current tick if available, otherwise fall back to base transform
    const refPart = parts[0];
    const pose = getAnimatedPose(currentAnim, refPart.id, animationState.currentTick);
    newKf.position = pose?.position ? [...pose.position] : [...refPart.offset];
    newKf.rotation = pose?.rotation ? [...pose.rotation] : [...refPart.rotation];
    newKf.scale = pose?.scale ? [...pose.scale] : [...refPart.scale];
    const animations = [...model.animations];
    animations[animIdx] = {
      ...animations[animIdx],
      keyframes: [...animations[animIdx].keyframes, newKf],
    };
    setModel(prev => ({ ...prev, animations }));
    setMessage({ text: `🔑 Keyframe ajoutée au tick ${animationState.currentTick}`, type: "success" });
    setTimeout(() => setMessage(null), 3000);
  }, [selectedPartIds, animationState, model.parts, model.animations]);

  const handleAddAnimationFromViewer = useCallback(() => {
    const newAnim = createDefaultAnimation();
    setModel(prev => ({ ...prev, animations: [...prev.animations, newAnim] }));
    setAnimationState(prev => ({ ...prev, animationId: newAnim.id, playing: false, currentTick: 0 }));
    setMessage({ text: "🎬 Animation créée", type: "success" });
    setTimeout(() => setMessage(null), 2000);
  }, []);

  const handleAddHitboxFromViewer = useCallback(() => {
    const newHb = createDefaultHitbox();
    setModel(prev => ({
      ...prev,
      hitbox: { ...prev.hitbox, custom_hitboxes: [...(prev.hitbox.custom_hitboxes || []), newHb] },
    }));
    setShowHitboxes(true);
    setMessage({ text: "🟢 Hitbox ajoutée", type: "success" });
    setTimeout(() => setMessage(null), 2000);
  }, []);

  // Pass mob-compatible data to the 3D viewer
  const viewerMobData = useMemo(() => ({
    meta: model.meta as any,
    stats: { max_health: 20, move_speed: 0.25, attack_damage: 0, detection_range: 16, armor: 0, knockback_resistance: 0, base_mob_type: "zombie", scale: model.config.scale },
    parts: model.parts,
    animations: model.animations,
    attacks: [],
    behavior: { hostile: false, passive: true, neutral: false, wandering: false, wander_radius: 0, can_burn: false, can_drown: false, show_health_bar: false, name_color: "#ffffff", boss: false, boss_bar_range: 0, ai_rules: [] },
    loot: [],
    sounds: { ambient: null, hurt: null, death: null },
    hitboxes: model.hitbox.custom_hitboxes,
  }), [model]);

  // Filtered models list
  const filteredModels = useMemo(() => {
    if (filterCategory === "all") return models;
    return models.filter(m => m.category === filterCategory);
  }, [models, filterCategory]);

  // ══════════════════════════════════════════
  // RENDER — LIST MODE
  // ══════════════════════════════════════════

  if (mode === "list") {
    return (
      <div className="editor-page">
        <div className="editor-header">
          <h1>🎨 Éditeur de Modèles</h1>
          <p className="header-subtitle">Créez des entités visuelles réutilisables dans vos sorts</p>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={handleNew}>+ Nouveau Modèle</button>
            <span className={`server-status ${serverOnline ? "online" : "offline"}`}>
              {serverOnline ? "🟢 Serveur connecté" : "🔴 Serveur hors-ligne"}
            </span>
          </div>
        </div>

        {message && <div className={`status-message ${message.type}`}>{message.text}</div>}

        {/* Category filter */}
        <div className="filter-bar" style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <button className={`btn btn-sm ${filterCategory === "all" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilterCategory("all")}>Tous</button>
          {MODEL_CATEGORIES.map(cat => (
            <button key={cat.value}
              className={`btn btn-sm ${filterCategory === cat.value ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setFilterCategory(cat.value)}>
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        <div className="mob-grid">
          {filteredModels.length === 0 && (
            <div className="empty-state">
              <p>Aucun modèle trouvé. Créez votre premier modèle !</p>
            </div>
          )}
          {filteredModels.map(m => (
            <div key={m.id} className="mob-card">
              <div className="mob-card-header">
                <span className="mob-card-icon">
                  {MODEL_CATEGORIES.find(c => c.value === m.category)?.icon || "📦"}
                </span>
                <h3>{m.name}</h3>
              </div>
              <div className="mob-card-body">
                <p className="mob-card-desc">{m.description || "Pas de description"}</p>
                <div className="mob-card-stats">
                  <span>🧱 {m.parts_count} parts</span>
                  <span>🎬 {m.animations_count} anims</span>
                  {m.has_hitbox && <span>📦 Hitbox</span>}
                </div>
                {m.tags && m.tags.length > 0 && (
                  <div className="mob-card-tags" style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                    {m.tags.slice(0, 4).map(t => (
                      <span key={t} style={{ fontSize: "0.65rem", padding: "1px 6px", borderRadius: 10, background: "var(--bg-hover)" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="mob-card-actions">
                <button className="btn btn-sm btn-primary" onClick={() => handleLoad(m.id)}>✏️ Éditer</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(m.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // RENDER — EDIT MODE
  // ══════════════════════════════════════════

  const currentAnim = model.animations.find(a => a.id === animationState.animationId);

  return (
    <div className="editor-page mob-editor">
      {/* Header */}
      <div className="editor-header">
        <div className="header-left">
          <button className="btn btn-ghost" onClick={() => { setMode("list"); }}>← Retour</button>
          <h1>🎨 {model.meta.name || "Nouveau Modèle"}</h1>
          <span className="mob-meta-badge">
            {MODEL_CATEGORIES.find(c => c.value === model.meta.category)?.icon} {MODEL_CATEGORIES.find(c => c.value === model.meta.category)?.label}
          </span>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "⏳ Sauvegarde…" : "💾 Sauvegarder"}
          </button>
          <span className={`server-status ${serverOnline ? "online" : "offline"}`}>
            {serverOnline ? "🟢" : "🔴"}
          </span>
        </div>
      </div>

      {message && <div className={`status-message ${message.type}`}>{message.text}</div>}
      {importMessage && <div className="status-message success">{importMessage}</div>}

      {/* 3D Viewer */}
      <div className={`mob-viewer-container ${isFullscreen ? "fullscreen" : ""}`}>
        <MobViewer3D
          mob={viewerMobData}
          selectedPartIds={selectedPartIds}
          onSelectPart={(id, multi) => {
            if (multi && id) {
              setSelectedPartIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
            } else {
              setSelectedPartIds(id ? [id] : []);
            }
          }}
          transformMode={transformMode}
          onPartTransformChange={(id, prop, val) => updatePart(id, { [prop]: val })}
          animationState={animationState}
          showHitboxes={showHitboxes}
          showAttackHitboxes={false}
          onAddPart={handleAddPartFromViewer}
          onAddKeyframe={handleAddKeyframeFromViewer}
          onAddHitbox={handleAddHitboxFromViewer}
          onAddAnimation={handleAddAnimationFromViewer}
          onTickUpdate={(tick) => setAnimationState(prev => ({ ...prev, currentTick: tick }))}
          onAnimationStop={() => setAnimationState(prev => ({ ...prev, playing: false }))}
        />
        <ViewerToolbar
          mob={viewerMobData}
          transformMode={transformMode}
          onTransformModeChange={setTransformMode}
          selectedPartIds={selectedPartIds}
          onSelectPart={(id) => setSelectedPartIds(id ? [id] : [])}
          animationState={animationState}
          onAnimationStateChange={setAnimationState}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          showHitboxes={showHitboxes}
          onToggleHitboxes={() => setShowHitboxes(!showHitboxes)}
          showAttackHitboxes={false}
          onToggleAttackHitboxes={() => {}}
        />
        <div className="viewer-shortcuts-hint">G=Déplacer R=Rotation S=Échelle Échap=Désélectionner</div>

        {/* ── Animation Timeline (docked below viewer) ── */}
        <AnimationTimeline
          animations={model.animations}
          parts={model.parts}
          selectedAnimationId={animationState.animationId}
          currentTick={animationState.currentTick}
          playing={animationState.playing}
          speed={animationState.speed}
          selectedKeyframe={selectedKeyframe}
          selectedPartIds={selectedPartIds}
          onSelectAnimation={(id) => setAnimationState(prev => ({ ...prev, animationId: id, currentTick: 0, playing: false }))}
          onAnimationChange={(idx, patch) => updateAnim(idx, patch)}
          onAddAnimation={() => {
            const newAnim = createDefaultAnimation();
            setModel(prev => ({ ...prev, animations: [...prev.animations, newAnim] }));
            setAnimationState(prev => ({ ...prev, animationId: newAnim.id, playing: false, currentTick: 0 }));
          }}
          onDeleteAnimation={(idx) => {
            setModel(prev => ({ ...prev, animations: prev.animations.filter((_, i) => i !== idx) }));
            setAnimationState(prev => ({ ...prev, animationId: null, playing: false, currentTick: 0 }));
            setSelectedKeyframe(null);
          }}
          onSelectKeyframe={(sel) => {
            setSelectedKeyframe(sel);
            if (sel) {
              const a = model.animations[sel.animIdx];
              const kf = a?.keyframes[sel.kfIdx];
              if (kf) {
                setSelectedPartIds(kf.part_ids);
                setAnimationState(prev => ({ ...prev, animationId: a.id, currentTick: kf.tick, playing: false }));
              }
            }
          }}
          onAddKeyframe={(aIdx, tick, partIds) => {
            const newKf = createDefaultKeyframe(partIds, tick);
            if (partIds.length > 0) {
              const refPart = model.parts.find(p => p.id === partIds[0]);
              if (refPart) {
                newKf.position = [...refPart.offset];
                newKf.rotation = [...refPart.rotation];
                newKf.scale = [...refPart.scale];
              }
            }
            updateAnim(aIdx, { keyframes: [...model.animations[aIdx].keyframes, newKf] });
          }}
          onDeleteKeyframe={(aIdx, kfIdx) => {
            updateAnim(aIdx, { keyframes: model.animations[aIdx].keyframes.filter((_, i) => i !== kfIdx) });
            setSelectedKeyframe(null);
          }}
          onKeyframeChange={(aIdx, kfIdx, patch) => {
            const kfs = [...model.animations[aIdx].keyframes];
            kfs[kfIdx] = { ...kfs[kfIdx], ...patch };
            updateAnim(aIdx, { keyframes: kfs });
          }}
          onTickChange={(tick) => setAnimationState(prev => ({ ...prev, currentTick: tick }))}
          onPlayPause={() => setAnimationState(prev => ({ ...prev, playing: !prev.playing }))}
          onStop={() => setAnimationState(prev => ({ ...prev, playing: false, currentTick: 0 }))}
          onSpeedChange={(s) => setAnimationState(prev => ({ ...prev, speed: s }))}
        />
      </div>

      {/* ═══ EDITOR SECTIONS ═══ */}
      <div className="mob-editor-sections">

        {/* ── Identité ── */}
        <CollapsibleSection title="Identité" icon="📋" defaultOpen>
          <div className="form-row">
            <div className="form-group">
              <label>Nom du modèle</label>
              <input value={model.meta.name}
                onChange={e => setModel({ ...model, meta: { ...model.meta, name: e.target.value } })}
                placeholder="Mon Super Modèle" />
            </div>
            <div className="form-group">
              <label>Auteur</label>
              <input value={model.meta.author}
                onChange={e => setModel({ ...model, meta: { ...model.meta, author: e.target.value } })} />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={2} value={model.meta.description}
              onChange={e => setModel({ ...model, meta: { ...model.meta, description: e.target.value } })}
              placeholder="Décrivez votre modèle..." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Catégorie</label>
              <select value={model.meta.category}
                onChange={e => setModel({ ...model, meta: { ...model.meta, category: e.target.value as ModelCategory } })}>
                {MODEL_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Tags <span className="label-hint">(séparés par des virgules)</span></label>
              <input value={(model.meta.tags || []).join(", ")}
                onChange={e => setModel({ ...model, meta: { ...model.meta, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) } })}
                placeholder="feu, projectile, sphère..." />
            </div>
          </div>
        </CollapsibleSection>

        {/* ── Configuration ── */}
        <CollapsibleSection title="Configuration" icon="⚙️" defaultOpen>
          <div className="form-row">
            <div className="form-group">
              <label>Échelle globale <span className="label-hint">(0.1 — 10)</span></label>
              <input type="range" min={0.1} max={10} step={0.1} value={model.config.scale}
                onChange={e => setModel({ ...model, config: { ...model.config, scale: parseFloat(e.target.value) } })} />
              <span className="range-value">{model.config.scale.toFixed(1)}x</span>
            </div>
            <div className="form-group">
              <label>Offset Y (hauteur) <span className="label-hint">(-5 — 5)</span></label>
              <input type="range" min={-5} max={5} step={0.1} value={model.config.base_offset_y}
                onChange={e => setModel({ ...model, config: { ...model.config, base_offset_y: parseFloat(e.target.value) } })} />
              <span className="range-value">{model.config.base_offset_y.toFixed(1)}</span>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label><input type="checkbox" checked={model.config.face_direction}
                onChange={e => setModel({ ...model, config: { ...model.config, face_direction: e.target.checked } })} />
                Face la direction de mouvement</label>
            </div>
            <div className="form-group">
              <label><input type="checkbox" checked={model.config.billboard}
                onChange={e => setModel({ ...model, config: { ...model.config, billboard: e.target.checked } })} />
                Billboard (fait toujours face au joueur)</label>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Rotation auto (tours/sec) <span className="label-hint">(0 = désactivé)</span></label>
              <input type="range" min={0} max={5} step={0.1} value={model.config.auto_rotate_speed}
                onChange={e => setModel({ ...model, config: { ...model.config, auto_rotate_speed: parseFloat(e.target.value) } })} />
              <span className="range-value">{model.config.auto_rotate_speed.toFixed(1)}</span>
            </div>
            {model.config.auto_rotate_speed > 0 && (
              <div className="form-group">
                <label>Axe de rotation</label>
                <select value={model.config.auto_rotate_axis}
                  onChange={e => setModel({ ...model, config: { ...model.config, auto_rotate_axis: e.target.value as "x" | "y" | "z" } })}>
                  {AUTO_ROTATE_AXES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label><input type="checkbox" checked={model.config.glow}
                onChange={e => setModel({ ...model, config: { ...model.config, glow: e.target.checked } })} />
                Effet de glow</label>
            </div>
            {model.config.glow && (
              <div className="form-group">
                <label>Couleur du glow</label>
                <input type="color" value={model.config.glow_color}
                  onChange={e => setModel({ ...model, config: { ...model.config, glow_color: e.target.value } })} />
              </div>
            )}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Durée de vie par défaut (ticks) <span className="label-hint">(0 = permanent)</span></label>
              <input type="number" min={0} max={6000} value={model.config.default_lifetime}
                onChange={e => setModel({ ...model, config: { ...model.config, default_lifetime: parseInt(e.target.value) || 0 } })} />
            </div>
            <div className="form-group">
              <label>Fondu entrée (ticks)</label>
              <input type="number" min={0} max={60} value={model.config.fade_in}
                onChange={e => setModel({ ...model, config: { ...model.config, fade_in: parseInt(e.target.value) || 0 } })} />
            </div>
            <div className="form-group">
              <label>Fondu sortie (ticks)</label>
              <input type="number" min={0} max={60} value={model.config.fade_out}
                onChange={e => setModel({ ...model, config: { ...model.config, fade_out: parseInt(e.target.value) || 0 } })} />
            </div>
          </div>
        </CollapsibleSection>

        {/* ── Parts du modèle ── */}
        <CollapsibleSection title="Parts du Modèle" icon="🧱" defaultOpen badge={`${model.parts.length}`}>
          <div className="form-row" style={{ marginBottom: 12 }}>
            <button className="btn btn-sm btn-primary"
              onClick={() => setModel(prev => ({ ...prev, parts: [...prev.parts, createDefaultPart()] }))}>
              + Ajouter une part
            </button>
            <label className="btn btn-sm btn-ghost" style={{ cursor: "pointer" }}>
              📁 Importer Blockbench (.bbmodel)
              <input type="file" accept=".bbmodel" style={{ display: "none" }}
                onChange={e => { if (e.target.files?.[0]) handleImportBB(e.target.files[0]); }} />
            </label>
            {selectedPartIds.length > 1 && (
              <button className="btn btn-sm btn-ghost"
                onClick={() => {
                  const name = prompt("Nom du groupe :");
                  if (name) {
                    setModel(prev => ({
                      ...prev,
                      parts: prev.parts.map(p =>
                        selectedPartIds.includes(p.id) ? { ...p, group: name } : p
                      ),
                    }));
                  }
                }}>📁 Grouper la sélection</button>
            )}
          </div>

          {groupNames.map(gName => (
            <div key={gName || "__ungrouped__"} style={{ marginBottom: 12 }}>
              {gName && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <strong style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>📁 {gName}</strong>
                  <button className="btn btn-xs btn-ghost" title="Sélectionner tout le groupe"
                    onClick={() => setSelectedPartIds(partGroups[gName].map(p => p.id))}>☑️</button>
                </div>
              )}
              {partGroups[gName].map(part => {
                const isSelected = selectedPartIds.includes(part.id);
                return (
                  <div key={part.id} className={`sub-item ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedPartIds(isSelected ? selectedPartIds.filter(x => x !== part.id) : [...selectedPartIds, part.id])}>
                    <div className="sub-item-header">
                      <strong>{part.name}</strong>
                      <button className="btn btn-xs btn-danger"
                        onClick={e => { e.stopPropagation(); setModel(prev => ({ ...prev, parts: prev.parts.filter(p => p.id !== part.id) })); }}>🗑️</button>
                    </div>
                    {isSelected && (
                      <div className="sub-item-body" onClick={e => e.stopPropagation()}>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Nom</label>
                            <input value={part.name} onChange={e => updatePart(part.id, { name: e.target.value })} />
                          </div>
                          <div className="form-group">
                            <label>Type</label>
                            <select value={part.type}
                              onChange={e => updatePart(part.id, { type: e.target.value as PartType })}>
                              {PART_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                          </div>
                        </div>
                        {part.type !== "text_display" ? (
                          <div className="form-group">
                            <label>Bloc</label>
                            <div style={{ display: "flex", gap: 4, marginBottom: 4, flexWrap: "wrap" }}>
                              {BLOCK_CATEGORIES.map(c => (
                                <button key={c.label} className={`btn btn-xs ${blockCategory === c.label ? "btn-primary" : "btn-ghost"}`}
                                  onClick={() => setBlockCategory(blockCategory === c.label ? null : c.label)}>
                                  {c.icon}
                                </button>
                              ))}
                            </div>
                            <select value={part.block} onChange={e => updatePart(part.id, { block: e.target.value })}>
                              {filteredBlocks.map(b => <option key={b} value={b}>{b.replace("minecraft:", "")}</option>)}
                            </select>
                          </div>
                        ) : (
                          <div className="form-group">
                            <label>Texte</label>
                            <input value={part.block} onChange={e => updatePart(part.id, { block: e.target.value })} />
                          </div>
                        )}
                        <Vec3Input label="Position" value={part.offset} onChange={v => updatePart(part.id, { offset: v })} />
                        <Vec3Input label="Rotation" value={part.rotation} onChange={v => updatePart(part.id, { rotation: v })} step={5} />
                        <Vec3Input label="Échelle" value={part.scale} onChange={v => updatePart(part.id, { scale: v })} />
                        <div className="form-row">
                          <div className="form-group">
                            <label>Parent</label>
                            <select value={part.parent_id || ""}
                              onChange={e => updatePart(part.id, { parent_id: e.target.value || null })}>
                              <option value="">Aucun</option>
                              {model.parts.filter(p => p.id !== part.id).map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Groupe</label>
                            <input value={part.group || ""} onChange={e => updatePart(part.id, { group: e.target.value })}
                              placeholder="Nom du groupe" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </CollapsibleSection>

        {/* ── Hitboxes ── */}
        <CollapsibleSection title="Hitboxes de Collision" icon="📦" badge={model.hitbox.enabled ? "Actif" : "Inactif"}>
          <div className="form-group">
            <label><input type="checkbox" checked={model.hitbox.enabled}
              onChange={e => setModel({ ...model, hitbox: { ...model.hitbox, enabled: e.target.checked } })} />
              Activer les hitboxes de collision</label>
            <span className="label-hint">Permet aux sorts d'interagir avec ce modèle</span>
          </div>
          {model.hitbox.enabled && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Largeur</label>
                  <input type="range" min={0.1} max={5} step={0.1} value={model.hitbox.width}
                    onChange={e => setModel({ ...model, hitbox: { ...model.hitbox, width: parseFloat(e.target.value) } })} />
                  <span className="range-value">{model.hitbox.width.toFixed(1)}</span>
                </div>
                <div className="form-group">
                  <label>Hauteur</label>
                  <input type="range" min={0.1} max={5} step={0.1} value={model.hitbox.height}
                    onChange={e => setModel({ ...model, hitbox: { ...model.hitbox, height: parseFloat(e.target.value) } })} />
                  <span className="range-value">{model.hitbox.height.toFixed(1)}</span>
                </div>
              </div>

              <h3 style={{ marginTop: 12 }}>Hitboxes détaillées</h3>
              <button className="btn btn-sm btn-primary" style={{ marginBottom: 8 }}
                onClick={() => setModel(prev => ({
                  ...prev,
                  hitbox: { ...prev.hitbox, custom_hitboxes: [...prev.hitbox.custom_hitboxes, createDefaultHitbox()] },
                }))}>+ Ajouter une hitbox</button>

              {model.hitbox.custom_hitboxes.map((hb, hi) => (
                <div key={hb.id} className="sub-item">
                  <div className="sub-item-header">
                    <strong>{hb.name}</strong>
                    <button className="btn btn-xs btn-danger"
                      onClick={() => setModel(prev => ({
                        ...prev,
                        hitbox: { ...prev.hitbox, custom_hitboxes: prev.hitbox.custom_hitboxes.filter((_, j) => j !== hi) },
                      }))}>🗑️</button>
                  </div>
                  <div className="sub-item-body">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nom</label>
                        <input value={hb.name} onChange={e => {
                          const arr = [...model.hitbox.custom_hitboxes];
                          arr[hi] = { ...arr[hi], name: e.target.value };
                          setModel({ ...model, hitbox: { ...model.hitbox, custom_hitboxes: arr } });
                        }} />
                      </div>
                      <div className="form-group">
                        <label>Forme</label>
                        <select value={hb.shape} onChange={e => {
                          const arr = [...model.hitbox.custom_hitboxes];
                          arr[hi] = { ...arr[hi], shape: e.target.value as any };
                          setModel({ ...model, hitbox: { ...model.hitbox, custom_hitboxes: arr } });
                        }}>
                          <option value="box">📦 Boîte</option>
                          <option value="sphere">🔴 Sphère</option>
                          <option value="cylinder">🛢️ Cylindre</option>
                        </select>
                      </div>
                    </div>
                    <Vec3Input label="Position" value={hb.offset} onChange={v => {
                      const arr = [...model.hitbox.custom_hitboxes];
                      arr[hi] = { ...arr[hi], offset: v };
                      setModel({ ...model, hitbox: { ...model.hitbox, custom_hitboxes: arr } });
                    }} />
                    <Vec3Input label="Taille" value={hb.size} onChange={v => {
                      const arr = [...model.hitbox.custom_hitboxes];
                      arr[hi] = { ...arr[hi], size: v };
                      setModel({ ...model, hitbox: { ...model.hitbox, custom_hitboxes: arr } });
                    }} />
                    <div className="form-group">
                      <label>Attachée à une part</label>
                      <select value={hb.attached_part_id || ""} onChange={e => {
                        const arr = [...model.hitbox.custom_hitboxes];
                        arr[hi] = { ...arr[hi], attached_part_id: e.target.value || null };
                        setModel({ ...model, hitbox: { ...model.hitbox, custom_hitboxes: arr } });
                      }}>
                        <option value="">Aucune</option>
                        {model.parts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </CollapsibleSection>

      </div>
    </div>
  );
}
