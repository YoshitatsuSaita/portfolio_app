import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { MedicationDB } from './database';
import {
  createMedication,
  getAllMedications,
  getMedicationById,
  updateMedication,
  deleteMedication,
  getActiveMedications,
  createMedicationRecord,
  getRecordsByMedicationId,
  getRecordsByDateRange,
  markAsCompleted,
  saveWeatherData,
  getLatestWeatherData,
  deleteOldWeatherData,
  saveSetting,
  getSetting,
  deleteSetting,
  getWeatherSettings,
  saveWeatherSettings,
} from './database';
import { Medication, MedicationRecord, WeatherData } from '../types';

// ===== テスト用ヘルパー =====

const createMedicationInput = (
  overrides?: Partial<Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>>
) => ({
  name: 'テスト薬',
  dosage: '1錠',
  frequency: 1,
  times: ['08:00'],
  startDate: '2024-01-01T00:00:00.000Z',
  endDate: null,
  memo: '',
  ...overrides,
});

const createRecordInput = (
  medicationId: string,
  overrides?: Partial<Omit<MedicationRecord, 'id' | 'createdAt'>>
) => ({
  medicationId,
  scheduledTime: '2024-02-09T08:00:00',
  actualTime: null,
  completed: false,
  ...overrides,
});

const createWeatherDataInput = (
  overrides?: Partial<WeatherData>
): WeatherData => ({
  id: `weather_${Date.now()}`,
  timestamp: new Date().toISOString(),
  temperature: 25,
  humidity: 60,
  description: '晴れ',
  location: { lat: 35.6812, lon: 139.7671 },
  ...overrides,
});

// ===== 各テスト前にDBをリセット =====
beforeEach(async () => {
  const db = new MedicationDB();
  await db.medications.clear();
  await db.medicationRecords.clear();
  await db.weatherData.clear();
  await db.settings.clear();
});

// ===== 薬剤管理 =====
describe('createMedication', () => {
  it('薬剤を作成してIDを返す', async () => {
    const id = await createMedication(createMedicationInput());
    expect(id).toMatch(/^med_/);
  });

  it('作成した薬剤がDBに保存される', async () => {
    const id = await createMedication(createMedicationInput({ name: '薬A' }));
    const med = await getMedicationById(id);
    expect(med?.name).toBe('薬A');
  });
});

describe('getAllMedications', () => {
  it('全薬剤を取得する', async () => {
    await createMedication(createMedicationInput({ name: '薬A' }));
    await createMedication(createMedicationInput({ name: '薬B' }));
    const meds = await getAllMedications();
    expect(meds).toHaveLength(2);
  });

  it('薬剤が0件の場合、空配列を返す', async () => {
    const meds = await getAllMedications();
    expect(meds).toEqual([]);
  });
});

describe('getMedicationById', () => {
  it('IDで薬剤を取得する', async () => {
    const id = await createMedication(createMedicationInput({ name: '薬A' }));
    const med = await getMedicationById(id);
    expect(med?.id).toBe(id);
    expect(med?.name).toBe('薬A');
  });

  it('存在しないIDの場合、undefinedを返す', async () => {
    const med = await getMedicationById('not_exist');
    expect(med).toBeUndefined();
  });
});

describe('updateMedication', () => {
  it('指定フィールドが更新される', async () => {
    const id = await createMedication(createMedicationInput({ name: '薬A' }));
    await updateMedication(id, { name: '薬A（更新）' });
    const med = await getMedicationById(id);
    expect(med?.name).toBe('薬A（更新）');
  });

  it('updatedAtが更新される', async () => {
    const id = await createMedication(createMedicationInput());
    const before = await getMedicationById(id);
    await new Promise((resolve) => setTimeout(resolve, 10));
    await updateMedication(id, { name: '更新後' });
    const after = await getMedicationById(id);
    expect(after?.updatedAt).not.toBe(before?.updatedAt);
  });
});

describe('deleteMedication', () => {
  it('薬剤が削除される', async () => {
    const id = await createMedication(createMedicationInput());
    await deleteMedication(id);
    const med = await getMedicationById(id);
    expect(med).toBeUndefined();
  });

  it('関連する服用記録も削除される', async () => {
    const medId = await createMedication(createMedicationInput());
    await createMedicationRecord(createRecordInput(medId));
    await deleteMedication(medId);
    const records = await getRecordsByMedicationId(medId);
    expect(records).toHaveLength(0);
  });
});

describe('getActiveMedications', () => {
  it('終了日が未設定の薬剤を取得する', async () => {
    await createMedication(createMedicationInput({ endDate: null }));
    const meds = await getActiveMedications();
    expect(meds).toHaveLength(1);
  });

  it('終了日が未来の薬剤を取得する', async () => {
    await createMedication(
      createMedicationInput({ endDate: '2099-12-31T00:00:00.000Z' })
    );
    const meds = await getActiveMedications();
    expect(meds).toHaveLength(1);
  });

  it('終了日が過去の薬剤は取得しない', async () => {
    await createMedication(
      createMedicationInput({ endDate: '2020-01-01T00:00:00.000Z' })
    );
    const meds = await getActiveMedications();
    expect(meds).toHaveLength(0);
  });
});

