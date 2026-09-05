const CACHE_NAME = "tamilanda-wallet-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",

  "./pages/income.html",
  "./pages/expense.html",
  "./pages/accounts.html",
  "./pages/transactions.html",
  "./pages/buyers.html",
  "./pages/give-money.html",
  "./pages/emi.html",
  "./pages/reports.html",

  "./manifest.json"
];


/* =========================
   INSTALL
========================= */

self.addEventListener(
  "install",
  event => {

    event.waitUntil(

      caches.open(CACHE_NAME)
        .then(cache => {

          return cache.addAll(
            APP_FILES
          );

        })

    );


    self.skipWaiting();

  }
);


/* =========================
   ACTIVATE
========================= */

self.addEventListener(
  "activate",
  event => {

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
                  caches.delete(
                    cacheName
                  )
              )

          );

        })

    );


    self.clients.claim();

  }
);


/* =========================
   FETCH
========================= */

self.addEventListener(
  "fetch",
  event => {

    /*
      Only handle GET requests.
    */

    if (
      event.request.method !== "GET"
    ) {

      return;

    }


    event.respondWith(

      caches.match(
        event.request
      )
      .then(cachedResponse => {

        /*
          If file is already cached,
          use the cached version.
        */

        if (cachedResponse) {

          return cachedResponse;

        }


        /*
          Otherwise try the network.
        */

        return fetch(
          event.request
        )
        .then(networkResponse => {

          /*
            Save successful responses
            for future offline use.
          */

          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type !== "opaque"
          ) {

            const responseClone =
              networkResponse.clone();


            caches.open(
              CACHE_NAME
            )
            .then(cache => {

              cache.put(
                event.request,
                responseClone
              );

            });

          }


          return networkResponse;

        })
        .catch(() => {

          /*
            If network fails,
            try returning the main page.
          */

          return caches.match(
            "./index.html"
          );

        });

      })

    );

  }
);
