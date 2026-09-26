"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Settings2,
  LogOut,
  Stethoscope,
} from "lucide-react";

export default function DoctorNavbar({ doctorName = "" }) {
  const pathname = usePathname();

  const isDashboard = pathname === "/doctor/dashboard";
  const isSettings = pathname === "/doctor/settings";

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0B0F1A]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/doctor/dashboard" className="flex items-center gap-2.5 no-underline">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Amrit<span className="text-teal-400">Care</span>
              <span className="text-[11px] font-bold text-teal-300 bg-teal-500/20 border border-teal-500/30 px-1.5 py-0.5 rounded-md ml-1.5 uppercase">
                Provider
              </span>
            </span>
          </Link>
        </div>

        {/* Links */}
        <nav className="flex items-center gap-1">
          <Link
            href="/doctor/dashboard"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              isDashboard
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Appointments</span>
          </Link>
          <Link
            href="/doctor/settings"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              isSettings
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span className="hidden sm:inline">Triage Settings</span>
          </Link>
        </nav>

        {/* User & Sign Out */}
        <div className="flex items-center gap-3">
          {doctorName && (
            <div className="hidden md:flex items-center gap-2 pr-2 border-r border-white/[0.08]">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold text-xs">
                Dr
              </div>
              <span className="text-xs font-semibold text-slate-300 max-w-[120px] truncate">
                {doctorName}
              </span>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/doctor/login" })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/10 border border-white/[0.08] hover:border-rose-500/30 text-xs font-semibold text-slate-300 hover:text-rose-300 transition-all"
            aria-label="Sign out of Doctor Portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
