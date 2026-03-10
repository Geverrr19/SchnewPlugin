# ═══════════════════════════════════════════════
#  Déploiement du Spell Editor sur server.pro
#  Usage: .\deploy.ps1
# ═══════════════════════════════════════════════

$ErrorActionPreference = "Stop"

# ── Configuration ──
$SERVER_USER = "root"
$SERVER_HOST = "ZAZA.serv.gs"
$REMOTE_DIR  = "/home/spell-editor"
$PORT        = 3000

Write-Host ""
Write-Host "  ✦ Spell Editor - Déploiement ✦" -ForegroundColor Magenta
Write-Host ""

# ── 1. Build local ──
Write-Host "  [1/4] Build du frontend React..." -ForegroundColor Cyan
Push-Location "$PSScriptRoot\frontend"
npm run build
Pop-Location

Write-Host "  [2/4] Build du backend TypeScript..." -ForegroundColor Cyan
Push-Location "$PSScriptRoot\backend"
npm run build
Pop-Location

# ── 2. Préparer les fichiers ──
Write-Host "  [3/4] Préparation des fichiers..." -ForegroundColor Cyan
$tempDir = Join-Path $env:TEMP "spell-editor-deploy"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copier les fichiers nécessaires
Copy-Item -Recurse "$PSScriptRoot\backend\dist" "$tempDir\dist"
Copy-Item -Recurse "$PSScriptRoot\backend\public" "$tempDir\public"
Copy-Item "$PSScriptRoot\backend\package.json" "$tempDir\package.json"

# ── 3. Upload via SCP ──
Write-Host "  [4/4] Upload vers $SERVER_HOST..." -ForegroundColor Cyan
ssh "${SERVER_USER}@${SERVER_HOST}" "mkdir -p $REMOTE_DIR"
scp -r "$tempDir\*" "${SERVER_USER}@${SERVER_HOST}:${REMOTE_DIR}/"

# ── 4. Installer et démarrer sur le serveur ──
Write-Host "  [5/5] Installation des dépendances et démarrage..." -ForegroundColor Cyan
ssh "${SERVER_USER}@${SERVER_HOST}" @"
cd $REMOTE_DIR
npm install --omit=dev --silent

# Arrêter l'ancien processus s'il existe
pkill -f 'node dist/index.js' 2>/dev/null || true

# Démarrer avec nohup
export PORT=$PORT
export NODE_ENV=production
nohup node dist/index.js > spell-editor.log 2>&1 &
echo "  ✦ PID: `$!`"
sleep 2
curl -s http://localhost:$PORT/api/health && echo " - API OK !" || echo " - Erreur !"
"@

# Nettoyage
Remove-Item $tempDir -Recurse -Force

Write-Host ""
Write-Host "  ═══════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✦ Déploiement terminé !" -ForegroundColor Green
Write-Host "  ✦ API:     http://${SERVER_HOST}:${PORT}/api/health" -ForegroundColor Yellow
Write-Host "  ✦ Éditeur: http://${SERVER_HOST}:${PORT}/editor" -ForegroundColor Yellow
Write-Host "  ═══════════════════════════════════════" -ForegroundColor Green
Write-Host ""
