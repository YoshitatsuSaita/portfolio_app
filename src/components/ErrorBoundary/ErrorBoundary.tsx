import React, { Component, ErrorInfo, ReactNode } from "react"; // Reactのクラスコンポーネント関連の型をインポート
import "./ErrorBoundary.css"; // CSSファイルをインポート

// ErrorBoundaryコンポーネントのpropsの型定義
interface ErrorBoundaryProps {
  children: ReactNode; // 子コンポーネント - エラーバウンダリーで保護する対象
}

// ErrorBoundaryコンポーネントのstateの型定義
interface ErrorBoundaryState {
  hasError: boolean; // エラーが発生したかどうかのフラグ
  error: Error | null; // 発生したエラーオブジェクト（エラーがない場合はnull）
  errorInfo: ErrorInfo | null; // エラーの詳細情報（コンポーネントスタックなど、エラーがない場合はnull）
}

// エラーバウンダリーコンポーネント - 子コンポーネントで発生したエラーをキャッチして表示
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // 初期状態の設定
  constructor(props: ErrorBoundaryProps) {
    super(props); // 親クラス（Component）のコンストラクタを呼び出し
    this.state = {
      hasError: false, // 初期状態ではエラーなし
      error: null, // エラーオブジェクトは未設定
      errorInfo: null, // エラー詳細情報は未設定
    };
  }

  // エラーが発生した時に呼び出される静的メソッド - stateを更新してエラーUIを表示
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // エラーが発生したことを示すフラグをtrueに設定
    return { hasError: true }; // この戻り値がstateにマージされる
  }

  // エラーが発生した後に呼び出されるライフサイクルメソッド - エラーログを記録
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // エラー情報をコンソールに出力（デバッグ用）
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // エラーオブジェクトとエラー詳細情報をstateに保存
    this.setState({
      error, // 発生したエラーオブジェクト
      errorInfo, // エラーの詳細情報（コンポーネントスタックなど）
    });

    // 本番環境では、ここでエラーレポーティングサービス（例: Sentry）にエラーを送信することもできる
  }

  // ページをリロードしてエラー状態をリセットする関数
  handleReload = (): void => {
    window.location.reload(); // ブラウザのページ全体をリロード
  };

  // エラー状態をリセットして通常表示に戻す関数
  handleReset = (): void => {
    this.setState({
      hasError: false, // エラーフラグをfalseに戻す
      error: null, // エラーオブジェクトをクリア
      errorInfo: null, // エラー詳細情報をクリア
    });
  };

  render() {
    // エラーが発生している場合はエラーUIを表示
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          {" "}
          {/* エラーバウンダリー全体のコンテナ */}
          <div className="error-boundary-content">
            {" "}
            {/* エラー内容を表示するコンテナ */}
            {/* エラーアイコン */}
            <div className="error-icon">⚠️</div> {/* 警告アイコンを表示 */}
            {/* エラータイトル */}
            <h1 className="error-title">問題が発生しました</h1>{" "}
            {/* エラーが発生したことをユーザーに伝える */}
            {/* エラーメッセージ */}
            <p className="error-message">
              申し訳ございません。予期しないエラーが発生しました。
              <br />
              ページをリロードしてもう一度お試しください。
            </p>{" "}
            {/* ユーザーに対する説明とリカバリー方法の提示 */}
            {/* アクションボタン群 */}
            <div className="error-actions">
              {" "}
              {/* ボタンを配置するコンテナ */}
              <button
                className="btn btn-primary" // プライマリボタンスタイル適用
                onClick={this.handleReload} // クリック時にページをリロード
              >
                ページをリロード {/* ボタンテキスト */}
              </button>
              <button
                className="btn btn-secondary" // セカンダリボタンスタイル適用
                onClick={this.handleReset} // クリック時にエラー状態をリセット
              >
                再試行 {/* ボタンテキスト */}
              </button>
            </div>
            {/* エラー詳細（開発環境のみ表示） */}
            {import.meta.env.DEV && // Viteの開発環境フラグを使用 - 開発モードの場合にtrueになる
              this.state.error && ( // エラーオブジェクトが存在する場合のみ表示
                <details className="error-details">
                  {" "}
                  {/* 展開可能な詳細情報エリア */}
                  <summary className="error-details-summary">
                    エラー詳細（開発環境のみ）
                  </summary>{" "}
                  {/* クリックで展開するサマリー */}
                  <div className="error-details-content">
                    {" "}
                    {/* 詳細内容のコンテナ */}
                    {/* エラーメッセージ */}
                    <p>
                      <strong>エラーメッセージ:</strong>
                    </p>
                    <pre className="error-code">
                      {this.state.error.toString()}
                    </pre>{" "}
                    {/* エラーオブジェクトを文字列化して表示 */}
                    {/* コンポーネントスタック */}
                    {this.state.errorInfo && ( // エラー詳細情報が存在する場合のみ表示
                      <>
                        <p>
                          <strong>コンポーネントスタック:</strong>
                        </p>
                        <pre className="error-code">
                          {this.state.errorInfo.componentStack}
                        </pre>{" "}
                        {/* エラーが発生したコンポーネントの階層を表示 */}
                      </>
                    )}
                  </div>
                </details>
              )}
          </div>
        </div>
      );
    }

    // エラーが発生していない場合は通常通り子コンポーネントを表示
    return this.props.children; // 子コンポーネントをそのままレンダリング
  }
}

export default ErrorBoundary; // 他のファイルから使用できるようにエクスポート
