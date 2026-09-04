import { Html5Qrcode } from 'html5-qrcode';

/**
 * Safely stops and clears an Html5Qrcode instance without throwing uncaught errors
 * such as "Cannot stop, scanner is not running or paused."
 */
export function safeStopScanner(scanner: Html5Qrcode | null): void {
  if (!scanner) return;
  try {
    if (scanner.isScanning) {
      scanner
        .stop()
        .then(() => {
          try {
            scanner.clear();
          } catch (_) {}
        })
        .catch(() => {
          try {
            scanner.clear();
          } catch (_) {}
        });
    } else {
      try {
        scanner.clear();
      } catch (_) {}
    }
  } catch (_) {
    // Suppress synchronous throws from html5-qrcode state machine
    try {
      scanner.clear();
    } catch (_) {}
  }
}
