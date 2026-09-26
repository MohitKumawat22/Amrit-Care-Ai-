"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Heart,
  Pill,
  Shield,
  Stethoscope,
  User,
  Zap,
  AlertTriangle,
  Activity,
  Globe2,
  CheckCircle2,
} from "lucide-react";

interface PatientData {
  id: string;
  name: string;
  age: number;
  gender: string;
  severity: "critical" | "high" | "medium" | "low";
  triageScore: number;
  originalLanguage: string;
  originalSymptoms: string[];
  translatedSymptoms: string[];
  aiSummary: string;
  timestamp: string;
  vitalSigns: { label: string; value: string; status: string };
  location: string;
}

interface Props {
  patient: PatientData;
  onBack: () => void;
}

const PAST_DIAGNOSES = [
  { date: "2026-03-15", diagnosis: "Acute Bronchitis", doctor: "Dr. Mehta", status: "Resolved" },
  { date: "2025-11-02", diagnosis: "Type 2 Diabetes — Monitoring", doctor: "Dr. Singh", status: "Ongoing" },
  { date: "2025-08-20", diagnosis: "Hypertension Stage 1", doctor: "Dr. Rajan", status: "Managed" },
  { date: "2025-04-10", diagnosis: "Seasonal Allergic Rhinitis", doctor: "Dr. Patel", status: "Resolved" },
];

const PAST_TRIAGE = [
  { date: "2026-03-15", score: 45, severity: "medium" as const, chief: "Persistent cough, mild fever", outcome: "Antibiotics prescribed" },
  { date: "2025-11-02", score: 62, severity: "high" as const, chief: "Excessive thirst, frequent urination", outcome: "HbA1c ordered, Metformin started" },
  { date: "2025-08-20", score: 55, severity: "medium" as const, chief: "Headaches, elevated BP readings", outcome: "Amlodipine 5mg initiated" },
];

const MEDICATIONS = [
  { name: "Metformin 500mg", frequency: "Twice daily", prescriber: "Dr. Singh", since: "Nov 2025", active: true },
  { name: "Amlodipine 5mg", frequency: "Once daily", prescriber: "Dr. Rajan", since: "Aug 2025", active: true },
  { name: "Cetirizine 10mg", frequency: "As needed", prescriber: "Dr. Patel", since: "Apr 2025", active: false },
  { name: "Amoxicillin 500mg", frequency: "Three times daily", prescriber: "Dr. Mehta", since: "Mar 2026", active: false },
];

const sevColors: Record<string, { badge: string; dot: string }> = {
  critical: { badge: "bg-rose-500/20 text-rose-300 border-rose-500/30", dot: "bg-rose-500" },
  high: { badge: "bg-orange-500/20 text-orange-300 border-orange-500/30", dot: "bg-orange-500" },
  medium: { badge: "bg-amber-500/20 text-amber-300 border-amber-500/30", dot: "bg-amber-500" },
  low: { badge: "bg-teal-500/20 text-teal-300 border-teal-500/30", dot: "bg-teal-500" },
};

export default function PatientHistoryView({ patient, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "diagnoses" | "triage" | "meds">("overview");
  const sev = sevColors[patient.severity] || sevColors.low;

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-100 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Back navigation */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-6 group transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Provider Appointments
        </button>

        {/* Patient Header Card */}
        <div className="bg-slate-900 border border-white/[0.08] rounded-3xl p-6 sm:p-8 mb-6 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 text-xl font-bold">
                {patient.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h1 className="text-2xl font-bold text-white tracking-tight">{patient.name}</h1>
                  <span className={`text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${sev.badge}`}>
                    {patient.severity.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{patient.id}</span>
                  <span>•</span>
                  <span>{patient.age}y {patient.gender}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Globe2 className="w-3 h-3" />
                    {patient.originalLanguage}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-white/[0.08] pt-4 md:pt-0 md:pl-6">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Triage Score</p>
                <p className="text-2xl font-bold text-white">{patient.triageScore}/100</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Location</p>
                <p className="text-xs font-semibold text-slate-300">{patient.location}</p>
              </div>
            </div>
          </div>

          {/* AI Clinical Summary Bar */}
          <div className="mt-6 bg-teal-500/10 border border-teal-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Zap className="w-4 h-4 text-teal-400" />
              <span className="text-xs uppercase tracking-wider text-teal-400 font-bold">
                Automated Clinical Assessment
              </span>
            </div>
            <p className="text-xs text-teal-200/90 leading-relaxed">{patient.aiSummary}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-6 border-b border-white/[0.06] pb-3">
          {[
            { id: "overview", label: "Comprehensive View" },
            { id: "diagnoses", label: "Past Diagnoses" },
            { id: "triage", label: "Triage History" },
            { id: "meds", label: "Prescriptions" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(activeTab === "overview" || activeTab === "diagnoses") && (
            <div className="bg-slate-900 border border-white/[0.08] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">Past Diagnoses</h2>
              </div>
              <div className="space-y-3">
                {PAST_DIAGNOSES.map((d, i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-xs font-bold text-white">{d.diagnosis}</h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300">
                        {d.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-1">
                      <span>{d.date}</span>
                      <span>•</span>
                      <span>{d.doctor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(activeTab === "overview" || activeTab === "triage") && (
            <div className="bg-slate-900 border border-white/[0.08] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                  <Activity className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">Triage History</h2>
              </div>
              <div className="space-y-3">
                {PAST_TRIAGE.map((t, i) => {
                  const tc = sevColors[t.severity] || sevColors.low;
                  return (
                    <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${tc.dot}`} />
                          <span className="text-xs font-bold text-white">Score: {t.score}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${tc.badge}`}>
                            {t.severity.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">{t.date}</span>
                      </div>
                      <p className="text-xs text-slate-300 mb-1">
                        <span className="text-slate-500 font-semibold">Chief:</span> {t.chief}
                      </p>
                      <p className="text-xs text-slate-300">
                        <span className="text-slate-500 font-semibold">Outcome:</span> {t.outcome}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(activeTab === "overview" || activeTab === "meds") && (
            <div className="lg:col-span-2 bg-slate-900 border border-white/[0.08] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                  <Pill className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">Active Prescriptions</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Medication</th>
                      <th className="py-2.5 px-3">Frequency</th>
                      <th className="py-2.5 px-3">Prescriber</th>
                      <th className="py-2.5 px-3">Since</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {MEDICATIONS.map((m, i) => (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 text-white font-semibold">{m.name}</td>
                        <td className="py-2.5 px-3 text-slate-300">{m.frequency}</td>
                        <td className="py-2.5 px-3 text-slate-300">{m.prescriber}</td>
                        <td className="py-2.5 px-3 text-slate-400">{m.since}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              m.active
                                ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                                : "bg-slate-700/40 text-slate-400"
                            }`}
                          >
                            {m.active ? "Active" : "Completed"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
