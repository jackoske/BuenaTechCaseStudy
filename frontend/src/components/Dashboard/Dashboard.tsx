"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Building2, RefreshCw, Search, Trash2, CheckSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import type { PropertySummary } from "@/types/property";
import { toast } from "sonner";

export function Dashboard() {
  const router = useRouter();
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Selection / bulk delete
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const filtered = search.trim()
    ? properties.filter((p) => {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.number.toLowerCase().includes(q) ||
          p.propertyManager.toLowerCase().includes(q)
        );
      })
    : properties;

  // Keep indeterminate state on the select-all checkbox
  useEffect(() => {
    if (!selectAllRef.current) return;
    const n = filtered.filter((p) => selected.has(p.id)).length;
    selectAllRef.current.indeterminate = n > 0 && n < filtered.length;
  }, [selected, filtered]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await propertiesApi.list();
      setProperties(data);
    } catch {
      toast.error("Failed to load properties. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const toggleSelectMode = () => {
    if (selectMode) exitSelectMode();
    else setSelectMode(true);
  };

  const toggleRow = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const allIds = filtered.map((p) => p.id);
    const allSelected = allIds.every((id) => selected.has(id));
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        allIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => new Set([...prev, ...allIds]));
    }
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      await Promise.all([...selected].map((id) => propertiesApi.delete(id)));
      toast.success(`Deleted ${selected.size} propert${selected.size === 1 ? "y" : "ies"}`);
      setShowDeleteConfirm(false);
      exitSelectMode();
      await load();
    } catch {
      toast.error("Some deletions failed — please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const selectedCount = selected.size;
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Properties</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {loading
              ? "Loading…"
              : search.trim()
                ? `${filtered.length} of ${properties.length} propert${properties.length === 1 ? "y" : "ies"}`
                : `${properties.length} propert${properties.length === 1 ? "y" : "ies"}`}
          </p>
        </div>
        <div className="flex gap-2">
          {!selectMode ? (
            <>
              <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              {properties.length > 0 && (
                <Button variant="outline" size="sm" onClick={toggleSelectMode}>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Select
                </Button>
              )}
              <Link href="/properties/new">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New
                </Button>
              </Link>
            </>
          ) : (
            <>
              <span className="text-sm text-muted-foreground self-center mr-1">
                {selectedCount} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                disabled={selectedCount === 0}
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button variant="outline" size="sm" onClick={exitSelectMode}>
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      {!loading && properties.length > 0 && (
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name, number, or manager…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-muted-foreground">
          <RefreshCw className="h-8 w-8 mx-auto mb-3 animate-spin opacity-40" />
          Loading properties…
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <h3 className="font-medium text-lg mb-2">No properties yet</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Create your first property to get started.
          </p>
          <Link href="/properties/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Property
            </Button>
          </Link>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                {selectMode && (
                  <TableHead className="w-10">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded accent-primary cursor-pointer"
                      title="Select all"
                    />
                  </TableHead>
                )}
                <TableHead className="font-medium">Name</TableHead>
                <TableHead className="font-medium">Type</TableHead>
                <TableHead className="font-medium">Number</TableHead>
                <TableHead className="font-medium">Manager / Accountant</TableHead>
                <TableHead className="font-medium text-right">Buildings</TableHead>
                <TableHead className="font-medium text-right">Units</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={selectMode ? 7 : 6}
                    className="text-center py-8 text-muted-foreground text-sm"
                  >
                    No properties match &ldquo;{search}&rdquo;
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((p) => {
                const isSelected = selected.has(p.id);
                return (
                  <TableRow
                    key={p.id}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-destructive/10 hover:bg-destructive/15"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() =>
                      selectMode ? toggleRow(p.id) : router.push(`/properties/${p.id}`)
                    }
                  >
                    {selectMode && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(p.id)}
                          className="h-4 w-4 rounded accent-primary cursor-pointer"
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant={p.managementType === "WEG" ? "default" : "secondary"}>
                        {p.managementType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {p.number}
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.propertyManager && (
                        <span className="block text-foreground" title={p.propertyManager}>
                          {p.propertyManager}
                        </span>
                      )}
                      {p.accountant && (
                        <span className="block text-muted-foreground text-xs mt-0.5" title={p.accountant}>
                          {p.accountant}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{p.buildingCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.unitCount}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Bulk delete confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {selectedCount} propert{selectedCount === 1 ? "y" : "ies"}?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This permanently deletes the selected propert{selectedCount === 1 ? "y" : "ies"} along with all their buildings and units. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={deleting}>
              {deleting ? "Deleting…" : `Delete ${selectedCount}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
