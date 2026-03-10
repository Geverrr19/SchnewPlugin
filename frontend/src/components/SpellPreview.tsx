import { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import type { Spell, ParticlePattern } from "../types/spell";

interface Props { spell: Spell; }

/* --- Particle pool for performance --- */
interface Particle3D {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
  colorEnd?: THREE.Color;
  opacity: number;
}

/* --- MC Particle style mapping --- */
const PSTYLE: Record<string, { color?: string; glow: number; drift: number; sizeRange: [number, number] }> = {
  FLAME:        { glow: 1.5, drift: 1.2, sizeRange: [0.06, 0.15] },
  SOUL_FIRE_FLAME: { color: "#00c8ff", glow: 1.8, drift: 1.0, sizeRange: [0.06, 0.15] },
  SMOKE:        { color: "#666666", glow: 0.3, drift: 1.8, sizeRange: [0.08, 0.2] },
  ENCHANT:      { glow: 1.4, drift: 0.6, sizeRange: [0.04, 0.1] },
  DUST:         { glow: 0.8, drift: 0.8, sizeRange: [0.04, 0.12] },
  HEART:        { color: "#ff5050", glow: 0.6, drift: 0.3, sizeRange: [0.08, 0.12] },
  CRIT:         { glow: 1.2, drift: 1.5, sizeRange: [0.04, 0.08] },
  WITCH:        { color: "#a000c8", glow: 1.0, drift: 1.0, sizeRange: [0.04, 0.12] },
  END_ROD:      { color: "#ffffc8", glow: 1.6, drift: 0.5, sizeRange: [0.03, 0.08] },
  DRAGON_BREATH:{ color: "#b400ff", glow: 1.2, drift: 1.5, sizeRange: [0.06, 0.16] },
  ELECTRIC_SPARK:{ color: "#64c8ff", glow: 2.0, drift: 2.0, sizeRange: [0.04, 0.12] },
  SNOWFLAKE:    { color: "#c8dcff", glow: 0.4, drift: 0.4, sizeRange: [0.06, 0.12] },
  CHERRY_LEAVES:{ color: "#ff96b4", glow: 0.3, drift: 0.5, sizeRange: [0.04, 0.1] },
  CAMPFIRE_SIGNAL_SMOKE: { color: "#8c8c8c", glow: 0.2, drift: 0.5, sizeRange: [0.12, 0.25] },
  DRIPPING_LAVA:{ color: "#ff7800", glow: 0.8, drift: 0.3, sizeRange: [0.04, 0.08] },
  WAX_ON:       { color: "#ffc832", glow: 0.6, drift: 0.5, sizeRange: [0.04, 0.08] },
  SCULK_CHARGE: { color: "#009696", glow: 1.0, drift: 1.0, sizeRange: [0.06, 0.12] },
  SONIC_BOOM:   { color: "#64c8ff", glow: 2.5, drift: 3.0, sizeRange: [0.08, 0.16] },
  TRIAL_SPAWNER_DETECTION: { color: "#ff6432", glow: 1.2, drift: 1.0, sizeRange: [0.04, 0.08] },
};

/* --- Impact style mapping --- */
const IMPACT_CONFIG: Record<string, { rings: number; debris: number; flash: boolean; shake: number }> = {
  EXPLOSION:     { rings: 3, debris: 25, flash: true, shake: 0.15 },
  LARGE_SMOKE:   { rings: 1, debris: 15, flash: false, shake: 0.05 },
  FLASH:         { rings: 2, debris: 10, flash: true, shake: 0.25 },
  SWEEP_ATTACK:  { rings: 1, debris: 8, flash: false, shake: 0.08 },
  EXPLOSION_EMITTER: { rings: 4, debris: 40, flash: true, shake: 0.3 },
  TOTEM_OF_UNDYING:  { rings: 3, debris: 30, flash: true, shake: 0.2 },
  SONIC_BOOM:    { rings: 5, debris: 20, flash: true, shake: 0.35 },
  ELECTRIC_SPARK:{ rings: 2, debris: 22, flash: true, shake: 0.12 },
  CAMPFIRE_SIGNAL_SMOKE: { rings: 1, debris: 12, flash: false, shake: 0.03 },
};

/* --- Sprite glow texture --- */
function createGlowTexture(size = 64): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.15, "rgba(255,255,255,0.8)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.3)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export function SpellPreview({ spell }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<any>(null);

  const spellColor = useMemo(() => {
    const [r, g, b] = spell.visual.color;
    return new THREE.Color(r / 255, g / 255, b / 255);
  }, [spell.visual.color]);

  /* Keep refs in sync so animate loop always reads latest values
     without recreating the WebGL renderer */
  const spellRef = useRef(spell);
  const spellColorRef = useRef(spellColor);
  useEffect(() => {
    spellRef.current = spell;
    spellColorRef.current = spellColor;
  }, [spell, spellColor]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /* === Init scene === */
    const W = 640, H = 420;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "auto";
    renderer.domElement.style.borderRadius = "var(--radius, 8px)";
    renderer.domElement.style.cursor = "grab";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06061a);
    scene.fog = new THREE.FogExp2(0x06061a, 0.04);

    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);

    /* === Lighting === */
    const ambientLight = new THREE.AmbientLight(0x222244, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x8888cc, 0.4);
    dirLight.position.set(5, 8, 3);
    scene.add(dirLight);

    const casterLight = new THREE.PointLight(spellColor, 0.8, 6);
    casterLight.position.set(-3, 1.5, 0);
    scene.add(casterLight);

    const impactLight = new THREE.PointLight(spellColor, 0, 8);
    scene.add(impactLight);

    /* === Ground === */
    const groundGeo = new THREE.PlaneGeometry(40, 40);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x111122, metalness: 0.3, roughness: 0.8,
      transparent: true, opacity: 0.7,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(30, 30, 0x222244, 0x111133);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    /* === Caster (Minecraft-style) === */
    const casterGroup = new THREE.Group();
    casterGroup.position.set(-3, 0, 0);

    const bodyGeo = new THREE.BoxGeometry(0.45, 0.7, 0.3);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4444aa, metalness: 0.2, roughness: 0.7 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.1;
    casterGroup.add(body);

    const headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xccaa88, metalness: 0.1, roughness: 0.8 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.7;
    casterGroup.add(head);

    const armGeo = new THREE.BoxGeometry(0.15, 0.55, 0.15);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x4444aa, metalness: 0.2, roughness: 0.7 });
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(0.35, 1.25, 0);
    arm.rotation.z = -Math.PI / 4;
    casterGroup.add(arm);

    const armL = new THREE.Mesh(armGeo.clone(), armMat.clone());
    armL.position.set(-0.35, 1.05, 0);
    casterGroup.add(armL);

    const legGeo = new THREE.BoxGeometry(0.17, 0.55, 0.2);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x333366, metalness: 0.1, roughness: 0.8 });
    const legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.12, 0.4, 0);
    casterGroup.add(legR);
    const legL = new THREE.Mesh(legGeo.clone(), legMat.clone());
    legL.position.set(-0.12, 0.4, 0);
    casterGroup.add(legL);

    const wandGeo = new THREE.CylinderGeometry(0.02, 0.03, 0.6, 6);
    const wandMat = new THREE.MeshStandardMaterial({ color: 0x885522, metalness: 0.3, roughness: 0.6 });
    const wand = new THREE.Mesh(wandGeo, wandMat);
    wand.position.set(0.55, 1.45, 0);
    wand.rotation.z = -Math.PI / 4;
    casterGroup.add(wand);

    const tipGlow = new THREE.PointLight(spellColor, 1.2, 2.5);
    tipGlow.position.set(0.7, 1.6, 0);
    casterGroup.add(tipGlow);

    scene.add(casterGroup);

    /* === Target dummy === */
    const targetGroup = new THREE.Group();

    const tBodyGeo = new THREE.BoxGeometry(0.45, 0.7, 0.3);
    const tBodyMat = new THREE.MeshStandardMaterial({ color: 0xaa3333, metalness: 0.2, roughness: 0.7 });
    const tBody = new THREE.Mesh(tBodyGeo, tBodyMat);
    tBody.position.y = 1.1;
    targetGroup.add(tBody);

    const tHeadGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    const tHeadMat = new THREE.MeshStandardMaterial({ color: 0xccaa88, metalness: 0.1, roughness: 0.8 });
    const tHead = new THREE.Mesh(tHeadGeo, tHeadMat);
    tHead.position.y = 1.7;
    targetGroup.add(tHead);

    const tLegGeo = new THREE.BoxGeometry(0.17, 0.55, 0.2);
    const tLegMat = new THREE.MeshStandardMaterial({ color: 0x663333, metalness: 0.1, roughness: 0.8 });
    const tLegR = new THREE.Mesh(tLegGeo, tLegMat);
    tLegR.position.set(0.12, 0.4, 0);
    targetGroup.add(tLegR);
    const tLegL = new THREE.Mesh(tLegGeo.clone(), tLegMat.clone());
    tLegL.position.set(-0.12, 0.4, 0);
    targetGroup.add(tLegL);

    scene.add(targetGroup);

    /* === Particle system (shader-based) === */
    const MAX_PARTICLES = 2000;
    const particles: Particle3D[] = [];
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const colors = new Float32Array(MAX_PARTICLES * 3);
    const sizes = new Float32Array(MAX_PARTICLES);
    const alphas = new Float32Array(MAX_PARTICLES);

    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pointsGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    pointsGeo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    pointsGeo.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));

    const glowTex = createGlowTexture();

    const pointsMat = new THREE.ShaderMaterial({
      uniforms: { uTexture: { value: glowTex } },
      vertexShader: `
        attribute float size;
        attribute float alpha;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = color;
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec4 tex = texture2D(uTexture, gl_PointCoord);
          gl_FragColor = vec4(vColor, tex.a * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });

    const points = new THREE.Points(pointsGeo, pointsMat);
    scene.add(points);

    /* === Trail line (projectile) === */
    const trailGeo = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(60 * 3);
    trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
    const trailMat = new THREE.LineBasicMaterial({
      color: spellColor, transparent: true, opacity: 0.3,
      blending: THREE.AdditiveBlending,
    });
    const trailLine = new THREE.Line(trailGeo, trailMat);
    trailLine.visible = false;
    scene.add(trailLine);

    /* === Area circle === */
    const circleSegments = 64;
    const circlePoints: THREE.Vector3[] = [];
    for (let i = 0; i <= circleSegments; i++) {
      const angle = (i / circleSegments) * Math.PI * 2;
      circlePoints.push(new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)));
    }
    const circleGeo = new THREE.BufferGeometry().setFromPoints(circlePoints);
    const circleMat = new THREE.LineBasicMaterial({
      color: spellColor, transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const areaCircle = new THREE.Line(circleGeo, circleMat);
    areaCircle.visible = false;
    areaCircle.position.y = 0.05;
    scene.add(areaCircle);

    const areaGlowGeo = new THREE.CircleGeometry(1, 48);
    const areaGlowMat = new THREE.MeshBasicMaterial({
      color: spellColor, transparent: true, opacity: 0.12,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    const areaGlow = new THREE.Mesh(areaGlowGeo, areaGlowMat);
    areaGlow.rotation.x = -Math.PI / 2;
    areaGlow.position.y = 0.02;
    areaGlow.visible = false;
    scene.add(areaGlow);

    /* === Camera === */
    let camAngle = -0.3;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartAngle = 0;

    const onMouseDown = (e: MouseEvent) => { isDragging = true; dragStartX = e.clientX; dragStartAngle = camAngle; renderer.domElement.style.cursor = "grabbing"; };
    const onMouseMove = (e: MouseEvent) => { if (isDragging) camAngle = dragStartAngle + (e.clientX - dragStartX) * 0.005; };
    const onMouseUp = () => { isDragging = false; renderer.domElement.style.cursor = "grab"; };
    renderer.domElement.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    /* === State === */
    let time = 0;
    let animId = 0;
    let shakeIntensity = 0;
    const shakeOffset = new THREE.Vector3();

    /* --- Helper: spawn particle --- */
    function spawnParticle(pos: THREE.Vector3, vel: THREE.Vector3, opts?: Partial<Particle3D>) {
      if (particles.length >= MAX_PARTICLES) particles.shift();
      particles.push({
        pos: pos.clone(), vel: vel.clone(),
        life: 1, maxLife: opts?.maxLife ?? 0.5,
        size: opts?.size ?? 0.1,
        color: opts?.color?.clone() ?? spellColorRef.current.clone(),
        colorEnd: opts?.colorEnd?.clone(),
        opacity: 1,
      });
    }

    /* --- Helper: pattern particles --- */
    function spawnPatternParticles(center: THREE.Vector3, t: number, pattern: ParticlePattern, density: number, spread: number) {
      const count = Math.ceil(density * 0.4);
      for (let i = 0; i < count; i++) {
        const p = center.clone();
        const v = new THREE.Vector3();
        switch (pattern) {
          case "spiral": {
            const a = t * 4 + i * (Math.PI * 2 / count);
            const r = 0.3 + Math.sin(t * 2) * 0.15;
            p.x += Math.cos(a) * r; p.z += Math.sin(a) * r;
            v.set(Math.cos(a) * 0.1, 0.05, Math.sin(a) * 0.1);
            break;
          }
          case "ring": {
            const a = (i / count) * Math.PI * 2 + t * 0.5;
            const rr = 0.4 + spread * 0.1;
            p.x += Math.cos(a) * rr; p.z += Math.sin(a) * rr;
            break;
          }
          case "helix": {
            const a = t * 5 + i * (Math.PI * 2 / count);
            p.x += Math.cos(a) * 0.3; p.y += Math.sin(a) * 0.15 + 0.1;
            v.set(0, 0.15, 0);
            break;
          }
          case "burst": {
            const a = Math.random() * Math.PI * 2;
            const elev = (Math.random() - 0.5) * Math.PI;
            const d = Math.random() * spread * 0.2;
            p.x += Math.cos(a) * Math.cos(elev) * d;
            p.y += Math.sin(elev) * d;
            p.z += Math.sin(a) * Math.cos(elev) * d;
            v.set(Math.cos(a) * 0.3, Math.sin(elev) * 0.3, Math.sin(a) * 0.3);
            break;
          }
          case "wave": {
            p.x += (i - count / 2) * 0.15;
            p.y += Math.sin(t * 4 + i * 0.5) * 0.3;
            break;
          }
          default: {
            p.x += (Math.random() - 0.5) * spread * 0.2;
            p.y += (Math.random() - 0.5) * spread * 0.1;
            p.z += (Math.random() - 0.5) * spread * 0.2;
          }
        }
        spawnParticle(p, v, { maxLife: 0.4 + Math.random() * 0.3, size: 0.06 + Math.random() * 0.06 });
      }
    }

    /* === Animation loop === */
    let lastTime = performance.now();

    const animate = (now: number) => {
      const spell = spellRef.current;
      const spellColor = spellColorRef.current;
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      time += dt;
      const t = time;

      /* Camera */
      if (!isDragging) camAngle += dt * 0.08;
      const camDist = 8, camHeight = 3.5;
      camera.position.set(Math.sin(camAngle) * camDist, camHeight, Math.cos(camAngle) * camDist);

      shakeIntensity *= 0.88;
      if (shakeIntensity > 0.005) {
        shakeOffset.set(
          (Math.random() - 0.5) * shakeIntensity,
          (Math.random() - 0.5) * shakeIntensity * 0.5,
          (Math.random() - 0.5) * shakeIntensity
        );
      } else { shakeOffset.set(0, 0, 0); }
      camera.position.add(shakeOffset);
      camera.lookAt(0, 1.2, 0);

      /* Wand tip pulse */
      tipGlow.intensity = 0.8 + Math.sin(t * 6) * 0.4;
      tipGlow.color.copy(spellColor);
      casterLight.color.copy(spellColor);

      /* Resolve layers */
      const trailLayer = (spell.visual as any).particle_layers?.[0] ?? (spell.visual as any).particle_trail ?? { particle: "FLAME", count: 3, frequency: 1 };
      const ps = PSTYLE[trailLayer.particle] ?? PSTYLE.FLAME;
      const is = IMPACT_CONFIG[spell.visual.impact.particle] ?? IMPACT_CONFIG.EXPLOSION;
      const cp = trailLayer.custom;
      const pColor = ps.color ? new THREE.Color(ps.color) : spellColor.clone();

      const castType = spell.mechanics.cast_type;
      const range = Math.min(spell.mechanics.range, 50);
      const targetDist = Math.min(range * 0.3, 6);
      targetGroup.position.set(targetDist, 0, 0);

      trailLine.visible = false;
      areaCircle.visible = false;
      areaGlow.visible = false;
      targetGroup.visible = castType !== "area";

      /* ====== PROJECTILE ====== */
      if (castType === "projectile") {
        const speed = spell.mechanics.speed ?? 2;
        const maxDist = targetDist;
        const travelTime = Math.max(0.5, maxDist / (speed * 0.8));
        const cycleTime = travelTime + 1.5;
        const loopT = t % cycleTime;
        const progress = Math.min(loopT / travelTime, 1);

        const startX = -2.3;
        const pX = startX + progress * (maxDist - startX + 1);
        const pY = 1.5;
        const gravity = spell.mechanics.gravity ?? 0;
        const arcY = pY - gravity * progress * progress * 2;

        if (progress < 1) {
          const cnt = trailLayer.count;
          for (let i = 0; i < cnt; i++) {
            if (Math.random() < 0.5) {
              const pos = new THREE.Vector3(
                pX - Math.random() * 0.3,
                arcY + (Math.random() - 0.5) * 0.15,
                (Math.random() - 0.5) * 0.15
              );
              const vel = new THREE.Vector3(
                -0.3 - Math.random() * ps.drift * 0.2,
                (Math.random() - 0.5) * ps.drift * 0.1,
                (Math.random() - 0.5) * ps.drift * 0.1
              );
              const sz = ps.sizeRange[0] + Math.random() * (ps.sizeRange[1] - ps.sizeRange[0]);
              if (cp?.enabled) {
                const cStart = new THREE.Color(cp.color_start[0] / 255, cp.color_start[1] / 255, cp.color_start[2] / 255);
                const cEnd = new THREE.Color(cp.color_end[0] / 255, cp.color_end[1] / 255, cp.color_end[2] / 255);
                spawnParticle(pos, vel, { size: sz, maxLife: cp.lifetime || 0.5, color: cStart, colorEnd: cEnd });
              } else {
                spawnParticle(pos, vel, { size: sz, maxLife: 0.3 + Math.random() * 0.3, color: pColor });
              }
            }
          }

          if (cp?.enabled && Math.random() < 0.4)
            spawnPatternParticles(new THREE.Vector3(pX, arcY, 0), t, cp.pattern, cp.density, cp.spread);

          impactLight.position.set(pX, arcY, 0);
          impactLight.color.copy(spellColor);
          impactLight.intensity = 1.5 + Math.sin(t * 12) * 0.5;
          impactLight.distance = 3;

          trailLine.visible = true;
          const trailAttr = trailLine.geometry.getAttribute("position") as THREE.BufferAttribute;
          const trailLen = 20;
          for (let i = 0; i < trailLen; i++) {
            const f = i / trailLen;
            const tx = pX - f * Math.min(progress * (maxDist - startX + 1), 3);
            const tp = Math.max(0, progress - f * progress * 0.5);
            const ty = pY - gravity * tp * tp * 2;
            trailAttr.setXYZ(i, tx, ty, 0);
          }
          trailAttr.needsUpdate = true;
          trailLine.geometry.setDrawRange(0, trailLen);
          (trailLine.material as THREE.LineBasicMaterial).color.copy(spellColor);
        }

        if (progress >= 1) {
          trailLine.visible = false;
          const iT = loopT - travelTime;
          const impactX = startX + (maxDist - startX + 1);
          const impactY = pY - gravity * 4;

          if (iT < 0.05) {
            shakeIntensity = is.shake;
            for (let i = 0; i < is.debris; i++) {
              const a = Math.random() * Math.PI * 2;
              const elev = (Math.random() - 0.5) * Math.PI;
              const sp = 0.5 + Math.random() * 2;
              const pos = new THREE.Vector3(impactX, impactY, 0);
              const vel = new THREE.Vector3(
                Math.cos(a) * Math.cos(elev) * sp,
                Math.abs(Math.sin(elev)) * sp + 0.3,
                Math.sin(a) * Math.cos(elev) * sp
              );
              spawnParticle(pos, vel, { size: 0.05 + Math.random() * 0.15, maxLife: 0.3 + Math.random() * 0.6, color: pColor });
            }
          }

          if (iT < 1.2) {
            const flashIntensity = Math.max(0, 1 - iT / 0.4);
            impactLight.position.set(impactX, impactY, 0);
            impactLight.color.set(0xffffff);
            impactLight.intensity = is.flash ? flashIntensity * 8 : flashIntensity * 2;
            impactLight.distance = 6 + flashIntensity * 4;
          } else { impactLight.intensity = 0; }
        }
      }

      /* ====== AREA ====== */
      if (castType === "area") {
        const radius = Math.min(spell.mechanics.radius ?? 5, 15);
        const drawR = radius * 0.25;
        const areaX = 2;

        targetGroup.visible = false;
        areaCircle.visible = true;
        areaGlow.visible = true;

        const pulse = 0.95 + Math.sin(t * 3) * 0.05;
        areaCircle.position.set(areaX, 0.05, 0);
        areaCircle.scale.set(drawR * pulse, 1, drawR * pulse);
        (areaCircle.material as THREE.LineBasicMaterial).color.copy(spellColor);

        areaGlow.position.set(areaX, 0.03, 0);
        areaGlow.scale.set(drawR * pulse, drawR * pulse, 1);
        (areaGlow.material as THREE.MeshBasicMaterial).color.copy(spellColor);
        (areaGlow.material as THREE.MeshBasicMaterial).opacity = 0.08 + Math.sin(t * 2.5) * 0.04;

        if (Math.random() < 0.35 * trailLayer.count) {
          const a = Math.random() * Math.PI * 2;
          const d = Math.random() * drawR;
          const pos = new THREE.Vector3(areaX + Math.cos(a) * d, 0.1 + Math.random() * 0.6, Math.sin(a) * d);
          const vel = new THREE.Vector3(0, 0.2 + Math.random() * 0.3, 0);
          if (cp?.enabled) {
            const cStart = new THREE.Color(cp.color_start[0] / 255, cp.color_start[1] / 255, cp.color_start[2] / 255);
            const cEnd = new THREE.Color(cp.color_end[0] / 255, cp.color_end[1] / 255, cp.color_end[2] / 255);
            spawnParticle(pos, vel, { maxLife: 0.5 + Math.random() * 0.5, color: cStart, colorEnd: cEnd, size: 0.08 });
          } else {
            spawnParticle(pos, vel, { maxLife: 0.4 + Math.random() * 0.6, color: pColor, size: 0.06 + Math.random() * 0.06 });
          }
        }

        if (cp?.enabled && Math.random() < 0.25)
          spawnPatternParticles(new THREE.Vector3(areaX, 0.5, 0), t, cp.pattern, cp.density * 0.6, cp.spread);

        const pulseT = t % 2.5;
        if (pulseT < 0.4) {
          const pAlpha = Math.max(0, 1 - pulseT / 0.4);
          for (let i = 0; i < 6; i++) {
            const pos = new THREE.Vector3(areaX, 0.2 + i * 0.4 * pAlpha, 0);
            const vel = new THREE.Vector3((Math.random() - 0.5) * 0.1, 0.5, (Math.random() - 0.5) * 0.1);
            spawnParticle(pos, vel, { size: 0.1 * pAlpha, maxLife: 0.2, color: spellColor.clone() });
          }
        }

        impactLight.position.set(areaX, 0.5, 0);
        impactLight.color.copy(spellColor);
        impactLight.intensity = 0.5 + Math.sin(t * 3) * 0.3;
        impactLight.distance = drawR * 2 + 2;
      }

      /* ====== INSTANT ====== */
      if (castType === "instant") {
        const cycleT = t % 2.5;
        const castP = Math.min(cycleT / 0.4, 1);

        if (castP < 1) {
          if (Math.random() < castP * 0.7) {
            const a = Math.random() * Math.PI * 2;
            const d = 0.6 * (1 - castP);
            const pos = new THREE.Vector3(-2.3 + Math.cos(a) * d, 1.6 + Math.sin(a) * d * 0.5, Math.sin(a * 2) * d * 0.3);
            const vel = new THREE.Vector3(-Math.cos(a) * 0.5, -Math.sin(a) * 0.2, 0);
            spawnParticle(pos, vel, { size: 0.04 + castP * 0.04, maxLife: 0.2, color: pColor });
          }
          if (cp?.enabled && Math.random() < castP * 0.5)
            spawnPatternParticles(new THREE.Vector3(-2.3, 1.6, 0), t, cp.pattern, cp.density * 0.3, cp.spread);
        }

        const hitP = cycleT > 0.4 ? Math.min((cycleT - 0.4) / 0.15, 1) : 0;
        if (hitP > 0 && cycleT < 1.8) {
          const beamLen = targetDist + 2.3;
          if (Math.random() < 0.6) {
            const f = Math.random();
            const pos = new THREE.Vector3(-2.3 + f * beamLen, 1.5 + (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.2);
            const vel = new THREE.Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3);
            spawnParticle(pos, vel, { size: 0.04 + Math.random() * 0.06, maxLife: 0.1, color: new THREE.Color(0xffffff) });
          }

          if (cycleT - 0.4 < 0.05) {
            shakeIntensity = 0.12;
            for (let i = 0; i < 18; i++) {
              const a = Math.random() * Math.PI * 2;
              const el = (Math.random() - 0.5) * Math.PI;
              const pos = new THREE.Vector3(targetDist, 1.3, 0);
              const sp = 0.3 + Math.random() * 1.2;
              const vel = new THREE.Vector3(
                Math.cos(a) * Math.cos(el) * sp,
                Math.sin(el) * sp + 0.2,
                Math.sin(a) * Math.cos(el) * sp
              );
              spawnParticle(pos, vel, { size: 0.06 + Math.random() * 0.1, maxLife: 0.3 + Math.random() * 0.4, color: pColor });
            }
          }

          const flashI = Math.max(0, 1 - (cycleT - 0.4) / 0.5);
          impactLight.position.set(targetDist, 1.3, 0);
          impactLight.color.set(0xffffff);
          impactLight.intensity = flashI * 6;
          impactLight.distance = 5;
        } else { impactLight.intensity *= 0.9; }
      }

      /* Ambient particles */
      if (Math.random() < 0.08) {
        const pos = new THREE.Vector3(-3 + (Math.random() - 0.5) * 0.6, 0.5 + Math.random() * 1.2, (Math.random() - 0.5) * 0.4);
        const vel = new THREE.Vector3(0, 0.05 + Math.random() * 0.1, 0);
        spawnParticle(pos, vel, { size: 0.03, maxLife: 1.5, color: spellColor.clone().multiplyScalar(0.5) });
      }

      /* Multi-layer extra particles */
      if (spell.visual.particle_layers && spell.visual.particle_layers.length > 1) {
        for (let li = 1; li < spell.visual.particle_layers.length; li++) {
          const layer = spell.visual.particle_layers[li];
          const lps = PSTYLE[layer.particle] ?? PSTYLE.FLAME;
          const lColor = lps.color ? new THREE.Color(lps.color) : spellColor.clone();
          const lcp = layer.custom;

          if (castType === "projectile") {
            const speed = spell.mechanics.speed ?? 2;
            const maxDist = targetDist;
            const travelTime2 = Math.max(0.5, maxDist / (speed * 0.8));
            const cycleTime2 = travelTime2 + 1.5;
            const loopT2 = t % cycleTime2;
            const progress2 = Math.min(loopT2 / travelTime2, 1);
            if (progress2 < 1) {
              const startX = -2.3;
              const pX2 = startX + progress2 * (maxDist - startX + 1);
              const arcY2 = 1.5 - (spell.mechanics.gravity ?? 0) * progress2 * progress2 * 2;
              if (Math.random() < 0.4) {
                const pos = new THREE.Vector3(pX2 + (Math.random() - 0.5) * 0.2, arcY2 + (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2);
                const vel = new THREE.Vector3(-0.2 - Math.random() * 0.1, (Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.15);
                const sz = lps.sizeRange[0] + Math.random() * (lps.sizeRange[1] - lps.sizeRange[0]);
                if (lcp?.enabled) {
                  const cS = new THREE.Color(lcp.color_start[0] / 255, lcp.color_start[1] / 255, lcp.color_start[2] / 255);
                  const cE = new THREE.Color(lcp.color_end[0] / 255, lcp.color_end[1] / 255, lcp.color_end[2] / 255);
                  spawnParticle(pos, vel, { size: sz, maxLife: lcp.lifetime || 0.4, color: cS, colorEnd: cE });
                } else {
                  spawnParticle(pos, vel, { size: sz, maxLife: 0.2 + Math.random() * 0.3, color: lColor });
                }
              }
            }
          }
        }
      }

      /* === UPDATE PARTICLES === */
      const posArr = pointsGeo.getAttribute("position") as THREE.BufferAttribute;
      const colArr = pointsGeo.getAttribute("color") as THREE.BufferAttribute;
      const sizeArr = pointsGeo.getAttribute("size") as THREE.BufferAttribute;
      const alphaArr = pointsGeo.getAttribute("alpha") as THREE.BufferAttribute;

      const grav = cp?.enabled ? cp.gravity * 0.3 : 0;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.pos.add(p.vel.clone().multiplyScalar(dt * 2));
        p.vel.y -= (0.15 + grav * 0.1) * dt;
        p.vel.multiplyScalar(0.97);
        p.life -= dt / p.maxLife;
        p.opacity = p.life * p.life;
        if (p.life <= 0) particles.splice(i, 1);
      }

      const n = Math.min(particles.length, MAX_PARTICLES);
      for (let i = 0; i < n; i++) {
        const p = particles[i];
        posArr.setXYZ(i, p.pos.x, p.pos.y, p.pos.z);
        let c = p.color;
        if (p.colorEnd) { const f = 1 - p.life; c = p.color.clone().lerp(p.colorEnd, f); }
        colArr.setXYZ(i, c.r, c.g, c.b);
        sizeArr.setX(i, p.size * (0.5 + p.life * 0.5));
        alphaArr.setX(i, p.opacity);
      }

      posArr.needsUpdate = true;
      colArr.needsUpdate = true;
      sizeArr.needsUpdate = true;
      alphaArr.needsUpdate = true;
      pointsGeo.setDrawRange(0, n);

      /* Render */
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    stateRef.current = { renderer, animId };

    /* Cleanup */
    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      renderer.forceContextLoss();
      renderer.dispose();
      glowTex.dispose();
      pointsGeo.dispose();
      pointsMat.dispose();
      trailGeo.dispose();
      trailMat.dispose();
      circleGeo.dispose();
      circleMat.dispose();
      areaGlowGeo.dispose();
      areaGlowMat.dispose();
      stateRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="spell-preview-3d" ref={containerRef}>
      <div className="preview-hud">
        <span className="preview-spell-name">{spell.meta.name || "Sans nom"}</span>
        <span className="preview-cast-badge">{spell.mechanics.cast_type.toUpperCase()}</span>
      </div>
      <div className="preview-controls-hint">Glisser pour tourner la camera</div>
    </div>
  );
}