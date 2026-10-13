import { useSyncExternalStore } from 'react';

/**
 * Where the offline copy of the app stands, so the learner is never left guessing:
 * none: this browser or build has no offline copy · installing: files are downloading ·
 * ready: the app opens without a connection · update: a newer version is downloaded and
 * waiting · failed: the offline copy could not be installed (the app still works online).
 */
export type OfflineState = 'none' | 'installing' | 'ready' | 'update' | 'failed';

let state: OfflineState = 'none';
let online = typeof navigator === 'undefined' ? true : navigator.onLine;
let snapshot: { state: OfflineState; online: boolean } = { state, online };
let waiting: ServiceWorker | null = null;
const listeners = new Set<() => void>();
function set(next: OfflineState) {
  state = next;
  publish();
}
function publish() {
  snapshot = { state, online };
  listeners.forEach(listener => listener());
}

function watch(registration: ServiceWorkerRegistration) {
  const settle = () => {
    if (registration.waiting && navigator.serviceWorker.controller) {
      waiting = registration.waiting;
      set('update');
    } else if (registration.active) set('ready');
  };
  const follow = (worker: ServiceWorker | null) => {
    if (!worker) return;
    if (!registration.active) set('installing');
    worker.addEventListener('statechange', () => {
      if (worker.state === 'redundant' && !registration.active) set('failed');
      else settle();
    });
  };
  settle();
  follow(registration.installing);
  registration.addEventListener('updatefound', () => follow(registration.installing));
}

/** Called once at startup. Does nothing outside a production build. */
export function registerOffline() {
  window.addEventListener('online', () => ((online = true), publish()));
  window.addEventListener('offline', () => ((online = false), publish()));
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  // When a new version takes over, every open tab moves to it: a tab left on the old code
  // would go on writing records the new code has already moved on from. Only a new version
  // of the same worker counts; the first install, or another installation on the same site
  // taking over its own pages, is not a version change.
  const previous = navigator.serviceWorker.controller?.scriptURL;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (previous && navigator.serviceWorker.controller?.scriptURL === previous)
      window.location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(watch, () => set('failed'));
  });
}
/** Switches to the downloaded version now. Open tabs reload once it has taken over. */
export function applyUpdate() {
  waiting?.postMessage('activate');
}
export const useOffline = () =>
  useSyncExternalStore(
    listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => snapshot,
  );
