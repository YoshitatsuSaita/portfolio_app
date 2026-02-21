import type { VercelRequest, VercelResponse } from "@vercel/node";

// Vercel Function のエントリーポイント（デフォルトエクスポートが必須）
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: "lat と lon は必須パラメータです" });
  }

  // サーバー側の環境変数からAPIキーを取得（ブラウザには公開されない）
  const API_KEY = process.env.OPENWEATHER_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "APIキーが設定されていません" });
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ja`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      // OpenWeatherMap のステータスコードをそのままクライアントに返す
      return res.status(response.status).json({
        error: `OpenWeatherMap APIエラー: ${response.status} ${response.statusText}`,
      });
    }

    const data = await response.json();

    // weatherAPI.ts 側で WeatherData 型への変換を行うため、データはそのまま返す
    return res.status(200).json(data);
  } catch (error) {
    console.error("天気情報の取得に失敗しました:", error);
    return res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
}
