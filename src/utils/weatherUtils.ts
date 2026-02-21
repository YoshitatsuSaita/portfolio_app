import { WeatherData } from '../types';

const HIGH_TEMP_THRESHOLD = 30;
const HIGH_HUMIDITY_THRESHOLD = 80;

/**
 * 天気データに基づいて警告メッセージを生成する関数
 * @param weather - 天気データオブジェクト（気温、湿度などを含む）
 * @returns string[] - 警告メッセージの配列（警告がない場合は空配列）
 */
export function checkWeatherAlerts(
  weather: WeatherData
): string[] {
  const alerts: string[] = [];

  if (weather.temperature >= HIGH_TEMP_THRESHOLD) {
    alerts.push(
      `高温注意: 現在${weather.temperature}度です。薬の保管場所を確認してください。`
    );
  }

  if (weather.humidity >= HIGH_HUMIDITY_THRESHOLD) {
    alerts.push(
      `高湿度注意: 湿度${weather.humidity}%です。薬は密閉容器で保管してください。`
    );
  }

  return alerts;
}

/**
 * 保管環境が良好かどうかを判定する関数
 * 温度・湿度がともに基準値未満の場合にtrueを返す
 * @param weather - 天気データオブジェクト
 * @returns boolean - 保管環境が良好であればtrue
 */
export function isStorageEnvironmentGood(weather: WeatherData): boolean {
  const tempIsOk = weather.temperature < HIGH_TEMP_THRESHOLD;
  const humidityIsOk = weather.humidity < HIGH_HUMIDITY_THRESHOLD;

  return tempIsOk && humidityIsOk;
}

/**
 * 天気概要から適切な絵文字アイコンを取得する関数
 * @param description - 天気概要（日本語、例: "晴れ", "曇り"）
 * @returns string - 天気を表す絵文字
 */
export function getWeatherIcon(description: string): string {
  if (description.includes('晴')) return '☀️';
  if (description.includes('曇')) return '☁️';
  if (description.includes('雨')) return '🌧️';
  if (description.includes('雪')) return '❄️';
  if (description.includes('雷')) return '⚡';

  return '🌤️';
}

/**
 * 天気データが古いかどうかを判定する関数
 * @param timestamp - 天気データの取得日時（ISO 8601形式）
 * @param maxAgeHours - データの有効期限（時間単位、デフォルト: 24時間）
 * @returns boolean - データが古い場合はtrue、新しい場合はfalse
 */
export function isWeatherDataStale(
  timestamp: string,
  maxAgeHours: number = 24
): boolean {
  const now = new Date();
  const dataTime = new Date(timestamp);

  const timeDifference = now.getTime() - dataTime.getTime();

  const ageInHours = timeDifference / (1000 * 60 * 60);

  return ageInHours >= maxAgeHours;
}
