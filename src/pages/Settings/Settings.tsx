// src/pages/Settings/Settings.tsx

import { useEffect, useState } from "react"; // Reactフックをインポート
import { useWeatherStore } from "../../store/weatherStore"; // 天気ストアをインポート
import { getWeatherIcon } from "../../utils/weatherUtils"; // 天気アイコン取得関数をインポート
import "./Settings.css"; // CSSをインポート

// 設定画面コンポーネント - 天気連携の設定を管理
function Settings() {
  // Zustandストアから状態とアクションを取得
  const {
    weatherData, // 最新の天気データ
    weatherSettings, // 天気設定
    loading, // ローディング状態
    error, // エラーメッセージ
    updateSettings, // 設定更新関数
    fetchWeatherData, // 天気データ取得関数
    loadSettings, // 設定読み込み関数
  } = useWeatherStore();

  // ローカル状態: 位置情報エラーメッセージ
  const [locationError, setLocationError] = useState<string | null>(null);

  // コンポーネントのマウント時に設定を読み込む
  useEffect(() => {
    loadSettings(); // IndexedDBから設定を読み込み
  }, []); // 依存配列が空なので、マウント時に1回だけ実行

  // 天気連携のON/OFF切り替え処理
  const handleToggleEnabled = async () => {
    setLocationError(null); // エラーメッセージをクリア

    if (!weatherSettings.enabled) {
      // OFFからONにする場合
      try {
        // 位置情報の許可を確認
        // getCurrentPosition()を呼ぶことで、ブラウザが位置情報の許可ダイアログを表示
        const { getCurrentPosition } = await import("../../api");
        await getCurrentPosition(); // 位置情報の取得を試行（許可の確認）

        // 許可が得られたら設定を更新
        await updateSettings({ enabled: true }); // 天気連携を有効化

        // 即座に天気データを取得
        await fetchWeatherData(); // APIから天気を取得
      } catch (err) {
        // 位置情報の取得に失敗した場合（ユーザーが拒否、タイムアウトなど）
        setLocationError(
          "位置情報の取得に失敗しました。ブラウザの設定を確認してください。",
        );
        console.error("位置情報エラー:", err); // コンソールにエラーを出力
      }
    } else {
      // ONからOFFにする場合
      await updateSettings({ enabled: false }); // 天気連携を無効化
    }
  };

  // 高温警告基準の変更処理
  const handleTempThresholdChange = async (value: number) => {
    await updateSettings({ highTempThreshold: value }); // 基準温度を更新
  };

  // 高湿度警告基準の変更処理
  const handleHumidityThresholdChange = async (value: number) => {
    await updateSettings({ highHumidityThreshold: value }); // 基準湿度を更新
  };

  // 高温通知のON/OFF切り替え処理
  const handleToggleHighTempNotify = async () => {
    await updateSettings({ notifyHighTemp: !weatherSettings.notifyHighTemp }); // 現在の状態を反転
  };

  // 高湿度通知のON/OFF切り替え処理
  const handleToggleHighHumidityNotify = async () => {
    await updateSettings({
      notifyHighHumidity: !weatherSettings.notifyHighHumidity, // 現在の状態を反転
    });
  };

  // 手動で天気を取得する処理
  const handleFetchWeather = async () => {
    setLocationError(null); // エラーメッセージをクリア
    try {
      await fetchWeatherData(); // APIから天気を取得
    } catch (err) {
      // エラー発生時
      setLocationError("天気の取得に失敗しました。もう一度お試しください。");
      console.error("天気取得エラー:", err); // コンソールにエラーを出力
    }
  };

  // 最終取得日時をフォーマットする関数
  const formatLastFetched = (timestamp: string | null): string => {
    if (!timestamp) return "未取得"; // 未取得の場合

    const date = new Date(timestamp); // Dateオブジェクトに変換
    const now = new Date(); // 現在時刻

    // 経過時間を計算（ミリ秒）
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60)); // 時間単位に変換
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)); // 分単位に変換

    // 相対時間で表示（例: "2時間15分前"）
    if (hours > 0) {
      return `${hours}時間${minutes}分前`;
    } else if (minutes > 0) {
      return `${minutes}分前`;
    } else {
      return "たった今";
    }
  };

  return (
    <div className="settings">
      {" "}
      {/* 設定画面全体のコンテナ */}
      <h1>設定</h1> {/* ページタイトル */}
      {/* 天気連携セクション */}
      <section className="settings-section">
        {" "}
        {/* セクションのコンテナ */}
        <h2>天気連携</h2> {/* セクションタイトル */}
        {/* 天気連携の有効/無効切り替え */}
        <div className="setting-item">
          {" "}
          {/* 設定項目のコンテナ */}
          <label className="setting-label">
            {" "}
            {/* ラベル */}
            <input
              type="checkbox" // チェックボックス
              checked={weatherSettings.enabled} // 現在の状態
              onChange={handleToggleEnabled} // 変更時の処理
              className="setting-checkbox" // スタイル用クラス
            />
            <span className="setting-label-text">天気情報を使用する</span>{" "}
            {/* ラベルテキスト */}
          </label>
          <p className="setting-description">
            {" "}
            {/* 説明文 */}
            薬の保管環境に関する警告を表示します。位置情報の許可が必要です。
          </p>
        </div>
        {/* 位置情報エラーの表示 */}
        {locationError && ( // locationErrorが存在する場合のみ表示
          <div className="error-message">
            {" "}
            {/* エラーメッセージのコンテナ */}⚠️ {locationError}{" "}
            {/* エラーメッセージ */}
          </div>
        )}
        {/* ストアのエラーメッセージ表示 */}
        {error && ( // errorが存在する場合のみ表示
          <div className="error-message">
            {" "}
            {/* エラーメッセージのコンテナ */}⚠️ {error}{" "}
            {/* エラーメッセージ */}
          </div>
        )}
        {/* 天気連携が有効な場合のみ以下を表示 */}
        {weatherSettings.enabled && (
          <>
            {/* 現在の天気情報表示 */}
            {weatherData && ( // weatherDataが存在する場合のみ表示
              <div className="weather-info">
                {" "}
                {/* 天気情報のコンテナ */}
                <div className="weather-info-header">
                  {" "}
                  {/* ヘッダー部分 */}
                  <span className="weather-icon">
                    {" "}
                    {/* 天気アイコン */}
                    {getWeatherIcon(weatherData.description)}{" "}
                    {/* 天気概要から絵文字を取得 */}
                  </span>
                  <span className="weather-description">
                    {" "}
                    {/* 天気概要 */}
                    {weatherData.description}
                  </span>
                </div>
                <div className="weather-info-details">
                  {" "}
                  {/* 詳細情報 */}
                  <div className="weather-detail">
                    {" "}
                    {/* 気温 */}
                    <span className="weather-detail-label">気温:</span>
                    <span className="weather-detail-value">
                      {weatherData.temperature}度
                    </span>
                  </div>
                  <div className="weather-detail">
                    {" "}
                    {/* 湿度 */}
                    <span className="weather-detail-label">湿度:</span>
                    <span className="weather-detail-value">
                      {weatherData.humidity}%
                    </span>
                  </div>
                </div>
                <p className="weather-last-updated">
                  {" "}
                  {/* 最終取得日時 */}
                  最終取得: {formatLastFetched(weatherSettings.lastFetchedAt)}
                </p>
              </div>
            )}
            {/* 手動更新ボタン */}
            <div className="setting-item">
              {" "}
              {/* 設定項目のコンテナ */}
              <button
                className="btn btn-primary" // プライマリボタンスタイル
                onClick={handleFetchWeather} // クリック時の処理
                disabled={loading} // ローディング中は無効化
              >
                {loading ? "取得中..." : "天気を今すぐ取得"}{" "}
                {/* ボタンテキスト */}
              </button>
            </div>
            {/* 警告設定 */}
            <h3 className="subsection-title">警告設定</h3>{" "}
            {/* サブセクションタイトル */}
            {/* 高温警告の基準温度設定 */}
            <div className="setting-item">
              {" "}
              {/* 設定項目のコンテナ */}
              <label className="setting-label-text">
                {" "}
                {/* ラベル */}
                高温警告の基準温度: {weatherSettings.highTempThreshold}度
              </label>
              <input
                type="range" // スライダー
                min="25" // 最小値
                max="40" // 最大値
                step="1" // ステップ（1度刻み）
                value={weatherSettings.highTempThreshold} // 現在の値
                onChange={(e) =>
                  handleTempThresholdChange(Number(e.target.value))
                } // 変更時の処理
                className="setting-slider" // スタイル用クラス
              />
              <p className="setting-description">
                {" "}
                {/* 説明文 */}
                この温度以上になると高温警告が表示されます。
              </p>
            </div>
            {/* 高湿度警告の基準湿度設定 */}
            <div className="setting-item">
              {" "}
              {/* 設定項目のコンテナ */}
              <label className="setting-label-text">
                {" "}
                {/* ラベル */}
                高湿度警告の基準: {weatherSettings.highHumidityThreshold}%
              </label>
              <input
                type="range" // スライダー
                min="60" // 最小値
                max="95" // 最大値
                step="5" // ステップ（5%刻み）
                value={weatherSettings.highHumidityThreshold} // 現在の値
                onChange={(e) =>
                  handleHumidityThresholdChange(Number(e.target.value))
                } // 変更時の処理
                className="setting-slider" // スタイル用クラス
              />
              <p className="setting-description">
                {" "}
                {/* 説明文 */}
                この湿度以上になると高湿度警告が表示されます。
              </p>
            </div>
            {/* 通知設定 */}
            <h3 className="subsection-title">通知設定</h3>{" "}
            {/* サブセクションタイトル */}
            {/* 高温通知のON/OFF */}
            <div className="setting-item">
              {" "}
              {/* 設定項目のコンテナ */}
              <label className="setting-label">
                {" "}
                {/* ラベル */}
                <input
                  type="checkbox" // チェックボックス
                  checked={weatherSettings.notifyHighTemp} // 現在の状態
                  onChange={handleToggleHighTempNotify} // 変更時の処理
                  className="setting-checkbox" // スタイル用クラス
                />
                <span className="setting-label-text">高温警告を表示</span>{" "}
                {/* ラベルテキスト */}
              </label>
            </div>
            {/* 高湿度通知のON/OFF */}
            <div className="setting-item">
              {" "}
              {/* 設定項目のコンテナ */}
              <label className="setting-label">
                {" "}
                {/* ラベル */}
                <input
                  type="checkbox" // チェックボックス
                  checked={weatherSettings.notifyHighHumidity} // 現在の状態
                  onChange={handleToggleHighHumidityNotify} // 変更時の処理
                  className="setting-checkbox" // スタイル用クラス
                />
                <span className="setting-label-text">高湿度警告を表示</span>{" "}
                {/* ラベルテキスト */}
              </label>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default Settings; // エクスポート
