"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Activity,
  MapPin,
  Clock,
  Pill,
  Menu,
  X,
  LogOut,
  Smartphone,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/patient/dashboard", label: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { href: "/patient/triage", label: "AI Triage", icon: Activity, id: "triage" },
  { href: "/patient/locate", label: "Find Hospital", icon: MapPin, id: "locate" },
  { href: "/patient/history", label: "History", icon: Clock, id: "history" },
  { href: "/reminders", label: "Reminders", icon: Pill, id: "reminders" },
];

export default function Navbar({ refillCount = 0 }) {
  const pathname = usePathname();
  const [patient, setPatient] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(sessionStorage.getItem("medconnect_patient") || "null");
    if (stored?.id) setPatient(stored);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("medconnect_patient");
    window.location.href = "/";
  };

  const isActive = (href) => {
    if (href === "/patient/dashboard") return pathname === href;
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* ─── Desktop / Tablet Nav ─── */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 no-underline shrink-0" aria-label="AmritCare AI Home">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              Amrit<span className="text-teal-600">Care</span>{" "}
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-md border border-teal-200">AI</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium no-underline transition-colors ${
                    active
                      ? "text-teal-700 bg-teal-50 font-semibold"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {item.id === "reminders" && refillCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full" aria-label={`${refillCount} medicines need refill`}>
                      {refillCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {patient && (
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center">
                    <span className="text-teal-700 font-semibold text-xs">
                      {patient.firstName?.[0]}{patient.lastName?.[0]}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{patient.firstName}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-rose-500 transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline">Sign Out</span>
                </button>
              </div>
            )}
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
            </button>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white animate-slide-up shadow-lg">
            <div className="px-4 py-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium no-underline transition-colors ${
                      active
                        ? "text-teal-700 bg-teal-50 font-bold"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                    {item.id === "reminders" && refillCount > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto">
                        {refillCount}
                      </span>
                    )}
                  </Link>
                );
              })}
              {patient && (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-500 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ─── Mobile Bottom Nav (App-like Dock) ─── */}
      <div className="mobile-bottom-nav md:hidden" role="navigation" aria-label="Mobile bottom navigation">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`relative ${active ? "active" : ""}`}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.id === "reminders" && refillCount > 0 && (
                <span className="absolute -top-1 right-0 bg-rose-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {refillCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </>
  );
}
