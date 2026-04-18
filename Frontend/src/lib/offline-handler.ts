/**
 * Offline handler for Next.js navigation errors
 * Suppresses "Failed to fetch" errors when device is offline
 */

if (typeof window !== 'undefined') {
  // Override console.error to filter out Next.js navigation errors in offline mode
  const originalConsoleError = console.error;
  
  console.error = (...args: any[]) => {
    const isOffline = !navigator.onLine;
    const errorMessage = args[0]?.toString() || '';
    
    // Filter out Next.js navigation "Failed to fetch" errors in offline mode
    if (
      isOffline &&
      (errorMessage.includes('Failed to fetch') ||
       errorMessage.includes('fetchServerResponse') ||
       errorMessage.includes('router-reducer'))
    ) {
      // Silent fail - this is expected behavior in offline mode
      console.log('📴 Offline mode: Navigation fetch failed (expected behavior)');
      return;
    }
    
    // Call original console.error for all other errors
    originalConsoleError.apply(console, args);
  };

  // Handle unhandled promise rejections (Next.js navigation errors)
  window.addEventListener('unhandledrejection', (event) => {
    const isOffline = !navigator.onLine;
    const error = event.reason;
    const errorMessage = error?.message || error?.toString() || '';
    
    // Suppress Next.js navigation errors in offline mode
    if (
      isOffline &&
      (errorMessage.includes('Failed to fetch') ||
       errorMessage.includes('fetchServerResponse') ||
       errorMessage.includes('NetworkError') ||
       error?.name === 'TypeError' && errorMessage.includes('fetch'))
    ) {
      event.preventDefault(); // Prevent error from showing in console
      console.log('📴 Offline mode: Navigation error suppressed (expected behavior)');
      return;
    }
  });

  // Handle fetch errors globally
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      return await originalFetch(...args);
    } catch (error: any) {
      const isOffline = !navigator.onLine;
      
      // If offline and it's a navigation fetch, suppress the error
      if (
        isOffline &&
        (error?.message?.includes('Failed to fetch') ||
         error?.name === 'TypeError')
      ) {
        // Return a mock response to prevent Next.js from crashing
        // This allows the service worker to handle the request
        throw error; // Let service worker handle it
      }
      
      throw error;
    }
  };
}

