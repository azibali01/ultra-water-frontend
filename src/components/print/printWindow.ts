import { renderInvoiceHTML, type InvoiceData } from "./printTemplate";
import jsPDF from "jspdf";

function normalizeInvoiceData(data: InvoiceData): InvoiceData {
  const rawItems = (data.items || []) as any[];
  // Filter out empty rows (rows where itemName/section/description is empty or whitespace)
  const nonEmptyItems = rawItems.filter((it: any) => {
    const name = it.itemName ?? it.section ?? it.description ?? it.name ?? "";
    return String(name).trim().length > 0;
  });

  let mapped = nonEmptyItems.map((it: any) => ({
    ...it,
    // map common fields to template-friendly names
    description: it.description ?? it.section ?? it.itemName ?? it.name ?? it.color ?? "",
    itemName: it.itemName ?? it.description ?? it.section ?? it.name ?? "",
    rate: it.rate ?? it.unitPrice ?? it.price ?? it.salesRate ?? null,
    qty: it.qty ?? it.quantity ?? it.lengths ?? it.totalFeet ?? 1,
    amount: it.amount ?? it.total ?? it.lineTotal ?? it.amount ?? 0,
  }));

  // Fallback: some callers pass `products` instead of `items`.
  if ((!mapped || mapped.length === 0) && (data as any).products && Array.isArray((data as any).products)) {
    const raw = (data as any).products as any[];
    // Also filter empty products
    const nonEmpty = raw.filter((it: any) => {
      const name = it.itemName ?? it.section ?? (it.metadata && it.metadata.sku) ?? "";
      return String(name).trim().length > 0;
    });
    mapped = nonEmpty.map((it: any, idx: number) => ({
      sr: it.sr ?? idx + 1,
      section: it.section ?? it.itemName ?? (it.metadata && it.metadata.sku) ?? (it.metadata && it.metadata.name) ?? "",
      itemName: it.itemName ?? it.section ?? "",
      description: it.itemName ?? it.section ?? "",
      qty: it.quantity ?? it.qty ?? 1,
      rate: it.salesRate ?? it.rate ?? it.unitPrice ?? 0,
      amount: it.amount ?? (Number(it.quantity ?? it.qty ?? 1) * Number(it.salesRate ?? it.rate ?? 0)),
    }));
  }

  return {
    ...data,
    items: mapped,
  };
}

export function openPrintWindow(data: InvoiceData) {
  try {
    // Normalize item fields so print template receives consistent keys
    const rawItems = (data.items || []) as any[];
    let mapped = rawItems.map((it: any) => ({
      ...it,
      // map common fields to template-friendly names
      rate: it.rate ?? it.unitPrice ?? it.price ?? it.salesRate ?? null,
      qty: it.qty ?? it.quantity ?? it.lengths ?? it.totalFeet ?? "",
      amount: it.amount ?? it.total ?? it.lineTotal ?? it.amount ?? 0,
    }));

    // Fallback: some callers pass `products` instead of `items`.
    if ((!mapped || mapped.length === 0) && (data as any).products && Array.isArray((data as any).products)) {
      const raw = (data as any).products as any[];
      mapped = raw.map((it: any, idx: number) => ({
        sr: it.sr ?? idx + 1,
        section: it.section ?? it.itemName ?? it.metadata?.sku ?? it.metadata?.name ?? "",
        itemName: it.itemName ?? it.section ?? "",
        qty: it.quantity ?? it.qty ?? 1,
        rate: it.salesRate ?? it.rate ?? it.unitPrice ?? 0,
        amount: it.amount ?? (Number(it.quantity ?? 1) * Number(it.salesRate ?? it.rate ?? 0)),
      }));
    }

    const normalized = normalizeInvoiceData(data);
    // helpful debug log when printing
    try {
      // eslint-disable-next-line no-console

    } catch { }
    const html = renderInvoiceHTML(normalized);
    const w = window.open("", "_blank");
    if (!w) {
      // fallback to in-page print
      const newWin = window.open();
      if (!newWin) return undefined;
      newWin.document.write(html);
      newWin.document.close();
      return newWin;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    return w;
  } catch (err) {
    console.error("Print failed", err);
  }
}

export default openPrintWindow;

export async function downloadInvoicePdf(data: InvoiceData, filename = "invoice.pdf") {
  try {
    const normalized = normalizeInvoiceData(data);
    const html = renderInvoiceHTML(normalized);
    // create an offscreen container to render the HTML
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.width = "210mm"; // A4 width to help rendering
    container.innerHTML = html;
    document.body.appendChild(container);

    const doc = new jsPDF({ unit: "mm", format: "a4" });

    await new Promise<void>((resolve, reject) => {
      // jsPDF.html will render the DOM node to the PDF
      try {
        doc.html(container, {
          callback: () => {
            try {
              doc.save(filename);
            } catch (err) {
              console.error("Failed to save PDF", err);
            }
            // cleanup
            setTimeout(() => {
              if (container.parentNode) container.parentNode.removeChild(container);
              resolve();
            }, 50);
          },
          x: 0,
          y: 0,
          html2canvas: { scale: 1 },
        });
      } catch (err) {
        if (container.parentNode) container.parentNode.removeChild(container);
        reject(err);
      }
    });
  } catch (err) {
    console.error("PDF download failed", err);
  }
}
