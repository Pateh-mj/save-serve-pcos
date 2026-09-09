import Navbar from "@/components/Navbar";
import { Mail, MapPin, Phone, BookOpen } from "lucide-react";

export const metadata = { title: "Contact — SaveServe PCOS" };

export default function ContactPage() {
  return (
    <div className="bg-background font-sans">
      <Navbar />

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-6 max-w-5xl grid md:grid-cols-2 gap-16">

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Send a Message</h2>
            <form className="space-y-4">
              {/* Name Fields */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">First name</label>
                  <input
                    className="w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Last name</label>
                  <input
                    className="w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Last name"
                  />
                </div>
              </div>
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="you@example.com"
                />
              </div>
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Subject</label>
                <select
                  className="w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Select a topic</option>
                  <option value="general">General Enquiry</option>
                  <option value="research">Research / Academic Enquiry</option>
                  <option value="patient">Patient Access</option>
                  <option value="technical">Technical Support</option>
                  <option value="hospital">Hospital Partnership</option>
                </select>
              </div>
              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Message</label>
                <textarea
                  rows={5}
                  className="w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  placeholder="Your message..."
                />
              </div>
              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Contact Information</h2>
            <div className="space-y-5 mb-10">
              {[
                { icon: Mail, label: "Email", value: "tembopatson5@gmail.com" },
                { icon: Phone, label: "USSD Shortcode", value: "*384#" },
                { icon: MapPin, label: "Institution", value: "Information and Communication University (ICU), Lusaka" },
                { icon: BookOpen, label: "Department", value: "Department of ICT, School of Engineering" },
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

            {/* About this project */}
            <div className="bg-secondary rounded-lg p-6 border border-border">
              <p className="text-sm font-semibold text-foreground mb-2">About this project</p>
              <p className="text-sm text-muted-foreground leading-relaxed text-justify">
                PCOS is a Final Year BSc ICT project by Patson Tembo, submitted to the Department of ICT, School of Engineering at the Information and Communication University (ICU), 2026. Responses may take 1–3 working days.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}