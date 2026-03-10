import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import type { MobAnimation, AnimationKeyframe, ModelPart } from "../../types/mob";

// ══════════════════════════════════════════════════════════
// Unity-style Animation Timeline (Dopesheet)
// ══════════════════════════════════════════════════════════

export interface AnimationTimelineProps {
  animations: MobAnimation[];
  parts: ModelPart[];
  selectedAnimationId: string | null;
  currentTick: number;
  playing: boolean;
  speed: number;
  selectedKeyframe: { animIdx: number; kfIdx: number } | null;
  onSelectAnimation: (id: string | null) => void;
  onAnimationChange: (animIdx: number, patch: Partial<MobAnimation>) => void;
  onAddAnimation: () => void;
  onDeleteAnimation: (animIdx: number) => void;
  onSelectKeyframe: (sel: { animIdx: number; kfIdx: number } | null) => void;
  onAddKeyframe: (animIdx: number, tick: number, partIds: string[]) => void;
  onDeleteKeyframe: (animIdx: number, kfIdx: number) => void;
  onKeyframeChange: (animIdx: number, kfIdx: number, patch: Partial<AnimationKeyframe>) => void;
  onTickChange: (tick: number) => void;
  onPlayPause: () => void;
  onStop: () => void;
  onSpeedChange: (speed: number) => void;
  selectedPartIds: string[];
}

const TRACK_HEIGHT = 28;
const HEADER_WIDTH = 160;
const TICK_PX = 6; // pixels per tick
const RULER_HEIGHT = 28;
const MIN_TIMELINE_WIDTH = 400;

// Color palette for part tracks
const TRACK_COLORS = [
  "#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#ec4899", "#06b6d4", "#8b5cf6", "#14b8a6", "#f97316",
];

