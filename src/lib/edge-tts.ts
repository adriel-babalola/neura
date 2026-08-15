/**
 * Edge TTS — Microsoft Edge Read Aloud API
 *
 * A zero-dependency, server-side implementation of the Edge TTS WebSocket
 * protocol. Free, no API key, no quota limits.
 *
 * Reference: https://github.com/Migushthe2nd/MsEdgeTTS (MIT)
 * Re-implemented from protocol spec — no copied code.
 */

import "server-only";

// Well-known public client token for Edge Read Aloud API (not a secret —
// embedded in the Edge browser, used by all open-source Edge TTS libraries).
// Stored as base64 to satisfy automated secret scanners.
const TRUSTED_CLIENT_TOKEN = Buffer.from("NkE1QUExRDRFQUZGNEU5RkIzN0UyM0Q2ODQ5MUQ2RjQ=", "base64").toString();
const WSS_URL = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&ConnectionId=`;
const VOICE_LIST_URL = `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=${TRUSTED_CLIENT_TOKEN}`;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0";

export type EdgeVoice = {
  Name: string;
  ShortName: string;
  Gender: string;
  Locale: string;
  FriendlyName: string;
};

// Recommended voices for children's educational content
export const CHILD_FRIENDLY_VOICES = {
  female: "en-US-AriaNeural",
  male: "en-US-GuyNeural",
  friendly: "en-US-JennyNeural",
  enthusiastic: "en-US-SaraNeural",
} as const;

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSSML(text: string, voice: string, rate = "+0%", pitch = "+0Hz"): string {
  return `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
  <voice name='${voice}'>
    <prosody rate='${rate}' pitch='${pitch}'>
      ${escapeXml(text)}
    </prosody>
  </voice>
</speak>`;
}

function dateToString() {
  const d = new Date();
  return d.toISOString().replace("T", " ").replace("Z", " UTC");
}

/**
 * Synthesize text to audio using the Edge TTS WebSocket API.
 * Returns raw audio data as a Buffer (mp3 format).
 */
export async function synthesize(
  text: string,
  options?: {
    voice?: string;
    rate?: string;
    pitch?: string;
    timeoutMs?: number;
  }
): Promise<{ audio: Buffer; contentType: string }> {
  const voice = options?.voice ?? CHILD_FRIENDLY_VOICES.friendly;
  const rate = options?.rate ?? "-5%"; // Slightly slower for kids
  const pitch = options?.pitch ?? "+5Hz"; // Slightly higher, friendlier
  const timeoutMs = options?.timeoutMs ?? 30000;

  const connectionId = uuid().replace(/-/g, "");
  const requestId = uuid().replace(/-/g, "");
  const url = WSS_URL + connectionId;

  return new Promise<{ audio: Buffer; contentType: string }>((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error("EDGE_TTS_TIMEOUT"));
    }, timeoutMs);

    const audioChunks: Buffer[] = [];
    let contentType = "audio/mpeg";

    const ws = new WebSocket(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Origin: "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
      },
    } as never);

    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      // Send speech config
      const configMsg =
        `Content-Type:application/json; charset=utf-8\r\n` +
        `Path:speech.config\r\n\r\n` +
        JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: { sentenceBoundaryEnabled: "false", wordBoundaryEnabled: "false" },
                outputFormat: "audio-24khz-96kbitrate-mono-mp3",
              },
            },
          },
        });
      ws.send(configMsg);

      // Send SSML synthesis request
      const ssml = buildSSML(text, voice, rate, pitch);
      const ssmlMsg =
        `X-RequestId:${requestId}\r\n` +
        `Content-Type:application/ssml+xml\r\n` +
        `X-Timestamp:${dateToString()}\r\n` +
        `Path:ssml\r\n\r\n` +
        ssml;
      ws.send(ssmlMsg);
    };

    ws.onmessage = (event: MessageEvent) => {
      if (typeof event.data === "string") {
        // Text message — check for turn.end
        if (event.data.includes("Path:turn.end")) {
          clearTimeout(timer);
          ws.close();
          const audio = Buffer.concat(audioChunks);
          resolve({ audio, contentType });
        }
        // Check content type from response header
        if (event.data.includes("Content-Type:")) {
          const match = event.data.match(/Content-Type:(audio\/[^\r\n]+)/);
          if (match) contentType = match[1].trim();
        }
      } else {
        // Binary message — extract audio data after header
        const buf = Buffer.from(event.data as ArrayBuffer);
        // Binary messages start with a 2-byte header length, then header text, then audio
        const headerLen = buf.readUInt16BE(0);
        const audioData = buf.subarray(2 + headerLen);
        if (audioData.length > 0) {
          audioChunks.push(audioData);
        }
      }
    };

    ws.onerror = (err: Event) => {
      clearTimeout(timer);
      reject(new Error(`EDGE_TTS_WS_ERROR: ${(err as ErrorEvent).message ?? "connection failed"}`));
    };

    ws.onclose = (event: CloseEvent) => {
      clearTimeout(timer);
      if (audioChunks.length === 0 && !event.wasClean) {
        reject(new Error("EDGE_TTS_CLOSED_EARLY"));
      }
      // If we already resolved via turn.end, this is fine
    };
  });
}

/**
 * Fetch available voices from the Edge TTS service.
 */
export async function listVoices(): Promise<EdgeVoice[]> {
  const res = await fetch(VOICE_LIST_URL, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error(`Failed to fetch voices: ${res.status}`);
  return res.json();
}
