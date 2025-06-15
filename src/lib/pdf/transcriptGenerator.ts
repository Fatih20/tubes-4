import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface StudentTranscriptData {
  nim: string;
  fullName: string;
  program: 'IF' | 'STI';
  gpa: number;
  totalCredits: number;
  courses: {
    code: string;
    name: string;
    credits: number;
    grade: string;
  }[];
  programHeadName: string;
  digitalSignature: string;
}

export class TranscriptGenerator {
  /**
   * Generate PDF content as HTML string (for preview)
   */
  private generateHTMLContent(data: StudentTranscriptData): string {
    const programFullName = data.program === 'IF' 
      ? 'Program Studi Teknik Informatika'
      : 'Program Studi Sistem dan Teknologi Informasi';

    // Format signature for HTML display
    const formattedSignature = this.wrapTextForHTML(data.digitalSignature, 80);

    // Generate course rows with new styling
    const courseRows = data.courses.map((course, index) => `
      <tr>
        <td style="text-align: center; padding: 4px 8px; border-bottom: 1px solid #000;">${index + 1}</td>
        <td style="text-align: center; padding: 4px 8px; border-bottom: 1px solid #000;">${course.code}</td>
        <td style="padding: 4px 8px; border-bottom: 1px solid #000;">${course.name}</td>
        <td style="text-align: center; padding: 4px 8px; border-bottom: 1px solid #000;">${course.credits}</td>
        <td style="text-align: center; padding: 4px 8px; border-bottom: 1px solid #000;">${course.grade}</td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Transkrip Akademik - ${data.fullName}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      color: #000;
      max-width: 800px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 1px solid #000;
      padding-bottom: 15px;
    }
    
    .header h1 {
      font-size: 14px;
      font-weight: normal;
      margin: 2px 0;
      line-height: 1.2;
    }
    
    .transcript-title {
      font-size: 16px;
      font-weight: bold;
      text-align: center;
      margin: 25px 0;
      text-decoration: underline;
    }
    
    .student-info {
      margin: 20px 0;
      font-size: 12px;
      text-align: center;
    }
    
    .student-info div {
      margin: 3px 0;
    }
    
    .courses-table {
      width: 100%;
      border-collapse: collapse;
      margin: 25px 0;
      font-size: 11px;
      border: 1px solid #000;
    }
    
    .courses-table th {
      background-color: white;
      border-bottom: 1px solid #000;
      padding: 8px 4px;
      text-align: center;
      font-weight: bold;
      font-size: 10px;
    }
    
    .courses-table td {
      border-right: 1px solid #000;
      padding: 4px 8px;
      vertical-align: top;
    }
    
    .courses-table td:last-child {
      border-right: 1px solid #000;
    }
    
    .summary {
      margin: 20px 0;
      font-size: 12px;
      text-align: center;
      font-weight: normal;
    }
    
    .summary div {
      margin: 4px 0;
    }
    
    .signature-section {
      margin-top: 40px;
      page-break-inside: avoid;
    }
    
    .signature-title {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 15px;
    }
    
    .signature-markers {
      font-size: 11px;
      margin: 8px 0;
      font-family: 'Courier New', monospace;
    }
    
    .signature-content {
      font-family: 'Courier New', monospace;
      font-size: 8px;
      margin: 10px 0;
      word-break: break-all;
      line-height: 1.4;
      text-align: justify;
      padding: 0;
      width: 100%;
      white-space: pre-wrap;
      background-color: #f9f9f9;
      border: 1px solid #ddd;
      padding: 10px;
      min-height: 60px;
    }
    
    .signature-name {
      font-size: 12px;
      font-weight: bold;
      margin-top: 15px;
      text-align: left;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <h1>${programFullName}</h1>
    <h1>Sekolah Teknik Elektro dan Informatika</h1>
    <h1>Institut Teknologi Bandung</h1>
  </div>

  <!-- Title -->
  <div class="transcript-title">Transkrip Akademik</div>

  <!-- Student Information -->
  <div class="student-info">
    <div>Nama: ${data.fullName}</div>
    <div>NIM: ${data.nim}</div>
  </div>

  <!-- Courses Table -->
  <table class="courses-table">
    <thead>
      <tr>
        <th style="width: 8%;">No</th>
        <th style="width: 18%;">Kode mata kuliah</th>
        <th style="width: 52%;">Nama mata kuliah</th>
        <th style="width: 10%;">SKS</th>
        <th style="width: 12%;">Nilai</th>
      </tr>
    </thead>
    <tbody>
      ${courseRows}
    </tbody>
  </table>

  <!-- Summary -->
  <div class="summary">
    <div>Total Jumlah SKS = ${data.totalCredits}</div>
    <div>IPK = ${data.gpa.toFixed(2)}</div>
  </div>

  <!-- Digital Signature -->
  <div class="signature-section">
    <div class="signature-title">Ketua Program Studi</div>
    
    <div class="signature-markers">--Begin signature--</div>
    <div class="signature-content">${formattedSignature}</div>
    <div class="signature-markers">--End signature--</div>
    
    <div class="signature-name">(${data.programHeadName})</div>
  </div>
</body>
</html>`;
  }

  /**
   * Generate PDF using jsPDF with proper table formatting and pagination
   */
  private async htmlToPDF(data: StudentTranscriptData): Promise<Uint8Array> {
    const doc = new jsPDF();
    
    // Set up document properties
    doc.setProperties({
      title: `Transkrip Akademik - ${data.fullName}`,
      subject: 'Academic Transcript',
      author: 'Institut Teknologi Bandung',
      creator: 'TranscriptGenerator'
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const usableHeight = pageHeight - (margin * 2);
    let currentY = margin;

    // Helper function to add centered text
    const addCenteredText = (text: string, y: number, fontSize: number = 12, fontStyle: string = 'normal') => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      const textWidth = doc.getStringUnitWidth(text) * fontSize / doc.internal.scaleFactor;
      const x = (pageWidth - textWidth) / 2;
      doc.text(text, x, y);
      return y + (fontSize * 0.3527777778); // Convert pt to mm
    };

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace: number): boolean => {
      if (currentY + requiredSpace > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
        return true;
      }
      return false;
    };

    // Header section
    const programFullName = data.program === 'IF' 
      ? 'Program Studi Teknik Informatika'
      : 'Program Studi Sistem dan Teknologi Informasi';

    currentY = addCenteredText(programFullName, currentY, 13, 'normal');
    currentY = addCenteredText('Sekolah Teknik Elektro dan Informatika', currentY + 4, 11, 'normal');
    currentY = addCenteredText('Institut Teknologi Bandung', currentY + 4, 11, 'normal');

    // Add header border line
    currentY += 8;
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 12;

    // Title
    currentY = addCenteredText('Transkrip Akademik', currentY, 14, 'bold');
    currentY += 8;

    // Student information
    currentY = addCenteredText(`Nama: ${data.fullName}`, currentY, 11, 'normal');
    currentY = addCenteredText(`NIM: ${data.nim}`, currentY + 4, 11, 'normal');
    currentY += 12;

    // Prepare table data
    const tableHeaders = ['No', 'Kode MK', 'Nama mata kuliah', 'SKS', 'Nilai'];
    const tableData = data.courses.map((course, index) => [
      (index + 1).toString(),
      course.code,
      course.name,
      course.credits.toString(),
      course.grade
    ]);

    // Generate table with pagination support
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: currentY,
      styles: {
        fontSize: 9,
        cellPadding: 2,
        overflow: 'linebreak',
        halign: 'center'
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
        fontSize: 9
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
        fontSize: 9
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 }, // No - slightly larger
        1: { halign: 'center', cellWidth: 30 }, // Kode MK - larger
        2: { halign: 'left', cellWidth: 90 },   // Nama MK - larger to fill space
        3: { halign: 'center', cellWidth: 15 }, // SKS - slightly larger
        4: { halign: 'center', cellWidth: 20 }  // Nilai - larger
      },
      theme: 'grid',
      tableLineColor: [0, 0, 0],
      tableLineWidth: 0.3,
      margin: { left: margin, right: margin },
      pageBreak: 'auto',
      showHead: 'everyPage',
      tableWidth: 'auto'
    });

    // Get position after table
    // @ts-ignore
    currentY = (doc as any).lastAutoTable?.finalY || currentY + 50;
    currentY += 10;

    // Summary section
    currentY = addCenteredText(`Total Jumlah SKS = ${data.totalCredits}`, currentY, 11, 'normal');
    currentY = addCenteredText(`IPK = ${data.gpa.toFixed(2)}`, currentY + 4, 11, 'normal');
    currentY += 20;

    // Calculate space needed for signature section
    const cleanSignature = data.digitalSignature.replace(/\r?\n|\r/g, '').replace(/\s+/g, '');
    const estimatedSignatureLines = Math.ceil(cleanSignature.length / 75); // More conservative estimate
    const signatureHeight = 50 + (estimatedSignatureLines * 4.5); // Increased spacing

    // Check if we need a new page for signature
    checkNewPage(signatureHeight);

    // Digital signature section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Ketua Program Studi', margin, currentY);
    currentY += 10;

    // Signature markers
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('--Begin signature--', margin, currentY);
    currentY += 6;

    // Draw signature box background
    const signatureBoxHeight = Math.max(40, estimatedSignatureLines * 4.5); // Increased height
    doc.setFillColor(249, 249, 249); // Light gray background
    doc.rect(margin, currentY - 2, pageWidth - (margin * 2), signatureBoxHeight, 'F');
    doc.setDrawColor(221, 221, 221); // Border color
    doc.rect(margin, currentY - 2, pageWidth - (margin * 2), signatureBoxHeight, 'S');

    // Signature content - calculate optimal character width
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    
    // Calculate max characters per line based on available width
    const availableWidth = pageWidth - (margin * 2) - 6; // More padding
    const charWidth = doc.getStringUnitWidth('X') * 7 / doc.internal.scaleFactor;
    const maxCharsPerLine = Math.floor(availableWidth / charWidth) - 2; // Leave some buffer
    
    const signatureLines = this.wrapText(data.digitalSignature, maxCharsPerLine);
    
    // Draw signature lines with proper spacing
    const lineHeight = 4; // Increased line height to prevent overlap
    let signatureY = currentY + 4; // More initial padding
    
    for (let i = 0; i < signatureLines.length; i++) {
      // Check if we need a new page
      if (signatureY + lineHeight > pageHeight - margin - 25) {
        doc.addPage();
        signatureY = margin + 25;
        
        // Redraw signature markers on new page
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('--Begin signature (continued)--', margin, margin + 15);
        
        // Draw new signature box on new page
        doc.setFillColor(249, 249, 249);
        doc.rect(margin, signatureY - 2, pageWidth - (margin * 2), 40, 'F');
        doc.setDrawColor(221, 221, 221);
        doc.rect(margin, signatureY - 2, pageWidth - (margin * 2), 40, 'S');
        
        doc.setFont('courier', 'normal');
        doc.setFontSize(7);
      }
      
      doc.text(signatureLines[i], margin + 3, signatureY);
      signatureY += lineHeight;
    }
    
    currentY = Math.max(currentY + signatureBoxHeight + 8, signatureY + 4); // More spacing

    // End signature marker
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('--End signature--', margin, currentY);
    currentY += 12;

    // Program head name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`(${data.programHeadName})`, margin, currentY);

    // Convert to Uint8Array
    const pdfOutput = doc.output('arraybuffer');
    return new Uint8Array(pdfOutput);
  }

  /**
   * Helper function to wrap text for signature display in PDF
   * Removes newlines and wraps only at page margins
   */
  private wrapText(text: string, maxLineLength: number): string[] {
    // Remove all newlines and normalize whitespace first
    const cleanText = text.replace(/\r?\n|\r/g, '').replace(/\s+/g, '');
    
    const lines: string[] = [];
    let currentLine = '';
    
    for (let i = 0; i < cleanText.length; i++) {
      currentLine += cleanText[i];
      if (currentLine.length >= maxLineLength) {
        lines.push(currentLine);
        currentLine = '';
      }
    }
    
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  /**
   * Helper function to wrap text for HTML display
   * Also removes newlines for consistent display
   */
  private wrapTextForHTML(text: string, maxLineLength: number): string {
    // Remove all newlines and normalize whitespace first
    const cleanText = text.replace(/\r?\n|\r/g, '').replace(/\s+/g, '');
    
    const lines: string[] = [];
    let currentLine = '';
    
    for (let i = 0; i < cleanText.length; i++) {
      currentLine += cleanText[i];
      if (currentLine.length >= maxLineLength) {
        lines.push(currentLine);
        currentLine = '';
      }
    }
    
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
    
    return lines.join('\n');
  }

  /**
   * Generate complete PDF from transcript data
   */
  async generatePDF(data: StudentTranscriptData): Promise<Uint8Array> {
    try {
      // Validate input data
      this.validateTranscriptData(data);
      
      // Convert to PDF with actual table formatting
      const pdfBytes = await this.htmlToPDF(data);
      
      return pdfBytes;
      
    } catch (error) {
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate HTML preview (for web display)
   */
  generateHTMLPreview(data: StudentTranscriptData): string {
    this.validateTranscriptData(data);
    return this.generateHTMLContent(data);
  }

  /**
   * Validate transcript data
   */
  private validateTranscriptData(data: StudentTranscriptData): void {
    if (!data.nim || !data.fullName) {
      throw new Error('Missing required student information');
    }
    
    if (!data.courses || data.courses.length === 0) {
      throw new Error('No courses found for transcript');
    }
    
    if (!data.digitalSignature) {
      throw new Error('Digital signature is required');
    }
    
    if (!data.programHeadName) {
      throw new Error('Program head name is required');
    }
    
    // Validate GPA range
    if (data.gpa < 0 || data.gpa > 4) {
      throw new Error('Invalid GPA value');
    }
    
    // Validate courses
    for (const course of data.courses) {
      if (!course.code || !course.name || course.credits <= 0) {
        throw new Error(`Invalid course data: ${course.code}`);
      }
    }
  }

  /**
   * Generate filename for PDF
   */
  generateFilename(data: StudentTranscriptData, isEncrypted: boolean = false): string {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = isEncrypted ? '_encrypted' : '';
    return `transcript_${data.nim}_${timestamp}${suffix}.pdf`;
  }
}

// Export singleton instance
export const transcriptGenerator = new TranscriptGenerator();

// Export utility functions
export const generateTranscriptPDF = (data: StudentTranscriptData) => 
  transcriptGenerator.generatePDF(data);

export const generateTranscriptPreview = (data: StudentTranscriptData) => 
  transcriptGenerator.generateHTMLPreview(data);

export const validateTranscriptData = (data: StudentTranscriptData) => 
  transcriptGenerator['validateTranscriptData'](data);