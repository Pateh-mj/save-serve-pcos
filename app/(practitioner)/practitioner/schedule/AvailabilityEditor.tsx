"use client";

import { useState, useTransition } from "react";
import { Save, CheckCircle2 } from "lucide-react";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type DayAvailability = { dayOfWeek: number; startTime: string; endTime: string; isActive: boolean };

export default function AvailabilityEditor({ initial }: { initial: DayAvailability[] }) {
    const [days, setDays] = useState<DayAvailability[]>(initial);
    const [isPending, startTransition] = useTransition();
    const [saved, setSaved] = useState(false);

    function update(dayOfWeek: number, patch: Partial<DayAvailability>) {
        setSaved(false);
        setDays((prev) => prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d)));
    }

    function save() {
        startTransition(async () => {
            const res = await fetch("/api/practitioner/availability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ days }),
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
            }
        });
    }

    return (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-fit">
            <h2 className="text-lg font-bold text-foreground mb-4">Weekly Availability</h2>

            <div className="space-y-3">
                {days.map((d) => (
                    <div key={d.dayOfWeek} className="flex items-center gap-3">
                        <label className="flex items-center gap-2 w-16 shrink-0">
                            <input
                                type="checkbox"
                                checked={d.isActive}
                                onChange={(e) => update(d.dayOfWeek, { isActive: e.target.checked })}
                                className="rounded border-border"
                            />
                            <span className="text-sm font-medium text-foreground">{DAY_LABELS[d.dayOfWeek]}</span>
                        </label>

                        <input
                            type="time"
                            value={d.startTime}
                            disabled={!d.isActive}
                            onChange={(e) => update(d.dayOfWeek, { startTime: e.target.value })}
                            className="text-xs border border-border rounded-lg px-2 py-1 bg-background disabled:opacity-40"
                        />
                        <span className="text-xs text-muted-foreground">to</span>
                        <input
                            type="time"
                            value={d.endTime}
                            disabled={!d.isActive}
                            onChange={(e) => update(d.dayOfWeek, { endTime: e.target.value })}
                            className="text-xs border border-border rounded-lg px-2 py-1 bg-background disabled:opacity-40"
                        />
                    </div>
                ))}
            </div>

            <button
                onClick={save}
                disabled={isPending}
                className="mt-5 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold py-2.5 rounded-xl disabled:opacity-60"
            >
                {saved ? (
                    <>
                        <CheckCircle2 className="w-4 h-4" /> Saved
                    </>
                ) : (
                    <>
                        <Save className="w-4 h-4" /> {isPending ? "Saving…" : "Save Availability"}
                    </>
                )}
            </button>
        </div>
    );
}