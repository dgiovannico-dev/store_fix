import * as React from "react";
import { cn } from "@/lib/utils";
import { textareaClass } from "@/lib/ui-classes";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <textarea className={cn(textareaClass, className)} ref={ref} {...props} />
));
Textarea.displayName = "Textarea";
