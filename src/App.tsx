// src/App.tsx

import { BrowserRouter, Routes, Route } from "react-router-dom"; // ルーティング用のコンポーネントをインポート
import Layout from "./components/Layout/Layout"; // レイアウトコンポーネントをインポート
import Home from "./pages/Home/Home"; // ホーム画面をインポート
import Medications from "./pages/Medications/Medications"; // 薬剤管理画面をインポート
import Calendar from "./pages/Calendar/Calendar"; // カレンダー画面をインポート
import Settings from "./pages/Settings/Settings"; // 設定画面をインポート（新規追加）
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary"; // ErrorBoundaryコンポーネントをインポート
import "./App.css"; // CSSをインポート

function App() {
  return (
    <ErrorBoundary>
      {" "}
      {/* アプリ全体をErrorBoundaryでラップ - 予期しないエラーをキャッチ */}
      <BrowserRouter>
        {" "}
        {/* ルーティングを有効化 */}
        <Routes>
          {" "}
          {/* ルート定義 */}
          <Route path="/" element={<Layout />}>
            {" "}
            {/* レイアウトコンポーネントを適用 */}
            <Route index element={<Home />} /> {/* ホーム画面（/） */}
            <Route path="medications" element={<Medications />} />{" "}
            {/* 薬剤管理画面（/medications） */}
            <Route path="calendar" element={<Calendar />} />{" "}
            {/* カレンダー画面（/calendar） */}
            <Route path="settings" element={<Settings />} />{" "}
            {/* 設定画面（/settings）（新規追加） */}
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App; // エクスポート
