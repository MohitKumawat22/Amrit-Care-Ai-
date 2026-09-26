"use client";
import { useState, useCallback } from "react";

export function useVoiceInput(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN"; // Indian English
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      onResult(transcript);
    };
    recognition.start();
  }, [onResult]);

  return { isListening, startListening };
}
