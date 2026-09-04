import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';

export interface ExportPdfOptions {
  filename: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'ticket' | [number, number];
  marginMm?: number;
  fitToPage?: boolean;
  pageSelector?: string;
}

/**
 * Robust blob downloader that works across all browsers and sandboxed iframes.
 */
function triggerBlobDownload(blob: Blob, filename: string): void {
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = cleanFilename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
    URL.revokeObjectURL(url);
  }, 4000);
}

/**
 * Captures an HTML element and saves it as a high-resolution PDF file with accurate dimensions.
 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  options: ExportPdfOptions
): Promise<void> {
  const {
    filename,
    orientation = 'portrait',
    format = 'a4',
    marginMm = 8,
    fitToPage = false,
    pageSelector,
  } = options;

  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  // Safely resolve constructors
  const JsPdfClass = typeof jsPDF === 'function' ? jsPDF : (jsPDF as any).jsPDF || (jsPDF as any).default;
  const html2canvasFn = typeof html2canvas === 'function' ? html2canvas : (html2canvas as any).default || (html2canvas as any).html2canvas;

  if (!JsPdfClass) {
    throw new Error('No se pudo inicializar el motor generador de PDF (jsPDF).');
  }
  if (!html2canvasFn) {
    throw new Error('No se pudo inicializar el motor de captura gráfica (html2canvas-pro).');
  }

  // 1. Check for page-by-page elements (e.g. for multi-page barcode label sheets)
  if (pageSelector) {
    const pageElements = Array.from(element.querySelectorAll<HTMLElement>(pageSelector));
    if (pageElements.length > 0) {
      const pdf = new JsPdfClass({
        orientation,
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = marginMm;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;

      for (let i = 0; i < pageElements.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        const pageEl = pageElements[i];
        const pageCanvas = await html2canvasFn(pageEl, {
          scale: 2.2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          width: pageEl.scrollWidth,
          height: pageEl.scrollHeight,
          windowWidth: pageEl.scrollWidth,
          windowHeight: pageEl.scrollHeight,
          onclone: (_clonedDoc: Document, clonedEl: HTMLElement) => {
            clonedEl.style.overflow = 'visible';
            clonedEl.style.maxHeight = 'none';
            clonedEl.style.height = 'auto';
            clonedEl.style.boxShadow = 'none';
            clonedEl.style.border = 'none';
            clonedEl.style.margin = '0';
          },
        });

        let contentWidth = usableWidth;
        let contentHeight = (pageCanvas.height * usableWidth) / pageCanvas.width;

        if (contentHeight > usableHeight) {
          const scale = usableHeight / contentHeight;
          contentWidth *= scale;
          contentHeight = usableHeight;
        }

        const x = margin + (usableWidth - contentWidth) / 2;
        const y = margin + (usableHeight - contentHeight) / 2;

        pdf.addImage(
          pageCanvas.toDataURL('image/png', 1.0),
          'PNG',
          x,
          y,
          contentWidth,
          contentHeight,
          undefined,
          'FAST'
        );
      }

      const blob = pdf.output('blob');
      triggerBlobDownload(blob, cleanFilename);
      return;
    }
  }

  // 2. Ticket format: 80mm POS Thermal Receipt with exact dynamic length (zero cut-off)
  if (format === 'ticket') {
    const ticketCanvas = await html2canvasFn(element, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      onclone: (_clonedDoc: Document, clonedEl: HTMLElement) => {
        clonedEl.style.overflow = 'visible';
        clonedEl.style.maxHeight = 'none';
        clonedEl.style.height = 'auto';
        clonedEl.style.boxShadow = 'none';
        clonedEl.style.border = 'none';
        clonedEl.style.borderRadius = '0';
        clonedEl.style.margin = '0 auto';
        clonedEl.style.padding = '8px 12px 16px 12px';

        let p = clonedEl.parentElement;
        while (p && p !== _clonedDoc.body) {
          p.style.overflow = 'visible';
          p.style.maxHeight = 'none';
          p.style.height = 'auto';
          p = p.parentElement;
        }
      },
    });

    const ticketWidthMm = 80;
    const marginSideMm = 3;
    const contentWidthMm = ticketWidthMm - marginSideMm * 2; // 74mm
    const contentHeightMm = (ticketCanvas.height * contentWidthMm) / ticketCanvas.width;
    const totalHeightMm = Math.max(50, contentHeightMm + marginSideMm * 2 + 4);

    const pdf = new JsPdfClass({
      orientation: 'portrait',
      unit: 'mm',
      format: [ticketWidthMm, totalHeightMm],
    });

    pdf.addImage(
      ticketCanvas.toDataURL('image/png', 1.0),
      'PNG',
      marginSideMm,
      marginSideMm,
      contentWidthMm,
      contentHeightMm,
      undefined,
      'FAST'
    );

    const blob = pdf.output('blob');
    triggerBlobDownload(blob, cleanFilename);
    return;
  }

  // 3. Standard A4 format (Invoices, Documents, Sheets)
  const canvas = await html2canvasFn(element, {
    scale: 2.5,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    scrollX: 0,
    scrollY: 0,
    ignoreElements: (el: Element) => {
      return (
        el.classList?.contains('print:hidden') ||
        el.getAttribute?.('data-html2canvas-ignore') === 'true'
      );
    },
    onclone: (_clonedDoc: Document, clonedEl: HTMLElement) => {
      clonedEl.style.overflow = 'visible';
      clonedEl.style.maxHeight = 'none';
      clonedEl.style.height = 'auto';
      clonedEl.style.boxShadow = 'none';
      clonedEl.style.border = 'none';
      clonedEl.style.borderRadius = '0';
      clonedEl.style.width = '794px';
      clonedEl.style.maxWidth = '794px';
      clonedEl.style.margin = '0 auto';
      clonedEl.style.padding = '24px 32px 36px 32px';
      clonedEl.style.backgroundColor = '#ffffff';

      let p = clonedEl.parentElement;
      while (p && p !== _clonedDoc.body) {
        p.style.overflow = 'visible';
        p.style.maxHeight = 'none';
        p.style.height = 'auto';
        p.style.margin = '0';
        p.style.padding = '0';
        p.style.backgroundColor = '#ffffff';
        p = p.parentElement;
      }
    },
  });

  const pdf = new JsPdfClass({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = marginMm;
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;

  const rawContentHeight = (canvas.height * usableWidth) / canvas.width;

  // Single-page auto-fit: If enabled or if height fits cleanly within 1 page
  if (fitToPage || rawContentHeight <= usableHeight) {
    let contentWidth = usableWidth;
    let contentHeight = rawContentHeight;

    if (contentHeight > usableHeight) {
      const scale = usableHeight / contentHeight;
      contentWidth *= scale;
      contentHeight = usableHeight;
    }

    // Top-align formal documents and center horizontally within printable margins
    const x = margin + (usableWidth - contentWidth) / 2;
    const y = margin;

    pdf.addImage(
      canvas.toDataURL('image/png', 1.0),
      'PNG',
      x,
      y,
      contentWidth,
      contentHeight,
      undefined,
      'FAST'
    );
  } else {
    // Multi-page document: Slice canvas by clean page-height chunks (prevents negative offset bugs)
    const sliceHeightPx = Math.floor((canvas.width * usableHeight) / usableWidth);
    let yPx = 0;
    let pageIndex = 0;

    while (yPx < canvas.height) {
      if (pageIndex > 0) {
        pdf.addPage();
      }

      const currentSliceHeightPx = Math.min(sliceHeightPx, canvas.height - yPx);
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = currentSliceHeightPx;

      const ctx = sliceCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          yPx,
          canvas.width,
          currentSliceHeightPx,
          0,
          0,
          canvas.width,
          currentSliceHeightPx
        );
      }

      const sliceHeightMm = (currentSliceHeightPx * usableWidth) / canvas.width;
      pdf.addImage(
        sliceCanvas.toDataURL('image/png', 1.0),
        'PNG',
        margin,
        margin,
        usableWidth,
        sliceHeightMm,
        undefined,
        'FAST'
      );

      yPx += sliceHeightPx;
      pageIndex++;
    }
  }

  const blob = pdf.output('blob');
  triggerBlobDownload(blob, cleanFilename);
}


