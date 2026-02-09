// src/components/MedicationForm/MedicationForm.tsx

import { useForm } from "react-hook-form"; // React Hook Formをインポート
import { useEffect, useState } from "react"; // useEffectとuseStateフックをインポート - 編集モード時の初期値設定用と検索状態管理用
import { useMedicationStore } from "../../store/medicationStore"; // Zustandストアをインポート
import { Medication } from "../../types"; // Medication型をインポート - 編集モード用
import { searchDrugByName } from "../../api/fdaApi"; // OpenFDA API検索関数をインポート - 薬品詳細情報検索用
import { FDADetails } from "../../types"; // FDADetails型をインポート - 検索結果の型定義
import "./MedicationForm.css"; // CSSをインポート

// フォーム入力データの型定義
interface MedicationFormData {
  name: string; // 薬品名
  dosage: string; // 服用量
  frequency: number; // 服用回数
  times: string[]; // 服用時間の配列
  startDate: string; // 開始日
  endDate: string; // 終了日
  memo: string; // メモ
}

// MedicationFormコンポーネントのpropsの型定義
interface MedicationFormProps {
  medication?: Medication; // 編集対象の薬剤データ（任意） - 未指定の場合は新規登録モード
  onSuccess: () => void; // 登録/更新成功時に実行する関数
}

