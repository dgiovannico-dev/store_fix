import { AppChrome } from "@/components/shell/app-chrome";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppChrome>{children}</AppChrome>;
}
