"use client";

import { useState } from "react";
import { Plus, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { usePropertyWizard, emptyUnit } from "@/hooks/usePropertyWizard";
import type { UnitType, UnitFormData } from "@/types/property";

const UNIT_TYPES: UnitType[] = ["Apartment", "Office", "Garden", "Parking"];

interface Props {
  onBack: () => void;
  onSubmit: () => void;
  submitting?: boolean;
}

export function Step3Units({ onBack, onSubmit, submitting }: Props) {
  const { formData, addUnit, removeUnit, updateUnit, cloneUnit, bulkAddUnits } =
    usePropertyWizard();

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkConfig, setBulkConfig] = useState({
    buildingIdx: 0,
    type: "Parking" as UnitType,
    count: 5,
    startNumber: "01",
    floor: "UG",
    entrance: "",
    sizeSqm: 12.5,
    coOwnershipShare: "1/1000",
    constructionYear: 2023,
  });

  const allUnits = formData.buildings.flatMap((b, bi) =>
    b.units.map((u, ui) => ({ ...u, buildingIdx: bi, unitIdx: ui, buildingName: b.name })),
  );

  const totalUnits = allUnits.length;

  const handleBulkAdd = () => {
    const units: UnitFormData[] = Array.from({ length: bulkConfig.count }, (_, i) => ({
      number: String(parseInt(bulkConfig.startNumber || "1") + i).padStart(
        bulkConfig.startNumber.length,
        "0",
      ),
      type: bulkConfig.type,
      floor: bulkConfig.floor,
      entrance: bulkConfig.entrance,
      sizeSqm: bulkConfig.sizeSqm,
      coOwnershipShare: bulkConfig.coOwnershipShare,
      constructionYear: bulkConfig.constructionYear,
      rooms: null,
    }));
    bulkAddUnits(bulkConfig.buildingIdx, units);
    setBulkOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Units</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalUnits} unit{totalUnits !== 1 ? "s" : ""} across {formData.buildings.length} building
            {formData.buildings.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBulkConfig((c) => ({ ...c, buildingIdx: 0 }));
              setBulkOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Bulk Add
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addUnit(0)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
        </div>
      </div>

      <div className="border rounded-xl overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-10"></TableHead>
              <TableHead className="w-20">Unit #</TableHead>
              <TableHead className="w-32">Type</TableHead>
              <TableHead>Building</TableHead>
              <TableHead className="w-24">Floor</TableHead>
              <TableHead className="w-20">Entrance</TableHead>
              <TableHead className="w-24">Size m²</TableHead>
              <TableHead className="w-28">MEA</TableHead>
              <TableHead className="w-24">Year</TableHead>
              <TableHead className="w-20">Rooms</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allUnits.map((unit, rowIdx) => (
              <UnitRow
                key={rowIdx}
                unit={unit}
                buildings={formData.buildings.map((b) => b.name)}
                onUpdate={(field, value) =>
                  updateUnit(unit.buildingIdx, unit.unitIdx, field, value)
                }
                onClone={() => cloneUnit(unit.buildingIdx, unit.unitIdx)}
                onRemove={() => removeUnit(unit.buildingIdx, unit.unitIdx)}
                canRemove={totalUnits > 1}
              />
            ))}
            <TableRow
              className="cursor-pointer hover:bg-muted/30 text-muted-foreground"
              onClick={() => addUnit(0)}
            >
              <TableCell colSpan={11} className="text-center text-sm py-3">
                <Plus className="h-3.5 w-3.5 inline mr-1" />
                Add row
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Bulk Add Dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Add Units</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={bulkConfig.type}
                onValueChange={(v) =>
                  setBulkConfig((c) => ({ ...c, type: v as UnitType }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Building</Label>
              <Select
                value={String(bulkConfig.buildingIdx)}
                onValueChange={(v) =>
                  setBulkConfig((c) => ({ ...c, buildingIdx: parseInt(v) }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {formData.buildings.map((b, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {b.name || `Building ${i + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Count</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={bulkConfig.count}
                onChange={(e) =>
                  setBulkConfig((c) => ({ ...c, count: parseInt(e.target.value) || 1 }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Start #</Label>
              <Input
                value={bulkConfig.startNumber}
                onChange={(e) =>
                  setBulkConfig((c) => ({ ...c, startNumber: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Floor</Label>
              <Input
                value={bulkConfig.floor}
                onChange={(e) => setBulkConfig((c) => ({ ...c, floor: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Size m²</Label>
              <Input
                type="number"
                value={bulkConfig.sizeSqm}
                onChange={(e) =>
                  setBulkConfig((c) => ({ ...c, sizeSqm: parseFloat(e.target.value) }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>MEA</Label>
              <Input
                value={bulkConfig.coOwnershipShare}
                onChange={(e) =>
                  setBulkConfig((c) => ({ ...c, coOwnershipShare: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Year</Label>
              <Input
                type="number"
                value={bulkConfig.constructionYear}
                onChange={(e) =>
                  setBulkConfig((c) => ({
                    ...c,
                    constructionYear: parseInt(e.target.value),
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBulkOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAdd}>
              Add {bulkConfig.count} Units
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onSubmit} disabled={submitting || totalUnits === 0}>
          {submitting ? "Creating…" : "Create Property ✓"}
        </Button>
      </div>
    </div>
  );
}

function UnitRow({
  unit,
  buildings,
  onUpdate,
  onClone,
  onRemove,
  canRemove,
}: {
  unit: UnitFormData & { buildingIdx: number; buildingName: string };
  buildings: string[];
  onUpdate: (field: keyof UnitFormData, value: UnitFormData[keyof UnitFormData]) => void;
  onClone: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const isRoomsApplicable = unit.type === "Apartment" || unit.type === "Office";

  return (
    <TableRow className="hover:bg-muted/30">
      <TableCell>
        <Badge variant="outline" className="text-xs font-mono">
          {unit.buildingIdx + 1}
        </Badge>
      </TableCell>
      <TableCell>
        <Input
          value={unit.number}
          onChange={(e) => onUpdate("number", e.target.value)}
          className="h-8 text-sm w-16"
        />
      </TableCell>
      <TableCell>
        <Select
          value={unit.type}
          onValueChange={(v) => onUpdate("type", v as UnitType)}
        >
          <SelectTrigger className="h-8 text-sm w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UNIT_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="text-sm">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select
          value={String(unit.buildingIdx)}
          onValueChange={(v) => {
            // Moving units between buildings is complex — for simplicity, just show building name
            void v;
          }}
        >
          <SelectTrigger className="h-8 text-sm w-32">
            <SelectValue placeholder={unit.buildingName} />
          </SelectTrigger>
          <SelectContent>
            {buildings.map((b, i) => (
              <SelectItem key={i} value={String(i)} className="text-sm">
                {b || `Building ${i + 1}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          value={unit.floor}
          onChange={(e) => onUpdate("floor", e.target.value)}
          className="h-8 text-sm w-20"
          placeholder="EG"
        />
      </TableCell>
      <TableCell>
        <Input
          value={unit.entrance}
          onChange={(e) => onUpdate("entrance", e.target.value)}
          className="h-8 text-sm w-16"
          placeholder="A"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={unit.sizeSqm === "" ? "" : unit.sizeSqm}
          onChange={(e) => onUpdate("sizeSqm", parseFloat(e.target.value) || "")}
          className="h-8 text-sm w-20"
          placeholder="95.0"
        />
      </TableCell>
      <TableCell>
        <Input
          value={unit.coOwnershipShare}
          onChange={(e) => onUpdate("coOwnershipShare", e.target.value)}
          className="h-8 text-sm w-24 font-mono"
          placeholder="110/1000"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={unit.constructionYear === "" ? "" : unit.constructionYear}
          onChange={(e) => onUpdate("constructionYear", parseInt(e.target.value) || "")}
          className="h-8 text-sm w-20"
          placeholder="2023"
        />
      </TableCell>
      <TableCell>
        {isRoomsApplicable ? (
          <Input
            type="number"
            value={unit.rooms === null || unit.rooms === "" ? "" : unit.rooms}
            onChange={(e) =>
              onUpdate("rooms", e.target.value ? parseInt(e.target.value) : null)
            }
            className="h-8 text-sm w-16"
            placeholder="3"
          />
        ) : (
          <span className="text-muted-foreground text-sm px-2">—</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={onClone}
            title="Clone +1"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          {canRemove && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              onClick={onRemove}
              title="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
