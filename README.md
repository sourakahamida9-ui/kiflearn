# KifLearn — MVP

> Le « Kahoot africain » **data-first** : quiz live ultra-léger pour l'éducation et les hackathons.

Application **Next.js 15 + Supabase + Tailwind**, pensée mobile-first et faible bande passante.

---

## ✨ Ce que fait le MVP

**Côté enseignant**

- Création de compte / connexion (email + mot de passe)
- Création et édition de quiz (questions à 2–4 choix, temps par question)
- Lancement d'une **session live** avec un code à 6 chiffres
- Écran de pilotage : lobby, question en cours, minuteur, % de réponses en direct, révélation, classement
- **Export CSV** des données (réponses, justesse, temps de réponse, points)

**Côté étudiant** (aucun compte requis)

- Rejoindre via le code + un pseudo
- Répondre sur mobile (gros boutons façon game-show)
- Feedback immédiat (bonne/mauvaise réponse, points)
- Classement final + « carte de victoire » pour le podium

**Anti-triche** : la bonne réponse n'est **jamais** envoyée au navigateur de l'étudiant. La correction et le calcul des points se font côté serveur (fonctions Postgres `SECURITY DEFINER`), et les étudiants ne lisent que la vue `questions_public` (sans la colonne `correct_answer`).

---

## 🧱 Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 3.4** (palette + polices personnalisées)
- **Supabase** : Auth, Postgres, **Realtime**, RLS
- Déploiement cible : **Vercel**

---

## 🚀 Installation pas à pas

### 1. Prérequis

- Node.js 18.18+ (ou 20+)
- Un compte [Supabase](https://supabase.com) (gratuit)

### 2. Installer les dépendances

```bash
npm install
```

### 3. Créer le projet Supabase

1. Sur [supabase.com](https://supabase.com) → **New project**.
2. Ouvre **SQL Editor** → **New query**.
3. Copie-colle **tout** le contenu de [`supabase/schema.sql`](./supabase/schema.sql) puis clique **Run**.
   - Cela crée les tables, la sécurité (RLS), les fonctions et active le Realtime.

### 4. (Recommandé pour tester vite) Désactiver la confirmation d'email

Dashboard Supabase → **Authentication → Providers → Email** → désactive **« Confirm email »**.
Ainsi l'inscription connecte directement l'enseignant, sans étape email.

### 5. Configurer les variables d'environnement

Récupère tes clés dans **Project Settings → API**, puis :

```bash
cp .env.local.example .env.local
```

Remplis `.env.local` :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 6. Lancer en local

```bash
npm run dev
```

Ouvre http://localhost:3000

---

## 🧪 Tester le flux complet

1. **Enseignant** : va sur `/login`, crée un compte, puis crée un quiz avec quelques questions.
2. Sur le tableau de bord, clique **▶ Lancer** → tu arrives sur l'écran hôte avec un **code**.
3. **Étudiant** : sur un autre onglet/téléphone, ouvre l'accueil, entre le code (ou va sur `/join`), choisis un pseudo.
4. Côté hôte, clique **Démarrer**, puis enchaîne les questions. Les réponses et le classement se mettent à jour en **temps réel**.
5. À la fin, **exporte le CSV**.

> 💡 Pour simuler plusieurs joueurs, ouvre plusieurs fenêtres de navigation privée.

---

## ☁️ Déploiement sur Vercel

1. Pousse le code sur GitHub.
2. Sur [vercel.com](https://vercel.com) → **New Project** → importe le repo.
3. Ajoute les deux variables d'environnement (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. **Deploy**.

(Pense à autoriser ton domaine Vercel dans Supabase → **Authentication → URL Configuration** si besoin.)

---

## 📁 Structure

```
kiflearn/
├── supabase/
│   └── schema.sql            # ← à exécuter dans Supabase
├── src/
│   ├── app/
│   │   ├── page.tsx          # Accueil + rejoindre
│   │   ├── login/            # Auth enseignant
│   │   ├── dashboard/        # Liste + édition des quiz
│   │   ├── host/[sessionId]/ # Pilotage live (enseignant)
│   │   ├── join/             # Rejoindre (étudiant)
│   │   └── play/[sessionId]/ # Jeu live (étudiant)
│   ├── components/           # Logo, AnswerTile, QuizEditor, TopBar
│   ├── lib/
│   │   ├── supabase/         # clients navigateur + serveur
│   │   ├── types.ts
│   │   └── utils.ts          # export CSV
│   └── middleware.ts         # protège /dashboard et /host
└── ...
```

---

## 🧮 Calcul des points

Réponse correcte : `500 points + bonus de rapidité` (jusqu'à +500 selon le temps restant).
Réponse fausse ou absente : `0`. Tout est calculé côté serveur dans la fonction `submit_answer`.

---

## 🛣️ Pistes V2 (hors périmètre MVP)

- **Mode hors-ligne / PWA complète** (service worker, cache des questions) — un `manifest.json` est déjà inclus.
- Tableau de bord analytique (concepts mal compris, progression dans le temps).
- Badges, marketplace de quiz, génération de questions par IA.
- Salons persistants et reconnexion automatique des étudiants.

---

## ⚠️ Note de build

Ce projet a été préparé sans accès réseau, donc `npm install` et `next build` n'ont **pas** pu être exécutés dans l'environnement de génération. Le code a été relu manuellement. Lance `npm install` puis `npm run dev` dans ton environnement pour démarrer.
