/**
 * Importeur de modèles Blockbench (.bbmodel / .json)
 *
 * Supporte les formats :
 *  - Blockbench Generic Model (.bbmodel)
 *  - Blockbench Java Block/Entity (.json export)
 *
 * Convertit les cubes Blockbench en ModelParts de type block_display.
 * Les groupes Blockbench deviennent le champ `group` des parts.
 */

import type { ModelPart, MobAnimation, AnimationKeyframe } from "../types/mob";

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// ── Types Blockbench ──

interface BBElement {
  name?: string;
  type?: string; // "cube" or "mesh"
  from?: [number, number, number];
  to?: [number, number, number];
  origin?: [number, number, number];
  rotation?: [number, number, number];
  color?: number;
  visibility?: boolean;
  uuid?: string;
}

interface BBOutlinerGroup {
  name: string;
  origin?: [number, number, number];
  rotation?: [number, number, number];
  children: (string | BBOutlinerGroup)[];
  uuid?: string;
  visibility?: boolean;
}

interface BBAnimator {
  keyframes?: BBKeyframe[];
}

interface BBKeyframe {
  channel: "position" | "rotation" | "scale";
  data_points: { x?: number | string; y?: number | string; z?: number | string }[];
  time: number;
}

interface BBAnimation {
  name?: string;
  uuid?: string;
  loop?: string; // "once" | "loop" | "hold"
  length?: number; // seconds
  animators?: Record<string, BBAnimator>;
}

interface BBModel {
  elements?: BBElement[];
  outliner?: (string | BBOutlinerGroup)[];
  animations?: BBAnimation[];
  resolution?: { width: number; height: number };
  meta?: { format_version?: string; model_format?: string };
}

// ── Couleurs Blockbench → blocs ──

const BB_COLOR_TO_BLOCK: Record<number, string> = {
  0: "minecraft:light_blue_concrete",
  1: "minecraft:yellow_concrete",
  2: "minecraft:orange_concrete",
  3: "minecraft:red_concrete",
  4: "minecraft:purple_concrete",
  5: "minecraft:blue_concrete",
  6: "minecraft:green_concrete",
  7: "minecraft:lime_concrete",
};

function colorToBlock(color?: number): string {
  if (color !== undefined && BB_COLOR_TO_BLOCK[color]) {
    return BB_COLOR_TO_BLOCK[color];
  }
  return "minecraft:stone";
}

// ── Conversion ──

/**
 * Blockbench utilise un système de coordonnées en pixels (1/16 de bloc).
 * from/to définissent les coins du cube en unités pixel.
 * On convertit en unités blocs: 16 pixels = 1 bloc.
 */
function pixelToBlock(v: number): number {
  return v / 16;
}

function convertElement(
  el: BBElement,
  group: string,
  groupOrigin?: [number, number, number]
): ModelPart | null {
  if (el.type === "mesh") return null; // meshes pas supportées
  if (el.visibility === false) return null;
  if (!el.from || !el.to) return null;

  const from = el.from.map(pixelToBlock) as [number, number, number];
  const to = el.to.map(pixelToBlock) as [number, number, number];

  // Taille du cube (scale)
  const size: [number, number, number] = [
    Math.abs(to[0] - from[0]),
    Math.abs(to[1] - from[1]),
    Math.abs(to[2] - from[2]),
  ];

  // Centre du cube (offset)
  // Blockbench origin est au coin du bloc (8,8,8 = centre)
  const center: [number, number, number] = [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2,
    (from[2] + to[2]) / 2,
  ];

  // Si un origin de groupe est défini, ajuster le centre
  const gOrigin = groupOrigin
    ? (groupOrigin.map(pixelToBlock) as [number, number, number])
    : [0, 0, 0] as [number, number, number];

  const offset: [number, number, number] = [
    center[0] - gOrigin[0],
    center[1] - gOrigin[1],
    center[2] - gOrigin[2],
  ];

  const rotation: [number, number, number] = el.rotation
    ? [el.rotation[0], el.rotation[1], el.rotation[2]]
    : [0, 0, 0];

  return {
    id: el.uuid || generateId(),
    name: el.name || "Cube",
    type: "block_display",
    block: colorToBlock(el.color),
    offset,
    rotation,
    scale: size,
    parent_id: null,
    group,
  };
}

/**
 * Parcourt récursivement l'outliner Blockbench pour extraire les parts.
 */
