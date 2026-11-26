// Service worker for supervisor field attendance only.
//
// Caches: the field-attendance page shells (network-first) and hashed Next.js
// static assets (cache-first, bounded). It never caches API responses,
// authentication, or any other page. Caches are deleted on logout
// (utils/auth.clearSession) and when this worker's version changes.
const VERSION = "v1";
const SHELL = `synapsis-field-shell-${VERSION}`;
const STATIC = `synapsis-field-static-${VERSION}`;
const PAGES = ["/teacherLayout/fieldattendance", "/coordinatorlayout/fieldattendance"];
const MAX_STATIC = 300;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("synapsis-field-") && k !== SHELL && k !== STATIC).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const trim = async () => {
  const cache = await caches.open(STATIC);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_STATIC; i++) await cache.delete(keys[i]);
};

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // API and other origins pass through untouched

  if (req.mode === "navigate" && PAGES.includes(url.pathname)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone(); // clone now, before the body is consumed
            caches.open(SHELL).then((c) => c.put(url.pathname, copy));
          }
          return res;
        })
        .catch(() => caches.open(SHELL).then((c) => c.match(url.pathname)).then((r) => r || Response.error()))
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC).then((c) =>
        c.match(req).then(
          (hit) =>
            hit ||
            fetch(req).then((res) => {
              if (res.ok) c.put(req, res.clone()).then(trim);
              return res;
            })
        )
      )
    );
  }
});
