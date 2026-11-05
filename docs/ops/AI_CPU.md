# AI CPU-first (Ollama + pgvector)

Runbook lab per assist RAG / embeddings **senza GPU**. Path critico OSS: Ollama (default) o llama.cpp `llama-server` via `AI_BASE_URL`; vector store = **pgvector** sullo stesso Postgres Compose.

## Requisiti

| Voce | Minimo |
|------|--------|
| RAM host | 8–16 GB (modelli 3B Q4 + embed) |
| Disco | ~5 GB modelli |
| Postgres | image `pgvector/pgvector:pg16` (Compose lab/prod) |

## Avvio lab

```bash
# Postgres con pgvector (già in docker-compose.yml)
docker compose up -d postgres

# Ollama (profile ai)
docker compose --profile ai up -d ollama
docker compose exec ollama ollama pull nomic-embed-text
docker compose exec ollama ollama pull qwen2.5:3b
```

Env app/worker (es. `.env`):

```bash
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:3b
OLLAMA_EMBED_MODEL=nomic-embed-text
# oppure OpenAI-compat (llama.cpp / vLLM):
# AI_BASE_URL=http://127.0.0.1:8080/v1
# AI_MODEL=...
# AI_EMBED_MODEL=nomic-embed-text
```

In Compose rete: `OLLAMA_BASE_URL=http://ollama:11434` su servizi `app`/`worker` se ollama è sullo stesso compose.

## Flusso

1. Ticket → `verified` / `cancelled` → job pg-boss `ai.index_ticket` chunk+embed.
2. HQ dettaglio → pannello **Casi simili** → `POST /api/ai/similar-tickets` (tenant-scoped).
3. Se Ollama down → heuristic keyword, **no 5xx**.

## Vincoli

- AI = assist + conferma umana; **mai** write SoR (stato/SLA/costi).
- Isolamento `tenantId` obbligatorio su index e query.
- MCP interno = solo lab (rete privata / token); non path store prod.

## Smoke

```bash
# con sessione HQ autenticata
curl -sS -X POST "$NEXT_PUBLIC_APP_URL/api/ai/similar-tickets" \
  -H "Content-Type: application/json" \
  -H "Cookie: …" \
  -d '{"ticketId":"<id>"}'
```
