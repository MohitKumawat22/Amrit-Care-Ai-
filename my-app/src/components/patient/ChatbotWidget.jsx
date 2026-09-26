"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  MessageSquare,
  X,
  Send,
  Paperclip,
  Trash2,
  Calendar,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

export default function ChatbotWidget() {
  const [patient, setPatient] = useState(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [reports, setReports] = useState([]);
  const endRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const stored = JSON.parse(sessionStorage.getItem("medconnect_patient") || "null");
    if (stored?.id) setPatient(stored);
    else setPatient(null);
    setMounted(true);
  }, [pathname]);

  const welcomeMsg = {
    role: "bot",
    text: `Hello ${patient?.firstName || "there"}! I'm AmritCare AI — your personal health assistant.\n\nTell me how you're feeling, describe any symptoms, or ask me to schedule a checkup or set a reminder.`,
  };

  const welcomeSet = useRef(false);
  useEffect(() => {
    if (patient && !welcomeSet.current) {
      welcomeSet.current = true;
      setMessages([welcomeMsg]);
    }
  }, [patient?.id]);

  useEffect(() => {
    if (!isOpen || !patient?.id || historyLoaded) return;
    (async () => {
      try {
        const res = await fetch(`/api/chat/history?patientId=${patient.id}`);
        const data = await res.json();
        if (data.messages?.length > 0) {
          setMessages((prev) => [prev[0] || welcomeMsg, ...data.messages]);
        }
        if (data.reports) setReports(data.reports);
        setHistoryLoaded(true);
      } catch {
        setHistoryLoaded(true);
      }
    })();
  }, [isOpen, patient?.id, historyLoaded]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const saveHistory = async (allMessages) => {
    if (!patient?.id) return;
    try {
      const toSave = allMessages.filter((_, i) => i > 0);
      await fetch("/api/chat/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: patient.id, messages: toSave }),
      });
    } catch {}
  };

  const handleSend = async () => {
    if (!input.trim() || typing) return;
    const userMsg = input.trim();
    const newMessages = [...messages, { role: "user", text: userMsg }];
    setMessages(newMessages);
    setInput("");
    setTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.filter((_, i) => i > 0),
          patientInfo: patient ? { firstName: patient.firstName, age: patient.age, blood: patient.blood } : null,
          patientId: patient?.id,
        }),
      });
      const data = await res.json();
      let replyText = data.reply || "I understand. Let me know if you have more questions.";
      let bookingSpecialty = null;
      const bookMatch = replyText.match(/\[BOOK_APPOINTMENT:(.*?)\]/);
      if (bookMatch) {
        bookingSpecialty = bookMatch[1].trim();
        replyText = replyText.replace(bookMatch[0], "").trim();
      }

      if (data.actions?.length) {
        for (const action of data.actions) {
          if (action.type === "schedule_call_at" && patient?.id) {
            try {
              const callRes = await fetch("/api/calls", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  patientId: patient.id,
                  scheduledAt: new Date(action.datetime).toISOString(),
                  overridePhone: patient.phone || null,
                  overrideName: patient.firstName || null,
                  recurrence: "one-time",
                  notes: "Scheduled via AI chat assistant",
                }),
              });
              const callData = await callRes.json();
              if (callRes.ok) {
                replyText += `\n\n✅ Done! Your call is scheduled for ${new Date(action.datetime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}.`;
              } else {
                replyText += `\n\n⚠️ Couldn't schedule call: ${callData.error || "Unknown error"}.`;
              }
            } catch {
              replyText += "\n\n⚠️ There was an error scheduling your call.";
            }
          }

          if (action.type === "navigate" && action.path) {
            setTimeout(() => {
              setIsOpen(false);
              router.push(action.path);
            }, 1200);
            replyText += `\n\n➡️ Navigating to ${action.path}...`;
          }
        }
      }

      const updated = [...newMessages, { role: "bot", text: replyText, bookingSpecialty, rawText: data.reply }];
      setMessages(updated);
      const historyToSave = updated.map((m) => (m.rawText ? { ...m, text: m.rawText } : m));
      saveHistory(historyToSave);
    } catch {
      setMessages((prev) => [...prev, { role: "bot", text: "Sorry, I couldn't connect right now. Please try again." }]);
    } finally {
      setTyping(false);
    }
  };

  const handleReportUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !patient?.id) return;
    setUploadingReport(true);
    try {
      let textContent = await file.text().catch(() => "");
      if (!textContent || textContent.length < 10)
        textContent = `[File: ${file.name}, Type: ${file.type}, Size: ${(file.size / 1024).toFixed(1)}KB]`;
      if (textContent.length > 3000) textContent = textContent.substring(0, 3000) + "\n...[truncated]";
      await fetch("/api/chat/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: patient.id, report: { fileName: file.name, content: textContent } }),
      });
      setReports((prev) => [...prev, { fileName: file.name, uploadedAt: new Date() }]);
      setMessages((prev) => [...prev, { role: "bot", text: `📄 Report "${file.name}" uploaded. I'll use this for your health assessments.` }]);
    } catch {
      setMessages((prev) => [...prev, { role: "bot", text: "Sorry, couldn't process that file. Try a .txt or describe it in chat." }]);
    } finally {
      setUploadingReport(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClearChat = async () => {
    setMessages([welcomeMsg]);
    if (patient?.id) {
      try {
        await fetch("/api/chat/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId: patient.id, messages: [] }),
        });
      } catch {}
    }
  };

  const isAuthPage = pathname?.includes("/login") || pathname?.includes("/register") || pathname?.includes("/doctor");
  if (!mounted || isAuthPage) return null;

  return (
    <>
      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          className="fixed bottom-20 right-4 sm:right-6 w-[92vw] sm:w-[400px] max-h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden animate-slide-up"
          role="dialog"
          aria-label="AmritCare AI Chatbot"
        >
          {/* Header */}
          <div className="bg-teal-700 px-5 py-4 flex items-center justify-between shrink-0 text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">AmritCare AI</h3>
                <p className="text-white/80 text-[11px] font-medium">
                  {reports.length > 0 ? `${reports.length} report(s) active` : "Online Health Companion"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                title="Clear conversation"
                className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Report Alert Banner */}
          {reports.length > 0 && (
            <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2 text-xs text-emerald-800 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{reports.length} medical report(s) loaded for context</span>
            </div>
          )}

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gray-50/60 min-h-[280px] max-h-[380px]">
            {messages.map((msg, i) => {
              let displayMsg = msg.text;
              let showBookBtn = msg.bookingSpecialty;
              if (!showBookBtn && msg.role === "bot" && displayMsg?.includes("[BOOK_APPOINTMENT:")) {
                const match = displayMsg.match(/\[BOOK_APPOINTMENT:(.*?)\]/);
                if (match) {
                  showBookBtn = match[1].trim();
                  displayMsg = displayMsg.replace(match[0], "").trim();
                }
              }

              return (
                <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-sm ${
                      msg.role === "user"
                        ? "bg-teal-600 text-white rounded-br-sm font-normal"
                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm font-normal"
                    }`}
                  >
                    {displayMsg}
                  </div>
                  {showBookBtn && (
                    <button
                      onClick={() => router.push("/patient/dashboard")}
                      className="mt-2 bg-teal-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-teal-700 transition-all flex items-center gap-1.5 ml-1"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Book {showBookBtn}
                    </button>
                  )}
                </div>
              );
            })}

            {typing && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Clinical Disclaimer */}
          <div className="px-3 py-1 bg-amber-50 border-t border-amber-100 text-[10px] text-amber-800 text-center font-medium flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-amber-600 shrink-0" />
            <span>AI guidance only. Call emergency services in critical cases.</span>
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv,.json,.md,.pdf"
                className="hidden"
                onChange={handleReportUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingReport}
                title="Upload medical report"
                aria-label="Upload report"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-teal-600 border border-gray-200 transition-colors disabled:opacity-40 shrink-0"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about symptoms, medicines..."
                className="input-field py-2 text-sm"
              />

              <button
                onClick={handleSend}
                disabled={!input.trim() || typing}
                aria-label="Send message"
                className="btn-primary w-10 h-10 rounded-xl p-0 flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Trigger FAB */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 w-14 h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-xl hover:scale-105 transition-all flex items-center justify-center z-50 border-2 border-white"
          title="Chat with AmritCare AI"
          aria-label="Open AI Health Assistant"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}
    </>
  );
}
