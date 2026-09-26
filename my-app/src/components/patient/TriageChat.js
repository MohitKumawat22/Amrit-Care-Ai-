"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AvatarScene } from "@/components/AvatarScene";
import { useAvatarChat } from "@/hooks/useAvatarChat";
import { useVoiceConversation } from "@/hooks/useVoiceConversation";
import {
  Globe,
  Mic,
  MicOff,
  Send,
  Calendar,
  Phone,
  Bot,
  User,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English", greeting: "Hello! I'm your AI health assistant." },
  { code: "hi", label: "हिन्दी", greeting: "नमस्ते! मैं आपका AI स्वास्थ्य सहायक हूँ।" },
  { code: "es", label: "Español", greeting: "¡Hola! Soy tu asistente de salud con IA." },
];

const DOCTORS = [
  { id: 1, name: "Dr. Priya Sharma", specialty: "Cardiologist", fee: "₹500", avatar: "PS", slots: ["10:00 AM", "11:30 AM", "2:00 PM", "4:30 PM"] },
  { id: 2, name: "Dr. Rajesh Kumar", specialty: "Neurologist", fee: "₹700", avatar: "RK", slots: ["9:00 AM", "12:00 PM", "3:00 PM"] },
  { id: 3, name: "Dr. Anita Desai", specialty: "Dermatologist", fee: "₹400", avatar: "AD", slots: ["10:30 AM", "1:00 PM", "3:30 PM", "5:00 PM"] },
  { id: 4, name: "Dr. Vikram Singh", specialty: "Orthopedic", fee: "₹600", avatar: "VS", slots: ["9:00 AM", "11:00 AM"] },
  { id: 5, name: "Dr. Meera Patel", specialty: "Pediatrician", fee: "₹450", avatar: "MP", slots: ["9:30 AM", "11:00 AM", "2:30 PM"] },
  { id: 6, name: "Dr. Arjun Mehta", specialty: "General Physician", fee: "₹300", avatar: "AM", slots: ["10:00 AM", "12:30 PM", "4:00 PM", "5:30 PM"] },
];

/* ── Booking Modal ── */
function BookingModal({ doctor, onClose, onConfirm }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose} role="dialog" aria-label="Book appointment">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-7 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Book Appointment</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors" aria-label="Close modal">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-5 p-4 bg-gray-50 border border-gray-200/80 rounded-xl">
          <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-base">
            {doctor.avatar}
          </div>
          <div>
            <h4 className="font-bold text-gray-900">{doctor.name}</h4>
            <p className="text-sm text-gray-500">{doctor.specialty} • <span className="font-semibold text-teal-700">{doctor.fee}</span></p>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="modal-book-date" className="block text-sm font-semibold text-gray-700 mb-1.5">Select Date</label>
          <input id="modal-book-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="input-field" />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Available Slots</label>
          <div className="grid grid-cols-3 gap-2">
            {doctor.slots.map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all border ${
                  selectedSlot === slot
                    ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-600"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        <button
          disabled={!selectedSlot}
          onClick={() => onConfirm({ doctor, date, slot: selectedSlot })}
          className="btn-primary w-full py-3"
        >
          Confirm Appointment
        </button>
      </div>
    </div>
  );
}

/* ── Schedule Call Modal ── */
function ScheduleCallModal({ reason, onClose, onConfirm }) {
  const [datetime, setDatetime] = useState("");
  const [notes, setNotes] = useState(reason || "");
  const minDt = new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose} role="dialog" aria-label="Schedule AI call">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-7 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Schedule AI Health Call</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors" aria-label="Close modal">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-5">
          AmritCare AI will call you at the chosen time for a personalized checkup consultation.
        </p>

        <div className="mb-4">
          <label htmlFor="modal-call-datetime" className="block text-sm font-semibold text-gray-700 mb-1.5">When should we call?</label>
          <input
            id="modal-call-datetime"
            type="datetime-local"
            value={datetime}
            min={minDt}
            onChange={(e) => setDatetime(e.target.value)}
            className="input-field"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="modal-call-notes" className="block text-sm font-semibold text-gray-700 mb-1.5">Notes / Context (Optional)</label>
          <textarea
            id="modal-call-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Headache follow-up, blood pressure check..."
            className="input-field resize-none"
          />
        </div>

        <button
          disabled={!datetime}
          onClick={() => onConfirm({ scheduledAt: new Date(datetime).toISOString(), notes })}
          className="btn-primary w-full py-3"
        >
          Schedule Health Call
        </button>
      </div>
    </div>
  );
}

