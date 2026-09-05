const CACHE_NAME = "tamilanda-wallet-v3";

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


/* =========================================================
   INSTALL
   ========================================================= */

self.addEventListener("install", event => {

  event.waitUntil(

    caches.open(CACHE_NAME)

      .then(cache => {

        return cache.addAll(APP_FILES);

      })

      .then(() => {

        /*
         * Activate the new service worker immediately.
         */

        return self.skipWaiting();

      })

  );

});


/* =========================================================
   ACTIVATE
   ========================================================= */

self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys()

      .then(cacheNames => {

        return Promise.all(

          cacheNames

            .filter(cacheName => {

              return cacheName !== CACHE_NAME;

            })

            .map(cacheName => {

              return caches.delete(cacheName);

            })

        );

      })

      .then(() => {

        /*
         * Take control of already-open pages.
         */

        return self.clients.claim();

      })

  );

});


/* =========================================================
   FETCH
   ========================================================= */

/*
 * IMPORTANT:
 *
 * This app uses NETWORK-FIRST.
 *
 * Latest GitHub Pages files are requested first.
 *
 * If the network is unavailable:
 *      -> use cached version
 *
 * This prevents old app.js / HTML files from
 * permanently blocking newer GitHub updates.
 */

self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") {
    return;
  }


  event.respondWith(

    fetch(event.request)

      .then(networkResponse => {

        /*
         * Only cache successful same-origin responses.
         */

        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === "basic"
        ) {

          const responseClone =
            networkResponse.clone();


          caches.open(CACHE_NAME)

            .then(cache => {

              cache.put(
                event.request,
                responseClone
              );

            })

            .catch(error => {

              console.warn(
                "Cache update failed:",
                error
              );

            });

        }


        return networkResponse;

      })

      .catch(() => {

        /*
         * Network unavailable.
         *
         * Fall back to cached response.
         */

        return caches.match(event.request)

          .then(cachedResponse => {

            if (cachedResponse) {

              return cachedResponse;

            }


            /*
             * If a page is unavailable offline,
             * return the cached home page.
             */

            if (
              event.request.mode === "navigate"
            ) {

              return caches.match(
                "./index.html"
              );

            }


            return new Response(
              "Offline",
              {
                status: 503,
                statusText: "Offline"
              }
            );

          });

      })

  );

});
