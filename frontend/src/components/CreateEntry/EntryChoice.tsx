"use client";

import Link from "next/link";
import { ArrowLeft, FileText, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePropertyWizard } from "@/hooks/usePropertyWizard";

export function EntryChoice() {
  const resetWizard = usePropertyWizard((s) => s.resetWizard);

  const handleManual = () => {
    resetWizard();
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Create New Property</h1>
        <p className="text-muted-foreground mt-1">How would you like to start?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/properties/new/upload" className="block">
          <Card className="h-full cursor-pointer hover:border-primary/60 hover:shadow-md transition-all group">
            <CardContent className="p-8 flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <FileText className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-1">Upload Document</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Upload your Teilungserklärung and let AI extract the property,
                  building, and unit details automatically.
                </p>
              </div>
              <div className="mt-auto pt-2">
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                  Recommended for faster data entry
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/properties/new/wizard" onClick={handleManual} className="block">
          <Card className="h-full cursor-pointer hover:border-primary/60 hover:shadow-md transition-all group">
            <CardContent className="p-8 flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                <PenLine className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-1">Enter Manually</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Fill in property details step by step. Ideal for properties
                  without a digital document.
                </p>
              </div>
              <div className="mt-auto pt-2">
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                  For properties without a digital document
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
