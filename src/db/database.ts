import Dexie, { Table } from "dexie"; // Dexieライブラリとテーブル型をインポート
import { Medication, MedicationRecord } from "../types"; // 型定義をインポート

// Dexieを継承したデータベースクラスを定義
export class MedicationDB extends Dexie {
  // 薬剤テーブルの型定義
  medications!: Table<Medication>;
  // 服用記録テーブルの型定義
  medicationRecords!: Table<MedicationRecord>;

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
    });
  }
}

// データベースのシングルトンインスタンスを作成してエクスポート
export const db = new MedicationDB();

// ===== 薬剤管理用のCRUD操作 =====

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

// ===== 服用記録用のCRUD操作 =====

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

/**
 * 服用遵守率を計算
 * @param startDate 開始日時（ISO 8601形式）
 * @param endDate 終了日時（ISO 8601形式）
 * @returns 服用遵守率（0-100のパーセンテージ）
 */
export const calculateAdherenceRate = async (
  startDate: string,
  endDate: string,
): Promise<number> => {
  // 指定された期間の服用記録を全て取得
  const records = await getRecordsByDateRange(startDate, endDate);

  // 記録が0件の場合は0%を返す
  if (records.length === 0) return 0;

  // 服用完了した記録の数をカウント
  const completedCount = records.filter((r) => r.completed).length;

  // 遵守率を計算（完了数 / 全体数 × 100）し、小数第1位で四捨五入
  return Math.round((completedCount / records.length) * 1000) / 10;
};
