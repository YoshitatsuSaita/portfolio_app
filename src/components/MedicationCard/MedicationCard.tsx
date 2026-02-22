import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { Medication } from '../../types';
import { useMedicationStore } from '../../store/medicationStore';
import './MedicationCard.css';

interface MedicationCardProps {
  medication: Medication;
  onEdit: (medication: Medication) => void;
}

function MedicationCard({ medication, onEdit }: MedicationCardProps) {
  const deleteMedication = useMedicationStore(
    (state) => state.deleteMedication
  );

  const isCompleted =
    !!medication.endDate && dayjs(medication.endDate).isBefore(dayjs(), 'day');

  const formatDateRange = () => {
    const startDate = new Date(medication.startDate).toLocaleDateString(
      'ja-JP'
    );
    if (medication.endDate) {
      const endDate = new Date(medication.endDate).toLocaleDateString('ja-JP');
      return `${startDate} 〜 ${endDate}`;
    }
    return `${startDate} 〜 継続中`;
  };

  const handleDelete = () => {
    toast(
      (t) => (
        <div>
          <p>「{medication.name}」を削除しますか？</p>
          <p>※関連する服用記録も削除されます。</p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              className="btn btn-danger"
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await deleteMedication(medication.id);
                  toast.success(`「${medication.name}」を削除しました`);
                } catch (error) {
                  console.error('薬剤の削除に失敗しました:', error);
                  toast.error(
                    '薬剤の削除に失敗しました。もう一度お試しください。'
                  );
                }
              }}
            >
              削除する
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => toast.dismiss(t.id)}
            >
              キャンセル
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  const handleEdit = () => {
    onEdit(medication);
  };

  return (
    <div className="medication-card">
      <div className="card-header">
        <h3 className="medication-name">{medication.name}</h3>
      </div>
      <div className="card-body">
        <div className="medication-detail">
          <span className="detail-label">服用量:</span>
          <span className="detail-value">{medication.dosage}</span>
        </div>
        <div className="medication-detail">
          <span className="detail-label">服用回数:</span>
          <span className="detail-value">1日{medication.frequency}回</span>
        </div>
        <div className="medication-detail">
          <span className="detail-label">服用時間:</span>
          <span className="detail-value">{medication.times.join(', ')}</span>
        </div>
        <div className="medication-detail">
          <span className="detail-label">期間:</span>
          <span className="detail-value">{formatDateRange()}</span>
        </div>
        {medication.memo && (
          <div className="medication-detail memo">
            <span className="detail-label">メモ:</span>
            <span className="detail-value">{medication.memo}</span>
          </div>
        )}
      </div>
      <div className="card-footer">
        <div className="card-footer-left">
          {isCompleted && (
            <span className="medication-status-badge">服用終了</span>
          )}
        </div>
        <div className="card-footer-right">
          <button className="btn btn-secondary" onClick={handleEdit}>
            編集
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            削除
          </button>
        </div>
      </div>
    </div>
  );
}

export default MedicationCard;
