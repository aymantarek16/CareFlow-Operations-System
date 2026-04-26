import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type {
  InvoiceItem,
  InvoiceRecord,
  PaymentRecord,
} from "@/lib/types";

/** Fetch one invoice + its items + its payments. Used in the View / Edit dialogs. */
export function useInvoiceDetails(invoiceId: string | null) {
  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!invoiceId) {
      setInvoice(null);
      setItems([]);
      setPayments([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [invRes, itemsRes, paysRes] = await Promise.all([
        supabase.from("invoices").select("*").eq("id", invoiceId).single(),
        supabase
          .from("invoice_items")
          .select("*")
          .eq("invoice_id", invoiceId)
          .order("created_at", { ascending: true }),
        supabase
          .from("payments")
          .select("*")
          .eq("invoice_id", invoiceId)
          .order("created_at", { ascending: false }),
      ]);
      if (invRes.error) throw new Error(invRes.error.message);
      setInvoice(invRes.data as InvoiceRecord);
      setItems((itemsRes.data ?? []) as InvoiceItem[]);
      setPayments((paysRes.data ?? []) as PaymentRecord[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { invoice, items, payments, loading, error, refetch };
}

/** All invoice_items rows visible to the current user. */
export function useAllInvoiceItems() {
  const [data, setData] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("invoice_items")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (!error) setData((data ?? []) as InvoiceItem[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, refetch };
}

/** All payments visible to the current user. */
export function useAllPayments() {
  const [data, setData] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (!error) setData((data ?? []) as PaymentRecord[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, refetch };
}
