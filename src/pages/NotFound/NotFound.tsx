import { useNavigate } from 'react-router-dom';
import './NotFound.css';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found">
      <div className="not-found__content">
        <p className="not-found__code">404</p>
        <h1 className="not-found__title">ページが見つかりません</h1>
        <button className="not-found__button" onClick={() => navigate('/')}>
          ホームに戻る
        </button>
      </div>
    </div>
  );
}

export default NotFound;
