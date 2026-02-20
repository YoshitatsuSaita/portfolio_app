import { WeatherData } from '../types'; // 天気データの型定義のみインポート

// ===== 警告判定の定数定義 =====
const HIGH_TEMP_THRESHOLD = 30; // 高温警告の基準温度（摂氏30度以上で警告）
const HIGH_HUMIDITY_THRESHOLD = 80; // 高湿度警告の基準湿度（80%以上で警告）

/**
 * 天気データに基づいて警告メッセージを生成する関数
 * @param weather - 天気データオブジェクト（気温、湿度などを含む）
 * @returns string[] - 警告メッセージの配列（警告がない場合は空配列）
 */
export function checkWeatherAlerts(
  weather: WeatherData // 天気データ（引数）
): string[] {
  const alerts: string[] = []; // 警告メッセージを格納する配列（初期値は空配列）

  // 高温警告のチェック（30度以上で警告を追加）
  if (weather.temperature >= HIGH_TEMP_THRESHOLD) {
    // 現在気温が基準温度（30度）以上か判定
    alerts.push(
      // 条件を満たしたら警告メッセージを配列に追加
      `高温注意: 現在${weather.temperature}度です。薬の保管場所を確認してください。`
    );
  }

  // 高湿度警告のチェック（80%以上で警告を追加）
  if (weather.humidity >= HIGH_HUMIDITY_THRESHOLD) {
    // 現在湿度が基準湿度（80%）以上か判定
    alerts.push(
      // 条件を満たしたら警告メッセージを配列に追加
      `高湿度注意: 湿度${weather.humidity}%です。薬は密閉容器で保管してください。`
    );
  }

  // 警告メッセージの配列を返す
  // 0個: 警告なし（空配列）
  // 1個: 高温または高湿度のどちらか
  // 2個: 高温かつ高湿度の両方
  return alerts;
}

/**
 * 保管環境が良好かどうかを判定する関数
 * 温度・湿度がともに基準値未満の場合にtrueを返す
 * @param weather - 天気データオブジェクト
 * @returns boolean - 保管環境が良好であればtrue
 *
 * 使用例:
 * const isGood = isStorageEnvironmentGood(weatherData);
 * if (isGood) {
 *   console.log("保管環境は良好です");
 * }
 */

export function isStorageEnvironmentGood(weather: WeatherData): boolean {
  const tempIsOk = weather.temperature < HIGH_TEMP_THRESHOLD; // 気温が基準値（30度）未満か判定
  const humidityIsOk = weather.humidity < HIGH_HUMIDITY_THRESHOLD; // 湿度が基準値（80%）未満か判定

  return tempIsOk && humidityIsOk; // 両方の条件を満たす場合のみtrueを返す
}

/**
 * 天気概要から適切な絵文字アイコンを取得する関数
 * @param description - 天気概要（日本語、例: "晴れ", "曇り"）
 * @returns string - 天気を表す絵文字
 */
export function getWeatherIcon(description: string): string {
  // 天気概要の文字列に特定のキーワードが含まれているかチェック

  if (description.includes('晴')) return '☀️'; // 晴れ（快晴、晴天など）
  if (description.includes('曇')) return '☁️'; // 曇り（薄曇り、曇天など）
  if (description.includes('雨')) return '🌧️'; // 雨（小雨、大雨など）
  if (description.includes('雪')) return '❄️'; // 雪（小雪、大雪など）
  if (description.includes('雷')) return '⚡'; // 雷雨

  return '🌤️'; // どのキーワードにも一致しない場合のデフォルト
}

/**
 * 天気データが古いかどうかを判定する関数
 * @param timestamp - 天気データの取得日時（ISO 8601形式）
 * @param maxAgeHours - データの有効期限（時間単位、デフォルト: 6時間）
 * @returns boolean - データが古い場合はtrue、新しい場合はfalse
 */
export function isWeatherDataStale(
  timestamp: string, // データ取得日時（ISO 8601形式）
  maxAgeHours: number = 24 // デフォルト: 24時間
): boolean {
  const now = new Date(); // 現在時刻を取得
  const dataTime = new Date(timestamp); // データ取得時刻をDateオブジェクトに変換

  const timeDifference = now.getTime() - dataTime.getTime(); // 差分をミリ秒単位で計算

  const ageInHours = timeDifference / (1000 * 60 * 60); // ミリ秒を時間に変換

  return ageInHours >= maxAgeHours; // 経過時間が有効期限以上の場合はtrue（古い）
}
