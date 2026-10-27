import { prisma } from "@/lib/prisma";
import { smsConfig } from "@/lib/sms";
import { formatDateTime } from "@/lib/format";
import SmsActions from "./SmsActions";

const STATUS_STYLE: Record<string, string> = {
  SENT: "bg-blue-50 text-blue-700 border-blue-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  SKIPPED: "bg-secondary text-muted-foreground border-border",
  QUEUED: "bg-amber-50 text-amber-700 border-amber-200",
};

async function loadSmsOverview(days: number) {
  const since = new Date(Date.now() - days * 86_400_000);
  return Promise.all([
    prisma.smsMessage.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
    prisma.smsMessage.groupBy({ by: ["status"], where: { createdAt: { gte: since } }, _count: true }),
    prisma.smsMessage.aggregate({
      where: { createdAt: { gte: since }, status: { in: ["SENT", "DELIVERED"] }, driver: "http" },
      _sum: { segments: true },
    }),
  ]);
}

export default async function AdminSmsPage() {
  const config = smsConfig();
  const [messages, byStatus, segments] = await loadSmsOverview(30);
  const count = (s: string) => byStatus.find((b) => b.status === s)?._count ?? 0;

  const live = config.driver === "http";

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-foreground">SMS Gateway</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Booking, confirmation, cancellation, completion, payment and reminder messages to patients and practitioners.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className={`rounded-2xl p-5 border ${live ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Provider</p>
          <p className="text-lg font-extrabold text-foreground">{live ? "Live (HTTP)" : "Log only"}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {live
              ? config.httpConfigured
                ? `Sender ID: ${config.senderId}`
                : "SMS_HTTP_URL missing!"
              : "Set SMS_DRIVER=http to send real SMS"}
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Credit guard</p>
          <p className="text-lg font-extrabold text-foreground">
            {config.allowlist.length > 0 ? `${config.allowlist.length} allowlisted` : "Open"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Max {config.dailyLimit} SMS / number / day</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Last 30 days</p>
          <p className="text-lg font-extrabold text-foreground">{count("SENT") + count("DELIVERED")} sent</p>
          <p className="text-xs text-muted-foreground mt-1">
            {count("DELIVERED")} delivered · {count("FAILED")} failed · {count("SKIPPED")} skipped
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Credits used</p>
          <p className="text-lg font-extrabold text-foreground">{segments._sum.segments ?? 0} segments</p>
          <p className="text-xs text-muted-foreground mt-1">Real sends only (160 chars each)</p>
        </div>
      </div>

      <div className="mb-8">
        <SmsActions />
      </div>

      <h2 className="text-lg font-bold text-foreground mb-3">Message log</h2>
      {messages.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center text-sm text-muted-foreground">No SMS yet.</div>
      ) : (
        <div className="bg-card border border-border rounded-2xl divide-y divide-border">
          {messages.map((m) => (
            <div key={m.id} className="px-5 py-3 grid md:grid-cols-[150px_120px_1fr_auto] gap-2 md:gap-4 items-start text-sm">
              <div className="text-xs text-muted-foreground">
                {formatDateTime(m.createdAt)}
                <p className="font-mono text-foreground">{m.to}</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-foreground">{m.purpose}</span>
              </div>
              <div className="min-w-0">
                <p className="text-foreground text-xs break-words">{m.body}</p>
                {m.error && <p className="text-xs text-red-600 mt-0.5">{m.error}</p>}
              </div>
              <div className="flex items-center gap-2 md:justify-end">
                <span className="text-[11px] text-muted-foreground">{m.segments} seg · {m.driver}</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[m.status] ?? ""}`}>{m.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
