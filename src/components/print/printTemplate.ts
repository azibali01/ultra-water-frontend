export type InvoiceItem = {
  sr?: number;
  section?: string;
  color?: string;
  thickness?: string | number;
  sizeFt?: string | number;
  lengths?: number;
  totalFeet?: number;
  rate?: number;
  amount?: number;
  description?: string;
  // common alternate field names used across the app
  itemName?: string;
  name?: string;
  qty?: number | string;
  quantity?: number | string;
  salesRate?: number;
  unitPrice?: number;
  price?: number;
  total?: number;
  lineTotal?: number;
};

export type InvoiceData = {
  title?: string;
  companyName?: string;
  addressLines?: string[];
  invoiceNo?: string;
  date?: string;
  gpNo?: string;
  ms?: string;
  customer?: string;
  grn?: string | null;
  customerName?: string;
  customerAddressLines?: string[];
  customerPhone?: string;
  items: InvoiceItem[];
  totals?: {
    subtotal?: number;
    total?: number;
    totalGrossAmount?: number;
    totalDiscountAmount?: number;
    totalNetAmount?: number;
  };
  footerNotes?: string[];
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

export function renderInvoiceHTML(data: InvoiceData) {
  const css = `
     body{font-family: Inter, Arial, Helvetica, sans-serif; color:#111; background:#fff; margin:0}
     /* A4-like sheet: make sheet full page height and use column flex layout
       so header stays at top. Footer is positioned absolute at bottom of sheet
       and made full-width. Add bottom padding to content so it doesn't overlap footer. */
     .sheet{position:relative; width:210mm; max-width:210mm; margin:8mm auto; padding:12mm 15mm; height:297mm; display:flex; flex-direction:column; background:#fff; box-shadow:0 0 10px rgba(0,0,0,0.1)}
     .content{flex:1 1 auto; padding-bottom:120px}
    .header{display:flex; justify-content:space-between; align-items:flex-start; gap:16px; padding-bottom:16px; border-bottom:2px solid #0b2a4a; margin-bottom:20px}
    .brand{font-weight:800; font-size:24px; color:#0b2a4a; margin-top:8px}
    img.logo{max-width:180px; height:auto; display:block}
    .company-meta{font-size:12px; color:#333; line-height:1.6}
    .customer-box{border:2px solid #0b2a4a; padding:12px; border-radius:8px; background:#f8fafc; margin-bottom:16px}
    .invoice-info{display:grid; grid-template-columns:1fr 1fr; gap:8px; padding:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; margin-bottom:16px}
    .invoice-info .label{font-size:11px; color:#64748b; font-weight:600; text-transform:uppercase; letter-spacing:0.5px}
    .invoice-info .value{font-size:14px; color:#0f172a; font-weight:600}
    table.grid{width:100%; border-collapse:collapse; margin-top:16px; border:2px solid #0b2a4a; box-shadow:0 2px 8px rgba(0,0,0,0.05)}
    table.grid thead{background:linear-gradient(180deg, #0b2a4a 0%, #0d3457 100%); color:#fff}
    table.grid th{border:1px solid rgba(255,255,255,0.2); padding:12px 10px; font-size:13px; text-align:left; font-weight:700; text-transform:uppercase; letter-spacing:0.5px}
    table.grid tbody tr:nth-child(odd){background:#f8fafc}
    table.grid tbody tr:nth-child(even){background:#fff}
    table.grid tbody tr:hover{background:#e0f2fe}
    table.grid td{border:1px solid #cbd5e1; padding:10px; font-size:13px; color:#1e293b}
    .small{font-size:12px; color:#64748b; line-height:1.5}
    .right{text-align:right}
    .totals{margin-top:20px; width:100%; display:flex; justify-content:flex-end}
    .totals .box{width:350px; border:2px solid #0b2a4a; padding:16px; background:#f8fafc; border-radius:8px}
    .totals .row{display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #e2e8f0}
    .totals .row:last-child{border-bottom:none; padding-top:12px; margin-top:8px; border-top:2px solid #0b2a4a}
    .totals .row.total{font-size:18px; font-weight:800; color:#0b2a4a}
    .signature{margin-top:32px; display:flex; justify-content:space-between; padding:16px 0; border-top:1px solid #e2e8f0}
    .signature .box{display:flex; flex-direction:column; gap:4px}
    .signature .label{font-size:11px; color:#64748b; font-weight:600; text-transform:uppercase}
    .signature .line{border-top:2px solid #0b2a4a; width:200px; margin-top:40px}
    .footer{margin-top:14px; font-size:11px; color:#666}
    @media print{ body{margin:0; background:#fff} .sheet{margin:0; padding:10mm 12mm; box-shadow:none} }
  `;
  // Show company logo (from public folder) and company name
  // Always show our company name; ignore incoming companyName to prevent old name from displaying
  const headerLeft = `
    <div style="display:flex;gap:12px;align-items:center">
      <div><img class="logo" src="/company_logo.jpg" alt="Ultra Water Technologies"/></div>
      <div>
        <div class="brand">Ultra Water Technologies</div>
      </div>
    </div>
  `;

  // Build a compact customer / meta block
  const custName = escapeHtml(data.customerName ?? data.customer ?? "");
  const custAddr = (data.customerAddressLines || []).map((l) => `<div class="small">${escapeHtml(l)}</div>`).join("");
  const headerRight = `
    <div style="text-align:right;min-width:240px">
      <div style="font-size:14px; color:#64748b; margin-bottom:4px">SALES INVOICE</div>
      <div style="font-size:32px; font-weight:800; color:#0b2a4a; line-height:1">#${escapeHtml(data.invoiceNo ?? "")}</div>
    </div>
  `;

  const customerInfo = `
    <div class="customer-box">
      <div style="font-size:11px; color:#64748b; font-weight:600; text-transform:uppercase; margin-bottom:6px">Bill To</div>
      <div style="font-weight:700; font-size:15px; color:#0b2a4a; margin-bottom:4px">${custName}</div>
      ${custAddr}
      ${data.customerPhone ? `<div class="small" style="margin-top:4px"><strong>Phone:</strong> ${escapeHtml(data.customerPhone)}</div>` : ""}
    </div>
  `;

  const invoiceMetaInfo = `
    <div class="invoice-info">
      <div>
        <div class="label">Invoice Date</div>
        <div class="value">${escapeHtml(data.date ?? "")}</div>
      </div>
      <div>
        <div class="label">Invoice Number</div>
        <div class="value">${escapeHtml(data.invoiceNo ?? "")}</div>
      </div>
    </div>
  `;

  const cols = ["#", "Item", "Qty", "Rate", "Amount"];

  // Build rows for actual items
  const itemRows = (data.items && data.items.length
    ? data.items
      .map((it, idx) => {
        const itemDesc = escapeHtml(
          it.description ?? it.section ?? it.itemName ?? it.name ?? it.color ?? ""
        );
        const qtyVal = it.qty ?? it.quantity ?? it.lengths ?? it.totalFeet ?? "";
        const rateVal = it.rate ?? it.unitPrice ?? it.price ?? it.salesRate ?? null;
        const amountVal = it.amount ?? it.total ?? it.lineTotal ?? null;
        return `
      <tr>
        <td style="font-weight:600; color:#475569">${escapeHtml(it.sr ?? idx + 1)}</td>
        <td style="font-weight:500; color:#0f172a">${itemDesc}</td>
        <td class="right" style="font-weight:500">${escapeHtml(qtyVal)}</td>
        <td class="right" style="font-weight:500">Rs. ${rateVal != null ? Number(rateVal).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""}</td>
        <td class="right" style="font-weight:600; color:#0b2a4a">Rs. ${amountVal != null ? Number(amountVal).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""}</td>
      </tr>
    `;
      })
    : []).join("");

  // Ensure minimum 8 rows are displayed
  const actualItemCount = data.items?.length ?? 0;
  const minRows = 8;
  const emptyRowsNeeded = Math.max(0, minRows - actualItemCount);

  const emptyRows = Array.from({ length: emptyRowsNeeded }, () => `
    <tr>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
    </tr>
  `).join("");

  const rowsHtml = itemRows + emptyRows;

  const totalsHtml = `
    <div class="totals">
      <div class="box">
        <div class="row"><div class="small" style="font-weight:600">Total Gross Amount</div><div style="font-weight:600">Rs. ${data.totals?.totalGrossAmount != null ? Number(data.totals.totalGrossAmount).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}</div></div>
        <div class="row"><div class="small" style="font-weight:600">Total Discount Amount</div><div style="font-weight:600">Rs. ${data.totals?.totalDiscountAmount != null ? Number(data.totals.totalDiscountAmount).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}</div></div>
        <div class="row total"><div>Total Net Amount</div><div>Rs. ${data.totals?.totalNetAmount != null ? Number(data.totals.totalNetAmount).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : Number(data.totals?.total ?? data.totals?.subtotal ?? 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></div>
      </div>
    </div>
  `;



  return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(data.title ?? "Invoice")}</title>
    <style>${css}</style>
  </head>
  <body>
    <div class="sheet">
      <div class="header">
        ${headerLeft}
        ${headerRight}
      </div>

      <div class="content">
        ${customerInfo}
        ${invoiceMetaInfo}

        <div style="margin-top:8px">
          <table class="grid">
            <thead>
              <tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        ${totalsHtml}

        <div class="signature">
          <div class="box">
            <div class="label">Authorized By</div>
            <div class="line"></div>
          </div>
        </div>
      </div>

      <!-- footer container positioned at bottom of the sheet -->
      <div style="position:absolute; left:0; right:0; bottom:8mm;">
        <img src="/footer.jpg" alt="footer" style="width:100%; height:auto; max-height:90px; object-fit:cover; display:block;"/>
      </div>
    </div>
    <script>window.onload=function(){ setTimeout(()=>{ window.print(); }, 250); }</script>
  </body>
  </html>
  `;
}
