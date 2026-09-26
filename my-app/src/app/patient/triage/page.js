"use client";

import Navbar from "@/components/shared/Navbar";
import TriageChat from "@/components/patient/TriageChat";

export default function TriagePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 has-bottom-nav">
      <Navbar />
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <TriageChat />
      </main>
    </div>
  );
}
