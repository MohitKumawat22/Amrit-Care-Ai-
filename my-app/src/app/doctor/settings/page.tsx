"use client";

import React, { useState } from "react";
import {
  BrainCircuit,
  Flame,
  Gauge,
  Globe2,
  Info,
  RotateCcw,
  Save,
  Shield,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Thermometer,
  HeartPulse,
  Search,
} from "lucide-react";
import DoctorNavbar from "@/components/shared/DoctorNavbar";

/* ── types ── */
interface ToggleSetting {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  category: string;
}

interface SliderSetting {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  category: string;
}

const INITIAL_TOGGLES: ToggleSetting[] = [
  { id: "auto_escalation", label: "Auto-Escalation for Critical Cases", description: "Automatically escalate patients with triage score ≥ 90 to on-call specialist.", icon: AlertTriangle, enabled: true, category: "Triage Logic" },
  { id: "fever_alert", label: "High Fever Alert", description: "Flag patients with temperature above the configured threshold.", icon: Thermometer, enabled: true, category: "Triage Logic" },
  { id: "keyword_scan", label: "Urgent Keyword Detection", description: "Scan symptom descriptions for configurable emergency keywords (e.g. 'chest pain', 'stroke').", icon: Search, enabled: true, category: "Triage Logic" },
  { id: "vital_anomaly", label: "Vital Sign Anomaly Detection", description: "AI monitors for abnormal patterns in vital sign trends over the last 24 hours.", icon: HeartPulse, enabled: false, category: "AI Engine" },
  { id: "multilingual", label: "Multilingual Symptom Translation", description: "Automatically translate patient-reported symptoms from native language to English.", icon: Globe2, enabled: true, category: "Language" },
  { id: "confidence_display", label: "Show AI Confidence Scores", description: "Display the AI model's confidence percentage alongside each triage recommendation.", icon: BrainCircuit, enabled: false, category: "AI Engine" },
  { id: "audit_log", label: "Triage Audit Logging", description: "Log all triage decisions and parameter adjustments for compliance review.", icon: Shield, enabled: true, category: "Compliance" },
];

const INITIAL_SLIDERS: SliderSetting[] = [
  { id: "fever_threshold", label: "High Fever Threshold", description: "Temperature above which a patient is flagged for fever-related urgency.", icon: Flame, value: 38.5, min: 37.0, max: 41.0, step: 0.1, unit: "°C", category: "Triage Logic" },
  { id: "critical_score", label: "Critical Score Threshold", description: "Triage score at or above which a case is classified as critical.", icon: Gauge, value: 85, min: 50, max: 100, step: 1, unit: "pts", category: "Triage Logic" },
  { id: "high_score", label: "High Priority Threshold", description: "Triage score at or above which a case is classified as high priority.", icon: Gauge, value: 65, min: 30, max: 90, step: 1, unit: "pts", category: "Triage Logic" },
  { id: "ai_sensitivity", label: "AI Sensitivity Level", description: "Controls how aggressively the AI flags potential emergency conditions.", icon: BrainCircuit, value: 70, min: 0, max: 100, step: 5, unit: "%", category: "AI Engine" },
  { id: "review_window", label: "Auto-Review Window", description: "Time in minutes before an un-reviewed case triggers an escalation alert.", icon: RotateCcw, value: 15, min: 5, max: 60, step: 5, unit: "min", category: "Compliance" },
];

const CATEGORIES = ["All", "Triage Logic", "AI Engine", "Language", "Compliance"];

