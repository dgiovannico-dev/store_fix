/**
 * FacilityFlow MCP tools — same read-only AssistTools surface.
 * Lab only: never expose on store prod path.
 */

import { z } from "zod";
import {
  toolAssetHistory,
  toolSimilarTickets,
  toolTicketSummaryReadonly,
  toolVendorScorecardSnippet,
} from "@/application/ai/assist-tools";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

function requireLabAuth(): { tenantId: string; userId: string } {
  const token = process.env.FF_MCP_TOKEN?.trim();
  const provided = process.env.FF_MCP_AUTH?.trim();
  if (token && provided !== token) {
    throw new Error("MCP unauthorized — set FF_MCP_AUTH to match FF_MCP_TOKEN");
  }
  const tenantId = process.env.FF_MCP_TENANT_ID?.trim();
  const userId = process.env.FF_MCP_USER_ID?.trim() || "mcp-lab";
  if (!tenantId) {
    throw new Error("FF_MCP_TENANT_ID required for lab MCP");
  }
  return { tenantId, userId };
}

function jsonText(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

/** Register read-only tools on an MCP server instance. */
export function registerFacilityFlowTools(server: McpServer): void {
  server.registerTool(
    "similar_tickets",
    {
      description:
        "Read-only similar tickets (RAG/heuristic) for a tenant ticket. Assist only.",
      inputSchema: {
        ticketId: z.string().min(1),
        limit: z.number().int().min(1).max(10).optional(),
      },
    },
    async ({ ticketId, limit }) => {
      const { tenantId, userId } = requireLabAuth();
      const result = await toolSimilarTickets({
        tenantId,
        userId,
        ticketId,
        limit,
      });
      return jsonText({ ...result, needsConfirm: true });
    },
  );

  server.registerTool(
    "ticket_summary_readonly",
    {
      description: "Read-only ticket summary snapshot (no SoR write).",
      inputSchema: {
        ticketId: z.string().min(1),
      },
    },
    async ({ ticketId }) => {
      const { tenantId } = requireLabAuth();
      const result = await toolTicketSummaryReadonly({ tenantId, ticketId });
      return jsonText(result ?? { error: "not_found" });
    },
  );

  server.registerTool(
    "asset_history",
    {
      description: "Recent tickets for an asset (tenant-scoped, read-only).",
      inputSchema: {
        assetId: z.string().min(1),
        excludeTicketId: z.string().optional(),
        limit: z.number().int().min(1).max(15).optional(),
      },
    },
    async ({ assetId, excludeTicketId, limit }) => {
      const { tenantId } = requireLabAuth();
      const result = await toolAssetHistory({
        tenantId,
        assetId,
        excludeTicketId,
        limit,
      });
      return jsonText(result);
    },
  );

  server.registerTool(
    "vendor_suggest_readonly",
    {
      description:
        "Vendor scorecard snippet (open/verified/breach counts). Read-only.",
      inputSchema: {
        vendorId: z.string().min(1),
        rangeDays: z.number().int().min(7).max(90).optional(),
      },
    },
    async ({ vendorId, rangeDays }) => {
      const { tenantId } = requireLabAuth();
      const result = await toolVendorScorecardSnippet({
        tenantId,
        vendorId,
        rangeDays,
      });
      return jsonText(result ?? { error: "not_found" });
    },
  );
}
