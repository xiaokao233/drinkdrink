self.__GENYIKOU_CACHE_VERSION__ = "v2-font-fullscreen";
const CACHE_NAME = `genyikou-shell-${self.__GENYIKOU_CACHE_VERSION__}`;
const APP_SHELL = [
  "/",
  "/index.html",
  "/client.js",
  "/styles.css",
  "/manifest.webmanifest",
  "/assets/fonts/MaokenAssortedSans.woff2",
  "/assets/app-icons/app-icon-192.png",
  "/assets/app-icons/app-icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(APP_SHELL.map(url => cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith("genyikou-shell-") && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      const cached = await caches.match(request, { ignoreSearch: request.mode === "navigate" });
      if (cached) return cached;
      if (request.mode === "navigate") {
        return (await caches.match("/")) || new Response("暂时离线，请联网后重试。", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      }
      return Response.error();
    }
  })());
});

self.addEventListener("push", event => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    data = { body: event.data?.text() || "有朋友喊你跟一口。" };
  }

  const title = data.title || "跟一口";
  const options = {
    body: data.body || "有朋友喊你跟一口。",
    icon: "/assets/icons/bell.png",
    badge: "/assets/icons/bell.png",
    tag: data.tag || "genyikou-signal",
    renotify: true,
    vibrate: [80, 45, 80],
    data: { url: data.url || "/" }
  };
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const foregroundUpdate = Promise.all(windows.map(client => client.postMessage({
      type: "genyikou-push",
      category: data.category || "drink",
      url: data.url || "/"
    })));
    await Promise.all([
      self.registration.showNotification(title, options),
      foregroundUpdate
    ]);
  })());
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin !== self.location.origin) continue;
      await client.navigate(targetUrl);
      return client.focus();
    }
    return self.clients.openWindow(targetUrl);
  })());
});
