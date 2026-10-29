# Definition of Done — FacilityFlow Retail

Documento globale per Sprint 1–4. Stack di riferimento: **Next.js**, **Auth.js**, **Prisma**, **PostgreSQL**, **SeaweedFS**, **pg-boss**, **Mailpit** (OSS-only / self-host). Fonte prodotto: [`../BACKLOG.md`](../BACKLOG.md), stack: [`../STACK.md`](../STACK.md).

---

## Definition of Done — Story

Una user story è **Done** solo se tutti i punti sotto sono soddisfatti.

- [ ] **Acceptance Criteria** della story soddisfatti e verificabili
- [ ] **Isolamento tenant** verificato (nessun leak cross-tenant su query, API, UI, job, allegati)
- [ ] **Test di dominio** sulla logica rilevante (stati ticket, SLA, RBAC, costi, ecc.)
- [ ] **Compose / verify** rispettato secondo [`.cursor/rules/post-dev-verify.mdc`](../../../.cursor/rules/post-dev-verify.mdc): typecheck, lint, test rilevanti; se c’è Compose → health **app / db / jobs**; altrimenti check locali + `TODO compose` nel report
- [ ] **Nessun SaaS a pagamento** nel path critico (no Clerk, Neon/Supabase Cloud, R2/S3 paid, Resend/Postmark, Inngest/Trigger Cloud, Sentry Cloud, ecc.)
- [ ] **UI in italiano** sulle superfici toccate
- [ ] Stati **empty / loading / error** gestiti sulle superfici toccate
- [ ] **Nessun code smell** nuovo introdotto intenzionalmente
- [ ] **BACKLOG** aggiornato (checkbox / stato story in `docs/product/BACKLOG.md`)
- [ ] **GitFlow**: lavoro su `feature/*` / `bugfix/*` → **PR auto-merge** verso **`develop`** (niente push diretto feature su `main`/`develop`)

---

## Definition of Done — Increment (fine sprint)

L’Increment di sprint è **Done** solo se:

- [ ] Tutte le story selezionate nello Sprint Backlog sono Done (o esplicitamente droppate/ripianificate nel backlog)
- [ ] Sprint Goal raggiunto (o scostamento documentato in Review)
- [ ] Stack Compose (quando presente) healthy: **app**, **db**, **jobs** (pg-boss worker), servizi collaterali rilevanti (SeaweedFS, Mailpit in dev)
- [ ] Nessuna regressione critica nota sui percorsi smoke dello sprint
- [ ] `docs/product/BACKLOG.md` allineato allo stato reale
- [ ] Retro scritta in `docs/product/retros/S{N}-YYYY-MM-DD.md`
- [ ] Sprint Backlog successivo (o bozza) pronto con Goal, capacità, dipendenze

---

## Definition of Ready (DoR)

Una story è **Ready** per lo Sprint Planning / implementazione solo se:

- [ ] Ha **Acceptance Criteria** chiari e testabili
- [ ] **Dipendenze** note (story/epic precedenti, servizi Compose, seed, RBAC)
- [ ] Scope **in-backlog** e allineato a `STACK.md` (**OSS-only**)
- [ ] Priorità e sprint di appartenenza chiari
- [ ] Prima dell’implementazione: **Analysis Card** pubblicata (regola [`.cursor/rules/pre-dev-analysis.mdc`](../../../.cursor/rules/pre-dev-analysis.mdc))
- [ ] Se cambio architetturale / nuova dipendenza pesante / espansione scope → **conferma utente** prima del codice

---

## Checklist — Sprint Exit

Alla chiusura dello sprint:

1. [ ] Spuntare story/AC in `docs/product/BACKLOG.md`
2. [ ] Verificare DoD Increment
3. [ ] Creare retro: `docs/product/retros/S{N}-YYYY-MM-DD.md` (cosa è andato bene, cosa migliorare, action item ≤ 5, refactor candidati)
4. [ ] Preparare next Sprint Backlog (Goal, capacità ~1–2 FTE × 2 settimane, dipendenze, story ID)
5. [ ] Annotare eventuali item droppati / stretch e rischi aperti

---

## Template Verify report (breve)

Usare dopo ogni slice significativa (vedi `post-dev-verify`):

```text
### Verify report
- Comandi: …
- Esito: PASS | FAIL (dettaglio)
- Health stack: app/db/jobs | N/A (TODO compose)
- Smoke: …
- Perf: … (regressioni + proposte se presenti)
- Follow-up: …
```

---

## Riferimenti

| Documento | Percorso |
|-----------|----------|
| Product Backlog | [`../BACKLOG.md`](../BACKLOG.md) |
| Stack OSS | [`../STACK.md`](../STACK.md) |
| RBAC | [`../RBAC.md`](../RBAC.md) |
| Indice sprint | [`README.md`](./README.md) |
| Retros | [`../retros/`](../retros/) |
| Post-dev verify | [`.cursor/rules/post-dev-verify.mdc`](../../../.cursor/rules/post-dev-verify.mdc) |
| Agile Scrum | [`.cursor/rules/agile-scrum.mdc`](../../../.cursor/rules/agile-scrum.mdc) |
| GitFlow | [`.cursor/rules/gitflow.mdc`](../../../.cursor/rules/gitflow.mdc) |
