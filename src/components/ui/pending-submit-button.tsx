"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Submit button that disables + swaps label while the parent form is pending. */
export function PendingSubmitButton({
  label,
  pendingLabel,
  className,
  ...rest
}: Omit<ButtonProps, "children" | "type" | "disabled"> & {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      {...rest}
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(className)}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {pendingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  );
}
