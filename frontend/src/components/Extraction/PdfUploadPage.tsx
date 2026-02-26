"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { extractionApi } from "@/lib/api";
import { usePropertyWizard } from "@/hooks/usePropertyWizard";
import type { ExtractionData, DuplicateMatch } from "@/types/property";
import { toast } from "sonner";
import { DuplicateComparison } from "./DuplicateComparison";

type Step = { label: string; status: "pending" | "active" | "done" | "error" };

const PIPELINE_STEPS = [
  "Reading PDF text",
  "Parsing property information",
  "Mapping buildings and units",
  "Checking for duplicates",
];

export function PdfUploadPage() {
  const router = useRouter();
  const { prefillFromExtraction, setStep } = usePropertyWizard();

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [steps, setSteps] = useState<Step[]>(
    PIPELINE_STEPS.map((label) => ({ label, status: "pending" })),
  );
  const [progress, setProgress] = useState(0);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateStep = (idx: number, status: Step["status"]) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, status } : s)),
    );
    setProgress(((idx + 1) / PIPELINE_STEPS.length) * 100);
  };

  const handleFile = (f: File) => {
    if (f.type !== "application/pdf") {
      toast.error("Please upload a PDF file.");
      return;
    }
    setFile(f);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [],
  );

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    // Animate the steps
    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      updateStep(i, "active");
      await new Promise((r) => setTimeout(r, 400 + i * 300));
    }

    try {
      const result = await extractionApi.upload(file);

      // Mark all steps done
      setSteps(PIPELINE_STEPS.map((label) => ({ label, status: "done" })));
      setProgress(100);

      if (result.error || !result.extraction) {
        setError(result.error || "Extraction failed. Please enter details manually.");
        setUploading(false);
        return;
      }

      setExtractedData(result.extraction);

      if (result.duplicates && result.duplicates.length > 0) {
        setDuplicates(result.duplicates);
        setUploading(false);
        return;
      }

      // Go straight to wizard
      prefillFromExtraction(result.extraction);
      setStep(1);
      toast.success(`Extracted ${result.extraction.units?.length || 0} units via ${result.extractionMethod}`);
      router.push("/properties/new/wizard");
    } catch (err) {
      const last = steps.findIndex((s) => s.status === "active");
      if (last >= 0) updateStep(last, "error");
      setError("Upload failed. Please try again.");
      setUploading(false);
      console.error(err);
    }
  };

  const handleContinueAnyway = () => {
    if (extractedData) {
      prefillFromExtraction(extractedData);
      setStep(1);
      router.push("/properties/new/wizard");
    }
  };

  const handleManualEntry = () => {
    usePropertyWizard.getState().resetWizard();
    router.push("/properties/new/wizard");
  };

  if (duplicates.length > 0 && extractedData) {
    return (
      <DuplicateComparison
        duplicates={duplicates}
        extracted={extractedData}
        onContinue={handleContinueAnyway}
        onCancel={() => router.push("/")}
      />
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/properties/new">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Upload Teilungserklärung</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          AI will extract property, building, and unit data from your PDF.
        </p>
      </div>

      {!uploading ? (
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
              dragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("pdf-input")?.click()}
          >
            <input
              id="pdf-input"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {file ? (
              <div className="flex flex-col items-center gap-3">
                <FileText className="h-12 w-12 text-primary" />
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(1)} MB — click to change
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="h-12 w-12 text-muted-foreground/40" />
                <p className="font-medium">Drag & drop your PDF here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
                <p className="text-xs text-muted-foreground/60">Supported: .pdf — max 20MB</p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm">
              {error}
              <Button
                variant="link"
                className="text-destructive p-0 h-auto ml-2"
                onClick={handleManualEntry}
              >
                Enter manually instead
              </Button>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleUpload}
              disabled={!file}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Extract Data
            </Button>
            <Button variant="outline" onClick={handleManualEntry}>
              Skip — Enter Manually
            </Button>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8">
            <h2 className="font-medium mb-6 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Extracting property data…
            </h2>

            <Progress value={progress} className="mb-6 h-2" />

            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  {step.status === "done" && (
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  )}
                  {step.status === "active" && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                  )}
                  {step.status === "error" && (
                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  )}
                  {step.status === "pending" && (
                    <div className="h-4 w-4 rounded-full border-2 border-muted shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      step.status === "done"
                        ? "text-green-600 dark:text-green-400"
                        : step.status === "active"
                          ? "text-primary font-medium"
                          : step.status === "error"
                            ? "text-destructive"
                            : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {error && (
              <div className="mt-6 bg-destructive/10 text-destructive rounded-lg p-4 text-sm">
                {error}
                <Button
                  variant="link"
                  className="text-destructive p-0 h-auto ml-2"
                  onClick={handleManualEntry}
                >
                  Enter manually instead
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
