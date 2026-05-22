# [1.4.0](https://github.com/teamdivergentes/website_frontend/compare/v1.3.6...v1.4.0) (2026-05-22)


### Bug Fixes

* **a11y:** add aria-labelledby on coach-detail section + aria-hidden on team-member-row handle (BETA-A11Y-004/005) ([a5193aa](https://github.com/teamdivergentes/website_frontend/commit/a5193aab4629b4a2ecee47724e2ef8356ac83fed))
* **a11y:** admin-sidebar nav-item aria-label and dynamic toggle label (BETA-A11Y-001/002) ([8f00f4f](https://github.com/teamdivergentes/website_frontend/commit/8f00f4fba62137517c13a4a943750d5ae80ce2ab))
* **a11y:** ensure h1 is always present on coach-detail page (BETA-A11Y-003) ([11e9ddd](https://github.com/teamdivergentes/website_frontend/commit/11e9ddd2f7b5e59238cdc3f82b23cc02c889b165))
* **a11y:** prevent reorder DoS via reordering guard signal (SEC-PR206-001) ([bbd0740](https://github.com/teamdivergentes/website_frontend/commit/bbd07401a702e5539fcbfb376c7001afa8a24072))
* **a11y:** remove role=presentation on mobile menu list item (Sonar Web:S6819) ([de1840d](https://github.com/teamdivergentes/website_frontend/commit/de1840d2c834b6ed14003ca065e0fade80f49890))
* **a11y:** replace role="none" with role="presentation" in header (Sonar Web:S6821) ([0ec3c4c](https://github.com/teamdivergentes/website_frontend/commit/0ec3c4cc20ac03ec278de01e19f415343c9dccdb))
* **a11y:** replace role=status with <output> element on aria-live regions (Sonar Web:S6819) ([cbd5dbb](https://github.com/teamdivergentes/website_frontend/commit/cbd5dbb043e85c44cd865d027df9e51904f3515e))
* **a11y:** replace role=status with aria-busy on loading section in coach-detail (Sonar Web:S6819) ([07bffce](https://github.com/teamdivergentes/website_frontend/commit/07bffce0af5cd0f530c5976b6c01ffd0ca73dbbd))
* **a11y:** set descriptive alt on article images (EPIC-23) ([d93ee9f](https://github.com/teamdivergentes/website_frontend/commit/d93ee9ffb273aca1dedca50e888ffb85e0b79a87))
* **a11y:** UI/UX review findings (handles, aria-label, optimistic announce, twitch col width, FR message) ([6735705](https://github.com/teamdivergentes/website_frontend/commit/67357054244a6ea888bac6528ce759a565ad8dd5))
* **admin/analytics:** default range, empty placeholder, consent banner ([#132](https://github.com/teamdivergentes/website_frontend/issues/132)) ([cc9dbe5](https://github.com/teamdivergentes/website_frontend/commit/cc9dbe55ba6ed723184c5dc15b431d7dd16d978d)), closes [#100](https://github.com/teamdivergentes/website_frontend/issues/100)
* **admin:** replace setTimeout with afterNextRender in coaching-staff-dialog effect (BETA-ARCH-003) ([82e4e8d](https://github.com/teamdivergentes/website_frontend/commit/82e4e8d473c03126328b212ade0baa6f44f5ee06))
* **app+e2e:** rendre le startup resilient si /api/config repond pas ([bc77fb2](https://github.com/teamdivergentes/website_frontend/commit/bc77fb2c68732a58284d84d1207eb3d56fa67b16))
* **auth:** ajouter noAuthGuard sur /auth/login pour rediriger si déjà authentifié ([dd555c1](https://github.com/teamdivergentes/website_frontend/commit/dd555c1c3a57dfce051235b71aae402c2f19c957))
* **ci:** add !cancelled() to override implicit success() in needs ([#125](https://github.com/teamdivergentes/website_frontend/issues/125)) ([1f5581a](https://github.com/teamdivergentes/website_frontend/commit/1f5581a3eccfb7cd885ec9acb1ebc2e5c4e9620c))
* **ci:** classify Dependabot PRs by branch prefix only, not github.actor ([#131](https://github.com/teamdivergentes/website_frontend/issues/131)) ([78d0245](https://github.com/teamdivergentes/website_frontend/commit/78d02455be4cde2d7fa7057349f0bc7c455088c7)), closes [107/#108](https://github.com/teamdivergentes/website_frontend/issues/108)
* **ci:** copy .npmrc in Dockerfile + skip flaky a11y e2e tests ([c4bb633](https://github.com/teamdivergentes/website_frontend/commit/c4bb6338d14b42259a2528edc0af07711b9ea4fd))
* **ci:** correct SHA for actions/delete-package-versions v5.0.0 ([df2d0da](https://github.com/teamdivergentes/website_frontend/commit/df2d0da5cf0f1f766a5ec13231afe04bfb0f9c24))
* **ci:** semgrep checkout v4 + e2e/lighthouse ng serve resilient ([1b1bc7d](https://github.com/teamdivergentes/website_frontend/commit/1b1bc7de893c981b951b253e977a251a964fa50d))
* **ci:** tolerate skipped semgrep/sonarqube on downstream jobs ([#124](https://github.com/teamdivergentes/website_frontend/issues/124)) ([8e88ca8](https://github.com/teamdivergentes/website_frontend/commit/8e88ca8be470689040085c47188130b50cd2308f))
* **coaching-staff:** sync paths PATCH/DELETE avec teamId (anti-IDOR backend) ([#174](https://github.com/teamdivergentes/website_frontend/issues/174)) ([c66a004](https://github.com/teamdivergentes/website_frontend/commit/c66a0049dfb12c001b23a8eb47915fb1c41a7b81)), closes [#121](https://github.com/teamdivergentes/website_frontend/issues/121) [#121](https://github.com/teamdivergentes/website_frontend/issues/121)
* **coach:** use takeUntilDestroyed in loadCoach (BETA-ARCH-001) ([4038a49](https://github.com/teamdivergentes/website_frontend/commit/4038a4990b8118fd27f1be5e86f6c40fe389fead))
* **deps:** add .npmrc legacy-peer-deps and regenerate lockfile ([2e54478](https://github.com/teamdivergentes/website_frontend/commit/2e54478455abb7f2cb400b2066508c406e5bec3e))
* **epic-17:** corriger LiveStatusService + lien Twitch dashboard ([cba1c0a](https://github.com/teamdivergentes/website_frontend/commit/cba1c0a3060c9ec8658bfbf79dfb30005a0b1c80))
* **header:** déplacer le bouton EN LIVE hors de navbar-icons ([aad7039](https://github.com/teamdivergentes/website_frontend/commit/aad70399e396622de891bbd9fcfb5ff678340971))
* **layouts:** align footer page visibility with header config ([#99](https://github.com/teamdivergentes/website_frontend/issues/99)) ([35f5634](https://github.com/teamdivergentes/website_frontend/commit/35f5634c60c7b1fe9e1b3156ddb76dbba05ba6eb)), closes [#103](https://github.com/teamdivergentes/website_frontend/issues/103)
* **lint:** include root .cjs files in CommonJS ESLint config ([7a1c2d1](https://github.com/teamdivergentes/website_frontend/commit/7a1c2d14d3a86e3feef6f992d86aefd9ba6b9ca1))
* **live-status:** aligner BackendLiveDto sur le contrat API ([4dcd46a](https://github.com/teamdivergentes/website_frontend/commit/4dcd46accbc2c75a21d122bdc2f5d49d2caa3e46))
* **nginx:** EPIC-17 CSP — ajouter connect-src Twitch (api, pubsub, chat WSS) ([e3b2110](https://github.com/teamdivergentes/website_frontend/commit/e3b2110ff06cf2b37600e31ae2c1bede09d58cd2))
* **nginx:** repeter headers securite sur /admin et /auth (SEC-001) ([#172](https://github.com/teamdivergentes/website_frontend/issues/172)) ([8233b62](https://github.com/teamdivergentes/website_frontend/commit/8233b62bcad0e4a4485e43e31c324f25e7a757c7))
* **nginx:** supprimer la redirect 301 sur /twitch ([24a42ca](https://github.com/teamdivergentes/website_frontend/commit/24a42ca78856202c8a73aa2c2d63b1f412086e27))
* **security:** revert trivy-action a v0.35.0 verified safe (advisory GHSA-69fq-xp46-6x23) ([#164](https://github.com/teamdivergentes/website_frontend/issues/164)) ([7967ed0](https://github.com/teamdivergentes/website_frontend/commit/7967ed07dea3b18f4900f3f1bd35ef964b1308fb)), closes [#107](https://github.com/teamdivergentes/website_frontend/issues/107)
* **seo:** canonical player-detail + OG asset par defaut (audit 2026-05-07) ([#171](https://github.com/teamdivergentes/website_frontend/issues/171)) ([602e4af](https://github.com/teamdivergentes/website_frontend/commit/602e4afba0dde276d2d45b11940c85e8d41dc8c6))
* **seo:** hardcode OG image fallback in nginx entrypoint ([ae7469b](https://github.com/teamdivergentes/website_frontend/commit/ae7469b7850e03762c7c5a93f190037a9f644634))
* **seo:** noindex job application form (EPIC-23) ([0598bd5](https://github.com/teamdivergentes/website_frontend/commit/0598bd594ecdab0751e2c311ff48744ca535e654))
* **sonar:** clear last 2 QG violations (S7741 typeof + S7781 replaceAll) ([e43c4d2](https://github.com/teamdivergentes/website_frontend/commit/e43c4d20fa2752951f963ce8f07b9512cbf26251))
* **sonar:** clear last role=status on coaching-staff loading skeleton (Web:S6819) ([cf8b766](https://github.com/teamdivergentes/website_frontend/commit/cf8b766d1ce0eb6a3ec421ad25bab1603446d3d0))
* **sonar:** corriger les 5 violations QG sur la PR EPIC-17 F1+F2 ([bcde3ce](https://github.com/teamdivergentes/website_frontend/commit/bcde3ce76224069115d5605e6aea1eebfc703174))
* **sonar:** drop redundant role=presentation on <li> in mobile menu (S6819) ([2215890](https://github.com/teamdivergentes/website_frontend/commit/22158905e189f563afc466556e0ed52aa11e7dfe))
* **team-detail:** align coach cards style with player cards ([#185](https://github.com/teamdivergentes/website_frontend/issues/185)) ([a1ddf5f](https://github.com/teamdivergentes/website_frontend/commit/a1ddf5fb83e62ee289b84ef621ec4b6f53d9d65a))


### Features

* **a11y:** add keyboard controls + aria-live to pilot drag-drop components ([ad829fa](https://github.com/teamdivergentes/website_frontend/commit/ad829fadeceee09bc04cbd95d3a5c66cb51dff8b))
* **a11y:** add visually-hidden SCSS class and a11y-announce helpers ([ae7f69d](https://github.com/teamdivergentes/website_frontend/commit/ae7f69d7ec08ccd641e26faf3f310e6df219d19e))
* **a11y:** propagate keyboard controls + aria-live to 5 remaining drag-drop components ([6946330](https://github.com/teamdivergentes/website_frontend/commit/6946330daed60261a2967d5394bbd3d4ae6a596c))
* **admin:** add nationality, birthDate and customFields to coaching staff dialog (parity with players) ([e7e3b90](https://github.com/teamdivergentes/website_frontend/commit/e7e3b9075c1350610340c72cdf56317b3f70b3fb))
* **admin:** central registry of admin shortcuts with required permissions ([2399b91](https://github.com/teamdivergentes/website_frontend/commit/2399b91b76541a2d6f3768d7e6dcbc7f33ca68fc))
* **admin:** coaching staff CRUD (EPIC-17) ([#169](https://github.com/teamdivergentes/website_frontend/issues/169)) ([14fe6a0](https://github.com/teamdivergentes/website_frontend/commit/14fe6a0c4c01a1bb65d56a517ef3e20c33a9a44c))
* **admin:** expose AdminShortcutsService with availableShortcuts() and canShortcut() helpers ([5eec12f](https://github.com/teamdivergentes/website_frontend/commit/5eec12f577b09db94b927aa4c74e30b87f0347fd))
* **articles:** compute enriched alt text with title and section ([bc4c0ca](https://github.com/teamdivergentes/website_frontend/commit/bc4c0ca85c7d0f14d8365bc01f59c9613c0d21df))
* **articles:** render hero image with <picture> srcset for mobile/tablet ([1be2f69](https://github.com/teamdivergentes/website_frontend/commit/1be2f691484d4a4e2dd52a34a16f8bd3710a17a6))
* **articles:** set loading=eager and fetchpriority=high on hero image for LCP ([fdcf65f](https://github.com/teamdivergentes/website_frontend/commit/fdcf65f9e7c6b3be9971f315d599e66ababb65fc))
* **auth:** HttpOnly cookies + 7d session + rehydration fix ([#134](https://github.com/teamdivergentes/website_frontend/issues/134)) ([2eee3ab](https://github.com/teamdivergentes/website_frontend/commit/2eee3ab34c1b8766d5cfa3d5aed257f6fdc4a306)), closes [#101](https://github.com/teamdivergentes/website_frontend/issues/101) [#101](https://github.com/teamdivergentes/website_frontend/issues/101)
* **ci:** EPIC-20 [#3](https://github.com/teamdivergentes/website_frontend/issues/3) — harmonize PR comment + add docs ([59705ea](https://github.com/teamdivergentes/website_frontend/commit/59705ea0675ed8295e71f37028dbec96e826bd93)), closes [#2](https://github.com/teamdivergentes/website_frontend/issues/2)
* **ci:** EPIC-20 frontend PR comment sync ([#126](https://github.com/teamdivergentes/website_frontend/issues/126)) ([ba78924](https://github.com/teamdivergentes/website_frontend/commit/ba7892415ff73de261397e3293a10dd3559c8b1e))
* **coach:** add Coach model fields and CoachingStaffService.findBySlug ([de77fcf](https://github.com/teamdivergentes/website_frontend/commit/de77fcff2b12d5f9373d5f59332450987deb84a2))
* **coach:** add CoachDetailComponent standalone with skeleton, social and bio blocks ([43da375](https://github.com/teamdivergentes/website_frontend/commit/43da375f97e7ce5158e3e0093984af56b26d1a17))
* **coach:** register /structure/equipes/:teamId/coach/:slug route ([a7a1b1d](https://github.com/teamdivergentes/website_frontend/commit/a7a1b1dd899d0083bcd82b864022c61c266b38fe))
* **EPIC-17/F3:** admin Twitch channels CRUD page + dialog ([b245954](https://github.com/teamdivergentes/website_frontend/commit/b245954a5034590915edb71f14afa019108d47a5))
* **epic-18:** Matomo tracker integration with CNIL-exempted mode ([#186](https://github.com/teamdivergentes/website_frontend/issues/186)) ([c9d6276](https://github.com/teamdivergentes/website_frontend/commit/c9d6276251bd64ff2757506f3b1df54334519a0c)), closes [Array#push](https://github.com/Array/issues/push)
* **EPIC-19:** code quality frontend — couverture tests + violations SonarQube ([637f4f0](https://github.com/teamdivergentes/website_frontend/commit/637f4f0f82a86ff8f9886658aa8e533f1a4be5c9)), closes [#231210](https://github.com/teamdivergentes/website_frontend/issues/231210) [#0C0D0C](https://github.com/teamdivergentes/website_frontend/issues/0C0D0C) [161716/#919191](https://github.com/teamdivergentes/website_frontend/issues/919191)
* **equipes:** make coaching staff cards clickable to coach detail page ([5cd7e8c](https://github.com/teamdivergentes/website_frontend/commit/5cd7e8c2a40c3107404181985377717f8f57785f))
* **header+config:** EPIC-17 — suppression pipe EN LIVE + toggle visibilité Twitch ([6dce2ad](https://github.com/teamdivergentes/website_frontend/commit/6dce2ade4e80e475a437e906363446fd5cc53fc8))
* **header:** bouton Administration pour admins authentifies (EPIC-21) ([#170](https://github.com/teamdivergentes/website_frontend/issues/170)) ([7c80695](https://github.com/teamdivergentes/website_frontend/commit/7c8069566996232c0867621f227a84991caca5d5)), closes [#32D299](https://github.com/teamdivergentes/website_frontend/issues/32D299) [#adminShield](https://github.com/teamdivergentes/website_frontend/issues/adminShield)
* **header:** EPIC-17 F2 — item EN LIVE + LED pulsante (desktop + mobile) ([5d83095](https://github.com/teamdivergentes/website_frontend/commit/5d83095fc3a3a76219ceacb71766106a055c67bb))
* **runtime-config:** expose siteUrl getter with env-aware fallback ([c523820](https://github.com/teamdivergentes/website_frontend/commit/c523820af9aef9a3e744947cd67c244e7f791c39))
* **seo:** add BreadcrumbList helper and integrations on equipes pages (EPIC-23) ([1f0c19b](https://github.com/teamdivergentes/website_frontend/commit/1f0c19b83da9037a308f2871395e0398777546a0))
* **seo:** add BreadcrumbList integrations on recrutement pages (EPIC-23) ([771266d](https://github.com/teamdivergentes/website_frontend/commit/771266d9334b871c9e3fd4257a75ddd4b8a01223))
* **seo:** add BreadcrumbList integrations on structure and sponsors pages (EPIC-23) ([bc2d835](https://github.com/teamdivergentes/website_frontend/commit/bc2d8355472dae64fa7588a3958f23c03578f573))
* **seo:** add JobPosting JSON-LD helper and integration on job-detail (EPIC-23) ([e930a3d](https://github.com/teamdivergentes/website_frontend/commit/e930a3dce7f08649b8ed437c0816c40d2c91f4ec))
* **seo:** add og:image:width/height/alt tags (EPIC-23) ([274ab03](https://github.com/teamdivergentes/website_frontend/commit/274ab03efb5a3bf09fe5a67862b206ce0cdaad1b))
* **seo:** add Person JSON-LD helper and integration on player-detail (EPIC-23) ([0c271e9](https://github.com/teamdivergentes/website_frontend/commit/0c271e929a3dc34be68d976357aa6f072579391e))
* **seo:** centralize Article JSON-LD builder with mainEntityOfPage/ImageObject/wordCount/inLanguage ([345889f](https://github.com/teamdivergentes/website_frontend/commit/345889fa2253c779911319463d2225051d07eb2c))
* **seo:** emit og:article:published_time and modified_time (EPIC-23) ([0d474ef](https://github.com/teamdivergentes/website_frontend/commit/0d474efb60ddbae7a1574d06097a05057544a15c))
* **seo:** enrich Organization schema with SportsOrganization (EPIC-23) ([110891a](https://github.com/teamdivergentes/website_frontend/commit/110891a7880feb482073e38b5bb96641fa51ea06))
* **seo:** resolve siteUrl from RuntimeConfigService instead of hardcoded constant ([2493b3d](https://github.com/teamdivergentes/website_frontend/commit/2493b3d3b2408cfd8e0060e6d9ca6ebd3fb0d423))
* **seo:** wire article-detail to buildArticleJsonLd and emit article:author/section/tag ([dd12174](https://github.com/teamdivergentes/website_frontend/commit/dd1217448e07a0250f09a7178193d81e08c798e2))
* **team-detail:** restructure team page + coaching staff section ([#133](https://github.com/teamdivergentes/website_frontend/issues/133)) ([2d87e2a](https://github.com/teamdivergentes/website_frontend/commit/2d87e2a7aabdc90c8520dcd7fe2d9d73e3e3d0ed)), closes [#104](https://github.com/teamdivergentes/website_frontend/issues/104) [#60](https://github.com/teamdivergentes/website_frontend/issues/60) [#60](https://github.com/teamdivergentes/website_frontend/issues/60)
* **twitch:** activate /twitch route + page skeleton + config (#EPIC-17 F1.1) ([#103](https://github.com/teamdivergentes/website_frontend/issues/103)) ([24b4410](https://github.com/teamdivergentes/website_frontend/commit/24b4410bb1efcfbcaaf50a5a6a867976216785bf)), closes [#EPIC-17](https://github.com/teamdivergentes/website_frontend/issues/EPIC-17)
* **twitch:** EPIC-17 F1 — page /twitch 3 états (1 live / N live / hors ligne) ([694be6d](https://github.com/teamdivergentes/website_frontend/commit/694be6dd8cf6478b7f7afa4b4f8b41b142ee2271)), closes [#ff3030](https://github.com/teamdivergentes/website_frontend/issues/ff3030)
* **twitch:** EPIC-17 F1+F2 — page En Live + LED header ([c8aa60e](https://github.com/teamdivergentes/website_frontend/commit/c8aa60e279be7e13a5055a6ed84995d71e490621))
* **twitch:** EPIC-17 F2 — LiveStatusService singleton + polling 60s ([c7f980b](https://github.com/teamdivergentes/website_frontend/commit/c7f980b23dc9ea54a0865c17da36c50c6307c8f6))


### Performance Improvements

* **ci:** skip semgrep + docker on PR pushes to save CI minutes ([91a1d4e](https://github.com/teamdivergentes/website_frontend/commit/91a1d4e3288362bc228ba7f2ad83aaede4b37ab2))
* **seo:** add aspect-ratio and explicit dimensions to team member photos (EPIC-23) ([4432fc4](https://github.com/teamdivergentes/website_frontend/commit/4432fc4388c0339b6c4d8f99f9aadd46c5b05c19))
* **seo:** add aspect-ratio to sponsor logos with object-fit contain (EPIC-23) ([edc228c](https://github.com/teamdivergentes/website_frontend/commit/edc228c34ac0c951d374d5ab0a82aa05b19cfd37))
* **seo:** add explicit dimensions to player photo to fix CLS (EPIC-23) ([ac2259a](https://github.com/teamdivergentes/website_frontend/commit/ac2259a854ebcefd31e10ec140c71b366f5d7be3))

## [1.3.6](https://github.com/teamdivergentes/website_frontend/compare/v1.3.5...v1.3.6) (2026-05-11)


### Bug Fixes

* **ci:** protect RELEASE and PREPROD tags from GHCR cleanup ([#121](https://github.com/teamdivergentes/website_frontend/issues/121)) ([f877f62](https://github.com/teamdivergentes/website_frontend/commit/f877f628bd310bdbcbecfa21d0f48555b096bfd8))
* **ci:** tolerate empty workflow-tag and tag-suffix in update-dockerfile-labels.sh ([#188](https://github.com/teamdivergentes/website_frontend/issues/188)) ([95070a1](https://github.com/teamdivergentes/website_frontend/commit/95070a153becacf4041f712788c9811e8cf9d429))
* **matomo:** stub script load in spec + normalize tracker URL ([#187](https://github.com/teamdivergentes/website_frontend/issues/187)) ([06a8c3c](https://github.com/teamdivergentes/website_frontend/commit/06a8c3c74c3ba3354a50a02722180f27c58d3cd6))

## [1.3.5](https://github.com/teamdivergentes/website_frontend/compare/v1.3.4...v1.3.5) (2026-04-12)


### Bug Fixes

* **seo:** éradiquer les soft 404 et aligner sitemap/routes ([7e0e319](https://github.com/teamdivergentes/website_frontend/commit/7e0e31952d8c5e61da3654fc00bfbf499b4a865b))

## [1.3.4](https://github.com/teamdivergentes/website_frontend/compare/v1.3.3...v1.3.4) (2026-04-06)


### Bug Fixes

* **css:** harden Material Icons font-family and fix icon clipping ([adc382a](https://github.com/teamdivergentes/website_frontend/commit/adc382a6fd3d66a624a63a9947a19bbea2e7fcd6))
* **nginx:** use CSP variables to emit single-line header ([ab657be](https://github.com/teamdivergentes/website_frontend/commit/ab657becbca2be69af03ae4873bff0df84971286))

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
