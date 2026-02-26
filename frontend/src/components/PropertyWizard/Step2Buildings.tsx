"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { usePropertyWizard } from "@/hooks/usePropertyWizard";
import type { FieldConfidence } from "@/types/property";

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export function Step2Buildings({ onNext, onBack }: Props) {
  const { formData, fieldConfidence, addBuilding, removeBuilding, updateBuilding } =
    usePropertyWizard();

  const buildingsConf = fieldConfidence?.buildings || [];

  const validate = () =>
    formData.buildings.every(
      (b) => b.name.trim() && b.street.trim() && b.houseNumber.trim() && b.zipCode.trim() && b.city.trim(),
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Buildings</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Add the buildings belonging to this property.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={addBuilding}>
          <Plus className="h-4 w-4 mr-2" />
          Add Building
        </Button>
      </div>

      <div className="space-y-4">
        {formData.buildings.map((building, bi) => {
          const bc = buildingsConf[bi];
          return (
            <Card key={bi}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Building {bi + 1}</span>
                  {formData.buildings.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeBuilding(bi)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BuildingField
                  label="Building Name *"
                  confidence={bc?.name}
                  value={building.name}
                  onChange={(v) => updateBuilding(bi, "name", v)}
                  placeholder="e.g. Haus A - Parkside"
                />

                <div className="flex gap-3">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Street *</Label>
                      <ConfidenceBadge confidence={bc?.street as FieldConfidence} />
                    </div>
                    <Input
                      value={building.street}
                      onChange={(e) => updateBuilding(bi, "street", e.target.value)}
                      placeholder="Am Fiktivpark"
                    />
                  </div>
                  <div className="w-28 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">House #</Label>
                      <ConfidenceBadge confidence={bc?.houseNumber as FieldConfidence} />
                    </div>
                    <Input
                      value={building.houseNumber}
                      onChange={(e) => updateBuilding(bi, "houseNumber", e.target.value)}
                      placeholder="12"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-28 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">ZIP *</Label>
                      <ConfidenceBadge confidence={bc?.zipCode as FieldConfidence} />
                    </div>
                    <Input
                      value={building.zipCode}
                      onChange={(e) => updateBuilding(bi, "zipCode", e.target.value)}
                      placeholder="10557"
                      maxLength={5}
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">City *</Label>
                      <ConfidenceBadge confidence={bc?.city as FieldConfidence} />
                    </div>
                    <Input
                      value={building.city}
                      onChange={(e) => updateBuilding(bi, "city", e.target.value)}
                      placeholder="Berlin"
                    />
                  </div>
                </div>

                <BuildingField
                  label="Construction Year"
                  confidence={bc?.constructionYear}
                  value={String(building.constructionYear)}
                  onChange={(v) => updateBuilding(bi, "constructionYear", parseInt(v) || "")}
                  placeholder="2023"
                  type="number"
                />

                <BuildingField
                  label="Number of Floors"
                  confidence={bc?.floors}
                  value={String(building.floors)}
                  onChange={(v) => updateBuilding(bi, "floors", parseInt(v) || "")}
                  placeholder="5"
                  type="number"
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onNext} disabled={!validate()}>
          Next →
        </Button>
      </div>
    </div>
  );
}

function BuildingField({
  label,
  confidence,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  confidence?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <ConfidenceBadge confidence={confidence as FieldConfidence} />
      </div>
      <Input
        type={type}
        value={value === "0" || value === "" ? "" : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={confidence === "missing" ? "border-amber-400" : ""}
      />
    </div>
  );
}
