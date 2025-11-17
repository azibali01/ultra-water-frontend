import React, { useState } from "react";
import { PurchaseInvoiceForm } from "./PurchaseInvoiceForm.generated";
import {
  Button,
  Card,
  Modal,
  Table,
  TextInput,
  Title,
  Text,
  Menu,
  ActionIcon,
} from "@mantine/core";
import {
  IconEdit,
  IconPlus,
  IconPrinter,
  IconTrash,
} from "@tabler/icons-react";
import type { Supplier } from "../../../components/purchase/SupplierForm";
import { useDataContext } from "../../Context/DataContext";
import { formatDate, formatCurrency } from "../../../lib/format-utils";
import openPrintWindow from "../../../components/print/printWindow";
// Helper to format invoice data for printing

function getInvoicePrintData(inv: PurchaseInvoiceTableRow) {
  return {
    title: "Purchase Invoice",
    companyName: "Ultra Water Technologies",
    addressLines: [],
    invoiceNo: String(inv.purchaseInvoiceNumber),
    date: String(inv.invoiceDate),
    customer: inv.supplier?.name || "",
    items: (inv.products || []).map((it, idx) => ({
      sr: idx + 1,
      itemName: `${it.productName}`,
      section: `${it.productName}`,
      description: `${it.productName}`,
      qty: it.quantity,
      quantity: it.quantity,
      rate: Number(it.rate ?? 0),
      salesRate: Number(it.rate ?? 0),
      amount: Number(it.amount ?? (it.quantity || 0) * (it.rate || 0)),
    })),
    totals: {
      subtotal: inv.subTotal ?? inv.total,
      total: inv.total,
      totalGrossAmount: inv.totalGrossAmount ?? inv.subTotal ?? inv.total,
      totalDiscountAmount: inv.totalDiscount ?? 0,
      totalNetAmount: inv.totalNetAmount ?? inv.total,
    },
  };
}
import { createPurchaseInvoice, getPurchaseInvoices } from "../../../lib/api";

import type { PurchaseLineItem } from "./types";

// Define the payload type for handleCreate
export type PurchaseInvoiceFormPayload = {
  purchaseInvoiceNumber: string;
  invoiceDate: string | Date;
  expectedDelivery?: string | Date;
  supplierId?: string;
  products?: PurchaseLineItem[];
  subTotal?: number;
  total?: number;
  status?: string;
  remarks?: string;
};

// Define the table row type for purchase invoices
export type PurchaseInvoiceTableRow = {
  id: string;
  purchaseInvoiceNumber: string;
  invoiceDate: string | Date;
  expectedDelivery?: string | Date;
  supplier?: import("../../../components/purchase/SupplierForm").Supplier;
  products: PurchaseLineItem[];
  subTotal: number;
  total: number;
  amount: number;
  totalGrossAmount?: number;
  totalDiscount?: number;
  totalNetAmount?: number;
  status?: string;
  remarks?: string;
  createdAt?: Date;
};

// No longer needed, use generated form directly

