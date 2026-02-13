// src/components/WeatherAlert/WeatherAlert.tsx

import { WeatherData, WeatherSettings } from "../../types"; // 型定義をインポート
import {
  checkWeatherAlerts,
  isStorageEnvironmentGood,
} from "../../utils/weatherUtils"; // 警告判定・良好判定関数をインポート
import "./WeatherAlert.css"; // CSSをインポート

// WeatherAlertコンポーネントのpropsの型定義
interface WeatherAlertProps {
  weather: WeatherData | null; // 天気データ（未取得の場合はnull）
  settings: WeatherSettings; // 天気設定
}

// 天気警告表示コンポーネント - ホーム画面に警告または良好バナーを表示
function WeatherAlert({ weather, settings }: WeatherAlertProps) {
  // 天気データが存在しない、または天気連携が無効の場合は何も表示しない
  if (!weather || !settings.enabled) {
    return null; // nullを返すとReactは何もレンダリングしない
  }

  // 警告メッセージを生成（高温・高湿度のチェック）
  const alerts = checkWeatherAlerts(weather);
  // alerts: 警告メッセージの配列（0個の場合もあり）

  // 保管環境が良好かどうかを判定（温度・湿度がともに基準値未満か）
  const isGood = isStorageEnvironmentGood(weather);

  // 警告が1件以上ある場合は警告バナーを表示
  if (alerts.length > 0) {
    return (
      <div className="weather-alert weather-alert--warning">
        {" "}
        {/* 警告バナー全体のコンテナ（警告スタイル） */}
        <div className="weather-alert-icon">⚠️</div> {/* 警告アイコン */}
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
                {alert} {/* メッセージテキスト */}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 警告がなく、かつ保管環境が良好な場合は良好バナーを表示
  if (isGood) {
    return (
      <div className="weather-alert weather-alert--good">
        {" "}
        {/* 良好バナー全体のコンテナ（良好スタイル） */}
        <div className="weather-alert-icon">✅</div> {/* 良好アイコン */}
        <div className="weather-alert-content">
          {" "}
          {/* 内容のコンテナ */}
          <h3 className="weather-alert-title">保管環境は良好です</h3>{" "}
          {/* タイトル */}
          <div className="weather-alert-messages">
            {" "}
            {/* メッセージエリア */}
            <p className="weather-alert-message">
              {/* 現在の気温・湿度を表示しつつ、保管環境の安全性を伝える */}
              現在の気温は{weather.temperature}度、湿度は{weather.humidity}
              %です。薬の保管に適した環境です。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 上記のいずれにも該当しない場合（通常は到達しない）は何も表示しない
  return null;
}

export default WeatherAlert; // エクスポート
