"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  Activity, MapPin, Pill, Phone, Bot, Clock,
  ChevronRight, Shield, Star, Menu, X, Stethoscope,
  Users, HeartPulse,
} from "lucide-react";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(sessionStorage.getItem("medconnect_patient") || "null");
    if (stored?.id) {
      setIsLoggedIn(true);
      setPatientName(stored.firstName || "");
    }
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100" role="navigation" aria-label="Landing page navigation">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 no-underline" aria-label="AmritCare AI Home">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              Amrit<span className="text-teal-600">Care</span>{" "}
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-md border border-teal-200">AI</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#features" className="hover:text-teal-600 transition-colors">Features</a>
            <a href="#services" className="hover:text-teal-600 transition-colors">Services</a>
            <a href="#how-it-works" className="hover:text-teal-600 transition-colors">How It Works</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link href="/patient/dashboard" className="bg-teal-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-teal-700 transition-all shadow-sm no-underline">
                  Welcome, {patientName} →
                </Link>
              </>
            ) : (
              <>
                <Link href="/doctor/login" className="text-sm font-medium text-gray-500 hover:text-teal-600 transition-colors no-underline">
                  Doctor Portal
                </Link>
                <Link href="/patient/login" className="text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors no-underline">
                  Sign In
                </Link>
                <Link href="/patient/register" className="bg-teal-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-teal-700 transition-all shadow-sm no-underline">
                  Get Started Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-5 py-4 space-y-3 animate-slide-up">
            <a href="#features" className="block text-sm font-medium text-gray-600 py-2">Features</a>
            <a href="#services" className="block text-sm font-medium text-gray-600 py-2">Services</a>
            <a href="#how-it-works" className="block text-sm font-medium text-gray-600 py-2">How It Works</a>
            <div className="pt-3 border-t border-gray-100 space-y-2">
              {isLoggedIn ? (
                <Link href="/patient/dashboard" className="block w-full bg-teal-600 text-white text-sm font-semibold px-5 py-3 rounded-lg text-center no-underline">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/patient/register" className="block w-full bg-teal-600 text-white text-sm font-semibold px-5 py-3 rounded-lg text-center no-underline">
                    I'm a Patient — Sign Up
                  </Link>
                  <Link href="/doctor/login" className="block w-full bg-gray-100 text-gray-700 text-sm font-semibold px-5 py-3 rounded-lg text-center no-underline">
                    I'm a Doctor — Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/40 to-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 md:py-24 flex flex-col md:flex-row items-center gap-12 md:gap-16">
          <div className="flex-1 space-y-6 max-w-xl relative z-10">
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 text-[13px] font-semibold px-3.5 py-1.5 rounded-full tracking-wide">
              <HeartPulse className="w-3.5 h-3.5" />
              AI-Powered Healthcare Platform
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-bold leading-[1.1] text-gray-900 tracking-tight">
              Your Health,<br/>
              <span className="text-teal-600">Simplified.</span>
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed max-w-md">
              AI symptom triage, nearby hospital finder, medicine reminders, and personalized health calls — all in one secure platform.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
              {isLoggedIn ? (
                <Link href="/patient/dashboard" className="bg-teal-600 text-white text-sm font-semibold px-7 py-3.5 rounded-lg hover:bg-teal-700 transition-all inline-flex items-center gap-2 no-underline shadow-sm">
                  Go to Dashboard
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link href="/patient/register" className="bg-teal-600 text-white text-sm font-semibold px-7 py-3.5 rounded-lg hover:bg-teal-700 transition-all inline-flex items-center gap-2 no-underline shadow-sm w-full sm:w-auto justify-center">
                    I'm a Patient
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  <Link href="/doctor/login" className="bg-white text-gray-700 text-sm font-semibold px-7 py-3.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all inline-flex items-center gap-2 no-underline w-full sm:w-auto justify-center">
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    I'm a Doctor
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-2">
                {["A","S","R","P"].map((l, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-teal-50 border-2 border-white flex items-center justify-center text-teal-700 text-xs font-semibold">
                    {l}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5 mb-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-gray-500 font-medium">Trusted by 2,500+ Patients</p>
              </div>
            </div>
          </div>

          <div className="flex-1 relative w-full max-w-lg">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
              <Image src="/hero_doctors_1777712257459.png" alt="Team of healthcare professionals ready to assist you" fill className="object-cover" priority />
            </div>
            {/* Floating stat card: Active Doctors */}
            <div className="absolute -bottom-4 -left-4 sm:-bottom-5 sm:-left-5 bg-white rounded-xl shadow-lg p-3.5 flex items-center gap-3 border border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">150+</p>
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Active Doctors</p>
              </div>
            </div>
            {/* Floating stat card: 24/7 AI */}
            <div className="absolute -top-4 -right-4 sm:-top-5 sm:-right-5 bg-white rounded-xl shadow-lg p-3.5 flex items-center gap-3 border border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                <Bot className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">24/7</p>
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">AI Support</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section id="features" className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything You Need</h2>
          <p className="text-gray-500 max-w-md mx-auto">Comprehensive AI-powered tools to manage your health, all in one place.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Activity, title: "AI Symptom Triage", desc: "Describe your symptoms and get instant AI-powered guidance, home remedies, and specialist recommendations.", color: "text-teal-600", bg: "bg-teal-50", link: "/patient/triage" },
            { icon: Bot, title: "3D Health Avatar", desc: "Talk to a lifelike AI doctor avatar — type or use your voice for a natural health conversation.", color: "text-cyan-600", bg: "bg-cyan-50", link: "/patient/triage" },
            { icon: MapPin, title: "Hospital Finder", desc: "Locate nearby hospitals and clinics using your GPS, with ratings, distance, and instant directions.", color: "text-blue-600", bg: "bg-blue-50", link: "/patient/locate" },
            { icon: Pill, title: "Medicine Reminders", desc: "Never miss a dose — set smart reminders with refill tracking and adherence monitoring.", color: "text-emerald-600", bg: "bg-emerald-50", link: "/reminders" },
            { icon: Phone, title: "AI Health Calls", desc: "Schedule an AI-powered phone call for a personalized health checkup at any time that suits you.", color: "text-violet-600", bg: "bg-violet-50", link: "/patient/dashboard" },
            { icon: Clock, title: "Health Timeline", desc: "Track every triage, booking, and call in a clear medical history timeline — always accessible.", color: "text-amber-600", bg: "bg-amber-50", link: "/patient/history" },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all group">
                <div className={`w-12 h-12 flex items-center justify-center rounded-xl mb-5 ${feature.bg}`}>
                  <Icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500 mb-4">{feature.desc}</p>
                <Link href={feature.link} className="text-sm font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1 no-underline group-hover:gap-2 transition-all">
                  Try it now <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" className="bg-gray-50 py-24 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How We Help You</h2>
            <p className="text-gray-500 max-w-md mx-auto">From AI triage to finding the nearest hospital — your complete healthcare companion.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Activity, title: "AI Symptom Triage", desc: "Describe how you feel and our AI analyzes your symptoms to suggest home remedies and the right specialist to consult." },
              { icon: MapPin, title: "Find Nearby Hospitals", desc: "Real-time geolocation-based search to find the nearest hospitals and clinics with ratings, hours, and one-tap directions." },
              { icon: Clock, title: "Health Timeline", desc: "Track your complete medical history — every triage session, booking, AI call, and visit — in a clean, organized timeline." },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SPECIALITY BANNER ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-24">
        <div className="bg-gray-900 rounded-3xl p-8 sm:p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-teal-500/10 to-transparent" />
          <div className="relative z-10 max-w-lg">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.1] mb-5 tracking-tight">
              Your Health, <br/>Our Priority.
            </h2>
            <p className="text-gray-400 text-[15px] leading-relaxed mb-8">
              Get AI-powered health guidance 24/7. Find specialists, book appointments, and manage your medications — all from your phone.
            </p>
            <div className="flex flex-wrap gap-3">
              {isLoggedIn ? (
                <Link href="/patient/dashboard" className="bg-white text-gray-900 text-sm font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-all no-underline">
                  Open Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/patient/register" className="bg-teal-600 text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-teal-500 transition-all no-underline">
                    Get Started Free
                  </Link>
                  <Link href="/patient/login" className="border border-gray-700 text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-gray-800 transition-all no-underline">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="relative w-56 h-56 md:w-72 md:h-72 shrink-0 z-10">
            <Image src="/schedule_calendar_1777712287936.png" alt="Calendar showing easy appointment scheduling" fill className="object-contain" />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="bg-white py-24 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col md:flex-row items-center gap-12 md:gap-16">
          <div className="flex-1 relative max-w-sm">
            <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <Image src="/service_doctor_1777712272499.png" alt="Doctor providing consultation" width={400} height={500} className="object-cover w-full h-auto" />
            </div>
          </div>
          <div className="flex-1 space-y-8 max-w-lg">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Get Started in 3 Steps</h2>
            <div className="space-y-6">
              {[
                { step: "01", title: "Create Your Account", desc: "Sign up for free in under a minute with just your basic details." },
                { step: "02", title: "Describe Your Symptoms", desc: "Chat with our AI assistant or use voice — it will triage your situation instantly." },
                { step: "03", title: "Get Personalized Care", desc: "Receive specialist recommendations, book appointments, and set medicine reminders." },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-5">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-semibold text-xs shrink-0">{s.step}</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{s.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4">
              {isLoggedIn ? (
                <Link href="/patient/dashboard" className="text-sm font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1.5 no-underline">
                  Go to Dashboard <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link href="/patient/register" className="text-sm font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1.5 no-underline">
                  Get Started Now <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <span className="text-2xl font-bold tracking-tight">Amrit<span className="text-teal-400">Care</span> AI</span>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-gray-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#services" className="hover:text-white transition-colors">Services</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              <Link href="/patient/login" className="hover:text-white transition-colors no-underline">Patient Login</Link>
              <Link href="/doctor/login" className="hover:text-white transition-colors no-underline">Doctor Portal</Link>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm font-medium text-gray-500">© 2026 AmritCare AI. All rights reserved.</p>
            <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Secure • Private • HIPAA Compliant
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
