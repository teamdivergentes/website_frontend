
# Document d'analyse E2E — Team Divergentes (DVG)

## Synthèse de la structure

**Routes publiques (12)** : `/`, `/contact`, `/boutique`, `/structure`, `/structure/sponsors`, `/structure/equipes`, `/structure/equipes/:teamId`, `/structure/equipes/:teamId/joueur/:playerSlug`, `/structure/recrutement`, `/structure/recrutement/:slug`, `/structure/recrutement/postuler`, `/articles`, `/articles/:slug`, `/mentions-legales`, `/politique-de-confidentialite`, `/404`

**Routes auth (1)** : `/auth/login`

**Routes protégées (12)** : `/profile`, `/admin`, `/admin/users`, `/admin/roles`, `/admin/teams`, `/admin/games`, `/admin/sponsors`, `/admin/config`, `/admin/staff`, `/admin/recruitment`, `/admin/analytics`, `/admin/articles`, `/admin/articles/new`, `/admin/articles/edit/:id`

**Token storage** : `localStorage` clé `dvg_auth_token`

**Compte de test** : `admin@teamdivergentes.fr` / `admin123`

---

## Catégorie 1 — Smoke Tests (chargement des pages)

### [CRITIQUE] Chargement de la page d'accueil
**Persona** : Visiteur
**Preconditions** : Aucune
**Etapes** :
1. Naviguer vers `http://localhost:8080/`
2. Verifier que le titre de la page contient "Accueil"
3. Verifier que le header est visible
4. Verifier que le footer est visible
5. Verifier qu'aucune erreur console JavaScript n'est presente
**Donnees de test** : Aucune

---

### [CRITIQUE] Chargement de la page de contact
**Persona** : Visiteur
**Preconditions** : Aucune
**Etapes** :
1. Naviguer vers `/contact`
2. Verifier que le titre de la page contient "Contact"
3. Verifier que le formulaire de contact est visible
4. Verifier que les champs Sujet, Nom, Email, Message sont presents
**Donnees de test** : Aucune

---

### [CRITIQUE] Chargement de la page boutique
**Persona** : Visiteur
**Preconditions** : Aucune
**Etapes** :
1. Naviguer vers `/boutique`
2. Verifier que le titre de la page contient "Boutique"
3. Verifier que des articles de shop sont affiches (ou etat vide si aucun)
**Donnees de test** : Aucune

---

### [CRITIQUE] Chargement de la page structure
**Persona** : Visiteur
**Preconditions** : Aucune
**Etapes** :
1. Naviguer vers `/structure`
2. Verifier que le titre de la page contient "Structure"
3. Verifier que les sections admin/headstaff sont visibles ou que le skeleton de chargement apparait puis disparait
**Donnees de test** : Aucune

---

### [CRITIQUE] Chargement de la page sponsors publique
**Persona** : Visiteur
**Preconditions** : Aucune
**Etapes** :
1. Naviguer vers `/structure/sponsors`
2. Verifier que le titre de la page contient "Sponsors"
3. Verifier que la liste des sponsors se charge (ou etat vide)
**Donnees de test** : Aucune

---

### [CRITIQUE] Chargement de la page equipes
**Persona** : Visiteur
**Preconditions** : Aucune
**Etapes** :
1. Naviguer vers `/structure/equipes`
2. Verifier que le titre contient "Equipes"
3. Verifier que le skeleton de chargement apparait puis disparait
4. Verifier que les cartes d'equipes sont visibles (ou etat vide)
**Donnees de test** : Aucune

---

### [CRITIQUE] Chargement de la page recrutement publique
**Persona** : Visiteur
**Preconditions** : Aucune
**Etapes** :
1. Naviguer vers `/structure/recrutement`
2. Verifier que le titre contient "Recrutement"
3. Verifier que la liste des offres actives se charge (ou etat vide)
**Donnees de test** : Aucune

---

### [CRITIQUE] Chargement de la page articles
**Persona** : Visiteur
**Preconditions** : Aucune
**Etapes** :
1. Naviguer vers `/articles`
2. Verifier que le titre contient "Actualites"
3. Verifier que le skeleton de chargement apparait puis disparait
4. Verifier que des articles ou un etat vide est affiche
**Donnees de test** : Aucune

---

### [CRITIQUE] Chargement du panel admin — Dashboard
**Persona** : Admin
**Preconditions** : Token JWT valide dans `localStorage`
**Etapes** :
1. Injecter le token dans `localStorage['dvg_auth_token']`
2. Naviguer vers `/admin`
3. Verifier que le titre contient "Dashboard Admin"
4. Verifier que la sidebar admin est visible
5. Verifier que le message de bienvenue contient le nom de l'utilisateur
6. Verifier que la section "Etat du site" affiche "En ligne"
**Donnees de test** : `admin@teamdivergentes.fr` / `admin123`

---

### [HAUT] Chargement de la page 404
**Persona** : Visiteur
**Preconditions** : Aucune
**Etapes** :
1. Naviguer vers `/une-route-qui-nexiste-pas`
2. Verifier la redirection vers `/404`
3. Verifier qu'un message de page non trouvee est affiche
**Donnees de test** : Aucune

---

### [HAUT] Chargement de la page mentions legales
**Persona** : Visiteur
**Preconditions** : Aucune
**Etapes** :
1. Naviguer vers `/mentions-legales`
2. Verifier que le titre contient "Mentions Legales"
3. Verifier que le contenu de la page est visible
**Donnees de test** : Aucune

---

### [HAUT] Chargement de la page politique de confidentialite
**Persona** : Visiteur
**Preconditions** : Aucune
**Etapes** :
1. Naviguer vers `/politique-de-confidentialite`
2. Verifier que le titre contient "Politique de Confidentialite"
3. Verifier que le contenu est visible
**Donnees de test** : Aucune

---

## Categorie 2 — Parcours Visiteur (Navigation publique)

### [HAUT] Navigation complete depuis l'accueil vers les equipes
**Persona** : Visiteur
**Preconditions** : Aucune
**Etapes** :
1. Naviguer vers `/`
2. Verifier que la page d'accueil est chargee (hero visible)
3. Cliquer sur le lien "Structure" ou "Equipes" dans la navigation
4. Verifier la navigation vers `/structure/equipes`
5. Verifier que la liste des equipes est visible
6. Cliquer sur la carte d'une equipe
7. Verifier la navigation vers `/structure/equipes/:teamId`
8. Verifier que le nom de l'equipe est affiche en titre
9. Verifier que la liste des membres est visible
**Donnees de test** : Une equipe doit exister en BDD avec le statut `active: true`

---

