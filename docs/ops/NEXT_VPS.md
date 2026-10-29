# Next step — VPS EU (unico blocco Go pilota)

Artefatti lab sono PASS ([`../product/sprints/S5-EXIT-GAPS.md`](../product/sprints/S5-EXIT-GAPS.md)). Per sbloccare **GO staging / pilota**:

1. VPS EU (2 vCPU / 4 GB) + DNS `FF_DOMAIN` → IP
2. UFW 22/80/443 ([`FIREWALL.md`](./FIREWALL.md))
3. Clone repo + `.env.prod` da [`.env.prod.example`](../../.env.prod.example) (secret forti)
4. `docker compose -f compose.prod.yaml --env-file .env.prod up -d --build`
5. `deploy-migrate.sh` → ready HTTPS → seed pilota **solo staging**
6. Restore drill remoto + smoke UI Flusso A + `verify-security-headers.sh https://…`
7. Aggiornare `S5-EXIT-GAPS.md` → GO · tag `v0.1.0`

Niente altro scope prodotto finché questo non è verde.
