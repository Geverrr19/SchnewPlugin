import { useState, useEffect } from "react";
import {
  listPublishedSpells,
  toggleLike,
  deletePublishedSpell,
  deployToServer,
  checkDeployEnabled,
} from "../api/client";
import type { PublishedSpellSummary } from "../types/community";
import { useNavigate } from "react-router-dom";

export function CommunityPage() {
  const [spells, setSpells] = useState<PublishedSpellSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "popular" | "downloads">(
    "recent"
  );
  const [deployEnabled, setDeployEnabled] = useState(false);
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem("playerName") || ""
  );
  const navigate = useNavigate();

  useEffect(() => {
    loadSpells();
    checkDeployEnabled().then((r) => {
      if (r.enabled !== undefined) setDeployEnabled(r.enabled);
    });
  }, []);

  useEffect(() => {
    loadSpells();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  async function loadSpells() {
    setLoading(true);
    const result = await listPublishedSpells({
      sort,
      search: search || undefined,
    });
    if (result.ok && result.spells) {
      setSpells(result.spells);
      setError(null);
    } else {
      setError(result.error || "Erreur de chargement");
    }
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadSpells();
  }

  async function handleLike(token: string) {
    if (!playerName) {
      const name = prompt("Entre ton pseudo Minecraft:");
      if (!name) return;
      setPlayerName(name);
      localStorage.setItem("playerName", name);
    }
    await toggleLike(token, playerName || localStorage.getItem("playerName")!);
    loadSpells();
  }

  async function handleDeploy(token: string) {
    const res = await deployToServer(token, "spell");
    alert(res.message || (res.ok ? "Déployé !" : "Erreur"));
  }

  async function handleDelete(token: string) {
    if (!playerName) {
      const name = prompt("Entre ton pseudo Minecraft:");
      if (!name) return;
      setPlayerName(name);
      localStorage.setItem("playerName", name);
    }
    if (!confirm("Supprimer ce sort de la communauté ?")) return;
    const res = await deletePublishedSpell(token, playerName || localStorage.getItem("playerName")!);
    if (res.ok) {
      loadSpells();
    } else {
      alert(res.error || "Erreur");
    }
  }

  const castIcon = (t: string) => {
    switch (t) {
      case "projectile":
        return "🎯";
      case "area":
        return "🌀";
      case "instant":
        return "⚡";
      default:
        return "✦";
    }
  };

  return (
    <div className="community-page">
      <div className="community-header">
        <h1>✦ Communauté</h1>
        <p className="subtitle">Découvre les sorts créés par les joueurs</p>
      </div>

      <div className="community-controls">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Rechercher un sort..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn btn-outline btn-sm">
            🔍
          </button>
        </form>

        <div className="sort-buttons">
          <button
            className={`btn btn-sm ${sort === "recent" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setSort("recent")}
          >
            🕐 Récents
          </button>
          <button
            className={`btn btn-sm ${sort === "popular" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setSort("popular")}
          >
            ❤️ Populaires
          </button>
          <button
            className={`btn btn-sm ${sort === "downloads" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setSort("downloads")}
          >
            📥 Téléchargés
          </button>
        </div>
      </div>

      {loading && (
        <p style={{ color: "var(--text-muted)", textAlign: "center" }}>
          Chargement...
        </p>
      )}
      {error && (
        <p style={{ color: "var(--danger)", textAlign: "center" }}>{error}</p>
      )}

      {!loading && spells.length === 0 && (
        <div
          className="card"
          style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}
        >
          <p style={{ fontSize: "1.2rem" }}>
            Aucun sort publié pour le moment.
          </p>
          <p>Publie ton premier sort depuis l'éditeur !</p>
        </div>
      )}

      <div className="community-grid">
        {spells.map((s) => (
          <div
            className={`community-card card${playerName && s.author.toLowerCase() === playerName.toLowerCase() ? " community-card-own" : ""}`}
            key={s.token}
            onClick={() => navigate(`/community/${s.token}`)}
            style={{ cursor: "pointer" }}
          >
            {s.thumbnail ? (
              <div className="community-card-thumb">
                <img src={s.thumbnail} alt={s.name} />
              </div>
            ) : (
              <div className="community-card-thumb community-card-thumb-default">
                <span className="community-card-icon">
                  {castIcon(s.cast_type)}
                </span>
              </div>
            )}

            <div className="community-card-body">
              <h3 className="community-card-name">
                {s.name}
                {playerName && s.author.toLowerCase() === playerName.toLowerCase() && (
                  <span className="own-badge" title="Ton sort">⭐</span>
                )}
              </h3>
              <div className="community-card-meta">
                <span className="community-card-author">Par {s.author}</span>
                <span className="community-card-cast">
                  {castIcon(s.cast_type)} {s.cast_type}
                </span>
              </div>
              {s.description && (
                <p className="community-card-desc">
                  {s.description.substring(0, 80)}
                  {s.description.length > 80 ? "..." : ""}
                </p>
              )}
              <div className="community-card-stats">
                <button
                  className="stat-btn like-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(s.token);
                  }}
                >
                  ❤️ {s.likes}
                </button>
                <span className="stat">💬 {s.comments_count}</span>
                <span className="stat">📥 {s.downloads}</span>
                {deployEnabled && (
                  <button
                    className="stat-btn deploy-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeploy(s.token);
                    }}
                    title="Déployer sur le serveur"
                  >
                    🚀
                  </button>
                )}
                {playerName && s.author.toLowerCase() === playerName.toLowerCase() && (
                  <button
                    className="stat-btn delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(s.token);
                    }}
                    title="Supprimer de la communauté"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
