"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Standard "Coming soon" indicator for placeholder features.
 * Use for roadmap items not yet implemented; ensures no fake data or broken CTAs.
 */
export function ComingSoonBadge({
  className,
  label = "Coming soon",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <Badge variant="secondary" className={cn("text-muted-foreground font-normal", className)}>
      {label}
    </Badge>
  );
}

/**
 * Block-level placeholder for a section that is coming soon.
 */
export function ComingSoonSection({
  className,
  message = "This feature is coming soon.",
}: {
  className?: string;
  message?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 text-muted-foreground", className)}>
      <ComingSoonBadge />
      <p className="text-sm">{message}</p>
    </div>
  );
}
