import { useForm } from "react-hook-form"; // React Hook Formをインポート - フォームの状態管理と送信処理
import { useEffect } from "react"; // useEffectフックをインポート - 編集モード時の初期値設定用
import dayjs from "dayjs"; // Day.jsをインポート - 日付の加算・差分計算に使用（既存の依存関係）
import { useMedicationStore } from "../../store/medicationStore"; // Zustandストアをインポート - 登録・更新関数を取得
import { Medication } from "../../types"; // Medication型をインポート - 編集モード用
import "./MedicationForm.css"; // CSSをインポート

// フォーム入力データの型定義
interface MedicationFormData {
  name: string; // 薬品名（商品名）
  dosage: string; // 服用量
  frequency: number; // 服用回数（1日何回）
  times: string[]; // 服用時間の配列（frequencyの数だけ要素を持つ）
  startDate: string; // 開始日（YYYY-MM-DD形式）
  prescriptionDays: number; // 処方期間（日数）- 0の場合は終了日なし（継続中）
  memo: string; // メモ（任意）
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

  // React Hook Formの初期化
  const {
    register, // 入力欄をReact Hook Formに登録する関数
    handleSubmit, // フォーム送信時の処理をラップする関数
    watch, // フォームの値をリアルタイムで監視する関数
    reset, // フォームの値を指定した値にリセットする関数
    formState: { errors, isSubmitting }, // エラー情報と送信中フラグ
  } = useForm<MedicationFormData>({
    defaultValues: {
      name: "", // 薬品名（商品名）は空文字
      dosage: "", // 服用量は空文字
      frequency: 1, // 服用回数は1回
      times: ["08:00"], // 服用時間は朝8時をデフォルト
      startDate: new Date().toISOString().split("T")[0], // 開始日は今日の日付
      prescriptionDays: 0, // 処方期間は0（=終了日なし・継続中）
      memo: "", // メモは空文字
    },
  });

  // 編集モードの場合、フォームに既存データを設定
  useEffect(() => {
    if (medication) {
      // medicationが存在する場合（編集モード）

      // 既存データのendDateからprescriptionDaysを逆算する
      // endDateがある場合はdayjsで差分日数を計算し、ない場合は0（継続中）を設定
      const prescriptionDays = medication.endDate
        ? dayjs(medication.endDate).diff(dayjs(medication.startDate), "day") // 終了日 - 開始日の日数差を計算
        : 0; // 終了日が未設定の場合は0（継続中）

      reset({
        name: medication.name, // 薬品名（商品名）を設定
        dosage: medication.dosage, // 服用量を設定
        frequency: medication.frequency, // 服用回数を設定
        times: medication.times, // 服用時間の配列を設定
        startDate: medication.startDate, // 開始日を設定
        prescriptionDays, // 逆算した処方期間（日数）を設定
        memo: medication.memo, // メモを設定
      });
    }
  }, [medication, reset]); // medicationまたはresetが変更された時に再実行

  const frequency = watch("frequency"); // 服用回数の値をリアルタイムで監視（時間欄の数を動的に変えるため）

  // フォーム送信時の処理
  const onSubmit = async (data: MedicationFormData) => {
    try {
      // prescriptionDaysが1以上の場合、startDateに日数を加算してendDateを計算する
      // 0または未入力の場合はnullを設定（終了日なし = 継続中）
      const endDate =
        data.prescriptionDays > 0
          ? dayjs(data.startDate)
              .add(data.prescriptionDays, "day") // 開始日に処方期間（日数）を加算
              .format("YYYY-MM-DD") // YYYY-MM-DD形式の文字列に変換
          : null; // 処方期間が0の場合は終了日なし

      if (isEditMode) {
        // 編集モードの場合 - 既存薬剤を更新
        await updateMedication(medication.id, {
          name: data.name, // 薬品名（商品名）
          dosage: data.dosage, // 服用量
          frequency: data.frequency, // 服用回数
          times: data.times.slice(0, data.frequency), // 服用回数分の時間のみ取得
          startDate: data.startDate, // 開始日
          endDate, // 計算されたendDate（またはnull）
          memo: data.memo, // メモ
        });
      } else {
        // 新規登録モードの場合 - 薬剤を新たに登録
        await addMedication({
          name: data.name, // 薬品名（商品名）
          dosage: data.dosage, // 服用量
          frequency: data.frequency, // 服用回数
          times: data.times.slice(0, data.frequency), // 服用回数分の時間のみ取得
          startDate: data.startDate, // 開始日
          endDate, // 計算されたendDate（またはnull）
          memo: data.memo, // メモ
        });
      }
      onSuccess(); // 成功時のコールバックを実行（モーダルを閉じる）
    } catch (error) {
      console.error("薬剤の登録/更新に失敗しました:", error); // エラーをコンソールに出力
    }
  };

