import { useState, useEffect } from "react";
import {
  listSpellTemplates,
  listPowerTemplates,
  deleteSpellTemplate,
  deletePowerTemplate,
  saveSpellTemplate,
  savePowerTemplate,
} from "../api/client";
import type { SpellTemplate, PowerTemplate } from "../types/community";

export function TemplatesPage() {
  const [tab, setTab] = useState<"spells" | "powers">("spells");
  const [spellTemplates, setSpellTemplates] = useState<SpellTemplate[]>([]);
  const [powerTemplates, setPowerTemplates] = useState<PowerTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem("playerName") || ""
  );
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!playerName) {
      const name = prompt("Entre ton pseudo Minecraft pour voir tes templates:");
      if (name) {
        setPlayerName(name);
        localStorage.setItem("playerName", name);
      }
    }
  }, []);

  useEffect(() => {
    if (playerName) loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerName, tab]);

  async function loadTemplates() {
    setLoading(true);
    if (tab === "spells") {
      const res = await listSpellTemplates(playerName);
      if (res.ok && res.templates) setSpellTemplates(res.templates);
    } else {
      const res = await listPowerTemplates(playerName);
      if (res.ok && res.templates) setPowerTemplates(res.templates);
    }
    setLoading(false);
  }

  async function handleDeleteSpellTemplate(id: string) {
    if (!confirm("Supprimer ce template ?")) return;
    await deleteSpellTemplate(playerName, id);
    loadTemplates();
  }

  async function handleDeletePowerTemplate(id: string) {
    if (!confirm("Supprimer ce template ?")) return;
    await deletePowerTemplate(playerName, id);
    loadTemplates();
  }

  function loadSpellTemplate(template: SpellTemplate) {
    if (template.spell) {
      // Store the spell in localStorage and navigate to editor
      localStorage.setItem("spell-editor-draft", JSON.stringify(template.spell));
      const token = template.id || "new";
      window.location.href = `/editor?token=${token}&player=${playerName}`;
    }
  }

  if (!playerName) {
    return (
      <div className="templates-page">
        <h1>✦ Mes Templates</h1>
        <p style={{ color: "var(--text-muted)" }}>
          Entrez votre pseudo pour voir vos templates.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => {
            const name = prompt("Pseudo Minecraft:");
            if (name) {
              setPlayerName(name);
              localStorage.setItem("playerName", name);
            }
          }}
        >
          🎮 Entrer mon pseudo
        </button>
      </div>
    );
  }

  return (
    <div className="templates-page">
      <div className="templates-header">
        <h1>✦ Mes Templates</h1>
        <p className="subtitle">
          Templates sauvegardés pour {playerName}
        </p>
      </div>

      <div className="tab-bar">
        <button
          className={`tab-btn ${tab === "spells" ? "tab-active" : ""}`}
          onClick={() => setTab("spells")}
        >
          🔮 Sorts
        </button>
        <button
          className={`tab-btn ${tab === "powers" ? "tab-active" : ""}`}
          onClick={() => setTab("powers")}
        >
          ⭐ Pouvoirs
        </button>
      </div>

      {message && (
        <div className="message message-success">{message}</div>
      )}

      {loading && (
        <p style={{ color: "var(--text-muted)" }}>Chargement...</p>
      )}

      {/* Spell Templates */}
      {tab === "spells" && !loading && (
        <div className="templates-grid">
          {spellTemplates.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 30, color: "var(--text-muted)" }}>
              <p>Aucun template de sort sauvegardé.</p>
              <p>Sauvegarde un template depuis l'éditeur de sorts !</p>
            </div>
          ) : (
            spellTemplates.map((t) => (
              <div className="template-card card" key={t.id}>
                <h3>{t.name}</h3>
                {t.description && (
                  <p className="template-desc">{t.description}</p>
                )}
                <div className="template-date">
                  Créé le{" "}
                  {new Date(t.created_at).toLocaleDateString("fr")}
                </div>
                <div className="template-actions">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => loadSpellTemplate(t)}
                  >
                    📖 Charger
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleDeleteSpellTemplate(t.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Power Templates */}
      {tab === "powers" && !loading && (
        <div className="templates-grid">
          {powerTemplates.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 30, color: "var(--text-muted)" }}>
              <p>Aucun template de pouvoir sauvegardé.</p>
            </div>
          ) : (
            powerTemplates.map((t) => (
              <div className="template-card card" key={t.id}>
                <h3>{t.name}</h3>
                {t.description && (
                  <p className="template-desc">{t.description}</p>
                )}
                <div className="template-date">
                  Créé le{" "}
                  {new Date(t.created_at).toLocaleDateString("fr")}
                </div>
                <div className="template-actions">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleDeletePowerTemplate(t.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
