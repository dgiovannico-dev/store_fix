import { requestMessages } from "@/i18n/request-locale";
import { t, type Locale, type MessageCatalog } from "@/i18n";

export type DomainErrorKey = keyof MessageCatalog["domainErrors"];

export function isDomainErrorKey(value: string): value is DomainErrorKey {
  return value in t("it").domainErrors;
}

/** Sync — utile in test / mapping con locale noto. */
export function domainErrorFor(
  key: DomainErrorKey,
  locale: Locale = "it",
): string {
  return t(locale).domainErrors[key];
}

/** Async — server actions / API (cookie + Accept-Language). */
export async function domainError(key: DomainErrorKey): Promise<string> {
  const msg = await requestMessages();
  return msg.domainErrors[key];
}

/** Boundary: preferisci `code` catalogato; fallback al message legacy. */
export async function actionResultError(result: {
  message: string;
  code?: string;
}): Promise<string> {
  if (result.code && isDomainErrorKey(result.code)) {
    return domainError(result.code);
  }
  return result.message;
}
