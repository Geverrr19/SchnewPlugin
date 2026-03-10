import { useState, useEffect } from "react";
import { listSpells, SpellSummary } from "../api/client";

export function GalleryPage() {
  const [spells, setSpells] = useState<SpellSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const result = await listSpells();
    if (result.ok && result.spells) {
      setSpells(result.spells);
      setError(null);
    } else {
      setError(result.error || "Erreur de chargement");
    }
    setLoading(false);
  }

  const castTypeLabel = (t: string) => {
    switch (t) {
      case "projectile": return "🎯 Projectile";
      case "area": return "🌀 Zone";
      case "instant": return "⚡ Instantané";
      default: return t;
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ color: "var(--accent)" }}>✦ Galerie des Sorts</h1>
        <button className="btn btn-outline" onClick={loadAll} disabled={loading}>
          🔄 Rafraîchir
        </button>
      </div>

      {loading && <p style={{ color: "var(--text-muted)" }}>Chargement...</p>}
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

      {!loading && spells.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
          <p style={{ fontSize: "1.2rem" }}>Aucun sort créé pour le moment.</p>
          <p>Utilise <code>/customspell create</code> en jeu pour commencer !</p>
        </div>
      )}

      <div className="spell-gallery-grid">
        {spells.map((s) => (
          <div className="spell-gallery-card card" key={s.token}>
            <div className="spell-gallery-name">{s.name}</div>
            <div className="spell-gallery-meta">
              <span>Par {s.author}</span>
              <span>{castTypeLabel(s.cast_type)}</span>
            </div>
            <div className="spell-gallery-footer">
              <span className="spell-gallery-version">v{s.version}</span>
              <a href={`/editor?token=${s.token}&player=${s.author}`}
                className="btn btn-outline btn-sm">
                ✏️ Éditer
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
