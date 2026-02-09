import dayjs from "dayjs"; // Day.jsをインポート - 日時操作ライブラリ
import { Medication, MedicationRecord, ScheduleItem } from "../types"; // 型定義をインポート

/**
 * 指定した日付の服用予定を生成する関数
 * @param medications - 薬剤データの配列（服用中の薬剤のみを渡すことを推奨）
 * @param date - 予定を生成する日付（Date型またはISO 8601文字列）
 * @returns その日の服用予定の配列（時刻順にソート済み）
 */
export const generateScheduleForDate = (
  medications: Medication[], // 薬剤データの配列
  date: Date | string, // 対象日付
): ScheduleItem[] => {
  const targetDate = dayjs(date).format("YYYY-MM-DD"); // 日付を YYYY-MM-DD 形式に統一（時刻部分を除去）
  const scheduleItems: ScheduleItem[] = []; // 服用予定を格納する配列を初期化

  // 各薬剤について処理をループ
  medications.forEach((medication) => {
    // 開始日と終了日を Day.js オブジェクトに変換
    const startDate = dayjs(medication.startDate).format("YYYY-MM-DD"); // 服用開始日を YYYY-MM-DD 形式に変換
    const endDate = medication.endDate
      ? dayjs(medication.endDate).format("YYYY-MM-DD") // 終了日が設定されている場合は YYYY-MM-DD 形式に変換
      : null; // 終了日が未設定の場合は null

    // 対象日が服用期間内かチェック
    const isInRange =
      targetDate >= startDate && // 対象日が開始日以降かチェック
      (endDate === null || targetDate <= endDate); // 終了日が未設定 または 対象日が終了日以前かチェック

    // 服用期間外の場合はスキップ
    if (!isInRange) return; // この薬剤は対象日に服用しないので次の薬剤へ

    // 服用時間（times配列）の各時刻について予定を生成
    medication.times.forEach((time) => {
      // 服用時刻
      const scheduledTime = `${targetDate}T${time}:00`; // ISO 8601形式の日時文字列を生成（例: "2024-02-09T08:00:00"）

      // ScheduleItemオブジェクトを作成
      const scheduleItem: ScheduleItem = {
        id: `${medication.id}_${scheduledTime}`, // 一意のIDを生成（薬剤ID + 予定時刻）
        medicationId: medication.id, // 薬剤ID
        medicationName: medication.name, // 薬品名
        dosage: medication.dosage, // 服用量
        scheduledTime, // 予定服用日時
        completed: false, // 初期状態は未服用（後で服用記録と照合して更新）
        actualTime: null, // 初期状態は未服用なので null
        recordId: null, // 初期状態は記録なしなので null
      };

      scheduleItems.push(scheduleItem); // 生成した予定を配列に追加
    });
  });

  // 予定を時刻順にソート（早い時刻が先）
  return scheduleItems.sort(
    (a, b) => a.scheduledTime.localeCompare(b.scheduledTime), // 文字列比較でソート（ISO 8601形式なので文字列比較で時系列順になる）
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
  medications: Medication[], // 薬剤データの配列
  startDate: Date | string, // 範囲の開始日
  endDate: Date | string, // 範囲の終了日
): Record<string, ScheduleItem[]> => {
  const scheduleMap: Record<string, ScheduleItem[]> = {}; // 日付ごとの予定を格納するオブジェクトを初期化

  // 開始日から終了日まで1日ずつループ
  let currentDate = dayjs(startDate); // 現在処理中の日付を開始日で初期化
  const end = dayjs(endDate); // 終了日を Day.js オブジェクトに変換

  while (currentDate.isBefore(end) || currentDate.isSame(end, "day")) {
    // 現在日が終了日以前の間ループ（同日も含む）
    const dateKey = currentDate.format("YYYY-MM-DD"); // 日付キーを YYYY-MM-DD 形式で生成
    scheduleMap[dateKey] = generateScheduleForDate(medications, dateKey); // その日の予定を生成してマップに格納
    currentDate = currentDate.add(1, "day"); // 次の日に進む
  }

  return scheduleMap; // 日付ごとの予定マップを返す
};

/**
 * 服用予定と服用記録を照合してマージする関数
 * @param scheduleItems - 生成された服用予定の配列
 * @param records - 服用記録の配列
 * @returns 服用記録の情報がマージされた服用予定の配列
 */
export const mergeScheduleWithRecords = (
  scheduleItems: ScheduleItem[], // 服用予定の配列
  records: MedicationRecord[], // 服用記録の配列
): ScheduleItem[] => {
  // 服用記録を検索しやすいようにMapに変換（キー: 薬剤ID + 予定時刻）
  const recordMap = new Map<string, MedicationRecord>(); // Map型でO(1)の高速検索を実現
  records.forEach((record) => {
    const key = `${record.medicationId}_${record.scheduledTime}`; // 薬剤IDと予定時刻を結合したキーを生成
    recordMap.set(key, record); // Mapに記録を追加
  });

  // 各予定について、対応する記録があるかチェックしてマージ
  return scheduleItems.map((item) => {
    const key = `${item.medicationId}_${item.scheduledTime}`; // 予定のキーを生成（記録と照合するため）
    const record = recordMap.get(key); // 対応する記録を検索

    if (record) {
      // 記録が存在する場合
      return {
        ...item, // 既存の予定データを展開
        completed: record.completed, // 服用完了フラグを記録の値で更新
        actualTime: record.actualTime, // 実際の服用時刻を記録の値で更新
        recordId: record.id, // 服用記録IDを設定
      };
    }

    return item; // 記録がない場合はそのまま返す（completed=false, actualTime=null, recordId=null）
  });
};

/**
 * 今日の日付を YYYY-MM-DD 形式で取得する関数
 * @returns 今日の日付（文字列）
 */
export const getTodayDateString = (): string => {
  return dayjs().format("YYYY-MM-DD"); // Day.jsで現在日時を取得し、YYYY-MM-DD 形式にフォーマット
};

/**
 * 今日の開始時刻（00:00:00）を ISO 8601 形式で取得する関数
 * @returns 今日の開始時刻（文字列）
 */
export const getTodayStart = (): string => {
  return dayjs().startOf("day").toISOString(); // Day.jsで今日の開始時刻（00:00:00）を取得し、ISO 8601形式に変換
};

/**
 * 今日の終了時刻（23:59:59）を ISO 8601 形式で取得する関数
 * @returns 今日の終了時刻（文字列）
 */
export const getTodayEnd = (): string => {
  return dayjs().endOf("day").toISOString(); // Day.jsで今日の終了時刻（23:59:59）を取得し、ISO 8601形式に変換
};

/**
 * 今週の開始日（月曜日）を取得する関数
 * @returns 今週の開始日（ISO 8601形式）
 */
export const getThisWeekStart = (): string => {
  return dayjs().startOf("week").add(1, "day").startOf("day").toISOString(); // Day.jsで今週の日曜日を取得し、1日足して月曜日にし、ISO 8601形式に変換
};

/**
 * 今月の開始日を取得する関数
 * @returns 今月の開始日（ISO 8601形式）
 */
export const getThisMonthStart = (): string => {
  return dayjs().startOf("month").toISOString(); // Day.jsで今月の1日00:00:00を取得し、ISO 8601形式に変換
};
