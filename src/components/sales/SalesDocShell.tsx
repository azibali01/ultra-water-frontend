import React, { useMemo, useState, useEffect } from "react";
import {
  Card,
  TextInput,
  Textarea,
  Button,
  Badge,
  Select,
  Text,
  Paper,
} from "@mantine/core";
import { formatCurrency } from "../../lib/format-utils";
import LineItemsTable from "./line-items-table";
import type { LineItem } from "./line-items-table";
import type {
  Customer,
  InventoryItem,
} from "../../Dashboard/Context/DataContext";
import openPrintWindow from "../print/printWindow";
import type { InvoiceData } from "../print/printTemplate";
import type { CustomerPayload } from "../../lib/api";

function generateId() {
  try {
    return typeof crypto !== "undefined" &&
      typeof (crypto as Crypto & { randomUUID?: () => string }).randomUUID ===
        "function"
      ? (crypto as Crypto & { randomUUID?: () => string }).randomUUID!()
      : Math.random().toString(36).slice(2);
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

export interface SalesPayload {
  mode: "Quotation" | "Invoice";
  docNo: string;
  docDate: string;
  invoiceDate?: string;
  products?: InventoryItem[];
  items?: LineItem[];
  customer?: CustomerPayload;
  totals: {
    total: number;
    amount: number;
    totalGrossAmount: number;
    totalDiscountAmount: number;
    totalNetAmount: number;
    subTotal: number;
  };
  remarks: string;
  terms: string;
  status?: string;
  sourceQuotationId?: string | number;
  convertedInvoiceId?: string | number;
  convertedAt?: string;
}

export default function SalesDocShell({
  mode,
  initial,
  onSubmit,
  customers,
  products,
  submitting,
  setSubmitting,
  saveDisabled,
}: {
  mode: "Quotation" | "Invoice";
  initial?: Partial<SalesPayload>;
  onSubmit?: (payload: SalesPayload) => void | Promise<void>;
  customers: Customer[];
  products: InventoryItem[];
  submitting: boolean;
  setSubmitting: (submitting: boolean) => void;
  saveDisabled?: boolean;
}) {
  const [docNo, setDocNo] = useState<string>(initial?.docNo ?? "");
  const [docDate, setDocDate] = useState<string>(
    initial?.docDate
      ? String(initial.docDate)
      : new Date().toISOString().slice(0, 10)
  );

  // Initialize customer from initial payload if provided
  const [customerId, setCustomerId] = useState<string>(
    initial?.customer && typeof initial.customer === "object" && "name" in initial.customer
      ? initial.customer.name ?? ""
      : ""
  );
  const [remarks, setRemarks] = useState<string>(
    initial && typeof initial.remarks === "string" ? initial.remarks : ""
  );
  const [terms, setTerms] = useState<string>(
    initial && typeof initial.terms === "string"
      ? initial.terms
      : "Prices valid for 15 days.\nPayment terms: Due on receipt."
  );
  // Always start with at least one empty item row
  const [items, setItems] = useState<LineItem[]>([
    {
      _id: generateId(),
      itemName: "",
      quantity: 1,
      salesRate: 0,
      discount: 0,
      amount: 0,
  
      totalGrossAmount: 0,
      totalNetAmount: 0,
      discountAmount: 0,
    },
  ]);

  // Reset fields when modal opens (when initial changes)
  useEffect(() => {
    // Update docNo if initial changes
    if (initial?.docNo) {
      setDocNo(initial.docNo);
    }
    
    // Update docDate if initial changes
    if (initial?.docDate) {
      setDocDate(String(initial.docDate));
    }
    
    // Update remarks if initial changes
    if (initial?.remarks !== undefined) {
      setRemarks(String(initial.remarks));
    }
    
    // Set customer from initial if provided
    if (initial?.customer) {
      if (typeof initial.customer === "object" && "name" in initial.customer) {
        setCustomerId(initial.customer.name ?? "");
      } else if (typeof initial.customer === "string") {
        setCustomerId(initial.customer);
      }
    }
    
    if (
      initial?.items &&
      Array.isArray(initial.items) &&
      initial.items.length > 0
    ) {
      setItems(
        (initial.items as LineItem[]).map((it) => ({
          _id:
            it._id ??
            products.find((p) => p.itemName === it.itemName)?._id ??
            "",
          itemName: it.itemName ?? "",
          invoiceNumber: it._id ?? generateId(),
          quantity: Number(it.quantity ?? 0),
          salesRate: Number(it.salesRate ?? it.salesRate ?? 0),
          discount: it.discount ?? 0,
          amount:
            Number(it.quantity ?? 0) *
            Number(it.salesRate ?? it.salesRate ?? 0),
          price: it.salesRate ?? 0,
         
          totalGrossAmount: it.totalGrossAmount ?? 0,
          totalNetAmount: it.totalNetAmount ?? 0,
          discountAmount: it.discountAmount ?? 0,
        }))
      );
    } else if (
      initial?.products &&
      Array.isArray(initial.products) &&
      initial.products.length > 0
    ) {
      setItems(
        (initial.products as LineItem[]).map((it) => ({
          _id:
            it._id ??
            products.find((p) => p.itemName === it.itemName)?._id ??
            "",
          itemName: it.itemName ?? "",
          invoiceNumber: it._id ?? generateId(),
          quantity: Number(it.quantity ?? 0),
          salesRate: Number(it.salesRate ?? it.salesRate ?? 0),
          discount: it.discount ?? 0,
          amount:
            Number(it.quantity ?? 0) *
            Number(it.salesRate ?? it.salesRate ?? 0),
          price: it.salesRate ?? 0,
         
          totalGrossAmount: it.totalGrossAmount ?? 0,
          totalNetAmount: it.totalNetAmount ?? 0,
          discountAmount: it.discountAmount ?? 0,
        }))
      );
    } else {
      setItems([
        {
          _id: generateId(),
          itemName: "",
          quantity: 1,
          salesRate: 0,
          discount: 0,
          amount: 0,
        
          totalGrossAmount: 0,
          totalNetAmount: 0,
          discountAmount: 0,
        },
      ]);
    }
  }, [initial]);

  const status = mode === "Quotation" ? "Draft" : "Confirmed";

  const totals = useMemo(() => {
    // gross = sum(amount) where amount = length * quantity * rate
    const totalGrossAmount = items.reduce(
      (s, i) => s + (typeof i.amount === "number" ? i.amount : 0),
      0
    );
    // discounts sum
    const totalDiscountAmount = items.reduce(
      (s, i) => s + (i.discountAmount ?? i.discount ?? 0),
      0
    );
    // subtotal (for display) — keep it as gross minus discounts? We'll show both
    const sub = totalGrossAmount - totalDiscountAmount;
    // net = sub (no tax/GST per request)
    const totalNetAmount = sub;
    return {
      sub,
      totalGrossAmount,
      totalDiscountAmount,
      totalNetAmount,
      // keep legacy fields for compatibility
      tax: 0,
      total: totalNetAmount,
    } as unknown as { sub: number; tax: number; total: number } & {
      totalGrossAmount: number;
      totalDiscountAmount: number;
      totalNetAmount: number;
    };
  }, [items]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => String(c._id) === String(customerId)),
    [customers, customerId]
  );

  // No default customer selection; field remains empty unless user selects

  // If initial.docNo changes (e.g., pre-filled by parent), sync it into local state
  useEffect(() => {
    if (initial?.docNo && initial.docNo !== docNo) {
      setDocNo(String(initial.docNo));
    }
  }, [initial?.docNo, docNo]);

  // When the parent provides a full initial payload (e.g., for editing),
  // sync the relevant fields into local state so the form is pre-filled.
  useEffect(() => {
    if (!initial) return;
    // Only update all local state when initial changes
    setDocNo(initial.docNo ?? "");
    setDocDate(
      initial.docDate
        ? String(initial.docDate)
        : new Date().toISOString().slice(0, 10)
    );

    setCustomerId(
      initial.customer?.id !== undefined && initial.customer?.id !== null
        ? String(initial.customer.id)
        : customers.length > 0
        ? String(customers[0]._id)
        : ""
    );
    setRemarks(typeof initial.remarks === "string" ? initial.remarks : "");
    setTerms(
      typeof initial.terms === "string"
        ? initial.terms
        : "Prices valid for 15 days.\nPayment terms: Due on receipt."
    );
    if (initial.items && Array.isArray(initial.items)) {
      setItems(
        (initial.items as LineItem[]).map((it) => ({
          _id:
            it._id ??
            products.find((p) => p.itemName === it.itemName)?._id ??
            "",
          itemName: it.itemName ?? "",
          invoiceNumber: it._id ?? generateId(),
        
          quantity: Number(it.quantity ?? 0),
          salesRate: Number(it.salesRate ?? it.salesRate ?? 0),
          discount: it.discount ?? 0,
          amount:
            Number(it.quantity ?? 0) *
            Number(it.salesRate ?? it.salesRate ?? 0),
          price: it.salesRate ?? 0,
       
          openingStock: it.openingStock ?? 0,
      
        
          totalGrossAmount: it.totalGrossAmount ?? 0,
          totalNetAmount: it.totalNetAmount ?? 0,
          discountAmount: it.discountAmount ?? 0,
        }))
      );
    } else if (initial.products && Array.isArray(initial.products)) {
      setItems(
        (initial.products as LineItem[]).map((it) => ({
          _id:
            it._id ??
            products.find((p) => p.itemName === it.itemName)?._id ??
            "",
          itemName: it.itemName ?? "",
          invoiceNumber: it._id ?? generateId(),
         
          quantity: Number(it.quantity ?? 0),
          salesRate: Number(it.salesRate ?? it.salesRate ?? 0),
          discount: it.discount ?? 0,
          amount:
            Number(it.quantity ?? 0) *
            Number(it.salesRate ?? it.salesRate ?? 0),
          price: it.salesRate ?? 0,
       
          openingStock: it.openingStock ?? 0,
        
          totalGrossAmount: it.totalGrossAmount ?? 0,
          totalNetAmount: it.totalNetAmount ?? 0,
          discountAmount: it.discountAmount ?? 0,
        }))
      );
    } else {
      setItems([
        {
          _id: generateId(),
          itemName: "",
   
          quantity: 1,
          salesRate: 0,
          discount: 0,
          amount: 0,
  
          openingStock: 0,
     
        
          totalGrossAmount: 0,
          totalNetAmount: 0,
          discountAmount: 0,
        },
      ]);
    }
  }, [initial, customers]);

  const [submitLocked, setSubmitLocked] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    console.log("=== SalesDocShell handleSubmit called ===");
    e.preventDefault();
    if (submitting || submitLocked || saveDisabled) {
      console.log("Submit blocked:", {
        submitting,
        submitLocked,
        saveDisabled,
      });
      return;
    }
    setSubmitting(true);
    setSubmitLocked(true);
    const payload: SalesPayload = {
      mode,
      docNo,
      docDate,
      customer: selectedCustomer
        ? {
            id: selectedCustomer._id,
            name: selectedCustomer.name,
            address: selectedCustomer.address,
            city: selectedCustomer.city,
            openingAmount: selectedCustomer.openingAmount,
            paymentType: selectedCustomer.paymentType,
          }
        : undefined,
      products: items.map((item) => ({
        ...item,
        _id: String(item._id ?? generateId()),
      })),
      items: items.map((item) => ({
        ...item,
        _id: String(item._id ?? generateId()),
      })),
      totals: {
        subTotal: totals.sub,
        total: totals.total ?? totals.totalNetAmount,
        totalGrossAmount: totals.totalGrossAmount,
        totalDiscountAmount: totals.totalDiscountAmount,
        totalNetAmount: totals.totalNetAmount,
        amount: totals.total ?? totals.totalNetAmount,
      },
      remarks,
      terms,
    };
    console.log("[SalesDocShell] selectedCustomer:", selectedCustomer);
    console.log("[SalesDocShell] payload:", payload);
    console.log("[SalesDocShell] Calling onSubmit with payload");
    const maybePromise = onSubmit?.(payload);
    Promise.resolve(maybePromise).finally(() => {
      setSubmitting(false);
      setSubmitLocked(false);
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card w={"100%"}>
        <Card.Section
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: 12,
          }}
        >
          <div>
            <Text style={{ fontSize: 18, fontWeight: 700 }}>{mode}</Text>
            <Text style={{ color: "#666" }}>Enter details and add items</Text>
          </div>
          <Badge variant="outline">{status}</Badge>
        </Card.Section>

        <Card.Section style={{ padding: 12 }}>
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(3, 1fr)",
            }}
          >
            <div>
              <Text style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                {mode} No.
              </Text>
              <TextInput
                id="docNo"
                value={docNo}
                onChange={(e) => setDocNo(e.target.value)}
                placeholder={`${mode === "Quotation" ? "QUO" : "INV"}-2025-001`}
              />
            </div>
            <div>
              <Text style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                {mode} Date
              </Text>
              <TextInput
                id="docDate"
                type="date"
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
              />
            </div>
            {mode === "Quotation" ? (
              <div>
                <Text
                  style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}
                >
                  Valid Until
                </Text>
              </div>
            ) : (
              <div>
                <Text
                  style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}
                >
                  Payment Method
                </Text>
                <Select data={["Cash", "Card"]} defaultValue="Cash" />
              </div>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(2, 1fr)",
              marginTop: 12,
            }}
          >
            <div>
              <Text style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                Customer
              </Text>
              <Select
                value={String(customerId)}
                onChange={(v) => setCustomerId(String(v ?? ""))}
                data={customers
                  .filter((c) => c._id && c.name)
                  .map((c) => ({
                    value: String(c._id),
                    label: `${c.name} — ${c.city ?? ""}`,
                  }))}
                clearable
              />
            </div>
            <div>
              <Text style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                Customer Details
              </Text>
              {selectedCustomer ? (
                <Paper
                  withBorder
                  style={{ padding: 12, boxShadow: "var(--mantine-shadow-xs)" }}
                >
                  <div style={{ fontWeight: 700 }}>{selectedCustomer.name}</div>
                  <div style={{ color: "#666", marginTop: 6 }}>
                    {selectedCustomer.address}
                  </div>
                  <div style={{ marginTop: 8, display: "flex", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, color: "#888" }}>
                        Opening Amount
                      </div>
                      <div style={{ fontWeight: 600 }}>
                        {formatCurrency(selectedCustomer.openingAmount ?? 0)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "#888" }}>
                        Payment Type
                      </div>
                      <div style={{ fontWeight: 700 }}>
                        {selectedCustomer.paymentType === "Debit"
                          ? "Debit"
                          : "Credit"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "#888" }}>
                        Credit/Debit
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          color:
                            selectedCustomer.paymentType === "Debit"
                              ? "red"
                              : "green",
                        }}
                      >
                        {(selectedCustomer.openingAmount ?? 0) > 0
                          ? `${
                              selectedCustomer.paymentType === "Debit"
                                ? "Debit"
                                : "Credit"
                            } ${formatCurrency(
                              selectedCustomer.openingAmount ?? 0
                            )}`
                          : "Nil"}
                      </div>
                    </div>
                  </div>
                </Paper>
              ) : (
                <Textarea readOnly value={""} minRows={4} />
              )}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            {/* Supplier label for selected product (first item) */}
            {items &&
              items.length > 0 &&
              (() => {
                const item = items[0];
                const product = products.find(
                  (p) => p.itemName === item.itemName || p._id === item._id
                );
                let supplier = "";
                if (product) {
                  const customProduct = product as any;
                  if (customProduct.supplier) {
                    if (typeof customProduct.supplier === "string")
                      supplier = customProduct.supplier;
                    else if (
                      typeof customProduct.supplier === "object" &&
                      customProduct.supplier.name
                    )
                      supplier = customProduct.supplier.name;
                  }
                  if (!supplier && customProduct.supplierName)
                    supplier = customProduct.supplierName;
                }
                return supplier ? (
                  <Badge color="green" variant="filled" mb={8}>
                    Supplier: {supplier}
                  </Badge>
                ) : null;
              })()}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: 600 }}>Items</Text>
              <Button
                size="xs"
                variant="outline"
                onClick={() =>
                  setItems((prev) => [
                    ...prev,
                    {
                      invoiceNumber: generateId(),
                      itemName: "",
                      unit: "",
                      quantity: 1,
                      salesRate: 0,
                      discount: 0,
                      amount: 0,
                      price: 0,
                      color: "",
                      openingStock: 0,
                      thickness: 0,
                      length: 0,
                      totalGrossAmount: 0,
                      totalNetAmount: 0,
                      discountAmount: 0,
                    },
                  ])
                }
              >
                Add item
              </Button>
            </div>
            <LineItemsTable
              items={items}
              onChange={setItems}
              products={products}
            />
          </div>

          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(2, 1fr)",
              marginTop: 16,
            }}
          >
            <div>
              <Text style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                Remarks
              </Text>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.currentTarget.value)}
                minRows={3}
                placeholder="Additional notes"
              />
            </div>
          </div>
        </Card.Section>

        <Card.Section
          style={{
            padding: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{ fontSize: 13, color: "var(--mantine-color-dimmed, #666)" }}
          >
            Date: {new Date(docDate).toLocaleDateString()} • Customer Balance:{" "}
            {selectedCustomer?.paymentType === "Debit" ? "-" : ""}
            {Number(selectedCustomer?.openingAmount ?? 0).toLocaleString()}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "#888" }}>Subtotal</div>
            <div style={{ fontSize: 14 }}>{totals.sub.toFixed(2)}</div>

            <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>
              Total Gross Amount
            </div>
            <div style={{ fontSize: 14 }}>
              {totals.totalGrossAmount.toFixed(2)}
            </div>

            <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>
              Total Discount Amount
            </div>
            <div style={{ fontSize: 14 }}>
              {totals.totalDiscountAmount.toFixed(2)}
            </div>

            <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>
              Total Net Amount
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {totals.totalNetAmount.toFixed(2)}
            </div>
          </div>
        </Card.Section>
      </Card>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 12,
        }}
      >
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            try {
              const data: InvoiceData = {
                title: mode === "Invoice" ? "Sales Invoice" : "Quotation",
                companyName: "Ultra Water Technologies",
                addressLines: [],
                invoiceNo: docNo,
                date: docDate,
                ms: selectedCustomer?.name ?? undefined,
                customer: selectedCustomer?.name ?? undefined,
                grn: null,
                items: items,
                totals: {
                  subtotal: totals.sub,
                  total: totals.total ?? totals.totalNetAmount,
                },
              };
              openPrintWindow(data);
            } catch (err) {
              console.error("Failed to open print preview", err);
              window.print();
            }
          }}
        >
          Print
        </Button>
        <Button
          type="submit"
          disabled={saveDisabled || submitting}
          onClick={() =>
            console.log("=== Save button clicked ===", {
              saveDisabled,
              submitting,
            })
          }
        >
          Save {mode}
        </Button>
      </div>
    </form>
  );
}
