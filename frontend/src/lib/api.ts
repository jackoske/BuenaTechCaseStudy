import axios from "axios";
import type { Property, PropertyFormData, PropertySummary, ExtractionResponse } from "@/types/property";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  headers: { "Content-Type": "application/json" },
});

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

  delete: async (id: number): Promise<void> => {
    await api.delete(`/properties/${id}`);
  },
};

export const extractionApi = {
  upload: async (file: File): Promise<ExtractionResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<ExtractionResponse>("/extraction/upload", formData, {
      headers: { "Content-Type": undefined },
    });
    return res.data;
  },
};

export default api;
