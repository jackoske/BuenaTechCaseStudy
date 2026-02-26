"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WizardStepper } from "./WizardStepper";
import { Step1GeneralInfo } from "./Step1GeneralInfo";
import { Step2Buildings } from "./Step2Buildings";
import { Step3Units } from "./Step3Units";
import { usePropertyWizard } from "@/hooks/usePropertyWizard";
import { propertiesApi } from "@/lib/api";
import { toast } from "sonner";
import type { PropertyFormData, BuildingFormData } from "@/types/property";

export function PropertyWizard() {
  const router = useRouter();
  const { step, formData, nextStep, prevStep, resetWizard } = usePropertyWizard();
  const [submitting, setSubmitting] = useState(false);

  const buildingSummary = `${formData.buildings.length} building${formData.buildings.length !== 1 ? "s" : ""}`;
  const totalUnits = formData.buildings.reduce((s, b) => s + b.units.length, 0);
  const unitSummary = `${totalUnits} unit${totalUnits !== 1 ? "s" : ""}`;

  const wizardSteps = [
    { label: "General Info", summary: step > 1 ? "✓" : undefined },
    { label: "Buildings", summary: step > 2 ? buildingSummary : undefined },
    { label: "Units", summary: step === 3 ? unitSummary : undefined },
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Transform form data to API payload
      const payload: PropertyFormData = {
        name: formData.name,
        number: formData.number,
        managementType: formData.managementType,
        propertyManager: formData.propertyManager,
        accountant: formData.accountant,
        buildings: formData.buildings.map(
          (b): BuildingFormData => ({
            name: b.name,
            street: b.street,
            houseNumber: b.houseNumber,
            zipCode: b.zipCode,
            city: b.city,
            constructionYear: Number(b.constructionYear) || 0,
            floors: Number(b.floors) || 0,
            units: b.units.map((u) => ({
              number: u.number,
              type: u.type,
              floor: u.floor,
              entrance: u.entrance,
              sizeSqm: Number(u.sizeSqm) || 0,
              coOwnershipShare: u.coOwnershipShare,
              constructionYear: Number(u.constructionYear) || 0,
              rooms: u.rooms !== null && u.rooms !== "" ? Number(u.rooms) : null,
            })),
          }),
        ),
      };

      const created = await propertiesApi.create(payload);
      resetWizard();
      toast.success(`Property "${created.name}" created successfully!`);
      router.push(`/properties/${created.id}`);
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
          ? String((err.response.data as { message: unknown }).message)
          : "Failed to create property. Please try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/properties/new">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-6">Create New Property</h1>
        <WizardStepper currentStep={step} steps={wizardSteps} />
      </div>

      <div className="border rounded-xl p-8">
        {step === 1 && (
          <Step1GeneralInfo
            onNext={nextStep}
            onCancel={() => router.push("/")}
          />
        )}
        {step === 2 && (
          <Step2Buildings
            onNext={nextStep}
            onBack={prevStep}
          />
        )}
        {step === 3 && (
          <Step3Units
            onBack={prevStep}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  );
}
