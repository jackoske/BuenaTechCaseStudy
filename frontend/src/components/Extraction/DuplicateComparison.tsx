"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DuplicateMatch, ExtractionData } from "@/types/property";

interface Props {
  duplicates: DuplicateMatch[];
  extracted: ExtractionData;
  onContinue: () => void;
  onCancel: () => void;
}

export function DuplicateComparison({ duplicates, extracted, onContinue, onCancel }: Props) {
  const existing = duplicates[0];
  const isExact = existing.matchType === "exact";

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <AlertTriangle className="h-6 w-6 text-amber-500" />
        <h1 className="text-xl font-semibold">
          {isExact ? "Exact Duplicate Detected" : "Potential Duplicate Detected"}
        </h1>
        <Badge variant={isExact ? "destructive" : "secondary"}>
          {isExact ? "Exact match" : "Potential match"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="border rounded-xl p-6">
          <h2 className="text-sm font-medium uppercase text-muted-foreground tracking-wide mb-4">
            Extracted (New)
          </h2>
          <div className="space-y-3">
            <Row label="Name" value={extracted.property?.name || "—"} />
            <Row label="Number" value={extracted.property?.number || "—"} />
            <Row label="Type" value={extracted.property?.managementType || "—"} />
            <Row label="Buildings" value={String(extracted.buildings?.length || 0)} />
            <Row label="Units" value={String(extracted.units?.length || 0)} />
          </div>
        </div>

        <div className="border rounded-xl p-6 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
          <h2 className="text-sm font-medium uppercase text-muted-foreground tracking-wide mb-4">
            Existing Property
          </h2>
          <div className="space-y-3">
            <Row
              label="Name"
              value={existing.name}
              match={existing.name === extracted.property?.name}
            />
            <Row
              label="Number"
              value={existing.number}
              match={existing.number === extracted.property?.number}
            />
            <Row
              label="Type"
              value={existing.managementType}
              match={existing.managementType === extracted.property?.managementType}
            />
            <Row label="Buildings" value={String(existing.buildingCount)} />
            <Row label="Units" value={String(existing.unitCount)} />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => (window.location.href = `/properties/${existing.id}`)}
        >
          View Existing
        </Button>
        <Button onClick={onContinue} variant="default">
          Continue Anyway
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  match,
}: {
  label: string;
  value: string;
  match?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-right">{value}</span>
        {match !== undefined && (
          <span
            className={`text-xs ${match ? "text-green-600" : "text-amber-600"}`}
          >
            {match ? "✓ match" : "≈ similar"}
          </span>
        )}
      </div>
    </div>
  );
}