### [HAUT] Acces au detail d'un joueur depuis la fiche equipe
**Persona** : Visiteur
**Preconditions** : Une equipe active avec au moins un membre existe
**Etapes** :
1. Naviguer vers `/structure/equipes`
2. Cliquer sur une equipe
3. Sur la page de detail de l'equipe, cliquer sur la carte d'un joueur
4. Verifier la navigation vers `/structure/equipes/:teamId/joueur/:playerSlug`
5. Verifier que le pseudo du joueur est affiche
6. Verifier que les reseaux sociaux du joueur (s'ils existent) sont affiches comme liens
7. Verifier le bouton "Retour" redirige vers la page de l'equipe
**Donnees de test** : Un membre d'equipe avec `playerSlug` doit exister

---

### [HAUT] Navigation vers les sponsors
**Persona** : Visiteur
**Preconditions** : Au moins un sponsor actif en BDD
**Etapes** :
1. Naviguer vers `/structure/sponsors`
2. Verifier que les logos des sponsors sont affiches
3. Verifier que les liens des sponsors sont cliquables (si `href` present)
4. Verifier que les images sont chargees sans erreur 404
**Donnees de test** : Un sponsor avec `active: true` et une image uploadee

---

### [HAUT] Navigation vers les articles et lecture d'un article
**Persona** : Visiteur
**Preconditions** : Au moins un article publie existe
**Etapes** :
1. Naviguer vers `/articles`
2. Verifier que les filtres de categories sont visibles
3. Verifier que les articles sont listes
4. Cliquer sur un article
5. Verifier la navigation vers `/articles/:slug`
6. Verifier que le titre de l'article est en `<h1>`
7. Verifier que le contenu de l'article est visible
**Donnees de test** : Un article avec `published: true`

---

### [MOYEN] Filtrage des articles par categorie
**Persona** : Visiteur
**Preconditions** : Des articles de categories differentes existent
**Etapes** :
1. Naviguer vers `/articles`
2. Attendre le chargement des filtres de categories
3. Cliquer sur un filtre de categorie specifique
4. Verifier que la liste d'articles est filtree (seuls les articles de cette categorie sont affiches)
5. Verifier que le compteur de pages est mis a jour
6. Cliquer sur le filtre "Tous" pour retablir
7. Verifier que tous les articles sont de nouveau affiches
**Donnees de test** : Articles de deux categories differentes

---

### [MOYEN] Pagination des articles
**Persona** : Visiteur
**Preconditions** : Plus de 9 articles publies existent
**Etapes** :
1. Naviguer vers `/articles`
2. Verifier que les boutons de pagination sont visibles
3. Cliquer sur le bouton page 2
4. Verifier que la page defiles vers le haut (scroll to top)
5. Verifier que la page courante change
6. Verifier que les articles affiches sont differents
**Donnees de test** : 10+ articles publies

---

### [MOYEN] Acces a la structure — lien YouTube et Discord
**Persona** : Visiteur
**Preconditions** : Les configs `youtube_link` et `discord_url` sont definies
**Etapes** :
1. Naviguer vers `/structure`
2. Verifier que l'iframe ou le lien YouTube est visible
3. Verifier que le lien Discord est cliquable
4. Verifier que les membres admins et headstaff sont listes
**Donnees de test** : Config `youtube_link` et `discord_url` renseignees

---

## Categorie 3 — Parcours Candidat (Recrutement)

### [CRITIQUE] Consulter une offre de poste et postuler (parcours complet)
**Persona** : Candidat
**Preconditions** : Au moins une offre de recrutement active existe
**Etapes** :
1. Naviguer vers `/structure/recrutement`
2. Verifier que la liste des offres actives est visible (skeleton puis contenu)
3. Cliquer sur une offre de poste
4. Verifier la navigation vers `/structure/recrutement/:slug`
5. Verifier que le titre du poste est affiche en `<h1>`
6. Verifier que la description, les missions et le profil recherche sont visibles
7. Cliquer sur le bouton "Postuler" ou le lien vers le formulaire
8. Verifier la navigation vers `/structure/recrutement/postuler?postTitle=...&postType=...`
9. Verifier que les `queryParams` `postTitle` et `postType` sont bien passes
10. Verifier que le titre du poste apparait dans le formulaire
11. Remplir le champ "Nom" avec "Candidat Test"
12. Remplir le champ "Email" avec "candidat@test.fr"
13. Remplir le champ "Message" avec "Motivation de test"
14. Attacher un fichier PDF comme CV (champ obligatoire)
15. Cliquer sur "Envoyer ma candidature"
16. Verifier que l'indicateur de chargement apparait (`isSubmitting`)
17. Verifier que le message de succes apparait (`submitSuccess`)
18. Verifier que le formulaire est reinitialise apres soumission
**Donnees de test** :
- Poste actif avec `active: true` et un `slug` valide
- Fichier CV : tout fichier PDF < 5MB
- Candidat : nom="Candidat Test", email="candidat@test.fr"

---

### [HAUT] Acces direct au formulaire sans `postTitle` — redirection
**Persona** : Candidat
**Preconditions** : Aucune
**Etapes** :
1. Naviguer directement vers `/structure/recrutement/postuler` (sans query params)
2. Verifier la redirection automatique vers `/structure/recrutement`
3. Verifier qu'aucune erreur JavaScript n'apparait en console
**Donnees de test** : Aucune

---

### [HAUT] Acces a une fiche de poste avec slug invalide — redirection
**Persona** : Candidat
**Preconditions** : Aucune
**Etapes** :
1. Naviguer vers `/structure/recrutement/un-slug-inexistant`
2. Verifier la redirection vers `/structure/recrutement` (comportement du composant en cas d'erreur API)
3. Verifier qu'aucun message d'erreur non gere n'apparait
**Donnees de test** : Aucune

---

### [HAUT] Soumission du formulaire de candidature sans CV — validation
**Persona** : Candidat
**Preconditions** : Un poste actif existe
**Etapes** :
1. Naviguer vers `/structure/recrutement`
2. Cliquer sur une offre
3. Cliquer sur "Postuler" depuis la fiche de poste
4. Remplir "Nom" et "Email"
5. NE PAS attacher de CV
6. Cliquer sur "Envoyer"
7. Verifier que `cvTouched` devient `true` et qu'une erreur de validation s'affiche
8. Verifier que le formulaire n'est pas soumis
**Donnees de test** : Nom="Test", Email="test@test.fr", sans CV

---

### [MOYEN] Formulaire de candidature avec lettre de motivation (optionnelle)
**Persona** : Candidat
**Preconditions** : Un poste actif existe
**Etapes** :
1. Naviguer vers le formulaire de candidature d'un poste
2. Remplir tous les champs obligatoires (nom, email, CV)
3. Attacher une lettre de motivation (champ optionnel)
4. Verifier que les deux fichiers sont enregistres
5. Soumettre le formulaire
6. Verifier le message de succes
**Donnees de test** : CV + lettre de motivation < 5MB chacun

---

### [MOYEN] Navigation "Retour" depuis le formulaire de candidature
**Persona** : Candidat
**Preconditions** : Sur le formulaire de candidature
**Etapes** :
1. Naviguer vers le formulaire d'une offre
2. Cliquer sur le bouton "Retour"
3. Verifier la navigation vers `/structure/recrutement`
**Donnees de test** : Aucune

---

### [BAS] Formulaire de contact — soumission valide
**Persona** : Visiteur
**Preconditions** : Config SMTP ou Discord webhook configuree
**Etapes** :
1. Naviguer vers `/contact`
2. Selectionner un sujet parmi "eSport", "Collaboration", "Divers"
3. Remplir "Nom" avec "Test Contact"
4. Remplir "Email" avec "contact@test.fr"
5. Remplir "Message" avec "Ceci est un message de test"
6. Cliquer sur le bouton de soumission
7. Verifier l'indicateur de chargement (`isSubmitting`)
8. Verifier le message de succes (`submitSuccess`)
9. Verifier que le formulaire est reinitialise (champs vides, sujet deselectionne)
**Donnees de test** : sujet="eSport", nom="Test Contact", email="contact@test.fr", message="Ceci est un message de test"

---

### [BAS] Formulaire de contact — soumission sans sujet selectionne
**Persona** : Visiteur
**Preconditions** : Aucune
**Etapes** :
1. Naviguer vers `/contact`
2. Remplir nom, email, message mais ne pas selectionner de sujet
3. Cliquer sur soumettre
4. Verifier que `onSubmit()` retourne sans action (guard `!this.selectedGame`)
5. Verifier qu'aucun appel API n'est effectue
**Donnees de test** : Aucune

---

## Categorie 4 — Parcours Admin — Authentification

### [CRITIQUE] Connexion avec identifiants valides
**Persona** : Admin
**Preconditions** : Aucune (non authentifie)
**Etapes** :
1. Naviguer vers `/auth/login`
2. Verifier que le formulaire de connexion est visible (titre "Connexion")
3. Remplir le champ "Email" avec `admin@teamdivergentes.fr`
4. Remplir le champ "Mot de passe" avec `admin123`
5. Cliquer sur "Se connecter"
6. Verifier que l'indicateur de chargement apparait (spinner + texte "Connexion...")
7. Verifier la redirection vers `/admin` apres succes
8. Verifier que le token JWT est present dans `localStorage['dvg_auth_token']`
9. Verifier que la sidebar admin est visible
**Donnees de test** : email="admin@teamdivergentes.fr", password="admin123"

---

### [CRITIQUE] Connexion avec identifiants invalides
**Persona** : Admin
**Preconditions** : Aucune
**Etapes** :
1. Naviguer vers `/auth/login`
2. Remplir le champ "Email" avec `faux@email.fr`
3. Remplir le champ "Mot de passe" avec `mauvaismdp`
4. Cliquer sur "Se connecter"
5. Verifier que le message d'erreur est affiche (`errorMessage` signal)
6. Verifier que le message contient "Identifiants invalides" ou le message du serveur
7. Verifier que l'utilisateur reste sur `/auth/login`
8. Verifier qu'aucun token n'est stocke en `localStorage`
**Donnees de test** : email="faux@email.fr", password="mauvaismdp"

---

### [CRITIQUE] Validation du formulaire de connexion — champs vides
**Persona** : Admin
**Preconditions** : Sur `/auth/login`
**Etapes** :
1. Naviguer vers `/auth/login`
2. Cliquer sur "Se connecter" sans remplir aucun champ
3. Verifier que les messages de validation apparaissent : "L'email est requis" et "Le mot de passe est requis"
4. Verifier que le bouton reste desactive (`loginForm.invalid`)
5. Toucher le champ email, le laisser vide, quitter : verifier le message d'erreur
6. Saisir un email invalide (ex: "pasunmail") : verifier le message "Email invalide"
**Donnees de test** : Aucune

---

### [CRITIQUE] Deconnexion
**Persona** : Admin
**Preconditions** : Authentifie sur `/admin`
**Etapes** :
1. S'authentifier en tant qu'admin
2. Naviguer vers `/admin`
3. Cliquer sur le bouton de deconnexion dans la sidebar ou le header
4. Verifier que l'API `POST /api/auth/logout` est appelee
5. Verifier la redirection vers `/auth/login`
6. Verifier que `localStorage['dvg_auth_token']` est supprime
7. Verifier que l'acces a `/admin` redirige vers `/auth/login`
**Donnees de test** : email="admin@teamdivergentes.fr", password="admin123"

---

### [CRITIQUE] Acces sans authentification — redirection
**Persona** : Visiteur
**Preconditions** : Aucun token en localStorage
**Etapes** :
1. Vider le `localStorage` (`localStorage.clear()`)
2. Naviguer directement vers `/admin`
3. Verifier que l'`authGuard` intercepte et redirige vers `/auth/login`
4. Verifier que l'URL finale est `/auth/login`
**Donnees de test** : Aucune

---

### [CRITIQUE] Acces sans permission — redirection
**Persona** : Admin avec permissions restreintes
**Preconditions** : Un utilisateur avec un role n'ayant pas `users:read`
**Etapes** :
1. S'authentifier avec un compte sans la permission `users:read`
2. Tenter d'acceder directement a `/admin/users`
3. Verifier que le `permissionGuard` intercepte et redirige vers `/admin`
4. Verifier qu'aucune donnee de la page users n'est chargee
**Donnees de test** : Un compte avec role restreint

---

### [HAUT] Toggle visibilite mot de passe
**Persona** : Admin
**Preconditions** : Sur `/auth/login`
**Etapes** :
1. Naviguer vers `/auth/login`
2. Saisir un mot de passe dans le champ "Mot de passe" (type=password par defaut)
3. Cliquer sur le bouton toggle (icone oeil)
4. Verifier que le champ passe en type=text (`showPassword = true`)
5. Cliquer a nouveau sur le toggle
6. Verifier que le champ repasse en type=password
**Donnees de test** : Aucune

---

### [HAUT] Redirection apres connexion — token expire (401)
**Persona** : Admin
**Preconditions** : Token invalide ou expire dans localStorage
**Etapes** :
1. Placer un token invalide dans `localStorage['dvg_auth_token']`
2. Naviguer vers `/admin`
3. Verifier que l'API `GET /api/auth/me` retourne 401
4. Verifier que `clearSession()` est appelee (token supprime du localStorage)
5. Verifier la redirection vers `/auth/login`
**Donnees de test** : Token invalide : `localStorage['dvg_auth_token'] = 'token.invalide'`

---

## Categorie 5 — Parcours Admin — Profil

### [HAUT] Consultation du profil utilisateur
**Persona** : Admin
**Preconditions** : Authentifie
**Etapes** :
1. S'authentifier
2. Naviguer vers `/profile`
3. Verifier que l'email de l'utilisateur est affiche
4. Verifier que le role est affiche
5. Verifier que la date "Membre depuis" est affiche au format `dd MMMM yyyy`
**Donnees de test** : email="admin@teamdivergentes.fr"

---

### [HAUT] Modification de l'email du profil
**Persona** : Admin
**Preconditions** : Authentifie sur `/profile`
**Etapes** :
1. Naviguer vers `/profile`
2. Modifier le champ "Nouvel email" avec une nouvelle valeur valide
3. Cliquer sur "Modifier"
4. Verifier le snack bar "Email modifie avec succes"
5. Verifier que le changement est persistant (recharger la page, verifier l'email)
**Donnees de test** : Nouvel email valide different de l'actuel

---

### [HAUT] Changement du mot de passe — succes
**Persona** : Admin
**Preconditions** : Authentifie sur `/profile`
**Etapes** :
1. Naviguer vers `/profile`
2. Remplir "Mot de passe actuel" avec `admin123`
3. Remplir "Nouveau mot de passe" avec `NouveauMdp123`
4. Remplir "Confirmer le nouveau mot de passe" avec `NouveauMdp123`
5. Cliquer sur "Changer le mot de passe"
6. Verifier le snack bar de succes
7. Verifier que le formulaire est reinitialise
8. Remettre le mot de passe a `admin123` (teardown)
**Donnees de test** : currentPassword="admin123", newPassword="NouveauMdp123"

---

### [MOYEN] Changement du mot de passe — mots de passe non concordants
**Persona** : Admin
**Preconditions** : Authentifie sur `/profile`
**Etapes** :
1. Naviguer vers `/profile`
2. Remplir "Mot de passe actuel"
3. Remplir "Nouveau mot de passe" avec "MotPasse1"
4. Remplir "Confirmer" avec "MotPasseDifferent"
5. Verifier que le validateur `passwordMatchValidator` bloque la soumission
6. Verifier que le message "Les mots de passe ne correspondent pas" est visible
**Donnees de test** : Aucune

---

### [MOYEN] Changement du mot de passe — nouveau MDP trop court
**Persona** : Admin
**Preconditions** : Authentifie sur `/profile`
**Etapes** :
1. Naviguer vers `/profile`
2. Remplir "Nouveau mot de passe" avec "court" (moins de 8 caracteres)
3. Verifier le message "Minimum 8 caracteres"
4. Verifier que le bouton reste desactive
**Donnees de test** : Aucune

---

## Categorie 6 — Parcours Admin — CRUD Utilisateurs

### [CRITIQUE] Lister les utilisateurs
**Persona** : Admin avec `users:read`
**Preconditions** : Authentifie avec permission `users:read`
**Etapes** :
1. S'authentifier
2. Naviguer vers `/admin/users`
3. Verifier que le titre "Gestion des Utilisateurs" est visible
4. Verifier que le tableau se charge (colonnes : Email, Role, Statut, Cree le, Actions)
5. Verifier que le compteur de resultats affiche le nombre d'utilisateurs
**Donnees de test** : Au moins un utilisateur en BDD

---

### [CRITIQUE] Creer un nouvel utilisateur
**Persona** : Admin avec `users:write`
**Preconditions** : Authentifie avec `users:write`
**Etapes** :
1. Naviguer vers `/admin/users`
2. Cliquer sur "Nouvel utilisateur"
3. Verifier l'ouverture du dialog `UserFormDialog`
4. Remplir "Email" avec "nouveau@test.fr"
5. Remplir "Mot de passe" avec "MotDePasse123"
6. Selectionner un role dans la liste
7. Cliquer sur "Creer" ou "Enregistrer"
8. Verifier la fermeture du dialog
9. Verifier le snack bar "Utilisateur cree avec succes"
10. Verifier que le nouvel utilisateur apparait dans le tableau
**Donnees de test** : email="nouveau@test.fr", password="MotDePasse123", role=any

---

### [CRITIQUE] Modifier un utilisateur existant
**Persona** : Admin avec `users:write`
**Preconditions** : Au moins un utilisateur autre que l'admin existe
**Etapes** :
1. Naviguer vers `/admin/users`
2. Cliquer sur l'icone "..." (menu actions) d'un utilisateur
3. Cliquer sur "Modifier"
4. Verifier l'ouverture du dialog en mode edition (titre "Modifier utilisateur")
5. Modifier l'email
6. Cliquer sur "Enregistrer"
7. Verifier le snack bar "Utilisateur modifie avec succes"
8. Verifier que les donnees sont mises a jour dans le tableau
**Donnees de test** : Un utilisateur existant en BDD

---

### [CRITIQUE] Supprimer un utilisateur avec confirmation
**Persona** : Admin avec `users:delete`
**Preconditions** : Un utilisateur cible a supprimer existe
**Etapes** :
1. Naviguer vers `/admin/users`
2. Cliquer sur "..." d'un utilisateur
3. Cliquer sur "Supprimer"
4. Verifier l'ouverture du dialog de confirmation "Confirmer la suppression"
5. Verifier le message "Voulez-vous vraiment supprimer l'utilisateur X ?"
6. Cliquer sur "Confirmer"
7. Verifier le snack bar "Utilisateur supprime"
8. Verifier que l'utilisateur n'apparait plus dans le tableau
**Donnees de test** : Un utilisateur cible (ne pas supprimer l'admin principal)

---

### [HAUT] Annuler la suppression d'un utilisateur
**Persona** : Admin avec `users:delete`
**Preconditions** : Au moins un utilisateur existe
**Etapes** :
1. Naviguer vers `/admin/users`
2. Ouvrir le menu d'un utilisateur, cliquer "Supprimer"
3. Dans le dialog de confirmation, cliquer "Annuler"
4. Verifier que le dialog se ferme
5. Verifier que l'utilisateur est toujours present dans le tableau
**Donnees de test** : Aucune

---

### [HAUT] Changer le role d'un utilisateur
**Persona** : Admin avec `users:write`
**Preconditions** : Au moins deux roles existent
**Etapes** :
1. Naviguer vers `/admin/users`
2. Ouvrir le menu d'un utilisateur
3. Cliquer sur "Changer role"
4. Verifier l'ouverture du `RoleDialog`
5. Selectionner un nouveau role
6. Confirmer
7. Verifier le snack bar "Role modifie avec succes"
8. Verifier que le chip de role est mis a jour dans le tableau
**Donnees de test** : Deux roles disponibles

---

### [HAUT] Reinitialiser le mot de passe d'un utilisateur
**Persona** : Admin avec `users:write`
**Preconditions** : Un utilisateur cible existe
**Etapes** :
1. Naviguer vers `/admin/users`
2. Ouvrir le menu d'un utilisateur
3. Cliquer sur "Reinitialiser MDP"
4. Verifier l'ouverture du `PasswordDialog`
5. Saisir un nouveau mot de passe (min 8 caracteres)
6. Confirmer
7. Verifier le snack bar "Mot de passe reinitialise avec succes"
**Donnees de test** : Nouveau mot de passe : "NouveauMdp123"

---

### [HAUT] Activer/Desactiver un utilisateur via le toggle
**Persona** : Admin avec `users:write`
**Preconditions** : Un utilisateur existe
**Etapes** :
1. Naviguer vers `/admin/users`
2. Localiser un utilisateur actif (`actif = true`)
3. Cliquer sur le `mat-slide-toggle` de la colonne "Statut"
4. Verifier l'appel API `toggleActive`
5. Verifier le snack bar "Utilisateur desactive"
6. Verifier que le toggle est visuellement desactive
7. Recliquer pour reactivar
8. Verifier le snack bar "Utilisateur active"
**Donnees de test** : Un utilisateur existant

---

### [HAUT] Recherche d'utilisateurs par email
**Persona** : Admin avec `users:read`
**Preconditions** : Plusieurs utilisateurs existent
**Etapes** :
1. Naviguer vers `/admin/users`
2. Saisir "admin" dans le champ de recherche
3. Attendre le debounce de 300ms
4. Verifier que seuls les utilisateurs dont l'email contient "admin" sont affiches
5. Verifier le compteur de resultats
6. Effacer le champ de recherche
7. Verifier que tous les utilisateurs reapparaissent
**Donnees de test** : Plusieurs utilisateurs dont certains ont "admin" dans leur email

---

### [HAUT] Filtrer les utilisateurs par role et statut
**Persona** : Admin avec `users:read`
**Preconditions** : Des utilisateurs avec roles/statuts differents existent
**Etapes** :
1. Naviguer vers `/admin/users`
2. Selectionner un role dans le filtre "Role"
3. Verifier que le tableau est filtre
4. Selectionner "Actif" dans le filtre "Statut"
5. Verifier que les filtres se cumulent
6. Cliquer sur "Reinitialiser les filtres" (bouton visible quand etat vide)
7. Verifier que tous les utilisateurs reapparaissent
**Donnees de test** : Utilisateurs avec roles et statuts varies

---

### [HAUT] Trier les utilisateurs par email et date de creation
**Persona** : Admin avec `users:read`
**Preconditions** : Plusieurs utilisateurs existent
**Etapes** :
1. Naviguer vers `/admin/users`
2. Cliquer sur l'en-tete de colonne "Email"
3. Verifier le tri alphabetique ascendant
4. Cliquer a nouveau sur "Email"
5. Verifier le tri descendant
6. Cliquer sur "Cree le"
7. Verifier le tri par date de creation
**Donnees de test** : Au moins 3 utilisateurs

---

### [MOYEN] Pagination des utilisateurs
**Persona** : Admin avec `users:read`
**Preconditions** : Plus de 20 utilisateurs existent (taille de page par defaut)
**Etapes** :
1. Naviguer vers `/admin/users`
2. Verifier que le `MatPaginator` est visible
3. Cliquer sur la page suivante
4. Verifier que la page courante change
5. Verifier que les donnees chargees sont differentes
6. Changer la taille de page a 50
7. Verifier le rechargement avec la nouvelle limite
**Donnees de test** : 21+ utilisateurs en BDD

---

## Categorie 7 — Parcours Admin — CRUD Roles

### [CRITIQUE] Lister les roles existants
**Persona** : Admin avec `roles:read`
**Preconditions** : Authentifie avec permission `roles:read`
**Etapes** :
1. Naviguer vers `/admin/roles`
2. Verifier que le tableau est visible (colonnes : Nom, Permissions, Utilisateurs, Actions)
3. Verifier que les roles systeme ont le badge "Systeme"
4. Verifier que les chips de permissions sont limites a 3 visibles + "+N" si plus
**Donnees de test** : Au moins un role en BDD

---

### [CRITIQUE] Creer un nouveau role avec permissions
**Persona** : Admin avec `roles:write`
**Preconditions** : Authentifie avec `roles:write`
**Etapes** :
1. Naviguer vers `/admin/roles`
2. Cliquer sur "Nouveau role"
3. Verifier l'arrivee sur `/admin/roles/new` (page routee depuis l'EPIC-41 f3)
4. Verifier que tous les modules de permissions sont visibles sans deplier
5. Saisir un nom de role ex: "Gestionnaire Test"
6. Cocher un module entier via "Tout selectionner"
7. Cliquer sur "Creer"
8. Verifier le retour a `/admin/roles` et le snack bar "Role cree"
9. Verifier que le nouveau role apparait dans le tableau
**Donnees de test** : nom="Gestionnaire Test", permissions=["teams:read"]

---

### [CRITIQUE] Abandonner une matrice de permissions en cours de saisie
**Persona** : Admin avec `roles:write`
**Preconditions** : Authentifie, sur `/admin/roles/new`
**Etapes** :
1. Cocher un module de permissions sans rien saisir dans le champ nom
2. Cliquer sur le bouton de retour de l'en-tete
3. Verifier la confirmation "Quitter sans enregistrer"
4. Confirmer : verifier le retour a `/admin/roles`
**Pourquoi** : les cases de la matrice ne sont pas des champs de saisie. Si
elles vivaient hors du formulaire reactif, `form.dirty` resterait faux et le
travail serait perdu sans un mot.

---

### [CRITIQUE] Un role inconnu n'affiche pas un formulaire vide
**Persona** : Admin avec `roles:read`
**Preconditions** : Authentifie
**Etapes** :
1. Naviguer vers `/admin/roles/edit/999999`
2. Verifier l'etat d'erreur "Impossible de charger ce role" et son bouton de reessai
3. Verifier qu'aucun champ de formulaire n'est rendu

---

### [CRITIQUE] Un compte portant le role cree accede aux pages accordees
**Persona** : Admin avec `roles:write` et `users:write`
**Preconditions** : Authentifie
**Etapes** :
1. Creer un role ne portant que le module Jeux
2. Rattacher un compte de test a ce role
3. Se connecter avec ce compte
4. Verifier que `/admin/games` s'ouvre
5. Verifier que `/admin/sponsors` renvoie au tableau de bord
6. Nettoyer : supprimer le compte puis le role

---

### [CRITIQUE] Modifier les permissions d'un role
**Persona** : Admin avec `roles:write`
**Preconditions** : Un role non-systeme existe
**Etapes** :
1. Naviguer vers `/admin/roles`
2. Ouvrir le menu "..." d'un role non-systeme
3. Cliquer sur "Modifier"
4. Verifier l'arrivee sur `/admin/roles/edit/:id` avec les permissions pre-cochees
5. Ajouter ou retirer des permissions dans la matrice
6. Cliquer sur "Enregistrer"
7. Verifier le retour a `/admin/roles` et le snack bar "Role mis a jour"
7. Verifier que les chips de permissions sont mis a jour dans le tableau
**Donnees de test** : Un role modifiable (non-systeme)

---

### [CRITIQUE] Supprimer un role sans utilisateurs
**Persona** : Admin avec `roles:delete`
**Preconditions** : Un role sans utilisateurs assignes existe (non-systeme)
**Etapes** :
1. Naviguer vers `/admin/roles`
2. Ouvrir le menu d'un role avec 0 utilisateurs et non-systeme
3. Cliquer sur "Supprimer"
4. Confirmer dans le dialog
5. Verifier le snack bar "Role supprime"
6. Verifier que le role disparait du tableau
**Donnees de test** : Un role vide non-systeme

---

### [HAUT] Tentative de suppression d'un role avec utilisateurs
**Persona** : Admin avec `roles:delete`
**Preconditions** : Un role avec des utilisateurs assignes existe
**Etapes** :
1. Naviguer vers `/admin/roles`
2. Ouvrir le menu d'un role ayant des utilisateurs (colonne "Utilisateurs" > 0)
3. Verifier que le bouton "Supprimer" n'est pas affiche (condition `!role.isSystem` et doit aussi etre vide)
   — OU si le bouton est present : cliquer dessus
4. Verifier le snack bar d'erreur "Impossible de supprimer ce role, X utilisateur(s) l'utilisent"
5. Verifier que le role n'est pas supprime
**Donnees de test** : Un role avec au moins un utilisateur assigne

---

### [HAUT] Verification que les roles systeme ne peuvent pas etre supprimes
**Persona** : Admin avec `roles:delete`
**Preconditions** : Un role systeme (`isSystem: true`) existe
**Etapes** :
1. Naviguer vers `/admin/roles`
2. Localiser un role avec le badge "Systeme"
3. Ouvrir le menu "..."
4. Verifier que le bouton "Supprimer" n'est pas visible (condition `!role.isSystem`)
5. Verifier que seul "Modifier" est propose
**Donnees de test** : Role systeme existant

---

## Categorie 8 — Parcours Admin — CRUD Equipes

### [CRITIQUE] Lister les equipes
**Persona** : Admin avec `teams:read`
**Preconditions** : Authentifie avec `teams:read`
**Etapes** :
1. Naviguer vers `/admin/teams`
2. Verifier que le skeleton de chargement apparait puis disparait
3. Verifier que la liste des equipes est affichee (avec image, nom, jeu, nombre de membres)
4. Verifier que les toggles actif/inactif sont visibles
**Donnees de test** : Au moins une equipe en BDD

---

### [CRITIQUE] Creer une nouvelle equipe
**Persona** : Admin avec `teams:read`
**Preconditions** : Authentifie, au moins un jeu existe
**Etapes** :
1. Naviguer vers `/admin/teams`
2. Cliquer sur "Nouvelle equipe"
3. Verifier l'ouverture du `TeamFormDialog`
4. Saisir le nom de l'equipe "Equipe Test E2E"
5. Selectionner un jeu dans la liste
6. Optionnellement uploader une image
7. Cliquer sur "Creer"
8. Verifier la fermeture du dialog
9. Verifier que "Equipe Test E2E" apparait dans la liste
**Donnees de test** : nom="Equipe Test E2E", jeu=un jeu existant

---

### [CRITIQUE] Modifier une equipe existante
**Persona** : Admin avec `teams:read`
**Preconditions** : Une equipe existe
**Etapes** :
1. Naviguer vers `/admin/teams`
2. Cliquer sur l'icone "Modifier" (crayon) d'une equipe
3. Verifier l'ouverture du dialog en mode edition
4. Modifier le nom
5. Cliquer sur "Enregistrer"
6. Verifier la mise a jour dans la liste
**Donnees de test** : Une equipe existante

---

### [CRITIQUE] Supprimer une equipe avec confirmation
**Persona** : Admin avec `teams:read`
**Preconditions** : Une equipe cible existe
**Etapes** :
1. Naviguer vers `/admin/teams`
2. Cliquer sur l'icone "Supprimer" (poubelle) d'une equipe
3. Verifier l'ouverture du `ConfirmDialog`
4. Confirmer la suppression
5. Verifier que l'equipe disparait de la liste
**Donnees de test** : Une equipe cible a supprimer

---

### [HAUT] Activer/Desactiver une equipe
**Persona** : Admin avec `teams:read`
**Preconditions** : Une equipe existe
**Etapes** :
1. Naviguer vers `/admin/teams`
2. Cliquer sur le `mat-slide-toggle` d'une equipe
3. Verifier le snack bar "Equipe [nom] desactivee/activee"
4. Verifier la mise a jour visuelle du toggle
**Donnees de test** : Une equipe

---

### [HAUT] Reordonner les equipes par drag-and-drop
**Persona** : Admin avec `teams:read`
**Preconditions** : Au moins deux equipes existent
**Etapes** :
1. Naviguer vers `/admin/teams`
2. Faire un drag-and-drop de la premiere equipe vers la deuxieme position
3. Verifier que l'appel `reorderTeams` est effectue
4. Verifier que l'ordre est persist (recharger la page, l'ordre reste)
**Donnees de test** : Deux equipes au minimum

---

### [CRITIQUE] Gerer les membres d'une equipe — ajouter un membre
**Persona** : Admin avec `teams:read`
**Preconditions** : Une equipe existe
**Etapes** :
1. Naviguer vers `/admin/teams`
2. Cliquer sur l'icone "Gerer les membres" (icone group) d'une equipe
3. Verifier l'arrivee sur la page `/admin/teams/:id/members`
4. Cliquer sur "Ajouter un membre"
5. Remplir le gamertag, le role dans l'equipe
6. Optionnellement ajouter les reseaux sociaux (Twitch, Twitter, etc.)
7. Sauvegarder
8. Verifier que le membre apparait dans la liste des membres
9. Verifier que le compteur "X membre(s)" est mis a jour
**Donnees de test** : gamertag="JoueurTest", role="Support"

---

### [HAUT] Gerer les membres — supprimer un membre
**Persona** : Admin avec `teams:read`
**Preconditions** : Une equipe avec au moins un membre
**Etapes** :
1. Ouvrir la page de gestion des membres d'une equipe
2. Cliquer sur l'action "Supprimer" d'un membre
3. Confirmer dans le dialog de confirmation
4. Verifier que le membre disparait de la liste
5. Verifier la mise a jour du compteur de membres
**Donnees de test** : Un membre existant

---

### [CRITIQUE] Gerer le staff de coaching — ajouter un coach
**Persona** : Admin avec `teams:read` et `coaching_staff:write`
**Preconditions** : Une equipe existe et est publiee
**Etapes** :
1. Naviguer vers `/admin/teams`
2. Cliquer sur l'icone "Gerer le coaching staff" (icone sports) d'une equipe
3. Verifier l'arrivee sur la page `/admin/teams/:id/coaching`
4. Cliquer sur "Ajouter un coach"
5. Remplir le pseudo et le role, optionnellement les reseaux sociaux
6. Sauvegarder
7. Verifier que le coach apparait dans la liste et que le formulaire se replie
8. Ouvrir la fiche publique de l'equipe et verifier que le coach y figure
**Donnees de test** : pseudo="CoachE2E", role="Head Coach E2E"

---

### [HAUT] Gerer le staff de coaching — reordonner au clavier
**Persona** : Admin avec `teams:read` et `coaching_staff:write`
**Preconditions** : Une equipe avec au moins deux coachs
**Etapes** :
1. Ouvrir la page `/admin/teams/:id/coaching`
2. Placer le focus sur la poignee de la premiere ligne
3. Espace pour saisir, Fleche bas pour deplacer, Espace pour deposer
4. Verifier que l'ordre affiche a change et que la region aria-live l'annonce
5. Recharger la page et verifier que l'ordre vient du serveur
**Donnees de test** : Deux coachs au minimum

---

## Categorie 9 — Parcours Admin — CRUD Jeux

### [CRITIQUE] Lister les jeux
**Persona** : Admin avec `games:read`
**Preconditions** : Authentifie avec `games:read`
**Etapes** :
1. Naviguer vers `/admin/games`
2. Verifier le skeleton de chargement puis la liste des jeux
3. Verifier les informations affichees : image, nom, cle
**Donnees de test** : Au moins un jeu en BDD

---

### [CRITIQUE] Creer un jeu
**Persona** : Admin avec `games:read`
**Preconditions** : Authentifie
**Etapes** :
1. Naviguer vers `/admin/games`
2. Cliquer sur "Nouveau jeu"
3. Saisir le nom "Jeu Test"
4. Saisir la cle "jeu-test"
5. Optionnellement uploader une image
6. Confirmer
7. Verifier que "Jeu Test" apparait dans la liste
**Donnees de test** : nom="Jeu Test", cle="jeu-test"

---

### [HAUT] Initialiser les jeux par defaut (seed)
**Persona** : Admin avec `games:read`
**Preconditions** : Aucun jeu en BDD
**Etapes** :
1. Naviguer vers `/admin/games`
2. Verifier l'etat vide avec le bouton "Initialiser les jeux par defaut"
3. Cliquer sur ce bouton
4. Verifier que les jeux par defaut (LoL, Valorant, etc.) apparaissent
**Donnees de test** : Base de donnees vide de jeux

---

### [HAUT] Reordonner les jeux par drag-and-drop
**Persona** : Admin avec `games:read`
**Preconditions** : Au moins deux jeux existent
**Etapes** :
1. Naviguer vers `/admin/games`
2. Faire un drag-and-drop d'un jeu
3. Verifier l'appel `reorderGames`
4. Recharger la page et verifier que l'ordre est persistant
**Donnees de test** : Deux jeux existants

---

### [HAUT] Activer/Desactiver un jeu
**Persona** : Admin avec `games:read`
**Preconditions** : Un jeu existe
**Etapes** :
1. Naviguer vers `/admin/games`
2. Cliquer sur le toggle d'un jeu
3. Verifier le snack bar de confirmation
4. Verifier que le changement se reflate sur la page publique `/structure/equipes` (le logo du jeu)
**Donnees de test** : Un jeu existant

---

## Categorie 10 — Parcours Admin — CRUD Sponsors

### [CRITIQUE] Creer un sponsor avec nom et activer
**Persona** : Admin avec `sponsors:read`
**Preconditions** : Authentifie
**Etapes** :
1. Naviguer vers `/admin/sponsors`
2. Cliquer sur "Nouveau sponsor"
3. Saisir le nom "Sponsor Test"
4. Cliquer sur "Creer"
5. Verifier que le sponsor apparait dans la liste
**Donnees de test** : nom="Sponsor Test"

---

### [CRITIQUE] Gerer les images d'un sponsor
**Persona** : Admin avec `sponsors:read`
**Preconditions** : Un sponsor existe
**Etapes** :
1. Naviguer vers `/admin/sponsors`
2. Cliquer sur l'icone "Gerer les images" d'un sponsor
3. Verifier l'arrivee sur la page `/admin/sponsors/:id/images`, sans aucune modale
4. Verifier que les trois emplacements sont rendus (logo, secondaire 1, secondaire 2)
5. Televerser une image dans l'emplacement principal (JPEG/PNG/WebP, < 5MB)
6. Verifier que l'image occupe l'emplacement et que le compteur de la liste passe a 1
7. Activer le sponsor, ouvrir `/structure/sponsors` et verifier que le logo y figure
8. Revenir sur la page images, supprimer l'image et confirmer
9. Verifier que l'emplacement redevient une zone de televersement
**Donnees de test** : Image test < 5MB

---

### [HAUT] Images de sponsor — URL partageable, fil d'Ariane et retour
**Persona** : Admin avec `sponsors:read`
**Preconditions** : Un sponsor existe
**Etapes** :
1. Ouvrir la page `/admin/sponsors/:id/images` par son URL directe
2. Verifier que le titre porte le nom du sponsor
3. Verifier que le fil d'Ariane affiche `Admin / Contenu / Sponsors / Images`
4. Cliquer sur le bouton de retour, verifier l'arrivee sur `/admin/sponsors`
5. Rouvrir la page puis utiliser le retour arriere du navigateur : meme resultat
**Donnees de test** : Aucune

---

### [HAUT] Images de sponsor — identifiant inconnu
**Persona** : Admin avec `sponsors:read`
**Preconditions** : Authentifie
**Etapes** :
1. Naviguer vers `/admin/sponsors/999999/images`
2. Verifier qu'un etat d'erreur bloquant s'affiche (« Ce sponsor n'existe pas. »)
3. Verifier qu'un bouton "Reessayer" est propose
4. Verifier qu'aucun emplacement d'image n'est rendu — une URL fausse ne doit pas
   ressembler a un sponsor sans image
**Donnees de test** : Aucune

---

### [CRITIQUE] Gerer les liens d'un sponsor
**Persona** : Admin avec `sponsors:read`
**Preconditions** : Un sponsor existe
**Etapes** :
1. Naviguer vers `/admin/sponsors`
2. Cliquer sur l'icone "Gerer les liens" d'un sponsor
3. Verifier l'arrivee sur la page `/admin/sponsors/:id/liens`, sans aucune modale
4. Verifier que le formulaire n'est pas monte tant qu'on n'a pas clique sur "Ajouter un lien"
5. Ajouter un lien principal (label + URL) et verifier qu'il rejoint la liste
6. Verifier que le compteur de liens de la liste des sponsors passe a 1
7. Activer le sponsor, ouvrir `/structure/sponsors` et verifier que le lien y figure
8. Modifier le label du lien, verifier la mise a jour dans la liste
9. Supprimer le lien, confirmer, verifier le retour a l'etat vide
**Donnees de test** : URL="https://exemple-e2e.test/", label="Site officiel E2E"

---

### [HAUT] Liens de sponsor — URL partageable, fil d'Ariane et retour
**Persona** : Admin avec `sponsors:read`
**Preconditions** : Un sponsor existe
**Etapes** :
1. Ouvrir la page `/admin/sponsors/:id/liens` par son URL directe
2. Verifier que le titre porte le nom du sponsor
3. Verifier que le fil d'Ariane affiche `Admin / Contenu / Sponsors / Liens`
4. Cliquer sur le bouton de retour, verifier l'arrivee sur `/admin/sponsors`
5. Rouvrir la page puis utiliser le retour arriere du navigateur : meme resultat
**Donnees de test** : Aucune

---

### [HAUT] Liens de sponsor — identifiant inconnu et validation d'URL
**Persona** : Admin avec `sponsors:read`
**Preconditions** : Authentifie
**Etapes** :
1. Naviguer vers `/admin/sponsors/999999/liens`
2. Verifier qu'un etat d'erreur bloquant s'affiche (« Ce sponsor n'existe pas. »)
3. Verifier qu'un bouton "Reessayer" est propose et qu'aucun lien n'est rendu
4. Sur un sponsor valide, saisir une URL sans schema ("exemple.com")
5. Verifier le message "URL invalide" et le bouton d'enregistrement desactive
**Donnees de test** : URL invalide="exemple.com"

