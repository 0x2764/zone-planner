"use strict";

/* =====================================================================
 *  ZONE PLANNER — service worker.
 *
 *  Makes the installed game work offline. The whole game is a single
 *  self-contained HTML file, so "the app shell" is that file plus the
 *  icons + manifest — precache those and the game runs with no network.
 *  Google Fonts are the one runtime dependency; they're cache-first
 *  runtime-cached so the intended typefaces survive offline after the
 *  first online load.
 *
 *  The CACHE version below is stamped by build.js with a content hash of the
 *  built HTML, so every deploy changes this file's bytes → the browser installs
 *  a fresh worker → activate() purges the previous cache. No manual
 *  cache-busting needed.
 * ===================================================================== */

const CACHE = "zone-planner-{{VERSION}}";

// Relative so it works under the GitHub Pages sub-path (/zone-planner/) and
// from any other location the self-contained build is copied to.
const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png",
];

const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if(req.method !== "GET") return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = FONT_HOSTS.includes(url.host);
  if(!sameOrigin && !isFont) return; // let the browser handle anything else

  // Cache-first: serve from cache when we have it, otherwise fetch and (for
  // fonts) stash a copy so they're available offline next time. On a failed
  // navigation with an empty cache, fall back to the cached app shell.
  event.respondWith(
    caches.match(req).then(cached => {
      if(cached) return cached;
      return fetch(req).then(res => {
        if(isFont && res.ok){
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => {
        if(req.mode === "navigate") return caches.match("./index.html");
        return Response.error();
      });
    })
  );
});
