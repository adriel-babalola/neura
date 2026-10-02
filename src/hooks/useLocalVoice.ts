"use client";

import { useState, useRef, useCallback } from "react";
import { KokoroTTS } from "kokoro-js";

export interface UseLocalVoiceReturn {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  isGenerating: boolean;
  isPlaying: boolean;
  error: string | null;
}

export function useLocalVoice(): UseLocalVoiceReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const ttsInstanceRef = useRef<KokoroTTS | null>(null);

  const stop = useCallback(() => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
        currentSourceRef.current.disconnect();
      } catch {
        // Ignore if already stopped
      }
      currentSourceRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text || !text.trim()) return;

    setError(null);
    setIsGenerating(true);
    stop();

    try {
      // 1. Initialize AudioContext for Web Audio API playback
      if (!audioContextRef.current) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }

      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      const modelId = "onnx-community/Kokoro-82M-v1.0-ONNX";
      const hasWebGPU = typeof navigator !== "undefined" && "gpu" in navigator && !!navigator.gpu;

      // 2. Initialize KokoroTTS instance with feature-detected backend
      if (!ttsInstanceRef.current) {
        if (hasWebGPU) {
          try {
            console.log("[KokoroTTS] WebGPU detected. Initializing ONNX GPU session...");
            ttsInstanceRef.current = await KokoroTTS.from_pretrained(modelId, {
              dtype: "fp32",
              device: "webgpu"
            });
          } catch (gpuErr) {
            console.warn("[KokoroTTS] WebGPU adapter initialization skipped/failed. Falling back to WASM:", gpuErr);
            ttsInstanceRef.current = null;
          }
        }

        if (!ttsInstanceRef.current) {
          console.log("[KokoroTTS] Initializing WASM CPU inference engine...");
          ttsInstanceRef.current = await KokoroTTS.from_pretrained(modelId, {
            dtype: "q8",
            device: "wasm"
          });
        }
      }

      // 3. Generate raw audio buffer from local TTS engine
      const audioData = await ttsInstanceRef.current.generate(text, {
        voice: "af_heart"
      });

      setIsGenerating(false);
      setIsPlaying(true);

      // 4. Decode & play Float32Array via Web Audio API
      const ctx = audioContextRef.current;
      const buffer = ctx.createBuffer(1, audioData.audio.length, audioData.sampling_rate);
      buffer.getChannelData(0).set(audioData.audio);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      source.onended = () => {
        setIsPlaying(false);
        currentSourceRef.current = null;
      };

      currentSourceRef.current = source;
      source.start(0);
    } catch (err) {
      console.warn("[useLocalVoice] In-browser Kokoro TTS fallback to Web Speech API:", err);
      setIsGenerating(false);

      // 5. Seamless fallback to browser Web Speech API if local ONNX engine is unavailable
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        setIsPlaying(true);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        setError(`Local TTS error: ${msg}`);
        setIsPlaying(false);
      }
    }
  }, [stop]);

  return { speak, stop, isGenerating, isPlaying, error };
}
