"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { usePropertyWizard } from "@/hooks/usePropertyWizard";
import type { ManagementType } from "@/types/property";

interface Props {
  onNext: () => void;
  onCancel: () => void;
}

export function Step1GeneralInfo({ onNext, onCancel }: Props) {
  const { formData, fieldConfidence, setPropertyField } = usePropertyWizard();
  const pc = fieldConfidence?.property;

  const validate = () => {
    return (
      formData.name.trim() &&
      formData.number.trim() &&
      formData.propertyManager.trim() &&
      formData.accountant.trim()
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">General Information</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Basic property details and management contacts.
        </p>
      </div>

      {pc && (
        <div className="rounded-lg border p-4 text-sm">
          {Object.values(pc).every((v) => v === "extracted") ? (
            <span className="text-green-600 dark:text-green-400">
              ✓ All fields extracted successfully from your document.
            </span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400">
              ⚠ Some fields need your attention — review highlighted fields below.
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FieldRow label="Management Type *" confidence={pc?.managementType}>
          <Select
            value={formData.managementType}
            onValueChange={(v) => setPropertyField("managementType", v as ManagementType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WEG">WEG — Wohnungseigentümergemeinschaft</SelectItem>
              <SelectItem value="MV">MV — Mietverwaltung</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>

        <FieldRow label="Property Number *" confidence={pc?.number}>
          <Input
            value={formData.number}
            onChange={(e) => setPropertyField("number", e.target.value)}
            placeholder="e.g. 10.557PRB"
            className={pc?.number === "missing" ? "border-destructive" : ""}
          />
        </FieldRow>

        <FieldRow label="Property Name *" confidence={pc?.name} className="md:col-span-2">
          <Input
            value={formData.name}
            onChange={(e) => setPropertyField("name", e.target.value)}
            placeholder="e.g. Parkview Residences Berlin"
            className={pc?.name === "missing" ? "border-destructive" : ""}
          />
        </FieldRow>

        <FieldRow label="Property Manager *" confidence={pc?.propertyManager}>
          <Input
            value={formData.propertyManager}
            onChange={(e) => setPropertyField("propertyManager", e.target.value)}
            placeholder="e.g. ImmoGuard Berlin GmbH"
            className={pc?.propertyManager === "missing" ? "border-destructive" : ""}
          />
        </FieldRow>

        <FieldRow label="Accountant *" confidence={pc?.accountant}>
          <Input
            value={formData.accountant}
            onChange={(e) => setPropertyField("accountant", e.target.value)}
            placeholder="e.g. FinanzExpertise Müller & Co KG"
            className={pc?.accountant === "missing" ? "border-destructive" : ""}
          />
        </FieldRow>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onNext} disabled={!validate()}>
          Next →
        </Button>
      </div>
    </div>
  );
}

function FieldRow({
  label,
  confidence,
  children,
  className,
}: {
  label: string;
  confidence?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className || ""}`}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <ConfidenceBadge confidence={confidence as "extracted" | "inferred" | "missing" | undefined} />
      </div>
      {children}
    </div>
  );
}