/* ── Action Buttons ── */
function ActionButtons({ actions, onBook, onCall }) {
  if (!actions || actions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2 pt-1 animate-slide-up">
      {actions.map((action, i) => {
        if (action.type === "book_appointment") {
          return (
            <button
              key={i}
              onClick={() => onBook(action.specialty)}
              className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              Book {action.specialty}
            </button>
          );
        }
        if (action.type === "schedule_call") {
          return (
            <button
              key={i}
              onClick={() => onCall(action.reason)}
              className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              Schedule Follow-up Call
            </button>
          );
        }
        return null;
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main TriageChat Component
   ══════════════════════════════════════════════════════════════ */
export default function TriageChat() {
  const [lang, setLang] = useState("en");
  const [langOpen, setLangOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [scheduleCallData, setScheduleCallData] = useState(null);
  const [toast, setToast] = useState("");
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Text chat hook
  const { isTalking: avatarTalkingText, response, loading, actions, sendMessage } = useAvatarChat();

  // Voice conversation hook
  const voice = useVoiceConversation();

  // Avatar talks when either text or voice is speaking
  const avatarTalking = avatarTalkingText || voice.isSpeaking;

  // Add text AI responses to messages
  useEffect(() => {
    if (response) {
      setMessages((prev) => [...prev, { role: "assistant", text: response, actions, time: new Date() }]);
    }
  }, [response, actions]);

  // Add voice transcript messages live
  useEffect(() => {
    if (voice.transcript) {
      setMessages((prev) => [...prev, { role: "user", text: voice.transcript, time: new Date() }]);
    }
  }, [voice.transcript]);

  // Sync voice conversation history into chat messages
  const lastVoiceCountRef = useRef(0);
  useEffect(() => {
    if (!voice.isActive) return;
    const interval = setInterval(() => {
      const history = voice.conversationHistory.current;
      if (history.length > lastVoiceCountRef.current) {
        const newMsgs = history.slice(lastVoiceCountRef.current);
        for (const msg of newMsgs) {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.text === msg.text && last.role === (msg.role === "user" ? "user" : "assistant")) return prev;
            return [...prev, { role: msg.role === "user" ? "user" : "assistant", text: msg.text, time: new Date() }];
          });
        }
        lastVoiceCountRef.current = history.length;
      }
    }, 500);
    return () => clearInterval(interval);
  }, [voice.isActive, voice.conversationHistory]);

  useEffect(() => {
    if (!voice.isActive) lastVoiceCountRef.current = 0;
  }, [voice.isActive]);

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const l = LANGUAGES.find((lg) => lg.code === lang) || LANGUAGES[0];
    setMessages([{
      role: "assistant",
      text: `${l.greeting}\n\nDescribe your symptoms and I will assist you with initial medical guidance and next steps. You can type or use the microphone to talk with me!`,
      time: new Date(),
    }]);
  }, [lang]);

  const handleSend = useCallback((overrideText) => {
    const textToSend = typeof overrideText === "string" ? overrideText : input;
    const trimmed = textToSend.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { role: "user", text: trimmed, time: new Date() }]);
    setInput("");
    sendMessage(trimmed);
  }, [input, sendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 5000);
  };

  const handleBookDoctor = async (specialty) => {
    showToast("Finding nearby doctors...");
    const fetchDoctors = async (lat, lng) => {
      try {
        const res = await fetch(`/api/doctors/nearby?lat=${lat}&lng=${lng}&specialty=${encodeURIComponent(specialty)}`);
        const data = await res.json();
        if (data.doctors && data.doctors.length > 0) {
          setBookingDoctor(data.doctors[0]);
        } else {
          const match = DOCTORS.find((d) => d.specialty.toLowerCase().includes(specialty.toLowerCase())) || DOCTORS[5];
          setBookingDoctor(match);
        }
      } catch (err) {
        console.error("Failed to fetch nearby doctors:", err);
        const match = DOCTORS.find((d) => d.specialty.toLowerCase().includes(specialty.toLowerCase())) || DOCTORS[5];
        setBookingDoctor(match);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => fetchDoctors(position.coords.latitude, position.coords.longitude),
        (error) => {
          console.warn("Location permission denied or error:", error.message);
          fetchDoctors("28.6139", "77.2090");
        },
        { timeout: 5000 }
      );
    } else {
      fetchDoctors("28.6139", "77.2090");
    }
  };

  const handleConfirmBooking = async (booking) => {
    setBookingDoctor(null);
    try {
      const patient = JSON.parse(sessionStorage.getItem("medconnect_patient") || "null");
      if (patient?.id) {
        await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId: patient.id,
            facilityName: booking.doctor.name,
            department: booking.doctor.specialty,
            scheduledDate: booking.date,
            scheduledSlot: booking.slot,
            fee: booking.doctor.fee,
            status: "upcoming"
          })
        });
      }
    } catch (err) {
      console.error("Booking sync failed:", err);
    }

    const patientName = JSON.parse(sessionStorage.getItem("medconnect_patient") || "{}").name || "Patient";
    const message = `Hello ${booking.doctor.name},\n\n*New Appointment Booking*\nPatient: ${patientName}\nDate: ${new Date(booking.date).toLocaleDateString("en-IN")}\nTime: ${booking.slot}\n\nPlease confirm this appointment.`;
    const hospitalPhone = booking.doctor.phone || "919999999999";
    const whatsappUrl = `https://wa.me/${hospitalPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");

    setMessages((prev) => [...prev, {
      role: "assistant",
      text: `Appointment booked with ${booking.doctor.name} (${booking.doctor.specialty}) on ${new Date(booking.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} at ${booking.slot}.`,
      time: new Date(),
    }]);
    showToast(`Booked ${booking.doctor.name}`);
  };

  const handleScheduleCall = (reason) => {
    setScheduleCallData({ reason: reason || "" });
  };

  const handleConfirmCall = async ({ scheduledAt, notes }) => {
    setScheduleCallData(null);
    try {
      const patient = JSON.parse(sessionStorage.getItem("medconnect_patient") || "null");
      if (patient?.id) {
        await fetch("/api/calls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId: patient.id, scheduledAt, notes })
        });
      }
      setMessages((prev) => [...prev, {
        role: "assistant",
        text: `Call scheduled for ${new Date(scheduledAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true })}.\n\nAmritCare AI will call you at the scheduled time!`,
        time: new Date(),
      }]);
      showToast("AI Health Call scheduled!");
    } catch {
      showToast("Failed to schedule call.");
    }
  };

  const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const voiceStatusLabel = voice.isActive
    ? voice.isListening
      ? "Listening to you..."
      : voice.isSpeaking
      ? "AI Speaking..."
      : "Thinking..."
    : null;

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 w-full items-stretch">
        {/* 3D Avatar Column */}
        <div className="w-full lg:w-5/12 bg-white rounded-2xl border border-gray-200 p-4 flex flex-col items-center justify-between min-h-[440px] shadow-sm relative overflow-hidden">
          <div className="w-full flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">3D AI Doctor</span>
            </div>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
              {voice.isActive ? "Voice Interactive" : "Ready"}
            </span>
          </div>

          <div className="w-full flex-1 relative flex items-center justify-center my-2">
            <AvatarScene isTalking={avatarTalking} currentMessage={voice.currentMessage} />

            {/* Voice conversation status overlay */}
            {voice.isActive && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in z-20">
                <div className={`px-4 py-2 rounded-full text-xs font-bold shadow-md flex items-center gap-2 ${
                  voice.isListening
                    ? "bg-rose-600 text-white animate-pulse"
                    : voice.isSpeaking
                    ? "bg-teal-600 text-white"
                    : "bg-gray-800 text-white"
                }`}>
                  <Mic className="w-3.5 h-3.5" />
                  {voiceStatusLabel}
                </div>
                <button
                  onClick={voice.stop}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white/95 px-3 py-1 rounded-full border border-rose-200 shadow-sm transition-colors"
                >
                  ✕ End Voice Call
                </button>
              </div>
            )}
          </div>

          <div className="w-full pt-3 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              {voice.isActive
                ? "Speak naturally. AmritCare AI is listening."
                : "Click the mic below or type to start your assessment."}
            </p>
          </div>
        </div>

        {/* Chat Area Column */}
        <div className="w-full lg:w-7/12 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden min-h-[560px]">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">AI Clinical Triage</h2>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${voice.isActive ? "bg-rose-500" : "bg-teal-500"}`} />
                  <span className="text-xs font-medium text-gray-500">
                    {voice.isActive ? "Voice Active" : "Online & Secure"}
                  </span>
                </div>
              </div>
            </div>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 transition-colors"
                aria-label="Select language"
              >
                <Globe className="w-3.5 h-3.5 text-gray-500" />
                <span>{currentLang.label}</span>
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-30 animate-fade-in">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setLangOpen(false); }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${
                        lang === l.code ? "bg-teal-50 text-teal-700 font-bold" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50 max-h-[460px]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} animate-slide-up`}>
                <div className="flex items-end gap-2 max-w-[88%]">
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0 mb-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-teal-600 text-white rounded-br-sm shadow-sm"
                        : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-normal">{msg.text}</div>
                    <p className={`text-[11px] mt-1.5 text-right font-medium ${msg.role === "user" ? "text-teal-100" : "text-gray-400"}`}>
                      {formatTime(msg.time)}
                    </p>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-teal-700 flex items-center justify-center text-white shrink-0 mb-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
                {msg.role === "assistant" && msg.actions && (
                  <div className="pl-9 w-full">
                    <ActionButtons actions={msg.actions} onBook={handleBookDoctor} onCall={handleScheduleCall} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 pl-2 animate-fade-in">
                <div className="w-7 h-7 rounded-lg bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">Analyzing symptoms...</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Persistent Clinical Disclaimer Bar */}
          <div className="ai-disclaimer flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>AI assessment provides general triage and is not a replacement for professional clinical advice.</span>
          </div>

          {/* Input Bar */}
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex items-end gap-2.5">
              <button
                onClick={voice.toggle}
                title={voice.isActive ? "Stop voice conversation" : "Start voice conversation"}
                aria-label={voice.isActive ? "Stop voice conversation" : "Start voice conversation"}
                className={`p-3 rounded-xl shrink-0 transition-all ${
                  voice.isActive
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/30 animate-pulse"
                    : "bg-gray-100 text-gray-600 hover:bg-teal-50 hover:text-teal-600 border border-gray-200"
                }`}
              >
                {voice.isActive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={voice.isActive ? "Voice conversation is active — speak naturally..." : "Describe your symptoms (e.g. fever for 2 days, mild cough)..."}
                rows={1}
                disabled={voice.isActive}
                className="input-field flex-1 resize-none min-h-[46px] max-h-[120px] py-2.5 disabled:opacity-50"
              />

              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || loading || voice.isActive}
                aria-label="Send message"
                className="btn-primary p-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-gray-900 text-white border border-gray-700 shadow-xl rounded-xl px-5 py-3 text-sm font-medium animate-slide-up flex items-center gap-2" role="status">
          <CheckCircle className="w-4 h-4 text-teal-400" />
          {toast}
        </div>
      )}

      {/* Modals */}
      {bookingDoctor && <BookingModal doctor={bookingDoctor} onClose={() => setBookingDoctor(null)} onConfirm={handleConfirmBooking} />}
      {scheduleCallData && <ScheduleCallModal reason={scheduleCallData.reason} onClose={() => setScheduleCallData(null)} onConfirm={handleConfirmCall} />}
    </>
  );
}
