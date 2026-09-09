import Navbar from "@/components/Navbar";
import Link from "next/link";
import { CheckCircle2, Heart, ShieldCheck, Globe, PhoneCall, Stethoscope } from "lucide-react";

export const metadata = { title: "About PCOS — SaveServe" };

export default function AboutPage() {
  return (
    <div className="bg-background font-sans">
      <Navbar />

      {/* Hero */}

      {/* Abstract */}
      <section className="py-12">

        <div className="container mx-auto px-6 max-w-3xl text-center">
          {/* Subheading */}
          <p className="text-s font-semibold uppercase tracking-widest text-primary mb-2">
            About This Project
          </p>
          {/* Main headline */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
            Patient-Centric Orchestration System
          </h1>

        </div>

        <div className="container mx-auto px-6 max-w-4xl">
          <div className="bg-white border border-border rounded-lg p-8 shadow-sm mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Abstract</p>
            <p className="text-muted-foreground leading-relaxed mb-4 text-justify">
              As healthcare systems globally shift toward digital-first models, a growing digital and economic divide threatens to leave vulnerable populations behind. This research proposes the development of a Patient-Centric Orchestration System (PCOS) that bridges the gap between high-end private consultation and subsidized community care.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4 text-justify">
              The system leverages a "Robin Hood" Economic Model, where premium-tier patient billing funds the infrastructure for low-resource users within the same hospital. The project addresses physical accessibility through a medium-agnostic architecture, integrating Offline-First synchronization for remote areas and USSD/SMS gateways for non-smartphone users.
            </p>
            <p className="text-muted-foreground leading-relaxed text-justify">
              By implementing an automated Hospital Policy Engine, the system ensures that clinical standards and hospital interests are maintained across all socioeconomic tiers. The result is a scalable, financially sustainable hospital management framework that transforms operational efficiency into social equity.
            </p>
          </div>
        </div>
      </section>

      {/* Background */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-6 max-w-5xl grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Background</p>
            <h2 className="text-3xl font-extrabold text-foreground mb-5">A Zambian Healthcare Problem</h2>
            <p className="text-muted-foreground leading-relaxed mb-4 text-justify">
              In the Zambian context, the disparity in healthcare access is pronounced due to the geographical and economic divide between urban centers and rural communities. Urban hospitals increasingly adopt digital management tools, yet rural patients rely on basic feature phones and face limited internet connectivity — rendering most modern web-based healthcare solutions inaccessible.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4 text-justify">
              Local healthcare providers struggle with manual administrative processes to manage fee waivers or subsidies for low-income patients, leading to inefficiencies and errors in resource distribution. There is a notable absence of a unified system that bridges the gap between high-fidelity web interfaces for medical staff and low-bandwidth access for rural patients.
            </p>
            <p className="text-muted-foreground leading-relaxed text-justify">
              This research proposes PCOS to act as a digital mediator between these two worlds — allowing a doctor in a city hospital to use a rich web dashboard while a patient in a remote village interacts with the same system using a simple text-based USSD menu.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { icon: Globe, label: "Web PWA for connected users", desc: "Full-featured hospital management interface optimised for low-bandwidth connections." },
              { icon: PhoneCall, label: "USSD *384# for feature phones", desc: "Zero internet required. Works on any mobile network across Zambia." },
              { icon: ShieldCheck, label: "Policy Guardian automation", desc: "Automated billing compliance and subsidy calculation at every patient interaction." },
              { icon: Heart, label: "Robin Hood Subsidization Model", desc: "Premium-tier patient billing funds community-tier care within the same hospital." },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-4 p-4 bg-white rounded-lg border border-border">
                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 text-justify">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Motivation */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="bg-white border border-border rounded-lg p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Motivation</p>
            <p className="text-muted-foreground leading-relaxed mb-4 text-justify">
              Having always desired to pursue the medical profession, building systems that aid healthcare services has been a long-time goal since engaging in Information Technology. This study is driven by the interesting technology behind Unstructured Supplementary Service Data (USSD) and how it can provide premium health service access even when one is unable to own a smartphone or is in a place of low internet connectivity — particularly for the Zambian community.
            </p>
          </div>
        </div>
      </section>

      {/* Objectives */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-6 max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Research Objectives</p>
          <h2 className="text-3xl font-extrabold text-foreground mb-8">What This System Achieves</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { n: "1", title: "Multi-Channel Interface", desc: "Develop a USSD + PWA interface that ensures 100% patient reach regardless of internet availability." },
              { n: "2", title: "Policy Guardian Engine", desc: "Implement a real-time Policy Guardian that automates tiered billing logic and enforces medical-business protocol compliance for all hospital interactions." },
              { n: "3", title: "EHR Synchronisation", desc: "Evaluate the system's efficiency in synchronising offline USSD transactions with a centralised cloud-based Electronic Health Record (EHR)." },
            ].map((item) => (
              <div key={item.n} className="bg-white border border-border rounded-lg p-6 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm mb-4">{item.n}</div>
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Theoretical framework */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6 max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Theoretical Framework</p>
          <h2 className="text-3xl font-extrabold text-foreground mb-8">The Research Foundation</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { title: "Digital Divide Theory", body: "PCOS applies a Medium-Agnostic Design ensuring the Policy Guardian serves a smartphone user via React and a feature-phone user via USSD with equal clinical integrity." },
              { title: "Socio-Technical Systems Theory", body: "PCOS bridges social policy (the need for equity) and technical execution (automated subsidization), aligning with the workflows of a functioning hospital." },
              { title: "Health Equity Theory (Farantos et al., 2025)", body: "The Robin Hood Model implements closed-loop cross-subsidization — transforming an economic theory into hard-coded hospital billing logic." },
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

      {/* Significance */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-6 max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Significance</p>
          <h2 className="text-3xl font-extrabold text-foreground mb-8">Who Benefits</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { icon: Stethoscope, title: "Hospitals and Healthcare Providers", body: "A practical framework for integrating USSD-based systems into existing healthcare infrastructures — improving patient intake, consultation scheduling, and follow-up care while lowering operational costs." },
              { icon: Globe, title: "Patients and Communities", body: "Equitable access to healthcare services for individuals in rural or low-income settings. Patients can access appointment bookings and health information through simple mobile phones, bridging the digital divide." },
              { icon: ShieldCheck, title: "Computer Science and ICT Research", body: "Demonstrates how USSD technology can encode complex healthcare policies, subsidies, and workflows into a modern software architecture. A contribution to the growing body of knowledge on mHealth solutions in Africa." },
              { icon: Heart, title: "Zambian Community", body: "Improved health outcomes and reduced barriers to essential medical services, particularly for the 60%+ of Zambia's population in rural or peri-urban areas with limited internet access." },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-border rounded-lg p-6 shadow-sm flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm mb-2">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed text-justify">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-primary text-white text-center px-4">
        <h2 className="text-2xl font-extrabold mb-3">Explore the System</h2>
        <p className="text-white/70 mb-6 text-sm max-w-md mx-auto">
          Register as a patient to try the web channel, or dial *384# to test the USSD gateway.
        </p>
        {/* Buttons container: stack on mobile, row on larger screens */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Register Button */}
          <Link
            href="/register"
            className="flex items-center gap-3 px-6 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-white/90 transition w-full sm:w-auto justify-center"
          >
            {/* Icon inside button */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Register as a Patient
          </Link>
          {/* Contact Button */}
          <Link
            href="/contact"
            className="flex items-center gap-3 px-6 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition w-full sm:w-auto justify-center"
          >
            {/* Icon inside button */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} fill="none" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
            </svg>
            Contact the Researcher
          </Link>
        </div>
      </section>
    </div>
  );
}