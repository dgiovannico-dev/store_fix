import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { SegnalaChatWizard } from "@/components/intake/segnala-chat-wizard";
import { listAssets } from "@/domain/assets/asset-service";
import { getActiveMembership } from "@/domain/memberships/membership-service";
import { canAccessStore } from "@/domain/rbac/store-scope";
import { tenantMessages } from "@/i18n/tenant-messages";
import { checkActionRateLimit } from "@/infrastructure/rate-limit-action";
import { RATE_LIMIT } from "@/infrastructure/rate-limit-policies";
import { prisma } from "@/infrastructure/db/prisma";

type Props = { params: Promise<{ storeId: string }> };

/**
 * Deep link “Segnala guasto” (F2-01) — wizard chat-like, auth-gated.
 * Nessuna WhatsApp Business API.
 */
export default async function SegnalaGuastoPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    redirect("/login");
  }
  const { storeId } = await params;

  const [msg, prefs] = await Promise.all([
    tenantMessages(session.tenantId),
    getTenantI18nPrefs(session.tenantId),
  ]);
  const copy = msg.intake;

  const limit = await checkActionRateLimit(
    `intake:${session.tenantId}:${session.user.id}`,
    RATE_LIMIT.intake,
  );
  if (limit.limited) {
    return (
      <main className="mx-auto max-w-[390px] px-4 py-12">
        <h1 className="font-[family-name:var(--font-sora)] text-xl font-semibold">
          {copy.rateLimitedTitle}
        </h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {copy.rateLimitedBody.replace("{sec}", String(limit.retryAfterSec))}
        </p>
        <Link href="/app/tickets" className="mt-6 inline-block text-sm underline">
          {copy.backTickets}
        </Link>
      </main>
    );
  }

  const membership = await getActiveMembership(
    session.user.id,
    session.tenantId,
  );
  if (!membership) redirect("/login");

  const store = await prisma.store.findFirst({
    where: {
      id: storeId,
      tenantId: session.tenantId,
      deletedAt: null,
    },
  });
  if (!store || !canAccessStore(membership, store.id)) notFound();

  const assets = await listAssets({
    tenantId: session.tenantId,
    membership,
    storeId: store.id,
  });

  return (
    <SegnalaChatWizard
      storeId={store.id}
      storeName={store.name}
      assets={assets.map((a) => ({ id: a.id, label: a.label }))}
      locale={prefs.locale}
      labels={copy}
    />
  );
}
