import { cn } from "@/lib/utils";

/** Content frame — HQ fluid width, phone already constrained by PhoneShell. */
export function PageFrame({
  children,
  className,
  narrow,
}: {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}) {
  return (
    <main
      className={cn(
        "w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8",
        narrow ? "mx-auto max-w-3xl" : "mx-auto max-w-7xl",
        className,
      )}
    >
      {children}
    </main>
  );
}
