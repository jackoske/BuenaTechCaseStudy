"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  PropertyFormData,
  BuildingFormData,
  UnitFormData,
  FieldConfidenceMap,
  ExtractionData,
  ManagementType,
  UnitType,
} from "@/types/property";

export type WizardStep = 1 | 2 | 3;

const emptyUnit = (): UnitFormData => ({
  number: "",
  type: "Apartment",
  floor: "",
  entrance: "",
  sizeSqm: "",
  coOwnershipShare: "",
  constructionYear: "",
  rooms: "",
});

const emptyBuilding = (): BuildingFormData => ({
  name: "",
  street: "",
  houseNumber: "",
  zipCode: "",
  city: "",
  constructionYear: "",
  floors: "",
  units: [emptyUnit()],
});

const emptyProperty = (): PropertyFormData => ({
  name: "",
  number: "",
  managementType: "WEG",
  propertyManager: "",
  accountant: "",
  buildings: [emptyBuilding()],
});

interface WizardState {
  step: WizardStep;
  formData: PropertyFormData;
  fieldConfidence: FieldConfidenceMap | null;
  extractionMethod: string | null;

  // Actions
  setStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetWizard: () => void;

  // Property fields
  setPropertyField: <K extends keyof Omit<PropertyFormData, "buildings">>(
    field: K,
    value: PropertyFormData[K],
  ) => void;

  // Building actions
  addBuilding: () => void;
  removeBuilding: (idx: number) => void;
  updateBuilding: <K extends keyof Omit<BuildingFormData, "units">>(
    buildingIdx: number,
    field: K,
    value: BuildingFormData[K],
  ) => void;

  // Unit actions
  addUnit: (buildingIdx: number) => void;
  removeUnit: (buildingIdx: number, unitIdx: number) => void;
  updateUnit: <K extends keyof UnitFormData>(
    buildingIdx: number,
    unitIdx: number,
    field: K,
    value: UnitFormData[K],
  ) => void;
  cloneUnit: (buildingIdx: number, unitIdx: number) => void;
  bulkAddUnits: (buildingIdx: number, units: UnitFormData[]) => void;

  // Pre-fill from extraction
  prefillFromExtraction: (data: ExtractionData) => void;
}

export const usePropertyWizard = create<WizardState>()(
  persist(
    (set, get) => ({
      step: 1,
      formData: emptyProperty(),
      fieldConfidence: null,
      extractionMethod: null,

      setStep: (step) => set({ step }),
      nextStep: () => set((s) => ({ step: Math.min(s.step + 1, 3) as WizardStep })),
      prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 1) as WizardStep })),
      resetWizard: () =>
        set({
          step: 1,
          formData: emptyProperty(),
          fieldConfidence: null,
          extractionMethod: null,
        }),

      setPropertyField: (field, value) =>
        set((s) => ({
          formData: { ...s.formData, [field]: value },
        })),

      addBuilding: () =>
        set((s) => ({
          formData: {
            ...s.formData,
            buildings: [...s.formData.buildings, emptyBuilding()],
          },
        })),

      removeBuilding: (idx) =>
        set((s) => ({
          formData: {
            ...s.formData,
            buildings: s.formData.buildings.filter((_, i) => i !== idx),
          },
        })),

      updateBuilding: (buildingIdx, field, value) =>
        set((s) => ({
          formData: {
            ...s.formData,
            buildings: s.formData.buildings.map((b, i) =>
              i === buildingIdx ? { ...b, [field]: value } : b,
            ),
          },
        })),

      addUnit: (buildingIdx) =>
        set((s) => ({
          formData: {
            ...s.formData,
            buildings: s.formData.buildings.map((b, i) =>
              i === buildingIdx
                ? { ...b, units: [...b.units, emptyUnit()] }
                : b,
            ),
          },
        })),

      removeUnit: (buildingIdx, unitIdx) =>
        set((s) => ({
          formData: {
            ...s.formData,
            buildings: s.formData.buildings.map((b, i) =>
              i === buildingIdx
                ? { ...b, units: b.units.filter((_, j) => j !== unitIdx) }
                : b,
            ),
          },
        })),

      updateUnit: (buildingIdx, unitIdx, field, value) =>
        set((s) => ({
          formData: {
            ...s.formData,
            buildings: s.formData.buildings.map((b, i) =>
              i === buildingIdx
                ? {
                    ...b,
                    units: b.units.map((u, j) =>
                      j === unitIdx ? { ...u, [field]: value } : u,
                    ),
                  }
                : b,
            ),
          },
        })),

      cloneUnit: (buildingIdx, unitIdx) => {
        const buildings = get().formData.buildings;
        const unit = buildings[buildingIdx]?.units[unitIdx];
        if (!unit) return;

        const nextNum = String(
          parseInt(unit.number || "0") + 1,
        ).padStart(unit.number.length, "0");

        set((s) => ({
          formData: {
            ...s.formData,
            buildings: s.formData.buildings.map((b, i) =>
              i === buildingIdx
                ? {
                    ...b,
                    units: [
                      ...b.units.slice(0, unitIdx + 1),
                      { ...unit, number: nextNum },
                      ...b.units.slice(unitIdx + 1),
                    ],
                  }
                : b,
            ),
          },
        }));
      },

      bulkAddUnits: (buildingIdx, units) =>
        set((s) => ({
          formData: {
            ...s.formData,
            buildings: s.formData.buildings.map((b, i) =>
              i === buildingIdx
                ? { ...b, units: [...b.units, ...units] }
                : b,
            ),
          },
        })),

      prefillFromExtraction: (data) => {
        // Assign extracted units to buildings by index
        const buildings: BuildingFormData[] = (data.buildings || []).map((b, bi) => {
          const buildingUnits = (data.units || []).filter((_, ui) => {
            // Distribute units across buildings proportionally
            const buildingsCount = data.buildings.length || 1;
            const unitBuilding = Math.floor((ui / (data.units.length || 1)) * buildingsCount);
            return unitBuilding === bi;
          });

          return {
            name: b.name || "",
            street: b.street || "",
            houseNumber: b.houseNumber || "",
            zipCode: b.zipCode || "",
            city: b.city || "",
            constructionYear: b.constructionYear || "",
            floors: b.floors || "",
            units:
              buildingUnits.length > 0
                ? buildingUnits.map((u) => ({
                    number: u.number || "",
                    type: (u.type as UnitType) || "Apartment",
                    floor: u.floor || "",
                    entrance: u.entrance || "",
                    sizeSqm: u.sizeSqm || "",
                    coOwnershipShare: u.coOwnershipShare || "",
                    constructionYear: u.constructionYear || "",
                    rooms: u.rooms ?? null,
                  }))
                : [emptyUnit()],
          };
        });

        if (buildings.length === 0) {
          buildings.push(emptyBuilding());
        }

        set({
          formData: {
            name: data.property?.name || "",
            number: data.property?.number || "",
            managementType: (data.property?.managementType as ManagementType) || "WEG",
            propertyManager: data.property?.propertyManager || "",
            accountant: data.property?.accountant || "",
            buildings,
          },
          fieldConfidence: data.fieldConfidence || null,
        });
      },
    }),
    {
      name: "property-wizard",
      partialize: (state) => ({
        step: state.step,
        formData: state.formData,
        fieldConfidence: state.fieldConfidence,
        extractionMethod: state.extractionMethod,
      }),
    },
  ),
);

export { emptyUnit, emptyBuilding };
