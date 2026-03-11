"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "aws-amplify/auth";
import { ChevronDown, LogOut, Settings, Menu, X } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const { profile, loading, displayName, initials, cognitoId } = useUserProfile();
  const isAuthed = !loading && cognitoId !== null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleScroll = () => setScrolled(window.scrollY > 10);

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  async function handleLogout() {
    try {
      await signOut();
      setIsDropdownOpen(false);
      router.push("/");
    } catch (err) {
      console.error("Error signing out: ", err);
    }
  }

  const navLinks = isAuthed
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
      ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/70 backdrop-blur-xl border-b border-white/[0.06] shadow-2xl shadow-black/20"
          : "bg-black/40 backdrop-blur-md border-b border-white/[0.04]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link href={isAuthed ? "/dashboard" : "/"} className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#155885] to-[#1a8dd6] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[#155885]/20 transition-transform duration-300 group-hover:scale-105">
              S
            </div>
            <span className="text-xl font-bold tracking-tight text-white/90 group-hover:text-white transition-colors">
              SubTrak
            </span>
          </Link>

          <div className="hidden md:flex items-center">
            <div className="flex items-center bg-white/[0.04] rounded-full px-1.5 py-1 border border-white/[0.06]">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive(link.href)
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center">
            {loading ? (
              <div className="w-24 h-9" />
            ) : isAuthed ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all duration-200"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#155885] to-[#1a8dd6] flex items-center justify-center text-white text-xs font-bold">
                    {initials}
                  </div>
                  <span className="text-sm text-white/70 font-medium max-w-[120px] truncate hidden lg:block">
                    {displayName || "User"}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-white/30 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#111111] rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/40 py-1.5 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-white/[0.06]">
                      <p className="text-xs text-white/30 font-medium">Signed in as</p>
                      <p className="text-sm font-semibold text-white truncate mt-0.5">
                        {displayName || profile?.email || "User"}
                      </p>
                      {displayName && profile?.email && (
                        <p className="text-xs text-white/30 truncate mt-0.5">{profile.email}</p>
                      )}
                    </div>
                    <div className="py-1">
                      <Link
                        href="/account"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors"
                      >
                        <Settings size={15} />
                        Account Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors"
                      >
                        <LogOut size={15} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm text-white/50 hover:text-white font-medium transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/login"
                  className="px-5 py-2 bg-gradient-to-r from-[#155885] to-[#1a8dd6] text-white text-sm font-semibold rounded-full hover:shadow-lg hover:shadow-[#155885]/25 transition-all duration-300 hover:-translate-y-px active:translate-y-0"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-white/[0.06] bg-black/60 backdrop-blur-xl">
          <div className="px-6 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive(link.href)
                    ? "bg-white/[0.08] text-white"
                    : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {link.name}
              </Link>
            ))}

            <div className="pt-3 mt-3 border-t border-white/[0.06]">
              {isAuthed ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.04] transition-all"
                  >
                    <Settings size={16} />
                    Account Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full px-4 py-3 rounded-xl text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.06] transition-all"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full text-center px-6 py-3 bg-gradient-to-r from-[#155885] to-[#1a8dd6] text-white rounded-xl font-semibold text-sm transition-all"
                >
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
