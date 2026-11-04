# FacilityFlow Retail — Tutorial interattivo (piano)

> **Stato:** bozza 2026-11-04 — **attende conferma PO**.  
> **Obiettivo:** tour **completo, dinamico, interattivo e curato** sulle sezioni dell’app (nessuna esclusa per il ruolo), **rilanciabile quando si vuole**.  
> **Non sostituisce** `/onboarding` (checklist setup rete) — lo **complementa** (educazione prodotto).

---

## Analysis Card

- **Assunzioni:** UI IT default; tre audience (HQ / store / vendor); seed 15×5 disponibile per demo; brand Sora/Plex slate+ambra invariato (no purple glow tour generico).
- **Ricerca:** React Joyride MIT React-first ([react-joyride.com](https://react-joyride.com/)); Driver.js MIT spotlight leggero ([wakeline Next.js compare](https://wakeline.io/for/nextjs)); Shepherd/Intro.js **AGPL** → esclusi (OSS + prodotto commerciale). NextStep MIT se serve routing nativo App Router.
- **Scelta di design:** **Driver.js** (spotlight) + orchestratore FF multi-route (router.push + `waitForElement`) + tooltip custom Design System. Alternativa più “React”: Joyride v3 — scartata come default perché Driver.js è più “bello” out-of-box sullo spotlight e zero React coupling; Joyride resta fallback se a11y/focus trap risultano insufficienti in QA.
- **AI:** later — opz. “spiega questo schermo” (F7) **dopo** il tour strutturato; il tutorial non dipende da LLM.
- **Rischi:** selettori fragili; tour lungo → abbandono; SSR; conflitti con Dialog/Sheet. Mitigazioni: `data-tour` stabili, capitoli saltabili, destroy on unmount, z-index sopra shell.

---

## Perché (valore)

| Problema oggi | Con tutorial |
|---------------|--------------|
| Onboarding = solo checklist dati | Capisce **Flussi A/B/C** e dove cliccare |
| Help assente in-app | Entry point sempre visibile |
| Demo commerciale fragile | Tour HQ riproducibile in &lt;10 min |

---

## Requisiti (DoD prodotto)

1. **On-demand:** avvio da menu Aiuto / `?` shortcut / CTA empty-state; riavvio illimitato.
2. **Completo per ruolo:** ogni route/nav item accessibile al ruolo ha ≥1 step (lista sotto).
3. **Dinamico:** salta step se elemento assente (RBAC, empty list); adatta copy al ruolo; riprende capitolo dopo navigazione.
4. **Interattivo:** highlight reale UI; Avanti/Indietro/Salta capitolo/Esci; opz. “Prova tu” (focus campo senza write SoR forzato).
5. **Bello:** overlay soft, spotlight arrotondato, tooltip branded (token esistenti), motion 2–3 intentional (fade overlay, pulse beacon), phone-first su store/vendor.
6. **a11y:** focus trap nel tooltip, Esc chiude, copy screen-reader, contrasto AA.
7. **i18n:** stringhe in `it` + `en` catalogs.
8. **No SaaS tour cloud** (Appcues ecc.) — OSS-only.

---

## Copertura sezioni (nessuna esclusa)

### Auth / entry (tutti, tour corto “primo accesso” opz.)

| Route | Step focus |
|-------|------------|
| `/login` | Email/password, link forgot |
| `/signup` / `/register` | Creazione tenant (solo se guest) |
| `/invite/[token]` | Accettazione invito |
| `/onboarding` | Checklist vs tutorial prodotto (differenza) |

### HQ (`hqSidebarItems` + deep links)

| Sezione | Route | Contenuti tour |
|---------|-------|----------------|
| Shell | layout | Sidebar, breadcrumb, bell notifiche, menu Aiuto→Tutorial |
| Dashboard | `/app/dashboard` | KPI strip, tabella store, CTA |
| Ticket list | `/app/tickets` | Filtri, SLA badge, DataTable, row actions |
| Ticket new | `/app/tickets/new` | Sezioni form |
| Ticket detail | `/app/tickets/[id]` | Tabs, assign, costi, summarize assist, verify |
| Store | `/app/stores`, `/[id]`, `/import` | CRUD, CSV, webhook/ntfy |
| Vendor | `/app/vendors`, `/[id]`, `/scorecard` | Coverage, scorecard |
| Asset | `/app/assets` | Registry |
| Contratti | `/app/contratti` | Lista + link PM |
| Calendario | `/app/calendario` | Mese/settimana/agenda, create ancorato |
| RFQ | `/app/rfq`, `/new`, `/[id]` | Creazione, bid, award |
| Locale | `/app/settings/locale` | Lingua/valuta |
| Members | `/app/settings/members` | Invite ruoli |
| Audit | `/app/settings/audit` | Log |
| (F7) AI | `/app/settings/ai` | Quando esiste — preset/BYOK |

`viewer_finance`: solo dashboard / tickets / contratti (capitoli ridotti).

### Store (PhoneShell)

| Sezione | Route | Contenuti |
|---------|-------|-----------|
| Bottom nav | shell | 4 tab |
| Ticket | `/app/tickets`, `[id]` | Lista + dettaglio store |
| Segnala | `/app/segnala`, `/[storeId]` | Intake WA-like |
| Nuovo ticket | `/app/tickets/new` | Form |
| Locale | `/app/settings/locale` | Preferenze |

### Vendor (PhoneShell)

| Sezione | Route | Contenuti |
|---------|-------|-----------|
| Inbox | `/vendor/inbox` | Ticket assegnati |
| Ticket | `/vendor/tickets/[id]` | Done / note |
| RFQ | `/vendor/rfq`, `/[id]` | Bid |

---

## UX del prodotto tutorial

### Entry points

1. **Menu Aiuto** (sidebar HQ / overflow phone): «Tutorial interattivo».
2. **Shortcut** `?` (non in input).
3. **Prima sessione** soft modal: «Vuoi un giro guidato?» → Sì / Più tardi / Non mostrare più.
4. **Per sezione:** link «Spiega questa pagina» in PageFrame (avvia solo capitolo locale).

### Struttura

```
Tour (audience)
 ├─ Capitolo: Panoramica shell
 ├─ Capitolo: Dashboard | Ticket | …
 └─ Capitolo: Flusso A (happy path narrato, senza mutate se demo-read-only)
```

- Progress bar: capitolo N/M + step.
- Persistenza: `localStorage` `ff.tour.{userId}.{audience}` + opz. `UserTourProgress` (resume cross-device).
- Modalità **Demo read-only:** nessuna server action; solo highlight. Modalità **Guidata pratica** (opt-in): può aprire form precompilati su seed.

### Visual (bello)

- Overlay `color-mix(slate 55%, transparent)`; spotlight radius allineato a card radius DS.
- Tooltip: tipografia brand, accento ambra sul primary CTA «Avanti», secondary «Salta».
- Beacon discreto (no emoji, no pill cluster).
- Dark mode: non introdurre.

---

## Architettura tecnica

```
src/features/product-tour/
  tour-registry.ts          # capitoli × audience × role gates
  tour-controller.tsx       # client: start/stop/resume, router sync
  tour-tooltip.tsx          # UI branded
  use-tour-launch.ts
  data-tour.ts              # const selectors

data-tour="hq.nav.tickets"  # su NavLink, KPI, filtri, …
```

**Lib:** `driver.js` (MIT) dynamic import in client only; `destroy()` on route change cleanup.

**Multi-page:** step con `route: '/app/tickets'` → `router.push` → `waitForElement('[data-tour=…]')` → `drive(i)`.

**Feature flag:** `FF_PRODUCT_TOUR=1` (default on in lab).

---

## Piano backlog (Fase 8)

| ID | Slice | Prio | AC |
|----|-------|------|-----|
| **F8-01** | Foundation Driver.js + controller + Help entry + `?` | **P0** | Start/stop; Esc; destroy safe SSR |
| **F8-02** | `data-tour` su shell HQ/phone + design tooltip branded | **P0** | Spotlight su nav reale; token DS |
| **F8-03** | Capitoli HQ: dashboard, tickets list/detail/new | **P0** | Copertura ticket hub completa |
| **F8-04** | Capitoli HQ: stores, vendors, scorecard, assets, contratti | **P1** | Tutte le CRUD list |
| **F8-05** | Capitoli HQ: calendario, RFQ, settings (locale/members/audit) | **P1** | Nessuna voce nav HQ senza step |
| **F8-06** | Capitoli Store + Vendor (phone) | **P0** | Bottom nav + pagine chiave |
| **F8-07** | Capitolo Flusso A narrato (HQ→vendor→verify) | **P1** | Story multi-route read-only |
| **F8-08** | Soft first-login + progress persist + «Spiega questa pagina» | **P1** | Resume; per-page chapter |
| **F8-09** | i18n IT/EN + a11y QA + empty/missing element skip | **P0** | Skip dinamico; axe smoke |
| **F8-10** | Auth/onboarding différance + docs `PRODUCT_TOUR.md` ops | **P2** | Runbook; distinzione checklist |

**Ordine:** F8-01 → 02 → 03∥06 → 04 → 05 → 07 → 08 → 09 → 10.

---

## Fuori scope

- Tour SaaS hosted (Appcues, Userpilot, …).
- Video MP4 obbligatori (opz. link docs più tardi).
- AI che genera step a runtime (F7 later).
- Mutazioni SoR forzate dal tour in produzione.

---

## Conferma PO

1. **GO F8** con Driver.js + orchestratore FF?  
2. Soft modal primo login **on** di default?  
3. Flusso A capitolo in modalità solo lettura ok?
