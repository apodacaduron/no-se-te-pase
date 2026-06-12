"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const MOCK_PAYMENTS = [
  {
    id: 1,
    name: "BBVA Azul",
    category: "Tarjeta",
    latest: "Último pago: 28 may",
    dot: "bg-emerald-500",
    badge: "bg-violet-100 text-violet-700",
    amount: "$3,200",
  },
  {
    id: 2,
    name: "CFE",
    category: "Bimestral",
    latest: "Sin pagos registrados",
    dot: "bg-slate-300",
    badge: "bg-cyan-100 text-cyan-700",
    amount: "$680",
  },
  {
    id: 3,
    name: "Seguro de auto",
    category: "Anual",
    latest: "Último pago: 12 jul",
    dot: "bg-emerald-500",
    badge: "bg-blue-100 text-blue-700",
    amount: "$8,400",
  },
  {
    id: 4,
    name: "JMAS Agua",
    category: "Bimestral",
    latest: "Último pago: 3 jun",
    dot: "bg-emerald-500",
    badge: "bg-cyan-100 text-cyan-700",
    amount: "$180",
  },
];

const FEATURES = [
  { emoji: "🧾", text: "Ten claro qué cosas pagas" },
  { emoji: "✅", text: "Registra cada pago cuando lo hagas" },
  { emoji: "📚", text: "Consulta el historial de cada cosa" },
];

interface LandingProps {
  onSignIn: () => void;
  signingIn: boolean;
}

export function Landing({ onSignIn, signingIn }: LandingProps) {
  const [visible, setVisible] = useState(false);
  const [visibleCards, setVisibleCards] = useState(0);
  const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Una vez que la UI aparece, pushea cards una a una, luego resetea y repite
  useEffect(() => {
    if (!visible) return;

    function pushNext(count: number) {
      setVisibleCards(count);
      if (count < MOCK_PAYMENTS.length) {
        cycleRef.current = setTimeout(() => pushNext(count + 1), 500);
      } else {
        // Pausa al final, luego resetea y vuelve a empezar
        cycleRef.current = setTimeout(() => {
          setVisibleCards(0);
          cycleRef.current = setTimeout(() => pushNext(1), 400);
        }, 3000);
      }
    }

    cycleRef.current = setTimeout(() => pushNext(1), 600);
    return () => { if (cycleRef.current) clearTimeout(cycleRef.current); };
  }, [visible]);

  return (
    <div className="h-screen flex flex-col items-center justify-center px-6 gap-6 overflow-hidden">

      {/* Hero */}
      <div
        className={`flex flex-col items-center text-center gap-1 transition-all duration-500 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >
        <div className="text-4xl mb-2">🔔</div>
        <h1 className="text-2xl font-bold tracking-tight">No se te pase</h1>
        <p className="text-muted-foreground text-sm max-w-[26ch] leading-relaxed">
          Recuerda qué cosas pagas y cuándo fue la última vez.
        </p>
      </div>

      {/* Mock */}
      <div
        className={`w-full max-w-75 transition-all duration-500 delay-100 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >
        <div className="rounded-2xl border bg-card shadow-md overflow-hidden">
          {/* Fake header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b bg-background/60">
            <div className="flex items-center gap-1.5">
              <span className="text-sm leading-none">🔔</span>
              <span className="text-sm font-semibold">No se te pase</span>
            </div>
            <div className="w-10 h-3 rounded-full bg-muted animate-pulse" />
          </div>

          {/* Section label */}
          <div className="px-3 pt-3 pb-1 flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Cosas que pago
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">4 recordatorios</p>
            </div>
            <div className="h-6 px-2 rounded-lg bg-primary text-primary-foreground text-[11px] font-medium flex items-center">
              Agregar
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-2 gap-1.5 px-2.5 pb-3 min-h-38">
            {MOCK_PAYMENTS.map((p, i) => {
              const show = i < visibleCards;
              return (
                <div
                  key={p.id}
                  className="rounded-xl border bg-card px-2.5 py-2 min-h-23"
                  style={{
                    transition: "opacity 0.35s, transform 0.35s",
                    opacity: show ? 1 : 0,
                    transform: show ? "translateY(0) scale(1)" : "translateY(8px) scale(0.98)",
                    pointerEvents: show ? "auto" : "none",
                  }}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.dot}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{p.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${p.badge}`}>
                          {p.category}
                        </span>
                        <span className="text-xs font-semibold text-foreground/60">{p.amount}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] leading-snug text-muted-foreground mt-2">
                    {p.latest}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="h-5 px-1.5 rounded-md border text-[10px] font-medium flex items-center">
                      Historial
                    </span>
                    <span className="h-5 px-1.5 rounded-md bg-primary text-primary-foreground text-[10px] font-medium flex items-center">
                      Pago
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Features */}
      <div
        className={`flex flex-col gap-2 transition-all duration-500 delay-200 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >
        {FEATURES.map((f) => (
          <div key={f.text} className="flex items-center gap-2.5">
            <span className="text-base leading-none">{f.emoji}</span>
            <span className="text-sm text-muted-foreground">{f.text}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div
        className={`flex flex-col items-center gap-2 transition-all duration-500 delay-300 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >
        <Button
          onClick={onSignIn}
          disabled={signingIn}
          className="gap-2.5 px-6 h-10 rounded-xl text-sm font-medium shadow-sm"
        >
          {signingIn ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {signingIn ? "Redirigiendo…" : "Entrar con Google"}
        </Button>
        <p className="text-xs text-muted-foreground">Gratis · Solo tú ves tus datos</p>
        <a
          href="https://paypal.me/apodacaduron"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors mt-1"
        >
          Invítame un café ☕
        </a>
      </div>

    </div>
  );
}
