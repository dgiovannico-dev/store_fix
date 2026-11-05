# FacilityFlow Retail — AI Platform plan (vLLM + multi-provider)

> **Stato:** **GO PO 2026-11-04** — implementazione F7 in corso.  
> **ADR:** [`../adr/0012-ai-multi-provider-byok.md`](../adr/0012-ai-multi-provider-byok.md)  
> **Vincolo invariato:** AI = **assist + conferma umana**. Mai System of Record (stato ticket, SLA, costi, permessi).  
> **Default runtime:** **vLLM** OpenAI-compatible (`/v1/chat/completions`). Ollama resta preset compatibile.  
> **Cloud:** consentito solo come **BYOK tenant** (chiavi del cliente) — non dipendenza obbligatoria del path critico OSS.

---

## Analysis Card

- **Assunzioni:** (1) hai già un endpoint vLLM raggiungibile dalla app/worker; (2) “SaaS completo” = prodotto tenant self-serve (settings AI, audit, limiti), non billing FacilityFlow in questa fase; (3) “tutti i provider” = **registry estensibile** + preset noti, non 50 SDK hard-coded day-1.
- **Ricerca:** vLLM OpenAI server ([docs](https://docs.vllm.ai/en/latest/serving/online_serving/openai_compatible_server/)); AI SDK `createOpenAICompatible` + registry ([ai-sdk.dev](https://sdk.vercel.ai/providers/openai-compatible-providers)); pattern gateway multi-provider (openai-chat / anthropic-messages / gemini).
- **Scelta di design:** un **port** `LlmChat` + adapter `openai_compatible` (copre ~80% local+cloud) + adapter dedicati Anthropic/Gemini; UI settings HQ per preset. Non un chatbot ops.
- **AI:** yes — assist facility-specific; ROI chiaro dove riduce tempo HQ/vendor.
- **Rischi:** leak PII verso cloud BYOK; prompt injection su note ticket; costo cloud a carico cliente; confusione “AI ha chiuso il ticket”. Mitigazioni sotto.

---

## Oggi (as-is)

| Feature | Path | Provider | Scrive SoR? |
|---------|------|----------|-------------|
| Suggest categoria | `/api/ai/suggest-category` | Ollama `/api/chat` o heuristic | No (UI confirm) |
| Suggest vendor | `/api/ai/suggest-vendor` | Heuristic | No |
| Summarize note | `/api/ai/summarize-ticket` | Ollama o heuristic | No (sola lettura) |

Gap: solo Ollama nativo; no vLLM; no BYOK; no settings tenant; source label fissata a `ollama`.

---

## Dove l’AI dà valore (mappa ROI)

### Tier A — alto ROI (pilota / differenziazione vs WA+Excel)

| ID | Assist | Attore | Valore | Conferma umana |
|----|--------|--------|--------|----------------|
| **A1** | Categorizzazione + priorità da testo intake | Store / HQ | Meno triage; meno errori categoria | Sì — select |
| **A2** | Suggest vendor (copertura + storico MTTR) | HQ | Dispatch più veloce | Sì — select |
| **A3** | Riassunto timeline ticket | HQ | Briefing breach / handoff | Sola lettura |
| **A4** | Bozza messaggio vendor / store (IT) | HQ / vendor | Meno copia-incolla WA | Sì — edit+send |
| **A5** | Digest narrativo settimanale (con F6-01) | HQ | Report senza Excel | Sì — review+send |
| **A6** | Confronto offerte RFQ (tabella + pro/contro) | HQ | Award più informato | Sì — award manuale |

### Tier B — medio ROI (post-pilota)

| ID | Assist | Note |
|----|--------|------|
| **B1** | Suggest playbook breach (relaunch / nota) | Accoppia F6-04 |
| **B2** | Estrai asset / store hint da foto caption | Vision solo se provider supporta; opt-in |
| **B3** | Duplicate / similar ticket (embedding) | `openai_compatible` `/v1/embeddings` |
| **B4** | Traduzione note IT↔EN per vendor estero | Mai auto-replace SoR |
| **B5** | Spiegazione “contratto vs misurato” | Accoppia F6-05 |

### Tier C — no / later (anti-pattern)

| Idea | Perché no |
|------|-----------|
| Chatbot che assegna/chiude ticket | Sostituisce ops / diventa SoR |
| Auto-breach senza policy | SLA già deterministica in codice |
| Auto-award RFQ | Risk legale / vendor trust |
| AI scrive costi effettivi | SoR finanziario |
| Fine-tuning obbligatorio cloud | Lock-in + costo |

---

## Architettura target

```
┌─────────────────────────────────────────────────────────┐
│  UI HQ / Store / Vendor  (assist panels, needsConfirm)  │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  Application use-cases (A1…A6, B*)                      │
│  — prompt + schema JSON — mai write SoR                 │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  Port: LlmGateway.chatJson / embed                      │
│  + rate limit + audit (tenantId, feature, provider)     │
└───────────────────────────┬─────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
 openai_compatible     anthropic_messages   google_genai
 (vLLM, Ollama/v1,     (Anthropic,          (Gemini API /
  LM Studio, Groq,      Bedrock-Anthropic    Vertex BYOK)
  OpenAI, Azure*,       proxies)
  Mistral, DeepSeek,
  Together, Fireworks,
  OpenRouter, …)
```

\* Azure OpenAI = endpoint compat + API key tenant.

### Default lab / tuo setup

```bash
# Preferito: vLLM già avviato (lab tipico :8001)
AI_BASE_URL=http://127.0.0.1:8001/v1
AI_API_KEY=local
AI_MODEL=mlx-community/Qwen2.5-3B-Instruct-4bit

# Fallback legacy Ollama
# OLLAMA_BASE_URL=http://127.0.0.1:11434
# OLLAMA_MODEL=llama3.2
```

Env di piattaforma = **default** per tutti i tenant senza override.  
Override tenant (SaaS): tabella `TenantAiConfig` + secret cifrato (OpenBao / envelope Postgres).

### “Tutti i provider” — come senza infinito SDK

| Strategia | Copertura |
|-----------|-----------|
| **Preset `openai_compatible`** + baseURL + model + key | vLLM, Ollama (`/v1`), llama.cpp, LM Studio, SGLang, OpenAI, Azure OpenAI, Groq, Together, Fireworks, DeepSeek, Mistral, OpenRouter, Grok (xAI), Cohere compat, ecc. |
| **Preset `anthropic`** | Anthropic Messages API (+ proxy compatibili) |
| **Preset `google`** | Gemini / Generative Language |
| **Preset custom** | qualsiasi baseURL + header map (escape hatch) |

UI: catalogo preset noti + form “OpenAI-compatible custom”.  
Nuovi vendor cloud = **nuovo preset JSON**, non release app obbligatoria.

Libreria consigliata (OSS MIT): Vercel **AI SDK** (`ai` + `@ai-sdk/openai-compatible` + provider ufficiali) dietro il port — scambiabile.

---

## SaaS completo (esperienza tenant)

Cosa rende l’AI “prodotto”, non script interno:

1. **Settings HQ** `/app/settings/ai` — enable/disable feature A*; provider preset; test connection; model list.
2. **BYOK** — API key tenant cifrata; mai loggata; rotatable; “usa default piattaforma” toggle.
3. **Policy** — allowlist feature per ruolo; max token / req; budget mensile soft (conteggio, non charge).
4. **Audit** — `AiInvocation` (tenant, user, feature, provider, model, latency, ok/fail, **no** prompt raw in clear se cloud — hash + redaction).
5. **Fallback** — cloud fail → heuristic o default vLLM piattaforma.
6. **Copy IT** — “Suggerimento — conferma prima di applicare”; badge `source=vllm|openai|…`.

**Fuori questa bozza (proposta separata):** billing abbonamenti FacilityFlow, marketplace plugin AI, training su dati tenant senza DPA.

---

## Security & compliance

- Dati ticket verso cloud BYOK = **opt-in esplicito** + warning GDPR (trasferimento extra-UE possibile).
- Default raccomandato pilota IT: **solo vLLM/Ollama in rete privata**.
- Rate limit già `aiSuggest` — alzare budget per feature streaming.
- Prompt: system lock “non inventare; JSON schema”; strip PII opzionale (email/tel) prima di cloud.
- SEC: secret in OpenBao path `apps/facilityflow/tenants/<id>/ai` quando F4 attivo.

---

## Piano di delivery (Fase 7)

| ID | Slice | Priorità | Dipendenze |
|----|-------|----------|------------|
| **F7-01** | Port `LlmGateway` + adapter vLLM openai_compat; migrare category/summarize; deprecare client Ollama-only | **P0** | — |
| **F7-02** | Env docs + `AI_*` + health `GET /api/ai/health` (models list) | **P0** | F7-01 |
| **F7-03** | Tenant AI settings + BYOK encrypt + UI `/app/settings/ai` | **P0** | F7-01, OpenBao opz. |
| **F7-04** | Preset catalog (vLLM, Ollama, OpenAI, Anthropic, Gemini, Groq, OpenRouter, Azure, custom) | **P0** | F7-03 |
| **F7-05** | Assist A4 bozza messaggio + A1 priorità | **P1** | F7-01 |
| **F7-06** | Assist A6 RFQ compare + A5 digest hook | **P1** | Done lite 2026-11-05 (`/api/ai/rfq-compare`, `/api/ai/digest-narrative`) |
| **F7-07** | `AiInvocation` audit + usage soft-budget | **P1** | F7-03 |
| **F7-08** | Embeddings B3 similar ticket (pgvector + Ollama CPU) | **P2** | Done lite 2026-11-05 — runbook [`../ops/AI_CPU.md`](../ops/AI_CPU.md) |
| **F7-09** | Vision B2 caption (opt-in) | **P2** | modello vision |
| **F7-10** | ADR-0012 Accepted + STACK update + runbook `AI_PROVIDERS.md` | **P0** | conferma PO |

**Ordine consigliato:** F7-10 (docs lock) → F7-01 → F7-02 → F7-03/04 → A-features.

---

## Criteri win (AI platform)

- Con vLLM locale: suggest categoria + summarize funzionano senza Ollama.
- Tenant può collegare OpenAI **o** Anthropic **o** baseURL custom con la propria key e un test “ping” verde.
- Nessun endpoint AI scrive ticket/SLA/costi senza azione umana esplicita.
- Disabilitando AI, heuristic resta (degrado grazioso).

## Lose / stop

- Chatbot che bypassa FSM.
- Cloud come unico path (rompe OSS-only).
- Prompt/PII in log plaintext.

---

## Conferma PO richiesta

Rispondi **GO F7** (o ammendamenti) su:

1. Default **vLLM** ok (Ollama = preset)?  
2. BYOK cloud **opt-in tenant** ok (vincolo OSS path critico integro)?  
3. Scope Tier A (A1–A6) nel primo sprint AI?  
4. “SaaS completo” = settings+BYOK+audit **senza** billing in F7?
