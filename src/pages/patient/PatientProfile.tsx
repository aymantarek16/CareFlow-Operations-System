import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { SkeletonCard } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { usePatientOverview, useDoctors } from "@/hooks/useData";
import { useUpdateMutation } from "@/hooks/useMutation";
import { formatDate, formatTime } from "@/lib/helpers";
import { DataTable } from "@/components/ui/DataTable";
import { Pencil, Save, User, Phone, CalendarDays, HeartPulse, FileText, Clock, MapPin } from "lucide-react";

export default function PatientProfile() {
  const { patient, myAppointments, myRecords, myInvoices, myDoctors, loading } = usePatientOverview();
  const { data: doctors } = useDoctors();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: patient?.first_name || "",
    last_name: patient?.last_name || "",
    phone: patient?.phone || "",
    date_of_birth: patient?.date_of_birth || "",
    gender: patient?.gender || "",
    address: "",
    emergency_contact: "",
    medical_history: "",
  });

  const { updateItem: updatePatient, loading: updateLoading } = useUpdateMutation("patients", {
    onSuccess: () => {
      setIsEditing(false);
    },
    successMessage: "تم تحديث البيانات الشخصية بنجاح",
  });

  const handleEdit = () => {
    if (patient) {
      setEditForm({
        first_name: patient.first_name || "",
        last_name: patient.last_name || "",
        phone: patient.phone || "",
        date_of_birth: patient.date_of_birth || "",
        gender: patient.gender || "",
        address: "",
        emergency_contact: "",
        medical_history: "",
      });
    }
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    await updatePatient(patient.id, editForm);
  };

  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    return doctor ? `${doctor.first_name} ${doctor.last_name}` : doctorId;
  };

  const inputClass = "h-12 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground outline-none transition focus:border-primary/50";

  const personalInfo = [
    { icon: User, label: "الاسم", value: `${patient?.first_name ?? ""} ${patient?.last_name ?? ""}` },
    { icon: Phone, label: "الهاتف", value: patient?.phone },
    { icon: CalendarDays, label: "تاريخ الميلاد", value: patient?.date_of_birth },
    { icon: HeartPulse, label: "النوع", value: patient?.gender === "male" ? "ذكر" : patient?.gender === "female" ? "أنثى" : patient?.gender },
    { icon: MapPin, label: "العنوان", value: patient?.address || "غير متوفر" },
    { icon: FileText, label: "تاريخ طبي", value: patient?.medical_history || "غير متوفر" },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Patient / Profile"
        title="الملف الشخصي"
        description="إدارة بياناتك الشخصية والطبية"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
        {/* Personal Info */}
        <GlassCard
          title="البيانات الأساسية"
          subtitle="المعلومات الشخصية"
          action={
            !isEditing && (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 rounded-xl bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-400 hover:bg-amber-400/20"
              >
                <Pencil className="h-3.5 w-3.5" />
                تعديل
              </button>
            )
          }
        >
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : isEditing ? (
            <form onSubmit={handleSave} className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="الاسم الأول"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  className={inputClass}
                  required
                />
                <input
                  placeholder="الاسم الأخير"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  placeholder="تاريخ الميلاد"
                  value={editForm.date_of_birth}
                  onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                  className={inputClass}
                />
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  className={inputClass + " bg-[#0b1f19]"}
                >
                  <option value="">الجنس</option>
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </div>
              <input
                placeholder="رقم الهاتف"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className={inputClass}
              />
              <input
                placeholder="العنوان"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className={inputClass}
              />
              <input
                placeholder="رقم الطوارئ"
                value={editForm.emergency_contact}
                onChange={(e) => setEditForm({ ...editForm, emergency_contact: e.target.value })}
                className={inputClass}
              />
              <textarea
                placeholder="تاريخ طبي"
                value={editForm.medical_history}
                onChange={(e) => setEditForm({ ...editForm, medical_history: e.target.value })}
                className={inputClass + " min-h-[100px] py-3 resize-none"}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 h-11 rounded-2xl border border-foreground/10 bg-foreground/5 text-sm font-semibold text-foreground hover:bg-foreground/10"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="flex-1 h-11 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 text-sm font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {updateLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {personalInfo.map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-foreground/10 bg-foreground/[0.03]">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-foreground/50">{item.label}</p>
                    <p className="mt-1 font-semibold text-foreground">{item.value ?? "-"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Summary Cards */}
        <div className="space-y-6">
          <GlassCard title="ملخص النشاط" subtitle="إحصائيات سريعة">
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-2xl bg-foreground/5" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Clock, label: "المواعيد", value: myAppointments.length, color: "text-blue-400" },
                  { icon: FileText, label: "السجلات", value: myRecords.length, color: "text-amber-400" },
                  { icon: HeartPulse, label: "الأطباء", value: myDoctors.length, color: "text-emerald-400" },
                  { icon: FileText, label: "الفواتير", value: myInvoices.length, color: "text-rose-400" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4"
                  >
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-foreground/50">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Recent Appointments */}
          <GlassCard title="آخر المواعيد" subtitle="المواعيد الأخيرة">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-foreground/5" />
                ))}
              </div>
            ) : myAppointments.length === 0 ? (
              <EmptyState variant="data" title="لا توجد مواعيد" description="لم تحجز أي مواعيد بعد" />
            ) : (
              <div className="space-y-2">
                {myAppointments.slice(0, 5).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-xl border border-foreground/10 bg-foreground/[0.03] p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{getDoctorName(a.doctor_id)}</p>
                      <p className="text-xs text-foreground/50">
                        {formatDate(a.appointment_date)} - {formatTime(a.appointment_time)}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Medical Records */}
        {myRecords.length > 0 && (
          <GlassCard title="السجلات الطبية" subtitle="التشخيصات والملاحظات" className="lg:col-span-2">
            <DataTable
              columns={["الطبيب", "التشخيص", "الملاحظات", "التاريخ"]}
              rows={myRecords.slice(0, 5).map((r) => [
                getDoctorName(r.doctor_id),
                r.diagnosis || "-",
                <span key={r.id} className="line-clamp-2 max-w-[200px] text-foreground/60">
                  {r.notes || "-"}
                </span>,
                formatDate(r.created_at),
              ])}
            />
          </GlassCard>
        )}
      </div>
    </div>
  );
}
