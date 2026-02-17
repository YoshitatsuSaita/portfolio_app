import type { VercelRequest, VercelResponse } from "@vercel/node"; // Vercelの型定義をインポート

// 許可するRefererのドメインリスト（本番URL・開発環境を列挙）
const ALLOWED_ORIGINS = [
  "https://portfolio-app-two-gamma.vercel.app/", // 本番URL
  "http://localhost:5173", // Vite開発サーバーのデフォルトポート
];

// Vercel Serverless Functionのエントリーポイント
// GETリクエストで lat と lon をクエリパラメータとして受け取る
export default async function handler(
  req: VercelRequest, // リクエストオブジェクト
  res: VercelResponse, // レスポンスオブジェクト
) {
  // GETメソッド以外のリクエストを拒否（405 Method Not Allowed）
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // --- Refererヘッダーの検証 ---
  const referer = req.headers["referer"] || ""; // Refererヘッダーを取得（未設定時は空文字）

  // ALLOWED_ORIGINSのいずれかのドメインがRefererに含まれているか確認
  const isAllowed = ALLOWED_ORIGINS.some(
    (origin) => referer.startsWith(origin), // Refererが許可ドメインで始まるかチェック
  );

  // 許可されていないRefererの場合は403エラーを返す
  if (!isAllowed) {
    return res.status(403).json({ error: "Forbidden: invalid referer" });
  }

  // --- クエリパラメータの検証 ---
  const { lat, lon } = req.query; // URLクエリパラメータから緯度・経度を取得

  // lat・lonが未指定またはstring型でない場合は400エラー
  if (!lat || !lon || typeof lat !== "string" || typeof lon !== "string") {
    return res.status(400).json({ error: "lat と lon は必須パラメータです" });
  }

  // 数値に変換できるか検証（例: "abc" などの不正値を弾く）
  const latNum = parseFloat(lat); // 文字列を浮動小数点数に変換
  const lonNum = parseFloat(lon);

  // NaN（変換失敗）または範囲外の値を拒否
  if (
    isNaN(latNum) ||
    isNaN(lonNum) || // 数値に変換できない場合
    latNum < -90 ||
    latNum > 90 || // 緯度の有効範囲: -90 〜 90
    lonNum < -180 ||
    lonNum > 180 // 経度の有効範囲: -180 〜 180
  ) {
    return res.status(400).json({ error: "lat または lon の値が不正です" });
  }

  // --- OpenWeatherMap API の呼び出し ---
  // APIキーはサーバー側の環境変数から取得（ブラウザには公開されない）
  const API_KEY = process.env.OPENWEATHER_API_KEY;

  // APIキーが設定されていない場合は500エラー
  if (!API_KEY) {
    return res.status(500).json({ error: "APIキーが設定されていません" });
  }

  try {
    // OpenWeatherMap APIのエンドポイントURLを構築
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latNum}&lon=${lonNum}&appid=${API_KEY}&units=metric&lang=ja`;

    // サーバー側からOpenWeatherMap APIにリクエストを送信
    const response = await fetch(url);

    // OpenWeatherMap APIがエラーを返した場合はそのステータスをそのまま返す
    if (!response.ok) {
      return res.status(response.status).json({
        error: `OpenWeatherMap API エラー: ${response.statusText}`,
      });
    }

    // レスポンスをJSONとして取得
    const data = await response.json();

    // 取得したデータをフロントエンドに返す（200 OK）
    return res.status(200).json(data);
  } catch (error) {
    // 予期しないエラー（ネットワーク障害など）は500エラーとして返す
    console.error("Weather API エラー:", error);
    return res.status(500).json({ error: "サーバー内部エラーが発生しました" });
  }
}
