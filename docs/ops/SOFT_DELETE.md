# Policy soft-delete unificata (US-E10-05)

## Entità soft-deletable (`deletedAt`)

| Entità | Soft-delete | Restore | Note |
|--------|-------------|---------|------|
| Membership | sì | owner / admin_hq, stesso tenant | Disabled ≠ hard delete User |
| Store | sì | owner / admin_hq | Blocca **nuovi** ticket |
| Vendor | sì | owner / admin_hq | Nascosto da liste / assign |
| Asset | sì | owner / admin_hq | Nascosto da autocomplete create ticket |
| SlaPolicy | sì | owner / admin_hq | Non ricalcola ticket aperti |
| Ticket | sì (raro) | owner / admin_hq | Liste escludono `deletedAt` |
| Attachment | sì | — | Oggetto SeaweedFS **non** eliminato subito (GC futuro) |
| Notification | sì | — | Soft hide |

## Immutabili (no update/delete API)

- `TicketEvent` — solo append

## Regole

1. Query sempre `tenantId` + escludi soft-deleted di default.
2. Restore solo `owner` / `admin_hq`, stesso tenant (deny cross-tenant).
3. Store soft-deleted → create ticket rifiutata.
4. Asset soft-deleted → non in form-options / autocomplete.