function processOutliner(
  outliner: (string | BBOutlinerGroup)[],
  elements: BBElement[],
  parentGroup: string = "",
  parentOrigin?: [number, number, number]
): ModelPart[] {
  const parts: ModelPart[] = [];
  const elementMap = new Map<string, BBElement>();
  for (const el of elements) {
    if (el.uuid) elementMap.set(el.uuid, el);
  }

  for (const item of outliner) {
    if (typeof item === "string") {
      // UUID d'un element
      const el = elementMap.get(item);
      if (el) {
        const part = convertElement(el, parentGroup, parentOrigin);
        if (part) parts.push(part);
      }
    } else {
      // Sous-groupe
      const groupName = parentGroup
        ? `${parentGroup}/${item.name}`
        : item.name;
      const origin = item.origin || parentOrigin;

      if (item.children) {
        const childParts = processOutliner(
          item.children,
          elements,
          groupName,
          origin
        );
        parts.push(...childParts);
      }
    }
  }

  return parts;
}

/**
 * Convertit les animations Blockbench.
 * Blockbench utilise le temps en secondes, on convertit en ticks (×20).
 */
function convertAnimations(
  bbAnimations: BBAnimation[],
  parts: ModelPart[]
): MobAnimation[] {
  const partIdMap = new Map<string, string>();
  // On ne peut pas mapper par UUID car les animators utilisent les UUID des groupes
  // Pour simplifier, on utilisera les noms des parts

  return bbAnimations.map((bbAnim) => {
    const durationTicks = Math.max(1, Math.round((bbAnim.length || 1) * 20));
    const loop =
      bbAnim.loop === "loop" || bbAnim.loop === undefined;

    const keyframes: AnimationKeyframe[] = [];

    if (bbAnim.animators) {
      for (const [animatorId, animator] of Object.entries(bbAnim.animators)) {
        if (!animator.keyframes) continue;

        // Essayer de trouver la part correspondante
        const matchPart = parts.find(
          (p) => p.id === animatorId || p.name === animatorId
        );
        const partId = matchPart?.id || animatorId;

        for (const kf of animator.keyframes) {
          const tick = Math.round(kf.time * 20);
          const dp = kf.data_points[0];
          if (!dp) continue;

          const vec: [number, number, number] = [
            typeof dp.x === "string" ? parseFloat(dp.x) || 0 : dp.x ?? 0,
            typeof dp.y === "string" ? parseFloat(dp.y) || 0 : dp.y ?? 0,
            typeof dp.z === "string" ? parseFloat(dp.z) || 0 : dp.z ?? 0,
          ];

          // Chercher un keyframe existant au même tick et part
          let existingKf = keyframes.find(
            (k) => k.tick === tick && k.part_ids.includes(partId)
          );
          if (!existingKf) {
            existingKf = { tick, part_ids: [partId] };
            keyframes.push(existingKf);
          }

          switch (kf.channel) {
            case "position":
              existingKf.position = [
                pixelToBlock(vec[0]),
                pixelToBlock(vec[1]),
                pixelToBlock(vec[2]),
              ];
              break;
            case "rotation":
              existingKf.rotation = vec;
              break;
            case "scale":
              existingKf.scale = vec;
              break;
          }
        }
      }
    }

    // Trier les keyframes par tick
    keyframes.sort((a, b) => a.tick - b.tick);

    return {
      id: bbAnim.uuid || generateId(),
      name: bbAnim.name || "Animation",
      duration_ticks: durationTicks,
      loop,
      keyframes,
    };
  });
}

// ── API publique ──

export interface BlockbenchImportResult {
  parts: ModelPart[];
  animations: MobAnimation[];
  groups: string[];
  warnings: string[];
}

/**
 * Importe un fichier Blockbench (.bbmodel ou .json) et retourne
 * les parts et animations converties.
 */
export function importBlockbenchModel(
  jsonContent: string
): BlockbenchImportResult {
  const warnings: string[] = [];

  let model: BBModel;
  try {
    model = JSON.parse(jsonContent);
  } catch {
    throw new Error("Fichier JSON invalide");
  }

  const elements = model.elements || [];
  if (elements.length === 0) {
    warnings.push("Aucun élément trouvé dans le modèle");
  }

  // Convertir les éléments
  let parts: ModelPart[];
  if (model.outliner && model.outliner.length > 0) {
    parts = processOutliner(model.outliner, elements);
  } else {
    // Pas d'outliner, on convertit directement les éléments
    parts = elements
      .map((el) => convertElement(el, ""))
      .filter((p): p is ModelPart => p !== null);
  }

  // Meshes exclues
  const meshCount = elements.filter((e) => e.type === "mesh").length;
  if (meshCount > 0) {
    warnings.push(
      `${meshCount} mesh(es) ignorée(s) — seuls les cubes sont supportés`
    );
  }

  // Extraire les groupes uniques
  const groups = [...new Set(parts.map((p) => p.group).filter(Boolean))];

  // Convertir les animations
  const animations = model.animations
    ? convertAnimations(model.animations, parts)
    : [];

  return { parts, animations, groups, warnings };
}

/**
 * Lit un fichier via l'API File et retourne le contenu JSON.
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
    reader.readAsText(file);
  });
}