---

### [HAUT] Liens de sponsor — garde de sortie
**Persona** : Admin avec `sponsors:read`
**Preconditions** : Un sponsor existe
**Etapes** :
1. Ouvrir `/admin/sponsors/:id/liens`, cliquer sur "Ajouter un lien"
2. Saisir un label, puis cliquer sur le bouton de retour
3. Verifier qu'une confirmation "Quitter sans enregistrer" s'affiche
4. Annuler et verifier qu'on reste sur la page, saisie intacte
**Donnees de test** : label="Brouillon"

---

### [HAUT] Activer/Desactiver un sponsor et verifier la visibilite publique
**Persona** : Admin avec `sponsors:read`
**Preconditions** : Un sponsor avec image existe
**Etapes** :
1. Activer un sponsor dans `/admin/sponsors`
2. Naviguer vers `/structure/sponsors` (page publique)
3. Verifier que le sponsor est visible
4. Retourner en admin, desactiver le sponsor
5. Recharger `/structure/sponsors`
6. Verifier que le sponsor n'est plus visible
**Donnees de test** : Un sponsor avec image

---

### [HAUT] Reordonner les sponsors par drag-and-drop
**Persona** : Admin avec `sponsors:read`
**Preconditions** : Au moins deux sponsors existent
**Etapes** :
1. Naviguer vers `/admin/sponsors`
2. Faire un drag-and-drop pour reordonner
3. Verifier l'appel API `reorder`
4. Verifier la persistance apres rechargement
**Donnees de test** : Deux sponsors

