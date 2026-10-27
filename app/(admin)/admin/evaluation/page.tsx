import { CheckCircle2, XCircle, Info, Download } from "lucide-react";
import { getEvaluationReport } from "@/lib/evaluation";

export const metadata = { title: "Evaluation" };

// Evaluation dashboard for report objective 4 / RQ4: system response time,
// synchronisation accuracy and user satisfaction, measured from live usage.

const RATING_LABELS = ["Very poor", "Poor", "Okay", "Good", "Excellent"];

function ms(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(2)} s` : `${v} ms`;
}

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

export default async function EvaluationPage() {
  const report = await getEvaluationReport(30);
  const { timings, ussd, sms, satisfaction, channels, checks } = report;
  const failing = checks.filter((c) => !c.passed && !c.informational).length;
  const maxBucket = Math.max(1, ...satisfaction.distribution);

  const tiles = [
    { label: "USSD sessions", value: ussd.sessions, sub: `${ussd.bookingSessions} entered booking` },
    { label: "USSD bookings confirmed", value: ussd.bookingsConfirmed, sub: `${ussd.resumed} resumed after a dropped session` },
    { label: "SMS delivery rate", value: pct(sms.deliveryRate), sub: `${sms.segmentsUsed} segments used` },
    {
      label: "Patient satisfaction",
      value: satisfaction.count ? `${satisfaction.average.toFixed(2)} / 5` : "—",
      sub: `${satisfaction.count} rating${satisfaction.count === 1 ? "" : "s"}`,
    },
  ];

  return (
    <div className="max-w-6xl">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Evaluation</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Response time, synchronisation accuracy and satisfaction over the last {report.days} days, measured from live use.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { type: "metrics", label: "Timings CSV" },
            { type: "sms", label: "SMS CSV" },
            { type: "feedback", label: "Ratings CSV" },
          ].map((e) => (
            <a
              key={e.type}
              href={`/api/admin/evaluation/export?type=${e.type}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-secondary text-foreground text-xs font-semibold rounded-lg hover:bg-muted"
            >
              <Download className="w-3.5 h-3.5" /> {e.label}
            </a>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {tiles.map((t) => (
          <div key={t.label} className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">{t.label}</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">{t.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{t.sub}</p>
          </div>
        ))}
      </div>

      {/* Response time */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-foreground mb-1">Response time</h2>
        <p className="text-xs text-muted-foreground mb-3">
          Server-side time per request. USSD gateways typically drop a session if a screen takes longer than a few seconds.
        </p>
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="px-5 py-3 font-semibold">Operation</th>
                <th className="px-3 py-3 font-semibold text-right">Requests</th>
                <th className="px-3 py-3 font-semibold text-right">Average</th>
                <th className="px-3 py-3 font-semibold text-right">Median (p50)</th>
                <th className="px-3 py-3 font-semibold text-right">p95</th>
                <th className="px-3 py-3 font-semibold text-right">Slowest</th>
                <th className="px-5 py-3 font-semibold text-right">Success</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {timings.map((t) => (
                <tr key={t.label}>
                  <td className="px-5 py-3 font-medium text-foreground">{t.label}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{t.count}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{t.count ? ms(t.avg) : "—"}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{t.count ? ms(t.p50) : "—"}</td>
                  <td className="px-3 py-3 text-right tabular-nums font-semibold">{t.count ? ms(t.p95) : "—"}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{t.count ? ms(t.max) : "—"}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{t.count ? pct(t.successRate) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Synchronisation accuracy */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Synchronisation & financial integrity</h2>
            <p className="text-xs text-muted-foreground">
              Web and USSD write to one database; these checks confirm every record and every kwacha agrees.
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
              failing === 0 ? "bg-success-soft text-success-fg border-success-border" : "bg-danger-soft text-danger-fg border-danger-border"
            }`}
          >
            {failing === 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {failing === 0 ? "All checks pass" : `${failing} check(s) failing`}
          </span>
        </div>
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          {checks.map((c) => {
            const state = c.passed ? "pass" : c.informational ? "info" : "fail";
            return (
              <div key={c.name} className="flex items-start gap-3 px-5 py-3">
                {state === "pass" && <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />}
                {state === "fail" && <XCircle className="w-4 h-4 text-danger mt-0.5 shrink-0" />}
                {state === "info" && <Info className="w-4 h-4 text-warning mt-0.5 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.detail}</p>
                </div>
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  {state === "pass" ? "Pass" : state === "fail" ? "Fail" : "Info"}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Satisfaction distribution: single series, so no legend; values in text ink at the bar tips */}
        <section className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="font-bold text-foreground">Ratings by score</h2>
          <p className="text-xs text-muted-foreground mb-4">
            {satisfaction.byChannel.map((c) => `${c.channel}: ${c.count ? c.average.toFixed(2) : "—"} (${c.count})`).join(" · ")}
          </p>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((score) => {
              const n = satisfaction.distribution[score - 1];
              const share = satisfaction.count ? n / satisfaction.count : 0;
              return (
                <div
                  key={score}
                  className="grid grid-cols-[88px_1fr_64px] items-center gap-3 rounded-md hover:bg-secondary/60 px-1 py-0.5"
                  title={`${score} – ${RATING_LABELS[score - 1]}: ${n} rating${n === 1 ? "" : "s"} (${pct(share)})`}
                >
                  <span className="text-xs text-muted-foreground">{score} · {RATING_LABELS[score - 1]}</span>
                  <div className="h-3">
                    {n > 0 && (
                      <div className="h-3 bg-primary rounded-r-[4px]" style={{ width: `${(n / maxBucket) * 100}%` }} />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-foreground tabular-nums text-right">{n}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Channel usage & SMS outcomes as plain figures */}
        <section className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="font-bold text-foreground mb-4">Channel usage</h2>
          <dl className="space-y-2 text-sm">
            {[
              ["Web bookings", channels.WEB ?? 0],
              ["USSD bookings", channels.USSD ?? 0],
              ["USSD sessions abandoned", ussd.abandoned],
              ["SMS sent", (sms.counts.SENT ?? 0) + (sms.counts.DELIVERED ?? 0)],
              ["SMS delivered (confirmed by provider)", sms.counts.DELIVERED ?? 0],
              ["SMS failed", sms.counts.FAILED ?? 0],
              ["SMS skipped (no number / allowlist / limit)", sms.counts.SKIPPED ?? 0],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-semibold text-foreground tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
