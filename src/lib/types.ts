export type AppRole = "admin" | "doctor" | "patient" | "receptionist";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  created_at?: string;
};

export type DoctorProfile = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  specialty: string | null;
  phone: string | null;
  created_at?: string;
};

export type PatientProfile = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
  created_at?: string;
};

export type AppointmentRecord = {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string | null;
  appointment_time: string | null;
  status: string | null;
  reason: string | null;
  notes: string | null;
  created_at?: string;
};

export type MedicalRecord = {
  id: string;
  patient_id: string;
  doctor_id: string;
  title: string;
  diagnosis: string | null;
  prescription: string | null;
  notes: string | null;
  created_at?: string;
};

export type InvoiceRecord = {
  id: string;
  patient_id: string;
  amount: number | string;
  status: string | null;
  issue_date: string | null;
  notes: string | null;
  created_at?: string;
};

export type OverviewMetric = {
  label: string;
  value: string | number;
  hint: string;
  tone?: "emerald" | "cyan" | "violet" | "amber" | "rose";
};
