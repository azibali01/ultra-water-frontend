import React, {
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { showNotification } from "@mantine/notifications";
import * as api from "../../lib/api";
import { validateArrayResponse } from "../../lib/validate-api";

import type { InventoryItemPayload } from "../../lib/api";
import type { Supplier } from "../../components/purchase/SupplierForm";

export interface InventoryItem {
  _id: string;
  itemName?: string;
  category?: string;
  length?: string | number;
  salesRate?: number;
  openingStock?: number;
  minimumStockLevel?: number;
  description?: string;
  stock?: number;
  lastUpdated?: string;
  quantity?: number;
  brand?: string;
}

export interface Customer {
  _id: string;
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  openingAmount?: number;
  creditLimit?: number;
  paymentType?: "Credit" | "Debit";
  createdAt?: string;
}

export type CustomerInput = Omit<Customer, "_id" | "createdAt">;

export interface SaleRecord {
  date: string | Date;
  quotationDate: string | Date;
  customerId: string | number | boolean | undefined;
  total: number | undefined;
  status: string;
  id: string | number;
  invoiceNumber?: string;
  invoiceDate?: string;
  customerName?: string;
  customer?: Array<{ id?: string | number; name: string }>;
  products?: InventoryItemPayload[];
  totalGrossAmount?: number;
  totalNetAmount?: number;
  subTotal?: number;
  amount?: number;
  remarks?: string;
  length?: number;
  totalDiscount?: number;
  paymentMethod?: "Cash" | "Card";
}

export interface PurchaseRecord {
  id?: string;
  poNumber: string;
  poDate: string | Date;
  expectedDelivery?: string | Date;
  supplier?: Supplier; // Now stores the full supplier object
  products: Array<{
    id: string;
    productName: string;
    quantity: number;
    rate: number;
    length?: string | number;
    amount?: number;
    inventoryId?: string;
    received?: number;
  }>;
  subTotal?: number;
  total: number;
  status?: string;
  remarks?: string;
  createdAt?: Date;
}

export interface PurchaseInvoiceRecord {
  id?: string;
  purchaseInvoiceNumber: string;
  invoiceDate: string | Date;
  expectedDelivery?: string | Date;
  supplier?: Supplier;
  products: Array<{
    id: string;
    productName: string;
    quantity: number;
    rate: number;
    length?: string | number;
    amount?: number;
    inventoryId?: string;
    received?: number;
  }>;
  subTotal?: number;
  total: number;
  status?: string;
  remarks?: string;
  createdAt?: Date;
}

export interface GRNRecord {
  id: string;
  grnNumber: string;
  grnDate: string;
  supplier?: string;
  supplierId?: string;
  supplierName?: string;
  linkedPoId?: string;
  items: Array<{ sku: string; quantity: number; price: number }>;
  subtotal: number;
  totalAmount: number;
  status?: string;
}

export interface PurchaseReturnRecord {
  id: string | undefined;
  returnNumber: string;
  returnDate: string;
  items: InventoryItemPayload[];
  supplier?: string;
  supplierId?: string;
  linkedPoId?: string;
  subtotal: number;
  total: number;
  reason?: string;
}

export interface SupplierCreditRecord {
  id: string;
  supplierId?: string;
  supplierName?: string;
  date: string;
  total: number;
  note?: string;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  date: string | Date;
  categoryType: string;
  description?: string;
  amount: number;
  paymentMethod?: "Cash" | "Card";
  reference?: string;
  remarks?: string;
  createdAt?: string | Date;
}

export type ExpenseInput = Omit<Expense, "id" | "createdAt">;

export interface ReceiptVoucher {
  id: string;
  voucherNumber: string;
  voucherDate: string | Date;
  receivedFrom: string;
  amount: number;
  referenceNumber?: string;
  paymentMode: string;
  remarks?: string;
}

export interface PaymentVoucher {
  id: string;
  voucherNumber: string;
  voucherDate: string | Date;
  paidTo: string;
  amount: number;
  referenceNumber?: string;
  paymentMode: string;
  remarks?: string;
}

// Color model used across the product module
export interface Color {
  name: string;
}

interface DataContextType {
  // ===== SUPPLIERS MODULE =====
  suppliers: Supplier[];
  suppliersLoading: boolean;
  suppliersError: string | null;
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  loadSuppliers: () => Promise<Supplier[]>;
  suppliersForSelect: Array<{ value: string; label: string }>;
  // ===== INVENTORY MODULE =====
  inventory: InventoryItem[];
  inventoryLoading: boolean;
  inventoryError: string | null;
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  loadInventory: () => Promise<InventoryItem[]>;
  createInventoryItem: (
    payload: InventoryItemPayload
  ) => Promise<InventoryItem>;
  updateInventoryItem: (
    id: string,
    payload: Partial<InventoryItemPayload>
  ) => Promise<InventoryItem>;
  deleteInventoryItem: (id: string) => Promise<void>;

  // ===== CATEGORIES MODULE =====
  categories: string[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  categoriesForSelect: Array<{ value: string; label: string }>;
  loadCategories: () => Promise<string[]>;
  createCategory: (name: string) => Promise<void>;
  updateCategory: (oldName: string, newName: string) => Promise<void>;
  deleteCategory: (name: string) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  renameCategory: (oldName: string, newName: string) => Promise<void>;

  // ===== CUSTOMERS MODULE =====
  customers: Customer[];
  customersLoading: boolean;
  customersError: string | null;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  loadCustomers: () => Promise<Customer[]>;
  createCustomer: (payload: CustomerInput) => Promise<Customer>;
  updateCustomer: (
    id: string | number,
    payload: Partial<CustomerInput>
  ) => Promise<Customer>;
  deleteCustomer: (id: string | number) => Promise<void>;

  // ===== SALES MODULE =====
  sales: SaleRecord[];
  salesLoading: boolean;
  salesError: string | null;
  setSales: React.Dispatch<React.SetStateAction<SaleRecord[]>>;
  loadSales: () => Promise<SaleRecord[]>;
  createSale: (
    payload: api.SaleRecordPayload | SaleRecord
  ) => Promise<SaleRecord>;
  updateSale: (
    invoiceNumber: string,
    payload: Partial<api.SaleRecordPayload>
  ) => Promise<SaleRecord>;
  deleteSale: (invoiceNumber: string) => Promise<void>;

  // ===== PURCHASES MODULE =====
  purchases: PurchaseRecord[];
  purchasesLoading: boolean;
  purchasesError: string | null;
  setPurchases: React.Dispatch<React.SetStateAction<PurchaseRecord[]>>;
  loadPurchases: () => Promise<PurchaseRecord[]>;
  createPurchase: (
    payload: api.PurchaseRecordPayload
  ) => Promise<PurchaseRecord>;
  updatePurchase: (
    id: string | number,
    payload: Partial<api.PurchaseRecordPayload>
  ) => Promise<PurchaseRecord>;
  deletePurchase: (id: string | number) => Promise<void>;

  // ===== PURCHASE INVOICES MODULE =====
  purchaseInvoices: PurchaseInvoiceRecord[];
  purchaseInvoicesLoading: boolean;
  purchaseInvoicesError: string | null;
  setPurchaseInvoices: React.Dispatch<
    React.SetStateAction<PurchaseInvoiceRecord[]>
  >;
  loadPurchaseInvoices: () => Promise<PurchaseInvoiceRecord[]>;

  // ===== GRN MODULE =====
  grns: GRNRecord[];
  grnsLoading: boolean;
  grnsError: string | null;
  setGrns: React.Dispatch<React.SetStateAction<GRNRecord[]>>;
  loadGrns: () => Promise<GRNRecord[]>;
  createGrn: (payload: api.GRNRecordPayload) => Promise<GRNRecord>;
  applyGrnToInventory: (grn: GRNRecord) => void;
  updatePurchaseFromGrn: (grn: GRNRecord) => void;

  // ===== PURCHASE RETURNS MODULE =====
  purchaseReturns: PurchaseReturnRecord[];
  purchaseReturnsLoading: boolean;
  purchaseReturnsError: string | null;
  setPurchaseReturns: React.Dispatch<
    React.SetStateAction<PurchaseReturnRecord[]>
  >;
  loadPurchaseReturns: () => Promise<PurchaseReturnRecord[]>;
  createPurchaseReturn: (
    payload: api.PurchaseReturnRecordPayload
  ) => Promise<PurchaseReturnRecord>;
  applyPurchaseReturnToInventory: (ret: PurchaseReturnRecord) => void;
  updatePurchaseFromReturn: (ret: PurchaseReturnRecord) => void;
  processPurchaseReturn: (ret: PurchaseReturnRecord) => {
    applied: boolean;
    message?: string;
  };

  // ===== EXPENSES MODULE =====
  expenses: Expense[];
  expensesLoading: boolean;
  expensesError: string | null;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  loadExpenses: () => Promise<Expense[]>;
  createExpense: (payload: ExpenseInput) => Promise<Expense>;
  updateExpense: (id: string, payload: Partial<Expense>) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
  addExpense: (e: ExpenseInput) => Expense;

  // ===== RECEIPT VOUCHERS MODULE =====
  receiptVouchers: ReceiptVoucher[];
  receiptVouchersLoading: boolean;
  receiptVouchersError: string | null;
  setReceiptVouchers: React.Dispatch<React.SetStateAction<ReceiptVoucher[]>>;
  loadReceiptVouchers: () => Promise<ReceiptVoucher[]>;

  // ===== PAYMENT VOUCHERS MODULE =====
  paymentVouchers: PaymentVoucher[];
  paymentVouchersLoading: boolean;
  paymentVouchersError: string | null;
  setPaymentVouchers: React.Dispatch<React.SetStateAction<PaymentVoucher[]>>;
  loadPaymentVouchers: () => Promise<PaymentVoucher[]>;

  // ===== COLORS (Static) =====
  colors: Color[];

  // ===== QUOTATIONS =====
  quotations: api.QuotationRecordPayload[];
  loadQuotations: () => Promise<api.QuotationRecordPayload[]>;
  setQuotations: React.Dispatch<
    React.SetStateAction<api.QuotationRecordPayload[]>
  >;

  // ===== SUPPLIER CREDITS =====
  supplierCredits: SupplierCreditRecord[];
  setSupplierCredits: React.Dispatch<
    React.SetStateAction<SupplierCreditRecord[]>
  >;

  // ===== BACKEND STATUS =====
  refreshFromBackend: () => Promise<boolean>;
  isBackendAvailable: boolean;
  apiWarnings: string[];
}

function useRunLoader(
  loaderPromisesRef: React.MutableRefObject<
    Record<string, Promise<unknown> | null>
  >,
  loaderLoadedRef: React.MutableRefObject<Record<string, boolean>>,
  normalizeResponse: (v: unknown) => unknown[]
) {
  return useCallback(
    (
      key: string,
      fn: () => Promise<unknown>,
      setter: (v: unknown[]) => void
    ) => {
      if (loaderPromisesRef.current[key]) {
        if (import.meta.env.MODE !== "production") {
          try {
            const trace = new Error().stack || "";
            // eslint-disable-next-line no-console
            console.debug(
              `[DataContext] runLoader: reusing in-flight loader "${key}"`,
              trace.split("\n").slice(2, 6)
            );
          } catch {
            // eslint-disable-next-line no-console
            console.debug(
              `[DataContext] runLoader: reusing in-flight loader "${key}"`
            );
          }
        }
        return loaderPromisesRef.current[key];
      }
      if (import.meta.env.MODE !== "production") {
        try {
          const trace = new Error().stack || "";

          console.debug(
            `[DataContext] runLoader: starting loader "${key}"`,
            trace.split("\n").slice(2, 8)
          );
        } catch {
          console.debug(`[DataContext] runLoader: starting loader "${key}"`);
        }
      }
      loaderPromisesRef.current[key] = (async () => {
        try {
          const res = await fn();
          const arr = normalizeResponse(res) as unknown[];
          setter(arr);
          loaderLoadedRef.current[key] = true;
          return arr;
        } finally {
          loaderPromisesRef.current[key] = null;
        }
      })();
      return loaderPromisesRef.current[key];
    },
    [loaderPromisesRef, loaderLoadedRef, normalizeResponse]
  );
}

const DataContext = React.createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // ===== REFS =====
  const loaderPromisesRef = useRef<Record<string, Promise<unknown> | null>>({});
  const loaderLoadedRef = useRef<Record<string, boolean>>({});
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);

  // Helper to normalize API responses (array, {data: []}, {items: []}, etc.)
  function normalizeResponse(v: unknown): unknown[] {
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") {
      if (Array.isArray((v as Record<string, unknown>).data))
        return (v as Record<string, unknown>).data as unknown[];
      const arrProp = Object.values(v).find((val) => Array.isArray(val));
      if (arrProp) return arrProp as unknown[];
    }
    return [];
  }

  // Memoized runLoader using useRunLoader
  const runLoader = useRunLoader(
    loaderPromisesRef,
    loaderLoadedRef,
    normalizeResponse
  );

  // ===== INVENTORY LOADER (fetch from backend) =====
  const loadInventory = async () => {
    setInventoryLoading(true);
    setInventoryError(null);
    try {
      const data = await api.getInventory();
      // Map _id to string for type safety
      const mapped = (data || []).map((item) => ({
        ...item,
        _id: item._id ? String(item._id) : "",
       
      }));
      setInventory(mapped);
      loaderLoadedRef.current["inventory"] = true;
      return mapped;
    } catch (err: unknown) {
      setInventoryError((err as Error).message || "Failed to load products");
      showNotification({
        title: "Load Products Failed",
        message: (err as Error).message || "Failed to load products",
        color: "red",
      });
      return [];
    } finally {
      setInventoryLoading(false);
    }
  };

  // ===== CUSTOMERS LOADER (fetch from backend) =====
  const loadCustomers = async () => {
    if (loaderLoadedRef.current["customers"]) {
      return customers;
    }
    return runLoader("customers", api.getCustomers, (v) => {
      // Normalize and map backend payload to Customer[]
      const raw = normalizeResponse(v) as unknown[];
      const mapped = raw.map((c) => {
        const o = c as {
          _id?: string;
          id?: string;
          name?: string;
          phone?: string;
          address?: string;
          city?: string;
          openingAmount?: number;
          opening_amount?: number;
          creditLimit?: number;
          credit_limit?: number;
          paymentType?: string;
          createdAt?: string;
          created_at?: string;
        };
        let paymentType: "Credit" | "Debit" | undefined = undefined;
        if (o.paymentType === "credit" || o.paymentType === "Credit")
          paymentType = "Credit";
        else if (o.paymentType === "debit" || o.paymentType === "Debit")
          paymentType = "Debit";
        return {
          _id: o._id ?? o.id ?? "",
          name: o.name ?? "",
          phone: o.phone ?? "",
          address: o.address ?? "",
          city: o.city ?? "",
          openingAmount: o.openingAmount ?? o.opening_amount ?? 0,
          creditLimit: o.creditLimit ?? o.credit_limit ?? 0,
          paymentType,
          createdAt: o.createdAt ?? o.created_at ?? undefined,
        };
      });
      setCustomers(mapped);
      return mapped;
    }) as Promise<Customer[]>;
  };
  // Auto-load customers on mount
  useEffect(() => {
    loadCustomers();
  }, []);

  // Auto-load sales on mount
  useEffect(() => {
    loadSales();
  }, []);
  // ===== SUPPLIERS STATE =====
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [suppliersError, setSuppliersError] = useState<string | null>(null);

  // ===== SUPPLIERS LOADER (fetch from backend) =====
  const loadSuppliers = async () => {
    if (loaderLoadedRef.current["suppliers"]) {
      return suppliers;
    }
    setSuppliersLoading(true);
    setSuppliersError(null);
    try {
      const data = await api.getSuppliers();
      setSuppliers(data || []);
      loaderLoadedRef.current["suppliers"] = true;
      return data || [];
    } catch (err: unknown) {
      setSuppliersError((err as Error).message || "Failed to load suppliers");
      showNotification({
        title: "Load Suppliers Failed",
        message: (err as Error).message || "Failed to load suppliers",
        color: "red",
      });
      return [];
    } finally {
      setSuppliersLoading(false);
    }
  };

  // Auto-load suppliers on mount
  useEffect(() => {
    loadSuppliers();
  }, []);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  // ===== CATEGORIES STATE =====
  const [categories, setCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  // ===== CUSTOMERS STATE =====
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState<string | null>(null);
  // ===== SALES STATE =====
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);
  // ===== PURCHASES STATE =====
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [purchasesError, setPurchasesError] = useState<string | null>(null);
  // ===== PURCHASE INVOICES STATE =====
  const [purchaseInvoices, setPurchaseInvoices] = useState<
    PurchaseInvoiceRecord[]
  >([]);
  const [purchaseInvoicesLoading, ] = useState(false);
  const [purchaseInvoicesError,] = useState<
    string | null
  >(null);
  // ===== GRN STATE =====
  const [grns, setGrns] = useState<GRNRecord[]>([]);
  const [grnsLoading, setGrnsLoading] = useState(false);
  const [grnsError, setGrnsError] = useState<string | null>(null);
  // ===== PURCHASE RETURNS STATE =====
  const [purchaseReturns, setPurchaseReturns] = useState<
    PurchaseReturnRecord[]
  >([]);
  const [purchaseReturnsLoading, setPurchaseReturnsLoading] = useState(false);
  const [purchaseReturnsError, setPurchaseReturnsError] = useState<
    string | null
  >(null);
  // ===== EXPENSES STATE =====
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expensesError, setExpensesError] = useState<string | null>(null);
  // ===== RECEIPT VOUCHERS STATE =====
  const [receiptVouchers, setReceiptVouchers] = useState<ReceiptVoucher[]>([]);
  const [receiptVouchersLoading, ] = useState(false);
  const [receiptVouchersError, ] = useState<
    string | null
  >(null);
  // ===== PAYMENT VOUCHERS STATE =====
  const [paymentVouchers, setPaymentVouchers] = useState<PaymentVoucher[]>([]);
  const [paymentVouchersLoading, ] = useState(false);
  const [paymentVouchersError, ] = useState<
    string | null
  >(null);
  // ===== QUOTATIONS STATE =====
  const [quotations, setQuotations] = useState<api.QuotationRecordPayload[]>(
    []
  );
  // ===== SUPPLIER CREDITS STATE =====
  const [supplierCredits, setSupplierCredits] = useState<
    SupplierCreditRecord[]
  >([]);
  // ===== BACKEND STATUS =====
  const [isBackendAvailable, setIsBackendAvailable] = useState(false);
  const [apiWarnings, setApiWarnings] = useState<string[]>([]);
  // ===== COLORS (STATIC) =====
  const [colors] = useState<Color[]>([
    { name: "DULL" },
    { name: "H23/PC-RAL" },
    { name: "SAHRA/BRN" },
    { name: "BLACK/MULTI" },
    { name: "WOODCOAT" },
  ]);
  // ===== MEMOIZED SELECTS =====
  const categoriesForSelect = React.useMemo(() => {
    const filtered = (categories || [])
      .filter((c) => c && typeof c === "string" && c.trim().length > 0)
      .map((c) => ({
        value: String(c).trim(),
        label: String(c).trim(),
      }));
    return filtered;
  }, [categories]);

  const suppliersForSelect = React.useMemo(() => {
    const filtered = (suppliers || [])
      .filter((s) => s && s.name && s.name.trim().length > 0)
      .map((s) => ({
        value: s.name.trim(),
        label: s.name.trim(),
      }));
    return filtered;
  }, [suppliers]);

  const loadCategories = useCallback(async () => {
    if (loaderLoadedRef.current["categories"]) {
      return categories;
    }
    return runLoader("categories", api.getCategories, (v) => {
      const raw = normalizeResponse(v) as unknown[];
      const categoryNames = raw
        .map((c) => {
          if (!c) return "";
          if (typeof c === "string") return c;
          if (typeof c === "object") {
            const o = c as { [k: string]: unknown };
            const nameFields = ["name", "title", "category", "label", "value"];
            for (const f of nameFields) {
              const vv = o[f];
              if (typeof vv === "string" && vv.trim()) return vv as string;
            }
            if (o.id !== undefined && o.id !== null) return String(o.id);
            if (o._id !== undefined && o._id !== null) return String(o._id);
          }
          return "";
        })
        .map((s) => (typeof s === "string" ? s.trim() : ""))
        .filter((name) => Boolean(name) && name.length > 0);
      setCategories(categoryNames);
      return categoryNames;
    }) as Promise<string[]>;
  }, [runLoader, categories]);

  // colors are static — no runtime loader

  // ===== INVENTORY CRUD FUNCTIONS =====
  const createInventoryItem = useCallback(
    async (payload: InventoryItemPayload) => {
      setInventoryLoading(true);
      try {
        const created = await api.createInventory(payload);
        const item = {
          ...created,
          id: String(
            (created as { id?: string | number; _id?: string | number })?.id ??
              (created as { _id?: string | number })?._id ??
              Date.now()
          ),
          name:
            (created as { itemName?: string })?.itemName ??
            payload.itemName ??
            "Unnamed Item",
        } as InventoryItem;

        setInventory((prev) => [item, ...prev]);
        showNotification({
          title: "Product Created",
          message: `${payload.itemName || "Item"} has been added successfully`,
          color: "green",
        });
        return item;
      } catch (err: unknown) {
        console.error("Create inventory failed:", err);
        setInventoryError((err as Error).message || "Failed to create product");
        showNotification({
          title: "Create Failed",
          message: (err as Error).message || "Failed to create product",
          color: "red",
        });
        throw err;
      } finally {
        setInventoryLoading(false);
      }
    },
    []
  );

  const updateInventoryItem = useCallback(
    async (id: string, payload: Partial<InventoryItemPayload>) => {
      setInventoryLoading(true);
      try {
        const updated = await api.updateInventory(String(id), payload);
        const inventoryId = String(
          (updated as { _id?: string | number })?._id ?? id
        );
        const item = {
          ...updated,
          _id: inventoryId,
        } as InventoryItem;
        setInventory((prev) =>
          prev.map((p) => (String(p._id) === inventoryId ? item : p))
        );
        showNotification({
          title: "Product Updated",
          message: `Product has been updated successfully`,
          color: "blue",
        });
        return item;
      } catch (err: unknown) {
        console.error("Update inventory failed:", err);
        setInventoryError((err as Error).message || "Failed to update product");
        showNotification({
          title: "Update Failed",
          message: (err as Error).message || "Failed to update product",
          color: "red",
        });
        throw err;
      } finally {
        setInventoryLoading(false);
      }
    },
    []
  );

  const deleteInventoryItem = useCallback(async (id: string) => {
    setInventoryLoading(true);
    try {
      console.log("Deleting inventory item with MongoDB ID:", id);
      await api.deleteInventory(id);
      setInventory((prev) => prev.filter((p) => String(p._id) !== String(id)));
      showNotification({
        title: "Product Deleted",
        message: "Product has been removed",
        color: "orange",
      });
    } catch (err: unknown) {
      console.error("Delete inventory failed:", err);
      let message = "Failed to delete product";
      if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof (err as { message?: unknown }).message === "string"
      ) {
        message =
          (err as { message?: string }).message || "Failed to delete product";
      }
      setInventoryError(message);
      showNotification({
        title: "Delete Failed",
        message,
        color: "red",
      });
      throw err;
    } finally {
      setInventoryLoading(false);
    }
  }, []);
  // ===== CUSTOMERS CRUD FUNCTIONS =====
  const createCustomer = useCallback(async (payload: CustomerInput) => {
    setCustomersLoading(true);
    try {
      // Map paymentType to lowercase if present
      const mappedPayload = {
        ...payload,
        paymentType: payload.paymentType
          ? payload.paymentType.toLowerCase() === "credit"
            ? "credit"
            : payload.paymentType.toLowerCase() === "debit"
            ? "debit"
            : undefined
          : undefined,
      } as api.CustomerPayload;
      const created = await api.createCustomer(mappedPayload);
      const customer: Customer = {
        ...created,
        _id: created._id,
      };
      setCustomers((prev) => [customer, ...prev]);
      showNotification({
        title: "Customer Created",
        message: `${payload.name || "Customer"} has been added`,
        color: "green",
      });
      return customer;
    } catch (err: unknown) {
      console.error("Create customer failed:", err);
      setCustomersError((err as Error).message || "Failed to create customer");
      showNotification({
        title: "Create Failed",
        message: (err as Error).message || "Failed to create customer",
        color: "red",
      });
      throw err;
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  const updateCustomer = useCallback(
    async (id: string | number, payload: Partial<CustomerInput>) => {
      setCustomersLoading(true);
      try {
        // Map paymentType to lowercase if present
        const mappedPayload = {
          ...payload,
          paymentType: payload.paymentType
            ? payload.paymentType.toLowerCase() === "credit"
              ? "credit"
              : payload.paymentType.toLowerCase() === "debit"
              ? "debit"
              : undefined
            : undefined,
        } as Partial<api.CustomerPayload>;
        const updated = await api.updateCustomer(String(id), mappedPayload);
        const customer: Customer = {
          ...updated,
          id: updated.id ?? id,
        };
        setCustomers((prev) =>
          prev.map((c) => (String(c._id) === String(id) ? customer : c))
        );
        showNotification({
          title: "Customer Updated",
          message: "Customer has been updated successfully",
          color: "blue",
        });
        return customer;
      } catch (err: unknown) {
        console.error("Update customer failed:", err);
        setCustomersError(
          (err as Error).message || "Failed to update customer"
        );
        showNotification({
          title: "Update Failed",
          message: (err as Error).message || "Failed to update customer",
          color: "red",
        });
        throw err;
      } finally {
        setCustomersLoading(false);
      }
    },
    []
  );

  const deleteCustomer = useCallback(async (id: string | number) => {
    setCustomersLoading(true);
    try {
      await api.deleteCustomer(String(id));
      setCustomers((prev) => prev.filter((c) => String(c._id) !== String(id)));
      showNotification({
        title: "Customer Deleted",
        message: "Customer has been removed",
        color: "orange",
      });
    } catch (err: unknown) {
      console.error("Delete customer failed:", err);
      let message = "Failed to delete customer";
      if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof (err as { message?: unknown }).message === "string"
      ) {
        message =
          (err as { message?: string }).message || "Failed to delete customer";
      }
      setCustomersError(message);
      showNotification({
        title: "Delete Failed",
        message,
        color: "red",
      });
      throw err;
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  // ===== SALES CRUD FUNCTIONS =====
  const createSale = useCallback(
    async (payload: api.SaleRecordPayload | SaleRecord) => {
      setSalesLoading(true);
      try {
        // Only send SaleRecordPayload to API
        const apiPayload: api.SaleRecordPayload = {
          ...payload,
          quotationDate:
            typeof payload.quotationDate === "string"
              ? payload.quotationDate
              : payload.quotationDate instanceof Date
              ? payload.quotationDate.toISOString()
              : undefined,
          customer:
            Array.isArray((payload as any).customer) &&
            (payload as any).customer.length > 0
              ? (payload as any).customer[0]
              : typeof (payload as any).customer === "object" &&
                (payload as any).customer !== null
              ? (payload as any).customer
              : undefined,
        };
        const created = await api.createSale(apiPayload);

        console.debug("Create sale response:", created);

        const payloadCustomer = (payload as { customer?: unknown })?.customer;
        const inferredCustomerName = Array.isArray(payloadCustomer)
          ? (payloadCustomer[0] as { name?: string })?.name
          : typeof payloadCustomer === "string"
          ? payloadCustomer
          : (payload as { customerName?: string })?.customerName || null;

        const normalizedCustomer =
          (created as { customer?: Array<{ name?: string }> })?.customer &&
          (created as { customer?: Array<{ name?: string }> })?.customer?.length
            ? (created as { customer: Array<{ name?: string }> }).customer
            : inferredCustomerName
            ? [{ name: inferredCustomerName }]
            : [];

        const sale = {
          ...created,
          id:
            (created as { invoiceNumber?: string | number })?.invoiceNumber ??
            created.id ??
            `sale-${Date.now()}`,
          customer: normalizedCustomer,
          customerName:
            (Array.isArray(normalizedCustomer) &&
              (normalizedCustomer[0] as { name?: string })?.name) ||
            (created as { customerName?: string })?.customerName ||
            inferredCustomerName ||
            "",
        } as SaleRecord;

        setSales((prev) => [sale, ...prev]);
        showNotification({
          title: "Sale Created",
          message: "Sale has been recorded successfully",
          color: "green",
        });
        // Update inventory quantities locally to reflect the sale
        try {
          const soldItems: any[] =
            (payload as any)?.items ||
            (payload as any)?.products ||
            (created as any)?.items ||
            [];
          if (Array.isArray(soldItems) && soldItems.length > 0) {
            setInventory((prev) =>
              prev.map((inv) => {
                // Find matching sold item by several possible keys
                const match = soldItems.find((it: any) => {
                  const key = String(
                    it._id ??
                      it.id ??
                      it.sku ??
                      it.productId ??
                      it.itemName ??
                      ""
                  );
                  return (
                    key &&
                    (String(inv._id) === key ||
                      String(inv.itemName) === key ||
                      String(inv.itemName) === String(it.productName))
                  );
                });
                if (!match) return inv;
                const qty = Number(match.quantity ?? 0);
                if (!qty) return inv;
                const current = Number(
                  inv.openingStock ?? inv.stock ?? inv.quantity ?? 0
                );
                const nextQty = current - qty;
                return {
                  ...inv,
                  openingStock: nextQty,
                  stock: nextQty,
                } as typeof inv;
              })
            );
          }
        } catch (err) {
          // Non-fatal, just log
          // eslint-disable-next-line no-console
          console.warn("Failed to update inventory after sale:", err);
        }
        return sale;
      } catch (err: unknown) {
        console.error("Create sale failed:", err);
        let message = "Failed to create sale";
        if (
          err &&
          typeof err === "object" &&
          "message" in err &&
          typeof (err as { message?: unknown }).message === "string"
        ) {
          message = (err as Error).message;
        }
        setSalesError(message);
        showNotification({
          title: "Create Failed",
          message,
          color: "red",
        });
        throw err;
      } finally {
        setSalesLoading(false);
      }
    },
    []
  );

  const updateSale = useCallback(
    async (id: string | number, payload: Partial<api.SaleRecordPayload>) => {
      setSalesLoading(true);
      try {
        const updated = await api.updateSaleByNumber(String(id), payload);
        console.debug("Update sale response:", updated);
        const payloadCustomer = (payload as { customer?: unknown })?.customer;
        const inferredCustomerName = Array.isArray(payloadCustomer)
          ? (payloadCustomer[0] as { name?: string })?.name
          : typeof payloadCustomer === "string"
          ? payloadCustomer
          : (payload as { customerName?: string })?.customerName || null;

        const normalizedCustomer =
          (updated as { customer?: Array<{ name?: string }> })?.customer &&
          (updated as { customer?: Array<{ name?: string }> })?.customer?.length
            ? (updated as { customer: Array<{ name?: string }> }).customer
            : inferredCustomerName
            ? [{ name: inferredCustomerName }]
            : [];

        const sale = {
          ...updated,
          id: updated.id ?? id,
          customer: normalizedCustomer,
          customerName:
            (Array.isArray(normalizedCustomer) &&
              (normalizedCustomer[0] as { name?: string })?.name) ||
            (updated as { customerName?: string })?.customerName ||
            inferredCustomerName ||
            "",
        } as SaleRecord;

        setSales((prev) =>
          prev.map((s) => (String(s.id) === String(id) ? sale : s))
        );
        showNotification({
          title: "Sale Updated",
          message: "Sale has been updated successfully",
          color: "blue",
        });
        return sale;
      } catch (err: unknown) {
        console.error("Update sale failed:", err);
        setSalesError((err as Error).message || "Failed to update sale");
        showNotification({
          title: "Update Failed",
          message: (err as Error).message || "Failed to update sale",
          color: "red",
        });
        throw err;
      } finally {
        setSalesLoading(false);
      }
    },
    []
  );

  const deleteSale = useCallback(async (id: string | number) => {
    setSalesLoading(true);
    try {
      console.debug("Deleting sale id/invoiceNumber:", String(id));
      const resp = await api.deleteSaleByNumber(String(id));

      console.debug("Delete sale response:", resp);
      setSales((prev) => prev.filter((s) => String(s.id) !== String(id)));
      showNotification({
        title: "Sale Deleted",
        message: "Sale has been removed",
        color: "orange",
      });
    } catch (err: unknown) {
      console.error("Delete sale failed:", err);
      let message = "Failed to delete sale";
      if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof (err as { message?: unknown }).message === "string"
      ) {
        message = (err as Error).message;
      }
      setSalesError(message);
      showNotification({
        title: "Delete Failed",
        message,
        color: "red",
      });
      throw err;
    } finally {
      setSalesLoading(false);
    }
  }, []);

  const createPurchase = useCallback(
    async (payload: api.PurchaseRecordPayload) => {
      setPurchasesLoading(true);
      try {
        // If payload has supplierId, find the full supplier object and send as supplier
        const fullPayload = { ...payload };
        // Use a type guard to check for supplierId property
        type PayloadWithSupplierId = api.PurchaseRecordPayload & {
          supplierId?: string;
        };
        const hasSupplierId = (
          obj: api.PurchaseRecordPayload
        ): obj is PayloadWithSupplierId =>
          typeof (obj as PayloadWithSupplierId).supplierId === "string" &&
          !(obj as PayloadWithSupplierId).supplier;

        if (hasSupplierId(payload)) {
          const foundSupplier = suppliers.find(
            (s) => s._id === payload.supplierId
          );
          if (foundSupplier) {
            (fullPayload as PayloadWithSupplierId).supplier = foundSupplier;
            delete (fullPayload as PayloadWithSupplierId).supplierId;
          }
        }
        const created = await api.createPurchase(fullPayload);
        const purchase = {
          ...created,
          id: created.id ?? `po-${Date.now()}`,
        } as PurchaseRecord;

        setPurchases((prev) => [purchase, ...prev]);
        showNotification({
          title: "Purchase Created",
          message: "Purchase order has been created",
          color: "green",
        });
        // Update inventory quantities locally to reflect the purchase
        try {
          const purchasedItems: any[] =
            (payload as any)?.products || (created as any)?.products || [];
          if (Array.isArray(purchasedItems) && purchasedItems.length > 0) {
            setInventory((prev) =>
              prev.map((inv) => {
                const match = purchasedItems.find((it: any) => {
                  const key = String(
                    it.inventoryId ??
                      it.id ??
                      it._id ??
                      it.productName ??
                      it.productId ??
                      ""
                  );
                  return (
                    key &&
                    (String(inv._id) === key ||
                      String(inv.itemName) === key ||
                      String(inv.itemName) === String(it.productName))
                  );
                });
                if (!match) return inv;
                const qty = Number(match.quantity ?? match.received ?? 0);
                if (!qty) return inv;
                const current = Number(
                  inv.openingStock ?? inv.stock ?? inv.quantity ?? 0
                );
                const nextQty = current + qty;
                return {
                  ...inv,
                  openingStock: nextQty,
                  stock: nextQty,
                } as typeof inv;
              })
            );
          }
        } catch (err) {
          // Non-fatal; log for debugging
          // eslint-disable-next-line no-console
          console.warn("Failed to update inventory after purchase:", err);
        }
        return purchase;
      } catch (err: unknown) {
        console.error("Create purchase failed:", err);
        setPurchasesError(
          (err as Error).message || "Failed to create purchase"
        );
        showNotification({
          title: "Create Failed",
          message: (err as Error).message || "Failed to create purchase",
          color: "red",
        });
        throw err;
      } finally {
        setPurchasesLoading(false);
      }
    },
    [suppliers]
  );

  const updatePurchase = useCallback(
    async (
      id: string | number,
      payload: Partial<api.PurchaseRecordPayload>
    ) => {
      setPurchasesLoading(true);
      try {
        const updated = await api.updatePurchase(String(id), payload);
        const purchase = {
          ...updated,
          id: updated.id ?? id,
        } as PurchaseRecord;

        setPurchases((prev) =>
          prev.map((p) => (String(p.id) === String(id) ? purchase : p))
        );
        showNotification({
          title: "Purchase Updated",
          message: "Purchase order has been updated",
          color: "blue",
        });
        return purchase;
      } catch (err: unknown) {
        console.error("Update purchase failed:", err);
        setPurchasesError(
          (err as Error).message || "Failed to update purchase"
        );
        showNotification({
          title: "Update Failed",
          message: (err as Error).message || "Failed to update purchase",
          color: "red",
        });
        throw err;
      } finally {
        setPurchasesLoading(false);
      }
    },
    []
  );

  const deletePurchase = useCallback(async (id: string | number) => {
    setPurchasesLoading(true);
    try {
      await api.deletePurchase(String(id));
      setPurchases((prev) => prev.filter((p) => String(p.id) !== String(id)));
      showNotification({
        title: "Purchase Deleted",
        message: "Purchase order has been removed",
        color: "orange",
      });
    } catch (err: unknown) {
      console.error("Delete purchase failed:", err);
      let message = "Failed to delete purchase";
      if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof (err as unknown as { message?: unknown }).message === "string"
      ) {
        message =
          (err as { message?: string }).message || "Failed to delete purchase";
      }
      setPurchasesError(message);
      showNotification({
        title: "Delete Failed",
        message,
        color: "red",
      });
      throw err;
    } finally {
      setPurchasesLoading(false);
    }
  }, []);

  const createGrn = useCallback(async (payload: api.GRNRecordPayload) => {
    setGrnsLoading(true);
    try {
      const created = await api.createGRN(payload);
      const grn = {
        ...created,
        id: created.id ?? `grn-${Date.now()}`,
      } as GRNRecord;

      setGrns((prev) => [grn, ...prev]);
      showNotification({
        title: "GRN Created",
        message: `GRN ${grn.grnNumber || ""} has been created`,
        color: "green",
      });
      return grn;
    } catch (err: unknown) {
      console.error("Create GRN failed:", err);
      setGrnsError((err as Error).message || "Failed to create GRN");
      showNotification({
        title: "Create Failed",
        message: (err as Error).message || "Failed to create GRN",
        color: "red",
      });
      throw err;
    } finally {
      setGrnsLoading(false);
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createPurchaseReturn = useCallback(async (payload: any) => {
    setPurchaseReturnsLoading(true);
    try {
      const created = await api.createPurchaseReturn(payload);
      const purchaseReturn = {
        ...created,
        id: created.id ?? `pr-${Date.now()}`,
      } as PurchaseReturnRecord;

      setPurchaseReturns((prev) => [purchaseReturn, ...prev]);
      showNotification({
        title: "Purchase Return Created",
        message: `Return ${purchaseReturn.returnNumber || ""} has been created`,
        color: "green",
      });
      return purchaseReturn;
    } catch (err: unknown) {
      console.error("Create purchase return failed:", err);
      setPurchaseReturnsError(
        (err as Error).message || "Failed to create purchase return"
      );
      showNotification({
        title: "Create Failed",
        message: (err as Error).message || "Failed to create purchase return",
        color: "red",
      });
      throw err;
    } finally {
      setPurchaseReturnsLoading(false);
    }
  }, []);

  const createExpense = useCallback(async (payload: ExpenseInput) => {
    setExpensesLoading(true);
    try {
      // Map categoryType to allowed union values
      const allowedCategories = [
        "Rent",
        "Utilities",
        "Transportation",
        "Salary",
        "Maintenance",
        "Other",
      ] as const;
      const mappedCategory =
        allowedCategories.find(
          (cat) =>
            cat.toLowerCase() === payload.categoryType.trim().toLowerCase()
        ) || "Other";
      const mappedPayload = {
        ...payload,
        categoryType: mappedCategory,
      };
      const created = await api.createExpense(mappedPayload);
      const expense = {
        ...created,
        id: created.id ?? `exp-${Date.now()}`,
      } as Expense;

      setExpenses((prev) => [expense, ...prev]);
      showNotification({
        title: "Expense Created",
        message: "Expense has been recorded",
        color: "green",
      });
      return expense;
    } catch (err: unknown) {
      console.error("Create expense failed:", err);
      setExpensesError((err as Error).message || "Failed to create expense");
      showNotification({
        title: "Create Failed",
        message: (err as Error).message || "Failed to create expense",
        color: "red",
      });
      throw err;
    } finally {
      setExpensesLoading(false);
    }
  }, []);

  const updateExpenseItem = useCallback(
    async (id: string, payload: Partial<Expense>) => {
      setExpensesLoading(true);
      try {
        // Map categoryType to allowed union values if present
        const allowedCategories = [
          "Rent",
          "Utilities",
          "Transportation",
          "Salary",
          "Maintenance",
          "Other",
        ] as const;
        let mappedCategoryType: (typeof allowedCategories)[number] | undefined =
          undefined;
        if (payload.categoryType !== undefined) {
          mappedCategoryType =
            allowedCategories.find(
              (cat) =>
                cat.toLowerCase() ===
                payload.categoryType?.toString().trim().toLowerCase()
            ) || "Other";
        }
        const mappedPayload = {
          ...payload,
          ...(payload.categoryType !== undefined && {
            categoryType: mappedCategoryType,
          }),
        } as Partial<import("../../lib/api").ExpensePayload>;

        const updated = await api.updateExpense(id, mappedPayload);
        const expense = {
          ...updated,
          id: updated.id ?? id,
        } as Expense;

        setExpenses((prev) => prev.map((e) => (e.id === id ? expense : e)));
        showNotification({
          title: "Expense Updated",
          message: "Expense has been updated",
          color: "blue",
        });
        return expense;
      } catch (err: unknown) {
        console.error("Update expense failed:", err);
        setExpensesError((err as Error).message || "Failed to update expense");
        showNotification({
          title: "Update Failed",
          message: (err as Error).message || "Failed to update expense",
          color: "red",
        });
        throw err;
      } finally {
        setExpensesLoading(false);
      }
    },
    []
  );

  const deleteExpenseItem = useCallback(async (expenseNumber: string) => {
    setExpensesLoading(true);
    try {
      await api.deleteExpense(expenseNumber);
      setExpenses((prev) =>
        prev.filter((e) => e.expenseNumber !== expenseNumber)
      );
      showNotification({
        title: "Expense Deleted",
        message: "Expense has been removed",
        color: "orange",
      });
    } catch (err: unknown) {
      console.error("Delete expense failed:", err);
      let message = "Failed to delete expense";
      if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof (err as { message?: unknown }).message === "string"
      ) {
        message =
          (err as { message?: string }).message || "Failed to delete expense";
      }
      setExpensesError(message);
      showNotification({
        title: "Delete Failed",
        message,
        color: "red",
      });
      throw err;
    } finally {
      setExpensesLoading(false);
    }
  }, []);

  // ===== CATEGORY CRUD (already exists above, keeping references) =====
  const createCategory = useCallback(async (name: string) => {
    const v = name.trim();
    if (!v) return;
    setCategoriesLoading(true);
    try {
      await api.createCategory({ name: v });
      // Refresh categories from backend to get authoritative list
      if (typeof loadCategories === "function") await loadCategories();
      showNotification({
        title: "Category Added",
        message: `Category '${v}' added`,
        color: "green",
      });
    } catch (err) {
      setCategoriesError(String(err));
      showNotification({
        title: "Category Creation Failed",
        message: String(err),
        color: "red",
      });
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const updateCategory = useCallback(
    async (categoryId: string, newName: string) => {
      const v = newName.trim();
      if (!v) return;
      setCategoriesLoading(true);
      try {
        await api.updateCategory(categoryId, { name: v });
        if (typeof loadCategories === "function") await loadCategories();
        showNotification({
          title: "Renamed",
          message: `Category renamed to '${v}'`,
          color: "blue",
        });
      } catch (err) {
        setCategoriesError(String(err));
        showNotification({
          title: "Category Rename Failed",
          message: String(err),
          color: "red",
        });
      } finally {
        setCategoriesLoading(false);
      }
    },
    []
  );

  const deleteCategoryItem = useCallback(async (name: string) => {
    setCategoriesLoading(true);
    try {
      const catsRaw = (await api.getCategories()) as unknown[];
      // normalize to objects with id and name for robust matching
      const cats = (catsRaw || []).map((c) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!c) return { id: undefined as any, name: "" };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof c === "string") return { id: undefined as any, name: c };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const o = c as { [k: string]: any };
        const nameFields = ["name", "title", "category", "label", "value"];
        let resolvedName = "";
        for (const f of nameFields) {
          if (typeof o[f] === "string" && o[f].trim()) {
            resolvedName = o[f].trim();
            break;
          }
        }
        const _id = o._id ?? o.id ?? undefined;
        return { _id, name: resolvedName };
      });

      const nameTrim = name.trim();
      const nameLower = nameTrim.toLowerCase();
      const categoryToDelete = cats.find(
        (c) => (c.name || "").trim().toLowerCase() === nameLower
      );
      const delId =
        categoryToDelete && categoryToDelete._id
          ? String(categoryToDelete._id)
          : undefined;
      if (delId) {
        // Delete server-side category when possible (use MongoDB _id)
        console.debug(
          "Deleting category by MongoDB _id:",
          delId,
          "for name:",
          nameTrim
        );
        await api.deleteCategory(String(delId));
      } else {
        // If category doesn't exist on backend (derived from inventory only),
        // continue and clear it from local inventory so UI reflects removal.
        console.warn(
          "Category not found on backend (no _id), clearing locally:",
          nameTrim
        );
      }

      // Clear category from local inventory items so categoriesList updates
      setInventory((prev) =>
        prev.map((p) =>
          (p.category || "").trim() === nameTrim ? { ...p, category: "" } : p
        )
      );

      // Refresh categories from backend directly (bypass runLoader short-circuit)
      try {
        const fresh = normalizeResponse(await api.getCategories()) as unknown[];
        const categoryNames = fresh
          .map((c) => {
            if (!c) return "";
            if (typeof c === "string") return c;
            if (typeof c === "object") {
              const o = c as { [k: string]: unknown };
              const nameFields = [
                "name",
                "title",
                "category",
                "label",
                "value",
              ];
              for (const f of nameFields) {
                const vv = o[f];
                if (typeof vv === "string" && vv.trim()) return vv as string;
              }
              if (o.id !== undefined && o.id !== null) return String(o.id);
              if (o._id !== undefined && o._id !== null) return String(o._id);
            }
            return "";
          })
          .map((s) => (typeof s === "string" ? s.trim() : ""))
          .filter((name) => Boolean(name) && name.length > 0);
        setCategories(categoryNames);
      } catch {
        // If refresh fails, keep local state (we already cleared inventory categories)
        console.warn("Failed to refresh categories after delete");
      }

      showNotification({
        title: "Category Deleted",
        message: `Category '${name}' removed`,
        color: "orange",
      });
    } catch (err) {
      setCategoriesError(String(err));
      showNotification({
        title: "Category Deletion Failed",
        message: String(err),
        color: "red",
      });
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // ===== LEGACY ALIASES FOR BACKWARD COMPATIBILITY =====
  const addCategory = useCallback(
    async (name: string) => {
      return createCategory(name);
    },
    [createCategory]
  );

  const renameCategory = useCallback(
    async (oldName: string, newName: string) => {
      return updateCategory(oldName, newName);
    },
    [updateCategory]
  );

  const addExpense = (e: ExpenseInput) => {
    // create local record first for optimistic UI
    const record: Expense = {
      id:
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `exp-${Date.now()}`,
      createdAt: new Date(),
      ...e,
    };
    setExpenses((prev) => [record, ...(prev || [])]);

    // attempt to persist to backend if available
    (async () => {
      try {
        // Map categoryType to allowed union values
        const allowedCategories = [
          "Rent",
          "Utilities",
          "Transportation",
          "Salary",
          "Maintenance",
          "Other",
        ] as const;
        const mappedCategory =
          allowedCategories.find(
            (cat) => cat.toLowerCase() === e.categoryType.trim().toLowerCase()
          ) || "Other";
        const mappedPayload = {
          ...e,
          categoryType: mappedCategory,
        };
        const created = await api.createExpense(mappedPayload);
        // replace optimistic record with server-supplied record if it returns an id
        setExpenses((prev) => [
          created,
          ...(prev || []).filter((x) => x.id !== record.id),
        ]);
      } catch (err) {
        // keep optimistic record and surface errors via a notification
        showNotification({
          title: "Expense Persist Failed",
          message: String(err),
          color: "red",
        });
      }
    })();

    return record;
  };

  async function refreshFromBackend() {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    refreshPromiseRef.current = (async () => {
      try {
        const cat = await api.getCategories();
        const warnings: string[] = [];
        const maybeWarn = (name: string, v: unknown) => {
          const w = validateArrayResponse(name, v);
          if (w) warnings.push(w);
        };
        maybeWarn("categories", cat);

        setApiWarnings(warnings);

        const rawCats = normalizeResponse(cat) as unknown[];

        const categoryNames = rawCats
          .map((c) => {
            if (!c) return "";
            if (typeof c === "string") return c;
            if (typeof c === "object") {
              const o = c as { [k: string]: unknown };

              const nameFields = [
                "name",
                "title",
                "category",
                "label",
                "value",
              ];
              for (const f of nameFields) {
                const v = o[f];
                if (typeof v === "string" && v.trim()) return v;
              }

              if (o.id !== undefined && o.id !== null) return String(o.id);
              if (o._id !== undefined && o._id !== null) return String(o._id);
            }
            return "";
          })
          .map((s) => (typeof s === "string" ? s.trim() : ""))
          .filter(Boolean);
        setCategories(categoryNames);
        setIsBackendAvailable(true);
        return true;
      } catch (err) {
        showNotification({
          title: "Backend Refresh Failed",
          message: "Using local data — " + String(err),
          color: "orange",
        });
        setIsBackendAvailable(false);
        return false;
      } finally {
        // clear the ref so future refreshes can run
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }
  const loadSales = async () => {
    if (loaderLoadedRef.current["sales"] && sales.length > 0) {
      return sales;
    }
    if (sales.length === 0) {
      loaderLoadedRef.current["sales"] = false;
    }
    return runLoader("sales", api.getSales, (v) => {
      const rawSales = normalizeResponse(v) as unknown[];
      const normalizedSales = rawSales.map((sale) => {
        const s = sale as Record<string, unknown>;
        const customer = s.customer;
        let normalizedCustomer: Array<{ id?: string | number; name: string }> =
          [];
        if (Array.isArray(customer) && customer.length > 0) {
          normalizedCustomer = customer;
        } else if (customer && typeof customer === "object") {
          normalizedCustomer = [
            {
              ...(customer as object),
              name: (customer as { name?: string })?.name ?? "",
            },
          ];
        } else if (typeof customer === "string" && customer.trim()) {
          normalizedCustomer = [{ name: customer.trim() }];
        }
        const customerName =
          (normalizedCustomer.length > 0 && normalizedCustomer[0]?.name) ||
          s.customerName ||
          (typeof customer === "string" ? customer : "") ||
          "";
        const normalized = {
          ...s,
          id: s.invoiceNumber ?? s.id ?? `sale-${Date.now()}`,
          customer: normalizedCustomer,
          customerName: customerName,
        } as SaleRecord;
        return normalized;
      });
      setSales(normalizedSales);
      return normalizedSales;
    }) as Promise<SaleRecord[]>;
  };

  const loadPurchases = async () => {
    if (loaderLoadedRef.current["purchases"]) {
      return purchases;
    }
    return runLoader("purchases", api.getPurchases, (v) => {
      // Ensure each purchase has a full supplier object if present
      const normalized = (normalizeResponse(v) as any[]).map((rec) => {
        if (
          rec.supplier &&
          typeof rec.supplier === "object" &&
          rec.supplier._id
        ) {
          return rec;
        } else if (rec.supplierId) {
          // fallback: try to find supplier from context
          const found = suppliers.find((s) => s._id === rec.supplierId);
          return { ...rec, supplier: found };
        }
        return rec;
      }) as PurchaseRecord[];
      setPurchases(normalized);
      return normalized;
    }) as Promise<PurchaseRecord[]>;
  };

  const loadPurchaseInvoices = async () => {
    if (loaderLoadedRef.current["purchaseInvoices"]) {
      return purchaseInvoices;
    }
    return runLoader("purchaseInvoices", api.getPurchaseInvoices, (v) => {
      // Ensure each purchase invoice has a full supplier object if present
      const normalized = (normalizeResponse(v) as any[]).map((rec) => {
        if (
          rec.supplier &&
          typeof rec.supplier === "object" &&
          rec.supplier._id
        ) {
          return rec;
        } else if (rec.supplierId) {
          // fallback: try to find supplier from context
          const found = suppliers.find((s) => s._id === rec.supplierId);
          return { ...rec, supplier: found };
        }
        return rec;
      }) as PurchaseInvoiceRecord[];
      setPurchaseInvoices(normalized);
      return normalized;
    }) as Promise<PurchaseInvoiceRecord[]>;
  };

  const loadGrns = async () => {
    if (loaderLoadedRef.current["grns"]) {
      return grns;
    }
    return runLoader("grns", api.getGRNs, (v) => {
      const normalized = normalizeResponse(v) as GRNRecord[];
      setGrns(normalized);
      return normalized;
    }) as Promise<GRNRecord[]>;
  };

  const loadPurchaseReturns = async () => {
    if (loaderLoadedRef.current["purchaseReturns"]) {
      return purchaseReturns;
    }
    return runLoader("purchaseReturns", api.getPurchaseReturns, (v) => {
      const normalized = normalizeResponse(v) as PurchaseReturnRecord[];
      setPurchaseReturns(normalized);
      return normalized;
    }) as Promise<PurchaseReturnRecord[]>;
  };
  const loadExpenses = async (): Promise<Expense[]> => {
    if (loaderLoadedRef.current["expenses"]) {
      return expenses;
    }
    return runLoader("expenses", api.getExpenses, (v) => {
      const normalized = normalizeResponse(v) as Expense[];
      setExpenses(normalized);
      return normalized;
    }) as Promise<Expense[]>;
  };

  const loadReceiptVouchers = async (): Promise<ReceiptVoucher[]> => {
    if (loaderLoadedRef.current["receiptVouchers"]) {
      return receiptVouchers;
    }
    return runLoader("receiptVouchers", api.getAllReceiptVouchers, (v) => {
      const normalized = (normalizeResponse(v) as any[]).map((voucher) => ({
        id: voucher._id || voucher.id || voucher.voucherNumber || "",
        voucherNumber: voucher.voucherNumber || "",
        voucherDate: voucher.voucherDate || new Date(),
        receivedFrom: voucher.receivedFrom || "",
        amount: voucher.amount || 0,
        referenceNumber: voucher.referenceNumber || voucher.reference || "",
        paymentMode: voucher.paymentMode || "",
        remarks: voucher.remarks || "",
      })) as ReceiptVoucher[];
      setReceiptVouchers(normalized);
      return normalized;
    }) as Promise<ReceiptVoucher[]>;
  };

  const loadPaymentVouchers = async (): Promise<PaymentVoucher[]> => {
    if (loaderLoadedRef.current["paymentVouchers"]) {
      return paymentVouchers;
    }
    return runLoader("paymentVouchers", api.getAllPaymentVouchers, (v) => {
      const normalized = (normalizeResponse(v) as any[]).map((voucher) => ({
        id: voucher._id || voucher.id || voucher.voucherNumber || "",
        voucherNumber: voucher.voucherNumber || "",
        voucherDate: voucher.voucherDate || new Date(),
        paidTo: voucher.paidTo || "",
        amount: voucher.amount || 0,
        referenceNumber: voucher.referenceNumber || voucher.reference || "",
        paymentMode: voucher.paymentMode || "",
        remarks: voucher.remarks || "",
      })) as PaymentVoucher[];
      setPaymentVouchers(normalized);
      return normalized;
    }) as Promise<PaymentVoucher[]>;
  };

  // Only one loadQuotations function, returns correct type and is in correct order
  const loadQuotations = useCallback(async (): Promise<
    api.QuotationRecordPayload[]
  > => {
    if (loaderLoadedRef.current["quotations"]) {
      if (import.meta.env.MODE !== "production") {
        console.debug(
          "[DataContext] loadQuotations: already loaded — skipping fetch"
        );
      }
      return quotations;
    }
    return runLoader("quotations", api.getQuotations, (v) => {
      const raw = normalizeResponse(v) as unknown[];
      const mapped = (raw || []).map((it) => {
        const o = (it || {}) as Record<string, unknown>;
        let customer: api.CustomerPayload[] = [];
        if (Array.isArray(o.customer)) {
          customer = (o.customer as api.CustomerPayload[]).map((c) => ({
            id: c.id,
            name: c.name ?? (typeof c === "string" ? c : ""),
          }));
        } else if (typeof o.customer === "object" && o.customer !== null) {
          customer = [
            {
              id: (o.customer as { id?: string | number })?.id,
              name: (o.customer as { name?: string })?.name ?? "",
            },
          ];
        } else if (typeof o.customer === "string" && o.customer.trim()) {
          customer = [{ name: o.customer.trim() }];
        } else if (o.customerName && typeof o.customerName === "string") {
          customer = [{ name: o.customerName }];
        }
        const products =
          (o.products as unknown[] | undefined) ??
          (o.items as unknown[] | undefined) ??
          [];
        return {
          _id:
            (o._id as string | undefined) ??
            (o.id as string | undefined) ??
            undefined,
          id:
            (o.id as string | undefined) ??
            (o._id as string | undefined) ??
            undefined,
          quotationNumber:
            (o.quotationNumber as string | undefined) ??
            (o.quotation_no as string | undefined) ??
            (o.docNo as string | undefined) ??
            undefined,
          products: products as api.InventoryItemPayload[],
          quotationDate:
            (o.quotationDate as string | undefined) ??
            (o.date as string | undefined) ??
            (o.docDate as string | undefined) ??
            undefined,
          customer,
          customerName:
            (o.customerName as string | undefined) ??
            (customer.length > 0 ? customer[0].name : undefined),
          remarks:
            (o.remarks as string | undefined) ??
            (o.note as string | undefined) ??
            undefined,
          subTotal:
            (o.subTotal as number | undefined) ??
            (o.sub_total as number | undefined) ??
            (o.total as number | undefined) ??
            undefined,
          totalGrossAmmount:
            (o.totalGrossAmmount as number | undefined) ??
            (o.totalGrossAmount as number | undefined) ??
            (o.total as number | undefined) ??
            undefined,
          totalDiscount:
            (o.totalDiscount as number | undefined) ??
            (o.discount as number | undefined) ??
            0,
          length: products.length || undefined,
          status: (o.status as string | undefined) ?? undefined,
          metadata: (o.metadata as Record<string, unknown> | undefined) ?? {},
        } as api.QuotationRecordPayload;
      });
      setQuotations(mapped);
      return mapped;
    }) as Promise<api.QuotationRecordPayload[]>;
  }, [runLoader, quotations]);
  // Stubs for required purchase return functions
  function applyPurchaseReturnToInventory(ret: PurchaseReturnRecord) {
    // Placeholder: implement inventory update logic as needed
    void ret;
  }
  function updatePurchaseFromReturn(): void {
    // Implement purchase update logic as needed
  }
  function processPurchaseReturn() {
    // Implement processing logic as needed
    return { applied: false };
  }

  function applyGrnToInventory(grn: GRNRecord) {
    // For each item in GRN, try to find inventory by sku and increase stock
    setInventory((prev) =>
      prev.map((item) => {
        const found = grn.items.find(
          (gi) =>
            String(gi.sku) === String(item.itemName) ||
            String(gi.sku) === String(item._id)
        );
        if (found) {
          return {
            ...item,
            stock: (item.stock || 0) + (found.quantity || 0),
          } as InventoryItem;
        }
        return item;
      })
    );
  }

  function updatePurchaseFromGrn(grn: GRNRecord) {
    if (!grn.linkedPoId) return;
    setPurchases((prev: PurchaseRecord[]) =>
      prev.map((po: PurchaseRecord) => {
        if (String(po.id) !== String(grn.linkedPoId)) return po;
        // For each GRN item, add its qty to the matching PO product's 'received' field
        const products = (po.products || []).map((pi) => {
          // Try to match by productName or id
          const found = grn.items.find(
            (gi) =>
              String(gi.sku) === String(pi.productName) ||
              String(gi.sku) === String(pi.id)
          );
          return found
            ? { ...pi, received: (pi.received || 0) + (found.quantity || 0) }
            : pi;
        });
        return { ...po, products };
      })
    );
  }

  return (
    <DataContext.Provider
      value={{
        // ===== SUPPLIERS MODULE =====
        suppliers,
        suppliersLoading,
        suppliersError,
        setSuppliers,
        loadSuppliers,
        suppliersForSelect,

        // ===== INVENTORY MODULE =====
        inventory,
        inventoryLoading,
        inventoryError,
        setInventory,
        loadInventory,
        createInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,

        // ===== CATEGORIES MODULE =====
        categories,
        categoriesLoading,
        categoriesError,
        setCategories,
        categoriesForSelect,
        loadCategories,
        createCategory,
        updateCategory,
        deleteCategory: deleteCategoryItem,
        addCategory, // Legacy alias
        renameCategory, // Legacy alias

        // ===== CUSTOMERS MODULE =====
        customers,
        customersLoading,
        customersError,
        setCustomers,
        loadCustomers,
        createCustomer,
        updateCustomer,
        deleteCustomer,

        // ===== SALES MODULE =====
        sales,
        salesLoading,
        salesError,
        setSales,
        loadSales,
        createSale,
        updateSale,
        deleteSale,

        // ===== PURCHASES MODULE =====
        purchases,
        purchasesLoading,
        purchasesError,
        setPurchases,
        loadPurchases,
        createPurchase,
        updatePurchase,
        deletePurchase,

        // ===== PURCHASE INVOICES MODULE =====
        purchaseInvoices,
        purchaseInvoicesLoading,
        purchaseInvoicesError,
        setPurchaseInvoices,
        loadPurchaseInvoices,

        // ===== GRN MODULE =====
        grns,
        grnsLoading,
        grnsError,
        setGrns,
        loadGrns,
        createGrn,
        applyGrnToInventory,
        updatePurchaseFromGrn,

        // ===== PURCHASE RETURNS MODULE =====
        purchaseReturns,
        purchaseReturnsLoading,
        purchaseReturnsError,
        setPurchaseReturns,
        loadPurchaseReturns,
        createPurchaseReturn,
        applyPurchaseReturnToInventory,
        updatePurchaseFromReturn,
        processPurchaseReturn,

        // ===== EXPENSES MODULE =====
        expenses,
        expensesLoading,
        expensesError,
        setExpenses,
        loadExpenses,
        createExpense,
        updateExpense: updateExpenseItem,
        deleteExpense: deleteExpenseItem,
        addExpense,

        // ===== RECEIPT VOUCHERS MODULE =====
        receiptVouchers,
        receiptVouchersLoading,
        receiptVouchersError,
        setReceiptVouchers,
        loadReceiptVouchers,

        // ===== PAYMENT VOUCHERS MODULE =====
        paymentVouchers,
        paymentVouchersLoading,
        paymentVouchersError,
        setPaymentVouchers,
        loadPaymentVouchers,

        // ===== COLORS (Static) =====
        colors,

        // ===== QUOTATIONS =====
        quotations,
        loadQuotations,
        setQuotations,

        // ===== SUPPLIER CREDITS =====
        supplierCredits,
        setSupplierCredits,

        // ===== BACKEND STATUS =====
        refreshFromBackend,
        isBackendAvailable,
        apiWarnings,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export function useDataContext() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    // Provide richer diagnostics to help with HMR / duplicate-react issues
    const location =
      typeof window !== "undefined" ? window.location.href : "<unknown>";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mode = import.meta && (import.meta.env || ({} as any)).MODE;
    throw new Error(
      `useDataContext must be used within a DataProvider. Current location: ${location}. Build mode: ${
        mode || "unknown"
      }. If you see this during development, try a full page reload or restart the dev server (npm run dev) — HMR can sometimes produce duplicate module instances which break React context.`
    );
  }
  return ctx;
}
