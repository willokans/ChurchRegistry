/**
 * Server-side: build baptism certificate as PDF buffer (for email attachment).
 */
import { jsPDF } from 'jspdf';

export interface CertificateData {
  baptism: {
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

export function buildBaptismCertificatePdf(data: CertificateData): Buffer {
  const doc = new jsPDF();
  const { baptism, parishName, dioceseName } = data;
  const displayName = `${baptism.baptismName}${baptism.otherNames ? ` ${baptism.otherNames}` : ''} ${baptism.surname}`.trim();
  const margin = 20;
  let y = 20;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(128, 0, 0); // maroon-ish
  doc.text('Baptism Certificate', 105, y, { align: 'center' });
  y += 12;

  // Parish · Diocese
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  const sub = [parishName, dioceseName].filter(Boolean).join(' · ');
  if (sub) {
    doc.text(sub, 105, y, { align: 'center' });
    y += 14;
  }

  // Line
  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, 210 - margin, y);
  y += 14;

  // Body
  doc.setFontSize(11);
  doc.text(`This is to certify that ${displayName} was received into the Church through the Sacrament of Baptism.`, margin, y, { maxWidth: 170 });
  y += 16;

  doc.setFontSize(10);
  const lines = [
    ['Date of birth:', formatDate(baptism.dateOfBirth)],
    ['Gender:', baptism.gender],
    ['Father:', baptism.fathersName],
    ['Mother:', baptism.mothersName],
    ['Sponsors:', baptism.sponsorNames],
  ];
  if (baptism.officiatingPriest) lines.push(['Officiating priest:', baptism.officiatingPriest]);
  const address = baptism.parentAddress ?? baptism.address;
  if (address) lines.push(["Parents' address:", address]);

  for (const [label, value] of lines) {
    doc.setFont('helvetica', 'normal');
    doc.text(`${label} `, margin, y);
    const labelW = doc.getTextWidth(`${label} `);
    doc.setFont('helvetica', 'bold');
    doc.text(value, margin + labelW, y, { maxWidth: 170 - labelW });
    y += 7;
  }

  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(parishName, 105, y, { align: 'center' });
  y += 6;
  doc.text(dioceseName, 105, y, { align: 'center' });
  y += 6;
  doc.text('This certificate is issued for official use.', 105, y, { align: 'center' });

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
