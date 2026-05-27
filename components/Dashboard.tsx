"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Payment, PaymentWithStatus } from "@/lib/types";
import { computePaymentStatus, sortPayments } from "@/lib/payments";
import { PaymentCard } from "./PaymentCard";
import { PaymentSheet } from "./PaymentSheet";
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
import { Plus, LogOut, Heart, Inbox, Loader2 } from "lucide-react";
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
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  // ── Auth ──────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthLoading(false);
      if (!data.user) setLoginOpen(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setLoginOpen(true);
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
        redirectTo: `${window.location.origin}/auth/callback`,
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
    if (user) fetchPayments();
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

  async function handleMarkPaid(id: string) {
    const today = new Date().toISOString().split("T")[0];
    await supabase
      .from("payments")
      .update({ last_paid_date: today, updated_at: new Date().toISOString() })
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

  const { urgent, upcoming, paid } = sortPayments(payments);
  const overdueCount = payments.filter((p) => p.status === "overdue").length;

  // ── Render ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none">🔔</span>
            <span className="font-semibold text-sm">No se te pase</span>
            {overdueCount > 0 && (
              <span className="bg-destructive text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                {overdueCount}
              </span>
            )}
          </div>

          {/* Actions */}
          {user ? (
            <div className="flex items-center gap-1">
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
          ) : (
            <Button size="sm" onClick={() => setLoginOpen(true)} disabled={authLoading}>
              Iniciar sesión
            </Button>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
        {authLoading || (user && dataLoading && payments.length === 0) ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !user ? (
          /* Not logged in */
          <div className="text-center py-20 space-y-4">
            <div className="text-5xl leading-none">🔔</div>
            <div className="space-y-1">
              <p className="font-semibold">Todos tus pagos en un lugar</p>
              <p className="text-sm text-muted-foreground">
                Tarjetas, servicios, seguros y más. Nunca olvides un pago.
              </p>
            </div>
            <Button onClick={() => setLoginOpen(true)}>
              Iniciar sesión con Google
            </Button>
          </div>
        ) : payments.length === 0 ? (
          /* Logged in, empty */
          <div className="text-center py-20 space-y-3">
            <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto">
              <Inbox className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-semibold">Sin pagos registrados</p>
            <p className="text-sm text-muted-foreground">
              Toca el botón <strong>+</strong> para agregar tu primera tarjeta o servicio.
            </p>
          </div>
        ) : (
          <>
            {urgent.length > 0 && (
              <section className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  Atención requerida
                  <span className="bg-destructive text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none normal-case tracking-normal">
                    {urgent.length}
                  </span>
                </p>
                <div className="space-y-2">
                  {urgent.map((p) => (
                    <PaymentCard
                      key={p.id}
                      payment={p}
                      onEdit={handleEdit}
                      onMarkPaid={handleMarkPaid}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </section>
            )}

            {upcoming.length > 0 && (
              <section className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Próximos pagos
                </p>
                <div className="space-y-2">
                  {upcoming.map((p) => (
                    <PaymentCard
                      key={p.id}
                      payment={p}
                      onEdit={handleEdit}
                      onMarkPaid={handleMarkPaid}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </section>
            )}

            {paid.length > 0 && (
              <section className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Pagados este ciclo
                </p>
                <div className="space-y-2">
                  {paid.map((p) => (
                    <PaymentCard
                      key={p.id}
                      payment={p}
                      onEdit={handleEdit}
                      onMarkPaid={handleMarkPaid}
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
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            size="icon"
            className="w-14 h-14 rounded-full shadow-lg"
            onClick={handleAdd}
          >
            <Plus className="w-6 h-6" />
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
    </div>
  );
}
