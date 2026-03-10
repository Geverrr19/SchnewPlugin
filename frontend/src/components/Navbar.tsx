import { NavLink } from "react-router-dom";

export function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">✦</span>
        <span className="navbar-title">Création Sort</span>
      </div>
      <div className="navbar-links">
        <NavLink to="/community" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          🌐 Communauté
        </NavLink>
        <NavLink to="/editor" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          ✏️ Éditeur
        </NavLink>
        <NavLink to="/gallery" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          📚 Galerie
        </NavLink>
        <NavLink to="/powers" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          ⭐ Pouvoirs
        </NavLink>
        <NavLink to="/templates" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          📋 Templates
        </NavLink>
        <NavLink to="/creatures" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          🐉 Créatures
        </NavLink>
      </div>
    </nav>
  );
}
