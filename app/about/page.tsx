import Navbar from "@/components/Navbar";
import Link from "next/link";
import { CheckCircle2, Heart, ShieldCheck, Globe, PhoneCall, ArrowDown, Users, Stethoscope, Code2 } from "lucide-react";
import {
  ABSTRACT, DSR_STEPS, EXISTING_SYSTEMS, GENERAL_OBJECTIVE, GUIDING_PRINCIPLES, PROBLEMS,
  RESEARCH, RESEARCH_QUESTIONS, SIGNIFICANCE, SPECIFIC_OBJECTIVES, THEORIES,
} from "@/lib/research";

export const metadata = { title: "About PCOS" };

const SIGNIFICANCE_ICONS = [Users, Stethoscope, Code2];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">{children}</p>;
}

export default function AboutPage() {
  return (
    <div className="bg-background font-sans">
      <Navbar />

      {/* Title page */}
      <section className="py-12 bg-white border-b border-border">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <SectionLabel>About This Project</SectionLabel>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground leading-snug mb-5">{RESEARCH.title}</h1>
          <p className="text-sm text-muted-foreground">
            {RESEARCH.author} · Advisor: {RESEARCH.advisor}
            <br />
            {RESEARCH.degree} · {RESEARCH.school}, {RESEARCH.university} ({RESEARCH.universityShort}) · {RESEARCH.location}, {RESEARCH.year}
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            {RESEARCH.prototypeName} is the working name of the PCOS prototype demonstrated on this website.
          </p>
        </div>
      </section>

      {/* Abstract */}
      <section className="py-12">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="bg-white border border-border rounded-lg p-8 shadow-sm">
            <SectionLabel>Abstract</SectionLabel>
            {ABSTRACT.map((p, i) => (
              <p key={i} className={`text-muted-foreground leading-relaxed ${i < ABSTRACT.length - 1 ? "mb-4" : ""}`}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Background */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-6 max-w-5xl grid md:grid-cols-2 gap-16 items-center">
          <div>
            <SectionLabel>Background</SectionLabel>
            <h2 className="text-3xl font-extrabold text-foreground mb-5">A Zambian Healthcare Problem</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              In the Zambian context, the disparity in healthcare access is pronounced due to the geographical and economic divide between
              urban centres and rural communities. Urban hospitals increasingly adopt digital management tools, while rural patients rely on
              basic feature phones and face limited internet connectivity, rendering most modern web-based healthcare solutions inaccessible.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Local healthcare providers struggle with manual administrative processes to manage fee waivers or subsidies for low-income
              patients, leading to inefficiencies and errors in resource distribution. There is no unified system that bridges high-fidelity web
              interfaces for medical staff and low-bandwidth access for rural citizens.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              PCOS acts as a digital mediator between these two worlds: a doctor in a city hospital uses a rich web dashboard while a patient in
              a remote village interacts with the same system through a simple text-based menu.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { icon: Globe, label: "Progressive Web App", desc: "For healthcare staff and smartphone users: clinical records, schedules and administrative settings." },
              { icon: PhoneCall, label: "USSD gateway", desc: "For feature-phone users: register, book and access services without internet access." },
              { icon: ShieldCheck, label: "Policy Guardian", desc: "Middleware that evaluates user tiers, enforces billing rules and manages cross-subsidization." },
              { icon: Heart, label: "Robin Hood model", desc: "Revenue from premium-tier services offsets the cost of free or discounted care for low-income users." },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-4 p-4 bg-white rounded-lg border border-border">
                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem statement */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6 max-w-5xl">
          <SectionLabel>Problem Statement</SectionLabel>
          <h2 className="text-3xl font-extrabold text-foreground mb-8">Access Barriers and Financial Strain</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {PROBLEMS.map((p) => (
              <div key={p.title} className="bg-white border border-border rounded-lg p-6 shadow-sm">
                <h3 className="font-bold text-foreground text-sm mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
                <p className="text-xs text-muted-foreground/80 mt-3 italic">({p.citation})</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Motivation */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="bg-white border border-border rounded-lg p-8 shadow-sm">
            <SectionLabel>Motivation</SectionLabel>
            <p className="text-muted-foreground leading-relaxed mb-4">
              While digital healthcare is moving forward fast, a huge number of people in Zambia are being left behind: modern healthcare web
              apps usually require a smartphone and reliable internet access. USSD is still the most reliable and accessible way for ordinary
              citizens to use digital services — it works on basic feature phones and needs no data bundles — yet most health-related USSD tools
              are basic, standalone utilities rather than real-time extensions of a proper healthcare system.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              At the same time, facilities struggle with financial sustainability, and fee-for-service models often prevent lower-income patients
              from getting timely care. PCOS combines low-bandwidth USSD sessions with a modern web portal and an automated Policy Guardian to
              show how thoughtfully designed software can make quality healthcare more accessible, fair and sustainable.
            </p>
          </div>
        </div>
      </section>

      {/* Objectives & research questions */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6 max-w-5xl">
          <SectionLabel>Objectives</SectionLabel>
          <h2 className="text-3xl font-extrabold text-foreground mb-4">What the Study Sets Out to Do</h2>
          <div className="bg-accent/40 border border-primary/20 rounded-lg p-5 mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">General objective</p>
            <p className="text-sm text-foreground leading-relaxed">{GENERAL_OBJECTIVE}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5 mb-12">
            {SPECIFIC_OBJECTIVES.map((o, i) => (
              <div key={i} className="bg-white border border-border rounded-lg p-5 shadow-sm flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">{i + 1}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{o}</p>
              </div>
            ))}
          </div>

          <SectionLabel>Research Questions</SectionLabel>
          <ol className="space-y-3">
            {RESEARCH_QUESTIONS.map((q, i) => (
              <li key={i} className="flex gap-3 text-sm text-foreground bg-white border border-border rounded-lg p-4">
                <span className="font-bold text-primary shrink-0">RQ{i + 1}</span>
                <span className="leading-relaxed">{q}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Scope & delimitations */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-6 max-w-5xl grid md:grid-cols-2 gap-8">
          <div>
            <SectionLabel>Scope</SectionLabel>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                ["Functional", "Patient registration, appointment scheduling, symptom-based triage and tier-based billing, through a PWA, a USSD interface and the Policy Guardian middleware."],
                ["Technical", "Real-time data synchronisation between the USSD gateway and the central database, using modern web technologies and RESTful APIs."],
                ["Target users", "Healthcare administrators and staff who manage patient records and policy settings, and patients using smartphones or basic feature phones."],
                ["Context", "Community healthcare delivery in Zambia, using simulated and field-tested scenarios representative of local clinic workflows and network conditions."],
              ].map(([k, v]) => (
                <li key={k} className="bg-white border border-border rounded-lg p-4">
                  <span className="font-semibold text-foreground">{k}: </span>{v}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionLabel>Delimitations</SectionLabel>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                "Prioritises registration, booking, basic symptom triage and tier-based billing; complex surgical scheduling, intensive-care tracking and radiology imaging are excluded.",
                "Designed around urban and semi-urban community clinic workflows in Zambia, not nationwide tertiary referral hospitals.",
                "Financial transactions are modelled around the automated subsidization logic rather than integrated with every banking and mobile-money provider.",
              ].map((d) => (
                <li key={d} className="bg-white border border-border rounded-lg p-4">{d}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Theoretical framework */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6 max-w-5xl">
          <SectionLabel>Theoretical Framework</SectionLabel>
          <h2 className="text-3xl font-extrabold text-foreground mb-3">Two Complementary Theories</h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-3xl">
            Financial sustainability comes from the cross-subsidization principles of the Robin Hood Business Model; technology acceptance
            and usability come from the user-centred principles of the Diffusion of Innovations theory.
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            {THEORIES.map((t) => (
              <div key={t.title} className="bg-white border border-border rounded-lg p-6 shadow-sm">
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
          <p className="text-xs text-muted-foreground mt-5">
            Guiding principles: {GUIDING_PRINCIPLES.title} ({GUIDING_PRINCIPLES.citation}) — {GUIDING_PRINCIPLES.body}
          </p>
        </div>
      </section>

      {/* Conceptual framework (report Figure 1) */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-6 max-w-4xl">
          <SectionLabel>Conceptual Framework</SectionLabel>
          <h2 className="text-3xl font-extrabold text-foreground mb-8">Inputs, Orchestration, Output</h2>
          <div className="space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Inputs</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-info-soft border border-info-border rounded-lg p-4">
                <p className="font-bold text-info-deep text-sm">Feature phone users</p>
                <p className="text-xs text-info-deep">Dial the USSD short code</p>
              </div>
              <div className="bg-info-soft border border-info-border rounded-lg p-4">
                <p className="font-bold text-info-deep text-sm">Smartphone &amp; admin users</p>
                <p className="text-xs text-info-deep">Log in to the web app (PWA)</p>
              </div>
            </div>
            <ArrowDown className="w-5 h-5 text-muted-foreground mx-auto" />
            <div className="border-2 border-dashed border-border rounded-xl p-4 bg-white">
              <p className="font-bold text-foreground text-sm">PCOS orchestration core</p>
              <p className="text-xs text-muted-foreground mb-3">Policy Guardian applies tier and subsidy rules in real time</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-success-soft border border-success-border rounded-lg p-3">
                  <p className="font-bold text-success-deep text-sm">USSD gateway</p>
                  <p className="text-xs text-success-deep">Session &amp; data sync</p>
                </div>
                <div className="bg-success-soft border border-success-border rounded-lg p-3">
                  <p className="font-bold text-success-deep text-sm">Policy Guardian</p>
                  <p className="text-xs text-success-deep">Tier &amp; subsidy rules</p>
                </div>
              </div>
            </div>
            <ArrowDown className="w-5 h-5 text-muted-foreground mx-auto" />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Output</p>
            <div className="bg-premium-soft border border-premium-border rounded-lg p-4 max-w-md mx-auto">
              <p className="font-bold text-premium-deep text-sm">Equitable healthcare access</p>
              <p className="text-xs text-premium-deep">Unified records, appointments, billing</p>
            </div>
          </div>
        </div>
      </section>

      {/* Existing systems (report Table 1) */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6 max-w-5xl">
          <SectionLabel>Review of Existing Systems</SectionLabel>
          <h2 className="text-3xl font-extrabold text-foreground mb-8">Where Existing Platforms Fall Short</h2>
          <div className="bg-white border border-border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="px-4 py-3 font-semibold">System</th>
                  <th className="px-4 py-3 font-semibold">Main features</th>
                  <th className="px-4 py-3 font-semibold">Strengths</th>
                  <th className="px-4 py-3 font-semibold">Limitations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border align-top">
                {EXISTING_SYSTEMS.map((s) => (
                  <tr key={s.name}>
                    <td className="px-4 py-3 font-semibold text-foreground">{s.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.features}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.strengths}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.limitations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-5 leading-relaxed">
            <strong className="text-foreground">Research gap:</strong> no documented system bridges low-bandwidth USSD feature-phone interfaces
            with advanced web dashboards under an automated policy engine executing a sustainable cross-subsidization model. PCOS addresses that gap.
          </p>
        </div>
      </section>

      {/* Methodology */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-6 max-w-5xl">
          <SectionLabel>Methodology</SectionLabel>
          <h2 className="text-3xl font-extrabold text-foreground mb-3">Design Science Research</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-3xl">
            The study follows the Design Science Research paradigm (Hevner et al., 2004): it creates a working IT artefact — the PCOS
            prototype — and evaluates how well it solves the identified problem, through an iterative prototyping lifecycle.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {DSR_STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <span className="px-3 py-2 rounded-lg bg-white border border-border text-sm font-semibold text-foreground">
                  {i + 1}. {s}
                </span>
                {i < DSR_STEPS.length - 1 && <span className="text-muted-foreground">→</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Significance */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6 max-w-5xl">
          <SectionLabel>Significance</SectionLabel>
          <h2 className="text-3xl font-extrabold text-foreground mb-8">Who Benefits</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {SIGNIFICANCE.map((item, i) => {
              const Icon = SIGNIFICANCE_ICONS[i];
              return (
                <div key={item.title} className="bg-white border border-border rounded-lg p-6 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-bold text-foreground text-sm mb-2">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-primary text-white text-center px-4">
        <h2 className="text-2xl font-extrabold mb-3">Explore the Prototype</h2>
        <p className="text-white/70 mb-6 text-sm max-w-md mx-auto">
          Register as a patient to try the web channel, or open the USSD simulator to try *384#.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/register" className="px-6 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-white/90 transition w-full sm:w-auto">
            Register as a Patient
          </Link>
          <Link href="/ussd" className="px-6 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition w-full sm:w-auto">
            Open the USSD Simulator
          </Link>
          <Link href="/contact" className="px-6 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition w-full sm:w-auto">
            Contact the Researcher
          </Link>
        </div>
      </section>
    </div>
  );
}
