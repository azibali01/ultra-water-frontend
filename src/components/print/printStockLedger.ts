export type StockLedgerItem = {
    sr: number;
    itemName: string;
    sku?: string;
    category?: string;
    openingStock?: number;
    currentStock: number;
    minimumStockLevel?: number;
    lastPurchaseQty?: number;
    lastPurchaseRate?: number;
    lastPurchaseDate?: string;
    lastSaleQty?: number;
    lastSaleRate?: number;
    lastSaleDate?: string;
    status?: string; // "In Stock" | "Low Stock" | "Negative Stock"
};

export type StockLedgerData = {
    title: string;
    companyName: string;
    reportDate: string;
    items: StockLedgerItem[];
    summary?: {
        totalItems: number;
        inStockItems: number;
        lowStockItems: number;
        negativeStockItems: number;
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

export function renderStockLedgerHTML(data: StockLedgerData) {
    const css = `
     body{font-family: Inter, Arial, Helvetica, sans-serif; color:#111; background:#fff; margin:0}
     .sheet{position:relative; width:297mm; max-width:297mm; margin:8mm auto; padding:12mm 15mm; min-height:210mm; background:#fff; box-shadow:0 0 10px rgba(0,0,0,0.1)}
     .content{padding-bottom:80px}
    .header{display:flex; justify-content:space-between; align-items:flex-start; gap:16px; padding-bottom:16px; border-bottom:2px solid #0b2a4a; margin-bottom:20px}
    .brand{font-weight:800; font-size:24px; color:#0b2a4a; margin-top:8px}
    img.logo{max-width:180px; height:auto; display:block}
    .report-info{display:flex; justify-content:space-between; align-items:center; padding:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; margin-bottom:16px}
    .report-info .label{font-size:11px; color:#64748b; font-weight:600; text-transform:uppercase; letter-spacing:0.5px}
    .report-info .value{font-size:14px; color:#0f172a; font-weight:600}
    .summary-cards{display:grid; grid-template-columns:repeat(4, 1fr); gap:12px; margin-bottom:20px}
    .summary-card{padding:16px; background:#f8fafc; border:2px solid #e2e8f0; border-radius:8px; text-align:center}
    .summary-card.in-stock{border-color:#22c55e; background:#f0fdf4}
    .summary-card.low-stock{border-color:#f59e0b; background:#fffbeb}
    .summary-card.negative-stock{border-color:#ef4444; background:#fef2f2}
    .summary-card .label{font-size:11px; color:#64748b; font-weight:600; text-transform:uppercase; margin-bottom:4px}
    .summary-card .value{font-size:24px; font-weight:800; color:#0b2a4a}
    table.grid{width:100%; border-collapse:collapse; margin-top:16px; border:3px solid #0b2a4a; box-shadow:0 2px 8px rgba(0,0,0,0.05)}
    table.grid thead{background:linear-gradient(180deg, #0b2a4a 0%, #0d3457 100%); color:#fff}
    table.grid th{border:2px solid #0b2a4a; padding:10px 8px; font-size:11px; text-align:left; font-weight:700; text-transform:uppercase; letter-spacing:0.5px}
    table.grid tbody tr:nth-child(odd){background:#f8fafc}
    table.grid tbody tr:nth-child(even){background:#fff}
    table.grid tbody tr:hover{background:#e0f2fe}
    table.grid td{border:2px solid #0b2a4a; padding:8px 6px; font-size:11px; color:#1e293b}
    .right{text-align:right}
    .center{text-align:center}
    .status-badge{padding:4px 8px; border-radius:4px; font-size:10px; font-weight:600; text-transform:uppercase}
    .status-badge.in-stock{background:#22c55e; color:#fff}
    .status-badge.low-stock{background:#f59e0b; color:#fff}
    .status-badge.negative-stock{background:#ef4444; color:#fff}
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
      <div style="font-size:14px; color:#64748b; margin-bottom:4px">STOCK LEDGER REPORT</div>
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
        <div class="label">Total Items</div>
        <div class="value">${data.summary?.totalItems ?? data.items.length}</div>
      </div>
    </div>
  `;

    const summaryCards = data.summary ? `
    <div class="summary-cards">
      <div class="summary-card">
        <div class="label">Total Products</div>
        <div class="value">${data.summary.totalItems}</div>
      </div>
      <div class="summary-card in-stock">
        <div class="label">In Stock</div>
        <div class="value" style="color:#22c55e">${data.summary.inStockItems}</div>
      </div>
      <div class="summary-card low-stock">
        <div class="label">Low Stock</div>
        <div class="value" style="color:#f59e0b">${data.summary.lowStockItems}</div>
      </div>
      <div class="summary-card negative-stock">
        <div class="label">Negative Stock</div>
        <div class="value" style="color:#ef4444">${data.summary.negativeStockItems}</div>
      </div>
    </div>
  ` : '';

    const cols = ["#", "Product Name", "Category", "Opening", "Current", "Min Level", "Last Purchase", "Last Sale", "Status"];

    const itemRows = data.items.map((item) => {
        const statusClass = item.status === "In Stock" ? "in-stock" :
            item.status === "Low Stock" ? "low-stock" : "negative-stock";

        const lastPurchase = item.lastPurchaseQty && item.lastPurchaseRate
            ? `${item.lastPurchaseQty} @ Rs.${item.lastPurchaseRate}${item.lastPurchaseDate ? `<br><small>${item.lastPurchaseDate}</small>` : ''}`
            : '—';

        const lastSale = item.lastSaleQty && item.lastSaleRate
            ? `${item.lastSaleQty} @ Rs.${item.lastSaleRate}${item.lastSaleDate ? `<br><small>${item.lastSaleDate}</small>` : ''}`
            : '—';

        return `
      <tr>
        <td class="center" style="font-weight:600; color:#475569; border:2px solid #0b2a4a">${item.sr}</td>
        <td style="font-weight:600; color:#0f172a; border:2px solid #0b2a4a">${escapeHtml(item.itemName)}</td>
        <td class="center" style="border:2px solid #0b2a4a">${escapeHtml(item.category ?? '—')}</td>
        <td class="right" style="font-weight:500; border:2px solid #0b2a4a">${item.openingStock ?? 0}</td>
        <td class="right" style="font-weight:600; color:#0b2a4a; border:2px solid #0b2a4a">${item.currentStock}</td>
        <td class="right" style="font-weight:500; color:#666; border:2px solid #0b2a4a">${item.minimumStockLevel ?? 0}</td>
        <td style="font-size:10px; border:2px solid #0b2a4a">${lastPurchase}</td>
        <td style="font-size:10px; border:2px solid #0b2a4a">${lastSale}</td>
        <td class="center" style="border:2px solid #0b2a4a"><span class="status-badge ${statusClass}">${escapeHtml(item.status ?? '—')}</span></td>
      </tr>
    `;
    }).join("");

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
        ${summaryCards}

        <div style="margin-top:8px">
          <table class="grid">
            <thead>
              <tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${itemRows}
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

export function openStockLedgerPrintWindow(data: StockLedgerData) {
    try {
        const html = renderStockLedgerHTML(data);
        const win = window.open("", "_blank", "width=1200,height=800");
        if (!win) {
            alert("Failed to open print window. Please allow popups for this site.");
            return;
        }
        win.document.open();
        win.document.write(html);
        win.document.close();
    } catch (error) {
        console.error("Error opening stock ledger print window:", error);
        alert("Failed to open print window. Please try again.");
    }
}
