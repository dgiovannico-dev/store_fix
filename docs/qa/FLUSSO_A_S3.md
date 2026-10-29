# QA — Flusso A completo → `verified` (S3 / US-E13-01)

Estende [`FLUSSO_A_S2.md`](./FLUSSO_A_S2.md) fino a verify store.

## Auto

```bash
npm test -- src/tests/e2e/flusso-a-verified.test.ts
```

## Manuale (breve)

1. Store apre ticket frigo critical + 2 foto  
2. HQ triage → assign  
3. Vendor `/vendor/inbox` → in_progress → foto chiusura → done + costo  
4. Store/HQ: verifica → `verified`  
5. Bell: unread su done/verified  
6. Timeline: eventi IT

## Esito

- Data: __________
- Auto: Pass / Fail
- Mailpit sequenza: Pass / Fail / N/A
