import { useForm, useWatch } from 'react-hook-form';
import { useEffect } from 'react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { useMedicationStore } from '../../store/medicationStore';
import { Medication } from '../../types';
import './MedicationForm.css';

interface MedicationFormData {
  name: string;
  dosage: string;
  frequency: number;
  times: string[];
  startDate: string; // YYYY-MM-DD形式
  prescriptionDays: number;
  memo: string;
}

interface MedicationFormProps {
  medication?: Medication; // 未指定の場合は新規登録モード
  onSuccess: () => void;
}

function MedicationForm({ medication, onSuccess }: MedicationFormProps) {
  const addMedication = useMedicationStore((state) => state.addMedication);
  const updateMedication = useMedicationStore(
    (state) => state.updateMedication
  );

  const isEditMode = !!medication;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MedicationFormData>({
    defaultValues: {
      name: '',
      dosage: '',
      frequency: 1,
      times: ['08:00'],
      startDate: new Date().toISOString().split('T')[0],
      prescriptionDays: 5,
      memo: '',
    },
  });

  useEffect(() => {
    if (medication) {
      // ストアはendDateを持つが、フォームはprescriptionDaysを使うため逆算する
      const prescriptionDays = medication.endDate
        ? dayjs(medication.endDate).diff(dayjs(medication.startDate), 'day')
        : undefined; // 終了日なし（継続中）の場合は空欄にする

      reset({
        name: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        times: medication.times,
        startDate: medication.startDate,
        prescriptionDays,
        memo: medication.memo,
      });
    }
  }, [medication, reset]);

  const frequency = useWatch({ control, name: 'frequency', defaultValue: 1 });

  const onSubmit = async (data: MedicationFormData) => {
    try {
      const endDate = dayjs(data.startDate)
        .add(data.prescriptionDays, 'day')
        .format('YYYY-MM-DD');

      if (isEditMode) {
        await updateMedication(medication.id, {
          name: data.name,
          dosage: data.dosage,
          frequency: data.frequency,
          times: data.times.slice(0, data.frequency), // frequencyを減らした場合、余分な時間値が残るためsliceする
          startDate: data.startDate,
          endDate,
          memo: data.memo,
        });
        toast.success('薬剤情報を更新しました');
      } else {
        await addMedication({
          name: data.name,
          dosage: data.dosage,
          frequency: data.frequency,
          times: data.times.slice(0, data.frequency), // frequencyを減らした場合、余分な時間値が残るためsliceする
          startDate: data.startDate,
          endDate,
          memo: data.memo,
        });
        toast.success('薬剤を登録しました');
      }
      onSuccess();
    } catch (error) {
      console.error('薬剤の登録/更新に失敗しました:', error);
      toast.error(
        isEditMode
          ? '薬剤の更新に失敗しました。もう一度お試しください。'
          : '薬剤の登録に失敗しました。もう一度お試しください。'
      );
    }
  };

  return (
    <form className="medication-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="form-group">
        <label htmlFor="name" className="form-label">
          薬品名 <span className="required">*</span>
        </label>
        <input
          id="name"
          type="text"
          className={`form-input ${errors.name ? 'error' : ''}`}
          placeholder="例: トラネキサム酸錠250mg"
          maxLength={50}
          {...register('name', {
            required: '薬品名は必須です',
            maxLength: {
              value: 50,
              message: '薬品名は50文字以内で入力してください',
            },
          })}
        />
        {errors.name && <p className="error-message">{errors.name.message}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="dosage" className="form-label">
          1回の服用量 <span className="required">*</span>
        </label>
        <input
          id="dosage"
          type="text"
          className={`form-input ${errors.dosage ? 'error' : ''}`}
          placeholder="例: 1"
          maxLength={20}
          {...register('dosage', {
            required: '服用量は必須です',
            maxLength: {
              value: 20,
              message: '服用量は20文字以内で入力してください',
            },
          })}
        />
        {errors.dosage && (
          <p className="error-message">{errors.dosage.message}</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="frequency" className="form-label">
          1日の服用回数 <span className="required">*</span>
        </label>
        <div className="input-with-unit">
          <input
            id="frequency"
            type="number"
            className={`form-input ${errors.frequency ? 'error' : ''}`}
            min={1}
            max={5}
            {...register('frequency', {
              required: '服用回数は必須です',
              min: { value: 1, message: '1以上の値を入力してください' },
              max: { value: 5, message: '5以下の値を入力してください' },
              valueAsNumber: true, // 文字列として扱われるのを防ぐ
            })}
          />
          <span className="input-unit">回</span>
        </div>
        {errors.frequency && (
          <p className="error-message">{errors.frequency.message}</p>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">
          服用時間 <span className="required">*</span>
        </label>
        {Array.from({ length: frequency }).map((_, index) => (
          <div key={index} className="time-input-group">
            <label htmlFor={`times.${index}`} className="time-label">
              {index + 1}回目
            </label>
            <input
              id={`times.${index}`}
              type="time"
              className={`form-input ${errors.times?.[index] ? 'error' : ''}`}
              {...register(`times.${index}`, {
                required: '服用時間は必須です',
              })}
            />
            {errors.times?.[index] && (
              <p className="error-message">{errors.times[index]?.message}</p>
            )}
          </div>
        ))}
      </div>

      <div className="form-group">
        <label htmlFor="startDate" className="form-label">
          処方日 <span className="required">*</span>
        </label>
        <input
          id="startDate"
          type="date"
          className={`form-input ${errors.startDate ? 'error' : ''}`}
          {...register('startDate', {
            required: '処方日は必須です',
          })}
        />
        {errors.startDate && (
          <p className="error-message">{errors.startDate.message}</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="prescriptionDays" className="form-label">
          処方期間（日数）<span className="required">*</span>
        </label>
        <div className="input-with-unit">
          <input
            id="prescriptionDays"
            type="number"
            className={`form-input ${errors.prescriptionDays ? 'error' : ''}`}
            min={1}
            placeholder="例: 5"
            {...register('prescriptionDays', {
              required: '処方期間は必須です',
              min: { value: 1, message: '1以上の値を入力してください' },
              valueAsNumber: true, // 文字列として扱われるのを防ぐ
            })}
          />
          <span className="input-unit">日</span>
        </div>
        {errors.prescriptionDays && (
          <p className="error-message">{errors.prescriptionDays.message}</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="memo" className="form-label">
          メモ（任意）
        </label>
        <textarea
          id="memo"
          rows={3}
          className="form-textarea"
          placeholder="例: 食後に服用"
          maxLength={500}
          {...register('memo', {
            maxLength: {
              value: 500,
              message: 'メモは500文字以内で入力してください',
            },
          })}
        />
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? isEditMode
              ? '更新中...'
              : '登録中...'
            : isEditMode
              ? '更新'
              : '登録'}
        </button>
      </div>
    </form>
  );
}

export default MedicationForm;
