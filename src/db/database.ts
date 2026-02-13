// src/db/database.ts

import Dexie, { Table } from "dexie"; // Dexieライブラリとテーブル型をインポート
import {
  Medication,
  MedicationRecord,
  WeatherData,
  WeatherSettings,
} from "../types"; // 型定義をインポート

// Dexieを継承したデータベースクラスを定義
export class MedicationDB extends Dexie {
  // 薬剤テーブルの型定義
  medications!: Table<Medication>;
  // 服用記録テーブルの型定義
  medicationRecords!: Table<MedicationRecord>;
  // 天気データテーブルの型定義（新規追加）
  weatherData!: Table<WeatherData>;
  // 設定テーブルの型定義（新規追加）
  settings!: Table<{ key: string; value: any }>;

  constructor() {
    // データベース名を指定してDexieを初期化
    super("MedicationDB");

    // バージョン1のスキーマを定義
    this.version(1).stores({
      // medicationsテーブル: id（主キー）、name、startDateにインデックスを設定
      medications: "id, name, startDate",
      // medicationRecordsテーブル: id（主キー）、medicationId、scheduledTime、[medicationId+scheduledTime]（複合インデックス）にインデックスを設定
      medicationRecords:
        "id, medicationId, scheduledTime, [medicationId+scheduledTime]",
      // weatherDataテーブル: id（主キー）、timestampにインデックスを設定（新規追加）
      // timestampでソートして最新データを取得するため
      weatherData: "id, timestamp",
      // settingsテーブル: key（主キー）のみ（新規追加）
      // キーバリュー形式で各種設定を保存（例: key="weatherSettings", value={...}）
      settings: "key",
    });
  }
}

// データベースのシングルトンインスタンスを作成してエクスポート
export const db = new MedicationDB();

// ===== 薬剤管理用のCRUD操作（既存） =====

/**
 * 薬剤を新規作成
 * @param medication 作成する薬剤データ（idは自動生成）
 * @returns 作成された薬剤のID
 */
