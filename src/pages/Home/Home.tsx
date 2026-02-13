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
        await getCurrentPosition(); // ブラウザの位置情報パーミッションを確認・取得
        await updateSettings({ enabled: true }); // 位置情報が許可されたら天気連携を有効化
        await fetchWeatherData(); // 天気データを即座に取得
      } catch {
        // 位置情報の取得に失敗した場合（ユーザーが拒否、またはAPI不対応）
        setLocationError(
          "位置情報の取得に失敗しました。ブラウザの設定を確認してください。",
        );
      }
    } else {
      // ON → OFFにする場合: 単純にフラグを無効化
      await updateSettings({ enabled: false });
    }
  };

  // 天気データ手動取得ハンドラー
  const handleFetchWeather = async () => {
    setLocationError(null); // 前回のエラーメッセージをクリア
    await fetchWeatherData(); // APIから天気データを再取得
  };

  // 最終取得日時のフォーマット関数（相対時間表示）
  const formatLastFetched = (dateStr: string | null): string => {
    if (!dateStr) return "未取得"; // 未取得の場合はそのまま表示

    const now = new Date(); // 現在時刻を取得
    const fetched = new Date(dateStr); // 最終取得日時をDateオブジェクトに変換
    const diffMs = now.getTime() - fetched.getTime(); // 差分をミリ秒で計算
    const diffMinutes = Math.floor(diffMs / (1000 * 60)); // 分に変換

    if (diffMinutes < 1) return "たった今"; // 1分未満
    if (diffMinutes < 60) return `${diffMinutes}分前`; // 60分未満
    const diffHours = Math.floor(diffMinutes / 60); // 時間に変換
    if (diffHours < 24) return `${diffHours}時間前`; // 24時間未満
    const diffDays = Math.floor(diffHours / 24); // 日数に変換
    return `${diffDays}日前`; // 24時間以上
  };

  return (
    <div className="home">
      {" "}
      {/* ホーム画面全体のコンテナ */}
      {/* 天気設定セクション */}
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
            <span className="home-weather-label-text">
              天気情報を取得し、薬品の状態を管理する
            </span>{" "}
            {/* ラベルテキスト */}
          </label>
        </div>
        {/* 位置情報エラーメッセージの表示（エラーがある場合のみ） */}
        {locationError && (
          <div className="home-weather-error">
            {" "}
            {/* エラー表示コンテナ */}
            {locationError} {/* エラー文言 */}
          </div>
        )}
        {/* ストアレベルのエラーメッセージ表示（エラーがある場合のみ） */}
        {error && (
          <div className="home-weather-error">
            {" "}
            {/* エラー表示コンテナ */}
            {error} {/* エラー文言 */}
          </div>
        )}
        {/* 天気連携が有効 かつ 天気データが存在する場合のみ天気情報カードを表示 */}
        {weatherSettings.enabled && weatherData && (
          <div className="home-weather-info">
            {" "}
            {/* 天気情報カード全体のコンテナ（2カラムレイアウト） */}
            <div className="home-weather-info-left">
              {" "}
              {/* 左列: 天気データ（アイコン・気温・湿度・最終取得日時） */}
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
                <div>
                  <button
                    className="home-weather-fetch-btn" // 固有スタイル
                    onClick={handleFetchWeather} // クリック時にAPIから天気を再取得
                    disabled={loading} // 取得中はボタンを無効化（二重送信防止）
                  >
                    {"🔁"}
                  </button>
                </div>
              </div>
              <p className="home-weather-last-updated">
                {" "}
                {/* 最終取得日時の表示 */}
                最終取得: {formatLastFetched(
                  weatherSettings.lastFetchedAt,
                )}{" "}
                {/* 相対時間にフォーマットして表示 */}
              </p>
            </div>
            <div className="home-weather-info-right">
              {" "}
              {/* 右列: 警告/良好バナー（インラインモードで埋め込み） */}
              <WeatherAlert
                weather={weatherData} // 天気データを渡す
                settings={weatherSettings} // 天気設定を渡す
                inline // インラインモードを有効化（カード内表示用スタイルを適用）
              />
            </div>
          </div>
        )}
      </section>
      <h1>今日の処方箋</h1> {/* ページタイトル */}
      {/* 今日の服用予定リスト - dateプロパティ未指定で今日の予定を表示 */}
      <ScheduleList />
    </div>
  );
}

export default Home; // 他ファイルからインポート可能にエクスポート
