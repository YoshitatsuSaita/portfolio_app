import { useEffect, useState } from 'react'; // useEffect・useStateフックをインポート
import ScheduleList from '../../components/ScheduleList/ScheduleList'; // 服用予定リストコンポーネントをインポート
import WeatherAlert from '../../components/WeatherAlert/WeatherAlert'; // 天気警告バナーコンポーネントをインポート
import { useWeatherStore } from '../../store/weatherStore'; // Zustand天気ストアをインポート
import { getWeatherIcon } from '../../utils/weatherUtils'; // 天気概要から絵文字アイコンを取得するユーティリティ関数をインポート
import './Home.css'; // ホーム画面用CSSをインポート

// ホーム画面コンポーネント - 今日の服用予定・天気警告・天気設定を一画面に統合
function Home() {
  // Zustand天気ストアから状態とアクションを取得
  const {
    weatherData, // 最新の天気データ（APIから取得済みのもの）
    weatherSettings, // 天気連携の設定オブジェクト（lastFetchedAt等）
    loading, // 天気データ取得中のローディングフラグ
    error, // ストアレベルのエラーメッセージ
    fetchWeatherData, // APIから天気データを取得する関数
    checkAndFetchWeatherIfNeeded, // 6時間以上経過時のみ天気を自動取得する関数
    loadSettings, // IndexedDBから天気設定を読み込む関数
    loadLatestWeatherData, // IndexedDBから最新の天気データを読み込む関数
  } = useWeatherStore();

  // ローカル状態: 位置情報取得失敗時のエラーメッセージを管理
  const [locationError, setLocationError] = useState<string | null>(null);

  // コンポーネントマウント時に天気関連データを初期化（東京デフォルトで取得）
  useEffect(() => {
    loadSettings().then(() => {
      // まずIndexedDBから設定を読み込む
      loadLatestWeatherData(); // 設定読み込み後、保存済みの天気データを復元
      checkAndFetchWeatherIfNeeded(); // 24時間以上経過していればAPIから再取得（未取得なら東京デフォルトで取得）
    });
  }, []); // 空の依存配列: マウント時に1回だけ実行

  // 「現在地の天気を取得する」ボタンのハンドラー: このボタン押下時のみ位置情報の許可を求める
  const handleFetchCurrentLocation = async () => {
    setLocationError(null); // 前回のエラーメッセージをクリア
    try {
      const { getCurrentPosition } = await import('../../api'); // 位置情報API関数を動的インポート
      const position = await getCurrentPosition(); // ブラウザの位置情報パーミッションを確認・取得
      await fetchWeatherData(position.lat, position.lon); // 取得した座標で天気データを更新
    } catch {
      // 位置情報の取得に失敗した場合（ユーザーが拒否、またはAPI不対応）
      setLocationError(
        '位置情報の取得に失敗しました。ブラウザの設定を確認してください。'
      );
    }
  };

  // 最終取得日時のフォーマット関数（相対時間表示）
  const formatLastFetched = (dateStr: string | null): string => {
    if (!dateStr) return '未取得'; // 未取得の場合はそのまま表示

    const now = new Date(); // 現在時刻を取得
    const fetched = new Date(dateStr); // 最終取得日時をDateオブジェクトに変換
    const diffMs = now.getTime() - fetched.getTime(); // 差分をミリ秒で計算
    const diffMinutes = Math.floor(diffMs / (1000 * 60)); // 分に変換

    if (diffMinutes < 1) return 'たった今'; // 1分未満
    if (diffMinutes < 60) return `${diffMinutes}分前`; // 60分未満
    const diffHours = Math.floor(diffMinutes / 60); // 時間に変換
    if (diffHours < 24) return `${diffHours}時間前`; // 24時間未満
    const diffDays = Math.floor(diffHours / 24); // 日数に変換
    return `${diffDays}日前`; // 24時間以上
  };

  return (
    <div className="home">
      {/* ホーム画面全体のコンテナ */}
      {/* 天気セクション: ページ表示時から常に見える状態 */}
      <section className="home-weather-section">
        {/* 位置情報エラーメッセージの表示（エラーがある場合のみ） */}
        {locationError && (
          <div className="home-weather-error">{locationError}</div>
        )}
        {/* ストアレベルのエラーメッセージ表示（エラーがある場合のみ） */}
        {error && <div className="home-weather-error">{error}</div>}
        {/* 天気情報カード（常に表示） */}
        {weatherData ? (
          <div className="home-weather-info">
            {/* 天気情報カード全体のコンテナ（2カラムレイアウト） */}
            <div className="home-weather-info-left">
              {/* 左列: 天気データ（アイコン・気温・湿度・最終取得日時） */}
              <div className="home-weather-info-header">
                {/* カードヘッダー部（アイコン＋概要） */}
                <span className="home-weather-icon">
                  {getWeatherIcon(weatherData.description)}
                </span>
                <span className="home-weather-description">
                  {weatherData.description}
                </span>
              </div>
              <div className="home-weather-info-details">
                {/* 気温・湿度の詳細表示エリア */}
                <div className="home-weather-detail">
                  <span className="home-weather-detail-label">気温:</span>
                  <span className="home-weather-detail-value">
                    {weatherData.temperature}度
                  </span>
                </div>
                <div className="home-weather-detail">
                  <span className="home-weather-detail-label">湿度:</span>
                  <span className="home-weather-detail-value">
                    {weatherData.humidity}%
                  </span>
                </div>
              </div>
              <p className="home-weather-last-updated">
                最終取得: {formatLastFetched(weatherSettings.lastFetchedAt)}
              </p>
            </div>
            <div className="home-weather-info-right">
              {/* 右列: 警告/良好バナー（インラインモードで埋め込み） */}
              <WeatherAlert weather={weatherData} inline />
            </div>
          </div>
        ) : loading ? (
          <div className="home-weather-loading">天気情報を取得中...</div>
        ) : null}
        {/* 現在地の天気取得ボタン: 押下時のみ位置情報の許可を求める */}
        <button
          className="home-weather-location-btn"
          onClick={handleFetchCurrentLocation}
          disabled={loading}
        >
          現在地の天気を取得する
        </button>
      </section>
      <h1>今日の処方箋</h1> {/* ページタイトル */}
      {/* 今日の服用予定リスト - dateプロパティ未指定で今日の予定を表示 */}
      <ScheduleList />
    </div>
  );
}

export default Home; // 他ファイルからインポート可能にエクスポート
