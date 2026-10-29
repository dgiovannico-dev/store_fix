# FacilityFlow Retail — Matrice RBAC (MVP)

> Artefatto vincolato a `US-E01-05`. Aggiornare quando cambiano permessi.  
> Legenda: ✅ allow · ❌ deny · ◐ limitato allo scope (store membership / vendor proprio)

| Azione | owner | admin_hq | ops_coordinator | store_manager | store_staff | vendor | viewer_finance |
|--------|:-----:|:--------:|:---------------:|:-------------:|:-----------:|:------:|:--------------:|
| Gestire tenant / billing UI* | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Inviti utenti / cambio ruolo | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| CRUD store / import CSV | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Membership user↔store | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| CRUD vendor + coverage | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| CRUD SlaPolicy | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| CRUD asset (store scope) | ✅ | ✅ | ✅ | ◐ | ◐ | ❌ | ❌ |
| Aprire ticket | ✅ | ✅ | ✅ | ◐ | ◐ | ❌ | ❌ |
| Triage / assign / priorità / note interne | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Note vendor (scrivere) | ✅ | ✅ | ✅ | ❌ | ❌ | ◐ | ❌ |
| Aggiornare stato vendor path | ✅ | ✅ | ✅ | ❌ | ❌ | ◐ | ❌ |
| Cancel ticket (+ motivo) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Verify / reject store | ✅ | ✅ | ❌ | ◐ | ◐ | ❌ | ❌ |
| Vedere costi ticket | ✅ | ✅ | ✅ | ◐** | ❌ | ◐*** | ✅**** |
| Dashboard HQ aggregata | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅**** |
| Scorecard fornitori (F2-03) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅**** |
| Accetta/rifiuta preventivo (F2-02) | ✅ | ✅ | ❌ | ◐ | ❌ | ❌ | ❌ |
| CRUD contratti fornitori (F2-04) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Lista contratti (read) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Calendario PM (F2-04 v2) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Export GDPR tenant | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Deep-link kiosk store | — | — | — | ◐ | ◐ | ❌ | ❌ |

\* Billing/abbonamenti = **fuori scope MVP** (riga riservata a settings tenant base).  
\*\* Store vede costi solo sui propri ticket dopo `done`/`verified` (read).  
\*\*\* Vendor vede/scrive costi solo sui ticket assegnati (stima/effettivo in chiusura).  
\*\*\*\* `viewer_finance`: **read-only** ticket chiusi/verificati + aggregati costi/MTTR; nessuna mutation.

## Regole trasversali

1. Ogni query filtrata per `tenant_id`.
2. `store_manager` / `store_staff`: solo store in `Membership.storeIds`.
3. `vendor`: solo ticket con `vendor_id` del proprio `Vendor` record.
4. Test automatici deny/allow per ogni cella critica (`US-E01-05`).
