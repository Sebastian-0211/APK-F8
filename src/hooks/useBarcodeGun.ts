import { useEffect, useRef, useState } from 'react';

interface UseBarcodeGunOptions {
  onScan: (barcode: string) => void;
  enabled?: boolean;
  minChars?: number;
  maxIntervalMs?: number;
}

export function useBarcodeGun({
  onScan,
  enabled = true,
  minChars = 4,
  maxIntervalMs = 65, // Scanner guns type very rapidly (<40-60ms between chars)
}: UseBarcodeGunOptions) {
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [isGunActive, setIsGunActive] = useState<boolean>(false);
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const activeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in certain inputs unless it's a superfast scanner burst
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Handle barcode termination (Enter key)
      if (e.key === 'Enter') {
        if (bufferRef.current.length >= minChars) {
          // If in an input, prevent normal form submit to process scan
          if (isInput) {
            e.preventDefault();
          }
          const scannedCode = bufferRef.current.trim();
          bufferRef.current = '';
          setLastScannedCode(scannedCode);
          setIsGunActive(true);

          if (activeTimeoutRef.current) {
            window.clearTimeout(activeTimeoutRef.current);
          }
          activeTimeoutRef.current = window.setTimeout(() => {
            setIsGunActive(false);
          }, 1500);

          onScan(scannedCode);
          return;
        } else {
          // Reset buffer on regular Enter
          bufferRef.current = '';
          return;
        }
      }

      // Check if keystroke is too slow (human typing vs barcode gun burst)
      // When inside an input element, we enforce strict timing (< maxIntervalMs)
      // When in general document, we allow a slightly more relaxed window
      if (timeDiff > (isInput ? maxIntervalMs : maxIntervalMs * 2.5) && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      // Accept printable characters (alphanumeric, dashes, standard barcode characters)
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (activeTimeoutRef.current) {
        window.clearTimeout(activeTimeoutRef.current);
      }
    };
  }, [enabled, minChars, maxIntervalMs, onScan]);

  return {
    lastScannedCode,
    isGunActive,
  };
}
