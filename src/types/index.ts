export interface Medication {
  id: string; // UUID
  name: string;
  dosage: string; // 例: "1錠", "10ml"
  frequency: number; // 1日あたりの服用回数
  times: string[]; // 例: ["08:00", "20:00"]
  startDate: string; // ISO 8601
  endDate: string | null; // null = 継続中
  memo: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationRecord {
  id: string; // UUID
  medicationId: string; // 薬剤IDへの外部キー
  scheduledTime: string; // ISO 8601
  actualTime: string | null; // null = 未服用
  completed: boolean; // デフォルト: false
  createdAt: string;
}

// スケジュール表示用
export interface ScheduleItem {
  id: string; // 薬剤ID + 予定時刻の組み合わせ
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  completed: boolean;
  actualTime: string | null; // null = 未服用
  recordId: string | null; // null = 記録なし
}

// 単一日付または日付範囲
export type CalendarValue = Date | null | [Date | null, Date | null];

export interface WeatherData {
  id: string; // 例: "weather_1707654321000"
  timestamp: string; // ISO 8601
  temperature: number; // 摂氏
  humidity: number;
  description: string; // 日本語
  location: {
    lat: number;
    lon: number;
  };
}

// 閾値・通知フラグはweatherUtils.tsの定数に移動済み
export interface WeatherSettings {
  enabled: boolean; // デフォルト: false
  lastFetchedAt: string | null; // null = 未取得
}

export interface OpenWeatherMapResponse {
  main: {
    temp: number; // unitsパラメータに依存（摂氏またはケルビン）
    humidity: number;
  };
  weather: Array<{
    description: string; // langパラメータで言語指定可能
  }>;
  coord: {
    lat: number;
    lon: number;
  };
}
