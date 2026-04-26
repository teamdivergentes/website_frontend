# CI Optimization — Frontend

## Contexte

2 runners self-hosted en mode ephemeral (reinit complete entre chaque job, ~30s overhead/job).
Le pipeline frontend contient 14 jobs. Sans optimisation, chaque PR Dependabot github_actions
declenchait l'integralite de la pipeline (build + lint + test + sonarqube + pr-report +
workflow-status), soit ~6 jobs en queue pour un simple bump de version d'une action GitHub.

## Optimisations implementees

### Cible 1 — paths-ignore etendu

Fichiers et repertoires qui ne declenchent plus la CI sur pull_request :

- `**.md` (deja present)
- `docs/**` (deja present)
- `.gitignore`, `LICENSE` (deja presents)
- `.github/dependabot.yml` (nouveau)
- `BACKLOG/**` (nouveau)

### Cible 2 — Classification actor-aware dans le job build

Le job `build` calcule deux outputs booleens :

| Output | Valeur true si | Jobs skippés |
|--------|---------------|--------------|
| `is-dependabot-actions` | Branche `dependabot/github_actions/*` | lint, test, sonarqube, e2e, mutation-test, lighthouse, docker, scan-image, deploy-*, release |
| `is-dependabot-dev` | Branche `dependabot/npm_and_yarn/*` ET package dans `devDependencies` | e2e, mutation-test, lighthouse, docker, scan-image, deploy-*, release |

La classification se fait via `node -e` sur `package.json` pour eviter un appel API externe.

Matrice resultante :

| Type de PR | Jobs actifs | Jobs skippés |
|---|---|---|
| github_actions bump | build (echo only) + pr-report + workflow-status | tout le reste (12 jobs) |
| npm devDep bump | build + lint + test + sonarqube + pr-report + workflow-status | e2e, mutation-test, lighthouse, docker, scan-image, deploy-*, release (8 jobs) |
| npm prodDep ou major | Tout (pipeline complete) | aucun |
| PR humaine | Tout (pipeline complete) | aucun |
| push main / tag vX.Y.Z | Tout | aucun |

### Cible 3 — concurrency (deja en place)

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

Chaque nouveau push sur la meme branche annule le run precedent. Evite l'accumulation
de 3 runs sequentiels sur 2 runners lors de pushes rapides.

### Cible 4 — Cache npm (deja en place)

Chaque job utilise `actions/cache` avec la cle :

```
${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
```

Les `node_modules` sont restaures depuis le cache sans `npm ci` si le hash de
`package-lock.json` n'a pas change. Sur les runners ephemeral, le cache est stocke
cote GitHub (object store), donc un job qui restore le cache evite ~60-90s d'installation.

## Reduction de charge estimee

| Scenario | Avant | Apres | Reduction |
|---|---|---|---|
| PR Dependabot github_actions | 6 jobs actifs | 2 jobs (build echo + pr-report) | -67% |
| PR Dependabot npm devDep | 11 jobs actifs | 5 jobs | -55% |
| PR Dependabot npm prodDep | 11 jobs actifs | 11 jobs (inchange) | 0% |
| PR humaine | 14 jobs | 14 jobs (inchange) | 0% |
| 14 PRs dependabot github_actions | ~84 jobs | ~28 jobs | -67% |

## Risques identifies et mitigations

| Risque | Mitigation |
|---|---|
| Classification devDep incorrecte (faux positif : prod traite en dev) | Le fallback est "full pipeline" (exit code 1 du node -e -> IS_DEP_DEV reste false) |
| Nouveau package dont le nom de branche ne matche pas le devDep key | Meme fallback : pipeline complete. Acceptable car la classification est conservative |
| `sonarqube` skippe sur github_actions bump -> coverage manquante | Sonar tourne a chaque PR humaine et push main. Les actions bumps n'impactent pas le code Angular |
| Dependabot bump `@angular/core` (prodDep) sans tests suffisants | Pipeline complete : lint + test + sonarqube + docker + scan-image |
| Lighthouse skippe sur devDep bump | Pertinent : un devDep n'impacte pas les metriques Lighthouse |

## Comment ajouter un nouveau job

Checklist :

1. Determiner la categorie : gating (bloquant) / informatif (non-bloquant) / conditionnel
2. Ajouter le job avec `needs: [build]` minimum
3. Ajouter les conditions actor-aware si le job est couteux (>2 min) :
   ```yaml
   if: |
     needs.build.outputs.is-dependabot-actions != 'true' &&
     needs.build.outputs.is-dependabot-dev != 'true' &&
     ...
   ```
4. Ajouter le job dans `needs` du job `workflow-status`
5. Ajouter la variable env et le check dans le script `workflow-status`
6. Si bloquant : ajouter `exit 1` si `failure` ou `cancelled`
7. Si non-bloquant : `echo "Warning: ..."` seulement

## Deboguer un job qui ne se declenche pas

1. Verifier le `github.event_name` : `pull_request`, `push`, `pull_request_review`, `issue_comment`, `workflow_dispatch`
2. Verifier les outputs du job `build` dans l'onglet Summary du run :
   - `is-dependabot-actions` = true ou false
   - `is-dependabot-dev` = true ou false
3. Verifier que le nom de branche Dependabot correspond au pattern (`dependabot/github_actions/*` ou `dependabot/npm_and_yarn/*`)
4. Pour forcer le declenchement d'un job conditionnel : utiliser `workflow_dispatch` depuis l'onglet Actions
5. Pour les jobs sur commentaire (`/run-e2e`, `/run-lighthouse`, `/run-mutation`) : le commentaire doit etre exact (case-sensitive)
6. Le job `sonarqube` a une dependance sur `test` (pas `build`) — verifier que `test` est passe avant de debugger sonarqube
