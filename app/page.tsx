import Navbar from "@/components/Navbar";
import UssdSimulatorModal from "@/components/UssdSimulatorModal";
import Link from "next/link";
import {
  PhoneCall, Globe, ShieldCheck, Stethoscope, FileText, MessageSquare,
  CheckCircle2, ArrowRight, Wifi, WifiOff, AlertTriangle, Activity,
  TrendingUp, Heart, ChevronRight, Users, Database, HandCoins,
} from "lucide-react";
import {
  GUIDING_PRINCIPLES, PROBLEMS, PROJECT_LINE, RESEARCH, THEORIES, USSD_PROTOTYPE_NOTE,
} from "@/lib/research";

const PROBLEM_ICONS = [WifiOff, FileText, AlertTriangle];
const PROBLEM_COLORS = ["text-danger bg-danger-soft", "text-info bg-info-soft", "text-warning bg-warning-soft"];

const features = [
  {
    icon: PhoneCall,
    title: "USSD + PWA Dual Channel",
    body: "Patients book from any feature phone over ordinary GSM — no internet or data bundle needed. Smartphone users and staff get an installable Progressive Web App.",
  },
  {
    icon: Activity,
    title: "Symptom-Based Triage",
    body: "Patients describe their symptoms when booking, on web or USSD. Danger signs trigger emergency advice, and the practitioner's queue puts the most urgent patients first.",
  },
  {
    icon: ShieldCheck,
    title: "Policy Guardian Engine",
    body: "Automated middleware that evaluates each patient's tier and applies billing policies and cross-subsidization rules in real time, for every booking on every channel.",
  },
  {
    icon: TrendingUp,
    title: "Robin Hood Cross-Subsidization",
    body: "Premium-tier revenue above the standard tariff funds subsidised visits for community-tier patients. Every movement of the fund is recorded in an auditable ledger.",
  },
  {
    icon: Database,
    title: "Real-Time Synchronisation",
    body: "USSD and web write to one central database as each interaction happens — one patient record, one appointment list, one billing history, whichever channel was used.",
  },
  {
    icon: MessageSquare,
    title: "SMS Notifications",
    body: "Booking confirmations, cancellations, completed-visit notices, payment receipts and reminders reach any phone by SMS.",
  },
];

// Mirrors the real USSD menus (lib/ussd.ts)
const ussdSteps = [
  { step: "1", screen: "SaveServe *384#\n1. Book a visit\n2. My appointments\n3. Health records\n4. Bills & payment\n5. Rate last visit\n6. Health tips &\n   emergency" },
  { step: "2", screen: "Main problem?\n1. Fever\n2. Cough/cold\n3. Diarrhoea/vomiting\n4. Pain/headache\n5. Pregnancy\n6. Injury/wound\n7. Skin/rash\n8. Medicine/other" },
  { step: "3", screen: "Choose a practitioner:\n1. Sr. Mutale Banda\n2. Sr. Natasha Tembo" },
  { step: "4", screen: "Confirm visit:\nSr. Mutale Banda\nFri, 30 Oct 10:00\nFee: ZMW 0.00\n(100% NGO subsidy)\nPriority: ROUTINE\n1. Confirm\n2. Cancel" },
  { step: "5", screen: "Booked! Ref 7K2Q9M.\nSr. Mutale Banda,\nFri, 30 Oct 10:00.\nAn SMS confirmation\nwill follow." },
];

