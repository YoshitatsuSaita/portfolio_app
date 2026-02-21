import { WeatherData } from '../../types';
import {
  checkWeatherAlerts,
  isStorageEnvironmentGood,
} from '../../utils/weatherUtils';
import './WeatherAlert.css';

interface WeatherAlertProps {
  weather: WeatherData | null;
  inline?: boolean; // 天気カード内に埋め込む場合にtrue
}

function WeatherAlert({
  weather,
  inline = false,
}: WeatherAlertProps) {
  if (!weather) {
    return null;
  }

  const alerts = checkWeatherAlerts(weather);
  const isGood = isStorageEnvironmentGood(weather);
  const inlineClass = inline ? ' weather-alert--inline' : '';

  if (alerts.length > 0) {
    return (
      <div className={`weather-alert weather-alert--warning${inlineClass}`}>
        <div className="weather-alert-content">
          <h3 className="weather-alert-title">薬の保管環境に注意</h3>
          <div className="weather-alert-messages">
            {alerts.map((alert, index) => (
              <p key={index} className="weather-alert-message">
                {alert}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isGood) {
    return (
      <div className={`weather-alert weather-alert--good${inlineClass}`}>
        <div className="weather-alert-content">
          <h3 className="weather-alert-title">保管環境は良好です</h3>
          <div className="weather-alert-messages">
            <p className="weather-alert-message">
              現在の気温・湿度は薬の保管に適した環境です。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // alerts が空かつ isGood が false のケース（通常は到達しない）
  return null;
}

export default WeatherAlert;
