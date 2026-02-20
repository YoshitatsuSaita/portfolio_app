import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  checkWeatherAlerts,
  isStorageEnvironmentGood,
  getWeatherIcon,
  isWeatherDataStale,
} from './weatherUtils';
import { WeatherData } from '../types';

// テスト用の基本的な天気データを生成するヘルパー関数
const createWeatherData = (
  temperature: number,
  humidity: number
): WeatherData => ({
  id: 'test_weather_001',
  temperature,
  humidity,
  description: 'テスト用天気',
  timestamp: new Date().toISOString(),
  location: {
    lat: 35.6812,
    lon: 139.7671,
  },
});

// ===== checkWeatherAlerts =====
describe('checkWeatherAlerts', () => {
  it('気温・湿度ともに基準値未満の場合、警告は空配列を返す', () => {
    const weather = createWeatherData(25, 60);
    expect(checkWeatherAlerts(weather)).toEqual([]);
  });

  it('気温がちょうど30度の場合、高温警告を返す', () => {
    const weather = createWeatherData(30, 60);
    const alerts = checkWeatherAlerts(weather);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toContain('高温注意');
    expect(alerts[0]).toContain('30');
  });

  it('気温が30度を超える場合、高温警告を返す', () => {
    const weather = createWeatherData(35, 60);
    const alerts = checkWeatherAlerts(weather);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toContain('高温注意');
  });

  it('湿度がちょうど80%の場合、高湿度警告を返す', () => {
    const weather = createWeatherData(25, 80);
    const alerts = checkWeatherAlerts(weather);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toContain('高湿度注意');
    expect(alerts[0]).toContain('80');
  });

  it('湿度が80%を超える場合、高湿度警告を返す', () => {
    const weather = createWeatherData(25, 90);
    const alerts = checkWeatherAlerts(weather);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toContain('高湿度注意');
  });

  it('気温・湿度ともに基準値以上の場合、2つの警告を返す', () => {
    const weather = createWeatherData(35, 90);
    const alerts = checkWeatherAlerts(weather);
    expect(alerts).toHaveLength(2);
    expect(alerts[0]).toContain('高温注意');
    expect(alerts[1]).toContain('高湿度注意');
  });
});

// ===== isStorageEnvironmentGood =====
describe('isStorageEnvironmentGood', () => {
  it('気温・湿度ともに基準値未満の場合、trueを返す', () => {
    const weather = createWeatherData(25, 60);
    expect(isStorageEnvironmentGood(weather)).toBe(true);
  });

  it('気温がちょうど30度の場合、falseを返す', () => {
    const weather = createWeatherData(30, 60);
    expect(isStorageEnvironmentGood(weather)).toBe(false);
  });

  it('湿度がちょうど80%の場合、falseを返す', () => {
    const weather = createWeatherData(25, 80);
    expect(isStorageEnvironmentGood(weather)).toBe(false);
  });

  it('気温・湿度ともに基準値以上の場合、falseを返す', () => {
    const weather = createWeatherData(35, 90);
    expect(isStorageEnvironmentGood(weather)).toBe(false);
  });
});

// ===== getWeatherIcon =====
describe('getWeatherIcon', () => {
  it('「晴れ」を含む場合、☀️を返す', () => {
    expect(getWeatherIcon('晴れ')).toBe('☀️');
  });

  it('「快晴」を含む場合、☀️を返す', () => {
    expect(getWeatherIcon('快晴')).toBe('☀️');
  });

  it('「曇り」を含む場合、☁️を返す', () => {
    expect(getWeatherIcon('曇り')).toBe('☁️');
  });

  it('「雨」を含む場合、🌧️を返す', () => {
    expect(getWeatherIcon('雨')).toBe('🌧️');
  });

  it('「雪」を含む場合、❄️を返す', () => {
    expect(getWeatherIcon('雪')).toBe('❄️');
  });

  it('「雷」を含む場合、⚡を返す', () => {
    expect(getWeatherIcon('雷')).toBe('⚡');
  });

  it('不明な天気の場合、🌤️を返す', () => {
    expect(getWeatherIcon('霧')).toBe('🌤️');
  });
});

// ===== isWeatherDataStale =====
describe('isWeatherDataStale', () => {
  beforeEach(() => {
    // 現在時刻を固定（2024-01-01 12:00:00 UTC）
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00.000Z'));
  });

  afterEach(() => {
    // テスト後にタイマーをリセット
    vi.useRealTimers();
  });

  it('25時間前のデータはデフォルト（24時間）で古いと判定する', () => {
    const timestamp = '2024-01-01T11:00:00.000Z'; // 1時間前（24時間以内）
    // 25時間前に相当するタイムスタンプ
    const staleTimestamp = new Date('2024-01-01T12:00:00.000Z');
    staleTimestamp.setHours(staleTimestamp.getHours() - 25);
    expect(isWeatherDataStale(staleTimestamp.toISOString())).toBe(true);
  });

  it('1時間前のデータはデフォルト（24時間）で新しいと判定する', () => {
    const timestamp = new Date('2024-01-01T12:00:00.000Z');
    timestamp.setHours(timestamp.getHours() - 1);
    expect(isWeatherDataStale(timestamp.toISOString())).toBe(false);
  });

  it('カスタム有効期限（1時間）で、2時間前のデータは古いと判定する', () => {
    const timestamp = new Date('2024-01-01T12:00:00.000Z');
    timestamp.setHours(timestamp.getHours() - 2);
    expect(isWeatherDataStale(timestamp.toISOString(), 1)).toBe(true);
  });

  it('カスタム有効期限（1時間）で、30分前のデータは新しいと判定する', () => {
    const timestamp = new Date('2024-01-01T12:00:00.000Z');
    timestamp.setMinutes(timestamp.getMinutes() - 30);
    expect(isWeatherDataStale(timestamp.toISOString(), 1)).toBe(false);
  });

  it('ちょうど24時間前のデータは古いと判定する（境界値）', () => {
    const timestamp = '2024-01-01T12:00:00.000Z';
    const exactTimestamp = new Date('2024-01-01T12:00:00.000Z');
    exactTimestamp.setHours(exactTimestamp.getHours() - 24);
    expect(isWeatherDataStale(exactTimestamp.toISOString())).toBe(true);
  });
});
