import { Medication } from "../../types"; // Medication型をインポート - 薬剤データの型定義
import { useMedicationStore } from "../../store/medicationStore"; // Zustandストアをインポート - 削除機能を使用
import "./MedicationCard.css"; // CSSファイルをインポート - カードのスタイル定義

// MedicationCardコンポーネントのプロパティの型定義
interface MedicationCardProps {
  medication: Medication; // 表示する薬剤データ - 親コンポーネントから渡される
  onEdit: (medication: Medication) => void; // 編集ボタンクリック時のコールバック関数 - 親コンポーネントで編集モーダルを開く
}

// MedicationCardコンポーネント - 1つの薬剤情報をカード形式で表示
function MedicationCard({ medication, onEdit }: MedicationCardProps) {
  const deleteMedication = useMedicationStore(
    (state) => state.deleteMedication,
  ); // ストアから削除関数を取得

  // 服用期間を表示用にフォーマットする関数
  const formatDateRange = () => {
    const startDate = new Date(medication.startDate).toLocaleDateString(
      "ja-JP",
    ); // 開始日を日本語形式に変換（例: 2024/1/1）
    if (medication.endDate) {
      // 終了日が設定されている場合
      const endDate = new Date(medication.endDate).toLocaleDateString("ja-JP"); // 終了日を日本語形式に変換
      return `${startDate} 〜 ${endDate}`; // 「開始日 〜 終了日」形式で返す
    }
    return `${startDate} 〜 継続中`; // 終了日がない場合は「継続中」と表示
  };

  // 削除ボタンがクリックされた時の処理
  const handleDelete = async () => {
    // 削除確認ダイアログを表示 - 誤操作防止のため必ず確認
    const confirmed = window.confirm(
      `「${medication.name}」を削除してもよろしいですか？\n※関連する服用記録も削除されます。`,
    );

    if (!confirmed) return; // ユーザーがキャンセルした場合は処理を中断

    try {
      await deleteMedication(medication.id); // Zustandストアの削除関数を呼び出し - IndexedDBから削除
    } catch (error) {
      console.error("薬剤の削除に失敗しました:", error); // エラーが発生した場合はコンソールに出力
      alert("薬剤の削除に失敗しました。もう一度お試しください。"); // ユーザーにエラーを通知
    }
  };

  // 編集ボタンがクリックされた時の処理
  const handleEdit = () => {
    onEdit(medication); // 親コンポーネントに薬剤データを渡して編集モーダルを開く
  };

  return (
    <div className="medication-card">
      {" "}
      {/* カード全体のコンテナ */}
      <div className="card-header">
        {" "}
        {/* カードのヘッダー部分 */}
        <h3 className="medication-name">{medication.name}</h3>{" "}
        {/* 薬品名を大きく表示 */}
      </div>
      <div className="card-body">
        {" "}
        {/* カードの本体部分 */}
        <div className="medication-detail">
          {" "}
          {/* 詳細情報の1項目 */}
          <span className="detail-label">服用量:</span> {/* ラベル - 項目名 */}
          <span className="detail-value">{medication.dosage}</span>{" "}
          {/* 値 - 服用量（例: "1錠"） */}
        </div>
        <div className="medication-detail">
          {" "}
          {/* 詳細情報の1項目 */}
          <span className="detail-label">服用回数:</span>{" "}
          {/* ラベル - 項目名 */}
          <span className="detail-value">1日{medication.frequency}回</span>{" "}
          {/* 値 - 服用回数（例: "1日2回"） */}
        </div>
        <div className="medication-detail">
          {" "}
          {/* 詳細情報の1項目 */}
          <span className="detail-label">服用時間:</span>{" "}
          {/* ラベル - 項目名 */}
          <span className="detail-value">
            {medication.times.join(", ")}
          </span>{" "}
          {/* 値 - 服用時間の配列をカンマ区切りで表示（例: "08:00, 20:00"） */}
        </div>
        <div className="medication-detail">
          {" "}
          {/* 詳細情報の1項目 */}
          <span className="detail-label">期間:</span> {/* ラベル - 項目名 */}
          <span className="detail-value">{formatDateRange()}</span>{" "}
          {/* 値 - フォーマットした服用期間 */}
        </div>
        {medication.memo && ( // メモが存在する場合のみ表示（条件付きレンダリング）
          <div className="medication-detail memo">
            {" "}
            {/* メモ用のクラスを追加 */}
            <span className="detail-label">メモ:</span> {/* ラベル - 項目名 */}
            <span className="detail-value">{medication.memo}</span>{" "}
            {/* 値 - メモの内容 */}
          </div>
        )}
      </div>
      <div className="card-footer">
        {" "}
        {/* カードのフッター部分 - ボタン配置エリア */}
        <button
          className="btn btn-secondary" // 編集ボタン用のスタイルクラス - 青系の配色
          onClick={handleEdit} // クリック時に編集処理を実行
        >
          編集 {/* ボタンテキスト */}
        </button>
        <button
          className="btn btn-danger" // 削除ボタン用のスタイルクラス - 赤系の配色で危険な操作を示す
          onClick={handleDelete} // クリック時に削除処理を実行
        >
          削除 {/* ボタンテキスト */}
        </button>
      </div>
    </div>
  );
}

export default MedicationCard; // 他のファイルから使用できるようにエクスポート
