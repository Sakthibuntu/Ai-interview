import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

export enum ConnectionState {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
  FALLBACK = 'fallback'
}

export class GeminiLiveService {
  private ai: any;
  private session: any;
  private sessionPromise: Promise<any> | null = null;
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private state: ConnectionState = ConnectionState.IDLE;
  private retryCount = 0;
  private maxRetries = 2;
  private _isMuted = false;

  onMessage: (text: string, audio?: string) => void = () => {};
  onStateChange: (state: ConnectionState) => void = () => {};
  onInterrupted: () => void = () => {};

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.ai = new GoogleGenAI({ apiKey: apiKey || "" });
  }

  set muted(val: boolean) {
    this._isMuted = val;
  }

  async connect(systemInstruction: string) {
    this.setState(ConnectionState.CONNECTING);
    
    try {
      this.sessionPromise = this.ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction,
        },
        callbacks: {
          onopen: () => {
            this.setState(ConnectionState.CONNECTED);
            this.startAudioCapture();
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn) {
              const parts = message.serverContent.modelTurn.parts;
              for (const part of parts) {
                if (part.inlineData) {
                  this.onMessage("", part.inlineData.data);
                }
                if (part.text) {
                  this.onMessage(part.text);
                }
              }
            }
            if (message.serverContent?.interrupted) {
              this.onInterrupted();
            }
          },
          onclose: () => {
            if (this.state !== ConnectionState.IDLE && this.state !== ConnectionState.FALLBACK) {
              this.handleReconnect();
            }
          },
          onerror: (err: any) => {
            console.error("Live API Error:", err);
            this.handleReconnect();
          }
        }
      });

      this.session = await this.sessionPromise;
    } catch (err) {
      console.error("Connection failed:", err);
      this.handleReconnect();
    }
  }

  private async startAudioCapture() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (this.state !== ConnectionState.CONNECTED || this._isMuted || !this.session) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = this.floatTo16BitPCM(inputData);
        
        // Safer base64 encoding for binary data
        const uint8 = new Uint8Array(pcmData.buffer);
        let binary = '';
        for (let i = 0; i < uint8.length; i++) {
          binary += String.fromCharCode(uint8[i]);
        }
        const base64Data = btoa(binary);
        
        this.session.sendRealtimeInput({
          media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
        });
      };

      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (err) {
      console.error("Audio capture failed:", err);
      this.setState(ConnectionState.ERROR);
    }
  }

  private floatTo16BitPCM(input: Float32Array) {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
  }

  private handleReconnect() {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState(ConnectionState.RECONNECTING);
      setTimeout(() => this.connect(""), 2000); // Re-connect with empty instruction or cached one
    } else {
      this.setState(ConnectionState.FALLBACK);
    }
  }

  private setState(state: ConnectionState) {
    this.state = state;
    this.onStateChange(state);
  }

  disconnect() {
    this.setState(ConnectionState.IDLE);
    this.session?.close();
    this.processor?.disconnect();
    this.audioContext?.close();
    this.stream?.getTracks().forEach(t => t.stop());
  }

  sendText(text: string) {
    if (this.session) {
      this.session.sendRealtimeInput({
        text
      });
    }
  }
}
