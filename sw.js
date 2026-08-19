// ============================================================================
// MRCS QBank Tracker — service worker (introduced v120)
// Goal: the Tracker (and Simulator) open and drill FULLY OFFLINE — cold start
// in airplane mode — while changing NOTHING about online behaviour.
//
// Strategy:
//   * Navigations (index.html / simulator.html / v116.html stub):
//       network-first with a 4s timeout, falling back to cache. Every good
//       network response refreshes the cached copy, so the offline copy always
//       tracks the latest deploy WITHOUT needing a sw.js bump per release.
//       Online users therefore always see fresh deploys — the SW can never
//       serve a stale app while the network is up.
//   * Same-origin assets (chart.umd.js, data/questions_*.json):
//       stale-while-revalidate — instant from cache, refreshed in background.
//       The data JSONs are the drill's last-resort bank fallback; precaching
//       them means a device that has NEVER run a drill online still gets
//       questions offline (IndexedDB empty + Supabase unreachable + JSON
//       served from this cache).
//   * Google Fonts (fonts.googleapis.com / fonts.gstatic.com):
//       cache-first. First-ever visit offline = system fonts (cosmetic only);
//       after one online visit the real fonts are cached.
//   * Supabase + every other cross-origin request: NOT intercepted. Sync
//       behaviour is byte-for-byte what it was in v119.
//
// Failure posture: every handler falls back to plain fetch semantics — if this
// worker ever errors, requests degrade to exactly what a no-SW page would do.
// Revert: deploy the self-unregistering sw.js from DEPLOY_v120.md (a SW can
// only be removed by replacing it — deleting the file 404s the update check
// and the old worker lives on).
// ============================================================================

const CACHE = 'mrcs-shell-v120';   // bump suffix to force a clean re-precache
const FONT_CACHE = 'mrcs-fonts-v1';
const NAV_TIMEOUT_MS = 4000;       // flaky 1-bar signal: give up and serve cache

const PRECACHE = [
    './',
    'index.html',
    'simulator.html',
    'v116.html',                   // 565-byte redirect stub — old bookmarks
    'chart.umd.js',
    'data/questions_csc.json',
    'data/questions_full.json'
];

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// --------------------------------------------------------------------------
// install: seed the shell cache. Files are fetched individually and misses are
// tolerated (a single 404 must not abort install); anything missed here gets
// picked up by runtime caching on first use.
self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE);
        await Promise.all(PRECACHE.map(async (path) => {
            try {
                const res = await fetch(path, { cache: 'no-cache' });
                if (res && res.ok) await cache.put(path, await cleanResponse(res));
            } catch (e) { /* offline install or missing file — tolerated */ }
        }));
        await self.skipWaiting();
    })());
});

// activate: drop caches from older SW versions, take over open pages now.
self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys
            .filter(k => (k.indexOf('mrcs-shell-') === 0 && k !== CACHE) ||
                         (k.indexOf('mrcs-fonts-') === 0 && k !== FONT_CACHE))
            .map(k => caches.delete(k)));
        await self.clients.claim();
    })());
});

// --------------------------------------------------------------------------
// A cached response that arrived via redirect (e.g. /MRCS-Tracker → /MRCS-Tracker/)
// may not legally be replayed for a navigation — rebuild it as a plain response.
async function cleanResponse(res) {
    if (!res.redirected) return res;
    const body = await res.blob();
    return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers });
}

function stripSearch(url) {
    const u = new URL(url);
    u.search = '';
    return u.href;
}

function fetchWithTimeout(request, ms) {
    return new Promise((resolve, reject) => {
        const ctrl = new AbortController();
        const timer = setTimeout(() => { ctrl.abort(); reject(new Error('nav fetch timeout')); }, ms);
        fetch(request, { signal: ctrl.signal }).then(
            (res) => { clearTimeout(timer); resolve(res); },
            (err) => { clearTimeout(timer); reject(err); }
        );
    });
}

// Navigations: network-first → cache → (for "/" paths) the index.html shell.
async function handleNavigation(event) {
    const req = event.request;
    const cache = await caches.open(CACHE);
    const key = stripSearch(req.url);
    try {
        const res = await fetchWithTimeout(req, NAV_TIMEOUT_MS);
        if (res && res.ok) {
            await cache.put(key, (await cleanResponse(res)).clone());
            return res.redirected ? cleanResponse(res) : res;
        }
        // 4xx/5xx (e.g. Pages mid-rebuild): prefer the cached copy if we have one
        const hit = await cache.match(key);
        return hit || res;
    } catch (e) {
        const hit = await cache.match(key);
        if (hit) return hit;
        const url = new URL(req.url);
        if (url.pathname.charAt(url.pathname.length - 1) === '/') {
            const shell = await cache.match('index.html');
            if (shell) return shell;
        }
        throw e;
    }
}

// Same-origin assets: stale-while-revalidate.
async function handleAsset(event) {
    const req = event.request;
    const cache = await caches.open(CACHE);
    const key = stripSearch(req.url);
    const cached = await cache.match(key);
    const refresh = (async () => {
        try {
            const res = await fetch(req);
            if (res && res.ok) await cache.put(key, res.clone());
            return res;
        } catch (e) { return null; }
    })();
    if (cached) {
        event.waitUntil(refresh);   // keep the background refresh alive
        return cached;
    }
    const res = await refresh;
    if (res) return res;
    throw new Error('offline and not cached: ' + req.url);
}

// Google Fonts: cache-first (font files are immutable per-URL).
async function handleFont(event) {
    const req = event.request;
    const cache = await caches.open(FONT_CACHE);
    const cached = await cache.match(req);
    if (cached) return cached;
    const res = await fetch(req);
    // CSS arrives opaque (no-cors <link>), woff2 arrives CORS — cache both.
    if (res && (res.ok || res.type === 'opaque')) await cache.put(req, res.clone());
    return res;
}

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    let url;
    try { url = new URL(req.url); } catch (e) { return; }

    if (FONT_HOSTS.indexOf(url.hostname) !== -1) {
        event.respondWith(handleFont(event).catch(() => fetch(req)));
        return;
    }

    if (url.origin !== self.location.origin) return;  // Supabase etc: untouched

    if (req.mode === 'navigate') {
        event.respondWith(handleNavigation(event));
    } else {
        event.respondWith(handleAsset(event));
    }
});
