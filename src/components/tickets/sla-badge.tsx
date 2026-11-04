import type { SlaBadgeTone } from "@/domain/sla/badge";
import { Badge } from "@/components/ui/badge";

export function SlaBadge(props: { tone: SlaBadgeTone; label: string }) {
  if (props.tone === "none") {
    return <Badge variant="outline">{props.label}</Badge>;
  }
  if (props.tone === "breached") {
    return <Badge variant="critical">{props.label}</Badge>;
  }
  if (props.tone === "risk") {
    return <Badge variant="signal">{props.label}</Badge>;
  }
  return <Badge variant="success">{props.label}</Badge>;
}
