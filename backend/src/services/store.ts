import fs from "fs";
import path from "path";

const STORE_DIR = path.resolve(__dirname, "../../store");

// Assurer que le dossier store existe
if (!fs.existsSync(STORE_DIR)) {
  fs.mkdirSync(STORE_DIR, { recursive: true });
}

/**
 * Sauvegarde un sort sous un token donné.
 */
export function saveSpell(token: string, data: unknown): void {
  const filePath = path.join(STORE_DIR, `${token}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Charge un sort par token. Retourne null si non trouvé.
 */
export function loadSpell(token: string): unknown | null {
  const filePath = path.join(STORE_DIR, `${token}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

/**
 * Supprime un sort par token. Retourne true si supprimé.
 */
export function deleteSpell(token: string): boolean {
  const filePath = path.join(STORE_DIR, `${token}.json`);
  if (!fs.existsSync(filePath)) {
    return false;
  }
  fs.unlinkSync(filePath);
  return true;
}

/**
 * Liste tous les tokens sauvegardés.
 */
export function listTokens(): string[] {
  return fs
    .readdirSync(STORE_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));
}
