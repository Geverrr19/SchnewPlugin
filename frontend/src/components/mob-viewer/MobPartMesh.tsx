import { useRef, useMemo } from "react";
import { Mesh, Euler, Color } from "three";
import { Text } from "@react-three/drei";
import type { ModelPart, Hitbox, AttackHitbox } from "../../types/mob";

// ══════════════════════════════════════════
// Couleurs de blocs Minecraft (complet)
// ══════════════════════════════════════════

const BLOCK_COLORS: Record<string, string> = {
  // Pierre
  "minecraft:stone": "#7d7d7d",
  "minecraft:cobblestone": "#6b6b6b",
  "minecraft:obsidian": "#1a0a2e",
  "minecraft:netherrack": "#6b2020",
  "minecraft:end_stone": "#d8d8a0",
  "minecraft:bone_block": "#e8e0c8",
  "minecraft:deepslate": "#4a4a5a",
  "minecraft:blackstone": "#2a2a2a",
  "minecraft:sculk": "#0a2a3a",
  "minecraft:prismarine": "#5aada0",
  "minecraft:crying_obsidian": "#5a1a8e",
  "minecraft:tuff": "#6d6858",
  "minecraft:calcite": "#ddddd0",
  "minecraft:dripstone_block": "#8b7a60",
  "minecraft:muddy_mangrove_roots": "#5a4a3a",
  // Métal
  "minecraft:iron_block": "#d0d0d0",
  "minecraft:gold_block": "#f5c542",
  "minecraft:diamond_block": "#5ce8e0",
  "minecraft:emerald_block": "#17d649",
  "minecraft:lapis_block": "#1a3d8f",
  "minecraft:redstone_block": "#b91c1c",
  "minecraft:amethyst_block": "#8b5cf6",
  "minecraft:netherite_block": "#3a3a3a",
  "minecraft:copper_block": "#c07050",
  "minecraft:raw_iron_block": "#a89080",
  "minecraft:raw_gold_block": "#d0a040",
  "minecraft:raw_copper_block": "#9a6848",
  // Lumineux
  "minecraft:glowstone": "#e8bc41",
  "minecraft:sea_lantern": "#a0d8d0",
  "minecraft:shroomlight": "#e8a050",
  "minecraft:ochre_froglight": "#e0c060",
  "minecraft:verdant_froglight": "#80d080",
  "minecraft:pearlescent_froglight": "#d0a0e0",
  // Bois
  "minecraft:oak_log": "#8b6914",
  "minecraft:dark_oak_log": "#3d2a0a",
  "minecraft:birch_log": "#d0c8a0",
  "minecraft:spruce_log": "#5a3a1a",
  "minecraft:acacia_log": "#6b4020",
  "minecraft:jungle_log": "#6b5a30",
  "minecraft:crimson_stem": "#6d1a30",
  "minecraft:warped_stem": "#1a6d5a",
  "minecraft:mangrove_log": "#5b3528",
  "minecraft:cherry_log": "#d48b8b",
  "minecraft:bamboo_block": "#b0a040",
  "minecraft:oak_planks": "#b8945f",
  "minecraft:dark_oak_planks": "#4a3420",
  "minecraft:birch_planks": "#c8b880",
  "minecraft:spruce_planks": "#7a5830",
  "minecraft:crimson_planks": "#6d2840",
  "minecraft:warped_planks": "#2a6d6a",
  "minecraft:cherry_planks": "#e0a0a0",
  // Béton (16)
  "minecraft:white_concrete": "#cfd5d6",
  "minecraft:orange_concrete": "#e06101",
  "minecraft:magenta_concrete": "#a9309f",
  "minecraft:light_blue_concrete": "#2389c7",
  "minecraft:yellow_concrete": "#f0af15",
  "minecraft:lime_concrete": "#5ea818",
  "minecraft:pink_concrete": "#d6658f",
  "minecraft:gray_concrete": "#36393d",
  "minecraft:light_gray_concrete": "#7d7d73",
  "minecraft:cyan_concrete": "#157788",
  "minecraft:purple_concrete": "#641f9c",
  "minecraft:blue_concrete": "#2d2f8f",
  "minecraft:brown_concrete": "#603b20",
  "minecraft:green_concrete": "#495b24",
  "minecraft:red_concrete": "#8e2121",
  "minecraft:black_concrete": "#080a0f",
  // Laine (16)
  "minecraft:white_wool": "#e9ecec",
  "minecraft:orange_wool": "#f07613",
  "minecraft:magenta_wool": "#bd44b3",
  "minecraft:light_blue_wool": "#3aafd9",
  "minecraft:yellow_wool": "#f8c527",
  "minecraft:lime_wool": "#70b919",
  "minecraft:pink_wool": "#ed8daa",
  "minecraft:gray_wool": "#3e4447",
  "minecraft:light_gray_wool": "#8e8e86",
  "minecraft:cyan_wool": "#158991",
  "minecraft:purple_wool": "#7b2fbe",
  "minecraft:blue_wool": "#353aa2",
  "minecraft:brown_wool": "#724728",
  "minecraft:green_wool": "#546d1b",
  "minecraft:red_wool": "#a12722",
  "minecraft:black_wool": "#141519",
  // Terracotta
  "minecraft:terracotta": "#985f45",
  "minecraft:white_terracotta": "#d1b1a1",
  "minecraft:orange_terracotta": "#a15325",
  "minecraft:magenta_terracotta": "#95576c",
  "minecraft:light_blue_terracotta": "#706c8a",
  "minecraft:yellow_terracotta": "#ba8523",
  "minecraft:lime_terracotta": "#677534",
  "minecraft:pink_terracotta": "#a14e4e",
  "minecraft:gray_terracotta": "#392a24",
  "minecraft:light_gray_terracotta": "#876b62",
  "minecraft:cyan_terracotta": "#565b5b",
  "minecraft:purple_terracotta": "#764556",
  "minecraft:blue_terracotta": "#4a3b5b",
  "minecraft:brown_terracotta": "#4d3224",
  "minecraft:green_terracotta": "#4c5320",
  "minecraft:red_terracotta": "#8e3a2e",
  "minecraft:black_terracotta": "#251610",
  // Glazed Terracotta
  "minecraft:white_glazed_terracotta": "#d8d0c8",
  "minecraft:orange_glazed_terracotta": "#c07830",
  "minecraft:magenta_glazed_terracotta": "#c050b0",
  "minecraft:light_blue_glazed_terracotta": "#5898d0",
  "minecraft:yellow_glazed_terracotta": "#e0c050",
  "minecraft:lime_glazed_terracotta": "#88c830",
  "minecraft:pink_glazed_terracotta": "#e888a8",
  "minecraft:cyan_glazed_terracotta": "#3888a0",
  "minecraft:purple_glazed_terracotta": "#6840a0",
  "minecraft:blue_glazed_terracotta": "#3050b0",
  "minecraft:green_glazed_terracotta": "#607030",
  "minecraft:red_glazed_terracotta": "#b83838",
  "minecraft:black_glazed_terracotta": "#382838",
  // Verre teinté
  "minecraft:glass": "#c0d8e8",
  "minecraft:tinted_glass": "#2a2030",
  "minecraft:white_stained_glass": "#ffffff",
  "minecraft:orange_stained_glass": "#d87f33",
  "minecraft:magenta_stained_glass": "#b24cd8",
  "minecraft:light_blue_stained_glass": "#6699d8",
  "minecraft:yellow_stained_glass": "#e5e533",
  "minecraft:lime_stained_glass": "#7fcc19",
  "minecraft:pink_stained_glass": "#f27fa5",
  "minecraft:gray_stained_glass": "#4c4c4c",
  "minecraft:cyan_stained_glass": "#4c7f99",
  "minecraft:purple_stained_glass": "#7f3fb2",
  "minecraft:blue_stained_glass": "#334cb2",
  "minecraft:brown_stained_glass": "#664c33",
  "minecraft:green_stained_glass": "#667f33",
  "minecraft:red_stained_glass": "#993333",
  "minecraft:black_stained_glass": "#191919",
  // Divers
  "minecraft:quartz_block": "#ece8de",
  "minecraft:smooth_quartz": "#ece8de",
  "minecraft:purpur_block": "#a97da9",
  "minecraft:packed_ice": "#8db7e0",
  "minecraft:blue_ice": "#74b4e0",
  "minecraft:honey_block": "#e8a030",
  "minecraft:slime_block": "#70c040",
  "minecraft:dried_kelp_block": "#3a4420",
  "minecraft:hay_block": "#b8a040",
  "minecraft:moss_block": "#596d24",
  "minecraft:mud_bricks": "#8a7060",
  "minecraft:sandstone": "#d8c878",
  "minecraft:red_sandstone": "#b86030",
  "minecraft:smooth_stone": "#9a9a9a",
  "minecraft:bricks": "#966050",
  "minecraft:nether_bricks": "#2c1418",
  "minecraft:red_nether_bricks": "#460909",
  "minecraft:chiseled_nether_bricks": "#2f1015",
};

