"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PaymentHistory, PaymentWithStatus } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type SummaryPeriod = "month" | "last30" | "last90" | "year" | "all";

interface PaymentSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: PaymentHistory[];
  payments: PaymentWithStatus[];
  loading: boolean;
}

const PERIODS: Array<{ value: SummaryPeriod; label: string }> = [
  { value: "month", label: "Mes" },
  { value: "last30", label: "30 días" },
  { value: "last90", label: "90 días" },
  { value: "year", label: "Año" },
  { value: "all", label: "Todo" },
];

export function PaymentSummaryDialog({
  open,
  onOpenChange,
  history,
  payments,
  loading,
}: PaymentSummaryDialogProps) {
  const [period, setPeriod] = useState<SummaryPeriod>("month");

  const summary = useMemo(() => {
    const now = new Date();
    const start = getPeriodStart(period, now);
    const paymentById = new Map(payments.map((payment) => [payment.id, payment]));
    const filtered = history.filter((item) => {
      const paidDate = new Date(item.paid_date + "T00:00:00");
      return !start || paidDate >= start;
    });
    const withAmount = filtered.filter((item) => item.amount !== null);
    const total = withAmount.reduce((sum, item) => sum + (item.amount ?? 0), 0);
    const average = withAmount.length > 0 ? total / withAmount.length : 0;
    const missingAmount = filtered.length - withAmount.length;
    const bucketMode = period === "month" || period === "last30" ? "day" : period === "last90" ? "week" : "month";
    const buckets = buildBuckets(filtered, bucketMode);
    const topPayments = Array.from(
      filtered.reduce((acc, item) => {
        const previous = acc.get(item.payment_id) ?? {
          name: paymentById.get(item.payment_id)?.name ?? "Recordatorio eliminado",
          amount: 0,
          count: 0,
        };
        previous.amount += item.amount ?? 0;
        previous.count += 1;
        acc.set(item.payment_id, previous);
        return acc;
      }, new Map<string, { name: string; amount: number; count: number }>())
    )
      .map(([, value]) => value)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);

    return {
      total,
      average,
      count: filtered.length,
      withAmount: withAmount.length,
      missingAmount,
      buckets,
      topPayments,
    };
  }, [history, payments, period]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Resumen de pagos</DialogTitle>
          <DialogDescription>
            Lo pagado según tu historial registrado.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 overflow-x-auto pb-1">
          {PERIODS.map((item) => (
            <Button
              key={item.value}
              type="button"
              size="sm"
              variant={period === item.value ? "default" : "outline"}
              onClick={() => setPeriod(item.value)}
              className="shrink-0"
            >
              {item.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex h-72 items-center justify-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-2">
              <Metric label="Pagado" value={formatMoney(summary.total)} tone="strong" />
              <Metric label="Pagos" value={String(summary.count)} />
              <Metric label="Promedio" value={formatMoney(summary.average)} />
            </div>

            <div className="h-64 rounded-lg border bg-card p-3">
              {summary.buckets.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Sin pagos con monto en este periodo.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.buckets} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(value) => `$${Number(value).toLocaleString("es-MX")}`} />
                    <Tooltip
                      cursor={{ fill: "#f1f5f9" }}
                      formatter={(value) => [formatMoney(Number(value)), "Pagado"]}
                      labelFormatter={(label) => `Periodo: ${label}`}
                    />
                    <Bar dataKey="amount" fill="#0f766e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_0.9fr]">
              <div className="rounded-lg border p-3">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Más pesados
                </p>
                <div className="mt-2 space-y-2">
                  {summary.topPayments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin pagos en este periodo.</p>
                  ) : (
                    summary.topPayments.map((item) => (
                      <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate">{item.name}</span>
                        <span className="shrink-0 font-semibold">{formatMoney(item.amount)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Captura
                </p>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Con monto</span>
                    <span className="font-medium">{summary.withAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sin monto</span>
                    <span className="font-medium">{summary.missingAmount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "strong";
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 truncate text-lg font-semibold ${tone === "strong" ? "text-teal-700" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function getPeriodStart(
  period: SummaryPeriod,
  now: Date
): Date | null {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  if (period === "last30") {
    start.setDate(start.getDate() - 29);
    return start;
  }
  if (period === "last90") {
    start.setDate(start.getDate() - 89);
    return start;
  }
  if (period === "year") {
    return new Date(now.getFullYear(), 0, 1);
  }
  return null;
}

function buildBuckets(
  history: PaymentHistory[],
  mode: "day" | "week" | "month"
): Array<{ key: string; label: string; amount: number }> {
  const buckets = new Map<string, { key: string; label: string; amount: number }>();

  for (const item of history) {
    if (item.amount === null) continue;
    const paidDate = new Date(item.paid_date + "T00:00:00");
    const key = getBucketKey(paidDate, mode);
    const label = getBucketLabel(paidDate, mode);
    const bucket = buckets.get(key) ?? { key, label, amount: 0 };
    bucket.amount += item.amount;
    buckets.set(key, bucket);
  }

  return Array.from(buckets.values()).sort((a, b) => a.key.localeCompare(b.key));
}

function getBucketKey(date: Date, mode: "day" | "week" | "month"): string {
  if (mode === "day") {
    return date.toISOString().split("T")[0];
  }
  if (mode === "week") {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    return weekStart.toISOString().split("T")[0];
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getBucketLabel(date: Date, mode: "day" | "week" | "month"): string {
  if (mode === "day") {
    return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  }
  if (mode === "week") {
    return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  }
  return date.toLocaleDateString("es-MX", { month: "short" });
}

function formatMoney(amount: number): string {
  return `$${amount.toLocaleString("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}
