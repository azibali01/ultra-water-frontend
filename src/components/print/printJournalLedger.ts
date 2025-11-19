export type JournalLedgerEntry = {
    id: string;
    date: string | Date;
    documentType: string;
    documentNumber: string;
    particulars: string;
    debit: number;
    credit: number;
    balance: number;
    customerOrSupplier: string;
};

export type JournalLedgerData = {
    title: string;
    companyName: string;
    reportDate: string;
    fromDate?: string;
    toDate?: string;
    selectedEntity?: string;
    entries: JournalLedgerEntry[];
    totals: {
        totalDebit: number;
        totalCredit: number;
        closingBalance: number;
    };
};

function escapeHtml(s: unknown) {
    if (s == null) return "";
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(date: string | Date): string {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCurrency(amount: number): string {
    return `Rs. ${amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function renderJournalLedgerHTML(data: JournalLedgerData) {
    const css = `
     body{font-family: Inter, Arial, Helvetica, sans-serif; color:#111; background:#fff; margin:0}
     .sheet{position:relative; width:297mm; max-width:297mm; margin:8mm auto; padding:12mm 15mm; min-height:210mm; background:#fff; box-shadow:0 0 10px rgba(0,0,0,0.1)}
     .content{padding-bottom:80px}
    .header{display:flex; justify-content:space-between; align-items:flex-start; gap:16px; padding-bottom:16px; border-bottom:3px solid #0b2a4a; margin-bottom:20px}
    .brand{font-weight:800; font-size:24px; color:#0b2a4a; margin-top:8px}
    img.logo{max-width:180px; height:auto; display:block}
    .report-info{display:flex; justify-content:space-between; align-items:center; padding:12px; background:#f8fafc; border:2px solid #0b2a4a; border-radius:6px; margin-bottom:16px}
    .report-info .label{font-size:11px; color:#64748b; font-weight:600; text-transform:uppercase; letter-spacing:0.5px}
    .report-info .value{font-size:14px; color:#0f172a; font-weight:600}
    .filter-info{padding:12px; background:#fff7ed; border:2px solid #f59e0b; border-radius:6px; margin-bottom:16px}
    .filter-info .label{font-size:10px; color:#92400e; font-weight:600; text-transform:uppercase}
    .filter-info .value{font-size:12px; color:#78350f; font-weight:500}
    table.grid{width:100%; border-collapse:collapse; margin-top:16px; border:3px solid #0b2a4a; box-shadow:0 2px 8px rgba(0,0,0,0.05)}
    table.grid thead{background:linear-gradient(180deg, #0b2a4a 0%, #0d3457 100%); color:#fff}
    table.grid th{border:2px solid #0b2a4a; padding:10px 8px; font-size:11px; text-align:left; font-weight:700; text-transform:uppercase; letter-spacing:0.5px}
    table.grid tbody tr:nth-child(odd){background:#f8fafc}
    table.grid tbody tr:nth-child(even){background:#fff}
    table.grid tbody tr.total-row{background:#f8f9fa; border-top:3px solid #0b2a4a}
    table.grid td{border:2px solid #0b2a4a; padding:8px 6px; font-size:11px; color:#1e293b}
    .right{text-align:right}
    .center{text-align:center}
    .badge{padding:4px 8px; border-radius:4px; font-size:9px; font-weight:600; text-transform:uppercase; display:inline-block}
    .badge.sale{background:#22c55e; color:#fff}
    .badge.purchase{background:#3b82f6; color:#fff}
    .badge.receipt{background:#10b981; color:#fff}
    .badge.payment{background:#f59e0b; color:#fff}
    .debit{color:#1971c2; font-weight:600}
    .credit{color:#f76707; font-weight:600}
    .balance-cr{color:#2f9e44; font-weight:700}
    .balance-dr{color:#e03131; font-weight:700}
    .footer{margin-top:24px; padding-top:16px; border-top:1px solid #e2e8f0; font-size:11px; color:#666; text-align:center}
    @media print{ body{margin:0; background:#fff} .sheet{margin:0; padding:10mm 12mm; box-shadow:none} }
  `;

    const headerLeft = `
    <div style="display:flex;gap:12px;align-items:center">
      <div><img class="logo" src="/company_logo.jpg" alt="Ultra Water Technologies"/></div>
      <div>
        <div class="brand">Ultra Water Technologies</div>
      </div>
    </div>
  `;

    const headerRight = `
    <div style="text-align:right;min-width:240px">
      <div style="font-size:14px; color:#64748b; margin-bottom:4px">JOURNAL LEDGER</div>
      <div style="font-size:28px; font-weight:800; color:#0b2a4a; line-height:1">${escapeHtml(data.title)}</div>
    </div>
  `;

    const reportInfo = `
    <div class="report-info">
      <div>
        <div class="label">Report Generated On</div>
        <div class="value">${escapeHtml(data.reportDate)}</div>
      </div>
      <div style="text-align:right">
        <div class="label">Total Entries</div>
        <div class="value">${data.entries.length}</div>
      </div>
    </div>
  `;

    const filterInfo = (data.fromDate || data.toDate || data.selectedEntity) ? `
    <div class="filter-info">
      <div style="display:flex; gap:20px; flex-wrap:wrap">
        ${data.fromDate ? `<div><span class="label">From:</span> <span class="value">${escapeHtml(data.fromDate)}</span></div>` : ''}
        ${data.toDate ? `<div><span class="label">To:</span> <span class="value">${escapeHtml(data.toDate)}</span></div>` : ''}
        ${data.selectedEntity ? `<div><span class="label">Entity:</span> <span class="value">${escapeHtml(data.selectedEntity)}</span></div>` : ''}
      </div>
    </div>
  ` : '';

    const cols = ["Date", "Type", "Doc #", "Particulars", "Party", "Debit", "Credit", "Balance"];

    const entryRows = data.entries.map((entry) => {
        const badgeClass = entry.documentType.includes("Sale") ? "sale" :
            entry.documentType.includes("Purchase") ? "purchase" :
                entry.documentType.includes("Receipt") ? "receipt" : "payment";

        return `
      <tr>
        <td style="border:2px solid #0b2a4a; font-size:10px">${formatDate(entry.date)}</td>
        <td style="border:2px solid #0b2a4a"><span class="badge ${badgeClass}">${escapeHtml(entry.documentType)}</span></td>
        <td style="border:2px solid #0b2a4a; font-family:monospace; font-size:10px">${escapeHtml(entry.documentNumber)}</td>
        <td style="border:2px solid #0b2a4a; font-size:10px">${escapeHtml(entry.particulars)}</td>
        <td style="border:2px solid #0b2a4a; font-size:10px">${escapeHtml(entry.customerOrSupplier)}</td>
        <td class="right debit" style="border:2px solid #0b2a4a">${entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
        <td class="right credit" style="border:2px solid #0b2a4a">${entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
        <td class="right ${entry.balance >= 0 ? 'balance-cr' : 'balance-dr'}" style="border:2px solid #0b2a4a">
          ${formatCurrency(Math.abs(entry.balance))} ${entry.balance >= 0 ? 'CR' : 'DR'}
        </td>
      </tr>
    `;
    }).join("");

    const totalRow = `
    <tr class="total-row">
      <td colspan="5" style="border:2px solid #0b2a4a; font-weight:700; font-size:12px">TOTAL</td>
      <td class="right debit" style="border:2px solid #0b2a4a; font-weight:700; font-size:12px">${formatCurrency(data.totals.totalDebit)}</td>
      <td class="right credit" style="border:2px solid #0b2a4a; font-weight:700; font-size:12px">${formatCurrency(data.totals.totalCredit)}</td>
      <td class="right ${data.totals.closingBalance >= 0 ? 'balance-cr' : 'balance-dr'}" style="border:2px solid #0b2a4a; font-weight:700; font-size:12px">
        ${formatCurrency(Math.abs(data.totals.closingBalance))} ${data.totals.closingBalance >= 0 ? 'CR' : 'DR'}
      </td>
    </tr>
  `;

    return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(data.title)}</title>
    <style>${css}</style>
  </head>
  <body>
    <div class="sheet">
      <div class="header">
        ${headerLeft}
        ${headerRight}
      </div>

      <div class="content">
        ${reportInfo}
        ${filterInfo}

        <div style="margin-top:8px">
          <table class="grid">
            <thead>
              <tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${entryRows}
              ${totalRow}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <div>© ${new Date().getFullYear()} Ultra Water Technologies. All rights reserved.</div>
          <div style="margin-top:4px">This is a computer-generated report and does not require a signature.</div>
        </div>
      </div>
    </div>
    <script>window.onload=function(){ setTimeout(()=>{ window.print(); }, 250); }</script>
  </body>
  </html>
  `;
}

export function openJournalLedgerPrintWindow(data: JournalLedgerData) {
    try {
        const html = renderJournalLedgerHTML(data);
        const win = window.open("", "_blank", "width=1200,height=800");
        if (!win) {
            alert("Failed to open print window. Please allow popups for this site.");
            return;
        }
        win.document.open();
        win.document.write(html);
        win.document.close();
    } catch (error) {
        console.error("Error opening journal ledger print window:", error);
        alert("Failed to open print window. Please try again.");
    }
}
