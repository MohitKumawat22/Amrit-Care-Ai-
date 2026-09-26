"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/shared/Navbar";
import EmptyState from "@/components/shared/EmptyState";
import {
  MapPin,
  Navigation,
  Star,
  Search,
  Building2,
  Phone,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  Compass,
} from "lucide-react";

/* ───────────────────────────────────────────
   Filter / Sort helpers
   ─────────────────────────────────────────── */
const FILTER_OPTIONS = ["All", "Hospital", "Clinic"];
const SORT_OPTIONS = [
  { value: "distance", label: "Nearest First" },
  { value: "rating", label: "Top Rated" },
];

function Stars({ rating }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.3;
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating ${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < full
              ? "text-amber-400 fill-amber-400"
              : i === full && half
              ? "text-amber-400 fill-amber-200"
              : "text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

async function saveBooking(facility) {
  try {
    const patient = JSON.parse(sessionStorage.getItem("medconnect_patient") || "null");
    if (!patient?.id) return;

    await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: patient.id,
        facilityName: facility.name,
        address: facility.address,
        lat: facility.lat,
        lng: facility.lng,
        rating: facility.rating,
        placeId: facility.placeId || facility.id,
        department: facility.type === "Hospital" ? "Emergency" : "General",
        status: "upcoming",
      }),
    });
  } catch (e) {
    console.error("Failed to save booking:", e);
  }
}

