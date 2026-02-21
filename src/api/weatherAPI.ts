import { WeatherData, OpenWeatherMapResponse } from '../types';

// 自前の Vercel Function のエンドポイント（APIキーを含まない）
const API_BASE_URL = '/api/weather';

export async function fetchWeatherData(
  lat: number,
  lon: number
): Promise<WeatherData> {
  try {
    const url = `${API_BASE_URL}?lat=${lat}&lon=${lon}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `天気情報の取得に失敗しました: HTTP ${response.status} ${response.statusText}`
      );
    }

    const data: OpenWeatherMapResponse = await response.json();

    const weatherData: WeatherData = {
      id: `weather_${Date.now()}`,
      timestamp: new Date().toISOString(),
      temperature: Math.round(data.main.temp), // 小数点以下は不要なため整数に丸める
      humidity: data.main.humidity,
      description: data.weather[0].description,
      location: {
        lat: data.coord.lat,
        lon: data.coord.lon,
      },
    };

    return weatherData;
  } catch (error) {
    console.error('天気情報の取得に失敗しました:', error);
    throw error;
  }
}

export function getCurrentPosition(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('このブラウザは位置情報に対応していません'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(`位置情報の取得に失敗しました: ${error.message}`));
      },
      {
        enableHighAccuracy: false, // 高精度は不要（天気情報は市区町村レベルで十分）
        timeout: 10000,
        maximumAge: 600000,
      }
    );
  });
}
