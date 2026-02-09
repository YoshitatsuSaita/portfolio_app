// src/api/fdaApi.ts

import { FDAResponse, FDADetails } from "../types"; // 型定義をインポート

// OpenFDA APIのベースURL
const FDA_API_BASE_URL = "https://api.fda.gov/drug/label.json";

// タイムアウト時間（ミリ秒）
const TIMEOUT_MS = 5000; // 5秒

/**
 * OpenFDA APIで薬品名を検索する関数
 * @param name 検索する薬品名
 * @returns 検索結果の配列（FDADetails型）
 * @throws エラーメッセージ（ネットワークエラー、タイムアウト、レート制限超過時）
 */
export const searchDrugByName = async (name: string): Promise<FDADetails[]> => {
  // 薬品名をURLエンコード（スペースや特殊文字に対応）
  const encodedName = encodeURIComponent(name);

  // APIリクエストURL（商品名で部分一致検索、最大5件取得）
  const url = `${FDA_API_BASE_URL}?search=openfda.brand_name:"${encodedName}"&limit=5`;

  // AbortControllerを作成（タイムアウト制御用）
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS); // 5秒後にリクエストを中断

  try {
    // APIリクエストを送信
    const response = await fetch(url, {
      signal: controller.signal, // タイムアウト制御用のシグナル
      headers: {
        "Content-Type": "application/json", // JSONリクエストを指定
      },
    });

    // タイムアウトタイマーをクリア
    clearTimeout(timeoutId);

    // 404エラー（データが見つからない）の場合は空配列を返す
    if (response.status === 404) {
      return []; // 検索結果なし
    }

    // 429エラー（レート制限超過）の場合はエラーを投げる
    if (response.status === 429) {
      throw new Error("リクエスト制限に達しました。しばらくお待ちください。");
    }

    // その他のHTTPエラーの場合
    if (!response.ok) {
      throw new Error(`API通信エラー: ${response.status}`);
    }

    // レスポンスをJSON形式でパース
    const data: FDAResponse = await response.json();

    // 結果が存在しない場合は空配列を返す
    if (!data.results || data.results.length === 0) {
      return [];
    }

    // 取得したデータをFDADetails型に変換
    const fdaDetailsList: FDADetails[] = data.results.map((result) => ({
      brandName: result.openfda?.brand_name || undefined, // 商品名
      genericName: result.openfda?.generic_name || undefined, // 一般名
      manufacturerName: result.openfda?.manufacturer_name || undefined, // 製造元
      activeIngredient: result.active_ingredient || undefined, // 有効成分
      purpose: result.purpose || undefined, // 用途
      warnings: result.warnings || undefined, // 警告情報
      adverseReactions: result.adverse_reactions || undefined, // 副作用
      dosageAndAdministration: result.dosage_and_administration || undefined, // 使用方法
    }));

    return fdaDetailsList; // 変換したデータを返す
  } catch (error) {
    // タイムアウトタイマーをクリア
    clearTimeout(timeoutId);

    // タイムアウトエラーの場合
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        "リクエストがタイムアウトしました。もう一度お試しください。",
      );
    }

    // ネットワークエラーの場合
    if (error instanceof TypeError) {
      throw new Error(
        "通信エラーが発生しました。インターネット接続を確認してください。",
      );
    }

    // その他のエラーはそのまま投げる
    throw error;
  }
};
