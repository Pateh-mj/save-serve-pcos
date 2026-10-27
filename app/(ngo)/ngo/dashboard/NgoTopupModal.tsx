"use client";
import { toast } from "@/components/app/Toaster";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, CreditCard, X } from "lucide-react";
import { btnPrimary, btnOutline, inputCls, labelCls } from "@/components/app/buttons";

export default function NgoTopupModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("1000");
  const [loading, setLoading] = useState(false);

  async function handleTopup(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/ngo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: num }),
      });

      if (res.ok) {
        setOpen(false);
        toast.success(`ZMW ${num.toFixed(2)} added to the pool. Thank you for funding care.`);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Top-up failed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error processing top-up.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={btnPrimary}
      >
        <Plus className="w-4 h-4" /> Top up pool
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Top up the equity pool</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTopup} className="space-y-4">
              <div>
                <label className={labelCls}>
                  Amount (ZMW)
                </label>
                <input
                  type="number"
                  min="50"
                  step="50"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {["500", "1000", "2500", "5000"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(v)}
                    className={`h-8 px-3 rounded-lg border text-xs font-semibold transition ${amount === v ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card text-foreground hover:bg-secondary"}`}
                  >
                    ZMW {Number(v).toLocaleString()}
                  </button>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                Funds will be deposited directly into the active health equity pool to sponsor free consultations for low-resource patients.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className={btnOutline}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={btnPrimary}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm top-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
