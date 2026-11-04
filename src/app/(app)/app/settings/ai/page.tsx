import Link from "next/link";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { PageFrame } from "@/components/layout/page-frame";
import { AiSettingsClient } from "@/components/settings/ai-settings-client";
import { resolvePlatformAiConfig } from "@/infrastructure/ai/llm-gateway";
import { getActiveMembership } from "@/application/memberships/membership-service";

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

  const cfg = resolvePlatformAiConfig();

  return (
    <PageFrame>
      <div className="mx-auto max-w-2xl space-y-6" data-tour="hq.settings.ai">
        <div>
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
            Assistenza AI
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Suggerimenti con conferma umana — mai System of Record. Default
            piattaforma: vLLM / OpenAI-compatible o Ollama.
          </p>
        </div>
        <AiSettingsClient
          configured={Boolean(cfg)}
          kind={cfg?.kind ?? "none"}
          source={cfg?.sourceLabel ?? "heuristic"}
          model={cfg?.model ?? "—"}
        />
        <p className="text-sm text-[var(--muted-foreground)]">
          Documentazione:{" "}
          <Link href="/app/settings/locale" className="underline">
            Lingua
          </Link>
          {" · "}
          BYOK tenant (chiavi cloud del cliente) in arrivo — preset OpenAI /
          Anthropic / Gemini / custom via env{" "}
          <code className="text-xs">AI_BASE_URL</code>.
        </p>
      </div>
    </PageFrame>
  );
}