---

## Categorie 11 — Parcours Admin — CRUD Staff

### [CRITIQUE] Lister les membres du staff par categorie
**Persona** : Admin avec `staff:read`
**Preconditions** : Authentifie avec `staff:read`
**Etapes** :
1. Naviguer vers `/admin/staff`
2. Verifier les 3 onglets de categorie : ADMIN, HEADSTAFF, AMBASSADOR
3. Verifier que la categorie ADMIN est selectionnee par defaut
4. Cliquer sur l'onglet HEADSTAFF
5. Verifier que la liste change
6. Cliquer sur AMBASSADOR
7. Verifier la liste des ambassadeurs
**Donnees de test** : Des membres dans au moins deux categories

---

### [CRITIQUE] Ajouter un membre staff
**Persona** : Admin avec `staff:read`
**Preconditions** : Authentifie
**Etapes** :
1. Naviguer vers `/admin/staff`
2. Cliquer sur "Ajouter un membre"
3. Verifier l'ouverture du `StaffFormDialog` avec la categorie courante pre-selectionnee
4. Saisir le nom "Staff Test"
5. Saisir le role "Testeur"
6. Optionnellement uploader une photo
7. Confirmer
8. Verifier que "Staff Test" apparait dans la liste de la categorie
**Donnees de test** : nom="Staff Test", role="Testeur"

