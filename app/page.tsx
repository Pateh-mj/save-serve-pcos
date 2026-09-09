import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  PhoneCall, Globe, ShieldCheck, Stethoscope, FileText,
  CheckCircle2, ArrowRight, Wifi, WifiOff, AlertTriangle,
  TrendingUp, Heart, ChevronRight, Users, LayoutDashboard,
} from "lucide-react";

const problems = [
  {
    icon: WifiOff,
    title: "Internet-First Systems Exclude Low-Income Patients",
    body: "Most hospital management platforms require smartphones and stable internet — leaving rural and low-income patients in Zambia locked out of scheduling and basic health services.",
    color: "text-red-500 bg-red-50",
  },
  {
    icon: AlertTriangle,
    title: "Billing Models Ignore Socioeconomic Reality",
    body: "Traditional flat-rate hospital billing does not account for income disparity. Manual fee-waiver processes are error-prone and slow, creating inequity at the point of service.",
    color: "text-amber-500 bg-amber-50",
  },
  {
    icon: FileText,
    title: "Doctors Buried in Administrative Compliance",
    body: "Medical officers spend critical consultation time on manual policy-checking and billing administration — leading to burnout and reduced patient face-time.",
    color: "text-blue-500 bg-blue-50",
  },
];

const features = [
  {
    icon: PhoneCall,
    title: "USSD + PWA Dual Channel",
    body: "Patients book hospital appointments from any feature phone via *384# — no internet, no smartphone needed. Web users get a full Progressive Web App.",
  },
  {
    icon: ShieldCheck,
    title: "Policy Guardian Engine",
    body: "Real-time automated billing compliance. The Policy Guardian enforces the hospital's tiered billing rules and subsidy eligibility for every patient interaction.",
  },
  {
    icon: TrendingUp,
    title: "Robin Hood Subsidization",
    body: "Premium-tier patient fees generate a surplus that funds subsidised care for community-tier patients within the same hospital — equity built into the billing logic.",
  },
  {
    icon: FileText,
    title: "Cloud EHR Synchronisation",
    body: "USSD-originated appointments create offline stubs that sync to the centralised Electronic Health Record when connectivity is restored. No visit is ever lost.",
  },
  {
    icon: LayoutDashboard,
    title: "Medical Officer Command Centre",
    body: "A high-fidelity web dashboard gives medical officers full control over schedules, patient records, consultation logs, and billing oversight in real time.",
  },
  {
    icon: Stethoscope,
    title: "Single Source of Truth",
    body: "Both USSD and web channels write to the same centralised database — one patient record, one billing history, regardless of how the patient accessed the hospital.",
  },
];

const ussdSteps = [
  { step: "1", screen: "WELCOME TO PCOS\n──────────────\nTO ACCESS SERVICES:\n\n1. Register\n2. Book Appointment\n3. My Appointments\n4. Health Tips\n\n[OK]     [BACK]" },
  { step: "2", screen: "SELECT SERVICE:\n──────────────\n1. General Consultation\n2. Pharmacy\n3. Physiotherapy\n4. Follow-up Visit\n\n[SELECT]  [BACK]" },
  { step: "3", screen: "SELECT DOCTOR:\n──────────────\n1. Dr. Banda (10:00 AM)\n2. Dr. Phiri (11:00 AM)\n3. Dr. Mwanza (1:00 PM)\n\n[SELECT]  [BACK]" },
  { step: "4", screen: "CONFIRM BOOKING:\n──────────────\nDoctor: Dr. Banda\nDate: Today 10:00 AM\nService: Consultation\nSubsidy Applied\nTotal: ZMW 0\n\n1-CONFIRM  2-CANCEL" },
  { step: "5", screen: "BOOKING CONFIRMED!\n──────────────\nYour appointment\nhas been booked.\n\nExpect SMS\nconfirmation\nshortly.\n\n[OK]" },
];

