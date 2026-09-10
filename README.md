# Compass Solution POS — Dashboard Web Cloud

Application web autonome de consultation des rapports de vente, statistiques et alertes de stock à distance pour le système d'encaissement **Compass Solution POS**.

---

## 🎯 Fonctionnalités

- **Statut Caisse en Direct** : Indicateur connecté/hors-ligne avec horodatage de la dernière synchronisation.
- **Indicateurs Clés (KPIs)** : Chiffre d'affaires du jour, volume de transactions, panier moyen, résultat net estimé, alertes stock.
- **Graphiques Dynamiques (Chart.js)** : Évolution chronologique du chiffre d'affaires et répartition des modes de paiement.
- **Top 10 Produits** : Classement des meilleures ventes du jour avec quantités et chiffres d'affaires.
- **Surveillance des Stocks** : Filtrage par articles en rupture (`quantité = 0`) et stocks bas sous le seuil d'alerte.
- **Fil d'Activité Récent** : Historique des dernières transactions validées (sans données sensibles clients).
- **Mode Démonstration Intégré** : Possibilité d'explorer l'interface immédiatement avec des données tests réalistes.

---

## 🔒 Sécurité & Clés d'API

> [!WARNING]
> **RÈGLE CRITIQUE DE SÉCURITÉ :**
> Ce dashboard s'exécute côté navigateur (client-side). Il utilise **EXCLUSIVEMENT** la clé publique `anon` de Supabase avec des règles de sécurité **Row Level Security (RLS) en LECTURE SEULE (`SELECT`)**.
> **Ne JAMAIS utiliser ni inscrire la clé secrète `service_role` dans ce projet web !**

---

## 🚀 Démarrage en local

### 1. Installation des dépendances
```bash
cd dashboard-web
npm install
```

### 2. Configuration locale (optionnelle)
Copiez `.env.example` en `.env` :
```bash
cp .env.example .env
```
Complétez vos identifiants Supabase :
```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_publique
```
*(Si vous ne renseignez pas le `.env`, vous pourrez toujours saisir l'URL et la clé dans la boîte modale de configuration directement depuis le navigateur, ou cliquer sur "Mode Démonstration".)*

### 3. Lancer le serveur de développement
```bash
npm run dev
```
Ouvrez l'URL affichée dans votre terminal (par exemple : `http://localhost:5173`).

### 4. Compiler pour la production
```bash
npm run build
```
Les fichiers statiques optimisés seront générés dans le dossier `dist/`.

Pour prévisualiser le résultat du build en local :
```bash
npm run preview
```

---

## 🌐 Déploiement en Ligne (Vercel / Netlify)

Consultez le guide complet pas-à-pas :
👉 [DEPLOYMENT.md](./DEPLOYMENT.md)
