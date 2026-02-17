// Vercel Functions の型定義をインポート
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Vercel Function のエントリーポイント（デフォルトエクスポートが必須）
export default async function handler(
  req: VercelRequest, // クライアントからのリクエスト情報
  res: VercelResponse, // クライアントへのレスポンス
) {
  // GETリクエスト以外は許可しない
  if (req.method !== "GET") {
    // 405 Method Not Allowed を返す
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // リクエストのクエリパラメータから緯度・経度を取得
  const { lat, lon } = req.query;

  // 緯度・経度が未指定の場合はエラーを返す
  if (!lat || !lon) {
    // 400 Bad Request を返す
    return res.status(400).json({ error: "lat と lon は必須パラメータです" });
  }

  // サーバー側の環境変数からAPIキーを取得（ブラウザには公開されない）
  const API_KEY = process.env.OPENWEATHER_API_KEY;

  // APIキーが未設定の場合はエラーを返す
  if (!API_KEY) {
    // 500 Internal Server Error を返す
    return res.status(500).json({ error: "APIキーが設定されていません" });
  }

  // OpenWeatherMap へのリクエストURLを構築（APIキーはここにのみ存在する）
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ja`;

  try {
    // サーバー側から OpenWeatherMap へリクエストを送信
    const response = await fetch(url);

    // OpenWeatherMap からのレスポンスが失敗した場合はエラーを返す
    if (!response.ok) {
      // OpenWeatherMap のステータスコードをそのままクライアントに返す
      return res.status(response.status).json({
        error: `OpenWeatherMap APIエラー: ${response.status} ${response.statusText}`,
      });
    }

    // レスポンスボディをJSONとしてパース
    const data = await response.json();

    // 取得したデータをクライアントへそのまま返す
    // weatherAPI.ts 側で WeatherData 型への変換を行う
    return res.status(200).json(data);
  } catch (error) {
    // 通信エラーなど予期しないエラーをキャッチ
    console.error("天気情報の取得に失敗しました:", error);

    // 500 Internal Server Error を返す
    return res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
}
