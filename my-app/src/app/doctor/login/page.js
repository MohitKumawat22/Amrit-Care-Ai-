"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Stethoscope, ArrowLeft, Loader2, AlertCircle, User, CheckCircle2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid provider credentials. Please verify your doctor ID or password.");
        setLoading(false);
        return;
      }

      router.push("/doctor/dashboard");
    } catch (err) {
      setError("An unexpected authentication error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md relative z-10">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-6 no-underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-teal-500/20 mb-4">
          <Stethoscope className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Clinical Provider Portal</h1>
        <p className="text-xs text-slate-400 mt-1">Sign in with your registered clinician credentials</p>
      </div>

      {registered && (
        <div className="mb-5 p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>Account created successfully! Please sign in below.</span>
        </div>
      )}

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2" role="alert">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-white/[0.08] rounded-3xl p-7 sm:p-8 shadow-2xl">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="doc-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Email / Provider ID
            </label>
            <input
              id="doc-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500/60 focus:bg-white/[0.06] transition-colors text-sm"
              placeholder="doctor@hospital.org"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="doc-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Password
            </label>
            <input
              id="doc-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500/60 focus:bg-white/[0.06] transition-colors text-sm"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 mt-4 text-sm font-semibold shadow-lg shadow-teal-500/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying Credentials...
              </span>
            ) : (
              "Sign In as Clinician"
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/[0.06] flex flex-col gap-2 text-center text-xs">
          <p className="text-slate-400">
            New clinician?{" "}
            <Link href="/doctor/signup" className="text-teal-400 hover:text-teal-300 font-semibold no-underline">
              Register provider account
            </Link>
          </p>
          <p className="text-slate-500">
            <Link href="/patient/login" className="inline-flex items-center gap-1 text-slate-400 hover:text-teal-300 no-underline">
              <User className="w-3 h-3" />
              Are you a patient? Go to Patient Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DoctorLoginPage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen relative overflow-hidden px-4 py-12 bg-[#0B0F1A] text-slate-100">
      <div className="absolute top-10 right-[20%] w-72 h-72 rounded-full bg-teal-500/10 blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-10 left-[15%] w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl animate-float-delayed pointer-events-none" />

      <Suspense fallback={<div className="text-center text-slate-400 text-sm">Loading login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
