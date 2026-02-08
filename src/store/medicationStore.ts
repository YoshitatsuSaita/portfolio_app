import { create } from "zustand"; // Zustandのcreate関数をインポート - ストアを作成するための関数
import { Medication } from "../types"; // Medication型をインポート - 薬剤データの型定義
import {
  getAllMedications, // IndexedDBから全薬剤を取得する関数
  createMedication, // IndexedDBに新規薬剤を作成する関数
  updateMedication as dbUpdateMedication, // IndexedDBの薬剤を更新する関数（名前の衝突を避けるためエイリアス使用）
  deleteMedication as dbDeleteMedication, // IndexedDBの薬剤を削除する関数（名前の衝突を避けるためエイリアス使用）
  getActiveMedications, // IndexedDBから服用中の薬剤のみを取得する関数
} from "../db/database";

// ストアの状態（State）の型定義 - このストアが保持するデータの構造を定義
interface MedicationState {
  medications: Medication[]; // 薬剤データの配列 - 全ての薬剤情報を保持
  loading: boolean; // データ読み込み中かどうかのフラグ - trueの場合はローディング表示
  error: string | null; // エラーメッセージ - エラーがない場合はnull

  // アクション（Actions）- ストアの状態を変更する関数群
  fetchMedications: () => Promise<void>; // IndexedDBから全薬剤を取得してストアに保存する非同期関数
  fetchActiveMedications: () => Promise<void>; // IndexedDBから服用中の薬剤のみを取得してストアに保存する非同期関数
  addMedication: (
    medication: Omit<Medication, "id" | "createdAt" | "updatedAt">, // 新規作成時はid, createdAt, updatedAtを除外（自動生成されるため）
  ) => Promise<void>; // 新規薬剤をIndexedDBに追加してストアを更新する非同期関数
  updateMedication: (
    id: string, // 更新対象の薬剤ID
    updates: Partial<Omit<Medication, "id" | "createdAt">>, // 更新するフィールド（idとcreatedAtは変更不可）
  ) => Promise<void>; // 薬剤情報をIndexedDBで更新してストアを更新する非同期関数
  deleteMedication: (id: string) => Promise<void>; // 薬剤をIndexedDBから削除してストアを更新する非同期関数
}

// Zustandストアの作成 - create関数に状態と関数を定義
export const useMedicationStore = create<MedicationState>((set) => ({
  // 初期状態の定義
  medications: [], // 薬剤データの初期値 - 空配列から始まる
  loading: false, // ローディング状態の初期値 - 最初は読み込み中ではない
  error: null, // エラー状態の初期値 - 最初はエラーなし

  // fetchMedications: IndexedDBから全薬剤を取得する関数
  fetchMedications: async () => {
    set({ loading: true, error: null }); // ローディング開始、エラーをクリア
    try {
      const medications = await getAllMedications(); // IndexedDBから全薬剤を取得
      set({ medications, loading: false }); // 取得した薬剤をストアに保存、ローディング終了
    } catch (error) {
      set({
        error: "薬剤の取得に失敗しました", // エラーメッセージを設定
        loading: false, // ローディング終了
      });
      console.error("Failed to fetch medications:", error); // コンソールにエラーを出力
    }
  },

  // fetchActiveMedications: IndexedDBから服用中の薬剤のみを取得する関数
  fetchActiveMedications: async () => {
    set({ loading: true, error: null }); // ローディング開始、エラーをクリア
    try {
      const medications = await getActiveMedications(); // IndexedDBから服用中の薬剤を取得
      set({ medications, loading: false }); // 取得した薬剤をストアに保存、ローディング終了
    } catch (error) {
      set({
        error: "服用中の薬剤の取得に失敗しました", // エラーメッセージを設定
        loading: false, // ローディング終了
      });
      console.error("Failed to fetch active medications:", error); // コンソールにエラーを出力
    }
  },

  // addMedication: 新規薬剤をIndexedDBに追加してストアを更新する関数
  addMedication: async (medication) => {
    set({ loading: true, error: null }); // ローディング開始、エラーをクリア
    try {
      await createMedication(medication); // IndexedDBに新規薬剤を作成
      const medications = await getAllMedications(); // 最新の全薬剤を再取得（追加した薬剤を含む）
      set({ medications, loading: false }); // 更新された薬剤リストをストアに保存、ローディング終了
    } catch (error) {
      set({
        error: "薬剤の追加に失敗しました", // エラーメッセージを設定
        loading: false, // ローディング終了
      });
      console.error("Failed to add medication:", error); // コンソールにエラーを出力
    }
  },

  // updateMedication: 薬剤情報をIndexedDBで更新してストアを更新する関数
  updateMedication: async (id, updates) => {
    set({ loading: true, error: null }); // ローディング開始、エラーをクリア
    try {
      await dbUpdateMedication(id, updates); // IndexedDBで薬剤情報を更新
      const medications = await getAllMedications(); // 最新の全薬剤を再取得（更新した薬剤を含む）
      set({ medications, loading: false }); // 更新された薬剤リストをストアに保存、ローディング終了
    } catch (error) {
      set({
        error: "薬剤の更新に失敗しました", // エラーメッセージを設定
        loading: false, // ローディング終了
      });
      console.error("Failed to update medication:", error); // コンソールにエラーを出力
    }
  },

  // deleteMedication: 薬剤をIndexedDBから削除してストアを更新する関数
  deleteMedication: async (id) => {
    set({ loading: true, error: null }); // ローディング開始、エラーをクリア
    try {
      await dbDeleteMedication(id); // IndexedDBから薬剤を削除（関連する服用記録も削除される）
      const medications = await getAllMedications(); // 最新の全薬剤を再取得（削除後のリスト）
      set({ medications, loading: false }); // 更新された薬剤リストをストアに保存、ローディング終了
    } catch (error) {
      set({
        error: "薬剤の削除に失敗しました", // エラーメッセージを設定
        loading: false, // ローディング終了
      });
      console.error("Failed to delete medication:", error); // コンソールにエラーを出力
    }
  },
}));