export default function DoctorSettings() {
  const [toggles, setToggles] = useState(INITIAL_TOGGLES);
  const [sliders, setSliders] = useState(INITIAL_SLIDERS);
  const [activeCategory, setActiveCategory] = useState("All");
  const [saved, setSaved] = useState(false);

  const handleToggle = (id: string) => {
    setToggles((prev) => prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)));
    setSaved(false);
  };

  const handleSlider = (id: string, value: number) => {
    setSliders((prev) => prev.map((s) => (s.id === id ? { ...s, value } : s)));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setToggles(INITIAL_TOGGLES);
    setSliders(INITIAL_SLIDERS);
    setSaved(false);
  };

  const filteredToggles = activeCategory === "All" ? toggles : toggles.filter((t) => t.category === activeCategory);
  const filteredSliders = activeCategory === "All" ? sliders : sliders.filter((s) => s.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-100 flex flex-col">
      <DoctorNavbar doctorName="" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Clinical Configuration</h1>
          <p className="text-xs text-slate-400 mt-1">
            Fine-tune clinical triage thresholds, translation logic, and auto-escalation rules
          </p>
        </div>

        {/* Info banner */}
        <div className="bg-teal-500/10 border border-teal-500/20 rounded-2xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-teal-400 mt-0.5 shrink-0" />
          <div className="text-xs">
            <p className="text-teal-300 font-bold">Autonomous Clinical Triage Engine</p>
            <p className="text-teal-200/70 mt-0.5 leading-relaxed">
              Modifications to these parameters immediately influence AI triage classification. All changes are signed and logged for clinical audit compliance.
            </p>
          </div>
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                  : "bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:bg-white/[0.08]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Toggle settings */}
        {filteredToggles.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-wider text-slate-400 font-bold">Toggles & Feature Flags</h2>
            <div className="space-y-3">
              {filteredToggles.map((t) => {
                const IconComponent = t.icon;
                return (
                  <div
                    key={t.id}
                    className="bg-slate-900 border border-white/[0.08] rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-white/[0.14] transition-all"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`p-2.5 rounded-xl ${t.enabled ? "bg-teal-500/15" : "bg-white/[0.04]"}`}>
                        <IconComponent className={`w-5 h-5 ${t.enabled ? "text-teal-400" : "text-slate-500"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{t.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>
                      </div>
                    </div>
                    <button onClick={() => handleToggle(t.id)} className="shrink-0" aria-label={`Toggle ${t.label}`}>
                      {t.enabled ? (
                        <ToggleRight className="w-9 h-9 text-teal-400 hover:text-teal-300 transition-colors" />
                      ) : (
                        <ToggleLeft className="w-9 h-9 text-slate-600 hover:text-slate-500 transition-colors" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Sliders */}
        {filteredSliders.length > 0 && (
          <section className="space-y-3 pt-2">
            <h2 className="text-xs uppercase tracking-wider text-slate-400 font-bold">Threshold Sliders</h2>
            <div className="space-y-3">
              {filteredSliders.map((s) => {
                const SliderIcon = s.icon;
                return (
                  <div
                    key={s.id}
                    className="bg-slate-900 border border-white/[0.08] rounded-2xl p-5 hover:border-white/[0.14] transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                          <SliderIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{s.label}</p>
                          <p className="text-xs text-slate-400">{s.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-white">{s.value}</span>
                        <span className="text-xs text-slate-400 ml-1 font-semibold">{s.unit}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-1">
                      <span className="text-xs text-slate-500 font-semibold">{s.min}{s.unit}</span>
                      <input
                        type="range"
                        min={s.min}
                        max={s.max}
                        step={s.step}
                        value={s.value}
                        onChange={(e) => handleSlider(s.id, parseFloat(e.target.value))}
                        className="flex-1 h-2 rounded-full appearance-none cursor-pointer bg-slate-800 accent-teal-500"
                      />
                      <span className="text-xs text-slate-500 font-semibold">{s.max}{s.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between bg-slate-900 border border-white/[0.08] rounded-2xl p-4">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-slate-400 hover:text-white transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <button
            onClick={handleSave}
            className="btn-primary text-xs py-2.5 px-5 shadow-lg shadow-teal-500/20"
          >
            {saved ? (
              <>
                <Shield className="w-3.5 h-3.5" />
                Configuration Saved
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Save & Apply Settings
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
