import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  TextInput,
  Menu,
  ActionIcon,
  Group,
  Text,
  Title,
} from "@mantine/core";
import openPrintWindow from "../../../components/print/printWindow";
import type { InvoiceData } from "../../../components/print/printTemplate";
import Table from "../../../lib/AppTable";
import { showNotification } from "@mantine/notifications";
import { formatCurrency, formatDate } from "../../../lib/format-utils";
import { deletePurchaseByNumber } from "../../../lib/api";
import type { PurchaseLineItem } from "./types";
import { PurchaseOrderForm as GeneratedPOForm } from "./PurchaseOrderForm.generated";
import { useDataContext } from "../../Context/DataContext";

import { IconEdit, IconPlus, IconPrinter, IconTrash } from "@tabler/icons-react";
import { Search } from "lucide-react";

type PO = {
  id: string;
  poNumber: string;
  poDate: string | Date;
  supplier?: import("../../../components/purchase/SupplierForm").Supplier;
  products: PurchaseLineItem[];
  subTotal: number;
  total: number;
  status: string;
  expectedDeliveryDate?: Date;
  remarks?: string;
  createdAt?: Date;
};

export default function PurchaseOrdersPage() {
  const {
    purchases,
    suppliers,

    loadPurchases,
    inventory,
    loadInventory,
  } = useDataContext();

  // Ensure products (inventory) are loaded on mount
  useEffect(() => {
    if (!inventory || inventory.length === 0) {
      loadInventory();
    }
  }, [inventory, loadInventory]);
  const [data, setData] = useState<PO[]>([]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [editPO, setEditPO] = useState<PO | null>(null);
  const [deletePO, setDeletePO] = useState<PO | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Helper to get next PO number in format PO-0001, PO-0002, ...
  function getNextPONumber(): string {
    const numbers = (purchases || [])
      .map((p) => {
        const match = String(p.poNumber || "").match(/PO-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const next = (numbers.length > 0 ? Math.max(...numbers) : 0) + 1;
    return `PO-${next.toString().padStart(3, "0")}`;
  }
  // Update data from purchases and suppliers
  useEffect(() => {
    setData(
      (purchases || []).map((p) => {
        let expectedDeliveryDate: Date | undefined = undefined;
        if (p.expectedDelivery) {
          if (p.expectedDelivery instanceof Date) {
            expectedDeliveryDate = p.expectedDelivery;
          } else if (typeof p.expectedDelivery === "string") {
            const d = new Date(p.expectedDelivery);
            expectedDeliveryDate = isNaN(d.getTime()) ? undefined : d;
          }
        }
        // Robust supplier resolution: try _id, then supplierId (if present), fallback to supplier object
        let supplier = undefined;
        if (
          p.supplier &&
          typeof p.supplier === "object" &&
          "_id" in p.supplier &&
          typeof (p.supplier as { _id?: unknown })._id === "string"
        ) {
          supplier = suppliers?.find(
            (s) => s._id === (p.supplier as { _id: string })._id
          );
        } else if (hasSupplierId(p)) {
          supplier = suppliers?.find((s) => s._id === p.supplierId);
        }
        function hasSupplierId(obj: unknown): obj is { supplierId: string } {
          return (
            typeof obj === "object" &&
            obj !== null &&
            "supplierId" in obj &&
            typeof (obj as { supplierId?: unknown }).supplierId === "string"
          );
        }
        if (
          !supplier &&
          p.supplier &&
          typeof p.supplier === "object" &&
          "name" in p.supplier
        ) {
          supplier = p.supplier;
        }
        let total = typeof p.total === "number" ? p.total : 0;
        if (!total && Array.isArray(p.products)) {
          total = p.products.reduce(
            (sum, it) => sum + (it.quantity || 0) * (it.rate || 0),
            0
          );
        }
        return {
          id: p.id || p.poNumber || crypto.randomUUID(),
          poNumber: p.poNumber || "(No PO#)",
          poDate: p.poDate,
          supplier,
          products: (p.products || []).map((item) => ({
            id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
            productId: "",
            productName:
              typeof item.productName === "string" ? item.productName : "",
            code: "",
            unit: "pcs",
            percent: 0,
            quantity: typeof item.quantity === "number" ? item.quantity : 0,
            rate: typeof item.rate === "number" ? item.rate : 0,
          
            grossAmount: 0,
            discountAmount: 0,
            netAmount: 0,
          
            length:
              typeof item.length === "string" || typeof item.length === "number"
                ? item.length
                : "",
            amount: typeof item.amount === "number" ? item.amount : 0,
          })),
          subTotal: typeof p.subTotal === "number" ? p.subTotal : total,
          total,
          status: p.status || "",
          expectedDeliveryDate,
          remarks: p.remarks,
          createdAt: p.createdAt,
        };
      })
    );
  }, [purchases, suppliers]);

  // On mount, load purchases if empty
  useEffect(() => {
    if (!purchases || purchases.length === 0) {
      if (loadPurchases) loadPurchases();
    }
  }, [purchases, loadPurchases]);

  async function handleCreate() {
    // const products = (payload.products || []) as PurchaseLineItem[]; // removed unused variable
    // You may want to call createPurchase({ ...payload, total: payload.total ?? (payload.subTotal ?? products.reduce((s, it) => s + (it.quantity || 0) * (it.rate || 0), 0)) }) here, if needed.
  }

  // (Removed duplicate JSX block before return statement)

  return (
    <div>
      <Modal
        opened={open}
        onClose={() => {
          setOpen(false);
          setEditPO(null);
        }}
        size="80%"
      >
        <GeneratedPOForm
          onSubmit={handleCreate}
          defaultPONumber={editPO ? editPO.poNumber : getNextPONumber()}
          {...(editPO
            ? {
                initialValues: {
                  ...editPO,
                  poDate:
                    typeof editPO.poDate === "string"
                      ? new Date(editPO.poDate)
                      : editPO.poDate instanceof Date
                      ? editPO.poDate
                      : undefined,
                },
              }
            : {})}
        />
      </Modal>
      <div style={{ marginTop: 16 }}>
       <Group justify="space-between">
       
          <Title order={2}>Purchase Orders</Title>
          <Group>
          <TextInput
            placeholder="Search PO number or supplier"
            value={q}
            onChange={(e) => setQ(e.currentTarget.value)}
            style={{ width: 300 }}
            leftSection={<Search size={16} />}
          />
          
          
          <Button onClick={() => setOpen(true)}
            leftSection={<IconPlus size={16} />}
          >
            Create PO
          </Button>
          </Group>
        </Group>
      </div>
      <Table withColumnBorders withRowBorders striped highlightOnHover withTableBorder mt="md">
        <Table.Thead style={{backgroundColor: "#F1F3F5"}}>
          <Table.Tr>
            <Table.Th>PO Number</Table.Th>
            <Table.Th>Date</Table.Th>
            <Table.Th>Supplier</Table.Th>
            <Table.Th style={{ textAlign: "left" }}>Total</Table.Th>
            <Table.Th style={{ textAlign: "left" }}>Action</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data
            .filter((o) => {
              const term = q.trim().toLowerCase();
              if (!term) return true;
              return (
                String(o.poNumber).toLowerCase().includes(term) ||
                String(o.supplier?.name || "")
                  .toLowerCase()
                  .includes(term)
              );
            })
            .map((o) => (
              <Table.Tr key={o.id} tabIndex={0} aria-label={`PO ${o.poNumber} for ${o.supplier?.name || ''}`}> 
                <Table.Td style={{ fontFamily: "monospace" }}>
                  {o.poNumber}
                </Table.Td>
                <Table.Td>{formatDate(o.poDate)}</Table.Td>
                <Table.Td>{o.supplier?.name || ""}</Table.Td>
                <Table.Td style={{ textAlign: "left" }}>
                  {formatCurrency(o.total)}
                </Table.Td>
                <Table.Td>
                  <Menu withArrow width={200} position="bottom-end">
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray" aria-label={`Actions for PO ${o.poNumber}`} tabIndex={0}>
                        <span style={{ fontWeight: 600, fontSize: 18 }}>⋮</span>
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        onClick={() => {
                          setEditPO(o);
                          setOpen(true);
                        }}
                        leftSection={<IconEdit size={16} />}
                      >
                        Edit
                      </Menu.Item>
                      <Menu.Item
                        onClick={() => {
                          const d: InvoiceData = {
                            title: "Purchase Order",
                            companyName: "Seven Star Traders",
                            addressLines: [
                              "Nasir Gardezi Road, Chowk Fawara, Bohar Gate Multan",
                            ],
                            invoiceNo: String(o.poNumber),
                            date: String(o.poDate),
                            customer: o.supplier?.name || "",
                            items: (o.products || []).map((it, idx) => ({
                              sr: idx + 1,
                              section: `${it.productName}`,
                              quantity: it.quantity,
                              rate: Number(it.rate ?? 0),
                              amount: Number(it.amount ?? (it.quantity || 0) * (it.rate || 0)),
                            })),
                            totals: {
                              subtotal: o.subTotal ?? o.total,
                              total: o.total,
                            },
                          };
                          openPrintWindow(d);
                        }}
                        leftSection={<IconPrinter size={16} />}
                      >
                        Print
                      </Menu.Item>
                      <Menu.Item color="red" onClick={() => setDeletePO(o)} leftSection={<IconTrash size={16} />}>
                        Delete
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
        </Table.Tbody>
      </Table>
      <Modal
        opened={!!deletePO}
        onClose={() => setDeletePO(null)}
        title="Confirm Delete"
        centered
        withCloseButton
      >
        <Text>
          Are you sure you want to delete Purchase Order{" "}
          <b>{deletePO?.poNumber}</b>?
        </Text>
        <Group justify="right" mt="md">
          <Button
            variant="default"
            onClick={() => setDeletePO(null)}
            disabled={deleteLoading}
            style={{ color: '#222', backgroundColor: '#f3f3f3', border: '1px solid #ccc' }}
            aria-label="Cancel Delete PO"
          >
            Cancel
          </Button>
          <Button
            color="red"
            loading={deleteLoading}
            onClick={async () => {
              if (!deletePO) return;
              setDeleteLoading(true);
              try {
                await deletePurchaseByNumber(deletePO.poNumber);
                setData((prev) =>
                  prev.filter((po) => po.poNumber !== deletePO.poNumber)
                );
                showNotification({
                  title: "Deleted",
                  message: `Purchase Order ${deletePO.poNumber} deleted`,
                  color: "red",
                });
                setDeletePO(null);
              } catch (err) {
                let msg = "Failed to delete purchase order.";
                if (
                  err &&
                  typeof err === "object" &&
                  err !== null &&
                  "message" in err &&
                  typeof (err as { message?: unknown }).message === "string"
                ) {
                  msg = (err as { message: string }).message;
                }
                showNotification({
                  title: "Error",
                  message: msg,
                  color: "red",
                });
              } finally {
                setDeleteLoading(false);
              }
            }}
          >
            Delete
          </Button>
        </Group>
      </Modal>
    </div>
  );
}
