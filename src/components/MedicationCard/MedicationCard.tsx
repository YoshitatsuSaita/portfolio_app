import { Medication } from "../../types"; // Medication型をインポート - 薬剤データの型定義
import "./MedicationCard.css"; // CSSファイルをインポート - カードのスタイル定義

// MedicationCardコンポーネントのプロパティの型定義
interface MedicationCardProps {
  medication: Medication; // 表示する薬剤データ - 親コンポーネントから渡される
}

// MedicationCardコンポーネント - 1つの薬剤情報をカード形式で表示
function MedicationCard({ medication }: MedicationCardProps) {
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
        {/* 編集・削除ボタンは次のステップで実装 */}
      </div>
    </div>
  );
}

export default MedicationCard; // 他のファイルから使用できるようにエクスポート
