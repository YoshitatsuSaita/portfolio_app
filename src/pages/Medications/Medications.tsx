import { useState } from "react";
import { Medication } from "../../types";
import MedicationList from "../../components/MedicationList/MedicationList";
import Modal from "../../components/Modal/Modal";
import MedicationForm from "../../components/MedicationForm/MedicationForm";
import "./Medications.css";

function Medications() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(
    null,
  );

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleOpenEditModal = (medication: Medication) => {
    setEditingMedication(medication);
  };

  const handleCloseEditModal = () => {
    setEditingMedication(null);
  };

  const handleAddSuccess = () => {
    handleCloseAddModal();
    // 薬剤一覧は自動的に再レンダリングされる（Zustandストアが更新されるため）
  };

  const handleEditSuccess = () => {
    handleCloseEditModal();
    // 薬剤一覧は自動的に再レンダリングされる（Zustandストアが更新されるため）
  };

  return (
    <div className="medications">
      <div className="medications-header">
        <h1>処方箋管理</h1>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          + 新規登録
        </button>
      </div>
      <MedicationList onEdit={handleOpenEditModal} />
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        title="新しい薬剤を登録"
      >
        <MedicationForm onSuccess={handleAddSuccess} />
      </Modal>
      <Modal
        isOpen={editingMedication !== null}
        onClose={handleCloseEditModal}
        title="薬剤情報を編集"
      >
        {editingMedication && (
          <MedicationForm
            medication={editingMedication}
            onSuccess={handleEditSuccess}
          />
        )}
      </Modal>
    </div>
  );
}

export default Medications;
