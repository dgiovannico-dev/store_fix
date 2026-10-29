export type StorePushPayload = {
  event: string;
  ticketId: string;
  storeId: string;
  storeName: string;
  title: string;
  body: string;
  url: string;
};

export type StorePushTarget = {
  webhookUrl?: string | null;
  ntfyTopic?: string | null;
};

const TOPIC_RE = /^[-_A-Za-z0-9]{1,64}$/;

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export function ticketDeepLink(ticketId: string): string {
  return `${appBaseUrl()}/app/tickets/${ticketId}`;
}

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Push store OSS (F3-08): webhook JSON e/o ntfy self-host.
 * Soft-fail: errori loggati, non propagati. Vietato WA Cloud API.
 */
export async function pushStoreTicketEvent(
  target: StorePushTarget,
  payload: StorePushPayload,
  fetchImpl: typeof fetch = fetch,
): Promise<{ webhook: boolean; ntfy: boolean }> {
  let webhook = false;
  let ntfy = false;

  const webhookUrl = target.webhookUrl?.trim();
  if (webhookUrl && isHttpUrl(webhookUrl)) {
    try {
      const res = await fetchImpl(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8_000),
      });
      webhook = res.ok;
      if (!res.ok) {
        console.warn("[store-push] webhook status", res.status);
      }
    } catch (e) {
      console.warn("[store-push] webhook", (e as Error).message);
    }
  }

  const topic = target.ntfyTopic?.trim();
  const base = process.env.NTFY_BASE_URL?.replace(/\/$/, "").trim();
  if (topic && base && TOPIC_RE.test(topic) && isHttpUrl(base)) {
    try {
      const headers: Record<string, string> = {
        Title: payload.title.slice(0, 120),
        Click: payload.url,
        Tags: "facilityflow",
      };
      const token = process.env.NTFY_TOKEN?.trim();
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetchImpl(`${base}/${topic}`, {
        method: "POST",
        headers,
        body: payload.body,
        signal: AbortSignal.timeout(8_000),
      });
      ntfy = res.ok;
      if (!res.ok) {
        console.warn("[store-push] ntfy status", res.status);
      }
    } catch (e) {
      console.warn("[store-push] ntfy", (e as Error).message);
    }
  }

  return { webhook, ntfy };
}
