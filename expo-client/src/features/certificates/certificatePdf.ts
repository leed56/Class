import { jsPDF } from 'jspdf';

import { CertificateType } from '@/features/certificates/certificateService';

export type CertificateTemplate = {
  workspaceName: string;
  signatoryName: string;
  signatoryTitle: string;
  completionBody: string;
  achievementBody: string;
  footerNote: string;
};

export type CertificatePdfInput = {
  studentName: string;
  certificateType: CertificateType;
  title: string;
  serialNo: string;
  issuedOn: string;
  note?: string | null;
  revoked?: boolean;
  revokeReason?: string | null;
  template: CertificateTemplate;
};

const PLACEHOLDERS = ['{{student_name}}', '{{title}}', '{{workspace_name}}', '{{issued_on}}', '{{serial_no}}'] as const;

export function applyCertificateTemplate(
  body: string,
  values: { studentName: string; title: string; workspaceName: string; issuedOn: string; serialNo: string },
) {
  return body
    .replaceAll('{{student_name}}', values.studentName)
    .replaceAll('{{title}}', values.title)
    .replaceAll('{{workspace_name}}', values.workspaceName)
    .replaceAll('{{issued_on}}', values.issuedOn)
    .replaceAll('{{serial_no}}', values.serialNo);
}

export function getDefaultCertificateBodies() {
  return {
    completionBody:
      'This is to certify that {{student_name}} has successfully completed {{title}} at {{workspace_name}}.',
    achievementBody:
      'This is to certify that {{student_name}} has demonstrated outstanding achievement in {{title}} at {{workspace_name}}.',
    footerNote: 'Issued via ClassFlow',
  };
}

export function buildCertificatePdf(input: CertificatePdfInput) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  const bodyTemplate =
    input.certificateType === 'completion'
      ? input.template.completionBody
      : input.template.achievementBody;

  const bodyText = applyCertificateTemplate(bodyTemplate, {
    studentName: input.studentName,
    title: input.title,
    workspaceName: input.template.workspaceName,
    issuedOn: input.issuedOn,
    serialNo: input.serialNo,
  });

  const typeLabel = input.certificateType === 'completion' ? 'Certificate of Completion' : 'Certificate of Achievement';

  doc.setDrawColor(91, 61, 245);
  doc.setLineWidth(1.2);
  doc.rect(margin - 4, margin - 4, contentWidth + 8, pageHeight - margin * 2 + 8);

  doc.setDrawColor(210, 205, 235);
  doc.setLineWidth(0.4);
  doc.rect(margin - 1, margin - 1, contentWidth + 2, pageHeight - margin * 2 + 2);

  doc.setTextColor(91, 61, 245);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(input.template.workspaceName.toUpperCase(), pageWidth / 2, margin + 8, { align: 'center' });

  doc.setTextColor(30, 30, 40);
  doc.setFontSize(28);
  doc.text(typeLabel, pageWidth / 2, margin + 24, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(70, 70, 85);
  doc.text('This certificate is proudly presented to', pageWidth / 2, margin + 38, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(20, 20, 30);
  doc.text(input.studentName, pageWidth / 2, margin + 50, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(55, 55, 70);
  const wrappedBody = doc.splitTextToSize(bodyText, contentWidth - 20);
  doc.text(wrappedBody, pageWidth / 2, margin + 62, { align: 'center' });

  if (input.note?.trim()) {
    const noteY = margin + 62 + wrappedBody.length * 6 + 4;
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 105);
    doc.text(`Note: ${input.note.trim()}`, pageWidth / 2, noteY, { align: 'center' });
  }

  const footerY = pageHeight - margin - 28;
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 105);
  doc.text(`Serial: ${input.serialNo}`, margin, footerY);
  doc.text(`Issued: ${input.issuedOn}`, pageWidth - margin, footerY, { align: 'right' });

  const signatoryName = input.template.signatoryName.trim() || 'Authorized Signatory';
  doc.setDrawColor(180, 180, 195);
  doc.line(pageWidth / 2 - 35, footerY + 14, pageWidth / 2 + 35, footerY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 40);
  doc.text(signatoryName, pageWidth / 2, footerY + 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 105);
  doc.text(input.template.signatoryTitle.trim() || 'Director', pageWidth / 2, footerY + 26, { align: 'center' });

  if (input.template.footerNote.trim()) {
    doc.setFontSize(9);
    doc.text(input.template.footerNote.trim(), pageWidth / 2, pageHeight - margin + 2, { align: 'center' });
  }

  if (input.revoked) {
    doc.setTextColor(200, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(42);
    doc.text('REVOKED', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 35 });
    if (input.revokeReason?.trim()) {
      doc.setFontSize(11);
      doc.text(`Reason: ${input.revokeReason.trim()}`, pageWidth / 2, pageHeight / 2 + 14, { align: 'center', angle: 35 });
    }
  }

  return doc;
}

export function downloadCertificatePdf(input: CertificatePdfInput) {
  const doc = buildCertificatePdf(input);
  const safeSerial = input.serialNo.replace(/[^a-zA-Z0-9-_]/g, '_');
  const fileName = `${safeSerial}-${input.studentName.replace(/\s+/g, '-')}.pdf`;

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    doc.save(fileName);
    return fileName;
  }

  throw new Error('PDF download is available on web. Open ClassFlow in your browser to export certificates.');
}

export { PLACEHOLDERS };
