import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

interface PublishedEntry {
  token: string;
  player: string;
  spell: unknown;
  thumbnail?: string;
  published_at: string;
  likes: number;
  liked_by: string[];
  downloads: number;
  comments: { id: string; player: string; text: string; date: string }[];
}

const COMMUNITY_DIR = path.resolve(__dirname, "../../data/community");

function ensureDir() {
  if (!fs.existsSync(COMMUNITY_DIR)) {
    fs.mkdirSync(COMMUNITY_DIR, { recursive: true });
  }
}

function filePath(token: string) {
  return path.join(COMMUNITY_DIR, `${token}.json`);
}

function load(token: string): PublishedEntry | null {
  const fp = filePath(token);
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, "utf-8"));
}

function save(token: string, entry: PublishedEntry) {
  ensureDir();
  fs.writeFileSync(filePath(token), JSON.stringify(entry, null, 2), "utf-8");
}

export function publishSpell(token: string, player: string, spell: unknown, thumbnail?: string) {
  ensureDir();
  const existing = load(token);
  const entry: PublishedEntry = {
    token,
    player,
    spell,
    thumbnail,
    published_at: existing?.published_at || new Date().toISOString(),
    likes: existing?.likes || 0,
    liked_by: existing?.liked_by || [],
    downloads: existing?.downloads || 0,
    comments: existing?.comments || [],
  };
  save(token, entry);
}

export function listPublished(opts: { sort?: string; search?: string; author?: string }) {
  ensureDir();
  const files = fs.readdirSync(COMMUNITY_DIR).filter((f) => f.endsWith(".json"));
  let entries: PublishedEntry[] = files.map((f) => {
    return JSON.parse(fs.readFileSync(path.join(COMMUNITY_DIR, f), "utf-8"));
  });

  if (opts.author) {
    entries = entries.filter((e) => e.player.toLowerCase() === opts.author!.toLowerCase());
  }
  if (opts.search) {
    const q = opts.search.toLowerCase();
    entries = entries.filter((e) => {
      const s = e.spell as any;
      const name = s?.meta?.name || "";
      return name.toLowerCase().includes(q) || e.player.toLowerCase().includes(q);
    });
  }

  if (opts.sort === "popular") {
    entries.sort((a, b) => b.likes - a.likes);
  } else if (opts.sort === "downloads") {
    entries.sort((a, b) => b.downloads - a.downloads);
  } else {
    entries.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  }

  return entries.map((e) => {
    const s = e.spell as any;
    return {
      token: e.token,
      name: s?.meta?.name || "Sans nom",
      author: e.player,
      cast_type: s?.mechanics?.cast_type || "unknown",
      likes: e.likes,
      downloads: e.downloads,
      published_at: e.published_at,
      thumbnail: e.thumbnail,
    };
  });
}

export function getPublished(token: string) {
  const entry = load(token);
  if (!entry) return null;
  return {
    spell: entry.spell,
    likes: entry.likes,
    liked_by: entry.liked_by,
    comments: entry.comments,
    thumbnail: entry.thumbnail,
    author: entry.player,
    published_at: entry.published_at,
    downloads: entry.downloads,
  };
}

export function toggleLike(token: string, player: string) {
  const entry = load(token);
  if (!entry) return null;
  const idx = entry.liked_by.indexOf(player);
  if (idx >= 0) {
    entry.liked_by.splice(idx, 1);
    entry.likes = entry.liked_by.length;
    save(token, entry);
    return { likes: entry.likes, liked: false };
  } else {
    entry.liked_by.push(player);
    entry.likes = entry.liked_by.length;
    save(token, entry);
    return { likes: entry.likes, liked: true };
  }
}

export function addComment(token: string, player: string, text: string) {
  const entry = load(token);
  if (!entry) return null;
  const comment = { id: uuidv4(), player, text, date: new Date().toISOString() };
  entry.comments.push(comment);
  save(token, entry);
  return comment;
}

export function deleteComment(token: string, player: string, commentId: string) {
  const entry = load(token);
  if (!entry) return false;
  const idx = entry.comments.findIndex(
    (c) => c.id === commentId && (c.player === player || entry.player === player)
  );
  if (idx < 0) return false;
  entry.comments.splice(idx, 1);
  save(token, entry);
  return true;
}

export function unpublishSpell(token: string, player: string) {
  const entry = load(token);
  if (!entry || entry.player !== player) return false;
  const fp = filePath(token);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
  return true;
}

export function updatePublished(token: string, player: string, spell: unknown, thumbnail?: string) {
  const entry = load(token);
  if (!entry || entry.player !== player) return false;
  entry.spell = spell;
  if (thumbnail !== undefined) entry.thumbnail = thumbnail;
  save(token, entry);
  return true;
}
