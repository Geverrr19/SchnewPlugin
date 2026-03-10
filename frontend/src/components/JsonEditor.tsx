import { useState, useCallback, useEffect, useRef } from "react";
import type { Spell } from "../types/spell";
import { saveRawJson, loadSpell } from "../api/client";

interface Props {
  spell: Spell;
  token: string;
  serverOnline: boolean;
  onSpellUpdate: (spell: Spell) => void;
}

export function JsonEditor({ spell, token, serverOnline, onSpellUpdate }: Props) {
  const [jsonText, setJsonText] = useState(() => JSON.stringify(spell, null, 2));
  const [status, setStatus] = useState<{
    type: "success" | "error" | "warning";
    message: string;
    details?: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [syntaxError, setSyntaxError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Sync scroll between textarea and line numbers
  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Sync spell → JSON text quand le spell change depuis l'extérieur
  useEffect(() => {
    setJsonText(JSON.stringify(spell, null, 2));
  }, [spell]);

  // Validation syntax JSON en temps réel
  const handleJsonChange = useCallback((value: string) => {
    setJsonText(value);
    try {
      JSON.parse(value);
      setSyntaxError(null);
    } catch (e: any) {
      setSyntaxError(e.message);
    }
  }, []);

  // Formater le JSON
  const handleFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setSyntaxError(null);
    } catch (e: any) {
      setSyntaxError(e.message);
    }
  }, [jsonText]);

  // Sauvegarder le JSON brut via l'API
  const handleSave = useCallback(async () => {
    if (!serverOnline) {
      setStatus({ type: "error", message: "Le serveur n'est pas en ligne." });
      return;
    }
    if (syntaxError) {
      setStatus({ type: "error", message: "Corrigez les erreurs de syntaxe JSON avant de sauvegarder." });
      return;
    }

    setLoading(true);
    setStatus(null);

    const result = await saveRawJson(token, jsonText);

    if (result.ok) {
      setStatus({
        type: result.warnings?.length ? "warning" : "success",
        message: result.warnings?.length
          ? "Sort sauvegardé avec des avertissements"
          : "Sort sauvegardé avec succès ! Utilisez /customspell import " + token,
        details: result.warnings,
      });

      // Mettre à jour le spell dans l'éditeur visuel
      try {
        const parsed = JSON.parse(jsonText);
        onSpellUpdate(parsed);
      } catch { /* ignore */ }
    } else {
      setStatus({
        type: "error",
        message: result.error || "Erreur lors de la sauvegarde",
        details: result.errors,
      });
    }

    setLoading(false);
  }, [jsonText, token, serverOnline, syntaxError, onSpellUpdate]);

  // Charger le JSON depuis le serveur
  const handleLoadFromServer = useCallback(async () => {
    if (!serverOnline) {
      setStatus({ type: "error", message: "Le serveur n'est pas en ligne." });
      return;
    }
    setLoading(true);
    setStatus(null);

    const result = await loadSpell(token);
    if (result.ok && result.spell) {
      const formatted = JSON.stringify(result.spell, null, 2);
      setJsonText(formatted);
      setSyntaxError(null);
      onSpellUpdate(result.spell);
      setStatus({ type: "success", message: "Sort chargé depuis le serveur." });
    } else {
      setStatus({ type: "error", message: result.error || "Sort non trouvé" });
    }

    setLoading(false);
  }, [token, serverOnline, onSpellUpdate]);

  // Appliquer le JSON à l'éditeur visuel (sans sauvegarder)
  const handleApplyToVisual = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText);
      onSpellUpdate(parsed);
      setStatus({ type: "success", message: "JSON appliqué à l'éditeur visuel." });
    } catch (e: any) {
      setStatus({ type: "error", message: "JSON invalide: " + e.message });
    }
  }, [jsonText, onSpellUpdate]);

  // Calculer les statistiques du JSON
  const lineCount = jsonText.split("\n").length;
  const charCount = jsonText.length;

  return (
    <div className="json-editor-container">
      {/* Header */}
      <div className="json-editor-header">
        <div className="json-editor-title">
          <span className="json-icon">{ }</span>
          <h3>Éditeur JSON Direct</h3>
        </div>
        <div className="json-editor-stats">
          <span>{lineCount} lignes</span>
          <span>{charCount} caractères</span>
        </div>
      </div>

      {/* Warning banner */}
      <div className="json-editor-warning">
        <span>⚠</span>
        <p>
          Mode avancé — Modifiez le JSON directement. Des validations de sécurité
          sont appliquées automatiquement (commandes interdites, limites de valeurs).
        </p>
      </div>

      {/* Toolbar */}
      <div className="json-editor-toolbar">
        <button
          className="btn btn-sm"
          onClick={handleFormat}
          title="Reformater le JSON"
        >
          ✨ Formater
        </button>
        <button
          className="btn btn-sm"
          onClick={handleApplyToVisual}
          disabled={!!syntaxError}
          title="Appliquer les changements à l'éditeur visuel"
        >
          🔄 Appliquer à l'éditeur visuel
        </button>
        <button
          className="btn btn-sm"
          onClick={handleLoadFromServer}
          disabled={loading || !serverOnline}
          title="Recharger depuis le serveur"
        >
          📥 Charger du serveur
        </button>
        <div style={{ flex: 1 }} />
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSave}
          disabled={loading || !serverOnline || !!syntaxError}
          title="Sauvegarder le JSON sur le serveur (avec validation)"
        >
          {loading ? "⏳ Envoi..." : "💾 Sauvegarder JSON"}
        </button>
      </div>

      {/* Syntax error banner */}
      {syntaxError && (
        <div className="json-editor-syntax-error">
          <span>❌ Erreur de syntaxe:</span> {syntaxError}
        </div>
      )}

      {/* Editor area */}
      <div className="json-editor-area">
        {/* Line numbers */}
        <div className="json-editor-line-numbers" ref={lineNumbersRef}>
          {Array.from({ length: lineCount }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className={`json-editor-textarea ${syntaxError ? "has-error" : ""}`}
          value={jsonText}
          onChange={(e) => handleJsonChange(e.target.value)}
          onScroll={handleScroll}
          spellCheck={false}
          wrap="off"
        />
      </div>

      {/* Status */}
      {status && (
        <div className={`json-editor-status json-editor-status-${status.type}`}>
          <div className="json-editor-status-message">
            {status.type === "success" && "✅ "}
            {status.type === "error" && "❌ "}
            {status.type === "warning" && "⚠️ "}
            {status.message}
          </div>
          {status.details && status.details.length > 0 && (
            <ul className="json-editor-status-details">
              {status.details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
