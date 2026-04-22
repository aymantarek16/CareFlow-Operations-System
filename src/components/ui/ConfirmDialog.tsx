import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/helpers";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
}

const variants = {
  danger: "bg-rose-500 hover:bg-rose-600",
  warning: "bg-amber-500 hover:bg-amber-600",
  info: "bg-primary hover:bg-primary/90",
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  onConfirm,
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border border-foreground/10 bg-background/95 backdrop-blur-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-right text-foreground">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-right text-foreground/60">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2 sm:justify-start">
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "rounded-xl text-sm font-semibold text-white",
              variants[variant],
              loading && "opacity-60 cursor-not-allowed"
            )}
          >
            {loading ? "جاري التنفيذ..." : confirmText}
          </AlertDialogAction>
          <AlertDialogCancel className="rounded-xl border border-foreground/10 bg-foreground/5 text-foreground hover:bg-foreground/10">
            {cancelText}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
