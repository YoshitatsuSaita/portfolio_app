import { NavLink } from "react-router-dom"; // ルーティング用のNavLinkをインポート
import "./Navigation.css"; // CSSファイルをインポート

// ナビゲーションコンポーネント - 主要画面への遷移リンクを提供
function Navigation() {
  return (
    <nav className="navigation">
      {" "}
      {/* ナビゲーション全体のコンテナ */}
      {/* NavLinkは現在のページに応じて自動的にactiveクラスを付与 */}
      <NavLink
        to="/"
        className={({ isActive }) =>
          isActive ? "nav-link active" : "nav-link"
        } // アクティブ時にactiveクラスを追加
      >
        ホーム {/* ホーム画面へのリンク */}
      </NavLink>
      <NavLink
        to="/medications"
        className={({ isActive }) =>
          isActive ? "nav-link active" : "nav-link"
        } // アクティブ時にactiveクラスを追加
      >
        処方箋管理 {/* 処方箋管理画面へのリンク */}
      </NavLink>
      <NavLink
        to="/calendar"
        className={({ isActive }) =>
          isActive ? "nav-link active" : "nav-link"
        } // アクティブ時にactiveクラスを追加
      >
        カレンダー {/* カレンダー画面へのリンク */}
      </NavLink>
    </nav>
  );
}

export default Navigation; // 他のファイルから使用できるようにエクスポート