// 薬剤登録フォームコンポーネント
function MedicationForm({ medication, onSuccess }: MedicationFormProps) {
  const addMedication = useMedicationStore((state) => state.addMedication); // ストアからaddMedication関数を取得
  const updateMedication = useMedicationStore(
    (state) => state.updateMedication,
  ); // ストアからupdateMedication関数を取得

  const isEditMode = !!medication; // 編集モードかどうかを判定（medicationが存在すればtrue）

  // 検索状態の管理 - OpenFDA API検索機能用
  const [isSearching, setIsSearching] = useState(false); // 検索中フラグ - trueの場合は検索中（ローディング表示）
  const [searchResults, setSearchResults] = useState<FDADetails[]>([]); // 検索結果の配列 - 複数の候補を保持
  const [searchError, setSearchError] = useState<string | null>(null); // 検索エラーメッセージ - エラーがない場合はnull
  const [selectedFdaDetails, setSelectedFdaDetails] =
    useState<FDADetails | null>(null); // 選択されたFDA詳細情報を保持 - 保存ボタンクリック時に設定、フォーム送信時にIndexedDBに保存
  const [expandedResultIndex, setExpandedResultIndex] = useState<number | null>(
    null,
  ); // 展開中の検索結果のインデックス - アコーディオン制御用（nullの場合は全て折りたたみ状態）

  // React Hook Formの初期化
  const {
    register, // 入力欄を登録する関数
    handleSubmit, // フォーム送信時の処理を登録する関数
    watch, // フォームの値を監視する関数
    reset, // フォームをリセットする関数
    formState: { errors, isSubmitting }, // エラー情報と送信中フラグ
  } = useForm<MedicationFormData>({
    defaultValues: {
      // デフォルト値を設定
      name: "", // 薬品名は空文字
      dosage: "", // 服用量は空文字
      frequency: 1, // 服用回数は1回
      times: ["08:00"], // 服用時間は朝8時をデフォルト
      startDate: new Date().toISOString().split("T")[0], // 開始日は今日
      endDate: "", // 終了日は空（未設定）
      memo: "", // メモは空文字
    },
  });

  // 編集モードの場合、フォームに既存データを設定
  useEffect(() => {
    if (medication) {
      // medicationが存在する場合（編集モード）
      reset({
        // フォームの値をリセットして既存データを設定
        name: medication.name, // 薬品名
        dosage: medication.dosage, // 服用量
        frequency: medication.frequency, // 服用回数
        times: medication.times, // 服用時間の配列
        startDate: medication.startDate, // 開始日
        endDate: medication.endDate || "", // 終了日（nullの場合は空文字）
        memo: medication.memo, // メモ
      });
    }
  }, [medication, reset]); // medicationまたはresetが変更された時に再実行

  const frequency = watch("frequency"); // 服用回数の値を監視
  const drugName = watch("name"); // 薬品名の値を監視 - 検索ボタンの有効/無効判定に使用

  // OpenFDA API検索処理 - 「詳細情報を検索」ボタンクリック時に実行
  const handleSearch = async () => {
    if (!drugName.trim()) {
      // 薬品名が空の場合は検索しない（トリム後の空文字チェック）
      setSearchError("薬品名を入力してください"); // エラーメッセージを設定
      return; // 処理を中断
    }

    setIsSearching(true); // 検索中フラグをtrueに設定 - ローディング表示開始
    setSearchError(null); // エラーメッセージをクリア - 前回のエラーを削除
    setSearchResults([]); // 検索結果をクリア - 前回の結果を削除

    try {
      const results = await searchDrugByName(drugName); // OpenFDA APIを呼び出して検索実行

      if (results.length === 0) {
        // 検索結果が0件の場合
        setSearchError("該当する薬品情報が見つかりませんでした"); // エラーメッセージを設定
      } else {
        // 検索結果が1件以上の場合
        setSearchResults(results); // 検索結果を状態に保存 - 次のステップで表示用
      }
    } catch (error) {
      // API呼び出しでエラーが発生した場合
      console.error("検索エラー:", error); // コンソールにエラーを出力
      setSearchError("検索中にエラーが発生しました。もう一度お試しください。"); // ユーザー向けエラーメッセージを設定
    } finally {
      setIsSearching(false); // 検索中フラグをfalseに設定 - ローディング表示終了（成功・失敗に関わらず実行）
    }
  };

  // FDA詳細情報を保存する関数 - 「この情報を保存」ボタンクリック時に実行
  const handleSaveFdaDetails = (details: FDADetails, index: number) => {
    setSelectedFdaDetails(details); // 選択された詳細情報を状態に保存 - フォーム送信時にIndexedDBに保存される
    alert("FDA詳細情報が選択されました。薬剤登録時に保存されます。"); // ユーザーに選択完了を通知（視覚的フィードバック）
  };

  // アコーディオンの展開/折りたたみを切り替える関数 - 検索結果カードのヘッダークリック時に実行
  const toggleExpand = (index: number) => {
    setExpandedResultIndex(expandedResultIndex === index ? null : index); // 同じインデックスをクリックした場合は閉じる（null）、異なる場合は開く（そのインデックス）
  };

  // フォーム送信時の処理
  const onSubmit = async (data: MedicationFormData) => {
    try {
      if (isEditMode) {
        // 編集モードの場合
        // ZustandストアのupdateMedication関数を呼び出して薬剤を更新
        await updateMedication(medication.id, {
          // 薬剤IDを指定
          name: data.name, // 薬品名
          dosage: data.dosage, // 服用量
          frequency: data.frequency, // 服用回数
          times: data.times.slice(0, data.frequency), // 服用回数分の時間のみ取得
          startDate: data.startDate, // 開始日
          endDate: data.endDate || null, // 終了日（空の場合はnull）
          memo: data.memo, // メモ
          fdaDetails: selectedFdaDetails, // 選択されたFDA詳細情報を保存 - 検索結果から選択した場合のみ値が入る、未選択の場合はnull
        });
      } else {
        // 新規登録モードの場合
        // ZustandストアのaddMedication関数を呼び出して薬剤を登録
        await addMedication({
          name: data.name, // 薬品名
          dosage: data.dosage, // 服用量
          frequency: data.frequency, // 服用回数
          times: data.times.slice(0, data.frequency), // 服用回数分の時間のみ取得
          startDate: data.startDate, // 開始日
          endDate: data.endDate || null, // 終了日（空の場合はnull）
          memo: data.memo, // メモ
          fdaDetails: selectedFdaDetails, // 選択されたFDA詳細情報を保存 - 検索結果から選択した場合のみ値が入る、未選択の場合はnull
        });
      }
      onSuccess(); // 成功時のコールバックを実行（モーダルを閉じる）
    } catch (error) {
      console.error("薬剤の登録/更新に失敗しました:", error); // エラーをコンソールに出力
    }
  };

  return (
    <form className="medication-form" onSubmit={handleSubmit(onSubmit)}>
      {" "}
      {/* フォーム全体 */}
      {/* 薬品名入力欄 */}
      <div className="form-group">
        {" "}
        {/* フォームグループ */}
        <label htmlFor="name" className="form-label">
          {" "}
          {/* ラベル */}
          薬品名 <span className="required">*</span> {/* 必須マーク */}
        </label>
        <input
          id="name" // ラベルとの紐づけ用ID
          type="text" // テキスト入力
          className={`form-input ${errors.name ? "error" : ""}`} // エラー時にerrorクラスを追加
          placeholder="例: ロキソニン" // プレースホルダー
          {...register("name", {
            // React Hook Formに登録
            required: "薬品名は必須です", // 必須バリデーション
          })}
        />
        {errors.name && <p className="error-message">{errors.name.message}</p>}{" "}
        {/* エラーメッセージ表示 */}
        {/* OpenFDA検索ボタン - 薬品名入力後に有効化 */}
        <button
          type="button" // フォーム送信ではなく通常のボタンとして動作（submitを防ぐ）
          className="btn btn-secondary" // セカンダリボタンスタイル適用
          onClick={handleSearch} // クリック時に検索処理を実行
          disabled={!drugName.trim() || isSearching} // 薬品名が空、または検索中の場合は無効化
          style={{ marginTop: "0.5rem" }} // 上側に余白を追加（入力欄との間隔）
        >
          {isSearching ? "検索中..." : "詳細情報を検索"}{" "}
          {/* 検索中はローディングテキストを表示 */}
        </button>
        {/* 検索エラーメッセージ表示 */}
        {searchError && (
          <p className="error-message" style={{ marginTop: "0.5rem" }}>
            {searchError}
          </p>
        )}
        {/* 検索結果リスト表示エリア - アコーディオン形式で複数の候補を表示 */}
        {searchResults.length > 0 && (
          <div className="search-results" style={{ marginTop: "1rem" }}>
            {/* 検索結果件数表示 */}
            <p
              className="results-count"
              style={{
                marginBottom: "0.75rem",
                fontWeight: "500",
                color: "var(--color-text-primary)",
              }}
            >
              {searchResults.length}件の候補が見つかりました
            </p>
            {/* 検索結果を1つずつ表示 */}
            {searchResults.map((result, index) => {
              // このカードが展開されているかどうかを判定
              const isExpanded = expandedResultIndex === index;
              // このカードが選択されているかどうかを判定（保存済みかチェック）
              const isSelected = selectedFdaDetails === result;

              return (
                <div
                  key={index} // Reactのkey属性 - 各要素を一意に識別
                  className="search-result-card" // カードのスタイルクラス
                  style={{
                    border: "1px solid var(--color-border)", // ボーダー
                    borderRadius: "var(--border-radius-md)", // 角丸
                    marginBottom: "0.75rem", // カード間の余白
                    overflow: "hidden", // はみ出しを隠す
                  }}
                >
                  {/* カードヘッダー - クリックで展開/折りたたみ */}
                  <div
                    className="result-card-header"
                    onClick={() => toggleExpand(index)} // クリック時にアコーディオンを切り替え
                    style={{
                      padding: "0.75rem 1rem", // 内側の余白
                      backgroundColor: isExpanded
                        ? "var(--color-primary-light)" // 展開時は薄い青背景
                        : "var(--color-bg-secondary)", // 折りたたみ時は薄いグレー背景
                      cursor: "pointer", // カーソルをポインターに変更（クリック可能を示す）
                      display: "flex", // フレックスボックスレイアウト
                      justifyContent: "space-between", // 両端に配置
                      alignItems: "center", // 垂直方向中央揃え
                      transition: "background-color 0.2s", // 背景色変化のアニメーション
                    }}
                  >
                    <div>
                      {/* 商品名表示 - 配列の最初の要素を表示、なければ「不明」 */}
                      <strong>{result.brandName?.[0] || "商品名不明"}</strong>
                      {/* 一般名表示 - 商品名の下に小さく表示 */}
                      {result.genericName && (
                        <div
                          style={{
                            fontSize: "0.875rem", // 小さめのフォント
                            color: "var(--color-text-secondary)", // グレー
                            marginTop: "0.25rem", // 上側の余白
                          }}
                        >
                          一般名: {result.genericName[0]}
                        </div>
                      )}
                    </div>
                    {/* 展開/折りたたみアイコン */}
                    <span
                      style={{
                        fontSize: "1.25rem", // アイコンサイズ
                        transform: isExpanded
                          ? "rotate(180deg)"
                          : "rotate(0deg)", // 展開時は180度回転
                        transition: "transform 0.2s", // 回転のアニメーション
                      }}
                    >
                      ▼{/* 下向き三角アイコン */}
                    </span>
                  </div>

                  {/* カード本体 - 展開時のみ表示 */}
                  {isExpanded && (
                    <div
                      className="result-card-body"
                      style={{
                        padding: "1rem", // 内側の余白
                        backgroundColor: "var(--color-bg-primary)", // 白背景
                        borderTop: "1px solid var(--color-border)", // 上部にボーダー
                      }}
                    >
                      {/* 製造元情報 */}
                      {result.manufacturerName && (
                        <div style={{ marginBottom: "0.75rem" }}>
                          <strong
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            製造元:
                          </strong>
                          <p
                            style={{
                              margin: "0.25rem 0 0 0", // 余白調整
                              color: "var(--color-text-secondary)", // グレー
                            }}
                          >
                            {result.manufacturerName.join(", ")}
                            {/* 配列をカンマ区切りで結合 */}
                          </p>
                        </div>
                      )}

                      {/* 有効成分情報 */}
                      {result.activeIngredient && (
                        <div style={{ marginBottom: "0.75rem" }}>
                          <strong
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            有効成分:
                          </strong>
                          <p
                            style={{
                              margin: "0.25rem 0 0 0",
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            {result.activeIngredient.join(", ")}
                          </p>
                        </div>
                      )}

                      {/* 用途情報 */}
                      {result.purpose && (
                        <div style={{ marginBottom: "0.75rem" }}>
                          <strong
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            用途:
                          </strong>
                          <p
                            style={{
                              margin: "0.25rem 0 0 0",
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            {result.purpose.join(", ")}
                          </p>
                        </div>
                      )}

                      {/* 警告情報 */}
                      {result.warnings && (
                        <div style={{ marginBottom: "0.75rem" }}>
                          <strong
                            style={{ color: "var(--color-error)" }} // 警告は赤色で強調
                          >
                            警告:
                          </strong>
                          <p
                            style={{
                              margin: "0.25rem 0 0 0",
                              color: "var(--color-text-secondary)",
                              fontSize: "0.875rem", // 小さめのフォント
                            }}
                          >
                            {result.warnings[0].substring(0, 200)}...
                            {/* 最初の200文字のみ表示 */}
                          </p>
                        </div>
                      )}

                      {/* 副作用情報 */}
                      {result.adverseReactions && (
                        <div style={{ marginBottom: "0.75rem" }}>
                          <strong style={{ color: "var(--color-warning)" }}>
                            副作用:
                          </strong>
                          <p
                            style={{
                              margin: "0.25rem 0 0 0",
                              color: "var(--color-text-secondary)",
                              fontSize: "0.875rem",
                            }}
                          >
                            {result.adverseReactions[0].substring(0, 200)}...
                          </p>
                        </div>
                      )}

                      {/* 使用方法情報 */}
                      {result.dosageAndAdministration && (
                        <div style={{ marginBottom: "0.75rem" }}>
                          <strong
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            使用方法:
                          </strong>
                          <p
                            style={{
                              margin: "0.25rem 0 0 0",
                              color: "var(--color-text-secondary)",
                              fontSize: "0.875rem",
                            }}
                          >
                            {result.dosageAndAdministration[0].substring(
                              0,
                              200,
                            )}
                            ...
                          </p>
                        </div>
                      )}

                      {/* 保存ボタン */}
                      <button
                        type="button" // フォーム送信を防ぐ
                        className="btn btn-secondary" // セカンダリボタンスタイル
                        onClick={() => handleSaveFdaDetails(result, index)} // クリック時に詳細情報を保存
                        disabled={isSelected} // 既に選択済みの場合は無効化
                        style={{
                          marginTop: "0.5rem", // 上側の余白
                          width: "100%", // 幅いっぱいに表示
                        }}
                      >
                        {isSelected ? "✓ 保存済み" : "この情報を保存"}
                        {/* 選択済みの場合はチェックマーク表示 */}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* 服用量入力欄 */}
      <div className="form-group">
        <label htmlFor="dosage" className="form-label">
          服用量 <span className="required">*</span>
        </label>
        <input
          id="dosage"
          type="text"
          className={`form-input ${errors.dosage ? "error" : ""}`}
          placeholder="例: 1錠"
          {...register("dosage", {
            required: "服用量は必須です",
          })}
        />
        {errors.dosage && (
          <p className="error-message">{errors.dosage.message}</p>
        )}
      </div>
      {/* 服用回数入力欄 */}
      <div className="form-group">
        <label htmlFor="frequency" className="form-label">
          服用回数（1日あたり） <span className="required">*</span>
        </label>
        <input
          id="frequency"
          type="number"
          min="1" // 最小値は1
          max="10" // 最大値は10
          className={`form-input ${errors.frequency ? "error" : ""}`}
          {...register("frequency", {
            required: "服用回数は必須です",
            min: { value: 1, message: "1回以上を指定してください" }, // 最小値バリデーション
            max: { value: 10, message: "10回以下を指定してください" }, // 最大値バリデーション
          })}
        />
        {errors.frequency && (
          <p className="error-message">{errors.frequency.message}</p>
        )}
      </div>
      {/* 服用時間入力欄（動的生成） */}
      <div className="form-group">
        <label className="form-label">
          服用時間 <span className="required">*</span>
        </label>
        <div className="times-container">
          {" "}
          {/* 時間入力欄のコンテナ */}
          {Array.from({ length: frequency }).map((_, index) => (
            // 服用回数分の入力欄を生成
            <div key={index} className="time-input-group">
              {" "}
              {/* 各時間入力欄 */}
              <label htmlFor={`time-${index}`} className="time-label">
                {index + 1}回目 {/* 何回目かを表示 */}
              </label>
              <input
                id={`time-${index}`}
                type="time" // 時刻入力
                className={`form-input ${errors.times?.[index] ? "error" : ""}`}
                {...register(`times.${index}`, {
                  // 配列の要素として登録
                  required: "服用時間は必須です",
                })}
              />
              {errors.times?.[index] && (
                <p className="error-message">{errors.times[index]?.message}</p>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* 開始日入力欄 */}
      <div className="form-group">
        <label htmlFor="startDate" className="form-label">
          開始日 <span className="required">*</span>
        </label>
        <input
          id="startDate"
          type="date" // 日付入力
          className={`form-input ${errors.startDate ? "error" : ""}`}
          {...register("startDate", {
            required: "開始日は必須です",
          })}
        />
        {errors.startDate && (
          <p className="error-message">{errors.startDate.message}</p>
        )}
      </div>
      {/* 終了日入力欄 */}
      <div className="form-group">
        <label htmlFor="endDate" className="form-label">
          終了日（任意）
        </label>
        <input
          id="endDate"
          type="date"
          className={`form-input ${errors.endDate ? "error" : ""}`}
          {...register("endDate", {
            validate: (value) => {
              // カスタムバリデーション
              if (!value) return true; // 空の場合はOK
              const startDate = watch("startDate"); // 開始日を取得
              return (
                value >= startDate || "終了日は開始日以降を指定してください"
              ); // 開始日以降かチェック
            },
          })}
        />
        {errors.endDate && (
          <p className="error-message">{errors.endDate.message}</p>
        )}
      </div>
      {/* メモ入力欄 */}
      <div className="form-group">
        <label htmlFor="memo" className="form-label">
          メモ（任意）
        </label>
        <textarea
          id="memo"
          rows={3} // 3行分の高さ
          className="form-textarea"
          placeholder="例: 食後に服用"
          {...register("memo")}
        />
      </div>
      {/* 送信ボタン */}
      <div className="form-actions">
        {" "}
        {/* ボタンエリア */}
        <button
          type="submit" // フォーム送信
          className="btn btn-primary" // プライマリボタンスタイル
          disabled={isSubmitting} // 送信中は無効化
        >
          {
            isSubmitting
              ? isEditMode
                ? "更新中..."
                : "登録中..." // 送信中は処理中メッセージを表示
              : isEditMode
                ? "更新"
                : "登録" // 通常時は編集モードか新規登録モードかでボタンテキストを変更
          }
        </button>
      </div>
    </form>
  );
}

export default MedicationForm; // エクスポート
