import { Payment, PaymentFrequency, PaymentStatus, PaymentWithStatus } from "./types";

/**
 * Given a payment, compute the next due date and status.
 */
export function computePaymentStatus(payment: Payment): PaymentWithStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let nextDue: Date | null = null;

  const usesDayInput = ["weekly", "biweekly", "monthly", "bimonthly"].includes(payment.frequency);

  if (payment.due_day !== null && (payment.category === "credit_card" || usesDayInput)) {
    // Usa last_paid_date como ancla para calcular el siguiente vencimiento correcto
    // Ej: agua bimestral, día 27 — si pagué en mayo, el siguiente es julio 27
    nextDue = nextOccurrenceOfDayWithFrequency(
      today,
      payment.due_day,
      payment.frequency,
      payment.last_paid_date ?? null
    );
  } else if (payment.next_due_date) {
    nextDue = new Date(payment.next_due_date + "T00:00:00");
    if (nextDue < today) {
      nextDue = rollForward(nextDue, payment.frequency);
    }
  }

  let status: PaymentStatus = "pending";
  let daysUntilDue: number | null = null;

  if (nextDue) {
    const diff = Math.ceil(
      (nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    daysUntilDue = diff;

    if (payment.last_paid_date) {
      // El usuario marcó manualmente como pagado — verificar que sea de este ciclo
      const lastPaid = new Date(payment.last_paid_date + "T00:00:00");
      const cycleStart = prevOccurrence(nextDue, payment.frequency);
      if (lastPaid >= cycleStart && lastPaid <= today) {
        status = "paid";
      } else {
        // El pago marcado es de un ciclo anterior, ya venció de nuevo
        status = diff < 0 ? "overdue" : "pending";
      }
    } else {
      status = diff < 0 ? "overdue" : "pending";
    }
  }

  return {
    ...payment,
    status,
    days_until_due: daysUntilDue,
    computed_next_due: nextDue ? nextDue.toISOString().split("T")[0] : null,
  };
}

function nextOccurrenceOfDayWithFrequency(
  today: Date,
  day: number,
  frequency: PaymentFrequency,
  lastPaidDate: string | null
): Date {
  // Si hay fecha de último pago, arrancamos desde ahí y avanzamos por frecuencia
  // hasta encontrar la próxima fecha futura con ese día
  if (lastPaidDate) {
    const lastPaid = new Date(lastPaidDate + "T00:00:00");
    // Ancla: día de vencimiento en el mismo mes del último pago
    const anchor = new Date(lastPaid);
    anchor.setDate(day);
    // Si el día ya pasó en ese mes, retrocedemos al mes anterior del pago
    // para que rollForward arranque desde el ciclo correcto
    if (anchor > lastPaid) {
      anchor.setMonth(anchor.getMonth() - 1);
      anchor.setDate(day);
    }
    return rollForward(anchor, frequency);
  }

  // Sin historial: próxima ocurrencia del día según frecuencia desde hoy
  const result = new Date(today);
  result.setDate(day);
  if (result < today) {
    result.setMonth(result.getMonth() + 1);
    result.setDate(day);
  }
  return result;
}

function prevOccurrence(nextDue: Date, frequency: PaymentFrequency): Date {
  const d = new Date(nextDue);
  switch (frequency) {
    case "weekly":
      d.setDate(d.getDate() - 7);
      break;
    case "biweekly":
      d.setDate(d.getDate() - 14);
      break;
    case "monthly":
      d.setMonth(d.getMonth() - 1);
      break;
    case "bimonthly":
      d.setMonth(d.getMonth() - 2);
      break;
    case "quarterly":
      d.setMonth(d.getMonth() - 3);
      break;
    case "semiannual":
      d.setMonth(d.getMonth() - 6);
      break;
    case "annual":
      d.setFullYear(d.getFullYear() - 1);
      break;
    default:
      d.setMonth(d.getMonth() - 1);
  }
  return d;
}

function rollForward(date: Date, frequency: PaymentFrequency): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);

  while (d < today) {
    switch (frequency) {
      case "weekly":
        d.setDate(d.getDate() + 7);
        break;
      case "biweekly":
        d.setDate(d.getDate() + 14);
        break;
      case "monthly":
        d.setMonth(d.getMonth() + 1);
        break;
      case "bimonthly":
        d.setMonth(d.getMonth() + 2);
        break;
      case "quarterly":
        d.setMonth(d.getMonth() + 3);
        break;
      case "semiannual":
        d.setMonth(d.getMonth() + 6);
        break;
      case "annual":
        d.setFullYear(d.getFullYear() + 1);
        break;
      default:
        d.setMonth(d.getMonth() + 1);
    }
  }
  return d;
}

export function sortPayments(payments: PaymentWithStatus[]): {
  urgent: PaymentWithStatus[];
  upcoming: PaymentWithStatus[];
  paid: PaymentWithStatus[];
} {
  const urgent: PaymentWithStatus[] = [];
  const upcoming: PaymentWithStatus[] = [];
  const paid: PaymentWithStatus[] = [];

  for (const p of payments) {
    if (p.status === "paid") {
      paid.push(p);
    } else if (
      p.status === "overdue" ||
      (p.days_until_due !== null && p.days_until_due <= 7)
    ) {
      urgent.push(p);
    } else {
      upcoming.push(p);
    }
  }

  const byDays = (a: PaymentWithStatus, b: PaymentWithStatus) => {
    if (a.days_until_due === null) return 1;
    if (b.days_until_due === null) return -1;
    return a.days_until_due - b.days_until_due;
  };

  urgent.sort(byDays);
  upcoming.sort(byDays);

  return { urgent, upcoming, paid };
}
