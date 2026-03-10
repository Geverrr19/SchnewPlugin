import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  TransformControls,
  Grid,
  GizmoHelper,
  GizmoViewport,
  PerspectiveCamera,
  Html,
} from "@react-three/drei";
import { Object3D, Group, Vector3, Euler } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type {
  CustomMob,
  ModelPart,
  MobAnimation,
  AnimationKeyframe,
  Hitbox,
  AttackHitbox,
} from "../../types/mob";
import { MobPartMesh, HitboxMesh } from "./MobPartMesh";

// ══════════════════════════════════════════
// Types
// ══════════════════════════════════════════

export type TransformMode = "translate" | "rotate" | "scale";

interface AnimationState {
  playing: boolean;
  animationId: string | null;
  currentTick: number;
  speed: number;
}

export interface MobViewerProps {
  mob: CustomMob;
  selectedPartIds: string[];
  onSelectPart: (partId: string | null, additive?: boolean) => void;
  onPartTransformChange: (
    partId: string,
    field: "offset" | "rotation" | "scale",
    value: [number, number, number]
  ) => void;
  transformMode: TransformMode;
  animationState: AnimationState;
  showHitboxes?: boolean;
  showAttackHitboxes?: boolean;
  isFullscreen?: boolean;
  onAddPart?: (type: string) => void;
  onAddKeyframe?: () => void;
  onAddHitbox?: () => void;
  onAddAnimation?: () => void;
  onTickUpdate?: (tick: number) => void;
  onAnimationStop?: () => void;
}

