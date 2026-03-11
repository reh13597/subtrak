"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser, signOut } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    checkUser();
    
    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      switch (payload.event) {
        case "signedIn":
          checkUser();
          break;
        case "signedOut":
          setUser(null);
          break;
      }
    });

    // Click outside listener for dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      setUser(null);
    }
  }

  async function handleLogout() {
    try {
      await signOut();
      setUser(null);
      setIsDropdownOpen(false);
      router.push("/");
    } catch (err) {
      console.error("Error signing out: ", err);
    }
  }

  const navLinks = user 
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

  return (
    <nav className="sticky top-0 z-50 bg-[#155885] shadow-lg px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-2 group">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#155885] font-bold text-xl shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            S
          </div>
          <span className="text-2xl font-bold tracking-tight text-white transition-opacity duration-300 group-hover:opacity-80">SubTrak</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name}
              href={link.href} 
              className={`relative text-white/90 hover:text-white font-medium transition-colors duration-200 group py-1`}
            >
              {link.name}
              <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-white transition-transform duration-300 origin-left ${pathname === link.href ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}></span>
            </Link>
          ))}

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 backdrop-blur-sm hover:scale-105"
              >
                <span className="text-sm font-bold">{user.username?.[0]?.toUpperCase() || "U"}</span>
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-2xl py-2 overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                  <div className="px-4 py-2 border-b border-gray-100 mb-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
                    <p className="text-sm font-medium text-gray-800 truncate">{user.signInDetails?.loginId || "User"}</p>
                  </div>
                  <Link href="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#155885]/10 hover:text-[#155885] transition">
                    Account Settings
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link 
              href="/login" 
              className="px-6 py-2.5 bg-white text-[#155885] rounded-full font-bold hover:bg-gray-100 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Started
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-300 hover:text-white p-2"
          >
            {isMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden mt-4 space-y-4 pb-4 px-2">
          {user ? (
            <>
              <Link href="/dashboard" className="block text-gray-300 hover:text-white transition py-2 border-b border-white/5">Dashboard</Link>
              <Link href="/subscriptions" className="block text-gray-300 hover:text-white transition py-2 border-b border-white/5">Subscriptions</Link>
            </>
          ) : (
            <Link href="/" className="block text-gray-300 hover:text-white transition py-2 border-b border-white/5">Home</Link>
          )}
          <Link href="/about" className="block text-gray-300 hover:text-white transition py-2 border-b border-white/5">About</Link>
          <Link href="/contact" className="block text-gray-300 hover:text-white transition py-2 border-b border-white/5">Contact</Link>
          
          {user ? (
            <>
              <Link href="/account" className="block text-gray-300 hover:text-white transition py-2 border-b border-white/5">Account</Link>
              <button 
                onClick={handleLogout}
                className="w-full text-left block text-gray-300 hover:text-white transition py-2"
              >
                Logout
              </button>
            </>
          ) : (
            <Link 
              href="/login" 
              className="block w-full text-center px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition shadow-lg shadow-primary/20"
            >
              Get Started
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
