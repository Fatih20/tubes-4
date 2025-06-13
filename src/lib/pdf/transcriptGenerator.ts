// src/lib/pdf/TranscriptGenerator.ts
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
      border-top: 1px solid #000;
      border-left: 1px solid #000;
      border-right: 1px solid #000;
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
      border-right: none;
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
    }
    
    .signature-title {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 15px;
    }
    
    .signature-markers {
      font-size: 11px;
      margin: 8px 0;
    }
    
    .signature-content {
      font-family: 'Courier New', monospace;
      font-size: 9px;
      margin: 10px 0;
      word-break: break-all;
      line-height: 1.3;
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
        <th style="width: 20%;">Kode mata kuliah</th>
        <th style="width: 45%;">Nama mata kuliah</th>
        <th style="width: 12%;">SKS</th>
        <th style="width: 15%;">Nilai</th>
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
    <div class="signature-content">${data.digitalSignature}</div>
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

    currentY = addCenteredText(programFullName, currentY, 13, 'normal'); // Slightly smaller
    currentY = addCenteredText('Sekolah Teknik Elektro dan Informatika', currentY + 4, 11, 'normal');
    currentY = addCenteredText('Institut Teknologi Bandung', currentY + 4, 11, 'normal');

    // Add header border line
    currentY += 8;
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 12;

    // Title
    currentY = addCenteredText('Transkrip Akademik', currentY, 14, 'bold'); // Smaller title
    currentY += 8;

    // Student information
    currentY = addCenteredText(`Nama: ${data.fullName}`, currentY, 11, 'normal');
    currentY = addCenteredText(`NIM: ${data.nim}`, currentY + 4, 11, 'normal');
    currentY += 12;

    // Prepare table data
    const tableHeaders = ['No', 'Kode MK', 'Nama mata kuliah', 'SKS', 'Nilai']; // Shortened header
    const tableData = data.courses.map((course, index) => [
      (index + 1).toString(),
      course.code,
      course.name,
      course.credits.toString(),
      course.grade
    ]);

    // Calculate remaining space for table and signature
    const signatureHeight = 80; // Estimated space needed for signature
    const availableTableHeight = usableHeight - (currentY - margin) - signatureHeight;

    // Generate table with pagination support
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: currentY,
      styles: {
        fontSize: 9, // Smaller font
        cellPadding: 2, // Less padding
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
        0: { halign: 'center', cellWidth: 12 }, // No - smaller
        1: { halign: 'center', cellWidth: 25 }, // Kode MK - smaller
        2: { halign: 'left', cellWidth: 85 },   // Nama MK - slightly smaller
        3: { halign: 'center', cellWidth: 12 }, // SKS - smaller
        4: { halign: 'center', cellWidth: 18 }  // Nilai - smaller
      },
      theme: 'grid',
      tableLineColor: [0, 0, 0],
      tableLineWidth: 0.3,
      margin: { left: margin, right: margin },
      pageBreak: 'auto', // Enable automatic page breaks
      showHead: 'everyPage', // Show header on every page
      tableWidth: 'auto'
    });

    // Get position after table
    // @ts-ignore
    currentY = (doc as any).lastAutoTable?.finalY || currentY + 50;
    currentY += 10;

    // Check if we need a new page for signature
    checkNewPage(signatureHeight);

    // Summary section
    currentY = addCenteredText(`Total Jumlah SKS = ${data.totalCredits}`, currentY, 11, 'normal');
    currentY = addCenteredText(`IPK = ${data.gpa.toFixed(2)}`, currentY + 4, 11, 'normal');
    currentY += 15;

    // Check again for signature section
    checkNewPage(50);

    // Digital signature section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Ketua Program Studi', margin, currentY);
    currentY += 8;

    // Signature markers
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('--Begin signature--', margin, currentY);
    currentY += 6;

    // Signature content - wrap it more aggressively to fit
    doc.setFont('courier', 'normal');
    doc.setFontSize(7); // Smaller signature font
    const signatureLines = this.wrapText(data.digitalSignature, 90); // More characters per line
    
    // Limit signature lines if too many
    const maxSignatureLines = Math.min(signatureLines.length, 8);
    for (let i = 0; i < maxSignatureLines; i++) {
      if (currentY + 3 > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }
      doc.text(signatureLines[i], margin, currentY);
      currentY += 3;
    }
    
    // If signature was truncated, add ellipsis
    if (signatureLines.length > maxSignatureLines) {
      doc.text('...', margin, currentY);
      currentY += 3;
    }
    
    currentY += 3;

    // End signature marker
    if (currentY + 15 > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
    }
    
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
   * Helper function to wrap text for signature display
   */
  private wrapText(text: string, maxLineLength: number): string[] {
    const lines: string[] = [];
    let currentLine = '';
    
    for (let i = 0; i < text.length; i++) {
      currentLine += text[i];
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