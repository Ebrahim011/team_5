'use client';

import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Component to show PWA install prompt on mobile and desktop devices
 * DISABLED: This component no longer shows any install prompts
 * Helps users install the app on their device
 */
export default function PWAInstallPrompt() {
  // Component is disabled - never show install prompt
  // Return null immediately without any event listeners or state
  return null;
}

