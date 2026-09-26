"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Calendar, Star, MapPin, Search, X, Loader2, CheckCircle, Clock, Bot, Stethoscope, Users } from "lucide-react";
import ScheduleCall from "@/components/patient/ScheduleCall";
import Navbar from "@/components/shared/Navbar";
import EmptyState from "@/components/shared/EmptyState";

const ALL_SLOTS = ["9:00 AM","10:30 AM","12:00 PM","2:30 PM","4:00 PM","5:30 PM","7:00 PM"];

/* ─── Booking Modal ─── */
function BookingModal({ doctor, onClose, onConfirm }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose} role="dialog" aria-label="Book appointment">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Book Appointment</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors" aria-label="Close modal">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 border border-gray-100 rounded-xl">
          <div className="w-14 h-14 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center">
            <span className="text-teal-700 font-bold text-lg">{doctor.avatar}</span>
          </div>
          <div>
            <h4 className="font-bold text-gray-900">{doctor.name}</h4>
            <p className="text-sm text-gray-500">{doctor.specialty} • {doctor.fee}</p>
          </div>
        </div>
        <div className="mb-5">
          <label htmlFor="booking-date" className="block text-sm font-semibold text-gray-700 mb-2">Select Date</label>
          <input id="booking-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="input-field" />
        </div>
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Available Slots</label>
          <div className="grid grid-cols-3 gap-2.5">
            {doctor.slots.map((slot) => (
              <button key={slot} onClick={() => setSelectedSlot(slot)} className={`py-2.5 px-2 rounded-lg text-xs font-semibold transition-all border ${selectedSlot === slot ? "bg-teal-600 text-white border-teal-600 shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-600"}`}>{slot}</button>
            ))}
          </div>
        </div>
        <button disabled={!selectedSlot || confirming} onClick={async () => { setConfirming(true); await onConfirm({ doctor, date, slot: selectedSlot }); setConfirming(false); }} className="btn-primary w-full py-3.5">
          {confirming ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming...</> : "Confirm Appointment"}
        </button>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─── */
