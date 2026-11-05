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

### Embeddings (RAG F7-08)

1. `POST {AI_BASE_URL}/embeddings` se il server lo espone  
2. altrimenti **local_embed** 768-d (CPU, deterministico) — tipico con vLLM chat-only MLX  
3. Ollama `/api/embeddings` solo se usi preset Ollama (non default)

Runbook: [`AI_CPU.md`](./AI_CPU.md).

### Legacy Ollama (non default)

```bash
# Solo se AI_BASE_URL / VLLM_* sono vuoti:
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
```

`AI_BASE_URL` / `VLLM_BASE_URL` **hanno sempre priorità** su Ollama.

### Audit F7-07

Ogni assist scrive `AiInvocation` (tenant, feature, provider, model, ok, latency) — **senza** prompt/response. Soft budget: `AI_SOFT_BUDGET_MONTHLY` (default 5000) → warn log + badge in `/app/settings/ai`.

## Endpoints assist

| Route | Uso |
|-------|-----|
| `POST /api/ai/suggest-category` | Categoria |
| `POST /api/ai/suggest-priority` | Priorità |
| `POST /api/ai/suggest-vendor` | Vendor heuristic |
| `POST /api/ai/summarize-ticket` | Riassunto note |
| `POST /api/ai/draft-message` | Bozza msg vendor/store |
| `POST /api/ai/similar-tickets` | Casi simili (RAG / local_embed) |
| `POST /api/ai/breach-brief` | Brief breach (tool + LLM) |
| `POST /api/ai/digest-narrative` | Bozza digest HQ |
| `POST /api/ai/rfq-compare` | Confronto offerte (no auto-award) |
| `GET /api/ai/health` | Ping provider |

UI settings: `/app/settings/ai`
