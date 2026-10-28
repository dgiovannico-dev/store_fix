# Domain docs (single-context)

Layout:

| Artifact | Path |
|----------|------|
| Glossary | `GLOSSARY.md` (repo root; create via `domain-modeling`) |
| ADRs | `docs/adr/` |

Consumer rules for agents:

1. Prefer glossary terms over synonyms in code, specs, and tickets.
2. Do not re-litigate decisions recorded in ADRs without an explicit superseding ADR.
3. FacilityFlow domain hotspots: **tenant**, **store**, **asset**, **ticket**, **SLA**, **vendor**, **dispatch**, **cost** — keep these as deep modules with clear ports.
4. AI features are **assist-only**; the System of Record remains Postgres/app APIs.
