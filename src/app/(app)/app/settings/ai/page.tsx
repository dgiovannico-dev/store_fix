import Link from "next/link";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { PageFrame } from "@/components/layout/page-frame";
import { AiSettingsClient } from "@/components/settings/ai-settings-client";
import { resolvePlatformAiConfig } from "@/infrastructure/ai/llm-gateway";
import { getActiveMembership } from "@/application/memberships/membership-service";
import { tenantMessages } from "@/i18n/tenant-messages";

const HQ = new Set<Role>([Role.owner, Role.admin_hq]);

export default async function AiSettingsPage() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId) redirect("/login");

  const membership = await getActiveMembership(
    session.user.id,
    session.tenantId,
  );
  if (!membership || !HQ.has(membership.role)) {
    redirect("/app/dashboard");
  }

  const [cfg, msg] = await Promise.all([
    Promise.resolve(resolvePlatformAiConfig()),
    tenantMessages(session.tenantId),
  ]);
  const copy = msg.settingsAi;

  return (
    <PageFrame>
      <div className="mx-auto max-w-2xl space-y-6" data-tour="hq.settings.ai">
        <div>
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
            {copy.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {copy.subtitle}
          </p>
        </div>
        <AiSettingsClient
          configured={Boolean(cfg)}
          kind={cfg?.kind ?? copy.providerNone}
          source={cfg?.sourceLabel ?? copy.sourceHeuristic}
          model={cfg?.model ?? msg.common.emptyDash}
          labels={copy}
        />
        <p className="text-sm text-[var(--muted-foreground)]">
          {copy.footerDocs}{" "}
          <Link href="/app/settings/locale" className="underline">
            {copy.footerLocaleLink}
          </Link>
          {" · "}
          {copy.footerByok}
        </p>
      </div>
    </PageFrame>
  );
}
