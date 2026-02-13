// src/components/WeatherAlert/WeatherAlert.tsx

import { WeatherData, WeatherSettings } from "../../types"; // 型定義をインポート
import { checkWeatherAlerts } from "../../utils/weatherUtils"; // 警告判定関数をインポート
import "./WeatherAlert.css"; // CSSをインポート

// WeatherAlertコンポーネントのpropsの型定義
interface WeatherAlertProps {
  weather: WeatherData | null; // 天気データ（未取得の場合はnull）
  settings: WeatherSettings; // 天気設定
}

// 天気警告表示コンポーネント - ホーム画面に警告バナーを表示
function WeatherAlert({ weather, settings }: WeatherAlertProps) {
  // 天気データが存在しない、または天気連携が無効の場合は何も表示しない
  if (!weather || !settings.enabled) {
    return null; // nullを返すとReactは何もレンダリングしない
  }

  // 警告メッセージを生成（checkWeatherAlerts関数を使用）
  const alerts = checkWeatherAlerts(weather);
  // alerts: 警告メッセージの配列（0個の場合もあり）
  // 例: ["高温注意: 現在35度です。薬の保管場所を確認してください。"]

  // 警告が0件の場合は何も表示しない
  if (alerts.length === 0) {
    return null; // 警告がない = 天気は問題なし
  }

  // 警告がある場合はバナーを表示
  return (
    <div className="weather-alert">
      {" "}
      {/* 警告バナー全体のコンテナ */}
      <div className="weather-alert-icon">
        {" "}
        {/* 警告アイコン */}⚠️ {/* 警告マーク */}
      </div>
      <div className="weather-alert-content">
        {" "}
        {/* 警告内容のコンテナ */}
        <h3 className="weather-alert-title">薬の保管環境に注意</h3>{" "}
        {/* タイトル */}
        <div className="weather-alert-messages">
          {" "}
          {/* メッセージリスト */}
          {alerts.map((alert, index) => (
            // 各警告メッセージを表示（複数ある場合もあり）
            <p key={index} className="weather-alert-message">
              {" "}
              {/* 警告メッセージ */}
              {alert} {/* メッセージテキスト */}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WeatherAlert; // エクスポート
