import { useEffect } from "react"; // useEffectフックをインポート（ESCキーイベント用）
import "./Modal.css"; // モーダルのCSSをインポート

// Modalコンポーネントのpropsの型定義
interface ModalProps {
  isOpen: boolean; // モーダルの開閉状態
  onClose: () => void; // モーダルを閉じる関数
  title: string; // モーダルのタイトル
  children: React.ReactNode; // モーダル内に表示するコンテンツ
}

// 共通モーダルコンポーネント - オーバーレイ表示とコンテンツ表示を提供
function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // ESCキーでモーダルを閉じる処理
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      // ESCキーが押されたかチェック
      if (e.key === "Escape") {
        onClose(); // モーダルを閉じる
      }
    };

    // モーダルが開いている場合のみイベントリスナーを追加
    if (isOpen) {
      document.addEventListener("keydown", handleEscape); // ESCキーイベントを登録
    }

    // クリーンアップ関数 - コンポーネントのアンマウント時やisOpen変更時に実行
    return () => {
      document.removeEventListener("keydown", handleEscape); // イベントリスナーを削除
    };
  }, [isOpen, onClose]); // isOpenまたはonCloseが変更されたら再実行

  // モーダルが閉じている場合は何も表示しない
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* オーバーレイ - 背景クリックでモーダルを閉じる */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* モーダル本体 - クリックイベントの伝播を止める */}
        <div className="modal-header">
          {/* モーダルヘッダー */}
          <h2 className="modal-title">{title}</h2> {/* タイトル表示 */}
          <button
            className="modal-close-button"
            onClick={onClose} // 閉じるボタンクリックでモーダルを閉じる
            aria-label="閉じる" // アクセシビリティ用のラベル
          >
            ×{/* 閉じるアイコン（×マーク） */}
          </button>
        </div>
        <div className="modal-body">
          {/* モーダル本体 */}
          {children} {/* 渡されたコンテンツを表示 */}
        </div>
      </div>
    </div>
  );
}

export default Modal; // 他のファイルから使用できるようにエクスポート
