import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Clock } from "lucide-react";

export default function AdminActivity() {
  // Placeholder for activity log - can be connected to a real audit log table later
  const activities = [
    { time: "منذ 5 دقائق", action: "تم إنشاء موعد جديد", user: "مدير النظام" },
    { time: "منذ 15 دقيقة", action: "تم تحديث حالة موعد إلى مكتمل", user: "د. أحمد" },
    { time: "منذ 30 دقيقة", action: "تم تسجيل مريض جديد", user: "موظف الاستقبال" },
    { time: "منذ ساعة", action: "تم إضافة فاتورة جديدة", user: "مدير النظام" },
    { time: "منذ ساعتين", action: "تم تعديل بيانات مريض", user: "مدير النظام" },
    { time: "منذ 3 ساعات", action: "تم إلغاء موعد", user: "المريض" },
    { time: "أمس", action: "تم إضافة طبيب جديد للنظام", user: "مدير النظام" },
    { time: "أمس", action: "تم إنشاء 5 مواعيد جديدة", user: "موظف الاستقبال" },
  ];

  return (
    <div>
      <PageHeader eyebrow="Admin / Activity" title="سجل النشاط" description="متابعة آخر العمليات والإجراءات في النظام." />
      <GlassCard title="آخر الأنشطة" subtitle="سجل زمني للعمليات">
        <div className="space-y-3">
          {activities.map((activity, idx) => (
            <div key={idx} className="flex items-start gap-4 rounded-[20px] border border-foreground/10 bg-foreground/[0.03] p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary flex-shrink-0 mt-1">
                <Clock size={16} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{activity.action}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-foreground/50">
                  <span>{activity.user}</span>
                  <span>•</span>
                  <span>{activity.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
