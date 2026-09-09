"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function BillingItemActions({ billingId, amount }: { billingId: string; amount: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingId, paymentMethod: "AIRTEL_MONEY" }),
      });

      if (res.ok) {
        setPaid(true);
        router.refresh();
      } else {
        alert("Payment processing failed.");
      }
    } catch (e) {
      console.error(e);
      alert("Error initiating payment.");
    } finally {
      setLoading(false);
    }
  }

  if (paid) {
    return (
      <span className="text-xs text-primary font-semibold flex items-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5" /> Settled
      </span>
    );
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 flex items-center gap-1.5 transition"
    >
      {loading && <Loader2 className="w-3 h-3 animate-spin" />}
      Pay ZMW {amount.toFixed(2)}
    </button>
  );
}
