// src/pages/Home/Home.tsx

import { useEffect } from "react"; // useEffectフックをインポート
import ScheduleList from "../../components/ScheduleList/ScheduleList"; // ScheduleListコンポーネントをインポート
import WeatherAlert from "../../components/WeatherAlert/WeatherAlert"; // WeatherAlertコンポーネントをインポート（新規追加）
import { useWeatherStore } from "../../store/weatherStore"; // 天気ストアをインポート（新規追加）
import "./Home.css"; // CSSをインポート

// ホーム画面コンポーネント - 今日の服用予定と遵守率、天気警告を表示する画面
function Home() {
  // 天気ストアから状態とアクションを取得（新規追加）
  const {
    weatherData, // 最新の天気データ
    weatherSettings, // 天気設定
    checkAndFetchWeatherIfNeeded, // 必要に応じて天気を取得する関数
    loadSettings, // 設定を読み込む関数
    loadLatestWeatherData, // 最新の天気データを読み込む関数
  } = useWeatherStore();

  // コンポーネントのマウント時に天気関連のデータを読み込む（新規追加）
  useEffect(() => {
    // 天気設定を読み込む
    loadSettings().then(() => {
      // 設定読み込み後、最新の天気データを読み込む
      loadLatestWeatherData();
      // 必要に応じて天気を取得（6時間以上経過している場合）
      checkAndFetchWeatherIfNeeded();
    });
  }, []); // 依存配列が空なので、マウント時に1回だけ実行

  return (
    <div className="home">
      {" "}
      {/* ホーム画面全体のコンテナ */}
      <h1>今日の服用予定</h1> {/* ページタイトル */}
      {/* 天気警告の表示（新規追加） */}
      <WeatherAlert weather={weatherData} settings={weatherSettings} />
      {/* 今日の服用予定リストを表示（dateプロパティ未指定 = 今日） */}
      <ScheduleList />
    </div>
  );
}

export default Home; // エクスポート
