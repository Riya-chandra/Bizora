import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'outline';
}

export function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();
  
  const styles = {
    pending: "bg-amber-500/10 text-amber-600 border-amber-200",
    paid: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    issued: "bg-blue-500/10 text-blue-600 border-blue-200",
    cancelled: "bg-red-500/10 text-red-600 border-red-200",
  };

  const activeStyle = styles[normalizedStatus as keyof typeof styles] || "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      activeStyle,
      variant === 'outline' && "bg-transparent"
    )}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
