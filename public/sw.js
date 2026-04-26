// SoftSpace Service Worker — handles scheduled reminder notifications
// even when the app tab is not active.
//
// Limitation: if the browser itself is fully closed, the SW is suspended
// and notifications cannot fire until the browser reopens the SW.

const pendingTimers = new Map(); // reminder id → setTimeout handle

// ── Install / activate ───────────────────────────────────────────────────────
self.addEventListener("install",  () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// ── Message from the app: schedule or cancel reminders ───────────────────────
self.addEventListener("message", (event) => {
  const { type, reminders } = event.data || {};
  if (type !== "SYNC_REMINDERS") return;

  // Clear every existing timer first
  pendingTimers.forEach((handle) => clearTimeout(handle));
  pendingTimers.clear();

  const now = Date.now();

  (reminders || []).forEach((r) => {
    const due   = new Date(r.datetime).getTime();
    const delay = due - now;

    // Skip reminders that are already past or more than 7 days away
    // (SW is likely to restart before then anyway)
    if (delay <= 0 || delay > 7 * 24 * 60 * 60 * 1000) return;

    const handle = setTimeout(() => {
      self.registration.showNotification(`⏰ ${r.title}`, {
        body:             r.note || "Your SoftSpace reminder is here!",
        icon:             "/Favicon.png",
        badge:            "/Favicon.png",
        tag:              r.id,
        requireInteraction: true,
        data:             { reminderId: r.id },
      });
      pendingTimers.delete(r.id);
    }, delay);

    pendingTimers.set(r.id, handle);
  });

  // Acknowledge back to the page
  if (event.ports && event.ports[0]) {
    event.ports[0].postMessage({ status: "ok", scheduled: pendingTimers.size });
  }
});

// ── Notification click → focus / open the app ────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If a SoftSpace tab is already open, focus it
        const existing = clientList.find(
          (c) => c.url.startsWith(self.location.origin)
        );
        if (existing && "focus" in existing) return existing.focus();
        // Otherwise open a new tab
        return self.clients.openWindow(self.location.origin);
      })
  );
});
