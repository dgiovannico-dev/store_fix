import { AppChrome } from "@/components/shell/app-chrome";

export default function VendorGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppChrome>{children}</AppChrome>;
}
