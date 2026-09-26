"use client";

import { useState, useEffect } from "react";
import { Download, WifiOff, X, CheckCircle2, Smartphone } from "lucide-react";

export default function PWAProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Service Worker Registration
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("AmritCare PWA ServiceWorker registered with scope:", reg.scope);
          })
          .catch((err) => {
            console.warn("ServiceWorker registration failed:", err);
          });
      });
    }

    // 2. Check if already running in standalone PWA mode
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    ) {
      setIsInstalled(true);
    }

    // 3. Listen for PWA Install Prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if previously dismissed in this session
      const dismissed = sessionStorage.getItem("pwa_install_dismissed");
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // 4. Offline / Online Status Listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    if (!navigator.onLine) setIsOffline(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismissBanner = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem("pwa_install_dismissed", "true");
  };

  return (
    <>
      {children}

      {/* Offline Status Alert Toast */}
      {isOffline && (
        <div
          className="fixed top-3 left-1/2 -translate-x-1/2 z-[300] bg-rose-600 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xl flex items-center gap-2 animate-slide-up border border-rose-400"
          role="status"
          aria-live="polite"
        >
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          <span>You are currently offline. Cached records remain accessible.</span>
        </div>
      )}

      {/* PWA In-App Install Banner */}
      {showInstallBanner && !isInstalled && (
        <aside
          className="fixed bottom-20 md:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-teal-200/80 p-4 z-[200] animate-slide-up"
          role="dialog"
          aria-label="Install AmritCare Application"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white shrink-0 shadow-md shadow-teal-500/20">
              <Smartphone className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-900">Install AmritCare App</h4>
                <button
                  onClick={handleDismissBanner}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors"
                  aria-label="Dismiss install banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                Add to your home screen for quick access, offline triage, and medicine alarms.
              </p>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleInstallClick}
                  className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Install App
                </button>
                <button
                  onClick={handleDismissBanner}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-2.5 py-1.5 transition-colors"
                >
                  Not Now
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
