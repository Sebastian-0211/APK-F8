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
  maxIntervalMs = 85, // Scanner guns type very rapidly (15-60ms between chars)
}: UseBarcodeGunOptions) {
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [isGunActive, setIsGunActive] = useState<boolean>(false);
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const activeTimeoutRef = useRef<number | null>(null);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e || typeof e.key !== 'string') return;

      // Don't capture when typing in certain inputs unless it's a superfast scanner burst
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Handle barcode termination (Enter key, NumpadEnter, or Tab from barcode gun)
      const isTerminationKey =
        e.key === 'Enter' ||
        e.code === 'NumpadEnter' ||
        (e.key === 'Tab' && bufferRef.current.length >= minChars);

      if (isTerminationKey) {
        if (bufferRef.current.length >= minChars) {
          // If in an input, prevent normal form submit to process scan cleanly
          if (isInput) {
            e.preventDefault();
            e.stopPropagation();
          }
          const scannedCode = bufferRef.current.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
          bufferRef.current = '';
          setLastScannedCode(scannedCode);
          setIsGunActive(true);

          if (activeTimeoutRef.current) {
            window.clearTimeout(activeTimeoutRef.current);
          }
          activeTimeoutRef.current = window.setTimeout(() => {
            setIsGunActive(false);
          }, 1500);

          if (scannedCode) {
            onScanRef.current(scannedCode);
          }
          return;
        } else {
          // Reset buffer on regular Enter without enough characters
          bufferRef.current = '';
          return;
        }
      }

      // Check if keystroke is too slow (human typing vs barcode gun burst)
      // When inside an input element, allow up to 95ms (real wireless/BT guns often 40-75ms)
      // When in general document, allow up to 250ms
      const maxAllowed = isInput ? Math.max(maxIntervalMs, 95) : Math.max(maxIntervalMs * 2.5, 240);
      if (timeDiff > maxAllowed && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      // Accept printable single characters (alphanumeric, dashes, standard barcode characters)
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
  }, [enabled, minChars, maxIntervalMs]);

  return {
    lastScannedCode,
    isGunActive,
  };
}
