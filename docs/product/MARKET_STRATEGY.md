# FacilityFlow Retail — Market strategy & monetization (synthesis)

> **Date:** 2026-11-05  
> **Team:** PO · Competitive Intel · Market Analyst · Growth/UX · Architect (N-agent discovery)  
> **Companions:** [`MARKET_SIZING_ITALY.md`](./MARKET_SIZING_ITALY.md) · [`COMPETITIVE_POSITIONING.md`](./COMPETITIVE_POSITIONING.md) · [`AI_PLATFORM.md`](./AI_PLATFORM.md)

**Verdict in one line:** Sell a **managed EU SoR** for mid-market retail/franchise (10–50 PV) that kills WhatsApp+Excel on auditability, costi/PV and vendor loop — **not** a CMMS seat clone. Monetize **hosting + support + franchise pack**, keep software OSS.

---

## 1. Executive summary

| Question | Answer |
|----------|--------|
| Who pays? | **HQ Ops / Facility Manager** (sometimes franchisor); store & vendor = adoption, not seat revenue |
| What they buy | Audit + SLA breach + vendor portal/verify + costi/PV + IT UX + EU data control |
| What they ignore | Per-requester seats, inventari pezzi, IoT, WA Business API, AI-as-SoR |
| Market to own | ~**300** Italy chains in 10–50 PV band; SAM ~**230** on WA/Excel; Y3 SOM **15–25** tenants / **€150–350k ARR** |
| Price anchor | Hosted **~€18–25/PV/mo** → 15 PV **€290–450**, 25 PV ~**€840** (hosted+support), 50 PV **€790–1.200** |
| Beat whom first | WA+Excel → then helpdesk “wrong tool” → then MaintainX/UpKeep on wedge → dodge ServiceChannel/Facilio |
| Closest IT threat | **mainsim**, **Geomap** (full CAFM/servizi) — win on **TTV &lt;2 settimane** and light wedge |
| Hard gate | **Managed hosting live (F3-01 / E14)** — without uptime, WTP collapses to “gratis come WA” |

---

## 2. Market size (ladder)

Detail + assumptions: [`MARKET_SIZING_ITALY.md`](./MARKET_SIZING_ITALY.md).

