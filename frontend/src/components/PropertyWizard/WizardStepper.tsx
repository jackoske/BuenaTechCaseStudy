import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WizardStep } from "@/hooks/usePropertyWizard";

interface Props {
  currentStep: WizardStep;
  steps: { label: string; summary?: string }[];
}

export function WizardStepper({ currentStep, steps }: Props) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((step, i) => {
        const stepNum = (i + 1) as WizardStep;
        const isComplete = currentStep > stepNum;
        const isActive = currentStep === stepNum;

        return (
          <div key={i} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  isComplete
                    ? "bg-primary text-primary-foreground"
                    : isActive
                      ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {isComplete ? <Check className="h-4 w-4" /> : stepNum}
              </div>
              <div className="flex flex-col">
                <span
                  className={cn(
                    "text-sm font-medium",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
                {step.summary && (
                  <span className="text-xs text-muted-foreground">{step.summary}</span>
                )}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "h-px w-12 mx-4",
                  currentStep > stepNum ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
