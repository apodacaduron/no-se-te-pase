"use client";

import {
  PaymentWithStatus,
  CATEGORY_LABELS,
  FREQUENCY_LABELS,
  CATEGORY_COLORS,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  MoreHorizontal,
  Pencil,
  Trash2,
  CreditCard,
  Calendar,
} from "lucide-react";

interface PaymentCardProps {
  payment: PaymentWithStatus;
  onEdit: (payment: PaymentWithStatus) => void;
  onMarkPaid: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PaymentCard({
  payment,
  onEdit,
  onMarkPaid,
  onDelete,
}: PaymentCardProps) {
  const isPaid = payment.status === "paid";
  const isOverdue = payment.status === "overdue";
  const isUrgent =
    !isPaid && payment.days_until_due !== null && payment.days_until_due <= 7;

  function formatDueLabel(): string {
    if (!payment.computed_next_due) return "Sin fecha";
    if (isPaid) {
      if (payment.last_paid_date) {
        const d = new Date(payment.last_paid_date + "T00:00:00");
        return `Pagado el ${d.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}`;
      }
      return "Pagado";
    }
    if (isOverdue) {
      const abs = Math.abs(payment.days_until_due!);
      return abs === 1 ? "Venció ayer" : `Venció hace ${abs} días`;
    }
    if (payment.days_until_due === 0) return "Vence hoy";
    if (payment.days_until_due === 1) return "Vence mañana";
    if (payment.days_until_due !== null && payment.days_until_due <= 7)
      return `Vence en ${payment.days_until_due} días`;
    const d = new Date(payment.computed_next_due + "T00:00:00");
    const prefix = payment.is_approximate ? "~" : "Vence el ";
    return `${prefix}${d.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}`;
  }

  const cardClass = isOverdue
    ? "border-destructive/30 bg-destructive/5"
    : isUrgent
    ? "border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/20"
    : isPaid
    ? "opacity-55"
    : "";

  const StatusIcon = isPaid ? CheckCircle2 : isOverdue ? AlertCircle : Clock;

  const iconClass = isPaid
    ? "text-emerald-500"
    : isOverdue
    ? "text-destructive"
    : isUrgent
    ? "text-amber-500"
    : "text-muted-foreground";

  const dueClass = isPaid
    ? "text-emerald-600"
    : isOverdue
    ? "text-destructive font-semibold"
    : isUrgent
    ? "text-amber-600 font-medium"
    : "text-muted-foreground";

  return (
    <div className={`rounded-xl border bg-card p-4 transition-all ${cardClass}`}>
      <div className="flex items-start justify-between gap-3">
        {/* Left */}
        <div className="flex items-start gap-3 min-w-0">
          <StatusIcon className={`w-4 h-4 mt-0.5 shrink-0 ${iconClass}`} />
          <div className="min-w-0 space-y-1.5">
            <p className="font-medium text-sm leading-tight truncate">
              {payment.name}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className={`text-xs gap-1 ${CATEGORY_COLORS[payment.category]}`}
              >
                {payment.category === "credit_card" && (
                  <CreditCard className="w-3 h-3" />
                )}
                {CATEGORY_LABELS[payment.category]}
              </Badge>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {FREQUENCY_LABELS[payment.frequency]}
              </span>
              {payment.amount !== null && (
                <span className="text-xs font-semibold">
                  ${payment.amount.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                </span>
              )}
            </div>
            {payment.category === "credit_card" &&
              payment.cutoff_day !== null && (
                <p className="text-xs text-muted-foreground">
                  Corte: día {payment.cutoff_day} · Límite: día {payment.due_day}
                </p>
              )}
            {payment.notes && (
              <p className="text-xs text-muted-foreground truncate max-w-50">
                {payment.notes}
              </p>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`text-xs whitespace-nowrap ${dueClass}`}>
            {formatDueLabel()}
          </span>
          <div className="flex items-center gap-1">
            {!isPaid && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMarkPaid(payment.id)}
                className="h-7 text-xs gap-1 px-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Marcar pagado
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              } />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(payment)}>
                  <Pencil className="w-4 h-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(payment.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
