# QA — Flusso C soft (S1 / US-E13-03)

**Obiettivo:** tenant vuoto → rete operativa **senza SQL**, senza ticket prova (hard = S2).  
**Target wall-clock:** &lt; 15 min setup rete.

## Prerequisiti

```bash
docker compose up -d postgres seaweedfs
docker compose --profile dev up -d mailpit
npm install && npx prisma migrate deploy && npm run db:seed
npm run storage:init
npm run worker   # altro terminale
npm run dev
```

## Script cronometrato

| # | Azione UI | Pass? | Note tempo |
|---|-----------|:-----:|------------|
| 0 | Avvio timer | | T0 |
| 1 | `/register` — crea workspace HQ | ☐ | |
| 2 | Mailpit: email conferma (opz. click link) | ☐ | |
| 3 | `/app/stores` — crea ≥1 PV **oppure** `/app/stores/import` CSV | ☐ | |
| 4 | `/app/vendors` — crea ≥1 fornitore + coverage | ☐ | |
| 5 | `/onboarding` — SLA default ✓ (auto al signup o CTA) | ☐ | |
| 6 | Invita store manager (dominio invite + accept `/invite/[token]`) → membership SM | ☐ | |
| 7 | Checklist rete 4/4; ticket prova = S2 / skip | ☐ | |
| 8 | Stop timer → annotare minuti | ☐ | **___ min** |

## Criteri pass S1

- [ ] Path senza SQL / seed manuale ad-hoc
- [ ] Checklist US-E02-04 completabile su setup rete
- [ ] Compose healthy (postgres, seaweedfs, mailpit)
- [ ] Tempo annotato (target &lt;15 min)

## Esito

- Data: __________
- Operatore: __________
- Wall-clock: __________ min
- Pass / Fail: __________
- Note: __________
