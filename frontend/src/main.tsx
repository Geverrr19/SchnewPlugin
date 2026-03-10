import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { EditorPage } from "./pages/EditorPage";
import { GalleryPage } from "./pages/GalleryPage";
import { CommunityPage } from "./pages/CommunityPage";
import { SpellDetailPage } from "./pages/SpellDetailPage";
import { PowerEditorPage } from "./pages/PowerEditorPage";
import { TemplatesPage } from "./pages/TemplatesPage";
import { MobEditorPage } from "./pages/MobEditorPage";
import { ModelEditorPage } from "./pages/ModelEditorPage";
import { CreaturesPage } from "./pages/CreaturesPage";
import { Navbar } from "./components/Navbar";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Navbar />
      <Routes>
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/community/:token" element={<SpellDetailPage />} />
        <Route path="/powers" element={<PowerEditorPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/mobs" element={<MobEditorPage />} />
        <Route path="/models" element={<ModelEditorPage />} />
        <Route path="/creatures" element={<CreaturesPage />} />
        <Route path="*" element={<Navigate to="/community" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