export const createMedication = async (
  medication: Omit<Medication, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  // UUIDを生成（簡易版: タイムスタンプ + ランダム文字列）
  const id = `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  // 現在時刻をISO 8601形式で取得
  const now = new Date().toISOString();

  // 薬剤データをテーブルに追加
  await db.medications.add({
    ...medication, // 引数で受け取った薬剤データを展開
    id, // 生成したIDを追加
    createdAt: now, // 作成日時を追加
    updatedAt: now, // 更新日時を追加
  });

  // 作成された薬剤のIDを返す
  return id;
};

/**
 * 全ての薬剤を取得
 * @returns 全薬剤の配列
 */
export const getAllMedications = async (): Promise<Medication[]> => {
  // medicationsテーブルから全データを配列として取得
  return await db.medications.toArray();
};

/**
 * IDで薬剤を取得
 * @param id 薬剤ID
 * @returns 薬剤データ、存在しない場合はundefined
 */
export const getMedicationById = async (
  id: string,
): Promise<Medication | undefined> => {
  // 指定されたIDの薬剤を取得
  return await db.medications.get(id);
};

/**
 * 薬剤情報を更新
 * @param id 更新する薬剤のID
 * @param updates 更新するフィールド
 * @returns 更新された件数
 */
export const updateMedication = async (
  id: string,
  updates: Partial<Omit<Medication, "id" | "createdAt">>,
): Promise<number> => {
  // 現在時刻をISO 8601形式で取得
  const now = new Date().toISOString();

  // 指定されたIDの薬剤を更新（updatedAtも自動更新）
  return await db.medications.update(id, {
    ...updates, // 更新するフィールドを展開
    updatedAt: now, // 更新日時を現在時刻に設定
  });
};

/**
 * 薬剤を削除（関連する服用記録も削除）
 * @param id 削除する薬剤のID
 */
export const deleteMedication = async (id: string): Promise<void> => {
  // トランザクションを使用して薬剤と関連記録を一括削除
  await db.transaction("rw", db.medications, db.medicationRecords, async () => {
    // 薬剤を削除
    await db.medications.delete(id);
    // 関連する服用記録を全て削除（カスケード削除）
    await db.medicationRecords.where("medicationId").equals(id).delete();
  });
};

/**
 * 服用中の薬剤を取得（終了日が未設定または未来の薬剤）
 * @returns 服用中の薬剤配列
 */
export const getActiveMedications = async (): Promise<Medication[]> => {
  // 現在の日付を取得
  const now = new Date().toISOString();

  // 終了日がnullまたは現在より未来の薬剤を取得
  return await db.medications
    .filter(
      (med) => med.endDate === null || med.endDate > now, // 終了日が未設定または現在より未来
    )
    .toArray(); // 配列として取得
};

// ===== 服用記録用のCRUD操作（既存） =====

/**
 * 服用記録を新規作成
 * @param record 作成する服用記録データ（idは自動生成）
 * @returns 作成された服用記録のID
 */
export const createMedicationRecord = async (
  record: Omit<MedicationRecord, "id" | "createdAt">,
): Promise<string> => {
  // UUIDを生成（簡易版: タイムスタンプ + ランダム文字列）
  const id = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  // 現在時刻をISO 8601形式で取得
  const now = new Date().toISOString();

  // 服用記録データをテーブルに追加
  await db.medicationRecords.add({
    ...record, // 引数で受け取った記録データを展開
    id, // 生成したIDを追加
    createdAt: now, // 作成日時を追加
  });

  // 作成された服用記録のIDを返す
  return id;
};

/**
 * 薬剤IDで服用記録を取得
 * @param medicationId 薬剤ID
 * @returns 該当する服用記録の配列
 */
export const getRecordsByMedicationId = async (
  medicationId: string,
): Promise<MedicationRecord[]> => {
  // 指定された薬剤IDの服用記録を全て取得
  return await db.medicationRecords
    .where("medicationId") // medicationIdフィールドで検索
    .equals(medicationId) // 指定されたIDと一致するもの
    .toArray(); // 配列として取得
};

/**
 * 日付範囲で服用記録を取得
 * @param startDate 開始日時（ISO 8601形式）
 * @param endDate 終了日時（ISO 8601形式）
 * @returns 該当する服用記録の配列
 */
export const getRecordsByDateRange = async (
  startDate: string,
  endDate: string,
): Promise<MedicationRecord[]> => {
  // 指定された日付範囲の服用記録を取得
  return await db.medicationRecords
    .where("scheduledTime") // scheduledTimeフィールドで検索
    .between(startDate, endDate, true, true) // 開始日〜終了日（両端含む）
    .toArray(); // 配列として取得
};

/**
 * 服用記録を更新（主に服用完了時に使用）
 * @param id 更新する服用記録のID
 * @param updates 更新するフィールド
 * @returns 更新された件数
 */
export const updateMedicationRecord = async (
  id: string,
  updates: Partial<Omit<MedicationRecord, "id" | "medicationId" | "createdAt">>,
): Promise<number> => {
  // 指定されたIDの服用記録を更新
  return await db.medicationRecords.update(id, updates);
};

/**
 * 服用完了をマーク
 * @param id 服用記録のID
 * @returns 更新された件数
 */
export const markAsCompleted = async (id: string): Promise<number> => {
  // 現在時刻をISO 8601形式で取得
  const now = new Date().toISOString();

  // 服用完了フラグをtrueに、実際の服用時刻を現在時刻に設定
  return await db.medicationRecords.update(id, {
    completed: true, // 服用完了フラグをtrueに設定
    actualTime: now, // 実際の服用時刻を現在時刻に設定
  });
};

// ===== 天気データ用のCRUD操作（新規追加） =====

/**
 * 天気データを保存
 * @param weatherData 天気データオブジェクト
 * @returns 作成された天気データのID
 */
export const saveWeatherData = async (
  weatherData: WeatherData,
): Promise<string> => {
  // 天気データをテーブルに追加
  // IDはweatherData内に既に含まれているため、そのまま保存
  await db.weatherData.add(weatherData);

  // 保存した天気データのIDを返す
  return weatherData.id;
};

/**
 * 最新の天気データを取得
 * @returns 最新の天気データ、存在しない場合はundefined
 */
export const getLatestWeatherData = async (): Promise<
  WeatherData | undefined
> => {
  // timestampで降順ソート（新しい順）して1件取得
  const results = await db.weatherData
    .orderBy("timestamp") // timestampでソート（昇順）
    .reverse() // 降順に反転（新しい順）
    .limit(1) // 最初の1件のみ取得
    .toArray(); // 配列として取得

  // 結果の最初の要素を返す（存在しない場合はundefined）
  return results[0];
};

/**
 * 指定期間の天気データを取得
 * @param startDate 開始日時（ISO 8601形式）
 * @param endDate 終了日時（ISO 8601形式）
 * @returns 該当する天気データの配列
 */
export const getWeatherDataByDateRange = async (
  startDate: string,
  endDate: string,
): Promise<WeatherData[]> => {
  // 指定された日付範囲の天気データを取得
  return await db.weatherData
    .where("timestamp") // timestampフィールドで検索
    .between(startDate, endDate, true, true) // 開始日〜終了日（両端含む）
    .toArray(); // 配列として取得
};

/**
 * 古い天気データを削除（過去7日より古いデータ）
 * @param daysToKeep 保持する日数（デフォルト: 7日）
 * @returns 削除された件数
 */
export const deleteOldWeatherData = async (
  daysToKeep: number = 7,
): Promise<number> => {
  // 現在時刻から指定日数前の日時を計算
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep); // 7日前
  const cutoffTimestamp = cutoffDate.toISOString(); // ISO 8601形式に変換

  // cutoffTimestampより古いデータを削除
  return await db.weatherData
    .where("timestamp") // timestampフィールドで検索
    .below(cutoffTimestamp) // 指定日時より古いもの（未満）
    .delete(); // 削除
};

// ===== 設定用のCRUD操作（新規追加） =====

/**
 * 設定を保存（キーバリュー形式）
 * @param key 設定キー（例: "weatherSettings"）
 * @param value 設定値（任意の型、JSONシリアライズ可能なオブジェクト）
 */
export const saveSetting = async (key: string, value: any): Promise<void> => {
  // 既存の設定を上書き保存（put: 存在すれば更新、なければ追加）
  await db.settings.put({ key, value });
};

/**
 * 設定を取得
 * @param key 設定キー（例: "weatherSettings"）
 * @returns 設定値、存在しない場合はundefined
 */
export const getSetting = async <T = any>(
  key: string,
): Promise<T | undefined> => {
  // 指定されたキーの設定を取得
  const setting = await db.settings.get(key);

  // 設定が存在する場合はvalueを返す、存在しない場合はundefined
  return setting?.value as T | undefined;
};

/**
 * 設定を削除
 * @param key 設定キー（例: "weatherSettings"）
 */
export const deleteSetting = async (key: string): Promise<void> => {
  // 指定されたキーの設定を削除
  await db.settings.delete(key);
};

/**
 * 天気設定を取得（デフォルト値付き）
 * @returns 天気設定オブジェクト
 */
export const getWeatherSettings = async (): Promise<WeatherSettings> => {
  // "weatherSettings"キーで設定を取得
  const settings = await getSetting<WeatherSettings>("weatherSettings");

  // 設定が存在する場合はそれを返す、存在しない場合はデフォルト値を返す
  return (
    settings || {
      // デフォルト値
      enabled: false, // 天気連携は初期状態でOFF
      highTempThreshold: 30, // 高温警告の基準: 30度
      highHumidityThreshold: 80, // 高湿度警告の基準: 80%
      notifyHighTemp: true, // 高温通知はON
      notifyHighHumidity: true, // 高湿度通知はON
      lastFetchedAt: null, // 未取得
    }
  );
};

/**
 * 天気設定を保存
 * @param settings 天気設定オブジェクト
 */
export const saveWeatherSettings = async (
  settings: WeatherSettings,
): Promise<void> => {
  // "weatherSettings"キーで設定を保存
  await saveSetting("weatherSettings", settings);
};
