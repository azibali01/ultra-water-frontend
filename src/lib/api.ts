import axios from "axios";


// Base axios instance - configure via Vite env VITE_API_BASE_URL or default to /api
export const api = axios.create({
  // baseURL: "https://aluminium-backend.onrender.com/",
  baseURL: "http://localhost:3000",

});





// Delete receipt voucher by id
export async function deleteReceiptVoucher(id: string | number) {
  const { data } = await api.delete(`/reciept-voucher/${id}`);
  return data;
}

// Update receipt voucher by id
export async function updateReceiptVoucher(id: string | number, patch: Partial<ReceiptVoucherPayload>) {
  const { data } = await api.put(`/reciept-voucher/${id}`, patch);
  return data;
}

// Print logic is handled on the frontend (window.print or custom print window)
// Fetch all receipt vouchers
export async function getAllReceiptVouchers() {
  const { data } = await api.get("/reciept-voucher");
  return data;
}
// Receipt Voucher API
export interface ReceiptVoucherPayload {
  voucherNumber: number | string;
  voucherDate: Date | string;
  receivedFrom: string;
  amount: number;
  referenceNumber: string;
  paymentMode: string;
  remarks?: string;
}

export async function createReceiptVoucher(payload: ReceiptVoucherPayload) {
  const { data } = await api.post("/reciept-voucher", payload);
  return data;
}

// --- Payment Voucher endpoints ---
export interface PaymentVoucherPayload {
  voucherNumber: number | string;
  voucherDate: Date | string;
  paidTo: string;
  amount: number;
  referenceNumber: string;
  paymentMode: string;
  remarks?: string;
}

export async function getAllPaymentVouchers() {
  const { data } = await api.get("/payment-voucher");
  return data;
}

export async function createPaymentVoucher(payload: PaymentVoucherPayload) {
  const { data } = await api.post("/payment-voucher", payload);
  return data;
}

// Get payment voucher by voucherNumber
export async function getPaymentVoucherByNumber(voucherNumber: string | number) {
  const { data } = await api.get(`/payment-voucher/${encodeURIComponent(voucherNumber)}`);
  return data;
}

// Update payment voucher by voucherNumber
export async function updatePaymentVoucher(voucherNumber: string | number, patch: Partial<PaymentVoucherPayload>) {
  const { data } = await api.put(`/payment-voucher/${encodeURIComponent(voucherNumber)}`, patch);
  return data;
}

// Delete payment voucher by voucherNumber
export async function deletePaymentVoucher(voucherNumber: string | number) {
  const { data } = await api.delete(`/payment-voucher/${encodeURIComponent(voucherNumber)}`);
  return data;
}
// --- Purchase Return endpoints (by returnNumber) ---
// Update purchase return by returnNumber
export async function updatePurchaseReturnByNumber(
  returnNumber: string,
  patch: Partial<PurchaseReturnRecordPayload>
) {
  try {
    const { data } = await api.put(
      `/purchase-returns/${encodeURIComponent(returnNumber)}`,
      patch
    );
    return data;
  } catch (err: unknown) {
    const error = err as { response?: { status?: number } };
    const status = error.response?.status;
    if (status && status !== 404) throw error;
  }
  // Fallback: fetch all and update by id if needed
  const returns = await getPurchaseReturns();
  const ret = (returns || []).find(
    (r: PurchaseReturnRecordPayload) => String(r.id) === String(returnNumber)
  );
  if (!ret) throw new Error(`Purchase return not found: ${returnNumber}`);
  const id = ret._id ?? ret.id;
  if (!id) throw new Error(`Purchase return has no valid ID: ${returnNumber}`);
  return updatePurchaseReturn(id, patch);
}

// Delete purchase return by returnNumber
export async function deletePurchaseReturnByNumber(returnNumber: string) {
  try {
    const { data } = await api.delete(
      `/purchase-returns/${encodeURIComponent(returnNumber)}`
    );
    return data;
  } catch (err: unknown) {
    const error = err as { response?: { status?: number } };
    const status = error.response?.status;
    if (status && status !== 404) throw error;
  }
  // Fallback: fetch all and delete by id if needed
  const returns = await getPurchaseReturns();
  const ret = (returns || []).find(
    (r: PurchaseReturnRecordPayload) => String(r.id ?? r._id) === String(returnNumber)
  );
  if (!ret) throw new Error(`Purchase return not found: ${returnNumber}`);
  const id = ret._id ?? ret.id;
  if (!id) throw new Error(`Purchase return has no valid ID: ${returnNumber}`);
  return deletePurchaseReturn(id);
}

