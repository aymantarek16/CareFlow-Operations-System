import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { SkeletonCard } from "@/components/ui/SkeletonTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { useActivityLogs } from "@/hooks/useData";
import { formatDateTime } from "@/lib/helpers";
import { Clock, User, FileText, Calendar, Activity } from "lucide-react";

const getActionIcon = (action: string) => {
  if (action?.includes("appointment")) return Calendar;
  if (action?.includes("patient")) return User;
  if (action?.includes("record")) return FileText;
  return Activity;
};

export default function AdminActivity() {
  const { data: activities, loading } = useActivityLogs();

  return (
    <div>
      <PageHeader eyebrow="Admin / Activity" title="سجل النشاط" description="متابعة آخر العمليات والإجراءات في النظام." />
      <GlassCard title="آخر الأنشطة" subtitle="سجل زمني للعمليات">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <EmptyState
            variant="data"
            title="لا توجد أنشطة"
            description="لم يتم تسجيل أي أنشطة في النظام بعد"
          />
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const Icon = getActionIcon(activity.action);
              return (
                <div key={activity.id} className="flex items-start gap-4 rounded-[20px] border border-foreground/10 bg-foreground/[0.03] p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary flex-shrink-0 mt-1">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{activity.action}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-foreground/50">
                      <span>{activity.user_name || "غير معروف"}</span>
                      <span>•</span>
                      <span>{formatDateTime(activity.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
