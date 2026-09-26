"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, AlertCircle, Loader2, ArrowLeft, Stethoscope } from "lucide-react";

export default function PatientRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    username: "", password: "", confirmPassword: "", age: "", blood: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return { level: 0, label: "", color: "", textColor: "" };
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { level: 1, label: "Weak", color: "bg-red-400", textColor: "text-red-500" };
    if (score <= 3) return { level: 2, label: "Medium", color: "bg-amber-400", textColor: "text-amber-500" };
    return { level: 3, label: "Strong", color: "bg-green-500", textColor: "text-green-600" };
  };
  const strength = passwordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.firstName || !form.lastName || !form.email || !form.username || !form.password) { setError("Please fill in all required fields."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (!agreed) { setError("Please agree to the Terms of Service."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName, lastName: form.lastName, email: form.email,
          phone: form.phone, username: form.username, password: form.password,
          age: form.age ? parseInt(form.age) : null, blood: form.blood,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed."); setLoading(false); return; }
      sessionStorage.setItem("medconnect_patient", JSON.stringify(data.patient));
      router.push("/patient/dashboard");
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:py-12 relative overflow-hidden bg-gray-50">
      <div className="absolute top-20 left-[15%] w-72 h-72 rounded-full bg-teal-500/5 blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-20 right-[10%] w-80 h-80 rounded-full bg-cyan-500/5 blur-3xl animate-float-delayed pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">
        <Link href="/patient/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors mb-6 no-underline">
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center mb-5 shadow-lg shadow-teal-500/15">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Create Account</h1>
            <p className="text-sm text-gray-500">Join AmritCare AI — your health, simplified</p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium text-center animate-fade-in flex items-center justify-center gap-2" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-1.5">First Name *</label>
                <input id="firstName" name="firstName" value={form.firstName} onChange={handleChange} className="input-field" placeholder="Arjun" autoComplete="given-name" />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-1.5">Last Name *</label>
                <input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} className="input-field" placeholder="Mehta" autoComplete="family-name" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} className="input-field" placeholder="arjun@example.com" autoComplete="email" />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
              <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} className="input-field" placeholder="+91 98765 43210" autoComplete="tel" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="age" className="block text-sm font-semibold text-gray-700 mb-1.5">Age</label>
                <input id="age" name="age" type="number" value={form.age} onChange={handleChange} className="input-field" placeholder="28" />
              </div>
              <div>
                <label htmlFor="blood" className="block text-sm font-semibold text-gray-700 mb-1.5">Blood Group</label>
                <select id="blood" name="blood" value={form.blood} onChange={handleChange} className="input-field text-gray-700">
                  <option value="">Select</option>
                  <option value="A+">A+</option><option value="A-">A-</option>
                  <option value="B+">B+</option><option value="B-">B-</option>
                  <option value="AB+">AB+</option><option value="AB-">AB-</option>
                  <option value="O+">O+</option><option value="O-">O-</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="reg-username" className="block text-sm font-semibold text-gray-700 mb-1.5">Username *</label>
              <input id="reg-username" name="username" value={form.username} onChange={handleChange} className="input-field" placeholder="arjun_m" autoComplete="username" />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-semibold text-gray-700 mb-1.5">Password *</label>
              <div className="relative">
                <input id="reg-password" name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} className="input-field pr-12" placeholder="Min 6 characters" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-md" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2.5 flex items-center gap-2.5">
                  <div className="flex-1 flex gap-1.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength.level ? strength.color : "bg-gray-200"}`} />
                    ))}
                  </div>
                  <span className={`text-xs font-bold ${strength.textColor}`}>{strength.label}</span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password *</label>
              <input id="confirmPassword" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} className="input-field" placeholder="Re-enter password" autoComplete="new-password" />
            </div>

            <label className="flex items-start gap-3 cursor-pointer pt-2">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
              <span className="text-sm text-gray-500 leading-relaxed font-medium">
                I agree to the <span className="text-teal-600 font-bold">Terms of Service</span> and <span className="text-teal-600 font-bold">Privacy Policy</span>
              </span>
            </label>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-4">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </span>
              ) : "Create Account Securely"}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-gray-500 mt-8">
            Already have an account?{" "}
            <Link href="/patient/login" className="text-teal-600 font-bold hover:underline no-underline">
              Sign in
            </Link>
          </p>
          <p className="text-center text-sm text-gray-400 mt-3">
            <Link href="/doctor/signup" className="inline-flex items-center gap-1 text-gray-400 hover:text-teal-600 no-underline transition-colors">
              <Stethoscope className="w-3.5 h-3.5" />
              Doctor? Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
