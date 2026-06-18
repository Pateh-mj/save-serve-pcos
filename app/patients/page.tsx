import Navbar from "@/components/Navbar";
import Link from "next/link";
import { PhoneCall, Globe, CheckCircle2, ArrowRight, Calendar, FileText, CreditCard, Bell } from "lucide-react";

export const metadata = { title: "For Patients — SaveServe PCOS" };

export default function PatientsPage() {
  return (
    <div className="bg-background font-sans">
      <Navbar />

      {/* Hero */}
      <section className="bg-white border-b border-border py-20">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">For Patients</p>
          <h1 className="text-5xl font-extrabold text-foreground mb-6">
            Hospital Access on Any Phone
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Book hospital appointments, access your health records, and manage billing — whether you have a smartphone or a basic phone, connected or offline.
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
                Full-featured hospital portal accessible from any browser — designed for low-data connections.
              </p>
              <ul className="space-y-2 mb-6">
                {["Search and book with available medical officers", "View your complete appointment history", "Access health records and clinical notes", "Track billing and subsidy status", "Receive email and SMS reminders"].map((f) => (
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
                No internet needed. Works on any feature phone, any mobile network. Available 24/7.
              </p>
              <ul className="space-y-2 mb-6">
                {["Dial *384# from any phone", "Select service and available doctor", "Choose a date and time slot", "Confirm — receive SMS confirmation", "Community-tier patients pay nothing"].map((f) => (
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Calendar, title: "Book Appointments", desc: "Schedule visits with hospital medical officers at times that work for you — web or USSD." },
              { icon: FileText, title: "Health Records", desc: "Your complete visit history, clinical notes, and prescriptions — always accessible." },
              { icon: CreditCard, title: "Transparent Billing", desc: "Know exactly what you will pay before confirming. Community-tier patients receive automatic subsidies." },
              { icon: Bell, title: "SMS Confirmations", desc: "Every booking is confirmed via SMS — no internet required to receive notifications." },
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

      {/* Robin Hood for patients */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-5">
            <CreditCard className="w-6 h-6 text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">How Billing Works</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            PCOS uses the Robin Hood Subsidization Model. The hospital&apos;s Policy Guardian engine automatically determines your billing tier at the point of booking.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Community-tier patients receive a subsidy funded from the surplus generated by premium-tier consultations within the same hospital. Billing is transparent — you see the cost before confirming.
          </p>
        </div>
      </section>

      {/* USSD step guide */}
      <section id="ussd-guide" className="py-20 bg-secondary">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">USSD Guide</p>
            <h2 className="text-3xl font-extrabold text-foreground">How to Use *384#</h2>
          </div>
          <div className="space-y-4">
            {[
              { step: "1", title: "Dial *384# from your phone", desc: "Works on MTN, Airtel, Zamtel and all major Zambian networks. No internet or data plan needed." },
              { step: "2", title: "Select your service type", desc: "Choose from General Consultation, Pharmacy, Physiotherapy, or Follow-up Visit using the number keys." },
              { step: "3", title: "Pick a doctor and time", desc: "Available medical officers and open slots are shown. Select the one that suits you." },
              { step: "4", title: "Confirm your booking", desc: "Review your appointment details and the billing cost before confirming. Type 1 to confirm." },
              { step: "5", title: "Receive SMS confirmation", desc: "You will receive an SMS with your appointment details and any pre-visit instructions within seconds." },
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
        <p className="text-white/70 mb-8">Register online or simply dial *384# — the system meets you where you are.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="px-7 py-3 bg-white text-primary font-semibold rounded-xl hover:bg-white/90">Register Online</Link>
          <Link href="/login" className="px-7 py-3 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10">Sign In</Link>
        </div>
      </section>
    </div>
  );
}
