import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Heart, BarChart3, Users, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";

export const metadata = { title: "For NGOs — SaveServe" };

export default function NGOsPage() {
  return (
    <div className="bg-background font-sans">
      <Navbar />

      {/* Hero */}
      <section className="bg-white border-b border-border py-20">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">For NGOs & Organisations</p>
          <h1 className="text-5xl font-extrabold text-foreground mb-6">
            Fund Healthcare.<br />Measure Impact.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            SaveServe gives NGOs and community health organisations a direct channel to fund free-tier healthcare
            for beneficiaries — with real-time analytics proving every kwacha spent.
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
            <h2 className="text-3xl font-extrabold text-foreground mb-5">Premium Tiers Fund Free Care</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              SaveServe's cross-subsidisation architecture channels a portion of every Premium subscription into a
              shared NGO subsidy pool — funding ZMW 0 appointments for verified free-tier patients.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              NGOs can additionally top up pools, restrict funding to specific beneficiaries or geographic areas,
              and track disbursement through the NGO analytics dashboard.
            </p>
            <ul className="space-y-2">
              {["Fund a community pool or specific beneficiaries", "Set spending caps and approval workflows", "Receive monthly impact reports", "API integration for your existing systems"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />{f}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white border border-border rounded-2xl p-8 shadow-sm space-y-5">
            <h3 className="font-bold text-foreground text-lg mb-2">How the Subsidy Pool Works</h3>
            {[
              { from: "Premium Patient", action: "Pays K149/month", to: "20% flows to NGO pool" },
              { from: "NGO", action: "Tops up pool directly", to: "Earmarked for beneficiaries" },
              { from: "Policy Guardian", action: "Validates each booking", to: "Applies correct subsidy rate" },
              { from: "Free-Tier Patient", action: "Books appointment", to: "Pays ZMW 0" },
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

      {/* NGO Features */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-foreground">NGO Dashboard Features</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Users, title: "Beneficiary Management", desc: "Maintain a verified list of beneficiaries. Restrict pool access to specific individuals, communities, or district zones." },
              { icon: BarChart3, title: "Impact Analytics", desc: "Real-time dashboards showing appointments funded, cost per patient, district coverage, and monthly spend trends." },
              { icon: ShieldCheck, title: "Compliance & Audit", desc: "Full transaction history with Policy Guardian audit logs. Every subsidy disbursement is traceable and verifiable." },
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
        <h2 className="text-3xl font-extrabold mb-4">Partner with SaveServe</h2>
        <p className="text-white/70 mb-8 max-w-xl mx-auto">
          Register your organisation, fund a community health pool, and start measuring the real impact of your healthcare investment.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="px-7 py-3 bg-white text-primary font-semibold rounded-xl">Register Organisation</Link>
          <Link href="/contact" className="px-7 py-3 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10">Talk to the Team <ArrowRight className="w-4 h-4 inline ml-1" /></Link>
        </div>
      </section>
    </div>
  );
}
