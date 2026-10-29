# Sprint Backlog — FacilityFlow Retail

Indice degli Sprint Backlog (MVP S1–S4 + production-ready **S5**). Cadenza **2 settimane**. Capacità tipica: **~1–2 FTE** (+ assist AI agent). Fonte di verità prodotto: [`../BACKLOG.md`](../BACKLOG.md). Backlog esploso: [`../backlog/README.md`](../backlog/README.md).

**DoD / DoR / Sprint Exit:** [`DEFINITION_OF_DONE.md`](./DEFINITION_OF_DONE.md)  
**Pre-dev readiness:** [`READINESS.md`](./READINESS.md)

---

## Sprint Backlog files

| Sprint | File | Focus (da BACKLOG) |
|--------|------|--------------------|
| **S1** | [`S1-sprint-backlog.md`](./S1-sprint-backlog.md) | Platform OSS (E00), auth/RBAC (E01), onboarding+membership (E02), asset (E03), Flusso C soft (E13) — **34 task** |
| **S2** | [`S2-sprint-backlog.md`](./S2-sprint-backlog.md) | Ticket+Attachment (E04), SLA policy (E05), deep link (E11), notifiche skeleton (E08), Flusso A→assigned + C hard — **32 task** |
| **S3** | [`S3-sprint-backlog.md`](./S3-sprint-backlog.md) | Vendor portal (E06), verify/costi (E07), breach (E05), notifiche complete (E08), Flusso A→verified + B — **14 task** |
| **S4** | [`S4-sprint-backlog.md`](./S4-sprint-backlog.md) | Dashboard HQ (E09), NFR/seed/i18n/security (E10), GDPR (E12), harden MVP — **20 task** |
| **S5** | [`S5-sprint-backlog.md`](./S5-sprint-backlog.md) | **E14 production-ready** — harden, ops, exit pilota (DoD + readiness) |

**Stato S5 (2026-10-29):** artefatti ops + prove **locali** PASS; **NO-GO prod** — gap VPS in [`S5-EXIT-GAPS.md`](./S5-EXIT-GAPS.md). Retro: [`../retros/S5-2026-10-29.md`](../retros/S5-2026-10-29.md).  
**Increment globale:** [`../INCREMENT_STATUS.md`](../INCREMENT_STATUS.md) · next host: [`../../ops/NEXT_VPS.md`](../../ops/NEXT_VPS.md).

> I file `S1`–`S5` sopra sono lo Sprint Backlog operativo; gli epic/story e gli AC restano canonici in `BACKLOG.md`. Vista esplosa TK: [`../backlog/`](../backlog/).

---

## Capacità e scope

| Assunzione | Valore |
|------------|--------|
| Lunghezza sprint | 2 settimane |
| Capacità | ~1–2 FTE (+ AI assist) |
| Goal | Increment potenzialmente rilasciabile a fine sprint |
| Scope mid-sprint | Solo con aggiornamento esplicito dello Sprint Backlog |

---

## Cerimonie (leggere)

1. **Sprint Planning** — selezionare story da `BACKLOG.md`; stimare capacità; dichiarare Sprint Goal; dipendenze e rischi
2. **Daily (async)** — ieri / oggi / blocker (chat o commento; meeting non obbligatorio)
3. **Sprint Review** — demo Increment vs AC; feedback → backlog
4. **Retro** — note in [`../retros/`](../retros/) (`S{N}-YYYY-MM-DD.md`)

Dettaglio processo: [`.cursor/rules/agile-scrum.mdc`](../../../.cursor/rules/agile-scrum.mdc). Branching: [`.cursor/rules/gitflow.mdc`](../../../.cursor/rules/gitflow.mdc) (feature → **`develop`**).

---

## Documenti collegati

| Artefatto | Percorso |
|-----------|----------|
| Product Backlog (epics E00–E14, AC) | [`../BACKLOG.md`](../BACKLOG.md) |
| Backlog esploso (indice) | [`../backlog/README.md`](../backlog/README.md) |
| Stack OSS-only | [`../STACK.md`](../STACK.md) |
| Matrice RBAC | [`../RBAC.md`](../RBAC.md) |
| Definition of Done / Ready | [`DEFINITION_OF_DONE.md`](./DEFINITION_OF_DONE.md) |
| Pre-dev readiness | [`READINESS.md`](./READINESS.md) |
| Retrospectives | [`../retros/`](../retros/) |
| Skills map | [`../SKILLS_MAP.md`](../SKILLS_MAP.md) |

---

## Stack di riferimento (MVP)

Next.js App Router · Auth.js · Prisma · PostgreSQL · SeaweedFS · pg-boss · Nodemailer + Mailpit — **nessun SaaS a pagamento** nel path critico.