// Update and delete by id (for fallback)
export async function updatePurchaseReturn(
  id: string | number,
  patch: Partial<PurchaseReturnRecordPayload>
) {
  const { data } = await api.put(`/purchase-returns/${id}`, patch);
  return data;
}

export async function deletePurchaseReturn(id: string | number) {
  const { data } = await api.delete(`/purchase-returns/${id}`);
  return data;
}
// --- Purchase Invoice Payload ---
export interface PurchaseInvoicePayload {
  purchaseInvoiceNumber: string;
  invoiceDate: string | Date;
  expectedDelivery?: string | Date;
  supplierId?: string;
  products: PurchaseLineItem[];
  remarks?: string;
  subTotal?: number;
  total?: number;
}
// --- Purchase Invoice endpoints (by purchaseInvoiceNumber) ---
// Get all purchase invoices
export async function getPurchaseInvoices() {
  const { data } = await api.get("/purchase-invoice");
  return data;
}

// Get purchase invoice by purchaseInvoiceNumber
export async function getPurchaseInvoiceByNumber(purchaseInvoiceNumber: string) {
  try {
    const { data } = await api.get(
      `/purchase-invoice/${encodeURIComponent(purchaseInvoiceNumber)}`
    );
    return data;
  } catch (err: unknown) {
    const error = err as { response?: { status?: number } };
    const status = error.response?.status;
    if (status && status === 404) {
      // fall through
    } else {
      throw error;
    }
  }
  // Fallback: fetch all and find
  const { data } = await api.get("/purchase-invoice");
  return (data || []).find(
    (p: { purchaseInvoiceNumber?: string | number }) => String(p.purchaseInvoiceNumber) === String(purchaseInvoiceNumber)
  );
}

// Create purchase invoice
export async function createPurchaseInvoice(payload: PurchaseInvoicePayload) {
  const { data } = await api.post("/purchase-invoice", payload);
  return data;
}

// Update purchase invoice by purchaseInvoiceNumber
export async function updatePurchaseInvoiceByNumber(
  purchaseInvoiceNumber: string,
  patch: Partial<PurchaseRecordPayload>
) {
  try {
    const { data } = await api.put(
      `/purchase-invoice/${encodeURIComponent(purchaseInvoiceNumber)}`,
      patch
    );
    return data;
  } catch (err: unknown) {
    const error = err as { response?: { status?: number } };
    const status = error.response?.status;
    if (status && status !== 404) throw error;
  }
  // Fallback: fetch all and update by id if needed
  const p = await getPurchaseInvoiceByNumber(purchaseInvoiceNumber);
  if (!p) throw new Error(`Purchase invoice not found: ${purchaseInvoiceNumber}`);
  const invoice = p as { _id?: string; id?: string };
  const id = invoice._id ?? invoice.id;
  if (!id) throw new Error(`Purchase invoice has no valid ID: ${purchaseInvoiceNumber}`);
  return updatePurchaseInvoice(id, patch);
}

// Delete purchase invoice by purchaseInvoiceNumber
export async function deletePurchaseInvoiceByNumber(purchaseInvoiceNumber: string) {
  try {
    const { data } = await api.delete(
      `/purchase-invoice/${encodeURIComponent(purchaseInvoiceNumber)}`
    );
    return data;
  } catch (err: unknown) {
    const error = err as { response?: { status?: number } };
    const status = error.response?.status;
    if (status && status !== 404) throw error;
  }
  // Fallback: fetch all and delete by id if needed
  const p = await getPurchaseInvoiceByNumber(purchaseInvoiceNumber);
  if (!p) throw new Error(`Purchase invoice not found: ${purchaseInvoiceNumber}`);
  const invoice = p as { _id?: string; id?: string };
  const id = invoice._id ?? invoice.id;
  if (!id) throw new Error(`Purchase invoice has no valid ID: ${purchaseInvoiceNumber}`);
  return deletePurchaseInvoice(id);
}

// Update and delete by id (for fallback)
export async function updatePurchaseInvoice(
  id: string | number,
  patch: Partial<PurchaseRecordPayload>
) {
  const { data } = await api.put(`/purchase-invoice/${id}`, patch);
  return data;
}

