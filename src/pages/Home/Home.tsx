import { useEffect, useState } from 'react';
import ScheduleList from '../../components/ScheduleList/ScheduleList';
import WeatherAlert from '../../components/WeatherAlert/WeatherAlert';
import { useWeatherStore } from '../../store/weatherStore';
import { getWeatherIcon } from '../../utils/weatherUtils';
import './Home.css';

function Home() {
  const {
    weatherData,
    weatherSettings,
    loading,
    error,
    fetchWeatherData,
    checkAndFetchWeatherIfNeeded, // 24時間以上経過時のみ天気を自動取得する関数
    loadSettings, // IndexedDBから天気設定を読み込む関数
    loadLatestWeatherData, // IndexedDBから最新の天気データを読み込む関数
  } = useWeatherStore();

  const [locationError, setLocationError] = useState<string | null>(null);

  // 未取得の場合は東京デフォルトで取得する
  useEffect(() => {
    loadSettings().then(() => {
      loadLatestWeatherData();
      checkAndFetchWeatherIfNeeded(); // 24時間以上経過していればAPIから再取得（未取得なら東京デフォルトで取得）
    });
  }, [loadSettings, loadLatestWeatherData, checkAndFetchWeatherIfNeeded]);

  // このボタン押下時のみ位置情報の許可を求める（ページ表示時には求めない）
  const handleFetchCurrentLocation = async () => {
    setLocationError(null);
    try {
      const { getCurrentPosition } = await import('../../api');
      const position = await getCurrentPosition();
      await fetchWeatherData(position.lat, position.lon);
    } catch {
      setLocationError(
        '位置情報の取得に失敗しました。ブラウザの設定を確認してください。'
      );
    }
  };

  const formatLastFetched = (dateStr: string | null): string => {
    if (!dateStr) return '未取得';

    const now = new Date();
    const fetched = new Date(dateStr);
    const diffMs = now.getTime() - fetched.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'たった今';
    if (diffMinutes < 60) return `${diffMinutes}分前`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}時間前`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}日前`;
  };

  return (
    <div className="home">
      <section className="home-weather-section">
        {locationError && (
          <div className="home-weather-error">{locationError}</div>
        )}
        {error && <div className="home-weather-error">{error}</div>}
        {weatherData ? (
          <div className="home-weather-info">
            <div className="home-weather-info-left">
              <div className="home-weather-info-header">
                <span className="home-weather-icon">
                  {getWeatherIcon(weatherData.description)}
                </span>
                <span className="home-weather-description">
                  {weatherData.description}
                </span>
              </div>
              <div className="home-weather-info-details">
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
              <WeatherAlert weather={weatherData} inline />
            </div>
          </div>
        ) : loading ? (
          <div className="home-weather-loading">天気情報を取得中...</div>
        ) : null}
        <button
          className="home-weather-location-btn"
          onClick={handleFetchCurrentLocation}
          disabled={loading}
        >
          現在地の天気を取得する
        </button>
      </section>
      <h1>今日の処方箋</h1>
      {/* dateプロパティ未指定で今日の予定を表示 */}
      <ScheduleList />
    </div>
  );
}

export default Home;
