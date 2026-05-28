"use client";

import { useState } from "react";
import {
  PaymentHistory,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  MoreHorizontal,
  Pencil,
  Trash2,
  CreditCard,
  Calendar,
  History,
  Loader2,
  PauseCircle,
  PlayCircle,
} from "lucide-react";

interface PaymentCardProps {
  payment: PaymentWithStatus;
  onEdit: (payment: PaymentWithStatus) => void;
  onMarkPaid: (id: string, amount: number | null) => Promise<void>;
  onLoadHistory: (id: string) => Promise<PaymentHistory[]>;
  onAddHistory: (
    payment: PaymentWithStatus,
    paidDate: string,
    amount: number | null
  ) => Promise<PaymentHistory[]>;
  onTogglePaused: (id: string, isPaused: boolean) => Promise<void>;
  onDelete: (id: string) => void;
}

export function PaymentCard({
  payment,
  onEdit,
  onMarkPaid,
  onLoadHistory,
  onAddHistory,
  onTogglePaused,
  onDelete,
}: PaymentCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [paidDialogOpen, setPaidDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<PaymentHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [paidAmount, setPaidAmount] = useState("");
  const [historyPaidDate, setHistoryPaidDate] = useState(
    () => payment.last_paid_date ?? new Date().toISOString().split("T")[0]
  );
  const [historyPaidAmount, setHistoryPaidAmount] = useState(
    () => payment.last_paid_amount?.toString() ?? ""
  );
  const [markingPaid, setMarkingPaid] = useState(false);
  const [addingHistory, setAddingHistory] = useState(false);
  const isPaid = payment.status === "paid";
  const isPaused = payment.status === "paused";
  const isOverdue = payment.status === "overdue";
  const isUrgent =
    !isPaid &&
    !isPaused &&
    (payment.requires_attention ||
      (payment.days_until_due !== null && payment.days_until_due <= 7));

  async function handlePaidSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMarkingPaid(true);
    try {
      await onMarkPaid(payment.id, paidAmount ? parseFloat(paidAmount) : null);
      setPaidDialogOpen(false);
      setPaidAmount("");
    } finally {
      setMarkingPaid(false);
    }
  }

  async function handleOpenHistory() {
    setHistoryDialogOpen(true);
    setHistoryPaidDate(payment.last_paid_date ?? new Date().toISOString().split("T")[0]);
    setHistoryPaidAmount(payment.last_paid_amount?.toString() ?? "");
    setHistoryLoading(true);
    try {
      setHistoryItems(await onLoadHistory(payment.id));
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleAddHistorySubmit(e: React.FormEvent) {
    e.preventDefault();
    setAddingHistory(true);
    try {
      const nextItems = await onAddHistory(
        payment,
        historyPaidDate,
        historyPaidAmount ? parseFloat(historyPaidAmount) : null
      );
      setHistoryItems(nextItems);
      setHistoryPaidAmount("");
    } finally {
      setAddingHistory(false);
    }
  }

  function formatMoney(amount: number | null): string {
    if (typeof amount !== "number") return "Sin monto";
    return `$${amount.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatDueLabel(): string {
    if (isPaused) return "Pausado";
    if (!payment.computed_next_due) return "Sin fecha";
    if (isPaid) {
      if (payment.last_paid_date) {
        const d = new Date(payment.last_paid_date + "T00:00:00");
        const amount =
          typeof payment.last_paid_amount === "number"
            ? ` · $${payment.last_paid_amount.toLocaleString("es-MX", { minimumFractionDigits: 0 })}`
            : "";
        return `Pagado el ${d.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}${amount}`;
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
    if (payment.requires_attention) {
      return `Corte listo · vence el ${d.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}`;
    }
    const prefix = payment.is_approximate ? "~" : "Vence el ";
    return `${prefix}${d.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}`;
  }

  // Card container styles
  const cardClass = isOverdue
    ? "border-red-200 bg-red-50/70 shadow-sm shadow-red-100"
    : isUrgent
    ? "border-amber-200 bg-amber-50/80 shadow-sm shadow-amber-100"
    : isPaused
    ? "border-border bg-muted/40 opacity-70"
    : isPaid
    ? "border-border bg-card opacity-60"
    : "border-border bg-card shadow-sm hover:shadow-md transition-shadow";

  const StatusIcon = isPaid
    ? CheckCircle2
    : isPaused
    ? PauseCircle
    : isOverdue
    ? AlertCircle
    : Clock;

  const iconClass = isPaid
    ? "text-emerald-400"
    : isPaused
    ? "text-slate-400"
    : isOverdue
    ? "text-red-500"
    : isUrgent
    ? "text-amber-500"
    : "text-slate-400";

  const dueClass = isPaid
    ? "text-emerald-600 font-medium"
    : isPaused
    ? "text-muted-foreground font-medium"
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
            <DropdownMenuItem onClick={handleOpenHistory}>
              <History className="w-4 h-4" />
              Ver detalles
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTogglePaused(payment.id, isPaused)}>
              {isPaused ? (
                <PlayCircle className="w-4 h-4" />
              ) : (
                <PauseCircle className="w-4 h-4" />
              )}
              {isPaused ? "Reactivar" : "Pausar"}
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
        {!isPaid && !isPaused && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPaidDialogOpen(true)}
            className="h-7 text-xs gap-1.5 px-2.5 rounded-full bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-800 font-medium"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Marcar pagado
          </Button>
        )}
      </div>

      <Dialog open={paidDialogOpen} onOpenChange={(open) => !markingPaid && setPaidDialogOpen(open)}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={handlePaidSubmit}>
            <DialogHeader>
              <DialogTitle>Marcar como pagado</DialogTitle>
              <DialogDescription>
                Registra el pago de {payment.name}. El monto es opcional.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5 py-4">
              <Label htmlFor={`paid-amount-${payment.id}`}>Monto pagado</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                  $
                </span>
                <Input
                  id={`paid-amount-${payment.id}`}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={payment.amount !== null ? String(payment.amount) : "0.00"}
                  className="pl-7"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaidDialogOpen(false)}
                disabled={markingPaid}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={markingPaid}>
                {markingPaid ? "Guardando…" : "Marcar pagado"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalles de pagos</DialogTitle>
            <DialogDescription>
              Historial registrado para {payment.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddHistorySubmit} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <div className="space-y-1.5">
              <Label htmlFor={`history-date-${payment.id}`}>Fecha</Label>
              <Input
                id={`history-date-${payment.id}`}
                required
                type="date"
                value={historyPaidDate}
                onChange={(e) => setHistoryPaidDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`history-amount-${payment.id}`}>Monto</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                  $
                </span>
                <Input
                  id={`history-amount-${payment.id}`}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-7"
                  value={historyPaidAmount}
                  onChange={(e) => setHistoryPaidAmount(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" className="self-end" disabled={addingHistory}>
              {addingHistory ? "..." : "Agregar"}
            </Button>
          </form>
          <div className="max-h-80 overflow-y-auto border-t">
            {historyLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : historyItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aún no hay pagos registrados.
              </p>
            ) : (
              <div className="divide-y">
                {historyItems.map((item) => {
                  const paidDate = new Date(item.paid_date + "T00:00:00");
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {paidDate.toLocaleDateString("es-MX", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Registrado {new Date(item.created_at).toLocaleDateString("es-MX", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold">
                        {formatMoney(item.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