export default function PurchaseInvoicesPage() {
  // ...existing code...

  // All hooks and state declarations above

  // Place useEffect after all hooks, before return

  const { suppliers, inventory, purchases, loadInventory, setInventory } = useDataContext();

  // Ensure products (inventory) are loaded on mount
  React.useEffect(() => {

    if (!inventory || inventory.length === 0) {
      loadInventory();
    }
  }, [inventory, loadInventory]);
  const [data, setData] = useState<PurchaseInvoiceTableRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Import from PO modal state
  const [importOpen, setImportOpen] = useState(false);
  const [importPOSearch, setImportPOSearch] = useState("");
  const [initialPayload, setInitialPayload] =
    useState<PurchaseInvoiceFormPayload | null>(null);

  // Auto-generate next invoice number in format PINV-0001, PINV-0002, ...
  function getNextInvoiceNumber(): string {
    // Find max number in data
    const prefix = "PINV-";
    let max = 0;
    data.forEach((inv) => {
      const match = String(inv.purchaseInvoiceNumber).match(/^PINV-(\d{4})$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > max) max = num;
      }
    });
    const next = (max + 1).toString().padStart(4, "0");
    return `${prefix}${next}`;
  }
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [editInvoice, setEditInvoice] =
    useState<PurchaseInvoiceTableRow | null>(null);

  // Type guard for supplierId
  function hasSupplierId(obj: unknown): obj is { supplierId: string } {
    return (
      typeof obj === "object" &&
      obj !== null &&
      "supplierId" in obj &&
      typeof (obj as { supplierId?: unknown }).supplierId === "string"
    );
  }

  // Robust supplier resolution (copied from PurchaseOrder.tsx)
  const resolveSupplier = React.useCallback(
    (invSupplier: unknown, inv?: Partial<PurchaseInvoiceTableRow>) => {
      let supplier: Supplier | undefined = undefined;
      if (
        invSupplier &&
        typeof invSupplier === "object" &&
        "_id" in invSupplier &&
        typeof (invSupplier as { _id?: unknown })._id === "string"
      ) {
        supplier = suppliers?.find(
          (s) => s._id === (invSupplier as { _id: string })._id
        );
      } else if (inv && hasSupplierId(inv)) {
        supplier = suppliers?.find((s) => s._id === inv.supplierId);
      }
      if (
        !supplier &&
        invSupplier &&
        typeof invSupplier === "object" &&
        "name" in invSupplier
      ) {
        supplier = invSupplier as Supplier;
      }
      return supplier;
    },
    [suppliers]
  );

  // Load purchase invoices on mount
  React.useEffect(() => {
    if (!suppliers || suppliers.length === 0) return;
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const invoices = await getPurchaseInvoices();
        if (!mounted) return;

        setData(
          (invoices || []).map(
            (inv: PurchaseInvoiceTableRow & { supplierId?: string }) => {
              // Always use the mapped supplier from the array, never fallback to raw object
              const supplier = resolveSupplier(inv.supplier, inv);
              // Hydrate productName for each product line item
              const products = (inv.products || []).map((item) => {
                if (item.productName) return item;
                let found = undefined;
                if (item.id && inventory) {
                  found = inventory.find((p) => p._id === item.id);
                }
                return {
                  ...item,
                  productName: found?.itemName || item.productName || "",
                };
              });
              return {
                id: inv.id || inv.purchaseInvoiceNumber || crypto.randomUUID(),
                purchaseInvoiceNumber: inv.purchaseInvoiceNumber,
                invoiceDate: inv.invoiceDate,
                expectedDelivery: inv.expectedDelivery,
                supplier,
                products,
                subTotal: inv.subTotal ?? 0,
                total: inv.total ?? 0,
                amount: inv.amount ?? inv.total ?? 0,
                status: inv.status,
                remarks: inv.remarks,
                createdAt: inv.createdAt,
              };
            }
          )
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [suppliers, inventory, resolveSupplier]);

  async function handleCreate(payload: PurchaseInvoiceFormPayload) {
    const products = (payload.products || []) as PurchaseLineItem[];
    const subTotal =
      payload.subTotal ?? products.reduce((s, it) => s + (it.amount || 0), 0);
    const total = payload.total ?? subTotal;
    const supplier = suppliers?.find((s) => s._id === payload.supplierId);
    let expectedDelivery: Date | undefined = undefined;
    if (payload.expectedDelivery) {
      expectedDelivery =
        typeof payload.expectedDelivery === "string"
          ? new Date(payload.expectedDelivery)
          : payload.expectedDelivery;
    }
    // The backend expects purchaseInvoiceNumber and invoiceDate for invoices, not poNumber/poDate
    const invoicePayload = {
      ...payload,
      expectedDelivery,
      supplier,
      products,
      subTotal,
      total,
      remarks: payload.remarks,
    };
    await createPurchaseInvoice(invoicePayload);
    // Optimistically increment inventory locally for each purchased item
    try {
      setInventory((prev = []) =>
        (prev || []).map((inv: any) => {
          const match = (products || []).find((it) => {
            const key = String(it.id ?? it.productName ?? "");
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
          const nextQty = current + qty;
          return {
            ...inv,
            openingStock: nextQty,
            stock: nextQty,
          };
        })
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("Failed to optimistically update inventory after purchase invoice:", err);
    }
    // Refresh inventory after creating purchase invoice so stock reflects received quantities
    try {
      await loadInventory();
    } catch (err) {
      // non-fatal; inventory reload failed
      // eslint-disable-next-line no-console
      console.warn("Failed to reload inventory after creating purchase invoice:", err);
    }
    setOpen(false);
    setEditInvoice(null);
    // Refresh the list after creating a purchase invoice
    const invoices = await getPurchaseInvoices();
    setData(
      (invoices || []).map(
        (inv: PurchaseInvoiceTableRow & { supplierId?: string }) => {
          const supplier = resolveSupplier(inv.supplier, inv);
          return {
            id: inv.id || inv.purchaseInvoiceNumber || crypto.randomUUID(),
            purchaseInvoiceNumber: inv.purchaseInvoiceNumber,
            invoiceDate: inv.invoiceDate,
            expectedDelivery: inv.expectedDelivery,
            supplier,
            products: inv.products,
            subTotal: inv.subTotal ?? 0,
            total: inv.total ?? 0,
            amount: inv.amount ?? inv.total ?? 0,
            status: inv.status,
            remarks: inv.remarks,
            createdAt: inv.createdAt,
          };
        }
      )
    );
  }

  // function handleCreateSync(payload: Partial<PurchaseInvoiceTableRow>) {
  //   void handleCreate(fromPOFormPayload(payload));
  // }

  // Prefill all fields for edit modal, normalizing supplier and products
  const initialValues = React.useMemo(() => {
    if (!editInvoice) return {};
    // Use robust supplier resolution for edit modal
    const supplier = resolveSupplier(editInvoice.supplier, editInvoice);
    // Products: just pass through, or you can normalize further if you have inventory context
    const products = editInvoice.products ? [...editInvoice.products] : [];
    return {
      ...editInvoice,
      supplier,
      products,
      expectedDelivery:
        editInvoice.expectedDelivery instanceof Date
          ? editInvoice.expectedDelivery
          : editInvoice.expectedDelivery
          ? new Date(editInvoice.expectedDelivery)
          : undefined,
      invoiceDate:
        editInvoice.invoiceDate instanceof Date
          ? editInvoice.invoiceDate
          : editInvoice.invoiceDate
          ? new Date(editInvoice.invoiceDate)
          : undefined,
    };
  }, [editInvoice, resolveSupplier]);
  const defaultInvoiceNumber = editInvoice
    ? editInvoice.purchaseInvoiceNumber
    : getNextInvoiceNumber();

  // Main return: modal + table
  // Add Action column and menu like PurchaseOrder.tsx
  // Add delete modal state
  const [deleteInvoice, setDeleteInvoice] =
    useState<PurchaseInvoiceTableRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  // import Menu, ActionIcon from Mantine
  // ...existing code...
  return (
    <div>
      {/* Add Purchase Invoice Modal */}
      <Modal
        opened={open && !initialPayload}
        onClose={() => {
          setOpen(false);
          setEditInvoice(null);
        }}
        size="90%"
      >
        <PurchaseInvoiceForm
          onSubmit={handleCreate}
          initialValues={initialValues}
          defaultInvoiceNumber={defaultInvoiceNumber}
        />
      </Modal>

      {/* Import from PO Modal */}
      <Modal
        opened={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import from Purchase Order"
        size="80%"
      >
    <div style={{ padding: 12 }}>
          <h3>Purchase Orders</h3>
          <div style={{ marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Search by PO Number..."
              value={importPOSearch || ""}
              onChange={(e) => setImportPOSearch(e.target.value)}
              style={{
                padding: 6,
                width: 260,
                border: "1px solid #1976d2",
                borderRadius: 4,
                outline: "none",
                backgroundColor: "#f9f9f9",
                color: "#222",
              }}
              aria-label="Search by Purchase Order Number"
              tabIndex={0}
            />
          </div>
          {(purchases || [])
            .filter((po) => {
              const term = importPOSearch.trim().toLowerCase();
              if (!term) return true;
              return (
                String(po.poNumber).toLowerCase().includes(term) ||
                String(po.supplier?.name || "")
                  .toLowerCase()
                  .includes(term)
              );
            }).length === 0 && <div>No purchase orders found</div>}
          <div style={{ display: "grid", gap: 8 }}>
            {(purchases || [])
              .filter((po) => {
                const term = importPOSearch.trim().toLowerCase();
                if (!term) return true;
                return (
                  String(po.poNumber).toLowerCase().includes(term) ||
                  String(po.supplier?.name || "")
                    .toLowerCase()
                    .includes(term)
                );
              })
              .map((po, idx) => (
                  <div
                    key={po.poNumber ?? `po-${idx}`}
                    style={{
                      padding: 12,
                      border: "1px solid #1976d2",
                      borderRadius: 6,
                      background: "#fff",
                    }}
                    tabIndex={0}
                    aria-label={`Purchase Order ${po.poNumber}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setInitialPayload({
                          purchaseInvoiceNumber: getNextInvoiceNumber(),
                          invoiceDate: new Date().toISOString(),
                          supplierId: po.supplier?._id,
                          products: (po.products || []).map((item) => ({
                            ...item,
                            productId: item.id ?? "",
                            unit: "pcs",
                            grossAmount: item.amount ?? 0,
                            netAmount: item.amount ?? 0,
                          })),
                          subTotal: po.subTotal ?? 0,
                          total: po.total ?? 0,
                          remarks: po.remarks ?? "",
                        });
                        setImportOpen(false);
                        setOpen(true);
                      }
                    }}
                  >
                    <div
                      style={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <div>
                        <div style={{ fontWeight: 700 }}>{po.poNumber}</div>
                        <div style={{ color: "#333" }}>
                          Date: {po.poDate ? new Date(po.poDate).toLocaleDateString() : ""}
                        </div>
                        <div style={{ color: "#333" }}>
                          Supplier: {po.supplier?.name || ""}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, color: "#1976d2" }}>
                          {po.products?.length || 0} items
                        </div>
                        <div style={{ fontWeight: 700 }}>
                          {formatCurrency(po.total ?? 0)}
                        </div>
                      </div>
                    </div>
                    {/* ...items table, remarks, and import button as in previous logic... */}
                    <div
                      style={{
                        marginTop: 8,
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <Button
                        size="xs"
                        onClick={() => {
                          setInitialPayload({
                            purchaseInvoiceNumber: getNextInvoiceNumber(),
                            invoiceDate: new Date().toISOString(),
                            supplierId: po.supplier?._id,
                            products: (po.products || []).map((item) => ({
                              ...item,
                              productId: item.id ?? "",
                              unit: "pcs",
                              grossAmount: item.amount ?? 0,
                              netAmount: item.amount ?? 0,
                            })),
                            subTotal: po.subTotal ?? 0,
                            total: po.total ?? 0,
                            remarks: po.remarks ?? "",
                          });
                          setImportOpen(false);
                          setOpen(true);
                        }}
                        aria-label={`Import Purchase Order ${po.poNumber}`}
                        style={{ backgroundColor: '#1976d2', color: '#fff' }}
                      >
                        Import
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
  {/* End Modal Content */}
        </div>
      </Modal>

      {/* Import from PO - Create Invoice Modal */}
      {initialPayload && (
        <Modal
          opened={open && !!initialPayload}
          onClose={() => {
            setOpen(false);
            setInitialPayload(null);
          }}
          title={`Create Invoice from PO: ${initialPayload.purchaseInvoiceNumber}`}
          size="90%"
        >
          <PurchaseInvoiceForm
            onSubmit={handleCreate}
            initialValues={{
              ...initialPayload,
              invoiceDate:
                initialPayload.invoiceDate instanceof Date
                  ? initialPayload.invoiceDate
                  : initialPayload.invoiceDate
                  ? new Date(initialPayload.invoiceDate)
                  : undefined,
              expectedDelivery: !initialPayload.expectedDelivery
                ? undefined
                : initialPayload.expectedDelivery instanceof Date
                ? initialPayload.expectedDelivery
                : new Date(initialPayload.expectedDelivery),
            }}
            defaultInvoiceNumber={initialPayload.purchaseInvoiceNumber}
          />
        </Modal>
      )}

      <div style={{ marginTop: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Title order={2}>Purchase Invoices</Title>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              onClick={() => setImportOpen(true)}
              variant="filled"
              size="sm"
            >
              Import from Purchase Order
            </Button>
            <TextInput
              placeholder="Search invoices..."
              value={q}
              onChange={(e) => setQ(e.currentTarget.value)}
              style={{ width: 260 }}
            />
            <Button
              onClick={() => setOpen(true)}
              leftSection={<IconPlus size={16} />}
            >
              Create Invoice
            </Button>
          </div>
        </div>
        <Card>
          <div style={{ padding: 12 }}>
            <Title order={4}>Recent Purchase Invoices</Title>
            <Text color="dimmed">Last {data.length} purchase invoices</Text>
            <div style={{ marginTop: 12, overflowX: "auto" }}>
              <Table
                withRowBorders
                withColumnBorders
                highlightOnHover
                withTableBorder
              >
                {loading && (
                  <tbody>
                    <tr>
                      <td
                        colSpan={5}
                        style={{ textAlign: "center", padding: 24 }}
                      >
                        Loading invoices...
                      </td>
                    </tr>
                  </tbody>
                )}
                <Table.Thead bg={"gray.1"}>
                  <Table.Tr>
                    <Table.Th>Number</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Supplier</Table.Th>
                    <Table.Th style={{ textAlign: "right" }}>Total</Table.Th>
                    <Table.Th style={{ textAlign: "right" }}>Action</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data
                    .filter((inv) => {
                      const term = q.trim().toLowerCase();
                      if (!term) return true;
                      return (
                        String(inv.purchaseInvoiceNumber)
                          .toLowerCase()
                          .includes(term) ||
                        String(inv.supplier?.name || "")
                          .toLowerCase()
                          .includes(term)
                      );
                    })
                    .map((inv) => (
                      <Table.Tr key={inv.id} tabIndex={0} aria-label={`Invoice ${inv.purchaseInvoiceNumber} for ${inv.supplier?.name || ''}`}> 
                        <Table.Td style={{ fontFamily: "monospace" }}>
                          {inv.purchaseInvoiceNumber}
                        </Table.Td>
                        <Table.Td>{formatDate(inv.invoiceDate)}</Table.Td>
                        <Table.Td>{inv.supplier?.name || ""}</Table.Td>
                        <Table.Td style={{ textAlign: "right" }}>
                          {formatCurrency(inv.total)}
                        </Table.Td>
                        <Table.Td style={{ textAlign: "right" }}>
                          {/* Action menu */}
                          <Menu position="bottom-end" withArrow width={200}>
                            <Menu.Target>
                              <ActionIcon variant="subtle" color="gray" aria-label={`Actions for invoice ${inv.purchaseInvoiceNumber}`} tabIndex={0}>
                                <span style={{ fontWeight: 600, fontSize: 18 }}>
                                  ⋮
                                </span>
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item
                                onClick={() => {
                                  setEditInvoice(inv);
                                  setOpen(true);
                                }}
                                leftSection={<IconEdit size={14} />}
                              >
                                Edit
                              </Menu.Item>
                              <Menu.Item
                                onClick={() => {
                                  const d = getInvoicePrintData(inv);
                                  openPrintWindow(d);
                                }}
                                leftSection={<IconPrinter size={14} />}
                              >
                                Print
                              </Menu.Item>
                              <Menu.Item
                                color="red"
                                onClick={() => setDeleteInvoice(inv)}
                                leftSection={<IconTrash size={14} />}
                              >
                                Delete
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                </Table.Tbody>
              </Table>
            </div>
          </div>
        </Card>
      </div>
      {/* Confirm Delete Modal (should only render once, outside the table and menu) */}
      <Modal
        opened={!!deleteInvoice}
        onClose={() => setDeleteInvoice(null)}
        title="Confirm Delete"
        centered
        withCloseButton
      >
        <Text>
          Are you sure you want to delete Purchase Invoice{" "}
          <b>{deleteInvoice?.purchaseInvoiceNumber}</b>?
        </Text>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 16,
            gap: 8,
          }}
        >
          <Button
            variant="default"
            onClick={() => setDeleteInvoice(null)}
            disabled={deleteLoading}
            style={{ color: '#222', backgroundColor: '#f3f3f3', border: '1px solid #ccc' }}
            aria-label="Cancel Delete Invoice"
          >
            Cancel
          </Button>
          <Button
            color="red"
            loading={deleteLoading}
            onClick={async () => {
              if (!deleteInvoice) return;
              setDeleteLoading(true);
              try {
                if (!deleteInvoice) return;
                await import("../../../lib/api").then(async (api) => {
                  await api.deletePurchaseInvoiceByNumber(
                    deleteInvoice.purchaseInvoiceNumber
                  );
                });
                setDeleteInvoice(null);
                // Refresh the list after deleting a purchase invoice
                getPurchaseInvoices().then((invoices) => {
                  setData(
                    (invoices || []).map((inv: PurchaseInvoiceTableRow) => {
                      let supplier: Supplier | undefined = undefined;
                      if (
                        inv.supplier &&
                        typeof inv.supplier === "object" &&
                        "_id" in inv.supplier &&
                        typeof (inv.supplier as { _id?: unknown })._id ===
                          "string"
                      ) {
                        supplier = suppliers?.find(
                          (s) => s._id === (inv.supplier as { _id: string })._id
                        );
                      }
                      if (
                        !supplier &&
                        inv.supplier &&
                        typeof inv.supplier === "object" &&
                        "name" in inv.supplier
                      ) {
                        supplier = inv.supplier as Supplier;
                      }
                      return {
                        id:
                          inv.id ||
                          inv.purchaseInvoiceNumber ||
                          crypto.randomUUID(),
                        purchaseInvoiceNumber: inv.purchaseInvoiceNumber,
                        invoiceDate: inv.invoiceDate,
                        expectedDelivery: inv.expectedDelivery,
                        supplier,
                        products: inv.products || [],
                        subTotal: inv.subTotal ?? 0,
                        total: inv.total ?? 0,
                        amount: inv.amount ?? inv.total ?? 0,
                        status: inv.status,
                        remarks: inv.remarks,
                        createdAt: inv.createdAt,
                      };
                    })
                  );
                });
                // showNotification({ title: "Deleted", message: `Purchase Invoice ${deleteInvoice.purchaseInvoiceNumber} deleted`, color: "red" });
              } catch {
                // let msg = "Failed to delete purchase invoice.";
                // showNotification({ title: "Error", message: msg, color: "red" });
              } finally {
                setDeleteLoading(false);
              }
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
