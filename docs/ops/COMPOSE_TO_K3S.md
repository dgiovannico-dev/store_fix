# Runbook Compose → k3s (F4-05)

**Scope:** migrare (o avviare) FacilityFlow su **k3s + Helm** su VPS EU.  
**Alternativa:** restare su Compose prod — [`COMPOSE_PROD.md`](./COMPOSE_PROD.md) / [`NEXT_VPS.md`](./NEXT_VPS.md).  
**Un solo path per host** (non entrambi app+worker sullo stesso nodo piccolo).

| Doc correlato | Ruolo |
|---------------|--------|
| [`KUBERNETES.md`](./KUBERNETES.md) | Install k3s, Helm chart |
| [`VAULT.md`](./VAULT.md) | OpenBao + ESO |
| [`KEYCLOAK.md`](./KEYCLOAK.md) | IdP OIDC |
| [`BACKUP.md`](./BACKUP.md) / [`MIGRATE.md`](./MIGRATE.md) | Dump + Prisma |
| [`SMOKE_FLUSSO_A.md`](./SMOKE_FLUSSO_A.md) | Smoke UI |

## 0 — Decisione

| Criterio | Compose | k3s (F4) |
|----------|---------|----------|
| RAM tipica | ≥ 4 GB | ≥ **8 GB** (app + OpenBao + Keycloak) |
| Secret | `.env.prod` 600 | OpenBao → `facilityflow-runtime` |
| Auth | Credentials | Keycloak OIDC (Credentials lab-only) |
| Exit pilota | Valido | Valido se smoke A su ingress PASS |

Se pilota già verde su Compose: **non** migrare mid-pilota senza freeze + backup.

## 1 — Preflight (operatore)

```bash
npm run verify:local
npm run helm:template
npm run vps:preflight
```

Host: DNS `FF_DOMAIN` (+ `auth.` / `s3.` se usati) → IP; UFW 22/80/443/6443 — [`FIREWALL.md`](./FIREWALL.md).

## 2 — Backup SoR (obbligatorio)

Da stack Compose **ancora up** (o dump caldo annotato):

```bash
npm run db:backup
# Copia dump + note Seaweed volume path fuori dal nodo (object store / laptop cifrato)
```

Annotare in [`BACKUP.md`](./BACKUP.md) restore-drill log (target scratch, **no** prod overwrite).

## 3 — Install ordine k3s

1. **k3s + Helm** — [`KUBERNETES.md`](./KUBERNETES.md)
2. **ESO** poi **OpenBao** — [`VAULT.md`](./VAULT.md) (init/unseal, KV seed incl. `AUTH_KEYCLOAK_SECRET`)
3. **Keycloak** (chart ufficiale/Bitnami) + import [`deploy/keycloak/realm-platform.json`](../../deploy/keycloak/realm-platform.json) — [`KEYCLOAK.md`](./KEYCLOAK.md) · multi-app [`PLATFORM_IAM.md`](./PLATFORM_IAM.md)
4. Namespace `facilityflow`; token ESO Secret `openbao-eso-token`
5. Postgres / Seaweed: restano **esterni** al chart (Compose sul nodo *oppure* StatefulSet dedicati). Se Compose DB resta: non esporre porte pubbliche.
6. **Helm app** staging poi prod:

```bash
helm upgrade --install ff ./deploy/helm/facilityflow \
  -n facilityflow --create-namespace \
  -f deploy/helm/facilityflow/values-staging.yaml \
  --set ingress.host="staging.$FF_DOMAIN" \
  --set keycloak.issuer="https://auth.$FF_DOMAIN/realms/platform" \
  --set app.image.repository=ghcr.io/OWNER/facilityflow \
  --set app.image.tag=0.1.0 \
  --set worker.image.repository=ghcr.io/OWNER/facilityflow-worker \
  --set worker.image.tag=0.1.0
```

Prod: `values-prod.yaml` + **digests** (`--set app.image.digest=sha256:…`).

7. Migrate: Job one-shot o `kubectl exec` su pod app:

```bash
kubectl -n facilityflow exec deploy/ff-facilityflow-app -- npx prisma migrate deploy
```

(Adattare nome Deployment al `fullname` Helm.)

8. Seed pilota **solo staging** — [`SEED_PILOT.md`](./SEED_PILOT.md).

## 4 — Cutover DNS / Compose stop

1. Verificare `https://$FF_DOMAIN/api/health/live` e `/ready` via Ingress.
2. Smoke Flusso A UI (§5).
3. Fermare Compose **app/worker** (lasciare postgres/seaweed se condivisi):

```bash
docker compose -f compose.prod.yaml --env-file /etc/facilityflow/.env.prod stop app worker
# Non `down -v` finché restore drill k3s non è PASS
```

4. Aggiornare [`NEXT_VPS.md`](./NEXT_VPS.md) checklist path k3s.

## 5 — Smoke Flusso A su cluster

Come [`SMOKE_FLUSSO_A.md`](./SMOKE_FLUSSO_A.md) § Staging, contro Ingress:

1. Login SSO Keycloak (prod) o Credentials (staging dual-path)
2. Ticket frigo critico → assign → vendor done → verify
3. Dashboard HQ

Locale senza cluster resta:

```bash
npm test -- src/tests/e2e/flusso-a-verified.test.ts
npm run smoke:http   # Compose lab
```

## 6 — DR su k3s

| Asset | Backup | Restore |
|-------|--------|---------|
| Postgres | `npm run db:backup` / CronJob | `pg_restore` su DB scratch — [`BACKUP.md`](./BACKUP.md) |
| OpenBao | Snapshot file storage PVC + unseal keys offline | Restore PVC + unseal — [`VAULT.md`](./VAULT.md) |
| Keycloak | Realm export periodico + DB KC | Re-import realm + DB |
| Seaweed | Volume host / snapshot | Remount path; firmare URL con stessi key |
| Helm | Git values + digests | `helm upgrade --install` stesso chart/tag |

Rollback app: `helm rollback ff 1 -n facilityflow` **dopo** restore DB se migrate irreversibile — [`MIGRATE.md`](./MIGRATE.md).

## 7 — Checklist chiusura F4-05 (in-repo vs host)

| Voce | In-repo | Host (umano) |
|------|---------|--------------|
| Questo runbook + link da KUBERNETES/NEXT_VPS | ✅ | — |
| `helm:template` verde | ✅ | — |
| k3s install + unseal + Keycloak up | — | ☐ |
| Helm install + migrate + smoke A UI | — | ☐ |
| Compose app/worker stopped post-cutover | — | ☐ |

Hard-stop deploy resta F3-01 / operatore VPS; codice F4-01…05 è il path documentato.
