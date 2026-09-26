"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Navbar from "@/components/shared/Navbar";
import SeverityBadge from "@/components/shared/SeverityBadge";
import EmptyState from "@/components/shared/EmptyState";
import {
  Calendar,
  Clock,
  Building2,
  Bot,
  Phone,
  User,
  ChevronDown,
  ChevronUp,
  FileText,
  Activity,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function groupByMonth(items) {
  const groups = {};
  for (const item of items) {
    const key = new Date(item.date).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return Object.entries(groups);
}

export default function PatientHistoryPage() {
  const [expandedId, setExpandedId] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [patient, setPatient] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCalls, setTotalCalls] = useState(0);
  const [refillCount, setRefillCount] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const stored = JSON.parse(sessionStorage.getItem("medconnect_patient") || "null");
        if (!stored?.id) {
          setLoading(false);
          return;
        }

        const [profileRes, triageRes, bookingRes, callRes] = await Promise.all([
          fetch(`/api/patient/profile?patientId=${stored.id}`),
          fetch(`/api/triage?patientId=${stored.id}`),
          fetch(`/api/bookings?patientId=${stored.id}`),
          fetch(`/api/calls?patientId=${stored.id}`),
        ]);

        const profileData = await profileRes.json();
        const triageData = await triageRes.json();
        const bookingData = await bookingRes.json();
        const callData = await callRes.json();

        fetch(`/api/reminders?patientId=${stored.id}`)
          .then((res) => res.json())
          .then((data) => {
            const meds = data.reminders || [];
            const count = meds.filter(
              (m) =>
                m.remainingQuantity <=
                m.tabletsPerDose * m.refillAlertDays * (m.times?.length || m.dailyDoses || 1)
            ).length;
            setRefillCount(count);
          })
          .catch((err) => console.error(err));

        if (profileData.patient) {
          setPatient(profileData.patient);
        }

        const entries = [];

        for (const t of triageData.triages || []) {
          entries.push({
            id: t._id,
            type: "triage",
            date: t.createdAt,
            title: t.title || "AI Clinical Assessment",
            severity: t.severity || "info",
            symptoms: t.symptoms || [],
            transcript: t.transcript || [],
            recommendation: t.recommendation || "",
            lang: t.lang || "en",
          });
        }

        for (const b of bookingData.bookings || []) {
          entries.push({
            id: b._id,
            type: "booking",
            date: b.createdAt,
            title: `Appointment — ${b.facilityName}`,
            facility: b.facilityName,
            address: b.address || "",
            department: b.department || "General",
            status: b.status || "upcoming",
            rating: b.rating,
            notes: b.notes || "",
          });
        }

        for (const c of callData.calls || []) {
          entries.push({
            id: c._id,
            type: "call",
            date: c.scheduledAt,
            title: "AI Health Checkup Call",
            callStatus: c.status,
            severity: c.severity,
            summary: c.summary || "",
            notes: c.notes || "",
          });
        }
        setTotalCalls((callData.calls || []).length);

        entries.sort((a, b) => new Date(b.date) - new Date(a.date));
        setTimeline(entries);
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filtered = timeline.filter(
    (e) => filterType === "all" || e.type === filterType
  );
  const grouped = groupByMonth(filtered);

  const totalTriages = timeline.filter((e) => e.type === "triage").length;
  const totalBookings = timeline.filter((e) => e.type === "booking").length;
  const completedVisits = timeline.filter((e) => e.type === "booking" && e.status === "completed").length;

  const patientName = patient ? `${patient.firstName} ${patient.lastName}` : "Patient";
  const patientAvatar = patient ? `${patient.firstName?.[0] || ""}${patient.lastName?.[0] || ""}` : "PT";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 has-bottom-nav">
      <Navbar refillCount={refillCount} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8">
        {/* ── LEFT SIDEBAR — Patient Profile ── */}
        <aside className="lg:w-80 shrink-0 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="w-16 h-16 rounded-2xl skeleton mx-auto" />
                <div className="h-5 skeleton rounded w-3/4 mx-auto" />
                <div className="h-3 skeleton rounded w-1/2 mx-auto" />
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 skeleton rounded-xl" />
                  ))}
                </div>
              </div>
            ) : !patient ? (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm mb-4">Please log in to view clinical history.</p>
                <Link href="/patient/login" className="btn-primary text-sm px-5 py-2">
                  Sign In
                </Link>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center mb-3">
                    <span className="text-xl font-bold text-teal-700">{patientAvatar}</span>
                  </div>
                  <h1 className="text-lg font-bold text-gray-900">{patientName}</h1>
                  <p className="text-xs text-gray-500 mt-0.5">{patient.email}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 text-center">
                    <span className="text-[11px] text-gray-400 font-semibold block">Age</span>
                    <span className="text-sm font-bold text-gray-800">{patient.age || "—"}</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 text-center">
                    <span className="text-[11px] text-gray-400 font-semibold block">Blood</span>
                    <span className="text-sm font-bold text-rose-600">{patient.blood || "—"}</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 text-center">
                    <span className="text-[11px] text-gray-400 font-semibold block">Member</span>
                    <span className="text-xs font-bold text-gray-700">
                      {new Date(patient.createdAt).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Bot className="w-4 h-4 text-teal-600" />
                      <span>AI Triages</span>
                    </div>
                    <span className="font-bold text-gray-900">{totalTriages}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building2 className="w-4 h-4 text-teal-600" />
                      <span>Bookings</span>
                    </div>
                    <span className="font-bold text-gray-900">{totalBookings}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Visits Completed</span>
                    </div>
                    <span className="font-bold text-emerald-700">{completedVisits}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4 text-teal-600" />
                      <span>AI Checkup Calls</span>
                    </div>
                    <span className="font-bold text-gray-900">{totalCalls}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Link href="/patient/triage" className="btn-primary w-full text-sm py-2.5 shadow-sm text-center">
                    New AI Triage Session
                  </Link>
                  <Link href="/patient/locate" className="btn-secondary w-full text-sm py-2.5 text-center">
                    Find Nearby Hospital
                  </Link>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* ── MAIN — Timeline ── */}
        <section className="flex-1 min-w-0 bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Clinical Timeline</h2>
              <p className="text-xs text-gray-500 mt-0.5">Chronological record of triages, bookings, and calls</p>
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {[
                { value: "all", label: "All Records" },
                { value: "triage", label: "Triages" },
                { value: "booking", label: "Bookings" },
                { value: "call", label: "Calls" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilterType(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    filterType === opt.value
                      ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 pt-6">
            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-5 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
                    <div className="h-4 skeleton w-1/3" />
                    <div className="h-3 skeleton w-1/4" />
                    <div className="h-10 skeleton w-full rounded-lg" />
                  </div>
                ))}
              </div>
            )}

            {!loading && timeline.length === 0 && (
              <EmptyState
                icon="calendar"
                title="No Clinical History Yet"
                description="Your medical consultations, triage assessments, and facility bookings will appear on this interactive timeline."
                action={
                  <Link href="/patient/triage" className="btn-primary text-sm px-5 py-2.5">
                    Start Your First AI Triage
                  </Link>
                }
              />
            )}

            {!loading &&
              grouped.map(([monthLabel, items]) => (
                <div key={monthLabel} className="mb-8 last:mb-0">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
                      {monthLabel}
                    </span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200">
                    {items.map((entry) => {
                      const isExpanded = expandedId === entry.id;
                      const isTriage = entry.type === "triage";
                      const isCall = entry.type === "call";

                      return (
                        <div key={entry.id} className="relative">
                          {/* Dot on vertical line */}
                          <div className="absolute -left-[27px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white bg-teal-600 shadow-sm z-10" />

                          <div
                            onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                            className={`bg-white rounded-xl p-5 border transition-all cursor-pointer hover:shadow-md ${
                              isExpanded
                                ? "border-teal-500 ring-2 ring-teal-500/10 shadow-sm"
                                : "border-gray-200 hover:border-gray-300 shadow-sm"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0">
                                  {isCall ? (
                                    <Phone className="w-5 h-5" />
                                  ) : isTriage ? (
                                    <Bot className="w-5 h-5" />
                                  ) : (
                                    <Building2 className="w-5 h-5" />
                                  )}
                                </div>
                                <div>
                                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">{entry.title}</h3>
                                  <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5 mt-0.5">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(entry.date)} at {formatTime(entry.date)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {isTriage && entry.severity && (
                                  <SeverityBadge severity={entry.severity} />
                                )}
                                {!isTriage && !isCall && entry.status && (
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                      entry.status === "completed"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-teal-50 text-teal-700 border-teal-200"
                                    }`}
                                  >
                                    {entry.status}
                                  </span>
                                )}
                                {isCall && (
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                      entry.callStatus === "completed"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-gray-100 text-gray-700 border-gray-200"
                                    }`}
                                  >
                                    {entry.callStatus}
                                  </span>
                                )}
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                            </div>

                            {/* Symptoms Pills */}
                            {isTriage && entry.symptoms?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {entry.symptoms.map((s, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-md text-xs font-medium"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Recommendation / Summary preview */}
                            {isTriage && entry.recommendation && (
                              <div className="mt-3 p-3 rounded-lg bg-teal-50/70 border border-teal-200/80 text-xs text-teal-900 leading-relaxed font-medium">
                                💊 {entry.recommendation.slice(0, 160)}
                                {entry.recommendation.length > 160 ? "..." : ""}
                              </div>
                            )}

                            {isCall && entry.summary && (
                              <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700 leading-relaxed">
                                📋 {entry.summary.slice(0, 160)}
                                {entry.summary.length > 160 ? "..." : ""}
                              </div>
                            )}

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 animate-fade-in text-xs">
                                {isTriage && entry.transcript?.length > 0 && (
                                  <div>
                                    <span className="font-bold text-gray-700 uppercase tracking-wider block mb-2 text-[10px]">
                                      Consultation Transcript Excerpt
                                    </span>
                                    <div className="space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                      {entry.transcript.map((msg, idx) => (
                                        <div
                                          key={idx}
                                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                        >
                                          <div
                                            className={`max-w-[85%] rounded-lg p-2 leading-relaxed ${
                                              msg.role === "user"
                                                ? "bg-teal-600 text-white"
                                                : "bg-white border border-gray-200 text-gray-800"
                                            }`}
                                          >
                                            {msg.text}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {!isTriage && !isCall && (
                                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                    <div>
                                      <span className="text-gray-400 font-semibold block text-[10px] uppercase">
                                        Department
                                      </span>
                                      <span className="font-bold text-gray-800">{entry.department}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400 font-semibold block text-[10px] uppercase">
                                        Facility
                                      </span>
                                      <span className="font-bold text-gray-800">{entry.facility}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </section>
      </main>
    </div>
  );
}
