# Backlog esploso — FacilityFlow Retail

Indice master del backlog **esploso** (Epic → User Story → Task → Increment).  
Fonte di verità degli **Acceptance Criteria (AC):** [`../BACKLOG.md`](../BACKLOG.md).  
Questo folder spezza gli epic in file leggibili dagli agent; non sostituisce gli AC canonici.

> **Stato:** v4 — planning exploded + production-ready (E14 / S5).  
> **Vincolo hard:** stack **OSS-only** — nessun SaaS a pagamento nel path critico ([`../STACK.md`](../STACK.md)).  
> **Gate implementazione:** Analysis Card obbligatoria prima di ogni TK (vedi sotto).  
> **Checkbox:** SoR = [`../BACKLOG.md`](../BACKLOG.md). Story/DoD nei file `E*.md` riconciliati 2026-10-29; TK atomici possono restare `[ ]` storici.

---

## Gerarchia

```
Epic (E00–E14)
  └── User Story (US-E{epic}-{nn})
        └── Task (TK-E{epic}-{nn}-{mm})     ← unità di lavoro agent
              └── Increment / slice         ← PR verificabile + DoD
```

| Livello | Cosa è | Dove |
|---------|--------|------|
| **Epic** | Capacità di prodotto (wedge o production-ready) | File `E*.md` in questa cartella + mappa in `BACKLOG.md` |
| **User Story (US)** | Valore utente con AC | AC canonici in [`../BACKLOG.md`](../BACKLOG.md); dettaglio/esplosione nei file epic |
| **Task (TK)** | Slice implementabile, dipendenze esplicite, Ready/Done | File epic + allineamento agli Sprint Backlog `T{N}.x` |
| **Increment / slice** | Codice + test che soddisfano DoD della story/task | Branch `feature/*` → `develop`; verify post-dev |

**Regola:** un agent prende **un solo TK** per volta. Lo sprint backlog (`S1`–`S5`) ordina il lavoro nel tempo; gli ID `TK-*` tracciano la story.

---

## Come scegliere il prossimo TK (obbligatorio per agent)

Selezione **incrementale** — non saltare avanti nel grafo:

1. Filtra i task con stato **Ready** (DoR: AC chiari, dipendenze note, stack/RBAC noti).
2. Escludi quelli con dipendenze **non Done**.
3. Tra i rimanenti, prendi il **più piccolo** (XS → S → M; mai XL).
4. A parità di size, preferisci l’ordine dello Sprint Backlog corrente (`T{N}.x`).
5. **Prima di codificare:** pubblica **Analysis Card** (assunzioni, ricerca, design, AI yes/no/later, rischi). Senza Analysis Card → **non implementare**.
6. Dopo la slice: verify report + aggiorna checkbox / stato TK e, se Done, gli AC in `BACKLOG.md`.

```
Ready ∧ deps ⊆ Done  →  min(size)  →  Analysis Card  →  implement  →  verify
```

**Vietato:** inventare scope fuori backlog; introdurre SaaS a pagamento; far diventare l’AI System of Record.

---

## Convenzioni ID

| Tipo | Pattern | Esempio |
|------|---------|---------|
| Epic | `E{nn}` (due cifre) | `E04`, `E14` |
| User Story | `US-E{epic}-{nn}` | `US-E04-01`, `US-E14-02` |
| Task | `TK-E{epic}-{nn}-{mm}` | `TK-E04-01-01` (primo task della US-E04-01) |

- `{epic}` = numero epic a due cifre (`00`…`14`).
- `{nn}` = story dentro l’epic.
- `{mm}` = task dentro la story (slice incrementale).
- Gli ID sprint `T1.1`, `T2.3`, … restano lo **scheduling** operativo; ogni task sprint dovrebbe citare la `US-` / `TK-` collegata.

---

## File epic (esplosi)

| File | Epic | Contenuto previsto |
|------|------|--------------------|
| [`E00-E03.md`](./E00-E03.md) | E00–E03 | Platform OSS, foundation auth/RBAC, onboarding rete, asset |
| [`E04-E08.md`](./E04-E08.md) | E04–E08 | Ticket, SLA, vendor portal, chiusura/costi, notifiche |
| [`E09-E13.md`](./E09-E13.md) | E09–E13 | Dashboard HQ, NFR/audit, intake deep link, GDPR, flussi E2E A/B/C |
| [`E14-production-ready.md`](./E14-production-ready.md) | **E14** | Production-ready: harden, ops, exit pilota oltre wedge MVP |

> Vista esplosa **completa** (US + TK + dipendenze). Gli AC canonici restano in `BACKLOG.md`.

---

## Conteggi (v4)

| File | Stories | Tasks (TK) |
|------|---------|------------|
| [`E00-E03.md`](./E00-E03.md) | 18 | **79** |
| [`E04-E08.md`](./E04-E08.md) | 14 | **58** |
| [`E09-E13.md`](./E09-E13.md) | 14 | **31** |
| [`E14-production-ready.md`](./E14-production-ready.md) | 14 | **42** |
| **Totale** | **~60** | **~210** |

Sprint operativi allineati: S1–S4 (~100 `T*.x`) + **S5** (34 `T5.x` per E14).

---

## Matrice di tracciabilità

