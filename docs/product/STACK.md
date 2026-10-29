# FacilityFlow Retail — Stack OSS-only (vincolante)

> **Policy:** ogni componente runtime del prodotto deve essere **open source** (licenza OSI-approved o equivalente permissiva) e **self-hostabile senza abbonamento SaaS obbligatorio**.  
> Hosting infrastrutturale (VPS EU) è fuori dalla “licenza software”: si prevede Docker Compose su macchina EU; zero dipendenze a pagamento per Auth, DB managed, email SaaS, object storage cloud, job cloud, error-tracking cloud.

Dettaglio backlog: [`BACKLOG.md`](./BACKLOG.md).

---

## Analysis Card (scelta stack)

- **Assunzioni:** “non a pagamento” = no Clerk/Neon/R2/Resend/Postmark/Inngest Cloud/Sentry Cloud/WhatsApp API a costo; software 100% self-host via Compose.
- **Ricerca:** BullMQ MIT self-op ([bullmq.io](https://bullmq.io/)); Inngest SSPL non OSI ([trigger.dev vs inngest](https://trigger.dev/vs/inngest)); MinIO community archiviato → SeaweedFS Apache-2.0 ([SSD Nodes / MinIO alternatives](https://www.ssdnodes.com/learn/self-hosted-minio-alternatives)); pattern Next+Auth.js+Postgres+SeaweedFS già usato in stack OSS (es. Aurora).
- **Scelta di design:** Compose minimo (app + worker + Postgres + SeaweedFS + Mailpit); jobs **pg-boss** su Postgres (niente Redis obbligatorio in MVP); email via **Nodemailer + SMTP** (Mailpit in dev).
- **AI:** `later` — Fase 2 con **Ollama** (locale/OSS) + human-confirm; mai SoR.
- **Rischi:** operatività self-host (backup, TLS, deliverability SMTP); mitigati da epic E00 + runbook S4.

---

## Matrice componenti

| Area | Scelta OSS | Licenza tipica | Escluso (a pagamento / SaaS) |
|------|------------|----------------|------------------------------|
| App UI | **Next.js** App Router + **TypeScript** + **Tailwind** + **shadcn/ui**; companion approvati: **motion**, **TanStack** (Table/Query), **React Hook Form + Zod** | MIT | — |
| Auth | **Auth.js** (NextAuth v5) + sessioni in Postgres | ISC/MIT | Clerk, Auth0, Supabase Auth managed |
| DB | **PostgreSQL 16** (container Compose) | PostgreSQL License | Neon, Supabase Cloud, PlanetScale |
| ORM | **Prisma** | Apache-2.0 | — |
| Object storage | **SeaweedFS** (API S3-compatible) | Apache-2.0 | Cloudflare R2, AWS S3, MinIO* |
| Email | **Nodemailer** + **Mailpit** (dev) / SMTP self-host (prod profile) | MIT / OSS | Resend, Postmark, SendGrid |
| Jobs / SLA cron | **pg-boss** (coda su Postgres) + processo worker | MIT | Inngest Cloud, Trigger.dev Cloud |
| Cache (opz.) | non richiesta MVP; se serve: **Valkey** | BSD | Upstash Redis |
| Error tracking | log strutturati MVP; opz. **GlitchTip** Compose profile | MIT | Sentry Cloud |
| Observability | JSON logs + (opz.) **Grafana Loki** / Prometheus | AGPL/Apache | Datadog, etc. |
| Reverse proxy | **Caddy** o **Traefik** (TLS) | Apache-2.0 / MIT | — |
| AI Fase 2 | **Ollama** + modello locale; UI confirm umana | MIT | OpenAI/Anthropic API come dipendenza obbligatoria |

\* MinIO community: progetto archiviato/non mantenuto — **non usare** per greenfield 2026.

---

## Docker Compose — servizi target

```
services (MVP core):
  app          # Next.js
  worker       # pg-boss consumers (SLA breach, email outbox)
  postgres     # DB + pg-boss tables
  seaweedfs    # master + volume + s3 gateway (o profilo semplificato)
  mailpit      # SMTP catcher + UI (solo profile:dev)

profiles opzionali:
  mail         # docker-mailserver o Postal (SMTP reale)
  observe      # GlitchTip e/o Loki+Grafana
  prod         # Caddy/Traefik TLS, no Mailpit, restart always, limits — vedi E14 / S5
```

Production-ready (pilota): epic **E14** + sprint **S5** in `docs/product/backlog/E14-production-ready.md`.


Verifica post-dev: regola `.cursor/rules/post-dev-verify.mdc` → `docker compose up -d --build` + healthcheck.

---

## Regioni / GDPR

- Deploy target: **single region EU** (VPS EU).
- Dati tenant solo su Postgres + SeaweedFS del tenant stack.
- Nessun vendor SaaS USA obbligatorio nel path critico MVP.

---

## Anti-pattern stack

- Introdurre un servizio managed “gratis per ora” che diventa paywall (Clerk free tier, Resend, Neon, R2).
- Aggiungere Redis “perché sì” se pg-boss basta.
- Mailcow completo in MVP (troppo pesante) — solo se deliverability reale richiesta dal pilota.
- AI cloud a pagamento in MVP.
