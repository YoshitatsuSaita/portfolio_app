import { create } from "zustand"; // Zustandのcreate関数をインポート
import { WeatherData, WeatherSettings } from "../types"; // 型定義をインポート
import {
  fetchWeatherData as apiFetchWeatherData, // API関数（名前の衝突を避けるためエイリアス使用）
  getCurrentPosition, // 位置情報取得関数
} from "../api"; // APIフォルダからインポート
import {
  saveWeatherData, // 天気データの保存
  getLatestWeatherData, // 最新の天気データ取得
  getWeatherSettings, // 天気設定の取得
  saveWeatherSettings, // 天気設定の保存
  deleteOldWeatherData, // 古い天気データの削除
} from "../db/database"; // データベース操作関数をインポート
import { isWeatherDataStale } from "../utils/weatherUtils"; // データの鮮度チェック関数

// ストアの状態（State）の型定義
interface WeatherState {
  // ===== 状態（State） =====
  weatherData: WeatherData | null; // 最新の天気データ（未取得の場合はnull）
  weatherSettings: WeatherSettings; // 天気設定（enabled + lastFetchedAt のみ）
  loading: boolean; // データ取得中フラグ
  error: string | null; // エラーメッセージ（エラーがない場合はnull）

  // ===== アクション（Actions） =====
  fetchWeatherData: () => Promise<void>; // 天気データをAPIから取得してIndexedDBに保存
  loadSettings: () => Promise<void>; // IndexedDBから設定を読み込み
  updateSettings: (settings: Partial<WeatherSettings>) => Promise<void>; // 設定を更新してIndexedDBに保存
  loadLatestWeatherData: () => Promise<void>; // IndexedDBから最新の天気データを読み込み
  checkAndFetchWeatherIfNeeded: () => Promise<void>; // データが古い場合のみ天気を取得
  cleanupOldWeatherData: () => Promise<void>; // 古い天気データを削除（7日前より古いもの）
}

// Zustandストアの作成
export const useWeatherStore = create<WeatherState>((set, get) => ({
  // ===== 初期状態の定義 =====
  weatherData: null, // 天気データの初期値: null（未取得）
  weatherSettings: {
    // 天気設定のデフォルト値（簡略化: 2プロパティのみ）
    enabled: false, // 天気連携は初期状態でOFF
    lastFetchedAt: null, // 未取得
  },
  loading: false, // ローディング状態の初期値: false
  error: null, // エラー状態の初期値: null

  // ===== アクション: 天気データの取得 =====
  fetchWeatherData: async () => {
    set({ loading: true, error: null }); // ローディング開始、エラーをクリア

    try {
      // ステップ1: 位置情報を取得
      const position = await getCurrentPosition(); // Geolocation APIを使用して現在地を取得

      // ステップ2: APIから天気データを取得
      const weatherData = await apiFetchWeatherData(
        position.lat, // 緯度
        position.lon, // 経度
      ); // OpenWeatherMap APIを呼び出しWeatherData型のオブジェクトを返す

      // ステップ3: 取得した天気データをIndexedDBに保存
      await saveWeatherData(weatherData); // データベースのweatherDataテーブルに追加

      // ステップ4: 古い天気データを削除（7日前より古いもの）
      await deleteOldWeatherData(7); // 過去7日分のデータのみを保持

      // ステップ5: 状態を更新
      set({
        weatherData, // 取得した天気データを状態に保存
        loading: false, // ローディング終了
      });

      // ステップ6: 最終取得日時を設定に保存
      const currentSettings = get().weatherSettings; // 現在の設定を取得
      const updatedSettings: WeatherSettings = {
        ...currentSettings, // 既存の設定を展開
        lastFetchedAt: new Date().toISOString(), // 最終取得日時を現在時刻に更新
      };

      await saveWeatherSettings(updatedSettings); // IndexedDBに保存

      set({ weatherSettings: updatedSettings }); // 状態も更新
    } catch (error) {
      console.error("天気データの取得に失敗しました:", error); // コンソールにエラーを出力

      set({
        error:
          error instanceof Error
            ? error.message // Errorオブジェクトの場合はメッセージを使用
            : "天気データの取得に失敗しました", // その他の場合はデフォルトメッセージ
        loading: false, // ローディング終了
      });
    }
  },

  // ===== アクション: 設定の読み込み =====
  loadSettings: async () => {
    try {
      const settings = await getWeatherSettings(); // IndexedDBから天気設定を取得（デフォルト値付き）
      set({ weatherSettings: settings }); // 状態を更新
    } catch (error) {
      console.error("設定の読み込みに失敗しました:", error); // コンソールにエラーを出力
      // エラーが発生してもデフォルト値を使用（アプリの動作を継続）
    }
  },

  // ===== アクション: 設定の更新 =====
  updateSettings: async (updates: Partial<WeatherSettings>) => {
    try {
      const currentSettings = get().weatherSettings; // 現在の設定を取得

      const newSettings: WeatherSettings = {
        ...currentSettings, // 既存の設定を展開
        ...updates, // 更新内容で上書き
      };

      await saveWeatherSettings(newSettings); // IndexedDBに保存
      set({ weatherSettings: newSettings }); // 状態を更新
    } catch (error) {
      console.error("設定の更新に失敗しました:", error); // コンソールにエラーを出力

      set({
        error:
          error instanceof Error
            ? error.message // Errorオブジェクトの場合はメッセージを使用
            : "設定の更新に失敗しました", // その他の場合はデフォルトメッセージ
      });
    }
  },

  // ===== アクション: 最新の天気データの読み込み =====
  loadLatestWeatherData: async () => {
    try {
      const latestData = await getLatestWeatherData(); // IndexedDBから最新の天気データを取得

      if (latestData) {
        // データが存在する場合のみ状態を更新
        set({ weatherData: latestData });
      }
    } catch (error) {
      console.error("天気データの読み込みに失敗しました:", error); // コンソールにエラーを出力
      // エラーが発生してもアプリの動作を継続（weatherDataはnullのまま）
    }
  },

  // ===== アクション: 必要に応じて天気データを取得 =====
  checkAndFetchWeatherIfNeeded: async () => {
    try {
      const settings = get().weatherSettings; // 現在の天気設定を取得

      if (!settings.enabled) {
        // 天気連携が無効の場合は何もしない
        return;
      }

      if (!settings.lastFetchedAt) {
        // 最終取得日時が存在しない場合（初回）
        await get().fetchWeatherData(); // 天気データを取得
        return;
      }

      const isStale = isWeatherDataStale(settings.lastFetchedAt, 6); // 6時間を基準に鮮度チェック

      if (isStale) {
        // データが古い場合（6時間以上経過）
        await get().fetchWeatherData(); // APIから再取得
      } else {
        // データが新しい場合
        await get().loadLatestWeatherData(); // IndexedDBから読み込むのみ
      }
    } catch (error) {
      console.error("天気データのチェックに失敗しました:", error); // コンソールにエラーを出力
      // エラーが発生してもアプリの動作を継続
    }
  },

  // ===== アクション: 古い天気データの削除 =====
  cleanupOldWeatherData: async () => {
    try {
      await deleteOldWeatherData(7); // 7日前より古い天気データを削除
    } catch (error) {
      console.error("古いデータの削除に失敗しました:", error); // コンソールにエラーを出力
      // エラーが発生してもアプリの動作を継続
    }
  },
}));
