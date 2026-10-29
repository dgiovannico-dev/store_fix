import { requestMessages } from "@/i18n/request-locale";
import type { MessageCatalog } from "@/i18n";

export type ActionErrorKey = keyof MessageCatalog["actionErrors"];

/** Messaggi guard delle server actions (locale richiesta, no hardcoded IT). */
export async function actionError(key: ActionErrorKey): Promise<string> {
  const msg = await requestMessages();
  return msg.actionErrors[key];
}
