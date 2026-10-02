/**
 * Neura service worker.
 *
 * Goal: the app opens and a lesson is playable with no network. Neura is used
 * on poor connections and in regions with intermittent data, so "offline" is a
 * normal state rather than an error state.
 *
 * Strategy per resource:
 *   navigations      network-first, fall back to the cached page
 *   build assets     cache-first (content-hashed, safe to keep)
 *   API + narration  never cached (per-child data, must not be shared)
 *
 * Nothing is precached from a build manifest: asset filenames change on every
 * deploy, and a stale precache list would serve last week's JavaScript.
 * Everything is captured at runtime instead.
 */

const VERSION = "neura-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;

const NEVER_CACHE = ["/api/"];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => !n.startsWith(VERSION)).map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

function neverCache(url) {
  return NEVER_CACHE.some((prefix) => url.pathname.startsWith(prefix));
}

async function networkFirst(event, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(event.request);
    if (response.ok) cache.put(event.request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(event.request);
    if (cached) return cached;
    // Last resort for a page never visited while online.
    const shell = await cache.match("/child/latest");
    if (shell) return shell;
    return new Response("Offline and no cached page available.", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

async function cacheFirst(event, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(event.request);
  if (cached) return cached;
  try {
    const response = await fetch(event.request);
    if (response.ok) cache.put(event.request, response.clone());
    return response;
  } catch {
    return new Response("", { status: 504 });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (neverCache(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(event, SHELL_CACHE));
    return;
  }

  // Build output and other static assets are content-hashed and safe to reuse.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.match(/\.(?:js|css|woff2?|png|svg|ico|webp)$/)) {
    event.respondWith(cacheFirst(event, ASSET_CACHE));
  }
});