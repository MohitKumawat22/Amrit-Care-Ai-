"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Stethoscope, User, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role }),
      });

      const data = await res.json();

      if (res.ok) {
        if (role === "doctor") {
          router.push("/doctor/login?registered=true");
        } else {
          router.push("/patient/login?registered=true");
        }
      } else {
        setError(data.error || "Registration failed. Please check your details.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-6 no-underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center mx-auto shadow-md mb-3 text-white font-bold">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create Account</h1>
          <p className="mt-1 text-xs text-gray-500">
            Or{" "}
            <Link href="/patient/login" className="font-semibold text-teal-600 hover:underline no-underline">
              sign in to your existing account
            </Link>
          </p>
        </div>

        <div className="mt-6 bg-white py-8 px-6 sm:px-8 shadow-sm rounded-2xl border border-gray-200">
          {/* Role selector tabs */}
          <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setRole("patient")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                role === "patient"
                  ? "bg-white text-teal-700 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Patient
            </button>
            <button
              type="button"
              onClick={() => setRole("doctor")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                role === "doctor"
                  ? "bg-white text-teal-700 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              Doctor
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-50 border border-rose-200 p-3 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="reg-name" className="block text-xs font-semibold text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="reg-name"
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field py-2 text-sm"
                placeholder={role === "doctor" ? "Dr. Priya Sharma" : "Rahul Sharma"}
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="reg-email"
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field py-2 text-sm"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label htmlFor="reg-pwd" className="block text-xs font-semibold text-gray-700 mb-1">
                Password
              </label>
              <input
                id="reg-pwd"
                required
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field py-2 text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-2 text-sm shadow-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </span>
              ) : (
                `Register as ${role === "doctor" ? "Doctor" : "Patient"}`
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
