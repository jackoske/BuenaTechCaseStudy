"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { propertiesApi } from "@/lib/api";
import type { Property } from "@/types/property";
import { toast } from "sonner";

const unitTypeColor: Record<string, string> = {
  Apartment: "default",
  Office: "secondary",
  Garden: "outline",
  Parking: "outline",
};

interface Props {
  id: number;
}

export function PropertyDetail({ id }: Props) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    propertiesApi
      .get(id)
      .then(setProperty)
      .catch(() => toast.error("Failed to load property"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">Loading…</div>
    );
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
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{property.name}</h1>
          <Badge variant={property.managementType === "WEG" ? "default" : "secondary"}>
            {property.managementType}
          </Badge>
        </div>
        <p className="text-muted-foreground font-mono text-sm mt-1">#{property.number}</p>
      </div>

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
              <p className="font-medium text-sm">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        {property.buildings.map((building) => (
          <Card key={building.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {building.name}
                <span className="text-sm font-normal text-muted-foreground">
                  {building.street} {building.houseNumber}, {building.zipCode} {building.city}
                </span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {building.units.length} units
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead>Entrance</TableHead>
                    <TableHead className="text-right">Size m²</TableHead>
                    <TableHead>MEA</TableHead>
                    <TableHead className="text-right">Rooms</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {building.units.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-mono text-sm">{unit.number}</TableCell>
                      <TableCell>
                        <Badge
                          variant={(unitTypeColor[unit.type] as "default" | "secondary" | "outline") || "outline"}
                          className="text-xs"
                        >
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex gap-2">
        <Link href="/properties/new">
          <Button variant="outline">
            <Home className="h-4 w-4 mr-2" />
            Create Another
          </Button>
        </Link>
      </div>
    </div>
  );
}
