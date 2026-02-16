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

// 服用予定の型定義（スケジュール表示用）
export interface ScheduleItem {
  id: string; // スケジュール項目の一意識別子（薬剤ID + 予定時刻の組み合わせ）
  medicationId: string; // 薬剤ID
  medicationName: string; // 薬品名（表示用）
  dosage: string; // 服用量（表示用）
  scheduledTime: string; // 予定服用日時（ISO 8601形式）
  completed: boolean; // 服用完了フラグ
  actualTime: string | null; // 実際の服用日時（ISO 8601形式、未服用の場合はnull）
  recordId: string | null; // 服用記録ID（記録が存在する場合のみ）
}

// カレンダーの値の型（単一日付または日付範囲）
export type CalendarValue = Date | null | [Date | null, Date | null];

// ===== 天気関連の型定義 =====

// 天気データの型定義
export interface WeatherData {
  id: string; // 一意識別子（例: "weather_1707654321000"）
  timestamp: string; // 取得日時（ISO 8601形式、例: "2026-02-11T06:00:00.000Z"）
  temperature: number; // 気温（摂氏、整数値、例: 25）
  humidity: number; // 湿度（パーセント、整数値、例: 75）
  description: string; // 天気概要（日本語、例: "晴れ", "曇り"）
  location: {
    // 位置情報
    lat: number; // 緯度（例: 35.6812）
    lon: number; // 経度（例: 139.7671）
  };
}

// 天気設定の型定義（簡略化: 閾値・通知フラグはweatherUtils.tsの定数に移動）
export interface WeatherSettings {
  enabled: boolean; // 天気連携の有効/無効（デフォルト: false）
  lastFetchedAt: string | null; // 最終取得日時（ISO 8601形式、未取得の場合はnull）
}

// OpenWeatherMap APIのレスポンス型定義
export interface OpenWeatherMapResponse {
  main: {
    temp: number; // 気温（摂氏またはケルビン、API呼び出し時のunitsパラメータに依存）
    humidity: number; // 湿度（パーセント、整数値）
  };
  weather: Array<{
    description: string; // 天気概要（APIのlangパラメータで言語指定可能）
  }>;
  coord: {
    lat: number; // 緯度（APIレスポンスに含まれる位置情報）
    lon: number; // 経度（APIレスポンスに含まれる位置情報）
  };
}
