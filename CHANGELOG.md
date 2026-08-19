# [1.7.0](https://github.com/teamdivergentes/website_frontend/compare/v1.6.0...v1.7.0) (2026-08-19)


### Features

* **ui:** faire suivre au favicon le theme du navigateur ([#307](https://github.com/teamdivergentes/website_frontend/issues/307)) ([2187f27](https://github.com/teamdivergentes/website_frontend/commit/2187f279238dea150b70b5d330808e3a6418b50a))

# [1.6.0](https://github.com/teamdivergentes/website_frontend/compare/v1.5.0...v1.6.0) (2026-08-18)


### Bug Fixes

* **boutique:** résorber les anomalies Sonar introduites par la livraison du 18 août ([#304](https://github.com/teamdivergentes/website_frontend/issues/304)) ([1f3f8a1](https://github.com/teamdivergentes/website_frontend/commit/1f3f8a1139ec713b84dd66aed4b8bbb5da13fa1e))


### Features

* **boutique:** stock, remboursements, créateur du maillot et fiche produit ([#302](https://github.com/teamdivergentes/website_frontend/issues/302)) ([855ade3](https://github.com/teamdivergentes/website_frontend/commit/855ade380b1bc662b770a81b9b7647d0ca86628c))

# [1.5.0](https://github.com/teamdivergentes/website_frontend/compare/v1.4.3...v1.5.0) (2026-08-14)


### Bug Fixes

* **a11y:** elements natifs plutot que roles ARIA rapportes ([da4d2b3](https://github.com/teamdivergentes/website_frontend/commit/da4d2b366356436b0c0566cef909bdea1c647537))
* **a11y:** reduced motion guard and scss cleanup on palmares (EPIC-37 redesign review) ([ecde482](https://github.com/teamdivergentes/website_frontend/commit/ecde482982972852bc1eb00b42718721983e9793))
* **a11y:** remplacer role="img" par du texte pour lecteurs d'ecran ([2b88a50](https://github.com/teamdivergentes/website_frontend/commit/2b88a50c26d08ce156ba28d7d757bcc920b1fbf7))
* **a11y:** role="img" sur les pastilles avec aria-label restant ([272ac5e](https://github.com/teamdivergentes/website_frontend/commit/272ac5ef7ad179d5ff535389145a80bade5c13e0))
* **a11y:** semantic section for team trophies badges (VQO) ([308fad3](https://github.com/teamdivergentes/website_frontend/commit/308fad30b48351cd6de8ba30083908c4b35bc6cc))
* **admin:** activer le retrait du drawer mobile du parcours de tabulation ([6a211cd](https://github.com/teamdivergentes/website_frontend/commit/6a211cda34c452b69336cdca07b1bb3711669bfa))
* **admin:** aligner le titre de la section sur le libelle Statistiques ([b5f8a9d](https://github.com/teamdivergentes/website_frontend/commit/b5f8a9dc8296708e556aabfd8d41bee3d3c3d472))
* **admin:** confirmer les creations et modifications ([35b560f](https://github.com/teamdivergentes/website_frontend/commit/35b560f97ee0168941eb517bbb33026698ca5d22))
* **admin:** confirmer les suppressions aupres de l'utilisateur ([1960305](https://github.com/teamdivergentes/website_frontend/commit/19603055163d9dd4b2efd5241e791515629115fa))
* **admin:** corriger l'accessibilite de la sidebar ([7884d27](https://github.com/teamdivergentes/website_frontend/commit/7884d277099b287865e52e42c58b148afae0d3d9))
* **admin:** corriger les icones FontAwesome de la sidebar ([c303cd6](https://github.com/teamdivergentes/website_frontend/commit/c303cd674f4df643d39bbf9fd63ce04747bec41e))
* **admin:** couvrir les dialogues qui court-circuitent AdminDialogService ([e324a09](https://github.com/teamdivergentes/website_frontend/commit/e324a09c3c84d4497e0ca819268a7f6a269f8076))
* **admin:** distinguer erreurs de chargement et erreurs d'action ([507394a](https://github.com/teamdivergentes/website_frontend/commit/507394acce42fd47aac80bcd5ca532921fe680f5))
* **admin:** ecran boutique lisible et enregistrement explicite ([844e7e5](https://github.com/teamdivergentes/website_frontend/commit/844e7e5d10180648305ed1003a8dd025f2cbe756))
* **admin:** format francais du taux de marge et port offert ([6c84d04](https://github.com/teamdivergentes/website_frontend/commit/6c84d048eff2a15a2fa9c1a65678551b377f5594))
* **admin:** lever la collision de noms sur les animations de squelette ([912db13](https://github.com/teamdivergentes/website_frontend/commit/912db13230600fc6f45e247703008bf63920d867))
* **admin:** lever les 18 violations Sonar des pages migrees ([37d7818](https://github.com/teamdivergentes/website_frontend/commit/37d7818eea1fcc4a1cacf214ec142b3b202f907e))
* **admin:** ne plus deguiser une panne d'API en base vide ([ad4275f](https://github.com/teamdivergentes/website_frontend/commit/ad4275f446dd7cd5d7b4af85e95539ab6250015c))
* **admin:** ne plus echouer silencieusement dans les dialogues users ([891222e](https://github.com/teamdivergentes/website_frontend/commit/891222ef3b47be2e78b479042cd05fc34bdffe19))
* **admin:** paginer la liste des articles ([9786703](https://github.com/teamdivergentes/website_frontend/commit/9786703559800bb2a95fbd0408332189d719645d))
* **admin:** poser les gardes de validation manquantes ([7ac9c69](https://github.com/teamdivergentes/website_frontend/commit/7ac9c69bbb239035789eed88e1da64693fe03330))
* **admin:** remplacer les alert() et poser la garde de reorder manquante ([fdd64d1](https://github.com/teamdivergentes/website_frontend/commit/fdd64d13bfad7a7687b245bac0da7f632bf72450))
* **admin:** rendre visibles les pannes de chargement sur quatre pages ([a0cddc9](https://github.com/teamdivergentes/website_frontend/commit/a0cddc9ffa0169150fe1fe21893f00785baee382))
* **admin:** reparer la specificite des en-tetes de page ([637c6e1](https://github.com/teamdivergentes/website_frontend/commit/637c6e1c0b5d438cb65eaa9e9e0cff75326acdd3))
* **admin:** retirer le drapeau « port à perte » des commandes ([#290](https://github.com/teamdivergentes/website_frontend/issues/290)) ([6f0fe0d](https://github.com/teamdivergentes/website_frontend/commit/6f0fe0dbb6d089a59909e10e91b467e8e967e208))
* **boutique:** adapter le redesign aux evolutions de develop ([1ff6a69](https://github.com/teamdivergentes/website_frontend/commit/1ff6a69caa494792d5c1862caafe1c4f89c9b849))
* **boutique:** corriger les dernieres violations SonarQube ([929e65c](https://github.com/teamdivergentes/website_frontend/commit/929e65cb7b7c9f62017e79f24b85ba6ea4e5e867))
* **boutique:** corriger les issues SonarQube (a11y, contraste, font-family) ([668809c](https://github.com/teamdivergentes/website_frontend/commit/668809c209085a81f0bfea1c1ec55434839f4390))
* **boutique:** jouer la vidéo du hero à mi-volume ([#301](https://github.com/teamdivergentes/website_frontend/issues/301)) ([6649175](https://github.com/teamdivergentes/website_frontend/commit/6649175d6999e277c91138b27449137263421b13))
* **boutique:** masquer le bouton de son sur une video muette ([7cbf65b](https://github.com/teamdivergentes/website_frontend/commit/7cbf65b435a368cc77140dfadc9acd4faa56e8fa))
* **boutique:** ne plus conclure a l'absence de son sur Chrome ([cf166a2](https://github.com/teamdivergentes/website_frontend/commit/cf166a2cd8b45faaca316c7d63ba575b255d40d9))
* **boutique:** rail regulier quand la galerie compte plusieurs vues ([e72a2b8](https://github.com/teamdivergentes/website_frontend/commit/e72a2b890ca494791728392b3d024d572ff09c9d))
* **boutique:** rendre les actions produit accessibles au clavier et retirer le code mort ([8a925bf](https://github.com/teamdivergentes/website_frontend/commit/8a925bf5cd5dd0bc32dd78f8d70719c3b831fdde))
* **boutique:** tracer le chanfrein de la pastille panier ([539997d](https://github.com/teamdivergentes/website_frontend/commit/539997dac7c68a311a604ca7f812fd04f841cfcf))
* **boutique:** utiliser globalThis pour la redirection Stripe (S7764) ([bd9ab92](https://github.com/teamdivergentes/website_frontend/commit/bd9ab9234ba100c18a448b0bc17df4d20314ab55))
* **boutique:** versionner la video du hero et normaliser son niveau ([b3430df](https://github.com/teamdivergentes/website_frontend/commit/b3430dfb8ac64c837efdea2a3dc0f24274783c40))
* **boutique:** vider le panier apres un paiement accepte ([7d6a788](https://github.com/teamdivergentes/website_frontend/commit/7d6a788fefcf6a1f81d96595eddabd3513aa633b))
* **ci:** le cleanup GHCR supprimait l'image :RELEASE de production ([69764bb](https://github.com/teamdivergentes/website_frontend/commit/69764bbe3584d0f1dfcf7bd889f7f8f65dd4573f))
* **ci:** referencer les jobs a tiret en notation crochets ([#284](https://github.com/teamdivergentes/website_frontend/issues/284)) ([2fc0b76](https://github.com/teamdivergentes/website_frontend/commit/2fc0b76785cf2c55bc43af9205e1c794c0de5b95))
* **csp:** autoriser matomo.tellebma.fr en frame-src ([28e206f](https://github.com/teamdivergentes/website_frontend/commit/28e206f2893a972e86d22fd85b0393776c52b071))
* **epic-37:** corrections fonctionnelles audit (E2E, scores, erreurs, dettes) ([7e83dcf](https://github.com/teamdivergentes/website_frontend/commit/7e83dcfdaa3b54ad28ab7dc48e860ef926f58aaa))
* **footer:** rubrique Structure, police d'affichage et debordement ([#285](https://github.com/teamdivergentes/website_frontend/issues/285)) ([e56a86c](https://github.com/teamdivergentes/website_frontend/commit/e56a86c44501289c244795bf96ee5524bcf7b381))
* **frontend:** align Trophy model with public/admin API contract (VQO) ([1d41f67](https://github.com/teamdivergentes/website_frontend/commit/1d41f67ae187b3b5e74184f9929272daeda241be))
* **frontend:** allow clearing optional trophy fields in edit dialog (EPIC-37 review) ([77c4f1d](https://github.com/teamdivergentes/website_frontend/commit/77c4f1d0c9a6a064884012a3653c150c2a8088d9))
* **frontend:** clear opponent logo with explicit null (EPIC-37 review) ([178657e](https://github.com/teamdivergentes/website_frontend/commit/178657e1e77f91dd29795bae29c9c88f1bf8de1d))
* **frontend:** responsive trophy dialog width and array error test (EPIC-37 review) ([f0e3cde](https://github.com/teamdivergentes/website_frontend/commit/f0e3cde1f3eb03ccbbe4fa3d40e7ffb581d18ea7))
* **matches:** corriger la règle d'initiales et gérer les tirets ([1f10ca6](https://github.com/teamdivergentes/website_frontend/commit/1f10ca6b3ddba57deb7ca2a478174841b0ab52f3))
* **nginx:** add HSTS and Permissions-Policy headers to /uploads/ (INFRA-03) ([73eaa19](https://github.com/teamdivergentes/website_frontend/commit/73eaa191756bf013039d1d5d89b6f793ceaf085c))
* **nginx:** deny access to .map source files (SEC-010) ([daa1621](https://github.com/teamdivergentes/website_frontend/commit/daa1621a5a5fa14259e9a387cdfdb1a0c60bdce2))
* **nginx:** remove obsolete X-XSS-Protection header (SEC-011) ([d0660c7](https://github.com/teamdivergentes/website_frontend/commit/d0660c7ecf99c661527eeb30472cbaaa51608ffd))
* **security:** ajouter noopener aux liens partenaires ([abd9b95](https://github.com/teamdivergentes/website_frontend/commit/abd9b9594cf0b91724b32317fc83aec6eb865958))
* **seo:** emettre le canonique et le JSON-LD au rendu serveur ([9244b42](https://github.com/teamdivergentes/website_frontend/commit/9244b4290fa14c8b45ecde5a50191ea7fe21c1f2))
* **seo:** raccorder les URLs absolues avec un separateur ([8d25c50](https://github.com/teamdivergentes/website_frontend/commit/8d25c502eb139a3518ef3e344820c3ddc61a3da7))
* **shop:** saisie du quota d'un bon de reduction (EPIC-48) ([#297](https://github.com/teamdivergentes/website_frontend/issues/297)) ([f4428dc](https://github.com/teamdivergentes/website_frontend/commit/f4428dc9149812a9a21d25d1766f3063401ea2e9))
* **shop:** typer ce que ngModel remonte aux champs numeriques du code promo ([#300](https://github.com/teamdivergentes/website_frontend/issues/300)) ([717e44b](https://github.com/teamdivergentes/website_frontend/commit/717e44b47fa20d7cb64c10473fb1704168c6fb71))
* **sonar:** improve match badge contrast ([bc61977](https://github.com/teamdivergentes/website_frontend/commit/bc619771b46f819cf579b03fcc76de35b5877695))
* **sonar:** lever les violations et le point sensible du quality gate ([af7bdfb](https://github.com/teamdivergentes/website_frontend/commit/af7bdfbff8a9e962d256bed341ee9d1b2f6c0208))
* **sonar:** resolve frontend quality gate issues ([d756883](https://github.com/teamdivergentes/website_frontend/commit/d756883b93a4ab8659b4da844d03647a232ce6b3))
* **sonar:** resorber les deux dernieres violations en nouveau code ([f410900](https://github.com/teamdivergentes/website_frontend/commit/f4109005c39a2249595491e7960b9d55d03d4332))
* **sonar:** resoudre les treize violations du quality gate ([fea5c94](https://github.com/teamdivergentes/website_frontend/commit/fea5c94294562ef47983467cceb21c662fbb0a33))
* **sonar:** traiter la promesse de lecture sans l'operateur void ([de6e81a](https://github.com/teamdivergentes/website_frontend/commit/de6e81a9288dabf309deaca11a4ea8c803d9eabc))
* **ssr:** borner la duree des appels HTTP du rendu serveur ([#294](https://github.com/teamdivergentes/website_frontend/issues/294)) ([f54d11e](https://github.com/teamdivergentes/website_frontend/commit/f54d11e7a674ecb3b280361ecf274c34dbf19682))
* **ssr:** encadrer les acces navigateur du perimetre public ([d6fe72f](https://github.com/teamdivergentes/website_frontend/commit/d6fe72f6f7cdc876029ec5471f56fd2944f1a013))
* **ssr:** ne plus laisser un en-tete de Traefik desactiver le rendu serveur ([#295](https://github.com/teamdivergentes/website_frontend/issues/295)) ([fef20cc](https://github.com/teamdivergentes/website_frontend/commit/fef20ccdc530e12fcae10b0b61387e1c6684a12f))
* **style:** correction product component image cover ([#281](https://github.com/teamdivergentes/website_frontend/issues/281)) ([a3e5951](https://github.com/teamdivergentes/website_frontend/commit/a3e59518dcf9549ba11fd1702e6c3882d8b6ffb1))
* **test:** accepter les mois accentues dans le format de date francais ([e343ae1](https://github.com/teamdivergentes/website_frontend/commit/e343ae1682d729039b74d91952048fef4ca71e03))
* **twitch:** aligner les contrats API admin (live + reorder) ([9c089b3](https://github.com/teamdivergentes/website_frontend/commit/9c089b387ae3bd879525719acf686e3e57eee188))
* **twitch:** decouper onHandleKeydown pour repasser le Quality Gate ([5cfa012](https://github.com/teamdivergentes/website_frontend/commit/5cfa01250b381b59ca1cf8e4228b38fab4605b4f)), closes [#228](https://github.com/teamdivergentes/website_frontend/issues/228)
* **ui:** aligner la home sur 3 résultats comme team-detail ([fc2b71f](https://github.com/teamdivergentes/website_frontend/commit/fc2b71f525eecb1c2764d01799c11ea136f3bd5e))
* **ui:** breakpoint d'empilement et CLS du bandeau/palmarès ([2c806f0](https://github.com/teamdivergentes/website_frontend/commit/2c806f0f78666d8e38f0a870f8f325d074f5a93a))
* **ui:** corrections revue match-strip — a11y score, tokens couleur, focus, e2e mort ([15cb3c9](https://github.com/teamdivergentes/website_frontend/commit/15cb3c9d0d8154cc7f450b0a6656b9fa67adcde9))
* **ui:** defaire le reformatage prettier non voulu sur l'integration palmares/bandeau ([e53b0a0](https://github.com/teamdivergentes/website_frontend/commit/e53b0a018bbf9f798ece986cbb8cc92539c57583)), closes [#232](https://github.com/teamdivergentes/website_frontend/issues/232)
* **ui:** match strip review fixes — skeleton slot, noreferrer, logo fallback (EPIC-37 review) ([a3dace1](https://github.com/teamdivergentes/website_frontend/commit/a3dace1dbda7c9e46a0ab23ad1ad48d383ac1ea7))
* **ui:** pastille de rang neutre alignee sur la teinte verte de palmares.scss ([436bd70](https://github.com/teamdivergentes/website_frontend/commit/436bd70436d73c440a2aea65a6021e9a2d6cfd1a))
* **ui:** restaurer les gouttières latérales du bandeau matchs ([5a2b044](https://github.com/teamdivergentes/website_frontend/commit/5a2b044e8a0b47af8183dcce3c7294d41438937b))
* **ui:** retablir position:sticky et le defilement vers les ancres ([c12e62a](https://github.com/teamdivergentes/website_frontend/commit/c12e62a40c9147ae8077560ac1417259f982d7d1))
* **ui:** WCAG contrast, scrollable hint and skeleton shimmer on palmares (EPIC-37 review) ([f2be176](https://github.com/teamdivergentes/website_frontend/commit/f2be176011648387544132314b08f038abe40c4e))


### Features

* **admin:** afficher la marge de chaque commande ([6f4a03c](https://github.com/teamdivergentes/website_frontend/commit/6f4a03ca7f4d456bad2e904714722eb33667207e))
* **admin:** ajouter la page de gestion des commandes boutique ([1b9c311](https://github.com/teamdivergentes/website_frontend/commit/1b9c31143523e48fd3dd1ae5e642fc2fe2e62033))
* **admin:** ajouter la palette de commandes Cmd+K ([a21d21e](https://github.com/teamdivergentes/website_frontend/commit/a21d21e20b8684b04056131167de454118da3c75))
* **admin:** ajouter le service et les modeles des commandes boutique ([e778c19](https://github.com/teamdivergentes/website_frontend/commit/e778c1959a2015bba35bbd7e26d0272d2f79f94a))
* **admin:** ajouter un bandeau d'erreur persistant reutilisable ([d1be247](https://github.com/teamdivergentes/website_frontend/commit/d1be24752e41b2b279e2006d15d3e2649bba1865))
* **admin:** centraliser l'ouverture des dialogues ([9364574](https://github.com/teamdivergentes/website_frontend/commit/936457482faf71fa9da4ef5ff052018c843247eb))
* **admin:** centraliser les notifications du panel ([7812732](https://github.com/teamdivergentes/website_frontend/commit/7812732623a7b91175562fe9eeb503cecf768709))
* **admin:** centraliser validateurs, messages et pied de formulaire ([521d4af](https://github.com/teamdivergentes/website_frontend/commit/521d4af6db794042b9389a52091416b5a9c21611))
* **admin:** de-imbriquer les categories d'articles vers une page routee ([36666cb](https://github.com/teamdivergentes/website_frontend/commit/36666cb545c585a97aa7c308784cfb94fb4df6e2))
* **admin:** deriver le fil d'Ariane du registre des raccourcis ([7365bb7](https://github.com/teamdivergentes/website_frontend/commit/7365bb7dcadd59cf29a728ae11bb2b3e9cc4ef2d))
* **admin:** ecran boutique — catalogue, reglages et commandes multi-articles ([7747584](https://github.com/teamdivergentes/website_frontend/commit/77475842ddb61bd6d8e35447f8846fd182d82e9f))
* **admin:** extraire l'en-tete de page ([888baba](https://github.com/teamdivergentes/website_frontend/commit/888baba901b201818c04b76b0944e0207ec1772a))
* **admin:** extraire l'etat vide et la confirmation de suppression ([c260aec](https://github.com/teamdivergentes/website_frontend/commit/c260aec9f5738d552dac6b38ad6b20a5f130eed4))
* **admin:** extraire la mecanique de reordonnancement ([45455dc](https://github.com/teamdivergentes/website_frontend/commit/45455dceeae026dd499248d0e7309fc4ad55a313))
* **admin:** extraire un composant de squelette de chargement ([7f9acaf](https://github.com/teamdivergentes/website_frontend/commit/7f9acaf201671b0b96564c263961c7198fdf42cd))
* **admin:** galerie de visuels editable par produit ([313cd1b](https://github.com/teamdivergentes/website_frontend/commit/313cd1b76a1222d446c84f71c810f1d1a8c38226))
* **admin:** migrer la gestion des membres d'equipe du dialogue vers une page routee ([249e4f9](https://github.com/teamdivergentes/website_frontend/commit/249e4f93d7f46a36fa6a6724f197d3495c909ad5))
* **admin:** migrer le formulaire de recrutement du dialogue vers une page routee ([e21585a](https://github.com/teamdivergentes/website_frontend/commit/e21585a484b3c9b40ba15d97532275b6aced3ebd))
* **admin:** migrer le formulaire de role du dialogue vers une page routee ([115053c](https://github.com/teamdivergentes/website_frontend/commit/115053c94ff7178ac65e6882108a9aca129ff894))
* **admin:** migrer le staff de coaching du dialogue vers une page routee ([ecd4819](https://github.com/teamdivergentes/website_frontend/commit/ecd4819c2560ba571e8e0e41eaeb45bcdc25db86))
* **admin:** migrer les images de sponsor du dialogue vers une page routee ([3274dbd](https://github.com/teamdivergentes/website_frontend/commit/3274dbdc2772ba4f94e50627ec9e234ff196d29d))
* **admin:** migrer les liens de sponsor du dialogue vers une page routee ([94c6906](https://github.com/teamdivergentes/website_frontend/commit/94c6906dd2701390260452223121ee9c0ad8d510))
* **admin:** poser le socle de tokens graphiques du panel ([c432239](https://github.com/teamdivergentes/website_frontend/commit/c4322395e0ef5c8679739ef7b6eb4f7755d0fee8)), closes [#f44336](https://github.com/teamdivergentes/website_frontend/issues/f44336) [#ef5350](https://github.com/teamdivergentes/website_frontend/issues/ef5350) [#ef4444](https://github.com/teamdivergentes/website_frontend/issues/ef4444) [#e05c5c](https://github.com/teamdivergentes/website_frontend/issues/e05c5c) [#ff6b6b](https://github.com/teamdivergentes/website_frontend/issues/ff6b6b) [#ff8a80](https://github.com/teamdivergentes/website_frontend/issues/ff8a80)
* **admin:** redecouper les sections du registre de raccourcis ([639280b](https://github.com/teamdivergentes/website_frontend/commit/639280b6a26e011de039a40403fcfdd8d0edc03d))
* **admin:** reglages des tarifs de port et des couts internes ([08fa647](https://github.com/teamdivergentes/website_frontend/commit/08fa64703f843c29ef36cdfaebede058f45d9777))
* **admin:** regrouper la sidebar en sections semantiques ([0f64ee1](https://github.com/teamdivergentes/website_frontend/commit/0f64ee1ec6e35071ea0a2710a573fbcf88417c3d)), closes [#0C0D0C](https://github.com/teamdivergentes/website_frontend/issues/0C0D0C)
* **admin:** regrouper les notifications et afficher les compteurs de commandes (EPIC-47) ([#287](https://github.com/teamdivergentes/website_frontend/issues/287)) ([b73eb87](https://github.com/teamdivergentes/website_frontend/commit/b73eb87cc06cc67ad11c99080fcbb9e48e5f78cb))
* **admin:** remplacer les liens rapides par Reprendre et A faire ([ac7c258](https://github.com/teamdivergentes/website_frontend/commit/ac7c2588e1746f6a3a296eb7a4598dfc025d48bd))
* **admin:** verrouiller les couleurs de marque codees en dur ([0999ed8](https://github.com/teamdivergentes/website_frontend/commit/0999ed8e17920ea1dc89852df2f0cb77e9e4bf6b)), closes [#999](https://github.com/teamdivergentes/website_frontend/issues/999) [#999](https://github.com/teamdivergentes/website_frontend/issues/999)
* **boutique:** ajouter le service de catalogue et de checkout ([d31fdd4](https://github.com/teamdivergentes/website_frontend/commit/d31fdd441dc239b5108a9c856bd087fca3d4e091))
* **boutique:** bande-son du hero et suppression de l'image d'attente ([873c98a](https://github.com/teamdivergentes/website_frontend/commit/873c98a5540fb2eec4c673ad82de314e04f66940))
* **boutique:** brancher la page sur l'API et le paiement Stripe ([503d44f](https://github.com/teamdivergentes/website_frontend/commit/503d44f4677bed9a080e19a458ee45f155fd281e))
* **boutique:** choix du mode de livraison et franchise de port ([08e02f8](https://github.com/teamdivergentes/website_frontend/commit/08e02f83dd2434529c5420aab2594173de44ddc0))
* **boutique:** fiche produit avec flocage, panier et parcours d'achat ([6ff5657](https://github.com/teamdivergentes/website_frontend/commit/6ff565758cc625e85be2305abac0f8b6d3e95162))
* **boutique:** fonds de scene des maillots, refonte de la fiche produit et tarif reserve au panier ([#280](https://github.com/teamdivergentes/website_frontend/issues/280)) ([c0f9252](https://github.com/teamdivergentes/website_frontend/commit/c0f92522ca5e736161057772a591b862db878383)), closes [website_backend#191](https://github.com/website_backend/issues/191)
* **boutique:** hero video, son au choix et titre au defilement ([e175669](https://github.com/teamdivergentes/website_frontend/commit/e1756694929305bf74dad3dcf35caf34d30bfd88))
* **boutique:** mettre en avant la franchise dans le panier ([0907e51](https://github.com/teamdivergentes/website_frontend/commit/0907e51d8e77f90e572b78bbd8a8ef9d4bc7bef0))
* **boutique:** pastille panier permanente avec jauge de franchise ([5536283](https://github.com/teamdivergentes/website_frontend/commit/553628302ec63d78d519dc99631d1f8b3c8b7c64))
* **boutique:** rail de vues alimente par la galerie ([acf54a7](https://github.com/teamdivergentes/website_frontend/commit/acf54a781007e43da43c87c98bdd2db9c12acb96))
* **boutique:** reduire le hero a ses deux titres ([2ab1089](https://github.com/teamdivergentes/website_frontend/commit/2ab1089a25976d3f98028b3eaaab1753ae6f8b98))
* **boutique:** refonte page boutique avec hero video, grille responsive et corrections mobile ([9eebe69](https://github.com/teamdivergentes/website_frontend/commit/9eebe690fc4a04ea21a9f682a9e7335ee2b0afc8))
* **boutique:** retour visuel a l'ajout et franchise sur la fiche ([ecb80ab](https://github.com/teamdivergentes/website_frontend/commit/ecb80ab6ee34e0756f71e164765f8c8b36cb35f1))
* **boutique:** visuels de la collection 2026 ([a570488](https://github.com/teamdivergentes/website_frontend/commit/a570488bbbd5c660a747f0c8e98866b47cd51e9c))
* **boutique:** visuels des trois maillots en WebP ([d0fcdcc](https://github.com/teamdivergentes/website_frontend/commit/d0fcdccafc980b5230ecfa41cb6b51ceecb6e4f7))
* **boutique:** visuels du shooting Mystic ([dd5cdf5](https://github.com/teamdivergentes/website_frontend/commit/dd5cdf5a8246eb36d459652096ed6bb06dbb52f1))
* **boutique:** volets composition, entretien, tailles et livraison ([c22a7e1](https://github.com/teamdivergentes/website_frontend/commit/c22a7e182a3809788c4a5baded9abd07ee471103))
* **ci:** reduire la dependance aux runners + reprise :RELEASE (EPIC-39 US2+US3) ([4ef51ab](https://github.com/teamdivergentes/website_frontend/commit/4ef51ab7c37ec729282b6e4d89e1a50c19985f7c)), closes [#hosted](https://github.com/teamdivergentes/website_frontend/issues/hosted)
* **ci:** superviser reellement les runners self-hosted (EPIC-39 US1) ([d347f3a](https://github.com/teamdivergentes/website_frontend/commit/d347f3ab3c27fedb8171f339ba9b8a79857aed5b))
* **config:** add TikTok social link ([2f4785f](https://github.com/teamdivergentes/website_frontend/commit/2f4785fae6f82ff6122eedf8aba8b53a7c3c54a7))
* **frontend:** add admin matches CRUD with quick score entry (EPIC-37) ([d26f728](https://github.com/teamdivergentes/website_frontend/commit/d26f728185ec82e55ae91050a087a1a11df72492))
* **frontend:** add admin palmares CRUD page with featured toggle (EPIC-37) ([e85107f](https://github.com/teamdivergentes/website_frontend/commit/e85107f4233bb13749fa84011ae18a7bbb80a0ea))
* **frontend:** add Match model, outcome helper and MatchesService (EPIC-37) ([c83417e](https://github.com/teamdivergentes/website_frontend/commit/c83417e548ce3974fd7a8dc1c22ee8789bc1a67c))
* **frontend:** add page_palmares_visible toggle in admin config (EPIC-37) ([786ea09](https://github.com/teamdivergentes/website_frontend/commit/786ea09fea23ce73c2ec35abed2609be7ddf081b))
* **frontend:** add palmares badges on team detail page (EPIC-37) ([1054e28](https://github.com/teamdivergentes/website_frontend/commit/1054e28f5d576cfb0b5251f821394ab36c3f694f))
* **frontend:** add public palmares page with featured rail and year history (EPIC-37) ([1ed9800](https://github.com/teamdivergentes/website_frontend/commit/1ed9800782b77a9a408e099fab385c82f8374dca))
* **frontend:** add reusable match strip on home and team pages (EPIC-37) ([3c5ba06](https://github.com/teamdivergentes/website_frontend/commit/3c5ba06849ba97eb821083a198860924b8ad13fd)), closes [#e05c5c](https://github.com/teamdivergentes/website_frontend/issues/e05c5c) [#888](https://github.com/teamdivergentes/website_frontend/issues/888)
* **frontend:** add teamGame to trophy model (EPIC-37 redesign) ([423b038](https://github.com/teamdivergentes/website_frontend/commit/423b038c73a085ec618eca4f63ae03f8741b2195))
* **frontend:** add Trophy model and TrophiesService with signals (EPIC-37) ([d771316](https://github.com/teamdivergentes/website_frontend/commit/d7713163e95c04742a8b2c468cebf9c176b11a2e))
* **frontend:** masquer le bandeau matchs et le palmarès du site public ([#299](https://github.com/teamdivergentes/website_frontend/issues/299)) ([9c867fd](https://github.com/teamdivergentes/website_frontend/commit/9c867fdb0b9580e5f1db899bcef61335d393b3c1))
* **frontend:** wire page_palmares_visible config into nav visibility (EPIC-37) ([aeab4da](https://github.com/teamdivergentes/website_frontend/commit/aeab4da82e204aeed45beef441849150780eb8a0))
* **legal:** source unique des informations legales, CGV et retractation ([0445b2e](https://github.com/teamdivergentes/website_frontend/commit/0445b2e474c7377f68bded4513d0c6ccf3cded8f))
* **matches:** formatage relatif de l'echeance d'un match ([4fc3cba](https://github.com/teamdivergentes/website_frontend/commit/4fc3cbabe02e9ae21601251d0eea0c35451ef278))
* **matches:** repli en initiales pour les ecussons adversaires ([7e459de](https://github.com/teamdivergentes/website_frontend/commit/7e459de92a008c8b55e5c607d2fad5e7a5e8b7b3))
* **matches:** trois etats d'affichage pour le bandeau matchs ([dd5ce4e](https://github.com/teamdivergentes/website_frontend/commit/dd5ce4e32bc305a59313acb5745ffc74d8d3f445))
* **seo:** rendre l'image OG par defaut applicative ([20f3705](https://github.com/teamdivergentes/website_frontend/commit/20f3705b48508b423a69d0a9261ed71c33d8b115))
* **seo:** tirer titre, description et image de partage du back-office (EPIC-31 US-8) ([#293](https://github.com/teamdivergentes/website_frontend/issues/293)) ([a31ffd2](https://github.com/teamdivergentes/website_frontend/commit/a31ffd2733843f8a2d74697b175a2077e32b236b))
* **shop:** annoncer la livraison en Europe et non plus en France ([#283](https://github.com/teamdivergentes/website_frontend/issues/283)) ([247a855](https://github.com/teamdivergentes/website_frontend/commit/247a855d460d02ef1085923da57fc95bb83458c9))
* **shop:** mentions dues au consommateur sur le panier ([08a35e8](https://github.com/teamdivergentes/website_frontend/commit/08a35e80b4d89f5eeb53c0b4b83233dc0cd30ff7))
* **shop:** personnaliser la page de remerciement, et n'y affirmer que le verifie ([#286](https://github.com/teamdivergentes/website_frontend/issues/286)) ([c09a368](https://github.com/teamdivergentes/website_frontend/commit/c09a36897e3d82edc292b017138348d68ca3b400))
* **shop:** retirer le choix du mode de livraison, un seul tarif ([#292](https://github.com/teamdivergentes/website_frontend/issues/292)) ([db83608](https://github.com/teamdivergentes/website_frontend/commit/db83608e1c4f32330624e210340d331b2f9b913f))
* **shop:** saisie du bon de reduction et prix barre (EPIC-48) ([#296](https://github.com/teamdivergentes/website_frontend/issues/296)) ([bd8aefe](https://github.com/teamdivergentes/website_frontend/commit/bd8aefe09ace0e7888e8482e75c76c5c3676f29e))
* **ssr:** mettre en place le socle de rendu serveur Angular ([dbe0b4c](https://github.com/teamdivergentes/website_frontend/commit/dbe0b4c1444e7e7ad2316985f079d40978ca453b))
* **ssr:** resoudre les URLs relatives cote serveur ([7ea1b7b](https://github.com/teamdivergentes/website_frontend/commit/7ea1b7bbf20891f4bfedf3a88b14de1f0baa4e1e))
* **ssr:** router le trafic HTML vers le serveur de rendu ([7c8b951](https://github.com/teamdivergentes/website_frontend/commit/7c8b9515cb818bae1b6a9314823c280229d68943))
* **twitch:** glisser-deposer unique + reorganisation clavier accessible ([3916747](https://github.com/teamdivergentes/website_frontend/commit/3916747960f8580868ed9e8755c6631565475e66))
* **ui:** bandeau matchs immersif 900px avec repli sur dernier resultat ([ca6c0d5](https://github.com/teamdivergentes/website_frontend/commit/ca6c0d5987bd6846dce08ef11deca2b318de4621))
* **ui:** bloc palmares d'equipe a teinte doree ([bff292d](https://github.com/teamdivergentes/website_frontend/commit/bff292d6b4db004a1c64d5e88829bdb1d86e226a))
* **ui:** integrer le bloc palmares et le bandeau 900px dans les pages ([27b784b](https://github.com/teamdivergentes/website_frontend/commit/27b784b6e45506a0dee5276fa545bd94e9e1c933))
* **ui:** refonte design system + élévation premium palmarès (EPIC-37) ([52cfbb6](https://github.com/teamdivergentes/website_frontend/commit/52cfbb652ebf5974a7873af9dea587fa1646d128))
* **ui:** refonte graphique de la boutique et de la fiche produit ([a1601f3](https://github.com/teamdivergentes/website_frontend/commit/a1601f357ff4c425d4f7a16f8bf3da0aa8ce204b))
* **ui:** token $match-max-width et conteneur .match-container pour blocs matchs ([4f60250](https://github.com/teamdivergentes/website_frontend/commit/4f602500f7149d049ce556d309aa96cd1abf23e1))
* **ui:** trophy room hero layout with game logos for palmares (EPIC-37 redesign) ([2bc3c5e](https://github.com/teamdivergentes/website_frontend/commit/2bc3c5e6ee9434d753c85d2f50f9e3f9502b67c2))


### Performance Improvements

* **boutique:** commande de son a la demande, video en pause hors ecran ([ae289b8](https://github.com/teamdivergentes/website_frontend/commit/ae289b868918ea4d156f430f68bb279fa54ad518))
* **frontend:** alleger le JS initial, corriger le hero SSR et fiabiliser la mesure ([#291](https://github.com/teamdivergentes/website_frontend/issues/291)) ([03dd216](https://github.com/teamdivergentes/website_frontend/commit/03dd2164f7a0784f9f8c664d17d0984f99b76b69))

## [1.4.3](https://github.com/teamdivergentes/website_frontend/compare/v1.4.2...v1.4.3) (2026-05-28)


### Bug Fixes

* **config:** point admin config panel to protected admin endpoint ([cad1576](https://github.com/teamdivergentes/website_frontend/commit/cad1576dcfd79c4c7e7a1ed981add88e79cfe404))

## [1.4.1](https://github.com/teamdivergentes/website_frontend/compare/v1.4.0...v1.4.1) (2026-05-24)


### Bug Fixes

* **admin:** add placeholders on all URL input fields for better UX ([39ced3f](https://github.com/teamdivergentes/website_frontend/commit/39ced3fecf1adcbbb4eb6d5cacd8c9d8f015e3c1))
* **detail:** add Discord SVG icon in player and coach detail templates ([38d743c](https://github.com/teamdivergentes/website_frontend/commit/38d743cb5def8c411e802a1ae658b54fb68ad26a))

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
