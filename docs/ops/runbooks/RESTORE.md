# Runbook — Restore DB (US-E14-13 / T5.28)

Procedura completa e drill: [`../BACKUP.md`](../BACKUP.md) + [`../MIGRATE.md`](../MIGRATE.md).

**Regola:** restore di prova **solo** su DB scratch (`facilityflow_restore_test`) o staging.  
Prod SoR: freeze app → `--clean` restore → migrate check → ready → smoke.

Drill locale S4: **PASS 2026-10-29** (vedi tabella in BACKUP.md). Ripetere su staging prima di Go prod.
