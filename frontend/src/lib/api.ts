import axios from "axios";
import type { Property, Building, Unit, PropertyFormData, PropertySummary, ExtractionResponse } from "@/types/property";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  headers: { "Content-Type": "application/json" },
});

type PropertyPatch = Partial<Pick<Property, "name" | "number" | "managementType" | "propertyManager" | "accountant">>;
type BuildingPatch = Partial<Omit<Building, "id" | "propertyId" | "units">>;
type UnitPatch = Partial<Omit<Unit, "id" | "buildingId">>;
type UnitCreate = Omit<Unit, "id">;

export const propertiesApi = {
  list: async (): Promise<PropertySummary[]> => {
    const res = await api.get<PropertySummary[]>("/properties");
    return res.data;
  },

  get: async (id: number): Promise<Property> => {
    const res = await api.get<Property>(`/properties/${id}`);
    return res.data;
  },

  create: async (data: PropertyFormData): Promise<Property> => {
    const res = await api.post<Property>("/properties", data);
    return res.data;
  },

  update: async (id: number, data: PropertyPatch): Promise<PropertyPatch & { id: number }> => {
    const res = await api.patch(`/properties/${id}`, data);
    return res.data;
  },

  createBuilding: async (propertyId: number, data: BuildingPatch): Promise<Building> => {
    const res = await api.post<Building>("/buildings", { ...data, propertyId });
    return res.data;
  },

  updateBuilding: async (id: number, data: BuildingPatch): Promise<BuildingPatch & { id: number }> => {
    const res = await api.patch(`/buildings/${id}`, data);
    return res.data;
  },

  deleteBuilding: async (id: number): Promise<void> => {
    await api.delete(`/buildings/${id}`);
  },

  createUnit: async (buildingId: number, data: Omit<UnitCreate, "buildingId">): Promise<Unit> => {
    const res = await api.post<Unit>("/units", { ...data, buildingId });
    return res.data;
  },

  updateUnit: async (id: number, data: UnitPatch): Promise<Unit> => {
    const res = await api.patch(`/units/${id}`, data);
    return res.data;
  },

  deleteUnit: async (id: number): Promise<void> => {
    await api.delete(`/units/${id}`);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/properties/${id}`);
  },
};

export const extractionApi = {
  upload: async (file: File, method = "auto"): Promise<ExtractionResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("method", method);
    const res = await api.post<ExtractionResponse>("/extraction/upload", formData, {
      headers: { "Content-Type": undefined },
    });
    return res.data;
  },
};

export default api;
