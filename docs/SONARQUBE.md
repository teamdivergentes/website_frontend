# SonarQube — Frontend (dvg-frontend)

## Instance

- URL : https://sonarqube.tellebma.fr
- Projet : `dvg-frontend`
- Dashboard : https://sonarqube.tellebma.fr/dashboard?id=dvg-frontend

## Quality Gate active : `Sonar way` (built-in, Clean as You Code compliant)

La QG s'applique uniquement sur le **New Code** (code ajouté/modifié depuis la branche de référence — `main`).

| Condition (metric) | Opérateur | Seuil | Sens |
|---|---|---|---|
| `new_violations` | `>` | `0` | Aucun nouveau problème (bug, vulnérabilité, code smell) |
| `new_coverage` | `<` | `80` | Le nouveau code doit avoir ≥ 80% de coverage |
| `new_duplicated_lines_density` | `>` | `3` | Le nouveau code doit avoir ≤ 3% de lignes dupliquées |
| `new_security_hotspots_reviewed` | `<` | `100` | Tous les nouveaux security hotspots doivent être review-és |

**La CI échoue si une seule condition est violée.** Le job `docker` dépend du job `sonarqube` → aucune image GHCR n'est publiée si la QG bloque.

## Configuration repo

| Élément | Emplacement |
|---|---|
| Config scanner | `sonar-project.properties` (racine) |
| Config Karma (lcov) | `karma.conf.cjs` (requis pour que `@angular/build:karma` émette lcov) |
| Job CI | `.github/workflows/cicd.yml` → job `sonarqube` |
| Secret GitHub Actions | `SONAR_TOKEN_DVG` (Project Analysis Token, expiration 2027-04-22) |
| Coverage source | `coverage/frontend/lcov.info` (Karma + karma-coverage) |

## Scan local

```bash
# 1. Générer le coverage
npm run test:coverage
# (= ng test --no-watch --browsers=ChromeHeadless --code-coverage)
# Verify: ls coverage/frontend/lcov.info

# 2. Scanner vers Sonar
docker run --rm \
  -e SONAR_HOST_URL=https://sonarqube.tellebma.fr \
  -e SONAR_TOKEN=<PROJECT_ANALYSIS_TOKEN> \
  -v "$PWD:/usr/src" \
  sonarsource/sonar-scanner-cli:latest
```

## Exclusions de coverage

Définies dans deux endroits (cohérents) :
- `sonar-project.properties` → `sonar.coverage.exclusions`
- `angular.json` → `test.options.codeCoverageExclude`

Couvrent : `main.ts`, `environments/**`, `*.module.ts`, `*.routes.ts`, `app.config.ts`, `*.mock.ts`, `*.stub.ts`.

## Rotation des tokens

| Token | Endpoint |
|---|---|
| Project Analysis Token (CI) | `POST /api/user_tokens/generate?type=PROJECT_ANALYSIS_TOKEN&projectKey=dvg-frontend&name=ci-dvg-frontend` |
| Badge Token (README) | `POST /api/project_badges/token?project=dvg-frontend` |

## Modifier la Quality Gate

La `Sonar way` est **built-in** et ne peut pas être modifiée. Pour durcir les seuils :

1. SonarQube → Quality Gates → `Sonar way` → **Copy** → nom `DVG Strict`
2. Modifier les conditions dans `DVG Strict` (ex. 90% au lieu de 80%)
3. Projet `dvg-frontend` → Project Settings → Quality Gate → assigner `DVG Strict`

## Troubleshooting

| Symptôme | Cause probable | Solution |
|---|---|---|
| Job `sonarqube` échoue avec `401 Unauthorized` | `SONAR_TOKEN_DVG` expiré ou manquant | Régénérer via l'API, mettre à jour le secret GitHub |
| `No LCOV files were found` | Karma n'a pas généré `coverage/frontend/lcov.info` | Vérifier `karma.conf.cjs` et `karmaConfig` dans `angular.json` |
| QG échoue sur `new_coverage` | Coverage du New Code < 80% | Ajouter des tests sur le code modifié |
| QG échoue sur `new_violations` | Bug/vulnerabilité/smell introduit | Voir l'onglet Issues du dashboard SonarQube |
