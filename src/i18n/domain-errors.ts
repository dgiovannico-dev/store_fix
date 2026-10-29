import { requestMessages } from "@/i18n/request-locale";
import { t, type Locale, type MessageCatalog } from "@/i18n";

export type DomainErrorKey = keyof MessageCatalog["domainErrors"];

export function isDomainErrorKey(value: string): value is DomainErrorKey {
  return value in t("it").domainErrors;
}

function applyParams(
  template: string,
  params?: Record<string, string>,
): string {
  if (!params) return template;
  let out = template;
  for (const [k, v] of Object.entries(params)) {
    out = out.replaceAll(`{${k}}`, v);
  }
  return out;
}

/** Sync — utile in test / mapping con locale noto. */
export function domainErrorFor(
  key: DomainErrorKey,
  locale: Locale = "it",
  params?: Record<string, string>,
): string {
  return applyParams(t(locale).domainErrors[key], params);
}

/** Async — server actions / API (cookie + Accept-Language). */
export async function domainError(
  key: DomainErrorKey,
  params?: Record<string, string>,
): Promise<string> {
  const msg = await requestMessages();
  return applyParams(msg.domainErrors[key], params);
}

/** Boundary: preferisci `code` catalogato; fallback al message legacy. */
export async function actionResultError(result: {
  message?: string;
  code?: string;
  params?: Record<string, string>;
}): Promise<string> {
  if (result.code && isDomainErrorKey(result.code)) {
    return domainError(result.code, result.params);
  }
  return result.message ?? result.code ?? "Error";
}
