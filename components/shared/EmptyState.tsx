import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 space-y-4",
        className
      )}
    >
      <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
        <Icon size={32} />
      </div>
      <h4 className="text-xl font-bold text-white">{title}</h4>
      <p className="text-muted-foreground max-w-xs">{description}</p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
