# QA — Flusso B Breach SLA (S3 / US-E13-02)

## Auto

```bash
npm test -- src/tests/e2e/flusso-b-breach.test.ts src/application/sla/check-breaches.test.ts
```

## Manuale

1. Ticket con `slaDueAt` passato (o attendi job `*/5`)
2. Worker: `npm run worker` → log `sla.check_breaches`
3. Bell HQ: unread breach
4. Dettaglio ticket: badge SLA superato → **Rilancia notifica ops**
5. Timeline: `sla_breached` + `sla_relaunch`
6. Mailpit: 1 email breach iniziale; rilancio = seconda email

## Esito

- Data: __________
- Auto: Pass / Fail
- Worker healthy: Pass / Fail
