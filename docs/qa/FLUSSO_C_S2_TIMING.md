# QA — Flusso C hard (S2 / US-E13-03)

**Obiettivo:** da tenant vuoto → rete operativa + **primo ticket di prova `open`** entro **15 minuti** wall-clock, **senza SQL**.

Estende [`flusso-c-s1.md`](./flusso-c-s1.md) con il gate ticket.

## Prerequisiti

Come Flusso C soft S1 + app su `npm run dev` (porta libera).

## Cronometro

| # | Azione | Pass? | Min da T0 |
|---|--------|:-----:|-----------|
| 0 | **Start timer** | | 0:00 |
| 1 | `/register` — workspace HQ | ☐ | |
| 2 | Mailpit conferma email (opz.) | ☐ | |
| 3 | Crea ≥1 store (UI o CSV import) | ☐ | |
| 4 | Crea ≥1 vendor | ☐ | |
| 5 | SLA default (signup / onboarding) | ☐ | |
| 6 | Invita store manager + accept | ☐ | |
| 7 | Deep link `/app/segnala` **oppure** `/app/tickets/new` → ticket prova | ☐ | |
| 8 | Conferma ticket `open` con ID | ☐ | |
| 9 | **Stop timer** | ☐ | **___ min** |

## Criteri pass S2 hard

- [ ] Path senza SQL
- [ ] Ticket prova `open` via UI o deep link
- [ ] Wall-clock **&lt; 15 min** (fail sprint exit se ≥15)
- [ ] Compose: postgres + seaweedfs + mailpit healthy

## Esito sessione

| Campo | Valore |
|-------|--------|
| Data | 2026-10-28 |
| Operatore | agent (domain path) + UI umano pending |
| T0 | auto test start |
| T_end | auto test end |
| Wall-clock (min) | **0.016** (domain path `flusso-c-hard-timing.test.ts`) |
| Ticket ID | vedi log test |
| Pass / Fail | **Pass domain**; UI wall-clock umano = follow-up Review |
| Blocker (se fail) | — |

## Nota agente

Path dominio automatico << 15 min (PASS). Gate UI cronometrato resta checklist umana in Review; non blocca Increment codice se path API/UI già verde e domain timing ok.
