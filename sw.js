self.addEventListener("install", event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
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
