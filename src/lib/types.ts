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
  attachments: string;
  id: string;
  patient_id: string;
  doctor_id: string;
  title: string;
  diagnosis: string | null;
  prescription: string | null;
  notes: string | null;
  created_at?: string;
};

export type InvoiceStatus =
  | "pending"
  | "partially_paid"
  | "paid"
  | "cancelled"
  | "refunded";

export type PaymentMethod =
  | "cash"
  | "card"
  | "vodafone_cash"
  | "instapay"
  | "other";

export type InvoiceRecord = {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  appointment_id: string | null;
  amount: number | string;
  subtotal: number | string;
  discount: number | string;
  tax: number | string;
  total_amount: number | string;
  paid_amount: number | string;
  status: InvoiceStatus | string | null;
  issue_date: string | null;
  notes: string | null;
  created_at?: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  service_name: string;
  quantity: number;
  unit_price: number | string;
  total: number | string;
  created_at?: string;
};

export type PaymentRecord = {
  id: string;
  invoice_id: string;
  patient_id: string;
  amount: number | string;
  method: PaymentMethod | string;
  notes: string | null;
  created_by: string | null;
  created_at?: string;
};

export type OverviewMetric = {
  label: string;
  value: string | number;
  hint: string;
  tone?: "emerald" | "cyan" | "violet" | "amber" | "rose";
};

export type Department = {
  id: string;
  name: string;
  description: string | null;
  created_at?: string;
};

export type SystemSettings = {
  id: string;
  key: string;
  value: string;
  updated_at?: string;
  updated_by?: string;
};

export type ActivityLog = {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string | null;
  created_at?: string;
};

export type NotificationType = "appointment" | "invoice" | "record" | "system" | "info";

export type NotificationRecord = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType | string;
  related_id: string | null;
  read: boolean;
  created_at: string;
};

export type Prescription = {
  id: string;
  patient_id: string;
  doctor_id: string;
  medical_record_id?: string | null;
  medication?: string;
  medications?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string | null;
  status?: "active" | "completed" | "cancelled";
  created_at?: string;
};
