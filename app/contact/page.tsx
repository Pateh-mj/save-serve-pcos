import Navbar from "@/components/Navbar";
import { Mail, MapPin, Phone, BookOpen, GraduationCap } from "lucide-react";
import { RESEARCH } from "@/lib/research";
import ContactForm from "./ContactForm";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="bg-background font-sans">
      <Navbar />

      <section className="py-12">
        <div className="container mx-auto px-6 max-w-5xl grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Send a Message</h2>
            <ContactForm />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Contact Information</h2>
            <div className="space-y-5 mb-10">
              {[
                { icon: Mail, label: "Email", value: RESEARCH.email },
                { icon: Phone, label: "USSD short code (prototype)", value: "*384# — try it in the USSD simulator" },
                { icon: MapPin, label: "Institution", value: `${RESEARCH.university} (${RESEARCH.universityShort}), ${RESEARCH.location}` },
                { icon: BookOpen, label: "School", value: RESEARCH.school },
                { icon: GraduationCap, label: "Academic advisor", value: RESEARCH.advisor },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-semibold text-foreground">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-secondary rounded-lg p-6 border border-border">
              <p className="text-sm font-semibold text-foreground mb-2">About this project</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                PCOS is a final year project by {RESEARCH.author} for the degree of {RESEARCH.degree}, {RESEARCH.school},{" "}
                {RESEARCH.university} ({RESEARCH.universityShort}), {RESEARCH.year}. Responses may take 1–3 working days.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
