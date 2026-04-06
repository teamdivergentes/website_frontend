## [1.3.3](https://github.com/teamdivergentes/website_frontend/compare/v1.3.2...v1.3.3) (2026-04-06)


### Bug Fixes

* **404:** use data URI instead of blob URL for SVG canvas rendering ([7776fb8](https://github.com/teamdivergentes/website_frontend/commit/7776fb8e6395a4f0b9956d2e6aba60ebf8f846f3))

## [1.3.2](https://github.com/teamdivergentes/website_frontend/compare/v1.3.1...v1.3.2) (2026-04-06)


### Bug Fixes

* **ui:** correct footer social icons and legal links spacing ([d607a49](https://github.com/teamdivergentes/website_frontend/commit/d607a492b9a6f76246608717a2d25860c8231808))

## [1.3.1](https://github.com/teamdivergentes/website_frontend/compare/v1.3.0...v1.3.1) (2026-04-06)


### Bug Fixes

* **ci:** use PAT for semantic-release tag push ([7ee5f27](https://github.com/teamdivergentes/website_frontend/commit/7ee5f270abdc9e6b5d699761be758153651b6d7b))

# [1.3.0](https://github.com/teamdivergentes/website_frontend/compare/v1.2.0...v1.3.0) (2026-04-05)


### Bug Fixes

* **a11y:** add aria-label and sr-only text on icon-link ([311d3c1](https://github.com/teamdivergentes/website_frontend/commit/311d3c163881286b32c64309b912f085e137abc9))
* **admin:** remove any types from link-tool-wrapper ([3e9245d](https://github.com/teamdivergentes/website_frontend/commit/3e9245dad28ff5adbcf507dbf597881b647f1495))
* articles players ([bd12102](https://github.com/teamdivergentes/website_frontend/commit/bd121020c4e5c039cd669e85d9879ae601d7cd7e))
* **ci:** corriger build Angular et path checkout E2E workflow ([5df13d4](https://github.com/teamdivergentes/website_frontend/commit/5df13d4452871c7d8e4e7f750fd56b5fbfaa7bb1))
* **ci:** ignore unfixed CVEs in Trivy scan-image ([61777de](https://github.com/teamdivergentes/website_frontend/commit/61777def9547ebe3d1a9b0786fb74c0a99d65cea))
* **ci:** make Trivy scan informational with table + SARIF output ([77eae09](https://github.com/teamdivergentes/website_frontend/commit/77eae0939a362f4e19bb84a31cce7e87fc853a65))
* **ci:** scoper le rollback par environnement et ajouter le suivi ([270f572](https://github.com/teamdivergentes/website_frontend/commit/270f5726a50e571d0a51d8d3335a035c963e9bb6))
* **ci:** securiser et durcir le pipeline CI/CD ([5bb4f6d](https://github.com/teamdivergentes/website_frontend/commit/5bb4f6d4155239562e337324a9284097164ad2eb))
* **ci:** toujours pousser l'image Docker vers GHCR pour permettre le scan Trivy ([b235591](https://github.com/teamdivergentes/website_frontend/commit/b2355919cb0e3c623ce954595b6277ed90fe12a4))
* **ci:** Trivy scan, cache node_modules, environments GitHub, CODEOWNERS ([3674c1b](https://github.com/teamdivergentes/website_frontend/commit/3674c1b54df38dff9455f4eb61da5aadbbf1aee7))
* correct 16 remaining unit test failures ([1f5eaa6](https://github.com/teamdivergentes/website_frontend/commit/1f5eaa6a272f94c481f6abb8fca20f18f98e5edb))
* correct 5 remaining unit test failures ([d6d47f6](https://github.com/teamdivergentes/website_frontend/commit/d6d47f60643cf5a37d44208aefcaa4f49720a744))
* correct CI test failures (zoneless + E2E) ([67b30fd](https://github.com/teamdivergentes/website_frontend/commit/67b30fda37c6b81dc8b60f4ad4f38b904cb3bfee))
* disable Docker cache-to on PR builds (docker driver limitation) ([5ad43d5](https://github.com/teamdivergentes/website_frontend/commit/5ad43d566d36a28dfee555fac41958b4296d2560))
* **docker:** apply Alpine security patches in production stage ([48534ca](https://github.com/teamdivergentes/website_frontend/commit/48534ca206246a097fedadb71d859ee83e48e2f2))
* invert cache-to condition (empty string is falsy in GHA expressions) ([960f25f](https://github.com/teamdivergentes/website_frontend/commit/960f25fcd6ad897c92a14d366ec9b57f26040588))


### Features

* Amélioration Devsecops ([#77](https://github.com/teamdivergentes/website_frontend/issues/77)) ([dd81232](https://github.com/teamdivergentes/website_frontend/commit/dd81232f3509e30434cefc5ff1ec7e906436671d))
* **ci:** add semantic-release for automated versioning ([f1a1c44](https://github.com/teamdivergentes/website_frontend/commit/f1a1c442c47afa71ef2c89c4d560501bb133b003))
* **ci:** ajouter le job test Karma dans le pipeline frontend ([1532fcf](https://github.com/teamdivergentes/website_frontend/commit/1532fcf6f3695dd90db3582a99a4f1d62a4314e1))
* **e2e:** mise en place Playwright avec smoke tests ([b712697](https://github.com/teamdivergentes/website_frontend/commit/b7126977de21f492ca83fa28bde79878a172e701))
* **epic-10:** articles module — layout éditorial, intégration Twitter, SEO, a11y ([8711961](https://github.com/teamdivergentes/website_frontend/commit/8711961f82e26cb9a522d998763b1ae278c6f1e5))
* **nginx:** add stub_status endpoint for prometheus monitoring ([fae7a87](https://github.com/teamdivergentes/website_frontend/commit/fae7a870a4f049bcc4915acc4125a87ca80dcc2f))


### Performance Improvements

* add OnPush change detection on all public components ([22dd8a1](https://github.com/teamdivergentes/website_frontend/commit/22dd8a1703a73d2b72c228e64366b2a33f5d8cc9))
* e2e-fullstack only on approval/main/command (not every PR push) ([33c6ae8](https://github.com/teamdivergentes/website_frontend/commit/33c6ae8978ae8e005bd93b701e39dbaf063defeb))
* optimize CI pipeline - conditional E2E, Lighthouse, path-ignore ([32819c3](https://github.com/teamdivergentes/website_frontend/commit/32819c3ffbb2253ae72a819730be06575c45537e))