// ══════════════════════════════════════════
// Animation Interpolation
// ══════════════════════════════════════════

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVec3(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

interface InterpolatedPose {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export function getAnimatedPose(
  animation: MobAnimation,
  partId: string,
  currentTick: number
): InterpolatedPose | null {
  const partKeyframes = animation.keyframes
    .filter((kf) => kf.part_ids.includes(partId))
    .sort((a, b) => a.tick - b.tick);

  if (partKeyframes.length === 0) return null;

  // Find surrounding keyframes
  let prevKf: AnimationKeyframe | null = null;
  let nextKf: AnimationKeyframe | null = null;

  for (let i = 0; i < partKeyframes.length; i++) {
    if (partKeyframes[i].tick <= currentTick) {
      prevKf = partKeyframes[i];
    }
    if (partKeyframes[i].tick > currentTick && !nextKf) {
      nextKf = partKeyframes[i];
    }
  }

  // If animation loops and we're after the last keyframe, wrap around
  if (!nextKf && animation.loop && partKeyframes.length > 0) {
    nextKf = partKeyframes[0];
  }

  // Only previous keyframe available
  if (prevKf && !nextKf) {
    return {
      position: prevKf.position ?? undefined,
      rotation: prevKf.rotation ?? undefined,
      scale: prevKf.scale ?? undefined,
    };
  }

  // Both keyframes available - interpolate
  if (prevKf && nextKf) {
    const range =
      nextKf.tick > prevKf.tick
        ? nextKf.tick - prevKf.tick
        : animation.duration_ticks - prevKf.tick + nextKf.tick;

    const elapsed =
      currentTick >= prevKf.tick
        ? currentTick - prevKf.tick
        : animation.duration_ticks - prevKf.tick + currentTick;

    const t = range > 0 ? Math.min(elapsed / range, 1) : 0;
    // Smoothstep for nicer interpolation
    const smoothT = t * t * (3 - 2 * t);

    return {
      position:
        prevKf.position && nextKf.position
          ? lerpVec3(prevKf.position, nextKf.position, smoothT)
          : prevKf.position ?? nextKf.position ?? undefined,
      rotation:
        prevKf.rotation && nextKf.rotation
          ? lerpVec3(prevKf.rotation, nextKf.rotation, smoothT)
          : prevKf.rotation ?? nextKf.rotation ?? undefined,
      scale:
        prevKf.scale && nextKf.scale
          ? lerpVec3(prevKf.scale, nextKf.scale, smoothT)
          : prevKf.scale ?? nextKf.scale ?? undefined,
    };
  }

  // Only next keyframe
  if (nextKf) {
    return {
      position: nextKf.position ?? undefined,
      rotation: nextKf.rotation ?? undefined,
      scale: nextKf.scale ?? undefined,
    };
  }

  return null;
}

// ══════════════════════════════════════════
// Axes markers / Reference figure
// ══════════════════════════════════════════

/** Silhouette de référence (1.8 blocs de haut comme un joueur) */
function PlayerSilhouette() {
  return (
    <group position={[2.5, 0, 0]}>
      {/* Corps */}
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[0.6, 1.2, 0.3]} />
        <meshStandardMaterial
          color="#334155"
          transparent
          opacity={0.3}
          roughness={0.8}
        />
      </mesh>
      {/* Tête */}
      <mesh position={[0, 1.7, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial
          color="#334155"
          transparent
          opacity={0.3}
          roughness={0.8}
        />
      </mesh>
      {/* Jambes */}
      <mesh position={[-0.15, 0.15, 0]}>
        <boxGeometry args={[0.25, 0.6, 0.25]} />
        <meshStandardMaterial
          color="#334155"
          transparent
          opacity={0.3}
          roughness={0.8}
        />
      </mesh>
      <mesh position={[0.15, 0.15, 0]}>
        <boxGeometry args={[0.25, 0.6, 0.25]} />
        <meshStandardMaterial
          color="#334155"
          transparent
          opacity={0.3}
          roughness={0.8}
        />
      </mesh>
    </group>
  );
}

// ══════════════════════════════════════════
// Scene Content (inside Canvas)
// ══════════════════════════════════════════

interface SceneContentProps {
  mob: CustomMob;
  selectedPartIds: string[];
  onSelectPart: (partId: string | null, additive?: boolean) => void;
  onPartTransformChange: (
    partId: string,
    field: "offset" | "rotation" | "scale",
    value: [number, number, number]
  ) => void;
  transformMode: TransformMode;
  animationState: AnimationState;
  showHitboxes?: boolean;
  showAttackHitboxes?: boolean;
  onTickUpdate?: (tick: number) => void;
  onAnimationStop?: () => void;
}

function SceneContent({
  mob,
  selectedPartIds,
  onSelectPart,
  onPartTransformChange,
  transformMode,
  animationState,
  showHitboxes = false,
  showAttackHitboxes = false,
  onTickUpdate,
  onAnimationStop,
}: SceneContentProps) {
  const orbitRef = useRef<OrbitControlsImpl>(null);
  const transformRef = useRef<any>(null);
  const selectedGroupRef = useRef<Group>(null);
  const tickRef = useRef(0);
  const lastTimeRef = useRef(0);
  const [animTick, setAnimTick] = useState(0);

  const selectedPart = useMemo(
    () => selectedPartIds.length === 1 ? (mob.parts.find((p) => p.id === selectedPartIds[0]) ?? null) : null,
    [mob.parts, selectedPartIds]
  );

  const currentAnimation = useMemo(() => {
    if (!animationState.animationId) return null;
    return mob.animations.find((a) => a.id === animationState.animationId) ?? null;
  }, [mob.animations, animationState.animationId]);

  // Animation tick loop
  useFrame((_, delta) => {
    if (!animationState.playing || !currentAnimation) return;

    lastTimeRef.current += delta * animationState.speed;
    // 20 ticks per second
    const newTick = Math.floor(lastTimeRef.current * 20);

    if (newTick !== tickRef.current) {
      tickRef.current = newTick;
      const modTick = currentAnimation.loop
        ? newTick % currentAnimation.duration_ticks
        : Math.min(newTick, currentAnimation.duration_ticks);
      setAnimTick(modTick);

      // Propagate tick to parent so timeline playhead moves
      onTickUpdate?.(modTick);

      // Stop non-looping animation at end
      if (!currentAnimation.loop && newTick >= currentAnimation.duration_ticks) {
        onAnimationStop?.();
      }
    }
  });

  // Reset animation refs when play state or animation changes
  useEffect(() => {
    if (animationState.playing) {
      // When starting playback, begin from the current scrubbed position
      tickRef.current = animationState.currentTick;
      lastTimeRef.current = animationState.currentTick / 20;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationState.playing, animationState.animationId]);

  // Sync scrubbing: when paused and parent's currentTick changes (timeline scrub)
  useEffect(() => {
    if (!animationState.playing) {
      tickRef.current = animationState.currentTick;
      lastTimeRef.current = animationState.currentTick / 20;
      setAnimTick(animationState.currentTick);
    }
  }, [animationState.playing, animationState.currentTick]);

  // Calculate animated poses for all parts
  const animatedPoses = useMemo(() => {
    if (!currentAnimation) return {};
    const poses: Record<string, InterpolatedPose> = {};
    for (const part of mob.parts) {
      const pose = getAnimatedPose(currentAnimation, part.id, animTick);
      if (pose) poses[part.id] = pose;
    }
    return poses;
  }, [currentAnimation, mob.parts, animTick]);

  // Disable orbit controls while transforming
  useEffect(() => {
    if (!transformRef.current || !orbitRef.current) return;
    const controls = transformRef.current;
    const onDragStart = () => {
      if (orbitRef.current) orbitRef.current.enabled = false;
    };
    const onDragEnd = () => {
      if (orbitRef.current) orbitRef.current.enabled = true;

      // Read back transform values
      if (selectedGroupRef.current && selectedPart) {
        const obj = selectedGroupRef.current;
        const pos: [number, number, number] = [
          Math.round(obj.position.x * 100) / 100,
          Math.round(obj.position.y * 100) / 100,
          Math.round(obj.position.z * 100) / 100,
        ];
        const rot: [number, number, number] = [
          Math.round(((obj.rotation.x * 180) / Math.PI) * 10) / 10,
          Math.round(((obj.rotation.y * 180) / Math.PI) * 10) / 10,
          Math.round(((obj.rotation.z * 180) / Math.PI) * 10) / 10,
        ];
        const scl: [number, number, number] = [
          Math.round(obj.scale.x * 100) / 100,
          Math.round(obj.scale.y * 100) / 100,
          Math.round(obj.scale.z * 100) / 100,
        ];

        if (transformMode === "translate") {
          onPartTransformChange(selectedPart.id, "offset", pos);
        } else if (transformMode === "rotate") {
          onPartTransformChange(selectedPart.id, "rotation", rot);
        } else if (transformMode === "scale") {
          onPartTransformChange(selectedPart.id, "scale", scl);
        }
      }
    };
    controls.addEventListener("dragging-changed", (event: any) => {
      if (event.value) onDragStart();
      else onDragEnd();
    });
  }, [selectedPart, transformMode, onPartTransformChange]);

  // Click on empty space to deselect
  const handlePointerMissed = useCallback(() => {
    onSelectPart(null);
  }, [onSelectPart]);

  return (
    <>
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[3, 3, 5]} fov={50} />
      <OrbitControls
        ref={orbitRef}
        makeDefault
        minDistance={1}
        maxDistance={30}
        target={[0, 1, 0]}
      />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1} castShadow />
      <directionalLight position={[-3, 4, -3]} intensity={0.3} />

      {/* Hemisphere light replaces Environment (avoids external HDRI fetch blocked by CSP) */}
      <hemisphereLight args={[0x87ceeb, 0x362d1b, 0.4]} />

      {/* Grid */}
      <Grid
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#2a2a4a"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#4a4a6a"
        fadeDistance={15}
        fadeStrength={1}
        position={[0, -0.01, 0]}
        infiniteGrid
      />

      {/* Axes indicator at origin */}
      <axesHelper args={[2]} />

      {/* Player reference silhouette */}
      <PlayerSilhouette />

      {/* Mob parts */}
      <group onPointerMissed={handlePointerMissed}>
        {mob.parts.map((part) => {
          const pose = animatedPoses[part.id];
          const isSelected = selectedPartIds.includes(part.id);
          const isPrimarySelected = selectedPartIds.length === 1 && selectedPartIds[0] === part.id;

          if (isPrimarySelected && !animationState.playing) {
            // Use animated pose if scrubbing, otherwise use raw part transforms
            const scrubPos = pose?.position ?? part.offset;
            const scrubRot = pose?.rotation ?? part.rotation;
            const scrubScale = pose?.scale ?? part.scale;
            return (
              <group
                key={part.id}
                ref={selectedGroupRef}
                position={scrubPos}
                rotation={
                  new Euler(
                    (scrubRot[0] * Math.PI) / 180,
                    (scrubRot[1] * Math.PI) / 180,
                    (scrubRot[2] * Math.PI) / 180
                  )
                }
                scale={scrubScale}
              >
                <MobPartMesh
                  part={{
                    ...part,
                    offset: [0, 0, 0],
                    rotation: [0, 0, 0],
                    scale: [1, 1, 1],
                  }}
                  selected={true}
                  onClick={(e) => onSelectPart(part.id, e?.ctrlKey || e?.metaKey)}
                />
              </group>
            );
          }

          return (
            <MobPartMesh
              key={part.id}
              part={part}
              selected={isSelected}
              onClick={(e) => onSelectPart(part.id, e?.ctrlKey || e?.metaKey)}
              animatedPosition={pose?.position}
              animatedRotation={pose?.rotation}
              animatedScale={pose?.scale}
            />
          );
        })}
      </group>

      {/* Transform Controls */}
      {selectedPart && selectedGroupRef.current && !animationState.playing && (
        <TransformControls
          ref={transformRef}
          object={selectedGroupRef.current}
          mode={transformMode}
          size={0.7}
          translationSnap={0.05}
          rotationSnap={Math.PI / 36}
          scaleSnap={0.05}
        />
      )}

      {/* ── Mob Hitboxes ── */}
      {showHitboxes && mob.hitboxes && mob.hitboxes.map((hb) => (
        <HitboxMesh key={hb.id} hitbox={hb} color="#22c55e" opacity={0.2} active={true} />
      ))}

      {/* ── Attack Hitboxes ── */}
      {showAttackHitboxes && mob.attacks.map((atk) =>
        (atk.hitboxes || []).map((ahb) => {
          const isActive = animationState.playing && atk.animation_id === animationState.animationId
            ? animTick >= ahb.active_start_tick && animTick <= ahb.active_end_tick
            : true;
          return (
            <HitboxMesh key={ahb.id} hitbox={ahb} color="#ef4444" opacity={isActive ? 0.3 : 0.08} active={isActive} />
          );
        })
      )}

      {/* Orientation Gizmo */}
      <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
        <GizmoViewport
          axisColors={["#ef4444", "#22c55e", "#3b82f6"]}
          labelColor="white"
        />
      </GizmoHelper>
    </>
  );
}

// ══════════════════════════════════════════
// Main MobViewer3D
// ══════════════════════════════════════════

export function MobViewer3D({
  mob,
  selectedPartIds,
  onSelectPart,
  onPartTransformChange,
  transformMode,
  animationState,
  showHitboxes = false,
  showAttackHitboxes = false,
  isFullscreen = false,
  onAddPart,
  onAddKeyframe,
  onAddHitbox,
  onAddAnimation,
  onTickUpdate,
  onAnimationStop,
}: MobViewerProps) {
  const canAddKeyframe = !!(selectedPartIds.length > 0 && animationState.animationId && !animationState.playing);

  return (
    <div className={`mob-viewer-canvas-container ${isFullscreen ? "fullscreen" : ""}`}>
      <Canvas
        shadows
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#0a0a15" }}
        onPointerMissed={() => onSelectPart(null)}
      >
        <SceneContent
          mob={mob}
          selectedPartIds={selectedPartIds}
          onSelectPart={onSelectPart}
          onPartTransformChange={onPartTransformChange}
          transformMode={transformMode}
          animationState={animationState}
          showHitboxes={showHitboxes}
          showAttackHitboxes={showAttackHitboxes}
          onTickUpdate={onTickUpdate}
          onAnimationStop={onAnimationStop}
        />
      </Canvas>

      {/* Part count overlay */}
      <div className="viewer-overlay viewer-overlay-top-left">
        <span>🧱 {mob.parts.length} part(s)</span>
        {mob.stats.scale !== 1 && (
          <span style={{ marginLeft: 8 }}>📐 x{mob.stats.scale}</span>
        )}
      </div>

      {/* ── Action Bar overlay ── */}
      <div className="viewer-action-bar">
        <div className="viewer-action-group">
          <span className="viewer-action-label">Créer</span>
          <button className="viewer-action-btn" onClick={() => onAddPart?.("block_display")} title="Ajouter Block Display">
            🧱 Block
          </button>
          <button className="viewer-action-btn" onClick={() => onAddPart?.("item_display")} title="Ajouter Item Display">
            🗡️ Item
          </button>
          <button className="viewer-action-btn" onClick={() => onAddPart?.("text_display")} title="Ajouter Text Display">
            📝 Texte
          </button>
        </div>
        <div className="viewer-action-sep" />
        <div className="viewer-action-group">
          <button className="viewer-action-btn" onClick={onAddAnimation} title="Nouvelle animation">
            🎬 Animation
          </button>
          <button
            className="viewer-action-btn"
            onClick={onAddKeyframe}
            disabled={!canAddKeyframe}
            title={canAddKeyframe ? `Enregistrer keyframe au tick ${animationState.currentTick}` : "Sélectionnez une part et une animation d'abord"}
          >
            🔑 Keyframe{canAddKeyframe ? ` (t=${animationState.currentTick})` : ""}
          </button>
        </div>
        <div className="viewer-action-sep" />
        <div className="viewer-action-group">
          <button className="viewer-action-btn" onClick={onAddHitbox} title="Ajouter une hitbox de collision">
            🟢 Hitbox
          </button>
        </div>
      </div>

      {/* Empty state */}
      {mob.parts.length === 0 && (
        <div className="viewer-empty-state">
          <p>Ajoutez des parts au modèle pour les visualiser ici</p>
          <p style={{ fontSize: "0.75rem", opacity: 0.6 }}>
            Utilisez les boutons ci-dessous ou importez un modèle Blockbench
          </p>
        </div>
      )}
    </div>
  );
}
