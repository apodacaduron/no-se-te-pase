export type PaymentCategory =
  | "credit_card"
  | "insurance"
  | "utility"
  | "subscription"
  | "other";

export type PaymentFrequency =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "bimonthly"
  | "quarterly"
  | "semiannual"
  | "annual"
  | "custom";

export type PaymentStatus = "pending" | "paid" | "overdue";

export interface Payment {
  id: string;
  user_id: string;
  name: string;
  category: PaymentCategory;
  frequency: PaymentFrequency;
  amount: number | null;
  currency: string;
  // For credit cards
  cutoff_day: number | null; // day of month (1-31)
  due_day: number | null; // day of month (1-31) — days after cutoff
  // For other payments
  next_due_date: string | null; // ISO date
  // Status
  last_paid_date: string | null;
  is_approximate: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentWithStatus extends Payment {
  status: PaymentStatus;
  days_until_due: number | null;
  computed_next_due: string | null; // computed ISO date
}

export const CATEGORY_LABELS: Record<PaymentCategory, string> = {
  credit_card: "Tarjeta de crédito",
  insurance: "Seguro",
  utility: "Servicio (agua, luz…)",
  subscription: "Suscripción",
  other: "Otro",
};

export const FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
  bimonthly: "Bimestral",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
  custom: "Personalizado",
};

export const CATEGORY_COLORS: Record<PaymentCategory, string> = {
  credit_card: "bg-violet-100 text-violet-700 border-violet-200",
  insurance: "bg-blue-100 text-blue-700 border-blue-200",
  utility: "bg-cyan-100 text-cyan-700 border-cyan-200",
  subscription: "bg-orange-100 text-orange-700 border-orange-200",
  other: "bg-zinc-100 text-zinc-700 border-zinc-200",
};