export default function LocatePage() {
  const [facilities, setFacilities] = useState([]);
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("distance");
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [loadState, setLoadState] = useState("locating");
  const [errorMsg, setErrorMsg] = useState("");
  const [dataSource, setDataSource] = useState("");
  const [refillCount, setRefillCount] = useState(0);

  useEffect(() => {
    const patient = JSON.parse(sessionStorage.getItem("medconnect_patient") || "null");
    if (!patient?.id) return;
    fetch(`/api/reminders?patientId=${patient.id}`)
      .then((res) => res.json())
      .then((data) => {
        const meds = data.reminders || [];
        const count = meds.filter((m) => m.remainingQuantity <= (m.tabletsPerDose * m.refillAlertDays * (m.times?.length || m.dailyDoses || 1))).length;
        setRefillCount(count);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    const fetchFacilities = async (lat, lng) => {
      setUserLocation({ lat, lng });
      setLoadState("loading");

      try {
        const res = await fetch(`/api/places?lat=${lat}&lng=${lng}&radius=5000&type=hospital`);
        const data = await res.json();

        if (data.facilities && data.facilities.length > 0) {
          setFacilities(data.facilities);
          setDataSource(data.source || "unknown");
        } else {
          setFacilities([]);
        }
        setLoadState("ready");
      } catch (err) {
        console.error("Places fetch error:", err);
        setLoadState("error");
        setErrorMsg("Failed to fetch nearby facilities.");
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchFacilities(pos.coords.latitude, pos.coords.longitude),
        (err) => {
          console.warn("Geolocation error or denied. Falling back to default coordinates.", err);
          fetchFacilities(28.6139, 77.2090);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      fetchFacilities(28.6139, 77.2090);
    }
  }, []);

  const filtered = facilities
    .filter((f) => filter === "All" || f.type === filter)
    .filter(
      (f) =>
        searchQuery === "" ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.address || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) =>
      sort === "distance" ? a.distance - b.distance : b.rating - a.rating
    );

  const selected = facilities.find((f) => f.id === selectedId);

  const handleGetDirections = (facility, e) => {
    e.stopPropagation();
    saveBooking(facility);
    const query = encodeURIComponent(`${facility.name} ${facility.address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 has-bottom-nav">
      <Navbar refillCount={refillCount} />

      <main className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* ── LEFT: Map ── */}
        <section className="lg:flex-1 relative min-h-[300px] lg:min-h-0 bg-slate-900 border-b lg:border-b-0 lg:border-r border-gray-200">
          {(loadState === "locating" || loadState === "loading") && (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-lg px-6 py-4 flex items-center gap-3 border border-gray-200">
                <span className="w-5 h-5 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                <span className="text-sm font-medium text-gray-700">
                  {loadState === "locating" ? "Locating your position..." : "Finding hospitals nearby..."}
                </span>
              </div>
            </div>
          )}

          {loadState === "error" && (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-lg p-6 text-center max-w-xs border border-gray-200">
                <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                <p className="text-sm text-gray-700 font-medium mb-3">{errorMsg}</p>
                <button onClick={() => window.location.reload()} className="btn-primary text-xs px-4 py-2">
                  Retry Search
                </button>
              </div>
            </div>
          )}

          {/* Map View */}
          {loadState === "ready" && userLocation && (
            <iframe
              src={`https://maps.google.com/maps?q=${
                selected
                  ? encodeURIComponent(selected.name + " " + selected.address)
                  : `${userLocation.lat},${userLocation.lng}`
              }&z=${selected ? 16 : 13}&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 w-full h-full z-10"
              title="Hospital Locator Map"
            />
          )}

          {/* Map badge */}
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-3.5 py-2 flex items-center gap-2 z-20 shadow-md border border-gray-200">
            <Compass className="w-4 h-4 text-teal-600 animate-spin" style={{ animationDuration: "12s" }} />
            <span className="text-xs font-semibold text-gray-800">
              {loadState === "ready"
                ? dataSource === "mappls"
                  ? "Live — Mappls GPS"
                  : "Live — Verified GPS"
                : "Locating..."}
            </span>
          </div>

          {/* Selected hospital floating card on map */}
          {selected && (
            <div className="absolute bottom-4 left-4 right-4 lg:right-auto lg:max-w-sm bg-white rounded-xl p-4 shadow-xl border border-gray-200 animate-slide-up z-20">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    Selected Location
                  </span>
                  <h3 className="text-sm font-bold text-gray-900 mt-1.5 truncate">{selected.name}</h3>
                  <p className="text-xs text-gray-500 mb-2 truncate">{selected.address}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-700 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {selected.distance} km away
                    </span>
                    <button
                      onClick={(e) => handleGetDirections(selected, e)}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      <Navigation className="w-3 h-3" />
                      Directions
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors"
                  aria-label="Dismiss selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ── RIGHT: Facility List ── */}
        <section className="lg:w-[440px] xl:w-[480px] flex flex-col flex-1 min-h-0 bg-white">
          {/* Search + Filter Header */}
          <div className="p-4 border-b border-gray-200 space-y-3 bg-white">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                id="facility-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hospital by name or area..."
                className="input-field pl-10 py-2.5 text-sm"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-1.5">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setFilter(opt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      filter === opt
                        ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-600"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <select
                id="sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700 outline-none focus:border-teal-600 cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Summary count */}
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <p className="text-xs text-gray-500 font-medium">
              <span className="text-gray-900 font-bold">{filtered.length}</span> facilities near you
            </p>
            {dataSource === "fallback" && (
              <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Sample Data
              </span>
            )}
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loadState !== "ready" && loadState !== "error" && (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
                    <div className="h-4 skeleton w-3/4" />
                    <div className="h-3 skeleton w-1/2" />
                    <div className="flex gap-2 pt-2">
                      <div className="h-6 skeleton rounded-full w-20" />
                      <div className="h-6 skeleton rounded-full w-16" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {loadState === "ready" &&
              filtered.map((facility) => (
                <div
                  key={facility.id}
                  onClick={() => setSelectedId(facility.id === selectedId ? null : facility.id)}
                  className={`p-4 cursor-pointer transition-all hover:bg-teal-50/40 ${
                    selectedId === facility.id ? "bg-teal-50/70 border-l-4 border-l-teal-600" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                        <h3 className="text-sm font-bold text-gray-900 truncate">{facility.name}</h3>
                      </div>
                      <p className="text-xs text-gray-500 truncate pl-6">{facility.address}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-sm font-bold text-teal-700">{facility.distance}</span>
                      <span className="text-xs text-gray-400 ml-0.5 font-medium">km</span>
                    </div>
                  </div>

                  <div className="flex items-center flex-wrap gap-1.5 mb-2.5 pl-6">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                      {facility.type}
                    </span>
                    {facility.emergency && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        🚨 24/7 ER
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        facility.open
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {facility.open ? "Open Now" : "Closed"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pl-6">
                    <div className="flex items-center gap-2">
                      <Stars rating={facility.rating} />
                      <span className="text-xs text-gray-500 font-medium">
                        {facility.rating} ({((facility.reviews || 0)).toLocaleString()})
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleGetDirections(facility, e)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Navigation className="w-3 h-3" />
                      Get Directions
                    </button>
                  </div>
                </div>
              ))}

            {loadState === "ready" && filtered.length === 0 && (
              <EmptyState
                icon="search"
                title="No Facilities Found"
                description="No hospitals or clinics match your search filters. Try clearing your search or expanding the radius."
              />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
