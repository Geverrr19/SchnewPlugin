# ✨ Éditeur de Sorts Custom

Éditeur web pour créer des sorts personnalisés qui seront utilisés dans le plugin Minecraft.

## Architecture

```
siteCreationSort/
├── backend/          Express + TypeScript — API REST + stockage JSON
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/spells.ts
│   │   └── services/
│   └── store/        Fichiers JSON des sorts
├── frontend/         React + Vite + TypeScript — Interface de création
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── types/
│       └── api/
└── package.json      Scripts pour lancer les deux en parallèle
```

## Installation

```bash
cd siteCreationSort

# Installer les dépendances
npm install
npm run install:all
```

## Lancer en développement

```bash
# Lancer backend (port 3000) + frontend (port 5173) ensemble
npm run dev
```

Ou séparément :
```bash
npm run dev:backend    # API sur http://localhost:3000
npm run dev:frontend   # UI sur http://localhost:5173
```

## Utilisation

1. Le plugin Minecraft génère un **token** pour le joueur
2. Le joueur ouvre l'URL : `http://localhost:5173/editor?token=MON_TOKEN&player=MonPseudo`
3. Il crée son sort via l'interface graphique
4. Il clique **Exporter** → le sort est sauvegardé sur le serveur
5. Le plugin récupère le sort via `GET /api/spells/MON_TOKEN`

## API

| Méthode | Route                   | Description                      |
|---------|-------------------------|----------------------------------|
| GET     | `/api/health`           | Vérifier que le serveur tourne   |
| POST    | `/api/spells?token=XYZ` | Sauvegarder un sort              |
| GET     | `/api/spells/:token`    | Récupérer un sort par son token  |

## Format du sort (JSON)

```json
{
  "meta": {
    "id": "uuid-v4",
    "name": "Boule de Feu",
    "author": "Joueur",
    "created_at": "2024-01-01T00:00:00.000Z",
    "version": 1
  },
  "mechanics": {
    "cast_type": "projectile",
    "cooldown": 3,
    "mana_cost": 25,
    "range": 20,
    "speed": 2
  },
  "effects": [
    { "type": "damage", "amount": 6, "damage_type": "fire" },
    { "type": "status", "status": "burn", "duration": 3 }
  ],
  "visual": {
    "color": [255, 100, 0],
    "particle_trail": { "particle": "flame", "count": 5, "frequency": 2 },
    "impact": {
      "particle": "explosion",
      "sound": { "key": "entity.generic.explode", "volume": 1, "pitch": 1 }
    }
  }
}
```
