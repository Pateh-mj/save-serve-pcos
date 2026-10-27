import Navbar from "@/components/Navbar";
import Link from "next/link";
import { PhoneCall, Globe, CheckCircle2, ArrowRight, Calendar, FileText, CreditCard, Bell, Activity } from "lucide-react";
import { USSD_PROTOTYPE_NOTE } from "@/lib/research";

export const metadata = { title: "For Patients — SaveServe PCOS" };

export default function PatientsPage() {
  return (
    <div className="bg-background font-sans">
      <Navbar />

      {/* Hero */}
      <section className="bg-white border-b border-border py-20">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">For Patients</p>
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-6">
            Healthcare Access on Any Phone
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Book visits, see your health records and manage your bills — with a smartphone on the web, or with a basic phone and no
            internet through USSD.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="px-7 py-3.5 bg-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity">
              Register Online
            </Link>
            <a href="#ussd-guide" className="px-7 py-3.5 border border-border text-foreground font-semibold rounded-xl hover:bg-secondary transition-colors flex items-center gap-2 justify-center">
              <PhoneCall className="w-4 h-4 text-primary" /> How to use *384#
            </a>
          </div>
        </div>
      </section>

      {/* Two channels */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Two Ways to Access</p>
            <h2 className="text-3xl font-extrabold text-foreground">You Choose How to Connect</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mb-5">
                <Globe className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Web App (PWA)</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Use it in any browser, or install it on your phone&apos;s home screen.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  "Describe your symptoms and book a practitioner",
                  "See your fee before you confirm",
                  "View your appointments, health records and follow-ups",
                  "Pay bills and track subsidies",
                  "Rate your visit",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Register now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-foreground text-white rounded-2xl p-8 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-5">
                <PhoneCall className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">USSD — Dial *384#</h3>
              <p className="text-sm text-white/60 mb-5">
                No internet or data bundle needed — works over ordinary GSM signal on a basic feature phone.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  "Register with just your name",
                  "Book a visit with symptom triage",
                  "Check or cancel your appointments",
                  "See your health records and pay bills",
                  "Get SMS confirmations and reminders",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/80">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <a href="#ussd-guide" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                See full guide <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-foreground">Everything in One Place</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              { icon: Activity, title: "Symptom Triage", desc: "Tell us what is wrong when you book. Danger signs get emergency advice and the most urgent patients are seen first." },
              { icon: Calendar, title: "Book Appointments", desc: "Choose a practitioner and a free time slot — on the web or by USSD." },
              { icon: FileText, title: "Health Records", desc: "Your visit history, diagnoses, prescriptions and follow-up dates." },
              { icon: CreditCard, title: "Transparent Billing", desc: "See what you will pay before confirming. Community-tier patients are subsidised automatically." },
              { icon: Bell, title: "SMS Notifications", desc: "Confirmations, reminders and receipts by SMS — no internet needed to receive them." },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Billing */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-5">
              <CreditCard className="w-6 h-6 text-primary" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">How Billing Works</h2>
            <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              PCOS uses the Robin Hood cross-subsidization model. The Policy Guardian works out your fee from your tier when you book, and
              shows it before you confirm. Tiers are set by the clinic&apos;s administrators.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { tier: "Free (community)", desc: "Visits are fully subsidised from the community health equity fund, up to a monthly limit." },
              { tier: "Basic (standard)", desc: "You pay the standard consultation fee." },
              { tier: "Premium", desc: "You pay above the standard fee; the extra funds care for community-tier patients." },
            ].map((t) => (
              <div key={t.tier} className="bg-white border border-border rounded-xl p-5 shadow-sm">
                <p className="font-bold text-foreground text-sm mb-1">{t.tier}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USSD step guide */}
      <section id="ussd-guide" className="py-20 bg-secondary">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">USSD Guide</p>
            <h2 className="text-3xl font-extrabold text-foreground">How to Use *384#</h2>
            <p className="text-xs text-muted-foreground mt-3 max-w-xl mx-auto">
              {USSD_PROTOTYPE_NOTE}{" "}
              <Link href="/ussd" className="text-primary font-semibold">Open the simulator</Link>
            </p>
          </div>
          <div className="space-y-4">
            {[
              { step: "1", title: "Dial *384#", desc: "First time? Choose Register and enter your name. Returning patients see the main menu." },
              { step: "2", title: "Describe your problem", desc: "Choose 1 Book a visit, pick your main problem, say whether you have danger signs and how long you have been unwell. Danger signs show emergency advice straight away." },
              { step: "3", title: "Pick a service, practitioner and time", desc: "Choose Nurse, Pharmacist or Physiotherapist, then a practitioner, one of the next open days and a time slot." },
              { step: "4", title: "Confirm", desc: "Review the practitioner, time, fee and priority before you press 1 to confirm." },
              { step: "5", title: "Receive an SMS", desc: "A confirmation SMS follows, plus a reminder before the visit. Use the menu to cancel, see records, pay or rate a visit." },
            ].map((item) => (
              <div key={item.step} className="flex gap-5 items-start p-5 bg-white rounded-2xl border border-border shadow-sm">
                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-white text-center">
        <h2 className="text-3xl font-extrabold mb-4">Start Your Healthcare Journey</h2>
        <p className="text-white/70 mb-8">Register online or use the USSD menu — the system meets you where you are.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="px-7 py-3 bg-white text-primary font-semibold rounded-xl hover:bg-white/90">Register Online</Link>
          <Link href="/login" className="px-7 py-3 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10">Sign In</Link>
        </div>
      </section>
    </div>
  );
}
