const CACHE_NAME = "tamilanda-wallet-v4";

const APP_FILES = [
  "./",
  "./index.html",

  "./css/style.css",
  "./js/app.js",

  "./manifest.json",

  "./pages/income.html",
  "./pages/expense.html",
  "./pages/accounts.html",
  "./pages/transactions.html",
  "./pages/buyers.html",
  "./pages/give-money.html",
  "./pages/emi.html",
  "./pages/reports.html",
  "./pages/calculator.html",
  "./pages/settings.html",
  "./pages/recurring.html",
  "./pages/more.html",
  "./pages/privacy.html",
  "./pages/about.html",
  "./pages/notifications.html",
  "./pages/dashboard.html",
  "./pages/profile.html",
  "./pages/security.html",
  "./pages/trash.html",
  "./pages/transfer.html",
  "./pages/net-worth.html",
  "./pages/search.html",
  "./pages/backup.html",
  "./pages/attachments.html",
  "./pages/export.html",
  "./pages/quick-add.html",
  "./pages/calendar.html",

  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (
          response &&
          response.status === 200 &&
          response.type === "basic"
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, clone))
            .catch(() => {});
        }

        return response;
      })
      .catch(() =>
        caches.match(event.request)
          .then(cached => {
            if (cached) {
              return cached;
            }

            if (event.request.mode === "navigate") {
              return caches.match("./index.html");
            }

            return new Response("Offline", {
              status: 503,
              statusText: "Offline"
            });
          })
      )
  );
});
