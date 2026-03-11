"use client";

import { useState, useRef } from "react";
import emailjs from "@emailjs/browser";
import {
  Mail,
  MessageSquare,
  User,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Github,
  MapPin
} from "lucide-react";

export default function ContactPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const sendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus("idle");

    const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
    const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "";
    const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";

    if (formRef.current) {
      emailjs
        .sendForm(SERVICE_ID, TEMPLATE_ID, formRef.current, PUBLIC_KEY)
        .then(
          () => {
            setStatus("success");
            setIsLoading(false);
            formRef.current?.reset();
          },
          (error) => {
            console.error("EmailJS Error:", error);
            setStatus("error");
            setErrorMessage(error.text || "Failed to send message. Please try again.");
            setIsLoading(false);
          }
        );
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight">
            Get in <span className="text-[#155885]">Touch.</span>
          </h1>
          <p className="text-xl text-white/50">
            Have questions about SubTrak or need assistance with your subscription management? Our team is here to help you regain control.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Info Cards */}
          <div className="space-y-6">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4 group hover:border-[#155885]/50 transition-all duration-500">
              <div className="w-12 h-12 rounded-2xl bg-[#155885]/10 flex items-center justify-center text-[#155885] group-hover:scale-110 transition-transform">
                <Mail size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Email Us</h3>
              <p className="text-white/40 text-sm">Our friendly team is here to help.</p>
              <p className="text-[#155885] font-semibold">support@subtrak.com</p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4 group hover:border-[#155885]/50 transition-all duration-500">
              <div className="w-12 h-12 rounded-2xl bg-[#155885]/10 flex items-center justify-center text-[#155885] group-hover:scale-110 transition-transform">
                <MapPin size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Location</h3>
              <p className="text-white/40 text-sm">Come say hello at our BC office.</p>
              <p className="text-white/80 font-semibold">Vancouver, British Columbia</p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4 group hover:border-[#155885]/50 transition-all duration-500">
              <div className="w-12 h-12 rounded-2xl bg-[#155885]/10 flex items-center justify-center text-[#155885] group-hover:scale-110 transition-transform">
                <Github size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Open Source</h3>
              <p className="text-white/40 text-sm">Check out our codebase on GitHub.</p>
              <p className="text-white/80 font-semibold">github.com/subtrak</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
              {/* Decorative Glows */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#155885] rounded-full blur-[100px] opacity-20"></div>
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#155885] rounded-full blur-[100px] opacity-20"></div>

              <form ref={formRef} onSubmit={sendEmail} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white/40 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-4 text-white/20" size={18} />
                      <input
                        type="text"
                        name="user_name"
                        required
                        placeholder="John Doe"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-[#155885] transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white/40 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-4 text-white/20" size={18} />
                      <input
                        type="email"
                        name="user_email"
                        required
                        placeholder="john@example.com"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-[#155885] transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-white/40 uppercase tracking-widest ml-1">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    required
                    placeholder="How can we help?"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-[#155885] transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-white/40 uppercase tracking-widest ml-1">Message</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-4 text-white/20" size={18} />
                    <textarea
                      name="message"
                      required
                      rows={5}
                      placeholder="Tell us more about your inquiry..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-[#155885] transition-all resize-none"
                    ></textarea>
                  </div>
                </div>

                {/* Status Messages */}
                {status === "success" && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 size={20} />
                    <p className="text-sm font-bold">Message sent successfully! We'll get back to you soon.</p>
                  </div>
                )}
                {status === "error" && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={20} />
                    <p className="text-sm font-bold">{errorMessage}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#155885] hover:bg-[#1a6ba1] text-white py-5 rounded-2xl font-black text-xl transition-all shadow-xl shadow-[#155885]/20 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={28} />
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={20} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
