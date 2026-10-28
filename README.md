# Advent Blanket 🧶

Calendrier de l'Avent au crochet : chaque jour de décembre, la personne en
charge du jour révèle **le point du jour, le nombre de rangs et la pelotte**,
avec un lien vers le tuto. Les 24 jours s'étiquettent avec un PDF de QR codes
à découper, et chaque QR ouvre la page publique du jour sur le téléphone.

Stack : Next.js (App Router) · React 19 · Drizzle + SQLite (`better-sqlite3`,
WAL) · Tailwind 4 / shadcn / sonner · `pdf-lib` + `qrcode`.

## Documentation

- `docs/step-1-scaffold.md` — scaffolding, DB, migrations, seed
- `docs/step-2-auth.md` — sessions, login, backoffice
- `docs/step-3-participants.md` — participants et slugs
- `docs/step-4-day-editor.md` — éditeur de jour (backoffice)
- `docs/step-5-references.md` — points et pelottes
- `docs/step-6-pdf-qr.md` — PDF des 24 QR codes
- `docs/step-7-public-page.md` — page publique `/cal/{slug}/{jour}`
- `docs/step-8-deploy.md` — déploiement Coolify + sauvegardes

## Développement

```bash
pnpm install
pnpm db:seed        # admin (ADMIN_USERNAME/ADMIN_PASSWORD) + participants + références
pnpm dev            # http://localhost:3000
```

La base vit dans `data/advent-blanket.db` (créée et migrée automatiquement au
premier accès, mode WAL). Les variables utiles sont listées dans `.env.example`
(`cp .env.example .env`).

Livraisons utiles :

```bash
pnpm lint
pnpm build
pnpm db:backup      # checkpoint WAL + copie horodatée dans data/backups
```

## Déploiement (Coolify)

L'image est auto-suffisante : migrations **et** seed tournent au démarrage du
serveur, la base persiste dans le volume monté sur `/data`.

1. Créer l'application depuis le dépôt Git (Dockerfile à la racine).
2. **Volumes** : monter un stockage persistant sur `/data` (SQLite + backups).
3. **Variables d'environnement** : `SESSION_SECRET` (obligatoire),
   `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_APP_URL`
   (`https://sans-slash.example.com`, utilisé comme base des QR codes).
4. **Domaine** + HTTPS via le proxy Coolify.
5. **Backups** : tâche planifiée Coolify exécutant
   `node /app/scripts/backup.mjs` dans le container (nuit un checkpoint WAL,
   copie la base horodatée dans `/data/backups`, garde les 14 dernières).

Détails et dépannage : `docs/step-8-deploy.md`.