---

### [HAUT] Modifier et supprimer un membre staff
**Persona** : Admin avec `staff:read`
**Preconditions** : Un membre staff existe
**Etapes** :
1. Naviguer vers `/admin/staff`
2. Cliquer sur l'icone "Modifier" d'un membre
3. Modifier le nom
4. Sauvegarder — verifier la mise a jour
5. Cliquer sur "Supprimer" d'un autre membre
6. Confirmer dans le dialog
7. Verifier la disparition du membre
**Donnees de test** : Deux membres staff existants

---

### [HAUT] Reordonner les membres staff par categorie
**Persona** : Admin avec `staff:read`
**Preconditions** : Au moins deux membres dans la meme categorie
**Etapes** :
1. Selectionner une categorie avec 2+ membres
2. Faire un drag-and-drop pour reordonner
3. Verifier l'appel `reorderMembers`
4. Verifier la persistance
**Donnees de test** : Deux membres dans la meme categorie

---

## Categorie 12 — Parcours Admin — CRUD Recrutement

### [CRITIQUE] Creer une offre de recrutement
**Persona** : Admin avec `recrutement:read`
**Preconditions** : Authentifie
**Etapes** :
1. Naviguer vers `/admin/recruitment`
2. Cliquer sur "Nouvelle offre"
3. Verifier l'ouverture du `RecruitmentFormDialog`
4. Saisir le titre "Joueur LoL Test"
5. Saisir le type (poste)
6. Saisir la description
7. Activer l'offre
8. Confirmer
9. Verifier que l'offre apparait dans la liste admin
10. Verifier que l'offre apparait sur `/structure/recrutement` (page publique)
**Donnees de test** : titre="Joueur LoL Test", type="Esport"

