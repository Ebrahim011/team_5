'use client';

import { useEffect } from 'react';

/**
 * Component to ensure Service Worker is registered properly
 * This is especially important for mobile devices
 */
export default function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if service workers are supported
    if ('serviceWorker' in navigator) {
      // Wait for the page to load
      window.addEventListener('load', () => {
        // Check if service worker is already registered
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          if (registrations.length === 0) {
            // Try to register the service worker manually if next-pwa didn't register it
            // This can happen on some mobile browsers
            const swPath = '/sw.js';
            
            navigator.serviceWorker
              .register(swPath, { scope: '/' })
              .then((registration) => {
                console.log('✅ Service Worker registered manually:', registration.scope);
                
                // Pre-cache important pages for offline support
                if (registration.active) {
                  preCacheImportantPages();
                } else if (registration.installing) {
                  registration.installing.addEventListener('statechange', () => {
                    if (registration.installing?.state === 'activated' && registration.active) {
                      preCacheImportantPages();
                    }
                  });
                } else {
                  // Wait for service worker to activate
                  registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                      newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'activated') {
                          preCacheImportantPages();
                        }
                      });
                    }
                  });
                }
              })
              .catch((error) => {
                // Service worker might already be registered by next-pwa
                // or there might be a different issue
                console.log('ℹ️ Service Worker registration:', error.message);
              });
          } else {
            console.log('✅ Service Worker already registered');
            
            // Pre-cache important pages if service worker is already active
            const registration = registrations[0];
            if (registration.active) {
              preCacheImportantPages();
            } else {
              // Wait for service worker to activate
              registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                  newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'activated') {
                      preCacheImportantPages();
                    }
                  });
                }
              });
            }
          }
        });
        
        // Helper function to pre-cache important pages
        const preCacheImportantPages = async () => {
          // List of important pages to pre-cache
          const importantPages = [
            '/dashboard/attendance',
            '/attendance', // Also cache /attendance route for assistants
            '/offline',
          ];
          
          // Pre-cache pages after a short delay to not block initial load
          setTimeout(async () => {
            try {
              // Fetch pages to trigger Service Worker caching
              // Service Worker will cache them automatically based on runtimeCaching rules
              for (const page of importantPages) {
                try {
                  await fetch(page, { 
                    method: 'GET',
                    cache: 'default',
                    credentials: 'same-origin'
                  });
                  console.log(`✅ Pre-cached: ${page}`);
                } catch (error) {
                  console.warn(`⚠️ Failed to pre-cache ${page}:`, error);
                }
              }
              console.log('📦 Pre-caching important pages completed');
            } catch (error) {
              console.error('Error pre-caching pages:', error);
            }
          }, 3000); // Wait 3 seconds after page load
        };

        // Listen for service worker updates
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('🔄 Service Worker controller changed - reloading page');
          // Optionally reload the page when a new service worker takes control
          // window.location.reload();
        });
      });
    }
  }, []);

  return null; // This component doesn't render anything
}

