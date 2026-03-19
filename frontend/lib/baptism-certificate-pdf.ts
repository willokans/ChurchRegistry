/**
 * Server-side: build baptism certificate as PDF buffer (for email attachment).
 * Layout matches the HTML certificate template: two-column data, signature area, certificate ID.
 */
import { jsPDF } from 'jspdf';

export interface CertificateData {
  baptism: {
    id: number;
    baptismName: string;
    otherNames: string;
    surname: string;
    dateOfBirth: string;
    gender: string;
    fathersName: string;
    mothersName: string;
    sponsorNames: string;
    officiatingPriest?: string;
    parentAddress?: string;
    address?: string;
    placeOfBirth?: string | null;
    placeOfBaptism?: string | null;
    dateOfBaptism?: string | null;
    liberNo?: string | null;
  };
  parishName: string;
  dioceseName: string;
}

function formatDate(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatDateIssued(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function certificateId(baptismId: number, parishName: string): string {
  const year = new Date().getFullYear();
  const code = parishName.replace(/\s+/g, '').slice(0, 4).toUpperCase() || 'PR';
  return `BAP-${code}-${year}-${String(baptismId).padStart(6, '0')}`;
}

export function buildBaptismCertificatePdf(data: CertificateData): Buffer {
  const doc = new jsPDF({ orientation: 'landscape' });
  const { baptism, parishName, dioceseName } = data;
  const displayName = `${baptism.baptismName}${baptism.otherNames ? ` ${baptism.otherNames}` : ''} ${baptism.surname}`.trim();
  const margin = 20;
  const pageW = 297; // A4 landscape
  const pageH = 210;
  const centerX = pageW / 2;
  const gold: [number, number, number] = [184, 134, 11];
  const maroon: [number, number, number] = [107, 45, 60];
  const labelColor: [number, number, number] = [107, 114, 128];
  const valueColor: [number, number, number] = [17, 24, 39];
  let y = 25;

  // Gold border
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  doc.rect(margin - 2, 15, pageW - 2 * margin + 4, pageH - 30);

  // Header: Cross (simple +), Title, Parish, Diocese
  doc.setFontSize(10);
  doc.setTextColor(...gold);
  doc.text('✠', centerX, y, { align: 'center' });
  y += 12;

  doc.setFontSize(22);
  doc.setTextColor(...maroon);
  doc.setFont('helvetica', 'bold');
  doc.text('BAPTISM CERTIFICATE', centerX, y, { align: 'center' });
  y += 12;

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  if (parishName) {
    doc.text(parishName, centerX, y, { align: 'center' });
    y += 8;
  }
  if (dioceseName) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(dioceseName, centerX, y, { align: 'center' });
    y += 10;
  }

  // Decorative separator
  y += 4;
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.4);
  doc.line(margin, y, centerX - 4, y);
  doc.line(centerX + 4, y, pageW - margin, y);
  doc.setFontSize(6);
  doc.setTextColor(...gold);
  doc.text('◆', centerX, y + 1.5, { align: 'center' });
  y += 14;

  // Certification statement
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.setFont('times', 'italic');
  doc.text('This is to certify that', centerX, y, { align: 'center' });
  y += 8;
  doc.setFont('times', 'italic');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text(displayName, centerX, y, { align: 'center' });
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(55, 65, 81);
  doc.text('was received into the Church through the Sacrament of Baptism.', centerX, y, { align: 'center' });
  y += 10;

  // Decorative separator
  doc.setDrawColor(...gold);
  doc.line(margin, y, centerX - 4, y);
  doc.line(centerX + 4, y, pageW - margin, y);
  doc.setFontSize(6);
  doc.setTextColor(...gold);
  doc.text('◆', centerX, y + 1.5, { align: 'center' });
  y += 14;

  // Two-column layout
  const col1X = margin;
  const col2X = margin + 95;
  const lineH = 7;
  let yLeft = y;
  let yRight = y;

  const leftRows: [string, string][] = [
    ['Baptism Name:', baptism.baptismName || '—'],
    ['Surname:', baptism.surname || '—'],
    ['Gender:', baptism.gender || '—'],
    ['Date of birth:', formatDate(baptism.dateOfBirth) || '—'],
    ['Place of birth:', baptism.placeOfBirth?.trim() || '—'],
    ['Place of baptism:', baptism.placeOfBaptism?.trim() || '—'],
    ['Liber No.:', baptism.liberNo?.trim() || '—'],
  ];

  const rightRows: [string, string][] = [
    ['Father:', baptism.fathersName || '—'],
    ['Mother:', baptism.mothersName || '—'],
    ["Parents' address:", baptism.parentAddress ?? baptism.address ?? '—'],
    ['Sponsors:', baptism.sponsorNames || '—'],
    ['Officiating Priest:', baptism.officiatingPriest || '—'],
  ];

  doc.setFontSize(10);
  for (const [label, value] of leftRows) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...labelColor);
    doc.text(`${label} `, col1X, yLeft);
    const lw = doc.getTextWidth(`${label} `);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...valueColor);
    doc.text(value, col1X + lw, yLeft, { maxWidth: 85 - lw });
    yLeft += lineH;
  }

  for (const [label, value] of rightRows) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...labelColor);
    doc.text(`${label} `, col2X, yRight);
    const lw = doc.getTextWidth(`${label} `);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...valueColor);
    doc.text(value, col2X + lw, yRight, { maxWidth: 85 - lw });
    yRight += lineH;
  }

  y = Math.max(yLeft, yRight) + 18;

  // Footer: Church crest (left) | Signature + church + date/ID/QR (right) — same level
  const footerY = y;
  const sealX = margin + 15;
  const rightX = pageW - margin;

  // Left: church crest (seal) + parish name
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  doc.circle(sealX, footerY + 12, 10);
  doc.setFontSize(6);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'bold');
  doc.text(parishName, sealX, footerY + 28, { align: 'center', maxWidth: 35 });

  // Right: signature line, name, title, church, disclaimer, Date Issued, Certificate ID, QR
  doc.setDrawColor(100, 100, 100);
  doc.line(rightX - 50, footerY, rightX, footerY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(baptism.officiatingPriest || '—', rightX, footerY + 6, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text('OFFICIATING PRIEST', rightX, footerY + 12, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(parishName, rightX, footerY + 20, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text('This certificate is issued for official use.', rightX, footerY + 26, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(`Date Issued: ${formatDateIssued()}`, rightX, footerY + 36, { align: 'right' });
  doc.text(`Certificate ID: ${certificateId(baptism.id, parishName)}`, rightX, footerY + 43, { align: 'right' });
  doc.setDrawColor(200, 200, 200);
  doc.rect(rightX - 12, footerY + 46, 12, 12);
  doc.setFontSize(6);
  doc.setTextColor(150, 150, 150);
  doc.text('QR', rightX - 6, footerY + 53, { align: 'center' });
  doc.setFontSize(7);
  doc.text('Verify Certificate', rightX - 6, footerY + 60, { align: 'center' });

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
