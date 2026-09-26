"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DoctorNavbar from "@/components/shared/DoctorNavbar";
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Phone,
  Check,
  ChevronDown,
  ChevronUp,
  Stethoscope,
} from "lucide-react";

interface Appointment {
  _id: string;
  patientId: { name: string; email: string };
  patientInfo: {
    name: string;
    age: number;
    phone: string;
    complaint: string;
  };
  slot: {
    day: string;
    time: string;
  };
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
}

export default function DoctorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated" || (session?.user as any)?.role !== "doctor") {
      router.push("/doctor/login");
      return;
    }
    fetchAppointments();
  }, [status, session, router]);

  const fetchAppointments = async () => {
    try {
      const res = await fetch("/api/appointments/doctor");
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      });
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((app) => (app._id === id ? { ...app, status: "confirmed" } : app))
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          <span className="text-sm font-medium">Verifying provider session...</span>
        </div>
      </div>
    );
  }

  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;
  const pendingCount = appointments.filter((a) => a.status === "pending").length;

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-100 flex flex-col">
      <DoctorNavbar doctorName={session?.user?.name || "Doctor"} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Clinical Appointments</h1>
            <p className="text-xs text-slate-400 mt-1">
              Manage incoming triage bookings and patient consultations
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold self-start sm:self-auto">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {new Date().toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900 border border-white/[0.08] rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Total Appointments
            </span>
            <p className="text-2xl font-bold text-white">{appointments.length}</p>
          </div>
          <div className="bg-slate-900 border border-white/[0.08] rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Confirmed / Active
            </span>
            <p className="text-2xl font-bold text-teal-400">{confirmedCount}</p>
          </div>
          <div className="bg-slate-900 border border-white/[0.08] rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Awaiting Review
            </span>
            <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
          </div>
        </div>

        {/* List of appointments */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-900 border border-white/[0.06] rounded-2xl p-6 animate-pulse space-y-3">
                <div className="h-4 bg-slate-800 rounded w-1/3" />
                <div className="h-3 bg-slate-800 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-slate-900 border border-white/[0.06] rounded-3xl p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-4 text-teal-400">
              <Stethoscope className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">No Consultations Scheduled</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You currently have no patient appointments booked for today.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((app) => {
              const isExpanded = expandedId === app._id;
              const isConfirmed = app.status === "confirmed";

              return (
                <div
                  key={app._id}
                  className={`bg-slate-900 border rounded-2xl transition-all overflow-hidden ${
                    isExpanded
                      ? "border-teal-500/40 ring-1 ring-teal-500/20 shadow-xl"
                      : "border-white/[0.08] hover:border-white/[0.14]"
                  }`}
                >
                  <div
                    className="p-5 sm:p-6 cursor-pointer flex items-center justify-between gap-4"
                    onClick={() => setExpandedId(isExpanded ? null : app._id)}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-300 font-bold text-base shrink-0">
                        <User className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-white text-base truncate">{app.patientInfo?.name}</h3>
                        <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{app.slot?.day}</span>
                          <span>•</span>
                          <span className="text-teal-400 font-semibold">{app.slot?.time}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                          isConfirmed
                            ? "bg-teal-500/15 text-teal-300 border-teal-500/30"
                            : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {app.status}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 bg-slate-950/40 border-t border-white/[0.06] animate-fade-in text-xs space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-900 border border-white/[0.06] rounded-xl p-3.5 space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Patient Info
                          </span>
                          <p className="text-slate-200">
                            Age: <span className="font-semibold text-white">{app.patientInfo?.age || "—"}</span> | Phone:{" "}
                            <span className="font-semibold text-white">{app.patientInfo?.phone || "—"}</span>
                          </p>
                        </div>

                        <div className="bg-slate-900 border border-white/[0.06] rounded-xl p-3.5 space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Chief Complaint
                          </span>
                          <p className="text-slate-300 leading-relaxed italic">
                            "{app.patientInfo?.complaint || "No chief complaint recorded"}"
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        {app.status === "pending" && (
                          <button
                            onClick={() => markComplete(app._id)}
                            className="btn-primary text-xs py-2 px-4 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Confirm Consultation
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
