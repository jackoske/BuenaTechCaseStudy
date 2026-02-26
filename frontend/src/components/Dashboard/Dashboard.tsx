"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Building2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Properties</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {loading ? "Loading…" : `${properties.length} propert${properties.length === 1 ? "y" : "ies"}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/properties/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create New
            </Button>
          </Link>
        </div>
      </div>

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
                <TableHead className="font-medium">Name</TableHead>
                <TableHead className="font-medium">Type</TableHead>
                <TableHead className="font-medium">Number</TableHead>
                <TableHead className="font-medium">Manager / Accountant</TableHead>
                <TableHead className="font-medium text-right">Buildings</TableHead>
                <TableHead className="font-medium text-right">Units</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => window.location.href = `/properties/${p.id}`}
                >
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
