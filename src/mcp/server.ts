/**
 * MCP stdio server — lab only.
 * Run: FF_MCP_TENANT_ID=… FF_MCP_TOKEN=… npm run mcp
 * Cursor: see docs/ops/AI_MCP.md
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerFacilityFlowTools } from "./facilityflow-tools";

async function main() {
  if (process.env.FF_MCP_ENABLED !== "true") {
    console.error(
      "[mcp] refuse start — set FF_MCP_ENABLED=true (lab only, never store prod)",
    );
    process.exit(1);
  }

  const server = new McpServer({
    name: "facilityflow-lab",
    version: "0.1.0",
  });
  registerFacilityFlowTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[mcp] facilityflow-lab stdio ready (read-only tools)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
