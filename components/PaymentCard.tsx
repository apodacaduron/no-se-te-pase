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
  MoreHorizontal,
  Pencil,
  Trash2,
  CreditCard,
  Calendar,
  History,
  Loader2,
  PauseCircle,
  PlayCircle,
  Undo2,
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
  onUndoPaid: (payment: PaymentWithStatus) => Promise<void>;
  onTogglePaused: (id: string, isPaused: boolean) => Promise<void>;
  onDelete: (id: string) => void;
}

export function PaymentCard({
  payment,
  onEdit,
  onMarkPaid,
  onLoadHistory,
  onAddHistory,
  onUndoPaid,
  onTogglePaused,
  onDelete,
}: PaymentCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [undoPaidConfirmOpen, setUndoPaidConfirmOpen] = useState(false);
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
  const isPaused = payment.status === "paused";

  function wasPaidThisMonth(): boolean {
    if (!payment.last_paid_date) return false;
    const today = new Date();
    const lastPaid = new Date(payment.last_paid_date + "T00:00:00");
    return (
      lastPaid.getFullYear() === today.getFullYear() &&
      lastPaid.getMonth() === today.getMonth()
    );
  }

  const paidThisMonth = !isPaused && wasPaidThisMonth();

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

  function formatLatestPaymentLabel(): string {
    if (!payment.last_paid_date) return "Sin pagos registrados";
    const d = new Date(payment.last_paid_date + "T00:00:00");
    const amount =
      typeof payment.last_paid_amount === "number"
        ? ` · $${payment.last_paid_amount.toLocaleString("es-MX", { minimumFractionDigits: 0 })}`
        : "";
    return `Último pago: ${d.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}${amount}`;
  }

  function formatPlannedPaymentLabel(): string | null {
    if (!payment.computed_next_due) return null;
    const d = new Date(payment.computed_next_due + "T00:00:00");
    const prefix = payment.is_approximate ? "Fecha aprox." : "Referencia";
    return `${prefix}: ${d.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
    })}`;
  }

  const plannedPaymentLabel = formatPlannedPaymentLabel();
  const cardClass = isPaused
    ? "border-border bg-muted/40 opacity-70"
    : paidThisMonth
    ? "border-emerald-200 bg-emerald-50/70 shadow-sm shadow-emerald-100 hover:shadow-md transition-shadow"
    : "border-border bg-card shadow-sm hover:shadow-md transition-shadow";

  return (
    <div className={`rounded-xl border p-4 transition-all ${cardClass}`}>
      {/* Top row: icon + name + menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          {isPaused ? (
            <PauseCircle className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
          ) : paidThisMonth ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
          ) : (
            <CreditCard className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
          )}
          <p className="font-semibold text-sm leading-tight truncate text-foreground">
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
              Ver historial
            </DropdownMenuItem>
            {payment.last_paid_date && (
              <DropdownMenuItem onClick={() => setUndoPaidConfirmOpen(true)}>
                <Undo2 className="w-4 h-4" />
                Quitar último pago
              </DropdownMenuItem>
            )}
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

      {/* Bottom row: latest payment + actions */}
      <div className="mt-4 ml-6 space-y-3">
        <button
          type="button"
          onClick={handleOpenHistory}
          className="block w-full text-left text-sm text-foreground hover:text-primary transition-colors"
        >
          {formatLatestPaymentLabel()}
        </button>
        {plannedPaymentLabel && (
          <p className="text-xs text-muted-foreground">
            {plannedPaymentLabel}
          </p>
        )}
        {paidThisMonth && (
          <p className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
            Pagado este mes
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenHistory}
            className="h-7 text-xs gap-1.5 px-2.5 rounded-full"
          >
            <History className="w-3.5 h-3.5" />
            Historial
          </Button>
          {!isPaused && (
            <Button
              size="sm"
              onClick={() => setPaidDialogOpen(true)}
              className="h-7 text-xs gap-1.5 px-2.5 rounded-full font-medium"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Agregar pago
            </Button>
          )}
        </div>
      </div>

      <Dialog open={paidDialogOpen} onOpenChange={(open) => !markingPaid && setPaidDialogOpen(open)}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={handlePaidSubmit}>
            <DialogHeader>
              <DialogTitle>Agregar pago</DialogTitle>
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
                {markingPaid ? "Guardando…" : "Agregar pago"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Historial de pagos</DialogTitle>
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

      <AlertDialog open={undoPaidConfirmOpen} onOpenChange={setUndoPaidConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quitar el último pago?</AlertDialogTitle>
            <AlertDialogDescription>
              Se quitará el último pago registrado de{" "}
              <span className="font-medium text-foreground">{payment.name}</span>{" "}
              y se actualizará la fecha del último pago.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => onUndoPaid(payment)}>
              Quitar pago
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
