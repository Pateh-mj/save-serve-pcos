import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Heart, BarChart3, Users, ShieldCheck, ArrowRight, BookOpen } from "lucide-react";

export const metadata = { title: "For Funding Partners — SaveServe" };

export default function NGOsPage() {
  return (
    <div className="bg-background font-sans">
      <Navbar />

      {/* Hero */}
      <section className="bg-white border-b border-border py-20">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">For NGOs &amp; Funding Partners</p>
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-6">
            Fund Community Care.<br />See Every Kwacha.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Partner organisations can top up the community health equity fund that pays for free-tier visits, and follow exactly where each
            kwacha went.
          </p>
          <Link href="/register" className="px-8 py-4 bg-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-lg">
            Register Your Organisation
          </Link>
        </div>
      </section>

      {/* Robin Hood model */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-5xl grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mb-5">
              <Heart className="w-6 h-6 text-primary" strokeWidth={1.5} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">The Robin Hood Model</p>
            <h2 className="text-3xl font-extrabold text-foreground mb-5">Premium Revenue Funds Free Care</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              In PCOS the equity fund is sustained mainly from inside the system: when a premium-tier patient pays, the amount above the standard
              tariff is credited to the fund, and the Policy Guardian draws on it to cover free-tier visits.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Partner top-ups supplement that internal revenue — much as donor and insurer top-ups do in mobile health wallets such as
              Kenya&apos;s M-TIBA — so free care continues while premium volumes grow.
            </p>
          </div>
          <div className="bg-white border border-border rounded-2xl p-8 shadow-sm space-y-5">
            <h3 className="font-bold text-foreground text-lg mb-2">How the Fund Works</h3>
            {[
              { from: "Premium patient", action: "Pays above the standard tariff", to: "Surplus credited to the fund" },
              { from: "Funding partner", action: "Tops up the fund", to: "Recorded in the fund ledger" },
              { from: "Policy Guardian", action: "Checks each booking's tier", to: "Free-tier visit paid from the fund" },
              { from: "Free-tier patient", action: "Books a visit", to: "Pays ZMW 0, up to a monthly limit" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-primary font-bold text-xs shrink-0">{i + 1}</div>
                <div>
                  <span className="font-semibold text-foreground">{item.from}</span>
                  <span className="text-muted-foreground"> — {item.action}</span>
                  <p className="text-xs text-primary font-medium mt-0.5">→ {item.to}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner dashboard */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-foreground">The Partner Dashboard</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: ShieldCheck, title: "Fund & Ledger", desc: "Top up the fund and see every movement — top-ups, subsidised visits, refunds for cancellations and premium surplus — reconciled to the balance." },
              { icon: Users, title: "Beneficiaries", desc: "Every visit your fund paid for, with service, date and status. Patient identities are abbreviated and no clinical details are shown." },
              { icon: BarChart3, title: "Impact Report", desc: "Month by month: visits funded, subsidy value, premium surplus received and top-ups." },
              { icon: BookOpen, title: "Transparent Rules", desc: "Subsidies follow the published Policy Guardian rules set by the clinic's administrators, applied the same way on web and USSD." },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-white text-center">
        <h2 className="text-3xl font-extrabold mb-4">Partner with PCOS</h2>
        <p className="text-white/70 mb-8 max-w-xl mx-auto">
          Register your organisation, top up the community health equity fund, and follow the care it pays for.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="px-7 py-3 bg-white text-primary font-semibold rounded-xl">Register Organisation</Link>
          <Link href="/contact" className="px-7 py-3 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10">Contact the Researcher <ArrowRight className="w-4 h-4 inline ml-1" /></Link>
        </div>
      </section>
    </div>
  );
}
