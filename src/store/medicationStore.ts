import { create } from "zustand";
import { Medication } from "../types";
import {
  getAllMedications,
  createMedication,
  updateMedication as dbUpdateMedication,
  deleteMedication as dbDeleteMedication,
  getActiveMedications,
} from "../db/database";

interface MedicationState {
  medications: Medication[];
  loading: boolean;
  error: string | null;

  fetchMedications: () => Promise<void>;
  fetchActiveMedications: () => Promise<void>;
  addMedication: (
    medication: Omit<Medication, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  updateMedication: (
    id: string,
    updates: Partial<Omit<Medication, "id" | "createdAt">>,
  ) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
}

export const useMedicationStore = create<MedicationState>((set) => ({
  medications: [],
  loading: false,
  error: null,

  fetchMedications: async () => {
    set({ loading: true, error: null });
    try {
      const medications = await getAllMedications();
      set({ medications, loading: false });
    } catch (error) {
      set({
        error: "薬剤の取得に失敗しました",
        loading: false,
      });
      console.error("Failed to fetch medications:", error);
    }
  },

  fetchActiveMedications: async () => {
    set({ loading: true, error: null });
    try {
      const medications = await getActiveMedications();
      set({ medications, loading: false });
    } catch (error) {
      set({
        error: "服用中の薬剤の取得に失敗しました",
        loading: false,
      });
      console.error("Failed to fetch active medications:", error);
    }
  },

  addMedication: async (medication) => {
    set({ loading: true, error: null });
    try {
      await createMedication(medication);
      const medications = await getAllMedications();
      set({ medications, loading: false });
    } catch (error) {
      set({
        error: "薬剤の追加に失敗しました",
        loading: false,
      });
      console.error("Failed to add medication:", error);
    }
  },

  updateMedication: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      await dbUpdateMedication(id, updates);
      const medications = await getAllMedications();
      set({ medications, loading: false });
    } catch (error) {
      set({
        error: "薬剤の更新に失敗しました",
        loading: false,
      });
      console.error("Failed to update medication:", error);
    }
  },

  deleteMedication: async (id) => {
    set({ loading: true, error: null });
    try {
      await dbDeleteMedication(id); // 関連する服用記録も削除される
      const medications = await getAllMedications();
      set({ medications, loading: false });
    } catch (error) {
      set({
        error: "薬剤の削除に失敗しました",
        loading: false,
      });
      console.error("Failed to delete medication:", error);
    }
  },
}));