export async function deletePurchaseInvoice(id: string | number) {
  const { data } = await api.delete(`/purchase-invoice/${id}`);
  return data;
}



// Dev-only request logger to help diagnose duplicate-request storms.
// This logs method+url and a stack trace so we can see which component/effect
// initiated the request. Disabled in production to avoid leaking internals.

// test


// Get all purchase orders
export async function getPurchases() {
  const { data } = await api.get<PurchaseRecordPayload[]>("/purchaseorder");
  return data;
}


// --- Purchase Order by poNumber endpoints ---
// Get purchase order by poNumber
export async function getPurchaseByNumber(poNumber: string) {
  try {
    const { data } = await api.get(
      `/purchaseorder/${encodeURIComponent(poNumber)}`
    );
    return data;
  } catch (err: unknown) {
    const error = err as { response?: { status?: number } };
    const status = error.response?.status;
    if (status && status === 404) {
      // fall through
    } else {
      throw error;
    }
  }
  // Fallback: fetch all and find
  const { data } = await api.get<PurchaseRecordPayload[]>("/purchaseorder");
  return (data || []).find(
    (p: PurchaseRecordPayload) => String((p as PurchaseRecordPayload & { poNumber?: string | number }).poNumber) === String(poNumber)
  );
}

// Update purchase order by poNumber
export async function updatePurchaseByNumber(
  poNumber: string,
  patch: Partial<PurchaseRecordPayload>
) {
  try {
    const { data } = await api.put(
      `/purchaseorder/${encodeURIComponent(poNumber)}`,
      patch
    );
    return data;
  } catch (err: unknown) {
    const error = err as { response?: { status?: number } };
    const status = error.response?.status;
    if (status && status !== 404) throw error;
  }
  // Fallback: fetch all and update by id if needed
  const p = await getPurchaseByNumber(poNumber);
  if (!p) throw new Error(`Purchase order not found: ${poNumber}`);
  const purchase = p as { _id?: string; id?: string };
  const id = purchase._id ?? purchase.id;
  if (!id) throw new Error(`Purchase order has no valid ID: ${poNumber}`);
  return updatePurchase(id, patch);
}

// Delete purchase order by poNumber
export async function deletePurchaseByNumber(poNumber: string) {
  try {
    const { data } = await api.delete(
      `/purchaseorder/${encodeURIComponent(poNumber)}`
    );
    return data;
  } catch (err: unknown) {
    const error = err as { response?: { status?: number } };
    const status = error.response?.status;
    if (status && status !== 404) throw error;
  }
  // Fallback: fetch all and delete by id if needed
  const p = await getPurchaseByNumber(poNumber);
  if (!p) throw new Error(`Purchase order not found: ${poNumber}`);
  const purchase = p as { _id?: string; id?: string };
  const id = purchase._id ?? purchase.id;
  if (!id) throw new Error(`Purchase order has no valid ID: ${poNumber}`);
  return deletePurchase(id);
}

export interface InventoryItemPayload {
  _id?: string | number;
  itemName?: string;
  description?: string;
  category?: string;
  costPrice?: number;
  salesRate?: number;
  discountAmount?: number;
  totalGrossAmount?: number;
  totalNetAmount?: number;
  brand?: string;

  discount: number;
  length?: number;
  amount?: number;
  openingStock?: number;
  quantity?: number;
  minimumStockLevel?: number;
  minStock?: number;

  metadata?: Record<string, unknown>;
}
type paymentMethod = "Card" | "Cash";
export interface SaleRecordPayload {
  invoiceNumber?: string;
  invoiceDate?: string;
  products?: InventoryItemPayload[];
  items?: InventoryItemPayload[];
  subTotal?: number;
  totalGrossAmount?: number;
  discount?: number;
  totalDiscount?: number;
  totalNetAmount?: number;
  quotationDate?: string;
  customer?: CustomerPayload | null;
  paymentMethod?: paymentMethod;
  length?: number;
  remarks?: string;
  metadata?: Record<string, unknown>;
}

export interface QuotationRecordPayload {
  quotationNumber?: string;
  products?: InventoryItemPayload[];
  subTotal?: number;
  totalGrossAmount?: number;
  totalNetAmount?: number;
  discount?: number;
  amount?: number
  totalDiscount?: number;
  quotationDate?: string;
  customer?: CustomerPayload[];
  remarks?: string;
  length?: number;
  metadata?: Record<string, unknown>;
}
export type PurchaseLineItem = {
  id: string;
  productName: string;
  quantity: number;
  rate: number;
  length?: string | number;
  amount?: number;
};

