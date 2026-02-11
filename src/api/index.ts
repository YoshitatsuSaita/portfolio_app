// API関連の関数をまとめてエクスポート
// このファイルを経由することで、他のファイルから統一的にインポート可能
// 例: import { fetchWeatherData } from '../api';

export { fetchWeatherData, getCurrentPosition } from "./weatherAPI";

// 将来的に他のAPIが追加された場合もここに追加
// 例: export { fetchDrugInfo } from './drugAPI';
