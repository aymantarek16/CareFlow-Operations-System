import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type MutationResult<T> = {
  data: T | null;
  error: string | null;
};

export function useDeleteMutation<T extends { id: string }>(
  table: string,
  options?: {
    onSuccess?: () => void;
    onError?: (error: string) => void;
    successMessage?: string;
    errorMessage?: string;
  }
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteItem = useCallback(
    async (id: string): Promise<MutationResult<T>> => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: supabaseError } = await supabase
          .from(table)
          .delete()
          .eq("id", id)
          .select()
          .single();

        if (supabaseError) {
          const errorMsg = supabaseError.message;
          setError(errorMsg);
          toast.error(options?.errorMessage || `فشل حذف ${table}`, {
            description: errorMsg,
          });
          options?.onError?.(errorMsg);
          return { data: null, error: errorMsg };
        }

        toast.success(options?.successMessage || "تم الحذف بنجاح", {
          description: "تم حذف العنصر نهائياً من النظام",
        });
        options?.onSuccess?.();
        return { data: data as T, error: null };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
        setError(errorMsg);
        toast.error(options?.errorMessage || "فشل الحذف", {
          description: errorMsg,
        });
        options?.onError?.(errorMsg);
        return { data: null, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    [table, options]
  );

  return { deleteItem, loading, error };
}

export function useUpdateMutation<T extends { id: string }>(
  table: string,
  options?: {
    onSuccess?: () => void;
    onError?: (error: string) => void;
    successMessage?: string;
    errorMessage?: string;
  }
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateItem = useCallback(
    async (id: string, updates: Record<string, unknown>): Promise<MutationResult<T>> => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: supabaseError } = await supabase
          .from(table)
          .update(updates as never)
          .eq("id", id)
          .select()
          .single();

        if (supabaseError) {
          const errorMsg = supabaseError.message;
          setError(errorMsg);
          toast.error(options?.errorMessage || `فشل تحديث ${table}`, {
            description: errorMsg,
          });
          options?.onError?.(errorMsg);
          return { data: null, error: errorMsg };
        }

        toast.success(options?.successMessage || "تم التحديث بنجاح", {
          description: "تم تحديث البيانات بنجاح",
        });
        options?.onSuccess?.();
        return { data: data as T, error: null };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
        setError(errorMsg);
        toast.error(options?.errorMessage || "فشل التحديث", {
          description: errorMsg,
        });
        options?.onError?.(errorMsg);
        return { data: null, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    [table, options]
  );

  return { updateItem, loading, error };
}

export function useInsertMutation<T>(
  table: string,
  options?: {
    onSuccess?: () => void;
    onError?: (error: string) => void;
    successMessage?: string;
    errorMessage?: string;
  }
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insertItem = useCallback(
    async (item: Record<string, unknown>): Promise<MutationResult<T>> => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: supabaseError } = await supabase
          .from(table)
          .insert(item as never)
          .select()
          .single();

        if (supabaseError) {
          const errorMsg = supabaseError.message;
          setError(errorMsg);
          toast.error(options?.errorMessage || `فشل إضافة ${table}`, {
            description: errorMsg,
          });
          options?.onError?.(errorMsg);
          return { data: null, error: errorMsg };
        }

        toast.success(options?.successMessage || "تم الإضافة بنجاح", {
          description: "تم إضافة العنصر الجديد بنجاح",
        });
        options?.onSuccess?.();
        return { data: data as T, error: null };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
        setError(errorMsg);
        toast.error(options?.errorMessage || "فشل الإضافة", {
          description: errorMsg,
        });
        options?.onError?.(errorMsg);
        return { data: null, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    [table, options]
  );

  return { insertItem, loading, error };
}
