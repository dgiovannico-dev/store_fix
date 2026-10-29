# FacilityFlow Retail — Design System

> Spec UX/UI vincolante per l’app ops (store phone-first, HQ desktop, vendor mobile).  
> Stack UI: **Next.js App Router + Tailwind CSS v4 + shadcn/ui (codice owned) + Radix + lucide-react**.  
> Solo librerie OSS. Nessun Tailwind UI a pagamento. Nessun emoji in UI.

**Versione:** 1.0 · **Lingua UI:** italiano · **Modalità:** light primary (dark opzionale post-MVP)

---

### Analysis Card

- **Assunzioni:** shell app ≠ landing marketing; Flussi A/C guidano densità e priorità visuali; brand “FacilityFlow” hero su login/marketing, non solo nav.
- **Ricerca:** shadcn/ui è lo standard de-facto per SaaS Next.js 2025–2026 (copy-in-repo, Tailwind v4, OKLCH, CLI v4); da luglio 2026 Base UI è default su progetti nuovi — FacilityFlow **pinna Radix** (`shadcn init -b radix`) come da STACK. Fonti: [ui.shadcn.com](https://ui.shadcn.com/), [Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4), [Base UI default 2026-07](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default).
- **Scelta di design:** slate profondo + ambra segnale + rosso critico SLA su superfici calme; tipografia Sora + IBM Plex Sans; card solo come container di interazione. Alternativa scartata: tema cream/terracotta o purple-indigo (stereotipo AI) e cataloghi Tailwind UI a pagamento.
- **AI:** no — design system è SoR visuale; nessun assist generativo in MVP.
- **Rischi:** drift vs Base UI default CLI; mitigazione: documentare `-b radix` in scaffold e SKILLS_MAP.

---

## 1. Brand voice (IT)

| Principio | Come si sente | Esempio copy |
|-----------|---------------|--------------|
| **Operativo** | Chiaro, concreto, zero marketing fluff in-app | “Assegna vendor” non “Ottimizza il tuo workflow” |
| **Calmo sotto pressione** | SLA e breach sono evidenti ma non gridano senza contesto | Badge “SLA a rischio” + due, non allarmi generici |
| **Rispettoso del tempo** | Frasi brevi; CTA verbali all’infinito / imperativo | “Apri ticket”, “Chiudi intervento”, “Verifica” |
| **Locale Italia** | Italiano naturale retail/facility, non calchi EN | “Punto vendita”, “Fornitore”, “Guasto”, “In scadenza” |

**Tono vietato:** emoji, ironia, anglicismi inutili (“dashboardize”), urgency fake (“Solo oggi!”).

**Nome prodotto:** **FacilityFlow** — sempre unito, F maiuscole. Su login/marketing è segnale hero (logo + wordmark grande), non sola voce di nav.

---

## 2. Direzione visuale

**Metafora:** sala controllo facility retail — superfici chiare da negozio/ufficio, slate industriale, **ambra** per attenzione operativa, **rosso** solo per critico/breach.

**Anti-pattern (vietati)**

- Purple-on-white / gradient indigo-viola
- Cream + terracotta “editorial”
- Broadsheet: hairline dense, zero radius, colonne giornale
- Glow / glass / 3D Aceternity nello shell app
- Dark mode forzato su store floor (leggibilità outdoor)

---

## 3. Tipografia

### Coppia scelta

| Ruolo | Font | Licenza / fonte | Perché |
|-------|------|-----------------|--------|
| **Display / brand** | **Sora** | OFL · Google Fonts | Geometrico distintivo (≠ Inter/Roboto), forte a grande scala su login; allinea a “flow” operativo senza serif da brochure |
| **Body / UI / tabelle** | **IBM Plex Sans** | OFL · Google Fonts / IBM | Numerazione e densità dati eccellenti (SLA, €, ID ticket); leggibile outdoor su phone; DNA enterprise OSS |

**Non usare:** Inter, Roboto, Arial, system-ui come face primaria.

### Scala (rem @ 16px)

| Token | Size | Line-height | Weight | Uso |
|-------|------|-------------|--------|-----|
| `--text-display` | 2.25rem (36) | 1.15 | 600 Sora | Hero login / marketing |
| `--text-h1` | 1.75rem (28) | 1.2 | 600 Sora | Titolo pagina HQ |
| `--text-h2` | 1.375rem (22) | 1.25 | 600 Sora | Sezione |
| `--text-h3` | 1.125rem (18) | 1.3 | 600 Plex | Card title / drawer |
| `--text-body` | 1rem (16) | 1.5 | 400 Plex | Default |
| `--text-body-sm` | 0.875rem (14) | 1.45 | 400 Plex | Meta, filtri |
| `--text-caption` | 0.75rem (12) | 1.4 | 500 Plex | Badge, timestamp |
| `--text-mono` | 0.875rem | 1.4 | 500 **IBM Plex Mono** (opz.) | ID ticket, codici store |

Phone store/vendor: base **16px** (no zoom iOS su input); titoli pagina max `h2`.

---

## 4. Colore — token CSS (OKLCH)

Allineati a Tailwind v4 / shadcn (`@theme`). Light = default.

```css
:root {
  /* Brand / superfici */
  --background: oklch(0.985 0.004 95);      /* carta calma, non cream */
  --foreground: oklch(0.22 0.02 250);       /* slate profondissimo */
  --card: oklch(1 0 0);
  --card-foreground: var(--foreground);
  --popover: oklch(1 0 0);
  --popover-foreground: var(--foreground);

  --primary: oklch(0.32 0.04 250);          /* deep slate brand */
  --primary-foreground: oklch(0.98 0.005 95);
  --secondary: oklch(0.94 0.01 250);
  --secondary-foreground: oklch(0.28 0.03 250);
  --muted: oklch(0.955 0.008 250);
  --muted-foreground: oklch(0.48 0.02 250);
  --accent: oklch(0.93 0.02 250);
  --accent-foreground: oklch(0.28 0.03 250);

  --border: oklch(0.88 0.01 250);
  --input: oklch(0.88 0.01 250);
  --ring: oklch(0.55 0.12 75);              /* focus = ambra segnale */

  /* Semantici facility / SLA */
  --signal: oklch(0.78 0.14 75);            /* ambra attenzione */
  --signal-foreground: oklch(0.28 0.06 70);
  --critical: oklch(0.55 0.2 25);           /* rosso critico / breach */
  --critical-foreground: oklch(0.98 0.01 25);
  --success: oklch(0.55 0.12 150);
  --success-foreground: oklch(0.98 0.02 150);
  --info: oklch(0.55 0.08 250);
  --info-foreground: oklch(0.98 0.01 250);

  /* SLA mapping */
  --sla-ok: var(--success);
  --sla-risk: var(--signal);
  --sla-breached: var(--critical);

  --radius: 0.5rem; /* restrained — vedi §6 */
}
```

**Mapping priorità ticket → colore**

| Priorità / stato | Token | UI |
|------------------|-------|-----|
| `critical` | `--critical` | Dot + label, non fill intera riga |
| SLA a rischio (&lt;25% tempo) | `--signal` | Badge outline ambra |
| `slaBreached` | `--critical` | Badge solid + bordo sinistro 3px sulla row |
| `verified` / ok | `--success` | Badge soft |

**Charts (Tremor o Recharts via shadcn):** palette sequenziale slate → info → signal → critical; mai rainbow marketing.

---

## 5. Spacing

Scala **4px** (Tailwind default).

| Token | px | Uso |
|-------|-----|-----|
| `1` | 4 | Gap icona-testo stretto |
| `2` | 8 | Padding chip |
| `3` | 12 | Gap form field |
| `4` | 16 | Padding card / section mobile |
| `6` | 24 | Separazione sezioni |
| `8` | 32 | Page padding desktop |
| `12` | 48 | Hero login vertical rhythm |

**Larghezze content:** store/vendor max `480px` centrato o full-bleed phone; HQ main `max-w-7xl`; form create-ticket full width phone con sticky CTA bottom.

---

## 6. Radius (contenuto)

| Token | Valore | Uso |
|-------|--------|-----|
| `--radius-sm` | 4px | Badge, input densi |
| `--radius` | 8px | Button, input, dialog |
| `--radius-md` | 10px | Card interazione |
| `--radius-lg` | 12px | Sheet mobile, login panel |

Niente `rounded-full` su CTA primarie (riservato a avatar / status dot 8px).

---

## 7. Elevation (minimale)

| Livello | Trattamento | Uso |
|---------|-------------|-----|
| 0 | Solo border `--border` | Liste, tabelle, filtri |
| 1 | `shadow-sm` + border | Dropdown, popover |
| 2 | `shadow-md` | Dialog / sheet |

Vietato: multi-layer glow, neumorphism, blur pesante sullo shell.

---

## 8. Iconografia

- Libreria: **lucide-react** (OSS).
- Stroke 1.75–2; size UI `16` / `20`; touch target min **44×44**.
- Nessuna icona decorativa senza label accessibile (`aria-hidden` + testo vicino, o `sr-only`).

---

## 9. Motion (`motion` — ex Framer Motion)

Max **2–3** motion intenzionali in-app:

1. **Sheet / dialog enter** — fade + 8px translateY, 180ms ease-out  
2. **Bell badge** — scale pulse una volta su nuovo count (non loop infinito)  
3. **Lista triage** — opzionale layout shift soft su filtri (solo se non degrada a11y `prefers-reduced-motion`)

Vietato: page transition marketing, parallax, confetti, skeleton shimmer aggressivo.

`prefers-reduced-motion: reduce` → solo fade o nessuno.

---

## 10. Inventario componenti → shadcn/ui

| Pattern prodotto | shadcn / OSS | Note |
|------------------|--------------|------|
| Button, Icon button | `Button` | Variant: default=slate, destructive=critical, outline, ghost |
| Input, Textarea, Select | `Input` `Textarea` `Select` | + react-hook-form + zod |
| Checkbox / Switch / Radio | rispettivi | |
| Form field | `Form` + Label + FieldError | Messaggi IT |
| Badge priorità/SLA | `Badge` | semantic variants custom |
| Dialog / AlertDialog | `Dialog` `AlertDialog` | Cancel ticket, verify reject |
| Sheet (mobile) | `Sheet` | Filtri HQ phone, azioni vendor |
| Dropdown / Context | `DropdownMenu` | Row actions |
| Tabs | `Tabs` | Dettaglio ticket (Timeline / Note / Allegati / Costi) |
| Table HQ | **TanStack Table** + shadcn Table | Virtualize se &gt;100 row |
| Data dense list mobile | non-Table: list rows | Store/vendor inbox |
| Toast | **Sonner** (shadcn default 2025+) | Success/error IT |
| Skeleton | `Skeleton` | Loading liste |
| Avatar | `Avatar` | Iniziali utente |
| Separator | `Separator` | |
| Tooltip | `Tooltip` | Solo desktop HQ |
| Navigation | `Sidebar` (HQ) + bottom nav custom (store/vendor) | Vedi shell |
| Charts dashboard | **Tremor** *oppure* Recharts (shadcn chart) | OSS; una sola scelta in scaffold |
| Calendar date filter | `Calendar` + `Popover` | |
| Progress onboarding | `Progress` | Checklist Flusso C |
| File upload | custom + Dropzone pattern | Foto ticket; progress bar |
| Empty | pattern §12 | non un componente generico “EmptyCute” |

**Non introdurre:** Tailwind UI Pro, Aceternity UI come dipendenza shell, librerie icona duplicate.

---

## 11. Accessibilità — WCAG 2.1 AA

- Contrasto testo/icone ≥ **4.5:1** (badge solid critical/signal verificati su light).
- Focus visibile = `ring` ambra 2px; mai `outline-none` senza sostituto.
- Ordine focus logico; trap in Dialog/Sheet.
- Label associate; errori annunciati (`aria-live="polite"` / `assertive` su submit fail).
- Target touch ≥ 44px (store create ticket, vendor status).
- Non affidare info solo al colore (SLA: icona + testo).
- Test tastiera su triage HQ e create-ticket store.
- Lingua: `lang="it"` sul document.

Checklist epic correlata: `US-E12-*` a11y/perf nel backlog.

---

## 12. Empty / Loading / Error

### Empty

| Contesto | Messaggio (IT) | CTA |
|----------|----------------|-----|
| HQ ticket list | “Nessun ticket con questi filtri.” | “Reimposta filtri” |
| HQ post-signup | “La rete non è ancora pronta.” | “Continua onboarding” |
| Store i miei ticket | “Nessun guasto aperto. Tutto ok per ora.” | “Apri ticket” |
| Vendor inbox | “Nessun intervento assegnato.” | — (no fake CTA) |
| Dashboard senza dati | “Completa l’onboarding per vedere i KPI.” | Link checklist |

Layout: icona lucide muted + titolo + 1 riga + CTA testo/button. **No card decorative, no illustrazioni stock pesanti.**

### Loading

- Liste: 4–6 `Skeleton` row (altezza fissa).
- Dettaglio: skeleton header + 2 blocchi.
- Submit: button `disabled` + spinner lucide `Loader2`, label “Salvataggio…”.
- Evitare full-page spinner dopo first paint.

### Error

| Tipo | Pattern |
|------|---------|
| Validazione form | Inline sotto campo, rosso `--critical`, focus sul primo errore |
| API 4xx business | Toast Sonner + messaggio azione (“Vendor obbligatorio per assegnare”) |
| 5xx / rete | Banner persistente in pagina + “Riprova” |
| Forbidden RBAC | Pagina dedicata sobria: “Non hai i permessi per questa azione.” |
| Upload fail | Riga file in errore + riprova singolo |

---

## 13. Role shells

### 13.1 HQ (`owner`, `admin_hq`, `ops_coordinator`, `viewer_finance`)

```
┌──────────────────────────────────────────────────────────┐
│ Sidebar (collassabile) │ Topbar: tenant · cerca · Bell · user │
│  Dashboard             ├──────────────────────────────────┤
│  Ticket                │ Main content (max-w-7xl)         │
│  Store                 │ densità tabella + filtri sticky  │
│  Vendor                │                                  │
│  Asset (opt)           │                                  │
│  Impostazioni          │                                  │
└──────────────────────────────────────────────────────────┘
```

- Desktop-first; breakpoint `md+` sidebar; `&lt;md` sheet nav.
- `viewer_finance`: stessa shell, nav ridotta (Dashboard, Ticket read-only, Costi).

### 13.2 Store (`store_manager`, `store_staff`)

```
┌─────────────────────┐
│ FacilityFlow · PV   │  header compatto + Bell
│ Titolo schermata    │
│                     │
│ Contenuto phone     │
│                     │
│ [CTA sticky bottom] │  es. Apri ticket
├─────────────────────┤
│ Home · Ticket · + · │  bottom nav 3–4 voci
│ Account             │
└─────────────────────┘
```

- Phone-first (390px target).
- Deep-link kiosk: stesso shell, store pre-selezionato.

### 13.3 Vendor

```
┌─────────────────────┐
│ FacilityFlow · Vendor│
│ Inbox / Dettaglio   │
│ CTA stato sticky    │  In corso · Chiudi
├─────────────────────┤
│ Inbox · Chiusi · Me │
└─────────────────────┘
```

- Solo ticket assegnati; zero nav HQ.
- Chiusura: foto + costo in un flusso lineare (1 schermata scrollabile).

### 13.4 Login / marketing

- Brand **FacilityFlow** hero-level (wordmark Sora display + claim 1 riga).
- Un CTA primario: “Accedi” / “Crea workspace”.
- Nessuna card in hero; superficie full-bleed soft gradient slate (non purple).

---

## 14. Form standard

- **react-hook-form + zod**; schema condivisi server/client dove possibile.
- Label sopra il campo; help text muted; required indicato con “(obbligatorio)” testuale, non solo `*`.
- Create ticket store: pochi campi obbligatori (categoria, priorità, descrizione, foto); asset opzionale.

---

## 15. Densità & contenuti

| Ruolo | Densità | Card? |
|-------|---------|-------|
| HQ list | Alta (table) | No — rows |
| HQ detail | Media | Sì solo blocco “Azioni triage” e “Costi” se interattivi |
| Store create | Media | No — form full bleed |
| Vendor close | Media | Un blocco “Prove & costi” come container interazione |
| Dashboard | Media | KPI come metric strip **senza** card nested se non clickable |

---

## 16. Librerie OSS ammesse (UI)

| Lib | Uso |
|-----|-----|
| shadcn/ui (owned) | Primitives UI |
| Radix UI | Accessible primitives (pin `-b radix`) |
| Tailwind CSS v4 | Layout/token |
| lucide-react | Icone |
| motion | 2–3 motion |
| TanStack Table | Tabelle HQ |
| react-hook-form + zod | Form |
| Tremor **o** Recharts | Charts |
| Sonner | Toast |
| next/font (Google) | Sora + IBM Plex Sans |

---

## 17. Checklist implementazione FE

- [ ] Token CSS in `globals.css` / `@theme`
- [ ] Font via `next/font` (no FOUT layout shift)
- [ ] `shadcn init -b radix` documentato in README scaffold
- [ ] Shell HQ / Store / Vendor separate per layout route groups
- [ ] Nessun emoji; copy IT revisionato UX Writer
- [ ] Smoke 390px: create ticket + vendor status
- [ ] Contrasto badge SLA verificato

---

## Riferimenti

- Product: [`../product/BACKLOG.md`](../product/BACKLOG.md), [`../product/STACK.md`](../product/STACK.md), [`../product/RBAC.md`](../product/RBAC.md)
- IA: [`INFORMATION_ARCHITECTURE.md`](./INFORMATION_ARCHITECTURE.md)
- Wireframe: [`WIREFRAMES.md`](./WIREFRAMES.md)
- shadcn: [https://ui.shadcn.com/](https://ui.shadcn.com/)
