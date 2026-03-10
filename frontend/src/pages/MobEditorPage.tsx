import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CustomMob, ModelPart, MobAnimation, MobAttack, LootEntry, AnimationKeyframe,
  Hitbox, AttackHitbox, HitboxShape, PartType, AIRule,
  createDefaultMob, createDefaultPart, createDefaultAnimation,
  createDefaultKeyframe, createDefaultAttack, createDefaultLootEntry,
  createDefaultHitbox, createDefaultAttackHitbox, createDefaultAIRule,
  BASE_MOB_TYPES, PART_TYPES, ATTACK_TYPES, COMMON_PARTICLES,
  COMMON_SOUNDS, STATUS_EFFECTS, COMMON_BLOCKS, BLOCK_CATEGORIES, MobSummary,
  AI_CONDITIONS, AI_ACTIONS,
} from "../types/mob";
import { listMobs, loadMob, saveMob, deleteMob, checkHealth, generateMobWithAI, checkAIMobEnabled } from "../api/client";
import { MobViewer3D, ViewerToolbar, getAnimatedPose, type TransformMode } from "../components/mob-viewer";
import { AnimationTimeline } from "../components/mob-viewer/AnimationTimeline";
import { importBlockbenchModel, readFileAsText } from "../utils/blockbench-importer";

const LOCAL_STORAGE_KEY = "mob-editor-draft";

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
// MOB EDITOR PAGE
// ══════════════════════════════════════════

