import { useState, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";

type Props = {
  onResult: (transcript: string) => void;
  disabled?: boolean;
};

export function VoiceQuery({ onResult, disabled }: Props) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const supported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  function startListening() {
    if (!supported) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  if (!supported) return null;

  return (
    <button
      onClick={listening ? stopListening : startListening}
      disabled={disabled}
      className={`p-2 rounded-xl transition ${
        listening
          ? "bg-destructive text-destructive-foreground animate-pulse"
          : "bg-accent hover:bg-accent/80 text-foreground"
      } disabled:opacity-40`}
      title={listening ? "Berhenti mendengarkan" : "Bicara untuk bertanya"}
    >
      {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );
}
