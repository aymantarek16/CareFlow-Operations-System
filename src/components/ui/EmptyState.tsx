import { ReactNode } from "react";
import { PackageOpen, Search, FileX, Inbox, LucideIcon } from "lucide-react";
import { cn } from "@/lib/helpers";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: ReactNode;
  variant?: "default" | "search" | "data" | "error";
  className?: string;
}

const variants = {
  default: {
    icon: Inbox,
    title: "لا توجد بيانات",
    description: "لم يتم العثور على أي بيانات حالياً",
  },
  search: {
    icon: Search,
    title: "لا توجد نتائج",
    description: "جرب تغيير معايير البحث",
  },
  data: {
    icon: PackageOpen,
    title: "قائمة فارغة",
    description: "قم بإضافة عناصر جديدة للبدء",
  },
  error: {
    icon: FileX,
    title: "حدث خطأ",
    description: "تعذر تحميل البيانات. حاول مرة أخرى",
  },
};

export function EmptyState({
  icon: CustomIcon,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  const { icon: VariantIcon, title: defaultTitle, description: defaultDesc } = variants[variant];
  const Icon = CustomIcon || VariantIcon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[24px] border border-foreground/10 bg-foreground/[0.02] p-8 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-foreground/10 bg-foreground/[0.03]">
        <Icon className="h-8 w-8 text-foreground/40" />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-foreground">
        {title || defaultTitle}
      </h3>
      <p className="mb-4 max-w-xs text-sm text-foreground/50">
        {description || defaultDesc}
      </p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

interface EmptyStateButtonProps {
  onClick: () => void;
  children: ReactNode;
}

export function EmptyStateButton({ onClick, children }: EmptyStateButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 text-sm font-semibold text-background hover:opacity-90"
    >
      {children}
    </Button>
  );
}
