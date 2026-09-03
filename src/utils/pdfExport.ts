import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportPdfOptions {
  filename: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'ticket' | [number, number];
  marginMm?: number;
}

/**
 * Captures an HTML element and saves it as a high-resolution PDF file.
 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  options: ExportPdfOptions
): Promise<void> {
  const { filename, orientation = 'portrait', format = 'a4', marginMm = 5 } = options;

  // Render high-DPI canvas
  const canvas = await html2canvas(element, {
    scale: 2.5,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
  });

  const imgData = canvas.toDataURL('image/png');

  if (format === 'ticket') {
    // 80mm thermal ticket format with dynamic height
    const ticketWidthMm = 80;
    const ticketHeightMm = Math.max(80, (canvas.height * ticketWidthMm) / canvas.width + marginMm * 2);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [ticketWidthMm, ticketHeightMm],
    });

    pdf.addImage(imgData, 'PNG', marginMm, marginMm, ticketWidthMm - marginMm * 2, (canvas.height * (ticketWidthMm - marginMm * 2)) / canvas.width, undefined, 'FAST');
    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    return;
  }

  // Standard A4
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - marginMm * 2;
  const contentHeight = (canvas.height * contentWidth) / canvas.width;

  let heightLeft = contentHeight;
  let position = marginMm;

  pdf.addImage(imgData, 'PNG', marginMm, position, contentWidth, contentHeight, undefined, 'FAST');
  heightLeft -= (pageHeight - marginMm * 2);

  while (heightLeft > 0) {
    position = heightLeft - contentHeight + marginMm;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', marginMm, position, contentWidth, contentHeight, undefined, 'FAST');
    heightLeft -= (pageHeight - marginMm * 2);
  }

  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}
