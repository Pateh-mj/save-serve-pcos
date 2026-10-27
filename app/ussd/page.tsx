import Navbar from "@/components/Navbar";
import UssdPhoneSimulator from "@/components/UssdPhoneSimulator";
import { PhoneCall, ShieldCheck, Heart, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "USSD Access *384#" };

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
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
              Live USSD Gateway Simulator
            </h1>
            <p className="mt-3 text-muted-foreground text-base md:text-lg">
              Experience medium-agnostic healthcare access. Dial <span className="font-bold text-primary">*384#</span> on the feature-phone simulator below to register, book with symptom triage, and see the Robin Hood subsidy applied — no internet needed on the patient&apos;s side. The simulator speaks the same Africa&apos;s Talking protocol a live short code would use.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Phone Simulator on Left */}
            <div className="lg:col-span-5 flex justify-center">
              <UssdPhoneSimulator initialPhone="+260971000001" />
            </div>

            {/* Live Guide & Architecture Explanation on Right */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-card border border-border rounded-lg p-6 md:p-8 shadow-sm">
                <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  How to test this live prototype
                </h2>

                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3 p-3.5 rounded-lg bg-secondary/70">
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

                  <div className="flex items-start gap-3 p-3.5 rounded-lg bg-secondary/70">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <p className="font-bold text-foreground">Book Consultation (Option 1)</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Press <code>1</code> → main problem → danger signs (<code>2</code> No, or <code>1</code> to see the emergency path) → how long unwell → service → practitioner → day → time.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-lg bg-secondary/70">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <p className="font-bold text-foreground">Policy Guardian Subsidy Verification</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        The confirmation screen shows your triage priority and the fee calculated for your tier. Switch the SIM to <strong>Free Tier</strong> (<code>+260971000002</code>) to see <strong>ZMW 0.00</strong> with a 100% NGO subsidy.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-lg bg-secondary/70">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                      4
                    </span>
                    <div>
                      <p className="font-bold text-foreground">Verify in Command Centre</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Log in as medical practitioner (<code>mutale@saveserve.org</code> / <code>password123</code>) or patient (<code>demo@saveserve.org</code>) to see the appointment synced to the cloud EHR in real time!
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-lg bg-secondary/70">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                      5
                    </span>
                    <div>
                      <p className="font-bold text-foreground">Dropped-session recovery</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Press <strong>End</strong> halfway through a booking, then dial again: the gateway offers to continue where you left off.
                        Options <code>2</code>, <code>4</code> and <code>5</code> let you cancel a visit, pay a bill and rate a visit from the same phone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Research & Theory Cards */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-primary">
                    <ShieldCheck className="w-4 h-4" />
                    <h3 className="font-bold text-sm text-foreground">Diffusion of Innovations</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Rogers (1962): compatible, simple tools are adopted faster. The USSD gateway fits the phones patients already own, while
                    staff use the full web dashboard — one system, two access channels.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-primary">
                    <Heart className="w-4 h-4" />
                    <h3 className="font-bold text-sm text-foreground">Robin Hood Business Model</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Prahalad &amp; Hart (2002): premium-tier revenue funds the community health equity fund, which the Policy Guardian uses to
                    cover free-tier visits.
                  </p>
                </div>
              </div>

              {/* Quick links to portals */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition"
                >
                  Practitioner Login <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/patients"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary text-foreground text-xs font-semibold rounded-lg hover:bg-muted transition"
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
