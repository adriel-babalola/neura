declare module "kokoro-js" {
  export interface KokoroTTSOptions {
    dtype?: "fp32" | "fp16" | "q8" | "q4";
    device?: "webgpu" | "wasm" | "cpu";
  }

  export interface KokoroGenerateOptions {
    voice?: string;
    speed?: number;
  }

  export interface KokoroAudioData {
    audio: Float32Array;
    sampling_rate: number;
  }

  export class KokoroTTS {
    static from_pretrained(
      modelId: string,
      options?: KokoroTTSOptions
    ): Promise<KokoroTTS>;

    generate(
      text: string,
      options?: KokoroGenerateOptions
    ): Promise<KokoroAudioData>;
  }
}
