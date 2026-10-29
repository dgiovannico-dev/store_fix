# Continua (autopilot)

Esegui il ciclo in `.cursor/rules/agent-autopilot.mdc` **senza chiedere conferma**:

1. Scegli la prossima slice dal BACKLOG / retro / CI fail
2. Analysis Card breve → implementa → `npm run verify:local`
3. Commit conventional + `git push origin develop`
4. Fast-forward `main` da `develop` e push `main`
5. Se c’è budget, inizia subito la slice successiva

Non rispondere «Fermo» se esiste lavoro in-repo (incl. F3-02…F3-08). Hard-stop solo per secret/VPS IP mancanti **e** coda vuota.
