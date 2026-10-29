# Smoke Flusso A (US-E14-12 / T5.25)

## CI / locale (domain path)

```bash
npm test -- src/tests/e2e/flusso-a-verified.test.ts
```

Copre: create → triage → assign → vendor done → verify (tenant isolato).

## Staging (manuale pre-exit)

1. Login owner seed pilota
2. Apri ticket frigo critico da store
3. Assign vendor → vendor `in_progress` → `done` (foto+costo)
4. Store verify
5. Dashboard HQ mostra ticket verified / costi

Annotare data + esito in Sprint Review S5.
