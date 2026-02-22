import { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import dayjs from 'dayjs';
import { useMedicationStore } from '../../store/medicationStore';
import {
  generateScheduleForRange,
  mergeScheduleWithRecords,
} from '../../utils/scheduleUtils';
import { ScheduleItem } from '../../types';
import ScheduleList from '../../components/ScheduleList/ScheduleList';
import './Calendar.css';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

function CalendarPage() {
  const { medications, fetchActiveMedications, fetchRecordsByDateRange } =
    useMedicationStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeStartDate, setActiveStartDate] = useState<Date>(new Date());
  const [scheduleMap, setScheduleMap] = useState<
    Record<string, ScheduleItem[]>
  >({});
  const [loading, setLoading] = useState(true);

  const loadMonthSchedule = useCallback(
    async (monthStart: Date) => {
      setLoading(true);
      try {
        if (medications.length === 0) {
          await fetchActiveMedications();
        }

        const startDate = dayjs(monthStart).startOf('month').toDate();
        const endDate = dayjs(monthStart).endOf('month').toDate();

        // fetchActiveMedications() 後に最新値を取得するため、クロージャの medications ではなく getState() を使う
        const currentMedications = useMedicationStore.getState().medications;
        const generatedScheduleMap = generateScheduleForRange(
          currentMedications,
          startDate,
          endDate
        );

        // 戻り値を直接使うことで ScheduleList との records 上書き競合を防ぐ
        const records = await fetchRecordsByDateRange(
          startDate.toISOString(),
          endDate.toISOString()
        );

        const mergedScheduleMap: Record<string, ScheduleItem[]> = {};
        Object.keys(generatedScheduleMap).forEach((dateKey) => {
          const daySchedule = generatedScheduleMap[dateKey];
          const dayRecords = records.filter(
            // scheduledTime は ISO 8601 形式で "YYYY-MM-DD" から始まる
            (r) => r.scheduledTime.startsWith(dateKey)
          );
          mergedScheduleMap[dateKey] = mergeScheduleWithRecords(
            daySchedule,
            dayRecords
          );
        });

        setScheduleMap(mergedScheduleMap);
      } catch (error) {
        console.error('カレンダー予定の読み込みに失敗しました:', error);
      } finally {
        setLoading(false);
      }
    },
    [medications.length, fetchActiveMedications, fetchRecordsByDateRange]
  );

  useEffect(() => {
    loadMonthSchedule(activeStartDate);
  }, [loadMonthSchedule, activeStartDate]);

  const handleDateClick = (value: Value) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    }
  };

  const handleActiveStartDateChange = ({
    activeStartDate,
  }: {
    activeStartDate: Date | null;
  }) => {
    if (activeStartDate) {
      setActiveStartDate(activeStartDate);
    }
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;

    const dateKey = dayjs(date).format('YYYY-MM-DD');
    const daySchedule = scheduleMap[dateKey] || [];

    if (daySchedule.length === 0) return null;

    const completedCount = daySchedule.filter((item) => item.completed).length;
    const totalCount = daySchedule.length;
    const allCompleted = completedCount === totalCount;

    return (
      <div className="tile-content">
        <span
          className={`schedule-badge ${allCompleted ? 'all-completed' : completedCount > 0 ? 'completed' : 'pending'}`}
        >
          {completedCount}/{totalCount}
        </span>
      </div>
    );
  };

  return (
    <div className="calendar-page">
      <h1>処方箋カレンダー</h1>
      {loading ? (
        <div className="loading">読み込み中...</div>
      ) : (
        <div className="calendar-container">
          <div className="calendar-wrapper">
            <Calendar
              onChange={handleDateClick}
              value={selectedDate}
              onActiveStartDateChange={handleActiveStartDateChange}
              activeStartDate={activeStartDate} // 状態変更時の表示月を制御するためのプロップコントロール
              tileContent={tileContent}
              locale="ja-JP"
              calendarType="gregory"
            />
          </div>
          <div className="calendar-detail">
            <ScheduleList
              date={selectedDate}
              onScheduleUpdated={() => loadMonthSchedule(activeStartDate)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarPage;
