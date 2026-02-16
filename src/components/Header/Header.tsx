import "./Header.css"; // CSSファイルをインポート

// ヘッダーコンポーネント - アプリ名を表示する共通ヘッダー
function Header() {
  return (
    <header className="header">
      {" "}
      {/* ヘッダー全体のコンテナ */}
      <h1 className="header-title">処方箋服用スケジュール管理</h1>{" "}
      {/* アプリケーション名 */}
    </header>
  );
}

export default Header; // 他のファイルから使用できるようにエクスポート
