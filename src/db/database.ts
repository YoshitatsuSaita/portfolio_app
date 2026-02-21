import Dexie, { Table } from 'dexie';
import {
  Medication,
  MedicationRecord,
  WeatherData,
  WeatherSettings,
} from '../types';

type SettingValue =
  | WeatherSettings
  | Record<string, unknown>
  | boolean
  | string
  | number;

export class MedicationDB extends Dexie {
  medications!: Table<Medication>;
  medicationRecords!: Table<MedicationRecord>;
  weatherData!: Table<WeatherData>;
  settings!: Table<{ key: string; value: SettingValue }>;

  constructor() {
    super('MedicationDB');

    this.version(1).stores({
      medications: 'id, name, startDate',
      medicationRecords:
        'id, medicationId, scheduledTime, [medicationId+scheduledTime]',
      // timestampでソートして最新データを取得するため
      weatherData: 'id, timestamp',
      // キーバリュー形式で各種設定を保存（例: key="weatherSettings", value={...}）
      settings: 'key',
    });
  }
}

export const db = new MedicationDB();

export const createMedication = async (
  medication: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.medications.add({
    ...medication,
    id,
    createdAt: now,
    updatedAt: now,
  });

  return id;
};

export const getAllMedications = async (): Promise<Medication[]> => {
  return await db.medications.toArray();
};

export const getMedicationById = async (
  id: string
): Promise<Medication | undefined> => {
  return await db.medications.get(id);
};

export const updateMedication = async (
  id: string,
  updates: Partial<Omit<Medication, 'id' | 'createdAt'>>
): Promise<number> => {
  const now = new Date().toISOString();

  return await db.medications.update(id, {
    ...updates,
    updatedAt: now,
  });
};

export const deleteMedication = async (id: string): Promise<void> => {
  await db.transaction('rw', db.medications, db.medicationRecords, async () => {
    await db.medications.delete(id);
    await db.medicationRecords.where('medicationId').equals(id).delete();
  });
};

export const getActiveMedications = async (): Promise<Medication[]> => {
  const now = new Date().toISOString();

  return await db.medications
    .filter((med) => med.endDate === null || med.endDate > now)
    .toArray();
};

export const createMedicationRecord = async (
  record: Omit<MedicationRecord, 'id' | 'createdAt'>
): Promise<string> => {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.medicationRecords.add({
    ...record,
    id,
    createdAt: now,
  });

  return id;
};

export const getRecordsByMedicationId = async (
  medicationId: string
): Promise<MedicationRecord[]> => {
  return await db.medicationRecords
    .where('medicationId')
    .equals(medicationId)
    .toArray();
};

export const getRecordsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<MedicationRecord[]> => {
  return await db.medicationRecords
    .where('scheduledTime')
    .between(startDate, endDate, true, true)
    .toArray();
};

export const updateMedicationRecord = async (
  id: string,
  updates: Partial<Omit<MedicationRecord, 'id' | 'medicationId' | 'createdAt'>>
): Promise<number> => {
  return await db.medicationRecords.update(id, updates);
};

export const markAsCompleted = async (id: string): Promise<number> => {
  const now = new Date().toISOString();

  return await db.medicationRecords.update(id, {
    completed: true,
    actualTime: now,
  });
};

export const saveWeatherData = async (
  weatherData: WeatherData
): Promise<string> => {
  // IDはweatherData内に既に含まれているため、そのまま保存
  await db.weatherData.add(weatherData);

  return weatherData.id;
};

export const getLatestWeatherData = async (): Promise<
  WeatherData | undefined
> => {
  const results = await db.weatherData
    .orderBy('timestamp')
    .reverse()
    .limit(1)
    .toArray();

  return results[0];
};

export const getWeatherDataByDateRange = async (
  startDate: string,
  endDate: string
): Promise<WeatherData[]> => {
  return await db.weatherData
    .where('timestamp')
    .between(startDate, endDate, true, true)
    .toArray();
};

export const deleteOldWeatherData = async (
  daysToKeep: number = 7
): Promise<number> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  const cutoffTimestamp = cutoffDate.toISOString();

  return await db.weatherData
    .where('timestamp')
    .below(cutoffTimestamp)
    .delete();
};

export const saveSetting = async (
  key: string,
  value: SettingValue
): Promise<void> => {
  // 既存の設定を上書き保存（put: 存在すれば更新、なければ追加）
  await db.settings.put({ key, value });
};

export const getSetting = async <T = SettingValue>(
  key: string
): Promise<T | undefined> => {
  const setting = await db.settings.get(key);

  return setting?.value as T | undefined;
};

export const deleteSetting = async (key: string): Promise<void> => {
  await db.settings.delete(key);
};

export const getWeatherSettings = async (): Promise<WeatherSettings> => {
  const settings = await getSetting<WeatherSettings>('weatherSettings');

  return (
    settings || {
      enabled: false,
      lastFetchedAt: null,
    }
  );
};

export const saveWeatherSettings = async (
  settings: WeatherSettings
): Promise<void> => {
  await saveSetting('weatherSettings', settings);
};
