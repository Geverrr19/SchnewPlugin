import { useState } from "react";
import type { TransformMode } from "./MobViewer3D";
import type {
  CustomMob,
  ModelPart,
  MobAnimation,
} from "../../types/mob";

// ══════════════════════════════════════════
// Toolbar au-dessus du viewport 3D
// ══════════════════════════════════════════

interface ViewerToolbarProps {
  mob: CustomMob;
  selectedPartIds: string[];
  transformMode: TransformMode;
  onTransformModeChange: (mode: TransformMode) => void;
  onSelectPart: (partId: string | null) => void;
  animationState: {
    playing: boolean;
    animationId: string | null;
    currentTick: number;
    speed: number;
  };
  onAnimationStateChange: (state: {
    playing: boolean;
    animationId: string | null;
    currentTick: number;
    speed: number;
  }) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  showHitboxes?: boolean;
  onToggleHitboxes?: () => void;
  showAttackHitboxes?: boolean;
  onToggleAttackHitboxes?: () => void;
}

export function ViewerToolbar({
  mob,
  selectedPartIds,
  transformMode,
  onTransformModeChange,
  onSelectPart,
  animationState,
  onAnimationStateChange,
  isFullscreen = false,
  onToggleFullscreen,
  showHitboxes = false,
  onToggleHitboxes,
  showAttackHitboxes = false,
  onToggleAttackHitboxes,
}: ViewerToolbarProps) {
  const selectedPart = selectedPartIds.length === 1 ? mob.parts.find((p) => p.id === selectedPartIds[0]) : null;
  const currentAnimation = mob.animations.find(
    (a) => a.id === animationState.animationId
  );

  return (
    <div className="viewer-toolbar">
      {/* ── Transform Mode ── */}
      <div className="viewer-toolbar-group">
        <span className="viewer-toolbar-label">Outil</span>
        <div className="viewer-toolbar-buttons">
          <button
            className={`viewer-tool-btn ${
              transformMode === "translate" ? "active" : ""
            }`}
            onClick={() => onTransformModeChange("translate")}
            title="Déplacer (G)"
          >
            ↕️ Position
          </button>
          <button
            className={`viewer-tool-btn ${
              transformMode === "rotate" ? "active" : ""
            }`}
            onClick={() => onTransformModeChange("rotate")}
            title="Tourner (R)"
          >
            🔄 Rotation
          </button>
          <button
            className={`viewer-tool-btn ${
              transformMode === "scale" ? "active" : ""
            }`}
            onClick={() => onTransformModeChange("scale")}
            title="Redimensionner (S)"
          >
            📐 Échelle
          </button>
        </div>
      </div>

      {/* ── Part Selector ── */}
      <div className="viewer-toolbar-group">
        <span className="viewer-toolbar-label">Part</span>
        <select
          className="viewer-toolbar-select"
          value={selectedPartIds.length === 1 ? selectedPartIds[0] : ""}
          onChange={(e) => onSelectPart(e.target.value || null)}
        >
          <option value="">— Aucune —</option>
          {mob.parts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.type.replace("_display", "")})
            </option>
          ))}
        </select>
      </div>

      {/* ── Selected Part Info ── */}
      {selectedPart && (
        <div className="viewer-toolbar-group viewer-part-info">
          <span className="viewer-toolbar-label">
            📍 [{selectedPart.offset.map((n) => n.toFixed(2)).join(", ")}]
          </span>
          <span className="viewer-toolbar-label">
            🔄 [{selectedPart.rotation.map((n) => n.toFixed(1)).join("°, ")}°]
          </span>
          <span className="viewer-toolbar-label">
            📐 [{selectedPart.scale.map((n) => n.toFixed(2)).join(", ")}]
          </span>
        </div>
      )}
      {selectedPartIds.length > 1 && (
        <div className="viewer-toolbar-group viewer-part-info">
          <span className="viewer-toolbar-label" style={{ fontWeight: 600 }}>
            🔗 {selectedPartIds.length} parts sélectionnées (Ctrl+Clic pour multi-sélection)
          </span>
        </div>
      )}

      {/* ── Séparateur ── */}
      <div className="viewer-toolbar-separator" />

      {/* ── Hitbox Toggles ── */}
      <div className="viewer-toolbar-group">
        <div className="viewer-toolbar-buttons">
          {onToggleHitboxes && (
            <button
              className={`viewer-tool-btn ${showHitboxes ? "active" : ""}`}
              onClick={onToggleHitboxes}
              title="Afficher les hitboxes du mob"
            >
              🟢 Hitboxes
            </button>
          )}
          {onToggleAttackHitboxes && (
            <button
              className={`viewer-tool-btn ${showAttackHitboxes ? "active" : ""}`}
              onClick={onToggleAttackHitboxes}
              title="Afficher les hitboxes d'attaque"
            >
              🔴 Attaques
            </button>
          )}
        </div>
      </div>

      {/* ── Fullscreen ── */}
      {onToggleFullscreen && (
        <div className="viewer-toolbar-group" style={{ marginLeft: "auto" }}>
          <button
            className={`viewer-tool-btn ${isFullscreen ? "active" : ""}`}
            onClick={onToggleFullscreen}
            title="Plein écran (F11)"
          >
            {isFullscreen ? "⊠ Réduire" : "⛶ Plein écran"}
          </button>
        </div>
      )}

      {/* ── Animation Controls ── */}
      <div className="viewer-toolbar-group">
        <span className="viewer-toolbar-label">Animation</span>
        <select
          className="viewer-toolbar-select"
          value={animationState.animationId || ""}
          onChange={(e) =>
            onAnimationStateChange({
              ...animationState,
              animationId: e.target.value || null,
              playing: false,
              currentTick: 0,
            })
          }
        >
          <option value="">— Aucune —</option>
          {mob.animations.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.duration_ticks}t)
            </option>
          ))}
        </select>
      </div>

      {animationState.animationId && (
        <>
          <div className="viewer-toolbar-group">
            <div className="viewer-toolbar-buttons">
              <button
                className={`viewer-tool-btn ${
                  animationState.playing ? "active playing" : ""
                }`}
                onClick={() =>
                  onAnimationStateChange({
                    ...animationState,
                    playing: !animationState.playing,
                  })
                }
              >
                {animationState.playing ? "⏸ Pause" : "▶️ Jouer"}
              </button>
              <button
                className="viewer-tool-btn"
                onClick={() =>
                  onAnimationStateChange({
                    ...animationState,
                    playing: false,
                    currentTick: 0,
                  })
                }
              >
                ⏹ Stop
              </button>
            </div>
          </div>

          {/* Speed control */}
          <div className="viewer-toolbar-group">
            <span className="viewer-toolbar-label">
              Vitesse: {animationState.speed.toFixed(1)}x
            </span>
            <input
              type="range"
              min={0.1}
              max={3}
              step={0.1}
              value={animationState.speed}
              onChange={(e) =>
                onAnimationStateChange({
                  ...animationState,
                  speed: parseFloat(e.target.value),
                })
              }
              className="viewer-speed-slider"
            />
          </div>

          {/* Timeline scrub */}
          {currentAnimation && !animationState.playing && (
            <div className="viewer-toolbar-group viewer-timeline">
              <span className="viewer-toolbar-label">
                Tick: {animationState.currentTick}/{currentAnimation.duration_ticks}
              </span>
              <input
                type="range"
                min={0}
                max={currentAnimation.duration_ticks}
                step={1}
                value={animationState.currentTick}
                onChange={(e) =>
                  onAnimationStateChange({
                    ...animationState,
                    currentTick: parseInt(e.target.value),
                  })
                }
                className="viewer-timeline-slider"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
