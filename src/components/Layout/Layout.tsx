import { Outlet } from "react-router-dom"; // 子ルートをレンダリングするためのOutletをインポート
import Header from "../Header/Header"; // Headerコンポーネントをインポート
import Navigation from "../Navigation/Navigation"; // Navigationコンポーネントをインポート
import "./Layout.css"; // CSSファイルをインポート

// レイアウトコンポーネント - 全ページ共通のレイアウト構造を提供
function Layout() {
  return (
    <div className="layout">
      {" "}
      {/* レイアウト全体のコンテナ */}
      <Header /> {/* ヘッダーを表示 */}
      <Navigation /> {/* ナビゲーションバーを表示 */}
      <main className="main-content">
        {" "}
        {/* メインコンテンツエリア */}
        <Outlet />{" "}
        {/* 現在のルートに対応するページコンポーネントをここに表示 */}
      </main>
    </div>
  );
}

export default Layout; // 他のファイルから使用できるようにエクスポート