---

### [CRITIQUE] Activer/Desactiver une offre et verifier la visibilite publique
**Persona** : Admin avec `recrutement:read`
**Preconditions** : Une offre existe
**Etapes** :
1. Naviguer vers `/admin/recruitment`
2. Cliquer sur le toggle d'une offre pour la desactiver
3. Verifier le snack bar "Offre desactivee"
4. Naviguer vers `/structure/recrutement` (page publique)
5. Verifier que l'offre n'est plus visible
6. Retourner en admin, reactivar l'offre
7. Recharger la page publique
8. Verifier que l'offre reapparait
**Donnees de test** : Une offre existante

---

### [HAUT] Reordonner les offres par drag-and-drop
**Persona** : Admin avec `recrutement:read`
**Preconditions** : Au moins deux offres existent
**Etapes** :
1. Naviguer vers `/admin/recruitment`
2. Faire un drag-and-drop d'une offre
3. Verifier la persistance de l'ordre apres rechargement
**Donnees de test** : Deux offres existantes

---

### [HAUT] Supprimer une offre avec confirmation
**Persona** : Admin avec `recrutement:read`
**Preconditions** : Une offre cible existe
**Etapes** :
1. Naviguer vers `/admin/recruitment`
2. Cliquer sur "Supprimer" d'une offre
3. Verifier le `ConfirmDialog`
4. Confirmer
5. Verifier que l'offre disparait
**Donnees de test** : Une offre a supprimer

