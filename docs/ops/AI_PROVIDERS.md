# AI providers (F7)

Assist only + human confirm. Never SoR.

## Platform default (env) — vLLM sul PC

Il modello in lab gira tipicamente su **porta 8001** (OpenAI-compatible):

```bash
AI_BASE_URL=http://127.0.0.1:8001/v1
AI_API_KEY=local
AI_MODEL=mlx-community/Qwen2.5-3B-Instruct-4bit
```

Verifica rapida:

```bash
curl -s http://127.0.0.1:8001/v1/models | head
# Health in-app (auth): GET /api/ai/health
```

Alias accettati dal gateway: `VLLM_BASE_URL`, `VLLM_API_KEY`, `VLLM_MODEL`.

### Legacy Ollama

```bash
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
```

Se è settato `AI_BASE_URL` / `VLLM_BASE_URL`, ha priorità su Ollama.

## Endpoints assist

| Route | Uso |
|-------|-----|
| `POST /api/ai/suggest-category` | Categoria |
| `POST /api/ai/suggest-priority` | Priorità |
| `POST /api/ai/suggest-vendor` | Vendor heuristic |
| `POST /api/ai/summarize-ticket` | Riassunto note |
| `POST /api/ai/draft-message` | Bozza msg vendor/store |
| `GET /api/ai/health` | Ping provider |

UI settings: `/app/settings/ai`
