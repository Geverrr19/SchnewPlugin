import { useState, useCallback, useRef } from "react";
import type { Spell } from "../types/spell";
import { exportSpell, loadSpell, publishSpell, saveSpellTemplate } from "../api/client";
import { createDefaultSpell, calculateManaCost } from "../types/spell";

interface Props {
  spell: Spell;
  token: string;
  serverOnline: boolean;
  onLoadFromServer: (spell: Spell) => void;
  onNewSpell: () => void;
}

export function ExportPanel({ spell, token, serverOnline, onLoadFromServer, onNewSpell }: Props) {
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleExport = useCallback(async () => {
    if (!serverOnline) {
      setStatus({ type: "error", message: "Le serveur n'est pas en ligne." });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      // Inject auto-cost before export
      const spellWithCost: Spell = {
        ...spell,
        mechanics: { ...spell.mechanics, mana_cost: calculateManaCost(spell) },
        meta: { ...spell.meta, version: (spell.meta.version ?? 1) + 0 },
      };
      await exportSpell(token, spellWithCost);
      setStatus({ type: "success", message: "Sort exporté avec succès ! Utilise /customspell import " + token });
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Erreur lors de l'export." });
    } finally {
      setLoading(false);
    }
  }, [spell, token, serverOnline]);

  const handleLoad = useCallback(async () => {
    if (!serverOnline) {
      setStatus({ type: "error", message: "Le serveur n'est pas en ligne." });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const result = await loadSpell(token);
      if (!result.ok || !result.spell) {
        setStatus({ type: "error", message: result.error || "Aucun sort trouvé sur le serveur." });
        return;
      }
      onLoadFromServer(result.spell);
      setStatus({ type: "success", message: "Sort chargé depuis le serveur." });
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Aucun sort trouvé sur le serveur." });
    } finally {
      setLoading(false);
    }
  }, [token, serverOnline, onLoadFromServer]);

  const handleCopyLink = useCallback(() => {
    const link = `${window.location.origin}/api/spells/${token}`;
    navigator.clipboard.writeText(link).then(
      () => setStatus({ type: "success", message: "Lien copié !" }),
      () => setStatus({ type: "error", message: "Impossible de copier le lien." })
    );
  }, [token]);

  const handleCopyJson = useCallback(() => {
    const json = JSON.stringify(spell, null, 2);
    navigator.clipboard.writeText(json).then(
      () => setStatus({ type: "success", message: "JSON copié !" }),
      () => setStatus({ type: "error", message: "Impossible de copier le JSON." })
    );
  }, [spell]);

  return (
    <div className="card">
      <h2>Export</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          className="btn btn-primary"
          onClick={handleExport}
          disabled={loading || !serverOnline}
        >
          {loading ? "⏳ Export..." : "📤 Exporter vers le serveur"}
        </button>

        <button
          className="btn btn-success"
          onClick={handleLoad}
          disabled={loading || !serverOnline}
        >
          📥 Charger depuis le serveur
        </button>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-outline" onClick={handleCopyLink} style={{ flex: 1 }}>
            🔗 Copier lien
          </button>
          <button className="btn btn-outline" onClick={handleCopyJson} style={{ flex: 1 }}>
            📋 Copier JSON
          </button>
        </div>

        <button className="btn btn-danger" onClick={() => setShowConfirm(true)} disabled={loading}>
          🗑 Nouveau sort
        </button>

        {showConfirm && (
          <div className="confirm-overlay" onClick={() => setShowConfirm(false)}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <h3>⚠️ Nouveau sort</h3>
              <p>Toutes les modifications non sauvegardées seront perdues. Continuer ?</p>
              <div className="confirm-actions">
                <button className="btn btn-outline" onClick={() => setShowConfirm(false)}>Annuler</button>
                <button className="btn btn-danger" onClick={() => { setShowConfirm(false); onNewSpell(); }}>Confirmer</button>
              </div>
            </div>
          </div>
        )}

        {/* Publier dans la communauté */}
        <hr style={{ border: "1px solid var(--border)", margin: "8px 0" }} />

        <button
          className="btn btn-outline"
          onClick={async () => {
            if (!serverOnline) {
              setStatus({ type: "error", message: "Serveur hors ligne." });
              return;
            }
            setLoading(true);
            try {
              // Export d'abord
              const spellWithCost: Spell = {
                ...spell,
                mechanics: { ...spell.mechanics, mana_cost: calculateManaCost(spell) },
              };
              await exportSpell(token, spellWithCost);
              // Puis publier
              const res = await publishSpell(token, spell.meta.author);
              if (res.ok) {
                setStatus({ type: "success", message: "Sort publié dans la communauté ! 🎉" });
              } else {
                setStatus({ type: "error", message: res.error || "Erreur de publication." });
              }
            } catch (err: any) {
              setStatus({ type: "error", message: err.message || "Erreur de publication." });
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading || !serverOnline}
        >
          🌐 Publier dans la communauté
        </button>

        <button
          className="btn btn-outline"
          onClick={async () => {
            const templateName = prompt("Nom du template:", spell.meta.name);
            if (!templateName) return;
            const templateDesc = prompt("Description (optionnel):", "");
            setLoading(true);
            try {
              const res = await saveSpellTemplate(spell.meta.author, {
                id: "",
                name: templateName,
                description: templateDesc || "",
                spell,
                created_at: new Date().toISOString(),
              });
              if (res.ok) {
                setStatus({ type: "success", message: "Template sauvegardé !" });
              } else {
                setStatus({ type: "error", message: res.error || "Erreur." });
              }
            } catch (err: any) {
              setStatus({ type: "error", message: err.message });
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
        >
          📋 Sauvegarder comme template
        </button>
      </div>

      {status && (
        <div className={`export-result export-${status.type}`} style={{ marginTop: 10 }}>
          {status.message}
        </div>
      )}

      {!serverOnline && (
        <div className="export-result export-error" style={{ marginTop: 8 }}>
          ⚠ Serveur hors ligne — l'export est désactivé.
        </div>
      )}
    </div>
  );
}