  return (
    <form className="medication-form" onSubmit={handleSubmit(onSubmit)}>
      {/* フォーム全体 */}

      {/* 薬品名入力欄 */}
      <div className="form-group">
        <label htmlFor="name" className="form-label">
          薬品名 <span className="required">*</span> {/* 必須マーク */}
        </label>
        <input
          id="name" // ラベルとの紐づけ用ID
          type="text" // テキスト入力
          className={`form-input ${errors.name ? "error" : ""}`} // エラー時にerrorクラスを付与
          placeholder="例: トラネキサム酸錠250mg"
          {...register("name", {
            required: "薬品名は必須です", // 未入力の場合のエラーメッセージ
          })}
        />
        {errors.name && (
          <p className="error-message">{errors.name.message}</p> // エラーメッセージを表示
        )}
      </div>

      {/* 服用量入力欄 */}
      <div className="form-group">
        <label htmlFor="dosage" className="form-label">
          1回の服用量 <span className="required">*</span>
        </label>
        <input
          id="dosage"
          type="text"
          className={`form-input ${errors.dosage ? "error" : ""}`}
          placeholder="例: 1錠"
          {...register("dosage", {
            required: "服用量は必須です", // 未入力の場合のエラーメッセージ
          })}
        />
        {errors.dosage && (
          <p className="error-message">{errors.dosage.message}</p>
        )}
      </div>

      {/* 服用回数入力欄 */}
      <div className="form-group">
        <label htmlFor="frequency" className="form-label">
          1日の服用回数 <span className="required">*</span>
        </label>
        <div className="input-with-unit">
          <input
            id="frequency"
            type="number" // 数値入力
            className={`form-input ${errors.frequency ? "error" : ""}`}
            min={1} // 最小値1（1日1回以上）
            max={10} // 最大値10（1日10回まで）
            {...register("frequency", {
              required: "服用回数は必須です",
              min: { value: 1, message: "1以上の値を入力してください" }, // 最小値バリデーション
              max: { value: 10, message: "10以下の値を入力してください" }, // 最大値バリデーション
              valueAsNumber: true, // 数値として扱う（文字列変換を防ぐ）
            })}
          />
          <span className="input-unit">回</span>
        </div>
        {errors.frequency && (
          <p className="error-message">{errors.frequency.message}</p>
        )}
      </div>

      {/* 服用時間入力欄（服用回数分だけ動的に表示） */}
      <div className="form-group">
        <label className="form-label">
          服用時間 <span className="required">*</span>
        </label>
        {Array.from({ length: frequency }).map((_, index) => (
          // 服用回数分のインデックスで配列を生成してループ
          <div key={index} className="time-input-group">
            <label htmlFor={`times.${index}`} className="time-label">
              {index + 1}回目 {/* 何回目の服用かを表示 */}
            </label>
            <input
              id={`times.${index}`}
              type="time" // 時刻入力
              className={`form-input ${errors.times?.[index] ? "error" : ""}`}
              {...register(`times.${index}`, {
                required: "服用時間は必須です", // 未入力の場合のエラーメッセージ
              })}
            />
            {errors.times?.[index] && (
              <p className="error-message">{errors.times[index]?.message}</p>
            )}
          </div>
        ))}
      </div>

      {/* 開始日入力欄 */}
      <div className="form-group">
        <label htmlFor="startDate" className="form-label">
          処方日 <span className="required">*</span>
        </label>
        <input
          id="startDate"
          type="date" // 日付入力
          className={`form-input ${errors.startDate ? "error" : ""}`}
          {...register("startDate", {
            required: "開始日は必須です", // 未入力の場合のエラーメッセージ
          })}
        />
        {errors.startDate && (
          <p className="error-message">{errors.startDate.message}</p>
        )}
      </div>

      {/* 処方期間入力欄（endDateの代わり） */}
      <div className="form-group">
        <label htmlFor="prescriptionDays" className="form-label">
          処方期間（日数）
        </label>
        <div className="input-with-unit">
          {" "}
          {/* 数値入力と単位ラベルを横並びにするラッパー */}
          <input
            id="prescriptionDays"
            type="number" // 数値入力
            className={`form-input ${errors.prescriptionDays ? "error" : ""}`}
            min={0} // 最小値0（0の場合は終了日なし = 継続中）
            placeholder="0"
            {...register("prescriptionDays", {
              min: { value: 0, message: "0以上の値を入力してください" }, // 負の値を防ぐバリデーション
              valueAsNumber: true, // 数値として扱う（文字列変換を防ぐ）
            })}
          />
          <span className="input-unit">日</span> {/* 単位ラベル */}
        </div>
        <p className="form-hint">
          {/* 入力補助テキスト */}
          0または未入力の場合は終了日なし（継続中）として保存されます
        </p>
        {errors.prescriptionDays && (
          <p className="error-message">{errors.prescriptionDays.message}</p>
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
        <button
          type="submit" // フォーム送信ボタン
          className="btn btn-primary"
          disabled={isSubmitting} // 送信処理中は二重送信を防ぐため無効化
        >
          {
            isSubmitting
              ? isEditMode
                ? "更新中..." // 送信中かつ編集モードのメッセージ
                : "登録中..." // 送信中かつ新規登録モードのメッセージ
              : isEditMode
                ? "更新" // 通常時の編集モードのボタンテキスト
                : "登録" // 通常時の新規登録モードのボタンテキスト
          }
        </button>
      </div>
    </form>
  );
}

export default MedicationForm; // 他のファイルから使用できるようにエクスポート
