import ScheduleList from "../../components/ScheduleList/ScheduleList"; // ScheduleListコンポーネントをインポート
import AdherenceRate from "../../components/AdherenceRate/AdherenceRate"; // AdherenceRateコンポーネントをインポート
import "./Home.css"; // CSSをインポート

// ホーム画面コンポーネント - 今日の服用予定と遵守率を表示する画面
function Home() {
  return (
    <div className="home">
      {" "}
      {/* ホーム画面全体のコンテナ */}
      <h1>今日の服用予定</h1> {/* ページタイトル */}
      <AdherenceRate /> {/* 服用遵守率を表示 */}
      <ScheduleList />{" "}
      {/* 今日の服用予定リストを表示（dateプロパティ未指定 = 今日） */}
    </div>
  );
}

export default Home; // エクスポート