| Epic | Priorità | Sprint | File esploso | Story (range) | Note |
|------|----------|--------|--------------|---------------|------|
| E00 | P0 | S1 | [`E00-E03.md`](./E00-E03.md) | US-E00-* | Compose / Prisma / worker |
| E01 | P0 | S1 | [`E00-E03.md`](./E00-E03.md) | US-E01-* | Tenancy, Auth.js, RBAC |
| E02 | P0 | S1 | [`E00-E03.md`](./E00-E03.md) | US-E02-* | Store, vendor, membership |
| E03 | P0 | S1–S2 | [`E00-E03.md`](./E00-E03.md) | US-E03-* | Asset registry |
| E04 | P0 | S2 | [`E04-E08.md`](./E04-E08.md) | US-E04-* | Ticket lifecycle |
| E05 | P0 | S2–S3 | [`E04-E08.md`](./E04-E08.md) | US-E05-* | SLA / breach / pg-boss |
| E06 | P0 | S3 | [`E04-E08.md`](./E04-E08.md) | US-E06-* | Vendor portal |
| E07 | P0 | S3 | [`E04-E08.md`](./E04-E08.md) | US-E07-* | Verify + costi |
| E08 | P0 | S2–S3 | [`E04-E08.md`](./E04-E08.md) | US-E08-* | Email + in-app |
| E09 | P0 | S4 | [`E09-E13.md`](./E09-E13.md) | US-E09-* | Dashboard HQ |
| E10 | P0 | S4 | [`E09-E13.md`](./E09-E13.md) | US-E10-* | Audit, NFR, seed |
| E11 | P0 | S2 | [`E09-E13.md`](./E09-E13.md) | US-E11-01 | Intake deep link |
| E12 | P1 | S4 | [`E09-E13.md`](./E09-E13.md) | US-E12-* | GDPR base |
| E13 | P0 | S1–S3 | [`E09-E13.md`](./E09-E13.md) | US-E13-* | Flussi E2E A/B/C |
| **E14** | **P0** | **S5** | [`E14-production-ready.md`](./E14-production-ready.md) | US-E14-01…14 | Production-ready |

---

## Production-ready = E14 + DoD + S5

Il wedge MVP (E00–E13, S1–S4) non è automaticamente “pronto pilota production”.

| Pezzo | Ruolo |
|-------|--------|
| **E14** | Epic dedicato: harden, runbook, backup/restore verificato, security checklist, perf seed, exit criteria pilota |
| **DoD** | [`../sprints/DEFINITION_OF_DONE.md`](../sprints/DEFINITION_OF_DONE.md) — nessuna story Done senza checklist |
| **S5** | [`../sprints/S5-sprint-backlog.md`](../sprints/S5-sprint-backlog.md) — sprint che porta E14 a Increment rilasciabile |

**Definizione operativa:** *production-ready* = story E14 Satisfying DoD **e** exit S5 verdi, senza SaaS a pagamento nel path critico.

---

## Documenti collegati (obbligatori)

| Artefatto | Percorso |
|-----------|----------|
| Product Backlog (AC canonici) | [`../BACKLOG.md`](../BACKLOG.md) |
| Stack OSS-only | [`../STACK.md`](../STACK.md) |
| Matrice RBAC | [`../RBAC.md`](../RBAC.md) |
| Definition of Done / Ready | [`../sprints/DEFINITION_OF_DONE.md`](../sprints/DEFINITION_OF_DONE.md) |
| Pre-dev readiness | [`../sprints/READINESS.md`](../sprints/READINESS.md) |
| Sprint index (S1–S5) | [`../sprints/README.md`](../sprints/README.md) |
| S1 | [`../sprints/S1-sprint-backlog.md`](../sprints/S1-sprint-backlog.md) |
| S2 | [`../sprints/S2-sprint-backlog.md`](../sprints/S2-sprint-backlog.md) |
| S3 | [`../sprints/S3-sprint-backlog.md`](../sprints/S3-sprint-backlog.md) |
| S4 | [`../sprints/S4-sprint-backlog.md`](../sprints/S4-sprint-backlog.md) |
| S5 | [`../sprints/S5-sprint-backlog.md`](../sprints/S5-sprint-backlog.md) |
| Skills map | [`../SKILLS_MAP.md`](../SKILLS_MAP.md) |

---

## Regole agent (riassunto)

1. **Team multi-agente** — rule [`.cursor/rules/multi-agent-team.mdc`](../../../.cursor/rules/multi-agent-team.mdc): orchestrare N ruoli (PO/PM/AR/TL/BE/FE/QA/OPS/SEC/UX) per fase fino a E14/S5.
2. **Non implementare** senza **Analysis Card** (pre-dev).
3. **Nessun SaaS a pagamento** nel path critico (Auth.js, Postgres Compose, Prisma, SeaweedFS, Nodemailer+Mailpit, pg-boss).
4. Prossimo lavoro = **smallest Ready TK** con dipendenze Done.
5. AC e checkbox Done → aggiornare [`../BACKLOG.md`](../BACKLOG.md); dettaglio TK → file epic.
6. Open decisions in `BACKLOG.md` restano **locked** salvo override esplicito + aggiornamento file.
7. Branch: da `develop`, `feature/*` / `bugfix/*` — vedi GitFlow del repo.
