import { useEffect, useState, useCallback } from 'react'; // useEffect、useStateフックをインポート
import dayjs from 'dayjs'; // Day.jsをインポート - 日時フォーマット用
import { ScheduleItem } from '../../types'; // ScheduleItem型をインポート
import { useMedicationStore } from '../../store/medicationStore'; // Zustandストアをインポート
import {
  generateScheduleForDate, // 指定日の予定を生成する関数
  mergeScheduleWithRecords, // 予定と記録をマージする関数
  getTodayDateString, // 今日の日付を取得する関数
} from '../../utils/scheduleUtils'; // スケジュールユーティリティ関数をインポート
import {
  getRecordsByDateRange, // 日付範囲で服用記録を取得する関数
  createMedicationRecord, // 新規服用記録を作成する関数
  updateMedicationRecord, // 服用記録を更新する関数
} from '../../db/database'; // データベース操作関数をインポート
import './ScheduleList.css'; // CSSをインポート

// ScheduleListコンポーネントのpropsの型定義
interface ScheduleListProps {
  date?: Date | string; // 表示する日付（任意） - 未指定の場合は今日
  onScheduleUpdated?: () => void; // 服用記録が更新されたときに呼び出すコールバック（任意）
}

// 服用予定リストコンポーネント - 指定日の服用予定を表示
function ScheduleList({ date, onScheduleUpdated }: ScheduleListProps) {
  // onScheduleUpdatedを追加で受け取る
  const { medications, fetchActiveMedications } = useMedicationStore(); // ストアから薬剤データと取得関数を取得
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]); // 服用予定の状態（初期値は空配列）
  const [loading, setLoading] = useState(true); // ローディング状態（初期値はtrue）

  const targetDate = date
    ? dayjs(date).format('YYYY-MM-DD')
    : getTodayDateString(); // 表示対象の日付を決定（未指定の場合は今日）
  const displayDate = dayjs(targetDate)
    .locale('ja')
    .format('YYYY年M月D日（ddd）'); // 表示用の日付文字列（例: 2024年2月9日（金））

  // 服用予定を読み込む関数
  const loadSchedule = useCallback(async () => {
    setLoading(true); // ローディング開始
    try {
      // 服用中の薬剤を取得（まだ取得していない場合）
      if (medications.length === 0) {
        await fetchActiveMedications(); // 服用中の薬剤のみを取得
      }

      // 現在の薬剤データから服用予定を生成
      const currentMedications = useMedicationStore.getState().medications; // 最新の薬剤データを取得
      const generatedSchedule = generateScheduleForDate(
        currentMedications,
        targetDate
      ); // 指定日の予定を生成

      // その日の服用記録を取得
      const startTime = `${targetDate}T00:00:00`; // その日の開始時刻（ISO 8601形式）
      const endTime = `${targetDate}T23:59:59`; // その日の終了時刻（ISO 8601形式）
      const records = await getRecordsByDateRange(startTime, endTime); // IndexedDBから服用記録を取得

      // 予定と記録をマージ
      const mergedSchedule = mergeScheduleWithRecords(
        generatedSchedule,
        records
      ); // 予定に記録情報を統合

      setScheduleItems(mergedSchedule); // 状態を更新
    } catch (error) {
      console.error('服用予定の読み込みに失敗しました:', error); // エラーをコンソールに出力
    } finally {
      setLoading(false); // ローディング終了（成功・失敗に関わらず実行）
    }
  }, [medications.length, fetchActiveMedications, targetDate]);

  // コンポーネントのマウント時と日付変更時に予定を読み込む
  useEffect(() => {
    loadSchedule(); // 予定を読み込む
  }, [loadSchedule]);

  // 服用完了チェックボックスの変更処理
  const handleCheckboxChange = async (item: ScheduleItem, checked: boolean) => {
    try {
      if (checked) {
        // チェックが入った場合 - 服用完了を記録
        if (item.recordId) {
          // 既に記録が存在する場合は更新
          await updateMedicationRecord(item.recordId, {
            completed: true, // 完了フラグをtrueに
            actualTime: new Date().toISOString(), // 実際の服用時刻を現在時刻に設定
          });
        } else {
          // 記録が存在しない場合は新規作成
          await createMedicationRecord({
            medicationId: item.medicationId, // 薬剤ID
            scheduledTime: item.scheduledTime, // 予定時刻
            actualTime: new Date().toISOString(), // 実際の服用時刻を現在時刻に設定
            completed: true, // 完了フラグをtrueに
          });
        }
      } else {
        // チェックが外された場合 - 未服用に戻す
        if (item.recordId) {
          await updateMedicationRecord(item.recordId, {
            completed: false, // 完了フラグをfalseに
            actualTime: null, // 実際の服用時刻をnullに
          });
        }
      }

      // UIを更新（最新の状態を再取得）
      await loadSchedule(); // 予定を再読み込み
      if (onScheduleUpdated) {
        // コールバックが渡されている場合のみ
        onScheduleUpdated(); // 親コンポーネント（CalendarPage）に更新を通知
      }
    } catch (error) {
      console.error('服用記録の更新に失敗しました:', error); // エラーをコンソールに出力
      alert('服用記録の更新に失敗しました。もう一度お試しください。'); // ユーザーにエラーを通知
    }
  };

  // ローディング中の表示
  if (loading) {
    return (
      <div className="schedule-list-container">
        <div className="loading">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="schedule-list-container">
      {/* 日付ヘッダー */}
      <div className="date-header">
        <h2>{displayDate}</h2> {/* 日付を表示 */}
      </div>

      {/* 服用予定リスト */}
      {scheduleItems.length === 0 ? (
        // 予定が0件の場合
        <div className="empty-schedule">
          <p>この日の服用予定はありません</p>
        </div>
      ) : (
        // 予定が1件以上の場合
        <div className="schedule-list">
          {scheduleItems.map((item) => (
            <div
              key={item.id} // Reactのkey属性
              className={`schedule-item ${item.completed ? 'completed' : ''}`} // 完了済みの場合はcompletedクラスを追加
            >
              {/* 時刻表示 */}
              <div className="schedule-time">
                {dayjs(item.scheduledTime).format('HH:mm')}
                {/* 時刻をHH:mm形式で表示（例: 08:00） */}
              </div>

              {/* 薬剤情報 */}
              <div className="schedule-info">
                <div className="medication-name">{item.medicationName}</div>
                {/* 薬品名 */}
                <div className="medication-dosage">{item.dosage}</div>
                {/* 服用量 */}
                {item.completed &&
                  item.actualTime && ( // 完了済みで実際の時刻がある場合
                    <div className="actual-time">
                      ✓ {dayjs(item.actualTime).format('M月D日 HH:mm')}
                      に服用済み {/* 実際の服用時刻を表示 */}
                    </div>
                  )}
              </div>

              {/* チェックボックス */}
              <div className="schedule-checkbox">
                <input
                  type="checkbox" // チェックボックス
                  id={`check-${item.id}`} // ラベルとの紐づけ用ID
                  checked={item.completed} // 完了済みの場合はチェック済み
                  onChange={(e) => handleCheckboxChange(item, e.target.checked)} // チェックボックスの変更を処理
                />
                <label htmlFor={`check-${item.id}`}>
                  {item.completed ? '服用済み' : '未服用'}
                  {/* ラベルテキスト */}
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ScheduleList; // エクスポート
