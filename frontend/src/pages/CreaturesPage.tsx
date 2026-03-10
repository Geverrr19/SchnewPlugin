import { useState } from "react";
import { MobEditorPage } from "./MobEditorPage";
import { ModelEditorPage } from "./ModelEditorPage";

type CreatureTab = "mobs" | "models";

export function CreaturesPage() {
  const [tab, setTab] = useState<CreatureTab>("mobs");

  return (
    <div className="creatures-page">
      {/* Tab bar */}
      <div className="creatures-tabs">
        <button
          className={`creatures-tab ${tab === "mobs" ? "active" : ""}`}
          onClick={() => setTab("mobs")}
        >
          🐉 Mobs Customs
        </button>
        <button
          className={`creatures-tab ${tab === "models" ? "active" : ""}`}
          onClick={() => setTab("models")}
        >
          🎨 Modèles Visuels
        </button>
      </div>

      {/* Content */}
      <div className="creatures-content">
        {tab === "mobs" ? <MobEditorPage /> : <ModelEditorPage />}
      </div>
    </div>
  );
}
