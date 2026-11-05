import {
  getBoss,
  QUEUE_AI_INDEX_TICKET,
} from "@/infrastructure/jobs/boss";
import { logJson } from "@/infrastructure/log";

/** Fire-and-forget enqueue after verified/cancelled. Safe if boss down. */
export async function enqueueAiIndexTicket(input: {
  tenantId: string;
  ticketId: string;
}): Promise<void> {
  try {
    const boss = await getBoss();
    if (!boss) return;
    await boss.send(
      QUEUE_AI_INDEX_TICKET,
      { tenantId: input.tenantId, ticketId: input.ticketId },
      {
        singletonKey: `ai-index:${input.tenantId}:${input.ticketId}`,
        retryLimit: 3,
        retryDelay: 60,
      },
    );
  } catch (e) {
    logJson("warn", "ai.index_enqueue_failed", {
      tenantId: input.tenantId,
      ticketId: input.ticketId,
      err: (e as Error).message,
    });
  }
}