---

## Categorie 13 — Parcours Admin — CRUD Articles

### [CRITIQUE] Creer un nouvel article
**Persona** : Admin avec `articles:read`
**Preconditions** : Authentifie, au moins une categorie d'article existe
**Etapes** :
1. Naviguer vers `/admin/articles`
2. Cliquer sur "Nouvel article" ou sur le lien `/admin/articles/new`
3. Verifier le chargement de l'editeur (EditorJS)
4. Remplir le titre "Article Test E2E"
5. Le slug doit se generer automatiquement depuis le titre ("article-test-e2e")
6. Selectionner une categorie
7. Ajouter du contenu dans l'editeur
8. Cliquer sur "Sauvegarder"
9. Verifier le message de succes
10. Verifier que l'article apparait dans la liste `/admin/articles`
**Donnees de test** : titre="Article Test E2E", categorie=existante

---

### [CRITIQUE] Publier et depublier un article
**Persona** : Admin avec `articles:read`
**Preconditions** : Un article existe en etat non publie
**Etapes** :
1. Naviguer vers `/admin/articles`
2. Localiser un article non publie (toggle "Publie" desactive)
3. Cliquer sur le toggle "Publie"
4. Verifier le snack bar "[titre] publie"
5. Verifier que l'article apparait sur `/articles` (page publique)
6. Recliquer le toggle pour depublier
7. Verifier le snack bar "[titre] depublie"
8. Verifier que l'article n'apparait plus sur la page publique
**Donnees de test** : Un article existant

---

### [CRITIQUE] Mettre un article en avant (featured)
**Persona** : Admin avec `articles:read`
**Preconditions** : Un article publie existe
**Etapes** :
1. Naviguer vers `/admin/articles`
2. Cliquer sur le toggle "Featured" d'un article publie
3. Verifier le snack bar "[titre] mis en avant"
4. Naviguer vers `/articles` (public)
5. Verifier que l'article apparait dans la section hero/featured
**Donnees de test** : Un article publie

---

### [HAUT] Modifier un article existant
**Persona** : Admin avec `articles:read`
**Preconditions** : Un article existe
**Etapes** :
1. Naviguer vers `/admin/articles`
2. Cliquer sur l'icone "Modifier" d'un article
3. Verifier la navigation vers `/admin/articles/edit/:id`
4. Modifier le titre
5. Sauvegarder
6. Verifier que les modifications sont visibles dans la liste
**Donnees de test** : Un article existant

---

### [HAUT] Supprimer un article avec confirmation
**Persona** : Admin avec `articles:read`
**Preconditions** : Un article cible existe
**Etapes** :
1. Naviguer vers `/admin/articles`
2. Cliquer sur "Supprimer" d'un article
3. Verifier le `ConfirmDialog` avec message "Cette action est irréversible"
4. Confirmer
5. Verifier que l'article disparait de la liste
**Donnees de test** : Un article a supprimer

---

### [HAUT] Trier les articles par titre, date, categorie
**Persona** : Admin avec `articles:read`
**Preconditions** : Plusieurs articles de categories differentes existent
**Etapes** :
1. Naviguer vers `/admin/articles`
2. Cliquer sur l'en-tete "Titre" pour trier par titre ascendant
3. Verifier le tri alphabetique
4. Cliquer sur "Date" pour trier par date descendante
5. Verifier le tri chronologique inverse
6. Cliquer sur "Type" pour trier par categorie
**Donnees de test** : 3+ articles de categories differentes

---

### [MOYEN] Gerer les categories d'articles
**Persona** : Admin avec `articles:read`
**Preconditions** : Authentifie
**Etapes** :
1. Naviguer vers `/admin/articles`
2. Cliquer sur le bouton "Gerer les categories"
3. Verifier l'ouverture du `ArticleCategoriesComponent` dialog
4. Ajouter une categorie
5. Verifier son apparition
6. Supprimer la categorie
7. Verifier sa disparition
**Donnees de test** : nom de categorie="Categorie Test"

---

## Categorie 14 — Parcours Admin — Configuration

