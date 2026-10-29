# Health probes (US-E14-06 / T5.1)

| Path | Tipo | Dipendenze | HTTP |
|------|------|------------|------|
| `/api/health/live` | liveness | nessuna | 200 |
| `/api/health/ready` | readiness | Postgres `SELECT 1` | 200 / **503** |
| `/api/health` | **alias ready** | come ready | 200 / 503 |

Payload: solo `status`, `check`, `service`, `db` (ready), `timestamp` — **zero** secret/PII.

Compose prod healthcheck punta a **ready**. Proxy (T5.4) dovrebbe usare ready per upstream; live per restart policy.