export function AnimationTimeline({
  animations,
  parts,
  selectedAnimationId,
  currentTick,
  playing,
  speed,
  selectedKeyframe,
  onSelectAnimation,
  onAnimationChange,
  onAddAnimation,
  onDeleteAnimation,
  onSelectKeyframe,
  onAddKeyframe,
  onDeleteKeyframe,
  onKeyframeChange,
  onTickChange,
  onPlayPause,
  onStop,
  onSpeedChange,
  selectedPartIds,
}: AnimationTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [draggingKf, setDraggingKf] = useState<{ animIdx: number; kfIdx: number; startTick: number; startX: number } | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const [editingName, setEditingName] = useState(false);

  const animIdx = animations.findIndex(a => a.id === selectedAnimationId);
  const anim = animIdx >= 0 ? animations[animIdx] : null;
  const totalTicks = anim?.duration_ticks ?? 40;
  const timelineWidth = Math.max(MIN_TIMELINE_WIDTH, totalTicks * TICK_PX);

  // Build per-part tracks
  const tracks = useMemo(() => {
    if (!anim) return [];
    return parts.map((part, pi) => {
      const keyframes = anim.keyframes
        .map((kf, kfIdx) => ({ kf, kfIdx }))
        .filter(({ kf }) => kf.part_ids.includes(part.id));
      return { part, partIdx: pi, keyframes, color: TRACK_COLORS[pi % TRACK_COLORS.length] };
    });
  }, [anim, parts]);

  // Tick → pixel position
  const tickToX = useCallback((tick: number) => (tick / totalTicks) * timelineWidth, [totalTicks, timelineWidth]);
  const xToTick = useCallback((x: number) => Math.max(0, Math.min(totalTicks, Math.round((x / timelineWidth) * totalTicks))), [totalTicks, timelineWidth]);

  // Scrubbing via ruler
  const handleRulerMouse = useCallback((e: React.MouseEvent) => {
    if (playing) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left + (timelineRef.current?.scrollLeft ?? 0);
    onTickChange(xToTick(x));
  }, [playing, xToTick, onTickChange]);

  const handleRulerDown = useCallback((e: React.MouseEvent) => {
    handleRulerMouse(e);
    setScrubbing(true);
  }, [handleRulerMouse]);

  // Global mouse events for scrubbing & keyframe dragging
  useEffect(() => {
    if (!scrubbing && !draggingKf) return;
    const onMove = (e: MouseEvent) => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const scrollLeft = timelineRef.current.scrollLeft;
      const x = e.clientX - rect.left + scrollLeft;
      if (scrubbing) {
        onTickChange(xToTick(x));
      }
      if (draggingKf) {
        const dx = e.clientX - draggingKf.startX;
        const dtick = Math.round(dx / TICK_PX);
        const newTick = Math.max(0, Math.min(totalTicks, draggingKf.startTick + dtick));
        onKeyframeChange(draggingKf.animIdx, draggingKf.kfIdx, { tick: newTick });
      }
    };
    const onUp = () => { setScrubbing(false); setDraggingKf(null); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [scrubbing, draggingKf, xToTick, onTickChange, onKeyframeChange, totalTicks]);

  // Double-click on track to add keyframe at that tick
  const handleTrackDblClick = useCallback((e: React.MouseEvent, partId: string) => {
    if (!anim || animIdx < 0) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left + (timelineRef.current?.scrollLeft ?? 0);
    const tick = xToTick(x);
    onAddKeyframe(animIdx, tick, [partId]);
  }, [anim, animIdx, xToTick, onAddKeyframe]);

  // Ruler tick marks
  const rulerMarks = useMemo(() => {
    const marks: { tick: number; major: boolean }[] = [];
    const step = totalTicks <= 40 ? 5 : totalTicks <= 100 ? 10 : 20;
    for (let t = 0; t <= totalTicks; t += step) {
      marks.push({ tick: t, major: t % (step * 2) === 0 || t === 0 });
    }
    return marks;
  }, [totalTicks]);

  return (
    <div className="anim-timeline-panel">
      {/* ── Header Bar ── */}
      <div className="anim-tl-header">
        <div className="anim-tl-header-left">
          <span className="anim-tl-title">🎬 Animation Timeline</span>
          <select
            className="anim-tl-select"
            value={selectedAnimationId ?? ""}
            onChange={e => onSelectAnimation(e.target.value || null)}
          >
            <option value="">— Sélectionner —</option>
            {animations.map((a, i) => (
              <option key={a.id} value={a.id}>{a.name} ({a.duration_ticks}t)</option>
            ))}
          </select>
          <button className="anim-tl-btn anim-tl-btn-accent" onClick={onAddAnimation} title="Nouvelle animation">
            + Anim
          </button>
        </div>
        <div className="anim-tl-header-right">
          {anim && (
            <>
              <button className={`anim-tl-btn ${playing ? "anim-tl-btn-active" : ""}`} onClick={onPlayPause}>
                {playing ? "⏸" : "▶"}
              </button>
              <button className="anim-tl-btn" onClick={onStop}>⏹</button>
              <div className="anim-tl-speed">
                <span className="anim-tl-label">{speed.toFixed(1)}x</span>
                <input type="range" min={0.1} max={3} step={0.1} value={speed} onChange={e => onSpeedChange(parseFloat(e.target.value))} />
              </div>
              <div className="anim-tl-separator" />
              <span className="anim-tl-tick-display">
                <span className="anim-tl-tick-num">{currentTick}</span>
                <span className="anim-tl-tick-label">/ {totalTicks} ticks</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Animation Config (when selected) ── */}
      {anim && (
        <div className="anim-tl-config">
          <div className="anim-tl-config-field">
            <label>Nom</label>
            {editingName ? (
              <input
                autoFocus
                value={anim.name}
                onChange={e => onAnimationChange(animIdx, { name: e.target.value })}
                onBlur={() => setEditingName(false)}
                onKeyDown={e => e.key === "Enter" && setEditingName(false)}
                className="anim-tl-name-input"
              />
            ) : (
              <span className="anim-tl-name-display" onClick={() => setEditingName(true)}>
                {anim.name} <span className="anim-tl-edit-icon">✏️</span>
              </span>
            )}
          </div>
          <div className="anim-tl-config-field">
            <label>Durée</label>
            <input type="number" min={1} max={400} value={anim.duration_ticks}
              onChange={e => onAnimationChange(animIdx, { duration_ticks: parseInt(e.target.value) || 20 })}
              className="anim-tl-duration-input" />
            <span className="anim-tl-label">ticks</span>
          </div>
          <div className="anim-tl-config-field">
            <label className="anim-tl-checkbox">
              <input type="checkbox" checked={anim.loop}
                onChange={e => onAnimationChange(animIdx, { loop: e.target.checked })} />
              <span>🔁 Boucle</span>
            </label>
          </div>
          <div style={{ flex: 1 }} />
          <button className="anim-tl-btn anim-tl-btn-danger" onClick={() => onDeleteAnimation(animIdx)}>
            🗑️ Supprimer
          </button>
        </div>
      )}

      {/* ── Dopesheet ── */}
      {anim && (
        <div className="anim-tl-dopesheet">
          {/* Left column: track headers */}
          <div className="anim-tl-track-headers" style={{ width: HEADER_WIDTH }}>
            <div className="anim-tl-ruler-header" style={{ height: RULER_HEIGHT }}>
              <span>Parts</span>
            </div>
            {tracks.map(({ part, color }, i) => (
              <div
                key={part.id}
                className={`anim-tl-track-header ${selectedPartIds.includes(part.id) ? "active" : ""}`}
                style={{ height: TRACK_HEIGHT, borderLeftColor: color }}
              >
                <span className="anim-tl-track-dot" style={{ background: color }} />
                <span className="anim-tl-track-name" title={part.name}>
                  {part.name}
                </span>
                <span className="anim-tl-track-type">{part.type.replace("_display", "")}</span>
              </div>
            ))}
            {parts.length === 0 && (
              <div className="anim-tl-empty-tracks">Ajoutez des parts au modèle</div>
            )}
          </div>

          {/* Right column: scrollable timeline */}
          <div className="anim-tl-scroll-area" ref={timelineRef}>
            <div className="anim-tl-scroll-inner" style={{ width: timelineWidth }}>
              {/* Ruler */}
              <div
                className="anim-tl-ruler"
                style={{ height: RULER_HEIGHT }}
                onMouseDown={handleRulerDown}
              >
                {rulerMarks.map(({ tick, major }) => (
                  <div
                    key={tick}
                    className={`anim-tl-ruler-mark ${major ? "major" : ""}`}
                    style={{ left: tickToX(tick) }}
                  >
                    {major && <span className="anim-tl-ruler-label">{tick}</span>}
                  </div>
                ))}
                {/* Playhead */}
                <div
                  className="anim-tl-playhead"
                  style={{ left: tickToX(currentTick) }}
                />
              </div>

              {/* Tracks */}
              {tracks.map(({ part, keyframes, color }, trackIdx) => (
                <div
                  key={part.id}
                  className={`anim-tl-track ${selectedPartIds.includes(part.id) ? "active" : ""}`}
                  style={{ height: TRACK_HEIGHT }}
                  onDoubleClick={e => handleTrackDblClick(e, part.id)}
                >
                  {/* Grid lines */}
                  {rulerMarks.filter(m => m.major).map(({ tick }) => (
                    <div key={tick} className="anim-tl-grid-line" style={{ left: tickToX(tick) }} />
                  ))}

                  {/* Keyframe diamonds */}
                  {keyframes.map(({ kf, kfIdx }) => {
                    const isSelected = selectedKeyframe?.animIdx === animIdx && selectedKeyframe?.kfIdx === kfIdx;
                    const hasPos = !!kf.position;
                    const hasRot = !!kf.rotation;
                    const hasScale = !!kf.scale;
                    return (
                      <div
                        key={kfIdx}
                        className={`anim-tl-diamond ${isSelected ? "selected" : ""}`}
                        style={{
                          left: tickToX(kf.tick),
                          "--kf-color": color,
                        } as React.CSSProperties}
                        title={`Tick ${kf.tick} — ${[hasPos && "pos", hasRot && "rot", hasScale && "scale"].filter(Boolean).join("+") || "vide"}`}
                        onClick={e => {
                          e.stopPropagation();
                          onSelectKeyframe(isSelected ? null : { animIdx, kfIdx });
                          if (!isSelected) onTickChange(kf.tick);
                        }}
                        onMouseDown={e => {
                          if (e.button !== 0) return;
                          e.stopPropagation();
                          setDraggingKf({ animIdx, kfIdx, startTick: kf.tick, startX: e.clientX });
                        }}
                      >
                        <svg viewBox="0 0 12 12" className="anim-tl-diamond-svg">
                          <rect x="2" y="2" width="8" height="8" rx="1" transform="rotate(45 6 6)" />
                        </svg>
                        {/* Property indicators */}
                        <div className="anim-tl-kf-props">
                          {hasPos && <span className="kf-prop-dot kf-prop-pos" />}
                          {hasRot && <span className="kf-prop-dot kf-prop-rot" />}
                          {hasScale && <span className="kf-prop-dot kf-prop-scale" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Playhead line through tracks */}
              <div
                className="anim-tl-playhead-line"
                style={{
                  left: tickToX(currentTick),
                  top: RULER_HEIGHT,
                  height: tracks.length * TRACK_HEIGHT,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {!anim && (
        <div className="anim-tl-empty">
          <p>🎬 Sélectionnez ou créez une animation</p>
          <button className="anim-tl-btn anim-tl-btn-accent" onClick={onAddAnimation}>
            + Nouvelle Animation
          </button>
        </div>
      )}

      {/* ── Selected Keyframe Inspector ── */}
      {anim && selectedKeyframe && selectedKeyframe.animIdx === animIdx && (
        <KeyframeInspector
          anim={anim}
          animIdx={animIdx}
          kfIdx={selectedKeyframe.kfIdx}
          parts={parts}
          onKeyframeChange={onKeyframeChange}
          onDeleteKeyframe={onDeleteKeyframe}
          onSelectKeyframe={onSelectKeyframe}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// Keyframe Inspector Panel
// ══════════════════════════════════════════════════════════

function KeyframeInspector({
  anim, animIdx, kfIdx, parts,
  onKeyframeChange, onDeleteKeyframe, onSelectKeyframe,
}: {
  anim: MobAnimation;
  animIdx: number;
  kfIdx: number;
  parts: ModelPart[];
  onKeyframeChange: (animIdx: number, kfIdx: number, patch: Partial<AnimationKeyframe>) => void;
  onDeleteKeyframe: (animIdx: number, kfIdx: number) => void;
  onSelectKeyframe: (sel: { animIdx: number; kfIdx: number } | null) => void;
}) {
  const kf = anim.keyframes[kfIdx];
  if (!kf) return null;

  const updateVec = (prop: "position" | "rotation" | "scale", axis: number, val: number) => {
    const current = kf[prop] ?? [0, 0, 0];
    const next: [number, number, number] = [...current];
    next[axis] = val;
    onKeyframeChange(animIdx, kfIdx, { [prop]: next });
  };

  const toggleProp = (prop: "position" | "rotation" | "scale") => {
    if (kf[prop]) {
      onKeyframeChange(animIdx, kfIdx, { [prop]: undefined });
    } else {
      onKeyframeChange(animIdx, kfIdx, { [prop]: [0, 0, 0] });
    }
  };

  return (
    <div className="anim-tl-inspector">
      <div className="anim-tl-inspector-header">
        <span className="anim-tl-inspector-title">
          🔑 Keyframe #{kfIdx + 1}
          <span className="anim-tl-inspector-tick">t={kf.tick}</span>
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button className="anim-tl-btn anim-tl-btn-danger anim-tl-btn-sm" onClick={() => {
            onDeleteKeyframe(animIdx, kfIdx);
            onSelectKeyframe(null);
          }}>🗑️</button>
          <button className="anim-tl-btn anim-tl-btn-sm" onClick={() => onSelectKeyframe(null)}>✕</button>
        </div>
      </div>

      <div className="anim-tl-inspector-body">
        {/* Tick */}
        <div className="anim-tl-inspector-row">
          <label>Tick</label>
          <input type="number" min={0} max={anim.duration_ticks} value={kf.tick}
            onChange={e => onKeyframeChange(animIdx, kfIdx, { tick: parseInt(e.target.value) || 0 })}
            className="anim-tl-inspector-input" />
          <span className="anim-tl-label">/ {anim.duration_ticks}</span>
        </div>

        {/* Parts */}
        <div className="anim-tl-inspector-row" style={{ alignItems: "flex-start" }}>
          <label>Parts</label>
          <div className="anim-tl-inspector-parts">
            {parts.map(p => (
              <label key={p.id} className="anim-tl-part-check">
                <input type="checkbox"
                  checked={kf.part_ids.includes(p.id)}
                  onChange={e => {
                    const newIds = e.target.checked
                      ? [...kf.part_ids, p.id]
                      : kf.part_ids.filter(id => id !== p.id);
                    onKeyframeChange(animIdx, kfIdx, { part_ids: newIds });
                  }}
                />
                <span>{p.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Property toggles */}
        <div className="anim-tl-inspector-props-header">
          <span>Propriétés</span>
          <div className="anim-tl-prop-toggles">
            <button className={`anim-tl-prop-toggle ${kf.position ? "active pos" : ""}`} onClick={() => toggleProp("position")}>Pos</button>
            <button className={`anim-tl-prop-toggle ${kf.rotation ? "active rot" : ""}`} onClick={() => toggleProp("rotation")}>Rot</button>
            <button className={`anim-tl-prop-toggle ${kf.scale ? "active scale" : ""}`} onClick={() => toggleProp("scale")}>Scale</button>
          </div>
        </div>

        {/* Position */}
        {kf.position && (
          <div className="anim-tl-vec3-row">
            <span className="anim-tl-vec3-label pos">Position</span>
            {["X", "Y", "Z"].map((axis, i) => (
              <div className="anim-tl-vec3-field" key={axis}>
                <label className={`axis-${axis.toLowerCase()}`}>{axis}</label>
                <input type="number" step={0.1} value={kf.position![i]}
                  onChange={e => updateVec("position", i, parseFloat(e.target.value) || 0)} />
              </div>
            ))}
          </div>
        )}

        {/* Rotation */}
        {kf.rotation && (
          <div className="anim-tl-vec3-row">
            <span className="anim-tl-vec3-label rot">Rotation</span>
            {["X", "Y", "Z"].map((axis, i) => (
              <div className="anim-tl-vec3-field" key={axis}>
                <label className={`axis-${axis.toLowerCase()}`}>{axis}</label>
                <input type="number" step={5} value={kf.rotation![i]}
                  onChange={e => updateVec("rotation", i, parseFloat(e.target.value) || 0)} />
              </div>
            ))}
          </div>
        )}

        {/* Scale */}
        {kf.scale && (
          <div className="anim-tl-vec3-row">
            <span className="anim-tl-vec3-label scale">Échelle</span>
            {["X", "Y", "Z"].map((axis, i) => (
              <div className="anim-tl-vec3-field" key={axis}>
                <label className={`axis-${axis.toLowerCase()}`}>{axis}</label>
                <input type="number" step={0.1} value={kf.scale![i]}
                  onChange={e => updateVec("scale", i, parseFloat(e.target.value) || 0)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
