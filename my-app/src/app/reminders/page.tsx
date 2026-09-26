"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import EmptyState from "@/components/shared/EmptyState";
import {
  Pill,
  Plus,
  Bell,
  BellOff,
  Trash2,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
  Check,
} from "lucide-react";

interface Reminder {
  _id: string;
  medicineName: string;
  medicineType: string;
  dosage: string;
  frequency: string;
  times: string[];
  totalQuantity: number;
  remainingQuantity: number;
  tabletsPerDose: number;
  refillAlertDays: number;
  startDate: string;
  isActive: boolean;
  notes?: string;
}

export default function RemindersPage() {
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");

  const [formData, setFormData] = useState({
    medicineName: "",
    medicineType: "tablet",
    dosage: "",
    frequency: "once_daily",
    times: ["08:00"],
    totalQuantity: 30,
    tabletsPerDose: 1,
    refillAlertDays: 2,
    startDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    const stored = JSON.parse(sessionStorage.getItem("medconnect_patient") || "null");
    if (!stored?.id) {
      router.push("/patient/login");
      return;
    }
    setPatient(stored);
    fetchReminders(stored.id);
  }, [router]);

  const fetchReminders = async (patientId: string) => {
    try {
      const res = await fetch(`/api/reminders?patientId=${patientId}`);
      const data = await res.json();
      setReminders(data.reminders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refillCount = reminders.filter(
    (m) => m.remainingQuantity <= m.tabletsPerDose * m.refillAlertDays * (m.times?.length || 1)
  ).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          patientName: `${patient.firstName} ${patient.lastName}`,
          patientId: patient.id,
        }),
      });
      if (res.ok) {
        setShowAdd(false);
        fetchReminders(patient.id);
        setActionSuccess("Medicine reminder created!");
        setTimeout(() => setActionSuccess(""), 4000);
        setFormData({
          medicineName: "",
          medicineType: "tablet",
          dosage: "",
          frequency: "once_daily",
          times: ["08:00"],
          totalQuantity: 30,
          tabletsPerDose: 1,
          refillAlertDays: 2,
          startDate: new Date().toISOString().split("T")[0],
          notes: "",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleReminder = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/reminders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      fetchReminders(patient.id);
      setActionSuccess(currentStatus ? "Reminder muted" : "Reminder activated");
      setTimeout(() => setActionSuccess(""), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteReminder = async (id: string) => {
    if (!confirm("Are you sure you want to remove this reminder?")) return;
    try {
      const res = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchReminders(patient.id);
        setActionSuccess("Reminder removed");
        setTimeout(() => setActionSuccess(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!patient) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 has-bottom-nav">
      <Navbar refillCount={refillCount} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
              <Pill className="w-6 h-6 text-teal-600" />
              Medicine Reminders
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Track daily dosage, schedules, and automatic refill alerts
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setShowAdd(true)} className="btn-primary py-2.5 px-4 shadow-sm">
              <Plus className="w-4 h-4" />
              Add Medicine
            </button>
          </div>
        </div>

        {/* Action toast */}
        {actionSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2.5 animate-slide-up shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {actionSuccess}
          </div>
        )}

        {/* Quick summary stats */}
        {reminders.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Prescriptions</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {reminders.filter((m) => m.isActive).length}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Daily Scheduled Doses</span>
              <p className="text-2xl font-bold text-teal-700 mt-1">
                {reminders.reduce((acc, curr) => acc + (curr.isActive ? curr.times.length : 0), 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Refills Required</span>
              <p className={`text-2xl font-bold mt-1 ${refillCount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                {refillCount}
              </p>
            </div>
          </div>
        )}

        {/* List Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-3">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 skeleton w-1/2" />
                    <div className="h-3 skeleton w-1/3" />
                  </div>
                </div>
                <div className="h-6 skeleton w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : reminders.length === 0 ? (
          <EmptyState
            icon="add"
            title="No Reminders Set"
            description="Keep your medications on track. Add your prescriptions and AmritCare AI will notify you at your scheduled dosage times."
            action={
              <button onClick={() => setShowAdd(true)} className="btn-primary text-sm px-5 py-2.5">
                <Plus className="w-4 h-4" />
                Add Your First Medicine
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {reminders.map((med) => {
              const percentLeft = Math.round((med.remainingQuantity / med.totalQuantity) * 100);
              const isLowStock =
                med.remainingQuantity <= med.tabletsPerDose * med.refillAlertDays * (med.times?.length || 1);

              return (
                <div
                  key={med._id}
                  className={`bg-white rounded-2xl p-6 border transition-all shadow-sm hover:shadow-md ${
                    med.isActive ? "border-gray-200" : "border-gray-200/60 bg-gray-50/50 opacity-70"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-2xl text-teal-700">
                        {med.medicineType === "tablet" ? "💊" : med.medicineType === "syrup" ? "🧪" : "💊"}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">{med.medicineName}</h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                          {med.dosage} • {med.frequency.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleReminder(med._id, med.isActive)}
                        className={`p-2 rounded-lg transition-colors border ${
                          med.isActive
                            ? "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"
                            : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200"
                        }`}
                        title={med.isActive ? "Mute notifications" : "Enable notifications"}
                        aria-label={med.isActive ? "Mute reminder" : "Enable reminder"}
                      >
                        {med.isActive ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteReminder(med._id)}
                        className="p-2 rounded-lg bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 border border-gray-200 transition-colors"
                        title="Delete reminder"
                        aria-label="Delete reminder"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Scheduled Times */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {med.times.map((t, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700"
                      >
                        <Clock className="w-3 h-3 text-teal-600" />
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Stock progress */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                        <span>Supply</span>
                        <span className={isLowStock ? "text-rose-600 font-bold" : "text-gray-500"}>
                          {med.remainingQuantity} / {med.totalQuantity} units
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isLowStock ? "bg-rose-500" : "bg-teal-600"
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, percentLeft))}%` }}
                        />
                      </div>
                    </div>

                    {isLowStock && (
                      <span className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md shrink-0">
                        Refill Needed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4" role="dialog" aria-label="Add new medicine">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 animate-slide-up max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                    <Pill className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Add Medicine Reminder</h2>
                </div>
                <button
                  onClick={() => setShowAdd(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="medName" className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Medicine Name *
                    </label>
                    <input
                      id="medName"
                      required
                      value={formData.medicineName}
                      onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                      className="input-field"
                      placeholder="e.g. Metformin, Paracetamol"
                    />
                  </div>

                  <div>
                    <label htmlFor="medType" className="block text-sm font-semibold text-gray-700 mb-1.5">Type</label>
                    <select
                      id="medType"
                      value={formData.medicineType}
                      onChange={(e) => setFormData({ ...formData, medicineType: e.target.value })}
                      className="input-field cursor-pointer"
                    >
                      <option value="tablet">Tablet</option>
                      <option value="capsule">Capsule</option>
                      <option value="syrup">Syrup</option>
                      <option value="injection">Injection</option>
                      <option value="drops">Drops</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="medDosage" className="block text-sm font-semibold text-gray-700 mb-1.5">Dosage *</label>
                    <input
                      id="medDosage"
                      required
                      value={formData.dosage}
                      onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                      className="input-field"
                      placeholder="e.g. 500mg, 10ml"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Frequency</label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {["once_daily", "twice_daily", "thrice_daily"].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => {
                          const times =
                            f === "once_daily"
                              ? ["08:00"]
                              : f === "twice_daily"
                              ? ["08:00", "20:00"]
                              : ["08:00", "14:00", "20:00"];
                          setFormData({ ...formData, frequency: f, times });
                        }}
                        className={`py-2 px-1 rounded-lg text-xs font-semibold border transition-all ${
                          formData.frequency === f
                            ? "border-teal-600 bg-teal-600 text-white shadow-sm"
                            : "border-gray-200 bg-white text-gray-600 hover:border-teal-300 hover:text-teal-700"
                        }`}
                      >
                        {f.replace(/_/g, " ").toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {formData.times.map((time, idx) => (
                      <div key={idx}>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                          Dose {idx + 1}
                        </label>
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => {
                            const newTimes = [...formData.times];
                            newTimes[idx] = e.target.value;
                            setFormData({ ...formData, times: newTimes });
                          }}
                          className="input-field py-1.5 px-2 text-sm text-center font-medium"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="totalQty" className="block text-sm font-semibold text-gray-700 mb-1.5">Total Quantity</label>
                    <input
                      id="totalQty"
                      type="number"
                      value={isNaN(formData.totalQuantity) ? "" : formData.totalQuantity}
                      onChange={(e) =>
                        setFormData({ ...formData, totalQuantity: parseInt(e.target.value) || 0 })
                      }
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label htmlFor="tabPerDose" className="block text-sm font-semibold text-gray-700 mb-1.5">Units Per Dose</label>
                    <input
                      id="tabPerDose"
                      type="number"
                      value={formData.tabletsPerDose || 1}
                      onChange={(e) =>
                        setFormData({ ...formData, tabletsPerDose: parseInt(e.target.value) || 1 })
                      }
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="refillDays" className="block text-sm font-semibold text-gray-700 mb-1.5">Refill Alert (Days)</label>
                    <input
                      id="refillDays"
                      type="number"
                      value={formData.refillAlertDays || 2}
                      onChange={(e) =>
                        setFormData({ ...formData, refillAlertDays: parseInt(e.target.value) || 2 })
                      }
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date</label>
                    <input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary w-full py-3 mt-4">
                  Save Medicine Reminder
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
