import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, PhoneOff, MessageSquare, AlertCircle, Loader2, Clock } from 'lucide-react';
import { GeminiLiveService, ConnectionState } from '../services/geminiLive';
import { TranscriptTurn, InterviewMode, Difficulty } from '../types';

interface InterviewRoomProps {
  config: {
    id: string;
    mode: InterviewMode;
    difficulty: Difficulty;
    duration: number;
    company: string;
    role: string;
    website: string;
  };
  onEnd: (transcript: TranscriptTurn[]) => void;
}

export const InterviewRoom: React.FC<InterviewRoomProps> = ({ config, onEnd }) => {
  const [state, setState] = useState<ConnectionState>(ConnectionState.IDLE);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(config.duration * 60);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState("");
  
  const liveService = useRef<GeminiLiveService | null>(null);
  const audioQueue = useRef<string[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isPlaying = useRef(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
    liveService.current = new GeminiLiveService();
    
    const systemInstruction = `
      You are conducting a ${config.difficulty} level ${config.mode} interview for the role of ${config.role} at ${config.company}.
      
      Difficulty Behavior:
      - ${config.difficulty === Difficulty.EASY ? 'Supportive, guiding, hints allowed.' : ''}
      - ${config.difficulty === Difficulty.MEDIUM ? 'Professional, probing for metrics and tradeoffs.' : ''}
      - ${config.difficulty === Difficulty.HARD ? 'Strict, skeptical, blunt-but-professional. Call out weak answers. Force specificity. "That’s vague. Give me a concrete example and measurable impact."' : ''}
      
      Interviewer Persona:
      - A professional interviewer and subject matter expert in ${config.role}.
      
      Rules:
      - Start by introducing yourself and the context.
      - Keep responses concise to allow for a natural conversation.
      - If the user is silent, prompt them gently.
      - End the interview if the user says they are done or if time runs out.
    `;

    liveService.current.onStateChange = (s) => setState(s);
    liveService.current.onMessage = (text, audio) => {
      if (text) {
        setLastMessage(text);
        setTranscript(prev => [...prev, {
          speaker: 'interviewer',
          text,
          timestamp_start: new Date(startTime.current + (config.duration * 60 - timeLeft) * 1000).toISOString(),
          timestamp_end: new Date().toISOString()
        }]);
      }
      if (audio) {
        audioQueue.current.push(audio);
        playNextAudio();
      }
    };

    liveService.current.onInterrupted = () => {
      audioQueue.current = [];
      if (currentSourceRef.current) {
        try {
          currentSourceRef.current.stop();
        } catch (e) {}
        currentSourceRef.current = null;
      }
      isPlaying.current = false;
      setIsSpeaking(false);
    };

    liveService.current.connect(systemInstruction);

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 0) {
          handleEnd();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      liveService.current?.disconnect();
      clearInterval(timer);
    };
  }, []);

  const playNextAudio = async () => {
    if (isPlaying.current || audioQueue.current.length === 0) return;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    isPlaying.current = true;
    setIsSpeaking(true);
    const base64 = audioQueue.current.shift()!;
    
    try {
      // Decode base64 to binary
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert 16-bit PCM to Float32
      const int16Data = new Int16Array(bytes.buffer);
      const float32Data = new Float32Array(int16Data.length);
      for (let i = 0; i < int16Data.length; i++) {
        float32Data[i] = int16Data[i] / 32768.0;
      }

      // Create AudioBuffer
      const audioBuffer = audioContextRef.current.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      currentSourceRef.current = source;
      
      source.onended = () => {
        if (currentSourceRef.current === source) {
          currentSourceRef.current = null;
        }
        isPlaying.current = false;
        if (audioQueue.current.length === 0) {
          setIsSpeaking(false);
        }
        playNextAudio();
      };
      source.start();
    } catch (err) {
      console.error("Audio playback error:", err);
      isPlaying.current = false;
      setIsSpeaking(false);
      playNextAudio();
    }
  };

  const handleMuteToggle = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (liveService.current) {
      liveService.current.muted = newMuted;
    }
  };

  const handleEnd = () => {
    onEnd(transcript);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-white/60 uppercase tracking-wider">
            {config.mode} • {config.difficulty}
          </div>
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm">
            <Clock size={14} />
            {formatTime(timeLeft)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${state === ConnectionState.CONNECTED ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs text-white/40 uppercase tracking-widest">{state}</span>
        </div>
      </div>

      {/* Main Stage */}
      <div className="aspect-video bg-white/5 border border-white/10 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center p-12">
        {/* Avatars / Waveform */}
        <div className="relative flex items-center justify-center gap-12 mb-12">
          <div className="relative">
            <motion.div 
              animate={{ scale: isSpeaking ? [1, 1.1, 1] : 1 }}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center relative z-10`}
            >
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 bg-white/20 rounded-sm rotate-45" />
              </div>
            </motion.div>
            {/* Speaking Ring */}
            <AnimatePresence>
              {isSpeaking && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 0.5 }}
                  exit={{ scale: 2, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 rounded-full border-2 border-emerald-500/30"
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Captions */}
        <div className="text-center max-w-xl">
          <p className="text-xl text-white/80 leading-relaxed italic">
            {lastMessage || "Connecting to interviewers..."}
          </p>
        </div>

        {/* Status Overlay */}
        <AnimatePresence>
          {state !== ConnectionState.CONNECTED && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20"
            >
              {state === ConnectionState.CONNECTING || state === ConnectionState.RECONNECTING ? (
                <>
                  <Loader2 size={48} className="text-emerald-500 animate-spin mb-4" />
                  <p className="text-lg font-medium">{state === ConnectionState.RECONNECTING ? 'Reconnecting...' : 'Establishing Secure Link...'}</p>
                </>
              ) : state === ConnectionState.ERROR || state === ConnectionState.FALLBACK ? (
                <>
                  <AlertCircle size={48} className="text-red-500 mb-4" />
                  <p className="text-lg font-medium mb-2">Connection Interrupted</p>
                  <p className="text-white/40 text-sm mb-6">Switching to text fallback mode.</p>
                  <button 
                    onClick={() => setState(ConnectionState.CONNECTED)}
                    className="bg-white text-black px-6 py-2 rounded-xl font-medium"
                  >
                    Continue in Text Mode
                  </button>
                </>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6">
        <button 
          onClick={handleMuteToggle}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        
        <button 
          onClick={handleEnd}
          className="px-10 h-16 bg-red-500 hover:bg-red-400 text-white rounded-full font-medium flex items-center gap-3 transition-all shadow-lg shadow-red-500/20"
        >
          <PhoneOff size={20} />
          End Session
        </button>

        <button className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
          <MessageSquare size={24} />
        </button>
      </div>
    </div>
  );
};
