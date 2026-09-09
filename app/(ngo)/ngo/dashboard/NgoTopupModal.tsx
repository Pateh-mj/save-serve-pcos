"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, CreditCard, X } from "lucide-react";

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
        router.refresh();
      } else {
        alert("Top-up failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error processing top-up.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:opacity-90 flex items-center gap-1.5 transition shadow-sm"
      >
        <Plus className="w-4 h-4" /> Top-Up Subsidy Fund
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground text-base">Top Up Subsidy Pool</h3>
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
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                  Top-up Amount (ZMW)
                </label>
                <input
                  type="number"
                  min="50"
                  step="50"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
              </div>

              <div className="flex items-center gap-2">
                {["500", "1000", "2500", "5000"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(v)}
                    className="px-2.5 py-1 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-muted"
                  >
                    +ZMW {v}
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
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:opacity-90 disabled:opacity-60 flex items-center gap-2 shadow-sm"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
