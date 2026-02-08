import { useState } from "react"; // useStateフックをインポート（モーダル開閉状態管理用）
import { Medication } from "../../types"; // Medication型をインポート - 編集対象の薬剤データの型定義
import MedicationList from "../../components/MedicationList/MedicationList"; // 薬剤一覧コンポーネントをインポート
import Modal from "../../components/Modal/Modal"; // モーダルコンポーネントをインポート
import MedicationForm from "../../components/MedicationForm/MedicationForm"; // 薬剤登録フォームをインポート
import "./Medications.css"; // CSSファイルをインポート

// 薬剤管理画面コンポーネント - 薬剤の登録・編集・削除を行う画面
function Medications() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // 新規登録モーダルの開閉状態（初期値: false = 閉じている）
  const [editingMedication, setEditingMedication] = useState<Medication | null>(
    null,
  ); // 編集中の薬剤データ（null = 編集モードではない）

  // 新規登録モーダルを開く関数
  const handleOpenAddModal = () => {
    setIsAddModalOpen(true); // 新規登録モーダルを開く
  };

  // 新規登録モーダルを閉じる関数
  const handleCloseAddModal = () => {
    setIsAddModalOpen(false); // 新規登録モーダルを閉じる
  };

  // 編集モーダルを開く関数
  const handleOpenEditModal = (medication: Medication) => {
    setEditingMedication(medication); // 編集対象の薬剤データを状態に保存 - これによりモーダルが開く
  };

  // 編集モーダルを閉じる関数
  const handleCloseEditModal = () => {
    setEditingMedication(null); // 編集対象をクリア - これによりモーダルが閉じる
  };

  // フォーム送信成功時の処理（新規登録用）
  const handleAddSuccess = () => {
    handleCloseAddModal(); // モーダルを閉じる
    // 薬剤一覧は自動的に再レンダリングされる（Zustandストアが更新されるため）
  };

  // フォーム送信成功時の処理（編集用）
  const handleEditSuccess = () => {
    handleCloseEditModal(); // モーダルを閉じる
    // 薬剤一覧は自動的に再レンダリングされる（Zustandストアが更新されるため）
  };

  return (
    <div className="medications">
      {" "}
      {/* 薬剤管理画面全体のコンテナ */}
      <div className="medications-header">
        {" "}
        {/* ヘッダー部分 */}
        <h1>薬剤管理</h1> {/* ページタイトル */}
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          {" "}
          {/* 新規登録ボタン */}+ 新規登録 {/* ボタンテキスト */}
        </button>
      </div>
      <MedicationList onEdit={handleOpenEditModal} />{" "}
      {/* 薬剤一覧を表示 - 編集コールバックを渡す */}
      {/* 新規登録用モーダル */}
      <Modal
        isOpen={isAddModalOpen} // モーダルの開閉状態
        onClose={handleCloseAddModal} // モーダルを閉じる関数
        title="新しい薬剤を登録" // モーダルのタイトル
      >
        <MedicationForm onSuccess={handleAddSuccess} />{" "}
        {/* 薬剤登録フォーム - medicationプロパティなし = 新規登録モード */}
      </Modal>
      {/* 編集用モーダル */}
      <Modal
        isOpen={editingMedication !== null} // 編集対象がある場合にモーダルを開く
        onClose={handleCloseEditModal} // モーダルを閉じる関数
        title="薬剤情報を編集" // モーダルのタイトル
      >
        {editingMedication && ( // 編集対象がある場合のみフォームを表示（条件付きレンダリング）
          <MedicationForm
            medication={editingMedication} // 編集対象の薬剤データを渡す - これにより編集モードになる
            onSuccess={handleEditSuccess} // 編集成功時の処理
          />
        )}
      </Modal>
    </div>
  );
}

export default Medications; // 他のファイルから使用できるようにエクスポート
