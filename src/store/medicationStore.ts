import { create } from 'zustand';
import { Medication, MedicationRecord } from '../types';
import {
  getAllMedications,
  createMedication,
  updateMedication as dbUpdateMedication,
  deleteMedication as dbDeleteMedication,
  getActiveMedications,
  getRecordsByDateRange,
  createMedicationRecord,
  updateMedicationRecord,
} from '../db/database';

interface MedicationState {
  medications: Medication[];
  records: MedicationRecord[];
  loading: boolean;
  error: string | null;

  fetchMedications: () => Promise<void>;
  fetchActiveMedications: () => Promise<void>;
  addMedication: (
    medication: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateMedication: (
    id: string,
    updates: Partial<Omit<Medication, 'id' | 'createdAt'>>
  ) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  // 戻り値を MedicationRecord[] にすることで呼び出し元が直接使え、
  // records の上書き競合（レースコンディション）を防ぐ
  fetchRecordsByDateRange: (
    startTime: string,
    endTime: string
  ) => Promise<MedicationRecord[]>;
  addRecord: (
    record: Omit<MedicationRecord, 'id' | 'createdAt'>
  ) => Promise<void>;
  editRecord: (
    id: string,
    updates: Partial<
      Omit<MedicationRecord, 'id' | 'medicationId' | 'createdAt'>
    >
  ) => Promise<void>;
}

export const useMedicationStore = create<MedicationState>((set, get) => ({
  medications: [],
  records: [],
  loading: false,
  error: null,

  fetchMedications: async () => {
    set({ loading: true, error: null });
    try {
      const medications = await getAllMedications();
      set({ medications, loading: false });
    } catch (error) {
      set({ error: '薬剤の取得に失敗しました', loading: false });
      console.error('Failed to fetch medications:', error);
    }
  },

  fetchActiveMedications: async () => {
    set({ loading: true, error: null });
    try {
      const medications = await getActiveMedications();
      set({ medications, loading: false });
    } catch (error) {
      set({ error: '服用中の薬剤の取得に失敗しました', loading: false });
      console.error('Failed to fetch active medications:', error);
    }
  },

  addMedication: async (medication) => {
    set({ loading: true, error: null });
    try {
      await createMedication(medication);
      const medications = await getAllMedications();
      set({ medications, loading: false });
    } catch (error) {
      set({ error: '薬剤の追加に失敗しました', loading: false });
      console.error('Failed to add medication:', error);
    }
  },

  updateMedication: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      await dbUpdateMedication(id, updates);
      const medications = await getAllMedications();
      set({ medications, loading: false });
    } catch (error) {
      set({ error: '薬剤の更新に失敗しました', loading: false });
      console.error('Failed to update medication:', error);
    }
  },

  deleteMedication: async (id) => {
    set({ loading: true, error: null });
    try {
      await dbDeleteMedication(id); // 関連する服用記録も削除される
      const medications = await getAllMedications();
      set({ medications, loading: false });
    } catch (error) {
      set({ error: '薬剤の削除に失敗しました', loading: false });
      console.error('Failed to delete medication:', error);
    }
  },

  fetchRecordsByDateRange: async (startTime, endTime) => {
    set({ loading: true, error: null });
    try {
      const records = await getRecordsByDateRange(startTime, endTime);
      set({ records, loading: false });
      // 戻り値として返すことで呼び出し元が getState() を使わずに済む
      return records;
    } catch (error) {
      set({ error: '服用記録の取得に失敗しました', loading: false });
      console.error('Failed to fetch records:', error);
      return [];
    }
  },

  addRecord: async (record) => {
    set({ loading: true, error: null });
    try {
      await createMedicationRecord(record);
      const datePrefix = record.scheduledTime.slice(0, 10);
      await get().fetchRecordsByDateRange(
        `${datePrefix}T00:00:00`,
        `${datePrefix}T23:59:59`
      );
    } catch (error) {
      set({ error: '服用記録の追加に失敗しました', loading: false });
      console.error('Failed to add record:', error);
    }
  },

  editRecord: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      await updateMedicationRecord(id, updates);
      const currentRecords = get().records;
      if (currentRecords.length > 0) {
        const dates = currentRecords.map((r) => r.scheduledTime).sort();
        await get().fetchRecordsByDateRange(dates[0], dates[dates.length - 1]);
      }
    } catch (error) {
      set({ error: '服用記録の更新に失敗しました', loading: false });
      console.error('Failed to edit record:', error);
    }
  },
}));
