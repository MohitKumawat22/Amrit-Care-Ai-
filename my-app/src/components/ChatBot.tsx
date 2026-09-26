"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: string;
  actionData?: any;
  result?: any;
  timestamp: Date;
}

export default function ChatBot({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial message
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Hi! I'm MediAI 👋 I can book appointments, add patients, set medicine reminders, and answer your questions. Just tell me what you need!",
        timestamp: new Date(),
      },
    ]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setConversationHistory((prev) => [...prev, { role: "user", content: messageText }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          conversationHistory: conversationHistory,
        }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        action: data.action,
        actionData: data.actionData,
        result: data.result,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setConversationHistory((prev) => [...prev, { role: "assistant", content: data.message }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: "error",
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const QuickChips = () => (
    <div className="flex flex-wrap gap-2 mt-4 px-4">
      {[
        { label: "Book Appointment", text: "Book an appointment" },
        { label: "Add Patient", text: "Add a new patient" },
        { label: "Set Reminder", text: "Set a medicine reminder" },
        { label: "Today's Schedule", text: "Show today's appointments" },
        { label: "Low Stock Alert", text: "Which medicines are low on stock?" },
      ].map((chip) => (
        <button
          key={chip.label}
          onClick={() => sendMessage(chip.text)}
          className="px-3 py-1.5 bg-white border border-emerald-100 rounded-full text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors shadow-sm"
        >
          {chip.label}
        </button>
      ))}
    </div>
  );

  const ResultCard = ({ msg }: { msg: Message }) => {
    if (!msg.action || msg.action === "chat" || msg.action === "error") return null;

    let badge = "";
    let details = "";

    switch (msg.action) {
      case "book_appointment":
        badge = "✅ Appointment Booked";
        const bookResult = msg.result?.appointment;
        details = bookResult ? `Dr. ${msg.actionData?.doctorName} | ${bookResult.slot.day} at ${bookResult.slot.time}`
          : "Searching for doctor availability...";
        break;
      case "set_reminder":
        badge = "✅ Medicine Reminder Set";
        details = `${msg.actionData?.medicineName} (${msg.actionData?.dosage}) | ${msg.actionData?.frequency}`;
        break;
      case "find_doctor":
        badge = "🔍 Doctors Found";
        details = Array.isArray(msg.result) ? `Found ${msg.result.length} ${msg.actionData?.specialty || "specialists"} nearby.`
          : "Searching for specialists...";
        break;
      case "get_appointments":
        badge = "Your Schedule";
        details = `You have ${msg.result?.length || 0} upcoming appointments.`;
        break;
    }

    return (
      <div className="mt-3 p-3 bg-emerald-50/50 border-l-4 border-emerald-600 rounded-lg text-xs animate-in fade-in slide-in-from-left-2">
        <div className="font-bold text-emerald-800 mb-1">{badge}</div>
        <div className="text-gray-600 leading-relaxed">{details}</div>
      </div>
    );
  };

  return (
    <div
      className={`fixed right-0 bottom-0 z-50 bg-white shadow-2xl transition-all duration-300 ease-out border-l border-gray-200 flex flex-col
      ${isOpen ? "translate-x-0" : "translate-x-full"}
      w-full sm:w-[400px] h-full sm:h-[650px] sm:rounded-tl-3xl sm:mb-4 sm:mr-4`}
    >
      {/* Header */}
      <div className="bg-[#0F1C2E] p-4 flex items-center justify-between sm:rounded-tl-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600/20 rounded-xl flex items-center justify-center text-xl">🤖</div>
          <div>
            <h3 className="text-white font-bold text-sm">MediAI Assistant</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">AI is ready</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            {msg.role === "assistant" && <span className="text-[10px] font-bold text-gray-400 mb-1 ml-2 uppercase tracking-tighter">MediAI</span>}
            <div
              className={`max-w-[85%] px-4 py-3 text-sm shadow-sm
              ${
                msg.role === "user"
                  ? "bg-emerald-600 text-white rounded-2xl rounded-tr-sm"
                  : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm"
              }`}
            >
              {msg.content}
              <ResultCard msg={msg} />
            </div>
            <span className="text-[9px] text-gray-400 mt-1 px-1">
              {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}

        {messages.length === 1 && <QuickChips />}

        {loading && (
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-bold text-gray-400 mb-1 ml-2 uppercase">MediAI</span>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.1s]" />
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-1.5 focus-within:border-emerald-400 transition-all"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask me anything..."
            className="flex-1 bg-transparent py-2 text-sm outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-emerald-700 transition-all shadow-md"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
