# ADR-0012: AI multi-provider (vLLM default + tenant BYOK)

## Status

Accepted (GO PO 2026-11-04)

## Date

2026-11-04

## Context

F2-07/F3-03 usano solo Ollama nativo (`/api/chat`) o heuristic. Il team gira **vLLM** (OpenAI-compatible). I clienti SaaS chiedono di collegare provider locali e cloud “tutti”. ADR-0001 vieta SaaS a pagamento nel **path critico**; non vieta chiavi del cliente verso LLM esterni.

## Decision

1. Introdurre port **`LlmGateway`** (chat JSON + opz. embeddings).
2. **Default piattaforma:** `openai_compatible` → **vLLM** (`AI_BASE_URL`…`/v1`, `AI_MODEL`).
3. **Preset:** Ollama `/v1`, LM Studio, llama.cpp, OpenAI, Azure OpenAI, Groq, Together, Fireworks, DeepSeek, Mistral, OpenRouter, xAI, **custom baseURL**; più adapter `anthropic` e `google`.
4. **Cloud = BYOK tenant** (opt-in, secret cifrato). Nessuna API key cloud hard-coded FacilityFlow obbligatoria.
5. AI resta **assist + human-confirm**; mai SoR.
6. Libreria opzionale: AI SDK MIT dietro il port (`@ai-sdk/openai-compatible`).

Dettaglio prodotto: [`../product/AI_PLATFORM.md`](../product/AI_PLATFORM.md).

## Consequences

- Migrazione da client Ollama-only; env `OLLAMA_*` deprecato → `AI_*`.
- Superficie GDPR se tenant abilita cloud USA — warning UI + audit.
- Estensione “nuovo provider” = preset, non fork app.
- Conferma PO richiesta prima di implementare F7.

## Alternatives rejected

| Alternative | Perché no |
|-------------|-----------|
| Solo Ollama forever | Non parla vLLM nativo; meno copertura |
| Solo OpenAI cloud | Viola OSS-only path critico |
| Chatbot agent autonomo | Diventa SoR / rischio ops |
| Un SDK per ogni vendor day-1 | Manutenzione infinita; openai_compat copre la maggior parte |
