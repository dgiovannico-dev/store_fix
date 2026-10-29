import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { tenantMessages } from "@/i18n/tenant-messages";
import { StoreImportForm } from "./store-import-form";

export default async function StoreImportPage() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    redirect("/login");
  }
  const msg = await tenantMessages(session.tenantId);
  return <StoreImportForm msg={msg} />;
}
