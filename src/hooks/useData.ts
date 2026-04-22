import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { AppointmentRecord, DoctorProfile, PatientProfile, InvoiceRecord, MedicalRecord, Department, ActivityLog, SystemSettings } from "@/lib/types";

export function useSupabaseQuery<T>(table: string, options?: { column?: string; value?: string; orderBy?: string; ascending?: boolean; limit?: number }) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    try {
      let query = supabase.from(table).select("*");
      if (options?.column && options?.value) query = query.eq(options.column, options.value);
      if (options?.orderBy) query = query.order(options.orderBy, { ascending: options?.ascending ?? false });
      if (options?.limit) query = query.limit(options.limit);
      const { data, error } = await query;
      if (error) setError(error.message);
      else setData((data ?? []) as T[]);
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [table, options?.column, options?.value]);

  return { data, loading, error, refetch: fetch };
}

export function usePatients() { return useSupabaseQuery<PatientProfile>("patients", { orderBy: "created_at" }); }
export function useDoctors() { return useSupabaseQuery<DoctorProfile>("doctors", { orderBy: "created_at" }); }
export function useAppointments() { return useSupabaseQuery<AppointmentRecord>("appointments", { orderBy: "appointment_date", ascending: true }); }
export function useMedicalRecords() { return useSupabaseQuery<MedicalRecord>("medical_records", { orderBy: "created_at", limit: 50 }); }
export function useInvoices() { return useSupabaseQuery<InvoiceRecord>("invoices", { orderBy: "created_at", limit: 50 }); }
export function useDepartments() { return useSupabaseQuery<Department>("departments", { orderBy: "name" }); }
export function useActivityLogs() { return useSupabaseQuery<ActivityLog>("activity_logs", { orderBy: "created_at", limit: 50 }); }
export function useSystemSettings() { return useSupabaseQuery<SystemSettings>("system_settings", { orderBy: "key" }); }

export function useCount(table: string) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    supabase.from(table).select("*", { count: "exact", head: true }).then(({ count }) => setCount(count ?? 0));
  }, [table]);
  return count;
}

export function useAdminOverview() {
  const { data: patients, loading: lp } = usePatients();
  const { data: doctors, loading: ld } = useDoctors();
  const { data: appointments, loading: la } = useAppointments();
  const { data: medicalRecords } = useMedicalRecords();
  const { data: invoices } = useInvoices();
  const usersCount = useCount("users");

  const loading = lp || ld || la;

  const today = new Date().toISOString().slice(0, 10);
  const statusCounts = appointments.reduce<Record<string, number>>((acc, a) => { const k = a.status ?? "unknown"; acc[k] = (acc[k] ?? 0) + 1; return acc; }, {});
  const todayAppointments = appointments.filter((a) => a.appointment_date === today);
  const completionRate = appointments.length ? Math.round(((statusCounts.completed ?? 0) / appointments.length) * 100) : 0;

  return {
    loading, patients, doctors, appointments, medicalRecords, invoices,
    metrics: {
      patientsCount: patients.length, doctorsCount: doctors.length, appointmentsCount: appointments.length,
      usersCount, medicalRecordsCount: medicalRecords.length, invoicesCount: invoices.length,
      todayAppointments: todayAppointments.length, completionRate,
      specialties: new Set(doctors.map((d) => d.specialty).filter(Boolean)).size,
      scheduledCount: statusCounts.scheduled ?? 0, completedCount: statusCounts.completed ?? 0, cancelledCount: statusCounts.cancelled ?? 0,
    },
    upcomingAppointments: appointments.slice(0, 8),
    recentPatients: patients.slice(0, 5),
  };
}

export function useDoctorOverview() {
  const { appUser } = useAuth();
  const { data: doctors } = useDoctors();
  const { data: patients } = usePatients();
  const { data: appointments } = useAppointments();
  const { data: medicalRecords } = useMedicalRecords();

  const doctor = doctors.find((d) => d.user_id === appUser?.id) ?? null;
  const myAppointments = doctor ? appointments.filter((a) => a.doctor_id === doctor.id) : [];
  const myPatients = doctor ? patients.filter((p) => myAppointments.some((a) => a.patient_id === p.id)) : [];
  const myRecords = doctor ? medicalRecords.filter((r) => r.doctor_id === doctor.id) : [];
  const completed = myAppointments.filter((a) => a.status === "completed").length;

  return {
    doctor, myAppointments, myPatients, myRecords,
    metrics: {
      appointmentsCount: myAppointments.length, patientsCount: myPatients.length, recordsCount: myRecords.length,
      completionRate: myAppointments.length ? Math.round((completed / myAppointments.length) * 100) : 0,
    },
  };
}

export function usePatientOverview() {
  const { appUser } = useAuth();
  const { data: patients } = usePatients();
  const { data: doctors } = useDoctors();
  const { data: appointments } = useAppointments();
  const { data: medicalRecords } = useMedicalRecords();
  const { data: invoices } = useInvoices();

  const patient = patients.find((p) => p.user_id === appUser?.id) ?? null;
  const myAppointments = patient ? appointments.filter((a) => a.patient_id === patient.id) : [];
  const myRecords = patient ? medicalRecords.filter((r) => r.patient_id === patient.id) : [];
  const myInvoices = patient ? invoices.filter((i) => i.patient_id === patient.id) : [];
  const myDoctors = doctors.filter((d) => myAppointments.some((a) => a.doctor_id === d.id));

  return {
    patient, myAppointments, myRecords, myInvoices, myDoctors,
    metrics: {
      appointmentsCount: myAppointments.length, doctorsCount: myDoctors.length,
      recordsCount: myRecords.length, invoicesCount: myInvoices.length,
    },
  };
}
