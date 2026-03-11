"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUser } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { Github, Mail, Shield, Info, Heart } from "lucide-react";

export default function Footer() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signedIn") checkUser();
      if (payload.event === "signedOut") setUser(null);
    });
    return () => unsubscribe();
  }, []);

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      setUser(null);
    }
  }

  const footerLinks = user
    ? [
        { name: "Dashboard", href: "/dashboard" },
        { name: "Subscriptions", href: "/subscriptions" },
        { name: "About", href: "/about" },
        { name: "Contact", href: "/contact" },
      ]
    : [
        { name: "Home", href: "/" },
        { name: "About", href: "/about" },
        { name: "Contact", href: "/contact" },
        { name: "Login", href: "/login" },
      ];

  return (
    <footer className="bg-black/40 backdrop-blur-md border-t border-white/5 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-1 space-y-6">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 rounded-lg bg-[#155885] flex items-center justify-center text-white font-bold transition-transform group-hover:scale-110">
                S
              </div>
              <span className="text-xl font-bold text-white tracking-tight">SubTrak</span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed">
              Take full control of your digital footprint and monthly spending with SubTrak's intelligent tracking system.
            </p>
            <div className="flex items-center space-x-4">
              <Link 
                href="#" 
                target="_blank"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-[#155885]/20 hover:text-white transition-all border border-white/10"
              >
                <Github size={20} />
              </Link>
              <Link 
                href="/contact" 
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-[#155885]/20 hover:text-white transition-all border border-white/10"
              >
                <Mail size={20} />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-white font-bold uppercase tracking-widest text-xs">Platform</h4>
            <ul className="space-y-4">
              {footerLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-white/40 hover:text-white transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-6">
            <h4 className="text-white font-bold uppercase tracking-widest text-xs">Support</h4>
            <ul className="space-y-4">
              <li><Link href="/contact" className="text-white/40 hover:text-white transition-colors text-sm">Help Center</Link></li>
              <li><Link href="#" className="text-white/40 hover:text-white transition-colors text-sm">API Docs</Link></li>
              <li><Link href="#" className="text-white/40 hover:text-white transition-colors text-sm">Community</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-6">
            <h4 className="text-white font-bold uppercase tracking-widest text-xs">Legal</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-white/40 hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link href="#" className="text-white/40 hover:text-white transition-colors text-sm">Terms of Service</Link></li>
              <li><Link href="#" className="text-white/40 hover:text-white transition-colors text-sm">Security</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-white/20 text-xs">
            &copy; 2026 SubTrak. All rights reserved. Made for CMPT 354.
          </p>
          <div className="flex items-center space-x-6 text-white/20">
            <div className="flex items-center space-x-1 hover:text-white/40 transition">
              <Shield size={12} />
              <span className="text-[10px] uppercase font-bold tracking-tighter">Secure Data</span>
            </div>
            <div className="flex items-center space-x-1 hover:text-white/40 transition">
              <Heart size={12} className="text-red-500/40" />
              <span className="text-[10px] uppercase font-bold tracking-tighter">Built in BC</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
