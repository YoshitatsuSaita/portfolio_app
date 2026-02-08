import { useEffect } from "react"; // useEffectフックをインポート - コンポーネントのライフサイクル管理
import { useMedicationStore } from "../../store/medicationStore"; // Zustandストアをインポート - 薬剤データと操作関数を取得
import MedicationCard from "../MedicationCard/MedicationCard"; // MedicationCardコンポーネントをインポート - 個別の薬剤カードを表示
import "./MedicationList.css"; // CSSファイルをインポート - リストのスタイル定義

// MedicationListコンポーネント - 薬剤の一覧を表示
function MedicationList() {
  // Zustandストアから必要な状態とアクションを取得
  const { medications, loading, error, fetchMedications } =
    useMedicationStore();
  // medications: 薬剤データの配列
  // loading: データ読み込み中フラグ（true/false）
  // error: エラーメッセージ（文字列またはnull）
  // fetchMedications: IndexedDBから薬剤を取得する関数

  // コンポーネントの初回レンダリング時にデータを取得
  useEffect(() => {
    fetchMedications(); // IndexedDBから全薬剤を取得してストアに保存
  }, []); // 依存配列が空なので、コンポーネントのマウント時に1回だけ実行

  // ローディング中の表示
  if (loading) {
    return (
      <div className="medication-list-container">
        {" "}
        {/* コンテナ */}
        <div className="loading">読み込み中...</div>{" "}
        {/* ローディングメッセージ */}
      </div>
    );
  }

  // エラー発生時の表示
  if (error) {
    return (
      <div className="medication-list-container">
        {" "}
        {/* コンテナ */}
        <div className="error">{error}</div> {/* エラーメッセージを表示 */}
      </div>
    );
  }

  // 薬剤が0件の場合の表示
  if (medications.length === 0) {
    return (
      <div className="medication-list-container">
        {" "}
        {/* コンテナ */}
        <div className="empty-state">
          {" "}
          {/* 空の状態用のコンテナ */}
          <p>登録されている薬剤がありません</p> {/* メッセージを表示 */}
          <p className="empty-hint">
            「新規登録」ボタンから薬剤を追加してください
          </p>{" "}
          {/* ヒントを表示 */}
        </div>
      </div>
    );
  }

  // 薬剤が存在する場合の表示
  return (
    <div className="medication-list-container">
      {" "}
      {/* コンテナ */}
      <div className="medication-list">
        {" "}
        {/* リスト本体 */}
        {medications.map(
          (
            medication, // 薬剤の配列をループして各薬剤のカードを生成
          ) => (
            <MedicationCard
              key={medication.id} // Reactのkey属性 - 各要素を一意に識別（再レンダリングの最適化）
              medication={medication} // 薬剤データをMedicationCardコンポーネントに渡す
            />
          ),
        )}
      </div>
    </div>
  );
}

export default MedicationList; // 他のファイルから使用できるようにエクスポート
