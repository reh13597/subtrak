"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  message?: string;
}

export default function LoadingSpinner({
  size = 48,
  className,
  message,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "min-h-[70vh] flex flex-col items-center justify-center gap-4",
        className
      )}
    >
      <Loader2 className="animate-spin text-primary" size={size} />
      {message && (
        <p className="text-muted-foreground text-sm">{message}</p>
      )}
    </div>
  );
}
