import { jsPDF } from 'jspdf';
import { sanitizeFilename } from '../markdown/index.ts';

export interface PDFExportScene {
  id?: string;
  title: string;
  content: string;
  order: number;
}

export interface PDFExportBibleEntity {
  id?: string;
  name: string;
  type: string;
  content: string;
}

export interface PDFExportOptions {
  title: string;
  genre?: string;
  author?: string;
  scenes: PDFExportScene[];
  bibleEntities?: PDFExportBibleEntity[];
  includeBibleAppendix?: boolean;
  fontFamily?: 'times' | 'helvetica';
  chapterHeadingStyle?: 'numbered' | 'original' | 'simple';
  includeCoverPage?: boolean;
  pageNumbers?: boolean;
  sceneSeparator?: 'pagebreak' | 'divider' | 'asterisms';
}

/**
 * Strips markdown markup to plain readable prose suitable for typesetting.
 */
export function cleanProseForExport(text: string): string {
  return text
    // Replace markdown links [label](url) with just label
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Strip header markers at start of lines (e.g. # Chapter)
    .replace(/^#{1,6}\s+/gm, '')
    // Strip bold/italic markdown markers while preserving text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Replace markdown blockquotes > with plain indent
    .replace(/^>\s+/gm, '')
    // Normalize newlines
    .replace(/\r\n/g, '\n')
    .trim();
}

/**
 * Generates a styled, publication-ready PDF document from novel scenes and optional bible appendix.
 */
export function generateNovelPDF(options: PDFExportOptions): jsPDF {
  const {
    title,
    genre,
    author,
    scenes,
    bibleEntities = [],
    includeBibleAppendix = false,
    fontFamily = 'times',
    chapterHeadingStyle = 'numbered',
    includeCoverPage = true,
    pageNumbers = true,
    sceneSeparator = 'pagebreak',
  } = options;

  // Standard Letter page size (612 x 792 pt)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 54; // 0.75 in
  const contentWidth = pageWidth - margin * 2;
  const bottomThreshold = pageHeight - margin - 30; // space before footer

  const cleanNovelTitle = title.trim() || 'Untitled Novel';
  const sortedScenes = [...scenes].sort((a, b) => a.order - b.order);

  // Helper to count words
  const totalWordCount = sortedScenes.reduce((acc, s) => {
    return acc + s.content.trim().split(/\s+/).filter(w => w.length > 0).length;
  }, 0);

  let currentPageNumber = 1;

  // 1. Cover / Title Page
  if (includeCoverPage) {
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(28);
    doc.setTextColor(30, 30, 30);

    const titleLines = doc.splitTextToSize(cleanNovelTitle, contentWidth);
    let titleY = pageHeight * 0.35;
    doc.text(titleLines, pageWidth / 2, titleY, { align: 'center' });

    titleY += titleLines.length * 32 + 10;

    // Decorative rule
    doc.setDrawColor(180, 150, 100);
    doc.setLineWidth(1.5);
    doc.line(pageWidth / 2 - 80, titleY, pageWidth / 2 + 80, titleY);

    titleY += 24;

    if (genre) {
      doc.setFont(fontFamily, 'italic');
      doc.setFontSize(13);
      doc.setTextColor(100, 100, 100);
      doc.text(genre, pageWidth / 2, titleY, { align: 'center' });
      titleY += 20;
    }

    if (author) {
      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(14);
      doc.setTextColor(60, 60, 60);
      doc.text(`By ${author}`, pageWidth / 2, titleY + 10, { align: 'center' });
    }

    // Cover Page Footer info
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(140, 140, 140);
    const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(
      `${sortedScenes.length} Chapters / Scenes  ·  ${totalWordCount.toLocaleString()} Words  ·  ${dateStr}`,
      pageWidth / 2,
      pageHeight - 70,
      { align: 'center' }
    );
    doc.text('Compiled with StorySpark Studio', pageWidth / 2, pageHeight - 54, { align: 'center' });

    // Next page for chapters
    doc.addPage();
    currentPageNumber++;
  }

  let y = margin + 20;

  // Helper to check page break and draw running headers
  const checkPageOverflow = (neededHeight: number) => {
    if (y + neededHeight > bottomThreshold) {
      doc.addPage();
      currentPageNumber++;
      y = margin + 20;
      return true;
    }
    return false;
  };

  // 2. Render Chapters/Scenes
  sortedScenes.forEach((scene, index) => {
    // Determine scene title text
    const cleanTitle = scene.title.replace(/\.md$/, '').replace(/^\d+-/, '').trim();
    let displayHeading = cleanTitle;
    if (chapterHeadingStyle === 'numbered') {
      displayHeading = `Chapter ${index + 1}: ${cleanTitle}`;
    } else if (chapterHeadingStyle === 'simple') {
      displayHeading = cleanTitle.toUpperCase();
    }

    // If scene separator is pagebreak (or not first scene on this page)
    if (index > 0) {
      if (sceneSeparator === 'pagebreak') {
        doc.addPage();
        currentPageNumber++;
        y = margin + 20;
      } else if (sceneSeparator === 'divider') {
        checkPageOverflow(50);
        y += 15;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.75);
        doc.line(pageWidth / 2 - 60, y, pageWidth / 2 + 60, y);
        y += 25;
      } else if (sceneSeparator === 'asterisms') {
        checkPageOverflow(40);
        y += 15;
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(12);
        doc.setTextColor(120, 120, 120);
        doc.text('*   *   *', pageWidth / 2, y, { align: 'center' });
        y += 25;
      }
    }

    // Chapter heading
    checkPageOverflow(60);
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(17);
    doc.setTextColor(25, 25, 25);
    const headingLines = doc.splitTextToSize(displayHeading, contentWidth);
    doc.text(headingLines, margin, y);
    y += headingLines.length * 22 + 12;

    // Chapter body text
    const cleanedBody = cleanProseForExport(scene.content);
    const paragraphs = cleanedBody.split(/\n{2,}/);

    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(11);
    doc.setTextColor(45, 45, 45);
    const lineHeight = 15.5;

    for (const para of paragraphs) {
      const trimmedPara = para.trim();
      if (!trimmedPara) continue;

      const lines = doc.splitTextToSize(trimmedPara, contentWidth);

      for (let i = 0; i < lines.length; i++) {
        if (y + lineHeight > bottomThreshold) {
          doc.addPage();
          currentPageNumber++;
          y = margin + 20;
        }
        doc.text(lines[i], margin, y);
        y += lineHeight;
      }

      // Paragraph spacing
      y += 8;
    }

    y += 16;
  });

  // 3. Story Bible Appendix
  if (includeBibleAppendix && bibleEntities.length > 0) {
    doc.addPage();
    currentPageNumber++;
    y = margin + 20;

    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(20);
    doc.setTextColor(25, 25, 25);
    doc.text('Appendix: Story Bible & Lore', margin, y);
    y += 28;

    doc.setDrawColor(180, 150, 100);
    doc.setLineWidth(1);
    doc.line(margin, y - 8, margin + 140, y - 8);

    for (const entity of bibleEntities) {
      checkPageOverflow(50);
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(13);
      doc.setTextColor(40, 40, 40);
      doc.text(`${entity.name} (${entity.type.toUpperCase()})`, margin, y);
      y += 18;

      const cleanEntityContent = cleanProseForExport(entity.content);
      const paras = cleanEntityContent.split(/\n{2,}/);

      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(60, 60, 60);
      const entityLineHeight = 14.5;

      for (const p of paras) {
        const lines = doc.splitTextToSize(p.trim(), contentWidth);
        for (const line of lines) {
          if (y + entityLineHeight > bottomThreshold) {
            doc.addPage();
            currentPageNumber++;
            y = margin + 20;
          }
          doc.text(line, margin, y);
          y += entityLineHeight;
        }
        y += 6;
      }
      y += 12;
    }
  }

  // 4. Running headers and footers across all pages
  const totalPages = doc.getNumberOfPages();
  const startPage = includeCoverPage ? 2 : 1;

  for (let p = startPage; p <= totalPages; p++) {
    doc.setPage(p);

    // Running header
    doc.setFont(fontFamily, 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(140, 140, 140);
    doc.text(cleanNovelTitle, margin, margin - 15);
    doc.setDrawColor(225, 225, 225);
    doc.setLineWidth(0.5);
    doc.line(margin, margin - 8, pageWidth - margin, margin - 8);

    // Running footer
    if (pageNumbers) {
      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(9);
      doc.setTextColor(130, 130, 130);
      const footerText = `Page ${p} of ${totalPages}`;
      doc.text(footerText, pageWidth / 2, pageHeight - 34, { align: 'center' });
    }
  }

  return doc;
}

/**
 * Downloads a generated PDF document in the browser.
 */
export function downloadNovelPDF(options: PDFExportOptions): void {
  const doc = generateNovelPDF(options);
  const cleanTitle = sanitizeFilename(options.title.replace(/\s+/g, '-')) || 'StorySpark-Novel';
  doc.save(`${cleanTitle}-Manuscript.pdf`);
}
