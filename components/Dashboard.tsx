"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Payment, PaymentHistory, PaymentWithStatus } from "@/lib/types";
import { computePaymentStatus } from "@/lib/payments";
import { PaymentCard } from "./PaymentCard";
import { PaymentSummaryDialog } from "./PaymentSummaryDialog";
import { PaymentSheet } from "./PaymentSheet";
import { Landing } from "./Landing";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Plus, LogOut, Heart, Loader2, BarChart3 } from "lucide-react";
import type { User } from "@supabase/supabase-js";

type PaymentFormData = Omit<Payment, "id" | "user_id" | "created_at" | "updated_at">;

export function Dashboard() {
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const [payments, setPayments] = useState<PaymentWithStatus[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryHistory, setSummaryHistory] = useState<PaymentHistory[]>([]);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  // ── Auth ──────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setPayments([]);
      } else {
        setLoginOpen(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function handleGoogleSignIn() {
    setSigningIn(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback`,
      },
    });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  // ── Payments ──────────────────────────────────────────
  const fetchPayments = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && data) {
      setPayments((data as Payment[]).map(computePaymentStatus));
    }
    setDataLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    if (!user) return;
    queueMicrotask(() => {
      void fetchPayments();
    });
  }, [user, fetchPayments]);

  async function handleSave(formData: PaymentFormData, id?: string) {
    if (id) {
      await supabase
        .from("payments")
        .update({ ...formData, updated_at: new Date().toISOString() })
        .eq("id", id);
    } else {
      await supabase.from("payments").insert({ ...formData, user_id: user!.id });
    }
    await fetchPayments();
  }

  async function handleMarkPaid(id: string, amount: number | null) {
    const today = new Date().toISOString().split("T")[0];
    await supabase
      .from("payments")
      .update({
        last_paid_date: today,
        last_paid_amount: amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    await supabase.from("payment_history").insert({
      payment_id: id,
      user_id: user!.id,
      paid_date: today,
      amount,
    });

    await fetchPayments();
  }

  async function handleLoadHistory(id: string): Promise<PaymentHistory[]> {
    const { data, error } = await supabase
      .from("payment_history")
      .select("*")
      .eq("payment_id", id)
      .order("paid_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as PaymentHistory[];
  }

  async function handleOpenSummary() {
    setSummaryOpen(true);
    setSummaryLoading(true);
    const { data, error } = await supabase
      .from("payment_history")
      .select("*")
      .order("paid_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (!error && data) {
      setSummaryHistory(data as PaymentHistory[]);
    }
    setSummaryLoading(false);
  }

  async function handleAddHistory(
    payment: PaymentWithStatus,
    paidDate: string,
    amount: number | null
  ): Promise<PaymentHistory[]> {
    await supabase.from("payment_history").insert({
      payment_id: payment.id,
      user_id: user!.id,
      paid_date: paidDate,
      amount,
    });

    if (!payment.last_paid_date || paidDate >= payment.last_paid_date) {
      await supabase
        .from("payments")
        .update({
          last_paid_date: paidDate,
          last_paid_amount: amount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);
      await fetchPayments();
    }

    return handleLoadHistory(payment.id);
  }

  async function handleUndoPaid(payment: PaymentWithStatus) {
    const { data } = await supabase
      .from("payment_history")
      .select("*")
      .eq("payment_id", payment.id)
      .order("paid_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(2);

    const history = (data ?? []) as PaymentHistory[];
    const latest = history[0];
    const previous = history[1];

    if (latest) {
      await supabase.from("payment_history").delete().eq("id", latest.id);
    }

    await supabase
      .from("payments")
      .update({
        last_paid_date: previous?.paid_date ?? null,
        last_paid_amount: previous?.amount ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    await fetchPayments();
  }

  async function handleTogglePaused(id: string, isPaused: boolean) {
    await supabase
      .from("payments")
      .update({ is_paused: !isPaused, updated_at: new Date().toISOString() })
      .eq("id", id);
    await fetchPayments();
  }

  async function handleDelete(id: string) {
    await supabase.from("payments").delete().eq("id", id);
    await fetchPayments();
  }

  function handleEdit(payment: PaymentWithStatus) {
    setEditingPayment(payment);
    setSheetOpen(true);
  }

  function handleAdd() {
    setEditingPayment(null);
    setSheetOpen(true);
  }

  const activePayments = payments
    .filter((p) => p.status !== "paused")
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  const pausedPayments = payments
    .filter((p) => p.status === "paused")
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  // ── Render ────────────────────────────────────────────
  if (!authLoading && !user) {
    return (
      <>
        <Landing onSignIn={handleGoogleSignIn} signingIn={signingIn} />
        <Dialog open={loginOpen} onOpenChange={(open) => !signingIn && setLoginOpen(open)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader className="items-center text-center space-y-3">
              <div className="text-4xl leading-none">🔔</div>
              <div>
                <DialogTitle className="text-lg">No se te pase</DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  Todos tus pagos en un solo lugar. Inicia sesión para continuar.
                </DialogDescription>
              </div>
            </DialogHeader>
            <Button
              className="w-full gap-3 mt-2"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={signingIn}
            >
              {signingIn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              {signingIn ? "Redirigiendo…" : "Continuar con Google"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Solo tú puedes ver tus pagos.
            </p>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-white/40 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none">🔔</span>
            <span className="font-semibold text-sm">No se te pase</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenSummary}
              className="text-muted-foreground hover:text-foreground gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">Resumen</span>
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <a
              href="https://paypal.me/apodacaduron"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground hover:text-foreground gap-1.5")}
            >
              <Heart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">Donar</span>
            </a>
            <Separator orientation="vertical" className="h-5" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="max-w-5xl mx-auto px-4 py-6 pb-24 space-y-6">
        {authLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : user && dataLoading && payments.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : payments.length === 0 && user ? (
          /* Logged in, empty */
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-5">
            <div className="text-5xl">🧾</div>
            <div className="space-y-1.5">
              <p className="font-semibold text-base">Todo tranquilo por aquí</p>
              <p className="text-sm text-muted-foreground max-w-[26ch] mx-auto leading-relaxed">
                Agrega tus tarjetas, servicios y suscripciones para tener claro qué cosas pagas.
              </p>
            </div>
            <Button onClick={handleAdd} className="gap-2 rounded-xl">
              <Plus className="w-4 h-4" />
              Agregar recordatorio
            </Button>
            <div className="pt-2 space-y-1.5 text-xs text-muted-foreground">
              <p className="font-medium text-foreground/60">Por ejemplo:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {["💳 BBVA", "💡 CFE", "💧 Agua", "🏥 Seguro", "📱 Netflix"].map((s) => (
                  <span key={s} className="bg-muted px-2.5 py-1 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Cosas que pago
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activePayments.length} recordatorio{activePayments.length === 1 ? "" : "s"}
                  </p>
                </div>
                <Button onClick={handleAdd} size="sm" className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Agregar
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {activePayments.map((p) => (
                  <PaymentCard
                    key={p.id}
                    payment={p}
                    onEdit={handleEdit}
                    onMarkPaid={handleMarkPaid}
                    onLoadHistory={handleLoadHistory}
                    onAddHistory={handleAddHistory}
                    onUndoPaid={handleUndoPaid}
                    onTogglePaused={handleTogglePaused}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>

            {pausedPayments.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Pausados
                  </p>
                  <span className="text-xs font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full leading-none">
                    {pausedPayments.length}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {pausedPayments.map((p) => (
                    <PaymentCard
                      key={p.id}
                      payment={p}
                      onEdit={handleEdit}
                      onMarkPaid={handleMarkPaid}
                      onLoadHistory={handleLoadHistory}
                      onAddHistory={handleAddHistory}
                      onUndoPaid={handleUndoPaid}
                      onTogglePaused={handleTogglePaused}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* ── FAB ── */}
      {user && (
        <div className="fixed bottom-6 right-4 z-40">
          <Button
            className="h-12 rounded-full shadow-lg px-5 gap-2 text-sm font-medium"
            onClick={handleAdd}
          >
            <Plus className="w-5 h-5" />
            Agregar recordatorio
          </Button>
        </div>
      )}

      {/* ── Login Dialog ── */}
      <Dialog open={loginOpen} onOpenChange={(open) => !signingIn && setLoginOpen(open)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="items-center text-center space-y-3">
            <div className="text-4xl leading-none">🔔</div>
            <div>
              <DialogTitle className="text-lg">No se te pase</DialogTitle>
              <DialogDescription className="text-sm mt-1">
                Todos tus pagos en un solo lugar. Inicia sesión para continuar.
              </DialogDescription>
            </div>
          </DialogHeader>

          <Button
            className="w-full gap-3 mt-2"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={signingIn}
          >
            {signingIn ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {signingIn ? "Redirigiendo…" : "Continuar con Google"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Solo tú puedes ver tus pagos.
          </p>
        </DialogContent>
      </Dialog>

      {/* ── Payment Sheet ── */}
      <PaymentSheet
        open={sheetOpen}
        payment={editingPayment}
        onClose={() => setSheetOpen(false)}
        onSave={handleSave}
      />
      <PaymentSummaryDialog
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        history={summaryHistory}
        payments={payments}
        loading={summaryLoading}
      />
    </div>
  );
}
