# Seed pilota 15×5 (US-E10-04 / T4.1)

```bash
npx prisma migrate deploy   # o db push in dev
npm run db:seed:pilot
```

Tenant slug: `pilot-retail`.

## Credenziali QA (solo locale / staging)

| Ruolo | Email | Password |
|-------|-------|----------|
| owner | `owner@pilot.facilityflow.local` | `PilotOwner123!` |
| viewer_finance | `finance@pilot.facilityflow.local` | `PilotFinance123!` |
| vendor | `vendor0@pilot.facilityflow.local` … `vendor4@…` | `PilotVendor123!` |

Non usare in produzione. Script idempotente su slug `pilot-retail`.

## Perf lista HQ

```bash
npm run perf:hq-list
# target p95 < 300 ms sul seed pilota
```

Stress opzionale (T4.2): `npm run db:seed:stress` → slug `stress-retail` (default 50×100; `STRESS_TICKETS=5000` per carico pieno).

```bash
STRESS_TICKETS=5000 npm run db:seed:stress
npm run perf:hq-list -- stress-retail 40
# 2026-10-29 locale: p95 ~6.4 ms (pass ≪ 300 ms)
```

Gli aperti stress usano `slaDueAt` nel futuro (e il seed neutralizza eventuali due scadute residue) così non saturano `checkSlaBreaches` (batch 100) nei test locali sullo stesso Postgres.

## KPI “a rischio” (glossario S4)

Ticket **aperto** con `slaDueAt` nel futuro e tempo residuo &lt; **20%** della finestra opened→due (fallback &lt; 4h se finestra non positiva). Breached esclusi dal conteggio a rischio.
