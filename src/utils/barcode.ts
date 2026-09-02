import JsBarcode from 'jsbarcode';

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
