# Guide Pas-à-Pas : Déploiement du Dashboard Web en Ligne

Ce guide détaillé vous explique comment mettre en ligne votre Dashboard Web **Compass Solution POS** sur **Vercel** (recommandé) ou **Netlify**, afin de pouvoir consulter vos rapports à distance depuis n'importe quel smartphone, tablette ou ordinateur.

---

## Sommaire
1. [Prérequis](#1-prérequis)
2. [Option A : Déploiement sur Vercel (Recommandé)](#2-option-a--déploiement-sur-vercel-recommandé)
3. [Option B : Déploiement sur Netlify](#3-option-b--déploiement-sur-netlify)
4. [Sécurité Post-Déploiement & Vérifications](#4-sécurité-post-déploiement--vérifications)
5. [Déploiement Continu (Mises à jour automatiques)](#5-déploiement-continu-mises-à-jour-automatiques)

---

## 1. Prérequis

Avant de commencer le déploiement :
- Avoir créé votre projet **Supabase** et exécuté le script SQL [`scripts/supabase_schema.sql`](../scripts/supabase_schema.sql).
- Avoir noté votre **Project URL** et votre clé publique **anon** (dans Supabase > *Project Settings* > *API*).
- Avoir créé au moins un utilisateur dans Supabase (*Authentication* > *Users*).
- Avoir votre projet hébergé sur un dépôt **GitHub** (privé ou public).

> [!CAUTION]
> **Rappel de Sécurité Impératif :**
> Côté Dashboard Web, vous devez **EXCLUSIVEMENT** renseigner la clé publique **`anon`**.
> Ne saisissez **JAMAIS** votre clé secrète **`service_role`** sur Vercel, Netlify ou dans le navigateur !

---

## 2. Option A : Déploiement sur Vercel (Recommandé)

Vercel offre un hébergement ultra-rapide et gratuit pour ce volume d'usage.

### Étape 1 : Création du compte et connexion
1. Rendez-vous sur [vercel.com](https://vercel.com).
2. Cliquez sur **« Sign Up »** (ou **« Log In »** si vous avez déjà un compte).
3. Choisissez **« Continue with GitHub »** pour lier directement votre compte GitHub.

### Étape 2 : Importer votre projet
1. Sur le tableau de bord Vercel, cliquez sur le bouton **« Add New… »** (en haut à droite), puis sélectionnez **« Project »**.
2. Dans la liste **« Import Git Repository »**, repérez votre dépôt GitHub Compass Solution et cliquez sur **« Import »**.

### Étape 3 : Configuration du répertoire racine (Étape CRUCIALE ⚠️)
Comme votre projet contient à la fois l'application Electron et le sous-dossier `dashboard-web/`, il faut indiquer à Vercel de cibler le sous-dossier :
1. Dans la section **« Root Directory »**, cliquez sur le bouton **« Edit »**.
2. Sélectionnez le dossier **`dashboard-web`** dans l'arborescence, puis cliquez sur **« Continue »**.
3. Vercel détecte automatiquement le framework **Vite** :
   - **Build Command** : `vite build` (ou `npm run build`)
   - **Output Directory** : `dist`
   - **Install Command** : `npm install`

### Étape 4 : Configuration des Variables d'Environnement
Dans la même page, ouvrez le panneau déroulant **« Environment Variables »** :
1. Ajoutez la première variable :
   - **Key** : `VITE_SUPABASE_URL`
   - **Value** : `https://xxxxxxxxxxxxxxxxxxxx.supabase.co` (votre URL réelle Supabase)
   - Cliquez sur **« Add »**.
2. Ajoutez la deuxième variable :
   - **Key** : `VITE_SUPABASE_ANON_KEY`
   - **Value** : `eyJhbGciOi...` (votre clé publique anon de Supabase)
   - Cliquez sur **« Add »**.

### Étape 5 : Lancement du déploiement
1. Cliquez sur le gros bouton bleu **« Deploy »**.
2. Patientez environ 30 à 45 secondes pendant la compilation et l'attribution du nom de domaine.
3. 🎉 **Félicitations !** Une animation de feux d'artifice s'affiche avec votre URL publique (ex: `https://compass-dashboard-xxxx.vercel.app`).
4. Cliquez sur la capture d'écran pour ouvrir directement votre dashboard en ligne.

---

## 3. Option B : Déploiement sur Netlify

Netlify est une alternative tout aussi performante et gratuite.

### Méthode 1 : Via connexion GitHub (Recommandée)
1. Rendez-vous sur [netlify.com](https://netlify.com) et connectez-vous avec GitHub.
2. Cliquez sur **« Add new site »** > **« Import an existing project »**.
3. Choisissez **« GitHub »** et autorisez l'accès à votre dépôt.
4. Remplissez les paramètres de build :
   - **Base directory** : `dashboard-web`
   - **Build command** : `npm run build`
   - **Publish directory** : `dashboard-web/dist`
5. Cliquez sur **« Add environment variables »** et ajoutez :
   - `VITE_SUPABASE_URL` = votre URL Supabase
   - `VITE_SUPABASE_ANON_KEY` = votre clé anon Supabase
6. Cliquez sur **« Deploy site »**.

### Méthode 2 : Par glisser-déposer (Sans Git)
Si vous ne souhaitez pas passer par GitHub :
1. Sur votre machine locale, ouvrez un terminal dans `dashboard-web/` et tapez :
   ```bash
   npm run build
   ```
2. Un dossier `dashboard-web/dist/` est généré.
3. Sur [app.netlify.com/drop](https://app.netlify.com/drop), glissez-déposez directement le dossier `dist/`.
4. Votre site est immédiatement en ligne ! *(Dans ce cas, configurez l'URL et la clé Supabase directement via la boîte modale de configuration dans le navigateur).*

---

## 4. Sécurité Post-Déploiement & Vérifications

Une fois votre dashboard en ligne :

### 1. Vérification de l'authentification (Obligatoire)
- Ouvrez l'URL de votre dashboard dans une fenêtre de navigation privée.
- Vous devez être accueilli par l'écran de connexion **« Accès Sécurisé Dashboard »**.
- Saisissez l'email et le mot de passe de votre compte Supabase Auth.
- Vérifiez que la connexion s'établit et que les données de caisse s'affichent.

### 2. Contrôle de l'exposition des clés
- Ouvrez les outils de développement de votre navigateur (`F12` > onglet *Réseau* ou *Sources*).
- Vérifiez qu'aucune clé `service_role` n'apparaît.
- Les requêtes réseau partent vers `https://votre-projet.supabase.co/rest/v1/...` avec le header `apikey: votre_cle_anon`, ce qui est le fonctionnement standard et sécurisé.

### 3. Configuration CORS dans Supabase (Si applicable)
Par défaut, l'API REST de Supabase autorise les requêtes de tous les domaines (`Access-Control-Allow-Origin: *`) sécurisées par les tokens JWT et les politiques RLS.
Si vous souhaitez restreindre les redirections d'authentification :
1. Dans Supabase, allez dans **« Authentication »** > **« URL Configuration »**.
2. Dans le champ **« Site URL »**, renseignez l'URL de votre dashboard Vercel (ex: `https://votre-dashboard.vercel.app`).
3. Dans **« Redirect URLs »**, ajoutez également cette URL.
4. Cliquez sur **« Save »**.

---

## 5. Déploiement Continu (Mises à jour automatiques)

Grâce à la liaison avec GitHub :
- Chaque fois que vous apportez une modification dans le dossier `dashboard-web/` et que vous poussez sur GitHub (`git push`), Vercel ou Netlify détecte automatiquement le nouveau commit.
- Le dashboard se recompile et se met à jour en moins d'une minute, sans aucune intervention manuelle de votre part !

---

## Résumé des Adresses et Fichiers de Déploiement

| Fichier | Emplacement | Utilité |
| :--- | :--- | :--- |
| **`vercel.json`** | [`dashboard-web/vercel.json`](./vercel.json) | Configuration du build Vite et des redirections SPA pour Vercel. |
| **`netlify.toml`** | [`dashboard-web/netlify.toml`](./netlify.toml) | Configuration du build Vite et du dossier `dist/` pour Netlify. |
| **`.env.example`** | [`dashboard-web/.env.example`](./.env.example) | Modèle des variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`. |
| **`.gitignore`** | [`dashboard-web/.gitignore`](./.gitignore) | Protection locale contre le versionnage accidentel des clés. |
