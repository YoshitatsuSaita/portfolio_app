import { useEffect, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { ScheduleItem } from '../../types';
import { useMedicationStore } from '../../store/medicationStore';
import {
  generateScheduleForDate,
  mergeScheduleWithRecords,
  getTodayDateString,
} from '../../utils/scheduleUtils';
import './ScheduleList.css';

interface ScheduleListProps {
  date?: Date | string;
  onScheduleUpdated?: () => void;
}

function ScheduleList({ date, onScheduleUpdated }: ScheduleListProps) {
  const {
    medications,
    fetchActiveMedications,
    fetchRecordsByDateRange,
    addRecord,
    editRecord,
  } = useMedicationStore();
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const targetDate = date
    ? dayjs(date).format('YYYY-MM-DD')
    : getTodayDateString();
  const displayDate = dayjs(targetDate)
    .locale('ja')
    .format('YYYY年M月D日（ddd）');

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    try {
      if (medications.length === 0) {
        await fetchActiveMedications();
      }

      // fetchActiveMedications() 後は medications（クロージャ）が stale になるため
      // getState() で最新の状態を同期的に取得する
      const currentMedications = useMedicationStore.getState().medications;
      const generatedSchedule = generateScheduleForDate(
        currentMedications,
        targetDate
      );

      const startTime = `${targetDate}T00:00:00`;
      const endTime = `${targetDate}T23:59:59`;
      const records = await fetchRecordsByDateRange(startTime, endTime);

      const mergedSchedule = mergeScheduleWithRecords(
        generatedSchedule,
        records
      );
      setScheduleItems(mergedSchedule);
    } catch (error) {
      console.error('服用予定の読み込みに失敗しました:', error);
      toast.error('服用予定の読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [
    medications.length,
    fetchActiveMedications,
    fetchRecordsByDateRange,
    targetDate,
  ]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const handleCheckboxChange = async (item: ScheduleItem, checked: boolean) => {
    try {
      if (checked) {
        if (item.recordId) {
          await editRecord(item.recordId, {
            completed: true,
            actualTime: new Date().toISOString(),
          });
        } else {
          await addRecord({
            medicationId: item.medicationId,
            scheduledTime: item.scheduledTime,
            actualTime: new Date().toISOString(),
            completed: true,
          });
        }
      } else {
        if (item.recordId) {
          await editRecord(item.recordId, {
            completed: false,
            actualTime: null,
          });
        }
      }

      await loadSchedule();
      if (onScheduleUpdated) {
        onScheduleUpdated();
      }
    } catch (error) {
      console.error('服用記録の更新に失敗しました:', error);
      toast.error('服用記録の更新に失敗しました。もう一度お試しください。');
    }
  };

  if (loading) {
    return (
      <div className="schedule-list-container">
        <div className="loading">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="schedule-list-container">
      <div className="date-header">
        <h2>{displayDate}</h2>
      </div>

      {scheduleItems.length === 0 ? (
        <div className="empty-schedule">
          <p>この日の服用予定はありません</p>
        </div>
      ) : (
        <div className="schedule-list">
          {scheduleItems.map((item) => (
            <div
              key={item.id}
              className={`schedule-item ${item.completed ? 'completed' : ''}`}
            >
              <div className="schedule-time">
                {dayjs(item.scheduledTime).format('HH:mm')}
              </div>

              <div className="schedule-info">
                <div className="medication-name">{item.medicationName}</div>
                <div className="medication-dosage">{item.dosage}</div>
                {item.completed && item.actualTime && (
                  <div className="actual-time">
                    ✓ {dayjs(item.actualTime).format('M月D日 HH:mm')}に服用済み
                  </div>
                )}
              </div>

              <div className="schedule-checkbox">
                <input
                  type="checkbox"
                  id={`check-${item.id}`}
                  checked={item.completed}
                  onChange={(e) => handleCheckboxChange(item, e.target.checked)}
                />
                <label htmlFor={`check-${item.id}`}>
                  {item.completed ? '服用済み' : '未服用'}
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ScheduleList;
