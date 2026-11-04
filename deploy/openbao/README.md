# OpenBao — piattaforma (F4-03 / F4-06)

Install values: [`values-standalone.yaml`](./values-standalone.yaml)  
Runbook: [`../../docs/ops/VAULT.md`](../../docs/ops/VAULT.md) · multi-app: [`../../docs/ops/PLATFORM_IAM.md`](../../docs/ops/PLATFORM_IAM.md)

## Policies

| File | Uso |
|------|-----|
| `policies/facilityflow-eso.hcl` | ESO FacilityFlow — solo `secret/apps/facilityflow/*` |
| `policies/_template-app-eso.hcl` | Template per nuove app |
| `policies/<app>-eso.hcl` | Generato da `npm run platform:onboard -- <app-id>` |
| `policies/eso-read.hcl` | Alias deprecato (= facilityflow) |

## Onboarding

```bash
npm run platform:onboard -- billing --namespace billing --client-id billing-app
# → deploy/openbao/policies/billing-eso.hcl + checklist Keycloak/OpenBao
```

Non commitare secret; commitare solo la policy HCL.
