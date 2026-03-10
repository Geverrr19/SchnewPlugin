import { useState, useEffect } from "react";
import {
  listSpells,
  savePower,
  listPowers,
  loadPower,
  deletePower,
  SpellSummary,
} from "../api/client";
import type { Power, PowerSummary } from "../types/community";
import { useNavigate } from "react-router-dom";

export function PowerEditorPage() {
  const [powers, setPowers] = useState<PowerSummary[]>([]);
  const [spells, setSpells] = useState<SpellSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"list" | "edit">("list");

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState(
    () => localStorage.getItem("playerName") || ""
  );
  const [icon, setIcon] = useState("NETHER_STAR");
  const [color, setColor] = useState("#FFD700");
  const [selectedSpells, setSelectedSpells] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [powersRes, spellsRes] = await Promise.all([
      listPowers(),
      listSpells(),
    ]);
    if (powersRes.ok && powersRes.powers) setPowers(powersRes.powers);
    if (spellsRes.ok && spellsRes.spells) setSpells(spellsRes.spells);
    setLoading(false);
  }

  function startCreate() {
    setEditId(null);
    setName("");
    setDescription("");
    setIcon("NETHER_STAR");
    setColor("#FFD700");
    setSelectedSpells([]);
    setMode("edit");
    setMessage(null);
  }

  async function startEdit(id: string) {
    const power = await loadPower(id);
    if (power) {
      setEditId(power.id);
      setName(power.name || "");
      setDescription(power.description || "");
      setAuthor(power.author || "");
      setIcon(power.icon || "NETHER_STAR");
      setColor(power.color || "#FFD700");
      setSelectedSpells(power.spell_ids || []);
      setMode("edit");
      setMessage(null);
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      setMessage("Nom requis !");
      return;
    }
    if (selectedSpells.length === 0) {
      setMessage("Sélectionnez au moins un sort !");
      return;
    }
    if (!author.trim()) {
      const pName = prompt("Entre ton pseudo Minecraft:");
      if (!pName) return;
      setAuthor(pName);
      localStorage.setItem("playerName", pName);
    }

    setSaving(true);
    const power: Power = {
      id: editId || "",
      name: name.trim(),
      description: description.trim(),
      author: author || localStorage.getItem("playerName") || "Anonyme",
      icon,
      color,
      spell_ids: selectedSpells,
      created_at: new Date().toISOString(),
      version: 1,
    };
    const res = await savePower(power);
    setSaving(false);

    if (res.ok) {
      setMessage("Pouvoir sauvegardé !");
      setMode("list");
      loadAll();
    } else {
      setMessage(res.error || "Erreur de sauvegarde");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce pouvoir ?")) return;
    await deletePower(id);
    loadAll();
  }

  function toggleSpell(token: string) {
    if (selectedSpells.includes(token)) {
      setSelectedSpells(selectedSpells.filter((t) => t !== token));
    } else {
      if (selectedSpells.length >= 10) {
        setMessage("Maximum 10 sorts par pouvoir");
        return;
      }
      setSelectedSpells([...selectedSpells, token]);
    }
  }

  const castIcon = (t: string) => {
    switch (t) {
      case "projectile": return "🎯";
      case "area": return "🌀";
      case "instant": return "⚡";
      default: return "✦";
    }
  };

  // ── List mode ──
  if (mode === "list") {
    return (
      <div className="powers-page">
        <div className="powers-header">
          <h1>✦ Pouvoirs</h1>
          <p className="subtitle">
            Regroupe plusieurs sorts en un pouvoir
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <button className="btn btn-primary" onClick={startCreate}>
            ➕ Nouveau Pouvoir
          </button>
        </div>

        {loading && <p style={{ color: "var(--text-muted)" }}>Chargement...</p>}

        {!loading && powers.length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
            <p>Aucun pouvoir créé. Crée ton premier pouvoir !</p>
          </div>
        )}

        <div className="powers-grid">
          {powers.map((p) => (
            <div className="power-card card" key={p.id}>
              <div className="power-card-header" style={{ borderLeftColor: p.color || "#FFD700" }}>
                <h3>{p.name}</h3>
                <span className="power-card-author">Par {p.author}</span>
              </div>
              {p.description && (
                <p className="power-card-desc">{p.description}</p>
              )}
              <div className="power-card-footer">
                <span className="power-card-count">
                  🔮 {p.spell_count} sort{p.spell_count > 1 ? "s" : ""}
                </span>
                <div className="power-card-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => startEdit(p.id)}>
                    ✏️
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => handleDelete(p.id)}>
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Edit mode ──
  return (
    <div className="powers-page">
      <button className="btn btn-outline" onClick={() => setMode("list")} style={{ marginBottom: 16 }}>
        ← Retour aux pouvoirs
      </button>

      <h1>{editId ? "Modifier le Pouvoir" : "Nouveau Pouvoir"}</h1>

      {message && (
        <div className={`message ${message.includes("sauvegardé") ? "message-success" : "message-error"}`}>
          {message}
        </div>
      )}

      <div className="power-edit-form card">
        <div className="form-row">
          <label>Nom</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du pouvoir"
            maxLength={40}
            className="form-input"
          />
        </div>

        <div className="form-row">
          <label>Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description courte"
            maxLength={100}
            className="form-input"
          />
        </div>

        <div className="form-row">
          <label>Couleur</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="form-color"
          />
        </div>

        <div className="form-row">
          <label>Sorts ({selectedSpells.length}/10)</label>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Clique sur les sorts pour les ajouter/retirer du pouvoir
          </p>
        </div>

        <div className="spell-picker">
          {spells.map((s) => {
            const isSelected = selectedSpells.includes(s.token);
            return (
              <div
                key={s.token}
                className={`spell-pick-item ${isSelected ? "spell-pick-selected" : ""}`}
                onClick={() => toggleSpell(s.token)}
              >
                <span className="spell-pick-icon">{castIcon(s.cast_type)}</span>
                <span className="spell-pick-name">{s.name}</span>
                <span className="spell-pick-author">{s.author}</span>
                {isSelected && <span className="spell-pick-check">✓</span>}
              </div>
            );
          })}
          {spells.length === 0 && (
            <p style={{ color: "var(--text-muted)" }}>
              Aucun sort disponible. Créez-en d'abord dans l'éditeur !
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Sauvegarde..." : "💾 Sauvegarder"}
          </button>
          <button className="btn btn-outline" onClick={() => setMode("list")}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