export function MobEditorPage() {
  const [mode, setMode] = useState<"list" | "edit">("list");
  const [mobs, setMobs] = useState<MobSummary[]>([]);
  const [mob, setMob] = useState<CustomMob>(createDefaultMob());
  const [serverOnline, setServerOnline] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // ── 3D Viewer State ──
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);
  const [transformMode, setTransformMode] = useState<TransformMode>("translate");
  const [animationState, setAnimationState] = useState({
    playing: false,
    animationId: null as string | null,
    currentTick: 0,
    speed: 1,
  });
  const [selectedKeyframe, setSelectedKeyframe] = useState<{ animIdx: number; kfIdx: number } | null>(null);

  // ── Viewer extensions ──
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHitboxes, setShowHitboxes] = useState(false);
  const [showAttackHitboxes, setShowAttackHitboxes] = useState(false);
  const [blockCategory, setBlockCategory] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  // ── AI Generation ──
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);

  // ── Basic / Advanced mode ──
  const [advancedMode, setAdvancedMode] = useState(false);

  useEffect(() => {
    checkAIMobEnabled().then(r => setAiEnabled(r.enabled));
  }, []);

  const handleAIGenerateMob = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError(null);
    const result = await generateMobWithAI(aiPrompt);
    setAiLoading(false);
    if (result.ok && result.mob) {
      setMob(result.mob);
      setMode("edit");
      setMessage({ text: "🤖 Mob généré par IA !", type: "success" });
    } else {
      setAiError(result.error ?? "Erreur inconnue");
    }
  };

  // Grouped parts for tree view
  const partGroups = useMemo(() => {
    const groups: Record<string, ModelPart[]> = {};
    for (const part of mob.parts) {
      const g = part.group || "";
      if (!groups[g]) groups[g] = [];
      groups[g].push(part);
    }
    return groups;
  }, [mob.parts]);

  const groupNames = useMemo(() => {
    const names = Object.keys(partGroups).sort((a, b) => {
      if (a === "") return 1;
      if (b === "") return -1;
      return a.localeCompare(b);
    });
    return names;
  }, [partGroups]);

  // Filtered blocks by category
  const filteredBlocks = useMemo(() => {
    if (!blockCategory) return [...COMMON_BLOCKS];
    const cat = BLOCK_CATEGORIES.find((c) => c.label === blockCategory);
    if (!cat) return [...COMMON_BLOCKS];
    const prefixes = cat.prefix.split("|");
    return COMMON_BLOCKS.filter((b) => {
      const name = b.replace("minecraft:", "");
      return prefixes.some((p) => name.includes(p));
    });
  }, [blockCategory]);

  // Keyboard shortcuts for transform mode
  useEffect(() => {
    if (mode !== "edit") return;
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLTextAreaElement
      ) return;
      switch (e.key.toLowerCase()) {
        case "g": setTransformMode("translate"); break;
        case "r": setTransformMode("rotate"); break;
        case "s": setTransformMode("scale"); break;
        case "escape": setSelectedPartIds([]); setSelectedKeyframe(null); break;
        case "delete":
        case "backspace":
          if (selectedPartIds.length > 0) {
            setMob(prev => ({ ...prev, parts: prev.parts.filter(p => !selectedPartIds.includes(p.id)) }));
            setSelectedPartIds([]);
          }
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, selectedPartIds]);

  // ── Part selection handler (supports additive/Ctrl+Click) ──
  const handleSelectPart = useCallback((partId: string | null, additive?: boolean) => {
    if (!partId) {
      setSelectedPartIds([]);
      return;
    }
    if (additive) {
      setSelectedPartIds(prev =>
        prev.includes(partId) ? prev.filter(id => id !== partId) : [...prev, partId]
      );
    } else {
      setSelectedPartIds([partId]);
    }
  }, []);

  // Part transform change from 3D manipulator
  const handlePartTransformChange = useCallback((
    partId: string,
    field: "offset" | "rotation" | "scale",
    value: [number, number, number]
  ) => {
    setMob(prev => ({
      ...prev,
      parts: prev.parts.map(p => p.id === partId ? { ...p, [field]: value } : p),
    }));
  }, []);

  // ── Viewer creation callbacks ──
  const handleAddPartFromViewer = useCallback((type: string) => {
    const newPart = createDefaultPart();
    newPart.type = type as PartType;
    newPart.block = type === "text_display" ? "Texte"
      : type === "item_display" ? "minecraft:diamond_sword"
      : "minecraft:stone";
    // If a part is selected, offset the new part slightly
    if (selectedPartIds.length > 0) {
      const sel = mob.parts.find(p => p.id === selectedPartIds[0]);
      if (sel) {
        newPart.offset = [sel.offset[0] + 1, sel.offset[1], sel.offset[2]];
        newPart.group = sel.group;
      }
    }
    setMob(prev => ({ ...prev, parts: [...prev.parts, newPart] }));
    setSelectedPartIds([newPart.id]);
  }, [selectedPartIds, mob.parts]);

  const handleAddKeyframeFromViewer = useCallback(() => {
    if (selectedPartIds.length === 0 || !animationState.animationId) return;
    const parts = mob.parts.filter(p => selectedPartIds.includes(p.id));
    if (parts.length === 0) return;
    const animIdx = mob.animations.findIndex(a => a.id === animationState.animationId);
    if (animIdx === -1) return;
    const currentAnim = mob.animations[animIdx];
    const newKf = createDefaultKeyframe(selectedPartIds, animationState.currentTick);
    // Use the animated pose at the current tick if available, otherwise fall back to base transform
    const refPart = parts[0];
    const pose = getAnimatedPose(currentAnim, refPart.id, animationState.currentTick);
    newKf.position = pose?.position ? [...pose.position] : [...refPart.offset];
    newKf.rotation = pose?.rotation ? [...pose.rotation] : [...refPart.rotation];
    newKf.scale = pose?.scale ? [...pose.scale] : [...refPart.scale];
    const animations = [...mob.animations];
    animations[animIdx] = {
      ...animations[animIdx],
      keyframes: [...animations[animIdx].keyframes, newKf],
    };
    setMob(prev => ({ ...prev, animations }));
    const partNames = parts.map(p => p.name).join(", ");
    setMessage({ text: `🔑 Keyframe ajoutée au tick ${animationState.currentTick} pour "${partNames}"`, type: "success" });
    setTimeout(() => setMessage(null), 3000);
  }, [selectedPartIds, animationState, mob.parts, mob.animations]);

  const handleAddHitboxFromViewer = useCallback(() => {
    setMob(prev => ({ ...prev, hitboxes: [...(prev.hitboxes || []), createDefaultHitbox()] }));
    setShowHitboxes(true);
    setMessage({ text: "🟢 Hitbox ajoutée", type: "success" });
    setTimeout(() => setMessage(null), 2000);
  }, []);

  const handleAddAnimationFromViewer = useCallback(() => {
    const newAnim = createDefaultAnimation();
    setMob(prev => ({ ...prev, animations: [...prev.animations, newAnim] }));
    setAnimationState(prev => ({ ...prev, animationId: newAnim.id, playing: false, currentTick: 0 }));
    setMessage({ text: "🎬 Animation créée et sélectionnée", type: "success" });
    setTimeout(() => setMessage(null), 2000);
  }, []);

  // Blockbench import handler
  const handleBlockbenchImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const result = importBlockbenchModel(text);
      setMob(prev => ({
        ...prev,
        parts: [...prev.parts, ...result.parts],
        animations: [...prev.animations, ...result.animations],
      }));
      const msg = `✅ Importé: ${result.parts.length} parts, ${result.animations.length} animations`;
      setImportMessage(result.warnings.length > 0
        ? `${msg} (⚠️ ${result.warnings.join(", ")})`
        : msg);
      setTimeout(() => setImportMessage(null), 5000);
    } catch (err) {
      setImportMessage(`❌ Erreur d'import: ${err instanceof Error ? err.message : "Fichier invalide"}`);
      setTimeout(() => setImportMessage(null), 5000);
    }
    // Reset input
    e.target.value = "";
  }, []);

  // Server health check
  useEffect(() => {
    checkHealth().then(setServerOnline);
    const interval = setInterval(() => checkHealth().then(setServerOnline), 15000);
    return () => clearInterval(interval);
  }, []);

  // Load draft from localStorage
  useEffect(() => {
    if (mode === "edit") {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed?.meta) setMob(parsed);
        } catch { /* ignore */ }
      }
    }
  }, []);

  // Save draft to localStorage
  useEffect(() => {
    if (mode === "edit") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mob));
    }
  }, [mob, mode]);

  // Load mob list
  const refreshList = useCallback(async () => {
    const result = await listMobs();
    if (result.ok) setMobs(result.mobs);
  }, []);

  useEffect(() => {
    if (mode === "list") refreshList();
  }, [mode, refreshList]);

  // ── Actions ──

  const handleNew = () => {
    setMob(createDefaultMob());
    setMode("edit");
    setMessage(null);
  };

  const handleEdit = async (id: string) => {
    const result = await loadMob(id);
    if (result.ok && result.mob) {
      setMob(result.mob);
      setMode("edit");
      setMessage(null);
    } else {
      setMessage({ text: result.error || "Erreur de chargement", type: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Supprimer le mob "${id}" ?`)) return;
    const result = await deleteMob(id);
    if (result.ok) {
      setMessage({ text: "Mob supprimé", type: "success" });
      refreshList();
    } else {
      setMessage({ text: result.error || "Erreur", type: "error" });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await saveMob(mob);
    setSaving(false);
    if (result.ok) {
      setMessage({ text: `✅ Mob "${mob.meta.name}" sauvegardé ! (ID: ${result.id})`, type: "success" });
      if (result.id) setMob(prev => ({ ...prev, meta: { ...prev.meta, id: result.id! } }));
    } else {
      setMessage({ text: result.error || "Erreur de sauvegarde", type: "error" });
    }
  };

  const handleBack = () => {
    setMode("list");
    setMessage(null);
  };

  // ══════════════════════════════════════════
  // LIST MODE
  // ══════════════════════════════════════════

  if (mode === "list") {
    return (
      <div className="editor-container">
        <div className="editor-header">
          <h1>🐉 Mobs Customs</h1>
          <div className="meta-info">
            <span>
              <span className={`status-dot ${serverOnline ? "online" : "offline"}`} />
              {serverOnline ? "Serveur connecté" : "Serveur hors ligne"}
            </span>
            <span>{mobs.length} mob(s)</span>
          </div>
        </div>

        {message && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        <div style={{ marginBottom: 16 }}>
          <button className="btn btn-primary" onClick={handleNew}>➕ Nouveau Mob</button>
        </div>

        <div className="spell-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {mobs.map(m => (
            <div key={m.id} className="card" style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0 }}>{m.name || "Sans nom"}</h3>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{m.base_mob_type}</span>
              </div>
              {m.description && (
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "8px 0" }}>
                  {m.description.slice(0, 100)}
                </p>
              )}
              <div style={{ display: "flex", gap: 8, fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 12 }}>
                <span>❤️ {m.max_health}</span>
                <span>🧱 {m.parts_count} parts</span>
                <span>⚔️ {m.attacks_count} attaques</span>
                <span>🎬 {m.animations_count} anims</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary" onClick={() => handleEdit(m.id)}>✏️ Éditer</button>
                <button className="btn btn-danger" onClick={() => handleDelete(m.id)}>🗑️</button>
              </div>
            </div>
          ))}
          {mobs.length === 0 && (
            <div className="card" style={{ textAlign: "center", color: "var(--text-muted)" }}>
              <p>Aucun mob créé. Cliquez sur "Nouveau Mob" pour commencer !</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // EDIT MODE
  // ══════════════════════════════════════════

  return (
    <div className="editor-container mob-editor-page">
      <div className="editor-header">
        <h1>🐉 Éditeur de Mob</h1>
        <div className="meta-info">
          <span>
            <span className={`status-dot ${serverOnline ? "online" : "offline"}`} />
            {serverOnline ? "Serveur connecté" : "Serveur hors ligne"}
          </span>
          <span>ID: {mob.meta.id}</span>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
        <button className="btn" onClick={handleBack}>← Retour</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "⏳ Sauvegarde..." : "💾 Sauvegarder"}
        </button>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8,
          padding: "4px 12px", background: "var(--bg-card)", borderRadius: "var(--radius)",
          border: "1px solid var(--border)" }}>
          <span style={{ fontSize: "0.8rem", color: advancedMode ? "var(--text-muted)" : "var(--accent)", fontWeight: advancedMode ? 400 : 600 }}>
            🎯 Basique
          </span>
          <label style={{ position: "relative", display: "inline-block", width: 40, height: 22, cursor: "pointer" }}>
            <input type="checkbox" checked={advancedMode} onChange={e => setAdvancedMode(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              background: advancedMode ? "var(--accent)" : "var(--bg-secondary)",
              borderRadius: 22, transition: "0.2s",
            }}>
              <span style={{
                position: "absolute", height: 16, width: 16, left: advancedMode ? 20 : 4, bottom: 3,
                background: "#fff", borderRadius: "50%", transition: "0.2s",
              }} />
            </span>
          </label>
          <span style={{ fontSize: "0.8rem", color: advancedMode ? "var(--accent)" : "var(--text-muted)", fontWeight: advancedMode ? 600 : 400 }}>
            ⚙️ Avancé
          </span>
        </div>
      </div>

      {/* ═══════════ IA GÉNÉRATION MOB ═══════════ */}
      {aiEnabled && (
        <div className="card ai-card">
          <h2>🤖 Génération par IA</h2>
          <p className="ai-desc">Décris ta créature en quelques mots, et l'IA la créera pour toi automatiquement.</p>
          <div className="ai-prompt-row">
            <textarea className="ai-prompt-input" placeholder="Ex: Un golem de feu avec des bras en magma, une tête en netherrack et un cœur lumineux..."
              value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} rows={2} />
            <button className="btn btn-accent" onClick={handleAIGenerateMob} disabled={aiLoading || !aiPrompt.trim()}>
              {aiLoading ? "⏳ Génération..." : "✨ Générer"}
            </button>
          </div>
          {aiError && <p className="ai-error">{aiError}</p>}
        </div>
      )}

      {/* ── 3D VIEWER (advanced only) ── */}
      {advancedMode && (
      <div className={`mob-viewer-section ${isFullscreen ? "fullscreen" : ""}`}>
        <ViewerToolbar
          mob={mob}
          selectedPartIds={selectedPartIds}
          transformMode={transformMode}
          onTransformModeChange={setTransformMode}
          onSelectPart={(id) => handleSelectPart(id)}
          animationState={animationState}
          onAnimationStateChange={setAnimationState}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          showHitboxes={showHitboxes}
          onToggleHitboxes={() => setShowHitboxes(!showHitboxes)}
          showAttackHitboxes={showAttackHitboxes}
          onToggleAttackHitboxes={() => setShowAttackHitboxes(!showAttackHitboxes)}
        />
        <MobViewer3D
          mob={mob}
          selectedPartIds={selectedPartIds}
          onSelectPart={handleSelectPart}
          onPartTransformChange={handlePartTransformChange}
          transformMode={transformMode}
          animationState={animationState}
          showHitboxes={showHitboxes}
          showAttackHitboxes={showAttackHitboxes}
          isFullscreen={isFullscreen}
          onAddPart={handleAddPartFromViewer}
          onAddKeyframe={handleAddKeyframeFromViewer}
          onAddHitbox={handleAddHitboxFromViewer}
          onAddAnimation={handleAddAnimationFromViewer}
          onTickUpdate={(tick) => setAnimationState(prev => ({ ...prev, currentTick: tick }))}
          onAnimationStop={() => setAnimationState(prev => ({ ...prev, playing: false }))}
        />
        <div className="viewer-shortcuts-hint">
          <span><kbd>G</kbd> Position</span>
          <span><kbd>R</kbd> Rotation</span>
          <span><kbd>S</kbd> Échelle</span>
          <span><kbd>Esc</kbd> Désélectionner</span>
          <span><kbd>Suppr</kbd> Supprimer part</span>
          <span>🖱️ Clic = sélectionner · <kbd>Ctrl</kbd>+Clic = multi-sélection · Molette = zoom · Clic droit = orbite</span>
        </div>

        {/* ── Animation Timeline (docked below viewer) ── */}
        <AnimationTimeline
          animations={mob.animations}
          parts={mob.parts}
          selectedAnimationId={animationState.animationId}
          currentTick={animationState.currentTick}
          playing={animationState.playing}
          speed={animationState.speed}
          selectedKeyframe={selectedKeyframe}
          selectedPartIds={selectedPartIds}
          onSelectAnimation={(id) => setAnimationState(prev => ({ ...prev, animationId: id, currentTick: 0, playing: false }))}
          onAnimationChange={(idx, patch) => updateAnimation(idx, patch)}
          onAddAnimation={() => {
            const newAnim = createDefaultAnimation();
            setMob(prev => ({ ...prev, animations: [...prev.animations, newAnim] }));
            setAnimationState(prev => ({ ...prev, animationId: newAnim.id, playing: false, currentTick: 0 }));
          }}
          onDeleteAnimation={(idx) => {
            setMob(prev => ({ ...prev, animations: prev.animations.filter((_, i) => i !== idx) }));
            setAnimationState(prev => ({ ...prev, animationId: null, playing: false, currentTick: 0 }));
            setSelectedKeyframe(null);
          }}
          onSelectKeyframe={(sel) => {
            setSelectedKeyframe(sel);
            if (sel) {
              const a = mob.animations[sel.animIdx];
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
              const refPart = mob.parts.find(p => p.id === partIds[0]);
              if (refPart) {
                newKf.position = [...refPart.offset];
                newKf.rotation = [...refPart.rotation];
                newKf.scale = [...refPart.scale];
              }
            }
            updateAnimation(aIdx, { keyframes: [...mob.animations[aIdx].keyframes, newKf] });
          }}
          onDeleteKeyframe={(aIdx, kfIdx) => {
            updateAnimation(aIdx, { keyframes: mob.animations[aIdx].keyframes.filter((_, i) => i !== kfIdx) });
            setSelectedKeyframe(null);
          }}
          onKeyframeChange={(aIdx, kfIdx, patch) => updateKeyframe(aIdx, kfIdx, patch)}
          onTickChange={(tick) => setAnimationState(prev => ({ ...prev, currentTick: tick }))}
          onPlayPause={() => setAnimationState(prev => ({ ...prev, playing: !prev.playing }))}
          onStop={() => setAnimationState(prev => ({ ...prev, playing: false, currentTick: 0 }))}
          onSpeedChange={(s) => setAnimationState(prev => ({ ...prev, speed: s }))}
        />
      </div>
      )}

      <div className="editor-main" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── META ── */}
        <CollapsibleSection title="Identité" icon="📋" defaultOpen={true}>
          <div className="form-row">
            <div className="form-group">
              <label>Nom du mob</label>
              <input type="text" value={mob.meta.name}
                onChange={e => setMob({ ...mob, meta: { ...mob.meta, name: e.target.value } })} />
            </div>
            <div className="form-group">
              <label>Auteur</label>
              <input type="text" value={mob.meta.author}
                onChange={e => setMob({ ...mob, meta: { ...mob.meta, author: e.target.value } })} />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={2} value={mob.meta.description}
              onChange={e => setMob({ ...mob, meta: { ...mob.meta, description: e.target.value } })} />
          </div>
        </CollapsibleSection>

        {/* ── STATS ── */}
        <CollapsibleSection title="Statistiques" icon="📊" defaultOpen={true}>
          <div className="form-row">
            <div className="form-group">
              <label>❤️ Vie max</label>
              <input type="number" min={1} max={2000} step={1} value={mob.stats.max_health}
                onChange={e => setMob({ ...mob, stats: { ...mob.stats, max_health: +e.target.value } })} />
            </div>
            <div className="form-group">
              <label>💨 Vitesse</label>
              <input type="number" min={0} max={2} step={0.01} value={mob.stats.move_speed}
                onChange={e => setMob({ ...mob, stats: { ...mob.stats, move_speed: +e.target.value } })} />
            </div>
            <div className="form-group">
              <label>⚔️ Dégâts</label>
              <input type="number" min={0} max={200} step={0.5} value={mob.stats.attack_damage}
                onChange={e => setMob({ ...mob, stats: { ...mob.stats, attack_damage: +e.target.value } })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>👁️ Portée détection</label>
              <input type="number" min={1} max={64} step={1} value={mob.stats.detection_range}
                onChange={e => setMob({ ...mob, stats: { ...mob.stats, detection_range: +e.target.value } })} />
            </div>
            <div className="form-group">
              <label>🛡️ Armure</label>
              <input type="number" min={0} max={30} step={1} value={mob.stats.armor}
                onChange={e => setMob({ ...mob, stats: { ...mob.stats, armor: +e.target.value } })} />
            </div>
            <div className="form-group">
              <label>🔨 Résist. recul</label>
              <input type="number" min={0} max={1} step={0.1} value={mob.stats.knockback_resistance}
                onChange={e => setMob({ ...mob, stats: { ...mob.stats, knockback_resistance: +e.target.value } })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>🧟 Mob de base</label>
              <select value={mob.stats.base_mob_type}
                onChange={e => setMob({ ...mob, stats: { ...mob.stats, base_mob_type: e.target.value } })}>
                {BASE_MOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>📐 Échelle</label>
              <input type="number" min={0.1} max={5} step={0.1} value={mob.stats.scale}
                onChange={e => setMob({ ...mob, stats: { ...mob.stats, scale: +e.target.value } })} />
            </div>
          </div>
        </CollapsibleSection>

        {/* ── MODEL PARTS (advanced) ── */}
        {advancedMode && (
        <CollapsibleSection title="Modèle (Parts)" icon="🧱" badge={`${mob.parts.length}`}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <button className="btn btn-primary"
              onClick={() => setMob({ ...mob, parts: [...mob.parts, createDefaultPart()] })}>
              ➕ Ajouter une part
            </button>
            <label className="btn" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
              📥 Importer Blockbench
              <input type="file" accept=".json,.bbmodel" style={{ display: "none" }}
                onChange={handleBlockbenchImport} />
            </label>
          </div>

          {importMessage && (
            <div className={`alert ${importMessage.startsWith("✅") ? "alert-success" : "alert-error"}`}
              style={{ marginBottom: 12, fontSize: "0.85rem" }}>
              {importMessage}
            </div>
          )}

          {/* Multi-select grouping action */}
          {selectedPartIds.length > 1 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 12, padding: "8px 12px",
              background: "var(--accent)", borderRadius: "var(--radius)", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fff" }}>
                🔗 {selectedPartIds.length} parts sélectionnées
              </span>
              <input type="text" placeholder="Nom du groupe..."
                style={{ flex: 1, fontSize: "0.8rem" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const groupName = (e.target as HTMLInputElement).value;
                    setMob(prev => ({
                      ...prev,
                      parts: prev.parts.map(p =>
                        selectedPartIds.includes(p.id) ? { ...p, group: groupName } : p
                      ),
                    }));
                    setMessage({ text: `📁 ${selectedPartIds.length} parts groupées dans "${groupName || "Racine"}"`, type: "success" });
                    setTimeout(() => setMessage(null), 3000);
                  }
                }}
              />
              <button className="btn btn-sm" style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
                onClick={() => {
                  const groupName = prompt("Nom du groupe pour les parts sélectionnées :", "") ?? "";
                  setMob(prev => ({
                    ...prev,
                    parts: prev.parts.map(p =>
                      selectedPartIds.includes(p.id) ? { ...p, group: groupName } : p
                    ),
                  }));
                  setMessage({ text: `📁 ${selectedPartIds.length} parts groupées dans "${groupName || "Racine"}"`, type: "success" });
                  setTimeout(() => setMessage(null), 3000);
                }}>
                📁 Grouper
              </button>
            </div>
          )}

          {/* Group filter tabs */}
          {groupNames.length > 1 && (
            <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
              {groupNames.map((g) => (
                <button key={g} className={`viewer-tool-btn ${g === "" ? "" : ""}`}
                  style={{ fontSize: "0.72rem", padding: "3px 8px" }}
                  title={g || "Sans groupe"}>
                  📁 {g || "Racine"} ({partGroups[g].length})
                </button>
              ))}
            </div>
          )}

          {groupNames.map((groupName) => (
            <div key={groupName}>
              {groupNames.length > 1 && (
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--accent)",
                  margin: "12px 0 6px", padding: "4px 8px", background: "var(--bg-input)",
                  borderRadius: "var(--radius)", borderLeft: "3px solid var(--accent)" }}>
                  📁 {groupName || "Racine"}
                </div>
              )}
              {partGroups[groupName].map((part) => {
                const idx = mob.parts.findIndex((p) => p.id === part.id);
                const isSelected = selectedPartIds.includes(part.id);
                return (
                  <div key={part.id} className={`card ${isSelected ? 'viewer-part-selected' : ''}`}
                    style={{ marginBottom: 12, background: isSelected ? "var(--bg-card)" : "var(--bg-secondary)",
                             borderColor: isSelected ? "var(--accent)" : undefined,
                             cursor: "pointer" }}
                    onClick={(e) => handleSelectPart(part.id, e.ctrlKey || e.metaKey)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <h3 style={{ margin: 0, fontSize: "0.9rem" }}>
                        {isSelected && <span style={{ color: "var(--accent)", marginRight: 4 }}>◉</span>}
                        Part #{idx + 1}: {part.name}
                      </h3>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-sm" title="Sélectionner dans la vue 3D"
                          onClick={(e) => { e.stopPropagation(); handleSelectPart(part.id, e.ctrlKey || e.metaKey); }}
                          style={{ background: isSelected ? "var(--accent)" : undefined }}>
                          🎯
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={(e) => {
                          e.stopPropagation();
                          if (isSelected) setSelectedPartIds(prev => prev.filter(id => id !== part.id));
                          setMob({ ...mob, parts: mob.parts.filter((_, i) => i !== idx) });
                        }}>🗑️</button>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nom</label>
                        <input type="text" value={part.name}
                          onChange={e => updatePart(idx, { name: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>Type</label>
                        <select value={part.type}
                          onChange={e => updatePart(idx, { type: e.target.value as any })}>
                          {PART_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>📁 Groupe</label>
                        <input type="text" value={part.group || ""} placeholder="ex: bras_droit"
                          onChange={e => updatePart(idx, { group: e.target.value })} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>{part.type === "text_display" ? "Texte" : "Bloc/Item"}</label>
                      {part.type === "text_display" ? (
                        <input type="text" value={part.block}
                          onChange={e => updatePart(idx, { block: e.target.value })} />
                      ) : (
                        <>
                          {/* Category tabs */}
                          <div style={{ display: "flex", gap: 3, marginBottom: 6, flexWrap: "wrap" }}>
                            <button className={`viewer-tool-btn ${blockCategory === null ? "active" : ""}`}
                              style={{ fontSize: "0.68rem", padding: "2px 6px" }}
                              onClick={(e) => { e.stopPropagation(); setBlockCategory(null); }}>
                              Tous
                            </button>
                            {BLOCK_CATEGORIES.map((cat) => (
                              <button key={cat.label}
                                className={`viewer-tool-btn ${blockCategory === cat.label ? "active" : ""}`}
                                style={{ fontSize: "0.68rem", padding: "2px 6px" }}
                                onClick={(e) => { e.stopPropagation(); setBlockCategory(cat.label); }}>
                                {cat.icon} {cat.label}
                              </button>
                            ))}
                          </div>
                          <select value={part.block}
                            onChange={e => updatePart(idx, { block: e.target.value })}>
                            {filteredBlocks.map(b => <option key={b} value={b}>{b.replace("minecraft:", "")}</option>)}
                            {!filteredBlocks.includes(part.block as any) && (
                              <option value={part.block}>{part.block.replace("minecraft:", "")} (actuel)</option>
                            )}
                          </select>
                        </>
                      )}
                    </div>
                    <Vec3Input label="Position (offset)" value={part.offset}
                      onChange={v => updatePart(idx, { offset: v })} />
                    <Vec3Input label="Rotation (degrés)" value={part.rotation} step={5}
                      onChange={v => updatePart(idx, { rotation: v })} />
                    <Vec3Input label="Échelle" value={part.scale}
                      onChange={v => updatePart(idx, { scale: v })} />
                    <div className="form-group">
                      <label>Parent (ID)</label>
                      <select value={part.parent_id || ""}
                        onChange={e => updatePart(idx, { parent_id: e.target.value || null })}>
                        <option value="">Aucun</option>
                        {mob.parts.filter((_, i) => i !== idx).map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </CollapsibleSection>
        )}

        {/* ── HITBOXES (advanced) ── */}
        {advancedMode && (
        <CollapsibleSection title="Hitboxes (Collision)" icon="🟢" badge={`${(mob.hitboxes || []).length}`}>
          <button className="btn btn-primary" style={{ marginBottom: 12 }}
            onClick={() => setMob({ ...mob, hitboxes: [...(mob.hitboxes || []), createDefaultHitbox()] })}>
            ➕ Ajouter une hitbox
          </button>

          {(mob.hitboxes || []).map((hb, hbIdx) => (
            <div key={hb.id} className="card" style={{ marginBottom: 12, background: "var(--bg-secondary)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: "0.9rem" }}>🟢 {hb.name}</h3>
                <button className="btn btn-danger btn-sm" onClick={() => {
                  setMob({ ...mob, hitboxes: mob.hitboxes!.filter((_, i) => i !== hbIdx) });
                }}>🗑️</button>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Nom</label>
                  <input type="text" value={hb.name}
                    onChange={e => updateHitbox(hbIdx, { name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Forme</label>
                  <select value={hb.shape}
                    onChange={e => updateHitbox(hbIdx, { shape: e.target.value as HitboxShape })}>
                    <option value="box">📦 Boîte</option>
                    <option value="sphere">🔵 Sphère</option>
                    <option value="cylinder">🛢️ Cylindre</option>
                  </select>
                </div>
              </div>
              <Vec3Input label="Position (offset)" value={hb.offset}
                onChange={v => updateHitbox(hbIdx, { offset: v })} />
              <Vec3Input label={hb.shape === "sphere" ? "Taille [rayon, -, -]" : hb.shape === "cylinder" ? "Taille [rayon, hauteur, -]" : "Taille [L, H, P]"} value={hb.size}
                onChange={v => updateHitbox(hbIdx, { size: v })} />
              <div className="form-group">
                <label>Attachée à une part</label>
                <select value={hb.attached_part_id || ""}
                  onChange={e => updateHitbox(hbIdx, { attached_part_id: e.target.value || null })}>
                  <option value="">Aucune (position globale)</option>
                  {mob.parts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          ))}
        </CollapsibleSection>
        )}

        {/* ── ATTACKS (advanced) ── */}
        {advancedMode && (
        <CollapsibleSection title="Attaques" icon="⚔️" badge={`${mob.attacks.length}`}>
          <button className="btn btn-primary" style={{ marginBottom: 12 }}
            onClick={() => setMob({ ...mob, attacks: [...mob.attacks, createDefaultAttack()] })}>
            ➕ Ajouter une attaque
          </button>

          {mob.attacks.map((atk, atkIdx) => (
            <div key={atk.id} className="card" style={{ marginBottom: 12, background: "var(--bg-secondary)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: "0.9rem" }}>⚔️ {atk.name}</h3>
                <button className="btn btn-danger btn-sm" onClick={() => {
                  setMob({ ...mob, attacks: mob.attacks.filter((_, i) => i !== atkIdx) });
                }}>🗑️</button>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Nom</label>
                  <input type="text" value={atk.name}
                    onChange={e => updateAttack(atkIdx, { name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select value={atk.attack_type}
                    onChange={e => updateAttack(atkIdx, { attack_type: e.target.value as any })}>
                    {ATTACK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>💥 Dégâts</label>
                  <input type="number" min={0} max={200} step={0.5} value={atk.damage}
                    onChange={e => updateAttack(atkIdx, { damage: +e.target.value })} />
                </div>
                <div className="form-group">
                  <label>📏 Portée</label>
                  <input type="number" min={0} max={32} step={0.5} value={atk.range}
                    onChange={e => updateAttack(atkIdx, { range: +e.target.value })} />
                </div>
                <div className="form-group">
                  <label>⏱️ Cooldown (sec)</label>
                  <input type="number" min={0} max={60} step={0.5} value={atk.cooldown}
                    onChange={e => updateAttack(atkIdx, { cooldown: +e.target.value })} />
                </div>
              </div>

              {atk.attack_type === "ranged" && (
                <div className="form-group">
                  <label>🏹 Vitesse projectile</label>
                  <input type="number" min={0.1} max={5} step={0.1} value={atk.speed}
                    onChange={e => updateAttack(atkIdx, { speed: +e.target.value })} />
                </div>
              )}

              {atk.attack_type === "area" && (
                <div className="form-group">
                  <label>💥 Rayon de zone</label>
                  <input type="number" min={0.5} max={16} step={0.5} value={atk.radius}
                    onChange={e => updateAttack(atkIdx, { radius: +e.target.value })} />
                </div>
              )}

              <div className="form-group">
                <label>🔨 Recul</label>
                <input type="number" min={0} max={5} step={0.1} value={atk.knockback}
                  onChange={e => updateAttack(atkIdx, { knockback: +e.target.value })} />
              </div>

              <div className="form-group">
                <label>🎬 Animation liée</label>
                <select value={atk.animation_id || ""}
                  onChange={e => updateAttack(atkIdx, { animation_id: e.target.value || null })}>
                  <option value="">Aucune</option>
                  {mob.animations.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              {/* Effets visuels */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 8 }}>
                <h4 style={{ margin: "0 0 8px" }}>Effets visuels</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>✨ Particule</label>
                    <select value={atk.particle || ""}
                      onChange={e => updateAttack(atkIdx, { particle: e.target.value || null })}>
                      <option value="">Aucune</option>
                      {COMMON_PARTICLES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Quantité</label>
                    <input type="number" min={1} max={100} value={atk.particle_count}
                      onChange={e => updateAttack(atkIdx, { particle_count: +e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>🔊 Son</label>
                    <select value={atk.sound || ""}
                      onChange={e => updateAttack(atkIdx, { sound: e.target.value || null })}>
                      <option value="">Aucun</option>
                      {COMMON_SOUNDS.map(s => <option key={s} value={s}>{s.split(".").pop()}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Volume</label>
                    <input type="number" min={0} max={3} step={0.1} value={atk.sound_volume}
                      onChange={e => updateAttack(atkIdx, { sound_volume: +e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Pitch</label>
                    <input type="number" min={0.1} max={2} step={0.1} value={atk.sound_pitch}
                      onChange={e => updateAttack(atkIdx, { sound_pitch: +e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Effet de statut */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 8 }}>
                <h4 style={{ margin: "0 0 8px" }}>Effet de statut</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>💀 Effet</label>
                    <select value={atk.status_effect || ""}
                      onChange={e => updateAttack(atkIdx, { status_effect: e.target.value || null })}>
                      <option value="">Aucun</option>
                      {STATUS_EFFECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Durée (sec)</label>
                    <input type="number" min={1} max={60} value={atk.status_duration}
                      onChange={e => updateAttack(atkIdx, { status_duration: +e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Niveau</label>
                    <input type="number" min={0} max={4} value={atk.status_amplifier}
                      onChange={e => updateAttack(atkIdx, { status_amplifier: +e.target.value })} />
                  </div>
                </div>
              </div>

              {/* ── Hitboxes d'attaque ── */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <h4 style={{ margin: 0 }}>🔴 Hitboxes d'attaque ({(atk.hitboxes || []).length})</h4>
                  <button className="btn btn-sm" onClick={() => {
                    const linkedAnim = mob.animations.find(a => a.id === atk.animation_id);
                    const duration = linkedAnim?.duration_ticks || 20;
                    const newHb = createDefaultAttackHitbox(duration);
                    updateAttack(atkIdx, { hitboxes: [...(atk.hitboxes || []), newHb] });
                  }}>➕ Hitbox</button>
                </div>
                {(atk.hitboxes || []).map((ahb, ahbIdx) => (
                  <div key={ahb.id} style={{ padding: 8, margin: "6px 0", background: "var(--bg-tertiary)", borderRadius: 6, borderLeft: "3px solid #ef4444" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>🔴 {ahb.name}</span>
                      <button className="btn btn-danger btn-sm" style={{ fontSize: "0.7rem", padding: "2px 6px" }}
                        onClick={() => {
                          updateAttack(atkIdx, { hitboxes: atk.hitboxes!.filter((_, i) => i !== ahbIdx) });
                        }}>✕</button>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nom</label>
                        <input type="text" value={ahb.name}
                          onChange={e => updateAttackHitbox(atkIdx, ahbIdx, { name: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>Forme</label>
                        <select value={ahb.shape}
                          onChange={e => updateAttackHitbox(atkIdx, ahbIdx, { shape: e.target.value as HitboxShape })}>
                          <option value="box">📦 Boîte</option>
                          <option value="sphere">🔵 Sphère</option>
                          <option value="cylinder">🛢️ Cylindre</option>
                        </select>
                      </div>
                    </div>
                    <Vec3Input label="Position (offset)" value={ahb.offset}
                      onChange={v => updateAttackHitbox(atkIdx, ahbIdx, { offset: v })} />
                    <Vec3Input label="Taille" value={ahb.size}
                      onChange={v => updateAttackHitbox(atkIdx, ahbIdx, { size: v })} />
                    <div className="form-row">
                      <div className="form-group">
                        <label>⏱️ Tick début</label>
                        <input type="number" min={0} max={200} value={ahb.active_start_tick}
                          onChange={e => updateAttackHitbox(atkIdx, ahbIdx, { active_start_tick: +e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>⏱️ Tick fin</label>
                        <input type="number" min={0} max={200} value={ahb.active_end_tick}
                          onChange={e => updateAttackHitbox(atkIdx, ahbIdx, { active_end_tick: +e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>💥 Dégâts override</label>
                        <input type="number" min={0} max={200} step={0.5}
                          value={ahb.damage_override ?? ""}
                          placeholder="Par défaut"
                          onChange={e => updateAttackHitbox(atkIdx, ahbIdx, {
                            damage_override: e.target.value ? +e.target.value : null
                          })} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CollapsibleSection>
        )}

        {/* ── BEHAVIOR ── */}
        <CollapsibleSection title="Comportement IA" icon="🧠">
          <div className="form-row">
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={mob.behavior.hostile}
                onChange={e => setMob({ ...mob, behavior: { ...mob.behavior, hostile: e.target.checked, passive: false, neutral: false } })} />
              <label>😡 Hostile</label>
            </div>
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={mob.behavior.passive}
                onChange={e => setMob({ ...mob, behavior: { ...mob.behavior, passive: e.target.checked, hostile: false, neutral: false } })} />
              <label>😊 Passif</label>
            </div>
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={mob.behavior.neutral}
                onChange={e => setMob({ ...mob, behavior: { ...mob.behavior, neutral: e.target.checked, hostile: false, passive: false } })} />
              <label>😐 Neutre</label>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={mob.behavior.wandering}
                onChange={e => setMob({ ...mob, behavior: { ...mob.behavior, wandering: e.target.checked } })} />
              <label>🚶 Errance</label>
            </div>
            {mob.behavior.wandering && (
              <div className="form-group">
                <label>Rayon d'errance</label>
                <input type="number" min={1} max={50} value={mob.behavior.wander_radius}
                  onChange={e => setMob({ ...mob, behavior: { ...mob.behavior, wander_radius: +e.target.value } })} />
              </div>
            )}
          </div>
          {advancedMode && (<>
          <div className="form-row">
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={mob.behavior.can_burn}
                onChange={e => setMob({ ...mob, behavior: { ...mob.behavior, can_burn: e.target.checked } })} />
              <label>🔥 Peut brûler</label>
            </div>
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={mob.behavior.can_drown}
                onChange={e => setMob({ ...mob, behavior: { ...mob.behavior, can_drown: e.target.checked } })} />
              <label>🌊 Peut se noyer</label>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={mob.behavior.show_health_bar}
                onChange={e => setMob({ ...mob, behavior: { ...mob.behavior, show_health_bar: e.target.checked } })} />
              <label>❤️ Barre de vie</label>
            </div>
            <div className="form-group">
              <label>🎨 Couleur nom</label>
              <input type="color" value={mob.behavior.name_color}
                onChange={e => setMob({ ...mob, behavior: { ...mob.behavior, name_color: e.target.value } })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={mob.behavior.boss}
                onChange={e => setMob({ ...mob, behavior: { ...mob.behavior, boss: e.target.checked } })} />
              <label>👑 Boss</label>
            </div>
            {mob.behavior.boss && (
              <div className="form-group">
                <label>Portée barre boss</label>
                <input type="number" min={1} max={128} value={mob.behavior.boss_bar_range}
                  onChange={e => setMob({ ...mob, behavior: { ...mob.behavior, boss_bar_range: +e.target.value } })} />
              </div>
            )}
          </div>
          </>)}

          {/* ── Règles IA custom (advanced) ── */}
          {advancedMode && (
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: "0.95rem" }}>🧩 Règles IA Avancées ({(mob.behavior.ai_rules || []).length})</h3>
              <button className="btn btn-primary btn-sm"
                onClick={() => setMob({
                  ...mob,
                  behavior: {
                    ...mob.behavior,
                    ai_rules: [...(mob.behavior.ai_rules || []), createDefaultAIRule()],
                  },
                })}>
                ➕ Ajouter une règle
              </button>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: 12 }}>
              Crée des comportements personnalisés : quand une condition est remplie, le mob exécute une action.
            </p>

            {(mob.behavior.ai_rules || []).map((rule, ruleIdx) => {
              const condMeta = AI_CONDITIONS.find(c => c.value === rule.condition);
              const actMeta = AI_ACTIONS.find(a => a.value === rule.action);
              return (
                <div key={rule.id} className="card" style={{
                  marginBottom: 10, padding: 12, background: "var(--bg-secondary)",
                  opacity: rule.enabled ? 1 : 0.5,
                  borderLeft: `3px solid ${rule.enabled ? "var(--accent)" : "var(--text-muted)"}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="checkbox" checked={rule.enabled}
                        onChange={e => updateAIRule(ruleIdx, { enabled: e.target.checked })} />
                      <input type="text" value={rule.name} style={{ fontWeight: 600, fontSize: "0.85rem", width: 180 }}
                        onChange={e => updateAIRule(ruleIdx, { name: e.target.value })} />
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="btn btn-sm" title="Monter" disabled={ruleIdx === 0}
                        onClick={() => moveAIRule(ruleIdx, -1)}>⬆</button>
                      <button className="btn btn-sm" title="Descendre"
                        disabled={ruleIdx === (mob.behavior.ai_rules || []).length - 1}
                        onClick={() => moveAIRule(ruleIdx, 1)}>⬇</button>
                      <button className="btn btn-danger btn-sm"
                        onClick={() => setMob({
                          ...mob,
                          behavior: {
                            ...mob.behavior,
                            ai_rules: mob.behavior.ai_rules.filter((_, i) => i !== ruleIdx),
                          },
                        })}>🗑️</button>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ flex: 2 }}>
                      <label>📋 Condition</label>
                      <select value={rule.condition}
                        onChange={e => updateAIRule(ruleIdx, { condition: e.target.value as any })}>
                        {AI_CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    {condMeta && condMeta.unit && (
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Valeur ({condMeta.unit})</label>
                        <input type="number" min={0} step={1} value={rule.condition_value}
                          onChange={e => updateAIRule(ruleIdx, { condition_value: +e.target.value })} />
                      </div>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ flex: 2 }}>
                      <label>⚡ Action</label>
                      <select value={rule.action}
                        onChange={e => updateAIRule(ruleIdx, { action: e.target.value as any })}>
                        {AI_ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 2 }}>
                      <label>Paramètre {actMeta && <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>({actMeta.valueHint})</span>}</label>
                      <input type="text" value={rule.action_value} placeholder={actMeta?.valueHint || ""}
                        onChange={e => updateAIRule(ruleIdx, { action_value: e.target.value })} />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>⏱️ Cooldown (sec)</label>
                      <input type="number" min={0} max={300} step={1} value={rule.cooldown}
                        onChange={e => updateAIRule(ruleIdx, { cooldown: +e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>🔢 Priorité</label>
                      <input type="number" min={0} max={100} value={rule.priority}
                        onChange={e => updateAIRule(ruleIdx, { priority: +e.target.value })} />
                    </div>
                  </div>

                  {actMeta && (
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "4px 0 0" }}>
                      ℹ️ {actMeta.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </CollapsibleSection>

        {/* ── SOUNDS (advanced) ── */}
        {advancedMode && (
        <CollapsibleSection title="Sons" icon="🔊">
          <div className="form-row">
            <div className="form-group">
              <label>🔉 Son ambiant</label>
              <select value={mob.sounds.ambient || ""}
                onChange={e => setMob({ ...mob, sounds: { ...mob.sounds, ambient: e.target.value || null } })}>
                <option value="">Aucun</option>
                {COMMON_SOUNDS.map(s => <option key={s} value={s}>{s.split(".").pop()}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>💔 Son blessure</label>
              <select value={mob.sounds.hurt || ""}
                onChange={e => setMob({ ...mob, sounds: { ...mob.sounds, hurt: e.target.value || null } })}>
                <option value="">Aucun</option>
                {COMMON_SOUNDS.map(s => <option key={s} value={s}>{s.split(".").pop()}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>💀 Son mort</label>
              <select value={mob.sounds.death || ""}
                onChange={e => setMob({ ...mob, sounds: { ...mob.sounds, death: e.target.value || null } })}>
                <option value="">Aucun</option>
                {COMMON_SOUNDS.map(s => <option key={s} value={s}>{s.split(".").pop()}</option>)}
              </select>
            </div>
          </div>
        </CollapsibleSection>
        )}

        {/* ── LOOT (advanced) ── */}
        {advancedMode && (
        <CollapsibleSection title="Butin (Loot)" icon="💰" badge={`${mob.loot.length}`}>
          <button className="btn btn-primary" style={{ marginBottom: 12 }}
            onClick={() => setMob({ ...mob, loot: [...mob.loot, createDefaultLootEntry()] })}>
            ➕ Ajouter un loot
          </button>

          {mob.loot.map((entry, lootIdx) => (
            <div key={lootIdx} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, padding: 8, background: "var(--bg-secondary)", borderRadius: 6 }}>
              <div className="form-group" style={{ flex: 2 }}>
                <label>Item</label>
                <input type="text" value={entry.item} placeholder="minecraft:diamond"
                  onChange={e => updateLoot(lootIdx, { item: e.target.value })} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Min</label>
                <input type="number" min={1} max={64} value={entry.min_amount}
                  onChange={e => updateLoot(lootIdx, { min_amount: +e.target.value })} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Max</label>
                <input type="number" min={1} max={64} value={entry.max_amount}
                  onChange={e => updateLoot(lootIdx, { max_amount: +e.target.value })} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Chance</label>
                <input type="number" min={0} max={1} step={0.05} value={entry.chance}
                  onChange={e => updateLoot(lootIdx, { chance: +e.target.value })} />
              </div>
              <button className="btn btn-danger btn-sm" style={{ marginTop: 16 }}
                onClick={() => setMob({ ...mob, loot: mob.loot.filter((_, i) => i !== lootIdx) })}>🗑️</button>
            </div>
          ))}
        </CollapsibleSection>
        )}
      </div>
    </div>
  );

  // ══════════════════════════════════════════
  // HELPER FUNCTIONS
  // ══════════════════════════════════════════

  function updatePart(idx: number, updates: Partial<ModelPart>) {
    const parts = [...mob.parts];
    parts[idx] = { ...parts[idx], ...updates };
    setMob({ ...mob, parts });
  }

  function updateAnimation(idx: number, updates: Partial<MobAnimation>) {
    const animations = [...mob.animations];
    animations[idx] = { ...animations[idx], ...updates };
    setMob({ ...mob, animations });
  }

  function updateKeyframe(animIdx: number, kfIdx: number, updates: Partial<AnimationKeyframe>) {
    const animations = [...mob.animations];
    const kfs = [...animations[animIdx].keyframes];
    kfs[kfIdx] = { ...kfs[kfIdx], ...updates };
    animations[animIdx] = { ...animations[animIdx], keyframes: kfs };
    setMob({ ...mob, animations });
  }

  function updateAttack(idx: number, updates: Partial<MobAttack>) {
    const attacks = [...mob.attacks];
    attacks[idx] = { ...attacks[idx], ...updates };
    setMob({ ...mob, attacks });
  }

  function updateHitbox(idx: number, updates: Partial<Hitbox>) {
    const hitboxes = [...(mob.hitboxes || [])];
    hitboxes[idx] = { ...hitboxes[idx], ...updates };
    setMob({ ...mob, hitboxes });
  }

  function updateAttackHitbox(atkIdx: number, hbIdx: number, updates: Partial<AttackHitbox>) {
    const attacks = [...mob.attacks];
    const hitboxes = [...(attacks[atkIdx].hitboxes || [])];
    hitboxes[hbIdx] = { ...hitboxes[hbIdx], ...updates };
    attacks[atkIdx] = { ...attacks[atkIdx], hitboxes };
    setMob({ ...mob, attacks });
  }

  function updateLoot(idx: number, updates: Partial<LootEntry>) {
    const loot = [...mob.loot];
    loot[idx] = { ...loot[idx], ...updates };
    setMob({ ...mob, loot });
  }

  function updateAIRule(idx: number, updates: Partial<AIRule>) {
    const rules = [...(mob.behavior.ai_rules || [])];
    rules[idx] = { ...rules[idx], ...updates };
    setMob({ ...mob, behavior: { ...mob.behavior, ai_rules: rules } });
  }

  function moveAIRule(idx: number, direction: -1 | 1) {
    const rules = [...(mob.behavior.ai_rules || [])];
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= rules.length) return;
    [rules[idx], rules[targetIdx]] = [rules[targetIdx], rules[idx]];
    setMob({ ...mob, behavior: { ...mob.behavior, ai_rules: rules } });
  }
}
