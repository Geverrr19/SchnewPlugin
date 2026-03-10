import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getPublishedSpell,
  toggleLike,
  addComment,
  deletePublishedSpell,
  updatePublishedSpell,
  deleteComment,
  deployToServer,
  checkDeployEnabled,
} from "../api/client";
import type { Spell } from "../types/spell";
import type { SpellComment } from "../types/community";

export function SpellDetailPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [spell, setSpell] = useState<Spell | null>(null);
  const [likes, setLikes] = useState(0);
  const [likedBy, setLikedBy] = useState<string[]>([]);
  const [comments, setComments] = useState<SpellComment[]>([]);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [deployEnabled, setDeployEnabled] = useState(false);
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem("playerName") || ""
  );

  useEffect(() => {
    if (token) loadSpell();
    checkDeployEnabled().then((r) => {
      if (r.enabled !== undefined) setDeployEnabled(r.enabled);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadSpell() {
    if (!token) return;
    setLoading(true);
    const res = await getPublishedSpell(token);
    if (res.spell) {
      setSpell(res.spell);
      setLikes(res.likes || 0);
      setLikedBy(res.liked_by || []);
      setComments(res.comments || []);
      setThumbnail(res.thumbnail || null);
    }
    setLoading(false);
  }

  function ensurePlayerName(): string | null {
    if (playerName) return playerName;
    const name = prompt("Entre ton pseudo Minecraft:");
    if (!name) return null;
    setPlayerName(name);
    localStorage.setItem("playerName", name);
    return name;
  }

  async function handleLike() {
    if (!token) return;
    const name = ensurePlayerName();
    if (!name) return;
    const res = await toggleLike(token, name);
    if (res.likes !== undefined) {
      setLikes(res.likes);
      if (res.liked) {
        setLikedBy([...likedBy, name]);
      } else {
        setLikedBy(likedBy.filter((n) => n !== name));
      }
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !commentText.trim()) return;
    const name = ensurePlayerName();
    if (!name) return;
    const res = await addComment(token, name, commentText.trim());
    if (res.ok && res.comment) {
      setComments([...comments, res.comment]);
      setCommentText("");
    }
  }

  async function handleDeploy() {
    if (!token) return;
    const res = await deployToServer(token, "spell");
    alert(res.message || (res.ok ? "Déployé !" : "Erreur"));
  }

  async function handleDeleteSpell() {
    if (!token) return;
    const name = ensurePlayerName();
    if (!name) return;
    if (!confirm("Supprimer définitivement ce sort de la communauté ?")) return;
    const res = await deletePublishedSpell(token, name);
    if (res.ok) {
      navigate("/community");
    } else {
      alert(res.error || "Erreur lors de la suppression");
    }
  }

  async function handleUpdateSpell() {
    if (!token) return;
    const name = ensurePlayerName();
    if (!name) return;
    if (!confirm("Mettre à jour ce sort avec la dernière version sauvegardée ?")) return;
    const res = await updatePublishedSpell(token, name, thumbnail ?? undefined);
    if (res.ok) {
      alert("Sort mis à jour !");
      loadSpell();
    } else {
      alert(res.error || "Erreur lors de la mise à jour");
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!token) return;
    const name = ensurePlayerName();
    if (!name) return;
    const res = await deleteComment(token, name, commentId);
    if (res.ok) {
      setComments(comments.filter((c) => c.id !== commentId));
    } else {
      alert(res.error || "Erreur");
    }
  }

  if (loading) {
    return (
      <div className="detail-page">
        <p style={{ color: "var(--text-muted)" }}>Chargement...</p>
      </div>
    );
  }

  if (!spell) {
    return (
      <div className="detail-page">
        <p style={{ color: "var(--danger)" }}>Sort non trouvé</p>
        <button className="btn btn-outline" onClick={() => navigate("/community")}>
          ← Retour
        </button>
      </div>
    );
  }

  const isLiked = playerName && likedBy.includes(playerName);
  const isAuthor = playerName && spell.meta.author.toLowerCase() === playerName.toLowerCase();

  return (
    <div className="detail-page">
      <button className="btn btn-outline" onClick={() => navigate("/community")} style={{ marginBottom: 16 }}>
        ← Retour à la communauté
      </button>

      <div className="detail-header">
        {thumbnail && (
          <div className="detail-thumbnail">
            <img src={thumbnail} alt={spell.meta.name} />
          </div>
        )}
        <div className="detail-info">
          <h1>{spell.meta.name}</h1>
          <p className="detail-author">Par {spell.meta.author}</p>
          {spell.meta.description && (
            <p className="detail-description">{spell.meta.description}</p>
          )}
          <div className="detail-stats">
            <span className="detail-cast-type">
              {spell.mechanics.cast_type === "projectile" ? "🎯" : spell.mechanics.cast_type === "area" ? "🌀" : "⚡"}{" "}
              {spell.mechanics.cast_type}
            </span>
            <span>Mana: {spell.mechanics.mana_cost}</span>
            <span>Cooldown: {spell.mechanics.cooldown}s</span>
          </div>
        </div>
      </div>

      <div className="detail-actions">
        <button
          className={`btn ${isLiked ? "btn-primary" : "btn-outline"}`}
          onClick={handleLike}
        >
          ❤️ {likes} Like{likes > 1 ? "s" : ""}
        </button>
        <a
          href={`/editor?token=${token}&player=${spell.meta.author}`}
          className="btn btn-outline"
        >
          ✏️ Éditer une copie
        </a>
        {deployEnabled && (
          <button className="btn btn-primary" onClick={handleDeploy}>
            🚀 Déployer
          </button>
        )}
      </div>

      {/* Actions de l'auteur */}
      {isAuthor && (
        <div className="detail-author-actions">
          <h3>🔧 Gestion (auteur)</h3>
          <div className="detail-actions">
            <a
              href={`/editor?token=${token}&player=${playerName}`}
              className="btn btn-outline"
            >
              ✏️ Modifier le sort
            </a>
            <button className="btn btn-outline" onClick={handleUpdateSpell}>
              🔄 Mettre à jour la publication
            </button>
            <button className="btn btn-danger" onClick={handleDeleteSpell}>
              🗑️ Retirer de la communauté
            </button>
          </div>
        </div>
      )}

      {/* Effets du sort */}
      {spell.effects && spell.effects.length > 0 && (
        <div className="detail-section">
          <h2>⚡ Effets</h2>
          <div className="effects-list">
            {spell.effects.map((effect, idx) => (
              <div className="effect-badge" key={idx}>
                {effect.type}
                {"amount" in effect && ` (${(effect as any).amount})`}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Commentaires */}
      <div className="detail-section">
        <h2>💬 Commentaires ({comments.length})</h2>

        <form onSubmit={handleComment} className="comment-form">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Ajouter un commentaire..."
            className="comment-input"
            maxLength={500}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={!commentText.trim()}>
            Envoyer
          </button>
        </form>

        <div className="comments-list">
          {comments.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>
              Aucun commentaire. Sois le premier !
            </p>
          ) : (
            comments.map((c) => (
              <div className="comment-item" key={c.id}>
                <div className="comment-header">
                  <span className="comment-author">{c.author}</span>
                  <span className="comment-date">
                    {new Date(c.created_at).toLocaleDateString("fr")}
                  </span>
                  {playerName && (isAuthor || c.author.toLowerCase() === playerName.toLowerCase()) && (
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ marginLeft: "auto", padding: "2px 8px", fontSize: "0.75rem" }}
                      onClick={() => handleDeleteComment(c.id)}
                      title="Supprimer ce commentaire"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className="comment-text">{c.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
