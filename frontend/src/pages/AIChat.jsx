import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Send, Sparkles, ArrowLeft, Plus, Loader2, Volume2, Pause } from "lucide-react";
import { API_BASE, api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Visual from "@/components/Visual";
import VoiceRecorder from "@/components/VoiceRecorder";

const MODELS = [
  { id: "claude", label: "Claude Sonnet 4.5" },
  { id: "gpt", label: "GPT-5.2" },
  { id: "gemini", label: "Gemini 3 Flash" },
];

const STARTERS = [
  "What is photosynthesis?",
  "How do magnets work?",
  "Why is the sky blue?",
  "What is gravity?",
  "How does electricity flow?",
  "Why do we dream?",
];

export default function AIChat() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const subjectHint = params.get("subject") || "";
  const lessonSlug = params.get("lesson") || "";

  // messages: {role, content, visual?, audioUrl?}
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [model, setModel] = useState("claude");
  const [streaming, setStreaming] = useState(false);
  const [visualLoading, setVisualLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [playingIdx, setPlayingIdx] = useState(null);
  const audioRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  const newChat = () => {
    setMessages([]);
    setSessionId(null);
    stopAudio();
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingIdx(null);
  };

  const playTTS = async (text, idx) => {
    stopAudio();
    try {
      const token = localStorage.getItem("mindora_token");
      const res = await fetch(`${API_BASE}/voice/tts`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text, voice: "nova" }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      setPlayingIdx(idx);
      audio.onended = () => {
        setPlayingIdx(null);
        URL.revokeObjectURL(url);
      };
      await audio.play();
    } catch {
      setPlayingIdx(null);
    }
  };

  const fetchVisual = async (question, response, idx) => {
    setVisualLoading(true);
    try {
      const { data } = await api.post("/visual/generate", { question, response });
      if (data && data.type !== "none") {
        setMessages((m) => {
          const copy = [...m];
          if (copy[idx]) copy[idx] = { ...copy[idx], visual: data };
          return copy;
        });
      }
    } catch {}
    setVisualLoading(false);
  };

  const sendMessage = async (text) => {
    const q = (text ?? input).trim();
    if (!q || streaming) return;
    setInput("");
    stopAudio();
    const userIdx = messages.length;
    const aiIdx = userIdx + 1;
    setMessages((m) => [...m, { role: "user", content: q }, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const token = localStorage.getItem("mindora_token");
      const res = await fetch(`${API_BASE}/chat/teach`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          question: q,
          subject: subjectHint || undefined,
          session_id: sessionId,
          model,
          lesson_slug: lessonSlug || undefined,
        }),
      });
      if (!res.ok || !res.body) {
        setMessages((m) => {
          const copy = [...m];
          copy[aiIdx] = { role: "assistant", content: "Hmm, something went wrong. Try again." };
          return copy;
        });
        setStreaming(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop() || "";
        for (const ev of events) {
          const line = ev.trim();
          if (!line.startsWith("data:")) continue;
          const json = line.slice(5).trim();
          try {
            const obj = JSON.parse(json);
            if (obj.type === "session") setSessionId(obj.session_id);
            else if (obj.type === "delta") {
              fullText += obj.content;
              setMessages((m) => {
                const copy = [...m];
                copy[aiIdx] = { role: "assistant", content: (copy[aiIdx]?.content || "") + obj.content };
                return copy;
              });
            } else if (obj.type === "error") {
              setMessages((m) => {
                const copy = [...m];
                copy[aiIdx] = { role: "assistant", content: `Error: ${obj.message}` };
                return copy;
              });
            }
          } catch {}
        }
      }
      // Fire visual + TTS after full message arrives
      if (fullText) {
        fetchVisual(q, fullText, aiIdx);
        if (autoSpeak) playTTS(fullText, aiIdx);
      }
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[aiIdx] = { role: "assistant", content: "Network hiccup. Please try again." };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  };

  const handleVoice = async (blob) => {
    try {
      const form = new FormData();
      form.append("audio", blob, "input.webm");
      form.append("language", "en");
      const token = localStorage.getItem("mindora_token");
      const res = await fetch(`${API_BASE}/voice/stt`, {
        method: "POST",
        credentials: "include",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: form,
      });
      if (!res.ok) return;
      const { text } = await res.json();
      if (text && text.trim()) sendMessage(text.trim());
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col" data-testid="chat-page">
      <header className="border-b border-white/[0.06] sticky top-0 z-30 bg-[#0A0A0F]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-white/60 hover:text-white" data-testid="chat-back-btn">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              <div>
                <div className="text-sm">Mindora Companion</div>
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">
                  {subjectHint || "free conversation"}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setAutoSpeak(!autoSpeak); if (autoSpeak) stopAudio(); }}
              data-testid="chat-autospeak-toggle"
              className={`px-3 py-1.5 rounded-full text-xs inline-flex items-center gap-1.5 transition-all ${
                autoSpeak ? "bg-indigo-500/15 border border-indigo-500/30 text-indigo-200" : "glass text-white/60"
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" /> {autoSpeak ? "Voice on" : "Voice off"}
            </button>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              data-testid="chat-model-select"
              className="bg-[#13131A] border border-white/[0.08] rounded-full px-3 py-1.5 text-xs text-white outline-none"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#13131A]">{m.label}</option>
              ))}
            </select>
            <button
              onClick={newChat}
              data-testid="chat-new-btn"
              className="px-3 py-1.5 rounded-full glass text-xs text-white/70 hover:text-white inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          </div>
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-10">
          {messages.length === 0 && (
            <div className="text-center mt-10">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-mono uppercase tracking-[0.2em] text-indigo-300/80 mb-6"
              >
                <Sparkles className="w-3.5 h-3.5" /> Don't give answers. Build understanding.
              </motion.div>
              <h1 className="font-heading text-3xl md:text-4xl tracking-tight font-medium">
                What are you <span className="text-gradient-brand">curious</span> about, {user?.name?.split(" ")[0] || "friend"}?
              </h1>
              <p className="mt-3 text-white/55 text-sm max-w-md mx-auto">
                Ask anything — by text or voice. Mindora guides you through stories, examples, and visuals.
              </p>

              <div className="mt-10 grid sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    data-testid={`chat-starter-${s.replace(/\W+/g, "-").toLowerCase()}`}
                    className="text-left px-4 py-3 rounded-2xl glass hover:bg-white/[0.05] transition-colors text-sm text-white/80"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
                  data-testid={`chat-msg-${m.role}-${i}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-9 h-9 rounded-xl glass-strong flex items-center justify-center shrink-0">
                      <Brain className="w-4 h-4 text-indigo-300" />
                    </div>
                  )}
                  <div className={`max-w-[85%] ${m.role === "user" ? "" : "w-full"}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        m.role === "user" ? "bg-indigo-500 text-white" : "glass text-white/90"
                      }`}
                    >
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {m.content}
                        {streaming && i === messages.length - 1 && m.role === "assistant" && (
                          <motion.span
                            animate={{ opacity: [0.2, 1, 0.2] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                            className="inline-block ml-1 w-1.5 h-4 bg-indigo-300 align-middle"
                          />
                        )}
                      </div>
                      {m.role === "assistant" && m.content && (
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={() => playingIdx === i ? stopAudio() : playTTS(m.content, i)}
                            data-testid={`tts-btn-${i}`}
                            className="text-[11px] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/60 hover:text-white"
                          >
                            {playingIdx === i ? <><Pause className="w-3 h-3" /> Pause</> : <><Volume2 className="w-3 h-3" /> Listen</>}
                          </button>
                          {visualLoading && i === messages.length - 1 && (
                            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-violet-300/70 inline-flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" /> drawing visual
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {m.visual && <Visual visual={m.visual} />}
                  </div>
                  {m.role === "user" && (
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 text-xs font-medium text-indigo-200">
                      {user?.name?.[0] || "U"}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <div className="border-t border-white/[0.06] bg-[#0A0A0F]/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="flex items-center gap-2 glass-strong rounded-full pl-5 pr-2 py-2 focus-within:ring-1 focus-within:ring-indigo-500"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Mindora — or hit the mic to speak"
              data-testid="chat-input"
              disabled={streaming}
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/40 py-2"
            />
            <VoiceRecorder onRecorded={handleVoice} disabled={streaming} />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              data-testid="chat-send-btn"
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center disabled:opacity-40 hover:scale-105 transition-transform"
            >
              {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
          <div className="mt-2 text-center text-[10px] font-mono uppercase tracking-[0.18em] text-white/30">
            Voice powered by OpenAI Whisper + TTS · Visuals by Claude & Gemini
          </div>
        </div>
      </div>
    </div>
  );
}
