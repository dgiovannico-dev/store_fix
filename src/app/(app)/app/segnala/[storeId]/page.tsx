import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { SegnalaChatWizard } from "@/components/intake/segnala-chat-wizard";
import { listAssets } from "@/domain/assets/asset-service";
import { getActiveMembership } from "@/domain/memberships/membership-service";
import { canAccessStore } from "@/domain/rbac/store-scope";
import { checkRateLimit } from "@/infrastructure/rate-limit";
import { prisma } from "@/infrastructure/db/prisma";
import { tenantMessages } from "@/i18n/tenant-messages";

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

  const limit = checkRateLimit(
    `intake:${session.tenantId}:${session.user.id}`,
    20,
    15 * 60 * 1000,
  );
  if (!limit.ok) {
    return (
      <main className="mx-auto max-w-[390px] px-4 py-12">
        <h1 className="font-[family-name:var(--font-sora)] text-xl font-semibold">
          {copy.rateLimitTitle}
        </h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {copy.rateLimitBody} {limit.retryAfterSec} {copy.rateLimitSeconds}
        </p>
        <Link
          href="/app/tickets"
          className="mt-6 inline-block text-sm underline"
        >
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
      copy={copy}
    />
  );
}
