/**
 * exportUtils.ts
 * Excel (XLSX) export utility using SheetJS + file-saver
 * Used for Students, Teachers, and Finance data backup/download
 */
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// ─── Generic helper ─────────────────────────────────────────────────────────

/**
 * Uses file-saver's saveAs() — the cross-browser standard for named downloads.
 * Chrome ignores the `download` attribute on blob: URLs in some contexts;
 * file-saver works around this correctly in all browsers.
 */
function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  // saveAs handles the filename correctly across Chrome, Firefox, Edge
  saveAs(blob, filename);
}

function autoFitColumns(ws: XLSX.WorkSheet, data: any[][]) {
  const colWidths: number[] = [];
  data.forEach((row) => {
    row.forEach((cell, colIdx) => {
      const len = cell ? String(cell).length : 10;
      colWidths[colIdx] = Math.max(colWidths[colIdx] || 10, Math.min(len + 2, 50));
    });
  });
  ws['!cols'] = colWidths.map((w) => ({ wch: w }));
}

// ─── STUDENTS EXPORT ─────────────────────────────────────────────────────────

export function exportStudentsToExcel(students: any[]) {
  const timestamp = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

  const headers = [
    'Student ID',
    'Name',
    'Father Name',
    'Gender',
    'Class',
    'Group',
    'Session',
    'Subjects',
    'Fee Status',
    'Student Status',
    'Seat Number',
    'Phone',
    'Address',
    'CNIC',
    'Date of Birth',
    'Joining Date',
    'Email',
  ];

  const rows = students.map((s: any) => {
    const subjects = (s.subjects || [])
      .map((sub: any) => (typeof sub === 'string' ? sub : sub?.name || ''))
      .filter(Boolean)
      .join(', ');

    const sessionName =
      typeof s.sclassName === 'object'
        ? s.sclassName?.sessionName || s.sclassName?.name || ''
        : s.session?.sessionName || s.session?.name || '';

    return [
      s.studentId || s.rollNum || '',
      s.studentName || '',
      s.fatherName || '',
      s.gender || '',
      s.class || s.sclassName?.classTitle || '',
      s.group || '',
      sessionName,
      subjects,
      s.feeStatus || '',
      s.studentStatus || s.status || '',
      s.seatNumber || '',
      s.phone || s.phoneNumber || '',
      s.address || '',
      s.cnic || '',
      s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString('en-GB') : '',
      s.joiningDate ? new Date(s.joiningDate).toLocaleDateString('en-GB') : '',
      s.email || '',
    ];
  });

  const sheetData = [headers, ...rows];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Style header row (bold, background)
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let C = range.s.c; C <= range.e.c; C++) {
    const headerCell = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!ws[headerCell]) continue;
    ws[headerCell].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1E293B' } },
      alignment: { horizontal: 'center' },
    };
  }

  autoFitColumns(ws, sheetData);
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }; // Freeze header row

  XLSX.utils.book_append_sheet(wb, ws, 'Students');

  // Summary sheet
  const active = students.filter((s) => s.studentStatus !== 'Withdrawn' && s.status === 'active').length;
  const withdrawn = students.filter((s) => s.studentStatus === 'Withdrawn').length;
  const feePaid = students.filter((s) => s.feeStatus?.toLowerCase() === 'paid').length;
  const feePending = students.filter((s) => s.feeStatus?.toLowerCase() !== 'paid').length;

  const summaryData = [
    ['Genius Islamian\'s Academy — Student Backup Report'],
    ['Generated On:', new Date().toLocaleString()],
    [],
    ['Summary', 'Count'],
    ['Total Students', students.length],
    ['Active Students', active],
    ['Withdrawn Students', withdrawn],
    ['Fee Paid', feePaid],
    ['Fee Pending', feePending],
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  downloadWorkbook(wb, `GIA_Students_Backup_${timestamp}.xlsx`);
}

// ─── TEACHERS EXPORT ─────────────────────────────────────────────────────────

export function exportTeachersToExcel(teachers: any[]) {
  const timestamp = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

  const headers = [
    'Name',
    'Subject',
    'Phone',
    'Email',
    'Status',
    'Joining Date',
    'Username',
    'Compensation Mode',
    'Teacher Share (%)',
    'Academy Share (%)',
    'Fixed Salary (PKR)',
    'Wallet Balance (PKR)',
    'Total Earned (PKR)',
    'Per-Subject Rate',
    'Education',
    'Experience',
    'Address',
  ];

  const rows = teachers.map((t: any) => [
    t.name || '',
    t.subject || '',
    t.phone || '',
    t.email || '',
    t.status || '',
    t.joiningDate ? new Date(t.joiningDate).toLocaleDateString('en-GB') : '',
    t.username || '',
    t.compensationMode || t.salaryMode || '',
    t.teacherShare ?? t.teacherPct ?? '',
    t.academyShare ?? t.academyPct ?? '',
    t.fixedSalary ?? '',
    t.walletBalance ?? t.balance ?? '',
    t.totalEarned ?? '',
    t.perSubjectRate ?? '',
    t.education || '',
    t.experience || '',
    t.address || '',
  ]);

  const sheetData = [headers, ...rows];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  autoFitColumns(ws, sheetData);
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };

  XLSX.utils.book_append_sheet(wb, ws, 'Teachers');

  // Summary
  const active = teachers.filter((t) => t.status === 'active').length;
  const subjects = [...new Set(teachers.map((t) => t.subject).filter(Boolean))];

  const summaryData = [
    ['Genius Islamian\'s Academy — Teacher Backup Report'],
    ['Generated On:', new Date().toLocaleString()],
    [],
    ['Summary', 'Value'],
    ['Total Teachers', teachers.length],
    ['Active Teachers', active],
    ['Inactive Teachers', teachers.length - active],
    ['Unique Subjects', subjects.length],
    [],
    ['Subjects Covered'],
    ...subjects.map((s) => [s]),
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  downloadWorkbook(wb, `GIA_Teachers_Backup_${timestamp}.xlsx`);
}

