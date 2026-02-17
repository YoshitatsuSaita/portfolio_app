import { WeatherData, OpenWeatherMapResponse } from "../types"; // 型定義をインポート

const API_BASE_URL = "/api/weather";

/**
 * Vercel Serverless Function 経由で天気情報を取得する関数
 * @param lat - 緯度（-90 〜 90の範囲、例: 35.6812 = 東京）
 * @param lon - 経度（-180 〜 180の範囲、例: 139.7671 = 東京）
 * @returns Promise<WeatherData> - 天気データオブジェクト
 * @throws Error - HTTP通信エラー、JSONパースエラー時
 */
export async function fetchWeatherData(
  lat: number, // 緯度
  lon: number, // 経度
): Promise<WeatherData> {
  try {
    // クエリパラメータに緯度・経度を付与して自サーバーにリクエスト
    // APIキーはサーバー側で付与されるためここには含めない
    const url = `${API_BASE_URL}?lat=${lat}&lon=${lon}`;

    // Fetch APIでHTTPリクエストを送信
    const response = await fetch(url);

    // HTTPステータスコードをチェック（200番台以外はエラー）
    if (!response.ok) {
      // 403: Referer不正、400: パラメータ不正、500: サーバーエラーなど
      throw new Error(
        `天気情報の取得に失敗しました: HTTP ${response.status} ${response.statusText}`,
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
    console.error("天気情報の取得に失敗しました:", error);

    // エラーを再スロー（呼び出し側でtry-catchしてハンドリング）
    throw error;
  }
}

/**
 * ブラウザのGeolocation APIを使って現在位置を取得する関数
 * @returns Promise<{ lat: number, lon: number }> - 緯度・経度のオブジェクト
 * @throws Error - Geolocation API非対応、ユーザーが拒否、タイムアウト時
 *
 * 使用例:
 * try {
 *   const position = await getCurrentPosition();
 *   console.log(`現在地: 緯度${position.lat}, 経度${position.lon}`);
 * } catch (error) {
 *   console.error('位置情報の取得に失敗:', error);
 * }
 */
export function getCurrentPosition(): Promise<{ lat: number; lon: number }> {
  // Promiseを返す（非同期処理）
  return new Promise((resolve, reject) => {
    // Geolocation APIがブラウザで使用可能かチェック
    if (!navigator.geolocation) {
      // 非対応の場合（古いブラウザなど）はエラーを返す
      reject(new Error("このブラウザは位置情報に対応していません"));
      return; // 早期リターン
    }

    // 位置情報を取得（非同期）
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // 成功時のコールバック
        // 緯度・経度のオブジェクトを返す
        resolve({
          lat: position.coords.latitude, // 緯度（例: 35.6812）
          lon: position.coords.longitude, // 経度（例: 139.7671）
        });
      },
      (error) => {
        // 失敗時のコールバック
        // ユーザーが拒否、タイムアウト、位置情報取得不可などの場合
        reject(new Error(`位置情報の取得に失敗しました: ${error.message}`));
      },
      {
        // オプション設定
        enableHighAccuracy: false, // 高精度は不要（天気情報は市区町村レベルで十分）
        timeout: 10000, // タイムアウト時間: 10秒（10000ミリ秒）
        maximumAge: 600000, // キャッシュの有効期限: 10分（600000ミリ秒）
        // キャッシュがある場合、10分以内なら再取得せずキャッシュを使用
      },
    );
  });
}
