import { WeatherData, WeatherSettings } from '../../types'; // 型定義をインポート
import {
  checkWeatherAlerts,
  isStorageEnvironmentGood,
} from '../../utils/weatherUtils'; // 警告判定・良好判定関数をインポート
import './WeatherAlert.css'; // CSSをインポート

// WeatherAlertコンポーネントのpropsの型定義
interface WeatherAlertProps {
  weather: WeatherData | null; // 天気データ（未取得の場合はnull）
  settings: WeatherSettings; // 天気設定
  inline?: boolean; // インライン表示モード（天気カード内埋め込み時にtrue、デフォルトfalse）
}

// 天気警告表示コンポーネント - ホーム画面に警告または良好バナーを表示
function WeatherAlert({
  weather,
  settings,
  inline = false,
}: WeatherAlertProps) {
  // 天気データが存在しない、または天気連携が無効の場合は何も表示しない
  if (!weather || !settings.enabled) {
    return null; // nullを返すとReactは何もレンダリングしない
  }

  // 警告メッセージを生成（高温・高湿度のチェック）
  const alerts = checkWeatherAlerts(weather);
  // alerts: 警告メッセージの配列（0個の場合もあり）

  // 保管環境が良好かどうかを判定（温度・湿度がともに基準値未満か）
  const isGood = isStorageEnvironmentGood(weather);

  // inlineプロップに応じてインライン用クラスを追加するヘルパー関数
  const inlineClass = inline ? ' weather-alert--inline' : ''; // インライン時は修飾子クラスを付与

  // 警告が1件以上ある場合は警告バナーを表示
  if (alerts.length > 0) {
    return (
      <div className={`weather-alert weather-alert--warning${inlineClass}`}>
        {/* 警告バナー全体のコンテナ（警告スタイル＋インライン修飾子） */}
        <div className="weather-alert-content">
          {/* 警告内容のコンテナ */}
          <h3 className="weather-alert-title">薬の保管環境に注意</h3>
          {/* タイトル */}
          <div className="weather-alert-messages">
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
      <div className={`weather-alert weather-alert--good${inlineClass}`}>
        {/* 良好バナー全体のコンテナ（良好スタイル＋インライン修飾子） */}
        <div className="weather-alert-content">
          {/* 内容のコンテナ */}
          <h3 className="weather-alert-title">保管環境は良好です</h3>
          {/* タイトル */}
          <div className="weather-alert-messages">
            {/* メッセージエリア */}
            <p className="weather-alert-message">
              {/* 保管環境の安全性を伝える */}
              現在の気温・湿度は薬の保管に適した環境です。
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
