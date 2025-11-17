import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  Group,
  ScrollArea,
  Text,
  Title,
  // Badge, // removed unused import
  Modal,
  Menu,
  ActionIcon,
} from "@mantine/core";
import Table from "../../../lib/AppTable";
import {
  IconPlus,
  IconDotsVertical,
  IconPrinter,
  IconTrash,
  IconFile,
} from "@tabler/icons-react";

// openPrintWindow already imported above
import type { InvoiceData } from "../../../components/print/printTemplate";
import { useDataContext } from "../../Context/DataContext";
// SaleRecord type not used in this file anymore
import SalesDocShell, {
  type SalesPayload,
} from "../../../components/sales/SalesDocShell";
// import ProductMaster from "../Products/ProductMaster";
import { showNotification } from "@mantine/notifications";
import {
  createQuotation,
  updateQuotationByNumber,
  deleteQuotationByNumber,
  type QuotationRecordPayload,
  type InventoryItemPayload,
  type CustomerPayload,
} from "../../../lib/api";

// Use LineItem type for strict item mapping
export type LineItem = {
  _id?: string | number;
  itemName?: string;
  discount?: number;
  discountAmount?: number;
  salesRate?: number;
  quantity?: number;
  amount: number;
  length?: number;
  totalGrossAmount: number;
  totalNetAmount: number;
};
import openPrintWindow, {
  downloadInvoicePdf,
} from "../../../components/print/printWindow";

