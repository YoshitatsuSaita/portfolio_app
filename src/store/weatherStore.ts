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
  weatherSettings: WeatherSettings; // 天気設定（常に存在、デフォルト値あり）
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
    // 天気設定のデフォルト値
    enabled: false, // 天気連携は初期状態でOFF
    highTempThreshold: 30, // 高温警告の基準: 30度
    highHumidityThreshold: 80, // 高湿度警告の基準: 80%
    notifyHighTemp: true, // 高温通知はON
    notifyHighHumidity: true, // 高湿度通知はON
    lastFetchedAt: null, // 未取得
  },
  loading: false, // ローディング状態の初期値: false
  error: null, // エラー状態の初期値: null

  // ===== アクション: 天気データの取得 =====
  fetchWeatherData: async () => {
    // ローディング開始、エラーをクリア
    set({ loading: true, error: null });

    try {
      // ステップ1: 位置情報を取得
      const position = await getCurrentPosition();
      // getCurrentPosition()はGeolocation APIを使用
      // 成功時: { lat: 35.6812, lon: 139.7671 } のような形式
      // 失敗時: エラーをスロー（catchブロックで処理）

      // ステップ2: APIから天気データを取得
      const weatherData = await apiFetchWeatherData(
        position.lat, // 緯度
        position.lon, // 経度
      );
      // apiFetchWeatherData()はOpenWeatherMap APIを呼び出し
      // WeatherData型のオブジェクトを返す

      // ステップ3: 取得した天気データをIndexedDBに保存
      await saveWeatherData(weatherData);
      // データベースのweatherDataテーブルに追加

      // ステップ4: 古い天気データを削除（7日前より古いもの）
      await deleteOldWeatherData(7);
      // 過去7日分のデータのみを保持

      // ステップ5: 状態を更新
      set({
        weatherData, // 取得した天気データを状態に保存
        loading: false, // ローディング終了
      });

      // ステップ6: 最終取得日時を設定に保存
      const currentSettings = get().weatherSettings; // 現在の設定を取得
      await saveWeatherSettings({
        ...currentSettings, // 既存の設定を展開
        lastFetchedAt: new Date().toISOString(), // 最終取得日時を現在時刻に更新
      });

      // 設定の状態も更新
      set({
        weatherSettings: {
          ...currentSettings, // 既存の設定を展開
          lastFetchedAt: new Date().toISOString(), // 最終取得日時を更新
        },
      });
    } catch (error) {
      // エラー発生時の処理
      console.error("天気データの取得に失敗しました:", error); // コンソールにエラーを出力

      // エラーメッセージを状態に保存
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
      // IndexedDBから天気設定を取得
      const settings = await getWeatherSettings();
      // getWeatherSettings()はデフォルト値を持つため、常に設定が返される

      // 状態を更新
      set({ weatherSettings: settings });
    } catch (error) {
      // エラー発生時の処理
      console.error("設定の読み込みに失敗しました:", error); // コンソールにエラーを出力

      // エラーが発生してもデフォルト値を使用（アプリの動作を継続）
      // set()は呼ばない（初期値のまま）
    }
  },

  // ===== アクション: 設定の更新 =====
  updateSettings: async (updates: Partial<WeatherSettings>) => {
    try {
      // 現在の設定を取得
      const currentSettings = get().weatherSettings;

      // 新しい設定を作成（既存の設定 + 更新内容）
      const newSettings: WeatherSettings = {
        ...currentSettings, // 既存の設定を展開
        ...updates, // 更新内容で上書き
      };

      // IndexedDBに保存
      await saveWeatherSettings(newSettings);

      // 状態を更新
      set({ weatherSettings: newSettings });
    } catch (error) {
      // エラー発生時の処理
      console.error("設定の更新に失敗しました:", error); // コンソールにエラーを出力

      // エラーメッセージを状態に保存
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
      // IndexedDBから最新の天気データを取得
      const latestData = await getLatestWeatherData();
      // getLatestWeatherData()はtimestampでソートして最新のデータを返す
      // データが存在しない場合はundefined

      // データが存在する場合のみ状態を更新
      if (latestData) {
        set({ weatherData: latestData });
      }
    } catch (error) {
      // エラー発生時の処理
      console.error("天気データの読み込みに失敗しました:", error); // コンソールにエラーを出力

      // エラーが発生してもアプリの動作を継続（weatherDataはnullのまま）
      // set()は呼ばない
    }
  },

  // ===== アクション: 必要に応じて天気データを取得 =====
  checkAndFetchWeatherIfNeeded: async () => {
    try {
      // 現在の天気設定を取得
      const settings = get().weatherSettings;

      // 天気連携が無効の場合は何もしない
      if (!settings.enabled) {
        return; // 早期リターン
      }

      // 最終取得日時が存在しない場合（初回）
      if (!settings.lastFetchedAt) {
        // 天気データを取得
        await get().fetchWeatherData();
        return; // 処理完了
      }

      // 最終取得日時からの経過時間をチェック
      const isStale = isWeatherDataStale(settings.lastFetchedAt, 6); // 6時間を基準

      // データが古い場合（6時間以上経過）
      if (isStale) {
        // 天気データを取得
        await get().fetchWeatherData();
      } else {
        // データが新しい場合はIndexedDBから読み込むのみ
        await get().loadLatestWeatherData();
      }
    } catch (error) {
      // エラー発生時の処理
      console.error("天気データのチェックに失敗しました:", error); // コンソールにエラーを出力

      // エラーが発生してもアプリの動作を継続
      // set()は呼ばない
    }
  },

  // ===== アクション: 古い天気データの削除 =====
  cleanupOldWeatherData: async () => {
    try {
      // 7日前より古い天気データを削除
      await deleteOldWeatherData(7);
      // deleteOldWeatherData()は削除された件数を返すが、ここでは使用しない
    } catch (error) {
      // エラー発生時の処理
      console.error("古いデータの削除に失敗しました:", error); // コンソールにエラーを出力

      // エラーが発生してもアプリの動作を継続
      // set()は呼ばない
    }
  },
}));
