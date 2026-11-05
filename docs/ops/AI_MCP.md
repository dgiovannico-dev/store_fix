# MCP lab — FacilityFlow

Espone gli **stessi tool read-only** di AssistTools via stdio MCP. **Solo lab / rete privata.** Non abilitare sul path store produzione.

## Tool

| Tool | Descrizione |
|------|-------------|
| `similar_tickets` | Casi simili (embedding/heuristic) |
| `ticket_summary_readonly` | Snapshot ticket |
| `asset_history` | Storico ticket asset |
| `vendor_suggest_readonly` | Snippet scorecard vendor |

Nessun tool scrive SoR (ticket/SLA/costi/award).

## Avvio

```bash
export FF_MCP_ENABLED=true
export FF_MCP_TENANT_ID=<tenant cuid>
export FF_MCP_USER_ID=<hq user id>   # per similar_tickets RBAC
export FF_MCP_TOKEN=<secret lab>
export FF_MCP_AUTH=$FF_MCP_TOKEN      # stesso valore nel processo
export DATABASE_URL=...
# opz. Ollama
export OLLAMA_BASE_URL=http://127.0.0.1:11434

npm run mcp
```

## Cursor

In Cursor MCP settings (stdio):

```json
{
  "mcpServers": {
    "facilityflow-lab": {
      "command": "npx",
      "args": ["tsx", "src/mcp/server.ts"],
      "cwd": "/absolute/path/to/store_fix",
      "env": {
        "FF_MCP_ENABLED": "true",
        "FF_MCP_TENANT_ID": "…",
        "FF_MCP_USER_ID": "…",
        "FF_MCP_TOKEN": "…",
        "FF_MCP_AUTH": "…",
        "DATABASE_URL": "postgresql://…"
      }
    }
  }
}
```

Se `FF_MCP_TOKEN` è impostato, `FF_MCP_AUTH` deve coincidere.

## Sicurezza

- Default off (`FF_MCP_ENABLED` ≠ true → exit 1).
- Token lab obbligatorio in ambienti condivisi.
- Bind solo processo locale stdio — niente esposizione pubblica HTTP in v1.
