const PDFDocument = require('pdfkit');

/**
 * Formats a date string (YYYY-MM-DD) into readable British format (e.g. 15 January 2026).
 *
 * @param {string|Date|null} dateVal
 * @returns {string}
 */
function formatDate(dateVal) {
  if (!dateVal) return 'Not Specified';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return String(dateVal);
  }
}

/**
 * Generates a CEB-branded PDF report for a tender record.
 *
 * @param {Object} record - The tender record object
 * @param {string} [reportType='General'] - Report type ('Award', 'Completion', or 'Status')
 * @returns {Promise<Buffer>} - Resolves with PDF Buffer
 */
function generateTenderPdf(record, reportType = 'Status') {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        info: {
          Title: `CEB Tender Report - ${record.tender_number || record.tenderNumber || 'N/A'}`,
          Author: 'Ceylon Electricity Board - Tender Management System',
          Subject: `Tender ${reportType} Report`,
          CreationDate: new Date()
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const tenderNumber = record.tender_number || record.tenderNumber || 'N/A';
      const category = record.category || 'General';
      const relevantTo = record.relevant_to || record.relevantTo || 'Not Specified';
      const status = record.status || 'Under Evaluation';
      const description = record.description || 'No description provided.';
      const awardedTo = record.awarded_to || record.awardedTo || 'N/A';
      const tecCommitteeNumber = record.tec_committee_number || record.tecCommitteeNumber || 'N/A';
      const tecChairman = record.tec_chairman || record.tecChairman || 'Not Assigned';
      const tecMember1 = record.tec_member1 || record.tecMember1 || 'Not Assigned';
      const tecMember2 = record.tec_member2 || record.tecMember2 || 'Not Assigned';

      // ======================================================================
      // 1. Header Banner
      // ======================================================================
      doc.rect(40, 40, 515, 65).fill('#0f172a');

      doc.fillColor('#fbbf24')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('CEYLON ELECTRICITY BOARD', 50, 52, { align: 'center', width: 495 });

      doc.fillColor('#ffffff')
        .fontSize(11)
        .font('Helvetica')
        .text(`TENDER ${reportType.toUpperCase()} REPORT`, 50, 74, { align: 'center', width: 495 });

      doc.fontSize(8)
        .fillColor('#94a3b8')
        .text(`Generated: ${new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 50, 90, { align: 'center', width: 495 });

      doc.y = 120;

      // ======================================================================
      // 2. Tender Quick Summary Card
      // ======================================================================
      doc.rect(40, doc.y, 515, 30).fill('#f1f5f9');
      doc.fillColor('#0f172a')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(`Tender No: ${tenderNumber}`, 50, doc.y + 8);

      const statusColor = status === 'Awarded' ? '#16a34a' : (status === 'Close' || status === 'Closed') ? '#2563eb' : '#d97706';
      doc.fillColor(statusColor)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`Status: ${status}`, 400, doc.y + 8, { align: 'right', width: 145 });

      doc.y += 40;

      // Helper function for a 2-column section row
      const drawRow = (label, value, y, col1Width = 140) => {
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569').text(label, 50, y, { width: col1Width });
        doc.font('Helvetica').fontSize(9).fillColor('#0f172a').text(value || '-', 50 + col1Width, y, { width: 360 });
      };

      // Helper function for section headings
      const drawSectionHeader = (title, y) => {
        doc.rect(40, y, 515, 20).fill('#e2e8f0');
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#1e293b').text(title, 50, y + 5);
        return y + 26;
      };

      // ======================================================================
      // 3. General Information
      // ======================================================================
      let curY = drawSectionHeader('1. GENERAL INFORMATION', doc.y);
      drawRow('Category:', category, curY); curY += 16;
      drawRow('Relevant Unit/Dept:', relevantTo, curY); curY += 16;
      drawRow('Description:', description, curY);
      const descHeight = Math.max(16, doc.heightOfString(description, { width: 360 }));
      curY += descHeight + 6;

      // ======================================================================
      // 4. Key Procurement Dates
      // ======================================================================
      curY = drawSectionHeader('2. KEY PROCUREMENT DATES', curY);
      drawRow('Bid Start Date:', formatDate(record.bid_start_date || record.bidStartDate), curY); curY += 16;
      drawRow('Bid Opening Date:', formatDate(record.bid_open_date || record.bidOpenDate), curY); curY += 16;
      drawRow('Bid Closing Date:', formatDate(record.bid_closing_date || record.bidClosingDate), curY); curY += 16;
      drawRow('Approved Date:', formatDate(record.approved_date || record.approvedDate), curY); curY += 16;
      drawRow('File Sent to TEC:', formatDate(record.file_sent_to_tec_date || record.fileSentToTecDate), curY); curY += 16;
      drawRow('Bid Validity Period:', formatDate(record.bid_validity_period || record.bidValidityPeriod), curY); curY += 22;

      // ======================================================================
      // 5. TEC Committee Details
      // ======================================================================
      curY = drawSectionHeader('3. TECHNICAL EVALUATION COMMITTEE (TEC)', curY);
      drawRow('Committee Number:', tecCommitteeNumber, curY); curY += 16;
      drawRow('Chairman:', tecChairman, curY); curY += 16;
      drawRow('Member 1:', tecMember1, curY); curY += 16;
      drawRow('Member 2:', tecMember2, curY); curY += 22;

      // ======================================================================
      // 6. Award & Contractor Details (if applicable)
      // ======================================================================
      curY = drawSectionHeader('4. AWARD & CONTRACT DETAILS', curY);
      drawRow('Awarded Supplier:', awardedTo, curY); curY += 16;
      drawRow('Agreement Start Date:', formatDate(record.service_agreement_start_date || record.serviceAgreementStartDate), curY); curY += 16;
      drawRow('Agreement End Date:', formatDate(record.service_agreement_end_date || record.serviceAgreementEndDate), curY); curY += 16;
      drawRow('Performance Bond No:', record.performance_bond_number || record.performanceBondNumber || 'N/A', curY); curY += 16;
      drawRow('Performance Bond Bank:', record.performance_bond_bank || record.performanceBondBank || 'N/A', curY); curY += 16;
      if (record.delay !== null && record.delay !== undefined) {
        drawRow('Calculated Delay:', `${record.delay} Day(s)`, curY); curY += 16;
      }
      curY += 10;

      // ======================================================================
      // 7. Footer
      // ======================================================================
      const pageBottom = 780;
      doc.rect(40, pageBottom, 515, 1).fill('#cbd5e1');
      doc.font('Helvetica').fontSize(8).fillColor('#64748b')
        .text('Ceylon Electricity Board — Tender Management System (WPS-II)', 50, pageBottom + 6, { width: 350 });
      doc.text('CONFIDENTIAL / OFFICIAL RECORD', 400, pageBottom + 6, { align: 'right', width: 145 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateTenderPdf,
  formatDate
};
