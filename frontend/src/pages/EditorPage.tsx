import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { SpellForm } from "../components/SpellForm";
import { SpellPreview } from "../components/SpellPreview";
import { ExportPanel } from "../components/ExportPanel";
import { JsonEditor } from "../components/JsonEditor";
import { createDefaultSpell, migrateSpell, calculateManaCost, Spell } from "../types/spell";
import { checkHealth, loadSpell as apiLoadSpell, checkJsonEditorEnabled } from "../api/client";

const LOCAL_STORAGE_KEY = "spell-editor-draft";

export function EditorPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const player = params.get("player") || "Joueur";

  const [spell, setSpell] = useState<Spell>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.meta) return migrateSpell(parsed);
      } catch { /* ignore */ }
    }
    return createDefaultSpell(player);
  });

  const [serverOnline, setServerOnline] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [editorMode, setEditorMode] = useState<"visual" | "json">("visual");
  const [jsonEditorEnabled, setJsonEditorEnabled] = useState(false);

  // Vérifier le serveur au démarrage
  useEffect(() => {
    checkHealth().then(setServerOnline);
    checkJsonEditorEnabled().then((r) => setJsonEditorEnabled(r.enabled));
    const interval = setInterval(() => checkHealth().then(setServerOnline), 15000);
    return () => clearInterval(interval);
  }, []);

  // Mettre à jour l'auteur quand le param change
  useEffect(() => {
    if (player && spell.meta.author !== player) {
      setSpell((prev) => ({
        ...prev,
        meta: { ...prev.meta, author: player },
      }));
    }
  }, [player]);

  // Auto-save vers localStorage (with auto-cost)
  useEffect(() => {
    const withCost = {
      ...spell,
      mechanics: { ...spell.mechanics, mana_cost: calculateManaCost(spell) },
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(withCost));
  }, [spell]);

  // Charger un sort depuis le serveur
  const handleLoadFromServer = useCallback(async () => {
    const t = token || manualToken;
    if (!t) return;

    const result = await apiLoadSpell(t);
    if (result.ok && result.spell) {
      setSpell(migrateSpell(result.spell));
    } else {
      alert(result.error || "Erreur de chargement");
    }
  }, [token, manualToken]);

  // Nouveau sort
  const handleNewSpell = useCallback(() => {
    setSpell(createDefaultSpell(player));
  }, [player]);

  // Si pas de token dans l'URL
  if (!token) {
    return (
      <div className="error-page">
        <h1>✦ Spell Editor</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Token manquant dans l'URL.
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Utilise <code>/editor?token=VOTRE_TOKEN&player=VOTRE_NOM</code>
        </p>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <input
            type="text"
            placeholder="Entrez votre token..."
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
          />
          <button
            className="btn btn-primary"
            onClick={() => {
              if (manualToken.trim()) {
                window.location.href = `/editor?token=${manualToken.trim()}&player=${player}`;
              }
            }}
          >
            Ouvrir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container">
      {/* Header */}
      <div className="editor-header">
        <h1>✦ Spell Editor</h1>
        <div className="meta-info">
          <span>
            <span className={`status-dot ${serverOnline ? "online" : "offline"}`} />
            {serverOnline ? "Serveur connecté" : "Serveur hors ligne"}
          </span>
          <span>Joueur: {player}</span>
          <span>Token: {token}</span>
        </div>
      </div>

      {/* Mode toggle (Visual / JSON) */}
      {jsonEditorEnabled && (
        <div className="editor-mode-toggle">
          <button
            className={`mode-toggle-btn ${editorMode === "visual" ? "active" : ""}`}
            onClick={() => setEditorMode("visual")}
          >
            🎨 Éditeur Visuel
          </button>
          <button
            className={`mode-toggle-btn ${editorMode === "json" ? "active" : ""}`}
            onClick={() => setEditorMode("json")}
          >
            {"{ }"} Éditeur JSON
          </button>
        </div>
      )}

      {/* Colonne principale : formulaire ou JSON */}
      <div className="editor-main">
        {editorMode === "visual" ? (
          <SpellForm spell={spell} onChange={setSpell} />
        ) : (
          <JsonEditor
            spell={spell}
            token={token}
            serverOnline={serverOnline}
            onSpellUpdate={(updated) => setSpell(migrateSpell(updated))}
          />
        )}
      </div>

      {/* Sidebar : preview + export */}
      <div className="editor-sidebar">
        <div className="card">
          <h2>Aperçu</h2>
          <SpellPreview spell={spell} />
        </div>

        <ExportPanel
          spell={spell}
          token={token}
          serverOnline={serverOnline}
          onLoadFromServer={handleLoadFromServer}
          onNewSpell={handleNewSpell}
        />
      </div>
    </div>
  );
}
