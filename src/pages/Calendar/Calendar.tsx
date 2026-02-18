import { useState, useEffect } from "react"; // useState、useEffectフックをインポート
import Calendar from "react-calendar"; // React Calendarライブラリをインポート
import "react-calendar/dist/Calendar.css"; // React Calendarのデフォルトスタイルをインポート
import dayjs from "dayjs"; // Day.jsをインポート
import { useMedicationStore } from "../../store/medicationStore"; // Zustandストアをインポート
import {
  generateScheduleForRange, // 日付範囲の予定を生成する関数
  mergeScheduleWithRecords, // 予定と記録をマージする関数
} from "../../utils/scheduleUtils"; // スケジュールユーティリティ関数をインポート
import { getRecordsByDateRange } from "../../db/database"; // データベース操作関数をインポート
import { ScheduleItem } from "../../types"; // ScheduleItem型をインポート
import ScheduleList from "../../components/ScheduleList/ScheduleList"; // ScheduleListコンポーネントをインポート
import "./Calendar.css"; // CSSをインポート

// ValuePiecesの型定義（React Calendarの日付選択の型）
type ValuePiece = Date | null; // 単一の日付またはnull
type Value = ValuePiece | [ValuePiece, ValuePiece]; // 単一の日付または日付範囲

// カレンダー画面コンポーネント - 月次カレンダーで服用予定を表示する画面
function CalendarPage() {
  const { medications, fetchActiveMedications } = useMedicationStore(); // ストアから薬剤データと取得関数を取得
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // 選択された日付（初期値は今日）
  const [activeStartDate, setActiveStartDate] = useState<Date>(new Date()); // 表示中の月の開始日（初期値は今月）
  const [scheduleMap, setScheduleMap] = useState<
    Record<string, ScheduleItem[]>
  >({}); // 日付ごとの服用予定マップ（キー: YYYY-MM-DD、値: ScheduleItem配列）
  const [loading, setLoading] = useState(true); // ローディング状態

  // カレンダーに表示する月の服用予定を読み込む関数
  const loadMonthSchedule = async (monthStart: Date) => {
    setLoading(true); // ローディング開始
    try {
      // 服用中の薬剤を取得（まだ取得していない場合）
      if (medications.length === 0) {
        await fetchActiveMedications(); // 服用中の薬剤のみを取得
      }

      // 表示中の月の開始日と終了日を計算
      const startDate = dayjs(monthStart).startOf("month").toDate(); // 月の1日
      const endDate = dayjs(monthStart).endOf("month").toDate(); // 月の最終日

      // 現在の薬剤データから月全体の服用予定を生成
      const currentMedications = useMedicationStore.getState().medications; // 最新の薬剤データを取得
      const generatedScheduleMap = generateScheduleForRange(
        currentMedications, // 薬剤データ
        startDate, // 開始日
        endDate, // 終了日
      ); // 日付ごとの予定マップを生成

      // 月全体の服用記録を取得
      const records = await getRecordsByDateRange(
        startDate.toISOString(), // 開始日時（ISO 8601形式）
        endDate.toISOString(), // 終了日時（ISO 8601形式）
      ); // IndexedDBから服用記録を取得

      // 各日付の予定と記録をマージ
      const mergedScheduleMap: Record<string, ScheduleItem[]> = {}; // マージ後のマップを格納するオブジェクト
      Object.keys(generatedScheduleMap).forEach((dateKey) => {
        // 各日付について処理
        const daySchedule = generatedScheduleMap[dateKey]; // その日の予定を取得
        const dayRecords = records.filter(
          (r) => r.scheduledTime.startsWith(dateKey), // その日の記録のみをフィルタ（scheduledTimeが "YYYY-MM-DD" で始まるもの）
        );
        mergedScheduleMap[dateKey] = mergeScheduleWithRecords(
          daySchedule,
          dayRecords,
        ); // 予定と記録をマージ
      });

      setScheduleMap(mergedScheduleMap); // 状態を更新
    } catch (error) {
      console.error("カレンダー予定の読み込みに失敗しました:", error); // エラーをコンソールに出力
    } finally {
      setLoading(false); // ローディング終了
    }
  };

  // コンポーネントのマウント時と表示月変更時に予定を読み込む
  useEffect(() => {
    loadMonthSchedule(activeStartDate); // 表示中の月の予定を読み込む
  }, [activeStartDate]); // activeStartDateが変更されたら再実行

  // 日付クリック時の処理
  const handleDateClick = (value: Value) => {
    if (value instanceof Date) {
      // 単一の日付が選択された場合
      setSelectedDate(value); // 選択日を更新
    }
  };

  // 月の切り替え時の処理
  const handleActiveStartDateChange = ({
    activeStartDate,
  }: {
    activeStartDate: Date | null;
  }) => {
    if (activeStartDate) {
      // activeStartDateが存在する場合
      setActiveStartDate(activeStartDate); // 表示中の月を更新
    }
  };

  // カレンダーのタイルコンテンツをカスタマイズする関数（各日付にマークを表示）
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    // 月表示の場合のみマークを表示
    if (view !== "month") return null; // 年表示や10年表示の場合は何も表示しない

    const dateKey = dayjs(date).format("YYYY-MM-DD"); // 日付キーを YYYY-MM-DD 形式で生成
    const daySchedule = scheduleMap[dateKey] || []; // その日の予定を取得（存在しない場合は空配列）

    // 予定がない場合は何も表示しない
    if (daySchedule.length === 0) return null;

    // 完了済みの予定数をカウント
    const completedCount = daySchedule.filter((item) => item.completed).length; // 完了フラグがtrueの予定数
    const totalCount = daySchedule.length; // 予定の総数

    // 全て完了済みかどうかを判定
    const allCompleted = completedCount === totalCount; // 全ての予定が完了している場合はtrue

    return (
      <div className="tile-content">
        {/* タイルコンテンツのコンテナ */}
        <span
          className={`schedule-badge ${allCompleted ? "all-completed" : completedCount > 0 ? "completed" : "pending"}`} // 完了状態に応じてクラスを変更
        >
          {completedCount}/{totalCount} {/* "完了数/総数" 形式で表示 */}
        </span>
      </div>
    );
  };

  return (
    <div className="calendar-page">
      {/* カレンダー画面全体のコンテナ */}
      <h1>処方箋カレンダー</h1> {/* ページタイトル */}
      {loading ? ( // ローディング中の表示
        <div className="loading">読み込み中...</div>
      ) : (
        <div className="calendar-container">
          {/* カレンダーと詳細表示のコンテナ */}
          {/* カレンダー本体 */}
          <div className="calendar-wrapper">
            {/* カレンダーのラッパー */}
            <Calendar
              onChange={handleDateClick} // 日付クリック時の処理
              value={selectedDate} // 選択された日付
              onActiveStartDateChange={handleActiveStartDateChange} // 月の切り替え時の処理
              activeStartDate={activeStartDate} //状態が変更された時の表示月を制御
              tileContent={tileContent} // 各タイルのコンテンツをカスタマイズ
              locale="ja-JP" // ロケールを日本語に設定
              calendarType="gregory" // カレンダータイプをグレゴリオ暦に設定
            />
          </div>
          {/* 選択日の詳細表示 */}
          <div className="calendar-detail">
            {/* 詳細表示エリア */}
            <ScheduleList
              date={selectedDate} // 選択された日付
              onScheduleUpdated={() => loadMonthSchedule(activeStartDate)} // 服用記録更新時にカレンダーを再読み込み
            />
            {/* 選択された日付の服用予定を表示 */}
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarPage; // エクスポート
