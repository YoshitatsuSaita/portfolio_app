import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useMedicationStore } from '../../store/medicationStore';
import { Medication } from '../../types';
import MedicationCard from '../MedicationCard/MedicationCard';
import './MedicationList.css';

interface MedicationListProps {
  onEdit: (medication: Medication) => void;
}

function MedicationList({ onEdit }: MedicationListProps) {
  const { medications, loading, error, fetchMedications } =
    useMedicationStore();

  useEffect(() => {
    fetchMedications(); // IndexedDBから全薬剤を取得してストアに保存
  }, [fetchMedications]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  if (loading) {
    return (
      <div className="medication-list-container">
        <div className="loading">読み込み中...</div>
      </div>
    );
  }

  if (medications.length === 0) {
    return (
      <div className="medication-list-container">
        <div className="empty-state">
          <p>登録されている薬剤がありません</p>
          <p className="empty-hint">
            「新規登録」ボタンから薬剤を追加してください
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="medication-list-container">
      <div className="medication-list">
        {medications.map((medication) => (
          <MedicationCard
            key={medication.id}
            medication={medication}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}

export default MedicationList;
