import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Home from "./pages/Home/Home";
import Medications from "./pages/Medications/Medications";
import Calendar from "./pages/Calendar/Calendar";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary"; // ErrorBoundaryコンポーネントをインポート
import "./App.css";

function App() {
  return (
    <ErrorBoundary>
      {" "}
      {/* アプリ全体をErrorBoundaryでラップ - 予期しないエラーをキャッチ */}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="medications" element={<Medications />} />
            <Route path="calendar" element={<Calendar />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
