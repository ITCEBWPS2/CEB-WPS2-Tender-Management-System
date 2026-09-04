const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType
} = require('docx');

const outputDir = path.join(__dirname, '../public/templates');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Colors
const COLOR_PRIMARY = '800000'; // Dark Red (CEB Brand Color)
const COLOR_SECONDARY = '1E293B'; // Dark Slate
const COLOR_HEADER_BG = 'F1F5F9';
const COLOR_BORDER = 'CBD5E1';

function createBorder() {
  return {
    top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
    left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
    right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER }
  };
}

// ============================================================================
// 1. GENERATE: Technical_Evaluation_Good.docx
// ============================================================================
async function generateTechnicalGoodTemplate() {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header / Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'CEYLON ELECTRICITY BOARD', bold: true, size: 32, color: COLOR_PRIMARY, font: 'Calibri' })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'WESTERN PROVINCE SOUTH 2 (WPS2) TENDER DIVISION', bold: true, size: 22, color: COLOR_SECONDARY, font: 'Calibri' })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({ text: 'TECHNICAL EVALUATION & COMPLIANCE REPORT - GOODS PROCUREMENT', bold: true, size: 24, color: COLOR_PRIMARY, underline: {}, font: 'Calibri' })
            ]
          }),

          // Section 1: Tender & Bidder Details
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            children: [new TextRun({ text: '1. TENDER & BIDDER IDENTIFICATION', bold: true, size: 24, color: COLOR_PRIMARY, font: 'Calibri' })]
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR },
                    borders: createBorder(),
                    children: [new Paragraph({ children: [new TextRun({ text: 'Tender Reference No:', bold: true, font: 'Calibri' })] })]
                  }),
                  new TableCell({
                    borders: createBorder(),
                    children: [new Paragraph({ children: [new TextRun({ text: 'CEB/WPS2/2026/GOODS-XXXX', font: 'Calibri' })] })]
                  }),
                  new TableCell({
                    shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR },
                    borders: createBorder(),
                    children: [new Paragraph({ children: [new TextRun({ text: 'Procurement Category:', bold: true, font: 'Calibri' })] })]
                  }),
                  new TableCell({
                    borders: createBorder(),
                    children: [new Paragraph({ children: [new TextRun({ text: 'Goods & Equipment', font: 'Calibri' })] })]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR },
                    borders: createBorder(),
                    children: [new Paragraph({ children: [new TextRun({ text: 'Bidder / Supplier Name:', bold: true, font: 'Calibri' })] })]
                  }),
                  new TableCell({
                    borders: createBorder(),
                    children: [new Paragraph({ children: [new TextRun({ text: '[INSERT BIDDER COMPANY NAME]', font: 'Calibri' })] })]
                  }),
                  new TableCell({
                    shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR },
                    borders: createBorder(),
                    children: [new Paragraph({ children: [new TextRun({ text: 'Evaluation Date:', bold: true, font: 'Calibri' })] })]
                  }),
                  new TableCell({
                    borders: createBorder(),
                    children: [new Paragraph({ children: [new TextRun({ text: '[DD / MM / YYYY]', font: 'Calibri' })] })]
                  })
                ]
              })
            ]
          }),

          // Section 2: Technical Evaluation Committee (TEC)
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
            children: [new TextRun({ text: '2. TECHNICAL EVALUATION COMMITTEE (TEC)', bold: true, size: 24, color: COLOR_PRIMARY, font: 'Calibri' })]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• Chairman: ', bold: true, font: 'Calibri' }),
              new TextRun({ text: 'Eng. [Chairman Name], Chief Engineer (WPS2)\n', font: 'Calibri' }),
              new TextRun({ text: '• Member 1: ', bold: true, font: 'Calibri' }),
              new TextRun({ text: 'Eng. [Member 1 Name], Executive Engineer (Distribution)\n', font: 'Calibri' }),
              new TextRun({ text: '• Member 2: ', bold: true, font: 'Calibri' }),
              new TextRun({ text: 'Eng. [Member 2 Name], Electrical Engineer (Planning)', font: 'Calibri' })
            ]
          }),

          // Section 3: Compliance Checklist Table
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
            children: [new TextRun({ text: '3. TECHNICAL COMPLIANCE CHECKLIST', bold: true, size: 24, color: COLOR_PRIMARY, font: 'Calibri' })]
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: COLOR_PRIMARY, type: ShadingType.CLEAR }, borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Item', bold: true, color: 'FFFFFF', font: 'Calibri' })] })] }),
                  new TableCell({ shading: { fill: COLOR_PRIMARY, type: ShadingType.CLEAR }, borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Technical Parameter', bold: true, color: 'FFFFFF', font: 'Calibri' })] })] }),
                  new TableCell({ shading: { fill: COLOR_PRIMARY, type: ShadingType.CLEAR }, borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'CEB Required Standard', bold: true, color: 'FFFFFF', font: 'Calibri' })] })] }),
                  new TableCell({ shading: { fill: COLOR_PRIMARY, type: ShadingType.CLEAR }, borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Offered Specification', bold: true, color: 'FFFFFF', font: 'Calibri' })] })] }),
                  new TableCell({ shading: { fill: COLOR_PRIMARY, type: ShadingType.CLEAR }, borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Compliant', bold: true, color: 'FFFFFF', font: 'Calibri' })] })] }),
                  new TableCell({ shading: { fill: COLOR_PRIMARY, type: ShadingType.CLEAR }, borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Remarks / Deviation', bold: true, color: 'FFFFFF', font: 'Calibri' })] })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: '1.0', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Rated Voltage', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: '33 kV / 11 kV Dual Rating', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: '33 kV / 11 kV Dual Rating', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'YES', bold: true, color: '008000', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Meets IEC 60076 standard', font: 'Calibri' })] })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: '2.0', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Winding Material', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: '100% Electrolytic Copper', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: '100% Electrolytic Copper', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'YES', bold: true, color: '008000', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Test certificate verified', font: 'Calibri' })] })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: '3.0', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Type Test Certificate', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'KEMA / CESI Accredited Lab', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'KEMA Report No. KM-8842', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'YES', bold: true, color: '008000', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Issued within last 5 yrs', font: 'Calibri' })] })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: '4.0', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Warranty Period', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: '36 Months Minimum', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: '36 Months Full Warranty', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'YES', bold: true, color: '008000', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Manufacturer letter attached', font: 'Calibri' })] })] })
                ]
              })
            ]
          }),

          // Section 4: Recommendation
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
            children: [new TextRun({ text: '4. OVERALL RECOMMENDATION', bold: true, size: 24, color: COLOR_PRIMARY, font: 'Calibri' })]
          }),

          new Paragraph({
            children: [
              new TextRun({ text: '[  ] TECHNICALLY COMPLIANT AND RECOMMENDED FOR COMMERCIAL OPENING\n', bold: true, color: '008000', font: 'Calibri' }),
              new TextRun({ text: '[  ] REJECTED - NON-COMPLIANT WITH CEB TECHNICAL SPECIFICATIONS\n\n', bold: true, color: 'FF0000', font: 'Calibri' }),
              new TextRun({ text: 'TEC Comments & Summary Justification:\n', bold: true, font: 'Calibri' }),
              new TextRun({ text: 'The submitted proposal fulfills all major technical parameters and complies with CEB specifications. Recommended to proceed to commercial bid evaluation.', font: 'Calibri', italic: true })
            ]
          }),

          // Section 5: Signatures
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
            children: [new TextRun({ text: '5. TEC COMMITTEE SIGNATURES', bold: true, size: 24, color: COLOR_PRIMARY, font: 'Calibri' })]
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: createBorder(),
                    children: [
                      new Paragraph({ children: [new TextRun({ text: '________________________\n', font: 'Calibri' }), new TextRun({ text: 'TEC Chairman\n', bold: true, font: 'Calibri' }), new TextRun({ text: 'Date: _______________', font: 'Calibri' })] })
                    ]
                  }),
                  new TableCell({
                    borders: createBorder(),
                    children: [
                      new Paragraph({ children: [new TextRun({ text: '________________________\n', font: 'Calibri' }), new TextRun({ text: 'TEC Member 1\n', bold: true, font: 'Calibri' }), new TextRun({ text: 'Date: _______________', font: 'Calibri' })] })
                    ]
                  }),
                  new TableCell({
                    borders: createBorder(),
                    children: [
                      new Paragraph({ children: [new TextRun({ text: '________________________\n', font: 'Calibri' }), new TextRun({ text: 'TEC Member 2\n', bold: true, font: 'Calibri' }), new TextRun({ text: 'Date: _______________', font: 'Calibri' })] })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  const filePath = path.join(outputDir, 'Technical_Evaluation_Good.docx');
  fs.writeFileSync(filePath, buffer);
  console.log(`Generated: ${filePath} (${buffer.length} bytes)`);
}

// ============================================================================
// 2. GENERATE: Final_Technical_Evaluation_Service.docx
// ============================================================================
async function generateTechnicalServiceTemplate() {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header / Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'CEYLON ELECTRICITY BOARD', bold: true, size: 32, color: COLOR_PRIMARY, font: 'Calibri' })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'WESTERN PROVINCE SOUTH 2 (WPS2) TENDER DIVISION', bold: true, size: 22, color: COLOR_SECONDARY, font: 'Calibri' })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({ text: 'FINAL TECHNICAL EVALUATION & RANKING REPORT - SERVICE CONTRACTS', bold: true, size: 24, color: COLOR_PRIMARY, underline: {}, font: 'Calibri' })
            ]
          }),

          // Section 1: Executive Summary
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            children: [new TextRun({ text: '1. SERVICE CONTRACT DETAILS', bold: true, size: 24, color: COLOR_PRIMARY, font: 'Calibri' })]
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR },
                    borders: createBorder(),
                    children: [new Paragraph({ children: [new TextRun({ text: 'Tender Ref No:', bold: true, font: 'Calibri' })] })]
                  }),
                  new TableCell({
                    borders: createBorder(),
                    children: [new Paragraph({ children: [new TextRun({ text: 'CEB/WPS2/2026/SERV-XXXX', font: 'Calibri' })] })]
                  }),
                  new TableCell({
                    shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR },
                    borders: createBorder(),
                    children: [new Paragraph({ children: [new TextRun({ text: 'Service Category:', bold: true, font: 'Calibri' })] })]
                  }),
                  new TableCell({
                    borders: createBorder(),
                    children: [new Paragraph({ children: [new TextRun({ text: 'Maintenance & Service Contracts', font: 'Calibri' })] })]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR },
                    borders: createBorder(),
                    children: [new Paragraph({ children: [new TextRun({ text: 'User Department:', bold: true, font: 'Calibri' })] })]
                  }),
                  new TableCell({
                    borders: createBorder(),
                    children: [new Paragraph({ children: [new TextRun({ text: 'Transmission Division (WPS2)', font: 'Calibri' })] })]
                  }),
                  new TableCell({
                    shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR },
                    borders: createBorder(),
                    children: [new Paragraph({ children: [new TextRun({ text: 'Evaluation Date:', bold: true, font: 'Calibri' })] })]
                  }),
                  new TableCell({
                    borders: createBorder(),
                    children: [new Paragraph({ children: [new TextRun({ text: '[DD / MM / YYYY]', font: 'Calibri' })] })]
                  })
                ]
              })
            ]
          }),

          // Section 2: Evaluated Bidders Summary Table
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
            children: [new TextRun({ text: '2. TECHNICAL EVALUATION & BIDDER RANKING', bold: true, size: 24, color: COLOR_PRIMARY, font: 'Calibri' })]
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: COLOR_PRIMARY, type: ShadingType.CLEAR }, borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Bid No.', bold: true, color: 'FFFFFF', font: 'Calibri' })] })] }),
                  new TableCell({ shading: { fill: COLOR_PRIMARY, type: ShadingType.CLEAR }, borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Bidder Name', bold: true, color: 'FFFFFF', font: 'Calibri' })] })] }),
                  new TableCell({ shading: { fill: COLOR_PRIMARY, type: ShadingType.CLEAR }, borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Tech Score', bold: true, color: 'FFFFFF', font: 'Calibri' })] })] }),
                  new TableCell({ shading: { fill: COLOR_PRIMARY, type: ShadingType.CLEAR }, borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true, color: 'FFFFFF', font: 'Calibri' })] })] }),
                  new TableCell({ shading: { fill: COLOR_PRIMARY, type: ShadingType.CLEAR }, borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Key Qualifications / Findings', bold: true, color: 'FFFFFF', font: 'Calibri' })] })] }),
                  new TableCell({ shading: { fill: COLOR_PRIMARY, type: ShadingType.CLEAR }, borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Rank', bold: true, color: 'FFFFFF', font: 'Calibri' })] })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'BID-01', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Metropolitan Engineering (Pvt) Ltd', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: '94.5 / 100', bold: true, font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'COMPLIANT', bold: true, color: '008000', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Fully qualified staff, ISO certified', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Rank 1', bold: true, font: 'Calibri' })] })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'BID-02', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Lanka Power Services PLC', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: '88.0 / 100', bold: true, font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'COMPLIANT', bold: true, color: '008000', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Strong proposal, minor spares gap', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Rank 2', bold: true, font: 'Calibri' })] })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'BID-03', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Global Energy Solutions Ltd', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: '62.0 / 100', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'NON-COMPLIANT', bold: true, color: 'FF0000', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Lacks required 5-yr experience', font: 'Calibri' })] })] }),
                  new TableCell({ borders: createBorder(), children: [new Paragraph({ children: [new TextRun({ text: 'Disqualified', font: 'Calibri' })] })] })
                ]
              })
            ]
          }),

          // Section 3: Recommended Award
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
            children: [new TextRun({ text: '3. FINAL AWARD RECOMMENDATION & JUSTIFICATION', bold: true, size: 24, color: COLOR_PRIMARY, font: 'Calibri' })]
          }),

          new Paragraph({
            children: [
              new TextRun({ text: 'Recommended Awardee: ', bold: true, font: 'Calibri' }),
              new TextRun({ text: 'Metropolitan Engineering (Pvt) Ltd (First Ranked Bidder)\n', bold: true, color: COLOR_PRIMARY, font: 'Calibri' }),
              new TextRun({ text: 'Total Technical Evaluation Score: ', bold: true, font: 'Calibri' }),
              new TextRun({ text: '94.5 / 100 Points\n\n', font: 'Calibri' }),
              new TextRun({ text: 'Justification Summary:\n', bold: true, font: 'Calibri' }),
              new TextRun({ text: 'The Technical Evaluation Committee recommends awarding the contract to Metropolitan Engineering (Pvt) Ltd based on demonstrated technical capacity, certified personnel, and full compliance with CEB service level requirements.', font: 'Calibri', italic: true })
            ]
          }),

          // Section 4: Sign-Off & Approvals
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
            children: [new TextRun({ text: '4. APPROVAL & SIGN-OFF BLOCK', bold: true, size: 24, color: COLOR_PRIMARY, font: 'Calibri' })]
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: createBorder(),
                    children: [
                      new Paragraph({ children: [new TextRun({ text: '________________________\n', font: 'Calibri' }), new TextRun({ text: 'TEC Chairman\n', bold: true, font: 'Calibri' }), new TextRun({ text: 'Date: _______________', font: 'Calibri' })] })
                    ]
                  }),
                  new TableCell({
                    borders: createBorder(),
                    children: [
                      new Paragraph({ children: [new TextRun({ text: '________________________\n', font: 'Calibri' }), new TextRun({ text: 'Head of Department (WPS2)\n', bold: true, font: 'Calibri' }), new TextRun({ text: 'Date: _______________', font: 'Calibri' })] })
                    ]
                  }),
                  new TableCell({
                    borders: createBorder(),
                    children: [
                      new Paragraph({ children: [new TextRun({ text: '________________________\n', font: 'Calibri' }), new TextRun({ text: 'Procurement Approval Authority\n', bold: true, font: 'Calibri' }), new TextRun({ text: 'Date: _______________', font: 'Calibri' })] })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  const filePath = path.join(outputDir, 'Final_Technical_Evaluation_Service.docx');
  fs.writeFileSync(filePath, buffer);
  console.log(`Generated: ${filePath} (${buffer.length} bytes)`);
}

async function main() {
  await generateTechnicalGoodTemplate();
  await generateTechnicalServiceTemplate();
  console.log('Template generation complete!');
}

main().catch(console.error);
