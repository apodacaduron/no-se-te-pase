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
    ? "opacity-80"
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
      {/* Top row: icon + name + menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <StatusIcon className={`w-4 h-4 mt-0.5 shrink-0 ${iconClass}`} />
          <p className="font-medium text-sm leading-tight truncate">
            {payment.name}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-muted-foreground -mt-0.5 -mr-1">
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

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2 ml-6">
        <Badge
          variant="outline"
          className={`text-sm gap-1 ${CATEGORY_COLORS[payment.category]}`}
        >
          {payment.category === "credit_card" && (
            <CreditCard className="w-3 h-3" />
          )}
          {CATEGORY_LABELS[payment.category]}
        </Badge>
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="w-3 h-3" />
          {FREQUENCY_LABELS[payment.frequency]}
        </span>
        {payment.amount !== null && (
          <span className="text-sm font-semibold">
            ${payment.amount.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
          </span>
        )}
      </div>

      {/* Extra info */}
      {payment.category === "credit_card" && payment.cutoff_day !== null && (
        <p className="text-sm text-muted-foreground mt-1 ml-6">
          Corte: día {payment.cutoff_day} · Límite: día {payment.due_day}
        </p>
      )}
      {payment.notes && (
        <p className="text-sm text-muted-foreground mt-1 ml-6 truncate">
          {payment.notes}
        </p>
      )}

      {/* Bottom row: due date + mark paid */}
      <div className="flex items-center justify-between mt-3 ml-6">
        <span className={`text-sm ${dueClass}`}>
          {formatDueLabel()}
        </span>
        {!isPaid && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onMarkPaid(payment.id)}
            className="h-7 text-sm gap-1 px-2 bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Marcar pagado
          </Button>
        )}
      </div>
    </div>
  );
}
