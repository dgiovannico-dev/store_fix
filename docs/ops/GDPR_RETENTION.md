# Retention GDPR — ticket verified (US-E12-01)

## Policy prodotto

| Campo | Valore |
|-------|--------|
| Ambito | Ticket in stato `verified` |
| Ancora | `verifiedAt` |
| Durata | **24 mesi** |
| Disposition | **Soft-delete** (`deletedAt`) su ticket + allegati correlati |
| Evento timeline | `gdpr_retention_purge` |
| Oggetti SeaweedFS | Non cancellati subito (allineato a `SOFT_DELETE.md` / GC ops futuro) |

## Job pg-boss `gdpr.purge`

- Worker: `src/workers/index.ts` → `purgeExpiredVerifiedTickets`
- Schedule: `0 3 * * *` Europe/Rome (batch max 100 / run)
- Dry-run: `GDPR_PURGE_DRY_RUN=true` (conta candidati, nessuna scrittura)

```bash
# Esecuzione diretta (dev / smoke)
npx tsx -e "import { purgeExpiredVerifiedTickets } from './src/application/gdpr/purge-expired.ts'; purgeExpiredVerifiedTickets().then(console.log)"
```

## Allineamento backup

Dump Postgres ≠ retention prodotto: i dump off-volume restano su schedule ops (`BACKUP.md`). Soft-delete non rimuove righe dai dump storici fino a rotazione backup.

## Restore

Owner / admin_hq possono ripristinare ticket soft-deleted (stesso tenant) secondo `SOFT_DELETE.md`.
