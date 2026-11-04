# AI providers (F7)

Assist only + human confirm. Never SoR.

## Platform default (env)

```bash
# Preferito: vLLM OpenAI-compatible
AI_BASE_URL=http://127.0.0.1:8000/v1
# o VLLM_BASE_URL=http://127.0.0.1:8000/v1
AI_API_KEY=token-local
AI_MODEL=<model-id-servito>

# Legacy Ollama
# OLLAMA_BASE_URL=http://127.0.0.1:11434
# OLLAMA_MODEL=llama3.2
```

Health (auth): `GET /api/ai/health`

## Endpoints assist

| Route | Uso |
|-------|-----|
| `POST /api/ai/suggest-category` | Categoria |
| `POST /api/ai/suggest-priority` | Priorità (F7-05) |
| `POST /api/ai/suggest-vendor` | Vendor heuristic |
| `POST /api/ai/summarize-ticket` | Riassunto note |
| `POST /api/ai/draft-message` | Bozza msg vendor/store |

BYOK tenant UI: `/app/settings/ai` (F7-03).
