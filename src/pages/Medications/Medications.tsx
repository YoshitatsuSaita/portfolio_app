import { useState } from "react"; // useStateフックをインポート（モーダル開閉状態管理用）
import MedicationList from "../../components/MedicationList/MedicationList"; // 薬剤一覧コンポーネントをインポート
import Modal from "../../components/Modal/Modal"; // モーダルコンポーネントをインポート
import MedicationForm from "../../components/MedicationForm/MedicationForm"; // 薬剤登録フォームをインポート
import "./Medications.css"; // CSSファイルをインポート

// 薬剤管理画面コンポーネント - 薬剤の登録・編集・削除を行う画面
function Medications() {
  const [isModalOpen, setIsModalOpen] = useState(false); // モーダルの開閉状態（初期値: false = 閉じている）

  // モーダルを開く関数
  const handleOpenModal = () => {
    setIsModalOpen(true); // モーダルを開く
  };

  // モーダルを閉じる関数
  const handleCloseModal = () => {
    setIsModalOpen(false); // モーダルを閉じる
  };

  // フォーム送信成功時の処理
  const handleFormSuccess = () => {
    handleCloseModal(); // モーダルを閉じる
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
        <button className="btn btn-primary" onClick={handleOpenModal}>
          {" "}
          {/* 新規登録ボタン */}+ 新規登録 {/* ボタンテキスト */}
        </button>
      </div>
      <MedicationList /> {/* 薬剤一覧を表示 */}
      {/* モーダル - 薬剤登録フォームを表示 */}
      <Modal
        isOpen={isModalOpen} // モーダルの開閉状態
        onClose={handleCloseModal} // モーダルを閉じる関数
        title="新しい薬剤を登録" // モーダルのタイトル
      >
        <MedicationForm onSuccess={handleFormSuccess} />{" "}
        {/* 薬剤登録フォーム */}
      </Modal>
    </div>
  );
}

export default Medications; // 他のファイルから使用できるようにエクスポート
