// 薬剤情報の型定義
export interface Medication {
  id: string; // 薬剤の一意識別子（UUID）
  name: string; // 薬品名
  dosage: string; // 服用量（例: "1錠", "10ml"）
  frequency: number; // 1日あたりの服用回数
  times: string[]; // 服用時刻の配列（例: ["08:00", "20:00"]）
  startDate: string; // 服用開始日（ISO 8601形式）
  endDate: string | null; // 服用終了日（ISO 8601形式、未設定の場合はnull）
  memo: string; // メモ・備考
  fdaDetails: FDADetails | null; // OpenFDA APIから取得した詳細情報
  createdAt: string; // 作成日時（ISO 8601形式）
  updatedAt: string; // 更新日時（ISO 8601形式）
}

// 服用記録の型定義
export interface MedicationRecord {
  id: string; // 記録の一意識別子（UUID）
  medicationId: string; // 薬剤IDへの外部キー
  scheduledTime: string; // 予定服用日時（ISO 8601形式）
  actualTime: string | null; // 実際の服用日時（ISO 8601形式、未服用の場合はnull）
  completed: boolean; // 服用完了フラグ（デフォルト: false）
  createdAt: string; // 作成日時（ISO 8601形式）
}

// OpenFDA API詳細情報の型定義
export interface FDADetails {
  brandName?: string[]; // 商品名
  genericName?: string[]; // 一般名
  manufacturerName?: string[]; // 製造元
  activeIngredient?: string[]; // 有効成分
  purpose?: string[]; // 用途
  warnings?: string[]; // 警告情報
  adverseReactions?: string[]; // 副作用
  dosageAndAdministration?: string[]; // 使用方法
}

// OpenFDA APIレスポンスの型定義
export interface FDAResponse {
  meta: {
    disclaimer: string;
    terms: string;
    license: string;
    results: {
      skip: number;
      limit: number;
      total: number;
    };
  };
  results: FDAResult[];
}

// OpenFDA API結果の型定義
export interface FDAResult {
  openfda?: {
    brand_name?: string[];
    generic_name?: string[];
    manufacturer_name?: string[];
  };
  active_ingredient?: string[];
  purpose?: string[];
  warnings?: string[];
  adverse_reactions?: string[];
  dosage_and_administration?: string[];
}
