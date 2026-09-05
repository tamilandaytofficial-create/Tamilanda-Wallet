const CACHE_NAME = "tamilanda-wallet-v2";

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
      .then(cache => {

        return cache.addAll(APP_FILES);

      })

      .then(() => {

        return self.skipWaiting();

      })

  );

});


self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys()
      .then(cacheNames => {

        return Promise.all(

          cacheNames
            .filter(
              cacheName =>
                cacheName !== CACHE_NAME
            )
            .map(
              cacheName =>
                caches.delete(cacheName)
            )

        );

      })

      .then(() => {

        return self.clients.claim();

      })

  );

});


self.addEventListener("fetch", event => {

  if (
    event.request.method !== "GET"
  ) {
    return;
  }


  event.respondWith(

    caches.match(event.request)
      .then(cachedResponse => {

        if (cachedResponse) {

          return cachedResponse;

        }


        return fetch(event.request)
          .then(networkResponse => {

            if (
              !networkResponse ||
              networkResponse.status !== 200 ||
              networkResponse.type !== "basic"
            ) {

              return networkResponse;

            }


            const responseClone =
              networkResponse.clone();


            caches.open(CACHE_NAME)
              .then(cache => {

                cache.put(
                  event.request,
                  responseClone
                );

              });


            return networkResponse;

          })

          .catch(() => {

            return caches.match(
              "./index.html"
            );

          });

      })

  );

});
