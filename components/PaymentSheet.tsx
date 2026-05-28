"use client";

import { useEffect, useState } from "react";
import {
  Payment,
  PaymentCategory,
  PaymentFrequency,
  CATEGORY_LABELS,
  FREQUENCY_LABELS,
} from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

type PaymentFormData = Omit<
  Payment,
  "id" | "user_id" | "created_at" | "updated_at"
>;

const EMPTY: PaymentFormData = {
  name: "",
  category: "other",
  frequency: "monthly",
  amount: null,
  currency: "MXN",
  cutoff_day: null,
  due_day: null,
  next_due_date: null,
  last_paid_date: null,
  is_approximate: false,
  attention_after_cutoff: false,
  notes: null,
};

interface PaymentSheetProps {
  open: boolean;
  payment?: Payment | null;
  onClose: () => void;
  onSave: (data: PaymentFormData, id?: string) => Promise<void>;
}

export function PaymentSheet({
  open,
  payment,
  onClose,
  onSave,
}: PaymentSheetProps) {
  const [form, setForm] = useState<PaymentFormData>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        payment
          ? {
              name: payment.name,
              category: payment.category,
              frequency: payment.frequency,
              amount: payment.amount,
              currency: payment.currency ?? "MXN",
              cutoff_day: payment.cutoff_day,
              due_day: payment.due_day,
              next_due_date: payment.next_due_date,
              last_paid_date: payment.last_paid_date,
              is_approximate: payment.is_approximate,
              attention_after_cutoff: payment.attention_after_cutoff,
              notes: payment.notes,
            }
          : EMPTY
      );
    }
  }, [payment, open]);

  function set<K extends keyof PaymentFormData>(key: K, value: PaymentFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form, payment?.id);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const isCreditCard = form.category === "credit_card";
  // Frecuencias donde tiene sentido pedir solo el día del mes
  const isRecurringByDay = ["weekly", "biweekly", "monthly", "bimonthly"].includes(form.frequency);
  // Pedir solo día si no es tarjeta y la frecuencia es mensual/bimestral/quincenal
  const useDayInput = !isCreditCard && isRecurringByDay;

  return (
    <Sheet open={open} onOpenChange={(v) => !saving && !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto px-0 pb-0 gap-0"
      >
        <SheetHeader className="px-5 pt-2 pb-4 border-b">
          <SheetTitle>{payment ? "Editar pago" : "Nuevo pago"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 pt-5 pb-6">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              required
              placeholder="Ej: BBVA, CFE, Contador…"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          {/* Category + Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Select
                value={form.category}
                onValueChange={(v) => set("category", v as PaymentCategory)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Frecuencia</Label>
              <Select
                value={form.frequency}
                onValueChange={(v) => set("frequency", v as PaymentFrequency)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount">
              Monto{" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                $
              </span>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="pl-7"
                value={form.amount ?? ""}
                onChange={(e) =>
                  set("amount", e.target.value ? parseFloat(e.target.value) : null)
                }
              />
            </div>
          </div>

          {/* Fecha según tipo */}
          {isCreditCard ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cutoff">Día de corte</Label>
                  <Input
                    id="cutoff"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="15"
                    value={form.cutoff_day ?? ""}
                    onChange={(e) =>
                      set("cutoff_day", e.target.value ? parseInt(e.target.value) : null)
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="due">Día límite de pago</Label>
                  <Input
                    id="due"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="5"
                    value={form.due_day ?? ""}
                    onChange={(e) =>
                      set("due_day", e.target.value ? parseInt(e.target.value) : null)
                    }
                  />
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.attention_after_cutoff}
                  onChange={(e) => set("attention_after_cutoff", e.target.checked)}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-sm text-muted-foreground">
                  Enviar a atención requerida desde el día de corte
                </span>
              </label>
            </div>
          ) : useDayInput ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="due-day">Día de vencimiento</Label>
                <Input
                  id="due-day"
                  required
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Ej: 1"
                  value={form.due_day ?? ""}
                  onChange={(e) =>
                    set("due_day", e.target.value ? parseInt(e.target.value) : null)
                  }
                />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_approximate}
                  onChange={(e) => set("is_approximate", e.target.checked)}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-sm text-muted-foreground">
                  Fecha aproximada{" "}
                  <span className="text-xs">(la fecha real puede variar un poco)</span>
                </span>
              </label>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="next-due">Próxima fecha de pago</Label>
              <Input
                id="next-due"
                required
                type="date"
                value={form.next_due_date ?? ""}
                onChange={(e) => set("next_due_date", e.target.value || null)}
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">
              Notas{" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Número de cuenta, referencias…"
              className="resize-none"
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value || null)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  Guardando…
                </>
              ) : payment ? (
                "Guardar cambios"
              ) : (
                "Agregar"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
