import "./Calendar.css"; // CSSファイルをインポート

// カレンダー画面コンポーネント - 月次カレンダーで服用予定を表示する画面
function Calendar() {
  return (
    <div className="calendar">
      {" "}
      {/* カレンダー画面全体のコンテナ */}
      <h1>服用カレンダー</h1> {/* ページタイトル */}
      <p>ここにカレンダーが表示されます</p> {/* プレースホルダーテキスト */}
    </div>
  );
}

export default Calendar; // 他のファイルから使用できるようにエクスポート
