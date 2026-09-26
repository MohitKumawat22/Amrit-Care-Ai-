"use client";

import { useState, useEffect, useCallback } from "react";
import SeverityBadge from "@/components/shared/SeverityBadge";
import {
  Phone,
  Calendar,
  Clock,
  User,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Repeat,
} from "lucide-react";

/* ─── Status Config ─── */
const STATUS_CONFIG = {
  scheduled: { label: "Scheduled", color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200", dot: "bg-teal-500" },
  "in-progress": { label: "In Progress", color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200", dot: "bg-teal-500 animate-pulse" },
  completed: { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
  failed: { label: "Failed", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200", dot: "bg-rose-500" },
  cancelled: { label: "Cancelled", color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200", dot: "bg-gray-400" },
};

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const RECURRENCE_OPTIONS = [
  { value: "one-time", label: "One-Time" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

function ScheduleForm({ patientId, onScheduled }) {
  const [datetime, setDatetime] = useState("");
  const [notes, setNotes] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [recurrence, setRecurrence] = useState("one-time");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [twilioWarning, setTwilioWarning] = useState("");

  const minDatetime = (() => {
    const d = new Date(Date.now() + 5 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!datetime) return setError("Please select a call date and time.");
    if (!phone.trim()) return setError("Please enter a valid mobile number.");

    setLoading(true);
    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          scheduledAt: new Date(datetime).toISOString(),
          notes,
          recurrence,
          overridePhone: phone.trim().startsWith("+") ? phone.trim() : `+91${phone.trim()}`,
          overrideName: name.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to schedule call.");
      setDatetime("");
      setNotes("");
      setPhone("");
      setName("");
      setRecurrence("one-time");
      if (data.warning) setTwilioWarning(data.warning);
      onScheduled(data.call);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label htmlFor="call-patient-name" className="block text-xs font-semibold text-gray-700 mb-1.5">
            Patient Name (Optional)
          </label>
          <input
            id="call-patient-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
            className="input-field py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="call-phone" className="block text-xs font-semibold text-gray-700 mb-1.5">
            Mobile Number <span className="text-rose-500">*</span>
          </label>
          <input
            id="call-phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="input-field py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="call-time" className="block text-xs font-semibold text-gray-700 mb-1.5">
          When should we call? *
        </label>
        <input
          id="call-time"
          type="datetime-local"
          required
          value={datetime}
          min={minDatetime}
          onChange={(e) => setDatetime(e.target.value)}
          className="input-field py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Frequency / Repeat</label>
        <div className="flex gap-2">
          {RECURRENCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRecurrence(opt.value)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                recurrence === opt.value
                  ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="call-notes" className="block text-xs font-semibold text-gray-700 mb-1.5">
          Notes / Context for the AI Doctor (Optional)
        </label>
        <textarea
          id="call-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="e.g. Follow-up on recent blood test, headache checks..."
          className="input-field py-2 text-sm resize-none"
        />
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {twilioWarning && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          <strong>Notice:</strong> {twilioWarning}
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 shadow-sm text-sm">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Scheduling Call...
          </span>
        ) : (
          "Confirm & Schedule Call"
        )}
      </button>
    </form>
  );
}

function CallCard({ call, onCancel }) {
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const st = STATUS_CONFIG[call.status] || STATUS_CONFIG.scheduled;

  const handleCancel = async (e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to cancel this scheduled checkup call?")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/calls?id=${call._id}`, { method: "DELETE" });
      if (res.ok) onCancel(call._id);
    } catch (err) {
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm transition-all overflow-hidden">
      <div className="p-4 cursor-pointer hover:bg-gray-50/50" onClick={() => setExpanded((p) => !p)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-bold text-gray-900 truncate">
                {call.overrideName ? call.overrideName : "AI Health Consultation"}
              </span>

              {call.recurrence && call.recurrence !== "one-time" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                  <Repeat className="w-3 h-3" />
                  {call.recurrence}
                </span>
              )}

              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${st.bg} ${st.color} ${st.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
            </div>

            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDateTime(call.scheduledAt)}
            </p>

            {call.overridePhone && (
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {call.overridePhone}
              </p>
            )}

            {call.notes && (
              <p className="text-xs text-gray-500 mt-1 truncate italic">
                "{call.notes}"
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {call.severity && call.status === "completed" && (
              <SeverityBadge severity={call.severity} />
            )}
            {call.status === "scheduled" && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="text-xs text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg transition-colors font-medium"
              >
                {cancelling ? "..." : "Cancel"}
              </button>
            )}
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>
      </div>

      {expanded && call.status === "completed" && call.summary && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block pt-3">
            Call Summary & Findings
          </span>
          <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3 border border-gray-200">
            {call.summary}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ScheduleCall({ patientId }) {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchCalls = useCallback(async () => {
    if (!patientId) return;
    try {
      const res = await fetch(`/api/calls?patientId=${patientId}`);
      const data = await res.json();
      setCalls(data.calls || []);
    } catch (err) {
      console.error("Failed to load calls:", err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchCalls();
    const interval = setInterval(fetchCalls, 30_000);
    return () => clearInterval(interval);
  }, [fetchCalls]);

  const handleScheduled = (newCall) => {
    setCalls((prev) => [newCall, ...prev]);
    setShowForm(false);
    setSuccessMsg("Call scheduled! AmritCare AI will call you at your selected time.");
    setTimeout(() => setSuccessMsg(""), 5000);
  };

  const handleCancel = (id) => {
    setCalls((prev) => prev.map((c) => (c._id === id ? { ...c, status: "cancelled" } : c)));
  };

  const upcoming = calls.filter((c) => ["scheduled", "in-progress"].includes(c.status));
  const past = calls.filter((c) => ["completed", "failed", "cancelled"].includes(c.status));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">AI Health Calls</h2>
            <p className="text-xs text-gray-400">Personalized phone consultation checkups</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm((p) => !p)}
          className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition-all ${
            showForm
              ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
              : "btn-primary shadow-sm"
          }`}
        >
          {showForm ? "✕ Close" : "+ Schedule Call"}
        </button>
      </div>

      <div className="p-5 space-y-4">
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {showForm && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5 animate-slide-up">
            <ScheduleForm patientId={patientId} onScheduled={handleScheduled} />
          </div>
        )}

        {upcoming.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">
              Upcoming Calls
            </h3>
            <div className="space-y-2.5">
              {upcoming.map((call) => (
                <CallCard key={call._id} call={call} onCancel={handleCancel} />
              ))}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">
              Past Calls & Transcripts
            </h3>
            <div className="space-y-2.5">
              {past.map((call) => (
                <CallCard key={call._id} call={call} onCancel={handleCancel} />
              ))}
            </div>
          </div>
        )}

        {!loading && calls.length === 0 && !showForm && (
          <div className="text-center py-6">
            <p className="text-xs text-gray-500 mb-3">No scheduled AI checkup calls.</p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-secondary text-xs px-4 py-2"
            >
              Schedule a Health Call
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