function getBlockColor(block: string): string {
  return BLOCK_COLORS[block] || "#888888";
}

// Couleurs pour les items courants
const ITEM_COLORS: Record<string, string> = {
  "minecraft:diamond_sword": "#5ce8e0",
  "minecraft:iron_sword": "#d0d0d0",
  "minecraft:golden_sword": "#f5c542",
  "minecraft:netherite_sword": "#3a3a3a",
  "minecraft:bow": "#8b6914",
  "minecraft:crossbow": "#6b6b6b",
  "minecraft:trident": "#4af0e0",
  "minecraft:shield": "#d0d0d0",
};

// ══════════════════════════════════════════
// Rendu d'une part du modèle
// ══════════════════════════════════════════

interface MobPartMeshProps {
  part: ModelPart;
  selected: boolean;
  onClick: (event?: any) => void;
  animatedPosition?: [number, number, number];
  animatedRotation?: [number, number, number];
  animatedScale?: [number, number, number];
  showLabels?: boolean;
}

export function MobPartMesh({
  part,
  selected,
  onClick,
  animatedPosition,
  animatedRotation,
  animatedScale,
  showLabels = true,
}: MobPartMeshProps) {
  const meshRef = useRef<Mesh>(null);

  const pos = animatedPosition ?? part.offset;
  const rot = animatedRotation ?? part.rotation;
  const scl = animatedScale ?? part.scale;

  // Convert degrees to radians
  const euler = useMemo(
    () =>
      new Euler(
        (rot[0] * Math.PI) / 180,
        (rot[1] * Math.PI) / 180,
        (rot[2] * Math.PI) / 180
      ),
    [rot]
  );

  const color = useMemo(() => {
    if (part.type === "item_display") {
      return new Color(ITEM_COLORS[part.block] || "#c084fc");
    }
    if (part.type === "text_display") {
      return new Color("#3b82f6");
    }
    return new Color(getBlockColor(part.block));
  }, [part.type, part.block]);

  // ── TEXT DISPLAY ──
  if (part.type === "text_display") {
    return (
      <group position={pos} rotation={euler} scale={scl}>
        <Text
          fontSize={0.3}
          color={selected ? "#fbbf24" : "#ffffff"}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
          onClick={(e) => {
            e.stopPropagation();
            onClick(e.nativeEvent);
          }}
        >
          {part.block || "Text"}
        </Text>
        {selected && (
          <mesh>
            <boxGeometry args={[1.05, 0.55, 0.05]} />
            <meshBasicMaterial
              color="#fbbf24"
              wireframe
              transparent
              opacity={0.6}
            />
          </mesh>
        )}
      </group>
    );
  }

  // ── ITEM DISPLAY (thinner box) ──
  if (part.type === "item_display") {
    return (
      <group position={pos} rotation={euler} scale={scl}>
        <mesh
          ref={meshRef}
          onClick={(e) => {
            e.stopPropagation();
            onClick(e.nativeEvent);
          }}
        >
          <boxGeometry args={[0.8, 0.8, 0.1]} />
          <meshStandardMaterial
            color={color}
            emissive={selected ? "#fbbf24" : "#000000"}
            emissiveIntensity={selected ? 0.3 : 0}
            roughness={0.3}
            metalness={0.6}
          />
        </mesh>
        {selected && (
          <mesh>
            <boxGeometry args={[0.85, 0.85, 0.15]} />
            <meshBasicMaterial
              color="#fbbf24"
              wireframe
              transparent
              opacity={0.6}
            />
          </mesh>
        )}
        {/* Item name label */}
        {showLabels && (
          <Text
            position={[0, 0.6, 0]}
            fontSize={0.12}
            color="#94a3b8"
            anchorX="center"
            anchorY="bottom"
          >
            {part.name}
          </Text>
        )}
      </group>
    );
  }

  // ── BLOCK DISPLAY (cube) ──
  return (
    <group position={pos} rotation={euler} scale={scl}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick(e.nativeEvent);
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={color}
          emissive={selected ? "#fbbf24" : "#000000"}
          emissiveIntensity={selected ? 0.3 : 0}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      {/* Wireframe overlay for selected */}
      {selected && (
        <mesh>
          <boxGeometry args={[1.02, 1.02, 1.02]} />
          <meshBasicMaterial
            color="#fbbf24"
            wireframe
            transparent
            opacity={0.6}
          />
        </mesh>
      )}
      {/* Block texture hint: grid lines */}
      <mesh>
        <boxGeometry args={[1.001, 1.001, 1.001]} />
        <meshBasicMaterial
          color="#000000"
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>
      {/* Part name label */}
      {showLabels && (
        <Text
          position={[0, 0.7, 0]}
          fontSize={0.12}
          color="#94a3b8"
          anchorX="center"
          anchorY="bottom"
        >
          {part.name}
        </Text>
      )}
    </group>
  );
}

