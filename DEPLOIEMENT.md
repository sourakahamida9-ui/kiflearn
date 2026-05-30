# 🚀 Déploiement KifLearn

## ✅ Ce qui est DÉJÀ fait (par moi, en direct)

Le **backend Supabase est créé et 100 % opérationnel** :

| Élément | Valeur |
|---|---|
| Projet | `kiflearn` |
| Référence | `ngtnnoqmupbixszuugih` |
| Région | Paris (eu-west-3) |
| URL API | `https://ngtnnoqmupbixszuugih.supabase.co` |
| Dashboard | https://supabase.com/dashboard/project/ngtnnoqmupbixszuugih |

Déjà appliqué : les 6 tables, la sécurité RLS, les 3 fonctions serveur (création de session, rejoindre, scorer), le trigger de création de profil, et le Realtime activé sur `sessions`, `participants`, `answers`.

Le fichier **`.env.local` est déjà pré-rempli** avec ces clés — donc `npm run dev` marche immédiatement.

### ⚠️ Une seule action côté Supabase (1 min, recommandé pour tester vite)
Dashboard → **Authentication → Sign In / Providers → Email** → désactive **« Confirm email »**.
Sinon, chaque enseignant devra confirmer son email avant de pouvoir se connecter.

---

## 🌍 Mettre en ligne sur Vercel — il reste 1 commande à lancer

> Je ne peux pas téléverser le code sur Vercel à ta place depuis cet environnement (pas d'accès réseau ni d'outil d'upload). Mais tout est prêt : choisis **une** des deux méthodes ci-dessous.

### Variables d'environnement à mettre sur Vercel (les deux)

```
NEXT_PUBLIC_SUPABASE_URL = https://ngtnnoqmupbixszuugih.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ndG5ub3FtdXBiaXhzenV1Z2loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDA5OTIsImV4cCI6MjA5NTcxNjk5Mn0.sXX2iqcvfI6kBXD72UxJgQh0pZdlYEzf76oOCm32Pgo
```

(La clé anon est une clé **publique**, protégée par les règles RLS : aucun risque à l'exposer côté navigateur.)

---

### Méthode A — Vercel CLI (la plus rapide)

Depuis le dossier `kiflearn/` décompressé :

```bash
npm install
npm i -g vercel

vercel login          # connecte ton compte
vercel link           # crée/associe le projet Vercel

# Ajoute les 2 variables (colle les valeurs ci-dessus quand c'est demandé)
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

vercel --prod         # déploiement en production 🎉
```

### Méthode B — GitHub + Vercel (déploiement auto à chaque push)

```bash
cd kiflearn
git init && git add . && git commit -m "KifLearn MVP"
# crée un repo sur github.com puis :
git remote add origin https://github.com/TON_PSEUDO/kiflearn.git
git push -u origin main
```

Puis sur **vercel.com** : **Add New → Project → Import** ton repo →
section **Environment Variables**, ajoute les 2 variables ci-dessus → **Deploy**.

> `.env.local` est dans `.gitignore` : il ne sera pas poussé sur GitHub (normal, les variables se mettent côté Vercel).

---

## 🔐 Après le 1er déploiement

Récupère ton URL Vercel (ex. `https://kiflearn.vercel.app`) et ajoute-la dans Supabase →
**Authentication → URL Configuration → Site URL / Redirect URLs**, pour que la connexion enseignant fonctionne en production.

---

## 🧪 Tester

1. `/login` → crée un compte enseignant → crée un quiz.
2. **Lancer** → un code à 6 chiffres s'affiche.
3. Sur un téléphone / fenêtre privée → accueil → entre le code + un pseudo.
4. Déroule les questions : réponses et classement en **temps réel**.
5. À la fin : **export CSV**.
