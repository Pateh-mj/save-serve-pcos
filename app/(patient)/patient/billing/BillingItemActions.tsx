"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Smartphone, X, ShieldCheck } from "lucide-react";
import { toast } from "@/components/app/Toaster";
import { btnPrimary, btnOutline } from "@/components/app/buttons";

const METHODS = [
  { id: "AIRTEL_MONEY", label: "Airtel Money" },
  { id: "MTN_MOMO", label: "MTN MoMo" },
  { id: "ZAMTEL_KWACHA", label: "Zamtel Kwacha" },
] as const;

/** Pay a bill: choose a mobile-money wallet, confirm, done (collection is simulated, settlement is real). */
export default function BillingItemActions({ billingId, amount }: { billingId: string; amount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<string>(METHODS[0].id);
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingId, paymentMethod: method }),
      });
      if (res.ok) {
        setOpen(false);
        toast.success(`Payment of ZMW ${amount.toFixed(2)} received. A receipt is on its way by SMS.`);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Payment failed. You have not been charged.");
      }
    } catch {
      toast.error("Network problem: payment not completed. You have not been charged.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={`${btnPrimary} h-9`}>
        Pay ZMW {amount.toFixed(2)}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/50 backdrop-blur-sm sm:p-4 animate-in fade-in" role="dialog" aria-modal="true" aria-labelledby="pay-title">
          <div className="bg-card w-full sm:max-w-sm rounded-t-2xl sm:rounded-xl shadow-2xl p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 id="pay-title" className="font-semibold text-foreground">Pay with mobile money</h3>
                <p className="text-sm text-muted-foreground">Amount due: <strong className="text-foreground">ZMW {amount.toFixed(2)}</strong></p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <fieldset className="space-y-2">
              <legend className="sr-only">Wallet</legend>
              {METHODS.map((m) => (
                <label
                  key={m.id}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition ${
                    method === m.id ? "border-primary bg-accent" : "border-border hover:bg-secondary"
                  }`}
                >
                  <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} className="accent-primary" />
                  <Smartphone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{m.label}</span>
                </label>
              ))}
            </fieldset>

            <p className="mt-4 text-xs text-muted-foreground flex gap-1.5">
              <ShieldCheck className="w-4 h-4 text-success shrink-0" />
              Prototype: the wallet prompt is simulated; the bill is settled for real.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button onClick={() => setOpen(false)} className={btnOutline} disabled={loading}>Cancel</button>
              <button onClick={handlePay} className={btnPrimary} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />} Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