// ══════════════════════════════════════════
// Hitbox Wireframe Mesh
// ══════════════════════════════════════════

interface HitboxMeshProps {
  hitbox: Hitbox | AttackHitbox;
  color?: string;
  opacity?: number;
  active?: boolean;
}

export function HitboxMesh({ hitbox, color = "#22c55e", opacity = 0.25, active = true }: HitboxMeshProps) {
  const euler = useMemo(
    () =>
      new Euler(
        (hitbox.rotation[0] * Math.PI) / 180,
        (hitbox.rotation[1] * Math.PI) / 180,
        (hitbox.rotation[2] * Math.PI) / 180
      ),
    [hitbox.rotation]
  );

  const meshColor = active ? color : "#666666";
  const meshOpacity = active ? opacity : 0.08;

  if (hitbox.shape === "sphere") {
    const radius = hitbox.size[0] || 0.5;
    return (
      <group position={hitbox.offset} rotation={euler}>
        <mesh>
          <sphereGeometry args={[radius, 16, 12]} />
          <meshBasicMaterial color={meshColor} transparent opacity={meshOpacity} />
        </mesh>
        <mesh>
          <sphereGeometry args={[radius, 16, 12]} />
          <meshBasicMaterial color={meshColor} wireframe transparent opacity={active ? 0.5 : 0.15} />
        </mesh>
      </group>
    );
  }

  if (hitbox.shape === "cylinder") {
    const radius = hitbox.size[0] || 0.5;
    const height = hitbox.size[1] || 1;
    return (
      <group position={hitbox.offset} rotation={euler}>
        <mesh>
          <cylinderGeometry args={[radius, radius, height, 16]} />
          <meshBasicMaterial color={meshColor} transparent opacity={meshOpacity} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[radius, radius, height, 16]} />
          <meshBasicMaterial color={meshColor} wireframe transparent opacity={active ? 0.5 : 0.15} />
        </mesh>
      </group>
    );
  }

  // Box (default)
  return (
    <group position={hitbox.offset} rotation={euler}>
      <mesh>
        <boxGeometry args={hitbox.size} />
        <meshBasicMaterial color={meshColor} transparent opacity={meshOpacity} />
      </mesh>
      <mesh>
        <boxGeometry args={[hitbox.size[0] + 0.01, hitbox.size[1] + 0.01, hitbox.size[2] + 0.01]} />
        <meshBasicMaterial color={meshColor} wireframe transparent opacity={active ? 0.5 : 0.15} />
      </mesh>
    </group>
  );
}

export { BLOCK_COLORS, getBlockColor };
