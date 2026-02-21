import dayjs from "dayjs";
import { Medication } from "../../types";
import { useMedicationStore } from "../../store/medicationStore";
import "./MedicationCard.css";

interface MedicationCardProps {
  medication: Medication;
  onEdit: (medication: Medication) => void;
}

function MedicationCard({ medication, onEdit }: MedicationCardProps) {
  const deleteMedication = useMedicationStore(
    (state) => state.deleteMedication,
  );

  const isCompleted =
    !!medication.endDate && dayjs(medication.endDate).isBefore(dayjs(), "day");

  const formatDateRange = () => {
    const startDate = new Date(medication.startDate).toLocaleDateString(
      "ja-JP",
    );
    if (medication.endDate) {
      const endDate = new Date(medication.endDate).toLocaleDateString("ja-JP");
      return `${startDate} 〜 ${endDate}`;
    }
    return `${startDate} 〜 継続中`;
  };

  const handleDelete = async () => {
    // 誤操作防止のため必ず確認
    const confirmed = window.confirm(
      `「${medication.name}」を削除してもよろしいですか？\n※関連する服用記録も削除されます。`,
    );

    if (!confirmed) return;

    try {
      await deleteMedication(medication.id); // IndexedDBから削除
    } catch (error) {
      console.error("薬剤の削除に失敗しました:", error);
      alert("薬剤の削除に失敗しました。もう一度お試しください。");
    }
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
          <span className="detail-value">{medication.times.join(", ")}</span>
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
          <button
            className="btn btn-secondary"
            onClick={handleEdit}
          >
            編集
          </button>
          <button
            className="btn btn-danger"
            onClick={handleDelete}
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
}

export default MedicationCard;
