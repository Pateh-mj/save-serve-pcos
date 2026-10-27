"use client";
import { useState } from "react";
import { Send } from "lucide-react";
import { RESEARCH } from "@/lib/research";

const inputCls =
  "w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

// Opens the visitor's email app with the message pre-filled (no server mail relay in the prototype).
export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const subject = `[PCOS] ${form.subject || "General enquiry"}`;
    const body = `${form.message}\n\n— ${form.name}${form.email ? ` (${form.email})` : ""}`;
    window.location.href = `mailto:${RESEARCH.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1" htmlFor="c-name">Name</label>
          <input id="c-name" required value={form.name} onChange={set("name")} className={inputCls} placeholder="Your name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1" htmlFor="c-email">Email</label>
          <input id="c-email" type="email" value={form.email} onChange={set("email")} className={inputCls} placeholder="you@example.com" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1" htmlFor="c-subject">Subject</label>
        <select id="c-subject" value={form.subject} onChange={set("subject")} className={inputCls}>
          <option value="">Select a topic</option>
          <option value="General enquiry">General enquiry</option>
          <option value="Research / academic enquiry">Research / academic enquiry</option>
          <option value="Patient access">Patient access</option>
          <option value="Technical support">Technical support</option>
          <option value="Clinic or partner collaboration">Clinic or partner collaboration</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1" htmlFor="c-message">Message</label>
        <textarea id="c-message" required rows={5} value={form.message} onChange={set("message")} className={`${inputCls} resize-none`} placeholder="Your message..." />
      </div>
      <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition">
        <Send className="w-4 h-4" /> Send Message
      </button>
      <p className="text-xs text-muted-foreground text-center">Opens your email app with the message ready to send to {RESEARCH.email}.</p>
    </form>
  );
}
