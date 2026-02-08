import { useForm } from "react-hook-form"; // React Hook Formをインポート
import { useMedicationStore } from "../../store/medicationStore"; // Zustandストアをインポート
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
  onSuccess: () => void; // 登録成功時に実行する関数
}

// 薬剤登録フォームコンポーネント
function MedicationForm({ onSuccess }: MedicationFormProps) {
  const addMedication = useMedicationStore((state) => state.addMedication); // ストアからaddMedication関数を取得

  // React Hook Formの初期化
  const {
    register, // 入力欄を登録する関数
    handleSubmit, // フォーム送信時の処理を登録する関数
    watch, // フォームの値を監視する関数
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

  const frequency = watch("frequency"); // 服用回数の値を監視

  // フォーム送信時の処理
  const onSubmit = async (data: MedicationFormData) => {
    try {
      // ZustandストアのaddMedication関数を呼び出して薬剤を登録
      await addMedication({
        name: data.name, // 薬品名
        dosage: data.dosage, // 服用量
        frequency: data.frequency, // 服用回数
        times: data.times.slice(0, data.frequency), // 服用回数分の時間のみ取得
        startDate: data.startDate, // 開始日
        endDate: data.endDate || null, // 終了日（空の場合はnull）
        memo: data.memo, // メモ
        fdaDetails: null, // FDA詳細情報は今回はnull
      });
      onSuccess(); // 成功時のコールバックを実行（モーダルを閉じる）
    } catch (error) {
      console.error("薬剤の登録に失敗しました:", error); // エラーをコンソールに出力
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
          {isSubmitting ? "登録中..." : "登録"}{" "}
          {/* 送信中は「登録中...」と表示 */}
        </button>
      </div>
    </form>
  );
}

export default MedicationForm; // エクスポート
