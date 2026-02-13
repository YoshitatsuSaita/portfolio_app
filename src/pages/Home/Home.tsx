// src/pages/Home/Home.tsx

import { useEffect, useState } from "react"; // useEffect・useStateフックをインポート
import ScheduleList from "../../components/ScheduleList/ScheduleList"; // 服用予定リストコンポーネントをインポート
import WeatherAlert from "../../components/WeatherAlert/WeatherAlert"; // 天気警告バナーコンポーネントをインポート
import { useWeatherStore } from "../../store/weatherStore"; // Zustand天気ストアをインポート
import { getWeatherIcon } from "../../utils/weatherUtils"; // 天気概要から絵文字アイコンを取得するユーティリティ関数をインポート
import "./Home.css"; // ホーム画面用CSSをインポート

// ホーム画面コンポーネント - 今日の服用予定・天気警告・天気設定を一画面に統合
function Home() {
  // Zustand天気ストアから状態とアクションを取得
  const {
    weatherData, // 最新の天気データ（APIから取得済みのもの）
    weatherSettings, // 天気連携の設定オブジェクト（enabled, thresholds等）
    loading, // 天気データ取得中のローディングフラグ
    error, // ストアレベルのエラーメッセージ
    updateSettings, // 設定を部分的に更新しIndexedDBに保存する関数
    fetchWeatherData, // APIから天気データを取得する関数
    checkAndFetchWeatherIfNeeded, // 6時間以上経過時のみ天気を自動取得する関数
    loadSettings, // IndexedDBから天気設定を読み込む関数
    loadLatestWeatherData, // IndexedDBから最新の天気データを読み込む関数
  } = useWeatherStore();

  // ローカル状態: 位置情報取得失敗時のエラーメッセージを管理
  const [locationError, setLocationError] = useState<string | null>(null);

  // コンポーネントマウント時に天気関連データを初期化
  useEffect(() => {
    loadSettings().then(() => {
      // まずIndexedDBから設定を読み込む
      loadLatestWeatherData(); // 設定読み込み後、保存済みの天気データを復元
      checkAndFetchWeatherIfNeeded(); // 6時間以上経過していればAPIから再取得
    });
  }, []); // 空の依存配列: マウント時に1回だけ実行

  // 天気連携のON/OFF切り替えハンドラー（Settings.tsxから移植）
  const handleToggleEnabled = async () => {
    setLocationError(null); // 前回のエラーメッセージをクリア

    if (!weatherSettings.enabled) {
      // OFF → ONにする場合: 位置情報の許可が必要
      try {
        const { getCurrentPosition } = await import("../../api"); // 位置情報API関数を動的インポート
        await getCurrentPosition(); // ブラウザの位置情報許可ダイアログを表示・取得を試行
        await updateSettings({ enabled: true }); // 許可が得られたら天気連携を有効化
        await fetchWeatherData(); // 有効化直後にAPIから天気データを取得
      } catch (err) {
        // 位置情報の取得に失敗した場合（ユーザー拒否・タイムアウト等）
        setLocationError(
          "位置情報の取得に失敗しました。ブラウザの設定を確認してください。",
        );
        console.error("位置情報エラー:", err); // デバッグ用にコンソール出力
      }
    } else {
      // ON → OFFにする場合: 単純に無効化
      await updateSettings({ enabled: false }); // 天気連携を無効化してIndexedDBに保存
    }
  };

  // 手動で天気データを再取得するハンドラー（Settings.tsxから移植）
  const handleFetchWeather = async () => {
    setLocationError(null); // 前回のエラーメッセージをクリア
    try {
      await fetchWeatherData(); // APIから天気データを取得
    } catch (err) {
      // 取得失敗時のエラーハンドリング
      setLocationError("天気の取得に失敗しました。もう一度お試しください。");
      console.error("天気取得エラー:", err); // デバッグ用にコンソール出力
    }
  };

  // 最終取得日時を「○時間○分前」形式にフォーマットする関数（Settings.tsxから移植）
  const formatLastFetched = (timestamp: string | null): string => {
    if (!timestamp) return "未取得"; // nullの場合は「未取得」と表示

    const date = new Date(timestamp); // ISO文字列をDateオブジェクトに変換
    const now = new Date(); // 現在時刻を取得
    const diff = now.getTime() - date.getTime(); // 経過ミリ秒を計算
    const hours = Math.floor(diff / (1000 * 60 * 60)); // ミリ秒を時間に変換（切り捨て）
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)); // 残りを分に変換（切り捨て）

    if (hours > 0) {
      return `${hours}時間${minutes}分前`; // 1時間以上経過: 例「2時間15分前」
    } else if (minutes > 0) {
      return `${minutes}分前`; // 1時間未満: 例「30分前」
    } else {
      return "たった今"; // 1分未満
    }
  };

  return (
    <div className="home">
      {" "}
      {/* ホーム画面全体のコンテナ */}
      <h1>今日の服用予定</h1> {/* ページメインタイトル */}
      {/* 天気設定セクション（Settings.tsxから統合） */}
      <section className="home-weather-section">
        {" "}
        {/* 天気連携の有効/無効トグル */}
        <div className="home-weather-toggle">
          {" "}
          {/* トグル行のコンテナ */}
          <label className="home-weather-label">
            {" "}
            {/* チェックボックス＋ラベルを囲むlabel要素 */}
            <input
              type="checkbox" // チェックボックスとして表示
              checked={weatherSettings.enabled} // ストアの現在値を反映
              onChange={handleToggleEnabled} // 切り替え時にハンドラーを実行
              className="home-weather-checkbox" // スタイル用クラス
            />
            <span className="home-weather-label-text">天気情報を使用する</span>{" "}
            {/* ラベルテキスト */}
          </label>
        </div>
        {/* 位置情報エラーメッセージの表示（エラーがある場合のみ） */}
        {locationError && (
          <div className="home-weather-error">
            {" "}
            {/* エラー表示コンテナ */}
            ⚠️ {locationError} {/* 警告アイコン＋エラー文言 */}
          </div>
        )}
        {/* ストアレベルのエラーメッセージ表示（エラーがある場合のみ） */}
        {error && (
          <div className="home-weather-error">
            {" "}
            {/* エラー表示コンテナ */}
            ⚠️ {error} {/* 警告アイコン＋エラー文言 */}
          </div>
        )}
        {/* 天気連携が有効 かつ 天気データが存在する場合のみ天気情報カードを表示 */}
        {weatherSettings.enabled && weatherData && (
          <div className="home-weather-info">
            {" "}
            {/* 天気情報カード全体のコンテナ */}
            <div className="home-weather-info-header">
              {" "}
              {/* カードヘッダー部（アイコン＋概要） */}
              <span className="home-weather-icon">
                {" "}
                {/* 天気絵文字アイコン */}
                {getWeatherIcon(weatherData.description)}{" "}
                {/* 天気概要テキストから対応する絵文字を取得 */}
              </span>
              <span className="home-weather-description">
                {" "}
                {/* 天気概要テキスト（例: 「晴れ」「曇り」） */}
                {weatherData.description}
              </span>
            </div>
            <div className="home-weather-info-details">
              {" "}
              {/* 気温・湿度の詳細表示エリア */}
              <div className="home-weather-detail">
                {" "}
                {/* 気温表示ブロック */}
                <span className="home-weather-detail-label">気温:</span>{" "}
                {/* ラベル */}
                <span className="home-weather-detail-value">
                  {weatherData.temperature}度
                </span>{" "}
                {/* 値 */}
              </div>
              <div className="home-weather-detail">
                {" "}
                {/* 湿度表示ブロック */}
                <span className="home-weather-detail-label">湿度:</span>{" "}
                {/* ラベル */}
                <span className="home-weather-detail-value">
                  {weatherData.humidity}%
                </span>{" "}
                {/* 値 */}
              </div>
            </div>
            <p className="home-weather-last-updated">
              {" "}
              {/* 最終取得日時の表示 */}
              最終取得: {formatLastFetched(weatherSettings.lastFetchedAt)}{" "}
              {/* 相対時間にフォーマットして表示 */}
            </p>
          </div>
        )}
        {/* 天気連携が有効な場合のみ手動更新ボタンを表示 */}
        {weatherSettings.enabled && (
          <button
            className="btn btn-primary home-weather-fetch-btn" // プライマリボタン＋固有スタイル
            onClick={handleFetchWeather} // クリック時にAPIから天気を再取得
            disabled={loading} // 取得中はボタンを無効化（二重送信防止）
          >
            {loading ? "取得中..." : "天気を今すぐ取得"}{" "}
            {/* ローディング状態に応じてテキストを切り替え */}
          </button>
        )}
      </section>
      {/* 天気警告バナー（既存） - 閾値超過時に警告メッセージを表示 */}
      <WeatherAlert weather={weatherData} settings={weatherSettings} />
      {/* 今日の服用予定リスト（既存） - dateプロパティ未指定で今日の予定を表示 */}
      <ScheduleList />
    </div>
  );
}

export default Home; // 他ファイルからインポート可能にエクスポート
