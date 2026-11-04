# FacilityFlow Retail — Competitive one-pager (pilota)

> **Audience:** PO / sales / founder.  
> **Buyer:** Ops / Facility Manager HQ (rete 10–50 PV, Italia).  
> **Wedge:** Intake leggero + ticket/SLA/dispatch vendor + costi per store.  
> **Non competiamo su:** CMMS asset-heavy, inventari pezzi, IoT, marketplace, billing SaaS.

Fonti (ordini di grandezza, non listino): MaintainX free→~$20–60/user/mo ([UpKeep vs MaintainX](https://upkeep.com/blog/maintainx-vs-upkeep/)); retail CMMS ranking ([OpenWrench](https://www.useopenwrench.com/blog/best-cmms-for-retail)); Zendesk ≠ CMMS ([TrustRadius UpKeep vs Zendesk](https://www.trustradius.com/compare-products/upkeep-maintenance-management-vs-zendesk-support-suite)). Cloud USA-first vs nostro self-host EU.

---

## Matrice competitor (pilota 15 store × 5 vendor)

| Criterio (cosa conta nel pilota) | WhatsApp + Excel | Zendesk / helpdesk | MaintainX (CMMS) | **FacilityFlow** |
|----------------------------------|------------------|--------------------|------------------|------------------|
| Segnalazione store in &lt;2 min (mobile) | ✅ chat | ⚠️ form generico | ✅ mobile WO | ✅ intake / PWA IT |
| Un solo SoR su stato ticket | ❌ chat sparisce | ✅ ticket | ✅ WO | ✅ ticket FSM |
| SLA risoluzione + breach automatico | ❌ | ⚠️ SLA generici | ⚠️ PM-oriented | ✅ policy IT + job breach |
| Portale fornitore (assegnazione / done) | ❌ CC email | ❌ / addon | ⚠️ contractor WO (tier alti) | ✅ vendor portal |
| Verify chiusura dallo store | ❌ | ❌ | ⚠️ | ✅ Flusso A |
| Costo stimato/effettivo **per PV** | ❌ fogli | ❌ | ⚠️ labor/parts | ✅ costi + export |
| RFQ / preventivo interno | ❌ | ❌ | ❌ tipico | ✅ RFQ + award |
| Scorecard vendor (MTTR/SLA/costi) | ❌ | ❌ | ⚠️ report generic | ✅ scorecard HQ |
| Calendario PM + ricorrenza | ❌ | ❌ | ✅ forte | ✅ calendario + RRULE |
| UI / copy italiano retail | ❌ misto | ⚠️ | ⚠️ EN-first | ✅ IT default |
| Self-host / dati EU / no SaaS critico | n/a | ❌ cloud | ❌ cloud | ✅ Compose/k3s OSS |
| Time-to-value pilota (&lt;2 settimane) | già lì | medio | medio-alto | alto se VPS GO |
| Costo tipico 20 utenti ops | ~0 | alto seat | ~€400–1300/mo* | infra VPS + vostro tempo |

\*Stima grezza Essential/Premium MaintainX; non include requesters free.

### Legenda win / lose

| Esito | Quando FacilityFlow **vince** | Quando FacilityFlow **perde** |
|-------|-------------------------------|-------------------------------|
| **Win vs WhatsApp+Excel** | HQ vuole auditabilità, breach, costi/PV, vendor tracciati | La rete è 3 PV e il “caos chat” è accettabile |
| **Win vs Zendesk** | Il problema è facility/vendor/SLA store, non CX omnichannel | Serve solo coda ticket generica + canali marketing |
| **Win vs MaintainX** | Serve wedge retail IT + vendor portal + self-host senza CMMS inventari/IoT | Serve parts inventory, meter-based PM, mobile WO field-crew USA |
| **Lose-lose** | Feature parity CMMS enterprise o “altro Jira” senza KPI rete | — |

---

## Win criteria pilota (GO commerciale)

Misurabili in 4–6 settimane su 15×5:

1. **≥80%** dei guasti aperti via FacilityFlow (non solo WA).
2. **Flusso A** end-to-end &lt;15 min su ticket prova (store→ops→vendor→verify).
3. **≥1 breach** gestito con evidenza in-app (non solo messaggio).
4. HQ legge **costo/PV** e **scorecard vendor** senza Excel.
5. Almeno **3 vendor** usano il portale (done / quote) senza email sola.

### Lose criteria (stop o riposiziona)

- Store continua su WA e copia a mano nel SoR.
- Vendor ignora il portale → tutto resta telefono.
- Buyer chiede inventari pezzi / IoT / multi-paese → fuori wedge (referral CMMS).
- VPS/GO prod non arriva → non puoi promettere uptime pilota reale.

---

## Motivo di scelta in una frase

> Per catene retail/franchise in Italia: da WhatsApp/Excel a un SoR su ticket, SLA e costi per store con portale fornitori — senza CMMS enterprise né SaaS USA obbligatorio.

---

## Gap aperti oggi (già in backlog)

| ID | Perché conta vs competitor |
|----|----------------------------|
| **F3-01** VPS / GO pilota | Senza host reale non batte “gratis su WA” in affidabilità percepita |
| **F5-UX-14** (proposta) Day/Week/Month GCal | Parità UX calendario vs MaintainX PM |
| **F3-09** (proposta) Transactional email outbox | Certezza notifiche (oggi dual-write) — igiene che Zendesk dà “gratis” |

---

## Fase 6 — bozza differenziante (PO confirm richiesta)

Obiettivo: motivi **precisi** di preferenza, non feature creep CMMS.

| ID | Titolo | Priorità | Motivo competitivo (1 riga) | Dip. VPS |
|----|--------|----------|------------------------------|----------|
| **F6-01** | Digest settimanale HQ (PDF/email) costi+breach+top vendor | **P0** | WhatsApp non fa report; MaintainX report spesso EN/seat | No |
| **F6-02** | Chargeback / riparto costi per PV (export + vista) | **P0** | Excel muore qui; Zendesk non è facility finance | No |
| **F6-03** | SLA vendor response (tempo ad accept/start) + badge | **P0** | Scorecard che i CMMS free non spingono sul contractor IT | No |
| **F6-04** | Playbook breach one-click (relaunch + template nota) | **P1** | Ops più veloce di chat+Excel in emergenza | No |
| **F6-05** | Confronto “contratto vs misurato” (PM due vs done) | **P1** | Valore contratti + calendario oltre checklist MaintainX lite | No |
| **F6-06** | Onboarding pilota guidato 15×5 (checklist + seed demo) | **P0** | Time-to-value &lt; CMMS; prova Flussi A/B/C in demo | No |
| **F6-07** | Transactional email outbox (F3-09) | **P0** | Affidabilità notifiche = fiducia vs “messaggio perso” | No |
| **F6-08** | Calendario Day+Week+Month ordine GCal (F5-UX-14) | **P1** | Parità UX aspettativa mercato | No |
| **F6-09** | Store wallboard / TV mode (solo aperti+breach) | **P2** | Visibilità punto vendita che WA non scala | No |
| **F6-10** | Pacchetto “Franchise HQ IT” (copy + ruoli + policy SLA seed) | **P1** | Packaging commerciale, non codice enorme | No |

**Esplicitamente non in F6:** inventari ricambi, IoT, WhatsApp Business API a pagamento, marketplace, ERP, multi-paese, AI come SoR.

**AI (Fase 7 bozza):** assist su triage/riassunti/RFQ/digest con **vLLM locale** + BYOK cloud — [`AI_PLATFORM.md`](./AI_PLATFORM.md). Differenziamo vs WA+Excel (zero assist strutturato) senza diventare chatbot SoR.

---

## Come usare questo one-pager

1. Discovery: mappa il prospect su colonna “oggi = WA+Excel?”  
2. Demo: solo Flussi A/B/C + dashboard costi/PV + vendor portal.  
3. Se chiedono parts/IoT → non forzare; posiziona MaintainX e resta sul wedge.  
4. Conferma PO su **F6-01…10** prima dello sprint (scope expansion).
