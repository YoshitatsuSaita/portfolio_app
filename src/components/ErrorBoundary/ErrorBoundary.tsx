import { Component, ErrorInfo, ReactNode } from 'react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // エラー発生時にフォールバックUIを表示するためstateを更新
    return { hasError: true, error };
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary__content">
            <p className="error-boundary__icon">⚠️</p>
            <h1 className="error-boundary__title">エラーが発生しました</h1>
            <p className="error-boundary__message">
              予期しないエラーが発生しました。
              <br />
              再試行しても解決しない場合はページを再読み込みしてください。
            </p>
            {this.state.error && (
              <p className="error-boundary__detail">
                {this.state.error.message}
              </p>
            )}
            <div className="error-boundary__actions">
              <button
                className="error-boundary__button error-boundary__button--primary"
                onClick={this.handleReset}
              >
                再試行
              </button>
              <button
                className="error-boundary__button error-boundary__button--secondary"
                onClick={() => window.location.replace('/')}
              >
                ホームに戻る
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
