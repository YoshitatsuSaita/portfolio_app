// src/utils/weatherUtils.ts

import { WeatherData, WeatherSettings } from "../types"; // 型定義をインポート

/**
 * 天気データと設定に基づいて警告メッセージを生成する関数
 * @param weather - 天気データオブジェクト（気温、湿度などを含む）
 * @param settings - ユーザーの天気設定（警告の基準温度・湿度など）
 * @returns string[] - 警告メッセージの配列（警告がない場合は空配列）
 *
 * 使用例:
 * const alerts = checkWeatherAlerts(weatherData, userSettings);
 * if (alerts.length > 0) {
 *   alerts.forEach(alert => console.log(alert));
 * }
 */
export function checkWeatherAlerts(
  weather: WeatherData, // 天気データ
  settings: WeatherSettings, // 天気設定
): string[] {
  const alerts: string[] = []; // 警告メッセージを格納する配列（初期値は空配列）

  // 高温警告のチェック
  if (
    settings.notifyHighTemp && // 高温通知が有効化されている
    weather.temperature >= settings.highTempThreshold // 現在気温が基準温度以上
  ) {
    // 警告メッセージを配列に追加
    alerts.push(
      `高温注意: 現在${weather.temperature}度です。薬の保管場所を確認してください。`,
    );
  }

  // 高湿度警告のチェック
  if (
    settings.notifyHighHumidity && // 高湿度通知が有効化されている
    weather.humidity >= settings.highHumidityThreshold // 現在湿度が基準湿度以上
  ) {
    // 警告メッセージを配列に追加
    alerts.push(
      `高湿度注意: 湿度${weather.humidity}%です。薬は密閉容器で保管してください。`,
    );
  }

  // 警告メッセージの配列を返す
  // 0個の場合: 警告なし（空配列）
  // 1個の場合: 高温または高湿度のどちらか
  // 2個の場合: 高温かつ高湿度の両方
  return alerts;
}

/**
 * 天気概要から適切な絵文字アイコンを取得する関数
 * @param description - 天気概要（日本語、例: "晴れ", "曇り"）
 * @returns string - 天気を表す絵文字
 *
 * 使用例:
 * const icon = getWeatherIcon("晴れ");
 * console.log(icon); // "☀️"
 */
export function getWeatherIcon(description: string): string {
  // 天気概要の文字列に特定のキーワードが含まれているかチェック
  // includes(): 部分一致で検索（例: "薄い雲" には "曇" が含まれる）

  if (description.includes("晴")) return "☀️"; // 晴れ（快晴、晴天など）
  if (description.includes("曇")) return "☁️"; // 曇り（薄曇り、曇天など）
  if (description.includes("雨")) return "🌧️"; // 雨（小雨、大雨など）
  if (description.includes("雪")) return "❄️"; // 雪（小雪、大雪など）
  if (description.includes("雷")) return "⚡"; // 雷雨

  // どのキーワードにも一致しない場合のデフォルト
  return "🌤️"; // 薄曇り（部分的に晴れ）
}

/**
 * 天気データが古いかどうかを判定する関数
 * @param timestamp - 天気データの取得日時（ISO 8601形式、例: "2026-02-11T06:00:00.000Z"）
 * @param maxAgeHours - データの有効期限（時間単位、デフォルト: 6時間）
 * @returns boolean - データが古い場合はtrue、新しい場合はfalse
 *
 * 使用例:
 * const isStale = isWeatherDataStale(weatherData.timestamp);
 * if (isStale) {
 *   console.log('天気データが古いため、再取得が必要です');
 * }
 */
export function isWeatherDataStale(
  timestamp: string, // データ取得日時（ISO 8601形式）
  maxAgeHours: number = 6, // デフォルト: 6時間（天気は6時間ごとに更新が一般的）
): boolean {
  const now = new Date(); // 現在時刻を取得
  const dataTime = new Date(timestamp); // データ取得時刻をDateオブジェクトに変換

  // 現在時刻とデータ取得時刻の差分を計算（ミリ秒単位）
  const timeDifference = now.getTime() - dataTime.getTime();

  // ミリ秒を時間に変換
  // 1秒 = 1000ミリ秒
  // 1分 = 60秒
  // 1時間 = 60分
  // → 1時間 = 1000 * 60 * 60 ミリ秒
  const ageInHours = timeDifference / (1000 * 60 * 60);

  // 経過時間が最大経過時間以上の場合はtrue（古い）
  // 例: 7時間経過していて、maxAgeHours=6の場合 → true
  return ageInHours >= maxAgeHours;
}