export type PurchaseLineItems = PurchaseLineItem[];


export interface PurchaseRecordPayload {
  poNumber: string;
  poDate: Date;
  expectedDelivery?: Date;
  supplier?: Supplier; // Now stores the full supplier object
  products: PurchaseLineItem[];
  remarks?: string;
  subTotal?: number;
  total?: number;
}
export interface GRNRecordPayload {
  id?: string | number;
  items: {
    inventoryId?: string | number;
    sku?: string | number;
    quantity: number;
    unitPrice?: number;
    metadata?: Record<string, unknown>;
  }[];
  subtotal?: number;
  totalAmount?: number;
  grnDate?: string;
  grnNumber?: string;
  receivedAt?: string;
  supplierId?: string | number;
  metadata?: Record<string, unknown>;
}

export interface PurchaseReturnRecordPayload {
  _id?: string | number;
  id?: string | number;
  items: {
    inventoryId?: string | number;
    sku?: string | number;
    quantity: number;
    unitPrice?: number;
    metadata?: Record<string, unknown>;
  }[];
  total?: number;
  date?: string;
  supplierId?: string | number;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface ExpensePayload {
  expenseNumber?: string;
  amount: number;
  date?: string | Date;
  categoryType?: "Rent" | "Utilities" | "Transportation" | "Salary" | "Maintenance" | "Other";
  description?: string;
  reference?: string;
  paymentMethod?: paymentMethod;
  remarks?: string;
  metadata?: Record<string, unknown>;
}

export interface CustomerPayload {
  id?: string | number;
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  openingAmount?: number;
  creditLimit?: number;
  paymentType?: "Credit" | "Debit";
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

export interface ColorPayload {
  id?: string | number;
  name: string;
  hex?: string;
  metadata?: Record<string, unknown>;
}

export interface CategoryPayload {
  id?: string | number;
  name: string;
  metadata?: Record<string, unknown>;
}

// Read endpoints
export async function getInventory() {
  const candidates = ["/products"];
  for (const path of candidates) {
    try {
      const { data } = await api.get<InventoryItemPayload[]>(path);
      return data;
    } catch (err: unknown) {
      // if server returned 404, try the next candidate; otherwise rethrow
      const error = err as { response?: { status?: number } };
      const status = error && error.response && error.response.status;
      if (status && status === 404) continue;
      throw error;
    }
  }
  // nothing found — return empty list to keep app usable
  return [] as InventoryItemPayload[];
}

export async function getSales() {
  const { data } = await api.get<SaleRecordPayload[]>("/sale-invoice");
  return data;
}

// Quotations read endpoint
export async function getQuotations() {
  const { data } = await api.get<QuotationRecordPayload[]>("/quotations");
  return data;
}


export async function getGRNs() {
  const { data } = await api.get<GRNRecordPayload[]>("/grns");
  return data;
}

export async function getPurchaseReturns() {
  const { data } = await api.get<PurchaseReturnRecordPayload[]>(
    "/purchase-returns"
  );
  return data;
}

export async function getExpenses() {
  const { data } = await api.get<ExpensePayload[]>("/expenses");
  return data;
}

export async function getCustomers() {
  const { data } = await api.get<CustomerPayload[]>("/customers");
  return data;
}

// colors endpoint removed - colors are provided statically in the client

export async function getCategories() {
  const { data } = await api.get<CategoryPayload[]>("/categories");
  return data;
}

// Create endpoints
export async function createInventory(item: InventoryItemPayload) {
  const { data } = await api.post<InventoryItemPayload>("/products", item);
  return data as InventoryItemPayload;
}

export async function createSale(payload: SaleRecordPayload) {
  console.log("createSale called with payload:", payload);
  try {
    const { data } = await api.post("/sale-invoice", payload);
    console.log("createSale response data:", data);
    return data;
  } catch (error) {
    console.error("createSale error:", error);
    throw error;
  }
}

// Create a quotation as a separate resource. Backends that support
// quotations should expose a `/quotations` POST endpoint. We keep the
// same payload shape as `createSale` for compatibility.
export async function createQuotation(payload: QuotationRecordPayload) {
  console.log("createQuotation called with payload:", payload);
  try {
    const { data } = await api.post("/quotations", payload);
    console.log("createQuotation response data:", data);
    return data;
  } catch (error) {
    console.error("createQuotation error:", error);
    throw error;
  }
}

// Sale Return endpoints - uses dedicated /sale-return with invoiceNumber-based operations
export async function getSaleReturns() {
  const { data } = await api.get("/sale-return");
  return data;
}

export async function getSaleReturnByNumber(invoiceNumber: string) {
  try {
    const { data } = await api.get(
      `/sale-return/${encodeURIComponent(invoiceNumber)}`
    );
    return data;
  } catch (err: unknown) {
    const error = err as { response?: { status?: number } };
    const status = error && error.response && error.response.status;
    if (status && status === 404) {
      // Fallback: fetch all and find
      const { data } = await api.get<SaleRecordPayload[]>("/sale-return");
      return (data || []).find(
        (s: SaleRecordPayload) =>
          String(s.invoiceNumber) === String(invoiceNumber)
      );
    }
    throw error;
  }
}

export async function createSaleReturn(payload: SaleRecordPayload) {
  const { data } = await api.post("/sale-return", payload);
  return data;
}

export async function updateSaleReturn(
  invoiceNumber: string,
  patch: Partial<SaleRecordPayload>
) {
  const { data } = await api.put(
    `/sale-return/${encodeURIComponent(invoiceNumber)}`,
    patch
  );
  return data;
}

export async function deleteSaleReturn(invoiceNumber: string) {
  const { data } = await api.delete(
    `/sale-return/${encodeURIComponent(invoiceNumber)}`
  );
  return data;
}
// create purchase endpoint
export async function createPurchase(payload: PurchaseRecordPayload) {
  const { data } = await api.post("/purchaseorder", payload);
  return data;
}

export async function createGRN(payload: GRNRecordPayload) {
  const { data } = await api.post("/grns", payload);
  return data;
}

export async function createPurchaseReturn(
  payload: PurchaseReturnRecordPayload
) {
  const { data } = await api.post("/purchase-returns", payload);
  return data;
}

export async function createExpense(payload: ExpensePayload) {
  const { data } = await api.post("/expenses", payload);
  return data;
}

export async function createCategory(payload: CategoryPayload) {
  const { data } = await api.post("/categories", payload);
  return data;
}

// Update endpoints
export async function updateInventory(
  id: string,
  patch: Partial<InventoryItemPayload>
) {
  const { data } = await api.put<InventoryItemPayload>(
    `/products/${id}`,
    patch
  );
  return data as InventoryItemPayload;
}

export async function updateExpense(
  expenseNumber: string,
  patch: Partial<ExpensePayload>
) {
  const { data } = await api.put(`/expenses/${expenseNumber}`, patch);
  return data;
}

export async function updateCategory(
  id: string | number,
  patch: Partial<CategoryPayload>
) {
  const { data } = await api.put(`/categories/${id}`, patch);
  return data;
}

// Customer endpoints
export async function createCustomer(payload: CustomerPayload) {
  const { data } = await api.post("/customers", payload);
  return data;
}

export async function updateCustomer(
  id: string | number,
  patch: Partial<CustomerPayload>
) {
  const { data } = await api.put(`/customers/${id}`, patch);
  return data;
}

export async function deleteCustomer(id: string | number) {
  if (!id || id === "undefined") {
    throw new Error(`Invalid customer ID: ${id}`);
  }
  const { data } = await api.delete(`/customers/${id}`);
  return data;
}

// Supplier endpoints
import type { Supplier } from "../components/purchase/SupplierForm";

export async function getSuppliers() {
  const { data } = await api.get<Supplier[]>("/suppliers");
  return data;
}

export async function createSupplier(payload: Partial<Supplier>) {
  const { data } = await api.post("/suppliers", payload);
  return data;
}

export async function updateSupplier(
  id: string | number,
  patch: Partial<Supplier>
) {
  const { data } = await api.put(`/suppliers/${id}`, patch);
  return data;
}

export async function deleteSupplier(id: string | number) {
  if (!id || id === "undefined") {
    throw new Error(`Invalid supplier ID: ${id}`);
  }
  const { data } = await api.delete(`/suppliers/${id}`);
  return data;
}

// Sales endpoints - primary functions work with invoiceNumber
export async function updateSale(
  invoiceNumber: string,
  patch: Partial<SaleRecordPayload>
) {
  // Try dedicated number-based endpoint first
  try {
    const { data } = await api.put(
      `/sale-invoice/number/${encodeURIComponent(invoiceNumber)}`,
      patch
    );
    return data;
  } catch (err: unknown) {
    const error = err as { response?: { status?: number } };
    const status = error.response?.status;
    if (status && status !== 404) throw error;
  }

  // Try query param approach
  try {
    const { data } = await api.put(
      `/sale-invoice?invoiceNumber=${encodeURIComponent(invoiceNumber)}`,
      patch
    );
    return data;
  } catch (err: unknown) {
    const error = err as { response?: { status?: number } };
    const status = error.response?.status;
    if (status && status !== 404) throw error;
  }

  // Fallback: find by invoiceNumber then update by ID
  const sale = await getSaleByNumber(invoiceNumber);
  if (!sale) throw new Error(`Sale not found: ${invoiceNumber}`);
  const saleRecord = sale as { _id?: string; id?: string };
  const id = saleRecord._id ?? saleRecord.id;
  if (!id) throw new Error(`Sale has no valid ID: ${invoiceNumber}`);
  const { data } = await api.put(`/sale-invoice/${id}`, patch);
  return data;
}

export async function deleteSale(invoiceNumber: string) {
  // Try dedicated number-based endpoint first

  try {
    const { data } = await api.delete(
      `/sale-invoice/${encodeURIComponent(invoiceNumber)}`
    );
    return data;
  } catch (err: unknown) {
    const error = err as { response?: { status?: number } };
    const status = error.response?.status;
    if (status && status !== 404) throw error;
  }

  // Fallback: find by invoiceNumber then delete by ID
  const sale = await getSaleByNumber(invoiceNumber);
  if (!sale) throw new Error(`Sale not found: ${invoiceNumber}`);
  const saleRecord = sale as { _id?: string; id?: string };
  const id = saleRecord._id ?? saleRecord.id;
  if (!id) throw new Error(`Sale has no valid ID: ${invoiceNumber}`);
  const { data } = await api.delete(`/sale-invoice/${id}`);
  return data;
}

// Helpers to operate on invoiceNumber (human-friendly number) when backends
// expose the resource by that identifier. These helpers mirror the quotation
// helpers and try multiple fallbacks so the frontend can prefer invoiceNumber
// while remaining tolerant to different server implementations.
export async function getSaleByNumber(invoiceNumber: string) {
  // Try a dedicated endpoint first
  try {
    const { data } = await api.get(
      `/sale-invoice/number/${encodeURIComponent(invoiceNumber)}`
    );
    return data;
  } catch (err: unknown) {
    const error = err as { response?: { status?: number } };
    const status = error.response?.status;
    if (status && status === 404) {
      // fall through
    } else {
      throw error;
    }
  }

  // Try query-style lookup
  try {
    const { data } = await api.get<
      SaleRecordPayload[] | { data: SaleRecordPayload[] }
    >(`/sale-invoice?invoiceNumber=${encodeURIComponent(invoiceNumber)}`);
    if (Array.isArray(data)) return data[0];
    return (
      (data as { data: SaleRecordPayload[] }).data ??
      (data as unknown as SaleRecordPayload[])
    );
  } catch {
    // final fallback: fetch all and find
    const { data } = await api.get<SaleRecordPayload[]>("/sale-invoice");
    return (data || []).find(
      (s: SaleRecordPayload) =>
        String(s.invoiceNumber) === String(invoiceNumber)
    );
  }
}

// Get sale by invoiceNumber (primary method)
export async function getSale(invoiceNumber: string) {
  return getSaleByNumber(invoiceNumber);
}

// Legacy alias functions for backward compatibility
export const updateSaleByNumber = updateSale;
export const deleteSaleByNumber = deleteSale;

// Quotations endpoints
export async function updateQuotation(
  id: string | number,
  patch: Partial<QuotationRecordPayload>
) {
  const { data } = await api.put(`/quotations/${id}`, patch);
  return data;
}

export async function deleteQuotation(id: string | number) {
  const { data } = await api.delete(`/quotations/${id}`);
  return data;
}

// Helpers to operate on quotationNumber (human-friendly number) when backends
// expose the resource by that identifier. These helpers try multiple fallbacks
// so the frontend can prefer quotationNumber while remaining tolerant to
// server implementations that still require Mongo _id.
export async function getQuotationByNumber(quotationNumber: string) {
  // Try a dedicated endpoint first
  try {
    const { data } = await api.get(
      `/quotations/number/${encodeURIComponent(quotationNumber)}`
    );
    return data as QuotationRecordPayload;
  } catch (err: unknown) {
    const error = err as { response?: { status?: number } };
    const status = error.response?.status;
    if (status && status === 404) {
      // fall through to next attempt
    } else {
      // other error - rethrow
      throw error;
    }
  }

  // Try query-style lookup
  try {
    const { data } = await api.get<
      QuotationRecordPayload[] | { data: QuotationRecordPayload[] }
    >(`/quotations?quotationNumber=${encodeURIComponent(quotationNumber)}`);
    // data can be single object or array
    if (Array.isArray(data)) return data[0] as QuotationRecordPayload;
    return (
      (data as { data: QuotationRecordPayload[] }).data ??
      (data as unknown as QuotationRecordPayload[])
    );
  } catch {
    // final fallback: fetch all and find
    const { data } = await api.get<QuotationRecordPayload[]>("/quotations");
    return (data || []).find(
      (q) => String(q.quotationNumber) === String(quotationNumber)
    );
  }
}

export async function updateQuotationByNumber(
  quotationNumber: string,
  patch: Partial<QuotationRecordPayload>
) {
  // Try dedicated number-based endpoint
  try {
    const { data } = await api.put(
      `/quotations/number/${encodeURIComponent(quotationNumber)}`,
      patch
    );
    return data;
  } catch (err: unknown) {
    const error = err as { response?: { status?: number } };
    const status = error.response?.status;
    if (status && status !== 404) throw error;
  }

  // Try query param
  try {
    const { data } = await api.put(
      `/quotations?quotationNumber=${encodeURIComponent(quotationNumber)}`,
      patch
    );
    return data;
  } catch (err: unknown) {
    const error = err as { response?: { status?: number } };
    const status = error.response?.status;
    if (status && status !== 404) throw error;
  }

  // Last resort: map quotationNumber -> id then call updateQuotation
  const q = await getQuotationByNumber(quotationNumber as string);
  if (!q) throw new Error(`Quotation not found: ${quotationNumber}`);
  const quotation = q as { _id?: string; id?: string };
  const id = quotation._id ?? quotation.id;
  if (!id) throw new Error(`Quotation has no valid ID: ${quotationNumber}`);
  return updateQuotation(id, patch);
}

export async function deleteQuotationByNumber(quotationNumber: string) {
  // Try dedicated number-based endpoint
  try {
    const { data } = await api.delete(
      `/quotations/number/${encodeURIComponent(quotationNumber)}`
    );
    return data;
  } catch (err: unknown) {
    const error = err as { response?: { status?: number } };
    const status = error.response?.status;
    if (status && status !== 404) throw error;
  }

  // Try query param
  try {
    const { data } = await api.delete(
      `/quotations?quotationNumber=${encodeURIComponent(quotationNumber)}`
    );
    return data;
  } catch (err: unknown) {
    const error = err as { response?: { status?: number } };
    const status = error.response?.status;
    if (status && status !== 404) throw error;
  }

  // Last resort: map to id
  const q = await getQuotationByNumber(quotationNumber as string);
  if (!q) throw new Error(`Quotation not found: ${quotationNumber}`);
  const quotation = q as { _id?: string; id?: string };
  const id = quotation._id ?? quotation.id;
  if (!id) throw new Error(`Quotation has no valid ID: ${quotationNumber}`);
  return deleteQuotation(id);
}

// update Purchase endpoints
export async function updatePurchase(
  id: string | number,
  patch: Partial<PurchaseRecordPayload>
) {
  const { data } = await api.put(`/purchases/${id}`, patch);
  return data;
}
// Delete endpoints of purchase order
export async function deletePurchase(id: string | number) {
  const { data } = await api.delete(`/purchases/${id}`);
  return data;
}

// Delete endpoints
export async function deleteInventory(id: string | number) {
  // Keep path consistent with create/get/update which use `/products`.
  const { data } = await api.delete(`/products/${id}`);
  return data;
}

export async function deleteExpense(expenseNumber: string | number) {
  const { data } = await api.delete(`/expenses/${expenseNumber}`);
  return data;
}

export async function deleteCategory(_id: string) {
  const { data } = await api.delete(`/categories/${_id}`);
  return data;
}

export default api;
