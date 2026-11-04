import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

/** Content frame — HQ fluid width, phone already constrained by PhoneShell. */
export function PageFrame({
  children,
  className,
  narrow,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
} & Omit<ComponentPropsWithoutRef<"main">, "className" | "children">) {
  return (
    <main
      {...rest}
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
