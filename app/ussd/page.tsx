import Navbar from "@/components/Navbar";
import UssdPhoneSimulator from "@/components/UssdPhoneSimulator";
import { PhoneCall, ShieldCheck, Heart, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function UssdSimulatorPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header Banner */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent border border-primary/20 text-xs font-semibold text-primary mb-4">
              <PhoneCall className="w-3.5 h-3.5" /> Africa&apos;s Talking USSD Gateway (*384#)
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight">
              Live USSD Gateway Simulator
            </h1>
            <p className="mt-3 text-muted-foreground text-base md:text-lg">
              Experience medium-agnostic healthcare access. Dial <span className="font-bold text-primary">*384#</span> on the feature-phone simulator below to book consultations, verify Robin Hood subsidies, or register offline.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Phone Simulator on Left */}
            <div className="lg:col-span-5 flex justify-center">
              <UssdPhoneSimulator initialPhone="+260971000001" />
            </div>

            {/* Live Guide & Architecture Explanation on Right */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
                <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  How to test this live prototype
                </h2>

                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-secondary/70">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <p className="font-bold text-foreground">Launch Gateway</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Click the green <strong>&ldquo;Call&rdquo;</strong> button on the handset to dial <code>*384#</code>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-secondary/70">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <p className="font-bold text-foreground">Book Consultation (Option 1)</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Press <code>1</code> and click <strong>Send</strong> → Select Specialty (e.g. <code>1</code> Nurse) → Choose Practitioner (<code>1</code>) → Pick Time Slot.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-secondary/70">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <p className="font-bold text-foreground">Policy Guardian Subsidy Verification</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Notice how the system calculates <strong>ZMW 0.00</strong> with 100% NGO Subsidy for Free-tier users before final confirmation.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-secondary/70">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                      4
                    </span>
                    <div>
                      <p className="font-bold text-foreground">Verify in Command Centre</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Log in as medical practitioner (<code>nurse.banda@saveserve.org</code> / <code>password123</code>) or patient (<code>demo@saveserve.org</code>) to see the appointment synced to the cloud EHR in real time!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Research & Theory Cards */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-primary">
                    <ShieldCheck className="w-4 h-4" />
                    <h3 className="font-bold text-sm text-foreground">Medium-Agnostic Design</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Digital Divide Theory: Ensures equal clinical workflows whether the patient accesses via USSD on a 2G feature phone or a modern Web browser.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-primary">
                    <Heart className="w-4 h-4" />
                    <h3 className="font-bold text-sm text-foreground">Robin Hood Subsidy</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Closed-loop economic engine: Premium subscribers fund the community pool that guarantees zero-cost care for low-income patients.
                  </p>
                </div>
              </div>

              {/* Quick links to portals */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:opacity-90 transition"
                >
                  Medical Officer Dashboard <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/patients"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary text-foreground text-xs font-semibold rounded-xl hover:bg-muted transition"
                >
                  Patients Information Portal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
