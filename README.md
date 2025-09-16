---
## 🚀 Informations de Build

| Information | Valeur |
|-------------|--------|
| **Statut** | ✅ SUCCESS |
| **Type de build** | unstable |
| **Image Docker** | `ghcr.io/teamdivergentes/website_frontend/dvg_web_frontend:72ff46a1f6437eedd62f8c888ca343195c557bc4` |
| **Tag workflow** | `ghcr.io/teamdivergentes/website_frontend/dvg_web_frontend:unstable` |
| **Commit** | `72ff46a1f6437eedd62f8c888ca343195c557bc4` |
| **Branche** | `feat/initCI` |
| **Build par** | tellebma |
| **Date/Heure** | 2025-09-16 18:24:39 UTC |

### 📊 Résultats des Analyses
- **Build Angular** : success
- **ESLint** : success
- **Semgrep** : success

### 🐳 Commandes Docker
```bash
# Récupérer l'image
docker pull ghcr.io/teamdivergentes/website_frontend/dvg_web_frontend:72ff46a1f6437eedd62f8c888ca343195c557bc4

# Lancer l'application
docker run -d -p 8080:80 --name frontend ghcr.io/teamdivergentes/website_frontend/dvg_web_frontend:72ff46a1f6437eedd62f8c888ca343195c557bc4
```

**Accès :** http://localhost:8080

---
# Frontend Angular - DVG

Application frontend Angular pour la TeamDivergentes.

## 🚀 Démarrage rapide

### Prérequis
- Node.js 20+
- npm

### Installation
```bash
npm install
```

### Développement
```bash
npm start
```

### Build
```bash
npm run build
```

## 📚 Documentation

- [CI/CD](./docs/devops/DEVSECOPS.md)
- [Configuration Docker](Dockerfile)
- [Configuration Nginx](Nginx.conf)

## 🔧 Scripts disponibles

- `npm start` - Lance le serveur de développement
- `npm run build` - Build de production
- `npm run lint` - Vérification ESLint
- `npm test` - Tests unitaires
