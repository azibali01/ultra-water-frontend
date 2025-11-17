/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { showNotification } from "@mantine/notifications";
import {
  Card,
  TextInput,
  Textarea,
  Button,
  Text,
  Select,
  Title,
  Modal,
  Menu,
  ActionIcon,
} from "@mantine/core";
import openPrintWindow from "../../../components/print/printWindow";
import type { InvoiceData } from "../../../components/print/printTemplate";
import Table from "../../../lib/AppTable";
import {
  useDataContext,
  type PurchaseReturnRecord,
  type PurchaseRecord,
  type Customer,
} from "../../Context/DataContext";
import { LineItemsTableUniversal } from "./LineItemsTableUniversal";
import type { PurchaseLineItem } from "./types";
import { formatCurrency, formatDate } from "../../../lib/format-utils";
import {
  IconDots,
  IconEdit,
  IconPlus,
  IconPrinter,
  IconTrash,
} from "@tabler/icons-react";
import { Search } from "lucide-react";

export default function PurchaseReturnPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // State for editing
  const [editReturn, setEditReturn] = useState<PurchaseReturnRecord | null>(
    null
  );
  // Local state for fetched purchase returns
  const [fetchedReturns, setFetchedReturns] = useState<
    PurchaseReturnRecord[] | null
  >(null);
  // State for delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<null | {
    id: string;
    returnNumber: string;
  }>(null);
  // Fetch purchase return invoices from backend on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const api = await import("../../../lib/api");
        const returns = await api.getPurchaseReturns();
        setFetchedReturns(
          Array.isArray(returns)
            ? returns.map((r: any) => ({
                ...r,
                id:
                  typeof r.id === "string"
                    ? r.id
                    : String(r.id ?? r.returnNumber ?? `pret-${Date.now()}`),
                returnNumber:
                  typeof r.returnNumber === "string"
                    ? r.returnNumber
                    : String(r.returnNumber ?? r.id ?? ""),
                returnDate: r.returnDate ?? (r as any).date ?? "",
                subtotal: r.subtotal ?? r.total ?? 0,
                total: r.total ?? r.subtotal ?? 0,
                supplier: r.supplier ?? "",
                supplierId: r.supplierId ?? "",
                items: Array.isArray(r.items) ? r.items : [],
                reason: r.reason ?? "",
                linkedPoId: r.linkedPoId ?? "",
              }))
            : []
        );
        // Error/loading state for API calls
        // loading and error state used only for fetch, not needed elsewhere
      } catch (err) {
        setError("Failed to fetch purchase returns: " + String(err));
        showNotification({
          title: "Failed to fetch purchase returns",
          message: String(err),
          color: "red",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  const {
    purchases = [],
    customers = [],
    purchaseReturns = [],
    processPurchaseReturn,
    inventory,
    loadInventory,
  } = useDataContext();

  // Ensure products (inventory) are loaded on mount
  useEffect(() => {
    if (!inventory || inventory.length === 0) {
      loadInventory();
    }
  }, [inventory, loadInventory]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  // Use fetchedReturns if available, otherwise context
  const data = useMemo(
    () =>
      (fetchedReturns ?? purchaseReturns ?? []).map((r) => ({
        id: r.id,
        returnNumber: r.returnNumber,
        date: r.returnDate,
        supplier:
          customers.find((s) => String(s._id) === String(r.supplierId))?.name ||
          r.supplier ||
          r.supplierId ||
          "",
        total: r.total ?? r.subtotal ?? r.total ?? 0,
        reason: r.reason,
        items: r.items,
      })),
    [fetchedReturns, purchaseReturns, customers]
  );

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    if (!term) return data;
    return data.filter(
      (d) =>
        String(d.returnNumber).toLowerCase().includes(term) ||
        String(d.supplier).toLowerCase().includes(term) ||
        String(d.reason || "")
          .toLowerCase()
          .includes(term)
    );
  }, [q, data]);

  // Helper to update local fetchedReturns after a new return is created
  function handleReturnSave(ret: PurchaseReturnRecord) {
    setFetchedReturns((prev) => (prev ? [ret, ...prev] : [ret]));
    // Also call context handler for any side effects
    const res = processPurchaseReturn(ret);
    if (!res.applied) {
      showNotification({
        title: "Return Not Applied",
        message: res.message || "Return not applied",
        color: "orange",
      });
    } else {
      setOpen(false);
    }
  }

  // Edit logic
  function handleEditSave(updated: PurchaseReturnRecord) {
    setFetchedReturns((prev) =>
      prev ? prev.map((r) => (r.id === updated.id ? updated : r)) : [updated]
    );
    // Also call context handler for any side effects
    processPurchaseReturn(updated);
    setEditReturn(null);
    showNotification({
      title: "Updated",
      message: "Purchase return updated",
      color: "green",
    });
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div>
          <Title order={2}>Purchase Returns</Title>
          <Text c="dimmed">Record product returns to suppliers</Text>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <TextInput
            placeholder="Search returns..."
            value={q}
            onChange={(e) => setQ(e.currentTarget.value)}
            style={{ width: 300 }}
            leftSection={<Search size={16} />}
          />
          <Button
            onClick={() => setOpen(true)}
            leftSection={<IconPlus size={16} />}
          >
            New Return
          </Button>
        </div>
      </div>
      <Card>
        <div style={{ padding: 12 }}>
          <Title order={4}>Recent Returns</Title>
          <Text color="dimmed">Last {data.length} purchase returns</Text>
          {loading && (
            <Text
              color="blue"
              role="status"
              aria-live="polite"
              style={{ marginTop: 8 }}
            >
              Loading purchase returns...
            </Text>
          )}
          {error && (
            <Text
              color="red"
              role="alert"
              aria-live="assertive"
              style={{ marginTop: 8 }}
            >
              {error}
            </Text>
          )}
          <div style={{ marginTop: 12, overflowX: "auto" }}>
            <Table
              withColumnBorders
              withRowBorders
              withTableBorder
              highlightOnHover
              aria-label="Purchase Returns Table"
            >
              <thead style={{ backgroundColor: "#F1F3F5" }}>
                <tr>
                  <th scope="col">Return#</th>
                  <th scope="col">Date</th>
                  <th scope="col">Supplier</th>
                  <th scope="col" style={{ textAlign: "left" }}>
                    Amount
                  </th>
                  <th scope="col" style={{ textAlign: "left" }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && !loading && !error && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ textAlign: "center", color: "#888" }}
                    >
                      No purchase returns found.
                    </td>
                  </tr>
                )}
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    tabIndex={0}
                    aria-label={`Return ${r.returnNumber} for ${r.supplier}`}
                  >
                    <td style={{ fontFamily: "monospace" }}>
                      {r.returnNumber}
                    </td>
                    <td>{formatDate(r.date)}</td>
                    <td>{r.supplier}</td>
                    <td style={{ textAlign: "left" }}>
                      {formatCurrency(r.total)}
                    </td>
                    <td style={{ textAlign: "left" }}>
                      <Menu width={200} position="bottom-end" withArrow>
                        <Menu.Target>
                          <ActionIcon
                            aria-label={`Actions for return ${r.returnNumber}`}
                            tabIndex={0}
                          >
                            <IconDots />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            onClick={() => {
                              const full = (
                                fetchedReturns ??
                                purchaseReturns ??
                                []
                              ).find((x) => x.id === r.id) as
                                | PurchaseReturnRecord
                                | undefined;
                              if (full) setEditReturn(full);
                            }}
                            aria-label={`Edit return ${r.returnNumber}`}
                            leftSection={<IconEdit size={16} />}
                          >
                            Edit
                          </Menu.Item>
                          <Menu.Item
                            onClick={() => {
                              const full = (
                                fetchedReturns ??
                                purchaseReturns ??
                                []
                              ).find((x) => x.id === r.id) as
                                | PurchaseReturnRecord
                                | undefined;
                              const items = (full?.items || [])
                                .filter(
                                  (it) =>
                                    typeof it.itemName === "string" &&
                                    it.itemName.trim() !== ""
                                )
                                .map((it, idx) => ({
                                  sr: idx + 1,
                                  itemName: String(it.itemName),
                                  section: String(it.itemName),
                                  description: String(it.itemName),
                                  qty: it.quantity,
                                  quantity: it.quantity,
                                  rate: it.salesRate || 0,
                                  salesRate: it.salesRate || 0,
                                  amount:
                                    (it.quantity || 0) * (it.salesRate || 0),
                                }));
                              const payload: InvoiceData = {
                                title: "Purchase Return",
                                companyName: "Ultra Water Technologies",
                                addressLines: [],
                                invoiceNo: r.returnNumber,
                                date: String(r.date),
                                customer: r.supplier,
                                items,
                                totals: {
                                  subtotal: full?.subtotal ?? r.total,
                                  total: full?.total ?? r.total,
                                  totalGrossAmount: full?.totalGrossAmount ?? full?.subtotal ?? r.total,
                                  totalDiscountAmount: full?.totalDiscount ?? 0,
                                  totalNetAmount: full?.totalNetAmount ?? full?.total ?? r.total,
                                },
                              };
                              openPrintWindow(payload);
                            }}
                            aria-label={`Print return ${r.returnNumber}`}
                            leftSection={<IconPrinter size={16} />}
                          >
                            Print
                          </Menu.Item>
                          <Menu.Item
                            color="red"
                            onClick={() => {
                              setDeleteTarget({
                                id: r.id as string,
                                returnNumber: r.returnNumber,
                              });
                            }}
                            aria-label={`Delete return ${r.returnNumber}`}
                            leftSection={<IconTrash size={16} />}
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      </Card>

      {/* ===== Shared Delete Confirmation Modal (moved outside map) ===== */}
      <Modal
        opened={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        size="sm"
        title="Confirm Delete"
        overlayProps={{ opacity: 0, blur: 0 }}
      >
        <div style={{ padding: 12 }}>
          <Text c="red" fw={600}>
            Are you sure you want to delete this purchase return?
          </Text>
          <Text mt={8}>
            Return #: <b>{deleteTarget?.returnNumber}</b>
          </Text>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 16,
            }}
          >
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={async () => {
                if (!deleteTarget) return;
                try {
                  const api = await import("../../../lib/api");
                  await api.deletePurchaseReturn(deleteTarget.returnNumber);

                  setFetchedReturns((prev) =>
                    prev
                      ? prev.filter(
                          (x) =>
                            String(x.id) !== String(deleteTarget.id) &&
                            String(x.returnNumber) !==
                              String(deleteTarget.returnNumber)
                        )
                      : prev
                  );

                  showNotification({
                    title: "Deleted",
                    message: "Purchase return deleted successfully",
                    color: "green",
                  });
                } catch (err) {
                  showNotification({
                    title: "Delete Failed",
                    message: String(err),
                    color: "red",
                  });
                } finally {
                  setDeleteTarget(null);
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      <Modal opened={open} onClose={() => setOpen(false)} size="80%">
        <ReturnForm
          purchases={purchases}
          suppliers={customers}
          onClose={() => setOpen(false)}
          onSave={handleReturnSave}
          setOpen={setOpen}
        />
      </Modal>
      {/* Edit Modal */}
      <Modal
        opened={!!editReturn}
        onClose={() => setEditReturn(null)}
        size="80%"
      >
        {editReturn && (
          <ReturnForm
            purchases={purchases}
            suppliers={customers}
            onClose={() => setEditReturn(null)}
            onSave={handleEditSave}
            initialValues={editReturn}
          />
        )}
      </Modal>
    </div>
  );
}

// (Old function signature removed; now using interface and new function signature below)
interface ReturnFormProps {
  purchases: PurchaseRecord[];
  suppliers: Customer[];
  onClose: () => void;
  onSave: (r: PurchaseReturnRecord) => void;
  initialValues?: Partial<PurchaseReturnRecord>;
}

function ReturnForm({
  purchases,
  suppliers,
  onClose,
  onSave,
  initialValues,
  setOpen,
}: ReturnFormProps & { setOpen?: (open: boolean) => void }) {
  const {
    inventory = [],

    purchaseReturns = [],
  } = useDataContext();

  // Local loading and error state for async actions in ReturnForm
  // Local loading and error state for async actions in ReturnForm (not used for rendering)

  // Helper to get next return number in PRET-0001, PRET-0002... format
  function getNextReturnNumber(): string {
    // Gather all return numbers from context and fetchedReturns
    const allReturns: Array<{ returnNumber?: string }> = [
      ...(purchaseReturns || []),
    ];
    // Extract numbers in PRET-XXXX format
    const nums = allReturns
      .map((r) => {
        const match = String(r.returnNumber || "").match(/PRET-(\d{4})/i);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((n): n is number => n !== null);
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    const next = max + 1;
    return `PRET-${next.toString().padStart(4, "0")}`;
  }

  const [returnNumber, setReturnNumber] = useState(
    initialValues?.returnNumber || getNextReturnNumber()
  );
  const [returnDate, setReturnDate] = useState<string>(
    initialValues?.returnDate || new Date().toISOString().slice(0, 10)
  );
  // Memoized options for Selects, always valid and unique
  const poOptions = useMemo(() => {
    const seen = new Set<string>();
    return (purchases || [])
      .filter((p) => typeof p.poNumber === "string" && p.poNumber.trim() !== "")
      .map((p) => {
        const poNum = p.poNumber;
        if (seen.has(poNum)) return undefined;
        seen.add(poNum);
        // Try to get supplier name (if p.supplier is an object, use .name, else use as string)
        let supplierName = "";
        if (
          typeof p.supplier === "object" &&
          p.supplier &&
          "name" in p.supplier
        ) {
          supplierName = p.supplier.name;
        } else if (typeof p.supplier === "string") {
          supplierName = p.supplier;
        }
        return {
          value: poNum,
          label: `${poNum} — ${supplierName}`,
        };
      })
      .filter((x): x is { value: string; label: string } => !!x);
  }, [purchases]);

  const supplierOptions = useMemo(() => {
    const seen = new Set<string>();
    return (suppliers || [])
      .filter(
        (s) =>
          (typeof s._id === "string" || typeof s._id === "number") &&
          s._id !== undefined &&
          s._id !== null &&
          String(s._id).trim() !== ""
      )
      .map((s) => {
        const idStr = String(s._id);
        if (seen.has(idStr)) return undefined;
        seen.add(idStr);
        return {
          value: idStr,
          label: `${s.name ?? ""} — ${s.city ?? ""}`,
        };
      })
      .filter((x): x is { value: string; label: string } => !!x);
  }, [suppliers]);

  const [linkedPoId, setLinkedPoId] = useState<string>(
    initialValues?.linkedPoId ? String(initialValues.linkedPoId) : ""
  );
  const [supplierId, setSupplierId] = useState<string>(
    initialValues?.supplierId ? String(initialValues.supplierId) : ""
  );

  // Keep Select value in sync with available options
  useEffect(() => {
    if (poOptions.length > 0) {
      if (!poOptions.some((opt) => opt.value === linkedPoId)) {
        setLinkedPoId(poOptions[0]!.value);
      }
    } else if (linkedPoId !== "") {
      setLinkedPoId("");
    }
  }, [poOptions, linkedPoId]);

  useEffect(() => {
    if (supplierOptions.length > 0) {
      if (!supplierOptions.some((opt) => opt.value === supplierId)) {
        setSupplierId(supplierOptions[0]!.value);
      }
    } else if (supplierId !== "") {
      setSupplierId("");
    }
  }, [supplierOptions, supplierId]);
  const [reason, setReason] = useState<string>(initialValues?.reason || "");
  const [items, setItems] = useState<PurchaseLineItem[]>(() => {
    if (initialValues?.items && initialValues.items.length > 0) {
      // Map backend items to PurchaseLineItem shape if needed
      return initialValues.items.map(
        (it: {
          sku?: string;
          productId?: string;
          productName?: string;
          quantity?: number;
          price?: number;
          rate?: number;
          length?: string | number;
        }) => ({
          id: `${Math.random()}`,
          productId: it.productId ?? "",
          productName: it.sku || it.productName || "",
          quantity: it.quantity || 0,
          rate: it.price ?? it.rate ?? 0,
          length: typeof it.length === "number" ? String(it.length) : it.length,
          grossAmount: 0,
          percent: 0,
          discountAmount: 0,
          netAmount: 0,
          amount: (it.quantity || 0) * (it.price ?? it.rate ?? 0),
        })
      );
    }
    // fallback to PO
    const po = purchases[0];
    if (!po) return [];
    const poLineItems: PurchaseLineItem[] = (po.products || [])
      .filter((it) => !!it.productName)
      .map((it: any) => ({
        id: `${Math.random()}`,
        productId: it.productId ?? "",
        productName: it.productName,
        quantity: 1,
        rate: 0,
        length: 0,
        grossAmount: 0,
        percent: 0,
        discountAmount: 0,
        netAmount: 0,
        amount: 0,
      }));
    return poLineItems;
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPayload, setConfirmPayload] =
    useState<PurchaseReturnRecord | null>(null);

  useEffect(() => {
    if (!linkedPoId) return; // If not selected, do nothing (keep manual entry)
    const po = purchases.find((p) => p.poNumber === linkedPoId);
    if (!po) return;
    // Set supplierId if possible
    if (
      typeof po.supplier === "object" &&
      po.supplier &&
      "_id" in po.supplier
    ) {
      setSupplierId(String(po.supplier._id));
    } else if (typeof po.supplier === "string") {
      setSupplierId(po.supplier);
    }
    const poLineItems: PurchaseLineItem[] = (po.products || [])
      .filter((it) => !!it.productName)
      .map((it: any) => ({
        id: `${Math.random()}`,
        productId: it.productId ?? "",
        productName: it.productName,
        quantity: 0,
        rate: it.rate ?? 0,
        length: it.length,
        grossAmount: 0,
        percent: 0,
        discountAmount: 0,
        netAmount: 0,
        amount: 0,
      }));
    setItems(poLineItems);
  }, [linkedPoId, purchases]);

  const totals = useMemo(() => {
    const sub = Math.floor(
      items.reduce((s, i) => s + Math.floor(i.amount || 0), 0)
    );
    // If you want to support discounts, add a discount property to PurchaseLineItem and use it here
    const total = sub; // No discountAmount property exists
    return { sub, total: Math.floor(total) };
  }, [items]);

  function handleSave() {
    // For edit, keep the same id/returnNumber; for new, generate
    const isEdit = !!initialValues?.id;
    const stringReturnNumber = isEdit
      ? initialValues.returnNumber
      : `pret-${Date.now()}`;
    const record: PurchaseReturnRecord = {
      id: isEdit
        ? String(
            initialValues.id !== undefined && initialValues.id !== null
              ? initialValues.id
              : stringReturnNumber
          ) || stringReturnNumber
        : (typeof crypto !== "undefined" &&
          typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : stringReturnNumber) || stringReturnNumber,
      returnNumber: stringReturnNumber!,
      returnDate,
      supplier:
        (suppliers || []).find((s) => String(s._id) === String(supplierId))
          ?.name ||
        initialValues?.supplier ||
        "",
      supplierId: supplierId || initialValues?.supplierId || "",
      linkedPoId: linkedPoId || initialValues?.linkedPoId || "",
      items: (items || [])
        .filter((i) => (i.quantity || 0) > 0)
        .map((it) => ({
          itemName: it.productName,
          quantity: it.quantity,
          salesRate: it.rate,
          discount: 0,
        })),
      subtotal: totals.sub,
      total: totals.total,
      reason,
    };
    setConfirmPayload(record);
    setConfirmOpen(true);
  }

  function handlePrintDraft() {
    const payload: InvoiceData = {
      title: "Purchase Return (Draft)",
      companyName: "Ultra Water Technologies",
      addressLines: [],
      invoiceNo: returnNumber,
      date: returnDate,
      customer:
        suppliers.find((s) => String(s._id) === String(supplierId))?.name ?? "",
      items: (items || []).map((it, idx) => ({
        sr: idx + 1,
        itemName: String(it.productName),
        section: String(it.productName),
        description: String(it.productName),
        qty: it.quantity,
        quantity: it.quantity,
        rate: it.rate,
        salesRate: it.rate,
        amount: it.amount || (it.quantity || 0) * (it.rate || 0),
      })),
      totals: {
        subtotal: totals.sub,
        total: totals.total,
        totalGrossAmount: totals.totalGrossAmount ?? totals.sub,
        totalDiscountAmount: totals.totalDiscountAmount ?? 0,
        totalNetAmount: totals.totalNetAmount ?? totals.total,
      },
    };
    openPrintWindow(payload);
  }

  function handleConfirmSave() {
    if (!confirmPayload) return;
    (async () => {
      try {
        const api = await import("../../../lib/api");
        // Map to PurchaseReturnRecordPayload
        const payload = {
          id: confirmPayload.id,
          returnNumber: confirmPayload.returnNumber,
          returnDate: confirmPayload.returnDate,
          supplier: confirmPayload.supplier,
          supplierId: confirmPayload.supplierId,
          linkedPoId: confirmPayload.linkedPoId,
          items: (confirmPayload.items || []).map((it: any) => ({
            itemName: it.productName ?? it.itemName ?? "",
            quantity: it.quantity ?? 0,
            salesRate: it.rate ?? it.salesRate ?? 0,
          })),
          subtotal: confirmPayload.subtotal,
          total: confirmPayload.total,
          reason: confirmPayload.reason,
        };
        await api.createPurchaseReturn(payload);
      } catch (err) {
        showNotification({
          title: "Purchase Return Persist Failed",
          message: String(err),
          color: "red",
        });
      } finally {
        onSave(confirmPayload);
        setConfirmOpen(false);
        if (setOpen) setOpen(false);
      }
    })();
  }

  return (
    <div>
      <Title order={3}>New Purchase Return</Title>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginTop: 12,
        }}
      >
        <div>
          <label htmlFor="returnNumber">Return Number</label>
          <TextInput
            id="returnNumber"
            value={returnNumber}
            onChange={(e) => setReturnNumber(e.currentTarget.value)}
            aria-label="Return Number"
          />
        </div>
        <div>
          <label htmlFor="returnDate">Return Date</label>
          <TextInput
            id="returnDate"
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.currentTarget.value)}
            aria-label="Return Date"
          />
        </div>
        <div>
          <label htmlFor="linkedPoId">Link Purchase Order (optional)</label>
          {poOptions.length > 0 ? (
            <Select
              id="linkedPoId"
              data={poOptions}
              value={linkedPoId}
              onChange={(v) => typeof v === "string" && setLinkedPoId(v)}
              clearable
              placeholder="(Optional) Link to PO"
              aria-label="Link Purchase Order"
            />
          ) : (
            <Text color="dimmed" size="sm">
              No purchase orders available
            </Text>
          )}
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginTop: 12,
        }}
      >
        <div>
          <label htmlFor="supplierId">Supplier</label>
          {supplierOptions.length > 0 ? (
            <Select
              id="supplierId"
              data={supplierOptions}
              value={supplierId}
              onChange={(v) => typeof v === "string" && setSupplierId(v)}
              allowDeselect={false}
              clearable={false}
              aria-label="Supplier"
            />
          ) : (
            <Text color="dimmed" size="sm">
              No suppliers available
            </Text>
          )}
        </div>
        <div>
          <label htmlFor="reason">Reason</label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
            minRows={3}
            aria-label="Return Reason"
          />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <LineItemsTableUniversal
          items={items}
          setItems={setItems}
          inventory={inventory as any}
          addRowLabel="Add Return Item"
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 12,
        }}
      >
        <div style={{ color: "#666" }}>
          Subtotal: {formatCurrency(totals.sub)}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            {formatCurrency(totals.total)}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="default" onClick={handlePrintDraft}>
              Print Draft
            </Button>
            <Button onClick={handleSave}>Save Return</Button>
          </div>
        </div>
      </div>
      <Modal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        size="sm"
      >
        <div style={{ padding: 12 }}>
          <Title order={4}>Confirm Return</Title>
          <Text color="dimmed">
            This will apply the return to inventory and create a supplier
            credit. Proceed?
          </Text>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 12,
            }}
          >
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSave}>Confirm</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
