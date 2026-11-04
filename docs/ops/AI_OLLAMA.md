# AI assist — Ollama (F2-07) → superseding F7

Assist **locale/OSS** + **conferma umana**. Mai System of Record.

> **F7 (bozza):** preferire **vLLM** OpenAI-compatible e multi-provider BYOK — vedi [`../product/AI_PLATFORM.md`](../product/AI_PLATFORM.md).  
> Questo runbook resta valido finché il client usa `OLLAMA_*`; dopo F7-01 userai `AI_BASE_URL=http://…:11434/v1` (Ollama OpenAI compat) o vLLM `:8000/v1`.

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

### Riassunto note (F3-03)

`POST /api/ai/summarize-ticket`

```json
{ "ticketId": "…" }
→ { "summary": "• …", "source": "ollama"|"heuristic", "needsConfirm": true }
```

UI: pannello sola lettura su dettaglio ticket HQ — **non** scrive SoR.

## Fuori scope

- Classificazione / assign automatici senza conferma
- Cloud LLM a pagamento
- Scrivere ticket / costi / vendor da modello
