import { BrowserRouter, Routes, Route } from "react-router-dom"; // React Routerの必要なコンポーネントをインポート
import Layout from "./components/Layout/Layout"; // Layoutコンポーネントをインポート
import Home from "./pages/Home/Home"; // Homeページコンポーネントをインポート
import Medications from "./pages/Medications/Medications"; // Medicationsページコンポーネントをインポート
import Calendar from "./pages/Calendar/Calendar"; // Calendarページコンポーネントをインポート
import "./App.css"; // アプリ全体のCSSをインポート

// アプリケーションのメインコンポーネント - ルーティング設定を定義
function App() {
  return (
    <BrowserRouter>
      {" "}
      {/* ブラウザのHistoryAPIを使用したルーティングを有効化 */}
      <Routes>
        {" "}
        {/* ルート定義の開始 */}
        <Route path="/" element={<Layout />}>
          {" "}
          {/* 共通レイアウトを適用 */}
          <Route index element={<Home />} />{" "}
          {/* "/" パスでHomeコンポーネントを表示 */}
          <Route path="medications" element={<Medications />} />{" "}
          {/* "/medications" パスでMedicationsコンポーネントを表示 */}
          <Route path="calendar" element={<Calendar />} />{" "}
          {/* "/calendar" パスでCalendarコンポーネントを表示 */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App; // 他のファイルから使用できるようにエクスポート
