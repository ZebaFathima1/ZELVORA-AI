import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, Square, Loader2 } from "lucide-react";

/**
 * Voice recorder button. Records mic audio, returns the audio Blob via onRecorded.
 */
export default function VoiceRecorder({ onRecorded, disabled }) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [level, setLevel] = useState(0);
  const mediaRecRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const rafRef = useRef(0);
  const chunksRef = useRef([]);

  const stopAll = () => {
    if (mediaRecRef.current && mediaRecRef.current.state !== "inactive") {
      mediaRecRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
    }
    cancelAnimationFrame(rafRef.current);
    setLevel(0);
  };

  useEffect(() => () => stopAll(), []);

  const start = async () => {
    if (disabled || busy) return;
    try {
      setBusy(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Audio level meter
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ac;
      const src = ac.createMediaStreamSource(stream);
      const analyser = ac.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        setLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();

      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        stopAll();
        setRecording(false);
        if (blob.size > 1000) {
          onRecorded(blob);
        }
        setBusy(false);
      };
      mediaRecRef.current = rec;
      rec.start();
      setRecording(true);
      setBusy(false);
    } catch (e) {
      setBusy(false);
      setRecording(false);
      alert("Microphone permission denied. Please allow mic access.");
    }
  };

  const stop = () => {
    if (mediaRecRef.current && mediaRecRef.current.state !== "inactive") {
      setBusy(true);
      mediaRecRef.current.stop();
    }
  };

  return (
    <button
      type="button"
      onClick={recording ? stop : start}
      disabled={disabled || busy}
      data-testid={recording ? "voice-stop-btn" : "voice-record-btn"}
      title={recording ? "Stop recording" : "Record your voice"}
      className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${
        recording
          ? "bg-red-500 text-white"
          : "glass text-white/70 hover:text-white"
      } disabled:opacity-40`}
    >
      {recording && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full bg-red-500/40"
          animate={{ scale: 1 + level * 0.6, opacity: 0.4 + level * 0.5 }}
          transition={{ duration: 0.08 }}
        />
      )}
      <span className="relative">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : recording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
      </span>
    </button>
  );
}