export default function Home() {
  return (
    <div className="font-sans bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-card overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, #16a34a 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />
        <div className="container mx-auto px-6 py-6 md:py-12 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent border border-primary/20 text-xs font-semibold text-primary mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {PROJECT_LINE}
            </div>
            <h1 className="text-3xl md:text-6xl font-extrabold text-foreground leading-tight mb-6">
              <span className="text-primary">PCOS:</span> Healthcare Access for{" "}
              <span className="relative">Every Patient<span className="absolute -bottom-1 left-0 right-0 h-1 bg-primary/30 rounded-full" /></span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4 max-w-lg">
              A multi-channel Patient-Centric Orchestration System that connects patients with their clinic&apos;s healthcare
              practitioners — through a web app or a USSD menu on any feature phone — regardless of internet access or income.
            </p>
            <p className="text-sm text-muted-foreground mb-10 max-w-lg">
              The <strong className="text-foreground">Policy Guardian</strong> applies the{" "}
              <strong className="text-foreground">Robin Hood</strong> cross-subsidization model automatically: premium-tier
              revenue funds subsidised care for community-tier patients.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-primary/25">
                Register as a Patient <ArrowRight className="w-4 h-4" />
              </Link>
              <UssdSimulatorModal />
            </div>
          </div>

          <div className="relative hidden md:flex flex-col items-center gap-4">
            <div className="w-full max-w-xl bg-card border border-border rounded-lg shadow-xl p-6">
              <p className="text-sm font-medium text-muted-foreground mb-4">Two Channels. One System.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col items-center p-4 rounded-lg bg-accent border border-primary/20 text-center">
                  <Globe className="w-8 h-8 text-primary mb-2" strokeWidth={1.5} />
                  <p className="text-sm font-bold text-foreground">Web PWA</p>
                  <p className="text-xs text-muted-foreground mt-1">Smartphone patients &amp; healthcare staff</p>
                </div>
                <div className="flex flex-col items-center p-4 rounded-lg bg-secondary border border-border text-center">
                  <PhoneCall className="w-8 h-8 text-primary mb-2" strokeWidth={1.5} />
                  <p className="text-sm font-bold text-foreground">USSD *384#</p>
                  <p className="text-xs text-muted-foreground mt-1">Feature-phone patients</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Central records · Policy Guardian · Robin Hood billing
              </div>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Wifi className="w-4 h-4 text-primary" /> Web access</span>
              <span className="flex items-center gap-1"><WifiOff className="w-4 h-4 text-primary" /> No internet needed on USSD</span>
            </div>
          </div>
        </div>
      </section>

      {/* Robin Hood banner */}
      <section className="bg-primary py-10">
        <div className="container mx-auto px-6 text-center text-white flex flex-wrap justify-center gap-3 items-center">
          <Heart className="w-5 h-5 text-white/70" />
          <span className="font-bold text-lg">The Robin Hood Model</span>
          <span className="text-white/60">—</span>
          <span className="text-white/80 text-sm max-w-xl">Premium-tier revenue funds subsidised community-tier care. Equity as software logic, not manual administration.</span>
        </div>
      </section>

      {/* Problem */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Problem Statement</p>
            <h2 className="text-2xl font-extrabold text-foreground">The Access and Equity Gap</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              In a fair healthcare system, every patient should be able to book an appointment, see a practitioner and be treated on time —
              whatever their income, the phone they own, or where they live. That is not what is happening in Zambia today.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PROBLEMS.map((p, i) => {
              const Icon = PROBLEM_ICONS[i];
              return (
                <div key={p.title} className="bg-card border border-border rounded-lg p-7 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-5 ${PROBLEM_COLORS[i]}`}>
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <h3 className="font-bold text-foreground mb-3 leading-snug">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
                  <p className="text-xs text-muted-foreground/80 mt-3 italic">({p.citation})</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-6 bg-accent/30">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">The Solution</p>
              <h2 className="text-2xl font-extrabold text-foreground leading-tight mb-6">One System.<br />Two Access Channels.</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                PCOS integrates a low-bandwidth USSD gateway with a feature-rich web platform, connected by the automated Policy Guardian
                middleware — real-time synchronisation between feature phones and central patient records, with cross-subsidization
                enforced automatically.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Reaches patients on any GSM phone — smartphone or feature phone",
                  "Policy Guardian enforces billing and cross-subsidy rules in real time",
                  "USSD interactions are written to the central record as they happen",
                  "Symptom-based triage puts the most urgent patients first",
                  "Practitioners and administrators work from a web dashboard",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />{item}
                  </li>
                ))}
              </ul>
              <Link href="/about" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:gap-2 transition-all">
                Read about the research <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {[
                { icon: Globe, label: "Web PWA — Patients & Staff", badge: "Installable", badgeCls: "bg-primary/10 text-primary", desc: "Booking with triage, health records and billing for patients; the practitioner command centre and administration for staff." },
                { icon: PhoneCall, label: "USSD Channel (*384#)", badge: "No internet needed", badgeCls: "bg-secondary text-muted-foreground", desc: "Menu-driven booking, records, bills and payment over ordinary GSM, with SMS confirmations." },
                { icon: ShieldCheck, label: "Policy Guardian + Central Database", badge: "Both channels", badgeCls: "bg-primary/10 text-primary", desc: "Both channels write to one central database, and the Policy Guardian applies the same billing policy to every transaction." },
              ].map((item) => (
                <div key={item.label} className="bg-card border border-border rounded-lg p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <item.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                    <span className="font-semibold text-foreground text-sm">{item.label}</span>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${item.badgeCls}`}>{item.badge}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-8 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">System Features</p>
            <h2 className="text-2xl font-extrabold text-foreground">Built Around the Patient Journey</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-card border border-border rounded-lg p-7 hover:border-primary/30 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mb-5">
                  <f.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Robin Hood Detail */}
      <section className="py-14 bg-secondary">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-5">
                <Heart className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Robin Hood Subsidization Model</p>
              <h2 className="text-2xl font-extrabold text-foreground mb-5">Equity Built Into the Software</h2>
              <p className="text-muted-foreground leading-relaxed mb-5">
                Facilities usually handle fee waivers by hand — a process prone to error and delay. PCOS embeds the equity policy
                directly in the Policy Guardian, so it is applied consistently at every point of service.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                When a premium-tier patient pays, the amount above the standard tariff is credited to the community health equity fund.
                The Policy Guardian draws on that fund to cover visits for free-tier patients — no manual intervention.
              </p>
              <ul className="space-y-2">
                {[
                  "Premium surplus funds community-tier care",
                  "Subsidy eligibility calculated at booking time",
                  "Every fund movement recorded in an auditable ledger",
                  "Administrators monitor equity metrics in real time",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-foreground text-xl mb-4">How the Policy Guardian Processes a Booking</h3>
              {[
                { n: "1", title: "Patient books via web or USSD", desc: "The request reaches the Policy Guardian, whichever channel it came from." },
                { n: "2", title: "Tier classification evaluated", desc: "Free (community), Basic (standard) or Premium — classified by administrators." },
                { n: "3", title: "Billing calculated automatically", desc: "Free-tier visits are funded from the equity fund; Premium pays above the standard tariff, and the surplus refills the fund." },
                { n: "4", title: "Appointment confirmed + record updated", desc: "Booking saved to the central record and an SMS confirmation sent." },
              ].map((item) => (
                <div key={item.n} className="flex gap-4 items-start bg-card border border-border rounded-lg p-5 shadow-sm">
                  <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">{item.n}</div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* USSD flow */}
      <section id="ussd" className="py-14 bg-foreground">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">USSD Channel</p>
            <h2 className="text-2xl font-extrabold text-white">No Internet? Dial *384#</h2>
            <p className="mt-4 text-white/60 max-w-xl mx-auto">
              A patient with a basic feature phone can describe their symptoms, book a practitioner and see the fee before confirming —
              in a few short menus.
            </p>
            <p className="mt-2 text-white/40 text-xs max-w-xl mx-auto">{USSD_PROTOTYPE_NOTE}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {ussdSteps.map((s, i) => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-60 bg-amber-950/90 border-2 border-amber-700 rounded-lg p-4 shadow-xl">
                    <div className="bg-amber-400/20 rounded-lg p-2 mb-3">
                      <div className="text-center text-[10px] text-amber-400 font-bold">USSD *384#</div>
                    </div>
                    <pre className="text-[11px] text-amber-300 font-mono leading-relaxed whitespace-pre-wrap">{s.screen}</pre>
                  </div>
                  <div className="mt-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">{s.step}</div>
                </div>
                {i < ussdSteps.length - 1 && <ArrowRight className="w-5 h-5 text-white/30 mt-14 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-14 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">System Users</p>
            <h2 className="text-2xl font-extrabold text-foreground">Built for Patients and Healthcare Staff</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Users, label: "Patients", color: "bg-info-soft text-info",
                points: [
                  "Book on the web or by USSD — no internet needed on USSD",
                  "Symptom triage when booking",
                  "Health records and visit history",
                  "Automatic subsidies for community-tier patients",
                  "See the fee before confirming; SMS confirmations",
                ],
                href: "/patients", cta: "For Patients",
              },
              {
                icon: Stethoscope, label: "Healthcare Staff", color: "bg-success-soft text-primary",
                points: [
                  "Practitioner command centre with a triage-ordered queue",
                  "Weekly availability and schedule",
                  "Diagnoses, prescriptions and follow-ups in the EHR",
                  "Administrators classify tiers and set billing policy",
                  "Evaluation: response times, sync checks, satisfaction",
                ],
                href: "/login", cta: "Staff Login",
              },
              {
                icon: HandCoins, label: "Funding Partners", color: "bg-premium-soft text-premium",
                points: [
                  "Top up the community health equity fund",
                  "See every subsidised visit the fund paid for",
                  "Full ledger that reconciles to the kwacha",
                  "Monthly impact report",
                ],
                href: "/ngos", cta: "For Partners",
              },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-lg p-8 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-5 ${item.color}`}>
                  <item.icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">{item.label}</h3>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {item.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />{p}
                    </li>
                  ))}
                </ul>
                <Link href={item.href} className="flex items-center gap-1 text-sm font-semibold text-primary hover:gap-2 transition-all">
                  {item.cta} <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Theoretical Foundation (report §2.3.3 and §1.12.1) */}
      <section className="py-12 bg-accent/30">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Theoretical Framework</p>
            <h2 className="text-2xl font-extrabold text-foreground">Grounded in Established Research</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {THEORIES.map((t) => (
              <div key={t.title} className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <div className="flex items-start gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <h3 className="font-bold text-foreground text-sm">{t.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3 ml-6">{t.citation}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{t.body}</p>
                <p className="text-sm text-foreground leading-relaxed"><strong>In PCOS:</strong> {t.inPcos}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-6 max-w-3xl mx-auto">
            Guided by {GUIDING_PRINCIPLES.title.toLowerCase()} ({GUIDING_PRINCIPLES.citation}): {GUIDING_PRINCIPLES.body}
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-primary">
        <div className="container mx-auto px-6 text-center text-white">
          <h2 className="text-2xl font-extrabold mb-4">Healthcare Access on Any Phone</h2>
          <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
            Register online with a smartphone, or use the USSD menu from a basic phone — the system meets patients where they are.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="px-8 py-3.5 bg-card text-primary font-semibold rounded-lg hover:bg-white/90 transition-colors">Register as a Patient</Link>
            <Link href="/about" className="px-8 py-3.5 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors">About This Research</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-8">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-primary font-extrabold text-xl">PCOS</span>
                <span className="text-white/40 font-light text-sm">{RESEARCH.prototypeName}</span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed max-w-xs">
                {RESEARCH.title}. A final year project for the degree of {RESEARCH.degree} — {RESEARCH.school},{" "}
                {RESEARCH.university} ({RESEARCH.universityShort}).
              </p>
              <p className="text-xs text-white/30 mt-3">By {RESEARCH.author} · Advisor: {RESEARCH.advisor} · {RESEARCH.year}</p>
            </div>
            {[
              { heading: "System", links: [{ label: "For Patients", href: "/patients" }, { label: "For Funding Partners", href: "/ngos" }, { label: "USSD Simulator", href: "/ussd" }, { label: "Register", href: "/register" }] },
              { heading: "Project", links: [{ label: "About PCOS", href: "/about" }, { label: "Contact", href: "/contact" }, { label: "Sign In", href: "/login" }] },
            ].map((col) => (
              <div key={col.heading}>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">{col.heading}</p>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l.label}><Link href={l.href} className="text-sm text-white/50 hover:text-white transition-colors">{l.label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-white/30">
            <p>© {RESEARCH.year} {RESEARCH.author} · {RESEARCH.university} ({RESEARCH.universityShort}) · {RESEARCH.location}</p>
            <p>{RESEARCH.email}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
