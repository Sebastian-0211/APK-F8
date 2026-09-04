import JsBarcode from 'jsbarcode';
import { AutoPart } from '../types';

export function formatBinCode(rack: number, row: number, column: number): string {
  return `EST-${rack}-F${row}-C${column}`;
}

export function parseBinCode(binCode: string): { rack: number; row: number; column: number } | null {
  const match = binCode.match(/^EST-(\d+)-F(\d+)-C(\d+)$/i);
  if (!match) return null;
  return {
    rack: parseInt(match[1], 10),
    row: parseInt(match[2], 10),
    column: parseInt(match[3], 10),
  };
}

export function generateRandomBarcode(prefix: string = '750'): string {
  // Generate a realistic 12-13 digit EAN or 10-digit automotive warehouse code
  const randomDigits = Math.floor(100000000 + Math.random() * 900000000).toString();
  return `${prefix}${randomDigits}`;
}

export function generateSKU(category: string, rack: number): string {
  const catPrefixes: Record<string, string> = {
    'Frenos': 'FRE',
    'Motor y Componentes': 'MOT',
    'Filtros y Lubricantes': 'FIL',
    'Suspensión y Dirección': 'SUS',
    'Transmisión y Embrague': 'TRA',
    'Sistema Eléctrico e Iluminación': 'ELE',
    'Refrigeración y Clima': 'REF',
    'Carrocería y Accesorios': 'CAR',
    'Otros': 'GEN',
  };
  const code = catPrefixes[category] || 'REP';
  const seq = Math.floor(100 + Math.random() * 900);
  return `REP-${code}-E${rack}-${seq}`;
}

export function renderBarcodeToElement(
  element: SVGElement | HTMLCanvasElement | HTMLImageElement,
  value: string,
  options?: {
    height?: number;
    width?: number;
    fontSize?: number;
    displayValue?: boolean;
    background?: string;
    lineColor?: string;
  }
) {
  if (!element || !value) return;
  try {
    JsBarcode(element, value, {
      format: 'CODE128',
      lineColor: options?.lineColor || '#000000',
      width: options?.width || 2,
      height: options?.height || 45,
      displayValue: options?.displayValue ?? true,
      font: 'monospace',
      fontSize: options?.fontSize || 13,
      background: options?.background || '#ffffff',
      margin: 8,
    });
  } catch (err) {
    console.error('Failed to render barcode:', err);
  }
}

/**
 * Highly resilient part lookup function for physical barcode scanner guns,
 * camera frame decoders, and manual inputs.
 * 
 * Handles:
 * - Direct case-insensitive match on barcode, SKU, OEM code, and ID.
 * - Trimming of non-printable / control characters (\u0000-\u001F, \u007F-\u009F).
 * - Stripping AIM symbology prefixes (e.g., "]C1", "]e0", "]E0", "]A0", "]d2", "]Q1")
 *   which many barcode guns output by default.
 * - Punctuation / whitespace normalization (hyphens, spaces, dots, underscores).
 * - UPC-A vs EAN-13 leading-zero conversion (e.g., "0123456789012" vs "123456789012").
 */
export function findMatchingPart(
  parts: AutoPart[],
  rawCode: string
): AutoPart | undefined {
  if (!rawCode || !Array.isArray(parts)) return undefined;

  // 1. Clean raw string: strip control / non-printable characters and trim
  const cleanCode = rawCode.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
  if (!cleanCode) return undefined;

  const lowerCode = cleanCode.toLowerCase();

  // 2. Direct exact match (case-insensitive) on barcode, sku, oemCode, id
  let match = parts.find((p) => {
    if (!p) return false;
    return (
      (p.barcode && p.barcode.toLowerCase() === lowerCode) ||
      (p.sku && p.sku.toLowerCase() === lowerCode) ||
      (p.oemCode && p.oemCode.toLowerCase() === lowerCode) ||
      (p.id && p.id.toLowerCase() === lowerCode)
    );
  });
  if (match) return match;

  // 3. Strip AIM symbology identifiers (e.g. ]C1, ]e0, ]E0, ]A0, ]d2, ]Q1)
  const strippedAim = cleanCode.replace(/^\][A-Za-z0-9]{2}/, '');
  if (strippedAim !== cleanCode) {
    const lowerAim = strippedAim.toLowerCase();
    match = parts.find((p) => {
      if (!p) return false;
      return (
        (p.barcode && p.barcode.toLowerCase() === lowerAim) ||
        (p.sku && p.sku.toLowerCase() === lowerAim) ||
        (p.oemCode && p.oemCode.toLowerCase() === lowerAim)
      );
    });
    if (match) return match;
  }

  // 4. Normalized without spaces, dashes, dots, or underscores
  const stripSeparators = (str: string) => str.replace(/[\s\-_.]/g, '').toLowerCase();
  const normInput = stripSeparators(strippedAim);
  if (normInput) {
    match = parts.find((p) => {
      if (!p) return false;
      return (
        (p.barcode && stripSeparators(p.barcode) === normInput) ||
        (p.sku && stripSeparators(p.sku) === normInput) ||
        (p.oemCode && stripSeparators(p.oemCode) === normInput)
      );
    });
    if (match) return match;
  }

  // 5. Numeric leading-zero tolerance (e.g. UPC-A 12-digit vs EAN-13 13-digit)
  const digitsOnly = normInput.replace(/\D/g, '');
  if (digitsOnly.length >= 6) {
    const unpaddedInput = digitsOnly.replace(/^0+/, '');
    match = parts.find((p) => {
      if (!p || !p.barcode) return false;
      const pDigits = p.barcode.replace(/\D/g, '');
      if (!pDigits) return false;
      const pUnpadded = pDigits.replace(/^0+/, '');
      return (
        pUnpadded === unpaddedInput ||
        pDigits === '0' + digitsOnly ||
        digitsOnly === '0' + pDigits
      );
    });
    if (match) return match;
  }

  return undefined;
}
