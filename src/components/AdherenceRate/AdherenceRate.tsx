import { useEffect, useState } from "react"; // useEffect、useStateフックをインポート
import {
  calculateAdherenceRate, // 遵守率を計算する関数
} from "../../db/database"; // データベース操作関数をインポート
import {
  getTodayEnd, // 今日の終了時刻を取得する関数
  getThisWeekStart, // 今週の開始日を取得する関数
  getThisMonthStart, // 今月の開始日を取得する関数
} from "../../utils/scheduleUtils"; // スケジュールユーティリティ関数をインポート
import "./AdherenceRate.css"; // CSSをインポート

// 遵守率データの型定義
interface AdherenceData {
  period: string; // 期間名（例: "今週"）
  rate: number; // 遵守率（0-100のパーセンテージ）
  completed: number; // 服用完了回数
  total: number; // 服用予定回数
}

// 服用遵守率表示コンポーネント - 今週・今月・全期間の遵守率を表示
function AdherenceRate() {
  const [adherenceData, setAdherenceData] = useState<AdherenceData[]>([]); // 遵守率データの配列
  const [loading, setLoading] = useState(true); // ローディング状態

  // 遵守率データを読み込む関数
  const loadAdherenceData = async () => {
    setLoading(true); // ローディング開始
    try {
      const now = getTodayEnd(); // 現在時刻（今日の終了時刻）

      // 今週の遵守率を計算
      const weekStart = getThisWeekStart(); // 今週の開始日（月曜日）を取得
      const weekRate = await calculateAdherenceRate(weekStart, now); // 遵守率を計算（0-100のパーセンテージ）

      // 今月の遵守率を計算
      const monthStart = getThisMonthStart(); // 今月の開始日（1日）を取得
      const monthRate = await calculateAdherenceRate(monthStart, now); // 遵守率を計算

      // 全期間の遵守率を計算（開始日を1970年1月1日に設定 = 全データ）
      const allTimeStart = new Date(0).toISOString(); // 1970年1月1日のISO 8601形式
      const allTimeRate = await calculateAdherenceRate(allTimeStart, now); // 遵守率を計算

      // 遵守率データを配列にまとめる
      const data: AdherenceData[] = [
        {
          period: "今週", // 期間名
          rate: weekRate, // 遵守率
          completed: 0, // 完了回数（calculateAdherenceRateでは返されないため0）
          total: 0, // 予定回数（calculateAdherenceRateでは返されないため0）
        },
        {
          period: "今月",
          rate: monthRate,
          completed: 0,
          total: 0,
        },
        {
          period: "全期間",
          rate: allTimeRate,
          completed: 0,
          total: 0,
        },
      ];

      setAdherenceData(data); // 状態を更新
    } catch (error) {
      console.error("遵守率の読み込みに失敗しました:", error); // エラーをコンソールに出力
    } finally {
      setLoading(false); // ローディング終了
    }
  };

  // コンポーネントのマウント時に遵守率を読み込む
  useEffect(() => {
    loadAdherenceData(); // 遵守率を読み込む
  }, []); // 依存配列が空なので、マウント時に1回だけ実行

  // 遵守率に応じたクラス名を返す関数（色分け用）
  const getRateClass = (rate: number): string => {
    if (rate >= 80) return "high"; // 80%以上 = 高（緑色）
    if (rate >= 50) return "medium"; // 50-79% = 中（オレンジ色）
    return "low"; // 50%未満 = 低（赤色）
  };

  // ローディング中の表示
  if (loading) {
    return (
      <div className="adherence-rate-container">
        <div className="loading">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="adherence-rate-container">
      <h2 className="adherence-rate-title">服用遵守率</h2> {/* タイトル */}
      {/* 遵守率カード群 */}
      <div className="adherence-cards">
        {adherenceData.map((data, index) => (
          <div key={index} className="adherence-card">
            {" "}
            {/* 個別の遵守率カード */}
            <div className="card-label">{data.period}</div> {/* 期間名 */}
            <div className={`card-value ${getRateClass(data.rate)}`}>
              {" "}
              {/* 遵守率の数値（色分け） */}
              {data.rate.toFixed(1)} {/* 小数第1位まで表示 */}
              <span className="percent-sign">%</span> {/* パーセント記号 */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdherenceRate; // エクスポート