export default function Home() {
  return (
    <div className="font-sans bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-white overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, #16a34a 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />
        <div className="container mx-auto px-6 py-6 md:py-12 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent border border-primary/20 text-xs font-semibold text-primary mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              BSc ICT Final Year Project · Information and Communication University (ICU)
            </div>
            <h1 className="text-2xl md:text-6xl font-extrabold text-foreground leading-tight mb-6">
              <span className="text-primary">PCOS:</span> Hospital Management for{" "}
              <span className="relative">Every Patient<span className="absolute -bottom-1 left-0 right-0 h-1 bg-primary/30 rounded-full" /></span>
            </h1>
            <p className="text-lg text-muted-foreground text-justify leading-relaxed mb-4 max-w-lg">
              A hybrid USSD-Web hospital management system that connects patients with their hospital&apos;s medical officers — regardless of internet access or income level.
            </p>
            <p className="text-sm text-muted-foreground text-justify mb-10 max-w-lg">
              Powered by the <strong className="text-foreground">Robin Hood Subsidization Model</strong> — premium-tier patient billing funds subsidised care for community-tier patients within the same hospital.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-primary/25">
                Register as a Patient <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#ussd" className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-border text-foreground font-semibold rounded-lg hover:bg-secondary transition-colors">
                <PhoneCall className="w-4 h-4 text-primary" /> Access via USSD *384#
              </a>
            </div>
          </div>

          <div className="relative hidden md:flex flex-col items-center gap-4">
            <div className="w-full max-w-xl bg-white border border-border rounded-lg shadow-xl p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Two Channels. One Hospital System.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col items-center p-4 rounded-lg bg-accent border border-primary/20 text-center">
                  <Globe className="w-8 h-8 text-primary mb-2" strokeWidth={1.5} />
                  <p className="text-sm font-bold text-foreground">Web PWA</p>
                  <p className="text-xs text-muted-foreground mt-1">Smartphone patients &amp; doctors</p>
                </div>
                <div className="flex flex-col items-center p-4 rounded-lg bg-secondary border border-border text-center">
                  <PhoneCall className="w-8 h-8 text-primary mb-2" strokeWidth={1.5} />
                  <p className="text-sm font-bold text-foreground">USSD *384#</p>
                  <p className="text-xs text-muted-foreground mt-1">Feature-phone patients</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Shared EHR · Policy Guardian · Robin Hood Billing
              </div>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Wifi className="w-4 h-4 text-primary" /> Web access</span>
              <span className="flex items-center gap-1"><WifiOff className="w-4 h-4 text-primary" /> Offline via USSD</span>
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
          <span className="text-white/80 text-sm max-w-xl">Premium-tier patient billing funds subsidised community-tier care within the same hospital. Equity as software logic, not manual administration.</span>
        </div>
      </section>

      {/* Problem */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Problem Statement</p>
            <h2 className="text-2xl font-extrabold text-foreground">The Hospital Management Gap</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Current hospital management systems fail a large portion of patients through architectural design choices that assume universal internet access and equal income.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {problems.map((p) => (
              <div key={p.title} className="bg-white border border-border rounded-lg p-7 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-5 ${p.color}`}>
                  <p.icon className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <h3 className="font-bold text-foreground mb-3 leading-snug">{p.title}</h3>
                <p className="text-sm text-muted-foreground text-justify leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-6 bg-accent/30">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">The Solution</p>
              <h2 className="text-2xl font-extrabold text-foreground leading-tight mb-6">One Hospital System.<br />Two Access Channels.</h2>
              <p className="text-muted-foreground text-justify leading-relaxed mb-6">
                PCOS bridges the digital divide by providing the same hospital management capabilities through a full Progressive Web App <strong className="text-foreground">and</strong> a USSD gateway reachable on any mobile network — no internet required.
              </p>
              <ul className="space-y-3 mb-8">
                {["100% patient reach regardless of device or connectivity", "Policy Guardian automates hospital billing compliance in real time", "USSD transactions sync to cloud EHR on reconnection", "Robin Hood billing funds community-tier care from premium revenue", "Medical officers access a full web Command Centre dashboard"].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-foreground text-justify">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />{item}
                  </li>
                ))}
              </ul>
              <Link href="/about" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:gap-2 transition-all">
                Read the research proposal <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {[
                { icon: Globe, label: "Web PWA — Patients & Doctors", badge: "Online", badgeCls: "bg-primary/10 text-primary", desc: "Full appointment booking, EHR records, billing management, and the Medical Officer Command Centre — optimised for low-data connections." },
                { icon: PhoneCall, label: "USSD Channel (*384#)", badge: "Offline-first", badgeCls: "bg-secondary text-muted-foreground", desc: "Menu-driven appointment booking via any mobile network. Confirmations via SMS. Zero internet requirement for patients." },
                { icon: ShieldCheck, label: "Policy Guardian + Shared EHR", badge: "Both channels", badgeCls: "bg-primary/10 text-primary", desc: "Both channels write to one centralised EHR. The Policy Guardian enforces hospital billing policy for every transaction." },
              ].map((item) => (
                <div key={item.label} className="bg-white border border-border rounded-lg p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <item.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                    <span className="font-semibold text-foreground text-sm">{item.label}</span>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${item.badgeCls}`}>{item.badge}</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-justify">{item.desc}</p>
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
            <h2 className="text-2xl font-extrabold text-foreground">Built for Every Layer of the Hospital</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white border border-border rounded-lg p-7 hover:border-primary/30 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mb-5">
                  <f.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-foreground text-justify mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground text-justify leading-relaxed">{f.body}</p>
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
              <h2 className="text-2xl font-extrabold text-foreground mb-5">Equity as Hard-Coded Hospital Logic</h2>
              <p className="text-muted-foreground text-justify leading-relaxed mb-5">
                Traditional hospitals handle fee waivers manually — a process prone to error and delay. PCOS encodes the hospital&apos;s equity policy directly into the Policy Guardian engine.
              </p>
              <p className="text-muted-foreground text-justify leading-relaxed mb-6">
                Premium-tier patient fees generate a surplus that the Policy Guardian automatically redirects to fund community-tier consultations within the same hospital. No manual intervention. No administrative delay.
              </p>
              <ul className="space-y-2">
                {["Surplus from premium billing automatically funds community care", "Policy Guardian calculates subsidy eligibility at booking time", "Full audit log of every redistribution event", "Hospital administrators monitor equity metrics in real time"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground text-justify">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-foreground text-xl mb-4">How the Policy Guardian Processes a Booking</h3>
              {[
                { n: "1", title: "Patient books via web or USSD", desc: "Request arrives at the Policy Guardian regardless of access channel." },
                { n: "2", title: "Tier classification evaluated", desc: "Policy Guardian checks the patient's registered tier: Premium or Community." },
                { n: "3", title: "Billing calculated automatically", desc: "Premium patients pay full rate. Community patients receive subsidy — funded from accumulated premium surplus." },
                { n: "4", title: "Appointment confirmed + EHR updated", desc: "Booking confirmed, SMS sent, event logged to the centralised EHR." },
              ].map((item) => (
                <div key={item.n} className="flex gap-4 items-start bg-white border border-border rounded-lg p-5 shadow-sm">
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
              Any patient on any mobile network can book a hospital appointment in under 2 minutes — using only a basic feature phone.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {ussdSteps.map((s, i) => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-60 bg-amber-950/90 border-2 border-amber-700 rounded-lg p-4 shadow-xl">
                    <div className="bg-amber-400/20 rounded-lg p-2 mb-3">
                      <div className="text-center text-[10px] text-amber-400 font-bold">PCOS HOSPITAL</div>
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
            <h2 className="text-2xl font-extrabold text-foreground">Built for Both Sides of the Hospital</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Users, label: "Patients", color: "bg-blue-50 text-blue-600", points: ["Book via web or dial *384# — no internet needed", "Access health records and visit history", "Community-tier patients receive automatic subsidies", "SMS appointment confirmations on any phone", "Transparent billing — know costs before confirming"], href: "/patients", cta: "For Patients" },
              { icon: Stethoscope, label: "Medical Officers", color: "bg-green-50 text-primary", points: ["Full web Command Centre dashboard", "Manage patient schedule and availability", "Complete EHR records after every consultation", "Policy Guardian handles billing automatically", "Monitor community and premium patient metrics"], href: "/login", cta: "Staff Login" },
            ].map((item) => (
              <div key={item.label} className="bg-white border border-border rounded-lg p-8 flex flex-col shadow-sm hover:shadow-md transition-shadow">
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

      {/* Theoretical Foundation */}
      <section className="py-12 bg-accent/30">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Theoretical Foundation</p>
            <h2 className="text-2xl font-extrabold text-foreground">Grounded in Established Research</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { title: "Digital Divide Theory", body: "PCOS applies a Medium-Agnostic Design so the Policy Guardian serves a smartphone user via the web and a feature-phone user via USSD with equal clinical integrity." },
              { title: "Socio-Technical Systems Theory", body: "PCOS acts as the bridge between social policy (equity) and technical execution (automated subsidization), aligning with the workflows of a functioning hospital." },
              { title: "Health Equity Theory (Farantos et al., 2025)", body: "The Robin Hood Model implements a closed-loop cross-subsidization — transforming an economic theory into hard-coded hospital billing logic." },
              { title: "Information Systems Continuity Theory", body: "USSD functions as a Resilience Layer independent of data networks, ensuring the Policy Guardian remains accessible during internet downtime." },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-border rounded-lg p-6 shadow-sm">
                <div className="flex items-start gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <h3 className="font-bold text-foreground text-sm">{item.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed text-justify">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-primary">
        <div className="container mx-auto px-6 text-center text-white">
          <h2 className="text-2xl font-extrabold mb-4">Access Your Hospital. Any Phone. Anywhere.</h2>
          <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
            Register online with a smartphone, or simply dial *384# from any mobile phone — the system meets you where you are.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="px-8 py-3.5 bg-white text-primary font-semibold rounded-lg hover:bg-white/90 transition-colors">Register as a Patient</Link>
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
                <span className="text-white/40 font-light text-sm">SaveServe</span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed text-justify max-w-xs">
                Patient-Centric Orchestration System for Healthcare Resource Equity Using Robin Hood Subsidization and Multi-Channel Access. Final Year BSc ICT Project — Department of ICT, School of Engineering, Information and Communication University (ICU).
              </p>
              <p className="text-xs text-white/30 mt-3">By Patson Tembo · 2026</p>
            </div>
            {[
              { heading: "System", links: [{ label: "For Patients", href: "/patients" }, { label: "Medical Officer Login", href: "/login" }, { label: "USSD Access (*384#)", href: "#ussd" }, { label: "Register", href: "/register" }] },
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
            <p>© 2026 Patson Tembo · Information and Communication University (ICU) · BSc ICT Final Year Project</p>
            <p>tembopatson5@gmail.com</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
