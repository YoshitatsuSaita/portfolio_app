import "./Medications.css"; // CSSファイルをインポート

// 薬剤管理画面コンポーネント - 薬剤の登録・編集・削除を行う画面
function Medications() {
  return (
    <div className="medications">
      {" "}
      {/* 薬剤管理画面全体のコンテナ */}
      <h1>薬剤管理</h1> {/* ページタイトル */}
      <p>ここに登録済み薬剤の一覧が表示されます</p>{" "}
      {/* プレースホルダーテキスト */}
    </div>
  );
}

export default Medications; // 他のファイルから使用できるようにエクスポート
