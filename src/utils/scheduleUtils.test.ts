import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateScheduleForDate,
  generateScheduleForRange,
  mergeScheduleWithRecords,
  getTodayDateString,
  getTodayStart,
  getTodayEnd,
  getThisWeekStart,
  getThisMonthStart,
} from './scheduleUtils';
import { Medication, MedicationRecord } from '../types';

// ===== テスト用ヘルパー =====

const createMedication = (overrides?: Partial<Medication>): Medication => ({
  id: 'med_001',
  name: 'テスト薬',
  dosage: '1錠',
  frequency: 1,
  times: ['08:00'],
  startDate: '2024-01-01T00:00:00.000Z',
  endDate: null,
  memo: '',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const createRecord = (
  overrides?: Partial<MedicationRecord>
): MedicationRecord => ({
  id: 'rec_001',
  medicationId: 'med_001',
  scheduledTime: '2024-02-09T08:00:00',
  actualTime: '2024-02-09T08:05:00',
  completed: true,
  createdAt: '2024-02-09T08:05:00.000Z',
  ...overrides,
});

// ===== generateScheduleForDate =====
describe('generateScheduleForDate', () => {
  it('服用期間内の薬剤はScheduleItemを生成する', () => {
    const medication = createMedication({
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: null,
    });
    const result = generateScheduleForDate([medication], '2024-02-09');
    expect(result).toHaveLength(1);
    expect(result[0].medicationId).toBe('med_001');
    expect(result[0].medicationName).toBe('テスト薬');
    expect(result[0].completed).toBe(false);
    expect(result[0].actualTime).toBeNull();
    expect(result[0].recordId).toBeNull();
  });

  it('服用開始日より前の日付はScheduleItemを生成しない', () => {
    const medication = createMedication({
      startDate: '2024-03-01T00:00:00.000Z',
    });
    const result = generateScheduleForDate([medication], '2024-02-09');
    expect(result).toHaveLength(0);
  });

  it('服用終了日より後の日付はScheduleItemを生成しない', () => {
    const medication = createMedication({
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-02-01T00:00:00.000Z',
    });
    const result = generateScheduleForDate([medication], '2024-02-09');
    expect(result).toHaveLength(0);
  });

  it('服用終了日当日はScheduleItemを生成する', () => {
    const medication = createMedication({
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-02-09T00:00:00.000Z',
    });
    const result = generateScheduleForDate([medication], '2024-02-09');
    expect(result).toHaveLength(1);
  });

  it('複数の服用時刻がある場合、時刻数分のScheduleItemを生成する', () => {
    const medication = createMedication({
      times: ['08:00', '12:00', '20:00'],
    });
    const result = generateScheduleForDate([medication], '2024-02-09');
    expect(result).toHaveLength(3);
  });

  it('複数の薬剤がある場合、時刻順にソートされる', () => {
    const med1 = createMedication({ id: 'med_001', times: ['20:00'] });
    const med2 = createMedication({ id: 'med_002', times: ['08:00'] });
    const result = generateScheduleForDate([med1, med2], '2024-02-09');
    expect(result).toHaveLength(2);
    expect(result[0].scheduledTime).toContain('08:00');
    expect(result[1].scheduledTime).toContain('20:00');
  });

  it('生成されたScheduleItemのIDは「薬剤ID_予定時刻」形式になる', () => {
    const medication = createMedication({ id: 'med_001', times: ['08:00'] });
    const result = generateScheduleForDate([medication], '2024-02-09');
    expect(result[0].id).toBe('med_001_2024-02-09T08:00:00');
  });
});

// ===== generateScheduleForRange =====
describe('generateScheduleForRange', () => {
  it('指定した日付範囲のキーが生成される', () => {
    const medication = createMedication();
    const result = generateScheduleForRange(
      [medication],
      '2024-02-01',
      '2024-02-03'
    );
    expect(Object.keys(result)).toEqual([
      '2024-02-01',
      '2024-02-02',
      '2024-02-03',
    ]);
  });

  it('開始日と終了日が同日の場合、1日分のみ生成される', () => {
    const medication = createMedication();
    const result = generateScheduleForRange(
      [medication],
      '2024-02-09',
      '2024-02-09'
    );
    expect(Object.keys(result)).toHaveLength(1);
    expect(result['2024-02-09']).toHaveLength(1);
  });

  it('各日付のScheduleItemが正しく生成される', () => {
    const medication = createMedication({ times: ['08:00', '20:00'] });
    const result = generateScheduleForRange(
      [medication],
      '2024-02-01',
      '2024-02-02'
    );
    expect(result['2024-02-01']).toHaveLength(2);
    expect(result['2024-02-02']).toHaveLength(2);
  });
});

// ===== mergeScheduleWithRecords =====
describe('mergeScheduleWithRecords', () => {
  it('対応する記録がある場合、completed・actualTime・recordIdが更新される', () => {
    const medication = createMedication();
    const scheduleItems = generateScheduleForDate([medication], '2024-02-09');
    const record = createRecord({
      medicationId: 'med_001',
      scheduledTime: '2024-02-09T08:00:00',
      actualTime: '2024-02-09T08:05:00',
      completed: true,
    });
    const result = mergeScheduleWithRecords(scheduleItems, [record]);
    expect(result[0].completed).toBe(true);
    expect(result[0].actualTime).toBe('2024-02-09T08:05:00');
    expect(result[0].recordId).toBe('rec_001');
  });

  it('対応する記録がない場合、元の予定のままを返す', () => {
    const medication = createMedication();
    const scheduleItems = generateScheduleForDate([medication], '2024-02-09');
    const result = mergeScheduleWithRecords(scheduleItems, []);
    expect(result[0].completed).toBe(false);
    expect(result[0].actualTime).toBeNull();
    expect(result[0].recordId).toBeNull();
  });

  it('複数の予定と記録を正しくマージする', () => {
    const med1 = createMedication({ id: 'med_001', times: ['08:00'] });
    const med2 = createMedication({ id: 'med_002', times: ['20:00'] });
    const scheduleItems = generateScheduleForDate([med1, med2], '2024-02-09');
    const record = createRecord({
      medicationId: 'med_001',
      scheduledTime: '2024-02-09T08:00:00',
      completed: true,
    });
    const result = mergeScheduleWithRecords(scheduleItems, [record]);
    const merged = result.find((item) => item.medicationId === 'med_001');
    const notMerged = result.find((item) => item.medicationId === 'med_002');
    expect(merged?.completed).toBe(true);
    expect(notMerged?.completed).toBe(false);
  });
});

// ===== 日付ユーティリティ関数 =====
describe('日付ユーティリティ関数', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 2024-02-09 12:00:00 UTC に固定
    vi.setSystemTime(new Date('2024-02-09T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('getTodayDateString: 今日の日付をYYYY-MM-DD形式で返す', () => {
    // JST(+09:00)では2024-02-09T21:00:00になるため、ロケールによって日付が変わりうる
    // ここではdayjsのデフォルト（ローカルタイム）に合わせて検証
    const result = getTodayDateString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('getTodayStart: 今日の開始時刻をISO 8601形式で返す', () => {
    const result = getTodayStart();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(new Date(result).getHours()).toBe(0);
    expect(new Date(result).getMinutes()).toBe(0);
    expect(new Date(result).getSeconds()).toBe(0);
  });

  it('getTodayEnd: 今日の終了時刻をISO 8601形式で返す', () => {
    const result = getTodayEnd();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(new Date(result).getHours()).toBe(23);
    expect(new Date(result).getMinutes()).toBe(59);
    expect(new Date(result).getSeconds()).toBe(59);
  });

  it('getThisWeekStart: 今週の月曜日をISO 8601形式で返す', () => {
    const result = getThisWeekStart();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    // 月曜日（day=1）であることを確認
    expect(new Date(result).getDay()).toBe(1);
  });

  it('getThisMonthStart: 今月の1日をISO 8601形式で返す', () => {
    const result = getThisMonthStart();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(new Date(result).getDate()).toBe(1);
  });
});