// ===== 服用記録管理 =====
describe('createMedicationRecord', () => {
  it('服用記録を作成してIDを返す', async () => {
    const medId = await createMedication(createMedicationInput());
    const id = await createMedicationRecord(createRecordInput(medId));
    expect(id).toMatch(/^rec_/);
  });
});

describe('getRecordsByMedicationId', () => {
  it('薬剤IDで服用記録を取得する', async () => {
    const medId = await createMedication(createMedicationInput());
    await createMedicationRecord(createRecordInput(medId));
    await createMedicationRecord(createRecordInput(medId));
    const records = await getRecordsByMedicationId(medId);
    expect(records).toHaveLength(2);
  });

  it('該当する記録がない場合、空配列を返す', async () => {
    const records = await getRecordsByMedicationId('not_exist');
    expect(records).toHaveLength(0);
  });
});

describe('getRecordsByDateRange', () => {
  it('日付範囲内の服用記録を取得する', async () => {
    const medId = await createMedication(createMedicationInput());
    await createMedicationRecord(
      createRecordInput(medId, { scheduledTime: '2024-02-09T08:00:00' })
    );
    await createMedicationRecord(
      createRecordInput(medId, { scheduledTime: '2024-02-10T08:00:00' })
    );
    await createMedicationRecord(
      createRecordInput(medId, { scheduledTime: '2024-02-11T08:00:00' })
    );
    const records = await getRecordsByDateRange(
      '2024-02-09T00:00:00',
      '2024-02-10T23:59:59'
    );
    expect(records).toHaveLength(2);
  });
});

describe('markAsCompleted', () => {
  it('completedがtrueになり、actualTimeが設定される', async () => {
    const medId = await createMedication(createMedicationInput());
    const recId = await createMedicationRecord(createRecordInput(medId));
    await markAsCompleted(recId);
    const records = await getRecordsByMedicationId(medId);
    expect(records[0].completed).toBe(true);
    expect(records[0].actualTime).not.toBeNull();
  });
});

// ===== 天気データ管理 =====
describe('saveWeatherData / getLatestWeatherData', () => {
  it('天気データを保存して取得できる', async () => {
    const data = createWeatherDataInput({ id: 'weather_001' });
    await saveWeatherData(data);
    const latest = await getLatestWeatherData();
    expect(latest?.id).toBe('weather_001');
  });

  it('複数ある場合、最新のデータを返す', async () => {
    await saveWeatherData(
      createWeatherDataInput({
        id: 'weather_old',
        timestamp: '2024-02-09T08:00:00.000Z',
      })
    );
    await saveWeatherData(
      createWeatherDataInput({
        id: 'weather_new',
        timestamp: '2024-02-09T12:00:00.000Z',
      })
    );
    const latest = await getLatestWeatherData();
    expect(latest?.id).toBe('weather_new');
  });

  it('データが0件の場合、undefinedを返す', async () => {
    const latest = await getLatestWeatherData();
    expect(latest).toBeUndefined();
  });
});

describe('deleteOldWeatherData', () => {
  it('指定日数より古いデータが削除される', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10);
    await saveWeatherData(
      createWeatherDataInput({
        id: 'weather_old',
        timestamp: oldDate.toISOString(),
      })
    );
    await saveWeatherData(
      createWeatherDataInput({
        id: 'weather_new',
        timestamp: new Date().toISOString(),
      })
    );
    await deleteOldWeatherData(7);
    const latest = await getLatestWeatherData();
    expect(latest?.id).toBe('weather_new');
  });
});

// ===== 設定管理 =====
describe('saveSetting / getSetting / deleteSetting', () => {
  it('設定を保存して取得できる', async () => {
    await saveSetting('testKey', { value: 42 });
    const result = await getSetting<{ value: number }>('testKey');
    expect(result?.value).toBe(42);
  });

  it('存在しないキーはundefinedを返す', async () => {
    const result = await getSetting('not_exist');
    expect(result).toBeUndefined();
  });

  it('設定を削除すると取得できなくなる', async () => {
    await saveSetting('testKey', 'someValue');
    await deleteSetting('testKey');
    const result = await getSetting('testKey');
    expect(result).toBeUndefined();
  });

  it('既存の設定を上書き保存できる', async () => {
    await saveSetting('testKey', 'before');
    await saveSetting('testKey', 'after');
    const result = await getSetting<string>('testKey');
    expect(result).toBe('after');
  });
});

describe('getWeatherSettings', () => {
  it('設定がない場合、デフォルト値を返す', async () => {
    const settings = await getWeatherSettings();
    expect(settings.enabled).toBe(false);
    expect(settings.lastFetchedAt).toBeNull();
  });

  it('保存済みの設定を返す', async () => {
    await saveWeatherSettings({
      enabled: true,
      lastFetchedAt: '2024-02-09T12:00:00.000Z',
    });
    const settings = await getWeatherSettings();
    expect(settings.enabled).toBe(true);
    expect(settings.lastFetchedAt).toBe('2024-02-09T12:00:00.000Z');
  });
});
