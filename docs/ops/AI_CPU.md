# AI CPU-first (vLLM + pgvector)

Runbook lab: assist + RAG **senza Ollama obbligatorio**. Default = **vLLM** OpenAI-compatible già in ascolto (es. `:8001`); vector store = **pgvector** sullo stesso Postgres.

## Stack lab tipico (questo repo)

| Ruolo | Tool | Esempio |
|-------|------|---------|
| Chat | **vLLM** `/v1/chat/completions` | `mlx-community/Qwen2.5-3B-Instruct-4bit` su `:8001` |
| Embeddings | `/v1/embeddings` se esposto, altrimenti **local hash 768-d** | niente secondo modello |
| Alternate chat | llama.cpp / Ollama | solo se `AI_BASE_URL` assente e `OLLAMA_*` settato |
| Vector DB | pgvector | image `pgvector/pgvector:pg16` |

## Env (già in `.env.example`)

```bash
AI_BASE_URL=http://127.0.0.1:8001/v1
AI_API_KEY=local
AI_MODEL=mlx-community/Qwen2.5-3B-Instruct-4bit
# Opz. se un giorno esponi un embed server:
# AI_EMBED_MODEL=…
# AI_EMBED_BASE_URL=…   # futuro; oggi riusa AI_BASE_URL
```

Smoke provider:

```bash
curl -s http://127.0.0.1:8001/v1/models | head
# Chat OK → suggest/summarize/breach/RFQ usano vLLM
# Embeddings: molti vLLM chat-only → 404 su /v1/embeddings → fallback local_embed (OK)
```

## Flusso RAG

1. Ticket → `verified` / `cancelled` → job `ai.index_ticket` (embed remoto o local).
2. HQ → pannello **Casi simili** → `POST /api/ai/similar-tickets`.
3. Se vLLM down → chat heuristic; similar resta su local_embed / keyword — **no 5xx**.

## Ollama (opzionale, non default)

```bash
docker compose --profile ai up -d ollama
# solo se vuoi nomic-embed-text dedicato
```

## Vincoli

- AI = assist + conferma umana; **mai** write SoR.
- Isolamento `tenantId` su index/query.
- MCP = lab only (`docs/ops/AI_MCP.md`).

## Smoke similar

```bash
curl -sS -X POST "$NEXT_PUBLIC_APP_URL/api/ai/similar-tickets" \
  -H "Content-Type: application/json" \
  -H "Cookie: …" \
  -d '{"ticketId":"<id>"}'
```
