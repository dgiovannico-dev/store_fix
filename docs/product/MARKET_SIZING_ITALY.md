# FacilityFlow Retail — Market sizing (Italy → EU)

> **Role:** Market Analyst  
> **Target:** Mid-market retail / franchise chains, ~10–50 punti vendita (PV), facility maintenance SoR  
> **Geography:** Italy first, then EU  
> **Date:** 2026-11-05  
> **Companion:** [`COMPETITIVE_POSITIONING.md`](./COMPETITIVE_POSITIONING.md)

All € figures are **order-of-magnitude** models for planning, not audited forecasts. Confidence tagged **low / med / high** per claim.

---

## 1. Global / regional software markets (cited)

### 1.1 CMMS software

| Metric | Value | Source | Confidence |
|--------|-------|--------|------------|
| Global CMMS revenue 2024 | **USD 1.3B** (~1.29B) | [Grand View Research — CMMS market](https://www.grandviewresearch.com/industry-analysis/computerized-maintenance-management-system-market-report) | **High** (primary analyst page) |
| Global CMMS 2030 | **USD 2.41B** | [GVR press release](https://www.grandviewresearch.com/press-release/global-computerized-maintenance-management-system-market) | **High** |
| CAGR 2025–2030 | **11.1%** | GVR | **High** |
| Europe CMMS 2024 | **USD 326.7M** (25.3% of global) | [GVR Europe CMMS outlook](https://www.grandviewresearch.com/horizon/outlook/computerized-maintenance-management-system-market/europe) | **High** |
| Europe CMMS 2030 | **USD 607.2M** | Same | **High** |
| Europe CMMS CAGR 2025–2030 | **11.0%** | Same | **High** |
| Alt. global view (illustrative) | ~USD 1.32B (2024) → 2.29B (2029), CAGR ~12.2% | Secondary aggregator citing other houses ([Web3Wire / TBRC-style](https://web3wire.org/web3/computerized-maintenance-management-system-market-expected-to-achieve-12-2-cagr-by-2029-growth-forecast-insights/)) | **Low** (use GVR as primary) |

**Implication:** CMMS is a **~€1.2B** global software niche growing double-digit; Europe is ~¼ of spend and still on-prem heavy (GVR: on-prem largest Europe segment 2024) — favorable for **self-host / EU-data** narratives vs USA-cloud CMMS.

### 1.2 Facility management *software* (broader than CMMS)

| Metric | Value | Source | Confidence |
|--------|-------|--------|------------|
| Europe FM software 2024 | **USD 932M** | [GVR Europe FM software](https://www.grandviewresearch.com/horizon/outlook/facilities-management-software-market/europe) | **High** |
| Europe FM software 2033 | **USD 2,372M** | Same | **High** |
| CAGR 2025–2033 | **11.2%** | Same | **High** |
| Global FM software 2025 | **USD 2.65B** → 4.95B by 2031, CAGR **10.7%** | [Mordor — FM Software](https://www.mordorintelligence.com/industry-reports/facility-management-software-market) | **Med** (paywalled methodology) |

FM software ≫ pure CMMS (IWMS, space, energy, soft services). FacilityFlow sits in the **retail work-order / SLA / vendor / cost** wedge inside this envelope — not full IWMS.

### 1.3 Italy — software vs services

| Layer | Italy figure | Notes | Confidence |
|-------|--------------|-------|------------|
| Italy **FM services** market | **USD 9.49B** (2025) → 10.36B (2031), CAGR **1.39%** | [Mordor — Italy Facility Management](https://www.mordorintelligence.com/industry-reports/italy-facility-management-market) — **outsourced hard/soft services**, not SaaS | **Med** (services ≠ software) |
| Italy **FM / CMMS software** (published € size) | **Not publicly disclosed** in open summaries (6W Research lists Italy FM software report without free size) | Gap | **n/a** |
| **Derived Italy CMMS software (model)** | **USD ~26–40M (2024)** | Europe CMMS $326.7M × Italy ~**8–12%** of EU GDP ([Statista EU GDP shares 2024](https://www.statista.com/statistics/1373419/eu-gdp-percentage-share-member-state-2024/): Italy **12.22%**; haircut to **8–10%** for lagging SME digital + DE/FR concentration of industrial CMMS) | **Low–Med** |
| Italy share of Europe FM software (model) | **USD ~75–110M (2024)** | Same GDP-share method on $932M Europe FM SW | **Low** |

**Assumption (explicit):** No open Italy CMMS € series; top-down GDP proxy only. Do **not** treat Mordor’s $9.5B Italy FM figure as addressable software TAM.

---

## 2. Italian retail / franchise universe (account base)

### 2.1 Franchise statistics (primary proxy)

| Year / source | Insegne (networks) | Punti vendita franchising | Giro d’affari | Confidence |
|---------------|--------------------|---------------------------|---------------|------------|
| 2023 (Assofranchising / Nomisma) | **929** | **65,806** PVF | **€34.0B** | **High** — [PDF Rapporto 2024](https://www.assofranchising.it/images/documenti/rapporto_assofranchising_2024.pdf) |
| 2024 (Assofranchising press) | **931** | **67,275** | **€35.8B** | **High** — [Assofranchising CS](https://www.assofranchising.it/news/stampa/comunicati-stampa/il-franchising-si-conferma-un-modello-vincente-nel-2024-il-giro-daffari-raggiunge-35-8-mld-di-euro-e-vale-l1-8-del-valore-aggiunto-nazionale.html) / [Nomisma](https://www.nomisma.it/news/franchising-il-giro-daffari-raggiunge-i-358-mld-di-euro-nel-2024/) |
| 2025 (Assofranchising 2026 report, media) | **707** insegne*, **62,449** PV | **€39B** | **Med** — methodology may have tightened vs prior years ([Il Sole 24 Ore](https://www.ilsole24ore.com/art/nel-2025-giro-d-affari-franchising-raggiunge-39-miliardi-euro-8percento-AIDlAZjD), [Rabdo summary](https://rabdo.io/blog/franchising-in-italia-numeri)) |

\*If using 2025 “707” series, treat as **different universe definition**; prefer **~900–930** for continuity unless Assofranchising publishes a bridge table.

**Size band (critical for 10–50 PV):**

| Claim | Value | Source | Confidence |
|-------|-------|--------|------------|
| Share of networks with **&lt;50 PV** | **64%** (2025) | Sole 24 Ore / Assofranchising 2026 | **Med–High** |
| Share of networks with **200–500 PV** | **7%** | Same | **Med–High** |
| Mean PV / network | ~70–90 (skewed by mega-brands) | Derived | **Med** |

**ISTAT / Confcommercio context (not chain counts):**

- ~**685k** esercizi al dettaglio in sede fissa (end-2023) — [ISTAT ASI 2024 ch.22](https://www.istat.it/storage/ASI/2024/capitoli/C22.pdf) — **High** for store stock, **useless alone** for “chains 10–50”.
- Confcommercio: specialized retail units falling; modern formats consolidating — [Rapporto sul Commercio](https://www.confcommercio.it/-/rapporto-sul-commercio) — **Med** for trend, not account list.

### 2.2 Estimate: chains in the **10–50 PV** band

Assofranchising publishes **&lt;50** but not **10–50**. Split with an explicit power-law assumption.

| Step | Assumption | Result | Confidence |
|------|------------|--------|------------|
| A. Active franchise networks (working base) | Use **931** (2024) | 931 | **High** |
| B. Facility-relevant sectors | Exclude pure desk “servizi” lightly used for FM; keep abbigliamento, beauty, cura, casa, commercio spec., GDO, ristorazione (+ partial servizi) ≈ **70–80%** of networks (2023 sector mix in Assofranchising PDF) | **650–750** | **Med** |
| C. Networks with &lt;50 PV | **64%** of all | **~595** of 931; **~420–480** of facility-relevant | **Med** |
| D. Of &lt;50, share that are **10–49** (not micro 1–9) | **35–45%** (majority of “small” brands still have few openings; mid band is minority of &lt;50) | **150–215** franchise brands | **Low–Med** |
| E. Add **corporate / multi-site non-franchise** mid-market (regional specialty, small groups) | **+80–150** (no ISTAT table; judgment) | | **Low** |
| **F. Target account universe (Italy, 10–50 PV, facility need)** | | **≈ 230–360 chains** | **Low–Med** |
| Central planning figure | | **≈ 300 chains** | **Low–Med** |

**Sector note:** GDO mega-groups (Conad 3k+ PV, Selex 3k+) are **out of band** for product wedge but validate FM pain; target is **regional / mid franchise**, not national hypermarkets.

---

## 3. TAM → SAM → SOM (FacilityFlow wedge)

Definitions used here:

| Layer | Definition for FacilityFlow |
|-------|-----------------------------|
| **TAM (software)** | Italy spend on CMMS/light FM work-order software usable by multi-site retail | Derived Italy CMMS **€24–37M** (USD 26–40M @ ~0.92) |
| **TAM (accounts)** | Italian multi-site retail/franchise needing facility SoR, **any** size with ≥10 PV | Broader; not fully sized |
| **SAM (accounts)** | Italy **10–50 PV**, facility pain, today on **WhatsApp + Excel / email / light tools** (no serious CMMS/IWMS) | Subset of §2.2 |
| **SAM (€)** | What those accounts would pay for a focused retail SoR (support + optional managed host) | Bottom-up ACV × accounts |
| **SOM (3 years)** | Realistic capture for a **focused OSS / self-host** product with Italy GTM, no mega salesforce | Paying tenants + ARR |

### 3.1 SAM — informal-tool users

| Input | Value | Rationale | Confidence |
|-------|-------|-----------|------------|
| Target chains (10–50) | **300** | Central figure §2.2 | Low–Med |
| Share still on WA/Excel/light tools | **70–85%** | Mid-market IT retail; CMMS seat pricing + EN-first tools; aligns with competitive thesis | **Med** (qualitative; no Italy survey) |
| **SAM accounts** | **210–255** (plan **≈ 230**) | 300 × 0.77 | **Med** |
| Blended ACV (Y3 steady) | **€8k–15k / year** | Support/SLA + optional managed Compose/VPS; **not** seat-tax; see §5 | **Med** |
| **SAM revenue ceiling** | **€1.7M–3.8M ARR** | 230 × €8–15k | **Low–Med** |

EU expansion (phase 2): multiply Italy SOM by **3–5×** over years 4–7 for similar mid-market retail in ES/PT/FR/DE regional chains — **not** included in 3-year SOM below.

### 3.2 SOM — 3-year realistic capture (OSS / self-host)

| Scenario | Paying tenants Y3 | ARR @ €10–14k ACV | Share of SAM accounts | Confidence |
|----------|-------------------|-------------------|----------------------|------------|
| **Conservative** | **8–12** | **€80–170k** | ~4–5% | **Med** |
| **Base** | **15–25** | **€150–350k** | ~7–11% | **Med** |
| **Upside** (strong SI + association channel) | **30–40** | **€300–560k** | ~13–17% | **Low** |

**Base SOM recommendation for planning:** **~20 tenants / ~€200–280k ARR by end of year 3** in Italy, conditional on production-ready pilota (E14/VPS), Italian UX, and **partner-led** delivery.

**Why not higher:** long sales cycles with HQ ops; franchisee adoption friction; OSS “free” perception; competition from MaintainX freemium + local FM portals; no built-in billing SaaS in MVP (commercial model = services/support/hosting).

---

## 4. Buyer persona economics (€ saved / store / year)

**Persona:** Ops / Facility Manager HQ, rete **20–30 PV**, specialty retail or QSR-like franchise (not full hypermarket refrigeration).

### 4.1 Cost base (order of magnitude)

| Component | Estimate | Basis | Confidence |
|-----------|----------|-------|------------|
| Store size | **100–200 m²** | Assofranchising avg surface ~114–162 m² (ex-large GDO) | **Med** |
| Planned maintenance (PPM) | **€6–12 / m² / year** | UK regional PPM £5–9/m² ([Priority First retail FM guide](https://www.priorityfirst.co.uk/insights/retail-facilities-management-uk)) → € approx | **Med** (UK→IT transfer) |
| PPM per store | **€0.9–2.0k** | 150 m² × €6–12 | **Med** |
| Reactive + call-outs + compliance (hard FM) | **1.5–3× PPM** if informal | Industry pattern (reactive dominates when PPM weak) | **Low–Med** |
| **Hard maintenance spend / store / year** | **€3–8k** (plan **€4.5k**) | Specialty; grocery+HVAC higher | **Low–Med** |
| HQ admin time on tickets/Excel | **2–5 h / week** for 25-PV network | Qualitative ops load | **Low** |

Grocery / refrigeration networks: Accruent notes refrigeration alone can be **25–40%** of maintenance WO spend ([Accruent European grocers](https://www.accruent.com/resources/blog-posts/european-grocers-reduce-operations-costs-using-facility-management-software)) — **exclude** from base specialty model or scale spend **2–4×**.

### 4.2 Value levers from SLA + cost visibility

| Lever | Mechanism | € / store / year | Confidence |
|-------|-----------|------------------|------------|
| Waste / duplicate vendor / emergency premium | 8–15% of hard spend avoided via RFQ, SLA, scorecard | **€360–680** on €4.5k | **Med** (aligned with ~10% maint. savings case studies, e.g. [4C Associates European retailer](https://www.4cassociates.com/project/european-retailer-store-cost-efficiency/)) |
| HQ labor reclaimed | 2–3 h/week × €30–40/h × 48 / 25 stores | **€115–230** | **Low–Med** |
| Faster restore / fewer lost trading hours | 2–5 avoided “bad hours” × €50–150/h margin impact | **€100–750** | **Low** |
| **Total value / store / year** | | **≈ €600–1,600** (plan **~€900**) | **Low–Med** |
| **Network value (25 PV)** | | **≈ €15–40k / year** | **Low–Med** |

**Payback vs software:** At **€10–14k ACV**, base ROI is **~1.5–3×** annual value on a 25-PV chain — credible if breach/cost dashboards are used (not shelfware).

---

## 5. Pricing sensitivity vs MaintainX seat model

### 5.1 MaintainX list (official, USD)

Source: [MaintainX Pricing](https://www.getmaintainx.com/pricing) (fetched 2026-11).

| Plan | Annual billing | Monthly billing | Notes |
|------|----------------|-----------------|-------|
| Basic | **$0** | $0 | Limited PM; **requesters free** |
| Essential | **$20 / user / mo** | $25 | |
| Premium | **$65 / user / mo** | $75 | Parts, cost tracking, API |
| Enterprise | Custom | Custom | Multi-site tooling emphasized |

≈ **€18–60 / user / mo** at ~0.92 USD/EUR — matches product brief “~€20–65/user”.

### 5.2 Worked comparison — 25-PV Italian chain

Assume **8 paid ops/vendor seats** (store managers as free requesters on MaintainX; FacilityFlow can keep store users cheap/free).

| Option | Monthly | Annual | Fit for wedge |
|--------|---------|--------|---------------|
| MaintainX Essential × 8 | ~€150–180 | **~€1.8–2.2k** | Cheap; weak IT retail SLA/cost/vendor portal |
| MaintainX Premium × 8 | ~€480–520 | **~€5.8–6.2k** | Cost tracking; still EN-cloud; seats grow with vendors |
| MaintainX Premium × 20 (more vendors) | ~€1.2–1.3k | **~€14–16k** | Seat tax bites |
| FacilityFlow (model) | Flat tenant | **€8–15k** + infra | Self-host EU; unlimited store requesters; SI margin |

**Sensitivity takeaways:**

1. **Against Essential:** FacilityFlow loses on pure price; must win on **IT SoR, vendor portal, costi/PV, GDPR/self-host**.
2. **Against Premium at 15–25 seats:** FacilityFlow is **price-competitive** if sold as network license, not seats.
3. **Italian willingness-to-pay ceiling (hypothesis):** **€150–400 / PV / year** all-in software+support → for 25 PV = **€3.8–10k** sweet spot; stretch to **€12–15k** with managed hosting + onboarding.
4. **Freemium trap:** MaintainX Basic trains “software = free”; GTM must sell **auditability + vendor governance**, not “another app”.

Confidence on pricing band: **Med** (list prices high; WTP low–med).

---

## 6. Go-to-market channels (Italy)

| Channel | Why it fits | Motion | Priority Y1–Y3 | Confidence |
|---------|-------------|--------|----------------|------------|
| **Partner SI / MSP** (Compose/k3s, Keycloak, backup) | Product is OSS/self-host; buyer wants someone on-call | Rev-share on hosting + onboarding; certified install playbook | **P0** | **High** (matches stack) |
| **Assofranchising / Confcommercio / sector associations** | Dense access to 10–50 PV brands; trust | Workshops, co-branded “da WA a SoR” pilots, member discount on support | **P0** | **Med–High** |
| **FM outsourcers / multi-service** (national & regional: e.g. integrated FM players serving retail estates) | They already run SLA; need store→ticket visibility without giving client a USA CMMS | White-label / vendor portal for **their** retail clients; land-and-expand | **P1** | **Med** |
| **Franchise network HQ direct** | Economic buyer = Ops HQ | 15×5 pilota (see competitive one-pager), then roll remaining PV | **P0** | **High** |
| **Regional facility consortia / vendor networks** | HVAC/eletrico/idraulico groups serving chains | Bottom-up: vendors push portal to HQ | **P2** | **Low–Med** |
| **EU expansion via same SI network** | Reuse playbooks ES/FR/DE | After Italy reference logos | Y3+ | **Med** |

**Do not lead with:** pure inbound PLG (Italian mid-market ops rarely self-serve CMMS), or enterprise IWMS RFPs.

---

## 7. Summary tables (executive)

### 7.1 Market ladder

| Layer | Figure (planning) | Confidence |
|-------|------------------|------------|
| Global CMMS 2024 | **USD 1.3B**, CAGR **11.1%** to 2.41B (2030) | **High** |
| Europe CMMS 2024 | **USD 327M**, CAGR **11%** | **High** |
| Europe FM software 2024 | **USD 932M**, CAGR **11.2%** to 2033 | **High** |
| Italy CMMS software (derived) | **USD 26–40M** | **Low–Med** |
| Italy FM **services** | **USD ~9.5B** (context only) | **Med** |
| Italy chains 10–50 PV (facility-relevant) | **≈ 230–360** (plan **300**) | **Low–Med** |
| SAM accounts (WA/Excel) | **≈ 210–255** (plan **230**) | **Med** |
| SAM € | **€1.7–3.8M ARR** ceiling | **Low–Med** |
| SOM Y3 (base) | **15–25 tenants / €150–350k ARR** | **Med** |

### 7.2 Unit economics snapshot

| KPI | Order of magnitude | Confidence |
|-----|--------------------|------------|
| Hard FM € / specialty store / year | **€3–8k** | Low–Med |
| Value unlocked / store / year | **€0.6–1.6k** | Low–Med |
| Value / 25-PV network / year | **€15–40k** | Low–Med |
| Target ACV | **€8–15k** | Med |
| MaintainX Essential–Premium | **$20–65/user/mo** annual | **High** (official list) |

---

## 8. Risks & open research

1. **No published Italy CMMS € series** — top-down GDP proxy only; validate with 5–10 buyer interviews or partner SI deal data.
2. **Assofranchising 2025 universe (707 vs 931)** — clarify methodology before citing in investor materials.
3. **10–50 band split** — need primary cut (survey or purchased franchise directory).
4. **WTP** — untested; run pricing interviews with 8–12 Ops HQ.
5. **SOM** assumes E14/production pilota credibility; without live EU host, capture slips to conservative.

---

## 9. Sources (URL index)

- Grand View — Global CMMS: https://www.grandviewresearch.com/industry-analysis/computerized-maintenance-management-system-market-report  
- Grand View — CMMS press: https://www.grandviewresearch.com/press-release/global-computerized-maintenance-management-system-market  
- Grand View — Europe CMMS: https://www.grandviewresearch.com/horizon/outlook/computerized-maintenance-management-system-market/europe  
- Grand View — Europe FM software: https://www.grandviewresearch.com/horizon/outlook/facilities-management-software-market/europe  
- Mordor — Italy FM (services): https://www.mordorintelligence.com/industry-reports/italy-facility-management-market  
- Mordor — Global FM software: https://www.mordorintelligence.com/industry-reports/facility-management-software-market  
- Assofranchising Rapporto PDF (2023 data): https://www.assofranchising.it/images/documenti/rapporto_assofranchising_2024.pdf  
- Assofranchising / Nomisma 2024: https://www.nomisma.it/news/franchising-il-giro-daffari-raggiunge-i-358-mld-di-euro-nel-2024/  
- Sole 24 Ore — franchising 2025 size bands: https://www.ilsole24ore.com/art/nel-2025-giro-d-affari-franchising-raggiunge-39-miliardi-euro-8percento-AIDlAZjD  
- ISTAT ASI commercio: https://www.istat.it/storage/ASI/2024/capitoli/C22.pdf  
- Confcommercio rapporto commercio: https://www.confcommercio.it/-/rapporto-sul-commercio  
- Statista EU GDP shares 2024: https://www.statista.com/statistics/1373419/eu-gdp-percentage-share-member-state-2024/  
- MaintainX pricing: https://www.getmaintainx.com/pricing  
- Priority First — retail FM costs (UK): https://www.priorityfirst.co.uk/insights/retail-facilities-management-uk  
- Accruent — European grocers WO mix: https://www.accruent.com/resources/blog-posts/european-grocers-reduce-operations-costs-using-facility-management-software  
- 4C Associates — European retailer maintenance savings: https://www.4cassociates.com/project/european-retailer-store-cost-efficiency/

---

*End of market sizing brief.*