| Layer | Planning figure | Confidence |
|-------|-----------------|------------|
| Global CMMS 2024 | **USD 1.3B**, CAGR **11.1%** → 2.41B (2030) ([GVR](https://www.grandviewresearch.com/industry-analysis/computerized-maintenance-management-system-market-report)) | High |
| Europe CMMS 2024 | **USD 326.7M** | High |
| Europe FM software 2024 | **USD 932M**, CAGR **11.2%** | High |
| Italy CMMS software (derived) | **USD ~26–40M** | Low–Med |
| Franchise IT 2024 | **931** insegne · **67.275** PV · **€35.8B** ([Assofranchising/Nomisma](https://www.nomisma.it/news/franchising-il-giro-daffari-raggiunge-i-358-mld-di-euro-nel-2024/)) | High |
| Target 10–50 PV (facility) | **≈ 300** chains | Low–Med |
| SAM (WA+Excel/light tools) | **≈ 210–255** accounts · ARR ceiling **€1.7–3.8M** @ €8–15k ACV | Med |
| SOM Y3 base | **15–25** tenants · **€150–350k ARR** | Med |
| Value unlock / store / year | **~€600–1.600** (SLA + cost visibility on specialty hard FM) | Low–Med |

Europe still on-prem heavy in CMMS → **self-host / dati EU** is a real sales story, not nostalgia.

---

## 3. Competitive map — how to win

### 3.1 Positioning

```
                    HIGH asset-CMMS depth
                            │
   MaintainX UpKeep Limble  │  Facilio  ServiceChannel
   mainsim Geomap Infocad   │  Corrigo  Fexa  Ecotrak
                            │
   ─────────────────────────┼─────────────────────────→ HIGH retail-vendor depth
                            │
   WA+Excel  Zendesk        │  ★ FacilityFlow wedge
   Freshdesk                │    (IT UX · vendor+verify · costi/PV · RFQ · OSS EU)
                            │
                    LOW asset-CMMS depth
```

### 3.2 Price reality check (list / public)

| Competitor | Signal | Source |
|------------|--------|--------|
| MaintainX | Essential **$20**/user/mo · Premium **$65** (annual) | [getmaintainx.com/pricing](https://www.getmaintainx.com/pricing) |
| UpKeep | **$24** / **$55** user/mo | [upkeep.com/pricing](https://upkeep.com/pricing/) |
| mainsim IT | **€89,90**/user/mo cloud; requesters free | [mainsim.com/prezzi](https://www.mainsim.com/prezzi/) |
| Ecotrak Build | **$25**/location/mo | [ecotrak.com/pricing](https://www.ecotrak.com/pricing) |
| Zendesk Suite | Team **$55** · Pro **$115**/agent | [zendesk.com/pricing](https://www.zendesk.com/pricing/) |
| Lytheron multi-sede IT | €49→€149/mo by sites | [lytheronflowops.it/prezzi](https://lytheronflowops.it/prezzi) |

**FF rule:** price **below** mainsim multi-seat and Zendesk Pro seat math; **above** free WA; sell **€/PV network**, not technician seats. *(Repo one-pager still cites stale MaintainX $16/$49 — use figures above.)*

### 3.3 Win / lose cheat sheet

| Vs | Win when… | Lose when… |
|----|-----------|------------|
| WA+Excel | Audit, breach, costi/PV, ≥3 vendor on portal | ≤3 PV, chaos OK |
| Zendesk/Freshdesk | Facility/vendor/PV finance, not CX | Omnichannel CX only |
| MaintainX/UpKeep/Limble | IT + verify + RFQ + self-host | Parts / meters / IoT |
| Ecotrak | IT language + OSS EU | US franchise + vendor directory |
| SC / Corrigo / Fexa / Facilio | 10–50 PV, no enterprise RFP | 500+ stores, marketplace, IoT cold-chain |
| mainsim / Geomap | Light wedge, &lt;2 wk TTV, no BIM/census project | Full CAFM + rilievo + soft FM |

### 3.4 Moats to prove (falsifiable)

1. **IT retail UX** — store stays off WA after 4 weeks  
2. **Vendor portal + store verify** — closes the loop chat never closes  
3. **Costi/PV as finance SoR** — Excel dies at chargeback  
4. **RFQ + award** — gap vs MaintainX Essential-class  
5. **GDPR / self-host OSS** — procurement prefers control  
6. **AI assist local** — triage/digest/RFQ with human confirm (never SoR)

---

## 4. Monetization (OSS-compatible)

**Model:** Plausible / Supabase — software portable & OSS; money from **managed ops + people**. Not GitLab open-core that strips SSO/compliance from CE. Avoid AGPL dual-license for IT mid-market trust.

| Layer | Paid? |
|-------|-------|
| Software (Compose/k3s path) | No (self-host) |
| Managed EU hosting + backup + updates | **Yes** |
| Support / SLA / onboarding / franchise seed | **Yes** |
| White-label, SSO managed, backup-as-service, vLLM host | **Yes** (ops add-on) |

### Default SKUs (Italy mid-market)

| SKU | 15 PV | 30 PV | 50 PV |
|-----|-------|-------|-------|
| **A. Hosted managed** | €290–450/mo | €490–750/mo | €790–1.200/mo |
| **B. Self-host license** | €2.5–4.5k/yr | €4.5–8k/yr | €7.5–14k/yr |
| **C. Support SLA** | €150–350/mo | €250–500/mo | €400–800/mo |
| **D. Franchise pack setup** | €1.5–3.5k one-shot | | |
| **E. AI assist** | €0–80/mo (self vLLM) or BYOK pass-through | | |

**Example quote:** 25 PV → Hosted **€590** + Support **€250** + setup **€2.490** ≈ **€840/mo**.

**Seats:** HQ / finance pay; **store requesters + vendors free** (mainsim/MaintainX pattern) — hard-charging store seats pushes people back to WA.

---

## 5. Optimizations & extensions that drive USE → PAY

> **Implementazione in-repo (no billing):** [Fase 9](./BACKLOG.md#fase-9--adoption--differentiation-no-billing) · sprint [`sprints/S6-sprint-backlog.md`](./sprints/S6-sprint-backlog.md). Soft seat-gate / Stripe restano esclusi.

### 5.1 Product / growth (ICE order)

| Priority | Bet | Why people pay |
|----------|-----|----------------|
| 1 | Digest email → 3 deep-link + “segna rivisto” | Weekly habit → seat ops/finance |
| 2 | CTA post-onboarding → **Flusso A guidato &lt;15′** | Aha in week 1 |
| 3 | Vendor **first-done** milestone + outbox reminder | Network lock-in |
| 4 | Breach playbook primary CTA | Beats WA panic |
| 5 | Chargeback “Invia a CFO” | Budget owner |
| 6 | Soft seat-gate HQ in members (never block store tickets) | Expansion revenue |
| 7 | Wallboard QR / turno mattina | Store ritual |
| 8 | Trust strip (UE / GDPR / AI human-confirm) | Sales enablement |
| 9 | Invite SM/vendor **from ticket** | Viral seats |
| 10 | Tour «Spiega pagina» on empty KPI | Demo &lt;10′ |

### 5.2 Paid extensions (WTP × OSS feasibility)

1. Managed hosting + backup restore drill  
2. Digest HQ PDF/email + finance export  
3. Franchise pack + assisted 15×5 onboarding  
4. Support SLA  
5. Vendor scorecard + response-time badge  
6. Chargeback multi-PV  
7. Contratto vs misurato (PM)  
8. AI assist pack (BYOK)  
9. White-label reseller  
10. SSO Keycloak pack + audit export  

### 5.3 Architecture enablers (revenue leverage)

1. Tenant provisioning API / Helm  
2. Backup-as-service productized  
3. SSO pack Azure AD ↔ Keycloak  
4. Franchise seed as product  
5. White-label + custom domain  
6. Audit export + retention  
7. HA/DR single-region (before promising 99.9%)  
8. SCIM (only for &gt;€30k ACV pipeline)

### 5.4 Do **not** build (feature traps)

Inventari/IoT · WA Business API · marketplace/escrow · ERP/POS · Zendesk omnichannel · AI-as-SoR · native apps first · multi-country day-1 · aggressive store per-seat · complex billing before ≥80% intake.

---

## 6. 90-day competitive bets (ship order)

Aligned with F6; displace WA first:

1. Onboarding pilota 15×5 (TTV moat)  
2. Transactional email outbox reliability  
3. Digest settimanale HQ  
4. Chargeback / costi per PV  
5. SLA vendor response + badge  
6. Pacchetto Franchise HQ IT  
7. Playbook breach one-click  
8. Calendario Day/Week/Month (parity)  
9. Contratto vs misurato  
10. Store wallboard  

**Punt later:** local AI on triage/digest — after SoR + digest habit.

---

## 7. Pilot → paid playbook

| Phase | Duration | Gate |
|-------|----------|------|
| Design | 1 wk | Managed live; 15×5 seed |
| Pilot | 4–6 wk | Real use |
| Value review | 1 HQ call | Costi/PV + breach + scorecard shown |
| Convert | ≤14 d | Annual hosted+support or license |
| Expand | Q+1 | +PV / AI / SLA gold |

**Convert metrics (must hit before discounting):** ≥80% guasti in FF · Flusso A prova &lt;15′ · ≥1 breach in-app · ≥3 vendor portal · costi/PV ≥1×/sett · digest open ≥50% weeks · WA bypass &lt;20% · convert ≥40% of first 10 pilots.

---

## 8. GTM Italy

1. **SI / MSP** — sell Compose/k3s managed white-label  
2. **Assofranchising / Confcommercio** workshops + pilota  
3. **Direct Ops HQ** — Flusso A demo 15×5  
4. **FM outsourcers** — vendor portal as their client-facing layer  

One-liners (IT):

- «Da WhatsApp ed Excel a un solo SoR su ticket, SLA e costi per punto vendita — con portale fornitori, in italiano.»  
- «Se non è in FacilityFlow, per l’HQ non è successo.»  
- «Wedge retail Italia + self-host UE, senza inventari pezzi né IoT.»

---

## 9. Founder decisions (explicit)

| Decision | Recommendation |
|----------|----------------|
| Billing in critical path? | **No** — invoice/Stripe outside SoR |
| Open-core lock features? | **No** — managed + services |
| Next product epic? | Formalize **M1 provisioner / M2 backup SLA / M3 SSO pack** only after GO on “Fase Billing/Commercial” |
| Price experiment | 1 design partner **25 PV @ ~€840/mo** hosted+support |
| Blocker | **F3-01 VPS / E14** before promising uptime to paying HQ |

---

### Team turn (orchestrator)
- Fase: Discovery / market strategy — **closed**  
- Ruoli: PO, Competitive, Market, Growth, Architect  
- Artefacts: this file + `MARKET_SIZING_ITALY.md`  
- Next: founder GO on commercial packaging; optional BACKLOG epic “M-series” monetization enablers
