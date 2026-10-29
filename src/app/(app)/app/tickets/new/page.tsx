import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { tenantMessages } from "@/i18n/tenant-messages";
import { NewTicketForm } from "./new-ticket-form";

export default async function NewTicketPage() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    redirect("/login");
  }
  const msg = await tenantMessages(session.tenantId);
  return <NewTicketForm msg={msg} />;
}
