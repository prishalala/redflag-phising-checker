import { Badge } from "@/components/ui/badge";
import type { RiskLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

const STYLES: Record<RiskLevel, string> = {
  low: "bg-teal-100 text-teal-900 border-teal-200",
  medium: "bg-amber-100 text-amber-950 border-amber-200",
  high: "bg-orange-100 text-orange-950 border-orange-200",
  critical: "bg-rose-100 text-rose-950 border-rose-200",
};

export function RiskBadge({ risk, className }: { risk: RiskLevel; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wide", STYLES[risk], className)}
    >
      {risk}
    </Badge>
  );
}
