# FacilityFlow Retail — Design package (indice)

> **Gate:** design **approvato** (2026-10-28). Scaffold S1 attivo su `feature/FF-S1-platform-oss`.  
> Continuare solo con Analysis Card per TK e stack OSS-only.

## Contenuti

| Artefatto | Path | Ruolo |
|-----------|------|--------|
| Design system | [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) | Token, tipografia, componenti, stati empty/load/error, a11y |
| Information architecture | [`INFORMATION_ARCHITECTURE.md`](./INFORMATION_ARCHITECTURE.md) | Alberi navigazione HQ / store / vendor; deep link kiosk |
| Wireframes | [`WIREFRAMES.md`](./WIREFRAMES.md) | Flussi A/B/C e schermate chiave (phone-first 390px) |

## Architettura & decisioni

| Artefatto | Path |
|-----------|------|
| Software architecture | [`../architecture/SOFTWARE_ARCHITECTURE.md`](../architecture/SOFTWARE_ARCHITECTURE.md) |
| API surface (high-level) | [`../architecture/API_SURFACE.md`](../architecture/API_SURFACE.md) |
| ADRs | [`../adr/`](../adr/) — OSS stack, modular monolith, Auth.js, tenancy, pg-boss, SeaweedFS, UI |

## Prodotto & stack

| Artefatto | Path |
|-----------|------|
| Product backlog | [`../product/BACKLOG.md`](../product/BACKLOG.md) |
| Stack OSS-only | [`../product/STACK.md`](../product/STACK.md) |
| RBAC | [`../product/RBAC.md`](../product/RBAC.md) |
| Ubiquitous language | [`../../GLOSSARY.md`](../../GLOSSARY.md) |

## Ordine di lavoro consigliato

1. Approvazione umana di Design system + IA + Wireframes  
2. Allineamento ADR / SOFTWARE_ARCHITECTURE  
3. Scaffold su `develop` / `feature/*` solo dopo gate codice del backlog  

Lingua UI MVP: **italiano**.
