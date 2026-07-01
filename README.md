# M'Paye — Super Admin

Console d'administration plateforme M'Paye (Vite + React 18 + TypeScript + Tailwind).

## Démarrage

```bash
npm install
npm run dev
```

Le front démarre sur **http://localhost:5174** et s'attend à un backend M'Paye sur **http://localhost:3000** (configurable via `.env` → `VITE_API_URL`).

## Accès

Seuls les utilisateurs avec `role = 'SUPER_ADMIN'` peuvent se connecter. Pour créer le premier super-admin, exécuter en BDD :

```sql
UPDATE User SET role = 'SUPER_ADMIN' WHERE email = 'votre@email.com';
```

## Modules disponibles

- **Vue d'ensemble** — KPIs plateforme + actions urgentes en attente
- **Vérifications KYC** — Approuver / refuser les dossiers d'identité
- **Retraits marchands** — Valider les virements bancaires sortants
- **Frais & Revenus** — Configurer les frais et voir les revenus plateforme

## Build production

```bash
npm run build
npm run preview
```
teste
