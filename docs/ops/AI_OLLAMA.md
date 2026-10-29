# AI assist — Ollama (F2-07)

Assist **locale/OSS** + **conferma umana**. Mai System of Record.

## Config

```bash
# .env (opzionale — senza queste var resta solo heuristic)
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
```

```bash
ollama pull llama3.2
ollama serve
```

## Endpoint

### Categoria

`POST /api/ai/suggest-category` (sessione Auth.js)

```json
{ "description": "Frigo caldo corridoio 2" }
→ { "category": "frigo", "source": "ollama"|"heuristic", "needsConfirm": true, "rationale": "…" }
```

### Vendor (heuristic, no LLM obbligatorio)

`POST /api/ai/suggest-vendor`

```json
{ "storeId": "…", "category": "frigo" }
→ { "suggestion": { "vendorId", "vendorName", "source", "rationale" } | null, "needsConfirm": true }
```

La UI applica categoria/vendor **solo** dopo tap di conferma.

## Fuori scope

- Classificazione / assign automatici senza conferma
- Cloud LLM a pagamento
- Scrivere ticket / costi / vendor da modello
- Riassunti note (stretch)