// ─── FINANCE EXPORT ──────────────────────────────────────────────────────────

export function exportFinanceToExcel(
  transactions: any[],
  expenses: any[],
  assets: any[],
  stats: any,
) {
  const timestamp = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: All Transactions ──
  const txHeaders = ['Date', 'Type', 'Category', 'Description', 'Amount (PKR)', 'Source'];
  const txRows = transactions.map((t: any) => [
    new Date(t.date || t.createdAt || Date.now()).toLocaleDateString('en-GB'),
    t.type || '',
    t.category || '',
    t.description || '',
    t.amount || 0,
    t.source || '',
  ]);
  const txSheet = XLSX.utils.aoa_to_sheet([txHeaders, ...txRows]);
  autoFitColumns(txSheet, [txHeaders, ...txRows]);
  txSheet['!freeze'] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, txSheet, 'Transactions');

  // ── Sheet 2: Expenses ──
  if (expenses.length > 0) {
    const expHeaders = [
      'Date', 'Title', 'Category', 'Amount (PKR)', 'Vendor', 'Description', 'Recorded By'
    ];
    const expRows = expenses.map((e: any) => [
      new Date(e.expenseDate || e.createdAt || Date.now()).toLocaleDateString('en-GB'),
      e.title || '',
      e.category || '',
      e.amount || 0,
      e.vendorName || '',
      e.description || '',
      e.paidBy?.fullName || e.paidBy?.username || '',
    ]);
    const expSheet = XLSX.utils.aoa_to_sheet([expHeaders, ...expRows]);
    autoFitColumns(expSheet, [expHeaders, ...expRows]);
    expSheet['!freeze'] = { xSplit: 0, ySplit: 1 };
    XLSX.utils.book_append_sheet(wb, expSheet, 'Expenses');
  }

  // ── Sheet 3: Assets ──
  if (assets.length > 0) {
    const assetHeaders = [
      'Item Name', 'Investor', 'Purchase Date', 'Original Cost (PKR)',
      'Depreciation Rate (%/yr)', 'Current Value (PKR)'
    ];
    const assetRows = assets.map((a: any) => {
      const yearsElapsed =
        (Date.now() - new Date(a.purchaseDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      const currentVal = Math.max(
        0,
        Math.round(a.originalCost * Math.pow(1 - a.depreciationRate / 100, yearsElapsed))
      );
      return [
        a.itemName || '',
        a.investorName || '',
        new Date(a.purchaseDate).toLocaleDateString('en-GB'),
        a.originalCost || 0,
        a.depreciationRate || 0,
        currentVal,
      ];
    });
    const assetSheet = XLSX.utils.aoa_to_sheet([assetHeaders, ...assetRows]);
    autoFitColumns(assetSheet, [assetHeaders, ...assetRows]);
    assetSheet['!freeze'] = { xSplit: 0, ySplit: 1 };
    XLSX.utils.book_append_sheet(wb, assetSheet, 'Assets');
  }

  // ── Sheet 4: Summary ──
  const totalIncome = transactions
    .filter((t) => t.type !== 'EXPENSE' && t.type !== 'REFUND')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalExpenses = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalRefunds = transactions
    .filter((t) => t.type === 'REFUND')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const summaryData = [
    ['Genius Islamian\'s Academy — Finance Backup Report'],
    ['Generated On:', new Date().toLocaleString()],
    [],
    ['Financial Summary', 'Amount (PKR)'],
    ['Total Fee Income', stats?.totalIncome ?? totalIncome],
    ['Total Expenses', stats?.totalExpenses ?? totalExpenses],
    ['Total Refunds', totalRefunds],
    ['Net Balance', stats?.netProfit ?? (totalIncome - totalExpenses - totalRefunds)],
    [],
    ['Dataset Info', 'Count'],
    ['Total Transactions', transactions.length],
    ['Total Expenses Records', expenses.length],
    ['Total Assets', assets.length],
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 28 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  downloadWorkbook(wb, `GIA_Finance_Backup_${timestamp}.xlsx`);
}
