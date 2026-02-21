import { create } from 'zustand';
import { WeatherData, WeatherSettings } from '../types';
import {
  fetchWeatherData as apiFetchWeatherData, // 同名のローカル変数との衝突を避けるためエイリアス使用
} from '../api';
import {
  saveWeatherData,
  getLatestWeatherData,
  getWeatherSettings,
  saveWeatherSettings,
  deleteOldWeatherData,
} from '../db/database';
import { isWeatherDataStale } from '../utils/weatherUtils';

interface WeatherState {
  weatherData: WeatherData | null;
  weatherSettings: WeatherSettings;
  loading: boolean;
  error: string | null;

  fetchWeatherData: (lat?: number, lon?: number) => Promise<void>;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<WeatherSettings>) => Promise<void>;
  loadLatestWeatherData: () => Promise<void>;
  checkAndFetchWeatherIfNeeded: () => Promise<void>;
  cleanupOldWeatherData: () => Promise<void>;
}

export const useWeatherStore = create<WeatherState>((set, get) => ({
  weatherData: null,
  weatherSettings: {
    enabled: false,
    lastFetchedAt: null,
  },
  loading: false,
  error: null,

  // lat/lon 未指定時は東京（35.6812, 139.7671）をデフォルト使用
  fetchWeatherData: async (lat?: number, lon?: number) => {
    set({ loading: true, error: null });

    try {
      const targetLat = lat ?? 35.6812;
      const targetLon = lon ?? 139.7671;

      const weatherData = await apiFetchWeatherData(targetLat, targetLon);

      await saveWeatherData(weatherData);
      await deleteOldWeatherData(7);

      set({ weatherData, loading: false });

      const currentSettings = get().weatherSettings;
      const updatedSettings: WeatherSettings = {
        ...currentSettings,
        lastFetchedAt: new Date().toISOString(),
      };

      await saveWeatherSettings(updatedSettings);
      set({ weatherSettings: updatedSettings });
    } catch (error) {
      console.error('天気データの取得に失敗しました:', error);

      set({
        error:
          error instanceof Error
            ? error.message
            : '天気データの取得に失敗しました',
        loading: false,
      });
    }
  },

  loadSettings: async () => {
    try {
      const settings = await getWeatherSettings();
      set({ weatherSettings: settings });
    } catch (error) {
      console.error('設定の読み込みに失敗しました:', error);
      // エラーが発生してもデフォルト値を使用してアプリの動作を継続
    }
  },

  updateSettings: async (updates: Partial<WeatherSettings>) => {
    try {
      const currentSettings = get().weatherSettings;

      const newSettings: WeatherSettings = {
        ...currentSettings,
        ...updates,
      };

      await saveWeatherSettings(newSettings);
      set({ weatherSettings: newSettings });
    } catch (error) {
      console.error('設定の更新に失敗しました:', error);

      set({
        error:
          error instanceof Error ? error.message : '設定の更新に失敗しました',
      });
    }
  },

  loadLatestWeatherData: async () => {
    try {
      const latestData = await getLatestWeatherData();

      if (latestData) {
        set({ weatherData: latestData });
      }
    } catch (error) {
      console.error('天気データの読み込みに失敗しました:', error);
      // エラーが発生してもアプリの動作を継続（weatherDataはnullのまま）
    }
  },

  checkAndFetchWeatherIfNeeded: async () => {
    try {
      const settings = get().weatherSettings;

      if (!settings.lastFetchedAt) {
        // 初回は東京のデフォルト座標で取得
        await get().fetchWeatherData();
        return;
      }

      const isStale = isWeatherDataStale(settings.lastFetchedAt, 24);

      if (isStale) {
        await get().fetchWeatherData();
      } else {
        await get().loadLatestWeatherData();
      }
    } catch (error) {
      console.error('天気データのチェックに失敗しました:', error);
      // エラーが発生してもアプリの動作を継続
    }
  },

  cleanupOldWeatherData: async () => {
    try {
      await deleteOldWeatherData(7);
    } catch (error) {
      console.error('古いデータの削除に失敗しました:', error);
      // エラーが発生してもアプリの動作を継続
    }
  },
}));
