#!/bin/bash
# ═══════════════════════════════════════════════
#  Déploiement du Spell Editor sur server.pro
#  Usage: bash deploy.sh
# ═══════════════════════════════════════════════

set -e

echo ""
echo "  ✦ Spell Editor - Déploiement ✦"
echo ""

# ── Configuration ──
SERVER_USER="root"
SERVER_HOST="ZAZA.serv.gs"
REMOTE_DIR="/home/spell-editor"
PORT=3000

# ── 1. Build local ──
echo "  [1/4] Build du frontend React..."
cd frontend
npm run build
cd ..

echo "  [2/4] Build du backend TypeScript..."
cd backend
npm run build
cd ..

# ── 2. Créer un dossier temporaire avec les fichiers nécessaires ──
echo "  [3/4] Préparation des fichiers..."
DEPLOY_DIR=$(mktemp -d)
cp -r backend/dist "$DEPLOY_DIR/dist"
cp -r backend/public "$DEPLOY_DIR/public"
cp backend/package.json "$DEPLOY_DIR/package.json"

# Créer un script de démarrage
cat > "$DEPLOY_DIR/start.sh" << 'STARTSCRIPT'
#!/bin/bash
cd /home/spell-editor
export PORT=3000
export NODE_ENV=production

# Installer les dépendances production seulement
npm install --omit=dev --silent

# Démarrer avec redémarrage automatique
echo "  ✦ Démarrage du Spell Editor sur le port $PORT..."
node dist/index.js
STARTSCRIPT
chmod +x "$DEPLOY_DIR/start.sh"

# Créer le service systemd
cat > "$DEPLOY_DIR/spell-editor.service" << SERVICEEOF
[Unit]
Description=Spell Editor pour SchnewPlugin
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/home/spell-editor
ExecStart=/usr/bin/node /home/spell-editor/dist/index.js
Restart=always
RestartSec=5
Environment=PORT=3000
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
SERVICEEOF

# ── 3. Envoyer sur le serveur ──
echo "  [4/4] Upload vers $SERVER_HOST..."
ssh "$SERVER_USER@$SERVER_HOST" "mkdir -p $REMOTE_DIR"
scp -r "$DEPLOY_DIR/"* "$SERVER_USER@$SERVER_HOST:$REMOTE_DIR/"

# Installer les dépendances et démarrer le service
ssh "$SERVER_USER@$SERVER_HOST" << REMOTE
cd $REMOTE_DIR
npm install --omit=dev --silent
cp spell-editor.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable spell-editor
systemctl restart spell-editor
echo "  ✦ Service démarré !"
systemctl status spell-editor --no-pager
REMOTE

# Nettoyage
rm -rf "$DEPLOY_DIR"

echo ""
echo "  ═══════════════════════════════════════"
echo "  ✦ Déploiement terminé !"
echo "  ✦ API:      http://$SERVER_HOST:$PORT/api/health"
echo "  ✦ Éditeur:  http://$SERVER_HOST:$PORT/editor"
echo "  ═══════════════════════════════════════"
echo ""
