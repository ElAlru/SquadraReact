import { useCallback } from 'react';

declare global {
  interface Window {
    google: any;
  }
}

// Estado a nivel de módulo para inicializar GIS solo una vez
let gisLoading: Promise<void> | null = null;
let gisInitialized = false;
let pendingResolve: ((response: { credential: string }) => void) | null = null;

function loadGISScript(): Promise<void> {
  if (gisLoading) return gisLoading;
  gisLoading = new Promise((resolve) => {
    if (window.google?.accounts?.id) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
  return gisLoading;
}

function initGIS() {
  if (gisInitialized) return;
  window.google.accounts.id.initialize({
    client_id: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
    callback: (response: { credential: string }) => {
      if (pendingResolve) {
        pendingResolve(response);
        pendingResolve = null;
      }
    },
    cancel_on_tap_outside: true,
  });
  gisInitialized = true;
}

export function useGoogleAuth() {
  const promptGoogleAuth = useCallback(
    async (): Promise<{ type: string; params?: { id_token: string } }> => {
      await loadGISScript();
      initGIS();

      return new Promise((resolve) => {
        pendingResolve = (response) => {
          resolve({ type: 'success', params: { id_token: response.credential } });
        };

        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            pendingResolve = null;
            resolve({ type: 'dismiss' });
          }
        });
      });
    },
    []
  );

  return {
    promptGoogleAuth,
    isGoogleReady: true,
  };
}
