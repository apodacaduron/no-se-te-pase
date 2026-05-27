"use client";

import { useState } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [confirmOpen, setConfirmOpen] = useState(false);
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

  // Card container styles
  const cardClass = isOverdue
    ? "border-red-200 bg-red-50/70 shadow-sm shadow-red-100"
    : isUrgent
    ? "border-amber-200 bg-amber-50/80 shadow-sm shadow-amber-100"
    : isPaid
    ? "border-border bg-card opacity-60"
    : "border-border bg-card shadow-sm hover:shadow-md transition-shadow";

  const StatusIcon = isPaid
    ? CheckCircle2
    : isOverdue
    ? AlertCircle
    : Clock;

  const iconClass = isPaid
    ? "text-emerald-400"
    : isOverdue
    ? "text-red-500"
    : isUrgent
    ? "text-amber-500"
    : "text-slate-400";

  const dueClass = isPaid
    ? "text-emerald-600 font-medium"
    : isOverdue
    ? "text-red-600 font-semibold"
    : isUrgent
    ? "text-amber-600 font-semibold"
    : "text-muted-foreground";

  return (
    <div className={`rounded-2xl border p-4 transition-all ${cardClass}`}>
      {/* Top row: icon + name + menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <StatusIcon className={`w-4 h-4 mt-0.5 shrink-0 ${iconClass}`} />
          <p className={`font-semibold text-sm leading-tight truncate ${isPaid ? "text-muted-foreground" : "text-foreground"}`}>
            {payment.name}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-muted-foreground/60 hover:text-muted-foreground -mt-0.5 -mr-1">
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
              onClick={() => setConfirmOpen(true)}
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
          className={`text-xs gap-1 px-2 py-0.5 rounded-full ${CATEGORY_COLORS[payment.category]}`}
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
          <span className="text-sm font-bold text-foreground ml-0.5">
            ${payment.amount.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
          </span>
        )}
      </div>

      {/* Extra info */}
      {payment.category === "credit_card" && payment.cutoff_day !== null && (
        <p className="text-xs text-muted-foreground mt-1.5 ml-6">
          Corte: día {payment.cutoff_day} · Límite: día {payment.due_day}
        </p>
      )}
      {payment.notes && (
        <p className="text-xs text-muted-foreground mt-1 ml-6 truncate">
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
            className="h-7 text-xs gap-1.5 px-2.5 rounded-full bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-800 font-medium"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Marcar pagado
          </Button>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este recordatorio?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará{" "}
              <span className="font-medium text-foreground">{payment.name}</span>{" "}
              permanentemente. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(payment.id)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