export default function PatientDashboard() {
  const router = useRouter();
  const [patient, setPatient] = useState(null);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("All");
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [doctorsList, setDoctorsList] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [dataSource, setDataSource] = useState("");
  const [refillCount, setRefillCount] = useState(0);

  useEffect(() => {
    if (!patient?.id) return;
    fetch(`/api/reminders?patientId=${patient.id}`)
      .then(res => res.json())
      .then(data => {
        const meds = data.reminders || [];
        const count = meds.filter(m => m.remainingQuantity <= (m.tabletsPerDose * m.refillAlertDays * m.times.length)).length;
        setRefillCount(count);
      })
      .catch(err => console.error(err));
  }, [patient?.id]);

  useEffect(() => {
    const stored = JSON.parse(sessionStorage.getItem("medconnect_patient") || "null");
    if (!stored?.id) { router.push("/patient/login"); return; }
    setPatient(stored);
  }, [router]);

  useEffect(() => {
    const fetchDoctors = async (lat, lng) => {
      setDoctorsLoading(true);
      try {
        const res = await fetch(`/api/doctors/nearby?lat=${lat}&lng=${lng}`);
        const data = await res.json();
        setDataSource(data.source || "");
        if (data.doctors && data.doctors.length > 0) {
          const normalized = data.doctors.map((d, i) => ({
            ...d,
            id: d.id ?? i,
            name: d.name || "Nearby Clinic",
            specialty: d.specialty || "General Clinic",
            rating: d.rating ?? +(3.5 + Math.random() * 1.5).toFixed(1),
            experience: d.experience || `${Math.floor(Math.random() * 15 + 2)} yrs`,
            available: d.available !== false,
            fee: d.fee || `₹${Math.floor(Math.random() * 8 + 3) * 100}`,
            avatar: (d.name || "CL").substring(0, 2).toUpperCase(),
            slots: d.slots?.length ? d.slots : ALL_SLOTS.sort(() => 0.5 - Math.random()).slice(0, 3),
          }));
          setDoctorsList(normalized);
        }
      } catch (err) {
        console.error("Failed to fetch nearby doctors:", err);
        setDataSource("error");
      } finally {
        setDoctorsLoading(false);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchDoctors(pos.coords.latitude, pos.coords.longitude),
        (err) => { console.warn("Location denied:", err.message); fetchDoctors("28.6139","77.2090"); },
        { timeout: 5000 }
      );
    } else {
      fetchDoctors("28.6139","77.2090");
    }
  }, []);

  useEffect(() => {
    if (!patient?.id) return;
    const fetchBookings = async () => {
      try {
        const res = await fetch(`/api/bookings?patientId=${patient.id}`);
        const data = await res.json();
        if (data.bookings) {
          const formatted = data.bookings.map(b => ({
            id: b._id, doctorName: b.facilityName, specialty: b.department,
            date: b.scheduledDate || b.createdAt, slot: b.scheduledSlot || "", fee: b.fee || ""
          }));
          setBookings(formatted);
        }
      } catch (err) { console.error("Failed to fetch bookings:", err); }
    };
    fetchBookings();
  }, [patient?.id]);

  const specialties = ["All", ...new Set(doctorsList.map((d) => d.specialty).filter(Boolean))];
  const filteredDoctors = doctorsList.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || (d.specialty || "").toLowerCase().includes(search.toLowerCase()) || (d.address || "").toLowerCase().includes(search.toLowerCase());
    const matchSpec = specialty === "All" || d.specialty === specialty;
    return matchSearch && matchSpec;
  });

  const handleConfirmBooking = async (booking) => {
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: patient.id, facilityName: booking.doctor.name, department: booking.doctor.specialty, scheduledDate: booking.date, scheduledSlot: booking.slot, fee: booking.doctor.fee, status: "upcoming" })
      });
      const data = await res.json();
      if (res.ok) {
        setBookings(prev => [...prev, { id: data.booking._id, doctorName: booking.doctor.name, specialty: booking.doctor.specialty, date: booking.date, slot: booking.slot, fee: booking.doctor.fee }]);
        setBookingDoctor(null);
        setSuccessMsg(`Booked ${booking.doctor.name} on ${new Date(booking.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} at ${booking.slot}.`);
        const message = `Hello ${booking.doctor.name},\n\n*New Appointment Booking*\nPatient: ${patient.name}\nDate: ${new Date(booking.date).toLocaleDateString("en-IN")}\nTime: ${booking.slot}\n\nPlease confirm this appointment.`;
        const hospitalPhone = booking.doctor.phone || "919999999999";
        const whatsappUrl = `https://wa.me/${hospitalPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");
        setTimeout(() => setSuccessMsg(""), 6000);
      } else {
        console.error("Booking failed:", data.error);
        alert("Failed to confirm booking.");
      }
    } catch (err) {
      console.error("Booking request error:", err);
      alert("Error confirming booking.");
    }
  };

  if (!patient) return null;

  return (
    <div className="min-h-screen bg-gray-50 has-bottom-nav">
      <Navbar refillCount={refillCount} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, <span className="text-teal-600">{patient.firstName}</span> 👋
          </h1>
          <p className="text-gray-500 mt-1">Here's your health overview for today</p>
        </div>

        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-3 animate-slide-up" role="status">
            <CheckCircle className="w-5 h-5 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-teal-600" />
              </div>
              <div><p className="text-2xl font-bold text-gray-800">{bookings.length}</p><p className="text-xs text-gray-500 font-medium">Appointments</p></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-blue-600" />
              </div>
              <div><p className="text-2xl font-bold text-gray-800">{doctorsList.filter(d => d.available).length}</p><p className="text-xs text-gray-500 font-medium">Doctors Available</p></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <Bot className="w-5 h-5 text-emerald-600" />
              </div>
              <div><p className="text-2xl font-bold text-gray-800">24/7</p><p className="text-xs text-gray-500 font-medium">AI Health Assistant</p></div>
            </div>
          </div>
        </div>

        {/* AI Health Calls */}
        <div className="mb-8">
          <ScheduleCall patientId={patient.id} />
        </div>

        {/* Upcoming Bookings */}
        {bookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Your Appointments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookings.map((b) => (
                <div key={b.id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">Upcoming</span>
                    <span className="text-xs text-gray-400 font-medium">{b.fee}</span>
                  </div>
                  <h3 className="font-semibold text-gray-800">{b.doctorName}</h3>
                  <p className="text-sm text-gray-500 mb-3">{b.specialty}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {b.slot}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Find a Doctor</h2>
            {!doctorsLoading && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                dataSource === "mappls" ? "bg-green-50 text-green-600 border-green-200" : "bg-amber-50 text-amber-600 border-amber-200"
              }`}>
                {dataSource === "mappls" ? "📍 Live — Near You" : "📋 Default listing"}
              </span>
            )}
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, specialty or address..." className="input-field pl-11" aria-label="Search doctors" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {specialties.map((s) => (
                <button key={s} onClick={() => setSpecialty(s)} className={`px-4 py-2.5 rounded-lg text-xs font-medium transition-all border whitespace-nowrap ${specialty === s ? "bg-teal-600 text-white border-teal-600 shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:border-teal-300 hover:text-teal-600"}`}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Doctor Cards */}
        {doctorsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full skeleton" />
                  <div className="flex-1"><div className="h-4 skeleton w-3/4 mb-2" /><div className="h-3 skeleton w-1/2" /></div>
                </div>
                <div className="flex gap-3 mb-4"><div className="h-3 skeleton w-12" /><div className="h-3 skeleton w-12" /><div className="h-3 skeleton w-16" /></div>
                <div className="flex justify-between"><div className="h-6 skeleton rounded-full w-28" /><div className="h-8 skeleton rounded-lg w-24" /></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDoctors.map((doctor) => (
                <div key={doctor.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
                      <span className="text-teal-700 font-bold text-lg">{doctor.avatar}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{doctor.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{doctor.specialty}</p>
                      {doctor.address && <p className="text-xs text-gray-400 truncate mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" /> {doctor.address}</p>}
                      {doctor.distance && <p className="text-xs text-teal-600 font-medium mt-0.5">{doctor.distance} km away</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <span className="text-gray-500 flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {doctor.rating}</span>
                    <span className="text-gray-500">{doctor.experience}</span>
                    <span className="font-semibold text-teal-600">{doctor.fee}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${doctor.available ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-500 border-red-200"}`}>
                      {doctor.available ? "✓ Available Today" : "✗ Not Available"}
                    </span>
                    <button disabled={!doctor.available} onClick={() => setBookingDoctor(doctor)} className="btn-primary text-sm px-4 py-2">
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {filteredDoctors.length === 0 && !doctorsLoading && (
              <EmptyState
                icon={doctorsList.length === 0 ? "error" : "search"}
                title={doctorsList.length === 0 ? "Could not fetch nearby clinics" : "No results found"}
                description={doctorsList.length === 0 ? "We couldn't load doctors near you. Please check your connection and try again." : "No clinics match your current search. Try a different name or specialty."}
                action={doctorsList.length === 0 ? <button onClick={() => window.location.reload()} className="btn-primary text-sm">Try Again</button> : null}
              />
            )}
          </>
        )}
      </div>

      {bookingDoctor && <BookingModal doctor={bookingDoctor} onClose={() => setBookingDoctor(null)} onConfirm={handleConfirmBooking} />}
    </div>
  );
}
