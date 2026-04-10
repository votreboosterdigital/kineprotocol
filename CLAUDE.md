# KinéProtocol — Instructions Claude Code

## Stack
Next.js 14 App Router · TypeScript strict · Supabase · Prisma · Stripe · Vercel · Tailwind CSS

## Agents de génération
3 agents Claude en cascade :
1. **Protocol Designer** (`/lib/agents/protocol-designer.ts`) — génère le protocole complet
2. **Exercise Librarian** (`/lib/agents/exercise-librarian.ts`) — enrichit chaque exercice
3. **Patient Writer** (`/lib/agents/patient-writer.ts`) — version patient vulgarisée

## Contraintes absolues
- Ne JAMAIS exécuter `prisma migrate deploy` — utiliser le SQL Editor Supabase
- `react-pdf` : toujours dynamic import avec `ssr: false`
- Modèle principal : `claude-opus-4-5` (défini dans `/lib/anthropic.ts`)
- Modèle literature : `claude-haiku-4-5-20251001` (coût minimal)

## Skills disponibles

### Skill custom projet
- `/kine-literature <pathologie>` → revue de littérature clinique JSON
  - Source : `.claude/skills/kine-literature.md`
  - Output : JSON injectable dans `literatureContext` de `ProtocolDesignerInput`
  - Cache Supabase : table `literature_cache` (TTL 30 jours)
  - Endpoint : `POST /api/literature`

### Skills Feynman (recherche académique)
Installés dans `~/.claude/plugins/feynman-skills/`
- `literature-review` → revue de littérature avec synthèse sources primaires (`/lit`)
- `deep-research` → recherche approfondie multi-sources
- `autoresearch` → recherche automatisée sur un topic
- `peer-review` → critique d'article académique
- `source-comparison` → comparaison de sources contradictoires

Usage combiné KinéProtocol :
1. `/kine-literature lombalgie chronique` → JSON clinique structuré
2. Injecter le résultat dans `literatureContext` avant `designProtocol()`
3. L'agent utilise les sources en priorité sur son guide interne

## Workflow migration DB
```
prisma migrate diff → SQL manuel → Supabase SQL Editor → insert _prisma_migrations
```

## Variables d'environnement requises
- `ANTHROPIC_API_KEY`
- `DATABASE_URL` (pooler port 6543)
- `DIRECT_URL` (direct port 5432)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
