"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Pencil, Trash2, Check, X, Plus, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { propertiesApi } from "@/lib/api";
import type { Property, Building, Unit, ManagementType, UnitType } from "@/types/property";
import { toast } from "sonner";

const UNIT_TYPES: UnitType[] = ["Apartment", "Office", "Garden", "Parking"];
const MGMT_TYPES: ManagementType[] = ["WEG", "MV"];

type UnitSortKey = "number" | "type" | "floor" | "entrance" | "sizeSqm" | "coOwnershipShare" | "rooms";
type SortDir = "asc" | "desc";

interface UnitSort {
  key: UnitSortKey;
  dir: SortDir;
}

const unitTypeColor: Record<string, "default" | "secondary" | "outline"> = {
  Apartment: "default",
  Office: "secondary",
  Garden: "outline",
  Parking: "outline",
};

interface Props {
  id: number;
}

export function PropertyDetail({ id }: Props) {
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  const [editingHeader, setEditingHeader] = useState(false);
  const [editingBuildingId, setEditingBuildingId] = useState<number | null>(null);
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingBuildingId, setDeletingBuildingId] = useState<number | null>(null);
  const [addingBuilding, setAddingBuilding] = useState(false);
  const [addingUnitBuildingId, setAddingUnitBuildingId] = useState<number | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<{ unitId: number; buildingId: number; unitNumber: string } | null>(null);
  const [unitTypeFilter, setUnitTypeFilter] = useState<Record<number, UnitType | "all">>({});
  const [unitSort, setUnitSort] = useState<Record<number, UnitSort>>({});

  useEffect(() => {
    propertiesApi
      .get(id)
      .then(setProperty)
      .catch(() => toast.error("Failed to load property"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await propertiesApi.delete(id);
      toast.success("Property deleted");
      router.push("/");
    } catch {
      toast.error("Failed to delete property");
      setDeleting(false);
    }
  };

  const handleSaveHeader = async (draft: Parameters<typeof propertiesApi.update>[1]) => {
    const updated = await propertiesApi.update(id, draft);
    setProperty((p) => (p ? { ...p, ...updated } : p));
    setEditingHeader(false);
  };

  const handleSaveBuilding = async (
    buildingId: number,
    draft: Parameters<typeof propertiesApi.updateBuilding>[1],
  ) => {
    const updated = await propertiesApi.updateBuilding(buildingId, draft);
    setProperty((p) =>
      p
        ? { ...p, buildings: p.buildings.map((b) => (b.id === buildingId ? { ...b, ...updated } : b)) }
        : p,
    );
    setEditingBuildingId(null);
  };

  const handleSaveUnit = async (
    unitId: number,
    draft: Parameters<typeof propertiesApi.updateUnit>[1],
  ) => {
    const updated = await propertiesApi.updateUnit(unitId, draft);
    setProperty((p) =>
      p
        ? {
            ...p,
            buildings: p.buildings.map((b) => ({
              ...b,
              units: b.units.map((u) => (u.id === unitId ? { ...u, ...updated } : u)),
            })),
          }
        : p,
    );
    setEditingUnitId(null);
  };

  const handleAddBuilding = async (draft: Parameters<typeof propertiesApi.createBuilding>[1]) => {
    const created = await propertiesApi.createBuilding(id, draft);
    setProperty((p) => (p ? { ...p, buildings: [...p.buildings, created] } : p));
    setAddingBuilding(false);
  };

  const handleDeleteBuilding = async (buildingId: number) => {
    try {
      await propertiesApi.deleteBuilding(buildingId);
      setProperty((p) =>
        p ? { ...p, buildings: p.buildings.filter((b) => b.id !== buildingId) } : p,
      );
      toast.success("Building deleted");
    } catch {
      toast.error("Failed to delete building");
    } finally {
      setDeletingBuildingId(null);
    }
  };

  const handleAddUnit = async (buildingId: number, draft: Parameters<typeof propertiesApi.createUnit>[1]) => {
    try {
      const created = await propertiesApi.createUnit(buildingId, draft);
      setProperty((p) =>
        p
          ? {
              ...p,
              buildings: p.buildings.map((b) =>
                b.id === buildingId ? { ...b, units: [...b.units, created] } : b,
              ),
            }
          : p,
      );
      setAddingUnitBuildingId(null);
      toast.success("Unit added");
    } catch {
      toast.error("Failed to add unit");
    }
  };

  const handleDeleteUnit = async () => {
    if (!deletingUnit) return;
    const { unitId, buildingId } = deletingUnit;
    try {
      await propertiesApi.deleteUnit(unitId);
      setProperty((p) =>
        p
          ? {
              ...p,
              buildings: p.buildings.map((b) =>
                b.id === buildingId ? { ...b, units: b.units.filter((u) => u.id !== unitId) } : b,
              ),
            }
          : p,
      );
      toast.success("Unit deleted");
    } catch {
      toast.error("Failed to delete unit");
    } finally {
      setDeletingUnit(null);
    }
  };

  const toggleUnitSort = (buildingId: number, key: UnitSortKey) => {
    setUnitSort((s) => {
      const cur = s[buildingId];
      return {
        ...s,
        [buildingId]: { key, dir: cur?.key === key && cur.dir === "asc" ? "desc" : "asc" },
      };
    });
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  }

  if (!property) {
    return (
      <div className="p-8">
        <p className="text-destructive">Property not found.</p>
        <Link href="/">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </Link>
      </div>
    );
  }

  const totalUnits = property.buildings.reduce((s, b) => s + b.units.length, 0);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/properties">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Properties
          </Button>
        </Link>
      </div>

      {/* ── Property header ── */}
      {editingHeader ? (
        <HeaderEditForm
          property={property}
          onSave={handleSaveHeader}
          onCancel={() => setEditingHeader(false)}
        />
      ) : (
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{property.name}</h1>
              <Badge variant={property.managementType === "WEG" ? "default" : "secondary"}>
                {property.managementType}
              </Badge>
            </div>
            <p className="text-muted-foreground font-mono text-sm mt-1">#{property.number}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setEditingHeader(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Property Manager", value: property.propertyManager },
          { label: "Accountant", value: property.accountant },
          { label: "Buildings", value: property.buildings.length },
          { label: "Total Units", value: totalUnits },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                {item.label}
              </p>
              <p className="font-medium text-sm break-words" title={String(item.value)}>{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Buildings ── */}
      <div className="space-y-6">
        {property.buildings.map((building) => {
          const activeFilter = unitTypeFilter[building.id] ?? "all";
          const filtered =
            activeFilter === "all"
              ? building.units
              : building.units.filter((u) => u.type === activeFilter);

          const sort = unitSort[building.id];
          const visibleUnits = sort
            ? [...filtered].sort((a, b) => {
                const dir = sort.dir === "asc" ? 1 : -1;
                const av = a[sort.key];
                const bv = b[sort.key];
                if (av === null || av === undefined) return dir;
                if (bv === null || bv === undefined) return -dir;
                if (typeof av === "number" && typeof bv === "number") return dir * (av - bv);
                return dir * String(av).localeCompare(String(bv), undefined, { numeric: true });
              })
            : filtered;

          // Count per type for filter badges
          const typeCounts = UNIT_TYPES.reduce<Record<string, number>>((acc, t) => {
            acc[t] = building.units.filter((u) => u.type === t).length;
            return acc;
          }, {});

          return (
            <Card key={building.id}>
              <CardHeader className="pb-3">
                {editingBuildingId === building.id ? (
                  <BuildingEditForm
                    building={building}
                    onSave={(draft) => handleSaveBuilding(building.id, draft)}
                    onCancel={() => setEditingBuildingId(null)}
                  />
                ) : (
                  <div className="space-y-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="shrink-0">{building.name}</span>
                      <span className="text-sm font-normal text-muted-foreground truncate">
                        {building.street} {building.houseNumber}, {building.zipCode} {building.city}
                      </span>
                      <Badge variant="outline" className="ml-auto text-xs shrink-0">
                        {building.units.length} units
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground shrink-0"
                        onClick={() => setEditingBuildingId(building.id)}
                        title="Edit building"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => setDeletingBuildingId(building.id)}
                        title="Delete building"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </CardTitle>

                    {/* ── Unit type filters ── */}
                    {building.units.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <button
                          onClick={() =>
                            setUnitTypeFilter((f) => ({ ...f, [building.id]: "all" }))
                          }
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                            activeFilter === "all"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          All ({building.units.length})
                        </button>
                        {UNIT_TYPES.filter((t) => typeCounts[t] > 0).map((t) => (
                          <button
                            key={t}
                            onClick={() =>
                              setUnitTypeFilter((f) => ({
                                ...f,
                                [building.id]: activeFilter === t ? "all" : t,
                              }))
                            }
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                              activeFilter === t
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            {t} ({typeCounts[t]})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <UnitSortHead label="Unit #" colKey="number" buildingId={building.id} sort={sort} onToggle={toggleUnitSort} className="w-[4.5rem]" />
                      <UnitSortHead label="Type" colKey="type" buildingId={building.id} sort={sort} onToggle={toggleUnitSort} className="w-28" />
                      <UnitSortHead label="Floor" colKey="floor" buildingId={building.id} sort={sort} onToggle={toggleUnitSort} className="" />
                      <UnitSortHead label="Entrance" colKey="entrance" buildingId={building.id} sort={sort} onToggle={toggleUnitSort} className="w-20" />
                      <UnitSortHead label="Size m²" colKey="sizeSqm" buildingId={building.id} sort={sort} onToggle={toggleUnitSort} className="text-right w-20" />
                      <UnitSortHead label="MEA ⓘ" colKey="coOwnershipShare" buildingId={building.id} sort={sort} onToggle={toggleUnitSort} className="w-28" title="Miteigentumsanteil — Co-ownership share (e.g. 110/1000)" />
                      <UnitSortHead label="Rooms" colKey="rooms" buildingId={building.id} sort={sort} onToggle={toggleUnitSort} className="text-right w-16" />
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleUnits.map((unit) =>
                      editingUnitId === unit.id ? (
                        <UnitEditRow
                          key={unit.id}
                          unit={unit}
                          onSave={(draft) => handleSaveUnit(unit.id, draft)}
                          onCancel={() => setEditingUnitId(null)}
                        />
                      ) : (
                        <TableRow key={unit.id} className="hover:bg-muted/30">
                          <TableCell className="font-mono text-sm">{unit.number}</TableCell>
                          <TableCell>
                            <Badge variant={unitTypeColor[unit.type] || "outline"} className="text-xs">
                              {unit.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{unit.floor}</TableCell>
                          <TableCell className="text-sm">{unit.entrance || "—"}</TableCell>
                          <TableCell className="text-right tabular-nums text-sm">{unit.sizeSqm}</TableCell>
                          <TableCell className="text-sm font-mono">{unit.coOwnershipShare}</TableCell>
                          <TableCell className="text-right text-sm">
                            {unit.rooms !== null ? unit.rooms : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() => setEditingUnitId(unit.id)}
                                title="Edit unit"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() =>
                                  setDeletingUnit({
                                    unitId: unit.id,
                                    buildingId: building.id,
                                    unitNumber: unit.number,
                                  })
                                }
                                title="Delete unit"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ),
                    )}

                    {/* ── Add unit inline row ── */}
                    {addingUnitBuildingId === building.id && (
                      <UnitAddRow
                        onSave={(draft) => handleAddUnit(building.id, draft)}
                        onCancel={() => setAddingUnitBuildingId(null)}
                      />
                    )}
                  </TableBody>
                </Table>
                </div>

                {/* ── Add unit button ── */}
                {addingUnitBuildingId !== building.id && (
                  <div className="px-4 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground text-xs"
                      onClick={() => {
                        setAddingUnitBuildingId(building.id);
                        setUnitTypeFilter((f) => ({ ...f, [building.id]: "all" }));
                      }}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Unit
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Add building ── */}
      {addingBuilding ? (
        <div className="mt-6 border rounded-xl p-5 bg-muted/20">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            New Building
          </h3>
          <BuildingEditForm
            building={{ id: 0, propertyId: id, name: "", street: "", houseNumber: "", zipCode: "", city: "", constructionYear: 0, floors: 0, units: [] }}
            onSave={handleAddBuilding}
            onCancel={() => setAddingBuilding(false)}
          />
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="mt-6"
          onClick={() => setAddingBuilding(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Building
        </Button>
      )}

      {/* ── Delete building confirmation ── */}
      {deletingBuildingId !== null && (() => {
        const b = property.buildings.find((x) => x.id === deletingBuildingId);
        return (
          <Dialog open onOpenChange={() => setDeletingBuildingId(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete &ldquo;{b?.name}&rdquo;?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                This permanently deletes the building and all {b?.units.length ?? 0} unit
                {(b?.units.length ?? 0) !== 1 ? "s" : ""} inside it. This cannot be undone.
              </p>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setDeletingBuildingId(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteBuilding(deletingBuildingId)}
                >
                  Delete Building
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* ── Delete unit confirmation ── */}
      {deletingUnit && (
        <Dialog open onOpenChange={() => setDeletingUnit(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete unit &ldquo;{deletingUnit.unitNumber}&rdquo;?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              This permanently deletes the unit. This cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDeletingUnit(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteUnit}>
                Delete Unit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Delete property confirmation ── */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{property.name}&rdquo;?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This permanently deletes the property, {property.buildings.length} building
            {property.buildings.length !== 1 ? "s" : ""}, and {totalUnits} unit
            {totalUnits !== 1 ? "s" : ""}. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete Property"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Header edit form ────────────────────────────────────────────────────────

function HeaderEditForm({
  property,
  onSave,
  onCancel,
}: {
  property: Property;
  onSave: (draft: Parameters<typeof propertiesApi.update>[1]) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState({
    name: property.name,
    number: property.number,
    managementType: property.managementType,
    propertyManager: property.propertyManager,
    accountant: property.accountant,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6 space-y-4 border rounded-xl p-5 bg-muted/20">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Edit Property
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs text-muted-foreground">Name</label>
          <Input
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Number</label>
          <Input
            value={draft.number}
            onChange={(e) => setDraft((d) => ({ ...d, number: e.target.value }))}
            className="font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Type</label>
          <Select
            value={draft.managementType}
            onValueChange={(v) => setDraft((d) => ({ ...d, managementType: v as ManagementType }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MGMT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Property Manager</label>
          <Input
            value={draft.propertyManager}
            onChange={(e) => setDraft((d) => ({ ...d, propertyManager: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Accountant</label>
          <Input
            value={draft.accountant}
            onChange={(e) => setDraft((d) => ({ ...d, accountant: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ─── Building edit form ──────────────────────────────────────────────────────

function BuildingEditForm({
  building,
  onSave,
  onCancel,
}: {
  building: Building;
  onSave: (draft: Parameters<typeof propertiesApi.updateBuilding>[1]) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState({
    name: building.name,
    street: building.street,
    houseNumber: building.houseNumber,
    zipCode: building.zipCode,
    city: building.city,
    constructionYear: building.constructionYear,
    floors: building.floors,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 space-y-1">
          <label className="text-xs text-muted-foreground">Building Name</label>
          <Input
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            className="h-8 text-sm"
          />
        </div>
        <div className="flex gap-2 md:col-span-2">
          <div className="flex-1 space-y-1">
            <label className="text-xs text-muted-foreground">Street</label>
            <Input
              value={draft.street}
              onChange={(e) => setDraft((d) => ({ ...d, street: e.target.value }))}
              className="h-8 text-sm"
            />
          </div>
          <div className="w-20 space-y-1">
            <label className="text-xs text-muted-foreground">No.</label>
            <Input
              value={draft.houseNumber}
              onChange={(e) => setDraft((d) => ({ ...d, houseNumber: e.target.value }))}
              className="h-8 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2 md:col-span-2">
          <div className="w-24 space-y-1">
            <label className="text-xs text-muted-foreground">ZIP</label>
            <Input
              value={draft.zipCode}
              onChange={(e) => setDraft((d) => ({ ...d, zipCode: e.target.value }))}
              className="h-8 text-sm"
              maxLength={5}
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs text-muted-foreground">City</label>
            <Input
              value={draft.city}
              onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
              className="h-8 text-sm"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Built</label>
          <Input
            type="number"
            value={draft.constructionYear || ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, constructionYear: parseInt(e.target.value) || 0 }))
            }
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Floors</label>
          <Input
            type="number"
            value={draft.floors || ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, floors: parseInt(e.target.value) || 0 }))
            }
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ─── Unit edit row ───────────────────────────────────────────────────────────

function UnitEditRow({
  unit,
  onSave,
  onCancel,
}: {
  unit: Unit;
  onSave: (draft: Parameters<typeof propertiesApi.updateUnit>[1]) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState({
    number: unit.number,
    type: unit.type,
    floor: unit.floor,
    entrance: unit.entrance,
    sizeSqm: unit.sizeSqm,
    coOwnershipShare: unit.coOwnershipShare,
    constructionYear: unit.constructionYear,
    rooms: unit.rooms,
  });
  const [saving, setSaving] = useState(false);

  const isRoomsApplicable = draft.type === "Apartment" || draft.type === "Office";

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <TableRow className="bg-muted/20">
      <TableCell>
        <Input
          value={draft.number}
          onChange={(e) => setDraft((d) => ({ ...d, number: e.target.value }))}
          className="h-7 text-sm w-16 font-mono"
        />
      </TableCell>
      <TableCell>
        <Select
          value={draft.type}
          onValueChange={(v) => setDraft((d) => ({ ...d, type: v as UnitType }))}
        >
          <SelectTrigger className="h-7 text-sm w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UNIT_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="text-sm">
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          value={draft.floor}
          onChange={(e) => setDraft((d) => ({ ...d, floor: e.target.value }))}
          className="h-7 text-sm w-20"
        />
      </TableCell>
      <TableCell>
        <Input
          value={draft.entrance}
          onChange={(e) => setDraft((d) => ({ ...d, entrance: e.target.value }))}
          className="h-7 text-sm w-14"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={draft.sizeSqm}
          onChange={(e) => setDraft((d) => ({ ...d, sizeSqm: parseFloat(e.target.value) || 0 }))}
          className="h-7 text-sm w-20 text-right"
        />
      </TableCell>
      <TableCell>
        <Input
          value={draft.coOwnershipShare}
          onChange={(e) => setDraft((d) => ({ ...d, coOwnershipShare: e.target.value }))}
          className="h-7 text-sm w-24 font-mono"
        />
      </TableCell>
      <TableCell>
        {isRoomsApplicable ? (
          <Input
            type="number"
            value={draft.rooms ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, rooms: e.target.value ? parseInt(e.target.value) : null }))
            }
            className="h-7 text-sm w-14 text-right"
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
            className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
            onClick={handleSave}
            disabled={saving}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            onClick={onCancel}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ─── Unit add row ────────────────────────────────────────────────────────────

function UnitAddRow({
  onSave,
  onCancel,
}: {
  onSave: (draft: Parameters<typeof propertiesApi.createUnit>[1]) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Parameters<typeof propertiesApi.createUnit>[1]>({
    number: "",
    type: "Apartment",
    floor: "",
    entrance: "",
    sizeSqm: 0,
    coOwnershipShare: "",
    constructionYear: new Date().getFullYear(),
    rooms: null,
  });
  const [saving, setSaving] = useState(false);

  const isRoomsApplicable = draft.type === "Apartment" || draft.type === "Office";

  const handleSave = async () => {
    if (!draft.number.trim()) {
      toast.error("Unit number is required");
      return;
    }
    setSaving(true);
    try {
      await onSave(draft);
    } catch {
      toast.error("Failed to add unit");
    } finally {
      setSaving(false);
    }
  };

  return (
    <TableRow className="bg-primary/5 border-t-2 border-primary/20">
      <TableCell>
        <Input
          placeholder="e.g. 01"
          value={draft.number}
          onChange={(e) => setDraft((d) => ({ ...d, number: e.target.value }))}
          className="h-7 text-sm w-16 font-mono"
          autoFocus
        />
      </TableCell>
      <TableCell>
        <Select
          value={draft.type as string}
          onValueChange={(v) => setDraft((d) => ({ ...d, type: v as UnitType, rooms: null }))}
        >
          <SelectTrigger className="h-7 text-sm w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UNIT_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="text-sm">
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          placeholder="1. OG"
          value={draft.floor}
          onChange={(e) => setDraft((d) => ({ ...d, floor: e.target.value }))}
          className="h-7 text-sm w-20"
        />
      </TableCell>
      <TableCell>
        <Input
          placeholder="A"
          value={draft.entrance}
          onChange={(e) => setDraft((d) => ({ ...d, entrance: e.target.value }))}
          className="h-7 text-sm w-14"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          placeholder="0"
          value={draft.sizeSqm || ""}
          onChange={(e) => setDraft((d) => ({ ...d, sizeSqm: parseFloat(e.target.value) || 0 }))}
          className="h-7 text-sm w-20 text-right"
        />
      </TableCell>
      <TableCell>
        <Input
          placeholder="110/1000"
          value={draft.coOwnershipShare}
          onChange={(e) => setDraft((d) => ({ ...d, coOwnershipShare: e.target.value }))}
          className="h-7 text-sm w-24 font-mono"
        />
      </TableCell>
      <TableCell>
        {isRoomsApplicable ? (
          <Input
            type="number"
            placeholder="—"
            value={draft.rooms ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, rooms: e.target.value ? parseInt(e.target.value) : null }))
            }
            className="h-7 text-sm w-14 text-right"
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
            className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
            onClick={handleSave}
            disabled={saving}
            title="Save unit"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            onClick={onCancel}
            title="Cancel"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ─── Unit sortable column header ─────────────────────────────────────────────

function UnitSortHead({
  label,
  colKey,
  buildingId,
  sort,
  onToggle,
  className,
  title,
}: {
  label: string;
  colKey: UnitSortKey;
  buildingId: number;
  sort: UnitSort | undefined;
  onToggle: (buildingId: number, key: UnitSortKey) => void;
  className?: string;
  title?: string;
}) {
  const active = sort?.key === colKey;
  return (
    <TableHead
      className={`cursor-pointer select-none hover:text-foreground ${className ?? ""}`}
      title={title}
      onClick={() => onToggle(buildingId, colKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          sort!.dir === "asc" ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-40" />
        )}
      </span>
    </TableHead>
  );
}