function Quotation() {
  const {
    sales,
    quotations,
    setQuotations,
    loadSales,
    loadQuotations,
    customers,
    loadCustomers,
    loadInventory,
    inventory,
  } = useDataContext();

  // Local UI state
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [initialPayload, setInitialPayload] = useState<
    Partial<SalesPayload> | null
  >(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteTargetDisplay, setDeleteTargetDisplay] = useState<
    string | null
  >(null);

  // Products are always sourced from DataContext inventory, which ProductMaster keeps in sync.

  // Only run data loading on initial mount
  // Filter out any temp rows (with temp- prefix) to avoid showing duplicates after optimistic insert
  // (quotes is declared below with correct filtering, so this block is removed)
  useEffect(() => {
    if ((!sales || sales.length === 0) && typeof loadSales === "function") {
      loadSales().catch(() => {});
    }
    if (
      (!customers || customers.length === 0) &&
      typeof loadCustomers === "function"
    ) {
      loadCustomers().catch(() => {});
    }
    if (
      (!inventory || inventory.length === 0) &&
      typeof loadInventory === "function"
    ) {
      loadInventory().catch(() => {});
    }
    if (typeof loadQuotations === "function") {
      loadQuotations().catch(() => {});
    }
  }, [
    loadSales,
    loadCustomers,
    loadInventory,
    loadQuotations,
    customers,
    inventory,
    sales,
  ]);

  async function confirmDelete() {
    const id = deleteTarget;
    if (!id) {
      setDeleteModalOpen(false);
      return;
    }
    try {
      // Find the correct unique identifier for deletion (prefer quotationNumber)
      let qNum = String(id);
      const toDelete = (quotations || []).find(
        (q) =>
          String(q.quotationNumber) === qNum
      );
      if (toDelete?.quotationNumber) {
        qNum = String(toDelete.quotationNumber);
      }
      await deleteQuotationByNumber(qNum);
      // Immediately update UI for instant feedback
      if (typeof setQuotations === "function") {
        setQuotations((prev) =>
          prev.filter(
            (q) =>
              String(q.quotationNumber) !== qNum
          )
        );
      }
      // Then reload from server to ensure backend sync
      if (typeof loadQuotations === "function") {
        await loadQuotations();
      }
      showNotification({
        title: "Deleted",
        message: "Quotation deleted",
        color: "orange",
      });
    } catch (err: unknown) {
      showNotification({
        title: "Delete Failed",
        message: String(err),
        color: "red",
      });
    } finally {
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      setDeleteTargetDisplay(null);
    }
  }

  // form state for creating quotation

  // Only show actual quotations, not sales invoices
  const quotes = (quotations || []) as QuotationRecordPayload[];

  // Generate next human-friendly quotation number like Quo-0001
  function generateNextQuotationNumber(
    existing: QuotationRecordPayload[]
  ): string {
    // Pick the smallest positive integer not already used so we can fill gaps
    try {
      const nums = (existing || [])
        .map(
          (q: QuotationRecordPayload | Partial<QuotationRecordPayload>) =>
            q.quotationNumber ?? (q as { docNo?: string }).docNo ?? null
        )
        .filter(Boolean)
        .map((s: string | null) => {
          const m = String(s).match(/(\d+)$/);
          return m ? Number(m[1]) : NaN;
        })
        .filter(
          (n: number) => !Number.isNaN(n) && Number.isFinite(n) && Number(n) > 0
        )
        .sort((a: number, b: number) => a - b);

      // If nothing exists, start at 1
      if (!nums.length) return `Quo-${String(1).padStart(4, "0")}`;

      // Create a set for O(1) lookups and find the smallest missing positive integer
      const used = new Set(nums);
      let candidate = 1;
      while (used.has(candidate)) candidate += 1;
      return `Quo-${String(candidate).padStart(4, "0")}`;
    } catch {
      return `Quo-0001`;
    }
  }

  type QuotationLike = QuotationRecordPayload & {
    quotationNumber?: string;
    docNo?: string;
    docDate?: string;
    id?: string;
    customer?: CustomerPayload[];
    products?: InventoryItemPayload[];
    items?: InventoryItemPayload[];
    total?: number;
    quotationDate?: string;
  };

  function buildInvoiceDataFromQuotation(q: QuotationLike): InvoiceData {
    return {
      title: "Quotation",
      companyName: "Ultra Water Technologies",
      addressLines: [],
      // support legacy docNo/docDate while preferring new fields
      invoiceNo: String(q.quotationNumber ?? q.docNo ?? q.id ?? ""),
      date: (q.quotationDate ?? q.docDate ?? "") as string,
      customer:
        // Extract customer name from customer array or string
        (Array.isArray(q.customer) && q.customer[0]?.name
          ? q.customer[0].name
          : typeof q.customer === "string"
          ? q.customer
          : (q as { customerName?: string }).customerName ?? "") as string,
      items: ((q.products ?? q.items) || []).map(
        (it: InventoryItemPayload, idx: number) => {
          const rate = Number(it.salesRate ?? it.costPrice ?? 0);
          const quantity = Number(it.quantity ?? 1);
          return {
            sr: idx + 1,
            // description/section - prefer itemName
            itemName: String(it.itemName ?? it.metadata?.name ?? ""),
            section: String(it.itemName ?? it.metadata?.sku ?? it.metadata?.name ?? ""),
            description: String(it.itemName ?? it.metadata?.name ?? ""),
            // include quantity so print template shows Qty
            qty: quantity,
            quantity: quantity,
            rate,
            salesRate: rate,
            amount: Math.floor(quantity * rate),
          } as any;
        }
      ),
      totals: {
        subtotal: Math.floor(Number(q.subTotal ?? q.total ?? 0)),
        total: Math.floor(Number(q.totalNetAmount ?? q.total ?? 0)),
        totalGrossAmount: Math.floor(Number(q.totalGrossAmount ?? 0)),
        totalDiscountAmount: Math.floor(Number(q.totalDiscount ?? 0)),
        totalNetAmount: Math.floor(Number(q.totalNetAmount ?? q.total ?? 0)),
      },
    };
  }

  // previous quick-create handler removed — creation now goes through SalesDocShell -> saveFromShell

  // Save from SalesDocShell: create or update depending on editingId
  async function saveFromShell(payload: SalesPayload) {
    console.log("=== saveFromShell called ===");
    console.log("Payload:", payload);
    console.log("Creating state:", creating);
    if (creating) return; // Prevent concurrent submissions
    // build customer object and validate
    console.log("Payload customer:", payload.customer);
    console.log("Available customers:", customers);

    let cust;
    if (typeof payload.customer === "object" && payload.customer !== null) {
      // payload.customer is already a customer object
      cust = payload.customer;

    } else {
      // payload.customer is an ID, find the full customer object
      cust = customers.find((c) => String(c._id) === String(payload.customer));

    }
    if (!cust) {
      showNotification({
        title: "Customer not found",
        message: "Please select a valid customer before saving the quotation.",
        color: "red",
      });
      setCreating(false);
      return;
    }

    const gross =
      (payload.products as InventoryItemPayload[] | undefined)?.reduce(
        (s, it) =>
          s +
          (Number((it as InventoryItemPayload & { rate?: number }).rate) || 0) *
            (Number(
              (it as InventoryItemPayload & { quantity?: number }).quantity
            ) || 0),
        0
      ) ?? 0;
    const apiPayload: QuotationRecordPayload = {
      products:
        payload.products?.map((it) => ({
          _id: it._id ?? "",
          itemName: it.itemName ?? "",
          discount:
            typeof (it as { discount?: unknown }).discount === "number"
              ? Math.floor(Number((it as { discount?: number }).discount))
              : 0,
          discountAmount:
            typeof (it as { discountAmount?: unknown }).discountAmount ===
            "number"
              ? Math.floor(
                  Number((it as { discountAmount?: number }).discountAmount)
                )
              : 0,
          salesRate: Math.floor(it.salesRate ?? 0),
          quantity: Math.floor(it.quantity ?? 0),
          amount:
            typeof (it as { amount?: unknown }).amount === "number"
              ? Math.floor(Number((it as { amount?: number }).amount))
              : 0,
          length:
            typeof (it as { length?: unknown }).length === "number"
              ? Math.floor(Number((it as { length?: number }).length))
              : 0,
          totalGrossAmount:
            typeof (it as { totalGrossAmount?: unknown }).totalGrossAmount ===
            "number"
              ? Math.floor(
                  Number((it as { totalGrossAmount?: number }).totalGrossAmount)
                )
              : 0,
          totalNetAmount:
            typeof (it as { totalNetAmount?: unknown }).totalNetAmount ===
            "number"
              ? Math.floor(
                  Number((it as { totalNetAmount?: number }).totalNetAmount)
                )
              : 0,
        })) ?? [],
      quotationDate: payload.docDate ?? new Date().toISOString(),
      customer: cust ? [cust] : [],
      remarks: payload.remarks ?? "",
      subTotal: Math.floor(payload.totals?.subTotal ?? gross),
      // Accept either spelling from various places: `totalGrossAmount` or `totalGrossAmmount`
      totalGrossAmount: Math.floor(
        (payload as SalesPayload & { totalGrossAmount?: number })
          .totalGrossAmount ??
          payload.totals?.total ??
          gross
      ),
      // totalDiscount may be provided under different keys in different forms
      totalDiscount:
        (
          payload as SalesPayload & {
            totalDiscount?: number;
            totalDiscountAmount?: number;
          }
        ).totalDiscount ??
        (
          payload as SalesPayload & {
            totalDiscount?: number;
            totalDiscountAmount?: number;
          }
        ).totalDiscountAmount ??
        0,
      length: payload.products?.length ?? 0,
    };

    setCreating(true);
    // Build a lightweight display object for optimistic insert.
    const tempId = `temp-${Date.now()}`;
    // determine quotationNumber: prefer provided docNo, otherwise generate
    const assignedQuotationNumber =
      (payload as Partial<SalesPayload> & { docNo?: string }).docNo ??
      generateNextQuotationNumber(quotes);

    const tempRow: QuotationRecordPayload = {
      quotationNumber: assignedQuotationNumber,
      products: apiPayload.products,
      quotationDate: apiPayload.quotationDate,
      // Set customer as array for type compatibility, and store full customer object or fallback
      customer: cust ? [cust] : [],

      remarks: apiPayload.remarks,
      subTotal: apiPayload.subTotal,
      totalGrossAmount: apiPayload.totalGrossAmount,
      totalDiscount: apiPayload.totalDiscount,
      length: apiPayload.length,
    };

    // Optimistically insert into UI so user sees the new quotation immediately.
    try {
      if (!editingId) {
        if (typeof setQuotations === "function") {
          setQuotations((prev) => [tempRow, ...prev]);
        }
      }

      // Close modal immediately to show the new row; keep creating flag until server responds
      setOpen(false);
      setInitialPayload(null);
      setEditingId(null);

      // ensure payload includes a quotationNumber for create
      if (!editingId) apiPayload.quotationNumber = assignedQuotationNumber;

      if (editingId) {
        // prefer updating by quotationNumber
        const qNum = String(editingId);
        const updated = await updateQuotationByNumber(qNum, apiPayload);
        // update quotations state
        if (typeof setQuotations === "function") {
          setQuotations((prev) =>
            prev.map((s) =>
              String((s as QuotationRecordPayload).quotationNumber) === qNum ||
              String(
                (s as QuotationRecordPayload & { docNo?: string }).docNo
              ) === qNum ||
              String((s as QuotationRecordPayload & { id?: string }).id) ===
                qNum ||
              String((s as QuotationRecordPayload & { _id?: string })._id) ===
                qNum
                ? (updated as QuotationRecordPayload)
                : s
            )
          );
        }
        showNotification({
          title: "Quotation Updated",
          message: "Quotation has been updated.",
          color: "blue",
        });
      } else {
        const created = await createQuotation(
          apiPayload as QuotationRecordPayload
        );
        if (created) {
          // Replace the temp row with server-provided record (match by quotationNumber)
          if (typeof setQuotations === "function") {
            setQuotations((prev) => [
              created as QuotationRecordPayload,
              ...prev.filter(
                (
                  r: QuotationRecordPayload & {
                    quotationNumber?: string;
                    docNo?: string;
                  }
                ) =>
                  String(
                    r.quotationNumber ?? (r as { docNo?: string }).docNo
                  ) !== String(created.quotationNumber)
              ),
            ]);
          }
        } else {
          // If server returned nothing, leave the optimistic row but notify
          showNotification({
            title: "Created (local)",
            message: "Quotation added locally (server did not return data).",
            color: "yellow",
          });
        }
        showNotification({
          title: "Quotation Created",
          message: "Quotation created.",
          color: "green",
        });
      }
    } catch (err: unknown) {
      // On error, remove optimistic row and notify
      if (!editingId) {
        if (typeof setQuotations === "function") {
          setQuotations((prev) =>
            prev.filter(
              (r) =>
                String((r as QuotationRecordPayload).quotationNumber) !== tempId
            )
          );
        }
      }
      showNotification({
        title: editingId ? "Update Failed" : "Create Failed",
        message: err instanceof Error ? err.message : String(err),
        color: "red",
      });
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <Box mb="md">
        <Group justify="space-between">
          <div>
            <Title order={2}>Quotations</Title>
            <Text color="dimmed">Prepare and manage sales quotations</Text>
          </div>
          <div>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={async () => {
                // Always reload inventory before opening modal
                if (typeof loadInventory === "function") {
                  await loadInventory();
                }
                const gen = generateNextQuotationNumber(quotes);
                setInitialPayload({
                  docNo: gen,
                  items: [
                    {
                      itemName: "Select product",
                      quantity: 1,
                      salesRate: 0,
                      discount: 0,
                      discountAmount: 0,
                      amount: 0,
                      totalGrossAmount: 0,
                      totalNetAmount: 0,
                    },
                  ],
                });
                setOpen(true);
              }}
            >
              New Quotation
            </Button>
          </div>
        </Group>
      </Box>

      <Card>
        <Card.Section>
          <Box p="md">
            <Text fw={700}>Recent Quotations</Text>
            <Text c="dimmed">Last {quotes.length} quotations</Text>
          </Box>
        </Card.Section>
        <Card.Section>
          <ScrollArea>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Number</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Customer</Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>Amount</Table.Th>
                  <Table.Th>Action</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {quotes.map((q: QuotationRecordPayload, idx: number) => {
                  // ...existing code...
                  const idVal =
                    q &&
                    (q.quotationNumber ??
                      (q as QuotationRecordPayload & { id?: string })?.id ??
                      (q as QuotationRecordPayload & { docNo?: string })
                        ?.docNo);
                  const dateVal = (q &&
                    (q.quotationDate ??
                      q.quotationDate ??
                      (q as QuotationRecordPayload & { docDate?: string })
                        ?.docDate)) as string | undefined;
                  const amountVal = Number(
                    q?.subTotal ??
                      q?.totalGrossAmount ??
                      q?.subTotal ??
                      q?.totalNetAmount ??
                      0
                  );
                  // Always resolve customer name from customer[0]?.name if available, fallback to customerId lookup for optimistic rows
                  let customerDisplay = "";
                  if (Array.isArray(q.customer) && q.customer.length > 0) {
                    customerDisplay = q.customer[0]?.name || "";
                  } else if (typeof q.customer === "string") {
                    customerDisplay = q.customer;
                  } else if (
                    q.customer &&
                    typeof q.customer === "object" &&
                    "name" in q.customer
                  ) {
                    customerDisplay =
                      (q.customer as { name?: string }).name || "";
                  }
                  // Fallback for optimistic rows: lookup customerId or customer[0]?.id in customers list
                  if (!customerDisplay && Array.isArray(customers)) {
                    let customerId = null;
                    if (q.customer) {
                      customerId = q.customer;
                    } else if (
                      Array.isArray(q.customer) &&
                      q.customer[0] &&
                      (q.customer[0] as { name?: string }).name
                    ) {
                      customerId = (q.customer[0] as { name?: string }).name;
                    }
                    if (customerId) {
                      const found = customers.find(
                        (c) => String(c._id) === String(customerId)
                      );
                      if (found && found.name) customerDisplay = found.name;
                    }
                  }

                  // Prefer showing a human-friendly quotation number if available;
                  // fall back to legacy docNo or the raw id when not present.
                  const displayNumber =
                    q.quotationNumber ??
                    (q as QuotationRecordPayload & { docNo?: string }).docNo ??
                    idVal ??
                    `quotation-${idx}`;
                  const rowKey = idVal ?? `quotation-${idx}`;
                  return (
                    <Table.Tr key={rowKey}>
                      <Table.Td>{String(displayNumber ?? "-")}</Table.Td>
                      <Table.Td>
                        {dateVal ? new Date(dateVal).toLocaleDateString() : ""}
                      </Table.Td>
                      <Table.Td>{customerDisplay ?? ""}</Table.Td>
                      <Table.Td style={{ textAlign: "right" }}>
                        {amountVal}
                      </Table.Td>

                      <Table.Td style={{ textAlign: "right" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 6,
                          }}
                        >
                          {/* Action menu: Print (design), Edit, Delete */}
                          <Menu>
                            <Menu.Target>
                              <ActionIcon variant="subtle">
                                <IconDotsVertical />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item
                                onClick={() => {
                                  const d = buildInvoiceDataFromQuotation(q);
                                  openPrintWindow(d);
                                }}
                              >
                                <IconPrinter
                                  size={14}
                                  style={{ marginRight: 8 }}
                                />
                                Print
                              </Menu.Item>
                              <Menu.Item
                                onClick={async () => {
                                  const d = buildInvoiceDataFromQuotation(q);
                                  // trigger client-side PDF generation and download
                                  try {
                                    await downloadInvoicePdf(
                                      d,
                                      `${String(
                                        displayNumber ?? "quotation"
                                      )}.pdf`
                                    );
                                  } catch {
                                    // fallback to opening print window if PDF generation fails
                                    const w = openPrintWindow(d) as
                                      | Window
                                      | undefined;
                                    setTimeout(() => w?.print?.(), 600);
                                  }
                                }}
                              >
                                <IconFile
                                  size={14}
                                  style={{ marginRight: 8 }}
                                />
                                Download PDF
                              </Menu.Item>
                              <Menu.Item
                                onClick={() => {
                                  // edit
                                  const existingNumber =
                                    q.quotationNumber ??
                                    (q as QuotationRecordPayload & { docNo?: string }).docNo ??
                                    "";

                                  // Resolve customer name for edit
                                  let customerName = "";
                                  if (Array.isArray(q.customer) && q.customer[0]) {
                                    customerName = q.customer[0].name ?? "";
                                  } else if (typeof q.customer === "string") {
                                    customerName = q.customer;
                                  } else if ((q as { customerName?: string }).customerName) {
                                    customerName = (q as { customerName?: string }).customerName ?? "";
                                  }

                                  // Prefill all fields for edit modal
                                  setInitialPayload({
                                    docNo: existingNumber,
                                    docDate: (q.quotationDate ?? "") as string,
                                    customer: customerName ? { name: customerName } : { name: "" },
                                    remarks: q.remarks ?? "",
                                    totals: {
                                      subTotal:
                                        q.subTotal ?? q.totalGrossAmount ?? 0,
                                      total:
                                        q.totalGrossAmount ?? q.subTotal ?? 0,
                                      amount:
                                        q.subTotal ?? q.totalGrossAmount ?? 0,
                                      totalGrossAmount: q.totalGrossAmount ?? 0,
                                      totalDiscountAmount: q.totalDiscount ?? 0,
                                      totalNetAmount: q.totalNetAmount ?? 0,
                                    },
                                    // Always provide 'items' for SalesDocShell prefill, mapped from q.products
                                    items: (q.products ?? []).map(
                                      (
                                        item: InventoryItemPayload
                                      ): LineItem => {
                                        const quantity = Number(
                                          item.quantity ?? 0
                                        );
                                        const salesRate = Number(
                                          item.salesRate ?? 0
                                        );
                                        const discount =
                                          typeof (
                                            item as { discount?: unknown }
                                          ).discount === "number"
                                            ? Number(
                                                (item as { discount?: number })
                                                  .discount
                                              )
                                            : 0;
                                        const discountAmount =
                                          typeof (
                                            item as { discountAmount?: unknown }
                                          ).discountAmount === "number"
                                            ? Number(
                                                (
                                                  item as {
                                                    discountAmount?: number;
                                                  }
                                                ).discountAmount
                                              )
                                            : 0;
                                        const length =
                                          typeof (item as { length?: unknown })
                                            .length === "number"
                                            ? Number(
                                                (item as { length?: number }).length
                                              )
                                            : 0;
                                        const gross = quantity * salesRate;
                                        return {
                                          _id: String(item._id ?? ""),
                                          itemName: item.itemName ?? "",
                                          discount,
                                          discountAmount,
                                          salesRate,
                                          quantity,
                                          amount: gross,
                                          length,
                                          totalGrossAmount: gross,
                                          totalNetAmount: gross - discountAmount,
                                        };
                                      }
                                    ),
                                  });
                                  setEditingId(existingNumber ?? "");
                                  setOpen(true);
                                }}
                              >
                                Edit
                              </Menu.Item>
                              <Menu.Item
                                color="red"
                                onClick={() => {
                                  const id = q.quotationNumber ?? (q as QuotationRecordPayload & { docNo?: string }).docNo ?? "";
                                  if (!id) return;
                                  setDeleteTarget(id);
                                  setDeleteTargetDisplay(String(displayNumber ?? id));
                                  setDeleteModalOpen(true);
                                }}
                              >
                                <IconTrash
                                  size={14}
                                  style={{ marginRight: 8 }}
                                />
                                Delete
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </div>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Card.Section>
      </Card>

      {/* Main create/edit modal */}
      <Modal
        opened={open}
        onClose={() => {
          setOpen(false);
          setInitialPayload(null);
          setEditingId(null);
        }}
        size="100%"
      >
        <Box p="md">
          <Text fw={700}>
            {editingId ? "Edit Quotation" : "Create Quotation"}
          </Text>
          {/* assignedNumber is now injected into the form's docNo; hide the separate display here */}
          <Text c="dimmed" mb="md">
            Quick create: enter customer and total. For full editor, replace
            with your SalesDocShell.
          </Text>
          <SalesDocShell
            mode="Quotation"
            customers={customers}
            products={(inventory || []).map((p) => {
              const item = p as InventoryItemPayload;
              return {
                ...item,
                _id: String(item._id ?? ""),
                itemName: item.itemName || "",
                discount: 0,
                discountAmount:
                  typeof item.discountAmount === "number"
                    ? item.discountAmount
                    : 0,
                salesRate:
                  typeof item.salesRate === "number" ? item.salesRate : 0,
                quantity: typeof item.quantity === "number" ? item.quantity : 0,
                amount: typeof item.amount === "number" ? item.amount : 0,
                length: typeof item.length === "number" ? item.length : 0,
                totalGrossAmount:
                  typeof item.totalGrossAmount === "number"
                    ? item.totalGrossAmount
                    : 0,
                totalNetAmount:
                  typeof item.totalNetAmount === "number"
                    ? item.totalNetAmount
                    : 0,
                metadata: item.metadata ?? {},
              };
            })}
            initial={(initialPayload ?? {}) as SalesPayload}
            submitting={creating}
            setSubmitting={setCreating}
            onSubmit={(payload: SalesPayload) => {

              // Don't close modal immediately - let saveFromShell handle it
              saveFromShell(payload);
            }}
            saveDisabled={creating}
          />
        </Box>
      </Modal>

      {/* Delete confirmation modal OUTSIDE main modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm delete"
        centered
        size="xs"
      >
        <Box>
          <Text>
            Are you sure you want to delete quotation{" "}
            <strong>{deleteTargetDisplay ?? String(deleteTarget ?? "")}</strong>
            ?
          </Text>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 12,
            }}
          >
            <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </Box>
      </Modal>
    </>
  );
}

export default Quotation;
