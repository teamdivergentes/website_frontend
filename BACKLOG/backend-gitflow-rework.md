# Brief — Repliquer la refonte GitFlow CI/CD du frontend sur le backend

## Contexte

Le frontend (`teamdivergentes/website_frontend`) vient d'etre refondu pour
corriger un anti-pattern GitFlow ou un push sur `main` declenchait
simultanement un deploiement PREPROD **et** un `semantic-release` qui creait
un tag `vX.Y.Z` partant immediatement en PROD. PREPROD ne jouait donc aucun
role de garde-fou : elle recevait le commit destine a PROD sans fenetre de
validation.

La meme topologie existe vraisemblablement sur le backend
(`teamdivergentes/website_backend` ou equivalent). Cette tache consiste a
appliquer la **meme refonte** cote backend, en l'adaptant aux specificites
de la stack (Node/NestJS/etc., tests d'integration, migrations DB).

PR de reference cote frontend :
[teamdivergentes/website_frontend#claude/github-sha-image-tag-LSkH4](https://github.com/teamdivergentes/website_frontend/tree/claude/github-sha-image-tag-LSkH4)
(2 commits : ajout `DEPLOY_IMAGE_TAG` puis refonte GitFlow complete).

---

## Objectif

Faire passer le pipeline backend du modele actuel :

```
push develop  -> image :dev          -> aucun deploiement
push main     -> image :PREPROD      -> deploy PREPROD
                 + semantic-release  -> tag vX.Y.Z
push tag v*   -> image :RELEASE      -> deploy PROD
```

au modele cible :

```
push develop  -> image :PREPROD      -> deploy PREPROD
push main     -> pas d'image flottante (juste :SHA + :version-rc-SHA)
                 + semantic-release  -> tag vX.Y.Z
push tag v*   -> image :RELEASE      -> smoke-release -> deploy PROD
```

PREPROD devient l'environnement de **validation continue** branche sur
`develop`. Un merge sur `main` ne fait que declencher la release : le tag
ainsi cree re-trigger le workflow et part en PROD apres un smoke-test du
binaire `:RELEASE` et l'approbation manuelle via GitHub Environments.

---

## Modifications a appliquer

### 1. `.github/scripts/determine-tags.sh`

Inverser la logique pour `develop` et `main` :

```bash
elif [[ "$GITHUB_REF" == "refs/heads/develop" ]]; then
    TAG_SUFFIX="PREPROD"
    VERSION_TAG="$PROJECT_VERSION-PREPROD-$SHORT_SHA"
elif [[ "$GITHUB_REF" == "refs/heads/main" ]]; then
    # Aucun tag flottant : main ne pousse que les tags immuables (SHA + version)
    # comme garde-fou avant que semantic-release ne cree vX.Y.Z. Le tag re-trigger
    # un workflow complet qui produira l'image :RELEASE et deploiera en PROD.
    TAG_SUFFIX=""
    VERSION_TAG="$PROJECT_VERSION-rc-$SHORT_SHA"
```

Et au moment de construire `WORKFLOW_TAG`, ne pas l'emettre si le suffix est
vide :

```bash
if [[ -n "$TAG_SUFFIX" ]]; then
    WORKFLOW_TAG="$REGISTRY/$ORGANIZATION/$REPOSITORY/$IMAGE_NAME:$TAG_SUFFIX"
else
    WORKFLOW_TAG=""
fi
```

`docker/build-push-action` filtre les lignes vides du champ `tags:` donc
emettre `""` est sans danger.

### 2. `.github/workflows/cicd.yml` — Triggers

Ajouter `develop` aux branches qui declenchent le workflow :

```yaml
on:
  push:
    branches: [ "main", "develop" ]
    tags: [ "v*" ]
```

### 3. `.github/workflows/cicd.yml` — `deploy-preprod`

Changer le trigger de `refs/heads/main` vers `refs/heads/develop` (garder
le hook PR avec `[DEPLOY]` dans le titre pour les preprod ad-hoc) :

```yaml
deploy-preprod:
  if: |
    !cancelled() &&
    (github.ref == 'refs/heads/develop' ||
     (github.event_name == 'pull_request' && contains(github.event.pull_request.title, '[DEPLOY]'))) &&
    needs.build.result == 'success' &&
    ...
```

Mettre a jour le commentaire au-dessus du job pour refleter le nouveau
modele.

### 4. `.github/workflows/cicd.yml` — Cache Docker

Ajouter `develop` a la condition `cache-to` du job docker :

```yaml
cache-to: ${{ (github.ref == 'refs/heads/develop' || github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/tags/v') || contains(github.event.pull_request.title || '', '[DEPLOY]')) && format(...) || '' }}
```

### 5. `.github/workflows/cicd.yml` — Nouveau job `smoke-release`

A inserer juste avant `deploy-prod`. Sur le frontend, on boote l'image et
on curl `/health`. Cote backend, **adapter le smoke** :

- **Endpoint a verifier** : probablement `/api/health` ou `/health` (a
  confirmer dans le code backend). Si NestJS avec `@nestjs/terminus`, c'est
  generalement `/health`.
- **Dependances** : si l'image backend ne demarre pas sans une DB ou un
  Redis, il faut soit :
  - (a) Un endpoint health "shallow" (sans I/O) qui ne valide que le boot
    HTTP — preferable pour un smoke isole.
  - (b) Spinner un docker-compose ephemere avec services minimaux. Plus
    couteux et plus fragile.
  - **Recommande** : option (a). Si l'endpoint courant fait du DB-ping,
    ajouter un `/health/liveness` qui ne fait que `return { ok: true }`
    et l'utiliser ici.
- **Variables d'env** : passer `NODE_ENV=production`, `DATABASE_URL` bidon
  si necessaire pour eviter un crash au boot. Documenter ce que l'image
  attend au minimum.

Squelette du job (a adapter) :

```yaml
smoke-release:
  runs-on: [self-hosted, linux, docker]
  needs: [docker, scan-image]
  if: |
    !cancelled() &&
    startsWith(github.ref, 'refs/tags/v') &&
    needs.docker.result == 'success' &&
    needs.scan-image.result == 'success'
  permissions:
    contents: read
    packages: read
  steps:
    - name: Log in to GitHub Container Registry
      uses: docker/login-action@<sha>
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Pull and boot release image
      env:
        IMAGE: ${{ needs.docker.outputs.image-tag }}
      run: |
        set -euo pipefail
        docker pull "$IMAGE"
        # ADAPTER : ajouter -e DATABASE_URL=... si requis pour le boot
        docker run -d --name backend-smoke -p 13000:3000 "$IMAGE"
        for i in $(seq 1 30); do
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://127.0.0.1:13000/health || echo "0")
          if [[ "$STATUS" == "200" ]]; then
            echo "Smoke OK (HTTP 200) apres ${i}s"
            exit 0
          fi
          sleep 1
        done
        echo "::error::Smoke release KO - /health n'a jamais repondu 200"
        docker logs backend-smoke || true
        exit 1

    - name: Cleanup smoke container
      if: always()
      run: docker rm -f backend-smoke || true
```

Note : le port externe `13000` evite les conflits avec d'autres conteneurs
sur le runner self-hosted. Adapter le port interne (`3000` ici) au port
qu'expose effectivement l'image backend.

### 6. `.github/workflows/cicd.yml` — `deploy-prod`

Ajouter `smoke-release` aux dependances et a la condition, et passer
`DEPLOY_IMAGE_TAG=:SHA` pour deployer le binaire exact qui vient d'etre
smoke-teste :

```yaml
deploy-prod:
  needs: [build, lint, test, semgrep, docker, scan-image, smoke-release]
  if: |
    !cancelled() &&
    startsWith(github.ref, 'refs/tags/v') &&
    needs.build.result == 'success' &&
    needs.lint.result == 'success' &&
    needs.test.result == 'success' &&
    (needs.semgrep.result == 'success' || needs.semgrep.result == 'skipped') &&
    needs.docker.result == 'success' &&
    needs.scan-image.result == 'success' &&
    needs.smoke-release.result == 'success'
  ...
  steps:
    - name: Deploy to PROD
      env:
        DEPLOY_REPO: ${{ secrets.DEPLOY_REPO }}
        DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
        IMAGE_REPO: ${{ needs.docker.outputs.image-name }}
        DEPLOY_IMAGE_TAG: ${{ needs.docker.outputs.image-tag }}
      run: |
        chmod +x ./.github/scripts/deploy.sh
        ./.github/scripts/deploy.sh "PROD" "<ansible-tag-backend>"
```

Le tag Ansible cote backend n'est pas `"website"` comme sur le frontend —
mettre la bonne valeur (probablement `"backend"` ou `"api"`).

### 7. `.github/workflows/cicd.yml` — Eventuel `deploy-preprod` du tag

Sur le frontend on n'a **pas** ajoute de redeploiement PREPROD sur le tag.
Si cote backend il y a un risque specifique (migration DB destructive,
changement de schema), envisager d'ajouter un step de migration dry-run
dans `smoke-release` plutot qu'un re-deploy preprod complet.

---

## Verifications a faire avant merge

1. **Endpoint health** : confirmer qu'il existe et qu'il repond 200 sans
   dependance externe au boot. Si non, en ajouter un dedie.
2. **Port expose** : verifier le `EXPOSE` du Dockerfile backend et adapter
   le port externe dans le smoke.
3. **Variables d'env minimales** : lister celles requises pour que
   l'image demarre meme sans DB reelle (souvent : `NODE_ENV`, des cles JWT
   bidon, parfois un `DATABASE_URL` factice si Prisma/TypeORM crash sans).
4. **Validation de la chaine** :
   - Pousser un commit sur `develop` -> verifier que `:PREPROD` est pousse
     et que PREPROD est deploye.
   - Merger `develop` -> `main` -> verifier qu'aucun deploiement ne se
     declenche, juste `release` qui cree le tag.
   - Verifier que le tag re-trigger le workflow, que `smoke-release`
     passe, et que `deploy-prod` deploie le SHA exact.
5. **GitHub Environments** : ajouter (cote UI GitHub) un required reviewer
   sur l'environnement `production` pour un human-gate avant deploy-prod.
   Cout zero, traceabilite native.
6. **Cleanup GHCR** : si le backend a un `ghcr-cleanup.yml` similaire,
   verifier que l'`ignore-versions` couvre bien `^(RELEASE|PREPROD)$`.

---

## Tests locaux du script

Apres modification de `determine-tags.sh`, tester en simulant les contextes
GitHub Actions :

```bash
# Mock PROJECT_VERSION pour eviter la dep yq
export PROJECT_VERSION=1.0.0

GITHUB_EVENT_NAME=push GITHUB_REF=refs/heads/develop GITHUB_SHA=abc123... ./.github/scripts/determine-tags.sh
# Attendu : workflow-tag = ...:PREPROD

GITHUB_EVENT_NAME=push GITHUB_REF=refs/heads/main GITHUB_SHA=abc123... ./.github/scripts/determine-tags.sh
# Attendu : workflow-tag vide

GITHUB_EVENT_NAME=push GITHUB_REF=refs/tags/v1.2.3 GITHUB_SHA=abc123... ./.github/scripts/determine-tags.sh
# Attendu : workflow-tag = ...:RELEASE
```

---

## Hors scope (a discuter separement)

- Etendre `sonarqube`, `mutation-test`, `lighthouse` au push `develop` :
  decision de portee plus large, garder pour une iteration ulterieure.
- Coupler le deploiement backend et frontend sur le meme tag : pour
  l'instant chaque side gere son propre `vX.Y.Z`.
- Migrer vers un workflow_call partage entre frontend et backend pour
  factoriser : refactor non trivial, hors scope.

---

## Branche et PR

Travailler sur une branche dediee (e.g. `chore/gitflow-rework-preprod`).
Ouvrir la PR vers `develop`. Lors du merge sur `develop`, ne PAS mettre
`[DEPLOY]` dans le titre (le push develop deploiera tout seul une fois la
refonte mergee).
