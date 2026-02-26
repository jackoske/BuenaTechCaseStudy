import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { FieldConfidence } from "@/types/property";
import { cn } from "@/lib/utils";

interface Props {
  confidence?: FieldConfidence;
  className?: string;
}

const config = {
  extracted: {
    icon: CheckCircle2,
    label: "Extracted",
    className: "text-green-600 dark:text-green-400",
  },
  inferred: {
    icon: AlertTriangle,
    label: "Inferred",
    className: "text-amber-500 dark:text-amber-400",
  },
  missing: {
    icon: XCircle,
    label: "Missing",
    className: "text-destructive",
  },
};

export function ConfidenceBadge({ confidence, className }: Props) {
  if (!confidence) return null;
  const { icon: Icon, label, className: colorClass } = config[confidence];

  return (
    <span
      className={cn("flex items-center gap-1 text-xs font-medium", colorClass, className)}
      title={label}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
    </span>
  );
}
