import dayjs from "dayjs";
import "dayjs/locale/ja"; // 日本語ロケールの辞書データを登録する
import { Medication, MedicationRecord, ScheduleItem } from "../types";

/**
 * 指定した日付の服用予定を生成する関数
 * @param medications - 薬剤データの配列（服用中の薬剤のみを渡すことを推奨）
 * @param date - 予定を生成する日付（Date型またはISO 8601文字列）
 * @returns その日の服用予定の配列（時刻順にソート済み）
 */
export const generateScheduleForDate = (
  medications: Medication[],
  date: Date | string,
): ScheduleItem[] => {
  const targetDate = dayjs(date).format("YYYY-MM-DD");
  const scheduleItems: ScheduleItem[] = [];

  medications.forEach((medication) => {
    const startDate = dayjs(medication.startDate).format("YYYY-MM-DD");
    const endDate = medication.endDate
      ? dayjs(medication.endDate).format("YYYY-MM-DD")
      : null;

    const isInRange =
      targetDate >= startDate &&
      (endDate === null || targetDate <= endDate);

    if (!isInRange) return;

    medication.times.forEach((time) => {
      const scheduledTime = `${targetDate}T${time}:00`;

      const scheduleItem: ScheduleItem = {
        id: `${medication.id}_${scheduledTime}`,
        medicationId: medication.id,
        medicationName: medication.name,
        dosage: medication.dosage,
        scheduledTime,
        completed: false, // 後で服用記録と照合して更新
        actualTime: null,
        recordId: null,
      };

      scheduleItems.push(scheduleItem);
    });
  });

  return scheduleItems.sort(
    (a, b) => a.scheduledTime.localeCompare(b.scheduledTime), // ISO 8601形式なので文字列比較で時系列順になる
  );
};

/**
 * 日付範囲の服用予定を生成する関数（カレンダー表示用）
 * @param medications - 薬剤データの配列
 * @param startDate - 範囲の開始日
 * @param endDate - 範囲の終了日
 * @returns 日付をキーとした服用予定のマップ（例: { "2024-02-09": [ScheduleItem, ...], ... }）
 */
export const generateScheduleForRange = (
  medications: Medication[],
  startDate: Date | string,
  endDate: Date | string,
): Record<string, ScheduleItem[]> => {
  const scheduleMap: Record<string, ScheduleItem[]> = {};

  let currentDate = dayjs(startDate);
  const end = dayjs(endDate);

  while (currentDate.isBefore(end) || currentDate.isSame(end, "day")) {
    const dateKey = currentDate.format("YYYY-MM-DD");
    scheduleMap[dateKey] = generateScheduleForDate(medications, dateKey);
    currentDate = currentDate.add(1, "day");
  }

  return scheduleMap;
};

/**
 * 服用予定と服用記録を照合してマージする関数
 * @param scheduleItems - 生成された服用予定の配列
 * @param records - 服用記録の配列
 * @returns 服用記録の情報がマージされた服用予定の配列
 */
export const mergeScheduleWithRecords = (
  scheduleItems: ScheduleItem[],
  records: MedicationRecord[],
): ScheduleItem[] => {
  // O(1)検索のためMapに変換（キー: 薬剤ID_予定時刻）
  const recordMap = new Map<string, MedicationRecord>();
  records.forEach((record) => {
    const key = `${record.medicationId}_${record.scheduledTime}`;
    recordMap.set(key, record);
  });

  return scheduleItems.map((item) => {
    const key = `${item.medicationId}_${item.scheduledTime}`;
    const record = recordMap.get(key);

    if (record) {
      return {
        ...item,
        completed: record.completed,
        actualTime: record.actualTime,
        recordId: record.id,
      };
    }

    return item;
  });
};

/**
 * 今日の日付を YYYY-MM-DD 形式で取得する関数
 * @returns 今日の日付（文字列）
 */
export const getTodayDateString = (): string => {
  return dayjs().format("YYYY-MM-DD");
};

/**
 * 今日の開始時刻（00:00:00）を ISO 8601 形式で取得する関数
 * @returns 今日の開始時刻（文字列）
 */
export const getTodayStart = (): string => {
  return dayjs().startOf("day").toISOString();
};

/**
 * 今日の終了時刻（23:59:59）を ISO 8601 形式で取得する関数
 * @returns 今日の終了時刻（文字列）
 */
export const getTodayEnd = (): string => {
  return dayjs().endOf("day").toISOString();
};

/**
 * 今週の開始日（月曜日）を取得する関数
 * @returns 今週の開始日（ISO 8601形式）
 */
export const getThisWeekStart = (): string => {
  // startOf("week")は日曜日を返すため、+1日で月曜日に調整
  return dayjs().startOf("week").add(1, "day").startOf("day").toISOString();
};

/**
 * 今月の開始日を取得する関数
 * @returns 今月の開始日（ISO 8601形式）
 */
export const getThisMonthStart = (): string => {
  return dayjs().startOf("month").toISOString();
};
