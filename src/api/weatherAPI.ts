import { WeatherData, OpenWeatherMapResponse } from '../types';

// 自前の Vercel Function のエンドポイント（APIキーを含まない）
const API_BASE_URL = '/api/weather';

/**
 * Vercel Function 経由で天気情報を取得する関数
 * @param lat - 緯度（-90 〜 90の範囲、例: 35.6812 = 東京）
 * @param lon - 経度（-180 〜 180の範囲、例: 139.7671 = 東京）
 * @returns Promise<WeatherData> - 天気データオブジェクト
 * @throws Error - HTTP通信エラー、JSONパースエラー時
 */
export async function fetchWeatherData(
  lat: number, // 緯度
  lon: number // 経度
): Promise<WeatherData> {
  try {
    // リクエスト先を Vercel Function に変更（APIキーはURLに含まれない）
    const url = `${API_BASE_URL}?lat=${lat}&lon=${lon}`;

    // Fetch APIでHTTPリクエストを送信
    const response = await fetch(url);

    // HTTPステータスコードをチェック（200番台以外はエラー）
    if (!response.ok) {
      // 例: 401 Unauthorized（APIキー無効）、404 Not Found（不正な座標）など
      throw new Error(
        `天気情報の取得に失敗しました: HTTP ${response.status} ${response.statusText}`
      );
    }

    // レスポンスボディをJSONとしてパース
    const data: OpenWeatherMapResponse = await response.json();

    // APIのレスポンス形式をアプリ内部の形式（WeatherData）に変換
    const weatherData: WeatherData = {
      // 一意のIDを生成（タイムスタンプを使用）
      id: `weather_${Date.now()}`,

      // 現在時刻をISO 8601形式で保存（例: "2026-02-11T06:00:00.000Z"）
      timestamp: new Date().toISOString(),

      // 気温を整数に丸める（小数点以下は不要なため）
      temperature: Math.round(data.main.temp),

      // 湿度（APIレスポンスは既に整数値）
      humidity: data.main.humidity,

      // 天気概要（日本語、例: "晴れ", "薄い雲"）
      description: data.weather[0].description,

      // 位置情報（APIレスポンスに含まれる座標）
      location: {
        lat: data.coord.lat, // 緯度
        lon: data.coord.lon, // 経度
      },
    };

    // 変換後の天気データを返す
    return weatherData;
  } catch (error) {
    // エラーをコンソールに出力（デバッグ用）
    console.error('天気情報の取得に失敗しました:', error);

    // エラーを再スロー（呼び出し側でtry-catchしてハンドリング）
    throw error;
  }
}

/**
 * ブラウザのGeolocation APIを使って現在位置を取得する関数
 * ※ この関数は変更なし
 */
export function getCurrentPosition(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('このブラウザは位置情報に対応していません'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(`位置情報の取得に失敗しました: ${error.message}`));
      },
      {
        enableHighAccuracy: false, // 高精度は不要（天気情報は市区町村レベルで十分）
        timeout: 10000, // タイムアウト時間: 10秒
        maximumAge: 600000, // キャッシュの有効期限: 10分
      }
    );
  });
}