### [CRITIQUE] Modifier les informations generales du site
**Persona** : Admin avec `config:read`
**Preconditions** : Authentifie avec `config:read`
**Etapes** :
1. Naviguer vers `/admin/config`
2. Verifier que le formulaire de configuration se charge
3. Verifier que les sections sont collapsibles (cliquer sur une section pour l'ouvrir)
4. Modifier le champ "Nom du site"
5. Modifier le champ "Email de contact"
6. Cliquer sur "Sauvegarder"
7. Verifier le message de succes "Configuration sauvegardee avec succes"
8. Recharger la page et verifier que les valeurs sont persistantes
**Donnees de test** : Nouveau nom, email valide

---

### [CRITIQUE] Modifier les liens des reseaux sociaux
**Persona** : Admin avec `config:read`
**Preconditions** : Authentifie
**Etapes** :
1. Naviguer vers `/admin/config`
2. Ouvrir la section reseaux sociaux
3. Modifier l'URL Twitter/Discord/Instagram/YouTube/Twitch
4. Sauvegarder
5. Verifier que les liens mis a jour apparaissent sur la page publique (header/footer)
**Donnees de test** : URL valides (format `https://...`)

---

### [CRITIQUE] Toggler la visibilite des pages publiques
**Persona** : Admin avec `config:read`
**Preconditions** : Authentifie
**Etapes** :
1. Naviguer vers `/admin/config`
2. Desactiver la visibilite de la page "Shop" (`page_shop_visible = false`)
3. Sauvegarder
4. Naviguer vers `/boutique`
5. Verifier que la page est masquee ou inaccessible (redirection ou contenu cache)
6. Retourner en admin, reactiver la page Shop
7. Verifier que `/boutique` est de nouveau accessible
**Donnees de test** : Aucune

---

### [HAUT] Valider les URLs des reseaux sociaux — format invalide
**Persona** : Admin avec `config:read`
**Preconditions** : Sur `/admin/config`
**Etapes** :
1. Naviguer vers `/admin/config`
2. Saisir une URL invalide dans le champ Discord (ex: "pas-une-url")
3. Cliquer sur "Sauvegarder"
4. Verifier que la validation `pattern(/^https?:\/\/.+/)` bloque la sauvegarde
5. Verifier le message d'erreur de validation
**Donnees de test** : URL invalide "pas-une-url"

---

### [HAUT] Valider le webhook Discord — format attendu
**Persona** : Admin avec `config:read`
**Preconditions** : Sur `/admin/config`
**Etapes** :
1. Naviguer vers `/admin/config`
2. Ouvrir la section notifications de contact
3. Saisir une URL webhook invalide (ne commencant pas par `https://discord.com/api/webhooks/`)
4. Verifier le message de validation
**Donnees de test** : URL invalide="https://example.com/webhook"

---

### [HAUT] Upload de l'image OG (Open Graph)
**Persona** : Admin avec `config:read`
**Preconditions** : Authentifie
**Etapes** :
1. Naviguer vers `/admin/config`
2. Ouvrir la section Open Graph
3. Utiliser le composant `ImageUploadComponent` pour uploader une image
4. Verifier que l'URL de l'image est renseignee dans `og_image`
5. Sauvegarder
6. Verifier que la valeur est persistante
**Donnees de test** : Image < 5MB, format JPEG/PNG/WebP

---

## Categorie 15 — Parcours Admin — Analytics

### [HAUT] Consulter le dashboard analytics
**Persona** : Admin avec `analytics:read`
**Preconditions** : Authentifie avec `analytics:read`, Google Analytics configure
**Etapes** :
1. Naviguer vers `/admin/analytics`
2. Verifier que le `DateRangePicker` est visible
3. Verifier que les KPI cards se chargent (skeleton puis donnees)
4. Verifier le graphe de visiteurs
5. Verifier le tableau des pages les plus vues
6. Verifier les graphes sources de trafic et devices
7. Verifier la carte geo
8. Verifier le compteur realtime
**Donnees de test** : GA configure

---

### [MOYEN] Dashboard analytics — GA non configure
**Persona** : Admin avec `analytics:read`
**Preconditions** : GA non configure (renvoie 503)
**Etapes** :
1. Naviguer vers `/admin/analytics` ou `/admin` (dashboard)
2. Verifier que le badge "Non configure" est affiche
3. Verifier le message explicatif "Analytics non configure"
4. Verifier qu'aucune erreur JavaScript non geree n'apparait
**Donnees de test** : GA non configure

---

### [MOYEN] Modifier la plage de dates analytics
**Persona** : Admin avec `analytics:read`
**Preconditions** : GA configure
**Etapes** :
1. Naviguer vers `/admin/analytics`
2. Changer la plage de dates via le `DateRangePicker`
3. Verifier que les donnees sont rechargees avec la nouvelle plage
4. Verifier que les KPI cards se mettent a jour
**Donnees de test** : GA configure, plage de 30 jours

---

## Categorie 16 — Cas d'erreur / Edge Cases

### [CRITIQUE] Comportement lors d'une erreur reseau (API inaccessible)
**Persona** : Visiteur / Admin
**Preconditions** : Aucune
**Etapes** :
1. Simuler une erreur reseau (intercepter les requetes `/api/*`)
2. Naviguer vers `/structure/equipes`
3. Verifier que le message d'erreur "Erreur lors du chargement des donnees" est affiche
4. Verifier qu'aucune erreur JavaScript non capturee n'apparait en console
5. Verifier que le bouton "Reessayer" (si present) est cliquable
**Donnees de test** : Interception reseau (Playwright `page.route()`)

---

### [CRITIQUE] Expiration du token pendant la session
**Persona** : Admin
**Preconditions** : Authentifie
**Etapes** :
1. S'authentifier
2. Simuler un token expire en remplacant le token dans `localStorage` par une valeur invalide
3. Effectuer une action qui declenche un appel API (ex: charger une page admin)
4. L'intercepteur HTTP recoit une 401
5. Verifier que `clearSession()` est appelee
6. Verifier la redirection automatique vers `/auth/login`
7. Verifier que le token est supprime de `localStorage`
**Donnees de test** : Token invalide injecte

---

### [HAUT] Navigation vers une route inexistante — fallback 404
**Persona** : Visiteur
**Preconditions** : Aucune
**Etapes** :
1. Naviguer vers `/une-page-qui-nexiste-absolument-pas`
2. Verifier la redirection vers `/404` (fallback `**`)
3. Verifier qu'un message 404 est affiche
4. Verifier que le header et footer sont toujours presents (MainLayout)
**Donnees de test** : Aucune

---

### [HAUT] Acces a `/admin/teams/:id` invalide — redirection
**Persona** : Visiteur/Admin
**Preconditions** : Aucune
**Etapes** :
1. Naviguer vers `/structure/equipes/equipe-inexistante`
2. Verifier que l'erreur est capturee dans le composant
3. Verifier le message "Equipe introuvable"
4. Verifier la redirection automatique vers `/structure/equipes` apres 2 secondes
**Donnees de test** : Slug invalide

---

### [HAUT] Formulaire de connexion — email au format invalide
**Persona** : Admin
**Preconditions** : Sur `/auth/login`
**Etapes** :
1. Saisir "pas-un-email" dans le champ email
2. Toucher le champ (blur)
3. Verifier le message "Email invalide"
4. Verifier que le bouton "Se connecter" reste desactive
**Donnees de test** : "pas-un-email"

---

### [HAUT] Telechargement de fichier trop lourd dans la candidature
**Persona** : Candidat
**Preconditions** : Sur le formulaire de candidature
**Etapes** :
1. Attacher un fichier > 5MB comme CV
2. Verifier le comportement : soit un message d'erreur cote client, soit le rejet par l'API avec message d'erreur affiche
3. Verifier que le signal `submitError` est mis a jour
**Donnees de test** : Fichier > 5MB

---

### [MOYEN] Etat vide — aucune equipe active publique
**Persona** : Visiteur
**Preconditions** : Aucune equipe active en BDD
**Etapes** :
1. Naviguer vers `/structure/equipes`
2. Verifier que l'etat vide est affiche (pas d'erreur, pas de crash)
3. Verifier qu'aucun skeleton ne reste bloque en etat de chargement
**Donnees de test** : Aucune equipe avec `active: true`

---

### [MOYEN] Etat vide — aucun article publie
**Persona** : Visiteur
**Preconditions** : Aucun article publie
**Etapes** :
1. Naviguer vers `/articles`
2. Verifier que l'etat vide est affiche proprement
3. Verifier l'absence d'erreurs console
**Donnees de test** : Aucun article avec `published: true`

---

### [MOYEN] Etat vide — aucune offre de recrutement active
**Persona** : Visiteur
**Preconditions** : Aucune offre active
**Etapes** :
1. Naviguer vers `/structure/recrutement`
2. Verifier l'etat vide : message explicatif visible
3. Verifier l'absence d'erreurs JavaScript
**Donnees de test** : Aucune offre avec `active: true`

---

### [MOYEN] Acces au profil sans etre authentifie
**Persona** : Visiteur
**Preconditions** : Aucun token en localStorage
**Etapes** :
1. Vider `localStorage`
2. Naviguer vers `/profile`
3. Verifier que l'`authGuard` redirige vers `/auth/login`
**Donnees de test** : Aucune

---

### [BAS] Persistence du token apres rechargement
**Persona** : Admin
**Preconditions** : Authentifie
**Etapes** :
1. S'authentifier
2. Verifier le token dans `localStorage['dvg_auth_token']`
3. Recharger la page (`F5`)
4. Verifier que l'utilisateur est toujours authentifie (pas redirige vers login)
5. Verifier que le profil est recharge via `GET /api/auth/me`
6. Verifier que le contenu de `/admin` est affiche
**Donnees de test** : email="admin@teamdivergentes.fr", password="admin123"

---

### [BAS] Responsive mobile — navigation publique
**Persona** : Visiteur
**Preconditions** : Viewport mobile (375x667 px)
**Etapes** :
1. Simuler un viewport mobile (375x667)
2. Naviguer vers `/`
3. Verifier que le menu hamburger ou la navigation mobile est visible
4. Verifier que la page d'accueil est lisible et sans overflow horizontal
5. Naviguer vers `/structure/equipes`
6. Verifier que le slider mobile des membres d'equipe fonctionne (swipe gauche/droite)
7. Naviguer vers `/contact`
8. Verifier que le formulaire est utilisable sur mobile
**Donnees de test** : Viewport 375x667

---

### [BAS] Responsive mobile — panel admin
**Persona** : Admin
**Preconditions** : Authentifie, viewport mobile
**Etapes** :
1. S'authentifier sur un viewport 375x667
2. Verifier que la sidebar admin est accessible (burger menu ou drawer)
3. Naviguer vers `/admin/teams`
4. Verifier que les actions (toggle, modifier, supprimer) sont accessibles
5. Verifier que les colonnes non critiques sont masquees sur mobile (ex: `createdAt` dans users)
**Donnees de test** : Viewport 375x667

---

## Recapitulatif par priorite et volume

| Priorite | Nombre de parcours |
|---|---|
| CRITIQUE | 32 |
| HAUT | 37 |
| MOYEN | 14 |
| BAS | 5 |
| **TOTAL** | **88** |

## Donnees de test transversales requises

| Donnee | Valeur | Usage |
|---|---|---|
| Admin principal | admin@teamdivergentes.fr / admin123 | Tous les tests admin |
| Token invalide | `token.invalide` | Tests d'expiration |
| Fichier CV test | PDF < 5MB | Tests recrutement |
| Image test | JPEG < 5MB | Tests upload |
| Fichier trop lourd | Fichier > 5MB | Tests de limite |
| Equipe active | Cree via admin avant les tests | Tests pages equipes |
| Offre recrutement active | Cree via admin avant les tests | Tests recrutement |
| Article publie | Cree via admin avant les tests | Tests articles |
| Sponsor avec image | Cree via admin avant les tests | Tests sponsors |
| Role sans utilisateurs | Cree via admin avant les tests | Tests suppression role |
